import { getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { validDate, validDeviceId, validDomain, validMs } from "./syncValidation";

const site = v.object({
  domain: v.string(),
  activeMs: v.number(),
  distractionMs: v.number(),
  videoMs: v.number(),
});

const settings = v.object({
  dailyDistractionGoalMinutes: v.number(),
  distractionDomains: v.array(v.string()),
  siteLimits: v.array(v.object({ domain: v.string(), minutes: v.number() })),
  workHours: v.object({ enabled: v.boolean(), start: v.string(), end: v.string() }),
  blockShorts: v.boolean(),
  checkLongForm: v.boolean(),
});

async function requireUser(ctx: Parameters<typeof getAuthUserId>[0]) {
  const userId = await getAuthUserId(ctx);
  if (!userId) throw new ConvexError("Sign in to sync");
  return userId;
}

/** One full snapshot per device, source, and local calendar day. Older retries cannot overwrite newer data. */
export const putDay = mutation({
  args: {
    deviceId: v.string(),
    source: v.union(v.literal("chrome"), v.literal("windows")),
    date: v.string(),
    activeMs: v.number(),
    distractionMs: v.number(),
    videoMs: v.number(),
    sites: v.array(site),
    observedAt: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    const now = Date.now();
    if (!validDeviceId(args.deviceId) || !validDate(args.date)) throw new ConvexError("Invalid device or date");
    if (![args.activeMs, args.distractionMs, args.videoMs].every(validMs)) throw new ConvexError("Invalid totals");
    if (args.sites.length > 200 || args.sites.some(s => !validDomain(s.domain) || ![s.activeMs, s.distractionMs, s.videoMs].every(validMs))) throw new ConvexError("Invalid sites");
    if (new Set(args.sites.map(s => s.domain)).size !== args.sites.length) throw new ConvexError("Duplicate sites");
    if (!Number.isSafeInteger(args.observedAt) || args.observedAt > now + 300_000 || args.observedAt < now - 90 * 86_400_000) throw new ConvexError("Invalid snapshot time");
    if (args.source === "windows" && args.sites.length) throw new ConvexError("Windows snapshots cannot include websites");
    const existing = await ctx.db.query("dailySnapshots")
      .withIndex("by_user_device_source_date", q => q.eq("userId", userId).eq("deviceId", args.deviceId).eq("source", args.source).eq("date", args.date))
      .unique();
    if (existing && existing.observedAt >= args.observedAt) return { accepted: false, receivedAt: existing.receivedAt };
    const record = { ...args, userId, receivedAt: now };
    if (existing) await ctx.db.patch(existing._id, record);
    else await ctx.db.insert("dailySnapshots", record);
    return { accepted: true, receivedAt: now };
  },
});

export const getDays = query({
  args: { from: v.string(), through: v.string() },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    if (!validDate(args.from) || !validDate(args.through) || args.from > args.through) throw new ConvexError("Invalid date range");
    const days = Math.round((Date.parse(`${args.through}T00:00:00Z`) - Date.parse(`${args.from}T00:00:00Z`)) / 86_400_000);
    if (days > 30) throw new ConvexError("Date range is limited to 31 days");
    const rows = await ctx.db.query("dailySnapshots")
      .withIndex("by_user_date", q => q.eq("userId", userId).gte("date", args.from).lte("date", args.through))
      .take(501);
    if (rows.length > 500) throw new ConvexError("Too many device snapshots; select a smaller date range");
    return rows.map(({ _id, _creationTime, userId: _userId, ...row }) => row);
  },
});

export const getSettings = query({
  args: {},
  handler: async ctx => {
    const userId = await requireUser(ctx);
    const row = await ctx.db.query("accountSettings").withIndex("by_user", q => q.eq("userId", userId)).unique();
    if (!row) return null;
    const { _id, _creationTime, userId: _userId, ...publicSettings } = row;
    return publicSettings;
  },
});

/** Requires the revision the client last read, preventing silent cross-device setting loss. */
export const putSettings = mutation({
  args: { expectedRevision: v.number(), value: settings },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    const s = args.value;
    if (!Number.isSafeInteger(args.expectedRevision) || args.expectedRevision < 0) throw new ConvexError("Invalid revision");
    if (!Number.isSafeInteger(s.dailyDistractionGoalMinutes) || s.dailyDistractionGoalMinutes < 1 || s.dailyDistractionGoalMinutes > 1440) throw new ConvexError("Invalid goal");
    if (s.distractionDomains.length > 200 || s.distractionDomains.some(d => !validDomain(d)) || new Set(s.distractionDomains).size !== s.distractionDomains.length) throw new ConvexError("Invalid distraction domains");
    if (s.siteLimits.length > 200 || s.siteLimits.some(x => !validDomain(x.domain) || !Number.isSafeInteger(x.minutes) || x.minutes < 1 || x.minutes > 1440)) throw new ConvexError("Invalid site limits");
    if (new Set(s.siteLimits.map(x => x.domain)).size !== s.siteLimits.length) throw new ConvexError("Duplicate site limits");
    if (![s.workHours.start, s.workHours.end].every(x => /^([01]\d|2[0-3]):[0-5]\d$/.test(x))) throw new ConvexError("Invalid work hours");
    const row = await ctx.db.query("accountSettings").withIndex("by_user", q => q.eq("userId", userId)).unique();
    const currentRevision = row?.revision ?? 0;
    if (args.expectedRevision !== currentRevision) throw new ConvexError("Settings changed on another device; refresh before saving");
    const revision = currentRevision + 1;
    const record = { ...s, userId, revision, updatedAt: Date.now() };
    if (row) await ctx.db.patch(row._id, record);
    else await ctx.db.insert("accountSettings", record);
    return { revision, updatedAt: record.updatedAt };
  },
});

const windowsSettings = v.object({
  goalMinutes: v.number(), distractingApps: v.array(v.string()),
  appLimits: v.array(v.object({ app: v.string(), minutes: v.number() })),
  workEnabled: v.boolean(), workStartMinutes: v.number(), workEndMinutes: v.number(),
});
const appPattern = /^[a-z0-9][a-z0-9._-]{0,79}$/;
const protectedApps = new Set(["amythest", "explorer", "taskmgr", "cmd", "powershell", "pwsh"]);
const validApp = (name: string) => appPattern.test(name) && !protectedApps.has(name);

export const getWindowsSettings = query({
  args: {},
  handler: async ctx => {
    const userId = await requireUser(ctx);
    const row = await ctx.db.query("windowsSettings").withIndex("by_user", q => q.eq("userId", userId)).unique();
    if (!row) return null;
    const { _id, _creationTime, userId: _userId, ...value } = row;
    return value;
  },
});

export const putWindowsSettings = mutation({
  args: { expectedRevision: v.number(), value: windowsSettings },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    const s = args.value;
    if (!Number.isSafeInteger(args.expectedRevision) || args.expectedRevision < 0) throw new ConvexError("Invalid revision");
    if (!Number.isSafeInteger(s.goalMinutes) || s.goalMinutes < 1 || s.goalMinutes > 1440) throw new ConvexError("Invalid goal");
    if (s.distractingApps.length > 200 || s.distractingApps.some(a => !validApp(a)) || new Set(s.distractingApps).size !== s.distractingApps.length) throw new ConvexError("Invalid distracting apps");
    if (s.appLimits.length > 200 || s.appLimits.some(x => !validApp(x.app) || !Number.isSafeInteger(x.minutes) || x.minutes < 1 || x.minutes > 1440) || new Set(s.appLimits.map(x => x.app)).size !== s.appLimits.length) throw new ConvexError("Invalid app limits");
    if (![s.workStartMinutes, s.workEndMinutes].every(x => Number.isSafeInteger(x) && x >= 0 && x < 1440)) throw new ConvexError("Invalid work hours");
    const row = await ctx.db.query("windowsSettings").withIndex("by_user", q => q.eq("userId", userId)).unique();
    if (args.expectedRevision !== (row?.revision ?? 0)) throw new ConvexError("Windows settings changed on another device; refresh before saving");
    const record = { ...s, userId, revision: (row?.revision ?? 0) + 1, updatedAt: Date.now() };
    if (row) await ctx.db.patch(row._id, record);
    else await ctx.db.insert("windowsSettings", record);
    return { revision: record.revision, updatedAt: record.updatedAt };
  },
});

export const setSiteLimit = mutation({
  args: { expectedRevision: v.number(), domain: v.string(), minutes: v.number() },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    if (!validDomain(args.domain) || !Number.isSafeInteger(args.minutes) || args.minutes < 0 || args.minutes > 1440) throw new ConvexError("Invalid website limit");
    const row = await ctx.db.query("accountSettings").withIndex("by_user", q => q.eq("userId", userId)).unique();
    if (!row || row.revision !== args.expectedRevision) throw new ConvexError("Website limits changed; refresh before saving");
    const siteLimits = row.siteLimits.filter(x => x.domain !== args.domain);
    if (args.minutes > 0) siteLimits.push({ domain: args.domain, minutes: args.minutes });
    if (siteLimits.length > 200) throw new ConvexError("Too many website limits");
    await ctx.db.patch(row._id, { siteLimits, revision: row.revision + 1, updatedAt: Date.now() });
    return { revision: row.revision + 1 };
  },
});

export const setWindowsAppLimit = mutation({
  args: { expectedRevision: v.number(), app: v.string(), minutes: v.number() },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    if (!validApp(args.app) || !Number.isSafeInteger(args.minutes) || args.minutes < 0 || args.minutes > 1440) throw new ConvexError("Invalid app limit");
    const row = await ctx.db.query("windowsSettings").withIndex("by_user", q => q.eq("userId", userId)).unique();
    if (!row || row.revision !== args.expectedRevision) throw new ConvexError("Windows limits changed; refresh before saving");
    const appLimits = row.appLimits.filter(x => x.app !== args.app);
    if (args.minutes > 0) appLimits.push({ app: args.app, minutes: args.minutes });
    if (appLimits.length > 200) throw new ConvexError("Too many app limits");
    await ctx.db.patch(row._id, { appLimits, revision: row.revision + 1, updatedAt: Date.now() });
    return { revision: row.revision + 1 };
  },
});

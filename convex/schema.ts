import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const site = v.object({
  domain: v.string(),
  activeMs: v.number(),
  distractionMs: v.number(),
  videoMs: v.number(),
});

export default defineSchema({
  ...authTables,
  dailySnapshots: defineTable({
    userId: v.id("users"),
    deviceId: v.string(),
    source: v.union(v.literal("chrome"), v.literal("windows")),
    date: v.string(),
    activeMs: v.number(),
    distractionMs: v.number(),
    videoMs: v.number(),
    sites: v.array(site),
    observedAt: v.number(),
    receivedAt: v.number(),
  })
    .index("by_user_date", ["userId", "date"])
    .index("by_user_device_source_date", ["userId", "deviceId", "source", "date"]),
  accountSettings: defineTable({
    userId: v.id("users"),
    revision: v.number(),
    updatedAt: v.number(),
    dailyDistractionGoalMinutes: v.number(),
    distractionDomains: v.array(v.string()),
    siteLimits: v.array(v.object({ domain: v.string(), minutes: v.number() })),
    workHours: v.object({ enabled: v.boolean(), start: v.string(), end: v.string() }),
    blockShorts: v.boolean(),
    checkLongForm: v.boolean(),
  }).index("by_user", ["userId"]),
  windowsSettings: defineTable({
    userId: v.id("users"),
    revision: v.number(),
    updatedAt: v.number(),
    goalMinutes: v.number(),
    distractingApps: v.array(v.string()),
    appLimits: v.array(v.object({ app: v.string(), minutes: v.number() })),
    workEnabled: v.boolean(),
    workStartMinutes: v.number(),
    workEndMinutes: v.number(),
  }).index("by_user", ["userId"]),
});

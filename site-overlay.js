(() => {
  let currentMode = "allow";
  let lastPolicy = "";
  let pending = 0;
  let host = null;
  let lastSeenUrl = location.href;

  // YouTube uses page-wide keyboard shortcuts. Keep typing inside the shadow
  // form from reaching those handlers, without cancelling normal text input.
  for (const type of ["keydown", "keypress", "keyup"]) {
    window.addEventListener(type, event => {
      if (!host?.isConnected) return;
      if (event.composedPath().some(node => ["TEXTAREA", "INPUT", "SELECT"].includes(node?.tagName) && host.shadowRoot.contains(node))) {
        event.stopImmediatePropagation();
      }
    }, true);
  }

  function pauseMedia() {
    if (currentMode === "allow") return;
    document.querySelectorAll("video,audio").forEach(media => { if (!media.paused) media.pause(); });
  }
  document.addEventListener("play", event => {
    if (currentMode !== "allow" && event.target instanceof HTMLMediaElement) event.target.pause();
  }, true);

  function makeOverlay() {
    if (host?.isConnected) return host.shadowRoot;
    host = document.createElement("div");
    host.id = "amythest-overlay-root";
    host.style.cssText = "position:fixed!important;inset:0!important;z-index:2147483647!important;display:block!important;";
    const shadow = host.attachShadow({ mode: "open" });
    shadow.innerHTML = `<style>
      :host{all:initial;position:fixed;inset:0;z-index:2147483647;font-family:"Segoe UI Variable","Segoe UI",Arial,sans-serif;color:#f6f4ff}
      *{box-sizing:border-box} .veil{position:fixed;inset:0;display:grid;place-items:center;overflow:auto;padding:20px;background:radial-gradient(circle at 75% 15%,rgba(137,87,246,.29),transparent 38%),rgba(5,6,17,.8);backdrop-filter:blur(18px) saturate(130%);-webkit-backdrop-filter:blur(18px) saturate(130%)}
      .card{width:min(100%,500px);background:linear-gradient(145deg,rgba(45,43,76,.88),rgba(16,19,38,.94) 60%,rgba(20,34,53,.91));border:1px solid rgba(230,221,255,.2);border-radius:22px;padding:31px;box-shadow:inset 0 1px 0 rgba(255,255,255,.18),inset 0 26px 40px rgba(166,146,255,.035),0 24px 70px rgba(1,2,14,.55);backdrop-filter:blur(30px);-webkit-backdrop-filter:blur(30px)}
      .brand{display:flex;align-items:center;gap:9px;color:#f5f2ff;font-size:18px;font-weight:650;letter-spacing:-.04em;margin-bottom:31px}.brand img{width:29px;height:29px;border-radius:8px;box-shadow:0 0 22px rgba(150,111,255,.35)}
      .symbol{display:grid;place-items:center;width:52px;height:52px;border-radius:17px;background:rgba(173,146,255,.15);border:1px solid rgba(218,203,255,.15);color:#c5b5ff;font-size:24px;margin-bottom:23px}.eyebrow{color:#baa9ff;font-size:10px;font-weight:750;letter-spacing:.17em}
      h1{font-family:inherit;font-weight:520;font-size:41px;line-height:1.13;letter-spacing:-.045em;margin:12px 0;color:#fff}h1 em{font-style:normal;background:linear-gradient(100deg,#eadfff,#a695ff 55%,#89c8de);background-clip:text;color:transparent}p{font-size:14px;line-height:1.65;color:#b6b0c7;margin:0 0 22px}
      form{display:flex;flex-direction:column}label{font-size:12px;font-weight:650;margin:4px 0 8px;color:#ede8ff}select,textarea{border:1px solid rgba(229,219,255,.18);border-radius:8px;padding:11px 12px;background:rgba(255,255,255,.07);color:#f6f4ff;font:inherit;font-size:13px;margin-bottom:17px;outline:none}select option{background:#1d1e33;color:#fff}textarea::placeholder{color:#a6a1b7}select:focus,textarea:focus,button:focus-visible{outline:2px solid #c1b1ff;outline-offset:2px}textarea{resize:vertical;min-height:92px}
      .hint{font-size:11px;margin:-8px 0 10px}.error{color:#ff9eb8;font-size:11px;min-height:16px;margin:0 0 8px}.primary{display:flex;justify-content:space-between;align-items:center;width:100%;border:1px solid rgba(209,191,255,.28);border-radius:11px;background:linear-gradient(145deg,#7655d6,#6147b7);color:#fff;font:inherit;font-size:13px;font-weight:650;padding:14px 18px;box-shadow:inset 0 1px 0 rgba(255,255,255,.23),0 11px 26px rgba(36,23,105,.38);cursor:pointer}.primary:hover{background:linear-gradient(145deg,#8565e5,#6b50c4)}.primary:disabled{opacity:.6;cursor:wait}.note{margin:16px 0 0;font-size:11px}.secondary{border:0;background:none;color:#c6b6ff;font:inherit;font-size:12px;font-weight:700;padding:12px 0;cursor:pointer}
      @font-face{font-family:"Amythest Inter";src:url("${chrome.runtime.getURL("assets/fonts/Inter-Variable.ttf")}") format("truetype");font-weight:100 900;font-style:normal;font-display:swap}
      :host{font-family:"Amythest Inter",Inter,"Segoe UI",sans-serif}
      .veil{background:radial-gradient(circle at 76% 14%,rgba(134,245,255,.46),transparent 38%),radial-gradient(circle at 10% 72%,rgba(20,143,224,.35),transparent 45%),rgba(2,23,55,.78)}
      .card{background:linear-gradient(155deg,rgba(108,192,225,.42),rgba(15,89,146,.64) 38%,rgba(4,34,78,.93));border-color:rgba(197,244,255,.43);border-radius:22px;box-shadow:inset 0 1px 0 rgba(255,255,255,.58),inset 0 22px 28px rgba(255,255,255,.07),0 25px 75px rgba(0,18,50,.48)}
      .brand img{box-shadow:0 0 17px rgba(123,234,255,.36)}.eyebrow{color:#b9f2ff}h1{letter-spacing:-.055em}h1 em{background:linear-gradient(100deg,#fff,#b2f6ff,#67d9ea);background-clip:text;color:transparent}p{color:#d1e6f1}
      .guard-wrap{position:relative;width:112px;height:105px;margin:0 0 18px;display:grid;place-items:center;background:radial-gradient(circle,rgba(159,248,241,.25),transparent 72%)}
      .guard-wrap img{display:block;width:112px;height:103px;filter:drop-shadow(0 7px 10px rgba(0,36,79,.4))}
      .guard-wrap.checking img{animation:guard-bob .72s ease-in-out infinite alternate}.guard-wrap.checking:after{content:"";position:absolute;inset:-5px;border:2px solid rgba(178,255,245,.6);border-radius:50%;animation:guard-ring 1.2s ease-out infinite}
      select,textarea{background:linear-gradient(180deg,rgba(216,249,255,.19),rgba(2,43,90,.2));border-color:rgba(199,239,255,.37);border-radius:8px;color:#fff}select option{background:#164c78}textarea::placeholder{color:#b9d4e0}
      .primary{border-color:rgba(205,250,255,.61);border-radius:10px;background:linear-gradient(180deg,#9defff,#46c9ed 43%,#188fcf 47%,#146da9);box-shadow:inset 0 1px 0 rgba(255,255,255,.75),0 10px 24px rgba(0,73,142,.37);text-shadow:0 1px 2px rgba(0,38,90,.45)}.primary:hover{background:linear-gradient(180deg,#bdfaff,#68d8f3 43%,#269fd7 47%,#1a80b8)}.secondary{color:#bbf4ff}
      .veil{background:radial-gradient(circle at 76% 14%,rgba(213,169,255,.43),transparent 38%),radial-gradient(circle at 10% 72%,rgba(126,78,214,.35),transparent 45%),rgba(13,8,42,.82)}
      .card{background:linear-gradient(155deg,rgba(173,130,223,.48),rgba(83,54,152,.68) 38%,rgba(26,18,72,.94));border-color:rgba(233,205,255,.44);box-shadow:inset 0 1px 0 rgba(255,255,255,.54),inset 0 22px 28px rgba(255,255,255,.065),0 25px 75px rgba(19,7,55,.5)}
      .brand img{box-shadow:0 0 17px rgba(214,159,255,.35)}.eyebrow{color:#e2c7ff}h1 em{background:linear-gradient(100deg,#fff,#e5cfff,#b6a6f6);background-clip:text;color:transparent}p{color:#e1d7ef}
      .guard-wrap{background:radial-gradient(circle,rgba(218,177,255,.29),transparent 72%)}.guard-wrap img{filter:drop-shadow(0 7px 10px rgba(42,13,91,.45))}.guard-wrap.checking:after{border-color:rgba(236,201,255,.67)}
      select,textarea{background:linear-gradient(180deg,rgba(237,215,255,.19),rgba(55,28,112,.25));border-color:rgba(235,207,255,.38)}select option{background:#3b286d}textarea::placeholder{color:#d0bddf}
      .primary{border-color:rgba(240,210,255,.67);background:linear-gradient(180deg,#e6c9ff,#b983e9 43%,#8953ce 47%,#7040b1);box-shadow:inset 0 1px 0 rgba(255,255,255,.72),0 10px 24px rgba(81,38,156,.38);text-shadow:0 1px 2px rgba(46,15,88,.45)}.primary:hover{background:linear-gradient(180deg,#f0dcff,#c99bf0 43%,#9b66d9 47%,#8050c0)}.secondary{color:#eccfff}
      .primary{border:1px solid #9ab9f6;border-radius:16px;background:linear-gradient(180deg,#fff 0%,#f3f5ff 48%,#d7def9 49%,#d6d9ef 100%);box-shadow:inset 0 1px 0 #fff,inset 0 -1px 0 rgba(92,89,154,.18),0 4px 0 rgba(72,83,136,.62),0 9px 20px rgba(9,16,58,.23);color:#252047;text-shadow:0 1px 0 rgba(255,255,255,.8)}.primary:hover{background:linear-gradient(180deg,#fff,#faf8ff 48%,#e7ddfa 49%,#dfd8f2)}.primary:active{transform:translateY(3px);box-shadow:inset 0 1px 0 #fff,0 1px 0 rgba(72,83,136,.63),0 3px 9px rgba(9,16,58,.18)}
      @keyframes guard-bob{from{transform:translateY(2px) rotate(-2deg)}to{transform:translateY(-5px) rotate(2deg)}}@keyframes guard-ring{from{opacity:.7;transform:scale(.78)}to{opacity:0;transform:scale(1.22)}}
      @media(max-width:520px){.card{padding:24px}h1{font-size:34px}}@media(prefers-reduced-motion:reduce){.veil{backdrop-filter:none;-webkit-backdrop-filter:none}.guard-wrap.checking img,.guard-wrap.checking:after{animation:none}}
    </style><div class="veil"><main class="card" role="dialog" aria-modal="true" aria-labelledby="amythest-title"><div class="brand"><img src="${chrome.runtime.getURL("icons/mark.svg")}" alt=""><span>amythest</span></div><div id="content"></div></main></div>`;
    document.documentElement.appendChild(host);
    return shadow;
  }

  function render(policy) {
    currentMode = policy.mode;
    if (policy.mode === "allow") { host?.remove(); host = null; return; }
    const shadow = makeOverlay();
    const content = shadow.getElementById("content");
    const guardMarkup = `<div class="guard-wrap"><img src="${chrome.runtime.getURL("icons/guard-avatar.svg")}" alt="" aria-hidden="true"></div>`;
    if (policy.mode === "checking") {
      content.innerHTML = `${guardMarkup}<span class="eyebrow">CHECKING THIS VIDEO</span><h1 id="amythest-title">One moment, <em>please.</em></h1><p>Amythest is checking whether this video needs a reason.</p>`;
      shadow.querySelector(".guard-wrap")?.classList.add("checking");
    } else if (policy.mode === "shorts" && !policy.shortId) {
      const escapeLink = policy.shortKind === "TikTok feed" ? '<a class="secondary" href="https://www.tiktok.com/messages">Open TikTok messages →</a>' : policy.shortKind === "Instagram Reels" ? '<a class="secondary" href="https://www.instagram.com/">Back to Instagram →</a>' : '';
      content.innerHTML = `${guardMarkup}<span class="eyebrow">SHORT-FORM FEED PAUSED</span><h1 id="amythest-title">Keep your <em>attention.</em></h1><p>${policy.shortKind || "This feed"} is paused. Open a specific video to ask for access to just that one. Messages and other pages stay available.</p>${escapeLink}`;
    } else if (policy.mode === "video" || policy.mode === "shorts") {
      const isShort = policy.mode === "shorts";
      content.innerHTML = `${guardMarkup}<span class="eyebrow">${isShort ? "ONE VIDEO, WITH INTENTION" : "WATCH WITH INTENTION"}</span><h1 id="amythest-title">${isShort ? "Why this <em>video?</em>" : "What are you here to <em>learn?</em>"}</h1><p>${isShort ? `Tell yourself why this ${policy.shortKind || "short video"} is worth watching. A reason unlocks only this video for 5 minutes.` : "Pick a purpose and describe what you need from this video. Access lasts 15 minutes."}</p><form id="reason-form"><label for="purpose">Purpose</label><select id="purpose" required><option value="">Choose a purpose</option><option value="school">School</option><option value="robotics">Robotics</option><option value="work">Work</option><option value="research">Research</option><option value="other">Another purposeful task</option></select><label for="reason">What will you use this video for?</label><textarea id="reason" rows="3" minlength="15" maxlength="280" placeholder="I need this robotics tutorial to wire my sensor." required></textarea><p class="hint">Write at least three meaningful words. Amythest cannot verify your reason.</p><div id="error" class="error" role="alert"></div><button class="primary" type="submit">${isShort ? "Watch this video for 5 minutes" : "Watch for 15 minutes"} <span>→</span></button></form>`;
      shadow.getElementById("reason-form").addEventListener("submit", async event => {
        event.preventDefault();
        const button = event.currentTarget.querySelector("button");
        button.disabled = true;
        shadow.querySelector(".guard-wrap")?.classList.add("checking");
        try {
          const result = await chrome.runtime.sendMessage({ type: isShort ? "requestShortAccess" : "requestVideoAccess", url: location.href, category: shadow.getElementById("purpose").value, reason: shadow.getElementById("reason").value });
          if (!result?.ok) { shadow.getElementById("error").textContent = result?.error || "Please try again."; return; }
          await refresh();
        } catch { shadow.getElementById("error").textContent = "Please try again."; }
        finally { button.disabled = false; shadow.querySelector(".guard-wrap")?.classList.remove("checking"); }
      });
    } else {
      const reason = policy.focusUntil > Date.now() ? "You're in a focus session." : policy.workHours ? "You're within your work hours." : "You've reached today's limit for this site.";
      content.innerHTML = `${guardMarkup}<span class="eyebrow">A GENTLE REMINDER</span><h1 id="amythest-title">Your attention is <em>worth protecting.</em></h1><p id="block-reason"></p><button id="break" class="primary" type="button">Take a 5-minute break <span>→</span></button><p class="note">Your website will stay open behind this reminder.</p>`;
      shadow.getElementById("block-reason").textContent = `${reason} Take a breath, then return to what matters to you.`;
      shadow.getElementById("break").addEventListener("click", async () => {
        await chrome.storage.local.set({ pausedUntil: Date.now() + 5 * 60000 });
        await refresh();
      });
    }
    pauseMedia();
  }

  async function refresh() {
    const url = location.href;
    const request = ++pending;
    try {
      const policy = await chrome.runtime.sendMessage({ type: "getSitePolicy", url });
      if (request !== pending || url !== location.href) return;
      const fingerprint = `${url}|${JSON.stringify(policy)}`;
      if (fingerprint !== lastPolicy || (policy.mode !== "allow" && !host?.isConnected)) { lastPolicy = fingerprint; render(policy); }
      pauseMedia();
    } catch { /* Extension may be reloading; the next check will retry. */ }
  }

  function onLocationChange() {
    if (location.href === lastSeenUrl) return;
    lastSeenUrl = location.href;
    if (/^https?:\/\/(?:www\.|m\.)?youtube\.com\/(?:watch(?:\?|$)|shorts\/|live\/)/.test(lastSeenUrl)) {
      render({ mode: "checking" });
    }
    refresh();
  }

  function watchLocation() {
    new MutationObserver(onLocationChange).observe(document.documentElement, { childList: true, subtree: true });
  }

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "local" && Object.keys(changes).some(key => key.startsWith("usage:") || ["blockedSites", "siteLimits", "focusUntil", "pausedUntil", "workHoursEnabled", "workStart", "workEnd", "blockShorts", "checkLongForm", "videoAccess", "shortAccess"].includes(key))) refresh();
  });
  chrome.runtime.onMessage.addListener(message => { if (message.type === "policyChanged") { onLocationChange(); refresh(); } });
  document.addEventListener("visibilitychange", () => { if (!document.hidden) refresh(); });
  window.addEventListener("popstate", onLocationChange);
  window.addEventListener("yt-navigate-start", onLocationChange);
  window.addEventListener("yt-navigate-finish", onLocationChange);
  if (document.documentElement) watchLocation(); else document.addEventListener("DOMContentLoaded", watchLocation, { once: true });
  setInterval(() => { onLocationChange(); refresh(); }, 1000);
  if (/^https?:\/\/(?:www\.|m\.)?youtube\.com\/(?:watch(?:\?|$)|shorts\/|live\/)/.test(location.href)) render({ mode: "checking" });
  refresh();
})();

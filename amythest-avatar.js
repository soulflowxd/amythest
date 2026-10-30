/* Amythest's original, interactive Aero companion. */
(() => {
  class AmythestAvatar extends HTMLElement {
    connectedCallback() {
      if (this.shadowRoot) { this.startMotion(); return; }
      const root = this.attachShadow({ mode: "open" });
      root.innerHTML = `<style>
        :host{display:block;position:relative;width:var(--avatar-size,100px);height:var(--avatar-size,100px);cursor:pointer;outline:none;touch-action:manipulation;user-select:none}
        svg{display:block;width:100%;height:100%;overflow:visible;filter:drop-shadow(0 7px 8px rgba(39,20,89,.36))}
        .head-motion{transform:translate(var(--head-x,0px),var(--head-y,0px)) rotate(var(--head-rotation,0deg));transform-box:view-box;transform-origin:90px 76px;transition:transform .26s cubic-bezier(.2,.85,.28,1.35)}
        :host(.dragging) .head-motion{transition:none}
        .body-glint{transition:opacity .2s ease}
        :host(.petted) .body-glint{opacity:1}
        .reaction{position:absolute;right:-2px;top:4px;color:#eddbff;font-size:19px;text-shadow:0 1px 5px #4e2d9b;opacity:0;transform:translateY(5px);pointer-events:none}
        :host(.greeting) .reaction,:host(.petted) .reaction,:host(.rebuke) .reaction{animation:reaction .65s ease-out}
        @keyframes reaction{25%{opacity:1;transform:translateY(-5px)}75%{opacity:1;transform:translateY(-7px)}to{opacity:0;transform:translateY(-11px)}}
        :host(:focus-visible){outline:2px solid #e7cfff;outline-offset:3px;border-radius:25%}
        .pupils{transform:translate(var(--look-x,0px),var(--look-y,0px));transition:transform .12s ease-out}
        .eyes,.brows,.mouth{transition:opacity .2s ease;transform-origin:center}
        .eyes.closed,.brows,.mouth{opacity:0}
        :host([data-mood="angry"]) .brows,:host([data-mood="sad"]) .mouth{opacity:1}
        :host([data-mood="angry"]) .mouth{opacity:0}
        :host([data-mood="sad"]) .brows{opacity:0}
        :host([data-mood="idle"]) .pupils{transform:translate(var(--look-x,0px),calc(var(--look-y,0px) + 1px))}
        :host(.blink) .eyes.open{opacity:0}:host(.blink) .eyes.closed{opacity:1}
        :host([data-mood="angry"]) svg{animation:firm 2.2s ease-in-out infinite}
        :host(.greeting) svg{animation:greet .55s ease-in-out}
        :host(.rebuke) svg{animation:rebuke .5s ease-in-out}
        :host(.rebuke) .brows{stroke-width:4.5}
        .surprise-mouth{opacity:0;transition:opacity .15s}
        :host(.startled) .surprise-mouth{opacity:1}
        :host(.startled) .mouth{opacity:0}
        @keyframes firm{50%{transform:translateY(-2px)}}@keyframes greet{50%{transform:rotate(8deg) translateY(-4px)}}
        @keyframes rebuke{20%{transform:rotate(-5deg)}45%{transform:rotate(5deg)}70%{transform:rotate(-3deg)}}
        @media(prefers-reduced-motion:reduce){svg,.pupils,.eyes,.brows,.mouth,.head-motion,.reaction{transition:none!important;animation:none!important}}
      </style>
      <svg viewBox="0 0 180 180" role="img" aria-label="Amythest companion">
        <defs>
          <linearGradient id="rim" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#025e9a"/><stop offset=".5" stop-color="#092b78"/><stop offset="1" stop-color="#a7e9ff"/></linearGradient>
          <radialGradient id="body" cx=".51" cy=".84" r=".82"><stop stop-color="#d8ebaf"/><stop offset=".32" stop-color="#a98add"/><stop offset=".7" stop-color="#4e70aa"/><stop offset="1" stop-color="#8ee2e4"/></radialGradient>
          <radialGradient id="head" cx=".5" cy=".87" r=".95"><stop stop-color="#d5efaa"/><stop offset=".38" stop-color="#a184dc"/><stop offset=".76" stop-color="#3973a8"/><stop offset="1" stop-color="#d9faff"/></radialGradient>
          <linearGradient id="shine" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#fff" stop-opacity=".88"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
        </defs>
        <ellipse cx="90" cy="172" rx="58" ry="4" fill="#251345" opacity=".15"/>
        <path d="M69 72C45 78 28 94 23 117c-4 16-3 30 4 36 4 4 9 4 13 1 1 10 10 15 24 18 17 4 35 4 52 0 14-3 23-8 24-18 4 3 9 3 13-1 7-6 8-20 4-36-5-23-22-39-46-45Z" fill="url(#body)" stroke="url(#rim)" stroke-width="2.7"/>
        <path d="M47 93C35 106 29 128 32 146c1 5 4 7 8 6 1-22 6-43 18-60Z" fill="#defaff" opacity=".42"/>
        <path d="M133 93c12 13 18 35 15 53-1 5-4 7-8 6-1-22-6-43-18-60Z" fill="#e8daff" opacity=".42"/>
        <path d="M65 80c-12 2-20 13-23 28l-8 43c-2 10 6 17 23 20 19 4 47 4 66 0 17-3 25-10 23-20l-8-43c-3-15-11-26-23-28-16-3-34-3-50 0Z" fill="url(#body)" stroke="#9ce5e4" stroke-opacity=".68" stroke-width="2"/>
        <ellipse class="body-glint" cx="90" cy="91" rx="36" ry="13" fill="url(#shine)" opacity=".72"/>
        <path d="M43 153c5 13 36 17 47 17s42-4 47-17" fill="none" stroke="#e5ffdf" stroke-opacity=".38" stroke-width="2"/>
        <g class="head-motion">
        <circle cx="90" cy="42" r="38" fill="url(#head)" stroke="url(#rim)" stroke-width="2.7"/>
        <ellipse cx="88" cy="20" rx="27" ry="10" fill="url(#shine)" opacity=".85"/>
        <path d="M58 39c6-23 22-32 37-31" fill="none" stroke="#fff" stroke-opacity=".48" stroke-width="2.5" stroke-linecap="round"/>
        <g class="pupils"><g class="eyes open"><ellipse cx="77" cy="49" rx="5.5" ry="7" fill="#243354"/><ellipse cx="103" cy="49" rx="5.5" ry="7" fill="#243354"/></g><g class="eyes closed" stroke="#243354" stroke-width="2.6" fill="none" stroke-linecap="round"><path d="M71 50q6 4 12 0M97 50q6 4 12 0"/></g></g>
        <g class="brows" stroke="#283454" stroke-width="3.2" stroke-linecap="round"><path d="m69 36 15 5m27-5-15 5"/></g>
        <path class="mouth" d="M84 66q6-4 12 0" stroke="#34416d" stroke-width="2.5" stroke-linecap="round" fill="none"/>
        <circle class="surprise-mouth" cx="90" cy="66" r="2.5" fill="#34416d"/>
        </g>
      </svg><span class="reaction" aria-hidden="true">✦</span>`;
      this.tabIndex = this.hasAttribute("tabindex") ? this.tabIndex : 0;
      this.setState(this.dataset.mood || "happy");
      this.addEventListener("click", () => { if (this.ignoreClick) { this.ignoreClick = false; return; } this.react(); });
      this.addEventListener("keydown", event => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); this.react(); } });
      this.addEventListener("pointerenter", () => { this.blink(); this.startle(); });
      this.addEventListener("pointerdown", event => this.startPet(event));
      this.addEventListener("pointermove", event => this.movePet(event));
      this.addEventListener("pointerup", event => this.endPet(event));
      this.addEventListener("pointercancel", () => this.endPet(null));
      this.startMotion();
    }
    startMotion() {
      this.trackPointer = event => {
        if (this.drag) return;
        const box = this.getBoundingClientRect();
        const x = box.left + box.width / 2, y = box.top + box.height * .26;
        const scale = Math.max(box.width * .75, 1);
        const near = Math.hypot(event.clientX - x, event.clientY - y) < box.width * 3;
        if (!near) return;
        this.lastPointerAt = Date.now();
        const dx = Math.max(-1, Math.min(1, (event.clientX - x) / scale));
        const dy = Math.max(-1, Math.min(1, (event.clientY - y) / scale));
        this.style.setProperty("--look-x", `${(dx * 5).toFixed(1)}px`);
        this.style.setProperty("--look-y", `${(dy * 3.5).toFixed(1)}px`);
        this.style.setProperty("--head-rotation", `${(dx * 3).toFixed(1)}deg`);
        this.style.setProperty("--head-y", `${(dy * 1.5).toFixed(1)}px`);
      };
      document.addEventListener("pointermove", this.trackPointer, { passive: true });
      const scheduleBlink = () => {
        this.blinkTimer = setTimeout(() => { if (this.isConnected) { this.blink(); scheduleBlink(); } }, 2800 + Math.random() * 3400);
      };
      scheduleBlink();
      this.wanderTimer = setInterval(() => {
        if (!this.isConnected || this.drag || Date.now() - (this.lastPointerAt || 0) < 2800) return;
        this.style.setProperty("--look-x", `${(Math.random() * 3 - 1.5).toFixed(1)}px`);
        this.style.setProperty("--look-y", `${(Math.random() * 2 - 1).toFixed(1)}px`);
        this.style.setProperty("--head-rotation", `${(Math.random() * 2.5 - 1.25).toFixed(1)}deg`);
        this.style.setProperty("--head-y", "0px");
      }, 3800);
    }
    disconnectedCallback() { clearTimeout(this.blinkTimer); clearInterval(this.wanderTimer); clearTimeout(this.startleTimer); clearTimeout(this.petTimer); document.removeEventListener("pointermove", this.trackPointer); this.drag = null; }
    setState(mood) { this.dataset.mood = ["happy","idle","sad","angry"].includes(mood) ? mood : "happy"; this.setAttribute("aria-label", `Amythest companion, ${this.dataset.mood}`); }
    blink() { this.classList.add("blink"); setTimeout(() => this.classList.remove("blink"), 160); }
    startle() { this.classList.add("startled"); clearTimeout(this.startleTimer); this.startleTimer = setTimeout(() => this.classList.remove("startled"), 360); }
    startPet(event) {
      if (event.button !== 0 || event.isPrimary === false) return;
      const box = this.getBoundingClientRect();
      if (event.clientY > box.top + box.height * .49) return;
      this.drag = { id: event.pointerId, x: event.clientX, y: event.clientY, moved: false };
      this.classList.add("dragging");
      try { this.setPointerCapture(event.pointerId); } catch { /* Synthetic events may not have capture. */ }
    }
    movePet(event) {
      if (!this.drag || event.pointerId !== this.drag.id) return;
      const dx = event.clientX - this.drag.x, dy = event.clientY - this.drag.y;
      if (Math.hypot(dx, dy) > 4) this.drag.moved = true;
      this.style.setProperty("--head-x", `${Math.max(-9, Math.min(9, dx * .25)).toFixed(1)}px`);
      this.style.setProperty("--head-y", `${Math.max(-7, Math.min(7, dy * .25)).toFixed(1)}px`);
      this.style.setProperty("--head-rotation", `${Math.max(-11, Math.min(11, dx * .22)).toFixed(1)}deg`);
    }
    endPet(event) {
      if (!this.drag || (event && event.pointerId !== this.drag.id)) return;
      const moved = this.drag.moved;
      try { if (this.hasPointerCapture(this.drag.id)) this.releasePointerCapture(this.drag.id); } catch { }
      this.drag = null;
      this.classList.remove("dragging");
      this.style.setProperty("--head-x", "0px");
      this.style.setProperty("--head-y", "0px");
      this.style.setProperty("--head-rotation", "0deg");
      if (moved && event) {
        this.ignoreClick = true;
        setTimeout(() => { this.ignoreClick = false; }, 350);
        this.classList.add("petted"); this.startle();
        clearTimeout(this.petTimer);
        this.petTimer = setTimeout(() => this.classList.remove("petted"), 720);
        this.dispatchEvent(new CustomEvent("avatar-reaction", { detail: { kind: "pet" }, bubbles: true, composed: true }));
      }
    }
    react() {
      if (this.dataset.mood === "angry") {
        this.classList.remove("rebuke"); void this.offsetWidth; this.classList.add("rebuke");
        setTimeout(() => this.classList.remove("rebuke"), 550);
        this.dispatchEvent(new CustomEvent("avatar-reaction", { detail: { kind: "rebuke" }, bubbles: true, composed: true }));
      } else { this.greet(); this.dispatchEvent(new CustomEvent("avatar-reaction", { detail: { kind: "greet" }, bubbles: true, composed: true })); }
    }
    greet() { this.classList.remove("greeting"); void this.offsetWidth; this.classList.add("greeting"); this.blink(); setTimeout(() => this.classList.remove("greeting"), 600); }
  }
  customElements.define("amythest-avatar", AmythestAvatar);
})();

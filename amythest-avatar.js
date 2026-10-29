/* Amythest's original, interactive Aero companion. */
(() => {
  class AmythestAvatar extends HTMLElement {
    connectedCallback() {
      if (this.shadowRoot) { this.startMotion(); return; }
      const root = this.attachShadow({ mode: "open" });
      root.innerHTML = `<style>
        :host{display:block;width:var(--avatar-size,100px);height:var(--avatar-size,100px);cursor:pointer;outline:none}
        svg{display:block;width:100%;height:100%;overflow:visible;filter:drop-shadow(0 7px 8px rgba(39,20,89,.36))}
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
        @keyframes firm{50%{transform:translateY(-2px)}}@keyframes greet{50%{transform:rotate(8deg) translateY(-4px)}}
        @keyframes rebuke{20%{transform:rotate(-5deg)}45%{transform:rotate(5deg)}70%{transform:rotate(-3deg)}}
        @media(prefers-reduced-motion:reduce){svg,.pupils,.eyes,.brows,.mouth{transition:none!important;animation:none!important}}
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
        <ellipse cx="90" cy="91" rx="36" ry="13" fill="url(#shine)" opacity=".72"/>
        <path d="M43 153c5 13 36 17 47 17s42-4 47-17" fill="none" stroke="#e5ffdf" stroke-opacity=".38" stroke-width="2"/>
        <circle cx="90" cy="42" r="38" fill="url(#head)" stroke="url(#rim)" stroke-width="2.7"/>
        <ellipse cx="88" cy="20" rx="27" ry="10" fill="url(#shine)" opacity=".85"/>
        <path d="M58 39c6-23 22-32 37-31" fill="none" stroke="#fff" stroke-opacity=".48" stroke-width="2.5" stroke-linecap="round"/>
        <g class="pupils"><g class="eyes open"><ellipse cx="77" cy="49" rx="5.5" ry="7" fill="#243354"/><ellipse cx="103" cy="49" rx="5.5" ry="7" fill="#243354"/></g><g class="eyes closed" stroke="#243354" stroke-width="2.6" fill="none" stroke-linecap="round"><path d="M71 50q6 4 12 0M97 50q6 4 12 0"/></g></g>
        <g class="brows" stroke="#283454" stroke-width="3.2" stroke-linecap="round"><path d="m69 36 15 5m27-5-15 5"/></g>
        <path class="mouth" d="M84 66q6-4 12 0" stroke="#34416d" stroke-width="2.5" stroke-linecap="round" fill="none"/>
      </svg>`;
      this.tabIndex = this.hasAttribute("tabindex") ? this.tabIndex : 0;
      this.setState(this.dataset.mood || "happy");
      this.addEventListener("click", () => this.react());
      this.addEventListener("keydown", event => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); this.react(); } });
      this.startMotion();
    }
    startMotion() {
      this.trackPointer = event => {
        const box = this.getBoundingClientRect();
        const x = box.left + box.width / 2, y = box.top + box.height * .26;
        const scale = Math.max(box.width * 1.7, 1);
        this.style.setProperty("--look-x", `${Math.max(-4, Math.min(4, (event.clientX - x) / scale * 4))}px`);
        this.style.setProperty("--look-y", `${Math.max(-3, Math.min(3, (event.clientY - y) / scale * 3))}px`);
      };
      document.addEventListener("pointermove", this.trackPointer, { passive: true });
      this.blinkTimer = setInterval(() => { if (this.isConnected) this.blink(); }, 4400);
    }
    disconnectedCallback() { clearInterval(this.blinkTimer); document.removeEventListener("pointermove", this.trackPointer); }
    setState(mood) { this.dataset.mood = ["happy","idle","sad","angry"].includes(mood) ? mood : "happy"; this.setAttribute("aria-label", `Amythest companion, ${this.dataset.mood}`); }
    blink() { this.classList.add("blink"); setTimeout(() => this.classList.remove("blink"), 160); }
    react() {
      if (this.dataset.mood === "angry") {
        this.classList.remove("rebuke"); void this.offsetWidth; this.classList.add("rebuke");
        setTimeout(() => this.classList.remove("rebuke"), 550);
        this.dispatchEvent(new CustomEvent("avatar-reaction", { bubbles: true, composed: true }));
      } else this.greet();
    }
    greet() { this.classList.remove("greeting"); void this.offsetWidth; this.classList.add("greeting"); this.blink(); setTimeout(() => this.classList.remove("greeting"), 600); }
  }
  customElements.define("amythest-avatar", AmythestAvatar);
})();

class AmethystAvatar extends HTMLElement {
  constructor() {
    super();
    const shadow = this.attachShadow({ mode: "open" });
    shadow.innerHTML = `<style>
      :host{display:inline-block;width:var(--avatar-size,86px);height:var(--avatar-size,86px);vertical-align:middle;cursor:pointer}
      svg{width:100%;height:100%;overflow:visible;filter:drop-shadow(0 9px 11px rgba(90,57,152,.17));animation:float 3.8s ease-in-out infinite}
      .body{fill:#805fc1}.facet{fill:#a98bd9}.facet2{fill:#65479f}.face{fill:#f9f4ff}.eye{fill:#4c367b;transform-box:fill-box;transform-origin:center;animation:blink 5s infinite}.cheek{fill:#d3b9eb}.mouth{fill:none;stroke:#7251aa;stroke-width:2.4;stroke-linecap:round}
      :host([mood="focus"]) .eye{animation:focus 2.4s ease-in-out infinite}:host([mood="focus"]) .mouth{stroke-width:2.1}
      :host([mood="pause"]) svg{animation:float 5s ease-in-out infinite}:host([mood="pause"]) .eye{animation:none;transform:scaleY(.35)}
      :host([mood="happy"]) .eye{animation:happy 1.8s ease-in-out infinite}:host([mood="happy"]) .mouth{stroke-width:3}
      :host(.wave) svg{animation:wave .65s ease-in-out 2}
      @keyframes float{0%,100%{transform:translateY(0) rotate(-2deg)}50%{transform:translateY(-5px) rotate(2deg)}}
      @keyframes blink{0%,43%,47%,100%{transform:scaleY(1)}45%{transform:scaleY(.12)}}
      @keyframes focus{0%,100%{transform:scaleY(.65)}50%{transform:scaleY(.9)}}
      @keyframes happy{0%,100%{transform:scaleY(.75)}50%{transform:scaleY(.45)}}
      @keyframes wave{0%,100%{transform:rotate(0)}30%{transform:rotate(12deg)}70%{transform:rotate(-10deg)}}
      @media(prefers-reduced-motion:reduce){svg,.eye{animation:none!important}}
    </style><svg viewBox="0 0 100 100" role="img" aria-label="Amethyst, your focus companion"><path class="body" d="M50 3 85 20 97 55 70 91 50 98 30 91 3 55 15 20Z"/><path class="facet" d="M50 3 15 20 3 55 29 40Z"/><path class="facet2" d="M50 98 70 91 97 55 72 73Z"/><path class="face" d="M20 38 Q50 24 80 38 L83 58 Q75 79 50 82 Q25 79 17 58Z"/><ellipse class="cheek" cx="26" cy="62" rx="5" ry="2.5"/><ellipse class="cheek" cx="74" cy="62" rx="5" ry="2.5"/><ellipse class="eye" cx="38" cy="51" rx="4" ry="6"/><ellipse class="eye" cx="62" cy="51" rx="4" ry="6"/><path class="mouth" d="M44 64 Q50 69 56 64"/></svg>`;
    this.addEventListener("click", () => { this.classList.remove("wave"); void this.offsetWidth; this.classList.add("wave"); });
  }
}
customElements.define("amethyst-avatar", AmethystAvatar);

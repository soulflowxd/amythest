// The four tiles in geode-stages.png run from closed (0) to open (3).
function geodeStage(distractionMs, goalMinutes) {
  const fraction = Math.max(0, distractionMs) / (Math.max(1, goalMinutes) * 60000);
  return fraction >= 1 ? 0 : fraction >= .65 ? 1 : fraction >= .30 ? 2 : 3;
}

function geodeLabel(stage) {
  return ["Budget reached · geode resting", "Near your distraction budget", "Room to focus today", "Your geode is open"][stage];
}

const geodeStates = new WeakMap();
function showGeode(element, distractionMs, goalMinutes) {
  if (!element) return;
  const target = geodeStage(distractionMs, goalMinutes);
  element.setAttribute("role", "img");
  element.setAttribute("aria-label", `${geodeLabel(target)}. Based on today's distraction time against your daily goal.`);
  const caption = element.parentElement?.querySelector(".geode-caption");
  if (caption) caption.textContent = geodeLabel(target);
  const position = stage => `${stage % 2 ? 100 : 0}% ${stage > 1 ? 100 : 0}%`;
  let state = geodeStates.get(element);
  if (!state) {
    const base = document.createElement("span");
    const next = document.createElement("span");
    base.className = "geode-frame geode-base";
    next.className = "geode-frame geode-next";
    base.style.backgroundPosition = position(target);
    element.append(base, next);
    state = { base, next, current: target, target, timer: null };
    geodeStates.set(element, state);
    return;
  }
  state.target = target;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    clearTimeout(state.timer);
    state.current = target;
    state.base.style.backgroundPosition = position(target);
    state.next.style.opacity = "0";
    state.timer = null;
    return;
  }
  if (state.timer || state.current === state.target) return;
  const advance = () => {
    if (state.current === state.target) { state.timer = null; return; }
    const following = state.current + Math.sign(state.target - state.current);
    state.next.style.transition = "none";
    state.next.style.opacity = "0";
    state.next.style.backgroundPosition = position(following);
    // Force a style read so the next frame fades in from zero opacity.
    state.next.getBoundingClientRect();
    state.next.style.transition = "opacity 240ms ease-in-out";
    state.next.style.opacity = "1";
    state.timer = setTimeout(() => {
      state.current = following;
      state.base.style.backgroundPosition = position(following);
      state.next.style.transition = "none";
      state.next.style.opacity = "0";
      advance();
    }, 250);
  };
  advance();
}

if (typeof module !== "undefined") module.exports = { geodeStage, geodeLabel };

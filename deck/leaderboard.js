// Live leaderboard for the slide with layout "leaderboard".
// Streams /scores from Firebase Realtime Database over EventSource (REST streaming),
// so the list updates the moment a phone submits. No Firebase SDK needed.
//
// Ranking: score (high first), then mistakes (low first), then who finished first.
// When scores change live, the row whose score changed is dragged to its new rank (it lifts,
// glides there and drops into place) while the rows it passes slide out of its way; new
// entries pop in (on an empty bar, the bar clicks and what's on it pops in).
(function () {
  const AVATARS = "../assets/characters/";
  const scores = {}; // key -> entry
  const seen = {}; // key -> the entry as last drawn, to tell which rows changed
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }

  // [key, entry] pairs, best first
  function ranked() {
    return Object.entries(scores)
      .filter(([, s]) => s && typeof s.name === "string" && typeof s.score === "number")
      .sort(([, a], [, b]) => b.score - a.score || (a.mistakes || 0) - (b.mistakes || 0) || (a.ts || 0) - (b.ts || 0));
  }

  function avatar(id) {
    const box = el("div", "board-avatar");
    if (/^[a-z]{1,20}$/.test(id || "")) {
      const img = el("img");
      img.alt = "";
      img.src = AVATARS + id + ".png";
      img.onerror = () => img.remove();
      box.append(img);
    }
    return box;
  }

  const DRAG = 1100; // ms: lift, glide, drop
  // animate: drag rows that changed rank (FLIP) and pop in new ones
  function render(list, limit, status, animate) {
    const before = new Map();
    list.querySelectorAll(".board-row").forEach((row) => before.set(row.dataset.key, row.getBoundingClientRect().top));
    const all = ranked();
    const top = all.slice(0, limit);
    // rows whose own entry changed since the last draw are the ones being dragged
    const changed = new Set();
    all.forEach(([key, entry]) => {
      const now = JSON.stringify(entry);
      if (seen[key] !== undefined && seen[key] !== now) changed.add(key);
      seen[key] = now;
    });
    Object.keys(seen).forEach((key) => { if (!scores[key]) delete seen[key]; });
    list.replaceChildren();
    top.forEach(([key, s], i) => {
      const row = el("li", "board-row");
      row.dataset.key = key;
      row.append(
        el("span", "board-rank", String(i + 1)),
        avatar(s.avatar),
        el("span", "board-name", s.name),
        el("span", "board-score", String(s.score))
      );
      list.append(row);
    });
    // The rest of the bars stay empty, as in the Figma design (with no scores yet, all of them)
    for (let i = top.length; i < limit; i++) list.append(el("li", "board-slot"));
    if (animate && !reduceMotion.matches) {
      list.querySelectorAll(".board-row").forEach((row, index) => {
        const was = before.get(row.dataset.key);
        if (was === undefined) {
          if (index >= before.size) {
            // It lands on an empty bar (e.g. the first score on an empty board): the bar clicks
            // (presses in and springs back) while what's on it pops in, one piece after another
            row.animate(
              [{ transform: "none" }, { transform: "scale(0.94)", offset: 0.3 }, { transform: "scale(1.03)", offset: 0.65 }, { transform: "none" }],
              { duration: 450, easing: "ease-out" }
            );
            [...row.children].forEach((part, k) => {
              part.animate(
                [{ transform: "scale(0.4)", opacity: 0 }, { transform: "none", opacity: 1 }],
                { duration: 400, delay: 120 + k * 70, easing: "cubic-bezier(0.34, 1.56, 0.64, 1)", fill: "backwards" }
              );
            });
          } else {
            row.animate(
              [{ transform: "scale(0.85)", opacity: 0 }, { transform: "none", opacity: 1 }],
              { duration: 450, easing: "cubic-bezier(0.34, 1.56, 0.64, 1)" } // slight overshoot
            );
          }
          return;
        }
        // the board sits in the leaderboard's scaled 1920-wide canvas: screen px -> canvas px
        const box = row.getBoundingClientRect();
        const shift = (was - box.top) * (box.height ? row.offsetHeight / box.height : 1);
        if (Math.abs(shift) < 1) return;
        if (changed.has(row.dataset.key)) {
          // Dragged: it lifts (a little bigger, in front), glides to its new place, then drops in
          row.style.position = "relative";
          row.style.zIndex = 2;
          const drag = row.animate(
            [
              { transform: `translateY(${shift}px) scale(1)`, easing: "ease-out" },
              { transform: `translateY(${shift}px) scale(1.06)`, offset: 0.18, easing: "cubic-bezier(0.65, 0, 0.35, 1)" },
              { transform: "translateY(0) scale(1.06)", offset: 0.82, easing: "ease-in" },
              { transform: "none" }
            ],
            { duration: DRAG }
          );
          drag.onfinish = drag.oncancel = () => { row.style.position = row.style.zIndex = ""; };
        } else {
          // Pushed aside: slides into its new place while the dragged row passes over it
          row.animate(
            [{ transform: `translateY(${shift}px)` }, { transform: "none" }],
            { duration: DRAG * 0.64, delay: DRAG * 0.18, easing: "cubic-bezier(0.65, 0, 0.35, 1)", fill: "backwards" }
          );
        }
      });
    }
    status.textContent = navigator.onLine === false ? "[TBD: leaderboard offline]" : "";
  }

  // Applies a Firebase streaming event ({ path, data }) to the local copy of /scores.
  function apply(type, msg) {
    const parts = msg.path.split("/").filter(Boolean);
    if (parts.length === 0) {
      if (type === "put") for (const k in scores) delete scores[k];
      Object.assign(scores, msg.data || {});
      return;
    }
    const key = parts[0];
    if (parts.length === 1) {
      if (msg.data == null) delete scores[key];
      else scores[key] = type === "patch" ? Object.assign({}, scores[key], msg.data) : msg.data;
      return;
    }
    // Deeper path: one field of an entry changed
    const entry = Object.assign({}, scores[key]);
    entry[parts[1]] = msg.data;
    scores[key] = entry;
  }

  function mount(list, slide, status) {
    const limit = slide.limit || 5;
    const base = window.FIREBASE_CONFIG && window.FIREBASE_CONFIG.databaseURL;
    render(list, limit, status);
    if (!base || !window.EventSource) {
      status.textContent = "[TBD: leaderboard offline]";
      console.warn("Leaderboard: no FIREBASE_CONFIG.databaseURL or EventSource");
      return;
    }
    const source = new EventSource(base + "/scores.json");
    const onEvent = (type) => (e) => {
      try {
        const msg = JSON.parse(e.data);
        apply(type, msg);
        // The first full snapshot just appears; later changes animate
        render(list, limit, status, !(type === "put" && msg.path === "/"));
      } catch (err) {
        console.error("Leaderboard: bad event", err, e.data);
      }
    };
    source.addEventListener("put", onEvent("put"));
    source.addEventListener("patch", onEvent("patch"));
    source.addEventListener("cancel", () => {
      status.textContent = "[TBD: leaderboard offline]";
      console.error("Leaderboard: read denied. Check the database rules.");
    });
    // EventSource reconnects by itself after network drops
    source.onerror = () => { status.textContent = "[TBD: reconnecting…]"; };
    source.onopen = () => { status.textContent = ""; };
  }

  window.Leaderboard = { mount };
})();

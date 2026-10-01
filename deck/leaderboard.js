// Live leaderboard for the slide with layout "leaderboard".
// Streams /scores from Firebase Realtime Database over EventSource (REST streaming),
// so the list updates the moment a phone submits. No Firebase SDK needed.
//
// Ranking: score (high first), then mistakes (low first), then who finished first.
(function () {
  const AVATARS = "../assets/characters/";
  const scores = {}; // key -> entry

  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }

  function ranked() {
    return Object.values(scores)
      .filter((s) => s && typeof s.name === "string" && typeof s.score === "number")
      .sort((a, b) => b.score - a.score || (a.mistakes || 0) - (b.mistakes || 0) || (a.ts || 0) - (b.ts || 0));
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

  function render(list, limit, status) {
    const top = ranked().slice(0, limit);
    list.replaceChildren();
    if (top.length === 0) {
      list.append(el("li", "board-empty", "[TBD: no scores yet]"));
    }
    top.forEach((s, i) => {
      const row = el("li", "board-row");
      row.append(
        el("span", "board-rank", String(i + 1)),
        avatar(s.avatar),
        el("span", "board-name", s.name),
        el("span", "board-score", String(s.score))
      );
      list.append(row);
    });
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
        apply(type, JSON.parse(e.data));
        render(list, limit, status);
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

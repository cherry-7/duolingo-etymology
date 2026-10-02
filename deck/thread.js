// Story thread: one continuous line that runs through the whole deck and draws itself
// as the deck moves, tying the slides together into one story (inspired by lusion.co).
//
// Picture the slides stacked top to bottom as one tall strip. Each slide is a
// 160 x 90 box in that strip (16:9), so slide i covers y = i*90 to (i+1)*90.
// The thread is a path drawn in that strip; the screen is a camera that moves
// down it as the deck moves.
//
// The thread never crosses slide content (text, characters, QR, leaderboard):
// unless /design supplies a path, it is routed through the empty space on each
// slide, weaving from side to side, and re-routed if the content changes size.
// If there is no way through at all, the thread is hidden rather than cross content.
//
// Color, width and path should come from /design. Until then they are neutral placeholders.

window.THREAD_STYLE = {
  color: "#9a9a9a", // [TBD: from /design]
  width: 0.5, // in slide units (a slide is 160 wide)
  path: null, // [TBD: from /design] SVG path data in strip units; null = route automatically
  drawTo: 0.75, // how far down the screen the line has drawn itself (0 = top, 1 = bottom)
  clearance: 3 // minimum gap between the line and any content, in slide units
};

window.StoryThread = (function () {
  const W = 160;
  const H = 90;
  const SVG_NS = "http://www.w3.org/2000/svg";

  // ---- Routing ------------------------------------------------------------
  // The strip is divided into a grid of small cells. Cells within the minimum gap of
  // content are off limits. A shortest-path search finds a route through the rest,
  // passing a waypoint on alternating sides of each slide. Cells close to content cost
  // more, so the route keeps to the middle of open space and only squeezes through
  // narrow gaps when it has to. Like the ribbon on lusion.co, it may also leave the
  // frame for a moment (OFFSCREEN units past each side) to sweep around content, at a
  // small extra cost so it mostly stays in view. Each stretch is then smoothed as much
  // as it can be without coming within the minimum gap of content.

  const CELL = 2; // slide units per grid cell
  const OFFSCREEN = 24; // slide units the route may travel past the left and right edges
  const COLS = (W + 2 * OFFSCREEN) / CELL;
  const xOf = (col) => (col + 0.5) * CELL - OFFSCREEN;
  const colOf = (x) => Math.floor((x + OFFSCREEN) / CELL);
  const ROOM = 8; // cells: closer than this to content costs extra
  const TOLERANCES = [12, 9, 7, 5, 3.5, 2, 1, 0]; // smoothing levels, roughest last

  // obstacles: rectangles {x, y, w, h} in strip units.
  // Returns null if even a tight route can't get through without touching content.
  function route(count, obstacles, minGap) {
    for (const gap of [minGap, minGap / 2, 1]) {
      const d = routeWithGap(count, obstacles, gap);
      if (d) return d;
    }
    return null;
  }

  function routeWithGap(count, obstacles, gap) {
    const rows = Math.ceil((count * H) / CELL);
    const size = COLS * rows;
    const unsafe = new Uint8Array(size); // cells the line may not enter
    obstacles.forEach((r) => {
      const c0 = Math.max(0, colOf(r.x - gap));
      const c1 = Math.min(COLS - 1, colOf(r.x + r.w + gap));
      const r0 = Math.max(0, Math.floor((r.y - gap) / CELL));
      const r1 = Math.min(rows - 1, Math.floor((r.y + r.h + gap) / CELL));
      for (let row = r0; row <= r1; row++) for (let col = c0; col <= c1; col++) unsafe[row * COLS + col] = 1;
    });

    // Distance (in cells) from each cell to the nearest unsafe cell
    const dist = new Float32Array(size).fill(Infinity);
    const queue = [];
    for (let i = 0; i < size; i++) if (unsafe[i]) { dist[i] = 0; queue.push(i); }
    for (let q = 0; q < queue.length; q++) {
      const i = queue[q];
      const row = Math.floor(i / COLS);
      const col = i % COLS;
      [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dc, dr]) => {
        const c = col + dc;
        const r = row + dr;
        if (c < 0 || c >= COLS || r < 0 || r >= rows) return;
        const j = r * COLS + c;
        if (dist[j] > dist[i] + 1) { dist[j] = dist[i] + 1; queue.push(j); }
      });
    }

    // Nearest open, on-screen cell to a point, favouring roomy ones
    function nearestFree(x, y) {
      const col0 = clampInt(colOf(x), 0, COLS - 1);
      const row0 = clampInt(Math.round(y / CELL), 0, rows - 1);
      let best = -1;
      let bestScore = Infinity;
      for (let i = 0; i < size; i++) {
        const x = xOf(i % COLS);
        if (unsafe[i] || x < CELL || x > W - CELL) continue;
        const score = Math.hypot(i % COLS - col0, (Math.floor(i / COLS) - row0) * 1.5) - Math.min(dist[i], 6);
        if (score < bestScore) { bestScore = score; best = i; }
      }
      return best;
    }

    // A* between two cells. Moving up is allowed but expensive, so the line keeps
    // heading down the deck (which is the direction it draws in).
    const MOVES = [[0, 1, 1], [-1, 1, 1.41], [1, 1, 1.41], [-1, 0, 1], [1, 0, 1], [0, -1, 6], [-1, -1, 6], [1, -1, 6]];
    function search(from, to) {
      const tc = to % COLS;
      const tr = Math.floor(to / COLS);
      const g = new Float32Array(size).fill(Infinity);
      const prev = new Int32Array(size).fill(-1);
      const done = new Uint8Array(size);
      const heap = new MinHeap();
      g[from] = 0;
      heap.push(from, 0);
      while (heap.size) {
        const i = heap.pop();
        if (done[i]) continue; // already settled via a cheaper entry
        done[i] = 1;
        if (i === to) break;
        const col = i % COLS;
        const row = Math.floor(i / COLS);
        for (const [dc, dr, step] of MOVES) {
          const c = col + dc;
          const r = row + dr;
          if (c < 0 || c >= COLS || r < 0 || r >= rows) continue;
          const j = r * COLS + c;
          if (unsafe[j]) continue;
          const tight = Math.max(0, ROOM - dist[j]) / ROOM; // 0 = roomy, 1 = squeezed
          const x = xOf(c);
          const outOfFrame = x < 0 || x > W ? 1.5 : 0;
          const cost = g[i] + step * (1 + 4 * tight * tight + outOfFrame);
          if (cost < g[j]) {
            g[j] = cost;
            prev[j] = i;
            heap.push(j, cost + Math.hypot(c - tc, r - tr));
          }
        }
      }
      if (g[to] === Infinity) return null;
      const cells = [];
      for (let i = to; i !== -1; i = prev[i]) cells.push(i);
      return cells.reverse().map((i) => [xOf(i % COLS), (Math.floor(i / COLS) + 0.5) * CELL]);
    }

    const isClear = ([x, y]) => {
      const col = colOf(x);
      const row = Math.floor(y / CELL);
      return col >= 0 && col < COLS && row >= 0 && row < rows && !unsafe[row * COLS + col];
    };

    // Waypoints: start high on the left of slide 1, then alternate sides through the
    // middle of each slide, and finish low in the middle of the last slide
    const goals = [[W * 0.15, H * 0.3]];
    for (let i = 0; i < count; i++) goals.push([i % 2 === 0 ? W * 0.85 : W * 0.15, i * H + H * 0.6]);
    goals.push([W * 0.5, (count - 1) * H + H * 0.85]);
    const stops = goals.map(([x, y]) => nearestFree(x, y)).filter((s, k, all) => k === 0 || s !== all[k - 1]);
    if (stops.includes(-1)) return null;

    // Route each stretch, and give each the strongest smoothing it can take on its own
    const legs = [];
    for (let k = 1; k < stops.length; k++) {
      const points = search(stops[k - 1], stops[k]);
      if (!points) return null;
      let level = TOLERANCES.findIndex((t) => smooth(t ? simplify(points, t) : points).samples.every(isClear));
      if (level === -1) level = TOLERANCES.length - 1;
      legs.push({ points, level });
    }

    // Join the stretches into one curve. Where the curve bulges into content near a join,
    // ease off the smoothing on just the stretches involved, and try again.
    for (let attempt = 0; attempt < TOLERANCES.length * legs.length; attempt++) {
      let joined = [];
      const legOf = []; // which stretch each joined point came from
      legs.forEach((leg, k) => {
        const t = TOLERANCES[leg.level];
        const part = t ? simplify(leg.points, t) : leg.points;
        (k === 0 ? part : part.slice(1)).forEach((pt) => { joined.push(pt); legOf.push(k); });
      });
      const curve = smooth(joined);
      const bad = new Set();
      curve.samples.forEach((pt) => {
        if (isClear(pt)) return;
        const k = legOf[Math.min(pt[2] + 1, legOf.length - 1)]; // the stretch this curve piece ends in
        bad.add(k);
        if (k > 0) bad.add(k - 1);
      });
      if (!bad.size) return curve.d;
      let eased = false;
      bad.forEach((k) => {
        if (legs[k].level < TOLERANCES.length - 1) { legs[k].level++; eased = true; }
      });
      if (!eased) return null;
    }
    return null;
  }

  // Drop points that barely change the line's shape (Ramer-Douglas-Peucker)
  function simplify(points, tolerance) {
    if (points.length < 3) return points;
    const [ax, ay] = points[0];
    const [bx, by] = points[points.length - 1];
    const len = Math.hypot(bx - ax, by - ay) || 1;
    let far = 0;
    let index = 0;
    for (let i = 1; i < points.length - 1; i++) {
      const [px, py] = points[i];
      const d = Math.abs((bx - ax) * (ay - py) - (ax - px) * (by - ay)) / len;
      if (d > far) { far = d; index = i; }
    }
    if (far <= tolerance) return [points[0], points[points.length - 1]];
    return simplify(points.slice(0, index + 1), tolerance).slice(0, -1).concat(simplify(points.slice(index), tolerance));
  }

  // Curve through the points (Catmull-Rom, written as cubic Beziers).
  // Also returns points sampled along the curve, to check it against content.
  function smooth(points) {
    let d = `M ${points[0][0]} ${points[0][1]}`;
    const samples = [[points[0][0], points[0][1], 0]];
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[Math.max(0, i - 1)];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = points[Math.min(points.length - 1, i + 2)];
      const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
      const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
      d += ` C ${c1[0]} ${c1[1]}, ${c2[0]} ${c2[1]}, ${p2[0]} ${p2[1]}`;
      const steps = Math.max(4, Math.ceil(Math.hypot(p2[0] - p1[0], p2[1] - p1[1])));
      for (let k = 1; k <= steps; k++) {
        const t = k / steps;
        const u = 1 - t;
        samples.push([
          u * u * u * p1[0] + 3 * u * u * t * c1[0] + 3 * u * t * t * c2[0] + t * t * t * p2[0],
          u * u * u * p1[1] + 3 * u * u * t * c1[1] + 3 * u * t * t * c2[1] + t * t * t * p2[1],
          i // which piece of the curve this sample is on
        ]);
      }
    }
    return { d, samples };
  }

  function clampInt(v, lo, hi) {
    return Math.max(lo, Math.min(hi, v));
  }

  class MinHeap {
    constructor() { this.items = []; this.keys = []; }
    get size() { return this.items.length; }
    push(item, key) {
      const a = this.items;
      const k = this.keys;
      let i = a.length;
      a.push(item);
      k.push(key);
      while (i > 0) {
        const p = (i - 1) >> 1;
        if (k[p] <= k[i]) break;
        [a[p], a[i]] = [a[i], a[p]];
        [k[p], k[i]] = [k[i], k[p]];
        i = p;
      }
    }
    pop() {
      const a = this.items;
      const k = this.keys;
      const top = a[0];
      const lastItem = a.pop();
      const lastKey = k.pop();
      if (a.length) {
        a[0] = lastItem;
        k[0] = lastKey;
        let i = 0;
        for (;;) {
          const l = 2 * i + 1;
          const r = l + 1;
          let m = i;
          if (l < a.length && k[l] < k[m]) m = l;
          if (r < a.length && k[r] < k[m]) m = r;
          if (m === i) break;
          [a[m], a[i]] = [a[i], a[m]];
          [k[m], k[i]] = [k[i], k[m]];
          i = m;
        }
      }
      return top;
    }
  }

  // ---- Drawing -------------------------------------------------------------

  // options.obstacles(): content rectangles in strip units (what the route avoids)
  // options.avoid(): screen rectangles to cut the line out of while moving (e.g. the QR code,
  //                  as a safety net mid-transition, so it always stays scannable)
  function mount(container, count, options) {
    const style = window.THREAD_STYLE;
    const svg = document.createElementNS(SVG_NS, "svg");
    svg.setAttribute("class", "thread");
    svg.setAttribute("aria-hidden", "true");
    svg.setAttribute("preserveAspectRatio", "xMidYMin meet");

    // Mask: everything shows except the cut-outs over avoided rectangles
    const mask = document.createElementNS(SVG_NS, "mask");
    mask.setAttribute("id", "thread-mask");
    mask.setAttribute("maskUnits", "userSpaceOnUse");
    ["x", "y"].forEach((a) => mask.setAttribute(a, -10000));
    ["width", "height"].forEach((a) => mask.setAttribute(a, 20000));
    const showAll = document.createElementNS(SVG_NS, "rect");
    ["x", "y"].forEach((a) => showAll.setAttribute(a, -10000));
    ["width", "height"].forEach((a) => showAll.setAttribute(a, 20000));
    showAll.setAttribute("fill", "white");
    mask.append(showAll);
    const defs = document.createElementNS(SVG_NS, "defs");
    defs.append(mask);
    svg.append(defs);
    const cutouts = [];

    const path = document.createElementNS(SVG_NS, "path");
    path.setAttribute("mask", "url(#thread-mask)");
    path.setAttribute("fill", "none");
    path.setAttribute("stroke", style.color);
    path.setAttribute("stroke-width", style.width);
    path.setAttribute("stroke-linecap", "round");
    svg.append(path);
    container.append(svg);

    let total = 0;
    let samples = [];
    let lastPos = 0;

    // (Re)build the path and sample it, so we can find how much of it lies above a given height
    function layout() {
      const d = style.path || route(count, options.obstacles ? options.obstacles() : [], style.clearance);
      // No way through without touching content: hide the thread rather than cross anything
      path.style.display = d ? "" : "none";
      path.setAttribute("d", d || "M 0 0");
      total = path.getTotalLength();
      samples = [];
      if (d) for (let k = 0; k <= 1000; k++) samples.push({ l: (total * k) / 1000, y: path.getPointAtLength((total * k) / 1000).y });
      path.style.strokeDasharray = `${total} ${total}`;
      update(lastPos);
    }

    function lengthAbove(y) {
      const i = samples.findIndex((s) => s.y > y);
      return i === -1 ? total : samples[i].l;
    }

    // pos: the deck's position in slides (0 = first slide, may be fractional mid-move)
    function update(pos) {
      lastPos = pos;
      svg.setAttribute("viewBox", `0 ${pos * H} ${W} ${H}`);
      path.style.strokeDashoffset = total - lengthAbove((pos + style.drawTo) * H);
      updateCutouts(pos);
    }

    // Convert each avoided screen rectangle into strip units and cut it out of the mask
    function updateCutouts(pos) {
      const rects = options.avoid ? options.avoid() : [];
      const box = svg.getBoundingClientRect();
      const scale = W / box.width;
      const pad = 2; // breathing room around the avoided area, in slide units
      rects.forEach((r, i) => {
        if (!cutouts[i]) {
          cutouts[i] = document.createElementNS(SVG_NS, "rect");
          cutouts[i].setAttribute("fill", "black");
          mask.append(cutouts[i]);
        }
        cutouts[i].setAttribute("x", (r.left - box.left) * scale - pad);
        cutouts[i].setAttribute("y", pos * H + (r.top - box.top) * scale - pad);
        cutouts[i].setAttribute("width", r.width * scale + pad * 2);
        cutouts[i].setAttribute("height", r.height * scale + pad * 2);
        cutouts[i].style.display = "";
      });
      cutouts.slice(rects.length).forEach((c) => { c.style.display = "none"; });
    }

    layout();
    return { update, layout };
  }

  return { mount };
})();

// Story thread: one continuous line that runs through the whole deck and draws itself
// as the deck moves, tying the slides together into one story (inspired by lusion.co).
//
// Picture the slides stacked top to bottom as one tall strip. Each slide is a
// 160 x 90 box in that strip (16:9), so slide i covers y = i*90 to (i+1)*90.
// The thread is a path drawn in that strip; the screen is a camera that moves
// down it as the deck moves.
//
// Color, width and path should come from /design. Until then these are neutral
// placeholders: a thin gray line that weaves left and right through each slide.

window.THREAD_STYLE = {
  color: "#9a9a9a", // [TBD: from /design]
  width: 0.5, // in slide units (a slide is 160 wide)
  path: null, // [TBD: from /design] SVG path data in strip units; null = placeholder weave
  drawTo: 0.75 // how far down the screen the line has drawn itself (0 = top, 1 = bottom)
};

window.StoryThread = (function () {
  const W = 160;
  const H = 90;
  const SVG_NS = "http://www.w3.org/2000/svg";

  // Placeholder path: a smooth S-curve that crosses each slide from side to side
  function weave(count) {
    const xs = [];
    for (let i = 0; i <= count; i++) xs.push(i % 2 === 0 ? W * 0.12 : W * 0.88);
    let d = `M ${xs[0]} ${H * 0.35}`;
    for (let i = 0; i < count; i++) {
      const y0 = i === 0 ? H * 0.35 : i * H;
      const y1 = i === count - 1 ? (count - 1) * H + H * 0.8 : (i + 1) * H;
      const x1 = i === count - 1 ? W / 2 : xs[i + 1];
      const pull = (y1 - y0) * 0.45; // keeps the curve always moving downward
      d += ` C ${xs[i]} ${y0 + pull}, ${x1} ${y1 - pull}, ${x1} ${y1}`;
    }
    return d;
  }

  // avoid(): screen rectangles the thread must not cross (e.g. the QR code, so it stays scannable)
  function mount(container, count, avoid) {
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
    path.setAttribute("d", style.path || weave(count));
    path.setAttribute("fill", "none");
    path.setAttribute("stroke", style.color);
    path.setAttribute("stroke-width", style.width);
    path.setAttribute("stroke-linecap", "round");
    svg.append(path);
    container.append(svg);

    // Sample the path once so we can find how much of it lies above a given height
    const total = path.getTotalLength();
    const samples = [];
    for (let l = 0; l <= total; l += total / 1000) samples.push({ l, y: path.getPointAtLength(l).y });
    path.style.strokeDasharray = `${total} ${total}`;

    function lengthAbove(y) {
      const i = samples.findIndex((s) => s.y > y);
      return i === -1 ? total : samples[i].l;
    }

    // pos: the deck's position in slides (0 = first slide, may be fractional mid-move)
    function update(pos) {
      svg.setAttribute("viewBox", `0 ${pos * H} ${W} ${H}`);
      path.style.strokeDashoffset = total - lengthAbove((pos + style.drawTo) * H);
      updateCutouts(pos);
    }

    // Convert each avoided screen rectangle into strip units and cut it out of the mask
    function updateCutouts(pos) {
      const rects = avoid ? avoid() : [];
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

    return { update };
  }

  return { mount };
})();

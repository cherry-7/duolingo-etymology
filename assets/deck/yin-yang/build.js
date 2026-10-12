// Builds yin-yang.svg: Mula hops into Dulo's hug and their dresses merge into the yin-yang
// (Michelle's drawings: before-source.svg "going into hug", after-source.svg "merged").
// Every shape of the before drawing reshapes into its match in the after drawing (flubber);
// the result is baked into one self-contained SVG (SMIL for the shapes, CSS for the hop and
// the breathing), like idle-think.svg. Plays once, then holds the yin-yang and breathes.
// Run: node assets/deck/yin-yang/build.js
const fs = require("fs");
const path = require("path");
const flubber = require("./lib/flubber.min.js") // build-time only (MIT);
const pc = require("./lib/polygon-clipping.min.js"); // build-time only (MIT)

const here = __dirname;
const SEG = 3; // max segment length when shapes are turned into points (px)

// Hair and clothes snap to the Mula/Dulo palette (the tracer's near-miss shades)
const PALETTE = {
  "#6B4331": "#6E4533", "#6B4433": "#6E4533",
  "#5A86DA": "#638CD9", "#5F85D5": "#638CD9",
  "#76CFFB": "#87D2FB", "#7FCEFA": "#87D2FB"
};

// The after drawing sits here in the before drawing's frame (Dulo stays about where she is)
const O = [240, 44];
const VIEW = [0, 0, 1360, 1200];

// ---- Timeline (seconds) ----------------------------------------------------------------
const T = {
  crouch: [0.4, 0.75], // Mula bends down and leans back, ready to hop
  hop: [0.75, 1.2], // she hops toward Dulo (arc), lands with a squash
  morph: [1.05, 1.55], // the shapes become the hug and the yin-yang
  settle: [1.45, 1.85], // both squash on the hug and settle
  breathe: 1.9 // then they hold the yin-yang and breathe
};
const HOP = 120; // how far Mula travels while hopping, about as far as her head goes (the morph brings her feet)
const PIVOT = [370, 1140]; // Mula's feet (before drawing)

// ---- Shapes ----------------------------------------------------------------------------
function read(file, shift) {
  const s = fs.readFileSync(path.join(here, file), "utf8");
  const out = [];
  for (const m of s.matchAll(/<path ([^>]*)>/g)) {
    const a = m[1];
    const id = a.match(/id="([^"]+)"/)[1].replace("Vector_", "").replace(/^Vector$/, "1");
    const d = a.match(/ d="([^"]+)"/)[1];
    let fill = a.match(/fill="([^"]+)"/)[1].toUpperCase();
    fill = PALETTE[fill] || fill;
    // a path with two islands becomes two shapes (a, b)
    const rings = d.split(/(?=M)/).map((x) => x.trim()).filter(Boolean);
    rings.forEach((r, i) => out.push({ id: id + (rings.length > 1 ? "ab"[i] : ""), d: r, fill, z: out.length }));
  }
  out.forEach((p) => {
    p.ring = flubber.interpolate(p.d, p.d, { string: false, maxSegmentLength: SEG })(0).map(([x, y]) => [x + shift[0], y + shift[1]]);
    if (shift[0] || shift[1]) p.d = toD(p.ring);
  });
  return Object.fromEntries(out.map((p) => [p.id, p]));
}
const toD = (ring) => "M" + ring.map(([x, y]) => x.toFixed(1) + " " + y.toFixed(1)).join("L") + "Z";
const area = (r) => Math.abs(r.reduce((s, [x, y], i) => { const [u, v] = r[(i + 1) % r.length]; return s + x * v - u * y; }, 0) / 2);
const centroid = (r) => r.reduce(([sx, sy], [x, y]) => [sx + x / r.length, sy + y / r.length], [0, 0]);
const move = (r, dx, dy) => r.map(([x, y]) => [x + dx, y + dy]);
// largest outer ring of a clipping result
const biggest = (multi) => {
  const rings = multi.map((poly) => poly[0]).sort((a, b) => area(b) - area(a));
  return rings[0].slice(0, -1);
};
// a cut must not drop a real piece (an island bigger than a sliver)
const keepAll = (name, multi) => {
  const lost = multi.map((poly) => poly[0]).sort((a, b) => area(b) - area(a)).slice(1).filter((r) => area(r) > 200);
  if (lost.length) throw new Error(name + " drops " + lost.map((r) => area(r) | 0).join(", ") + " px of shape");
};
const clip = (r, cut) => biggest(pc.intersection([closed(r)], [closed(cut)]));
const minus = (r, ...cuts) => biggest(pc.difference([closed(r)], ...cuts.map((c) => [closed(c)])));
const closed = (r) => [...r, r[0]];

const B = read("before-source.svg", [0, 0]);
const A = read("after-source.svg", O);

// The tracer merged some shapes in the after drawing; cut them back apart (after coordinates
// + O). Hair (the brown layer under both girls): Mula's (left) and Dulo's. Faces: Mula's, Dulo's, and Dulo's hand on Mula's shoulder.
const [ox, oy] = O;
const at = (pts) => pts.map(([x, y]) => [x + ox, y + oy]);
const MULA_HAIR = at([[0, 0], [530, 0], [548, 215], [598, 330], [598, 700], [0, 1148]]);
const MULA_FACE = at([[0, 0], [596, 0], [600, 330], [572, 482], [572, 1148], [0, 1148]]); // her chin too
const DULO_HAND = at([[290, 504], [425, 504], [425, 640], [290, 640]]); // below Mula's chin, so her cheek stays with her face
const split = (id, name, ring) => { A[name] = Object.assign({}, A[id], { id: name, ring, d: toD(ring), z: A[id].z + 0.01 * Object.keys(A).length }); };
const check = (name, multi) => { keepAll(name, multi); return biggest(multi); };
const cut = (r, keep, ...drop) => pc.difference(pc.intersection([closed(r)], [closed(keep)]), ...drop.map((c) => [closed(c)]));
split("1a", "hairMula", clip(A["1a"].ring, MULA_HAIR));
split("1a", "hairDulo", check("hairDulo", pc.difference([closed(A["1a"].ring)], [closed(A.hairMula.ring)]))); // keeps the bun the cut line clips
const EVERYTHING = [[-9999, -9999], [9999, -9999], [9999, 9999], [-9999, 9999]];
split("13", "handDulo", check("handDulo", cut(A["13"].ring, DULO_HAND)));
split("13", "faceMula", check("faceMula", cut(A["13"].ring, MULA_FACE, DULO_HAND)));
split("13", "faceDulo", check("faceDulo", cut(A["13"].ring, EVERYTHING, MULA_FACE, DULO_HAND)));

// The after drawing has five hands; the one at Dulo's waist goes (Michelle's call, "D")
delete A["10"];
delete A["11"]; // the bit of hair that showed beside that hand; without it, it's just a spot on her dress

// Mula's open mouth keeps its colours from the before drawing (the after one has it brown)
A["24"].fill = B["31"].fill;
A["25"].fill = B["32"].fill;

// Mula's shapes in the before drawing (they hop); everything else is Dulo's
const MULA = new Set(["20", "21", "22", "23", "24", "25", "26", "27", "28", "29", "30", "31", "32", "33", "34",
  "35", "36", "37", "38", "39", "43", "44", "45", "46", "49"]);

// ---- What becomes what (before -> after) -----------------------------------------------
// [from], [to]: one to one, many into one (combine), one into many (separate);
// nothing -> shape grows in; shape -> nothing shrinks away.
const MAP = [
  // hair
  [["1"], ["hairDulo"]], [["20"], ["hairMula"]],
  // the little bits of hair showing between arms and bodies would slide across the dresses:
  // the old ones close up early, the new ones open late
  [["5"], []], [["6"], []], [["7"], []], [["26"], []], [["37"], []], [[], ["23"]], [[], ["1b"]], [[], ["5"]],
  // clothes: the dresses become the yin and the yang. Dulo's light sash becomes the light dot in
  // her dark half, Mula's dark scarf the dark dot in her light half.
  [["2", "40", "46"], ["2a"]], [[], ["2b"]], [["3"], ["12"]], [["24"], ["6"]], [["35", "22"], ["3"]],
  [["25"], []], [["38"], []], [["39"], []],
  // skin: faces, ears, hands (Mula's reaching hand wraps round Dulo's far shoulder, Dulo's lands on
  // Mula's shoulder), legs
  [["21"], ["faceMula"]], [["8"], ["faceDulo"]], [["4"], ["handDulo"]], [["23"], ["9"]], [["36"], ["4"]],
  [["50"], ["8"]], [["18"], ["31", "32"]], [["11"], []], [["19"], ["30"]], [["34"], ["33"]],
  [["47", "48"], ["7"]], [["45"], ["37"]], [["49"], ["38"]],
  // eyes, lids, noses, mouths
  [["27"], ["17"]], [["28"], ["18"]], [["29"], ["19"]], [["30"], ["20"]],
  [["13"], ["14"]], [["14"], ["16"]], [["9"], ["21"]], [["12"], ["22"]], [["15"], ["15"]], [["10"], ["29"]],
  [["16"], ["26"]], [["33"], ["28"]], [["17"], ["27"]], [["31"], ["24"]], [["32"], ["25"]],
  // boots
  [["41", "42"], ["34"]], [["43"], ["36"]], [["44"], ["35"]], [[], ["39"]]
];
// shapes that shrink away sit just above what they lie on
const SHRINK_Z = { "25": "3", "38": "3", "39": "3", "11": "21", "5": "2a", "6": "2a", "7": "2a", "26": "faceMula", "37": "3" };

// check every shape is used exactly once
const used = { B: {}, A: {} };
MAP.forEach(([f, t]) => { f.forEach((i) => (used.B[i] = (used.B[i] || 0) + 1)); t.forEach((i) => (used.A[i] = (used.A[i] || 0) + 1)); });
for (const id in B) if (used.B[id] !== 1) throw new Error("before " + id + " used " + (used.B[id] || 0));
for (const id in A) if (!["1a", "13"].includes(id) && used.A[id] !== 1) throw new Error("after " + id + " used " + (used.A[id] || 0));

// ---- Morphs ----------------------------------------------------------------------------
// Each piece: start ring (where it is in the before drawing), end ring (in the after drawing,
// minus Mula's hop for her pieces), fills, z, whose it is.
const pieces = [];
MAP.forEach(([from, to]) => {
  const src = from.map((id) => B[id]);
  const dst = to.map((id) => A[id]);
  // Mula's pieces are matched from where she lands
  const landed = (p) => (MULA.has(p.id) ? move(p.ring, HOP, 0) : p.ring);
  const add = (s, d, a, b) => {
    const mula = MULA.has(s.id);
    pieces.push({ from: s.id, to: d.id, a: mula ? move(a, -HOP, 0) : a, b: mula ? move(b, -HOP, 0) : b, fillA: s.fill, fillB: d.fill, z: d.z, mula });
  };
  const opts = { string: false, maxSegmentLength: SEG };
  if (src.length === 1 && dst.length === 1) {
    const f = flubber.interpolate(landed(src[0]), dst[0].ring, opts);
    add(src[0], dst[0], f(0), f(1));
  } else if (src.length > 1 && dst.length === 1) {
    // many into one: each becomes the whole shape (they overlap, so no cracks open between them)
    src.forEach((s) => { const f = flubber.interpolate(landed(s), dst[0].ring, opts); add(s, dst[0], f(0), f(1)); });
  } else if (src.length === 1 && dst.length > 1) {
    // one into many: a copy of it becomes each
    dst.forEach((d) => { const f = flubber.interpolate(landed(src[0]), d.ring, opts); add(src[0], d, f(0), f(1)); });
  } else if (!src.length) {
    dst.forEach((d) => pieces.push({ grow: true, to: d.id, b: d.ring, fillB: d.fill, z: d.z }));
  } else {
    src.forEach((s) => pieces.push({ shrink: true, from: s.id, a: s.ring, fillA: s.fill, z: A[SHRINK_Z[s.id]].z + 0.5, mula: MULA.has(s.id) }));
  }
});
// The cut-apart hair and faces leave hairline seams where the pieces meet: the uncut shapes
// lie under them, fading in as the merge ends
["1a", "13"].forEach((id) => pieces.push({ under: true, to: id, b: A[id].ring, fillB: A[id].fill, z: A[id].z }));
pieces.sort((p, q) => p.z - q.z);

// The pieces are stacked in the after drawing's order. Where that differs from the before
// drawing's order, cut what lay on top out of each start shape, so the first frame is exactly
// the before drawing; the cut part fills back in as it morphs.
const polyArea = (multi) => multi.reduce((s, poly) => s + area(poly[0]) - poly.slice(1).reduce((h, r) => h + area(r), 0), 0);
pieces.forEach((q, qi) => {
  if (q.grow || q.under) return;
  const qz = B[q.from].z;
  const above = pieces.filter((p, pi) => pi > qi ? false : !p.grow && !p.under && B[p.from].z > qz); // drawn under q now, over it before
  above.forEach((p) => {
    const pa = p.a; // both still where they start (Mula hasn't hopped yet)
    const overlap = pc.intersection([closed(q.a)], [closed(pa)]);
    if (polyArea(overlap) < 4) return;
    const rest = pc.difference([closed(q.a)], [closed(pa)]);
    const holes = rest.some((poly) => poly.length > 1);
    console.log("cut", q.from, "under", p.from, "overlap", polyArea(overlap) | 0, "pieces", rest.length, holes ? "HOLES" : "");
    q.cuts = (q.cuts || []).concat([p.from]);
    if (!holes) q.a = biggest(rest);
  });
});

// ---- SVG -------------------------------------------------------------------------------
const s = (x) => x.toFixed(3) + "s";
const FILL_AT = [T.morph[0] + (T.morph[1] - T.morph[0]) * 0.25, T.morph[1] - (T.morph[1] - T.morph[0]) * 0.2];
const span = ([a, b]) => `begin="${s(a)}" dur="${s(b - a)}"`;
const EASE = 'calcMode="spline" keyTimes="0;1" keySplines="0.45 0 0.2 1"';
// Blinks once they're holding the yin-yang, like the deck's idle blink: each eye (white and
// pupil) squeezes shut about the white's centre; Dulo's tinted lids go away while it's shut.
// Mula every 4.2s, Dulo every 5.3s, so never together.
const EYE = {
  "17": "mula", "18": ["mula", "17"], "19": "mula", "20": ["mula", "19"],
  "14": "dulo", "16": ["dulo", "14"], "21": "dulo", "22": ["dulo", "21"]
};
const LID = { "15": "dulo", "29": "dulo" };
const blink = (p, svg) => {
  const eye = EYE[p.to];
  if (eye) {
    const [who, white] = Array.isArray(eye) ? eye : [eye, p.to];
    const [cx, cy] = centroid(A[white].ring);
    return `<g class="blink blink-${who}" style="transform-origin:${cx.toFixed(1)}px ${cy.toFixed(1)}px">${svg}</g>`;
  }
  if (LID[p.to]) return `<g class="blink-lid">${svg}</g>`;
  return svg;
};
const body = pieces.map((p) => blink(p, (() => {
  const cls = p.mula ? ' class="mula"' : "";
  // only at the very end, once the pieces are in place, so it never shows as a ghost
  if (p.under) return `<path d="${toD(p.b)}" fill="${p.fillB}" opacity="0"><animate attributeName="opacity" values="0;1" ${span([T.morph[1] - 0.08, T.morph[1]])} fill="freeze"/></path>`;
  if (p.grow || p.shrink) {
    const r = p.grow ? p.b : p.a;
    const [cx, cy] = centroid(r);
    const anim = p.grow ? "grow" : "shrink";
    return `<g${cls}><path class="${anim}" style="transform-origin:${cx.toFixed(1)}px ${cy.toFixed(1)}px" d="${toD(r)}" fill="${p.grow ? p.fillB : p.fillA}"/></g>`;
  }
  const fill = p.fillA === p.fillB ? "" : `<animate attributeName="fill" values="${p.fillA};${p.fillB}" ${span(T.morph)} fill="freeze" ${EASE}/>`;
  return `<path${cls} d="${toD(p.a)}" fill="${p.fillA}"><animate attributeName="d" values="${toD(p.a)};${toD(p.b)}" ${span(T.morph)} fill="freeze" ${EASE}/>${fill}</path>`;
})())).join("\n");

// Mula's hop as CSS keyframes over the crouch + hop; Mula's pieces share it
const total = T.hop[1] + 0.2;
const pct = (t) => ((t / total) * 100).toFixed(2) + "%";
const [c0, c1] = T.crouch;
const [h0, h1] = T.hop;
const hm = (h0 + h1) / 2;
const ground = [PIVOT[0] + HOP / 2 + 150, PIVOT[1]];
const MH = (T.morph[1] - T.morph[0]) * 0.6;
const css = `
.mula { transform-box: view-box; transform-origin: ${PIVOT[0]}px ${PIVOT[1]}px; animation: hop ${s(total)} linear forwards; }
@keyframes hop {
  0%, ${pct(c0)} { transform: none; animation-timing-function: ease-out; }
  ${pct(c1)} { transform: rotate(-5deg) scale(1.05, 0.9); animation-timing-function: ease-out; }
  ${pct(hm)} { transform: translate(${HOP / 2}px, -90px) rotate(6deg) scale(0.96, 1.06); animation-timing-function: ease-in; }
  ${pct(h1)} { transform: translate(${HOP}px, 0) scale(1.05, 0.93); animation-timing-function: ease-out; }
  100% { transform: translate(${HOP}px, 0); }
}
/* what disappears closes as the morph starts, what's new opens in its second half */
.grow, .shrink { transform-box: view-box; animation: ${s(MH)} both; }
.shrink { animation-name: shrink; animation-delay: ${s(T.morph[0])}; animation-duration: 0.15s; animation-timing-function: ease-in; }
.grow { animation-name: grow; animation-delay: ${s(T.morph[0] + MH)}; animation-timing-function: ease-out; }
@keyframes grow { from { transform: scale(0); } 70% { transform: scale(1.12); } to { transform: none; } }
@keyframes shrink { from { transform: none; } to { transform: scale(0); } }
/* the hug lands: both squash a little and settle, then breathe */
.settle { transform-box: view-box; transform-origin: ${ground[0]}px ${ground[1]}px; animation: settle ${s(T.settle[1] - T.settle[0])} ease-out ${s(T.settle[0])} both; }
@keyframes settle { from { transform: none; } 35% { transform: scale(1.03, 0.96); } to { transform: none; } }
.breathe { transform-box: view-box; transform-origin: ${ground[0]}px ${ground[1]}px; animation: breathe 2.6s ease-in-out ${s(T.breathe)} infinite; }
@keyframes breathe { 0%, 100% { transform: none; } 45% { transform: scale(1, 1.012); } }
.blink { transform-box: view-box; animation: blink var(--every) linear ${s(T.breathe)} infinite; }
.blink-mula { --every: 4.2s; }
.blink-dulo, .blink-lid { --every: 5.3s; }
.blink-lid { animation: blink-lid var(--every) linear ${s(T.breathe)} infinite; }
@keyframes blink { 0%, 93% { transform: none; } 95.5% { transform: scale(1, 0.08); } 98%, 100% { transform: none; } }
@keyframes blink-lid { 0%, 93.5% { opacity: 1; } 95%, 96.5% { opacity: 0; } 98%, 100% { opacity: 1; } }
/* reduced motion: just the finished yin-yang */
.still { display: none; }
@media (prefers-reduced-motion: reduce) { .live { display: none; } .still { display: inline; } }
`;

// Fillers: the finished yin and yang under everything, fading in during the
// merge, so no gap opens between the dresses while they reshape; they only ever show inside
// the final outline
const fillers = ["2a", "3"].map((id) =>
  `<path d="${A[id].d}" fill="${A[id].fill}" opacity="0"><animate attributeName="opacity" values="0;1" ${span(FILL_AT)} fill="freeze"/></path>`).join("\n");

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${VIEW.join(" ")}" width="${VIEW[2]}" height="${VIEW[3]}" fill="none">
<!-- Generated by build.js from before-source.svg and after-source.svg; edit those, not this -->
<style>${css}</style>
<g class="live"><g class="settle"><g class="breathe">
${fillers}
${body}
</g></g></g>
<g class="still">
${Object.values(A).sort((p, q) => p.z - q.z).map((p) => `<path d="${p.d}" fill="${p.fill}"/>`).join("\n")}
</g>
</svg>
`;
fs.writeFileSync(path.join(here, "yin-yang.svg"), svg);
if (process.argv.includes("--debug")) {
  // the cut-apart after shapes, in colours, over the whole after drawing
  const show = { hairMula: "#e33", hairDulo: "#33e", faceMula: "#e93", faceDulo: "#3c9", handDulo: "#c3c" };
  const dbg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${VIEW.join(" ")}">` +
    Object.values(A).map((p) => `<path d="${toD(p.ring)}" fill="${p.fill}" opacity="0.35"/>`).join("") +
    Object.entries(show).map(([id, c]) => `<path d="${A[id].d}" fill="${c}" opacity="0.8"/>`).join("") + "</svg>";
  fs.writeFileSync(path.join(here, "debug.svg"), dbg);
}
console.log("pieces", pieces.length, "bytes", svg.length);

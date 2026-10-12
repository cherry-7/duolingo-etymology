// Builds scared.svg, the incorrect-answer loop, from Michelle's drawing (source.svg):
// Mula is anxious (feet tapping quickly, body and shoulders shaking, eyes darting side to side);
// Dulo is disappointed (head shaking side to side, foot tapping now and then).
// Every shape keeps its place in the drawing's layer order; each one that moves gets its
// motion as a CSS class, so the result is one self-contained SVG, like idle-think.svg.
// Run: node assets/deck/scared/build.js
const fs = require("fs");
const path = require("path");

const here = __dirname;
const src = fs.readFileSync(path.join(here, "source.svg"), "utf8");
const VIEW = src.match(/viewBox="([^"]+)"/)[1];

// Hair and clothes snap to the Mula/Dulo palette (the tracer's near-miss shades)
const PALETTE = { "#6D4433": "#6E4533", "#79CAF7": "#87D2FB", "#5A80D2": "#638CD9" };

const shapes = [...src.matchAll(/<path ([^>]*)>/g)].map((m) => {
  const a = m[1];
  const id = a.match(/id="([^"]+)"/)[1].replace("Vector_", "").replace(/^Vector$/, "1");
  const d = a.match(/ d="([^"]+)"/)[1];
  const fill = a.match(/fill="([^"]+)"/)[1].toUpperCase();
  return { id, d, fill: PALETTE[fill] || fill };
});

// ---- Who moves how -----------------------------------------------------------------------
const set = (s) => new Set(s.split(" "));
// Mula: her body and shoulders (dress, sleeves, scarf, hands) tremble; her head stays, and her
// pupils dart side to side
const MULA_BODY = set("3 4 5 6 7 8 9 10 11");
const MULA_PUPILS = { "13": "12", "16": "15" }; // pupil -> its eye white
// Mula's boots and legs sit under her dress (drawn before it, boots first, as in the drawing),
// so the hem covers the tops of her legs as she taps
const UNDER_DRESS = ["45", "50", "46", "47", "52"];
// Mula's raised leg and boot tap; the marks beside it flash on each tap
const MULA_LEG = set("46 47"); // her raised leg: swings down from the hip and stretches a little
const MULA_BOOT = set("45"); // ...so the boot at its end reaches the ground
const MULA_MARKS = set("53 56 57");
// Dulo: her head (face, eyes, the hand on her face, ears) shakes about her neck
const DULO_HEAD = set("23 24 25 26 27 28 29 30 31 32 33 34 35 36 37 38 41 42");
const DULO_TAP = set("49");
const DULO_MARKS = set("54 55");

// The brown layer under both girls is one traced shape, cut exactly (no overlaps) into Mula's
// part (shakes with her), Dulo's head part (turns with her head) and the rest (stays). The cuts
// meet the outline only where there's background between the girls. Under all three lies a copy
// shrunk 12 units in from every edge: it fills the seams as the parts move, and never reaches
// the outline, so no edge shows twice.
// Dulo's head part: from the gap above Mula's hair, under her ear and along the left edge of her
// face, so the cut is hidden as it turns
const DULO_HEAD_CUT = "M655 0H1312V500H742V385L722 380V318L700 300L655 230Z";
const STAYS = `M-10 -10H1322V1209H-10Z ${DULO_HEAD_CUT}`; // evenodd: all but her head part
const SHRINK = 12;
// The brown layer has two holes: a gap in Dulo's hair (filled with her hair) and the gap between
// her chin, hand and sleeve (filled with skin, her neck, so no brown shows there as she turns)
const SKIN = "#D39C67";

// ---- Motion ------------------------------------------------------------------------------
const NECK = [870, 505]; // Dulo's head turns about here
const MULA_HIP = [500, 840]; // Mula's raised leg swings from here
const TAP = { angle: -18, reach: 58, leg: 100 }; // leg: hip to boot top
const DULO_ANKLE = [935, 965]; // Dulo's raised toe comes down, her boot turning about its top (inside her leg) until the sole is flat
// Dulo's neck and wrist stay put while her head turns: a still copy of the lower part of her
// face and hand lies under the turning one
const NECK_AND_WRIST = "M740 455H960V425H1060V560H740Z"; // a little higher at the wrist
const css = `
.mula-shake { animation: mula-shake 0.2s linear infinite; }
@keyframes mula-shake { 0%, 100% { transform: translate(0, 0); } 25% { transform: translate(-3px, 0.5px); } 75% { transform: translate(3px, -0.5px); } }
.mula-look { animation: mula-look 2.6s ease-in-out infinite; }
@keyframes mula-look { 0%, 12%, 100% { transform: none; } 22%, 42% { transform: translate(-14px, 0); } 56%, 78% { transform: translate(14px, 0); } 90% { transform: none; } }
.mula-leg, .mula-boot { transform-origin: ${MULA_HIP[0]}px ${MULA_HIP[1]}px; animation: 0.36s ease-in-out infinite; }
.mula-leg { animation-name: mula-leg; }
.mula-boot { animation-name: mula-boot; }
@keyframes mula-leg { 0%, 100% { transform: none; } 45% { transform: rotate(${TAP.angle}deg) scale(1, ${1 + TAP.reach / TAP.leg}); } }
@keyframes mula-boot { 0%, 100% { transform: none; } 45% { transform: rotate(${TAP.angle}deg) translate(0, ${TAP.reach}px); } }
.mula-marks { animation: marks 0.36s ease-out infinite; }
.dulo-head { transform-origin: ${NECK[0]}px ${NECK[1]}px; animation: dulo-head 1.8s ease-in-out infinite; }
@keyframes dulo-head { 0%, 100% { transform: none; } 25% { transform: rotate(-2.5deg); } 75% { transform: rotate(2.5deg); } }
/* now and then: two taps, then a rest */
.dulo-tap { transform-origin: ${DULO_ANKLE[0]}px ${DULO_ANKLE[1]}px; animation: dulo-tap 3.2s ease-in-out infinite; }
@keyframes dulo-tap { 0%, 22%, 100% { transform: none; } 5.5%, 16.5% { transform: rotate(15deg); } 11% { transform: none; } }
.dulo-marks { animation: dulo-marks 3.2s ease-out infinite; }
@keyframes dulo-marks { 0%, 4%, 9%, 15%, 20%, 100% { opacity: 0.35; } 5.5%, 16.5% { opacity: 1; } }
@keyframes marks { 0%, 35%, 100% { opacity: 0.35; } 45% { opacity: 1; } }
:is(.mula-shake, .mula-look, .mula-leg, .mula-boot, .mula-marks, .dulo-head, .dulo-tap, .dulo-marks) { transform-box: view-box; }
@media (prefers-reduced-motion: reduce) { * { animation: none !important; } }
`;

// ---- SVG -----------------------------------------------------------------------------------
const clips = [];
const clip = (id, d, rule) => { clips.push(`<clipPath id="${id}" clipPathUnits="userSpaceOnUse"><path d="${d}"${rule ? ` clip-rule="${rule}"` : ""}/></clipPath>`); return `clip-path="url(#${id})"`; };
const draw = (p, under) => {
  const path = (cls = "", extra = "") => `<path${cls ? ` class="${cls}"` : ""} d="${p.d}" fill="${p.fill}"${extra}/>`;
  if (p.id === "1") {
    const [outline, ...holes] = p.d.split(/(?=M)/);
    const neck = holes.find((h) => h.includes("M911") || /^M9\d\d/.test(h));
    p.d = outline;
    clips.push(`<mask id="shrunk" maskUnits="userSpaceOnUse" x="-10" y="-10" width="1332" height="1219"><path d="${p.d}" fill="#fff" stroke="#000" stroke-width="${SHRINK * 2}"/></mask>`);
    return [
      `<path d="${p.d}" fill="${p.fill}" mask="url(#shrunk)"/>`,
      `<g ${clip("stays", STAYS, "evenodd")}>${path()}</g>`,
      `<g class="dulo-head"><g ${clip("dulo-hair", DULO_HEAD_CUT)}>${path()}</g></g>`,
      `<path d="${neck}" fill="${SKIN}"/>`
    ].join("\n");
  }
  if (p.id === "2") return path() + "\n" + UNDER_DRESS.map((id) => draw(shapes.find((q) => q.id === id), true)).join("\n");
  if (UNDER_DRESS.includes(p.id) && !under) return "";
  if (p.id === "23") return `<g ${clip("neck", NECK_AND_WRIST)}>${path()}</g>\n` + path("dulo-head");
  if (MULA_PUPILS[p.id]) {
    // inside the eye white, which shakes with her; the pupil darts within it
    const white = shapes.find((q) => q.id === MULA_PUPILS[p.id]);
    return `<g ${clip("eye-" + p.id, white.d)}>${path("mula-look")}</g>`;
  }
  if (MULA_BODY.has(p.id)) return path("mula-shake");
  if (MULA_LEG.has(p.id)) return path("mula-leg");
  if (MULA_BOOT.has(p.id)) return path("mula-boot");
  if (MULA_MARKS.has(p.id)) return path("mula-marks");
  if (DULO_HEAD.has(p.id)) return path("dulo-head");
  if (DULO_TAP.has(p.id)) return path("dulo-tap");
  if (DULO_MARKS.has(p.id)) return path("dulo-marks");
  return path();
};
const body = shapes.map((p) => draw(p)).join("\n");

const [, , w, h] = VIEW.split(" ");
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${VIEW}" width="${w}" height="${h}" fill="none">
<!-- Generated by build.js from source.svg; edit that, not this -->
<style>${css}</style>
<defs>${clips.join("")}</defs>
${body}
</svg>
`;
fs.writeFileSync(path.join(here, "scared.svg"), svg);
console.log("shapes", shapes.length, "bytes", svg.length);

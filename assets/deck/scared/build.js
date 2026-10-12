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
// Mula: everything above her legs shakes; her pupils also dart side to side
const MULA_BODY = set("2 3 4 5 6 7 8 9 10 11 12 14 15 17 18 39 40");
const MULA_PUPILS = { "13": "12", "16": "15" }; // pupil -> its eye white
// Mula's raised leg and boot tap; the marks beside it flash on each tap
const MULA_LEG = set("46 47"); // her raised leg: swings down from the hip and stretches a little
const MULA_BOOT = set("45"); // ...so the boot at its end reaches the ground
const MULA_MARKS = set("53 56 57");
// Dulo: her head (face, eyes, the hand on her face, ears) shakes about her neck
const DULO_HEAD = set("23 24 25 26 27 28 29 30 31 32 33 34 35 36 37 38 41 42");
const DULO_TAP = set("49");
const DULO_MARKS = set("54 55");

// The brown layer under both girls is one traced shape: Mula's part shakes with her, Dulo's head
// part shakes with her head, the rest stays. Each moving part reaches past the cut into the part
// that stays, so no gap opens along it.
const MULA_HAIR_OUT = "M0 0H655V230L700 300V1199H0Z";
const MULA_HAIR_IN = "M0 0H640V230L680 300V1199H0Z";
const DULO_HEAD_OUT = "M655 0H1312V525H676V300L655 230Z";
const DULO_HEAD_IN = "M655 0H1312V480H700V300L655 230Z"; // above y 300 there's background between them, so no overlap there
const STAYS = `M-10 -10H1322V1209H-10Z ${MULA_HAIR_IN} ${DULO_HEAD_IN}`; // evenodd: all but the inner parts

// ---- Motion ------------------------------------------------------------------------------
const NECK = [870, 505]; // Dulo's head turns about here
const MULA_HIP = [500, 840]; // Mula's raised leg swings from here
const TAP = { angle: -18, reach: 58, leg: 100 }; // leg: hip to boot top
const DULO_ANKLE = [930, 1000]; // Dulo's raised toe comes down, her foot turning at the ankle until the sole is flat
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
@keyframes dulo-head { 0%, 100% { transform: none; } 25% { transform: rotate(-3deg); } 75% { transform: rotate(3deg); } }
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
const body = shapes.map((p) => {
  const path = (cls = "", extra = "") => `<path${cls ? ` class="${cls}"` : ""} d="${p.d}" fill="${p.fill}"${extra}/>`;
  if (p.id === "1") {
    return [
      `<g ${clip("stays", STAYS, "evenodd")}>${path()}</g>`,
      `<g class="mula-shake"><g ${clip("mula-hair", MULA_HAIR_OUT)}>${path()}</g></g>`,
      `<g class="dulo-head"><g ${clip("dulo-hair", DULO_HEAD_OUT)}>${path()}</g></g>`
    ].join("\n");
  }
  if (MULA_PUPILS[p.id]) {
    // inside the eye white, which shakes with her; the pupil darts within it
    const white = shapes.find((q) => q.id === MULA_PUPILS[p.id]);
    return `<g class="mula-shake"><g ${clip("eye-" + p.id, white.d)}>${path("mula-look")}</g></g>`;
  }
  if (MULA_BODY.has(p.id)) return path("mula-shake");
  if (MULA_LEG.has(p.id)) return path("mula-leg");
  if (MULA_BOOT.has(p.id)) return path("mula-boot");
  if (MULA_MARKS.has(p.id)) return path("mula-marks");
  if (DULO_HEAD.has(p.id)) return path("dulo-head");
  if (DULO_TAP.has(p.id)) return path("dulo-tap");
  if (DULO_MARKS.has(p.id)) return path("dulo-marks");
  return path();
}).join("\n");

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

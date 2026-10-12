// Builds talking.svg, the talking/chatting loop, from Michelle's drawing (source.svg):
// both girls' raised arms swing back and forth while their mouths open and close like they're
// talking (out of step with each other, so it reads as a chat).
// Every shape keeps its place in the drawing's layer order; each one that moves gets its
// motion as a CSS class, so the result is one self-contained SVG, like scared.svg.
// Run: node assets/deck/talking/build.js
const fs = require("fs");
const path = require("path");

const here = __dirname;
const src = fs.readFileSync(path.join(here, "source.svg"), "utf8");
const VIEW = src.match(/viewBox="([^"]+)"/)[1];

// Hair and clothes snap to the Mula/Dulo palette (the tracer's near-miss shades)
const PALETTE = { "#674432": "#6E4533", "#7DC8F6": "#87D2FB", "#5D82D4": "#638CD9" };

const shapes = [...src.matchAll(/<path ([^>]*)>/g)].map((m) => {
  const a = m[1];
  const id = a.match(/id="([^"]+)"/)[1].replace("Vector_", "").replace(/^Vector$/, "1");
  const d = a.match(/ d="([^"]+)"/)[1];
  const fill = a.match(/fill="([^"]+)"/)[1].toUpperCase();
  return { id, d, fill: PALETTE[fill] || fill };
});

// ---- Who moves how -----------------------------------------------------------------------
const set = (s) => new Set(s.split(" "));
// Mula: her raised arm (sleeve and hand) swings at the shoulder; her open mouth (lips and
// tongue) closes up toward its flat top edge and opens again
const MULA_ARM = set("43 48");
const MULA_SHOULDER = [328, 560]; // the middle of the sleeve's inner end, so that end barely moves
// a patch of dress under the sleeve's inner end, so no gap opens beside her scarf as it swings
const MULA_SHOULDER_FILL = "M296 542L336 516L345 548L319 608L282 604Z";
const MULA_MOUTH = set("33 34");
const MULA_MOUTH_TOP = [430, 445];
// Dulo: her raised arm swings at the shoulder (the sleeve is cut out of her dress, see below,
// and the hand goes with it); her mouth closes up toward its top
const DULO_HAND = set("51");
const DULO_SHOULDER = [950, 597]; // her armpit, so the arm lifts from there and its underside stays joined
const DULO_MOUTH = set("20");
const DULO_MOUTH_TOP = [867, 431];

// Dulo's sleeve is part of her dress shape (2). It starts at the V in the dress's top edge
// (1019, 572) and at her armpit (948, 596), where the hair under her arm begins; its underside is
// that hair's top edge, out to the cuff. Everything past that joint swings; the dress that stays
// reaches 12 units past the joint, under the sleeve, so nothing opens at the shoulder.
// The underside runs 3 units below the real one (under the hair, hidden at rest), and the still
// dress uses exactly the same underside, so no sliver of it is left along the arm
// (the hair under her arm is drawn over the dress, so the strip below its top edge is hidden at rest)
const UNDERSIDE = "H1220V647L1113 644L1056 653L1014 662L989 640";
const SLEEVE = `M1019 572L1040 470${UNDERSIDE}L946 599Z`;
const SLEEVE_INSET = `M1031 576L1052 470${UNDERSIDE}L958 608Z`; // starts 12 units past the armpit, along the joint
// a sliver of the dress's side shares an edge with the hair under her arm: the still dress
// leaves it out, so its edge never shows once the arm lifts
// (its top follows the inset's underside, so the two holes don't overlap)
const UNDER_ARM = "M1040 659L1056 653H1076V700H1040Z";
const STAYS = `M-10 -10H1227V1122H-10Z ${SLEEVE_INSET} ${UNDER_ARM}`; // evenodd: all but these
// the tracer filled her back hair in behind the whole arm (its outline follows the sleeve's),
// where it would show once the arm lifts: trimmed to the hair's own edge, which comes down at
// x 1046-1057 above and below the arm
const HAIR_UNDER_SLEEVE = "M-10 -10H1227V1122H-10Z M1050 540L1227 470V720H1058L1056 650Z";

// ---- Motion ------------------------------------------------------------------------------
// Mouths: open/close at an uneven, syllable-like pace (1 = open as drawn, 0.15 = closed)
const syllables = (pattern) => pattern.map((v, i) => `${((i / (pattern.length - 1)) * 100).toFixed(1)}% { transform: scale(1, ${v}); }`).join(" ");
const css = `
.mula-arm { transform-origin: ${MULA_SHOULDER[0]}px ${MULA_SHOULDER[1]}px; animation: mula-arm 1.6s ease-in-out infinite; }
@keyframes mula-arm { 0%, 100% { transform: none; } 50% { transform: rotate(-9deg); } }
.dulo-arm { transform-origin: ${DULO_SHOULDER[0]}px ${DULO_SHOULDER[1]}px; animation: dulo-arm 1.9s ease-in-out -0.6s infinite; }
@keyframes dulo-arm { 0%, 100% { transform: none; } 50% { transform: rotate(-8deg); } }
.mula-mouth { transform-origin: ${MULA_MOUTH_TOP[0]}px ${MULA_MOUTH_TOP[1]}px; animation: mula-mouth 1.3s ease-in-out infinite; }
@keyframes mula-mouth { ${syllables([1, 0.2, 0.85, 0.15, 0.6, 1, 0.25, 0.9, 0.2, 1])} }
.dulo-mouth { transform-origin: ${DULO_MOUTH_TOP[0]}px ${DULO_MOUTH_TOP[1]}px; animation: dulo-mouth 1.5s ease-in-out -0.4s infinite; }
@keyframes dulo-mouth { ${syllables([1, 0.3, 0.9, 1, 0.2, 0.7, 0.15, 0.85, 1])} }
:is(.mula-arm, .dulo-arm, .mula-mouth, .dulo-mouth) { transform-box: view-box; }
@media (prefers-reduced-motion: reduce) { * { animation: none !important; } }
`;

// ---- SVG -----------------------------------------------------------------------------------
const clips = [];
const clip = (id, d, rule) => { clips.push(`<clipPath id="${id}" clipPathUnits="userSpaceOnUse"><path d="${d}"${rule ? ` clip-rule="${rule}"` : ""}/></clipPath>`); return `clip-path="url(#${id})"`; };
const body = shapes.map((p) => {
  const path = (cls = "") => `<path${cls ? ` class="${cls}"` : ""} d="${p.d}" fill="${p.fill}"/>`;
  if (p.id === "1") return `<g ${clip("hair", HAIR_UNDER_SLEEVE, "evenodd")}>${path()}</g>`;
  if (p.id === "2") {
    return [
      `<g ${clip("dress-stays", STAYS, "evenodd")}>${path()}</g>`,
      `<g class="dulo-arm"><g ${clip("sleeve", SLEEVE)}>${path()}</g></g>`
    ].join("\n");
  }
  if (p.id === "38") return path() + `\n<path d="${MULA_SHOULDER_FILL}" fill="${p.fill}"/>`;
  if (MULA_ARM.has(p.id)) return path("mula-arm");
  if (MULA_MOUTH.has(p.id)) return path("mula-mouth");
  if (DULO_HAND.has(p.id)) return path("dulo-arm");
  if (DULO_MOUTH.has(p.id)) return path("dulo-mouth");
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
fs.writeFileSync(path.join(here, "talking.svg"), svg);
console.log("shapes", shapes.length, "bytes", svg.length);

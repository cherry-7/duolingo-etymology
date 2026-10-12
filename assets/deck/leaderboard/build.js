// Builds girl.svg, Mula holding the leaderboard sign, from Figma's export (girl-source.svg):
// she breathes (same 2.6s rhythm as the twins' idle) and blinks (every 4.2s, like Mula's idle).
// Her raised hand stays on the sign (a separate image), so that arm turns about the hand as
// her shoulders rise. Every shape keeps its place in the drawing's layer order.
// Run: node assets/deck/leaderboard/build.js
const fs = require("fs");
const path = require("path");

const here = __dirname;
const src = fs.readFileSync(path.join(here, "girl-source.svg"), "utf8");
const VIEW = src.match(/viewBox="([^"]+)"/)[1];
const shapes = [...src.matchAll(/<path\b([^>]*)>/g)].map((m, i) => ({
  i,
  d: m[1].match(/\bd="([^"]+)"/)[1],
  fill: m[1].match(/fill="([^"]+)"/)[1]
}));

// ---- Who moves how (shape index in the export) ---------------------------------------------
// 0 hair, 1 face (its skin also runs under the raised arm), 2 raised sleeve, 3 raised hand,
// 4 5 23 scarf, 6 hair between cheek and sleeve, 7 9 eye whites, 8 10 pupils, 11 12 mouth,
// 13 nose, 14 ear, 15 coat, 16 other hand, 17 hair under that arm, 18 19 buttons, 20-24 legs
const HEAD = new Set([0, 1, 6, 11, 12, 13, 14]);
const BODY = new Set([4, 5, 15, 16, 17, 18, 19, 23]);
const ARM = new Set([2, 3]);
const EYES = { 7: "left", 8: "left", 9: "right", 10: "right" };
const EYE_CENTRE = { left: [306, 280], right: [383, 260] };

const HEM = 589; // the coat stretches up from its hem, so the hem stays on her legs
const SHOULDER_RISE = 5; // at the top of the coat (y 360)
const HEAD_RISE = 6;
const HAND = [485, 318]; // the raised arm turns about the hand on the sign
// ...far enough that its shoulder end (344, 384) rises with the shoulders
const ARM_TURN = ((Math.atan(SHOULDER_RISE / (HAND[0] - 344)) * 180) / Math.PI).toFixed(2);

// The face's and hair's skin under the raised arm (the sleeve's own outline, out past the
// hand) stays with the arm instead of lifting with the head
const SLEEVE_TOP = "M344 384L369 363L363 349L393 336L420 325L436 318L454 309L462 310L477 293";
// past her cheek (x 436) there's no face above the sleeve, so the cut rises clear of it there
// (the outlines curve a little past the sleeve's corners)
const UNDER_ARM = "M344 384L369 363L363 349L393 336L420 325L436 318L441 314L450 240H530V430H330Z";
const NOT_UNDER_ARM = `M-10 -10H874V759H-10Z ${UNDER_ARM}`; // evenodd
// As the head lifts a little more than the arm, a still band of her cheek (and the bit of hair
// beside it) just above the sleeve fills in, so nothing opens up between them
const BAND = `${SLEEVE_TOP}L477 283L436 306L393 324L363 337L355 352L338 372Z`;

// ---- Motion ------------------------------------------------------------------------------
const css = `
.head, .eye-left, .eye-right { animation: breathe-head 2.6s ease-in-out infinite; }
.body { transform-origin: 0 ${HEM}px; animation: breathe-body 2.6s ease-in-out infinite; }
.arm { transform-origin: ${HAND[0]}px ${HAND[1]}px; animation: breathe-arm 2.6s ease-in-out infinite; }
@keyframes breathe-head { 0%, 100% { translate: 0 0; } 50% { translate: 0 -${HEAD_RISE}px; } }
@keyframes breathe-body { 0%, 100% { scale: 1 1; } 45% { scale: 1 ${(1 + SHOULDER_RISE / (HEM - 360)).toFixed(4)}; } }
@keyframes breathe-arm { 0%, 100% { rotate: 0deg; } 45% { rotate: ${ARM_TURN}deg; } }
/* the eye whites and pupils squeeze shut about each eye's centre */
.eye-left { transform-origin: ${EYE_CENTRE.left[0]}px ${EYE_CENTRE.left[1]}px; }
.eye-right { transform-origin: ${EYE_CENTRE.right[0]}px ${EYE_CENTRE.right[1]}px; }
.eye-left, .eye-right { animation: breathe-head 2.6s ease-in-out infinite, blink 4.2s linear infinite; }
@keyframes blink { 0%, 93% { scale: 1 1; } 95.5% { scale: 1 0.08; } 98%, 100% { scale: 1 1; } }
.head, .body, .arm, .eye-left, .eye-right { transform-box: view-box; }
@media (prefers-reduced-motion: reduce) { * { animation: none !important; } }
`;

// ---- SVG -----------------------------------------------------------------------------------
const clips = [];
const clip = (id, d, rule) => {
  clips.push(`<clipPath id="${id}" clipPathUnits="userSpaceOnUse"><path d="${d}"${rule ? ` clip-rule="${rule}"` : ""}/></clipPath>`);
  return `clip-path="url(#${id})"`;
};
const body = shapes.map((p) => {
  const path = (cls = "") => `<path${cls ? ` class="${cls}"` : ""} d="${p.d}" fill="${p.fill}"/>`;
  if (p.i === 1) {
    return [
      `<g ${clip("face-band", BAND)}>${path()}</g>`,
      `<g class="head"><g ${clip("face-head", NOT_UNDER_ARM, "evenodd")}>${path()}</g></g>`
    ].join("\n");
  }
  if (p.i === 0) return `<g class="head"><g ${clip("hair-head", NOT_UNDER_ARM, "evenodd")}>${path()}</g></g>`;
  if (p.i === 2) return `<g class="arm"><g ${clip("face-arm", UNDER_ARM)}><path d="${shapes[1].d}" fill="${shapes[1].fill}"/></g>${path()}</g>`;
  if (p.i === 6) return `<g ${clip("hair-band", BAND)}>${path()}</g>\n` + path("head");
  if (HEAD.has(p.i)) return path("head");
  if (BODY.has(p.i)) return path("body");
  if (ARM.has(p.i)) return path("arm");
  if (EYES[p.i]) return path("eye-" + EYES[p.i]);
  return path();
}).join("\n");

const [, , w, h] = VIEW.split(" ");
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${VIEW}" width="${w}" height="${h}" fill="none">
<!-- Generated by build.js from girl-source.svg; edit that, not this -->
<style>${css}</style>
<defs>${clips.join("")}</defs>
${body}
</svg>
`;
fs.writeFileSync(path.join(here, "girl.svg"), svg);
console.log("shapes", shapes.length, "arm turn", ARM_TURN, "bytes", svg.length);

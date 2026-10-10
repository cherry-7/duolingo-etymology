// All slide content lives here. Order in this array = order in the deck.
//
// Two kinds of slides:
//
// 1. Scene slides (layout "scene"), built from the Figma designs in /design/slides.
//    They share one continuous "world" (deck/world.js): one background color and one set
//    of actors (WORLD_ACTORS below). Each scene slide lists where its actors sit, in
//    Figma's 1920 x 1080 coordinates. Moving between two scene slides, the background
//    fades and every actor on both slides travels to its new spot; actors on only one
//    side enter or exit.
//      bg       background color
//      pace     optional: how fast the deck moves into this slide (1 = normal, lower = slower)
//      ref      the Figma export this slide is built from (deck/?ref shows it as an overlay)
//      actors   { name: placement }
//    A placement has x, y (top-left; for text, the align edge), w (and h for shapes), plus:
//      opacity, rotate, color, draw (lines: 0-1 drawn), width (frame), size/text (text)
//      at       [start, end]: when this actor moves, as fractions of the transition into this slide
//      enter    how it appears if the previous slide doesn't have it: { dx, dy, opacity, draw,
//               width, scale, pop, at } (the offsets it starts from)
//      exit     the same, for disappearing when the next slide doesn't have it
//      walk     hop height (px) while it travels, so characters look like they walk
//
// 2. Regular slides (lineup, finale, leaderboard): one full-screen card each, using the
//    fields below and the transitions in transitions.js. These get rebuilt as scenes in
//    later steps.
//      layout      "lineup" | "finale" | "leaderboard"
//      transition  how this slide arrives from the previous one (see transitions.js)
//      heading     string
//      characters  (lineup only) list of image slots: { src, label, wide }
//      owl, line   (finale only) owl image slot, and the line shown with the QR code
//      limit       (leaderboard only) how many players to show; scores stream live from Firebase
//      qr, line    (leaderboard only) show the demo QR code beside the scores, with this line under it
//
// Image slots: set src to a file path relative to /deck, e.g. "../assets/twins/wave.png".
// If src is null or the file can't load, a gray box with the label is shown instead.
//
// Copy comes from the Figma exports in /design/slides. Where the design has none, it's [TBD].

const CHARACTERS = "../assets/characters/";
const DECK_ART = "../assets/deck/";

// Colors sampled from the Figma exports (Duolingo palette)
const C = {
  orange: "#FF9600",
  yellow: "#FFC800",
  white: "#FFFFFF",
  ink: "#4B4B4B", // bubble text
  shadowOnOrange: "#CA7700",
  shadowOnYellow: "#DA9F00",
  lilac: "#CE82FF",
  purple: "#8A38F5"
};

// Everything that can appear in the world, back to front (z)
window.WORLD_ACTORS = {
  swirlYellow: { type: "path", shape: "swirlOpening", stroke: C.yellow, width: 50, z: 1 },
  swirlOrange: { type: "path", shape: "swirlStory", stroke: C.orange, width: 50, z: 1 },
  title: { type: "text", font: "title", z: 2 },
  shadow: { type: "ellipse", z: 3 },
  saissha: { type: "img", src: DECK_ART + "saissha.png", w: 742, h: 963, z: 4, idle: "breathe" },
  twins: { type: "img", src: DECK_ART + "twins.png", w: 1262, h: 944, z: 5 },
  bubble: { type: "bubble", z: 6 },
  names: { type: "text", font: "condensed", z: 7 },
  frame: { type: "frame", z: 8 },
  // Morphology: a lilac circle opens over the story, then the word splits in two
  wipe: { type: "ellipse", z: 9 },
  panel: { type: "rect", z: 10 },
  divider: { type: "rect", z: 11 },
  morA: { type: "text", font: "heading", letters: true, z: 12 }, // "Mor"
  morB: { type: "text", font: "heading", letters: true, z: 12 }, // "phology"
  hyphenA: { type: "text", font: "heading", z: 12 },
  hyphenB: { type: "text", font: "heading", z: 12 },
  pillA: { type: "pill", z: 13 },
  pillB: { type: "pill", z: 13 }
};

// The lilac circle, fully open: centred on the stage, big enough to cover the corners
const WIPE_OPEN = { x: 960 - 1150, y: 540 - 1150, w: 2300, h: 2300, color: C.lilac };
// Morphology 2 and 3 share the split background (design/slides/Morphology 2.png)
const PANEL = { x: 798, y: 0, w: 1122, h: 1080, color: C.purple };
const DIVIDER = { x: 739, y: 0, w: 67, h: 1080, color: C.yellow };

// User Story layout, shared by its three bubble lines (design/slides/User Story.png)
const storyActors = {
  frame: { width: 50, color: C.orange, enter: { draw: 0, at: [0, 0.75] } },
  swirlOrange: { x: 726.7, y: 113.3, enter: { draw: 0, at: [0.1, 1] } },
  shadow: { x: 1183, y: 935, w: 629, h: 76, color: C.shadowOnYellow, at: [0.1, 0.9] },
  saissha: { x: 107, y: 117, w: 742, enter: { dx: -1000, at: [0.2, 0.8] } },
  twins: { x: 1235, y: 540, w: 590.73, at: [0.1, 0.9], walk: 18 }
};

window.SLIDES = [
  {
    id: "opening",
    layout: "scene",
    ref: "Opening",
    bg: C.orange,
    actors: {
      swirlYellow: { x: 0, y: 0, exit: { draw: 0, at: [0, 0.9] } },
      title: {
        x: 959.5, y: 0, align: "center", size: 260, color: C.white,
        text: "[TBD: title]", // Figma still says "TITLE TITLE"
        exit: { dy: -450, opacity: 0, at: [0, 0.5] }
      },
      shadow: { x: 323, y: 944, w: 1158, h: 149, color: C.shadowOnOrange },
      twins: { x: 329, y: 119, w: 1261.65 },
      names: {
        x: 1828, y: 666, align: "right", size: 48, color: C.white,
        text: "Ame Wang,\nDaniel Thomas,\nMichelle Shen,\nNina Zhang,\nSaissha Jain",
        exit: { dx: 400, opacity: 0, at: [0, 0.4] }
      }
    }
  },
  {
    id: "story",
    layout: "scene",
    ref: "User Story",
    bg: C.yellow,
    pace: 0.25, // a long, cinematic move
    actors: Object.assign({}, storyActors, {
      bubble: {
        x: 794.67, y: 165, w: 835.33, h: 266, size: 100, color: C.ink,
        text: "Hi! My name is Saissha.",
        enter: { scale: 0, pop: true, at: [0.6, 1] }
      }
    })
  },
  {
    id: "story-learning",
    layout: "scene",
    ref: "Group 29",
    bg: C.yellow,
    pace: 0.5,
    actors: Object.assign({}, storyActors, {
      bubble: { x: 794.67, y: 165, size: 80, auto: true, text: "I am learning English right now." }
    })
  },
  {
    id: "story-wish",
    layout: "scene",
    ref: "Group 30",
    bg: C.yellow,
    pace: 0.5,
    actors: Object.assign({}, storyActors, {
      bubble: {
        x: 794.67, y: 165, size: 80, auto: true,
        text: "I can memorise new words, but\nI wish I understood how their\nparts create meaning."
      }
    })
  },
  {
    id: "learner",
    layout: "scene",
    ref: "User Story-1",
    bg: C.yellow,
    pace: 0.3,
    actors: {
      frame: { width: 50, color: C.orange, exit: { draw: 0, at: [0, 0.6] } },
      swirlOrange: { x: -76.6, y: 42.1, exit: { draw: 0, at: [0, 0.7] } },
      shadow: { x: 794, y: 884, w: 1051, h: 127, color: C.shadowOnYellow, exit: { opacity: 0, at: [0, 0.4] } },
      saissha: { x: 107, y: 529.87, w: 424, exit: { dx: -700, at: [0, 0.6] } },
      twins: { x: 854, y: 254.93, w: 971.73, walk: 14, exit: { dx: 1300, at: [0, 0.6] } },
      bubble: {
        x: 181, y: 198, w: 1061.83, h: 195, size: 80, tail: 1, padX: 61, // Figma's text starts with a space
        text: "That's the learner we're teaching for.",
        exit: { scale: 0, at: [0, 0.3] }
      }
    }
  },
  {
    id: "morphology",
    layout: "scene",
    ref: "Morphology",
    bg: C.lilac,
    bgAt: [0.7, 1], // changes behind the circle
    pace: 0.3,
    actors: {
      // Opens from the middle of the speech bubble
      wipe: Object.assign({ enter: { from: { x: 712, y: 295, w: 0, h: 0 }, at: [0.05, 0.75] } }, WIPE_OPEN),
      morA: { x: 209, y: 360, size: 240, color: C.white, text: "Mor", enter: { letters: true, at: [0.5, 1] } },
      morB: { x: 708.6, y: 360, size: 240, color: C.white, text: "phology", letterOffset: 3, enter: { letters: true, at: [0.5, 1] } }
    }
  },
  {
    id: "morphology-split",
    layout: "scene",
    ref: "Morphology 2",
    bg: C.lilac,
    pace: 0.35,
    actors: {
      wipe: WIPE_OPEN,
      // The purple half slides in from the right; the yellow divider grows top to bottom
      panel: Object.assign({ enter: { dx: 1122, at: [0, 0.7] } }, PANEL),
      divider: Object.assign({ enter: { h: 0, at: [0.35, 0.9] } }, DIVIDER),
      morA: { x: 167, y: 360, size: 240, color: C.white, text: "Mor" },
      morB: { x: 858, y: 360, size: 240, color: C.white, text: "phology", letterOffset: 3 }
    }
  },
  {
    id: "morphology-parts",
    layout: "scene",
    ref: "Morphology 3",
    bg: C.lilac,
    pace: 0.4,
    actors: {
      wipe: WIPE_OPEN,
      panel: PANEL,
      divider: DIVIDER,
      morA: { x: 136, y: 323, size: 200, color: C.white, text: "Mor" },
      hyphenA: { x: 552.3, y: 323, size: 200, color: C.white, text: "-", enter: { dx: -70, opacity: 0, at: [0.3, 0.9] } },
      hyphenB: { x: 893, y: 323, size: 200, color: C.white, text: "-", enter: { dx: 70, opacity: 0, at: [0.3, 0.9] } },
      morB: { x: 990, y: 323, size: 200, color: C.white, text: "phology", letterOffset: 3 },
      // The pills bounce up from below, one after the other
      pillA: { x: 193, y: 683, w: 402, h: 112, size: 64, padX: 58, text: "\u201CMorphemes\u201D", enter: { dy: 260, opacity: 0, ease: "back", at: [0.4, 0.9] } },
      pillB: { x: 1154, y: 683, w: 410, h: 112, size: 64, padX: 58, text: "\u201Cthe study of\u201D", enter: { dy: 260, opacity: 0, ease: "back", at: [0.5, 1] } }
    }
  },
  {
    id: "lineup",
    layout: "lineup",
    transition: "rise",
    heading: "[TBD]",
    characters: [
      { src: CHARACTERS + "duo.png", label: "Duo" },
      { src: CHARACTERS + "bea.png", label: "Bea" },
      { src: CHARACTERS + "eddy.png", label: "Eddy" },
      { src: CHARACTERS + "junior.png", label: "Junior" },
      { src: CHARACTERS + "lily.png", label: "Lily" },
      { src: CHARACTERS + "lin.png", label: "Lin" },
      { src: CHARACTERS + "lucy.png", label: "Lucy" },
      { src: CHARACTERS + "oscar.png", label: "Oscar" },
      { src: CHARACTERS + "vikram.png", label: "Vikram" },
      { src: CHARACTERS + "zari.png", label: "Zari" },
      { src: null, label: "[TBD: twins]", wide: true }
    ]
  },
  {
    id: "finale",
    layout: "finale",
    transition: "window",
    owl: { src: CHARACTERS + "duo.png", label: "Duo" },
    line: "Go ahead, scan" // from SPEC.md
  },
  {
    id: "leaderboard",
    layout: "leaderboard",
    transition: "qr-handoff", // the QR glides over from the previous slide
    heading: "[TBD: leaderboard title]",
    limit: 5,
    qr: true,
    line: "Go ahead, scan" // from SPEC.md
  }
];

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
  purple: "#8A38F5",
  blue: "#1CB0F6",
  meaning: "#A9CBED", // pale blue word meanings on the cards
  navy: "#2B70C9", // Interviews background
  attribution: "#D5E2F4" // who said it, under each quote
};

// Flashcard helpers: text positions are Figma's (stage coordinates); the card's top-left is (446, 204)
const CARD_TOP = { x: 446, y: 204 };
function flashcard(z, texts) {
  return { type: "card", w: 1028, h: 672, z, origin: [CARD_TOP.x, CARD_TOP.y], texts };
}
function word(text, x, y, size) {
  return { text, x, y, size, color: "#FFFFFF" };
}
function meaning(text, x, y, size) {
  return { text, x, y, size, color: "#A9CBED" };
}

// Everything that can appear in the world, back to front (z)
window.WORLD_ACTORS = {
  // The swirls drift slowly while resting (idle loop), out of step with each other
  swirlYellow: { type: "path", shape: "swirlOpening", stroke: C.yellow, width: 50, z: 1, idle: "drift" },
  swirlOrange: { type: "path", shape: "swirlStory", stroke: C.orange, width: 50, z: 1, idle: "drift", idleDelay: "-5s" },
  // Same swirl in its "learner" spot: the story one unswirls, then this one swirls in
  swirlOrangeLearner: { type: "path", shape: "swirlStory", stroke: C.orange, width: 50, z: 1, idle: "drift", idleDelay: "-8s" },
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
  pillB: { type: "pill", z: 13 },

  // Examples: a stack of cards (design/slides/svgs/Card Stack). Three cards stay at the
  // back; each language has its own top card (a flashcard carrying its words). Top cards
  // are stacked English over Hindi over Chinese over Spanish, so each one flies off to
  // reveal the next.
  cardTiltRight: { type: "card", w: 1028, h: 672, z: 20 },
  cardFlat: { type: "card", w: 1028, h: 672, z: 21 },
  cardTiltLeft: { type: "card", w: 1028, h: 672, z: 22 },
  cardEnglish: flashcard(27, [
    word("Un-", 532, 351, 180), word("happy", 900, 351, 180),
    meaning("(Not)", 596, 621, 72), meaning("(Happy)", 1017, 621, 72)
  ]),
  cardHindi: flashcard(26, [
    word("Vidya", 551, 365, 160), word("laya", 1059, 365, 160),
    meaning("Knowledge", 582, 605, 72), meaning("Home", 1123, 605, 72)
  ]),
  cardChinese: flashcard(25, [
    word("n\u01DA", 687, 289, 100), word("m\u01CE", 1097, 289, 100), // pinyin nǚ, mǎ
    word("\u5973", 641, 374, 220), word("\u9A6C", 1063, 397, 220), // 女, 马
    meaning("Female", 635, 681, 72), meaning("(Pronounce)", 998, 687, 64)
  ]),
  cardSpanish: flashcard(24, [
    word("Lava", 536, 382, 160), word("platos", 969, 382, 160),
    meaning("Washes", 591, 594, 70), meaning("Dishes", 1092, 594, 70)
  ]),
  langEnglish: { type: "text", font: "semibold", z: 30 },
  langHindi: { type: "text", font: "semibold", z: 30 },
  langChinese: { type: "text", font: "semibold", z: 30 },
  langSpanish: { type: "text", font: "semibold", z: 30 },
  wordEnglish: { type: "text", font: "semibold", z: 30 },
  wordHindi: { type: "text", font: "semibold", z: 30 },
  wordChinese: { type: "text", font: "semibold", z: 30 },
  wordSpanish: { type: "text", font: "semibold", z: 30 },

  // Interviews (design/slides/Interviews.png, Interviews-1.png). Two light-blue circles
  // travel through both slides; on the second, a column slides up with three circles in it.
  circleA: { type: "ellipse", z: 40 },
  circleB: { type: "ellipse", z: 40 },
  column: { type: "rect", z: 41 },
  columnAbove: { type: "rect", z: 41 }, // fills above the slide on taller screens, once landed
  columnTop: { type: "ellipse", z: 42 },
  columnMid: { type: "ellipse", z: 42 },
  columnBottom: { type: "ellipse", z: 42 },
  quoteA: { type: "quote", font: "semibold", z: 45 },
  quoteB: { type: "quote", font: "semibold", z: 45 },
  quoteC: { type: "quote", font: "semibold", z: 45 },
  saidA: { type: "text", font: "semibold", z: 45 },
  saidB: { type: "text", font: "semibold", z: 45 },
  saidC: { type: "text", font: "semibold", z: 45 }
};

// The lilac circle, fully open: centred on the stage, big enough to cover the corners
const WIPE_OPEN = { x: 960 - 1150, y: 540 - 1150, w: 2300, h: 2300, color: C.lilac };
// The card stack behind every example. The tilted cards turn around the same centre as
// the top card (960, 540); angles recovered from the SVG exports, placement measured
// from the stack's outline in the Figma export.
const STACK = {
  cardTiltRight: { x: 446, y: 204, rotate: 9.19 },
  cardFlat: { x: 428.05, y: 202.76 },
  cardTiltLeft: { x: 446, y: 204, rotate: -9.0 }
};
// Labels either side of the stack: language on the left, the whole word on the right
const label = (text, x, y, extra) => Object.assign({ x, y, size: 60, color: C.white, text }, extra);
const fromLeft = { dx: -450, opacity: 0 };
const fromRight = { dx: 450, opacity: 0 };
// Moving between examples: the top card flies off to the left, revealing the next one
const FLY_OFF = { dx: -1500, dy: -90, rotate: -24, at: [0, 0.6] };
// Card-trick entrance. Every card starts the same way (2.2x bigger, turned -150°, out on
// one short swirl) so the stack arrives as a single deck; finalAngle is where it ends up,
// fan is how far it swings past that while the deck fans open.
function cardTrick(finalAngle, fan, at) {
  return { scale: 2.2, rotate: finalAngle - 150, opacity: 0, orbit: { r: 320, angle: 200, turns: 0.45 }, fan, at };
}
const REVEAL = { reveal: 0, at: [0.15, 0.7] };

// Interviews-1: the orange circle pulls the column up from below the screen (starts low
// enough that the column's top, under the circle, is off screen)
const PULL_UP = { dy: 1400, at: [0.05, 0.8] };

// Interviews: a quote (white, 76.67px, the *word* gets the orange pill) and who said it.
// Copy is still a placeholder in Figma, so it's [TBD] here.
function quote(text, x, y, at) {
  return {
    x, y, size: 76.67, color: C.white, text,
    enter: { dy: 70, opacity: 0, reveal: 0, at },
    exit: { dy: -70, opacity: 0, at: [0, 0.4] }
  };
}
function said(text, x, y, size, at) {
  return {
    x, y, size, color: C.attribution, text,
    enter: { dy: 50, opacity: 0, at },
    exit: { dy: -50, opacity: 0, at: [0, 0.4] }
  };
}

// Morphology 2 and 3 share the split background (design/slides/Morphology 2.png)
// They run past the top and bottom of the slide so they reach the window edges on screens
// that are taller than 16:9 (the slide itself shows y 0-1080)
const PANEL = { x: 798, y: -600, w: 1722, h: 2280, color: C.purple };
const DIVIDER = { x: 739, y: -600, w: 67, h: 2280, color: C.yellow };

// User Story layout, shared by its three bubble lines (design/slides/User Story.png)
const storyActors = {
  frame: { width: 50, color: C.orange, enter: { draw: 0, at: [0, 0.75] } },
  swirlOrange: { x: 726.7, y: 113.3, enter: { draw: 0, at: [0.1, 1] }, exit: { draw: 0, at: [0, 0.5] } },
  shadow: { x: 1183, y: 935, w: 629, h: 76, color: C.shadowOnYellow, at: [0.1, 0.9] },
  saissha: { x: 107, y: 117, w: 742, enter: { dx: -1000, at: [0.2, 0.8] } },
  twins: { x: 1235, y: 540, w: 590.73, at: [0.1, 0.9], walk: 18 }
};

// One example after English: the stack stays, the previous top card flies off to reveal
// this one, and the labels slide out and back in with the new language and word
function example(id, ref, card, lang, whole, langKey, wordKey, cardExit) {
  const actors = Object.assign({}, STACK);
  actors[card] = Object.assign({ enter: REVEAL, exit: cardExit || FLY_OFF }, CARD_TOP);
  actors[langKey] = Object.assign(lang, { enter: Object.assign({ at: [0.45, 1] }, fromLeft), exit: Object.assign({ at: [0, 0.45] }, fromLeft) });
  actors[wordKey] = Object.assign(whole, { enter: Object.assign({ at: [0.5, 1] }, fromRight), exit: Object.assign({ at: [0, 0.45] }, fromRight) });
  return { id, layout: "scene", ref, bg: C.blue, pace: 0.45, actors };
}

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
      swirlOrangeLearner: { x: -76.6, y: 42.1, enter: { draw: 0, at: [0.4, 1] }, exit: { draw: 0, at: [0, 0.7] } },
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
      panel: Object.assign({ enter: { dx: 1800, at: [0, 0.7] } }, PANEL),
      divider: Object.assign({ enter: { h: 0, at: [0.35, 0.9] } }, DIVIDER), // grows down from the top
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
      // Leaving for the examples: the lilac circle closes to the middle, the purple half
      // slides away, the words and pills drop out
      wipe: Object.assign({ exit: { w: 0, h: 0, dx: 1150, dy: 1150, at: [0.05, 0.6] } }, WIPE_OPEN),
      panel: Object.assign({ exit: { dx: 1800, at: [0, 0.5] } }, PANEL),
      divider: Object.assign({ exit: { h: 0, at: [0, 0.4] } }, DIVIDER),
      morA: { x: 136, y: 323, size: 200, color: C.white, text: "Mor", exit: { dy: -140, opacity: 0, at: [0, 0.35] } },
      hyphenA: { x: 552.3, y: 323, size: 200, color: C.white, text: "-", enter: { dx: -70, opacity: 0, at: [0.3, 0.9] }, exit: { dy: -140, opacity: 0, at: [0, 0.35] } },
      hyphenB: { x: 893, y: 323, size: 200, color: C.white, text: "-", enter: { dx: 70, opacity: 0, at: [0.3, 0.9] }, exit: { dy: -140, opacity: 0, at: [0, 0.35] } },
      morB: { x: 990, y: 323, size: 200, color: C.white, text: "phology", letterOffset: 3, exit: { dy: -140, opacity: 0, at: [0, 0.35] } },
      // The pills bounce up from below, one after the other
      pillA: { x: 193, y: 683, w: 402, h: 112, size: 64, padX: 58, text: "\u201CMorphemes\u201D", enter: { dy: 260, opacity: 0, ease: "back", at: [0.4, 0.9] }, exit: { dy: 300, opacity: 0, at: [0, 0.35] } },
      pillB: { x: 1154, y: 683, w: 410, h: 112, size: 64, padX: 58, text: "\u201Cthe study of\u201D", enter: { dy: 260, opacity: 0, ease: "back", at: [0.5, 1] }, exit: { dy: 300, opacity: 0, at: [0, 0.35] } }
    }
  },
  {
    id: "example-english",
    layout: "scene",
    ref: "Morphology Example - English",
    bg: C.blue,
    bgAt: [0.05, 0.6],
    pace: 0.16, // the card trick (swirl in, fan out, settle) takes about 1 second
    actors: {
      // A card trick: the stack swirls in as one deck, big and spinning, shrinking as it comes;
      // as it lands the cards fan out like a hand of cards, then close to their angles.
      // Hidden until the move starts.
      cardTiltRight: Object.assign({ enter: cardTrick(9.19, 26, [0.1, 0.8]) }, STACK.cardTiltRight),
      cardFlat: Object.assign({ enter: cardTrick(0, -10, [0.1, 0.8]) }, STACK.cardFlat),
      cardTiltLeft: Object.assign({ enter: cardTrick(-9, -26, [0.1, 0.8]) }, STACK.cardTiltLeft),
      cardEnglish: Object.assign({ enter: Object.assign(cardTrick(0, 0, [0.12, 0.85]), { reveal: 0 }), exit: FLY_OFF }, CARD_TOP),
      langEnglish: label("English", 129, 495, { enter: Object.assign({ at: [0.6, 1] }, fromLeft), exit: Object.assign({ at: [0, 0.45] }, fromLeft) }),
      wordEnglish: label("Unhappy", 1559, 495, { enter: Object.assign({ at: [0.65, 1] }, fromRight), exit: Object.assign({ at: [0, 0.45] }, fromRight) })
    }
  },
  example("example-hindi", "Morphology Example - Hindi", "cardHindi",
    label("Hindi", 162, 495), label("Vidyalaya\n(School)", 1682, 450, { align: "center" }), "langHindi", "wordHindi"),
  example("example-chinese", "Morphology Example - Chinese", "cardChinese",
    label("Chinese", 128, 495), label("\u5988\n(Mom)", 1682, 450, { align: "center" }), "langChinese", "wordChinese"), // 妈
  example("example-spanish", "Morphology Example - Spanish", "cardSpanish",
    label("Spanish", 120, 496), label("Lavaplatos\n(Dishwasher)", 1704, 444, { align: "center" }), "langSpanish", "wordSpanish",
    // Leaving for the Interviews: the card grows to fill the screen and becomes the dark-blue
    // background (its words fade first; the card itself fades only at the very end)
    { scale: 3.4, reveal: 0, at: [0, 0.65], fade: [0.75, 1] }),
  {
    id: "interviews",
    layout: "scene",
    ref: "Interviews",
    bg: C.navy,
    bgAt: [0.3, 0.7], // changes behind the growing card
    pace: 0.3,
    actors: {
      // The circles drift in from opposite corners at different speeds
      circleA: { x: 84, y: 59, w: 509, h: 509, color: C.blue, enter: { dx: -800, dy: -650, at: [0.45, 1] } },
      circleB: { x: 1289, y: 511, w: 509, h: 509, color: C.blue, enter: { dx: 750, dy: 650, at: [0.55, 1] } },
      // Quotes rise in one after the other; the pill then sweeps across the marked word
      quoteA: quote("\u201C [TBD: Duolingo user *quote*] \u201D", 522, 146, [0.5, 1]),
      saidA: said("Duolingo User - [TBD]", 1101, 405, 51.3, [0.6, 1]),
      quoteB: quote("\u201C [TBD: Duolingo user *quote*] \u201D", 207, 600, [0.62, 1]),
      saidB: said("Duolingo User - [TBD]", 207, 851, 51.3, [0.7, 1])
    }
  },
  {
    id: "interviews-expert",
    layout: "scene",
    ref: "Interviews-1",
    bg: C.navy,
    pace: 0.3,
    actors: {
      // The top orange circle comes up from below the screen and pulls the light-blue column
      // up behind it: the column's top edge stays at the circle's centre the whole way, and
      // the circles sitting on the column ride along. Same move for all four, so they stay
      // attached. The two circles from the previous slide roll down to the bottom row (one
      // turns white).
      // Starts at the orange circle's centre line (Figma: y 9), so its top is always behind
      // the circle, with no gap above it on screens taller than 16:9
      column: { x: 84, y: -54, w: 509, h: 1734, color: C.blue, enter: PULL_UP },
      // Above the slide (only seen on screens taller than 16:9): continues the column up to the
      // window edge, appearing only once everything has landed, so it never shows above the circle
      columnAbove: { x: 84, y: -800, w: 509, h: 760, color: C.blue, enter: { opacity: 0, fade: [0.92, 1] } },
      columnTop: { x: 105, y: -288, w: 468, h: 468, color: C.orange, enter: PULL_UP },
      columnMid: { x: 105, y: 238, w: 468, h: 469, color: C.white, enter: PULL_UP },
      columnBottom: { x: 105, y: 765, w: 468, h: 468, color: C.orange, enter: PULL_UP },
      circleA: { x: 980, y: 885, w: 468, h: 468, color: C.blue, at: [0.15, 0.85] },
      circleB: { x: 1514, y: 885, w: 468, h: 468, color: C.white, at: [0.2, 0.9] },
      quoteC: quote("\u201C [TBD: expert *quote*] \u201D", 691, 346, [0.5, 1]),
      saidC: said("[TBD: name], Linguistic Expert", 1107, 635, 48, [0.6, 1])
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

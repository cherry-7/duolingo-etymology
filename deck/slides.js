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
// 2. Regular slides (finale, leaderboard): one full-screen card each, using the
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
  meaning: "#FFFFFF", // word meanings on the cards: white like the words (Michelle; Figma had pale blue #A9CBED)
  ink2: "#363135", // twins' dark (palette and swatch labels)
  shadowOnSquiggle: "#CA8A00",
  navy: "#18529C", // "CHARACTER POSES" on the blue bar
  glow: "#AA6401", // the dark glow behind the twins (Character Default, second version)
  cream: "#FFEA9C" // the twins' tile on "Who are they?"
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
  return { text, x, y, size, color: C.meaning };
}

// Character Color swatches
function swatch(color, label, labelColor, w) {
  return { type: "swatch", color, label, labelColor, w, h: 242, z: 6 };
}
// Research cards, rebuilt from the layers in design/slides/svgs/Character Color Research Slides.
// Coordinates are in Figma's 704x514 card frames (the slide shows them at 481 wide). Swatch
// fills are read from the exported Rectangle SVGs; the hex labels and characters are the SVGs.
const RESEARCH_ART = DECK_ART + "research/";
function researchCard(character, art, group, fills, labels, behind) {
  // The swatch block: skin (square), hair (wide) on top, then two rows of wide + square
  const [gx, gy] = group;
  const at = [[0, 0, 104.17], [110.68, 0, 195.32], [0, 130.21, 195.32], [201.83, 130.21, 104.17], [0, 240.89, 195.32], [201.83, 240.89, 104.17]];
  const swatches = fills.map((fill, i) => ({ x: gx + at[i][0], y: gy + at[i][1], w: at[i][2], h: 104.17, fill }));
  const parts = labels.map(([hex, x, y]) => ({ src: RESEARCH_ART + "label-" + hex + ".svg", x, y: y + 4.5, w: 50, h: 9 }));
  if (art) parts.unshift({ src: RESEARCH_ART + art + ".svg", x: character[0], y: character[1], w: character[2], h: character[3] });
  if (behind) parts.unshift(behind); // e.g. the white of an eye that shows through the character art
  return { type: "research", w: 481, z: 7, swatches, parts };
}
// Card 1's layers aren't in the export, so it's the card cut from the slide export (Michelle's call)
function researchCardFromExport(file) {
  return { type: "research", w: 481, z: 7, swatches: [], parts: [{ src: RESEARCH_ART + file, x: 0, y: 0, w: 704, h: 514, round: true }] };
}

// Everything that can appear in the world, back to front (z)
window.WORLD_ACTORS = {
  // The swirls drift slowly while resting (idle loop), out of step with each other
  swirlYellow: { type: "path", shape: "swirlOpening", stroke: C.yellow, width: 50, z: 1, idle: "drift" },
  swirlOrange: { type: "path", shape: "swirlStory", stroke: C.orange, width: 50, z: 1, idle: "drift", idleDelay: "-5s" },
  // Same swirl in its "learner" spot: the story one unswirls, then this one swirls in
  swirlOrangeLearner: { type: "path", shape: "swirlStory", stroke: C.orange, width: 50, z: 1, idle: "drift", idleDelay: "-8s" },
  title: { type: "text", font: "title", z: 2 },
  // The deck opens in the dark; a flashlight finds "Meet", then the black fades away (Michelle)
  dark: { type: "spotlight", light: [0.05, 0.4], fade: [0.62, 1], z: 20 },
  shadow: { type: "ellipse", z: 3 },
  saissha: { type: "img", src: DECK_ART + "saissha.png", w: 742, h: 963, z: 4, idle: "breathe" },
  // Mula (left) and Dulo (right), built from their Figma parts; they take the old twins.png slot
  // (same x, y and width, feet on the same line). They stand closer than in Figma (Mula 0,
  // Dulo 520): each moved 65 inward, so the gap between them is halved and the pair stays centred. box: the pair's outline in character units.
  twins: { type: "pair", members: [{ who: "mula", dx: 65 }, { who: "dulo", dx: 455 }], box: [95, 60, 950, 666], slotAspect: 944 / 1262, z: 5 },
  // the same pair as a black silhouette (the second Character Default slide, before the reveal)
  twinsShadow: { type: "pair", silhouette: true, members: [{ who: "mula", dx: 65 }, { who: "dulo", dx: 455 }], box: [95, 60, 950, 666], slotAspect: 944 / 1262, z: 5 },
  // a second pair, for the Walking oval (the first is in the Correct oval on the slide before)
  twinsWalk: { type: "pair", members: [{ who: "mula", dx: 65 }, { who: "dulo", dx: 455 }], box: [95, 60, 950, 666], slotAspect: 944 / 1262, z: 5 },
  bubble: { type: "bubble", z: 6 },
  // Mula and Dulo chatting (assets/deck/talking: arms gesturing, mouths moving; a looping SVG)
  talking: { type: "img", src: DECK_ART + "talking/talking.svg", w: 1217, h: 1112, z: 5 },
  // Mula and Dulo hug into the yin-yang (assets/deck/yin-yang: plays once, then holds and breathes)
  yinyang: { type: "img", src: DECK_ART + "yin-yang/yin-yang.svg", w: 1360, h: 1200, z: 5 },
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


  // Characters (design/slides/Character Default.png, Character Color.png, Character Color
  // Research.png). The twins come back here (they're the same actor as in the story).
  // An orange circle blooms out into Character Default's orange background
  bloom: { type: "ellipse", z: 2 },
  squiggle: { type: "path", shape: "squiggle", stroke: "#FFC800", width: 200, cap: "round", z: 2.6 },
  wave: { type: "ellipse", z: 2.7 },
  titleColor: { type: "text", font: "heading", letters: true, z: 4.5 },
  titlePalette: { type: "text", font: "heading", letters: true, z: 4.5, kern: { 5: -0.179, 6: -0.066 } }, // Figma sets "tt" tighter than the web font
  // Mula and Dulo's colours, taken from their layers in the character Figma file (no palette frame
  // there): skin, hair (brown, Michelle 2026-10-11), Mula's dress / Dulo's sash (light blue), Dulo's dress /
  // Mula's scarf (dark blue), white
  // (eyes, buttons), nose and brows. Swatch sizes and spots are the Figma Color Palette slide's.
  swatchSkin: swatch("#D5A06E", "#D5A06E", "#3D3D3D", 242),
  swatchHair: swatch("#6E4533", "#6E4533", "#FFFFFF", 454),
  swatchShirt: swatch("#87D2FB", "#87D2FB", "#3D3D3D", 454),
  swatchOrange: swatch("#638CD9", "#638CD9", "#FFFFFF", 242),
  swatchJeans: swatch("#FFFFFF", "#FFFFFF", "#3D3D3D", 454),
  swatchBlue: swatch("#AE703E", "#AE703E", "#FFFFFF", 242),
  research1: researchCardFromExport("card1-from-export.png"),
  research2: researchCard([67, 105, 226, 324], "card2-character", [317, 84],
    ["#FFCBA3", "#3D3D3D", "#FEB101", "#FFF3F2", "#FF9501", "#FDCA9B"],
    [["FFCBA3", 343, 159], ["3D3D3D", 493, 159], ["FEB101", 389, 291], ["FFF3F2", 545, 291], ["FF9501", 389, 399], ["FDCA9B", 545, 399]]),
  research3: researchCard([73, 65, 211, 384], "card3-character", [325, 97],
    ["#DA8F71", "#3C3E3D", "#FEAADF", "#A6653F", "#27E89F", "#20AFF3"],
    [["DA8F71", 351, 177], ["3C3E3D", 507, 177], ["FEAADF", 397, 305], ["A6653F", 553, 305], ["27E89F", 397, 417], ["20AFF3", 553, 417]]),
  research4: researchCard([51, 50, 239, 388], "card4-character", [317, 84],
    ["#A1674A", "#3D3D3F", "#FAB327", "#FF4A4F", "#1CB0F6", "#4DC4FD"],
    [["A36746", 343, 159], ["3D3D3F", 493, 159], ["FAB327", 389, 291], ["FF4A4F", 545, 291], ["1CB0F6", 389, 399], ["4DC4FD", 545, 399]],
    { src: RESEARCH_ART + "card4-eye-white.svg", x: 154, y: 168, w: 69, h: 69 }),
  // card 5's image exported larger than its Figma box (234x380); sized to match the slide export
  research5: researchCard([68, 59, 249, 398], "card5-character", [329, 84],
    ["#C67962", "#3D3D3D", "#CD348E", "#AB0464", "#0084C2", "#00468E"],
    [["C67962", 355, 159], ["3D3D3D", 505, 159], ["CD348E", 401, 291], ["AB0464", 557, 291], ["0084C2", 401, 399], ["00468E", 557, 399]]),
  // card 6 isn't in the layer export either, so it's cut from the Figma card like card 1
  research6: researchCardFromExport("card6-from-export.png"),
  titleResearch: { type: "text", font: "heading", z: 8 },

  // Character Poses (Figma "Character Poses"): three purple waves behind six white circles
  // holding the six avatars (the demo's player avatars, design/demo/avatars)
  posesWave1: { type: "path", shape: "posesWave1", stroke: C.purple, width: 80, z: 1 },
  posesWave2: { type: "path", shape: "posesWave2", stroke: C.purple, width: 80, z: 1 },
  posesWave3: { type: "path", shape: "posesWave3", stroke: C.purple, width: 80, z: 1 },
  pose1: { type: "slot", color: C.white, src: "../assets/characters/frameone.png", label: "Mula and Dulo avatar 1", z: 3 },
  pose2: { type: "slot", color: C.white, src: "../assets/characters/frametwo.png", label: "Mula and Dulo avatar 2", z: 3 },
  pose3: { type: "slot", color: C.white, src: "../assets/characters/framethree.png", label: "Mula and Dulo avatar 3", z: 3 },
  pose4: { type: "slot", color: C.white, src: "../assets/characters/framefive.png", label: "Mula and Dulo avatar 4", z: 3 },
  pose5: { type: "slot", color: C.white, src: "../assets/characters/framesix.png", label: "Mula and Dulo avatar 5", z: 3 },
  pose6: { type: "slot", color: C.white, src: "../assets/characters/frameseven.png", label: "Mula and Dulo avatar 6", z: 3 },
  // Character Poses Animation: three ovals for the pose GIFs, their labels, and the blue bar
  // on the right (which then widens into the blue of the UI slide)
  // the animations, in their ovals (Michelle): scared, the high five (the pair, drawn over its
  // oval), the yin-yang; on the second slide thinking, walking (a second pair, running in place)
  // and talking
  gifWrong: { type: "slot", color: C.white, src: DECK_ART + "scared/scared.svg", fit: 0.92, label: "Mula and Dulo, scared", z: 3 },
  gifCorrect: { type: "slot", color: C.white, blank: true, z: 3 },
  gifFinished: { type: "slot", color: C.white, src: DECK_ART + "yin-yang/yin-yang.svg", fit: 0.92, label: "Mula and Dulo, yin-yang", z: 3 },
  gifThinking: { type: "slot", color: C.white, src: DECK_ART + "idle-think/idle-think.svg", fit: 0.92, label: "Mula and Dulo, thinking", z: 3 },
  gifWalking: { type: "slot", color: C.white, blank: true, z: 3 },
  gifTalking: { type: "slot", color: C.white, src: DECK_ART + "talking/talking.svg", fit: 0.92, label: "Mula and Dulo, talking", z: 3 },
  labelThinking: { type: "text", font: "one", lineHeight: 1.2, z: 3 },
  labelWalking: { type: "text", font: "one", lineHeight: 1.2, z: 3 },
  labelTalking: { type: "text", font: "one", lineHeight: 1.2, z: 3 },
  labelWrong: { type: "text", font: "one", lineHeight: 1.2, z: 3 },
  labelCorrect: { type: "text", font: "one", lineHeight: 1.2, z: 3 },
  labelFinished: { type: "text", font: "one", lineHeight: 1.2, z: 3 },
  posesBar: { type: "rect", z: 9.5 },
  posesBarText: { type: "text", font: "expanded", lineHeight: 1.2, z: 9.6 },
  // Twin Characters in UI Scenario: four phone screens (phone 1 is its own frame; 2-4 are cut
  // from the Figma image that sits over the other three frames)
  phone1: { type: "img", src: DECK_ART + "ui/phone-1.png", w: 401, h: 860, z: 10 },
  phone2: { type: "img", src: DECK_ART + "ui/phone-2.png", w: 401, h: 860, z: 10 },
  phone3: { type: "img", src: DECK_ART + "ui/phone-3.png", w: 401, h: 860, z: 10 },
  phone4: { type: "img", src: DECK_ART + "ui/phone-4.png", w: 401, h: 860, z: 10 },
  // Character Default (second version): a dark blurred glow behind the twins
  glow: { type: "ellipse", blur: 150, z: 2.8 },
  // Who is he?: the ten Duolingo characters (tiles cut from the Figma screenshots), and the
  // twins in their own tile
  titleWho: { type: "text", font: "heading semibold", z: 8 },
  twinsTile: { type: "rect", radius: 30, z: 4.8 },
  whoDuo: { type: "img", src: DECK_ART + "who/duo.png", w: 251, h: 251, z: 9 },
  whoBea: { type: "img", src: DECK_ART + "who/bea.png", w: 251, h: 250, z: 9 },
  whoEddy: { type: "img", src: DECK_ART + "who/eddy.png", w: 251, h: 251, z: 9 },
  whoJunior: { type: "img", src: DECK_ART + "who/junior.png", w: 251, h: 249, z: 9 },
  whoLily: { type: "img", src: DECK_ART + "who/lily.png", w: 251, h: 251, z: 9 },
  whoLin: { type: "img", src: DECK_ART + "who/lin.png", w: 251, h: 251, z: 9 },
  whoLucy: { type: "img", src: DECK_ART + "who/lucy.png", w: 251, h: 251, z: 9 },
  whoOscar: { type: "img", src: DECK_ART + "who/oscar.png", w: 251, h: 250, z: 9 },
  whoVikram: { type: "img", src: DECK_ART + "who/vikram.png", w: 251, h: 250, z: 9 },
  whoZari: { type: "img", src: DECK_ART + "who/zari.png", w: 251, h: 251, z: 9 }
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
// Off-screen starting/ending spots are far enough out to stay hidden on screens from 4:3 to
// 21:9 (the deck letterboxes; on those screens the strips beside the slide are visible).

// Labels either side of the stack: language on the left, the whole word on the right
const label = (text, x, y, extra) => Object.assign({ x, y, size: 60, color: C.white, text }, extra);
const fromLeft = { dx: -450, opacity: 0 };
const fromRight = { dx: 450, opacity: 0 };
// Moving between examples: the top card flies off to the left, revealing the next one
const FLY_OFF = { dx: -2100, dy: -90, rotate: -24, at: [0, 0.6] }; // far enough that the tilted card is off even very wide screens
// Card-trick entrance. Every card starts the same way (2.2x bigger, turned -150°, out on
// one short swirl) so the stack arrives as a single deck; finalAngle is where it ends up,
// fan is how far it swings past that while the deck fans open.
function cardTrick(finalAngle, fan, at) {
  return { scale: 2.2, rotate: finalAngle - 150, opacity: 0, orbit: { r: 320, angle: 200, turns: 0.45 }, fan, at };
}
const REVEAL = { reveal: 0, at: [0.15, 0.7] };


// Character Color: swatches pop in one at a time (start = when, as a fraction of the move)
function popIn(x, y, start) {
  return { x, y, enter: { scale: 0, pop: true, at: [start, Math.min(1, start + 0.35)] }, exit: { scale: 0, at: [0, 0.35] } };
}
// Research: cards are dealt up from below, turned a little, landing with a small overshoot
function dealUp(x, y, rotate, start) {
  return { x, y, w: 481, enter: { dy: 1300, rotate, ease: "back", at: [start, Math.min(1, start + 0.4)] } };
}


// Character Poses: the circles drop in from above, one after another
function dropIn(x, y, size, start) {
  return { x, y, w: size, h: size, enter: { dy: -1400, ease: "back", at: [start, Math.min(1, start + 0.35)] } };
}
// Character Poses Animation: the three ovals drop in together; each label rises on its own step
const OVALS = {
  gifWrong: { x: 140, y: 154, w: 417, h: 515, enter: { dy: -1400, ease: "back", at: [0.3, 0.85] } },
  gifCorrect: { x: 686, y: 154, w: 417, h: 515, enter: { dy: -1400, ease: "back", at: [0.3, 0.85] } },
  gifFinished: { x: 1232, y: 154, w: 417, h: 515, enter: { dy: -1400, ease: "back", at: [0.3, 0.85] } },
  // The bar runs past the top and bottom so it reaches the window edges on taller screens
  posesBar: { x: 1763, y: -600, w: 154, h: 2280, color: C.blue, enter: { dx: 154, at: [0.3, 0.8] } },
  posesBarText: { x: 1883, y: 540, rotate: 90, align: "center", size: 72, color: C.navy, text: "CHARACTER POSES", enter: { dx: 154, at: [0.3, 0.8] } }
};
// the second Poses Animation slide: the same ovals and bar, with thinking, walking, talking
const OVALS_2 = {
  gifThinking: Object.assign({}, OVALS.gifWrong),
  gifWalking: Object.assign({}, OVALS.gifCorrect),
  gifTalking: Object.assign({}, OVALS.gifFinished),
  posesBar: OVALS.posesBar,
  posesBarText: OVALS.posesBarText
};
// the pairs in their ovals: as big as the drawings in the other ovals, feet on the same line (y 547)
const PAIR_IN_OVAL = (ovalX) => ({ x: ovalX + 8, y: 248, w: 400, enter: { opacity: 0, at: [0.6, 0.95] }, exit: { opacity: 0, at: [0, 0.3] } });
const LABEL_RISE = { dy: 120, opacity: 0, at: [0, 1] };
const POSE_LABELS = {
  labelWrong: { x: 348, y: 753, align: "center", size: 72, color: C.white, text: "Wrong\nAnswer" },
  labelCorrect: { x: 895, y: 753, align: "center", size: 72, color: C.white, text: "Correct\nAnswer" },
  labelFinished: { x: 1441.5, y: 753, align: "center", size: 72, color: C.white, text: "Curriculum\nFinished" },
  labelThinking: { x: 348, y: 753, align: "center", size: 72, color: C.white, text: "Thinking" },
  labelWalking: { x: 895, y: 753, align: "center", size: 72, color: C.white, text: "Walking" },
  labelTalking: { x: 1441.5, y: 753, align: "center", size: 72, color: C.white, text: "Talking" }
};
// One step of the Poses Animation slide: the ovals and bar, plus the labels shown so far
// (the newest one rises in)
function posesStep(id, labels, second) {
  const actors = Object.assign({}, second ? OVALS_2 : OVALS);
  labels.forEach((key, i) => {
    actors[key] = Object.assign({}, POSE_LABELS[key], i === labels.length - 1 ? { enter: LABEL_RISE } : null);
  });
  const slide = { id, layout: "scene", ref: "Character Poses Animation", bg: C.purple, pace: 0.6, actors };
  if (second) {
    // walking: the second pair runs in place in the middle oval. Running, Mula dashes ahead with
    // her arm out, so the pair sits 370 wide and further left to stay centred in the oval
    actors.twinsWalk = Object.assign(PAIR_IN_OVAL(OVALS.gifCorrect.x), { x: 667, y: 270, w: 370 });
    slide.runLoop = ["twinsWalk"];
  } else {
    // correct answer: the pair in the middle oval high-fives once the slide arrives; the
    // yin-yang starts over as its oval drops in
    actors.twins = PAIR_IN_OVAL(OVALS.gifCorrect.x);
    slide.react = "correct";
    // both loop while the slide is up (Michelle): the high five again 1.5s after it ends, the
    // yin-yang over every 5s (hug, a hold, then a quick fade into the next one)
    slide.reactLoop = 1500;
    slide.restartEvery = { gifFinished: 5000 };
    if (!labels.length) slide.restart = ["gifFinished"];
  }
  return slide;
}
// Twin Characters in UI Scenario: each screen swipes in from the right, one after another
function swipeIn(x, y, w, start) {
  return { x, y, w, enter: { dx: 1900, at: [start, Math.min(1, start + 0.3)] } };
}
// Who is he?: like the draft lineup slide, the heading and tiles rise in one after another
// (starts spread over 0.25-0.65, each takes 0.35)
function riseIn(placement, k, count) {
  const start = 0.25 + (k / count) * 0.4;
  return Object.assign({ enter: { dy: 90, opacity: 0, at: [start, start + 0.35] } }, placement);
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
  saissha: { x: 107, y: 117, w: 742, enter: { dx: -1300, at: [0.2, 0.8] } },
  // the run takes the whole move; on to the learner slide they fade into the talking pair
  twins: { x: 1235, y: 540, w: 590.73, at: [0, 1], exit: { opacity: 0, at: [0.15, 0.55] } }
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

// The flashlight on the opening title's first word, "Meet" (stage coordinates)
const SPOT = { x: 366, y: 165, r: 325 }; // "Meet" spans x 132-601, y 31-285 at size 210

// The opening title slide. The black first slide has it all in place under the darkness, so
// the flashlight and the fade reveal it as it is
const OPENING = {
  swirlYellow: { x: 0, y: 0, exit: { draw: 0, at: [0, 0.9] } },
  title: {
    // Michelle's title; 260 (Figma's size for "TITLE TITLE") runs off the slide, 210 fits one line
    x: 959.5, y: 0, align: "center", size: 210, color: C.white,
    text: "Meet Mula & Dulo", // Michelle
    exit: { dy: -450, opacity: 0, at: [0, 0.5] }
  },
  shadow: { x: 323, y: 944, w: 1158, h: 149, color: C.shadowOnOrange },
  twins: { x: 329, y: 119, w: 1261.65 },
  names: {
    x: 1828, y: 666, align: "right", size: 48, color: C.white,
    text: "Ame Wang,\nDaniel Thomas,\nMichelle Shen,\nNina Zhang,\nSaissha Jain",
    exit: { dx: 400, opacity: 0, at: [0, 0.4] }
  }
};

// "Who are they?": the heading and the ten Duolingo characters rise in one after another, then the
// twins' tile
const WHO = Object.assign({
  titleWho: riseIn({ x: 129, y: 68, size: 100, color: C.white, text: "Who are they?" }, 0, 12),
  twinsTile: riseIn({ x: 1267, y: 646, w: 387, h: 248, color: C.cream }, 11, 12)
}, ...[
  ["whoDuo", 127, 272], ["whoBea", 410, 273], ["whoEddy", 693, 272], ["whoJunior", 975, 272],
  ["whoLily", 1258, 272], ["whoLin", 1541, 272], ["whoLucy", 127, 643], ["whoOscar", 410, 643],
  ["whoVikram", 693, 643], ["whoZari", 975, 643]
].map(([key, x, y], k) => ({ [key]: riseIn({ x, y, w: 251 }, k + 1, 12) })));

window.SLIDES = [
  {
    // A completely black screen to start
    id: "dark",
    layout: "scene",
    bg: C.orange,
    actors: Object.assign({}, OPENING, {
      dark: { x: SPOT.x, y: SPOT.y, w: SPOT.r, reveal: 0 }
    })
  },
  {
    id: "opening",
    layout: "scene",
    ref: "Opening",
    bg: C.orange,
    pace: 0.05, // slow: the light finds "Meet", then the black slowly fades away (about 4s)
    // A moment of idling, then Mula and Dulo switch into the yin-yang hug (Michelle). It counts
    // from when the black has all but gone (the slow reveal takes a while longer to come to rest)
    swap: { from: "twins", to: "yinyang", after: 200, near: 0.15 },
    actors: Object.assign({}, OPENING, {
      dark: { x: SPOT.x, y: SPOT.y, w: SPOT.r, reveal: 1, at: [0, 1] },
      // hidden until the swap; the yin-yang drawing at the pair's size and feet line (Dulo's bun
      // at y 175, their feet at y 1059, centred on their feet)
      yinyang: { x: 340.5, y: 134, w: 1116.3, opacity: 0 }
    })
  },
  {
    id: "story",
    layout: "scene",
    ref: "User Story",
    nod: true, // Mula and Dulo nod twice once the bubble is up
    bg: C.yellow,
    pace: 0.25, // a long, cinematic move
    actors: Object.assign({}, storyActors, {
      bubble: {
        x: 794.67, y: 165, size: 100, auto: true, color: C.ink,
        text: "WAIT GUYS....", // Michelle
        enter: { scale: 0, pop: true, at: [0.6, 1] }
      }
    })
  },
  {
    id: "story-learning",
    layout: "scene",
    ref: "Group 29",
    nod: true, // Mula and Dulo nod twice once the bubble is up
    bg: C.yellow,
    pace: 0.5,
    actors: Object.assign({}, storyActors, {
      bubble: { x: 794.67, y: 165, size: 80, auto: true, text: "I have my anatomy\nmidterm tomorrow!" } // Michelle (on one line it touched the frame)
    })
  },
  {
    id: "story-wish",
    layout: "scene",
    ref: "Group 30",
    nod: true, // Mula and Dulo nod twice once the bubble is up
    bg: C.yellow,
    pace: 0.5,
    actors: Object.assign({}, storyActors, {
      bubble: {
        x: 794.67, y: 165, size: 80, auto: true,
        text: "Do you guys know any better\nways to learn the vocab?" // Michelle
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
      saissha: { x: 107, y: 529.87, w: 424, exit: { dx: -1000, at: [0, 0.6] } },
      // Mula and Dulo chat here (Michelle's pick, replacing the run-in and high five): the standing
      // pair fades out and the talking pair fades in, same height and feet line as the pair here
      talking: { x: 895.5, y: 246.5, w: 866, enter: { opacity: 0, at: [0.15, 0.55] }, exit: { opacity: 0, at: [0, 0.3] } },
      bubble: {
        x: 181, y: 198, size: 80, tail: 1, auto: true,
        text: "That's where we come in.", // Michelle (the twins)
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
    label("Spanish", 120, 496), label("Lavaplatos\n(Dishwasher)", 1704, 444, { align: "center" }), "langSpanish", "wordSpanish"),
  {
    id: "characters",
    layout: "scene",
    ref: "Character Default",
    bg: C.orange,
    bgAt: [0.58, 0.6], // swaps while the bloom covers the screen (a blue-to-orange fade goes brown)
    pace: 0.3,
    actors: {
      // An orange circle grows from the bottom left (centre 339, 999) to cover the whole window
      bloom: { x: 339 - 2600, y: 999 - 2600, w: 5200, h: 5200, color: C.orange,
        enter: { from: { x: 339, y: 999, w: 0, h: 0 }, at: [0.05, 0.6] }, exit: { opacity: 0, at: [0, 0.05] } },
      // The yellow squiggle draws itself, then the twins drop in and bounce onto their shadow
      squiggle: { x: 281, y: 29, enter: { draw: 0, at: [0.2, 0.9] }, exit: { draw: 0, at: [0, 0.6] } },
      shadow: { x: 534, y: 718.6, w: 778.4, h: 161.8, color: C.shadowOnSquiggle, enter: { w: 0, h: 0, dx: 389, dy: 81, at: [0.45, 0.85] } },
      twins: { x: 538.03, y: 200, w: 847.63, enter: { dy: -1500, ease: "bounce", at: [0.4, 1] } }
    }
  },
  {
    id: "characters-research",
    layout: "scene",
    ref: "Character Color Research",
    bg: C.blue,
    bgAt: [0.3, 0.7], // changes behind the growing wave
    pace: 0.3,
    actors: {
      // The cards are dealt up from below, one after another, then the title rises in
      research1: dealUp(153, 113, -8, 0.3),
      research2: dealUp(719, 113, 6, 0.36),
      research3: dealUp(1285, 113, -5, 0.42),
      research4: dealUp(153, 549, 7, 0.48),
      research5: dealUp(719, 549, -6, 0.54),
      research6: dealUp(1285, 549, 5, 0.6),
      titleResearch: { x: 564, y: 725, size: 280, color: C.yellow, text: "Research", enter: { dy: 500, at: [0.6, 1] } }
    }
  },
  {
    id: "characters-color",
    layout: "scene",
    ref: "Character Color",
    bg: C.yellow,
    bgAt: [0, 0.5],
    pace: 0.3,
    actors: {
      // The light-blue wave sweeps in from the top right; the twins walk left; the title drops
      // in letter by letter; the swatches pop in one by one
      wave: { x: 802, y: -611, w: 1352, h: 1352, color: C.blue, enter: { dx: 1000, dy: -1000, at: [0.1, 0.75] },
        // leaving for Research: it grows to fill the screen (centre stays put), then fades
        exit: { w: 4400, h: 4400, dx: -1524, dy: -1524, at: [0, 0.6], fade: [0.85, 1] } },
      titleColor: { x: -36, y: -125, size: 290, color: C.orange, text: "Color", enter: { letters: true, at: [0.35, 0.9] }, exit: { dy: -500, at: [0, 0.4] } },
      titlePalette: { x: 874, y: -125, size: 290, color: C.yellow, text: "Palette", letterOffset: 5, enter: { letters: true, at: [0.35, 0.9] }, exit: { dy: -500, at: [0, 0.4] } },
      shadow: { x: 143, y: 808.6, w: 778.4, h: 161.8, color: C.orange, at: [0.05, 0.8], exit: { opacity: 0, at: [0, 0.3] } },
      twins: { x: 147.03, y: 290, w: 847.63, at: [0, 1], exit: { dx: -1700, at: [0, 0.9] } },
      swatchSkin: popIn(1063, 200, 0.45),
      swatchHair: popIn(1320.25, 200, 0.5),
      swatchShirt: popIn(1063, 502.64, 0.55),
      swatchOrange: popIn(1532.1, 502.64, 0.6),
      swatchJeans: popIn(1063, 759.89, 0.65),
      swatchBlue: popIn(1532.1, 759.89, 0.7)
    }
  },
  {
    id: "poses",
    layout: "scene",
    ref: "Character Poses",
    bg: C.lilac,
    pace: 0.3,
    actors: {
      // The waves draw themselves along their paths, then the circles drop in one by one
      posesWave1: { x: 0, y: 0, enter: { draw: 0, at: [0.1, 0.8] }, exit: { draw: 0, at: [0, 0.5] } },
      posesWave2: { x: 0, y: 0, enter: { draw: 0, at: [0.15, 0.85] }, exit: { draw: 0, at: [0, 0.5] } },
      posesWave3: { x: 0, y: 0, enter: { draw: 0, at: [0.2, 0.9] }, exit: { draw: 0, at: [0, 0.5] } },
      pose1: dropIn(192, 135, 350, 0.35),
      pose2: dropIn(772, 135, 350, 0.42),
      pose3: dropIn(1352, 135, 350, 0.49),
      pose4: dropIn(192, 595, 350, 0.56),
      pose5: dropIn(772, 595, 350, 0.63),
      pose6: dropIn(1352, 595, 350, 0.65)
    }
  },
  // Character Poses Animation: the ovals drop in together, then each click/scroll raises one label
  posesStep("poses-animation", []),
  posesStep("poses-animation-wrong", ["labelWrong"]),
  posesStep("poses-animation-correct", ["labelWrong", "labelCorrect"]),
  posesStep("poses-animation-finished", ["labelWrong", "labelCorrect", "labelFinished"]),
  // ...and a second one for the other three animations (Michelle)
  posesStep("poses-animation-2", [], true),
  posesStep("poses-animation-thinking", ["labelThinking"], true),
  posesStep("poses-animation-walking", ["labelThinking", "labelWalking"], true),
  posesStep("poses-animation-talking", ["labelThinking", "labelWalking", "labelTalking"], true),
  {
    id: "ui-scenario",
    layout: "scene",
    ref: "Twin Characters in UI Scenario",
    bg: C.blue,
    bgAt: [0.5, 0.55], // swaps once the bar has covered the screen
    pace: 0.3,
    actors: {
      // The blue bar from the last slide sweeps across the whole screen
      posesBar: { x: -600, y: -600, w: 3120, h: 2280, color: C.blue, at: [0, 0.5], exit: { opacity: 0, at: [0, 0.05] } },
      // The screens swipe in from the right, one by one
      // Figma's updated frame (Duolingo Design Board): four evenly spaced iPhone 16 screens
      phone1: swipeIn(79, 114, 401, 0.45),
      phone2: swipeIn(535, 114, 401, 0.53),
      phone3: swipeIn(991, 114, 401, 0.61),
      phone4: swipeIn(1447, 114, 401, 0.69)
    }
  },
  {
    id: "characters-default",
    layout: "scene",
    ref: "Character Default-1",
    bg: C.orange,
    bgAt: [0.1, 0.6],
    pace: 0.3,
    actors: {
      // The glow fades up and the twins drop in and bounce, as on the first Character Default slide,
      // but as a black silhouette (Michelle); on to "Who are they?" it shrinks into the twins' tile
      glow: { x: 581, y: 192, w: 727, h: 727, color: C.glow, enter: { opacity: 0, at: [0.2, 0.8] } },
      twinsShadow: { x: 538.03, y: 200, w: 847.63, enter: { dy: -1500, ease: "bounce", at: [0.4, 1] } }
    }
  },
  {
    // The silhouette shrinks into the twins' tile as the rows rise in (no walking)...
    id: "who-is-he",
    layout: "scene",
    ref: "Who is he",
    bg: C.orange,
    pace: 0.3,
    actors: Object.assign({}, WHO, {
      twinsShadow: { x: 1323, y: 660, w: 285.28, glide: true, at: [0.45, 1] }
    })
  },
  {
    // ...then, on the next click, it fades out and the yin-yang plays in the tile (Michelle), at
    // the scale it has against the pair on the title slide
    id: "who-is-he-reveal",
    layout: "scene",
    ref: "Who is he",
    bg: C.orange,
    pace: 0.5,
    // the silhouette fades out (0.5s), then 0.2s later the yin-yang comes in and plays from its
    // first frame (Michelle)
    swap: { from: "twinsShadow", to: "yinyang", after: 0, near: 0.5, fadeOut: 500, gap: 200 },
    actors: Object.assign({}, WHO, {
      twinsShadow: { x: 1323, y: 660, w: 285.28 },
      yinyang: { x: 1325.6, y: 663.4, w: 252.4, opacity: 0 }
    })
  },
  {
    id: "finale",
    layout: "finale",
    // the QR builds over "Who are they?", which stays showing behind it (Michelle)
    transition: "stay",
    holdScene: true,
    line: "Go ahead, scan" // from SPEC.md
  },
  {
    id: "leaderboard",
    layout: "leaderboard",
    transition: "qr-handoff", // the QR glides over from the previous slide
    heading: "Leaderboard", // Figma "Leaderboard" frame
    limit: 4, // Figma shows four score bars
    qr: true,
    line: "Go ahead, scan!" // Figma "Leaderboard" frame
  }
];

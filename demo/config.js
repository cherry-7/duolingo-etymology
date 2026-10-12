// Demo settings. Paths are relative to /demo/.
export const CONFIG = {
  questionsUrl: "../content/questions.json",
  twinsLinesUrl: "../content/twins-lines.json",

  assets: {
    questions: "../assets/questions/",   // images named in questions.json
    animations: "../assets/animations/", // <animationId>.riv
    characters: "../assets/characters/", // <character id>.png
    twins: "../assets/twins/",           // <pose>.png
    sounds: "../assets/sounds/"
  },

  // Twins animations (self-contained looping SVGs from the deck chat). A missing file shows a
  // labeled placeholder, so high-five and clapping appear as soon as these files exist.
  twinsAnimations: {
    idle: { src: "../assets/deck/idle-think/idle-think.svg", label: "[TBD: twins idle/thinking]" },
    scared: { src: "../assets/deck/scared/scared.svg", label: "[TBD: twins scared]" },
    yinYang: { src: "../assets/deck/yin-yang/yin-yang.svg", label: "[TBD: twins yin-yang]" },
  },
  // The high five is the deck's own react: "correct", played by the deck engine in this page
  twinsHighFive: "twins.html",

  // Questions per language set, in file order. 10 total.
  lessonSplit: [3, 4, 3],

  // Avatar pool: randomized per player. Images: assets/characters/<id>.png
  // (copied from design/demo/avatars "Frame N.png"; ids are letters only for the leaderboard rules)
  characters: [
    { id: "frameone", name: "Frame 1" },
    { id: "frametwo", name: "Frame 2" },
    { id: "framethree", name: "Frame 3" },
    { id: "framefive", name: "Frame 5" },
    { id: "framesix", name: "Frame 6" },
    { id: "frameseven", name: "Frame 7" }
  ],

  // Loaded only when a .riv file exists for a question.
  riveRuntimeUrl: "https://unpkg.com/@rive-app/canvas@2.44.0/rive.js",

  nicknameMaxLength: 20
};

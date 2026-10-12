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

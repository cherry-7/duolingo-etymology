// Demo settings. Paths are relative to /demo/.
export const CONFIG = {
  questionsUrl: "../content/questions.json",
  twinsLinesUrl: "../content/twins-lines.json",

  assets: {
    questions: "../assets/questions/",   // images named in questions.json
    animations: "../assets/animations/", // <animationId>.riv
    characters: "../assets/characters/", // <character id>.png
    twins: "../assets/twins/"            // <pose>.png
  },

  // Questions per language set, in file order. 10 total.
  lessonSplit: [3, 4, 3],

  // Avatar pool. Images: assets/characters/<id>.png
  characters: [
    { id: "duo", name: "Duo" },
    { id: "lily", name: "Lily" },
    { id: "zari", name: "Zari" },
    { id: "bea", name: "Bea" },
    { id: "eddy", name: "Eddy" },
    { id: "junior", name: "Junior" },
    { id: "oscar", name: "Oscar" },
    { id: "vikram", name: "Vikram" },
    { id: "lucy", name: "Lucy" },
    { id: "lin", name: "Lin" }
  ],

  // Loaded only when a .riv file exists for a question.
  riveRuntimeUrl: "https://unpkg.com/@rive-app/canvas@2.44.0/rive.js",

  nicknameMaxLength: 20
};

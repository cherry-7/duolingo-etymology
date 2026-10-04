// All slide content lives here. Order in this array = order in the deck.
//
// Fields:
//   id          anchor for the slide (deck/#id)
//   layout      "basic" | "lineup" | "finale" | "leaderboard"
//   transition  how this slide arrives from the previous one (see transitions.js).
//               The motion follows the scroll, so going back plays it in reverse.
//               Give each slide a different one.
//   heading     string
//   body        string, or array of strings (one paragraph each)
//   twins       image slot for the twin characters: { src, label }
//   characters  (lineup only) list of image slots: { src, label, wide }
//   owl, line   (finale only) owl image slot, and the line shown with the QR code
//   limit       (leaderboard only) how many players to show; scores stream live from Firebase
//   qr, line    (leaderboard only) show the demo QR code beside the scores, with this line under it
//
// Image slots: set src to a file path relative to /deck, e.g. "../assets/twins/wave.png".
// If src is null or the file can't load, a gray box with the label is shown instead.
//
// Copy must come from /design/slides. Until it exists, everything is [TBD].

const CHARACTERS = "../assets/characters/";

window.SLIDES = [
  {
    id: "slide-1",
    layout: "basic",
    heading: "[TBD]",
    body: "[TBD]",
    twins: { src: null, label: "[TBD: twins]" }
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

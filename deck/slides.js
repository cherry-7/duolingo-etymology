// All slide content lives here. Order in this array = order in the deck.
//
// Fields:
//   id          anchor for the slide (deck/#id)
//   layout      "basic" | "lineup" | "finale"
//   transition  scene that plays when moving INTO this slide (see transitions.js);
//               going back plays it in reverse. Give each slide a different one.
//   heading     string
//   body        string, or array of strings (one paragraph each)
//   twins       image slot for the twin characters: { src, label }
//   characters  (lineup only) list of image slots: { src, label, wide }
//   owl, line   (finale only) owl image slot, and the line shown with the QR code
//
// Image slots: set src to a file path relative to /deck, e.g. "../assets/twins/wave.png".
// If src is null or the file can't load, a gray box with the label is shown instead.
//
// Copy must come from /design/slides. Until it exists, everything is [TBD].

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
    transition: "zoom-through",
    heading: "[TBD]",
    characters: [
      { src: null, label: "[TBD: Duolingo owl]" },
      { src: null, label: "[TBD: existing Duolingo characters]", wide: true },
      { src: null, label: "[TBD: twins]" }
    ]
  },
  {
    id: "finale",
    layout: "finale",
    transition: "iris",
    owl: { src: null, label: "[TBD: Duolingo owl]" },
    line: "Go ahead, scan" // from SPEC.md
  }
];

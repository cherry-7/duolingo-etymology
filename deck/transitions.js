// Scene transitions between slides. A slide's `transition` (in slides.js) names one of these;
// it plays when moving forward INTO that slide, and runs in reverse when going back.
//
// Each transition:
//   out       keyframes for the slide being left
//   in        keyframes for the slide arriving
//   duration  ms
//   easing    CSS easing for the whole scene
//
// These are neutral placeholders until /design (or Michelle's inspo) defines each scene.

window.TRANSITIONS = {
  // Dip to the background color, then up into the next scene
  "fade-through": {
    duration: 1000,
    easing: "ease-in-out",
    out: [{ opacity: 1 }, { opacity: 0, offset: 0.5 }, { opacity: 0 }],
    in: [{ opacity: 0 }, { opacity: 0, offset: 0.5 }, { opacity: 1 }]
  },

  // Camera flies forward through the old scene into the new one
  "zoom-through": {
    duration: 1100,
    easing: "cubic-bezier(0.6, 0, 0.2, 1)",
    out: [{ transform: "scale(1)", opacity: 1 }, { transform: "scale(2.5)", opacity: 0 }],
    in: [
      { transform: "scale(0.6)", opacity: 0 },
      { transform: "scale(0.6)", opacity: 0, offset: 0.3 },
      { transform: "scale(1)", opacity: 1 }
    ]
  },

  // New scene opens from a growing circle in the center
  "iris": {
    duration: 1100,
    easing: "cubic-bezier(0.65, 0, 0.35, 1)",
    out: [{ transform: "scale(1)" }, { transform: "scale(0.92)" }],
    in: [{ clipPath: "circle(0% at 50% 50%)" }, { clipPath: "circle(75% at 50% 50%)" }]
  },

  // New scene pushes the old one up and out
  "push-up": {
    duration: 900,
    easing: "cubic-bezier(0.7, 0, 0.3, 1)",
    out: [{ transform: "translateY(0)" }, { transform: "translateY(-100%)" }],
    in: [{ transform: "translateY(100%)" }, { transform: "translateY(0)" }]
  },

  // Camera pans right to the next scene
  "pan-left": {
    duration: 1000,
    easing: "cubic-bezier(0.7, 0, 0.3, 1)",
    out: [{ transform: "translateX(0)" }, { transform: "translateX(-100%)" }],
    in: [{ transform: "translateX(100%)" }, { transform: "translateX(0)" }]
  },

  // New scene wipes in from the left while the old one drifts away
  "wipe": {
    duration: 900,
    easing: "cubic-bezier(0.65, 0, 0.35, 1)",
    out: [{ transform: "translateX(0)" }, { transform: "translateX(-20%)" }],
    in: [{ clipPath: "inset(0 100% 0 0)" }, { clipPath: "inset(0 0 0 0)" }]
  }
};

// Mula and Dulo, from Figma (Duolingo Morphology - Suri & Dulo, Frame 5 = Mula, Frame 9 = Dulo).
// Each part in the 604x774 character frame, back to front, so limbs can animate on their own.
//   x, y, w, h   the part's box; rot / flip / skew rotate an inner iw x ih box about its centre
//   inset       where the image sits inside that box (top, right, bottom, left, in %)
//   src | fill + radius   an exported SVG, or a plain rounded rectangle
//   group       an arm (sleeve + hand) that turns about pivot; rest is its idle angle (arms
//               down, Michelle's call; Figma has them out). Arms sit in front of the body.
//   mirror      flip the arm over along its length (the line at this angle through pivot)
//   mask        a group shown only inside this shape (pupils stay inside the eye whites)
// The sole is one bar under both boots (Figma Rectangle 10); while running, each foot carries
// its own half (sole-left / sole-right) instead.
window.CHARACTER_PARTS = {
  mula: [
    {id: "pigtail-left", src: "../assets/deck/mula/pigtail-left.svg", x: 101, y: 225, w: 184.755, h: 184.755, rot: 32.95, iw: 133.584, ih: 133.584, inset: [9.73, 13.81, 25, 13.81]},
    {id: "pigtail-right", src: "../assets/deck/mula/pigtail-right.svg", x: 308, y: 226, w: 184.755, h: 184.755, rot: 147.05, flip: true, iw: 133.584, ih: 133.584, inset: [9.73, 13.81, 25, 13.81]},
    {group: "leg-right", pivot: [312, 480], parts: [
      {id: "leg-right", fill: "#d5a06e", radius: 6, x: 293, y: 476, w: 38, h: 130},
      {id: "boot-right", fill: "#3d3d3d", radius: 10, x: 293, y: 616, w: 55, h: 65},
      {id: "sole-right", fill: "#3d3d3d", radius: 14.5, x: 297.5, y: 694, w: 80.5, h: 29}
    ]},
    {group: "leg-left", pivot: [277, 480], parts: [
      {id: "leg-left", fill: "#d5a06e", radius: 6, x: 258, y: 474, w: 38, h: 132},
      {id: "boot-left", src: "../assets/deck/mula/boot-left.svg", x: 245, y: 616, w: 55, h: 65},
      {id: "sole-left", fill: "#3d3d3d", radius: 14.5, x: 217, y: 694, w: 80.5, h: 29}
    ]},
    {id: "dress-top", src: "../assets/deck/mula/dress-top.svg", x: 118, y: 302, w: 439.553, h: 302.086},
    {id: "dress-skirt", src: "../assets/deck/mula/dress-skirt.svg", x: 118, y: 302, w: 439.553, h: 302.086},
    {id: "scarf", fill: "#cb6539", radius: 6, x: 240, y: 291, w: 112, h: 52},
    {id: "ear-left", src: "../assets/deck/mula/ear-left.svg", x: 180, y: 213, w: 43, h: 43},
    {id: "ear-right", src: "../assets/deck/mula/ear-right.svg", x: 372, y: 215, w: 43, h: 43},
    {id: "hair-back", src: "../assets/deck/mula/hair-back.svg", x: 183, y: 81, w: 230, h: 230},
    {id: "face", fill: "#d5a06e", radius: 40, x: 208, y: 156, w: 179, h: 155},
    {id: "ellipse-10", src: "../assets/deck/mula/ellipse-10.svg", x: 244, y: 139, w: 147.565, h: 150.815, rot: -102.09, iw: 127.769, ih: 123.54, inset: [50, 1.32, 0, 1.32]},
    {id: "eye-white-left", src: "../assets/deck/mula/eye-white-left.svg", x: 237, y: 179, w: 52.627, h: 74.157},
    {id: "eye-white-right", src: "../assets/deck/mula/eye-white-right.svg", x: 306.37, y: 179, w: 52.627, h: 74.157},
    {group: "eye-right", mask: {src: "../assets/deck/mula/eye-white-right.svg", x: 306.37, y: 179, w: 52.627, h: 74.157}, parts: [
      {id: "group-9", src: "../assets/deck/mula/group-9.svg", x: 311.08, y: 202.37, w: 20.532, h: 33.5},
      {id: "pupil-right", src: "../assets/deck/mula/pupil-right.svg", x: 303.98, y: 195.75, w: 30.547, h: 40.592}
    ]},
    {group: "eye-left", mask: {src: "../assets/deck/mula/eye-white-left.svg", x: 237, y: 179, w: 52.627, h: 74.157}, parts: [
      {id: "pupil-left", src: "../assets/deck/mula/pupil-left.svg", x: 253.1, y: 195.82, w: 30.547, h: 40.592}
    ]},
    {id: "nose-tip", src: "../assets/deck/mula/nose-tip.svg", x: 288, y: 245.66, w: 20, h: 19},
    {id: "button-1", src: "../assets/deck/mula/button-1.svg", x: 243, y: 438, w: 15, h: 14},
    {id: "button-2", src: "../assets/deck/mula/button-2.svg", x: 242, y: 458, w: 15, h: 14},
    {id: "ellipse-24", src: "../assets/deck/mula/ellipse-24.svg", x: 215, y: 226, w: 66.685, h: 66.685, rot: 17.83, iw: 53, ih: 53, inset: [0, 0, 50, 0]},
    {id: "ellipse-25", src: "../assets/deck/mula/ellipse-25.svg", x: 312, y: 225, w: 69.298, h: 69.298, rot: -22.6, iw: 53, ih: 53, inset: [0, 0, 50, 0]},
    {id: "ellipse-28", src: "../assets/deck/mula/ellipse-28.svg", x: 319.75, y: 232.75, w: 53.807, h: 53.807, rot: -0.88, iw: 53, ih: 53, inset: [0, 0, 50, 0]},
    {id: "nose", src: "../assets/deck/mula/nose.svg", x: 287, y: 236.66, w: 22, h: 17, inset: [9.89, 7.6, 0, 7.6]},
    {id: "sole", src: "../assets/deck/mula/sole.svg", x: 217, y: 694, w: 161, h: 29},
    {id: "hair-tuft", src: "../assets/deck/mula/hair-tuft.svg", x: 192, y: 124, w: 37, h: 37},
    {id: "mouth", src: "../assets/deck/mula/mouth.svg", x: 267, y: 263, w: 45.119, h: 18.121, rot: 12.79, iw: 44.332, ih: 8.52, inset: [-35.21, -6.77, -35.21, -6.77]},
    {id: "hair-ellipse-4", src: "../assets/deck/mula/hair-ellipse-4.svg", x: 139, y: 70.51, w: 225.834, h: 227.872, rot: 135.57, skew: -0.51, iw: 160.395, ih: 160.46, inset: [50, 0.53, 0, 0.53]},
    {id: "hair-ellipse-26", src: "../assets/deck/mula/hair-ellipse-26.svg", x: 227.01, y: 67, w: 225.751, h: 227.79, rot: 43.5, flip: true, skew: 0.51, iw: 160.395, ih: 160.46, inset: [50, 0.53, 0, 0.53]},
    {id: "hair-ellipse-3", src: "../assets/deck/mula/hair-ellipse-3.svg", x: 234.89, y: 67.11, w: 137.589, h: 138.825, rot: 61.19, skew: 0.43, iw: 101.903, ih: 101.407, inset: [50, 0.88, 0, 0.88]},
    {group: "arm-right", pivot: [343, 352], rest: 55, parts: [
      {id: "hand-right", src: "../assets/deck/mula/hand-right.svg", x: 450, y: 353, w: 88.39, h: 88.386, rot: -44.85, iw: 63, ih: 62},
      {id: "finger", fill: "#d5a06e", radius: 14, x: 495, y: 369, w: 57.292, h: 36.029, rot: -76.68, iw: 24.454, ih: 53.086},
      {id: "sleeve-right", src: "../assets/deck/mula/sleeve-right.svg", x: 118, y: 302, w: 439.553, h: 302.086}
    ]},
    {group: "arm-left", pivot: [253, 347], rest: -6, parts: [
      {id: "hand-left", src: "../assets/deck/mula/hand-left.svg", x: 148, y: 466, w: 63, h: 62},
      {id: "sleeve-left", src: "../assets/deck/mula/sleeve-left.svg", x: 118, y: 302, w: 439.553, h: 302.086}
    ]},
    {id: "scarf-tail", src: "../assets/deck/mula/scarf-tail.svg", x: 118, y: 302, w: 439.553, h: 302.086}
  ],
  dulo: [
    {id: "hair-back", fill: "#3d3d3d", radius: 15, x: 194, y: 172, w: 207, h: 207},
    {group: "leg-right", pivot: [312, 480], parts: [
      {id: "leg-right", fill: "#d5a06e", radius: 6, x: 293, y: 476, w: 38, h: 130},
      {id: "boot-right", fill: "#3d3d3d", radius: 10, x: 293, y: 616, w: 55, h: 65},
      {id: "sole-right", fill: "#3d3d3d", radius: 14.5, x: 297.5, y: 694, w: 80.5, h: 29}
    ]},
    {group: "leg-left", pivot: [277, 480], parts: [
      {id: "leg-left", fill: "#d5a06e", radius: 6, x: 258, y: 474, w: 38, h: 132},
      {id: "boot-left", src: "../assets/deck/dulo/boot-left.svg", x: 245, y: 616, w: 55, h: 65},
      {id: "sole-left", fill: "#3d3d3d", radius: 14.5, x: 217, y: 694, w: 80.5, h: 29}
    ]},
    {id: "dress-top", src: "../assets/deck/dulo/dress-top.svg", x: 81, y: 315, w: 431.436, h: 291.089},
    {id: "dress-skirt", src: "../assets/deck/dulo/dress-skirt.svg", x: 81, y: 315, w: 431.436, h: 291.089},
    {group: "finger-left", pivot: [250, 345], rest: -62, mirror: 169.3, parts: [
      {id: "rect-14", fill: "#d5a06e", radius: 14, x: 93.71, y: 331, w: 61.776, h: 53.54, rot: -55.78, iw: 25.929, ih: 57.076}
    ]},
    {group: "finger-right", pivot: [345, 345], rest: 62, mirror: 10.7, parts: [
      {id: "rect-16", fill: "#d5a06e", radius: 14, x: 430, y: 327, w: 61.776, h: 53.54, rot: -124.22, flip: true, iw: 25.929, ih: 57.076}
    ]},
    {group: "arm-left", pivot: [250, 345], rest: -62, mirror: 169.3, parts: [
      {id: "rect-15", fill: "#d5a06e", radius: 14, x: 67, y: 343, w: 82.747, h: 62.821, rot: -117.39, iw: 30.706, ih: 77.286},
      {id: "sleeve-left", src: "../assets/deck/dulo/sleeve-left.svg", x: 81, y: 315, w: 431.436, h: 291.089}
    ]},
    {group: "arm-right", pivot: [345, 345], rest: 62, mirror: 10.7, parts: [
      {id: "rect-17", fill: "#d5a06e", radius: 14, x: 435.74, y: 339, w: 82.747, h: 62.821, rot: -62.61, flip: true, iw: 30.706, ih: 77.286},
      {id: "sleeve-right", src: "../assets/deck/dulo/sleeve-right.svg", x: 81, y: 315, w: 431.436, h: 291.089}
    ]},
    {id: "sash-tail", src: "../assets/deck/dulo/sash-tail.svg", x: 311, y: 385, w: 92, h: 135.358, rot: 5.28, iw: 80.526, ih: 128.498},
    {id: "collar", fill: "#cb6539", radius: 6, x: 271, y: 291, w: 54, h: 52},
    {id: "collar-wide", fill: "#cb6539", radius: 6, x: 235, y: 318, w: 124, h: 52},
    {id: "sash", fill: "#f2b866", radius: 6, x: 240, y: 402, w: 112, h: 30},
    {id: "ear-left", src: "../assets/deck/dulo/ear-left.svg", x: 180, y: 213, w: 43, h: 43},
    {id: "ear-right", src: "../assets/deck/dulo/ear-right.svg", x: 370, y: 219, w: 43, h: 43},
    {id: "hair-crown", src: "../assets/deck/dulo/hair-crown.svg", x: 183, y: 81, w: 230, h: 230},
    {id: "bun-left", src: "../assets/deck/dulo/bun-left.svg", x: 171, y: 63, w: 93, h: 93},
    {id: "bun-right", src: "../assets/deck/dulo/bun-right.svg", x: 331, y: 64, w: 97, h: 97},
    {id: "face", fill: "#d5a06e", radius: 40, x: 208, y: 156, w: 179, h: 155},
    {id: "ellipse-10", src: "../assets/deck/dulo/ellipse-10.svg", x: 244, y: 139, w: 147.565, h: 150.815, rot: -102.09, iw: 127.769, ih: 123.54, inset: [50, 1.32, 0, 1.32]},
    {id: "eye-white-left", src: "../assets/deck/dulo/eye-white-left.svg", x: 237, y: 179, w: 52.627, h: 74.157},
    {id: "eye-white-right", src: "../assets/deck/dulo/eye-white-right.svg", x: 306.37, y: 179, w: 52.627, h: 74.157},
    {group: "eye-right", mask: {src: "../assets/deck/dulo/eye-white-right.svg", x: 306.37, y: 179, w: 52.627, h: 74.157}, parts: [
      {id: "group-9", src: "../assets/deck/dulo/group-9.svg", x: 311.08, y: 202.37, w: 20.532, h: 33.5},
      {id: "pupil-right", src: "../assets/deck/dulo/pupil-right.svg", x: 303.98, y: 195.75, w: 30.547, h: 40.592}
    ]},
    {group: "eye-left", mask: {src: "../assets/deck/dulo/eye-white-left.svg", x: 237, y: 179, w: 52.627, h: 74.157}, parts: [
      {id: "pupil-left", src: "../assets/deck/dulo/pupil-left.svg", x: 253.1, y: 195.82, w: 30.547, h: 40.592}
    ]},
    {id: "nose-tip", src: "../assets/deck/dulo/nose-tip.svg", x: 288, y: 245.66, w: 20, h: 19},
    {id: "button-1", src: "../assets/deck/dulo/button-1.svg", x: 243, y: 381, w: 15, h: 14},
    {id: "button-2", src: "../assets/deck/dulo/button-2.svg", x: 243, y: 361, w: 15, h: 14},
    {id: "ellipse-16-left", src: "../assets/deck/dulo/ellipse-16-left.svg", x: 237, y: 178, w: 53, h: 53, inset: [0, 0, 50, 0]},
    {id: "ellipse-16-right", src: "../assets/deck/dulo/ellipse-16-right.svg", x: 306, y: 178, w: 53, h: 53, inset: [0, 0, 50, 0]},
    {id: "nose", src: "../assets/deck/dulo/nose.svg", x: 287, y: 236.66, w: 22, h: 17, inset: [9.89, 7.6, 0, 7.6]},
    {id: "mouth", src: "../assets/deck/dulo/mouth.svg", x: 272, y: 274, w: 44.894, h: 4.92, rot: -1.06, iw: 44.826, ih: 4.094, inset: [-73.3, -6.69, -73.3, -6.69]},
    {id: "mouth-corner", src: "../assets/deck/dulo/mouth-corner.svg", x: 317, y: 270, w: 6.69, h: 12.328, rot: 18.71, iw: 3, ih: 12, inset: [-25, -100.01, -25, -100.01]},
    {id: "sole", src: "../assets/deck/dulo/sole.svg", x: 217, y: 694, w: 161, h: 29},
    {id: "hair-tuft", src: "../assets/deck/dulo/hair-tuft.svg", x: 192, y: 124, w: 37, h: 37},
    {id: "hair-ellipse-4", src: "../assets/deck/dulo/hair-ellipse-4.svg", x: 138, y: 71.83, w: 227.386, h: 227.386, rot: 136.29, iw: 160.827, ih: 160.827, inset: [50, 0.52, 0, 0.52]},
    {id: "hair-ellipse-26", src: "../assets/deck/dulo/hair-ellipse-26.svg", x: 226.61, y: 69, w: 227.386, h: 227.386, rot: 43.71, flip: true, iw: 160.827, ih: 160.827, inset: [50, 0.52, 0, 0.52]},
    {id: "hair-ellipse-3", src: "../assets/deck/dulo/hair-ellipse-3.svg", x: 235.1, y: 69, w: 138.225, h: 138.225, rot: 61.44, iw: 101.908, ih: 101.908, inset: [50, 0.87, 0, 0.87]}
  ],
};

// Running together (character step 3, Entrance/Moving): Mula runs ahead pointing and pulls Dulo
// along by the hand. Angles are added to each group's Figma pose at its pivot; x is each
// character frame's left edge inside the pair while running (standing: Mula 0, Dulo 520).
// Running right, Mula dashes past Dulo to the front; running left, both are mirrored.
// Mula's back hand (86, 341) meets Dulo's front hand (479, 345), so Mula is 393 ahead of Dulo.
window.CHARACTER_RUN = {
  right: { mula: 517, dulo: 124 },
  left: { mula: 4, dulo: 397 }, // both mirrored about their own frames
  stride: 320, // pair units travelled per running step (one leg forward)
  legSwing: 26, // degrees each leg swings at the hip
  bob: 14, // hop height per step
  arms: {
    mula: { "arm-right": 0, "arm-left": 66 }, // pointing ahead (Figma pose); reaching back to Dulo
    dulo: { "arm-right": -10.9, "finger-right": -10.9, "arm-left": null, "finger-left": null } // null: stays at rest, swinging
  },
  armSwing: 12,
  look: 8, // pupils shift toward where they're running
  // While running both feet point forward: each sole half slides so its toe sticks out in front
  // of its boot (standing, the left one sticks out left and the right one right, as in Figma)
  soles: { "sole-left": [217, 245], "sole-right": [297.5, 293] }, // x standing, x running
  // Mula's finger uncurls out of her hand as the run starts (and curls back as she stops),
  // turning about her knuckle
  finger: { knuckle: [510, 390], curl: 75 },
  // Hair streams back, away from where they're running, and flutters with each step.
  // origin: what it turns about (character units); rot: degrees (+ swings it back); skew: degrees.
  // The bangs only tilt a little, so they never slide over the eyes.
  hair: {
    mula: [
      { id: "pigtail-left", origin: [230, 300], rot: 18 },
      { id: "pigtail-right", origin: [370, 300], rot: -12 },
      { id: "hair-ellipse-4", origin: [298, 75], rot: 1.5 },
      { id: "hair-ellipse-26", origin: [298, 75], rot: 1.5 },
      { id: "hair-ellipse-3", origin: [298, 75], rot: 1.5 },
      { id: "hair-tuft", origin: [298, 75], rot: 1.5 }
    ],
    dulo: [
      { id: "hair-back", origin: [297, 172], skew: -9 },
      { id: "hair-ellipse-4", origin: [298, 75], rot: 1.5 },
      { id: "hair-ellipse-26", origin: [298, 75], rot: 1.5 },
      { id: "hair-ellipse-3", origin: [298, 75], rot: 1.5 },
      { id: "hair-tuft", origin: [298, 75], rot: 1.5 }
    ]
  },
  hairFlutter: 3 // extra degrees back and forth with each step
};

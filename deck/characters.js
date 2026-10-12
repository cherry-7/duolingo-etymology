// Mula and Dulo, from Figma (Duolingo Morphology - Suri & Dulo, Frame 5 = Mula, Frame 9 = Dulo).
// Each part in the 604x774 character frame, back to front, so limbs can animate on their own.
//   x, y, w, h   the part's box; rot / flip / skew rotate an inner iw x ih box about its centre
//   inset       where the image sits inside that box (top, right, bottom, left, in %)
//   src | fill + radius   an exported SVG, or a plain rounded rectangle
//   group       an arm (sleeve + hand) that turns about pivot; rest is its idle angle (arms
//               down, Michelle's call; Figma has them out). Arms sit in front of the body.
//   mirror      flip the arm over along its length (the line at this angle through pivot)
//   mask        a group shown only inside this shape (pupils stay inside the eye whites)
//   axis        the line along the arm (degrees), for stretching it along its length
// Arms bend at the elbow: each sleeve is shown twice, clipped (clip: polygon in character units)
// to the shoulder side and to the hand side of a cut across the arm at its midpoint; the hand
// side turns in an elbow group. At rest the halves line up exactly.
// Legs bend at the knee: thigh, then a knee group (shin, boot, sole half) that turns at the knee.
// smile-teeth is Dulo's broad smile for step 4 (drawn by Claude, approved by Michelle).
// The sole is one bar under both boots (Figma Rectangle 10); while running, each foot carries
// its own half (sole-left / sole-right) instead.
window.CHARACTER_PARTS = {
  mula: [
    {id: "pigtail-left", src: "../assets/deck/mula/pigtail-left.svg", x: 101, y: 225, w: 184.755, h: 184.755, rot: 32.95, iw: 133.584, ih: 133.584, inset: [9.73, 13.81, 25, 13.81]},
    {id: "pigtail-right", src: "../assets/deck/mula/pigtail-right.svg", x: 308, y: 226, w: 184.755, h: 184.755, rot: 147.05, flip: true, iw: 133.584, ih: 133.584, inset: [9.73, 13.81, 25, 13.81]},
    {group: "leg-right", pivot: [312, 480], parts: [
      {id: "thigh-right", fill: "#d5a06e", radius: 6, x: 293, y: 476, w: 38, h: 74},
      {group: "knee-right", pivot: [312.0, 540], parts: [
        {id: "shin-right", fill: "#d5a06e", radius: 6, x: 293, y: 530, w: 38, h: 76},
        {id: "boot-right", fill: "#3d3d3d", radius: 10, x: 293, y: 616, w: 55, h: 65},
        {id: "sole-right", fill: "#3d3d3d", radius: 14.5, x: 297.5, y: 694, w: 80.5, h: 29}
      ]}
    ]},
    {group: "leg-left", pivot: [277, 480], parts: [
      {id: "thigh-left", fill: "#d5a06e", radius: 6, x: 258, y: 474, w: 38, h: 76},
      {group: "knee-left", pivot: [277.0, 540], parts: [
        {id: "shin-left", fill: "#d5a06e", radius: 6, x: 258, y: 530, w: 38, h: 76},
        {id: "boot-left", src: "../assets/deck/mula/boot-left.svg", x: 245, y: 616, w: 55, h: 65},
        {id: "sole-left", fill: "#3d3d3d", radius: 14.5, x: 217, y: 694, w: 80.5, h: 29}
      ]}
    ]},
    {id: "dress-top", src: "../assets/deck/mula/dress-top.svg", x: 118, y: 302, w: 439.553, h: 302.086},
    {id: "dress-skirt", src: "../assets/deck/mula/dress-skirt.svg", x: 118, y: 302, w: 439.553, h: 302.086},
    {id: "scarf", fill: "#638CD9", radius: 6, x: 240, y: 291, w: 112, h: 52},
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
    {group: "arm-right", pivot: [343, 352], rest: 55, axis: 16.6, parts: [
      {id: "sleeve-right-upper", src: "../assets/deck/mula/sleeve-right.svg", x: 118, y: 302, w: 439.553, h: 302.086, clip: [[-149.4, 2291.8], [993.0, -1541.6], [-923.7, -2112.8], [-2066.1, 1720.6]]},
      {group: "elbow-arm-right", pivot: [418, 374], parts: [
        {id: "hand-right", src: "../assets/deck/mula/hand-right.svg", x: 450, y: 353, w: 88.39, h: 88.386, rot: -44.85, iw: 63, ih: 62},
        {id: "finger", fill: "#d5a06e", radius: 14, x: 495, y: 369, w: 57.292, h: 36.029, rot: -76.68, iw: 24.454, ih: 53.086},
        {id: "sleeve-right-lower", src: "../assets/deck/mula/sleeve-right.svg", x: 118, y: 302, w: 439.553, h: 302.086, clip: [[-157.0, 2289.6], [985.4, -1543.8], [2902.1, -972.6], [1759.7, 2860.8]]}
      ]}
    ]},
    {group: "arm-left", pivot: [253, 347], rest: -6, axis: 116.1, parts: [
      {id: "sleeve-left-upper", src: "../assets/deck/mula/sleeve-left.svg", x: 118, y: 302, w: 439.553, h: 302.086, clip: [[-1581.7, -454.4], [2010.2, 1305.6], [2890.3, -490.4], [-701.7, -2250.4]]},
      {group: "elbow-arm-left", pivot: [216, 422], parts: [
        {id: "hand-left", src: "../assets/deck/mula/hand-left.svg", x: 148, y: 466, w: 63, h: 62},
        {id: "sleeve-left-lower", src: "../assets/deck/mula/sleeve-left.svg", x: 118, y: 302, w: 439.553, h: 302.086, clip: [[-1578.2, -461.6], [2013.7, 1298.4], [1133.7, 3094.4], [-2458.3, 1334.4]]}
      ]}
    ]},
    {id: "scarf-tail", src: "../assets/deck/mula/scarf-tail.svg", x: 118, y: 302, w: 439.553, h: 302.086}
  ],
  dulo: [
    {id: "hair-back", fill: "#6E4533", radius: 15, x: 194, y: 172, w: 207, h: 207},
    {group: "leg-right", pivot: [312, 480], parts: [
      {id: "thigh-right", fill: "#d5a06e", radius: 6, x: 293, y: 476, w: 38, h: 74},
      {group: "knee-right", pivot: [312.0, 540], parts: [
        {id: "shin-right", fill: "#d5a06e", radius: 6, x: 293, y: 530, w: 38, h: 76},
        {id: "boot-right", fill: "#3d3d3d", radius: 10, x: 293, y: 616, w: 55, h: 65},
        {id: "sole-right", fill: "#3d3d3d", radius: 14.5, x: 297.5, y: 694, w: 80.5, h: 29}
      ]}
    ]},
    {group: "leg-left", pivot: [277, 480], parts: [
      {id: "thigh-left", fill: "#d5a06e", radius: 6, x: 258, y: 474, w: 38, h: 76},
      {group: "knee-left", pivot: [277.0, 540], parts: [
        {id: "shin-left", fill: "#d5a06e", radius: 6, x: 258, y: 530, w: 38, h: 76},
        {id: "boot-left", src: "../assets/deck/dulo/boot-left.svg", x: 245, y: 616, w: 55, h: 65},
        {id: "sole-left", fill: "#3d3d3d", radius: 14.5, x: 217, y: 694, w: 80.5, h: 29}
      ]}
    ]},
    {id: "dress-top", src: "../assets/deck/dulo/dress-top.svg", x: 81, y: 315, w: 431.436, h: 291.089},
    {id: "dress-skirt", src: "../assets/deck/dulo/dress-skirt.svg", x: 81, y: 315, w: 431.436, h: 291.089},
    {group: "finger-left", pivot: [250, 345], rest: -62, mirror: 169.3, parts: [
      {group: "elbow-finger-left", pivot: [179, 360], parts: [
        {id: "rect-14", fill: "#d5a06e", radius: 14, x: 93.71, y: 331, w: 61.776, h: 53.54, rot: -55.78, iw: 25.929, ih: 57.076}
      ]}
    ]},
    {group: "finger-right", pivot: [345, 345], rest: 62, mirror: 10.7, parts: [
      {group: "elbow-finger-right", pivot: [411, 357], parts: [
        {id: "rect-16", fill: "#d5a06e", radius: 14, x: 430, y: 327, w: 61.776, h: 53.54, rot: -124.22, flip: true, iw: 25.929, ih: 57.076}
      ]}
    ]},
    {group: "arm-left", pivot: [250, 345], rest: -62, mirror: 169.3, parts: [
      {id: "sleeve-left-upper", src: "../assets/deck/dulo/sleeve-left.svg", x: 81, y: 315, w: 431.436, h: 291.089, clip: [[-225.1, -1598.8], [575.3, 2320.4], [2534.8, 1920.2], [1734.4, -1998.9]]},
      {group: "elbow-arm-left", pivot: [179, 360], parts: [
        {id: "rect-15", fill: "#d5a06e", radius: 14, x: 67, y: 343, w: 82.747, h: 62.821, rot: -117.39, iw: 30.706, ih: 77.286},
        {id: "sleeve-left-lower", src: "../assets/deck/dulo/sleeve-left.svg", x: 81, y: 315, w: 431.436, h: 291.089, clip: [[-217.3, -1600.4], [583.1, 2318.8], [-1376.4, 2718.9], [-2176.8, -1200.2]]}
      ]}
    ]},
    {group: "arm-right", pivot: [345, 345], rest: 62, mirror: 10.7, parts: [
      {id: "sleeve-right-upper", src: "../assets/deck/dulo/sleeve-right.svg", x: 81, y: 315, w: 431.436, h: 291.089, clip: [[42.8, 2322.8], [787.1, -1607.3], [-1178.0, -1979.5], [-1922.3, 1950.6]]},
      {group: "elbow-arm-right", pivot: [411, 357], parts: [
        {id: "rect-17", fill: "#d5a06e", radius: 14, x: 435.74, y: 339, w: 82.747, h: 62.821, rot: -62.61, flip: true, iw: 30.706, ih: 77.286},
        {id: "sleeve-right-lower", src: "../assets/deck/dulo/sleeve-right.svg", x: 81, y: 315, w: 431.436, h: 291.089, clip: [[34.9, 2321.3], [779.2, -1608.8], [2744.3, -1236.6], [2000.0, 2693.5]]}
      ]}
    ]},
    {id: "sash-tail", src: "../assets/deck/dulo/sash-tail.svg", x: 311, y: 385, w: 92, h: 135.358, rot: 5.28, iw: 80.526, ih: 128.498},
    {id: "collar", fill: "#638CD9", radius: 6, x: 271, y: 291, w: 54, h: 52},
    {id: "collar-wide", fill: "#638CD9", radius: 6, x: 235, y: 318, w: 124, h: 52},
    {id: "sash", fill: "#87D2FB", radius: 6, x: 240, y: 402, w: 112, h: 30},
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
    {id: "smile-teeth", src: "../assets/deck/dulo/smile-teeth.svg", x: 262, y: 262, w: 64, h: 34},
    {id: "sole", src: "../assets/deck/dulo/sole.svg", x: 217, y: 694, w: 161, h: 29},
    {id: "hair-tuft", src: "../assets/deck/dulo/hair-tuft.svg", x: 192, y: 124, w: 37, h: 37},
    {id: "hair-ellipse-4", src: "../assets/deck/dulo/hair-ellipse-4.svg", x: 138, y: 71.83, w: 227.386, h: 227.386, rot: 136.29, iw: 160.827, ih: 160.827, inset: [50, 0.52, 0, 0.52]},
    {id: "hair-ellipse-26", src: "../assets/deck/dulo/hair-ellipse-26.svg", x: 226.61, y: 69, w: 227.386, h: 227.386, rot: 43.71, flip: true, iw: 160.827, ih: 160.827, inset: [50, 0.52, 0, 0.52]},
    {id: "hair-ellipse-3", src: "../assets/deck/dulo/hair-ellipse-3.svg", x: 235.1, y: 69, w: 138.225, h: 138.225, rot: 61.44, iw: 101.908, ih: 101.908, inset: [50, 0.87, 0, 0.87]}
  ],
};



// Running together (character step 3, Entrance/Moving): Mula runs ahead pointing and pulls Dulo
// along by the hand. Angles are added to each group's Figma pose at its pivot; x is each
// character frame's left edge inside the pair while running (standing: Mula 65, Dulo 455).
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
  // Hair streams back, away from where they're running, and holds there (no flutter).
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
  }
};

// Reactions: pose tracks over time (seconds), sampled at fps so the motion reads frame by frame.
// Each track is [[time, value], ...], eased between points; anything without a track stays at
// its idle value. Positions are in pair units, relative to where each girl stands.
//   x, y, rot (lean about the feet), sx, sy (squash), z (in front of the other girl)
//   arm-*, leg-*, knee-*: angle at the joint, like CHARACTER_RUN (arms: from the Figma pose)
//   stretch-arm-*: arm length (1 = as drawn), flip-arm-*: 1 as drawn, -1 turned over, eyes / mouth: scale, lookX / lookY: pupils,
//   smile: Dulo's broad smile (0 hidden, 1 shown), front: arms in front of hair and scarf,
//   scarf-over: Mula's scarf tail drawn back over her arms (opacity)
// effects.lines: motion lines at the two palm contacts (opacity track; points in pair units)
//
// Step 4, Correct answer (Michelle's 9-beat brief, 2026-10-11), at 24 fps:
//   0.00 both turn toward each other   0.25 Mula bends her knees, throws both hands up
//   0.25 Dulo plants a wide stance and raises both hands   0.55 Mula jumps, knees bent back
//   0.90 double high five: the hands next to each other meet high between their heads, the
//        outer hands cross in front and meet lower down; squash, motion lines; Mula thrilled,
//        Dulo breaks into a broad smile   1.30 Mula lands beside Dulo   1.70 shoulder to
//        shoulder, outer arms up, proud   3.00 back to where they stand   3.50 idle
window.CHARACTER_REACTIONS = {
  correct: {
    fps: 24,
    duration: 3.5,
    // Contact angles were solved against the rendered hands (Mula at 170, -70; Dulo at 425 in the pair; they now stand at 65 and 455):
    // upper palms meet at (594, 205), lower palms at (600, 395), in pair units
    mula: {
      x: [[0, 0], [0.25, 0], [0.55, 20], [0.9, 105], [1.3, 105], [1.55, 100], [3.0, 100], [3.5, 0]],
      y: [[0, 0], [0.25, 0], [0.5, 12], [0.6, 8], [0.9, -70], [1.3, -70], [1.5, 0], [1.6, 8], [1.75, 0]],
      rot: [[0, 0], [0.12, 4], [0.25, 3], [0.9, 0]],
      sx: [[0, 1], [0.08, 0.86], [0.18, 1], [0.9, 1], [0.94, 1.06], [1.02, 1]],
      sy: [[0.9, 1], [0.94, 0.94], [1.02, 1]],
      "arm-right": [[0, 55], [0.25, 55], [0.5, -76.6], [0.9, -15], [1.3, -15], [1.6, 55], [3.5, 55]],
      // top arm in a mirrored L for the high five: upper arm out level toward Dulo, forearm straight up
      "elbow-arm-right": [[0.5, 0], [0.9, -90], [1.3, -90], [1.6, 0]],
      "arm-left": [[0, -6], [0.25, -6], [0.5, 124], [0.9, -82.5], [1.3, -82.5], [1.65, 109], [3.0, 109], [3.5, -6]], // proud: up and out, clear of her face
      "stretch-arm-left": [[0.8, 1], [0.9, 1.25], [1.3, 1.25], [1.45, 1]],
      "leg-left": [[0.25, 0], [0.5, -16], [0.6, -8], [0.9, 10], [1.3, 10], [1.5, 0], [1.6, -10], [1.75, 0]],
      "leg-right": [[0.25, 0], [0.5, 16], [0.6, 8], [0.9, -10], [1.3, -10], [1.5, 0], [1.6, 10], [1.75, 0]],
      "knee-left": [[0.25, 0], [0.5, 32], [0.6, 10], [0.9, 55], [1.3, 55], [1.5, 0], [1.6, 20], [1.75, 0]],
      "knee-right": [[0.25, 0], [0.5, -32], [0.6, -10], [0.9, -55], [1.3, -55], [1.5, 0], [1.6, -20], [1.75, 0]],
      lookX: [[0, 0], [0.12, 8], [1.3, 8], [1.6, 0]],
      lookY: [[0.5, 0], [0.9, -4], [1.3, -4], [1.6, 0]],
      eyes: [[0.2, 1], [0.3, 1.12], [3.0, 1.12], [3.3, 1]],
      mouth: [[0.2, 1], [0.3, 1.4], [3.0, 1.4], [3.3, 1]],
      // her scarf stays under her arms: arms in front all along; the scarf copy above them
      // hides once her top arm has swung clear of the tail (0.36) and fades back in after the
      // arm is down at rest, where it lay over the sleeve before
      front: [[0, 1], [3.5, 1]],
      "scarf-over": [[0, 1], [0.36, 1], [0.37, 0], [1.6, 0], [1.85, 1]]
    },
    dulo: {
      x: [[0, 0], [0.25, 0], [0.6, -30], [3.0, -30], [3.5, 0]],
      z: [[0, 1], [3.5, 1]], // in front of Mula, so Mula's hands never disappear behind her
      rot: [[0, 0], [0.12, -4], [0.25, -3], [0.9, 0]],
      sx: [[0, 1], [0.08, 0.86], [0.18, 1], [0.9, 1], [0.94, 1.06], [1.02, 1]],
      sy: [[0.9, 1], [0.94, 0.94], [1.02, 1]],
      "leg-left": [[0.25, 0], [0.55, 9], [3.0, 9], [3.5, 0]],
      "leg-right": [[0.25, 0], [0.55, -9], [3.0, -9], [3.5, 0]],
      // raises both hands, ready for the double high five
      "arm-left": [[0, -62], [0.3, -62], [0.8, 70], [1.3, 70], [1.65, -62], [3.5, -62]],
      "elbow-arm-left": [[0.3, 0], [0.8, 1], [1.3, 1], [1.6, 0]],
      "stretch-arm-left": [[0.8, 1], [0.9, 1.1], [1.3, 1.1], [1.45, 1]],
      "arm-right": [[0, 62], [0.3, 62], [0.8, 153], [1.3, 153], [1.65, -50.7], [3.0, -50.7], [3.5, 62]], // proud: swings down and out, then up clear of her face
      "stretch-arm-right": [[0.8, 1], [0.9, 1.3], [1.3, 1.3], [1.45, 1]],
      front: [[0, 0], [0.29, 0], [0.3, 1], [3.45, 1], [3.5, 0]],
      lookX: [[0, 0], [0.12, -8], [1.3, -8], [1.6, 0]],
      lookY: [[0.5, 0], [0.9, -4], [1.3, -4], [1.6, 0]],
      smile: [[0.9, 0], [0.98, 1], [3.0, 1], [3.1, 0]]
    },
    effects: {
      lines: [[0.88, 0], [0.92, 1], [1.15, 1], [1.28, 0]],
      points: [[594, 205], [600, 395]]
    }
  }
};

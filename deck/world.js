// The "world": one continuous layer behind the slides for scene slides (layout "scene").
//
// Instead of each slide owning its own background and art, the world has one background
// color and one set of actors (twins, photo, bubble, swirls...). Each scene slide says where
// every actor sits (deck/slides.js). As the deck moves between two scene slides:
//   - the background color fades from one slide's color to the next
//   - an actor on both slides travels from its spot on one to its spot on the other
//   - an actor on only one side enters or exits (its enter/exit settings say how)
// Everything is driven by the deck position, so it scrubs with the scroll and reverses.
//
// Coordinates are Figma's: a 1920 x 1080 stage, scaled to fit the screen (letterboxed).

window.World = (function () {
  const W = 1920;
  const H = 1080;
  const SVG = "http://www.w3.org/2000/svg";

  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const soft = (x) => (1 - Math.cos(Math.PI * x)) / 2; // gentle in-out, the spring does the rest
  const backOut = (x) => 1 + 2.2 * Math.pow(x - 1, 3) + 1.2 * Math.pow(x - 1, 2); // slight overshoot
  // Lands and bounces a couple of times, smaller each time (things dropped onto the floor)
  const bounceOut = (x) => {
    const n = 7.5625, d = 2.75;
    if (x < 1 / d) return n * x * x;
    if (x < 2 / d) return n * (x -= 1.5 / d) * x + 0.75;
    if (x < 2.5 / d) return n * (x -= 2.25 / d) * x + 0.9375;
    return n * (x -= 2.625 / d) * x + 0.984375;
  };

  function hex(c) {
    const n = parseInt(c.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  function mixColor(a, b, t) {
    if (!a) return b;
    if (!b || a === b) return a;
    const x = hex(a);
    const y = hex(b);
    return `rgb(${x.map((v, i) => Math.round(lerp(v, y[i], t))).join(",")})`;
  }

  // Local progress of one actor within a transition, from its at: [start, end] (fractions of t)
  function local(t, at, fallback) {
    const [a, b] = at || fallback || [0, 1];
    return soft(clamp((t - a) / (b - a), 0, 1));
  }

  function el(tag, cls, parent) {
    const node = tag === "svg" || tag === "path" || tag === "g" ? document.createElementNS(SVG, tag) : document.createElement(tag);
    if (cls) node.setAttribute("class", cls);
    if (parent) parent.append(node);
    return node;
  }

  // ---- Speech bubble ------------------------------------------------------
  // Shape from the Figma bubble (design/slides/svgs/Group 28.svg): a white rounded
  // rectangle (radius 50) whose top corner curls out into a tail. Built for any size.
  // Coordinates are relative to the body's top-left; the tail pokes out to the left.
  function tailLeft(w, h) {
    return `M-30.83 95.76C-81.24 75.03 -66.41 0 -11.9 0H${w - 50}C${w - 22.39} 0 ${w} 22.39 ${w} 50V${h - 50}` +
      `C${w} ${h - 22.39} ${w - 22.39} ${h} ${w - 50} ${h}H50C22.39 ${h} 0 ${h - 22.39} 0 ${h - 50}V141.77` +
      `C0 121.6 -12.18 103.43 -30.83 95.76Z`;
  }

  function roundedRect(w, h, r) {
    return `M${r} 0H${w - r}A${r} ${r} 0 0 1 ${w} ${r}V${h - r}A${r} ${r} 0 0 1 ${w - r} ${h}H${r}` +
      `A${r} ${r} 0 0 1 0 ${h - r}V${r}A${r} ${r} 0 0 1 ${r} 0Z`;
  }

  // A group's turn at its pivot: angle (degrees from its Figma pose), and flip, the scale across
  // the arm's own length (-1 mirrors it along the line at p.mirror degrees, 1 is as drawn)
  // stretch: length along the arm's own axis (1 = as drawn), for squash and stretch
  function groupTransform(p, angle, flip, stretch = 1) {
    const m = p.mirror ?? p.axis ?? 0;
    if (flip === 1 && stretch === 1) return `rotate(${angle}deg)`;
    return `rotate(${angle}deg) rotate(${m}deg) scale(${stretch}, ${flip}) rotate(${-m}deg)`;
  }

  // One character part from deck/characters.js: an outer box at x, y; inside it, an iw x ih box
  // centred and rotated (rot / flip / skew); inside that, the SVG (at inset) or a rounded fill
  function characterPart(p) {
    // A group (an arm: sleeve plus hand) is a frame-sized layer that turns about its pivot
    if (p.group) {
      const g = document.createElement("div");
      g.className = "part-group group-" + p.group;
      g.style.cssText = "position:absolute;left:0;top:0;width:604px;height:774px";
      if (p.pivot) {
        g.style.transformOrigin = `${p.pivot[0]}px ${p.pivot[1]}px`;
        g.style.transform = groupTransform(p, p.rest || 0, p.mirror != null ? -1 : 1);
      }
      if (p.mask) {
        const m = p.mask;
        const mask = `url("${m.src}") ${m.x}px ${m.y}px / ${m.w}px ${m.h}px no-repeat`;
        g.style.webkitMask = mask;
        g.style.mask = mask;
      }
      p.parts.forEach((q) => g.append(characterPart(q)));
      return g;
    }
    const box = document.createElement("div");
    box.className = "part part-" + p.id;
    box.style.cssText = `position:absolute;left:${p.x}px;top:${p.y}px;width:${p.w}px;height:${p.h}px`;
    // clip: a polygon in character units (half a sleeve, for the elbow)
    if (p.clip) box.style.clipPath = `polygon(${p.clip.map(([x, y]) => `${x - p.x}px ${y - p.y}px`).join(", ")})`;
    const iw = p.iw ?? p.w;
    const ih = p.ih ?? p.h;
    const turn = document.createElement("div");
    turn.style.cssText = `position:absolute;left:${(p.w - iw) / 2}px;top:${(p.h - ih) / 2}px;width:${iw}px;height:${ih}px;` +
      `transform:rotate(${p.rot || 0}deg)${p.skew ? ` skewX(${p.skew}deg)` : ""}${p.flip ? " scaleY(-1)" : ""}`;
    box.append(turn);
    if (p.src) {
      const [t, r, b, l] = p.inset || [0, 0, 0, 0];
      const img = document.createElement("img");
      img.src = p.src;
      img.alt = "";
      img.style.cssText = `position:absolute;display:block;max-width:none;top:${t}%;right:${r}%;bottom:${b}%;left:${l}%;` +
        `width:${100 - l - r}%;height:${100 - t - b}%`;
      turn.append(img);
    } else {
      turn.style.background = p.fill;
      turn.style.borderRadius = p.radius + "px";
    }
    return box;
  }

  // ---- Actor renderers -----------------------------------------------------
  // Each takes a resolved state (numbers already interpolated) and draws it.

  // Every part that moves with the head (same list as breathe-head in deck.css)
  const HEAD_PARTS = [".part-face", ".part-ear-left", ".part-ear-right", ".part-hair-back", ".part-hair-tuft",
    ".part-hair-crown", ".part-bun-left", ".part-bun-right", ".part-hair-ellipse-4", ".part-hair-ellipse-26",
    ".part-hair-ellipse-3", ".part-ellipse-10", ".part-eye-white-left", ".part-eye-white-right", ".group-eye-left",
    ".group-eye-right", ".part-nose", ".part-nose-tip", ".part-mouth", ".part-mouth-corner", ".part-ellipse-16-left",
    ".part-ellipse-16-right", ".part-ellipse-24", ".part-ellipse-25", ".part-ellipse-28", ".part-pigtail-left",
    ".part-pigtail-right", ".part-smile-teeth", ".part-eye-shut"].join(", ");

  const kinds = {
    img(def, layer) {
      // Outer layer travels; the image inside can have an idle loop (def.idle, e.g. "breathe")
      const node = el("div", "actor actor-img" + (def.className ? " " + def.className : ""), layer);
      const img = el("img", def.idle ? "idle-" + def.idle : null, node);
      img.src = def.src;
      img.alt = "";
      img.style.width = def.w + "px";
      img.style.height = def.h + "px";
      return (s) => {
        node.style.opacity = s.opacity;
        node.style.transform = `translate(${s.x}px, ${s.y}px) scale(${s.w / def.w}) rotate(${s.rotate || 0}deg)`;
      };
    },

    // Mula and Dulo side by side, each built from her Figma parts (deck/characters.js) so
    // every part can move on its own later. def.box crops the pair to the characters
    // ([x, y, w, h] in pair units); s.w is the shown width of that box.
    pair(def, layer) {
      const node = el("div", "actor actor-pair", layer);
      const [bx, by, bw, bh] = def.box;
      // slotAspect: the height/width of the art this replaces, so the feet stay where they were
      const drop = def.slotAspect ? def.slotAspect - bh / bw : 0;
      const inner = el("div", "pair-inner", node);
      inner.style.cssText = `position:absolute;left:${-bx}px;top:${-by}px;transform-origin:0 0`;
      const run = window.CHARACTER_RUN;
      const members = def.members.map(({ who, dx }) => {
        const frame = el("div", "character character-" + who, inner);
        frame.style.cssText = `position:absolute;left:0;top:0;width:604px;height:774px;transform-origin:302px 723px`;
        const defs = {};
        const collect = (list) => list.forEach((p) => { if (p.group) { defs[p.group] = p; collect(p.parts); } });
        collect(window.CHARACTER_PARTS[who]);
        window.CHARACTER_PARTS[who].forEach((p) => frame.append(characterPart(p)));
        const groups = {};
        frame.querySelectorAll(".part-group").forEach((g) => { groups[g.className.match(/group-(\S+)/)[1]] = g; });
        frame.classList.add("idle");
        const pupils = frame.querySelectorAll(".group-eye-left > *, .group-eye-right > *");
        const soles = Object.keys(run.soles).map((id) => [frame.querySelector(".part-" + id), run.soles[id]]);
        // parts that move while running, each with its transform-origin in its own box
        const partAt = {};
        const index = (list) => list.forEach((p) => (p.group ? index(p.parts) : (partAt[p.id] = p)));
        index(window.CHARACTER_PARTS[who]);
        const hold = (id, [ox, oy]) => {
          const el = frame.querySelector(".part-" + id);
          if (el) el.style.transformOrigin = `${ox - partAt[id].x}px ${oy - partAt[id].y}px`;
          return el;
        };
        const hair = (run.hair[who] || []).map((h) => [hold(h.id, h.origin), h]).filter(([el]) => el);
        const finger = partAt.finger ? hold("finger", run.finger.knuckle) : null;
        const eyes = frame.querySelectorAll(":scope > :is(.part-eye-white-left, .part-eye-white-right, .group-eye-left, .group-eye-right)");
        const mouth = frame.querySelector(".part-mouth");
        const smile = frame.querySelector(".part-smile-teeth");
        const straight = frame.querySelectorAll(".part-mouth, .part-mouth-corner");
        // Closed eyes (the nod): a straight line across each eye, in the pupils' colour, shown
        // only while the eyes are shut
        ["left", "right"].forEach((side) => {
          const white = window.CHARACTER_PARTS[who].find((p) => p.id === "eye-white-" + side);
          const shut = el("div", "part-eye-shut part-eye-shut-" + side, frame);
          shut.style.cssText = `position:absolute;left:${white.x + 3}px;top:${white.y + white.h / 2 - 3.5}px;` +
            `width:${white.w - 6}px;height:7px;border-radius:3.5px;background:#3D3D3D;opacity:0`;
          frame.querySelector(".group-eye-" + side).after(shut);
        });
        // Mula's scarf tail lies over her sleeve. In a reaction her arms go in front of it, and
        // this copy, drawn above the arms, fades it back over them (scarf-over track), so the
        // layers never swap in a single frame where they overlap
        const tail = frame.querySelector(".part-scarf-tail");
        let scarfOver = null;
        if (tail) {
          scarfOver = tail.cloneNode(true);
          scarfOver.classList.add("scarf-over");
          frame.append(scarfOver);
        }
        return { who, dx, frame, groups, defs, pupils, soles, hair, finger, eyes, mouth, smile, straight, scarfOver };
      });
      let wasRunning = null;

      // Standing still: their spots (Mula 65, Dulo 455) and the CSS idle loops
      function stand() {
        members.forEach((m) => {
          m.frame.style.transform = `translate(${m.dx}px, 0)`;
          m.frame.style.zIndex = "";
          m.frame.classList.remove("running");
          m.pupils.forEach((p) => { p.style.translate = ""; });
          m.soles.forEach(([el, [x]]) => { el.style.left = x + "px"; });
          m.hair.forEach(([el]) => { el.style.transform = ""; });
          if (m.finger) { m.finger.style.transform = ""; m.finger.style.visibility = ""; }
          for (const [name, g] of Object.entries(m.groups)) {
            const p = m.defs[name];
            if (p.pivot) g.style.transform = groupTransform(p, p.rest || 0, p.mirror != null ? -1 : 1);
          }
          m.frame.classList.add("idle");
        });
      }

      // Running (step 3): w blends from standing into the run at the start of the move and back at
      // the end; the legs cycle with the distance covered, so scrolling back plays it in reverse.
      function runPose(move) {
        const t = clamp(move.t, 0, 1);
        const w = soft(clamp(t / 0.2, 0, 1)) * soft(clamp((1 - t) / 0.2, 0, 1));
        const dir = move.dir > 0 ? "right" : "left";
        const phase = (t * move.dist) / run.stride; // steps taken
        const swing = Math.sin(phase * Math.PI) * w; // -1..1, one leg forward per step
        const bob = Math.abs(Math.sin(phase * Math.PI)) * run.bob * w;
        members.forEach((m) => {
          m.frame.classList.toggle("idle", w === 0);
          m.frame.classList.toggle("running", w > 0); // each foot carries its half of the sole
          const x = lerp(m.dx, run[dir][m.who], w);
          const turn = dir === "left" ? lerp(1, -1, w) : 1; // turns to face left, like a sprite
          m.frame.style.transform = `translate(${x}px, ${-bob}px) scaleX(${turn})`;
          m.frame.style.zIndex = m.who === "mula" ? 1 : ""; // Mula in front, holding Dulo's hand
          // eyes on where they're going (the frame is mirrored when running left)
          m.pupils.forEach((p) => { p.style.translate = `${run.look * w}px 0`; });
          m.soles.forEach(([el, [x0, x1]]) => { el.style.left = lerp(x0, x1, w) + "px"; }); // toes forward
          // hair streams back, away from where they're running (steady, no flutter)
          m.hair.forEach(([el, h]) => {
            el.style.transform = h.skew ? `skewX(${h.skew * w}deg)` : `rotate(${h.rot * w}deg)`;
          });
          // Mula's finger uncurls out of her hand in the second half of the blend
          if (m.finger) {
            const f = soft(clamp((w - 0.35) / 0.65, 0, 1));
            m.finger.style.visibility = f > 0 ? "visible" : "hidden";
            m.finger.style.transform = `rotate(${(1 - f) * run.finger.curl}deg) scale(${0.25 + 0.75 * f})`;
          }
          const legs = { "leg-left": swing * run.legSwing, "leg-right": -swing * run.legSwing };
          for (const [name, g] of Object.entries(m.groups)) {
            const p = m.defs[name];
            if (!p.pivot) continue;
            if (legs[name] != null) { g.style.transform = `rotate(${legs[name]}deg)`; continue; }
            if (!(name in run.arms[m.who])) continue; // knees stay straight while running
            const target = run.arms[m.who][name];
            const rest = p.rest || 0;
            const restFlip = p.mirror != null ? -1 : 1;
            if (target == null) {
              g.style.transform = groupTransform(p, rest + (name.endsWith("left") ? 1 : -1) * swing * run.armSwing, restFlip);
            } else {
              // into the drawn Figma pose (unflips Dulo's arm as it comes up)
              g.style.transform = groupTransform(p, lerp(rest, target, w), lerp(restFlip, 1, w));
            }
          }
        });
      }

      // Reactions (step 4, "correct"): pose tracks from CHARACTER_REACTIONS, played once on
      // arrival at their own frame rate, then back to idle
      const lines = el("div", "pair-lines", inner);
      lines.style.cssText = "position:absolute;left:0;top:0;opacity:0;pointer-events:none;z-index:3";
      lines.innerHTML = [0, 1].map(() => `<svg width="120" height="120" viewBox="-60 -60 120 120" style="position:absolute;overflow:visible">` +
        [[-48, -30], [-50, 8], [48, -30], [50, 8]].map(([x, y]) =>
          `<line x1="${x * 0.55}" y1="${y * 0.55}" x2="${x}" y2="${y}" stroke="#3D3D3D" stroke-width="9" stroke-linecap="round"/>`).join("") +
        "</svg>").join("");
      const at = (track, t, fallback) => {
        if (!track || !track.length) return fallback;
        if (t <= track[0][0]) return track[0][1];
        for (let i = 1; i < track.length; i++) {
          const [t1, v1] = track[i];
          const [t0, v0] = track[i - 1];
          if (t <= t1) return lerp(v0, v1, soft((t - t0) / (t1 - t0 || 1)));
        }
        return track[track.length - 1][1];
      };
      function pose(R, t) {
        members.forEach((m) => {
          const k = R[m.who] || {};
          const v = (name, fallback) => at(k[name], t, fallback);
          const x = m.dx + v("x", 0);
          m.frame.style.transform = `translate(${x}px, ${v("y", 0)}px) rotate(${v("rot", 0)}deg) scale(${v("sx", 1)}, ${v("sy", 1)})`;
          m.frame.style.zIndex = v("z", 0) ? 1 : "";
          for (const [name, g] of Object.entries(m.groups)) {
            const p = m.defs[name];
            if (!p.pivot) continue;
            const arm = name.replace("finger", "arm"); // Dulo's fingers move with her arms
            // flip-*: turn the arm over along its length (-1), e.g. Mula's top arm in the high five
            const flip = v("flip-" + arm, p.mirror != null ? -1 : 1);
            g.style.transform = groupTransform(p, v(arm, p.rest || 0), flip, v("stretch-" + arm, 1));
            if (arm.startsWith("arm")) g.style.zIndex = v("front", 0) ? 1 : "";
          }
          m.pupils.forEach((p) => { p.style.translate = `${v("lookX", 0)}px ${v("lookY", 0)}px`; });
          m.eyes.forEach((e) => { e.style.scale = v("eyes", 1); });
          if (m.mouth) m.mouth.style.scale = v("mouth", 1);
          if (m.scarfOver) m.scarfOver.style.opacity = v("scarf-over", 0);
          if (m.smile) {
            const sm = v("smile", 0);
            m.smile.style.opacity = sm;
            m.smile.style.scale = 0.7 + 0.3 * sm;
            m.straight.forEach((e) => { e.style.opacity = 1 - sm; });
          }
        });
        const fx = R.effects;
        if (fx) {
          const o = at(fx.lines, t, 0);
          lines.style.opacity = o;
          [...lines.children].forEach((svg, i) => {
            const [px, py] = fx.points[i];
            svg.style.transform = `translate(${px - 60}px, ${py - 60}px) scale(${0.6 + 0.6 * o})`;
          });
        }
      }
      const REACT_PAUSE = 500; // ms they stand still between arriving and reacting
      let pendingReact = null;
      let pendingTimer = 0;
      let reacting = null;
      let reactStart = 0;
      let reactFrame = 0;
      function react(name) {
        if (name === reacting) return;
        cancelAnimationFrame(reactFrame);
        reacting = name;
        const R = name && window.CHARACTER_REACTIONS[name];
        const reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
        if (!R || reduce) { finishReaction(); return; }
        stand(); // clear anything the run left behind (mirroring, hair, soles, eyes)
        members.forEach((m) => { m.frame.classList.remove("idle"); m.frame.classList.add("reacting"); });
        reactStart = performance.now();
        const tick = (now) => {
          const t = (now - reactStart) / 1000;
          if (t >= R.duration) { finishReaction(); return; }
          pose(R, Math.floor(t * R.fps) / R.fps); // held frames: R.fps per second
          reactFrame = requestAnimationFrame(tick);
        };
        reactFrame = requestAnimationFrame(tick);
      }
      function finishReaction() {
        members.forEach((m) => {
          m.frame.classList.remove("reacting");
          m.eyes.forEach((e) => { e.style.scale = ""; });
          if (m.mouth) m.mouth.style.scale = "";
          if (m.scarfOver) m.scarfOver.style.opacity = "";
          if (m.smile) { m.smile.style.opacity = ""; m.smile.style.scale = ""; m.straight.forEach((e) => { e.style.opacity = ""; }); }
          for (const g of Object.values(m.groups)) g.style.zIndex = "";
        });
        lines.style.opacity = 0;
        stand();
      }

      // Nod (Saissha's speech bubbles): once a bubble has appeared, both heads dip once and come
      // back up, twice. Added on top of the breathing, so it never fights the idle loop.
      // On each dip the head also flattens a little (squashes toward the chin), and their eyes
      // stay closed through both nods, shutting like a blink.
      const NOD = { dip: 16, flat: 0.07, chin: 311, duration: 1100 };
      const heads = members.flatMap((m) => [...m.frame.querySelectorAll(":scope > :is(" + HEAD_PARTS + ")")]);
      const EYES = ".part-eye-white-left, .part-eye-white-right, .group-eye-left, .group-eye-right";
      const track = (keys, t) => {
        for (let i = 1; i < keys.length; i++) {
          const [t0, v0] = keys[i - 1];
          const [t1, v1] = keys[i];
          if (t <= t1) return lerp(v0, v1, (t - t0) / (t1 - t0));
        }
        return keys[keys.length - 1][1];
      };
      const DIPS = [[0, 0], [0.22, 1], [0.48, 0], [0.72, 1], [1, 0]];
      // the eyes shrink shut and the line takes over for the last sliver (and the reverse)
      const LIDS = [[0, 1], [0.12, 0], [0.88, 0], [1, 1]];
      const LINE = [{ opacity: 0 }, { opacity: 0, offset: 0.07 }, { opacity: 1, offset: 0.11 }, { opacity: 1, offset: 0.89 }, { opacity: 0, offset: 0.93 }, { opacity: 0 }];
      const NOD_AT = [0, 0.12, 0.22, 0.35, 0.48, 0.6, 0.72, 0.88, 1];
      let nodded = null;
      function nod() {
        const reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
        if (reduce || !heads[0] || !heads[0].animate) return;
        heads.forEach((h) => {
          // each part scales about its own origin; shift it so the head squashes about the chin
          const originY = h.offsetTop + parseFloat(getComputedStyle(h).transformOrigin.split(" ")[1]);
          const eye = h.matches(EYES);
          h.animate(NOD_AT.map((t) => {
            const d = track(DIPS, t);
            const sy = 1 - NOD.flat * d;
            return {
              offset: t,
              translate: `0 ${NOD.dip * d + (1 - sy) * (NOD.chin - originY)}px`,
              scale: `1 ${sy * (eye ? track(LIDS, t) : 1)}`,
              easing: "ease-in-out" // per beat
            };
          }), { duration: NOD.duration, composite: "add" });
          if (h.matches(".part-eye-shut")) h.animate(LINE, { duration: NOD.duration });
        });
      }

      stand();
      return (s) => {
        node.style.opacity = s.opacity;
        if (s.nod !== nodded) {
          nodded = s.nod;
          if (s.nod && !reacting) nod();
        }
        node.style.transform = `translate(${s.x}px, ${s.y + s.w * drop}px) scale(${s.w / bw}) rotate(${s.rotate || 0}deg)`;
        const running = !!s.move && s.move.t > 0 && s.move.t < 1;
        // A reaction on this slide: they finish their run, stand for REACT_PAUSE, then react
        // (the wait is a timer, since the deck stops rendering once it has settled)
        const runDone = !s.move || s.move.t >= 0.97;
        if (s.react && reacting === s.react) return;
        if (s.react && runDone) {
          if (pendingReact !== s.react) {
            pendingReact = s.react;
            clearTimeout(pendingTimer);
            pendingTimer = setTimeout(() => react(pendingReact), REACT_PAUSE);
          }
        } else if (pendingReact) {
          pendingReact = null;
          clearTimeout(pendingTimer);
        }
        if (!s.react) react(null);
        if (running && !runDone) runPose(s.move);
        else if (wasRunning !== false) stand();
        wasRunning = running && !runDone;
      };
    },

    // Research card: a 704x514 Figma card frame (swatches, labels, character) shown at def.w wide
    research(def, layer) {
      // Layout is set inline (not in deck.css) so a cached old stylesheet can't scramble the card
      const node = el("div", "actor research-card", layer);
      Object.assign(node.style, { width: "704px", height: "514px", background: "#2B70C9", borderRadius: "70.3px", boxShadow: "14.6px 14.6px 0 #18529C" });
      const place = (child, p) => {
        Object.assign(child.style, { position: "absolute", left: p.x + "px", top: p.y + "px", width: p.w + "px", height: p.h + "px", margin: 0 });
        return child;
      };
      def.swatches.forEach((p) => {
        const sw = place(el("div", "research-swatch", node), p);
        Object.assign(sw.style, { background: p.fill, borderRadius: "20px" });
      });
      def.parts.forEach((p) => {
        const img = el("img", null, node);
        img.src = p.src;
        img.alt = "";
        place(img, p);
        Object.assign(img.style, { display: "block", borderRadius: p.round ? "70.3px" : 0, boxShadow: "none" });
      });
      return (s) => {
        node.style.opacity = s.opacity;
        node.style.transform = `translate(${s.x}px, ${s.y}px) scale(${s.w / 704}) rotate(${s.rotate || 0}deg)`;
      };
    },

    ellipse(def, layer) {
      const node = el("div", "actor actor-ellipse", layer);
      return (s) => {
        node.style.opacity = s.opacity;
        node.style.background = s.color;
        node.style.transform = `translate(${s.x}px, ${s.y}px) scale(${s.w / 100}, ${s.h / 100})`;
      };
    },

    // Border around the whole stage (the orange frame on the User Story slides). Drawn as
    // two lines from the top middle, down the left and right sides, meeting at the bottom
    // middle; draw 0 = none, 1 = closed frame. The stroke is centred on the stage edge
    // (the outer half is clipped), so a width-W frame uses a 2W stroke.
    frame(def, layer) {
      const svg = el("svg", "actor actor-frame", layer);
      svg.setAttribute("width", W);
      svg.setAttribute("height", H);
      const halves = [
        `M${W / 2} 0H0V${H}H${W / 2}`, // left
        `M${W / 2} 0H${W}V${H}H${W / 2}` // right
      ].map((d) => {
        const path = el("path", null, svg);
        path.setAttribute("d", d);
        path.setAttribute("fill", "none");
        const length = path.getTotalLength();
        path.style.strokeDasharray = `${length} ${length}`;
        return { path, length };
      });
      return (s) => {
        svg.style.opacity = s.opacity;
        halves.forEach(({ path, length }) => {
          path.setAttribute("stroke", s.color);
          path.setAttribute("stroke-width", 2 * s.width);
          path.style.strokeDashoffset = length * (1 - clamp(s.draw, 0, 1));
        });
      };
    },

    // A stroked line that draws itself: draw 0 = nothing, 1 = whole line
    path(def, layer) {
      const svg = el("svg", "actor actor-path", layer);
      svg.setAttribute("width", W);
      svg.setAttribute("height", H);
      svg.setAttribute("overflow", "visible");
      // Optional idle loop (def.idle, e.g. "drift") on a group, so it never fights the travel transform
      const group = el("g", def.idle ? "idle-" + def.idle : null, svg);
      if (def.idleDelay) group.style.animationDelay = def.idleDelay;
      const path = el("path", null, group);
      path.setAttribute("d", window.SHAPES[def.shape]);
      path.setAttribute("fill", "none");
      path.setAttribute("stroke", def.stroke);
      path.setAttribute("stroke-width", def.width);
      if (def.cap) path.setAttribute("stroke-linecap", def.cap);
      const length = path.getTotalLength();
      path.style.strokeDasharray = `${length} ${length}`;
      return (s) => {
        svg.style.opacity = s.opacity;
        svg.style.transform = `translate(${s.x}px, ${s.y}px)`;
        path.style.strokeDashoffset = length * (1 - clamp(s.draw, 0, 1));
      };
    },

    // Text block. x is the left edge, centre or right edge depending on align.
    // def.letters: each letter can pop in on its own (enter: { letters: true })
    // def.kern: { letterIndex: em } nudges single letters to match the Figma spacing
    text(def, layer) {
      const node = el("div", "actor actor-text " + (def.font || ""), layer);
      const a = el("div", "text-a", node);
      const b = el("div", "text-b", node);
      let spans = [];
      return (s) => {
        node.style.opacity = s.opacity;
        node.style.color = s.color;
        node.style.fontSize = s.size + "px";
        node.style.textAlign = s.align || "left";
        const shift = s.align === "center" ? "-50%" : s.align === "right" ? "-100%" : "0";
        node.style.transform = `translate(${s.x}px, ${s.y}px) translateX(${shift})`;
        if (!def.letters) return crossfade(a, b, s);
        if (a.dataset.text !== s.textA) {
          a.dataset.text = s.textA;
          a.replaceChildren(...[...s.textA].map((ch) => el("span", "letter")));
          spans = [...a.children];
          spans.forEach((span, i) => {
            span.textContent = s.textA[i];
            if (def.kern && def.kern[i]) span.style.marginLeft = def.kern[i] + "em";
          });
        }
        popLetters(spans, s.letters ?? 1, s.letterOffset || 0);
      };
    },

    // Solid rectangle (panels, dividers); can grow from any edge by animating w/h
    rect(def, layer) {
      const node = el("div", "actor actor-rect", layer);
      return (s) => {
        node.style.opacity = s.opacity;
        node.style.background = s.color;
        node.style.width = Math.max(0, s.w) + "px";
        node.style.height = Math.max(0, s.h) + "px";
        node.style.transform = `translate(${s.x}px, ${s.y}px)`;
      };
    },

    // Card from the stack (design/slides/svgs/Card Stack): rounded blue card with a darker
    // outline. Rotates around its centre. def.texts makes it a flashcard whose words ride
    // on it; reveal (0-1) brings those words up once the card has landed (last ~10%).
    card(def, layer) {
      const node = el("div", "actor actor-card", layer);
      node.style.width = def.w + "px";
      node.style.height = def.h + "px";
      const words = (def.texts || []).map((t) => {
        const w = el("div", "card-text " + (t.font || ""), node);
        w.textContent = t.text;
        w.style.left = t.x - def.origin[0] + "px";
        w.style.top = t.y - def.origin[1] + "px";
        w.style.fontSize = t.size + "px";
        w.style.color = t.color;
        return w;
      });
      return (s) => {
        node.style.opacity = s.opacity;
        node.style.transform = `translate(${s.x}px, ${s.y}px) rotate(${s.rotate || 0}deg) scale(${s.scale ?? 1})`;
        words.forEach((w, i) => {
          const k = soft(clamp((s.reveal - 0.88 - i * 0.025) / 0.1, 0, 1));
          w.style.opacity = k;
          w.style.transform = k < 1 ? `translateY(${(1 - k) * 50}px)` : "";
        });
      };
    },

    // Quote with one highlighted word: write it as *word* in the text. An orange pill sweeps
    // across behind that word as reveal goes from 0.6 to 1 (Interviews slides).
    quote(def, layer) {
      const node = el("div", "actor actor-text actor-quote " + (def.font || ""), layer);
      let html = null;
      let pills = [];
      return (s) => {
        node.style.opacity = s.opacity;
        node.style.color = s.color;
        node.style.fontSize = s.size + "px";
        node.style.transform = `translate(${s.x}px, ${s.y}px)`;
        if (html !== s.textA) {
          html = s.textA;
          const safe = s.textA.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
          node.innerHTML = safe.replace(/\*([^*]+)\*/g, '<span class="highlight">$1</span>');
          pills = [...node.querySelectorAll(".highlight")];
        }
        const sweep = soft(clamp((s.reveal - 0.6) / 0.4, 0, 1));
        pills.forEach((p) => p.style.setProperty("--sweep", sweep));
      };
    },

    // Colour swatch: rounded block with its hex code near the bottom (Character Color slide)
    swatch(def, layer) {
      const node = el("div", "actor actor-swatch", layer);
      const label = el("div", "swatch-label", node);
      label.textContent = def.label;
      label.style.color = def.labelColor;
      node.style.background = def.color;
      node.style.width = def.w + "px";
      node.style.height = def.h + "px";
      return (s) => {
        node.style.opacity = s.opacity;
        node.style.transform = `translate(${s.x}px, ${s.y}px) scale(${s.scale ?? 1})`;
      };
    },

    // White pill with a short label (the Morphology 3 pills)
    pill(def, layer) {
      const node = el("div", "actor actor-pill condensed", layer);
      const label = el("div", null, node);
      return (s) => {
        node.style.opacity = s.opacity;
        node.style.width = s.w + "px";
        node.style.height = s.h + "px";
        node.style.borderRadius = s.h / 2 + "px";
        node.style.fontSize = s.size + "px";
        node.style.transform = `translate(${s.x}px, ${s.y}px) scale(${s.scale ?? 1})`;
        node.style.paddingLeft = (s.padX ?? 0) + "px";
        if (label.textContent !== s.textA) label.textContent = s.textA;
      };
    },

    // Speech bubble: body box (x, y, w, h), tail on the left or right, text inside
    bubble(def, layer) {
      const node = el("div", "actor actor-bubble", layer);
      const shape = el("svg", "bubble-shape", node);
      shape.setAttribute("overflow", "visible");
      // Solid body, plus a left and a right tail version that crossfade when the tail switches sides
      const body = el("path", null, shape);
      const left = el("path", null, shape);
      const right = el("path", null, shape);
      [body, left, right].forEach((p) => p.setAttribute("fill", "white"));
      const text = el("div", "bubble-text condensed", node);
      const a = el("div", "text-a", text);
      const b = el("div", "text-b", text);
      return (s) => {
        node.style.opacity = s.opacity;
        // The pop-in scales from the tail tip
        const ox = s.tail > 0.5 ? s.w + 70 : -70;
        node.style.transformOrigin = `${ox}px 96px`;
        node.style.transform = `translate(${s.x}px, ${s.y}px) scale(${s.scale ?? 1})`;
        shape.setAttribute("width", s.w);
        shape.setAttribute("height", s.h);
        body.setAttribute("d", roundedRect(s.w, s.h, 50));
        left.setAttribute("d", tailLeft(s.w, s.h));
        right.setAttribute("d", tailLeft(s.w, s.h));
        right.setAttribute("transform", `translate(${s.w} 0) scale(-1 1)`);
        left.style.opacity = 1 - s.tail; // tail 0 = left, 1 = right
        right.style.opacity = s.tail;
        text.style.width = s.w + "px";
        text.style.height = s.h + "px";
        text.style.fontSize = s.size + "px";
        a.style.left = b.style.left = s.padX + "px";
        crossfade(a, b, s);
      };
    }
  };

  // Letters pop up one after another: t 0 = none shown, 1 = all in place.
  // offset delays this word's letters (counted in letters), so two words can pop as one.
  function popLetters(spans, t, offset) {
    const n = spans.length + offset;
    const gap = 0.06; // each letter starts this much (of t) after the previous one
    const span = 1 - gap * (n - 1);
    spans.forEach((sp, i) => {
      const li = clamp((t - gap * (i + offset)) / Math.max(span, 0.2), 0, 1);
      const k = backOut(li);
      sp.style.opacity = clamp(li * 2, 0, 1);
      sp.style.transform = li < 1 ? `translateY(${(1 - k) * 120}px) scale(${0.6 + 0.4 * k})` : "";
    });
  }

  // Two text layers so a text change doesn't jump. Never both at once: the old text fades
  // out early (first 30% of the move), the new one fades in late (last 30%). Bubbles resize
  // in between (BUBBLE_AT), so text is never shown in a bubble of the wrong size.
  function crossfade(a, b, s) {
    if (a.textContent !== s.textA) a.textContent = s.textA;
    if (b.textContent !== (s.textB || "")) b.textContent = s.textB || "";
    const t = s.raw ?? s.textMix;
    a.style.opacity = s.textB ? clamp(1 - t / 0.3, 0, 1) : 1;
    b.style.opacity = s.textB ? clamp((t - 0.7) / 0.3, 0, 1) : 0;
  }
  const BUBBLE_AT = [0.25, 0.8];

  // A new line of speech: the old bubble pops back into its tail, then the new one pops
  // out of its tail with the same overshoot as the first bubble. Never both at once.
  function swapBubble(pa, pb, t) {
    const out = clamp(t / 0.4, 0, 1);
    const pop = clamp((t - 0.45) / 0.4, 0, 1);
    if (pop <= 0) {
      const s = mix(pa, pa, 0);
      s.scale = 1 - soft(out);
      return s;
    }
    const s = mix(pb, pb, 0);
    s.scale = Math.max(0, backOut(pop));
    return s;
  }

  // ---- State interpolation -------------------------------------------------

  const NUMERIC = ["x", "y", "w", "h", "opacity", "rotate", "draw", "width", "size", "scale", "tail", "padX", "letters", "reveal"];

  function withDefaults(p) {
    return Object.assign({ opacity: 1, rotate: 0, draw: 1, scale: 1, tail: 0, letters: 1, reveal: 1 }, p);
  }

  // Placement p with an enter/exit offset applied:
  //   dx, dy        shift from its spot
  //   opacity, draw, width, scale, rotate, w, h, reveal   values to start (or end) at
  //   from          absolute values to start from, e.g. { x, y, w, h } for a circle growing from a point
  //   letters       pop the text in letter by letter instead
  // With none of those, it simply fades.
  const OFFSET_KEYS = ["opacity", "draw", "width", "scale", "rotate", "w", "h", "reveal"];
  function offset(p, o) {
    const q = Object.assign({}, p);
    if (!o) return Object.assign(q, { opacity: 0 });
    if (o.letters) return Object.assign(q, { letters: 0 });
    if (o.dx) q.x = p.x + o.dx;
    if (o.dy) q.y = p.y + o.dy;
    OFFSET_KEYS.forEach((k) => { if (o[k] != null) q[k] = o[k]; });
    if (o.from) Object.assign(q, o.from);
    const moves = o.dx != null || o.dy != null || o.from || OFFSET_KEYS.some((k) => o[k] != null);
    if (!moves) q.opacity = 0;
    return q;
  }

  function mix(p, q, t, pop, back) {
    const s = {};
    // "back": a little overshoot; "bounce": lands and bounces
    const tt = back === "bounce" ? bounceOut(t) : back ? backOut(t) : t;
    NUMERIC.forEach((k) => {
      if (p[k] != null || q[k] != null) s[k] = lerp(p[k] ?? q[k], q[k] ?? p[k], k === "opacity" ? t : tt);
    });
    s.letterOffset = q.letterOffset ?? p.letterOffset;
    if (pop) s.scale = Math.max(0, lerp(p.scale ?? 1, q.scale ?? 1, backOut(t)));
    s.color = mixColor(p.color, q.color, t);
    s.align = q.align || p.align;
    const ta = p.text ?? q.text ?? "";
    const tb = q.text ?? p.text ?? "";
    s.textA = ta;
    s.textB = ta !== tb ? tb : "";
    s.textMix = t;
    return s;
  }

  // Spiral in, like a card trick: the actor circles its spot, the circle tightening to
  // nothing as it arrives. orbit: { r: start radius (px), angle: start angle (deg),
  // turns: how far it goes around }
  function spiral(s, o, t) {
    const left = 1 - t;
    const a = ((o.angle || 0) + 360 * (o.turns || 0.75) * left) * Math.PI / 180;
    s.x += Math.cos(a) * o.r * left;
    s.y += Math.sin(a) * o.r * left;
    s.opacity = clamp(t / 0.2, 0, 1); // fades in fast, then it's a solid card spinning in
    return s;
  }

  // Fanning out: an extra turn that swells in the second half of the entrance and settles
  // back to nothing as it lands, so a stack spreads like a hand of cards, then closes to
  // its final angles. Peaks at t = 0.75.
  function fanBump(t) {
    return Math.sin(Math.PI * clamp((t - 0.5) / 0.5, 0, 1));
  }

  // Walking bob: little hops while an actor travels (walk = hop height in px)
  function walk(s, p, t) {
    if (p.walk && t > 0 && t < 1) s.y -= Math.abs(Math.sin(t * Math.PI * 4)) * p.walk;
    return s;
  }

  // ---- Mount ----------------------------------------------------------------

  function mount(container, slides, actors) {
    const world = el("div", "world");
    container.prepend(world); // behind the slides
    const stage = el("div", "world-stage", world);
    const draw = {};
    const order = Object.keys(actors).sort((a, b) => (actors[a].z || 0) - (actors[b].z || 0));
    order.forEach((key) => {
      const def = actors[key];
      draw[key] = kinds[def.type](def, stage);
    });

    // Bubbles with no size get one from their text (measured once fonts load)
    function measure() {
      const probe = el("div", "bubble-text condensed measure", stage);
      slides.forEach((slide) => {
        const b = slide.layout === "scene" && slide.actors.bubble;
        if (!b || !b.auto) return;
        probe.style.fontSize = b.size + "px";
        probe.textContent = b.text;
        const r = probe.getBoundingClientRect();
        const scale = stage.getBoundingClientRect().width / W || 1;
        b.padX = b.padX ?? b.size * 0.55;
        b.w = r.width / scale + 2 * b.padX;
        b.h = r.height / scale + 2 * b.size * 0.58;
      });
      probe.remove();
    }
    slides.forEach((slide) => {
      const b = slide.layout === "scene" && slide.actors.bubble;
      if (b) b.padX = b.padX ?? b.size * 0.55;
    });

    function fit() {
      const k = Math.min(window.innerWidth / W, window.innerHeight / H);
      stage.style.transform = `translate(-50%, -50%) scale(${k})`;
    }
    window.addEventListener("resize", fit);
    fit();

    // deck/?ref overlays each slide's Figma export at half opacity, to check alignment
    const ref = /[?&]ref\b/.test(location.search) ? el("img", "world-ref", stage) : null;
    measure();
    if (document.fonts) document.fonts.ready.then(() => { measure(); render(lastPos); });

    const isScene = (i) => !!slides[i] && slides[i].layout === "scene";
    let lastPos = 0;
    let travel = 1; // which way the deck last moved: 1 forward, -1 back

    // pos: the deck position in slides (fractional mid-move)
    function render(pos) {
      if (lastPos != null && pos !== lastPos) travel = pos > lastPos ? 1 : -1;
      lastPos = pos;
      let i = Math.floor(pos);
      let t = pos - i;
      // Next to a regular slide, the world just holds the scene slide's resting state
      if (isScene(i) && !isScene(i + 1)) t = 0;
      if (!isScene(i) && isScene(i + 1)) { i += 1; t = 0; }
      const A = isScene(i) ? slides[i] : null;
      const B = isScene(i + 1) && t > 0 ? slides[i + 1] : null;
      world.style.visibility = A ? "visible" : "hidden";
      if (!A) return;

      world.style.background = mixColor(A.bg, B ? B.bg : A.bg, B ? local(t, B.bgAt) : 0);
      if (ref) {
        const near = slides[Math.round(pos)];
        const src = near && near.ref ? "../design/slides/" + near.ref + ".png" : "";
        if (ref.getAttribute("src") !== src) ref.setAttribute("src", src);
      }

      order.forEach((key) => {
        const pa = A.actors[key] && withDefaults(A.actors[key]);
        const pb = B && B.actors[key] && withDefaults(B.actors[key]);
        let s;
        if (pa && pb && actors[key].type === "bubble" && pa.text !== pb.text) {
          s = swapBubble(pa, pb, t);
        } else if (pa && pb) {
          const lt = local(t, pb.at || (actors[key].type === "bubble" ? BUBBLE_AT : null));
          s = walk(mix(pa, pb, lt), pb, lt);
          s.raw = t; // text fades follow the whole move
          if (actors[key].type === "pair") s.move = running(pb.x - pa.x, lt);
        } else if (pa && B) {
          // Exits: from its spot toward its exit offset
          const lt = local(t, pa.exit && pa.exit.at, [0, 0.5]);
          s = mix(pa, offset(pa, pa.exit), lt);
          if (actors[key].type === "pair" && pa.exit) s.move = running(pa.exit.dx || 0, lt);
          // fade: [start, end] fades out on its own schedule (e.g. only at the very end)
          if (pa.exit && pa.exit.fade) s.opacity = pa.opacity * (1 - local(t, pa.exit.fade));
        } else if (pb) {
          // Enters: from its enter offset into its spot
          const lt = local(t, pb.enter && pb.enter.at, [0.5, 1]);
          s = mix(offset(pb, pb.enter), pb, lt, pb.enter && pb.enter.pop, pb.enter && (pb.enter.ease === "bounce" ? "bounce" : pb.enter.ease === "back"));
          if (pb.enter && pb.enter.orbit) spiral(s, pb.enter.orbit, lt);
          if (pb.enter && pb.enter.fan) s.rotate += pb.enter.fan * fanBump(lt);
          if (pb.enter && pb.enter.fade) s.opacity = pb.opacity * local(t, pb.enter.fade);
        } else if (pa) {
          s = mix(pa, pa, 0);
        } else {
          s = { opacity: 0, x: -9999, y: 0, w: 1, h: 1, draw: 0, width: 0, size: 1, scale: 1, tail: 0, padX: 0, textA: "" };
        }
        // A pair reacts (e.g. the correct-answer high five) on its slide: the pair waits for its run
        // to finish, pauses, then reacts
        if (actors[key].type === "pair") {
          const near = Math.round(pos);
          s.react = slides[near] && slides[near].react && slides[near].actors[key] ? slides[near].react : null;
          // ...and nods once a slide with nod: true has arrived (its bubble is up)
          const here = slides[near] && slides[near].nod && slides[near].actors[key] && Math.abs(pos - near) < 0.02;
          s.nod = here ? slides[near].id : null;
        }
        draw[key](s);
      });
    }

    // A pair moving sideways runs (character step 3); dir is the way it goes on screen, which
    // flips when the deck is scrolled back
    function running(dx, lt) {
      if (Math.abs(dx) < 100) return null;
      return { t: lt, dist: Math.abs(dx), dir: Math.sign(dx) * travel };
    }

    return { render, refresh: () => { measure(); render(lastPos); } };
  }

  return { mount, characterPart };
})();

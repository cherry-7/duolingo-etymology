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
    const node = tag === "svg" || tag === "path" ? document.createElementNS(SVG, tag) : document.createElement(tag);
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

  // ---- Actor renderers -----------------------------------------------------
  // Each takes a resolved state (numbers already interpolated) and draws it.

  const kinds = {
    img(def, layer) {
      const img = el("img", "actor actor-img", layer);
      img.src = def.src;
      img.alt = "";
      img.style.width = def.w + "px";
      img.style.height = def.h + "px";
      return (s) => {
        img.style.opacity = s.opacity;
        img.style.transform = `translate(${s.x}px, ${s.y}px) scale(${s.w / def.w}) rotate(${s.rotate || 0}deg)`;
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

    // Border around the whole stage (the orange frame on the User Story slides)
    frame(def, layer) {
      const node = el("div", "actor actor-frame", layer);
      return (s) => {
        node.style.opacity = s.opacity;
        node.style.boxShadow = `inset 0 0 0 ${s.width}px ${s.color}`;
      };
    },

    // A stroked line that draws itself: draw 0 = nothing, 1 = whole line
    path(def, layer) {
      const svg = el("svg", "actor actor-path", layer);
      svg.setAttribute("width", W);
      svg.setAttribute("height", H);
      svg.setAttribute("overflow", "visible");
      const path = el("path", null, svg);
      path.setAttribute("d", window.SHAPES[def.shape]);
      path.setAttribute("fill", "none");
      path.setAttribute("stroke", def.stroke);
      path.setAttribute("stroke-width", def.width);
      const length = path.getTotalLength();
      path.style.strokeDasharray = `${length} ${length}`;
      return (s) => {
        svg.style.opacity = s.opacity;
        svg.style.transform = `translate(${s.x}px, ${s.y}px)`;
        path.style.strokeDashoffset = length * (1 - clamp(s.draw, 0, 1));
      };
    },

    // Text block. x is the left edge, centre or right edge depending on align.
    text(def, layer) {
      const node = el("div", "actor actor-text " + (def.font || ""), layer);
      const a = el("div", "text-a", node);
      const b = el("div", "text-b", node);
      return (s) => {
        node.style.opacity = s.opacity;
        node.style.color = s.color;
        node.style.fontSize = s.size + "px";
        node.style.textAlign = s.align || "left";
        const shift = s.align === "center" ? "-50%" : s.align === "right" ? "-100%" : "0";
        node.style.transform = `translate(${s.x}px, ${s.y}px) translateX(${shift})`;
        crossfade(a, b, s);
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
        text.style.padding = `0 ${s.padX}px`;
        crossfade(a, b, s);
      };
    }
  };

  // Two text layers so a text change doesn't jump: the old text fades out in the first
  // half of the move, the new one fades in during the second half (never both at once)
  function crossfade(a, b, s) {
    if (a.textContent !== s.textA) a.textContent = s.textA;
    if (b.textContent !== (s.textB || "")) b.textContent = s.textB || "";
    a.style.opacity = s.textB ? clamp(1 - 2 * s.textMix, 0, 1) : 1;
    b.style.opacity = s.textB ? clamp(2 * s.textMix - 1, 0, 1) : 0;
  }

  // ---- State interpolation -------------------------------------------------

  const NUMERIC = ["x", "y", "w", "h", "opacity", "rotate", "draw", "width", "size", "scale", "tail", "padX"];

  function withDefaults(p) {
    return Object.assign({ opacity: 1, rotate: 0, draw: 1, scale: 1, tail: 0 }, p);
  }

  // Placement p with an enter/exit offset applied (dx, dy, opacity, draw, width, scale)
  function offset(p, o) {
    const q = Object.assign({}, p);
    if (!o) return Object.assign(q, { opacity: 0 });
    if (o.dx) q.x = p.x + o.dx;
    if (o.dy) q.y = p.y + o.dy;
    ["opacity", "draw", "width", "scale", "rotate"].forEach((k) => { if (o[k] != null) q[k] = o[k]; });
    if (o.opacity == null && o.dx == null && o.dy == null && o.scale == null && o.draw == null && o.width == null) q.opacity = 0;
    return q;
  }

  function mix(p, q, t, pop) {
    const s = {};
    NUMERIC.forEach((k) => {
      if (p[k] != null || q[k] != null) s[k] = lerp(p[k] ?? q[k], q[k] ?? p[k], t);
    });
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

    // pos: the deck position in slides (fractional mid-move)
    function render(pos) {
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

      world.style.background = mixColor(A.bg, B ? B.bg : A.bg, B ? soft(t) : 0);
      if (ref) {
        const near = slides[Math.round(pos)];
        const src = near && near.ref ? "../design/slides/" + near.ref + ".png" : "";
        if (ref.getAttribute("src") !== src) ref.setAttribute("src", src);
      }

      order.forEach((key) => {
        const pa = A.actors[key] && withDefaults(A.actors[key]);
        const pb = B && B.actors[key] && withDefaults(B.actors[key]);
        let s;
        if (pa && pb) {
          const lt = local(t, pb.at);
          s = walk(mix(pa, pb, lt), pb, lt);
        } else if (pa && B) {
          // Exits: from its spot toward its exit offset
          const lt = local(t, pa.exit && pa.exit.at, [0, 0.5]);
          s = mix(pa, offset(pa, pa.exit), lt);
        } else if (pb) {
          // Enters: from its enter offset into its spot
          const lt = local(t, pb.enter && pb.enter.at, [0.5, 1]);
          s = mix(offset(pb, pb.enter), pb, lt, pb.enter && pb.enter.pop);
        } else if (pa) {
          s = mix(pa, pa, 0);
        } else {
          s = { opacity: 0, x: -9999, y: 0, w: 1, h: 1, draw: 0, width: 0, size: 1, scale: 1, tail: 0, padX: 0, textA: "" };
        }
        draw[key](s);
      });
    }

    return { render, refresh: () => { measure(); render(lastPos); } };
  }

  return { mount };
})();

// Renders window.SLIDES and handles navigation. Content lives in slides.js.
(function () {
  const slides = window.SLIDES || [];
  const config = window.DECK_CONFIG || {};
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const deck = document.getElementById("deck");

  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }

  function placeholder(label) {
    return el("div", "placeholder", label || "[TBD]");
  }

  // Image slot: shows the image, or a labeled gray box if there is none / it fails to load.
  function slot(spec, className) {
    spec = spec || {};
    const box = el("div", "slot" + (className ? " " + className : ""));
    if (spec.wide) box.classList.add("wide");
    if (spec.src) {
      const img = el("img");
      img.alt = spec.label || "";
      img.src = spec.src;
      img.onerror = () => img.replaceWith(placeholder(spec.label));
      box.append(img);
    } else {
      box.append(placeholder(spec.label));
    }
    return box;
  }

  // Marks an element to rise into place when its slide arrives
  function reveal(node) {
    node.setAttribute("data-reveal", "");
    return node;
  }

  function textBlock(slide) {
    const block = el("div", "text");
    block.append(el("h2", null, slide.heading || "[TBD]"));
    const body = Array.isArray(slide.body) ? slide.body : [slide.body || "[TBD]"];
    body.forEach((line) => block.append(el("p", null, line)));
    block.querySelectorAll("h2, p").forEach(reveal);
    return block;
  }

  const layouts = {
    basic(stage, slide) {
      stage.append(textBlock(slide), reveal(slot(slide.twins, "twins")));
    },
    lineup(stage, slide) {
      stage.append(reveal(el("h2", null, slide.heading || "[TBD]")));
      const row = el("div", "lineup");
      (slide.characters || []).forEach((c) => row.append(reveal(slot(c))));
      stage.append(row);
    },
    finale(stage, slide) {
      stage.append(slot(slide.owl, "owl"));
      const qr = el("div", "qr");
      const code = el("div", "qr-code");
      code.setAttribute("role", "img");
      code.setAttribute("aria-label", "QR code for " + config.demoUrl);
      code.innerHTML = qrSvg(config.demoUrl || "");
      qr.append(code, el("p", null, slide.line || "[TBD]"));
      stage.append(qr);
    }
  };

  function qrSvg(text) {
    const qr = qrcode(0, "M");
    qr.addData(text);
    qr.make();
    return qr.createSvgTag({ cellSize: 4, margin: 2, scalable: true });
  }

  // Build slides
  const sections = slides.map((slide, i) => {
    const section = el("section", "slide");
    section.id = slide.id || "slide-" + (i + 1);
    const stage = el("div", "stage layout-" + (slide.layout || "basic"));
    (layouts[slide.layout] || layouts.basic)(stage, slide);
    section.append(stage);
    deck.append(section);
    return section;
  });


  // Final-slide sequence: owl flies off, then the QR fades in. Replays on each visit.
  // Timing comes from the owl's CSS transition (0s under reduced motion).
  function playFinale(stage) {
    if (stage.classList.contains("owl-gone")) return;
    stage.classList.add("owl-gone");
    const owl = stage.querySelector(".owl");
    const ms = parseFloat(getComputedStyle(owl).transitionDuration) * 1000 || 0;
    stage.qrTimer = setTimeout(() => stage.classList.add("show-qr"), ms);
  }

  function resetFinale(stage) {
    clearTimeout(stage.qrTimer);
    stage.classList.remove("owl-gone", "show-qr");
  }

  function finaleOf(index) {
    return sections[index] && sections[index].querySelector(".layout-finale");
  }

  // ---- Motion -------------------------------------------------------------
  // The deck has one continuous position, measured in slides (0 = first slide).
  // Input moves `target`; `pos` follows it with a spring, so motion always starts
  // and stops smoothly. Every frame, each slide is styled from where `pos` is.

  const last = sections.length - 1;
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const STYLE_PROPS = ["transform", "clipPath", "opacity", "filter"];

  let pos = 0;
  let vel = 0;
  let target = 0;
  let rest = 0; // the slide the deck is settling on
  let running = false;
  let lastFrame = 0;

  function applyStyle(node, style) {
    STYLE_PROPS.forEach((prop) => { node.style[prop] = style && style[prop] != null ? style[prop] : ""; });
  }

  // Content of an arriving slide rises into place, one piece after another.
  // Starts are spread over t = 0.25-0.65 and each piece takes 0.35, so all land by t = 1.
  function revealContent(section, t) {
    const nodes = section.querySelectorAll("[data-reveal]");
    nodes.forEach((node, k) => {
      const start = 0.25 + (k / nodes.length) * 0.4;
      const local = ease(clamp((t - start) / 0.35, 0, 1));
      node.style.transform = local < 1 ? `translateY(${(1 - local) * 60}px)` : "";
      node.style.opacity = local < 1 ? local : "";
    });
  }

  function render() {
    sections.forEach((section, i) => {
      const scene = window.TRANSITIONS[slides[i].transition] || window.TRANSITIONS.rise;
      const nextScene = i < last ? window.TRANSITIONS[slides[i + 1].transition] || window.TRANSITIONS.rise : null;
      const arriving = clamp(pos - (i - 1), 0, 1); // 0 = not here yet, 1 = fully here
      const leaving = clamp(pos - i, 0, 1); // 0 = still here, 1 = next slide fully over it
      const visible = arriving > 0 && leaving < 1;
      section.style.visibility = visible ? "visible" : "hidden";
      section.style.zIndex = i;
      if (!visible) {
        // Off screen: reset the finale so it replays on the next visit
        if (finaleOf(i)) resetFinale(finaleOf(i));
        return;
      }
      if (i > 0 && arriving < 1) {
        applyStyle(section, scene.enter(ease(arriving)));
      } else if (nextScene && leaving > 0) {
        applyStyle(section, nextScene.leave(ease(leaving)));
      } else {
        applyStyle(section, null);
      }
      revealContent(section, i === 0 ? 1 : arriving);
    });
  }

  function settle() {
    const index = Math.round(pos);
    history.replaceState(null, "", "#" + sections[index].id);
    if (finaleOf(index)) playFinale(finaleOf(index));
  }

  // Critically damped spring: no overshoot, smooth start and stop (~0.9s per slide)
  const STIFFNESS = 38;
  const DAMPING = 2 * Math.sqrt(STIFFNESS);

  function frame(now) {
    const dt = clamp((now - lastFrame) / 1000, 0, 0.033); // frame time can be slightly before lastFrame
    lastFrame = now;
    vel += ((target - pos) * STIFFNESS - vel * DAMPING) * dt;
    pos += vel * dt;
    const done = Math.abs(target - pos) < 0.0005 && Math.abs(vel) < 0.001;
    if (done) pos = target;
    render();
    if (done) {
      running = false;
      settle();
      return;
    }
    requestAnimationFrame(frame);
  }

  function move() {
    if (reduceMotion.matches) {
      pos = target;
      vel = 0;
      render();
      settle();
      return;
    }
    if (running) return;
    running = true;
    lastFrame = performance.now();
    requestAnimationFrame(frame);
  }

  // Go to a whole slide (keys, clicker, hash). Quick repeated presses stack up.
  function go(index) {
    rest = clamp(index, 0, last);
    target = rest;
    move();
  }

  // Free scrolling (wheel, touch) moves the deck with the input, then settles on a slide.
  // A small nudge past the current slide is enough to move on to the next one.
  let settleTimer = null;
  function drift(deltaSlides) {
    target = clamp(target + deltaSlides, 0, last);
    move();
    clearTimeout(settleTimer);
    settleTimer = setTimeout(snap, 160);
  }
  function snap() {
    const d = target - rest;
    let index = Math.round(target);
    if (index === rest && Math.abs(d) > 0.12) index = rest + Math.sign(d);
    go(index);
  }

  // Arrow keys and clickers (most clickers send PageDown / PageUp)
  document.addEventListener("keydown", (e) => {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    switch (e.key) {
      case "ArrowRight":
      case "ArrowDown":
      case "PageDown":
      case "Enter":
        go(rest + 1); break;
      case " ":
        go(rest + (e.shiftKey ? -1 : 1)); break;
      case "ArrowLeft":
      case "ArrowUp":
      case "PageUp":
        go(rest - 1); break;
      case "Home":
        go(0); break;
      case "End":
        go(last); break;
      default:
        return;
    }
    e.preventDefault();
  });

  // Mouse wheel / trackpad
  window.addEventListener("wheel", (e) => {
    e.preventDefault();
    const delta = Math.abs(e.deltaY) >= Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
    const px = e.deltaMode === 1 ? delta * 40 : e.deltaMode === 2 ? delta * window.innerHeight : delta;
    drift(px / (window.innerHeight * 1.2));
  }, { passive: false });

  // Touch: drag up or left = forward
  let touch = null;
  window.addEventListener("touchstart", (e) => {
    touch = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }, { passive: true });
  window.addEventListener("touchmove", (e) => {
    if (!touch) return;
    e.preventDefault();
    const x = e.touches[0].clientX;
    const y = e.touches[0].clientY;
    const dx = touch.x - x;
    const dy = touch.y - y;
    touch = { x, y };
    drift((Math.abs(dy) >= Math.abs(dx) ? dy : dx) / window.innerHeight);
  }, { passive: false });
  window.addEventListener("touchend", () => { touch = null; }, { passive: true });

  // Open at the slide named in the URL hash, and follow hash edits in the address bar
  function hashIndex() {
    const index = sections.findIndex((s) => "#" + s.id === location.hash);
    return index >= 0 ? index : 0;
  }
  function jump(index) {
    rest = target = pos = index;
    vel = 0;
    render();
    settle();
  }
  window.addEventListener("hashchange", () => {
    if (hashIndex() !== Math.round(pos)) jump(hashIndex());
  });
  jump(hashIndex());
})();

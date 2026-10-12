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
      stage.append(slot(slide.owl, "owl"), qrBlock(slide.line));
    },
    // Live scores from the demo; streaming lives in leaderboard.js. Laid out on Figma's
    // 1920 x 1080 "Leaderboard" frame (scaled to the stage): the girl holds up the QR sign
    // on the left, the scores sit in the orange bars on the right.
    leaderboard(stage, slide) {
      const art = "../assets/deck/leaderboard/";
      const canvas = el("div", "lb");
      const img = (src, className) => {
        const node = el("img", className);
        node.src = art + src;
        node.alt = "";
        return node;
      };
      const sign = el("div", "lb-sign");
      sign.append(img("sign-board.svg", "lb-board"), img("sign-stick.svg", "lb-stick"));
      const list = el("ol", "board");
      const status = el("p", "board-status");
      canvas.append(img("girl.svg", "lb-girl"), el("div", "lb-circle"), img("wave.svg", "lb-wave"), list,
        reveal(el("h2", "lb-title", slide.heading || "[TBD]")));
      if (slide.qr) {
        // The QR sits on the sign but outside it, so it can glide over from the previous
        // slide (qr-handoff) while the sign and its line rise in around it
        const qr = qrBlock(slide.line);
        const line = qr.querySelector("p");
        line.className = "lb-scan";
        canvas.append(reveal(line), reveal(sign), slide.transition === "qr-handoff" ? qr : reveal(qr));
      } else {
        canvas.append(reveal(sign));
      }
      canvas.append(status);
      stage.append(canvas);
      // Scale the 1920-wide canvas to the stage
      const fit = () => { canvas.style.transform = `scale(${stage.clientWidth / 1920})`; };
      if (window.ResizeObserver) new ResizeObserver(fit).observe(stage);
      fit();
      if (window.Leaderboard) window.Leaderboard.mount(list, slide, status);
      else list.append(placeholder("[TBD: leaderboard unavailable]"));
    }
  };

  // QR code to the demo, with its line underneath
  function qrBlock(line) {
    const qr = el("div", "qr");
    const code = el("div", "qr-code");
    code.setAttribute("role", "img");
    code.setAttribute("aria-label", "QR code for " + config.demoUrl);
    code.innerHTML = qrSvg(config.demoUrl || "");
    qr.append(code, el("p", null, line || "[TBD]"));
    return qr;
  }

  function qrSvg(text) {
    const qr = qrcode(0, "M");
    qr.addData(text);
    qr.make();
    return qr.createSvgTag({ cellSize: 4, margin: 2, scalable: true });
  }

  // Build slides
  const sections = slides.map((slide, i) => {
    const section = el("section", "slide slide-" + (slide.layout || "basic"));
    section.id = slide.id || "slide-" + (i + 1);
    if (slide.layout === "scene") {
      // Drawn by the world layer (deck/world.js); the section stays empty and see-through
      section.classList.add("is-scene");
      deck.append(section);
      return section;
    }
    const stage = el("div", "stage layout-" + (slide.layout || "basic"));
    (layouts[slide.layout] || layouts.basic)(stage, slide);
    section.append(stage);
    deck.append(section);
    return section;
  });


  // The continuous world behind the scene slides (deck/world.js)
  const world = window.World ? window.World.mount(document.body, slides, window.WORLD_ACTORS || {}) : null;

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

  // Jump straight to the end of the sequence (owl gone, QR showing), e.g. when the
  // deck opens on the slide after it, so going back finds the finale already finished
  function finishFinale(stage) {
    clearTimeout(stage.qrTimer);
    stage.classList.add("owl-gone", "show-qr");
  }

  // Does slide i take its QR over from the slide before it?
  function handsOff(i) {
    return !!slides[i] && slides[i].transition === "qr-handoff";
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

  // "qr-handoff": the arriving slide's QR starts on top of the previous slide's QR and
  // slides straight into place (FLIP) between 10% and 80% of the move (skipping
  // the spring's slow ends, so it never creeps at either end). Then the
  // score rows rise in one after another, so the arrival plays as one sequence.
  // t is the deck's raw progress into this slide (0-1). The spring already starts and
  // stops gently, so only a soft sine ease goes on top; a second in-out ease would
  // squeeze the whole glide into a fraction of a second.
  function qrHandoff(section, prev, t) {
    const soft = (x) => (1 - Math.cos(Math.PI * x)) / 2;
    const qr = section.querySelector(".qr");
    const code = qr && qr.querySelector(".qr-code");
    const fromCode = prev && prev.querySelector(".qr-code");
    const rows = section.querySelectorAll(".board-row, .board-empty, .board-slot");
    const status = section.querySelector(".board-status");
    if (t >= 1 || !code || !fromCode) {
      if (qr) qr.style.transform = qr.style.opacity = "";
      rows.forEach((row) => { row.style.transform = row.style.opacity = ""; });
      if (status) status.style.opacity = "";
      return;
    }

    // The QR travels first
    const q = soft(clamp((t - 0.1) / 0.7, 0, 1));
    qr.style.transform = "";
    const to = code.getBoundingClientRect();
    const from = fromCode.getBoundingClientRect();
    const box = qr.getBoundingClientRect();
    const k = from.width / to.width;
    const scale = k + (1 - k) * q;
    const fullDx = from.left + from.width / 2 - (to.left + to.width / 2);
    const fullDy = from.top + from.height / 2 - (to.top + to.height / 2);
    qr.style.transformOrigin = `${to.left + to.width / 2 - box.left}px ${to.top + to.height / 2 - box.top}px`;
    qr.style.transform = `translate(${fullDx * (1 - q)}px, ${fullDy * (1 - q)}px) scale(${scale})`;
    // If the QR hadn't appeared on the previous slide yet, fade it in on the way
    const shown = prev.querySelector(".show-qr") || !prev.querySelector(".layout-finale");
    qr.style.opacity = shown ? "" : q;

    // Then the scores rise in, one row after another (starts spread over t = 0.5-0.65)
    rows.forEach((row, n) => {
      const start = 0.5 + (rows.length > 1 ? n / (rows.length - 1) : 0) * 0.15;
      const local = soft(clamp((t - start) / 0.25, 0, 1));
      row.style.transform = `translateY(${(1 - local) * 40}px)`;
      row.style.opacity = local;
    });
    if (status) status.style.opacity = t;
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
        // Off screen: reset the finale so it replays on the next visit. But while the
        // next slide has taken its QR over (and covers it), keep it finished, so going
        // back reverses cleanly; it resets once the deck is back before it.
        const finale = finaleOf(i);
        if (finale && !(leaving >= 1 && handsOff(i + 1))) resetFinale(finale);
        return;
      }
      if (slides[i].layout === "scene") {
        applyStyle(section, null); // nothing in it; the world does the motion
      } else if (i > 0 && arriving < 1) {
        applyStyle(section, scene.enter(ease(arriving)));
      } else if (nextScene && leaving > 0) {
        applyStyle(section, nextScene.leave(ease(leaving)));
      } else {
        applyStyle(section, null);
      }
      revealContent(section, i === 0 ? 1 : arriving);
      if (slides[i].transition === "qr-handoff") qrHandoff(section, sections[i - 1], arriving);
    });
    if (world) world.render(pos);
  }

  function settle() {
    const index = Math.round(pos);
    history.replaceState(null, "", "#" + sections[index].id);
    if (finaleOf(index)) playFinale(finaleOf(index));
    if (handsOff(index) && finaleOf(index - 1)) finishFinale(finaleOf(index - 1));
  }

  // Critically damped spring: no overshoot, smooth start and stop (~0.9s per slide).
  // A transition can set its own pace (see transitions.js), which scales the stiffness.
  const STIFFNESS = 38;

  // The transition the deck is moving through right now
  function currentPace() {
    const index = target > pos ? Math.floor(pos) + 1 : Math.ceil(pos);
    const slide = slides[index];
    const scene = slide && window.TRANSITIONS[slide.transition];
    return (slide && slide.pace) || (scene && scene.pace) || 1; // scene slides set pace directly
  }
  // A slide counts as arrived (hash updates, the finale starts) once the deck is this
  // close to it, in slides (0.02 = about 14px at 720p), while the last bit of motion
  // finishes. Waiting for the spring to stop completely took about a second longer.
  const ARRIVED = 0.02;
  let arrived = false;

  function frame(now) {
    const dt = clamp((now - lastFrame) / 1000, 0, 0.033); // frame time can be slightly before lastFrame
    lastFrame = now;
    const stiffness = STIFFNESS * currentPace();
    vel += ((target - pos) * stiffness - vel * 2 * Math.sqrt(stiffness)) * dt;
    pos += vel * dt;
    const done = Math.abs(target - pos) < 0.0005 && Math.abs(vel) < 0.001;
    if (done) pos = target;
    render();
    if (!arrived && (done || (Number.isInteger(target) && Math.abs(target - pos) < ARRIVED))) {
      arrived = true;
      settle();
    }
    if (done) {
      running = false;
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
    arrived = false;
    move();
  }

  // Free scrolling (wheel, touch) moves the deck with the input, then settles on a slide.
  // A small nudge past the current slide is enough to move on to the next one.
  let settleTimer = null;
  function drift(deltaSlides) {
    target = clamp(target + deltaSlides, 0, last);
    arrived = false;
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

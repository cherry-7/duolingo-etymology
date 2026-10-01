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

  function textBlock(slide) {
    const block = el("div", "text");
    block.append(el("h2", null, slide.heading || "[TBD]"));
    const body = Array.isArray(slide.body) ? slide.body : [slide.body || "[TBD]"];
    body.forEach((line) => block.append(el("p", null, line)));
    return block;
  }

  const layouts = {
    basic(stage, slide) {
      stage.append(textBlock(slide), slot(slide.twins, "twins"));
    },
    lineup(stage, slide) {
      stage.append(el("h2", null, slide.heading || "[TBD]"));
      const row = el("div", "lineup");
      (slide.characters || []).forEach((c) => row.append(slot(c)));
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

  // Slides are stacked full-screen; one is shown at a time and scenes play between them.
  let current = 0;
  let busy = false;
  let landing = 0; // where the scene now playing will land
  let queued = []; // presses made while a scene is playing, played next

  function arrive(index) {
    current = index;
    sections.forEach((s, i) => s.classList.toggle("is-active", i === index));
    history.replaceState(null, "", "#" + sections[index].id);
    if (finaleOf(index)) playFinale(finaleOf(index));
  }

  function show(index) {
    sections.forEach((s, i) => { if (finaleOf(i)) resetFinale(finaleOf(i)); });
    arrive(index);
  }

  // Forward plays the arriving slide's transition; backward plays the leaving slide's in reverse.
  function play(from, to) {
    const forward = to > from;
    const name = slides[forward ? to : from].transition;
    const scene = window.TRANSITIONS && window.TRANSITIONS[name];
    if (!scene || reduceMotion.matches) {
      show(to);
      return Promise.resolve();
    }
    const leaving = sections[from];
    const entering = sections[to];
    const options = { duration: scene.duration, easing: scene.easing, direction: forward ? "normal" : "reverse" };
    const top = forward ? entering : leaving;
    leaving.classList.add("is-leaving");
    entering.classList.add("is-entering");
    top.classList.add("is-top");
    if (finaleOf(to)) resetFinale(finaleOf(to));
    const animations = [
      leaving.animate(forward ? scene.out : scene.in, options),
      entering.animate(forward ? scene.in : scene.out, options)
    ];
    return Promise.all(animations.map((a) => a.finished)).then(() => {
      leaving.classList.remove("is-leaving");
      entering.classList.remove("is-entering");
      top.classList.remove("is-top");
      if (finaleOf(from)) resetFinale(finaleOf(from));
      arrive(to);
    });
  }

  function go(index) {
    index = Math.max(0, Math.min(sections.length - 1, index));
    if (busy) {
      queued.push(index);
      return;
    }
    if (index === current) return;
    busy = true;
    landing = index;
    play(current, index).then(() => {
      busy = false;
      if (queued.length) go(queued.shift());
    });
  }

  // Steps are relative to where the deck will be after the playing and queued scenes finish
  function step(delta) {
    const base = queued.length ? queued[queued.length - 1] : busy ? landing : current;
    go(base + delta);
  }

  // Arrow keys and clickers (most clickers send PageDown / PageUp)
  document.addEventListener("keydown", (e) => {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    switch (e.key) {
      case "ArrowRight":
      case "ArrowDown":
      case "PageDown":
      case "Enter":
        step(1); break;
      case " ":
        step(e.shiftKey ? -1 : 1); break;
      case "ArrowLeft":
      case "ArrowUp":
      case "PageUp":
        step(-1); break;
      case "Home":
        go(0); break;
      case "End":
        go(sections.length - 1); break;
      default:
        return;
    }
    e.preventDefault();
  });

  // Mouse wheel / trackpad: one flick = one scene. Trackpads keep sending wheel events
  // after a flick, so further steps wait until the wheel has been quiet for a moment.
  let wheelSum = 0;
  let wheelLocked = false;
  let wheelQuiet = null;
  window.addEventListener("wheel", (e) => {
    e.preventDefault();
    clearTimeout(wheelQuiet);
    wheelQuiet = setTimeout(() => { wheelLocked = false; wheelSum = 0; }, 200);
    if (wheelLocked || busy) return;
    wheelSum += Math.abs(e.deltaY) >= Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
    if (Math.abs(wheelSum) > 40) {
      step(wheelSum > 0 ? 1 : -1);
      wheelLocked = true;
      wheelSum = 0;
    }
  }, { passive: false });

  // Touch: swipe up or left = next, down or right = previous
  let touchStart = null;
  window.addEventListener("touchstart", (e) => {
    touchStart = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }, { passive: true });
  window.addEventListener("touchend", (e) => {
    if (!touchStart) return;
    const dx = e.changedTouches[0].clientX - touchStart.x;
    const dy = e.changedTouches[0].clientY - touchStart.y;
    touchStart = null;
    const d = Math.abs(dy) >= Math.abs(dx) ? dy : dx;
    if (Math.abs(d) > 50) step(d < 0 ? 1 : -1);
  }, { passive: true });

  // Open at the slide named in the URL hash, and follow hash edits in the address bar
  function hashIndex() {
    const index = sections.findIndex((s) => "#" + s.id === location.hash);
    return index >= 0 ? index : 0;
  }
  window.addEventListener("hashchange", () => {
    queued = [];
    show(hashIndex());
  });
  show(hashIndex());
})();

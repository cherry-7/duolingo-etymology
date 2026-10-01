// Pointer-events drag and drop. Works for touch (iOS Safari, Android Chrome)
// and mouse. No HTML5 DnD, no hover.
//
// makeDraggable(el, {
//   targets: () => [dropEl, ...],
//   onDrop: (el, target) => true | false   // target is null when dropped outside
// })
// onDrop returning true means the drop was accepted and the caller has moved el.
// Otherwise the ghost springs back to where el sits.

const SLOP = 16; // px added around drop targets for fat fingers

function hitTarget(x, y, targets) {
  for (const t of targets) {
    const r = t.getBoundingClientRect();
    if (x >= r.left - SLOP && x <= r.right + SLOP && y >= r.top - SLOP && y <= r.bottom + SLOP) {
      return t;
    }
  }
  return null;
}

export function makeDraggable(el, { targets, onDrop }) {
  let drag = null;

  el.addEventListener("pointerdown", (e) => {
    if (drag || !e.isPrimary || e.button > 0 || el.classList.contains("is-locked")) return;
    e.preventDefault();
    try {
      el.setPointerCapture(e.pointerId);
    } catch {
      // Capture can fail for synthetic or already-ended pointers; moves still reach el.
    }

    const rect = el.getBoundingClientRect();
    const ghost = el.cloneNode(true);
    ghost.classList.add("drag-ghost");
    Object.assign(ghost.style, {
      left: `${rect.left}px`,
      top: `${rect.top}px`,
      width: `${rect.width}px`,
      height: `${rect.height}px`
    });
    document.body.append(ghost);
    el.classList.add("is-lifted");
    document.body.classList.add("is-dragging");

    drag = {
      id: e.pointerId,
      rect,
      ghost,
      startX: e.clientX,
      startY: e.clientY,
      dx: 0,
      dy: 0,
      over: null,
      frame: 0,
      list: targets()
    };
  });

  el.addEventListener("pointermove", (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    drag.dx = e.clientX - drag.startX;
    drag.dy = e.clientY - drag.startY;
    if (drag.frame) return;
    drag.frame = requestAnimationFrame(() => {
      if (!drag) return;
      drag.frame = 0;
      drag.ghost.style.transform = `translate3d(${drag.dx}px, ${drag.dy}px, 0) scale(1.06)`;
      const cx = drag.rect.left + drag.rect.width / 2 + drag.dx;
      const cy = drag.rect.top + drag.rect.height / 2 + drag.dy;
      const over = hitTarget(cx, cy, drag.list);
      if (over !== drag.over) {
        drag.over?.classList.remove("is-over");
        over?.classList.add("is-over");
        drag.over = over;
      }
    });
  });

  function finish(e, cancelled) {
    if (!drag || e.pointerId !== drag.id) return;
    const d = drag;
    drag = null;
    cancelAnimationFrame(d.frame);
    d.over?.classList.remove("is-over");
    document.body.classList.remove("is-dragging");

    const cx = d.rect.left + d.rect.width / 2 + d.dx;
    const cy = d.rect.top + d.rect.height / 2 + d.dy;
    const target = cancelled ? null : hitTarget(cx, cy, d.list);
    const moved = Math.hypot(d.dx, d.dy) > 6;
    const accepted = moved && !cancelled ? onDrop(el, target) === true : false;

    if (accepted) {
      d.ghost.remove();
      el.classList.remove("is-lifted");
      return;
    }
    springBack(el, d.ghost);
  }

  el.addEventListener("pointerup", (e) => finish(e, false));
  el.addEventListener("pointercancel", (e) => finish(e, true));
  el.addEventListener("lostpointercapture", (e) => finish(e, true));
}

function springBack(el, ghost) {
  const home = el.getBoundingClientRect();
  const from = ghost.getBoundingClientRect();
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const done = () => {
    ghost.remove();
    el.classList.remove("is-lifted");
  };
  if (reduce) return done();
  // Re-anchor the ghost on the element's current spot, then animate to zero.
  ghost.style.left = `${home.left}px`;
  ghost.style.top = `${home.top}px`;
  ghost.style.transform = `translate3d(${from.left - home.left}px, ${from.top - home.top}px, 0)`;
  ghost.getBoundingClientRect();
  ghost.classList.add("is-returning");
  ghost.style.transform = "translate3d(0, 0, 0)";
  ghost.addEventListener("transitionend", done, { once: true });
  setTimeout(done, 400); // in case transitionend never fires
}

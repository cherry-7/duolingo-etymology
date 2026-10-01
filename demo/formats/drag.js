// Drag word parts onto the root. The picture moves through stage images
// toward the complete picture as correct parts are dropped.
import { h, buzz } from "../util.js";
import { makeDraggable } from "../drag.js";

export function render(q, ctx) {
  ctx.useCheck(false);
  const needed = q.parts.filter((p) => p.isCorrect).length;
  let placed = 0;

  const picture = h("div", { class: "picture" });
  const showPicture = () => {
    let file, label;
    if (placed >= needed) {
      file = q.completeImage;
      label = "[TBD: complete picture]";
    } else if (placed > 0 && q.stageImages?.[placed - 1]) {
      file = q.stageImages[placed - 1];
      label = `[TBD: stage picture ${placed}]`;
    } else {
      file = q.rootImage;
      label = "[TBD: root picture]";
    }
    picture.replaceChildren(ctx.img(file, label));
    picture.classList.remove("is-changing");
    picture.getBoundingClientRect();
    picture.classList.add("is-changing");
  };
  showPicture();

  const attached = h("div", { class: "attached" });
  const zone = h(
    "div",
    { class: "dropzone", "aria-label": "Drop zone" },
    h("span", { class: "root" }, q.root),
    attached
  );

  const tray = h("div", { class: "tray" });
  for (const part of q.parts) {
    const tile = h("div", { class: "tile part", role: "button" }, part.text);
    makeDraggable(tile, {
      targets: () => [zone],
      onDrop: (el, target) => {
        if (!target) return false; // outside the box: spring back, no penalty
        if (!part.isCorrect) {
          buzz(40);
          ctx.wrong();
          return false;
        }
        buzz(15);
        el.classList.add("is-locked", "is-placed");
        attached.append(el);
        placed++;
        zone.classList.remove("is-hit");
        zone.getBoundingClientRect();
        zone.classList.add("is-hit");
        showPicture();
        if (placed >= needed) {
          zone.classList.add("is-done");
          for (const t of tray.querySelectorAll(".part")) t.classList.add("is-locked");
          ctx.complete({ animationSlot: picture, detail: q.answerMeaning });
        }
        return true;
      }
    });
    tray.append(tile);
  }

  return h("div", { class: "format format-drag" }, h("p", { class: "prompt" }, q.prompt), picture, zone, tray);
}

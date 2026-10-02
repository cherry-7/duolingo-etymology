// Drag word parts onto the root. The picture moves through stage images
// toward the complete picture as correct parts are dropped.
// Tap-to-place also works: tap a part, then tap the root (or use Enter/Space).
import { h, buzz } from "../util.js";
import { makeDraggable } from "../drag.js";

export function render(q, ctx) {
  ctx.useCheck(false);
  const needed = q.parts.filter((p) => p.isCorrect).length;
  let placed = 0;
  let selected = null; // { tile, part } picked by tap

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
    { class: "dropzone", role: "button", tabindex: "0", "aria-label": q.root },
    h("span", { class: "root" }, q.root),
    attached
  );
  const tray = h("div", { class: "tray" });

  function select(tile, part) {
    const same = selected?.tile === tile;
    selected?.tile.classList.remove("is-selected");
    selected = same ? null : { tile, part };
    selected?.tile.classList.add("is-selected");
    zone.classList.toggle("is-armed", !!selected);
  }

  // Shared by drag-drop and tap-to-place. Returns true if the part was attached.
  function place(tile, part) {
    selected?.tile.classList.remove("is-selected");
    selected = null;
    zone.classList.remove("is-armed");
    if (!part.isCorrect) {
      buzz(40);
      ctx.wrong();
      return false;
    }
    buzz(15);
    tile.classList.add("is-locked", "is-placed");
    tile.removeAttribute("tabindex");
    attached.append(tile);
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

  const placeSelected = () => {
    if (selected && !zone.classList.contains("is-done")) place(selected.tile, selected.part);
  };
  zone.addEventListener("click", placeSelected);
  zone.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      placeSelected();
    }
  });

  for (const part of q.parts) {
    const tile = h("div", { class: "tile part", role: "button", tabindex: "0" }, part.text);
    makeDraggable(tile, {
      targets: () => [zone],
      // Outside the box: spring back, no penalty
      onDrop: (el, target) => (target ? place(el, part) : false),
      onTap: (el) => select(el, part)
    });
    tile.addEventListener("keydown", (e) => {
      if ((e.key === "Enter" || e.key === " ") && !tile.classList.contains("is-locked")) {
        e.preventDefault();
        select(tile, part);
      }
    });
    tray.append(tile);
  }

  return h("div", { class: "format format-drag" }, h("p", { class: "prompt" }, q.prompt), picture, zone, tray);
}

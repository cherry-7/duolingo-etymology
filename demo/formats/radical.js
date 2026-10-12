// Drag a missing radical into a character template.
import { h, shuffle, buzz, promptEl } from "../util.js";
import { makeDraggable } from "../drag.js";

export function render(q, ctx) {
  ctx.useCheck(false);
  const tray = h("div", { class: "tray" });
  const attached = h("div", { class: "attached" });
  const zone = h("div", { class: "dropzone", "aria-label": `Missing radical for ${q.character}` }, attached);
  const compound = h(
    "div",
    { class: "compound" },
    h("span", { class: "root" }, q.root),
    zone
  );
  let correctTile = null;

  function place(tile, part) {
    if (!part.isCorrect) {
      buzz(40);
      ctx.wrong();
      return false;
    }
    buzz(15);
    ctx.playSound();
    tile.classList.add("is-locked", "is-placed");
    attached.append(tile);
    zone.classList.add("is-done", "is-hit");
    for (const item of tray.querySelectorAll(".part")) item.classList.add("is-locked");
    ctx.complete({ animationSlot: compound, detail: q.answerMeaning });
    return true;
  }

  for (const part of shuffle(q.radicals)) {
    const tile = h("div", { class: "tile part", role: "button", tabindex: "0" }, part.text);
    if (part.isCorrect) correctTile = tile;
    makeDraggable(tile, {
      targets: () => [zone],
      onStart: () => ctx.playSound(),
      onDrop: (el, target) => (target ? place(el, part) : false)
    });
    tile.addEventListener("keydown", (event) => {
      if ((event.key === "Enter" || event.key === " ") && !tile.classList.contains("is-locked")) {
        event.preventDefault();
        place(tile, part);
      }
    });
    tray.append(tile);
  }

  const root = h("div", { class: "format format-radical" }, promptEl(q.prompt), h("p", { class: "word" }, q.character), compound, tray);
  requestAnimationFrame(() => {
    if (!correctTile) return;
    const rect = correctTile.getBoundingClientRect();
    zone.style.width = `${rect.width}px`;
    zone.style.height = `${rect.height}px`;
  });
  return root;
}

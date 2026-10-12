// Drag a missing radical into a character template.
// The empty spot sits left of the given part, as 日 sits left of 月 in 明; once the
// right radical lands, the two pieces merge into the finished character.
// Tap-to-place also works: tap a radical, then tap the character (or use Enter/Space).
import { h, shuffle, buzz, promptEl } from "../util.js";
import { makeDraggable } from "../drag.js";

export function render(q, ctx) {
  ctx.useCheck(false);
  let selected = null; // { tile, part } picked by tap
  const tray = h("div", { class: "tray" });
  const attached = h("div", { class: "attached" });
  const zone = h("div", { class: "dropzone", "aria-label": `Missing radical for ${q.character}` }, attached);
  const compound = h(
    "div",
    { class: "compound", role: "button", tabindex: "0", "aria-label": q.character },
    zone,
    h("span", { class: "root" }, q.root)
  );
  // The finished character is the first character of `character` ("明 (míng): bright" → 明)
  const glyph = Array.from(q.character.trim())[0];
  let correctTile = null;

  function select(tile, part) {
    const same = selected?.tile === tile;
    selected?.tile.classList.remove("is-selected");
    selected = same ? null : { tile, part };
    selected?.tile.classList.add("is-selected");
    zone.classList.toggle("is-armed", !!selected);
  }

  // Shared by drag-drop and tap-to-place. Returns true if the radical was attached.
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
    ctx.playSound();
    tile.classList.add("is-locked", "is-placed");
    tile.removeAttribute("tabindex");
    attached.append(tile);
    zone.classList.add("is-done", "is-hit");
    for (const item of tray.querySelectorAll(".part")) item.classList.add("is-locked");
    ctx.complete({ animationSlot: compound, detail: q.answerMeaning });
    // After the green jump, the two pieces become one character
    setTimeout(() => {
      compound.classList.add("is-merged");
      compound.replaceChildren(h("span", { class: "root merged-glyph" }, glyph));
    }, 700);
    return true;
  }

  const placeSelected = () => {
    if (selected && !zone.classList.contains("is-done")) place(selected.tile, selected.part);
  };
  compound.addEventListener("click", placeSelected);
  compound.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      placeSelected();
    }
  });

  for (const part of shuffle(q.radicals)) {
    const tile = h("div", { class: "tile part", role: "button", tabindex: "0" }, part.text);
    if (part.isCorrect) correctTile = tile;
    makeDraggable(tile, {
      targets: () => [zone],
      onStart: () => ctx.playSound(),
      // Outside the box: spring back, no penalty
      onDrop: (el, target) => (target ? place(el, part) : false),
      onTap: (el) => select(el, part)
    });
    tile.addEventListener("keydown", (event) => {
      if ((event.key === "Enter" || event.key === " ") && !tile.classList.contains("is-locked")) {
        event.preventDefault();
        ctx.playSound();
        select(tile, part);
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

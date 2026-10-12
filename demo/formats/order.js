// Tap parts into slots in the right order, then check.
import { h, shuffle, promptEl } from "../util.js?v=20261012c";

export function render(q, ctx) {
  const answer = q.parts.filter((p) => p.order != null).sort((a, b) => a.order - b.order);
  const slots = answer.map(() => h("div", { class: "slot", style: "width: 64px; height: 56px" }));
  const filled = answer.map(() => null); // part in each slot

  const bank = h("div", { class: "tray" });
  const tiles = new Map();
  const cells = new Map(); // each tile's home in the bank; it turns into a gray gap while the tile is out
  for (const part of shuffle(q.parts)) {
    const t = h("button", { type: "button", class: "tile part", onclick: () => toggle(part) }, part.text);
    const cell = h("span", { class: "bank-cell" }, t);
    tiles.set(part, t);
    cells.set(part, cell);
    bank.append(cell);
  }

  function toggle(part) {
    const t = tiles.get(part);
    ctx.playSound();
    const at = filled.indexOf(part);
    if (at >= 0) {
      filled[at] = null;
      t.classList.remove("is-wrong");
      const cell = cells.get(part);
      cell.classList.remove("is-empty");
      cell.style.width = cell.style.height = "";
      cell.append(t);
      slots[at].style.width = "64px";
      slots[at].style.height = "56px";
    } else {
      const free = filled.indexOf(null);
      if (free < 0) return;
      const tileRect = t.getBoundingClientRect();
      const cell = cells.get(part);
      cell.style.width = `${tileRect.width}px`;
      cell.style.height = `${tileRect.height}px`;
      cell.classList.add("is-empty");
      filled[free] = part;
      slots[free].style.width = `${tileRect.width}px`;
      slots[free].style.height = `${tileRect.height}px`;
      slots[free].append(t);
    }
    ctx.useCheck(true, filled.includes(null) ? null : check);
  }

  function check() {
    const ok = filled.every((p, i) => p.order === answer[i].order);
    if (ok) {
      for (const t of tiles.values()) t.disabled = true;
      for (const s of slots) s.classList.add("is-correct");
      // The slot row alone is too short for an animation, so it plays over the slots and the bank
      ctx.complete({ animationSlot: root, detail: q.answerMeaning || null });
    } else {
      for (const s of slots) s.classList.add("is-wrong");
      ctx.wrong(() => {
        for (const s of slots) s.classList.remove("is-wrong");
      });
    }
  }

  ctx.useCheck(true, null);
  const row = h("div", { class: "slots" }, slots);
  const root = h("div", { class: "format format-order" }, promptEl(q.prompt), row, bank);
  return root;
}

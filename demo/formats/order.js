// Tap parts into slots in the right order, then check.
import { h, shuffle } from "../util.js";

export function render(q, ctx) {
  const answer = q.parts.filter((p) => p.order != null).sort((a, b) => a.order - b.order);
  const slots = answer.map(() => h("div", { class: "slot" }));
  const filled = answer.map(() => null); // part in each slot

  const bank = h("div", { class: "tray" });
  const tiles = new Map();
  for (const part of shuffle(q.parts)) {
    const t = h("button", { type: "button", class: "tile part", onclick: () => toggle(part) }, part.text);
    tiles.set(part, t);
    bank.append(t);
  }

  function toggle(part) {
    const t = tiles.get(part);
    const at = filled.indexOf(part);
    if (at >= 0) {
      filled[at] = null;
      t.classList.remove("is-wrong");
      bank.append(t);
    } else {
      const free = filled.indexOf(null);
      if (free < 0) return;
      filled[free] = part;
      slots[free].append(t);
    }
    ctx.useCheck(true, filled.includes(null) ? null : check);
  }

  function check() {
    const ok = filled.every((p, i) => p.order === answer[i].order);
    if (ok) {
      for (const t of tiles.values()) t.disabled = true;
      for (const s of slots) s.classList.add("is-correct");
      ctx.complete({ animationSlot: row, detail: q.answerMeaning || null });
    } else {
      for (const s of slots) s.classList.add("is-wrong");
      ctx.wrong(() => {
        for (const s of slots) s.classList.remove("is-wrong");
      });
    }
  }

  ctx.useCheck(true, null);
  const row = h("div", { class: "slots" }, slots);
  return h("div", { class: "format format-order" }, h("p", { class: "prompt" }, q.prompt), row, bank);
}

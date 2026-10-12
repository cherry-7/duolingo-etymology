// Match parts to meanings: tap one tile in each column.
import { h, shuffle, buzz, promptEl } from "../util.js";

export function render(q, ctx) {
  ctx.useCheck(false);
  let pick = null; // { side, pair, el }
  let matched = 0;

  const left = h("div", { class: "match-col" });
  const right = h("div", { class: "match-col" });

  const tile = (side, pair, text) =>
    h("button", { type: "button", class: "tile match", onclick: (e) => tap(side, pair, e.currentTarget) }, text);

  for (const pair of shuffle(q.pairs)) left.append(tile("part", pair, pair.part));
  for (const pair of shuffle(q.pairs)) right.append(tile("meaning", pair, pair.meaning));

  function tap(side, pair, el) {
    ctx.playSound();
    if (!pick || pick.side === side) {
      pick?.el.classList.remove("is-selected");
      pick = { side, pair, el };
      el.classList.add("is-selected");
      return;
    }
    const first = pick;
    pick = null;
    first.el.classList.remove("is-selected");
    if (first.pair === pair) {
      buzz(15);
      for (const t of [first.el, el]) {
        t.classList.add("is-correct");
        t.disabled = true;
      }
      matched++;
      if (matched === q.pairs.length) ctx.complete({ animationSlot: grid, detail: null });
    } else {
      buzz(40);
      for (const t of [first.el, el]) t.classList.add("is-wrong");
      ctx.wrong(() => {
        for (const t of [first.el, el]) t.classList.remove("is-wrong");
      });
    }
  }

  const grid = h("div", { class: "match-grid" }, left, right);
  return h("div", { class: "format format-match" }, promptEl(q.prompt), grid);
}

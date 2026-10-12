// Match each word to the way its meaningful parts are constructed.
import { h, shuffle } from "../util.js";

export function render(q, ctx) {
  ctx.useCheck(false);
  let pick = null;
  let matched = 0;
  const left = h("div", { class: "match-col" });
  const right = h("div", { class: "match-col" });
  const tile = (side, pair, text) =>
    h("button", { type: "button", class: "tile match", onclick: (event) => tap(side, pair, event.currentTarget) }, text);

  shuffle(q.pairs).forEach((pair) => left.append(tile("word", pair, pair.word)));
  shuffle(q.pairs).forEach((pair) => right.append(tile("construction", pair, pair.construction)));

  function tap(side, pair, element) {
    ctx.playSound();
    if (!pick || pick.side === side) {
      pick?.element.classList.remove("is-selected");
      pick = { side, pair, element };
      element.classList.add("is-selected");
      return;
    }
    const first = pick;
    pick = null;
    first.element.classList.remove("is-selected");
    if (first.pair === pair) {
      for (const item of [first.element, element]) {
        item.classList.add("is-correct");
        item.disabled = true;
      }
      matched++;
      if (matched === q.pairs.length) ctx.complete({ animationSlot: grid, detail: null });
    } else {
      for (const item of [first.element, element]) item.classList.add("is-wrong");
      ctx.wrong(() => {
        first.element.classList.remove("is-wrong");
        element.classList.remove("is-wrong");
      });
    }
  }

  const grid = h("div", { class: "match-grid" }, left, right);
  return h("div", { class: "format format-construction" }, h("p", { class: "prompt" }, q.prompt), grid);
}

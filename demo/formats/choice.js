// Multiple choice: pick the meaning of a word (or part).
// An option with `title` is drawn as a card: radical art, then a bold title and detail lines.
import { h, shuffle, promptEl } from "../util.js?v=20261012c";

export function render(q, ctx) {
  let selected = null;
  const picture = q.image ? h("div", { class: "picture" }, ctx.img(q.image, "[TBD: picture]")) : null;

  const list = h("div", { class: "options" });
  const options = shuffle(q.options);
  const buttons = options.map((opt) => {
    const btn = h(
      "button",
      {
        type: "button",
        class: opt.title ? "tile option option-card" : "tile option",
        "aria-label": opt.title ? opt.text : null,
        onclick: () => {
          ctx.playSound();
          selected = opt;
          for (const b of buttons) b.classList.toggle("is-selected", b === btn);
          ctx.useCheck(true, check);
        }
      },
      opt.title ? card(opt, ctx) : opt.text
    );
    list.append(btn);
    return btn;
  });

  function check() {
    const btn = buttons[options.indexOf(selected)];
    if (selected.isCorrect) {
      btn.classList.add("is-correct");
      for (const b of buttons) b.disabled = true;
      ctx.complete({ animationSlot: picture || list, detail: null });
    } else {
      btn.classList.add("is-wrong");
      ctx.wrong(() => {
        btn.classList.remove("is-wrong", "is-selected");
        selected = null;
        ctx.useCheck(true, null);
      });
    }
  }

  ctx.useCheck(true, null);
  return h(
    "div",
    { class: "format format-choice" },
    promptEl(q.prompt),
    picture,
    h("p", { class: "word" }, q.word),
    list
  );
}

function card(opt, ctx) {
  return [
    opt.image ? ctx.glyph(opt.image, `[TBD: ${opt.text}]`) : null,
    h("span", { class: "card-text" }, h("strong", { class: "card-title" }, opt.title), (opt.lines || []).map((line) => h("span", {}, line)))
  ];
}

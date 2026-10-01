// Multiple choice: pick the meaning of a word (or part).
import { h } from "../util.js";

export function render(q, ctx) {
  let selected = null;
  const picture = q.image ? h("div", { class: "picture" }, ctx.img(q.image, "[TBD: picture]")) : null;

  const list = h("div", { class: "options" });
  const buttons = q.options.map((opt) => {
    const btn = h(
      "button",
      {
        type: "button",
        class: "tile option",
        onclick: () => {
          selected = opt;
          for (const b of buttons) b.classList.toggle("is-selected", b === btn);
          ctx.useCheck(true, check);
        }
      },
      opt.text
    );
    list.append(btn);
    return btn;
  });

  function check() {
    const btn = buttons[q.options.indexOf(selected)];
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
    h("p", { class: "prompt" }, q.prompt),
    picture,
    h("p", { class: "word" }, q.word),
    list
  );
}

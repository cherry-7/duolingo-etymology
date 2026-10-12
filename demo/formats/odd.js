// Choose the English word whose construction does not match the others.
import { h, shuffle, promptEl } from "../util.js?v=20261012c";

export function render(q, ctx) {
  let selected = null;
  const list = h("div", { class: "options" });
  const options = shuffle(q.options);
  const buttons = options.map((option) => {
    const button = h(
      "button",
      {
        type: "button",
        class: "tile option",
        onclick: () => {
          ctx.playSound();
          selected = option;
          for (const item of buttons) item.classList.toggle("is-selected", item === button);
          ctx.useCheck(true, check);
        }
      },
      option.text
    );
    list.append(button);
    return button;
  });

  function check() {
    const button = buttons[options.indexOf(selected)];
    if (selected.isCorrect) {
      button.classList.add("is-correct");
      buttons.forEach((item) => (item.disabled = true));
      ctx.complete({ animationSlot: list, detail: null });
    } else {
      button.classList.add("is-wrong");
      ctx.wrong(() => {
        button.classList.remove("is-wrong", "is-selected");
        selected = null;
        ctx.useCheck(true, null);
      });
    }
  }

  ctx.useCheck(true, null);
  return h("div", { class: "format format-odd" }, promptEl(q.prompt), list);
}

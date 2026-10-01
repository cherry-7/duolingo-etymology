// Small DOM helpers shared by the demo modules.

// h("div", { class: "x", onclick: fn }, child, "text")
export function h(tag, attrs = {}, ...children) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null || v === false) continue;
    if (k.startsWith("on")) el.addEventListener(k.slice(2), v);
    else if (k === "class") el.className = v;
    else if (k === "dataset") Object.assign(el.dataset, v);
    else el.setAttribute(k, v === true ? "" : v);
  }
  for (const c of children.flat()) {
    if (c == null || c === false) continue;
    el.append(c instanceof Node ? c : document.createTextNode(String(c)));
  }
  return el;
}

// Gray labeled box for any missing asset or copy.
export function placeholder(label, extraClass = "") {
  return h("div", { class: `tbd-box ${extraClass}`.trim() }, label);
}

// Image that swaps itself for a labeled placeholder if the file is missing.
export function assetImg(src, label, extraClass = "") {
  if (!src) {
    console.warn(`Missing image: ${label}`);
    return placeholder(label, extraClass);
  }
  const wrap = h("div", { class: `asset ${extraClass}`.trim() });
  const img = h("img", { src, alt: "", draggable: "false" });
  img.addEventListener("error", () => {
    console.warn(`Missing image: ${src}`);
    wrap.replaceWith(placeholder(label, extraClass));
  });
  wrap.append(img);
  return wrap;
}

export function shuffle(list) {
  const a = list.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function buzz(ms) {
  if (navigator.vibrate) navigator.vibrate(ms);
}

const existsCache = new Map();
export function fileExists(url) {
  if (!existsCache.has(url)) {
    existsCache.set(
      url,
      fetch(url, { method: "HEAD", cache: "no-store" }).then((r) => r.ok, () => false)
    );
  }
  return existsCache.get(url);
}

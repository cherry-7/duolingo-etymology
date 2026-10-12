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

// Glyph drawn from an SVG file (a radical or character), inlined so it takes the
// surrounding text colour (gray, then green/red with its tile). Missing file: labeled box.
const svgCache = new Map();
export function glyphImg(src, label, extraClass = "") {
  const wrap = h("span", { class: `glyph ${extraClass}`.trim(), "aria-hidden": "true" });
  if (!src) {
    console.warn(`Missing glyph: ${label}`);
    return placeholder(label, extraClass);
  }
  if (!svgCache.has(src)) svgCache.set(src, fetch(src).then((r) => (r.ok ? r.text() : Promise.reject(r.status))));
  svgCache.get(src).then(
    (text) => (wrap.innerHTML = text),
    () => {
      console.warn(`Missing glyph: ${src}`);
      wrap.replaceWith(placeholder(label, extraClass));
    }
  );
  return wrap;
}

// Text with __word__ marks rendered underlined (e.g. "the __gender__ of 妈").
function marked(text) {
  return String(text)
    .split(/__(.+?)__/)
    .map((part, i) => (i % 2 ? h("u", {}, part) : part))
    .filter((part) => part !== "");
}

// Question prompt: the first line (a line break in the text) or else the first sentence
// is bold; the rest is regular weight underneath (Michelle, TASKS.md).
export function promptEl(text) {
  const str = String(text || "");
  const m = str.match(/^([^\n]+)\n+([\s\S]+)$/) || str.match(/^([\s\S]+?[.!?])\s+([\s\S]+)$/);
  if (!m) return h("p", { class: "prompt" }, h("span", { class: "prompt-main" }, marked(str)));
  return h(
    "p",
    { class: "prompt" },
    h("span", { class: "prompt-main" }, marked(m[1].trim())),
    h("span", { class: "prompt-rest" }, marked(m[2].trim()))
  );
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

const soundCache = new Map();

export function playSound(url) {
  if (!url) return;
  let audio = soundCache.get(url);
  if (!audio) {
    audio = new Audio(url);
    audio.preload = "auto";
    soundCache.set(url, audio);
  }
  audio.currentTime = 0;
  audio.play().catch((error) => {
    console.warn(`Could not play sound: ${url}`, error);
  });
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

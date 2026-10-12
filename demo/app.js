// Demo flow: nickname → lesson (10 questions, 3 language sets) → finish.
import { CONFIG } from "./config.js";
import { STRINGS } from "./strings.js";
import { h, placeholder, assetImg, glyphImg, fileExists, playSound } from "./util.js";
import * as drag from "./formats/drag.js";
import * as choice from "./formats/choice.js";
import * as match from "./formats/match.js";
import * as order from "./formats/order.js";
import * as split from "./formats/split.js";
import * as odd from "./formats/odd.js";
import * as construction from "./formats/construction.js";
import * as radical from "./formats/radical.js";

const FORMATS = { drag, choice, match, order, split, odd, construction, radical };

// Sends one score to the live leaderboard (Firebase Realtime Database, REST).
// One request and no open connection, so a big audience stays under the free-plan limit.
export async function submitScore(name, score, meta = {}) {
  const base = window.FIREBASE_CONFIG?.databaseURL;
  if (!base) throw new Error("FIREBASE_CONFIG.databaseURL missing");
  const entry = {
    name,
    score,
    avatar: meta.avatar,
    mistakes: meta.mistakes,
    ts: { ".sv": "timestamp" } // set by the server
  };
  for (let attempt = 1; ; attempt++) {
    try {
      const r = await fetch(`${base}/scores.json`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(entry),
        keepalive: true
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return (await r.json()).name; // the new entry's key
    } catch (e) {
      console.error(`submitScore attempt ${attempt} failed`, e);
      if (attempt >= 3) throw e;
      await new Promise((res) => setTimeout(res, 800 * attempt));
    }
  }
}

const state = {
  name: "",
  avatar: null,
  lesson: [], // [{ q, lang, langIndex, indexInLang, langSize }]
  i: 0,
  firstTry: 0,
  mistakes: 0,
  hadMistake: false,
  retryUsed: false,
  twinsStage: null, // the top-left box the twins animate in
  twinsPose: null
};

const $ = (id) => document.getElementById(id);

const SOUNDS = {
  correct: `${CONFIG.assets.sounds}correct_answer.mp3`,
  incorrect: `${CONFIG.assets.sounds}incorrect_answer.mp3`,
  drag: `${CONFIG.assets.sounds}duolingo_dragndrop.mp3`,
  completed: `${CONFIG.assets.sounds}completed_lesson.mp3`,
  livesLost: `${CONFIG.assets.sounds}liveslost.mp3`
};

function correctAnswer(q) {
  if (q.correction) return q.correction;
  if (q.answerMeaning) return q.answerMeaning;
  if (q.type === "choice") return q.options.find((option) => option.isCorrect)?.text || "[TBD]";
  if (q.type === "order") {
    return q.parts
      .filter((part) => part.order != null)
      .sort((a, b) => a.order - b.order)
      .map((part) => part.text)
      .join(" + ");
  }
  if (q.type === "drag") {
    return [q.root, ...q.parts.filter((part) => part.isCorrect).map((part) => part.text)].join(" + ");
  }
  if (q.type === "match") {
    return q.pairs.map((pair) => `${pair.part} = ${pair.meaning}`).join("; ");
  }
  if (q.type === "radical") {
    return q.answerMeaning || q.radicals
      .filter((part) => part.order != null)
      .sort((a, b) => a.order - b.order)
      .map((part) => part.text)
      .join(" + ");
  }
  return "[TBD]";
}

/* ---------- content loading ---------- */

const DUMMY = [
  {
    type: "drag",
    language: "[TBD]",
    prompt: "[TBD]",
    root: "[TBD]",
    parts: [
      { text: "[TBD] ✓", meaning: "[TBD]", isCorrect: true },
      { text: "[TBD] ✗", meaning: "[TBD]", isCorrect: false }
    ],
    answerMeaning: "[TBD]"
  }
];

const isStr = (v) => typeof v === "string" && v.length > 0;

function validate(q, n) {
  const errs = [];
  const type = q.type || "drag";
  if (!FORMATS[type]) errs.push(`unknown type "${q.type}"`);
  if (!isStr(q.language)) errs.push("language");
  if (!isStr(q.prompt)) errs.push("prompt");
  if (type === "drag") {
    if (!isStr(q.root)) errs.push("root");
    if (!isStr(q.answerMeaning)) errs.push("answerMeaning");
    if (!Array.isArray(q.parts) || !q.parts.some((p) => p.isCorrect === true)) errs.push("parts (needs a correct part)");
    else if (q.parts.some((p) => !isStr(p.text) || typeof p.isCorrect !== "boolean")) errs.push("parts[].text/isCorrect");
  } else if (type === "choice") {
    if (!isStr(q.word)) errs.push("word");
    if (!Array.isArray(q.options) || q.options.length < 2 || !q.options.some((o) => o.isCorrect === true))
      errs.push("options (2+, one correct)");
  } else if (type === "match") {
    if (!Array.isArray(q.pairs) || q.pairs.length < 2 || q.pairs.some((p) => !isStr(p.part) || !isStr(p.meaning)))
      errs.push("pairs (2+ with part and meaning)");
  } else if (type === "order") {
    if (!Array.isArray(q.parts) || q.parts.filter((p) => typeof p.order === "number").length < 2)
      errs.push("parts (2+ with numeric order)");
  } else if (type === "split" || type === "odd") {
    if (!isStr(q.word) && type === "split") errs.push("word");
    if (!Array.isArray(q.options) || q.options.length < 2 || q.options.filter((o) => o.isCorrect === true).length !== 1)
      errs.push("options (2+, exactly one correct)");
  } else if (type === "construction") {
    if (!Array.isArray(q.pairs) || q.pairs.length < 2 || q.pairs.some((p) => !isStr(p.word) || !isStr(p.construction)))
      errs.push("pairs (2+ with word and construction)");
  } else if (type === "radical") {
    if (!isStr(q.character) || !isStr(q.root)) errs.push("character/root");
    if (!Array.isArray(q.radicals) || q.radicals.length < 2 || q.radicals.filter((part) => part.isCorrect === true).length !== 1)
      errs.push("radicals (2+, exactly one correct)");
  }
  if (errs.length) console.error(`questions.json item ${n}: invalid ${errs.join(", ")}`, q);
  return errs.length === 0;
}

async function loadJson(url) {
  try {
    const r = await fetch(url, { cache: "no-store" });
    if (!r.ok) return null;
    return await r.json();
  } catch (e) {
    console.error(`Could not read ${url}`, e);
    return null;
  }
}

async function loadLesson() {
  const data = await loadJson(CONFIG.questionsUrl);
  let questions = Array.isArray(data) ? data.filter((q, n) => validate(q, n)) : null;
  const banners = [];

  if (!questions || questions.length === 0) {
    console.warn("questions.json missing or empty: using one [TBD] dummy question");
    questions = DUMMY;
    banners.push(STRINGS.bannerDummy);
  }

  // Group by language in order of first appearance.
  const groups = new Map();
  for (const q of questions) {
    if (!groups.has(q.language)) groups.set(q.language, []);
    groups.get(q.language).push(q);
  }
  const sets = [...groups.values()];

  if (questions !== DUMMY) {
    const sizes = sets.map((s) => s.length);
    const expected = CONFIG.lessonSplit;
    if (sizes.join() !== expected.join()) {
      console.error(`Lesson split is [${sizes}] by language, expected [${expected}]`);
      banners.push(STRINGS.bannerMismatch);
    }
    if (data.length !== questions.length) banners.push(STRINGS.bannerMismatch);
  }

  state.lesson = sets.flatMap((set, langIndex) =>
    set.map((q, indexInLang) => ({ q, lang: q.language, langIndex, indexInLang, langSize: set.length }))
  );

  const banner = $("banner");
  const unique = [...new Set(banners)];
  banner.textContent = unique.join(" · ");
  banner.hidden = unique.length === 0;
}

/* ---------- screens ---------- */

function show(id) {
  for (const s of document.querySelectorAll(".screen")) s.hidden = s.id !== id;
}

function avatarEl(character, size) {
  return assetImg(
    character.id && `${CONFIG.assets.characters}${character.id}.png`,
    `[TBD: ${character.name} avatar]`,
    `avatar avatar-${size}`
  );
}

// The twins strip above the question: their animation box (top left) and a speech bubble.
// Built once and kept for the whole lesson, because the high-five frame would reload if moved.
//   idle / scared: looping SVGs; highFive: the deck's react: "correct" (demo/twins.html)
function buildTwinsStrip() {
  if (state.twinsStage) return;
  const img = h("img", { class: "twins-img", alt: "", draggable: "false" });
  const frame = h("iframe", { class: "twins-frame", src: CONFIG.twinsHighFive, title: "Mula and Dulo", tabindex: "-1", "aria-hidden": "true" });
  const stage = h("div", { class: "twins-stage" }, img, frame);
  const bubble = h("div", { class: "speech" });
  $("twins-row").replaceChildren(stage, bubble);
  state.twinsStage = { stage, img, frame, bubble };
}

function setTwins(pose) {
  const t = state.twinsStage;
  if (!t || state.twinsPose === pose) return;
  state.twinsPose = pose;
  const high = pose === "highFive";
  t.stage.classList.toggle("is-high-five", high);
  const win = t.frame.contentWindow;
  if (high) {
    win?.play?.();
  } else {
    t.img.src = CONFIG.twinsAnimations[pose].src;
    win?.idle?.();
  }
}

// Load the looping animations ahead of time so reactions show instantly
function preloadTwins() {
  for (const { src } of Object.values(CONFIG.twinsAnimations)) new Image().src = src;
}


function initNickname() {
  $("nick-title").textContent = STRINGS.nicknameTitle;
  $("nick-label").textContent = STRINGS.nicknameLabel;
  const input = $("nick-input");
  input.placeholder = STRINGS.nicknamePlaceholder;
  input.maxLength = CONFIG.nicknameMaxLength;
  const start = $("nick-start");
  start.textContent = STRINGS.start;

  const sync = () => (start.disabled = input.value.trim().length === 0);
  input.addEventListener("input", sync);
  sync();

  $("nick-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const name = input.value.trim().slice(0, CONFIG.nicknameMaxLength);
    if (!name) return;
    input.blur();
    start.disabled = true; // no second submit while the screen slides
    state.name = name;
    const pool = CONFIG.characters;
    state.avatar = pool[Math.floor(Math.random() * pool.length)];
    // same slide as between questions: the form slides out left, the greeting in from the right
    slideOut($("nick-form"), revealAvatar);
  });
}

function revealAvatar() {
  $("nick-form").hidden = true;
  const reveal = $("nick-reveal");
  reveal.replaceChildren(
    avatarEl(state.avatar, "lg"),
    // only the nickname is bold
    h("p", { class: "greeting" }, ...STRINGS.greeting.split(/(\{name\})/).map((part) =>
      part === "{name}" ? h("strong", {}, state.name) : part
    )),
    h("p", { class: "greeting-next" }, STRINGS.greetingNext)
  );
  reveal.hidden = false;
  slideIn(reveal);
  const btn = $("nick-continue");
  btn.textContent = STRINGS.continue;
  btn.hidden = false;
  btn.onclick = () => startLesson();
}

/* ---------- lesson ---------- */

function startLesson() {
  state.i = 0;
  state.firstTry = 0;
  state.mistakes = 0;
  $("lesson-avatar").replaceChildren(avatarEl(state.avatar, "sm"));
  show("screen-lesson");
  renderQuestion();
}

function renderHeader(item) {
  $("lesson-lang").textContent = item.lang;
  $("lesson-count").textContent = `${item.indexInLang + 1}/${item.langSize}`;
  const done = state.lesson.length ? state.i / state.lesson.length : 0;
  $("progress-fill").style.width = `${Math.round(done * 100)}%`;
}

function renderQuestion({ preserveMistake = false, animate = true } = {}) {
  const item = state.lesson[state.i];
  if (!preserveMistake) {
    state.hadMistake = false;
    state.retryUsed = false;
  }
  renderHeader(item);
  hideSheet();
  $("primary-btn").hidden = false;

  const body = $("lesson-body");
  body.classList.remove("is-locked", "is-boundary");
  const format = FORMATS[item.q.type || "drag"];
  const formatEl = format.render(item.q, makeCtx(item.q));
  // The twins ask the question: the prompt moves into their speech bubble
  buildTwinsStrip();
  const prompt = formatEl.querySelector(".prompt");
  state.twinsStage.bubble.replaceChildren(...(prompt ? [prompt] : []));
  $("twins-row").hidden = false;
  setTwins("idle");
  body.replaceChildren(formatEl);
  if (animate) slideIn(body);
  else body.classList.remove("slide-in", "slide-out");
  if (item.q.type === "drag" || !item.q.type) preloadAnimation(item.q);
}

function makeCtx(q) {
  let check = { visible: false, handler: null };
  const applyCheck = () => {
    const btn = $("primary-btn");
    btn.hidden = !check.visible;
    btn.textContent = STRINGS.check;
    btn.disabled = !check.handler;
    btn.onclick = check.handler;
  };
  return {
    img: (file, label) => assetImg(file && `${CONFIG.assets.questions}${file}`, label),
    glyph: (file, label) => glyphImg(file && `${CONFIG.assets.questions}${file}`, label),
    useCheck(visible, handler = null) {
      check = { visible, handler };
      applyCheck();
    },
    wrong(reset) {
      state.mistakes++;
      state.hadMistake = true;
      setTwins("scared");
      if (!state.retryUsed) {
        state.retryUsed = true;
        showSheet("wrong", () => {
          reset?.();
          renderQuestion({ preserveMistake: true, animate: false });
        }, null, q);
      } else {
        showSheet("correction", null, q.answerMeaning || null, q);
      }
    },
    complete({ animationSlot, detail }) {
      if (!state.hadMistake) state.firstTry++;
      setTwins("highFive");
      playSound(SOUNDS.correct);
      playAnimation(q, animationSlot);
      showSheet("correct", null, detail, q);
    },
    flashAnimation,
    playSound() {
      playSound(SOUNDS.drag);
    }
  };
}

function showSheet(kind, retry, detail, q) {
  const sheet = $("sheet");
  const body = $("lesson-body");
  body.classList.add("is-locked");
  sheet.className = `sheet sheet-${kind}`;
  const btn = $("primary-btn");
  btn.hidden = false;
  btn.disabled = false;
  btn.classList.remove("is-neutral", "is-retry-correct");

  if (kind === "correct") {
    sheet.replaceChildren(
      sheetText(
        "correct",
        STRINGS.correctTitle,
        detail ? h("p", { class: "sheet-detail" }, detail) : null
      )
    );
    btn.textContent = STRINGS.continue;
    btn.onclick = () => next();
  } else if (kind === "wrong") {
    playSound(SOUNDS.incorrect);
    sheet.replaceChildren(
      sheetText(
        "wrong",
        STRINGS.wrongTitle
      )
    );
    btn.textContent = STRINGS.tryAgain;
    btn.classList.add("is-neutral");
    btn.onclick = () => {
      state.hadMistake = true;
      hideSheet();
      retry?.();
    };
  } else {
    playSound(SOUNDS.incorrect);
    sheet.replaceChildren(
      sheetText(
        "wrong",
        STRINGS.correctionTitle,
        h("p", { class: "sheet-detail" }, correctAnswer(q))
      )
    );
    btn.textContent = STRINGS.gotIt;
    btn.classList.add("is-retry-correct");
    btn.onclick = () => next();
  }
  sheet.hidden = false;
  btn.focus({ preventScroll: true });
}

// Duolingo-style sheet heading: a round ✓ or ✕ badge, then the title
const ICONS = {
  correct: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8.5l3.2 3.2L13 4.8" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  wrong: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 4l8 8M12 4l-8 8" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/></svg>'
};

function sheetText(icon, title, ...rest) {
  const badge = h("span", { class: "sheet-icon" });
  badge.innerHTML = ICONS[icon];
  return h(
    "div",
    { class: "sheet-text" },
    h("div", { class: "sheet-head" }, badge, h("p", { class: "sheet-title" }, title)),
    ...rest
  );
}

function hideSheet() {
  $("sheet").hidden = true;
  $("lesson-body").classList.remove("is-locked");
  const btn = $("primary-btn");
  btn.classList.remove("is-neutral", "is-retry-correct");
}

// Fades the answer animation out before the screen changes
function fadeOutAnimation(done) {
  const stage = document.querySelector(".anim-stage.is-in");
  if (!stage || reduceMotion()) return done();
  stage.classList.remove("is-in");
  setTimeout(done, 250);
}

function next() {
  fadeOutAnimation(advance);
}

function advance() {
  const cur = state.lesson[state.i];
  const nxt = state.lesson[state.i + 1];
  if (!nxt) return finish();
  if (nxt.langIndex !== cur.langIndex) return showBoundary(nxt);
  state.i++;
  renderQuestion();
}

/* ---------- language boundary + swipe ---------- */

let swipeHandler = null;

function showBoundary(nxt) {
  hideSheet();
  $("twins-row").hidden = true;
  const body = $("lesson-body");
  body.classList.add("is-boundary");
  body.replaceChildren(
    h(
      "div",
      { class: "boundary" },
      // the twins (talking) tell the player to swipe
      h(
        "div",
        { class: "twins-row boundary-twins" },
        h("div", { class: "twins-stage" }, h("img", { class: "twins-img", src: CONFIG.twinsAnimations.talking.src, alt: "", draggable: "false" })),
        // only the first word ("Swipe") is bold
        h("div", { class: "speech" }, h("p", { class: "speech-line is-regular" },
          h("strong", {}, STRINGS.swipeToNext.split(" ")[0]), STRINGS.swipeToNext.slice(STRINGS.swipeToNext.indexOf(" "))))
      ),
      h("p", { class: "boundary-lang" }, nxt.lang),
      h("div", { class: "swipe-hint", "aria-hidden": "true" }, "→")
    )
  );
  $("progress-fill").style.width = `${Math.round(((state.i + 1) / state.lesson.length) * 100)}%`;

  const swipe = () => {
    disarm();
    slideOut(body, () => {
      state.i++;
      renderQuestion();
    });
  };
  arm(body, swipe);

  $("primary-btn").hidden = true;
}

function arm(el, onSwipe) {
  disarm();
  let start = null;
  const down = (e) => {
    if (!e.isPrimary) return;
    start = { x: e.clientX, y: e.clientY, id: e.pointerId };
    try {
      el.setPointerCapture(e.pointerId);
    } catch {
      // Pointer capture is unavailable for some browser-generated events.
    }
  };
  const up = (e) => {
    if (!start || e.pointerId !== start.id) return;
    const dx = e.clientX - start.x;
    const dy = e.clientY - start.y;
    start = null;
    if (dx < -60 && Math.abs(dx) > 2 * Math.abs(dy)) onSwipe();
  };
  const cancel = () => (start = null);
  const key = (e) => {
    // Arrow keys, Enter or Space move on to the next language
    if (["ArrowRight", "ArrowLeft", "Enter", " "].includes(e.key)) {
      e.preventDefault();
      onSwipe();
    }
  };
  el.addEventListener("pointerdown", down);
  el.addEventListener("pointerup", up);
  el.addEventListener("pointercancel", cancel);
  window.addEventListener("keydown", key);
  swipeHandler = () => {
    el.removeEventListener("pointerdown", down);
    el.removeEventListener("pointerup", up);
    el.removeEventListener("pointercancel", cancel);
    window.removeEventListener("keydown", key);
  };
}

function disarm() {
  swipeHandler?.();
  swipeHandler = null;
}

const reduceMotion = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

function slideOut(el, done) {
  if (reduceMotion()) return done();
  el.classList.add("slide-out");
  setTimeout(() => {
    el.classList.remove("slide-out");
    done();
  }, 220);
}

function slideIn(el) {
  if (reduceMotion()) return;
  el.classList.remove("slide-in");
  el.getBoundingClientRect();
  el.classList.add("slide-in");
}

/* ---------- completion animation (SVG, Rive or placeholder) ---------- */

let riveLoading = null;
function loadRive() {
  if (window.rive) return Promise.resolve(window.rive);
  riveLoading ??= new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = CONFIG.riveRuntimeUrl;
    s.onload = () => resolve(window.rive);
    s.onerror = reject;
    document.head.append(s);
  });
  return riveLoading;
}

function animationUrl(q) {
  return q.animationId ? `${CONFIG.assets.animations}${q.animationId}.riv` : null;
}

function animationImageUrl(q) {
  return q.animationId ? `${CONFIG.assets.animationImages}${q.animationId}.svg` : null;
}

// Puts an animated SVG in the blank space under the answers (nothing is covered) and fades it in.
function showAnimationImage(image, slot) {
  const format = slot.closest(".format") || slot;
  format.querySelector(".anim-stage")?.remove();
  const stage = h("div", { class: "anim-stage" }, h("img", { class: "anim-image", src: image, alt: "", draggable: "false" }));
  format.append(stage);
  stage.getBoundingClientRect();
  stage.classList.add("is-in");
  // The feedback sheet shortens the lesson body; keep the animation on screen
  stage.scrollIntoView({ block: "nearest" });
  return stage;
}

// Shows one animation for a moment (e.g. a matched pair), then fades it out again.
async function flashAnimation(animationId, slot, ms = 2000) {
  const image = animationImageUrl({ animationId });
  if (!slot || !image || !(await fileExists(image))) return;
  const stage = showAnimationImage(image, slot);
  setTimeout(() => {
    stage.classList.remove("is-in");
    setTimeout(() => stage.remove(), 300);
  }, ms);
}

function preloadAnimation(q) {
  const url = animationUrl(q);
  if (url) fileExists(url).then((ok) => ok && loadRive().catch(() => {}));
}

// Plays over the slot (the picture, or the answer area for non-picture formats).
async function playAnimation(q, slot) {
  if (!slot) return;
  const url = animationUrl(q);
  const label = q.animationId ? `[TBD: animation ${q.animationId}]` : "[TBD: animation (none specified)]";

  // An animated SVG for this question wins over a Rive file
  const image = animationImageUrl(q);
  if (image && (await fileExists(image))) {
    showAnimationImage(image, slot);
    return;
  }
  slot.classList.add("has-anim");

  if (!url || !(await fileExists(url))) {
    console.warn(q.animationId ? `Missing animation: ${q.animationId} (${url})` : "Missing animation: question has no animationId", q);
    slot.append(h("div", { class: "anim-tag" }, label));
    return;
  }
  try {
    const rive = await loadRive();
    const canvas = h("canvas", { class: "anim-canvas", width: "600", height: "600" });
    slot.append(h("div", { class: "anim-overlay" }, canvas));
    const r = new rive.Rive({ src: url, canvas, autoplay: true, onLoad: () => r.resizeDrawingSurfaceToCanvas() });
  } catch (e) {
    console.warn(`Rive failed for ${q.animationId}`, e);
    slot.append(h("div", { class: "anim-tag" }, label));
  }
}

/* ---------- finish ---------- */

function finish() {
  disarm();
  hideSheet();
  $("progress-fill").style.width = "100%";
  // 1 point per question right on the first try; mistakes never subtract (Michelle, TASKS.md)
  const score = state.firstTry;
  $("finish-body").replaceChildren(
    h("h1", { class: "title" }, STRINGS.finishTitle),
    avatarEl(state.avatar, "lg"),
    h("p", { class: "nick-echo" }, state.name),
    h("p", { class: "score" }, `${score}/${state.lesson.length}`),
    h("p", { id: "finish-place", class: "finish-place" }),
    h(
      "div",
      { class: "twins-row" },
      h("div", { class: "twins-stage" }, h("img", { class: "twins-img", src: CONFIG.twinsAnimations.yinYang.src, alt: "", draggable: "false" })),
      h("div", { class: "speech" }, h("p", { class: "speech-line is-regular" }, STRINGS.finishBubble))
    ),
    h("p", { id: "submit-status", class: "muted submit-status" }, STRINGS.submitting)
  );
  show("screen-finish");
  if (score < 5) playSound(SOUNDS.livesLost);
  playSound(SOUNDS.completed);
  // mistakes are sent only to break leaderboard ties, never to lower the score
  submitScore(state.name, score, { avatar: state.avatar.id, mistakes: state.mistakes }).then(
    (key) => {
      $("submit-status").textContent = STRINGS.submitted;
      showPlace(key);
    },
    () => ($("submit-status").textContent = STRINGS.submitFailed)
  );
}

// The deck's leaderboard slide shows the top 4 (deck/slides.js "leaderboard", limit: 4)
const LEADERBOARD_SHOWN = 4;

// Under the score: "You're 2nd place!" when the player made the deck's top 4, otherwise
// "You're on the leaderboard!" (also if the scores can't be read back)
async function showPlace(key) {
  const line = $("finish-place");
  line.textContent = STRINGS.finishOnBoard;
  try {
    const r = await fetch(`${window.FIREBASE_CONFIG.databaseURL}/scores.json`);
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    // Same ranking as the deck (deck/leaderboard.js): score, then fewer mistakes, then first to finish
    const ranked = Object.entries((await r.json()) || {})
      .filter(([, s]) => s && typeof s.name === "string" && typeof s.score === "number")
      .sort(([, a], [, b]) => b.score - a.score || (a.mistakes || 0) - (b.mistakes || 0) || (a.ts || 0) - (b.ts || 0));
    const place = ranked.findIndex(([k]) => k === key) + 1;
    if (place >= 1 && place <= LEADERBOARD_SHOWN) line.textContent = STRINGS.finishPlace.replace("{place}", ordinal(place));
  } catch (e) {
    console.warn("Couldn't read the leaderboard for the player's place", e);
  }
}

function ordinal(n) {
  const suffix = n % 100 >= 11 && n % 100 <= 13 ? "th" : { 1: "st", 2: "nd", 3: "rd" }[n % 10] || "th";
  return `${n}${suffix}`;
}

/* ---------- boot ---------- */

async function boot() {
  // iOS Safari only shows :active (the button press-down) when a touch listener exists
  document.addEventListener("touchstart", () => {}, { passive: true });
  initNickname();
  show("screen-nickname");
  await loadLesson();
  preloadTwins();
}

boot();

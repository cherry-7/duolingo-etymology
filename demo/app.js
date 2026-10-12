// Demo flow: nickname → lesson (10 questions, 3 language sets) → finish.
import { CONFIG } from "./config.js";
import { STRINGS } from "./strings.js";
import { h, placeholder, assetImg, fileExists, playSound } from "./util.js";
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
  twins: {}
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

async function loadTwinsLines() {
  const lines = (await loadJson(CONFIG.twinsLinesUrl)) || {};
  state.twins = {
    firstQuestion: lines.firstQuestion || STRINGS.twinsFirstQuestion,
    afterMistake: lines.afterMistake || STRINGS.twinsAfterMistake,
    finish: lines.finish || STRINGS.twinsFinish,
    highFive: lines.highFive || STRINGS.twinsHighFive
  };
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

function twinsEl(pose) {
  return assetImg(`${CONFIG.assets.twins}${pose}.png`, `[TBD: twins ${pose}]`, "twins");
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
    state.name = name;
    const pool = CONFIG.characters;
    state.avatar = pool[Math.floor(Math.random() * pool.length)];
    revealAvatar();
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
    ))
  );
  reveal.hidden = false;
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
  const nodes = [];
  if (state.i === 0) {
    nodes.push(h("div", { class: "twins-bubble" }, twinsEl("encourage"), h("p", {}, state.twins.firstQuestion)));
  }
  nodes.push(format.render(item.q, makeCtx(item.q)));
  body.replaceChildren(...nodes);
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
    useCheck(visible, handler = null) {
      check = { visible, handler };
      applyCheck();
    },
    wrong(reset) {
      state.mistakes++;
      state.hadMistake = true;
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
      playSound(SOUNDS.correct);
      playAnimation(q, animationSlot);
      showSheet("correct", null, detail, q);
    },
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
        detail ? h("p", { class: "sheet-detail" }, detail) : null,
        h("p", { class: "sheet-line" }, state.twins.highFive)
      ),
      twinsEl("high-five")
    );
    btn.textContent = STRINGS.continue;
    btn.onclick = () => next();
  } else if (kind === "wrong") {
    playSound(SOUNDS.incorrect);
    sheet.replaceChildren(
      sheetText(
        "wrong",
        STRINGS.wrongTitle,
        h("p", { class: "sheet-line" }, state.twins.afterMistake)
      ),
      twinsEl("encourage")
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
        h("p", { class: "sheet-detail" }, correctAnswer(q)),
        h("p", { class: "sheet-line" }, state.twins.afterMistake)
      ),
      twinsEl("encourage")
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

function next() {
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
  const body = $("lesson-body");
  body.classList.add("is-boundary");
  body.replaceChildren(
    h(
      "div",
      { class: "boundary" },
      h("p", { class: "boundary-lang" }, nxt.lang),
      h("div", { class: "swipe-hint", "aria-hidden": "true" }, "→"),
      h("p", { class: "muted" }, STRINGS.swipeToNext)
    )
  );
  $("progress-fill").style.width = `${Math.round(((state.i + 1) / state.lesson.length) * 100)}%`;

  const advance = () => {
    disarm();
    slideOut(body, () => {
      state.i++;
      renderQuestion();
    });
  };
  arm(body, advance);

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

/* ---------- completion animation (Rive or placeholder) ---------- */

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

function preloadAnimation(q) {
  const url = animationUrl(q);
  if (url) fileExists(url).then((ok) => ok && loadRive().catch(() => {}));
}

// Plays over the slot (the picture, or the answer area for non-picture formats).
async function playAnimation(q, slot) {
  if (!slot) return;
  const url = animationUrl(q);
  const label = q.animationId ? `[TBD: animation ${q.animationId}]` : "[TBD: animation (none specified)]";
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
    h("p", { class: "score" }, String(score)),
    h(
      "div",
      { class: "stats" },
      h("div", {}, h("span", { class: "stat-n" }, `${state.firstTry}/${state.lesson.length}`), h("span", {}, STRINGS.statFirstTry))
    ),
    h("div", { class: "twins-bubble" }, twinsEl("idle"), h("p", {}, state.twins.finish)),
    h("p", { id: "submit-status", class: "muted submit-status" }, STRINGS.submitting)
  );
  show("screen-finish");
  if (score < 5) playSound(SOUNDS.livesLost);
  playSound(SOUNDS.completed);
  // mistakes are sent only to break leaderboard ties, never to lower the score
  submitScore(state.name, score, { avatar: state.avatar.id, mistakes: state.mistakes }).then(
    () => ($("submit-status").textContent = STRINGS.submitted),
    () => ($("submit-status").textContent = STRINGS.submitFailed)
  );
}

/* ---------- boot ---------- */

async function boot() {
  // iOS Safari only shows :active (the button press-down) when a touch listener exists
  document.addEventListener("touchstart", () => {}, { passive: true });
  initNickname();
  show("screen-nickname");
  await Promise.all([loadLesson(), loadTwinsLines()]);
}

boot();

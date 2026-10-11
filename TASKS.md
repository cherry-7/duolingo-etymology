# Tasks

Work queue for the deck and demo.

**Convention:** only items marked `APPROVED` get built. Anything without that tag is a draft or idea and should not be worked on yet. Ideas that still need a decision go in [PROPOSALS.md](PROPOSALS.md) first.

```
- [ ] APPROVED: short description of the task
- [ ] Unapproved idea (not to be worked on)
```

## Tasks

- [ ] APPROVED (2026-10-01): Build the pitch slide deck as a website in /deck, styled like Duolingo's own product.
  - Slide order, text, and layout come ONLY from the exports and notes in /design/slides. Don't write or edit slide copy. Where copy is missing, use [TBD].
  - It must work by scrolling AND by arrow keys/clicker, with each slide full-screen at 16:9 on a projector, and stay readable on a laptop.
  - Each slide has a slot for the twin characters. Use the art in /assets/twins if it exists; otherwise use labeled gray placeholder boxes. Don't draw or invent characters.
  - Include a character lineup slide: the existing Duolingo characters plus the twins, using /assets images or placeholders.
  - Final slide: the owl flies off screen, then a QR code appears with the line from SPEC.md ("Go ahead, scan"). The QR points to the /demo URL; leave the URL in one config variable.
  - Colors, spacing, and transitions come from /design. If something isn't specified, use the simplest neutral option and list it in your summary.
- [ ] APPROVED (2026-10-01): Build the playable demo in /demo that the audience opens from the QR code. Mobile-first, and it must also work on desktop.
  - Flow: nickname entry (no login) → 10-question lesson → finish screen. The "etymology" opening hook is reserved for the deck, not the demo.
  - Lesson: 3 Latin-based, 4 Chinese radicals and 3 Sanskrit/South Asian questions (10 total), loaded only from /content/questions.json. The player swipes between languages. If the file is missing, the lesson uses exactly one dummy question marked [TBD].
  - Question formats: drag parts onto root, multiple-choice meaning, match parts to meanings, tap parts in order. Drag questions are visual: the root's picture becomes complete as parts are dropped in (e.g. the 女 radical pictured as a woman becomes a mom for 媽).
  - Drag works with touch on iOS Safari and Android Chrome (pointer events, no hover UI). Every drop gets instant feedback. A correct assembly plays the question's animation and the twins' high-five, with labeled placeholders and a console log for missing assets.
  - Wrong answers follow /design/feedback-notes.md. Until that exists, show a neutral "Try again" marked [TBD]. Encouragement moments use only twins' lines and art from /design and /assets, otherwise [TBD].
  - Accent color: Duo green #58CC02.
  - Each player gets a random avatar from 10 Duolingo characters (Duo, Lily, Zari, Bea, Eddy, Junior, Oscar, Vikram, Lucy, Lin; Falstaff left out because the gallery has no art for him, per Michelle), using the Behance "Duolingo Characters" gallery by Medix Agency (download approved by Michelle).
  - Score: track first-try correct and wrong drops. The formula is [TBD]. Leaderboard is a stub, submitScore(name, score).
  - Final step, only after Michelle approves it at that point: a live leaderboard through Firebase Realtime Database, on a separate deck slide after the QR slide.
- [ ] APPROVED (2026-10-01): Deck transitions feel like a story/movie, not normal slides. Every slide change is a different scene animation into the next part of the story. Scroll, swipe, arrow keys and clicker each play one full scene (Michelle chose "scroll plays a scene" over scroll-scrubbing).
- [ ] APPROVED (2026-10-01): Lineup slide shows all 10 existing Duolingo characters from /assets/characters (Behance images approved for use) plus the twins.
- [ ] APPROVED (2026-10-01): Replace the current deck transitions. Use https://lusion.co/ as inspiration for a smooth, storylike flow between slides.
- [ ] APPROVED (2026-10-01, PROPOSALS.md YES): Root URL redirect. Add a top-level `index.html` that sends the bare Pages URL to `/deck/`.
- [ ] APPROVED (2026-10-01, PROPOSALS.md YES): Tap-to-place for drag questions. Tap a part, then tap the root, as an alternative to dragging.
- [ ] APPROVED (2026-10-01, PROPOSALS.md YES): Button fallback for the language swipe. A "next" button (text [TBD]) alongside the swipe and arrow key at language boundaries.
- [ ] APPROVED (2026-10-01, PROPOSALS.md YES): Hint and correction fields. Add optional `hint` and `correction` to the question schema now. Show them on screen only once /design/feedback-notes.md defines what a wrong answer shows.
- [ ] APPROVED (2026-10-01, PROPOSALS.md YES): Story thread across the deck. One continuous line that draws itself across every slide as the deck moves. Color and path come from /design. Assigned to the deck session; blocked until /design has them.
- [ ] APPROVED (2026-10-01, Michelle in chat): Use the Fredoka font (Google Fonts, weights 300–700) for both the presentation deck and the demo, instead of Duolingo Sans.
- [ ] APPROVED (2026-10-01): Show the demo QR code on the leaderboard slide too, beside the live scores.
- [ ] (2026-10-01) Story thread removed from the deck at Michelle's request until /design has a thread design. Rebuild from the reverted commits (59aca2d, d63339e) when it does.
- [ ] APPROVED (2026-10-01, Michelle in chat): QR slide → leaderboard slide: instead of a swipe transition, the QR code animates from its spot on the QR slide into its spot on the leaderboard slide.
- [ ] APPROVED (2026-10-01, Michelle in chat): Make the owl's fly-away on the QR slide faster (1s → 0.5s).
- [ ] APPROVED (2026-10-01, Michelle in chat): QR handoff polish. (1) Going back from the leaderboard reverses cleanly: the QR stays visible and Duo doesn't fly off again. (2) Cut the wait before Duo leaves by counting a slide as arrived sooner. (3) Leaderboard arrival as a sequence: the QR moves first along a slight arc, then the score rows rise in one at a time. (4) Live score changes animate: rows slide to their new rank, new entries pop in.
- [ ] APPROVED (2026-10-01, Michelle in chat): On the leaderboard slide, put the QR code on the left (scores on the right), and have it slide straight to the side from the QR slide instead of arcing.
- [ ] APPROVED (2026-10-04, Michelle in chat): Daniel's demo sound effects (assets/sounds: correct, incorrect, drag/tap, lesson complete, lives lost). content/questions.json is the final question set; Daniel still needs to add `hint` and `correction` to each question.
- [ ] APPROVED (2026-10-05, Michelle in chat, from Duolingo app screenshots): Match Duolingo's look in the demo: buttons (Check, Continue, Try again) with the 3D bottom shadow and press-down animation; Duolingo colors; green/red feedback sheets with ✓/✕ icons; option and word tiles with selected/correct/wrong states; word-bank placeholders where tiles were taken.
- [ ] APPROVED (2026-10-05, Michelle in chat, from a Duolingo "Incorrect" screenshot): Try again / Incorrect sheets copy that format: light-red ✕ badge with a dark ✕, red title, the answer (or hint) as one plain red line, no "Correct answer:" label, no second button. The Incorrect sheet's button says "Got it".
- (2026-10-05) Michelle chose Daniel's change: no next-language button at language boundaries; players swipe or use the arrow keys. This replaces the earlier "Button fallback for the language swipe" task.
- [ ] APPROVED (2026-10-05, Michelle in chat): First-mistake sheet title "Not quite!" and button "Got it"; red buttons #FF4B4B; white ✕ in the red badge; progress-bar gloss more transparent.
- [ ] APPROVED (2026-10-05, Michelle in chat): When an answer is correct and its tiles turn green, they jump and a shine sweeps across them.
- [ ] APPROVED (2026-10-05, Michelle in chat): Scoring: 1 point per question answered correctly on the first try; wrong answers never subtract. Leaderboard ties still go to fewer mistakes, then who finished first. The finish screen shows the score and "First try X/10" only (no formula line, no mistakes count).
- [ ] APPROVED (2026-10-05, Michelle in chat): Finish screen: the line under "X/10" reads "Great job!" (replaces "First try"; updated from "Good job! I'm so proud of you.").
- [ ] APPROVED (2026-10-05, Michelle in chat): Question prompts bold only the most important part (the first line/sentence); the rest is regular weight.
- [ ] APPROVED (2026-10-05, Michelle in chat): Language-change screen: the swipe hint arrow points right (→), and Enter or Space (as well as the arrow keys) moves on to the next language.
- [ ] APPROVED (2026-10-05, Michelle in chat): Avatar reveal shows the avatar and "Hi, [nickname]!" only (no character name, no reveal line); only the nickname is bold.
- [ ] APPROVED (2026-10-06, Michelle in chat): Finish screen title reads "You did it!".
- [ ] APPROVED (2026-10-09, Michelle in chat): Rebuild the deck from the Figma designs exported to /design/slides ("one continuous world" plan): background color fades between slides, shared actors (twins, Saissha's photo, speech bubble, word halves, card stack) travel between slides, swirls draw themselves with the scroll. Build in steps, with reviews after step 1 (engine + Opening/User Story) and step 3 (card stack + examples).
  - Slide order: Opening, User Story (bubble lines: "Hi! My name is Saissha." → Group 29 "I am learning English right now." → Group 30 "I can memorise new words, but I wish I understood how their parts create meaning."), User Story-1, Morphology 1–3, examples (English, Hindi, Chinese, Spanish), Interviews ×2, Character Default/Color/Research, QR slide, Leaderboard last.
  - QR slide: Duo (design/slides/pngs/duolingo_flying.png) flies across and drops off the QR code; it then hands over to the twin's sign on the Leaderboard slide. The live QR from deck/config.js is placed over the sign.
  - Narrow font: "Fredoka Condensed" = Fredoka at 75% width (wdth axis), weight 400, line-height 150%, letter-spacing -1.1%.
  - Card stack from design/slides/svgs/Card Stack.
  - Copy still missing in Figma stays [TBD]: "TITLE TITLE", interview quotes and names.
- [ ] APPROVED (2026-10-09, Michelle in chat, step 1 review): Swirls draw and rewind more slowly so they feel natural. Opening → User Story: the orange frame traces itself from the top middle down the left and right sides, meeting at the bottom middle. Saissha's photo floats gently as if breathing. Every new speech bubble pops in like the first one (the old one pops out first) instead of fading, and bubble text must never sit outside its bubble.
- [ ] APPROVED (2026-10-09, Michelle in chat): The background swirls on the opening and story slides keep moving while resting: a slow drift, sway and swell (idle loop), on top of the draw/rewind transitions.
- [ ] APPROVED (2026-10-09, Michelle in chat): Story → "That's the learner" slide: the orange swirl doesn't slide to its new spot; it unswirls where it is, then swirls in at the new position.
- [ ] APPROVED (2026-10-09, Michelle in chat): Cards enter the examples like a card trick: each starts big and swirls in, shrinking into the stack, one after another (replaces dealing from below). Fix: cards must not peek in at the bottom of Morphology 3.
- [ ] APPROVED (2026-10-09, Michelle in chat): The card-trick entrance fans out like a hand of cards (the stack swirls in as one deck, then spreads and settles), and it plays faster.
- [ ] APPROVED (2026-10-09, Michelle in chat): The card trick's fan-out takes about 1 second.
- [ ] APPROVED (2026-10-09, Michelle in chat): Interviews → Expert: the light-blue column comes up tucked under the top orange circle, which pulls it up (they move together, the column's top hidden under the circle).
- [ ] APPROVED (2026-10-09, Michelle in chat): Expert slide: no gap above the light-blue column; it comes up as one piece with its top fully behind the orange circle (column starts at the circle's centre line).
- (2026-10-09) Fix from Michelle's screenshot: shapes waiting to enter must start fully outside the window on screens taller than 16:9 (the expert slide's orange circle peeked in below the Interviews slide).
- [ ] APPROVED (2026-10-10, Michelle in chat): Research cards are built from the layers exported to design/slides/svgs/Character Color Research Slides, not cut out of the Research slide export. Exception: card 1 (its layers aren't in the export) uses the card cut from the export.
- [ ] APPROVED (2026-10-11, Michelle in chat): Mula and Dulo (design/slides/svgs/Character_Mula, Character_Dulo; spec in "Duolingo Character Analysis: Mula and Dulo" PDF) replace the twins PNG on every deck slide. Animate pose by pose, confirming each step with Michelle before moving on. The two always appear together. The PDF's empty Help/Teaching animations are dropped for now.
- [ ] APPROVED (2026-10-11, Michelle in chat): The Color Palette slide shows Mula and Dulo's colours, taken from their layers in the character Figma file (it has no palette frame).
- [ ] APPROVED (2026-10-11, Michelle in chat): Character step 2, Idle. Mula: heavy breathing, eyes sweep side to side now and then. Dulo: wide, immovable stance; now and then she fixes her bangs in quick, decisive moves.
- [ ] APPROVED (2026-10-11, Michelle in chat): Mula and Dulo idle with both arms down (Figma has them out).
- [ ] APPROVED (2026-10-11, Michelle in chat): Idle fixes: Mula's pupils stay inside her eyes when she glances; Dulo breathes the same way as Mula; Mula's pointing finger is hidden while idle; Dulo's arms are flipped the other way; Dulo's scarf and buttons stay visible on her dress.
- [ ] APPROVED (2026-10-11, Michelle in chat): Only Dulo's finger sits on top of her scarf (sleeve and hand stay behind). Her bangs fix swings the arm up from the other side.
- [ ] APPROVED (2026-10-11, Michelle in chat): Dulo's fingers sit under her sleeves but over her scarf.
- [ ] APPROVED (2026-10-11, Michelle in chat): While Dulo fixes her bangs, she looks up at them, where her hand is.
- [ ] APPROVED (2026-10-11, Michelle in chat): Mula and Dulo blink while idle.

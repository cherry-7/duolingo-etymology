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

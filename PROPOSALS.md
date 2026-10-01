# Proposals

Suggestions waiting on a decision.

**Convention:** each proposal ends with a decision line that the team fills in with one of:

- `YES`: accepted. Move it to [TASKS.md](TASKS.md) as an `APPROVED` task.
- `NO`: rejected. Leave it here as a record and don't build it.
- `LATER`: good idea, not now. Revisit after the current work is done.

A proposal with no decision is still open and must not be built.

```
### Short title
What: what it is.
Why: why it helps.
Effort: small / medium / large.
Decision: YES / NO / LATER
```

## Proposals

### Root URL redirect
What: add a top-level `index.html` that redirects to `/deck/`.
Why: the bare Pages URL (`/duolingo-etymology/`) currently 404s.
Effort: small.
Decision:

### "Etymology" opening-hook slide
What: a deck slide that breaks down the word "etymology" itself.
Why: SPEC.md lists it as the opening hook, but /design/slides doesn't define it yet.
Effort: small once copy and layout exist in /design.
Decision:

### Slide counter / progress bar
What: a small "3 / 12" counter or progress bar on the deck.
Why: helps the presenter keep their place on a projector.
Effort: small.
Decision:

### Tap-to-place for drag questions
What: let players tap a part, then tap the root, as an alternative to dragging.
Why: helps accessibility and players with motor difficulties, and is a backup if dragging misbehaves on someone's phone during the live demo.
Effort: small.
Decision:

### Button fallback for the language swipe
What: a small "next" button (and the existing arrow key) alongside the swipe at language boundaries.
Why: on desktop and for screen-reader users a swipe is hard to discover. It's also a safety net if a phone's browser grabs the gesture.
Effort: small.
Decision:

### Part position field for drag questions
What: add `position` (e.g. before / after / left / right / top / bottom) to each drag part in questions.json.
Why: parts currently attach to the root in the order they're dropped, so a prefix dropped second shows up after the root.
Effort: small.
Decision:

### Hint and correction fields
What: add `hint` and `correction` fields to questions, once /design/feedback-notes.md defines what a wrong answer shows.
Why: wrong answers currently show only a neutral "Try again [TBD]".
Effort: small once the notes exist.
Decision:

### Leaderboard reset for rehearsals
What: a way to clear the live leaderboard between run-throughs (e.g. a password-protected admin URL or a one-line script).
Why: rehearsal scores would otherwise show up during the real pitch.
Effort: small.
Decision:

### Story thread across the deck
What: one continuous line that draws itself across every slide as the deck moves (like the ribbon on lusion.co), tying the chapters together.
Why: makes the deck read as one story instead of separate slides.
Effort: medium (needs a color and path from /design).
Decision:

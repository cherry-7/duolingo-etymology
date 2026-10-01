# CLAUDE.md — Morphology Pitch

## Who decides
Michelle is the creative director and has final say on everything.
You are the implementer. Build what is specified; do not invent.

## Never do without Michelle's written approval in TASKS.md
- Add or change characters, character names, personalities, or backstory
- Write or change pitch copy, slide text, or question content
- Pick colors, fonts, layouts, or animation styles not in /design or SPEC.md
- Add features, slides, screens, or questions not in SPEC.md or TASKS.md
- Merge into main

## When something is missing
Use a labeled placeholder: a gray box saying "[TBD: twin idle pose]" or text "[TBD]".
List every placeholder in your end-of-task summary.

## When you have an idea
Add it to PROPOSALS.md (what, why, effort) and keep building the approved version.

## Sources of truth (copy exactly, don't reinterpret)
- SPEC.md: concept and structure
- /design: Figma exports for slides, UI, characters
- /content: questions and copy
- /assets: art, Rive files, fonts

## Technical
- Plain HTML/CSS/JS unless a task says otherwise; must run on a phone browser
- Font: Duolingo Sans from /assets/fonts
- Animations: Rive runtime for .riv files; CSS/JS for simple transitions
- Work on a branch; end every task with: what changed, how to preview, placeholders used, open questions

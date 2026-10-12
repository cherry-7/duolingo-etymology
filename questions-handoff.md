# Beginner word-roots and character-building lesson

Use `content/questions.json` with the accompanying `content/questions.schema.json`. The lesson has exactly 10 questions in the required order: 3 English (Latin roots), 4 Chinese, and 3 Sanskrit. Every question now includes a short prompt, a hint, and a correction.

## Lesson approach

This revision uses short, single-action prompts and repeated ideas across matching, choice, ordering, radical building, dragging, splitting, odd-one-out recognition, and construction matching. It mixes word roots, word building, character components, and recall. The aim is approachable practice in the requested Duolingo style, rather than a technical lesson requiring players to know linguistic terminology.

| # | Group | Type | Task |
|---|---|---|---|
| 1 | English (Latin roots) | split | Split transport into trans + port. |
| 2 | English (Latin roots) | odd | Identify airport as the compound among three English words. |
| 3 | English (Latin roots) | construction | Match transport, portable, and airport to their constructions. |
| 4 | Chinese | match | Match 明, 林, and 森 to the components that combine into each character. |
| 5 | Chinese | radical | Drag 日 into the missing spot beside 月 to form 明. |
| 6 | Chinese | order | Build 火山岩 from 火山 and 岩. |
| 7 | Chinese | choice | Recall the meaning of 明. |
| 8 | Sanskrit | match | Learn जल, वन, and compound-final -ज. |
| 9 | Sanskrit | order | Build जलज, literally born in water. |
| 10 | Sanskrit | choice | Apply the same pattern to वनज, literally born in a forest. |

## Hint and correction behavior

Both fields are plain strings on the question object:

- `hint`: a clue a player can request before submitting or while retrying.
- `correction`: the correct answer plus a short explanation after an incorrect answer.

These fields are optional in the schema for compatibility, but populated in all 10 demo questions. The text is question-level feedback: the schema has no separate explanation for each distractor. For a matching mistake, the correction gives the complete mapping.

The updated schema adds these two allowed fields to drag, choice, match, order, split, odd, construction, and radical. The `radical` type builds a character by dragging one correct radical into a missing-component slot and may include distractor radicals. It preserves the original required fields and the default-drag behavior when `type` is absent. Top-level `minItems` and `maxItems` now enforce exactly 10 questions; language grouping and answer-key consistency still require separate checks.

Content and schema support do not automatically display feedback. The demo UI still needs to read `question.hint` and `question.correction`, using the designers' hint and wrong-answer states. No application renderer was available to edit or test here.

## Proposed artwork

All filenames are relative to `/assets/questions/`. They are proposed names pending designer agreement; artwork is not included.

| Question | Filename | Art direction |
|---|---|---|
| 3 | `english-portable-root.png` | A person carrying a box; show port clearly in UI text. |
| 3 | `english-portable-complete.png` | A small object easily carried in one hand. |
| 5 | `chinese-lin-root.png` | One tree with a readable 木 and space on its right. |
| 5 | `chinese-lin-complete.png` | A grove with a readable 林 as one completed character. |
| 6 | `chinese-ming-root.png` | A sun with a readable 日 and space on its right. |
| 6 | `chinese-ming-complete.png` | A bright scene with a readable 明, 日 left and 月 right. |

The 木屋 imagery from the previous morphology-focused version is no longer referenced. The 林 and 明 filenames from the original version are reused. Each drag has one correct drop, so intermediate `stageImages` are unnecessary. `animationId` remains omitted until names are agreed.

## Language and integration details

- English questions use Latin-derived word parts in English, not full Latin grammatical forms. -less and -ful are English distractor suffixes with Old English origins.
- Chinese assembly teaches modern written structure. 木, 日, and 月 can be radicals, but a component is not automatically the indexing radical in every character. The sun-and-moon association for 明 is presented as a memory aid, not an established account of its historical invention.
- Chinese drag completion must display 林 and 明. Simply joining component strings produces 木木 and 日月, not the desired single glyphs. The complete image and `answerMeaning` name the finished character.
- Sanskrit uses compound forms. Compound-final -ज (-ja) supplies the selected sense born/produced. जलज and वनज have additional dictionary senses; the questions ask for their literal meanings.
- Order tiles contain the text to join: trans + port becomes transport; जल + ज becomes जलज. Do not insert spaces or romanization into the result. A tile with `order: null` is a distractor.
- Exactly one option is correct in each choice or drag. Matching meanings are unique within each question. Correct order positions are consecutive from 1.
- Check Chinese and Devanagari font coverage and text wrapping at actual phone size. The content has not been tested with learners or run in the demo.

## Sources

These references were checked during the content work. Glosses select beginner senses rather than reproducing every dictionary definition.

| Content | References |
|---|---|
| English roots and derived words | Online Etymology Dictionary: [portable](https://www.etymonline.com/word/portable), [transport](https://www.etymonline.com/word/transport), [-able](https://www.etymonline.com/word/-able). |
| English distractor suffixes | Online Etymology Dictionary: [-less](https://www.etymonline.com/word/-less), [-ful](https://www.etymonline.com/word/-ful). |
| 木, 日, 月 meanings | Taiwan Ministry of Education: [木](https://dict.revised.moe.edu.tw/dictView.jsp?ID=1511&la=0&powerMode=0), [日](https://dict.revised.moe.edu.tw/dictView.jsp?ID=1378&la=1&powerMode=0), [月](https://dict.revised.moe.edu.tw/dictView.jsp?ID=11753&la=0&powerMode=0). |
| 林 and 明 meanings and modern structure | Taiwan Ministry of Education, Dictionary of Chinese Character Variants: [林](https://dict.variants.moe.edu.tw/dictView.jsp?ID=20787&la=1), [明](https://dict.variants.moe.edu.tw/dictView.jsp?ID=19711&la=0). |
| जल and जलज | Monier-Williams (1872), [p. 341, University of Cologne scan](https://www.sanskrit-lexicon.uni-koeln.de/scans/MW72Scan/MW72Scanpdf/pg_0341.pdf). |
| वन | Monier-Williams (1899), [p. 917, University of Cologne scan](https://www.sanskrit-lexicon.uni-koeln.de/scans/MWScan/MWScanpdf/mw0917-vadhyaghAtaka.pdf). |
| Compound-final -ज and वनज | Dictionary reproductions: [-ja](https://sanskritdictionary.com/?q=ja), [vanaja](https://sanskritdictionary.com/vanaja/125479/7). Definitions verified in indexed text; direct retrieval was blocked. |

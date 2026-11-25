# Tech Spanish ↔ Tech English: authoring guide

The one bilingual course. The interface switches between Spanish and English
(header switch, `course.languages = ['es', 'en']`), and every text a learner
reads follows it. The vocabulary comes from the glossary in
`content/tech-spanish/` (207 terms); this folder turns it into lessons.

```bash
npm run dev:tech-spanish                                   # site at localhost (add ?unlocked to open paid modules)
npx vitest run src/courses/tech-spanish/modules.test.js    # every module, both languages
npx vitest run src/courses/tech-spanish/modules.test.js -t git-everyday   # one module
```

## Files

| File | What it is |
|---|---|
| `index.js` | The course: home page text, FAQ, labels, the module list |
| `meta.json` | id, title, price, URL (also read by `vite.config.js`) |
| `glossary.json` | **Generated** copy of `content/tech-spanish/glossary.json`. Edit the glossary there and run `node build.mjs` |
| `glossary.js` | Helpers: `term(id)`, `termTable(ids)`, `examples(ids)`, `traps(ids)`, `cardsFor(ids)` |
| `tutorials/0N-<slug>.js` | One module each (the engine calls them tutorials) |
| `modules.test.js` | Checks each module on its own, plus "every glossary term is in some deck" |

## Writing text in two languages

Every learner-facing text is `both(en, es)` from `src/engine/i18n.js`:

```js
import { both, join } from '../../../engine/i18n';
import { termTable, examples, traps, cardsFor } from '../glossary';

title: both('Bugs, fixes and rollbacks', 'Bugs, fixes y rollbacks'),
body: join(
  both('Why first: …', 'Primero, el porqué: …'),
  termTable(['bug', 'debug', 'fix']),   // generated from the glossary, already bilingual
  traps(['bug', 'debug', 'fix']),
  both('**In short:** …', '**En resumen:** …'),
),
```

- `both()` goes on the **smallest piece that changes**: a title, a body, one quiz option. Never wrap a list whose length differs between languages: quizzes, register items and cards must be the same in both languages (the tests check it).
- Content that is the same in both languages stays plain: ids, slugs, `hours`, `target`, a phrase being studied, a model answer.
- `join(...)` glues Markdown parts (plain or `both`) with a blank line between them.
- Never retype a translation: use the glossary helpers. If a term is missing or wrong, fix `content/tech-spanish/glossary.source.mjs` and rebuild.

## A module

```js
export default {
  slug: 'git-everyday',            // plain English, never changes (it's in progress keys and URLs)
  number: 1,
  free: true,                      // modules 0 and 1 are free
  title: both(…), situation: both(…), overview: both(…),
  level: both('Beginner', 'Principiante'),   // or Intermediate / Intermedio
  hours: 1,
  skills: ['commit', 'merge', 'pull request'],   // shown on the home card
  steps: [ … ],
};
```

### Step kinds

| kind | What the learner does | Fields |
|---|---|---|
| `read` | Reads a lesson | `id, kind, title, minutes, body` |
| `cards` | Flashcards, both directions | `id, kind, title, minutes, body?, cards: cardsFor([...ids])` |
| `register` | Sorts phrases: formal document / with the team / slang | `id, kind, title, minutes, body, items: [{ text, context?, answer: 'formal' \| 'team' \| 'slang', explain }]` |
| `rewrite` | Writes a real message; checked for key terms | `id, kind, title, minutes, body?, target: 'es' \| 'en', source?, task, minWords?, mustUse: [{ any: [...], label? }], avoid?: [{ any: [...], why }], model` |
| `quiz` | Multiple choice with explanations | `id, kind, title, minutes, questions: [{ q, options: [...], answer, explain }]` |

- **register** `text` is the phrase itself (plain, in whatever language the phrase is). `context` and `explain` are `both()`. Answers must agree with the glossary's register for that term.
- **rewrite** terms match without case or accents, on whole words; `despleg*` matches any word starting with *despleg*. List the reasonable alternatives (`['despleg*', 'desplieg*', 'implement*']`) so a good answer isn't rejected for a synonym. `avoid` catches traps (e.g. `librer*` in a formal Spanish text). The tests require that `model` passes, an empty text fails, and pasting `source` fails, in both interface languages.
- **quiz** options are `both()` one by one (or plain when they're terms, the same in both languages).

## House style

- **Why first.** Open each lesson with the problem the words solve, then the words.
- **Define every term** the first time, in plain words. One real-world analogy when a concept is abstract.
- **End each lesson** with a one-line summary: `**In short:** …` / `**En resumen:** …`.
- **Spanish:** neutral, with *tú* (no *vos*, no *vosotros*). Where Spain and Latin America differ, say so; regional notes are common usage, not rules.
- **No invented authority.** Only call a translation "the one AWS uses" when `content/tech-spanish/sources.mjs` backs it (AWS Spanish docs, GitHub's 2022 glossary, VS Code, Git's own translation), and remember AWS's Spanish docs are machine-translated. Fundéu / RAE / Microsoft items are still pending: present them as common usage.
- **AWS facts** must be current and correct (check docs.aws.amazon.com when unsure).
- Examples are AWS-flavored and realistic: Lambda, S3, DynamoDB, CloudFront, CI pipelines, stand-ups, pull requests.

# Tech Spanish ↔ Tech English

Seed data for a future Level Up Study Hub course. One source, three outputs.

| File | What it is | Edit it? |
|---|---|---|
| `glossary.source.mjs` | The ~200 terms (groups, Spanish forms, register, Spain/LatAm, examples, false friends) | ✓ yes |
| `sources.mjs` | Sources actually read, and notes on debatable choices (`pending` = still to check) | ✓ yes |
| `build.mjs` | Validates and generates the files below | when the shape changes |
| `glossary.json` | Clean data for any app or course | no, generated |
| `flashcards.json` | `{id, front, back, hint, tags, difficulty}`, two cards per term (`en-es`, `es-en`) | no, generated |
| `GLOSSARY.md` | The readable document | no, generated |
| `COURSE-OUTLINE.md` | Modules and lessons for the course | ✓ yes |

```bash
cd content/tech-spanish && node build.mjs
```

Rules: don't present a translation as "official" unless a source in `sources.mjs` says so. Items under `pending` still need Fundéu / RAE / Microsoft; those sites were unreachable when this was built.

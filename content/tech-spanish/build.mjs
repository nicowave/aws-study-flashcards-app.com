// Builds the glossary outputs from glossary.source.mjs + sources.mjs.
//   node build.mjs          → writes glossary.json, flashcards.json, GLOSSARY.md
//   node build.mjs --check  → only validates (exit 1 on any problem)
// Why one source: the readable doc, the flashcards and a future course must
// never drift apart, so all of them are generated from the same entries.
import { mkdirSync, writeFileSync } from 'node:fs';
import { GROUPS, TERMS } from './glossary.source.mjs';
import { SOURCES, NOTES } from './sources.mjs';

const LEVELS = { 1: 'beginner', 2: 'intermediate', 3: 'advanced' }; // the games' difficulty names

// ---------- validate ----------
const problems = [];
const seen = new Set();
for (const g of GROUPS) {
  for (const t of TERMS[g.id] ?? []) {
    const where = `${g.id}/${t.id}`;
    if (seen.has(t.id)) problems.push(`${where}: duplicate id`);
    seen.add(t.id);
    for (const f of ['en', 'es', 'work']) if (!t[f]) problems.push(`${where}: missing ${f}`);
    if (!Array.isArray(t.reg) || t.reg.length !== 3) problems.push(`${where}: reg must be [formal, casual, slang]`);
    if (!Array.isArray(t.ex) || t.ex.length !== 2 || !t.ex[0] || !t.ex[1]) problems.push(`${where}: ex must be [en, es]`);
    if (!LEVELS[t.lvl]) problems.push(`${where}: lvl must be 1, 2 or 3`);
    if (t.note && NOTES[t.note] === undefined && !t.note.includes(' ')) problems.push(`${where}: unknown note key "${t.note}"`);
  }
}
for (const [k, n] of Object.entries(NOTES)) for (const s of n.sources) if (!SOURCES[s]) problems.push(`note ${k}: unknown source "${s}"`);
if (problems.length) { console.error(problems.join('\n')); process.exit(1); }
const total = GROUPS.reduce((n, g) => n + TERMS[g.id].length, 0);
if (process.argv.includes('--check')) { console.log(`OK: ${total} terms`); process.exit(0); }

// ---------- glossary.json: the clean, reusable data ----------
const entries = GROUPS.flatMap((g) => TERMS[g.id].map((t) => {
  const note = t.note ? (NOTES[t.note] ? { ...NOTES[t.note], key: t.note } : { text: t.note, sources: [] }) : null;
  return {
    id: t.id,
    group: g.id,
    en: t.en,
    es: t.es,
    register: { formal: t.reg[0], casual: t.reg[1], slang: t.reg[2] },
    atWork: t.work,
    region: t.region ?? null,
    falseFriend: t.ff ?? null,
    example: { en: t.ex[0], es: t.ex[1] },
    note: note && { text: note.text, sources: note.sources, pending: note.pending ?? null },
    difficulty: LEVELS[t.lvl],
  };
}));
mkdirSync('../../aws-coding-courses/src/courses/tech-spanish', { recursive: true });
const glossaryJson = JSON.stringify({ version: 1, groups: GROUPS, sources: SOURCES, terms: entries }, null, 2) + '\n';
writeFileSync('glossary.json', glossaryJson);
// The course site reads its own copy (Vite won't import files outside the app);
// courses.test.js fails if the copy and this file ever differ.
writeFileSync('../../aws-coding-courses/src/courses/tech-spanish/glossary.json', glossaryJson);

// ---------- flashcards.json: {id, front, back, hint, tags, difficulty} ----------
// Two cards per term, one per direction, so learners practice both ways.
const first = (s) => s.split(';')[0].trim();
const cards = entries.flatMap((e) => {
  const extra = [e.falseFriend && 'false-friend', e.region && 'region'].filter(Boolean);
  const warn = e.falseFriend ? ` ⚠ ${e.falseFriend}` : '';
  return [
    {
      id: `ts-${e.id}-en-es`,
      front: e.en,
      back: `${e.es}. En el equipo: ${e.atWork}. Ej.: "${e.example.es}"${warn}`,
      hint: e.example.en,
      tags: [e.group, 'en-es', ...extra],
      difficulty: e.difficulty,
    },
    {
      id: `ts-${e.id}-es-en`,
      front: first(e.es),
      back: `${e.en}. E.g. "${e.example.en}"`,
      hint: e.example.es,
      tags: [e.group, 'es-en', ...extra],
      difficulty: e.difficulty,
    },
  ];
});
writeFileSync('flashcards.json', JSON.stringify({
  deck: { id: 'tech-spanish', name: 'Tech Spanish ↔ Tech English', description: 'Vocabulario técnico de desarrollo, DevOps y AWS en los dos idiomas.', source: 'content/tech-spanish/glossary.source.mjs' },
  cards,
}, null, 2) + '\n');

// ---------- GLOSSARY.md: the readable document ----------
const cell = (s) => (s ?? '').replace(/\|/g, '\\|').replace(/\n/g, ' ');
const reg = (r) => [`**Formal:** ${r.formal}`, `**Equipo:** ${r.casual}`, r.slang && `**Jerga:** ${r.slang}`].filter(Boolean).join('<br>');
const notes = (e) => [
  e.region && `🌎 ${e.region}`,
  e.falseFriend && `⚠️ ${e.falseFriend}`,
  e.note && `📚 ${e.note.text}${e.note.sources.length ? ' ' + e.note.sources.map((s) => `[${SOURCES[s].title.split(' (')[0].split(' — ')[0]}](${SOURCES[s].url})`).join(', ') : ''}${e.note.pending ? ' _(por verificar)_' : ''}`,
].filter(Boolean).join('<br>');

let md = `# Tech Spanish ↔ Tech English — glosario

> ${total} términos en ${GROUPS.length} grupos · generado por \`build.mjs\` desde \`glossary.source.mjs\` (no editar a mano)

## Por qué el español técnico mezcla inglés

- **El vocabulario nace en inglés.** Las herramientas, la documentación, los mensajes de error y Stack Overflow llegan primero en inglés. Cuando aparece una traducción, el equipo ya lleva meses diciendo la palabra original.
- **Las traducciones oficiales no coinciden entre sí.** Para \`git push\`, GitHub dice "subir", VS Code dice "Insertar" y la traducción de Git dice "hacer push" (ver Fuentes). Si los propios fabricantes no se ponen de acuerdo, el equipo se queda con la palabra que todos entienden: la inglesa.
- **El español adapta lo que adopta.** Los verbos ingleses reciben la terminación \`-ear\` (*deployar, commitear, mergear, pushear, debuggear*) y los sustantivos toman el género de su traducción: *la* API (la interfaz), *la* VPC (la nube), *la* Lambda (la función), *la* query (la consulta).
- **Resultado:** el mismo profesional escribe "implementación" en un documento para un cliente y dice "lo deployo después de la daily" en la llamada con su equipo. Las dos cosas son correctas en su contexto.

## Cuándo usar cada forma

| Situación | Usa | Ejemplo |
|---|---|---|
| Documento formal, cliente, propuesta, documentación pública | El término en español; el inglés entre paréntesis la primera vez | "Usamos una canalización (pipeline) de integración continua." |
| Conversación con el equipo, Slack, revisión de código | Lo que dice el equipo, aunque sea inglés o espanglish | "Mergeo la PR y la deployamos." |
| Jerga | Solo entre colegas de confianza; nunca por escrito a un cliente | "Se cayó prod, estamos apagando incendios." |

**Regla práctica:** si dudas, escribe en español y di en inglés. Y elige una forma (p. ej. "implementar" o "desplegar") y mantenla en todo el documento.

**Sobre las diferencias España / Latinoamérica:** son observaciones de uso habitual, no normas. Varían por país y por empresa; conviene validarlas con hablantes de cada región.

**Leyenda:** 🌎 diferencia regional · ⚠️ falso amigo · 📚 nota y fuente · _(por verificar)_ = pendiente de contrastar con Fundéu, la RAE o Microsoft.

`;

for (const g of GROUPS) {
  const rows = entries.filter((e) => e.group === g.id);
  md += `## ${g.es} · ${g.en} (${rows.length})\n\n| English | Español | Registro | En el trabajo se dice | Ejemplo | Notas |\n|---|---|---|---|---|---|\n`;
  for (const e of rows) {
    md += `| **${cell(e.en)}** | ${cell(e.es)} | ${cell(reg(e.register))} | ${cell(e.atWork)} | **EN** ${cell(e.example.en)}<br>**ES** ${cell(e.example.es)} | ${cell(notes(e))} |\n`;
  }
  md += '\n';
}

const ff = entries.filter((e) => e.falseFriend);
md += `## Falsos amigos y trampas (${ff.length})\n\n${ff.map((e) => `- **${e.en}** → ${e.falseFriend}`).join('\n')}\n\n`;
md += `## Fuentes (consultadas el ${Object.values(SOURCES)[0].checked})\n\nLa documentación de AWS en español está traducida automáticamente (lo dice cada página): muestra qué términos usa AWS, no una norma.\n\n${Object.values(SOURCES).map((s) => `- [${s.title}](${s.url}) — "${s.quote}"`).join('\n')}\n\n`;
const pending = [...new Set(entries.filter((e) => e.note?.pending).map((e) => e.note.pending))];
md += `## Por verificar (${pending.length})\n\nEstas fuentes no se pudieron abrir desde la sesión que generó el glosario. Hasta verificarlas, el glosario presenta esas formas como uso habitual, no como recomendación oficial.\n\n${pending.map((p) => `- ${p}`).join('\n')}\n`;
writeFileSync('GLOSSARY.md', md);

console.log(`Wrote glossary.json (${entries.length} terms), flashcards.json (${cards.length} cards), GLOSSARY.md`);

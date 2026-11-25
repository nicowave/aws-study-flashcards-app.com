// Module 7: Teamwork and meetings (paid).
// Lessons: agile rituals; code review with the right tone; deadlines and
// priorities; remote work and the false friends eventually / actually.
// Translations come from the glossary (termTable, traps, cardsFor). Nothing in
// this module is backed by content/tech-spanish/sources.mjs, so every Spanish
// form here is common usage, never an "official" translation.
import { both, join } from '../../../engine/i18n';
import { termTable, traps, cardsFor } from '../glossary';

const RITUALS = ['stand-up', 'planning', 'retro', 'story-points', 'estimate', 'kickoff'];
const REVIEW = ['code-review', 'lgtm', 'nit', 'feedback', 'blocker'];
const DEADLINES = ['deadline', 'eta', 'priority', 'scope', 'follow-up', 'heads-up', 'stakeholder', 'pm-po', 'ship-it', 'meeting'];
const REMOTE = ['remote', 'onboarding', 'pair-programming', 'eventually-ff'];

export default {
  slug: 'teamwork',
  number: 7,
  free: false,
  title: both('Teamwork and meetings', 'Trabajo en equipo y reuniones'),
  situation: both(
    "You've just joined a fully remote team spread across Madrid, Mexico City and Seattle. Your day starts with the stand-up in English, and you have to give your update from notes you wrote in Spanish. Before lunch you review a teammate's pull request and want your comments to sound helpful, not harsh, in either language. By the afternoon the delivery date you promised the client has slipped, and someone has to write her a polite email in Spanish with the new date. And in yesterday's retro, a simple \"we'll eventually fix it\" was heard as \"maybe we'll fix it\". Today you sort all of that out.",
    'Acabas de entrar en un equipo 100% remoto repartido entre Madrid, Ciudad de México y Seattle. Tu día empieza con la daily en inglés, y tienes que dar tu actualización a partir de notas que escribiste en español. Antes de comer revisas la pull request de un compañero y quieres que tus comentarios suenen útiles, no bruscos, en cualquiera de los dos idiomas. Por la tarde, la entrega prometida a la clienta se ha retrasado y alguien tiene que escribirle un correo cortés en español con la nueva fecha. Y en la retro de ayer, un simple "we\'ll eventually fix it" se entendió como "quizás lo arreglemos". Hoy pones orden en todo eso.',
  ),
  overview: both(
    "Meetings, reviews and deadlines are where a bilingual team talks the most, and where a wrong word costs the most: a comment that sounds rude, a date nobody wrote down, a false friend that flips a promise. In this module you learn the names of the agile rituals (stand-up, planning, retro), how to leave code review comments in three tones, the vocabulary of deadlines and priorities (deadline, ETA, scope, follow-up, stakeholder), and the words of remote work, including the two false friends that cause the most confusion in meetings: eventually and actually. Then you write three real texts: three review comments on a teammate's pull request, a stand-up update in English and a follow-up email in Spanish to a client about a slipped deadline.",
    'Las reuniones, las revisiones y los plazos son donde más habla un equipo bilingüe, y donde una palabra equivocada sale más cara: un comentario que suena grosero, una fecha que nadie apuntó, un falso amigo que cambia una promesa. En este módulo aprendes los nombres de los rituales ágiles (daily, planning, retro), cómo dejar comentarios de revisión de código en tres tonos, el vocabulario de plazos y prioridades (fecha límite, ETA, alcance, seguimiento, partes interesadas) y las palabras del trabajo remoto, incluidos los dos falsos amigos que más confusiones causan en las reuniones: eventually y actually. Después escribes tres textos reales: tres comentarios en la pull request de un compañero, tu actualización de la daily en inglés y un correo de seguimiento en español a una clienta sobre una fecha límite que se retrasa.',
  ),
  level: both('Intermediate', 'Intermedio'),
  hours: 1,
  skills: ['stand-up', 'code review', 'deadline', 'follow-up', 'remote work'],
  steps: [
    // ---------- Lesson 1: agile rituals ----------
    {
      id: 'agile-rituals',
      kind: 'read',
      title: both('Agile rituals: stand-up, planning, retro', 'Rituales ágiles: daily, planning, retro'),
      minutes: 6,
      body: join(
        both(
          `**Why first.** Agile teams run on a few recurring meetings, and on a bilingual team their names are hardly ever translated. "Nos vemos en la daily" and "see you at stand-up" mean the same fifteen minutes. You need the team name to follow the conversation, and the formal one for a project plan or a client report.

**The words, in plain terms:**
- The **stand-up** or **daily** (*reunión diaria*) is a short meeting every day, usually 15 minutes. A common format: what you did yesterday, what you'll do today, and what is blocking you. People stand, so it stays short.
- **Sprint planning** (*planificación del sprint*) opens each sprint, a fixed stretch of work that often lasts two weeks: the team chooses what it can finish in it.
- The **retrospective** or **retro** (*retrospectiva*) closes the sprint: what went well, what didn't, what to change.
- A **user story** (*historia de usuario*) describes a need from the user's side: "As a learner, I want…" **Story points** (*puntos de historia*) size a story compared with others, not in hours. Think of T-shirt sizes: you know a large is bigger than a medium without measuring it.
- To **estimate** (*estimar*; the noun is *estimación*) is to give your honest guess of the effort. In the hallway: "¿Cuánto le pones?" ("How many points would you give it?").
- The **kickoff** (*reunión de inicio* or *de arranque*) is a project's first meeting, where goals, people and dates are set.

**Grammar tip.** Most meeting names borrowed from English take *la* (la daily, la planning, la retro) because people think of *la reunión*; *el stand-up* and *el kickoff* keep *el*, and you'll also hear "el planning". Common usage, not a rule.`,
          `**Primero, el porqué.** Los equipos ágiles viven de unas pocas reuniones que se repiten, y en un equipo bilingüe sus nombres casi nunca se traducen. "Nos vemos en la daily" y "see you at stand-up" son los mismos quince minutos. Necesitas el nombre de equipo para seguir la conversación, y el formal para un plan de proyecto o un informe para un cliente.

**Las palabras, en limpio:**
- La **daily** o el **stand-up** (*reunión diaria*) es una reunión corta cada día, normalmente de 15 minutos. Un formato habitual: qué hiciste ayer, qué harás hoy y qué te bloquea. Se hace de pie, así dura poco.
- La **planning** (*planificación del sprint*) abre cada sprint, un tramo fijo de trabajo que suele durar dos semanas: el equipo elige qué puede terminar en él.
- La **retro** (*retrospectiva*) cierra el sprint: qué salió bien, qué no y qué cambiar.
- Una **historia de usuario** (*user story*) describe una necesidad desde el lado del usuario: "Como estudiante, quiero…". Los **puntos de historia** (*story points*) miden una historia comparada con otras, no en horas. Piensa en las tallas de camiseta: sabes que una L es más grande que una M sin medirla.
- **Estimar** (*estimate*; el sustantivo es *estimación*) es dar tu cálculo honesto del esfuerzo. En el pasillo: "¿Cuánto le pones?"
- El **kickoff** (*reunión de inicio* o *de arranque*) es la primera reunión de un proyecto, donde se fijan objetivos, personas y fechas.

**Truco de gramática.** Casi todos los nombres de reunión tomados del inglés son femeninos (la daily, la planning, la retro) porque se piensa en *la reunión*; *el stand-up* y *el kickoff* van con *el*. También oirás "el planning". Uso común, no una norma.`,
        ),
        termTable(RITUALS),
        traps(RITUALS),
        both(
          '**In short:** the stand-up is daily, planning opens the sprint, the retro closes it, and stories are sized in points. Say "la daily" with the team and "reunión diaria" in a document.',
          '**En resumen:** la daily es cada día, la planning abre el sprint, la retro lo cierra y las historias se miden en puntos. Di "la daily" con el equipo y "reunión diaria" en un documento.',
        ),
      ),
    },
    {
      id: 'cards-rituals',
      kind: 'cards',
      title: both('Flashcards: agile rituals', 'Tarjetas: rituales ágiles'),
      minutes: 5,
      body: both(
        'Each term in both directions. Before you flip, say the formal form and the team form out loud.',
        'Cada término en las dos direcciones. Antes de girar, di en voz alta la forma formal y la de equipo.',
      ),
      cards: cardsFor(RITUALS),
    },

    // ---------- Lesson 2: code review with the right tone ----------
    {
      id: 'review-tone',
      kind: 'read',
      title: both('Code review with the right tone', 'Revisión de código con buen tono'),
      minutes: 7,
      body: join(
        both(
          `**Why first.** A review comment has no tone of voice and no face. A short "Rename this." is normal on many English-speaking teams, but word for word in Spanish it sounds like an order. A very polite Spanish comment can read as vague in English: is it a must or a maybe? The fix is the same in both languages: say how much each comment matters.

**The words, in plain terms:**
- A **code review** (*revisión de código*, "la review") is teammates reading your pull request before it's merged. On GitHub, reviewers can comment, approve or request changes.
- **LGTM** means "looks good to me": the reviewer approves. It's written the same in Spanish PRs.
- A **nit** (from *nitpick*) is a small detail that doesn't block the merge: a name, a typo. Writing "nit:" first tells the author they can fix it or skip it. Think of a proofreader: a pencil mark next to a comma is not the same as a red circle around a wrong figure.
- **Feedback** (*comentarios*, *retroalimentación*) is any opinion on your work: "dar feedback" with the team, "comentarios" in a document.
- A **blocker** (*impedimento*, *bloqueo*) is something that stops progress. In a review it must be fixed before merging; at the stand-up it's what stops you.

**Three comments on the same PR:**
- Formal: "Suggestion: could we validate the file size before calling S3? Empty files currently throw an error." / "Sugerencia: ¿podríamos validar el tamaño del archivo antes de llamar a S3? Actualmente, los archivos vacíos provocan un error."
- Team: "Nice work! What happens if the object doesn't exist? Maybe catch \`NoSuchKey\`." / "¡Buen trabajo! ¿Qué pasa si el objeto no existe? Quizás convenga capturar \`NoSuchKey\`."
- Nit: "nit: \`data2\` doesn't say much. \`thumbnailKey\`?" / "nit: \`data2\` no dice mucho. ¿\`thumbnailKey\`?"

Start or end with something positive ("Nice work!", "Thanks!"), and mark questions as questions ("question:").`,
          `**Primero, el porqué.** Un comentario de revisión no tiene tono de voz ni cara. Un "Rename this." seco es normal en muchos equipos en inglés, pero palabra por palabra en español suena a orden. Un comentario muy cortés en español puede leerse como vago en inglés: ¿es obligatorio o un "quizás"? La solución es la misma en los dos idiomas: di cuánto importa cada comentario.

**Las palabras, en limpio:**
- La **revisión de código** (*code review*, "la review") es que tus compañeros lean tu pull request antes de fusionarla. En GitHub, quien revisa puede comentar, aprobar o pedir cambios.
- **LGTM** significa "looks good to me", "me parece bien": quien revisa lo aprueba. En las PR en español se escribe igual.
- Un **nit** (de *nitpick*) es un detalle menor que no bloquea el merge: un nombre, una errata. Escribir "nit:" al principio le dice al autor que puede arreglarlo o dejarlo. Piensa en un corrector de textos: una marca a lápiz junto a una coma no es lo mismo que un círculo rojo alrededor de una cifra equivocada.
- El **feedback** (*comentarios*, *retroalimentación*) es cualquier opinión sobre tu trabajo: "dar feedback" con el equipo, "comentarios" en un documento.
- Un **bloqueo** o **impedimento** (*blocker*) es algo que frena el avance. En una revisión hay que resolverlo antes del merge; en la daily, es lo que te frena.

**Tres comentarios en la misma PR:**
- Formal: "Sugerencia: ¿podríamos validar el tamaño del archivo antes de llamar a S3? Actualmente, los archivos vacíos provocan un error." / "Suggestion: could we validate the file size before calling S3? Empty files currently throw an error."
- De equipo: "¡Buen trabajo! ¿Qué pasa si el objeto no existe? Quizás convenga capturar \`NoSuchKey\`." / "Nice work! What happens if the object doesn't exist? Maybe catch \`NoSuchKey\`."
- Nit: "nit: \`data2\` no dice mucho. ¿\`thumbnailKey\`?" / "nit: \`data2\` doesn't say much. \`thumbnailKey\`?"

Empieza o termina con algo positivo ("¡Buen trabajo!", "¡Gracias!") y marca las dudas como dudas ("duda:").`,
        ),
        termTable(REVIEW),
        traps(REVIEW),
        both(
          '**In short:** label each comment by weight (blocker, suggestion, question, nit), say thanks, and approve with LGTM. "Comentarios" in writing, "feedback" with the team.',
          '**En resumen:** marca el peso de cada comentario (bloqueo, sugerencia, duda, nit), da las gracias y aprueba con LGTM. "Comentarios" por escrito, "feedback" con el equipo.',
        ),
      ),
    },
    {
      id: 'cards-review',
      kind: 'cards',
      title: both('Flashcards: code review', 'Tarjetas: revisión de código'),
      minutes: 4,
      body: both(
        'Each term in both directions. For each one, think of a comment you could leave on a real PR.',
        'Cada término en las dos direcciones. Para cada uno, piensa en un comentario que podrías dejar en una PR real.',
      ),
      cards: cardsFor(REVIEW),
    },
    {
      id: 'review-comments-en',
      kind: 'rewrite',
      title: both('Write it: three review comments in English', 'Escríbelo: tres comentarios de revisión en inglés'),
      minutes: 7,
      body: both(
        "Diego's pull request adds the Lambda that resizes thumbnails. The team reviews in English, but you jotted your notes in Spanish. Turn them into three comments, each with its weight clear.",
        'La pull request de Diego añade la Lambda que redimensiona las miniaturas. El equipo revisa en inglés, pero apuntaste tus notas en español. Conviértelas en tres comentarios, cada uno con su peso claro.',
      ),
      target: 'en',
      source: `Notas sobre la PR de Diego
1) La Lambda no comprueba que el archivo exista antes de llamar a S3; si no existe, falla con NoSuchKey (importante).
2) Buen trabajo con las pruebas.
3) La variable \`tmp2\` tiene un nombre poco claro (detalle menor).`,
      task: both(
        'Write three review comments in English: a formal suggestion about the S3 issue, a friendly team comment about the tests, and a nit about the variable name.',
        'Escribe tres comentarios de revisión en inglés: una sugerencia formal sobre el problema con S3, un comentario cercano de equipo sobre las pruebas y un nit sobre el nombre de la variable.',
      ),
      minWords: 20,
      mustUse: [
        { any: ['nit*'], label: 'nit:' },
        { any: ['suggest*', 'consider*', 'could we', 'could you', 'what if', 'maybe', 'might'], label: 'a soft suggestion' },
        { any: ['thank*', 'nice', 'great', 'good', 'love'], label: 'something positive' },
        { any: ['S3', 'exist*', 'NoSuchKey', 'missing'], label: 'the S3 issue' },
      ],
      avoid: [
        {
          any: ['bloque*', 'sugerencia'],
          why: both('Write it in English: the team reviews in English.', 'Escríbelo en inglés: el equipo revisa en inglés.'),
        },
      ],
      model: `Suggestion: could we check that the object exists before calling S3? Right now a missing file makes the Lambda fail with \`NoSuchKey\`.

Nice work on the tests, thanks! They make this much easier to review.

nit: \`tmp2\` doesn't say much. Maybe \`resizedKey\`?`,
    },
    {
      id: 'standup-update-en',
      kind: 'rewrite',
      title: both('Write it: your stand-up update in English', 'Escríbelo: tu actualización de la daily en inglés'),
      minutes: 7,
      body: both(
        "The stand-up is in English, but you took your notes in Spanish. Turn them into the update you'd post in the stand-up thread or say out loud: short, in the first person, and clear about what you need from whom.",
        'La daily es en inglés, pero tomaste tus notas en español. Conviértelas en la actualización que publicarías en el hilo de la daily o dirías en voz alta: breve, en primera persona y clara sobre qué necesitas y de quién.',
      ),
      target: 'en',
      source: `Notas para la daily (jueves)

- Ayer: terminé la Lambda que redimensiona las imágenes y abrí la PR.
- Hoy: voy a atender los comentarios de la revisión de código y añadir pruebas para archivos vacíos.
- Bloqueo: no tengo permiso de IAM para escribir en el bucket de staging. Necesito que alguien del equipo de plataforma me lo dé.
- Aviso: mañana tengo cita con el médico; me conecto a las 11:00 (hora de Madrid).`,
      task: both(
        'Write your stand-up update in English: what you did yesterday, what you are doing today, what is blocking you and who can unblock you, and the heads-up about tomorrow, with the time zone.',
        'Escribe tu actualización de la daily en inglés: qué hiciste ayer, qué haces hoy, qué te bloquea y quién puede desbloquearte, y el aviso sobre mañana, con la zona horaria.',
      ),
      minWords: 35,
      mustUse: [
        { any: ['yesterday'], label: 'yesterday' },
        { any: ['today'], label: 'today' },
        { any: ['block*', 'unblock*', 'stuck', 'waiting on', 'waiting for', 'need*'], label: 'blocked / blocker' },
        { any: ['PR', 'PRs', 'pull request*', 'code review*', 'review*', 'feedback', 'comment*'], label: 'PR / code review' },
        { any: ['IAM', 'permission*', 'access'], label: 'IAM permission' },
        { any: ['test*'], label: 'tests' },
        { any: ['tomorrow', 'friday'], label: 'tomorrow (heads-up)' },
        { any: ['CET', 'CEST', 'UTC', 'GMT', 'Madrid', 'time zone'], label: 'time zone' },
      ],
      avoid: [
        {
          any: ['ayer', 'hoy', 'manana', 'estoy', 'tengo', 'necesito', 'para', 'que'],
          why: both('Write the whole update in English: the stand-up is in English.', 'Escribe toda la actualización en inglés: la daily es en inglés.'),
        },
        {
          any: ['bloque*'],
          why: both(
            'That\'s the Spanish spelling. In English it\'s "blocked" or "blocker": "I\'m blocked on…", "My blocker is…".',
            'Esa es la grafía en español. En inglés es "blocked" o "blocker": "I\'m blocked on…", "My blocker is…".',
          ),
        },
        {
          any: ['pending of'],
          why: both(
            '"Pending of" is a calque of "pendiente de". In English: "I\'m waiting for…" or "…is still pending".',
            '"Pending of" es un calco de "pendiente de". En inglés: "I\'m waiting for…" o "…is still pending".',
          ),
        },
      ],
      model: `Yesterday I finished the image-resizing Lambda and opened the PR.

Today I'm addressing the code review comments and adding tests for empty files.

I'm blocked on an IAM permission: I can't write to the staging bucket. Could someone from the platform team grant it?

Heads-up: I have a doctor's appointment tomorrow, so I'll be online from 11 a.m. CET.`,
    },

    // ---------- Lesson 3: deadlines and priorities ----------
    {
      id: 'deadlines-priorities',
      kind: 'read',
      title: both('Deadlines and priorities', 'Plazos y prioridades'),
      minutes: 7,
      body: join(
        both(
          `**Why first.** Dates and priorities are where a misunderstanding costs the most. If the client thinks "Friday" and the team thinks "next sprint", someone will be disappointed, and not because of the code.

**The words, in plain terms:**
- A **deadline** (*fecha límite*, *plazo*) is the date something must be done. An **ETA** ("estimated time of arrival", *fecha estimada* or *plazo estimado*) is when you expect it to be done. A deadline is a promise; an ETA is a forecast.
- **Priority** (*prioridad*; to **prioritize**, *priorizar*) is what goes first. Many teams use levels: **P0** means drop everything, **P1** means next, and so on.
- **Scope** (*alcance*) is what's included in a project or release. Picture a garden fence: what's inside gets done now; "out of scope" (*fuera del alcance*) waits outside.
- To **follow up** (*dar seguimiento*, *hacer seguimiento*) is to come back to something after a meeting or email; a **follow-up** is that message.
- A **heads-up** (*aviso*) is an early warning so nobody is surprised: "Heads-up: the deploy is at 5."
- A **stakeholder** (*parte interesada*) is anyone the project affects: the client, your manager, another team.
- The **product manager** (PM) decides what to build and why; the **product owner** (PO), a Scrum role, orders the backlog so the most valuable work comes first. In Spanish the PM is "gerente de producto" in Latin America and "responsable" or "jefe de producto" in Spain; with the team, just "el PM" and "el PO".
- **Ship it** (*publicarlo*, *lanzarlo*) means release it to users. With the team: "lo sacamos hoy", "lo subimos"; as slang, "¡a producción!".
- A **meeting** (*reunión*) can be a **call** (*llamada*) or a **sync**, a quick one to get aligned: "Let's sync after lunch" is "hablamos después de comer".

**Tip.** Write the date and time zone: "Friday, December 11, 5 p.m. CET". In an email to a Spanish-speaking client, write "fecha límite" or "plazo", not "deadline".`,
          `**Primero, el porqué.** Las fechas y las prioridades son donde un malentendido sale más caro. Si el cliente piensa "el viernes" y el equipo piensa "el próximo sprint", alguien se llevará una decepción, y no por el código.

**Las palabras, en limpio:**
- La **fecha límite** o el **plazo** (*deadline*) es la fecha en que algo tiene que estar hecho. El **ETA** ("estimated time of arrival", *fecha estimada* o *plazo estimado*) es cuándo esperas tenerlo. La fecha límite es una promesa; el ETA, una previsión.
- La **prioridad** (*priority*; **priorizar**, *prioritize*) es lo que va primero. Muchos equipos usan niveles: **P0** significa "deja todo lo demás y ponte con esto", **P1** es lo siguiente, y así sucesivamente.
- El **alcance** (*scope*) es lo que incluye un proyecto o una versión. Imagina la valla de un huerto: lo de dentro se hace ahora; lo "fuera del alcance" (*out of scope*), más adelante.
- **Dar seguimiento** o **hacer seguimiento** (*follow up*) es volver sobre algo después de una reunión o un correo; el **seguimiento** (*follow-up*) es ese mensaje.
- Un **aviso** (*heads-up*) es una advertencia temprana para evitar sorpresas: "Aviso: el despliegue es a las 5".
- Una **parte interesada** (*stakeholder*) es cualquier persona o grupo a quien le afecte el proyecto: el cliente, tu jefa, otro equipo.
- El **product manager** (PM) decide qué construir y por qué; el **product owner** (PO), un rol de Scrum, ordena el backlog para que primero se haga lo de más valor. En español, el PM es "gerente de producto" en Latinoamérica y "responsable" o "jefe de producto" en España; con el equipo, simplemente "el PM" y "el PO".
- **Ship it** (*publicarlo*, *lanzarlo*) es sacarlo a los usuarios. Con el equipo: "lo sacamos hoy", "lo subimos"; en jerga, "¡a producción!".
- Una **reunión** (*meeting*) puede ser una **llamada** (*call*) o un **sync**, una rápida para ponerse de acuerdo: "Let's sync after lunch" es "hablamos después de comer".

**Consejo.** Escribe la fecha y la zona horaria: "viernes 11 de diciembre, 17:00 CET". En un correo, mejor "fecha límite" que "deadline".`,
        ),
        termTable(DEADLINES),
        traps(DEADLINES),
        both(
          '**In short:** a deadline is a promise, an ETA a forecast, the scope says what\'s in, and a follow-up closes the loop. Write dates with their time zone.',
          '**En resumen:** la fecha límite es una promesa, el ETA una previsión, el alcance dice qué entra y el seguimiento deja el tema cerrado. Escribe las fechas con su zona horaria.',
        ),
      ),
    },
    {
      id: 'cards-deadlines',
      kind: 'cards',
      title: both('Flashcards: deadlines and priorities', 'Tarjetas: plazos y prioridades'),
      minutes: 8,
      body: both(
        'Ten terms in both directions. Watch the register: the word you say in a sync is often not the one you write to a client.',
        'Diez términos en las dos direcciones. Fíjate en el registro: la palabra que dices en un sync muchas veces no es la que escribes a un cliente.',
      ),
      cards: cardsFor(DEADLINES),
    },
    {
      id: 'follow-up-email-es',
      kind: 'rewrite',
      title: both('Write it: a follow-up email about a slipped deadline', 'Escríbelo: un correo de seguimiento por un retraso'),
      minutes: 9,
      body: both(
        'Laura is the stakeholder on the client side for the reporting feature. She writes in Spanish and expects a professional tone. Bad news lands better when it comes early, with a reason, a new date and a plan.',
        'Laura es la persona de contacto del cliente (su stakeholder) para la función de informes. Escribe en español y espera un tono profesional. Las malas noticias se reciben mejor cuando llegan pronto, con un motivo, una fecha nueva y un plan.',
      ),
      target: 'es',
      source: `Notes for the email to Laura (client stakeholder)

- Follow up on last week's meeting.
- The Dec 4 deadline for the export feature slips: the S3 bucket migration took longer than we estimated.
- New ETA: Dec 11.
- We prioritized CSV export. PDF export is out of scope for this release; it will eventually ship in January.
- Heads-up: we need her feedback on the designs by Monday to hit the new date.
- Apologize, and offer a short call.`,
      task: both(
        'Write the email to Laura in Spanish, in a polite, professional register. Follow up on the meeting, apologize for the delay and explain why, give the new date, say what was prioritized and what is out of scope, ask for her comments on the designs, and close politely.',
        'Escribe el correo a Laura en español, en un registro cortés y profesional. Haz el seguimiento de la reunión, discúlpate por el retraso y explica el motivo, da la nueva fecha, di qué se priorizó y qué queda fuera del alcance, pide sus comentarios sobre los diseños y despídete con cortesía.',
      ),
      minWords: 60,
      mustUse: [
        { any: ['seguimiento', 'retom*', 'continuacion', 'a raiz de', 'tras la reunion', 'despues de la reunion', 'en relacion con', 'con relacion a', 'en referencia a', 'con respecto a', 'acordam*', 'como hablamos', 'como comentamos'], label: 'seguimiento' },
        { any: ['reunion*', 'llamada*', 'videollamada*'], label: 'reunión' },
        { any: ['disculp*', 'lament*', 'sentimos', 'siento', 'perdon*'], label: 'una disculpa (lamentamos / disculpe)' },
        { any: ['fecha limite', 'fechas limite', 'plazo*', 'fecha de entrega', 'fechas de entrega', 'fecha prevista', 'fecha comprometida', 'fecha acordada', 'fecha estimada', 'nueva fecha', 'entrega prevista'], label: 'fecha límite / plazo' },
        { any: ['11', 'once'], label: 'la nueva fecha (11 de diciembre)' },
        { any: ['prioriz*', 'prioridad*', 'priorita*', 'centrad*', 'enfocad*'], label: 'priorizar' },
        { any: ['alcance', 'fuera de', 'no se incluir*', 'no incluir*', 'no entra*'], label: 'fuera del alcance' },
        { any: ['comentario*', 'opinion*', 'retroalimentacion', 'valoracion*', 'visto bueno', 'aprobacion', 'revision', 'observacion*', 'revis*', 'aprob*', 'apruebe*'], label: 'sus comentarios' },
        { any: ['saludo*', 'atentamente', 'gracias', 'agradec*', 'cordial*', 'atent*', 'disposicion'], label: 'una despedida cortés' },
      ],
      avoid: [
        {
          any: ['eventualment*'],
          why: both(
            '"Eventually" means "al final" or "más adelante"; "eventualmente" means "maybe, if it happens". Write "se publicará en enero" or "finalmente llegará en enero".',
            '"Eventually" significa "al final" o "más adelante"; "eventualmente" significa "quizás, si se da el caso". Escribe "se publicará en enero" o "finalmente llegará en enero".',
          ),
        },
        {
          any: ['deadline*'],
          why: both(
            '"Deadline" is team talk. In a client email, write "fecha límite" or "plazo".',
            '"Deadline" es lenguaje de equipo. En un correo a un cliente, escribe "fecha límite" o "plazo".',
          ),
        },
        {
          any: ['ETA'],
          why: both(
            '"ETA" is fine on Slack, but a client may not know it. Write "nueva fecha estimada" or "plazo estimado".',
            '"ETA" está bien en Slack, pero puede que el cliente no lo conozca. Escribe "nueva fecha estimada" o "plazo estimado".',
          ),
        },
        {
          any: ['feedback'],
          why: both(
            'In a formal email, "comentarios" or "retroalimentación" reads better than "feedback" (common usage).',
            'En un correo formal, "comentarios" o "retroalimentación" queda mejor que "feedback" (uso común).',
          ),
        },
        {
          any: ['scope'],
          why: both(
            '"Scope" is team talk. In a client email: "fuera del alcance de esta versión".',
            '"Scope" es lenguaje de equipo. En un correo a un cliente: "fuera del alcance de esta versión".',
          ),
        },
      ],
      model: `Asunto: Seguimiento de la reunión y nueva fecha para la exportación de informes

Estimada Laura:

Le escribimos para hacer el seguimiento de la reunión de la semana pasada. Lamentamos informarle de que no podremos cumplir la fecha límite del 4 de diciembre para la función de exportación: la migración del bucket de S3 nos llevó más tiempo del estimado.

La nueva fecha estimada de entrega es el 11 de diciembre. Hemos priorizado la exportación a CSV; la exportación a PDF queda fuera del alcance de esta versión y se publicará en enero.

Para cumplir este nuevo plazo, necesitaríamos sus comentarios sobre los diseños a más tardar el lunes. Si le resulta útil, podemos hacer una llamada breve esta semana.

Disculpe las molestias y gracias por su comprensión.

Un cordial saludo,
Equipo de desarrollo`,
    },

    // ---------- Lesson 4: remote work and false friends ----------
    {
      id: 'remote-false-friends',
      kind: 'read',
      title: both('Remote work, and eventually / actually', 'Trabajo remoto, y eventually / actually'),
      minutes: 7,
      body: join(
        both(
          `**Why first.** On a remote team you can't read the room. The words carry everything, and one false friend can flip a promise. "We'll eventually migrate the table" is a commitment in English; heard as "eventualmente migraremos la tabla", it sounds like "maybe, someday".

**The words, in plain terms:**
- **Remote work** (*teletrabajo*, *trabajo remoto*) is working away from the office. *Teletrabajo* is the formal word in Spain and Latin America alike; day to day you'll hear "en remoto" or "trabajo en remoto" in Spain, and "trabajo remoto" or "home office" in much of Latin America. A **time zone** is a *zona horaria*: write it next to every time ("5 p.m. CET, 10:00 in Mexico City").
- **Onboarding** (*incorporación*) is how a new person joins: accounts, access, the first tasks. With the team, everyone says "el onboarding".
- **Pair programming** (*programación en pareja*) is two people on one piece of code: one types, the other reviews and thinks ahead, and they swap. "Let's pair on it" is "hagamos pairing".

**The two false friends:**
- **Eventually** = *al final*, *con el tiempo*, *finalmente*. It's sure to happen, just later. Spanish *eventualmente* means "possibly, if it comes up".
- **Actually** = *en realidad*, *de hecho*. Spanish *actualmente* means "currently" or "right now". So "Actualmente usamos Lambda" is "We currently use Lambda", not "Actually, we use Lambda".

**In the cloud too.** DynamoDB reads are *eventually consistent* by default: right after a write, a read may return the old value, but given a moment every copy catches up. You'll hear "consistencia eventual", a widespread calque; "coherencia final" says the same thing more clearly. If you need the latest value, ask for a strongly consistent read (in Spanish, *lectura de coherencia fuerte*; on the team, "consistencia fuerte").`,
          `**Primero, el porqué.** En un equipo remoto no ves las caras ni el ambiente de la sala: todo depende de las palabras, y un solo falso amigo puede darle la vuelta a una promesa. "We'll eventually migrate the table" es un compromiso en inglés; entendido como "eventualmente migraremos la tabla", suena a "quizás, algún día".

**Las palabras, en limpio:**
- El **teletrabajo** o **trabajo remoto** (*remote work*) es trabajar fuera de la oficina. *Teletrabajo* es la palabra formal tanto en España como en Latinoamérica; en el día a día oirás "en remoto" o "trabajo en remoto" en España, y "trabajo remoto" o "home office" en buena parte de Latinoamérica. Una **zona horaria** es un *time zone*: escríbela junto a cada hora ("17:00 CET, 10:00 en Ciudad de México").
- La **incorporación** (*onboarding*) es cómo entra una persona nueva: cuentas, accesos, las primeras tareas. Con el equipo, todo el mundo dice "el onboarding".
- La **programación en pareja** (*pair programming*) es dos personas con el mismo código: una escribe, la otra revisa y piensa en lo siguiente, y se turnan. "Let's pair on it" es "hagamos pairing".

**Los dos falsos amigos:**
- **Eventually** = *al final*, *con el tiempo*, *finalmente*. Pasará seguro, más tarde. En español, *eventualmente* significa "posiblemente, si se da el caso".
- **Actually** = *en realidad*, *de hecho*. En español, *actualmente* significa "currently", "ahora". Así que "Actualmente usamos Lambda" es "We currently use Lambda", no "Actually, we use Lambda".

**También en la nube.** Las lecturas de DynamoDB son *eventually consistent* de forma predeterminada: justo después de una escritura, una lectura puede devolver el valor anterior, pero al poco todas las copias se ponen al día. Oirás "consistencia eventual", un calco muy extendido; "coherencia final" dice lo mismo con más claridad. Si necesitas el valor más reciente, pide una lectura de coherencia fuerte (en el equipo, "consistencia fuerte").`,
        ),
        termTable(REMOTE),
        traps(REMOTE),
        both(
          '**In short:** eventually = al final (it will happen), actually = en realidad. Eventualmente is "maybe", actualmente is "now". And always write the time zone.',
          '**En resumen:** eventually = al final (va a pasar), actually = en realidad. Eventualmente es "quizás", actualmente es "ahora". Y escribe siempre la zona horaria.',
        ),
      ),
    },
    {
      id: 'cards-remote',
      kind: 'cards',
      title: both('Flashcards: remote work and false friends', 'Tarjetas: trabajo remoto y falsos amigos'),
      minutes: 4,
      body: both(
        'Each term in both directions. For eventually / actually, make up a sentence about your own project before you flip.',
        'Cada término en las dos direcciones. Para eventually / actually, inventa una frase sobre tu propio proyecto antes de girar.',
      ),
      cards: cardsFor(REMOTE),
    },

    // ---------- Register ----------
    {
      id: 'register-teamwork',
      kind: 'register',
      title: both('Formal, team or slang?', '¿Formal, de equipo o jerga?'),
      minutes: 7,
      body: both(
        'Phrases from real Slack messages, client emails, docs and meetings, in both languages. Decide where each one fits best.',
        'Frases de mensajes de Slack, correos a clientes, documentación y reuniones reales, en los dos idiomas. Decide dónde encaja mejor cada una.',
      ),
      items: [
        {
          text: 'Le informamos de que la fecha límite de la entrega se traslada al 11 de diciembre.',
          context: both('Email to a client', 'Correo a un cliente'),
          answer: 'formal',
          explain: both(
            '"Fecha límite" is the formal deadline, and "Le informamos de que…" is classic business-email Spanish. With the team you\'d say "el deadline se mueve al 11".',
            '"Fecha límite" es el deadline formal, y "Le informamos de que…" es español clásico de correo de empresa. Con el equipo dirías "el deadline se mueve al 11".',
          ),
        },
        {
          text: '¿Alguien puede hacer code review de mi PR antes de la planning?',
          context: both('Slack, team channel', 'Slack, canal del equipo'),
          answer: 'team',
          explain: both(
            '"Code review", "PR" and "la planning" are the words the team uses every day. In a document: "revisión de código" and "planificación del sprint".',
            '"Code review", "PR" y "la planning" son las palabras que el equipo usa a diario. En un documento: "revisión de código" y "planificación del sprint".',
          ),
        },
        {
          text: 'Tests en verde, ¡pa\' producción! 🚀',
          context: both('Slack, after a merge', 'Slack, después de un merge'),
          answer: 'slang',
          explain: both(
            '"¡Pa\' producción!" is the slang "ship it", and the rocket says the rest. Formal: "se publicará la versión"; with the team: "lo sacamos hoy".',
            '"¡Pa\' producción!" es el "ship it" en jerga, y el cohete dice el resto. Formal: "se publicará la versión"; con el equipo: "lo sacamos hoy".',
          ),
        },
        {
          text: 'Please find attached the revised timeline. The mobile app remains out of scope for the first release.',
          context: both('Email to a client', 'Correo a un cliente'),
          answer: 'formal',
          explain: both(
            '"Please find attached", "revised timeline" and "remains out of scope" are formal English. In Spanish: "Adjuntamos el calendario (o cronograma) revisado. La app móvil sigue fuera del alcance de la primera versión."',
            '"Please find attached", "revised timeline" y "remains out of scope" son inglés formal. En español: "Adjuntamos el calendario (o cronograma) revisado. La app móvil sigue fuera del alcance de la primera versión."',
          ),
        },
        {
          text: "Heads-up: I'll be 10 minutes late to stand-up. My update is in the thread.",
          context: both('Slack, team channel', 'Slack, canal del equipo'),
          answer: 'team',
          explain: both(
            '"Heads-up" and "stand-up" are everyday team words, friendly but clear. In Spanish with the team: "Aviso: llego 10 minutos tarde a la daily."',
            '"Heads-up" y "stand-up" son palabras de equipo de todos los días, cercanas pero claras. En español con el equipo: "Aviso: llego 10 minutos tarde a la daily."',
          ),
        },
        {
          text: 'lol this PR is all nits. LGTM 🚢',
          context: both('A PR approval comment', 'Comentario de aprobación en una PR'),
          answer: 'slang',
          explain: both(
            '"LGTM" alone is fine with the team, but "lol" and the ship emoji make it pure slang. A formal approval would just say "Aprobado" / "Approved".',
            '"LGTM" a secas está bien con el equipo, pero "lol" y el emoji del barco lo vuelven jerga pura. Una aprobación formal diría "Aprobado" / "Approved".',
          ),
        },
        {
          text: 'La responsable de producto ha priorizado la corrección del fallo en los pagos para este sprint.',
          context: both('Sprint report', 'Informe del sprint'),
          answer: 'formal',
          explain: both(
            '"Responsable de producto" and "priorizar" are the formal forms. "Responsable de producto" can mean the product owner or, in Spain, the product manager, so in a document add the English role the first time: "responsable de producto (product owner)". With the team: "la PO dice que el bug de pagos es P0".',
            '"Responsable de producto" y "priorizar" son las formas formales. "Responsable de producto" puede ser el product owner o, en España, el product manager: en un documento, añade el rol en inglés la primera vez: "responsable de producto (product owner)". Con el equipo: "la PO dice que el bug de pagos es P0".',
          ),
        },
        {
          text: 'Le doy seguimiento mañana y te paso el ETA.',
          context: both('Slack, reply to a teammate', 'Slack, respuesta a un compañero'),
          answer: 'team',
          explain: both(
            '"Darle seguimiento" and "el ETA" are what you hear with the team. In a client email: "Mañana haremos el seguimiento y le confirmaremos la fecha estimada." The "le" is the task ("darle seguimiento a algo"), very common in Mexico and much of Latin America, not "usted".',
            '"Darle seguimiento" y "el ETA" es lo que se oye con el equipo. En un correo a un cliente: "Mañana haremos el seguimiento y le confirmaremos la fecha estimada." El "le" se refiere a la tarea ("darle seguimiento a algo"), muy común en México y buena parte de Latinoamérica; no es "usted".',
          ),
        },
        {
          text: 'IAM me tiene frito 😩 ¿una call rapidita?',
          context: both('Slack, direct message', 'Slack, mensaje directo'),
          answer: 'slang',
          explain: both(
            '"Me tiene frito" ("it\'s driving me nuts"), the Spanglish "una call" and the emoji make it slang. With the team: "tengo un bloqueo con el permiso de IAM, ¿hacemos una llamada?"; in a report: "impedimento con el permiso de IAM".',
            '"Me tiene frito", el spanglish "una call" y el emoji lo vuelven jerga. Con el equipo: "tengo un bloqueo con el permiso de IAM, ¿hacemos una llamada?"; en un informe: "impedimento con el permiso de IAM".',
          ),
        },
        {
          text: 'Durante la incorporación, cada persona nueva hará programación en pareja con un miembro del equipo.',
          context: both('Onboarding guide', 'Guía de incorporación'),
          answer: 'formal',
          explain: both(
            '"Incorporación" and "programación en pareja" are the formal forms. With the team: "en el onboarding haces pairing con alguien".',
            '"Incorporación" y "programación en pareja" son las formas formales. Con el equipo: "en el onboarding haces pairing con alguien".',
          ),
        },
      ],
    },

    // ---------- Final check ----------
    {
      id: 'quiz-teamwork',
      kind: 'quiz',
      title: both('Check: teamwork and meetings', 'Comprueba: trabajo en equipo y reuniones'),
      minutes: 6,
      questions: [
        {
          q: both(
            'In planning, a teammate asks "¿Cuánto le pones a esta historia?". What does she want?',
            'En la planning, una compañera pregunta "¿Cuánto le pones a esta historia?". ¿Qué quiere?',
          ),
          options: [
            both('Your estimate, in story points', 'Tu estimación, en puntos de historia'),
            both('The hours you worked on it yesterday', 'Las horas que le dedicaste ayer'),
            both('Its priority: P0 or P1', 'Su prioridad: P0 o P1'),
            both('The date of the next retro', 'La fecha de la próxima retro'),
          ],
          answer: 0,
          explain: both(
            '"¿Cuánto le pones?" asks for your estimate. Story points size work relative to other stories, not in hours.',
            '"¿Cuánto le pones?" pide tu estimación. Los puntos de historia miden el trabajo comparado con otras historias, no en horas.',
          ),
        },
        {
          q: both(
            'In a meeting, your tech lead says: "We\'ll eventually move this table to DynamoDB." What does she mean?',
            'En una reunión, tu tech lead dice: "We\'ll eventually move this table to DynamoDB." ¿Qué quiere decir?',
          ),
          options: [
            both('Maybe, if it ever comes up, we\'ll move it', 'Quizás la movamos, si se da el caso'),
            both('We\'re moving it right now', 'La estamos moviendo ahora mismo'),
            both('We will move it, just later on', 'La vamos a mover, solo que más adelante'),
            both('We moved it a while ago', 'La movimos hace tiempo'),
          ],
          answer: 2,
          explain: both(
            '"Eventually" means "al final", "con el tiempo": it will happen, later. Spanish "eventualmente" means "possibly", which is why the sentence gets misheard.',
            '"Eventually" significa "al final", "con el tiempo": va a pasar, más adelante. En español, "eventualmente" significa "posiblemente", y por eso la frase se entiende mal.',
          ),
        },
        {
          q: both(
            'A teammate wants to say "Actualmente usamos Lambda para las miniaturas" in English. Which is right?',
            'Un compañero quiere decir "Actualmente usamos Lambda para las miniaturas" en inglés. ¿Cuál es correcta?',
          ),
          options: [
            'Actually, we use Lambda for thumbnails.',
            'We currently use Lambda for thumbnails.',
            'Eventually, we use Lambda for thumbnails.',
            'We actually used Lambda for thumbnails.',
          ],
          answer: 1,
          explain: both(
            '"Actualmente" is "currently" or "right now". "Actually" means "en realidad" and would change the meaning: it sounds like you are correcting someone.',
            '"Actualmente" es "currently" o "right now". "Actually" significa "en realidad" y cambiaría el sentido: suena a que estás corrigiendo a alguien.',
          ),
        },
        {
          q: both(
            'A review comment starts with "nit:". What is the reviewer telling you?',
            'Un comentario de revisión empieza con "nit:". ¿Qué te está diciendo quien revisa?',
          ),
          options: [
            both('It\'s a small detail: fix it if you like, it doesn\'t block the merge', 'Es un detalle menor: arréglalo si quieres, no bloquea el merge'),
            both('It\'s a blocker: the PR can\'t be merged until you fix it', 'Es un bloqueo: la PR no se puede fusionar hasta que lo arregles'),
            both('The PR is approved and can be merged', 'La PR está aprobada y se puede fusionar'),
            both('The reviewer needs a meeting to discuss it', 'Quien revisa necesita una reunión para hablarlo'),
          ],
          answer: 0,
          explain: both(
            'A nit (from "nitpick") is a minor point, like a name or a typo. A blocker must be fixed before merging, and LGTM is the approval.',
            'Un nit (de "nitpick") es un detalle menor, como un nombre o una errata. Un bloqueo hay que resolverlo antes del merge, y LGTM es la aprobación.',
          ),
        },
        {
          q: both(
            'You\'re writing a formal email to a client in Spanish. Which phrase fits best?',
            'Escribes un correo formal a un cliente en español. ¿Qué frase encaja mejor?',
          ),
          options: [
            'El deadline se mueve al viernes.',
            'La fecha límite se traslada al viernes.',
            'El ETA es el viernes, ¡a producción!',
            'Eventualmente lo entregamos el viernes.',
          ],
          answer: 1,
          explain: both(
            '"Fecha límite" (or "plazo") is the formal deadline. "Deadline" and "ETA" are team words, "¡a producción!" is slang, and "eventualmente" would tell the client it might not happen at all.',
            '"Fecha límite" (o "plazo") es el deadline formal. "Deadline" y "ETA" son palabras de equipo, "¡a producción!" es jerga, y "eventualmente" le diría al cliente que quizás no llegue nunca.',
          ),
        },
        {
          q: both(
            'What\'s the difference between a deadline and an ETA?',
            '¿Qué diferencia hay entre un deadline y un ETA?',
          ),
          options: [
            both('None: they\'re two names for the same date', 'Ninguna: son dos nombres para la misma fecha'),
            both('The deadline is set by the team, the ETA by the client', 'El deadline lo pone el equipo; el ETA, el cliente'),
            both('An ETA is only used for deploys', 'El ETA solo se usa para despliegues'),
            both('The deadline is when it must be done; the ETA is when you expect it to be done', 'El deadline es cuándo tiene que estar hecho; el ETA, cuándo esperas tenerlo'),
          ],
          answer: 3,
          explain: both(
            'A deadline is a commitment ("fecha límite", "plazo"); an ETA ("estimated time of arrival") is a forecast ("plazo estimado"). When the ETA moves past the deadline, it\'s time for a follow-up email.',
            'El deadline es un compromiso ("fecha límite", "plazo"); el ETA ("estimated time of arrival") es una previsión ("plazo estimado"). Cuando el ETA cae después del deadline, toca un correo de seguimiento.',
          ),
        },
        {
          q: both(
            'A colleague in Madrid and one in Mexico City are writing the job title "product manager" in Spanish. What will you most often see?',
            'Una compañera en Madrid y otra en Ciudad de México escriben el puesto "product manager" en español. ¿Qué verás con más frecuencia?',
          ),
          options: [
            both('"Gerente de producto" in both places', '"Gerente de producto" en los dos sitios'),
            both('"Responsable" or "jefe de producto" in Spain; "gerente de producto" in Latin America', '"Responsable" o "jefe de producto" en España; "gerente de producto" en Latinoamérica'),
            both('"Director de producto" everywhere: it\'s the only correct form', '"Director de producto" en todas partes: es la única forma correcta'),
            both('Nobody translates it: "PM" is the only option', 'Nadie lo traduce: "PM" es la única opción'),
          ],
          answer: 1,
          explain: both(
            '"Gerente" sounds more Latin American; in Spain "responsable" or "jefe de producto" is more common. That\'s common usage, not a rule, and with the team almost everyone just says "el PM" or "el PO".',
            '"Gerente" suena más latinoamericano; en España es más habitual "responsable" o "jefe de producto". Es uso común, no una norma, y con el equipo casi todo el mundo dice "el PM" o "el PO".',
          ),
        },
        {
          q: both(
            'DynamoDB reads are "eventually consistent" by default. What does that mean?',
            'Las lecturas de DynamoDB son "eventually consistent" de forma predeterminada. ¿Qué significa?',
          ),
          options: [
            both('Reads are consistent only some of the time, at random', 'Las lecturas son coherentes solo a veces, al azar'),
            both('A read right after a write may return the old value, but all copies catch up shortly', 'Una lectura justo después de una escritura puede devolver el valor anterior, pero todas las copias se ponen al día enseguida'),
            both('Writes are saved only at the end of the day', 'Las escrituras se guardan solo al final del día'),
            both('You can never read the latest value', 'Nunca puedes leer el valor más reciente'),
          ],
          answer: 1,
          explain: both(
            'Here "eventually" means "in the end": every copy converges. If you need the latest value right away, you can request a strongly consistent read. In Spanish you\'ll hear "consistencia eventual"; "coherencia final" is clearer (and its opposite is "coherencia fuerte").',
            'Aquí "eventually" significa "al final": todas las copias acaban coincidiendo. Si necesitas el valor más reciente al instante, puedes pedir una lectura de coherencia fuerte. En español oirás "consistencia eventual"; "coherencia final" es más claro (y su opuesta, "coherencia fuerte").',
          ),
        },
        {
          q: both(
            'At the stand-up, what does "I\'m blocked on the IAM permission" ask the team for?',
            'En la daily, ¿qué le pide al equipo la frase "I\'m blocked on the IAM permission"?',
          ),
          options: [
            both('Nothing: it\'s just a status update', 'Nada: es solo una actualización de estado'),
            both('To approve the PR with LGTM', 'Que aprueben la PR con LGTM'),
            both('Help: you can\'t move on until someone grants that permission', 'Ayuda: no puedes avanzar hasta que alguien te dé ese permiso'),
            both('To postpone the retro', 'Que pospongan la retro'),
          ],
          answer: 2,
          explain: both(
            'A blocker ("bloqueo", formally "impedimento") is something that stops your work. Saying it at the stand-up is how you ask for help; name who can unblock you so it gets solved after the meeting.',
            'Un bloqueo (formalmente "impedimento") es algo que frena tu trabajo. Decirlo en la daily es la forma de pedir ayuda; nombra a quién puede desbloquearte para que se resuelva después de la reunión.',
          ),
        },
      ],
    },
  ],
};

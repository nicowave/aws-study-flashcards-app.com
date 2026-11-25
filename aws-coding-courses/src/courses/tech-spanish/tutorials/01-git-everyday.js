// Module 1: Git and everyday development (free).
// Lessons: from commit to pull request; bugs, fixes and rollbacks; releases and
// pending work. Translations come from the glossary (termTable, traps, cardsFor);
// tool names (GitHub, VS Code, Git) are backed by content/tech-spanish/sources.mjs.
import { both, join } from '../../../engine/i18n';
import { termTable, traps, cardsFor } from '../glossary';

const GIT = ['commit', 'branch', 'merge', 'push', 'pull', 'pull-request', 'fork', 'clone', 'repository'];
const BUGS = ['bug', 'debug', 'fix', 'patch', 'revert', 'rollback', 'workaround', 'edge-case'];
const WORK = ['deploy', 'build', 'release', 'backlog', 'sprint', 'feature', 'requirement', 'issue', 'roadmap', 'mvp', 'prototype', 'legacy', 'tech-debt', 'refactor'];

export default {
  slug: 'git-everyday',
  number: 1,
  free: true,
  title: both('Git and everyday development', 'Git y el día a día del desarrollo'),
  situation: both(
    "It's your first week on a team that builds a study app on AWS. Half the team writes in English, half in Spanish. This morning you open a pull request for a Lambda fix, and the Madrid team asks for the description in Spanish. This afternoon a deploy goes wrong, the team rolls it back, and someone has to tell the English-speaking channel what happened. That someone is you.",
    'Es tu primera semana en un equipo que construye una app de estudio en AWS. La mitad del equipo escribe en inglés y la otra mitad en español. Esta mañana abres una pull request con un arreglo para una Lambda, y el equipo de Madrid pide la descripción en español. Por la tarde un despliegue sale mal, el equipo hace rollback y alguien tiene que contarle al canal en inglés qué pasó. Ese alguien eres tú.',
  ),
  overview: both(
    "Git and the daily work of a dev team are where tech Spanish borrows the most English: commit, push, merge, PR, deploy, rollback. In this module you learn each word in three registers (formal document, with the team, slang), what GitHub, VS Code and Git's own Spanish translation call it, and where Spain and Latin America differ. Then you put it to work: a commit message in English, a Spanish PR description from an English one, and an English Slack update about a bug and its rollback.",
    'Es en Git y en el trabajo diario de un equipo de desarrollo donde el español técnico toma más préstamos del inglés: commit, push, merge, PR, deploy, rollback. En este módulo aprendes cada palabra en tres registros (documento formal, con el equipo, jerga), cómo la llaman GitHub, VS Code y la traducción de Git al español, y en qué se diferencian España y Latinoamérica. Después lo pones en práctica: un mensaje de commit en inglés, la descripción de una PR en español a partir de una en inglés, y un aviso en Slack, en inglés, sobre un bug y su rollback.',
  ),
  level: both('Beginner', 'Principiante'),
  hours: 1,
  skills: ['commit', 'pull request', 'merge', 'rollback', 'release', 'backlog'],
  steps: [
    // ---------- Lesson 1: from commit to pull request ----------
    {
      id: 'commit-to-pr',
      kind: 'read',
      title: both('From commit to pull request', 'Del commit a la pull request'),
      minutes: 6,
      body: join(
        both(
          `**Why first.** Your work on shared code only counts once others can see it, review it and merge it. On a bilingual team you hear every step of that journey twice: the English word, and a Spanish one that changes with the tool.

**The words, in plain terms:**
- A **repository** (*repositorio*, "el repo") is the project folder plus its whole history. You **clone** it (*clonar*) to get your own local copy.
- A **branch** (*rama*) is a separate line of work. Think of a draft copy of a shared document: you can scribble on it without touching the final version.
- A **commit** (*confirmación*) is one saved snapshot of your changes, with a message that says what changed and why.
- **Push** sends your commits to the remote repository (the shared copy, for example on GitHub); **pull** brings the remote's new commits into your copy.
- A **pull request**, or PR (*solicitud de cambios*), asks the team to review your branch and **merge** it (*fusionar*) into \`main\`, the shared branch everyone ships from.
- A **fork** (*bifurcación*) is your own copy, on GitHub, of someone else's repository, to propose changes to a project you can't write to.

**Which Spanish word?** There isn't just one: it depends on the tool. GitHub's Spanish glossary (2022 version) used *subir* (push), *fusionar* (merge), *confirmación* (commit), *solicitud de cambios* (pull request) and *bifurcación* (fork). VS Code's Spanish menus say *Insertar* (push), *Combinar* (merge), *Incorporar cambios* (pull) and keep *Commit*. Git's own Spanish translation mixes: it says *empujar* (push) and often *fusionar* (merge), but keeps *commit* and *pull* in phrases like *hacer commit* and *hacer pull*. With the team, most people say *hacer commit*, *pushear*, *mergear* and *la PR* (or *el PR*: the gender varies by team).`,
          `**Primero, el porqué.** Tu trabajo en un código compartido solo cuenta cuando los demás pueden verlo, revisarlo e incorporarlo. En un equipo bilingüe oyes cada paso dos veces: la palabra en inglés y una en español que cambia según la herramienta.

**Qué significa cada palabra:**
- Un **repositorio** (*repository*, "el repo") es la carpeta del proyecto con todo su historial. Lo **clonas** (*clone*) para tener tu copia local.
- Una **rama** (*branch*) es una línea de trabajo aparte. Piensa en el borrador de un documento compartido: escribes encima sin tocar la versión final.
- Un **commit** (*confirmación*) es una foto guardada de tus cambios, con un mensaje que dice qué y por qué.
- **Push** envía tus commits al repositorio remoto (la copia compartida, por ejemplo en GitHub); **pull** trae a tu copia los commits nuevos del remoto.
- Una **pull request** o PR (*solicitud de cambios*) pide al equipo que revise tu rama y la **fusione** (*merge*) con \`main\`, la rama compartida de la que sale todo.
- Un **fork** (*bifurcación*) es tu copia, en GitHub, del repositorio de otra persona, para proponer cambios en un proyecto donde no puedes escribir.

**¿Qué palabra en español?** No hay una sola: depende de la herramienta. El glosario en español de GitHub (versión de 2022) usaba *subir* (push), *fusionar* (merge), *confirmación* (commit), *solicitud de cambios* (pull request) y *bifurcación* (fork). Los menús de VS Code en español dicen *Insertar* (push), *Combinar* (merge), *Incorporar cambios* (pull) y dejan *Commit*. La traducción de Git al español mezcla: dice *empujar* (push) y a menudo *fusionar* (merge), pero deja *commit* y *pull* en frases como *hacer commit* y *hacer pull*. Con el equipo, casi todos dicen *hacer commit*, *pushear*, *mergear* y *la PR* (o *el PR*: el género cambia según el equipo).`,
        ),
        termTable(GIT),
        traps(GIT),
        both(
          '**In short:** commit saves, push sends, pull brings changes down, a PR asks for review, merge joins the branch to `main`. In Spanish, pick one form per text.',
          '**En resumen:** el commit guarda, el push envía, el pull trae cambios, la PR pide revisión y el merge une la rama con `main`. En español, elige una forma por texto.',
        ),
      ),
    },
    {
      id: 'cards-git',
      kind: 'cards',
      title: both('Flashcards: Git, from commit to PR', 'Tarjetas: Git, del commit a la PR'),
      minutes: 7,
      body: both(
        'Each term in both directions. Say the formal form and the team form out loud before you flip.',
        'Cada término en las dos direcciones. Di en voz alta la forma formal y la forma de equipo antes de girar la tarjeta.',
      ),
      cards: cardsFor(GIT),
    },
    {
      id: 'commit-message-en',
      kind: 'rewrite',
      title: both('Write it: a commit message in English', 'Escríbelo: un mensaje de commit en inglés'),
      minutes: 4,
      body: both(
        'Your notes for the commit are in Spanish, but this repository\'s history is in English. The usual convention: a short subject line in the imperative ("Fix…", "Add…", not "Fixed…"), a blank line, then one line that says what changed and why.',
        'Tus notas para el commit están en español, pero el historial de este repositorio está en inglés. La convención habitual: una primera línea corta en imperativo ("Fix…", "Add…", no "Fixed…"), una línea en blanco y otra que diga qué cambió y por qué.',
      ),
      target: 'en',
      source: `Corrige el tiempo de espera de la Lambda de miniaturas

Aumenta el tiempo de espera a 30 s y añade una prueba para archivos vacíos.`,
      task: both(
        'Write this commit message in English: an imperative subject line, a blank line, and one body line with the new timeout and the test.',
        'Escribe este mensaje de commit en inglés: una primera línea en imperativo, una línea en blanco y una línea de cuerpo con el nuevo tiempo de espera (timeout) y la prueba.',
      ),
      minWords: 6,
      mustUse: [
        { any: ['fix*', 'raise*', 'increase*', 'bump*'], label: 'fix / raise' },
        { any: ['timeout*', 'time out', 'time-out'], label: 'timeout' },
        { any: ['test*'], label: 'test' },
      ],
      avoid: [
        {
          any: ['el', 'la', 'los', 'las', 'de', 'y', 'una', 'que', 'para', 'prueba*'],
          why: both(
            'Write the commit message in English: the repository\'s history is in English.',
            'Escribe el mensaje de commit en inglés: el historial del repositorio está en inglés.',
          ),
        },
        {
          any: ['fixed', 'raised', 'increased', 'bumped', 'added'],
          why: both(
            'Commit messages use the imperative: "Fix…", "Raise…", "Add…", as if finishing the sentence "This commit will…".',
            'Los mensajes de commit van en imperativo: "Fix…", "Raise…", "Add…", como si completaran la frase "This commit will…".',
          ),
        },
      ],
      model: `Fix thumbnail Lambda timeout

Raise the timeout to 30 s and add a test for empty files.`,
    },
    {
      id: 'pr-description-es',
      kind: 'rewrite',
      title: both('Write it: a PR description in Spanish', 'Escríbelo: la descripción de una PR en español'),
      minutes: 8,
      body: both(
        "The Madrid team reviews PRs in Spanish. A PR description stays in the repository's history, so write it like a short document: clear and professional, but it's fine to keep words the team really uses (PR, merge, staging).",
        'El equipo de Madrid revisa las PR en español. La descripción de una PR se queda en el historial del repositorio, así que escríbela como un documento breve: clara y profesional, aunque puedes dejar palabras que el equipo usa de verdad (PR, merge, staging).',
      ),
      target: 'es',
      source: `Fix timeout in the thumbnail Lambda

This PR fixes a bug: images over 10 MB failed because the function still had Lambda's default 3-second timeout.

Changes:
- Raise the timeout to 30 seconds and the memory to 1,024 MB (more memory also gives the function more CPU).
- Add a test for an edge case: an empty file in the bucket.

How to test: pull this branch, run npm test and deploy to staging.

Once it's approved, I'll merge it into main. It ships in Thursday's release.`,
      task: both(
        "Write this PR description in Spanish. Keep the same parts: title, what bug it fixes, the changes, how to test it, and what happens after approval (merge and release). Mention the edge case and the branch.",
        'Escribe esta descripción de PR en español. Mantén las mismas partes: título, qué error corrige, los cambios, cómo probarlo y qué pasa cuando se apruebe (merge y versión). Menciona el caso límite y la rama.',
      ),
      minWords: 40,
      mustUse: [
        { any: ['PR', 'PRs', 'pull request*', 'solicitud de cambios', 'solicitudes de cambios', 'solicitud de extraccion', 'esta solicitud', 'este cambio', 'estos cambios'], label: 'PR / solicitud de cambios' },
        { any: ['error*', 'fallo*', 'falla*', 'problema*', 'defecto*', 'bug*'], label: 'error / fallo / bug' },
        { any: ['corrig*', 'correccion*', 'corrij*', 'arregl*', 'soluciona*', 'resuelv*', 'resolv*', 'fixea*'], label: 'corrige / arregla' },
        { any: ['caso limite', 'casos limite', 'caso extremo', 'casos extremos', 'caso borde', 'casos borde', 'edge case*'], label: 'caso límite' },
        { any: ['rama*', 'branch*'], label: 'rama' },
        { any: ['probar*', 'pruebal*', 'prueba*', 'comprob*', 'verific*', 'test', 'tests', 'testea*', 'testeo*'], label: 'probar / prueba' },
        { any: ['despleg*', 'desplieg*', 'implement*', 'deploy*'], label: 'desplegar / implementar' },
        { any: ['fusion*', 'combin*', 'merge*', 'integr*', 'incorpor*'], label: 'fusionar / hacer merge' },
        { any: ['version*', 'lanzamiento*', 'release*', 'entrega*', 'publica*'], label: 'versión / release' },
      ],
      avoid: [
        {
          any: ['the', 'this', 'and', 'with', 'once', 'we'],
          why: both(
            'Write it in Spanish: the Madrid team reviews in Spanish.',
            'Escríbela en español: el equipo de Madrid revisa en español.',
          ),
        },
        {
          any: ['empuj*'],
          why: both(
            '"Empujar" is a literal translation of "push" that sounds odd in Git writing. Write "subir" (GitHub\'s 2022 glossary), or "hacer push" / "pushear" with the team.',
            '"Empujar" es una traducción literal de "push" que suena rara al escribir sobre Git. Escribe "subir" (glosario de GitHub de 2022), o "hacer push" / "pushear" con el equipo.',
          ),
        },
        {
          any: ['jalar', 'jala', 'tirar de', 'tira de'],
          why: both(
            '"Jalar" / "tirar de" are literal translations of "pull". You may hear "jalar los cambios" in casual talk in Mexico, but in a written PR write "haz pull", "bájate la rama" or "incorporar cambios" (VS Code).',
            '"Jalar" / "tirar de" son traducciones literales de "pull". En México puedes oír "jalar los cambios" en una charla informal, pero en una PR escrita pon "haz pull", "bájate la rama" o "incorporar cambios" (VS Code).',
          ),
        },
      ],
      model: `Corrige el tiempo de espera de la Lambda de miniaturas

Esta PR corrige un error: las imágenes de más de 10 MB fallaban porque la función seguía con el tiempo de espera predeterminado de Lambda, 3 segundos.

Cambios:
- Aumenta el tiempo de espera a 30 segundos y la memoria a 1024 MB (con más memoria, la función también tiene más CPU).
- Añade una prueba para un caso límite: un archivo vacío en el bucket.

Cómo probarlo: haz pull de esta rama, ejecuta npm test y despliega en staging.

Cuando esté aprobada, la fusionaré con main. Sale en la versión del jueves.`,
    },

    // ---------- Lesson 2: bugs, fixes and rollbacks ----------
    {
      id: 'bugs-and-rollbacks',
      kind: 'read',
      title: both('Bugs, fixes and rollbacks', 'Bugs, fixes y rollbacks'),
      minutes: 6,
      body: join(
        both(
          `**Why first.** Something broke in production. The team needs three answers fast: what broke, how you stopped the damage, and how it will really be fixed. Mix up *revert* and *rollback*, or call a workaround a fix, and people make the wrong call.

- A **bug** is a defect: the code does something it shouldn't. In a Spanish document, write *error* or *fallo*; with the team, everyone says *bug*.
- To **debug** (*depurar*; with the team, *debuggear*) is to hunt down the cause: logs, a breakpoint (a line where the code pauses so you can look inside), a test that reproduces it.
- A **fix** (*corrección*, *arreglo*) solves the cause. A **hotfix** is an urgent fix that goes to production outside the normal release cycle.
- A **patch** (*parche*) is a small change on top of an existing version, often for security.
- To **revert** (*revertir*) is a Git action: a new commit that undoes an earlier one. The mistake stays in the history next to its cancellation, like a correction printed in the next day's newspaper.
- A **rollback** (*volver a la versión anterior*; with the team, *hacer rollback*) puts the previous version back in front of users. On AWS that can mean pointing a Lambda alias back at the previous version, or configuring CodeDeploy to roll back automatically when a deployment fails.
- A **workaround** (*solución provisional*) avoids the problem without fixing it: a detour while the road is being repaired.
- An **edge case** (*caso límite*) is an unusual input at the edges: an empty file, a card with no ZIP code, the 1,001st object when S3 lists 1,000 per page.

The usual story: bug, rollback, debug, then a fix with a test for the edge case.`,
          `**Primero, el porqué.** Algo se rompió en producción. El equipo necesita tres respuestas rápidas: qué se rompió, cómo frenaste el daño y cómo se arreglará de verdad. Si confundes *revert* con *rollback*, o llamas fix a una solución provisional, la gente toma decisiones equivocadas.

- Un **bug** es un defecto: el código hace algo que no debe. En un documento en español, escribe *error* o *fallo*; con el equipo, todo el mundo dice *bug*.
- **Depurar** (*debug*; con el equipo, *debuggear*) es buscar la causa: logs, un punto de interrupción (una línea donde el código se detiene para que mires dentro), una prueba que lo reproduzca.
- Un **fix** (*corrección*, *arreglo*) resuelve la causa. Un **hotfix** es una corrección urgente que llega a producción fuera del ciclo normal de versiones.
- Un **parche** (*patch*) es un cambio pequeño sobre una versión existente, muchas veces por seguridad.
- **Revertir** (*revert*) es una acción de Git: un commit nuevo que deshace otro anterior. El error queda en el historial junto a su anulación, como la fe de erratas del periódico.
- Un **rollback** (*volver a la versión anterior*; con el equipo, *hacer rollback*) vuelve a poner la versión anterior delante de los usuarios. En AWS puede ser apuntar de nuevo un alias de Lambda a la versión anterior, o configurar CodeDeploy para que revierta automáticamente si falla una implementación.
- Una **solución provisional** (*workaround*) evita el problema sin arreglarlo: un desvío mientras reparan la carretera.
- Un **caso límite** (*edge case*) es una entrada poco habitual, en los bordes: un archivo vacío, una tarjeta sin código postal, el objeto 1001 cuando S3 lista de 1000 en 1000.

La historia habitual: bug, rollback, depuración y, al final, un fix con una prueba para el caso límite.`,
        ),
        termTable(BUGS),
        traps(BUGS),
        both(
          '**In short:** a rollback stops the damage, a fix solves the cause, a revert undoes a commit, and a workaround only goes around the problem. Say which one you did.',
          '**En resumen:** el rollback frena el daño, el fix resuelve la causa, el revert deshace un commit y la solución provisional solo rodea el problema. Di cuál hiciste.',
        ),
      ),
    },
    {
      id: 'cards-bugs',
      kind: 'cards',
      title: both('Flashcards: bugs, fixes and rollbacks', 'Tarjetas: bugs, fixes y rollbacks'),
      minutes: 6,
      body: both(
        'Pay attention to the formal form: it is what goes in an incident report or a client email.',
        'Fíjate en la forma formal: es la que va en un informe de incidente o en un correo a un cliente.',
      ),
      cards: cardsFor(BUGS),
    },
    {
      id: 'bug-update-en',
      kind: 'rewrite',
      title: both('Write it: a Slack update about a rollback', 'Escríbelo: un aviso en Slack sobre un rollback'),
      minutes: 8,
      body: both(
        'Your notes from the afternoon are in Spanish. The #releases channel is in English, and people are waiting for news.',
        'Tus notas de la tarde están en español. El canal #releases es en inglés y la gente espera noticias.',
      ),
      target: 'en',
      source: `Notas del incidente (para avisar en #releases):
- 15:40: desplegamos la versión 3.2 de la API de pagos.
- 15:55: suben los errores 5xx. Un bug en la validación rechaza las tarjetas sin código postal (un caso límite que las pruebas no cubrían).
- 16:05: hicimos rollback a la 3.1 (el alias de Lambda vuelve a apuntar a la versión anterior). Los errores bajan a cero.
- Ahora: Ana está depurando el fallo. El fix va en una PR nueva, con una prueba para ese caso.
- Mientras tanto: nada de merges a main hasta que esté el fix.`,
      task: both(
        'Write the update for the team channel in English, in a team register: what was deployed, what broke and why (it was an edge case), what you did (the rollback), who is debugging it, and what comes next (the fix in a new PR, no merges to main until then). Short sentences are fine.',
        'Escribe el aviso para el canal del equipo en inglés, en registro de equipo: qué se desplegó, qué se rompió y por qué (era un caso límite), qué hiciste (el rollback), quién lo está depurando y qué viene después (el fix en una PR nueva, nada de merges a main hasta entonces). Las frases cortas están bien.',
      ),
      minWords: 40,
      mustUse: [
        { any: ['deploy*', 'released', 'shipped', 'pushed', 'rolled out', 'went out', 'went live'], label: 'deployed' },
        { any: ['bug*', 'issue*', 'defect*', 'error*', 'broke*', 'break*'], label: 'bug' },
        { any: ['edge case*', 'edge-case*', 'corner case*', 'corner-case*'], label: 'edge case' },
        { any: ['rolled back', 'rolling back', 'roll back', 'rollback*', 'reverted', 'revert*'], label: 'rolled back' },
        { any: ['debug*', 'investigat*', 'troubleshoot*', 'diagnos*', 'looking into', 'digging into', 'on it', 'working on', 'root cause', 'root-causing'], label: 'debugging' },
        { any: ['fix*', 'hotfix*', 'patch*'], label: 'fix' },
        { any: ['PR', 'PRs', 'pull request*'], label: 'PR' },
        { any: ['merge*', 'merging'], label: 'merge' },
      ],
      avoid: [
        {
          any: ['el', 'la', 'los', 'las', 'que', 'para', 'hasta', 'hicimos', 'equipo'],
          why: both(
            'Write the update in English: the #releases channel reads English.',
            'Escribe el aviso en inglés: el canal #releases se lee en inglés.',
          ),
        },
        {
          any: ['incidence*'],
          why: both(
            '"Incidence" is a rate (how often something happens). For a problem in production, write "incident" or "issue". The trap comes from Spanish "incidencia".',
            '"Incidence" es una tasa (con qué frecuencia pasa algo). Para un problema en producción, escribe "incident" o "issue". La trampa viene de "incidencia".',
          ),
        },
        {
          any: ['depurat*', 'depuring'],
          why: both(
            '"Depurate" isn\'t used in tech English: the word is "debug" ("Ana is debugging it").',
            '"Depurate" no se usa en el inglés técnico: la palabra es "debug" ("Ana is debugging it").',
          ),
        },
      ],
      model: `Heads up, team: payments API issue, now under control.

At 15:40 we deployed v3.2 of the payments API. At 15:55, 5xx errors spiked: a bug in the validation rejected cards with no ZIP code, an edge case our tests didn't cover.

At 16:05 we rolled back to v3.1 (the Lambda alias points to the previous version again) and errors dropped to zero.

Ana is debugging it now. The fix goes in a new PR with a test for that case. Until it lands, please don't merge to main.`,
    },

    // ---------- Lesson 3: releases and pending work ----------
    {
      id: 'releases-and-backlog',
      kind: 'read',
      title: both('Releases and pending work', 'Versiones y trabajo pendiente'),
      minutes: 7,
      body: join(
        both(
          `**Why first.** Half of every stand-up answers two questions: what's going out, and what's waiting.

**Shipping:**
- A **build** (*compilación*; with the team, *la build*) turns code into something you can run: a site bundle, a ZIP for Lambda, a container image.
- To **deploy** (*desplegar* or *implementar*) is to put a build into an environment, such as staging (a copy of production for testing) or production. A **release** (*versión*, *lanzamiento*) is a version you decide to publish. You can deploy ten times a day and release once a week.

**Planning:**
- The **backlog** (*trabajo pendiente*) is the ordered list of everything waiting; a **sprint** (*iteración*) is a fixed period, often two weeks, in which the team takes on part of it.
- A **feature** (*funcionalidad*) is something the product can do; a **requirement** (*requisito*) is a condition it must meet; an **issue** or ticket (*incidencia*, *ticket*) is one tracked task or problem.
- The **roadmap** (*hoja de ruta*) is the plan for the coming months. An **MVP** (*producto mínimo viable*) is the smallest version real users can try; a **prototype** or **proof of concept** (*prototipo*, *prueba de concepto*) only proves that an idea works.

**The past that still runs:**
- **Legacy** code (*código heredado*) is old code that still runs and nobody wants to touch.
- **Technical debt** (*deuda técnica*) works like a loan: a shortcut saves time today, and every later change pays interest until you pay it back.
- To **refactor** (*refactorizar*) is to reorganize code without changing what it does: the usual way to pay that debt.

AWS's Spanish docs (machine-translated) use mostly *implementación* for deployment, and also *despliegue*. Both are correct: pick one per document.`,
          `**Primero, el porqué.** La mitad de cada daily responde a dos preguntas: qué sale y qué espera.

**Poner en producción:**
- Una **compilación** (*build*; con el equipo, *la build*) convierte el código en algo ejecutable: el paquete de un sitio, un ZIP para Lambda, una imagen de contenedor.
- **Desplegar** o **implementar** (*deploy*) es poner una build en un entorno, como staging (una copia de producción para hacer pruebas) o producción. Una **versión** o **lanzamiento** (*release*) es lo que decides publicar. Puedes desplegar diez veces al día y publicar una versión por semana.

**Planificar:**
- El **trabajo pendiente** (*backlog*) es la lista ordenada de todo lo que espera; un **sprint** (*iteración*) es un periodo fijo, muchas veces de dos semanas, en el que el equipo toma una parte.
- Una **funcionalidad** (*feature*) es algo que el producto sabe hacer; un **requisito** (*requirement*), una condición que debe cumplir; una **incidencia** o ticket (*issue*), una tarea o un problema con seguimiento.
- La **hoja de ruta** (*roadmap*) es el plan de los próximos meses. Un **producto mínimo viable** (*MVP*) es la versión más pequeña que usuarios reales pueden probar; un **prototipo** o **prueba de concepto** (*PoC*) solo demuestra que una idea funciona.

**El pasado que sigue en marcha:**
- El **código heredado** (*legacy*) es código antiguo que sigue funcionando y que nadie quiere tocar.
- La **deuda técnica** (*technical debt*) es como un préstamo: un atajo ahorra tiempo hoy y cada cambio posterior paga intereses hasta saldarla.
- **Refactorizar** (*refactor*) es reorganizar el código sin cambiar lo que hace: la forma habitual de pagar esa deuda.

La documentación de AWS en español (traducción automática) usa sobre todo *implementación* para deployment, y también *despliegue*. Las dos son correctas: elige una por documento.`,
        ),
        termTable(WORK),
        traps(WORK),
        both(
          '**In short:** build, deploy, release; the backlog waits, the sprint picks from it; tech debt is the loan that refactoring pays back.',
          '**En resumen:** compilas, despliegas, publicas; el backlog espera, el sprint toma una parte; la deuda técnica es el préstamo que paga la refactorización.',
        ),
      ),
    },
    {
      id: 'cards-releases',
      kind: 'cards',
      title: both('Flashcards: releases and pending work', 'Tarjetas: versiones y trabajo pendiente'),
      minutes: 8,
      body: both(
        "A bigger deck. Many of these stay in English with the team (backlog, sprint, roadmap), so the formal Spanish form is the one to learn.",
        'Un mazo más grande. Muchas de estas palabras se quedan en inglés con el equipo (backlog, sprint, roadmap), así que la forma que hay que aprender es la formal en español.',
      ),
      cards: cardsFor(WORK),
    },

    // ---------- Register ----------
    {
      id: 'register-everyday',
      kind: 'register',
      title: both('Formal, team or slang?', '¿Formal, de equipo o jerga?'),
      minutes: 6,
      body: both(
        'Phrases from real Slack messages, client emails, docs and meetings, in both languages. Decide where each one fits best.',
        'Frases de mensajes de Slack, correos a clientes, documentación y reuniones reales, en los dos idiomas. Decide dónde encaja mejor cada una.',
      ),
      items: [
        {
          text: 'La versión 2.4 incluye la corrección del error de inicio de sesión y se implementará el jueves.',
          context: both('Release notes for a client', 'Notas de versión para un cliente'),
          answer: 'formal',
          explain: both(
            'Every term is in its formal form: "versión" (release), "corrección" (fix), "error" (bug) and "implementar" (deploy). The passive with "se" ("se implementará") also reads like a document.',
            'Cada término va en su forma formal: "versión" (release), "corrección" (fix), "error" (bug) e "implementar" (deploy). La pasiva con "se" ("se implementará") también suena a documento.',
          ),
        },
        {
          text: 'Abrí una PR con el fix del bug de la Lambda, ¿alguien me la revisa?',
          context: both('Slack, team channel', 'Slack, canal del equipo'),
          answer: 'team',
          explain: both(
            '"PR", "fix" and "bug" are the forms the team uses every day. Fine on Slack; in a client email it would be "solicitud de cambios", "corrección" and "error".',
            '"PR", "fix" y "bug" son las formas que el equipo usa a diario. Perfecto en Slack; en un correo a un cliente sería "solicitud de cambios", "corrección" y "error".',
          ),
        },
        {
          text: 'Tiramos para atrás el deploy, prod está que arde 🔥',
          context: both('Slack, 2 a.m.', 'Slack, a las 2 de la mañana'),
          answer: 'slang',
          explain: both(
            '"Tirar para atrás" is slang for rollback, and "prod está que arde" is pure hallway talk. With the team: "hicimos rollback"; in a report: "se revirtió a la versión anterior".',
            '"Tirar para atrás" es jerga para rollback, y "prod está que arde" es charla de pasillo. Con el equipo: "hicimos rollback"; en un informe: "se revirtió a la versión anterior".',
          ),
        },
        {
          text: 'Como solución provisional, se recomienda revertir a la versión anterior hasta que se publique la corrección.',
          context: both('Incident report', 'Informe de incidente'),
          answer: 'formal',
          explain: both(
            '"Revertir a la versión anterior" is the formal rollback, "solución provisional" the formal workaround, and "corrección" the formal fix. With the team you would hear "hacer rollback", "un workaround" and "el fix".',
            '"Revertir a la versión anterior" es el rollback formal; "solución provisional", el workaround formal, y "corrección", el fix formal. Con el equipo oirías "hacer rollback", "un workaround" y "el fix".',
          ),
        },
        {
          text: 'Mañana hago el deploy, en cuanto la CI esté en verde. Lo demás lo dejo en el backlog.',
          context: both('Stand-up', 'Daily'),
          answer: 'team',
          explain: both(
            '"Hacer el deploy" and "el backlog" are the normal team forms: hardly anyone says "trabajo pendiente" out loud in a stand-up. In a document: "desplegar" or "implementar", and "trabajo pendiente".',
            '"Hacer el deploy" y "el backlog" son las formas normales de equipo: casi nadie dice "trabajo pendiente" en voz alta en una daily. En un documento: "desplegar" o "implementar", y "trabajo pendiente".',
          ),
        },
        {
          text: 'Le he hecho una chapuza para que aguante hasta el lunes.',
          context: both('Chat with a colleague in Spain', 'Chat con un compañero en España'),
          answer: 'slang',
          explain: both(
            '"Chapuza" is Spain slang, and a bit self-deprecating: a botched job. With the team: "un workaround" or "un apaño"; in a document: "una solución provisional". In the Río de la Plata you would hear "un parche".',
            '"Chapuza" es jerga de España, y algo despectiva: un trabajo mal hecho. Con el equipo: "un workaround" o "un apaño"; en un documento: "una solución provisional". En el Río de la Plata se oye "un parche".',
          ),
        },
        {
          text: 'El sistema heredado acumula deuda técnica; proponemos refactorizarlo durante la próxima iteración.',
          context: both('Architecture proposal for management', 'Propuesta de arquitectura para dirección'),
          answer: 'formal',
          explain: both(
            '"Sistema heredado" (legacy), "deuda técnica", "refactorizar" and "iteración" (sprint) are all the formal forms. The team would say "el legacy" and "el próximo sprint".',
            '"Sistema heredado" (legacy), "deuda técnica", "refactorizar" e "iteración" (sprint) son todas formas formales. El equipo diría "el legacy" y "el próximo sprint".',
          ),
        },
        {
          text: 'This release addresses a defect in the sign-in flow. No action is required on your part.',
          context: both('Email to a client', 'Correo a un cliente'),
          answer: 'formal',
          explain: both(
            '"Addresses a defect" and "no action is required" are document English. On Slack the same news is "Shipped a fix for the sign-in bug".',
            '"Addresses a defect" y "no action is required" son inglés de documento. En Slack, la misma noticia sería "Shipped a fix for the sign-in bug".',
          ),
        },
        {
          text: 'Heads up: I reverted the commit that broke the build. Fix coming in a new PR.',
          context: both('Slack, team channel', 'Slack, canal del equipo'),
          answer: 'team',
          explain: both(
            '"Heads up", "the build", "PR" and the dropped subject in "Fix coming" are relaxed but clear: the normal team register on Slack.',
            '"Heads up", "the build", "PR" y la frase sin sujeto "Fix coming" son relajados pero claros: el registro normal de equipo en Slack.',
          ),
        },
        {
          text: "prod's borked lol, rolling back 🔥",
          context: both('Slack, late at night', 'Slack, de madrugada'),
          answer: 'slang',
          explain: both(
            '"Borked" (broken) and "lol" are slang. Fine with close teammates, never in an incident report: there, "Production is degraded; we are rolling back to the previous version."',
            '"Borked" (roto) y "lol" son jerga. Vale con compañeros de confianza, nunca en un informe de incidente: ahí, "Production is degraded; we are rolling back to the previous version."',
          ),
        },
      ],
    },

    // ---------- Final check ----------
    {
      id: 'quiz-git-everyday',
      kind: 'quiz',
      title: both('Check: Git and everyday development', 'Comprueba: Git y el día a día del desarrollo'),
      minutes: 6,
      questions: [
        {
          q: both(
            'The checkout page in production is broken. You add a CloudFront Function that sends visitors to a maintenance page until Monday. In the incident report, written in Spanish, what do you call it?',
            'La página de pago en producción está rota. Añades una CloudFront Function que lleva a los visitantes a una página de mantenimiento hasta el lunes. En el informe del incidente, ¿cómo lo llamas?',
          ),
          options: ['una corrección', 'una solución provisional', 'un rollback', 'un parche de seguridad'],
          answer: 1,
          explain: both(
            'It avoids the problem without fixing the cause: a workaround (formal: solución provisional). Calling it a fix ("corrección") makes people think the cause is solved. Nothing went back to an earlier version, so it isn\'t a rollback either.',
            'Evita el problema sin arreglar la causa: un workaround (formal: solución provisional). Llamarlo corrección hace creer que la causa está resuelta. Tampoco se volvió a una versión anterior, así que no es un rollback.',
          ),
        },
        {
          q: both(
            'A teammate writes: "Haz pull de main antes de empezar." What should you do?',
            'Un compañero escribe: "Haz pull de main antes de empezar." ¿Qué tienes que hacer?',
          ),
          options: [
            both('Open a pull request against main', 'Abrir una pull request contra main'),
            both("Bring main's latest changes into your local copy", 'Traer a tu copia local los últimos cambios de main'),
            both('Push your branch to main', 'Subir tu rama a main'),
            both('Fork the repository', 'Hacer un fork del repositorio'),
          ],
          answer: 1,
          explain: both(
            'Pull brings the remote\'s new commits into your copy (VS Code: "Incorporar cambios"). Don\'t confuse it with a pull request, which brings nothing: it asks the team to take your changes.',
            'Pull trae a tu copia los commits nuevos del remoto (VS Code: "Incorporar cambios"). No lo confundas con una pull request, que no trae nada: pide al equipo que incorpore tus cambios.',
          ),
        },
        {
          q: both(
            'Which sentence fits a formal release note for a client?',
            '¿Qué frase encaja en unas notas de versión formales para un cliente?',
          ),
          options: [
            'Hicimos rollback y metimos un fix.',
            'Se revirtió a la versión anterior y se publicó una corrección.',
            'Lo tiramos para atrás y lo parcheamos.',
            'Rollbackeamos y fixeamos el bug.',
          ],
          answer: 1,
          explain: both(
            '"Revertir a la versión anterior" and "corrección" are the formal forms of rollback and fix. The first option is team talk, the third is slang, and the last one is a mix nobody should send to a client.',
            '"Revertir a la versión anterior" y "corrección" son las formas formales de rollback y fix. La primera opción es charla de equipo, la tercera es jerga y la última es una mezcla que no conviene mandar a un cliente.',
          ),
        },
        {
          q: both(
            'You need to undo one bad commit in Git and keep the history honest (the mistake and its undo both visible). Which word is it?',
            'Tienes que deshacer un commit malo en Git y dejar el historial honesto (el error y su anulación, los dos visibles). ¿Qué palabra es?',
          ),
          options: ['rollback', 'refactor', 'revert', 'patch'],
          answer: 2,
          explain: both(
            'A revert ("revertir el commit") adds a new commit that undoes the old one. A rollback puts the previous version back in production, for example by pointing a Lambda alias at the previous version again.',
            'Un revert ("revertir el commit") añade un commit nuevo que deshace el anterior. Un rollback vuelve a poner la versión anterior en producción, por ejemplo apuntando de nuevo un alias de Lambda a la versión anterior.',
          ),
        },
        {
          q: both(
            'You write a spec for a team in Madrid. Which word for "requirement" is the usual choice there?',
            'Escribes una especificación para un equipo de Madrid. ¿Qué palabra para "requirement" es la habitual allí?',
          ),
          options: ['requerimiento', 'requisito', 'petición', 'exigencia'],
          answer: 1,
          explain: both(
            'In Spain, "requisito" is the usual word; in Latin America "requerimiento" is very common too. Both are understood everywhere: this is common usage, not a rule. Pick one and keep it.',
            'En España, la palabra habitual es "requisito"; en Latinoamérica "requerimiento" también es muy común. Las dos se entienden en todas partes: es uso común, no una norma. Elige una y mantenla.',
          ),
        },
        {
          q: both(
            'Your manager asks, in English, why the refactor matters. Which sentence is correct and clear?',
            'Tu jefa te pregunta, en inglés, por qué importa el refactor. ¿Qué frase es correcta y clara?',
          ),
          options: [
            'The heritage code has a lot of technical debt; we must refactorize it.',
            'The legacy code has many technical debts, so we have to refactorize.',
            'The legacy code has a lot of technical debt; refactoring it now makes every new feature cheaper.',
            'The inherited code has much technical debit; refactoring is a requisite.',
          ],
          answer: 2,
          explain: both(
            'English says "legacy code" ("heritage code" or "inherited code" sound odd), "refactor" (not "refactorize"), and "technical debt" is uncountable ("a lot of", not "many debts"). "Debit" and "requisite" are calques of "débito" and "requisito": say "debt", and "a requirement" or simply "we need to".',
            'En inglés se dice "legacy code" ("heritage code" o "inherited code" suenan raros), "refactor" (no "refactorize"), y "technical debt" es incontable ("a lot of", no "many debts"). "Debit" y "requisite" son calcos de "débito" y "requisito": se dice "debt", y "a requirement" o simplemente "we need to".',
          ),
        },
        {
          q: both(
            "What do AWS's Spanish docs (machine-translated) use for deploy / deployment?",
            '¿Qué usa la documentación de AWS en español (traducción automática) para deploy / deployment?',
          ),
          options: [
            both('Only "despliegue"', 'Solo "despliegue"'),
            both('Mostly "implementación", and also "despliegue"', 'Sobre todo "implementación", y también "despliegue"'),
            both('Only "deploy", left in English', 'Solo "deploy", en inglés'),
            '"Lanzamiento"',
          ],
          answer: 1,
          explain: both(
            'The CodeDeploy guide in Spanish calls the service "un servicio de implementación" and also has a page titled "Trabajar con despliegues". Both are correct; what matters is using one form consistently in a document.',
            'La guía de CodeDeploy en español llama al servicio "un servicio de implementación" y también tiene una página titulada "Trabajar con despliegues". Las dos son correctas; lo importante es usar una sola forma en cada documento.',
          ),
        },
        {
          q: both(
            'You email a client in Spanish to say the next release comes out on Tuesday. Which is best?',
            'Escribes a un cliente en español para decirle que la próxima release sale el martes. ¿Cuál es la mejor opción?',
          ),
          options: [
            'El próximo deploy sale el martes.',
            'La próxima liberación sale el martes.',
            'El próximo release se libera el martes.',
            'La próxima versión sale el martes.',
          ],
          answer: 3,
          explain: both(
            '"Versión" (or "lanzamiento") is the clear formal word. "Deploy" is a different step (putting a build in an environment) and team talk, "liberar una versión" is heard but "publicar" is clearer, and "el release" is fine with the team but not in a client email.',
            '"Versión" (o "lanzamiento") es la palabra formal y clara. "Deploy" es otro paso (poner una build en un entorno) y es charla de equipo, "liberar una versión" se oye pero "publicar" es más claro, y "el release" vale con el equipo, pero no en un correo a un cliente.',
          ),
        },
      ],
    },
  ],
};

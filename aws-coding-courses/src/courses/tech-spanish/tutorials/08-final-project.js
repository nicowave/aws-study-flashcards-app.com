// Module 8: Final project (paid).
// Lessons: tell it twice (one real change, four texts, four registers) and the
// technical interview (three typical questions in the language that isn't
// yours). Mostly writing: seven rewrite steps. Translations come from the
// glossary (termTable, traps, cardsFor). The only "this is what X uses" claims
// are backed by content/tech-spanish/sources.mjs: "bucket de S3" (aws-s3, AWS's
// machine-translated docs), VS Code's "Incorporar cambios" and Git keeping
// "pull" (vscode-git-es, git-es-po). Everything else is common usage; regional
// differences are tendencies, not rules.
import { both, join } from '../../../engine/i18n';
import { termTable, traps, cardsFor } from '../glossary';

const TELL_IT_TWICE = ['library', 'eventually-ff', 'instance', 'policy', 'incident', 'provision', 'exception', 'record', 'latency', 'scaling'];
const INTERVIEW = ['release', 'pull', 'requirement', 'encryption', 'hacker', 'edge-case', 'array', 'managed-service', 'bucket', 'log'];

export default {
  slug: 'final-project',
  number: 8,
  free: false,
  title: both('Final project', 'Proyecto final'),
  situation: both(
    "You're a backend developer on the order-tracking API of an online retailer: API Gateway, Lambda and DynamoDB, with the infrastructure in AWS CDK. Last Friday, between 18:05 and 18:40, the order history page timed out for 12% of requests, because the Lambda function scanned the whole Orders table on every call. This week you added a global secondary index (GSI) and deployed it with CDK, and p99 latency dropped from 2.4 s to 180 ms. Now you have to tell that one change four times: a commit message in English, a pull request description in Spanish for the reviewers in Mexico City, a Slack message in English for the team in Toronto, and a formal email in Spanish for the client's IT director. And next Monday you have a technical interview in the language that isn't yours.",
    'Trabajas como desarrollador o desarrolladora backend en la API de seguimiento de pedidos de una tienda en línea: API Gateway, Lambda y DynamoDB, con la infraestructura en AWS CDK. El viernes pasado, entre las 18:05 y las 18:40, el 12 % de las solicitudes a la página del historial de pedidos superaron el tiempo de espera, porque la función Lambda hacía un scan de toda la tabla Orders en cada llamada. Esta semana añadiste un índice secundario global (GSI) y lo desplegaste con CDK, y la latencia p99 bajó de 2,4 s a 180 ms. Ahora tienes que contar ese mismo cambio cuatro veces: un mensaje de commit en inglés, la descripción de la pull request en español para quienes la revisan en Ciudad de México, un mensaje de Slack en inglés para el equipo de Toronto y un correo formal en español para la directora de TI del cliente. Y el lunes que viene tienes una entrevista técnica en el idioma que no es el tuyo.',
  ),
  overview: both(
    "This module puts the whole course to work. In the first lesson you take one real change and write it four times, each in the right register and the right language: commit, pull request, Slack and client email. The facts never change; the words do. In the second lesson you prepare answers to three questions that come up in almost every cloud interview (explain your architecture, how you handle an incident, what serverless is) and write all three out: one in English and two in Spanish. The flashcards review the trickiest terms of the course, and a final quiz mixes everything.",
    'Este módulo pone a trabajar todo el curso. En la primera lección tomas un cambio real y lo escribes cuatro veces, cada una en el registro y el idioma correctos: commit, pull request, Slack y correo al cliente. Los datos no cambian; las palabras sí. En la segunda lección preparas respuestas a tres preguntas que salen en casi cualquier entrevista de nube (explícame tu arquitectura, cómo manejas un incidente, qué es serverless) y escribes las tres: una en inglés y dos en español. Las tarjetas repasan los términos más traicioneros del curso, y un quiz final lo mezcla todo.',
  ),
  level: both('Intermediate', 'Intermedio'),
  hours: 1.5,
  skills: ['commit message', 'PR description', 'Slack update', 'client email', 'technical interview'],
  steps: [
    // ---------- Lesson 1: tell it twice ----------
    {
      id: 'tell-it-twice',
      kind: 'read',
      title: both('Tell it twice (or four times)', 'Cuéntalo dos veces (o cuatro)'),
      minutes: 6,
      body: join(
        both(
          `**Why first.** At work, a change is never told just once. You write the commit for the Git history, the pull request for your reviewers, a Slack message for the team and an email for the client. The facts stay the same; the words change with the reader. Register works like clothes: the same person wears a suit to the client meeting and a hoodie to the stand-up, and both are right in their place.

Our change: during last Friday's **incident** (*incidente*: a serious problem in production), the order history page timed out. We added a GSI (a global secondary index: the same items organized by another key, here customerId, so you can Query them instead of a Scan, which reads every item, as the Lambda function did), and *cdk deploy* **provisioned** it (*aprovisionar* in writing, *levantar* with the team) by updating the CloudFormation stack. The words you need to tell it:

- **library** (*biblioteca*): CDK ships as the *aws-cdk-lib* library. You'll hear *librería* in the office; write *biblioteca*.
- **policy** (*política*, never politics): the IAM rules document. Ours allowed the table but not its index.
- **exception** (*excepción*: formally you *lanzas* and *capturas* one; the team says *tirar* and *cachear*): the *AccessDeniedException* the query threw in staging.
- **record** (*registro*): one order in the table. *Registro* is also a log line and a DNS record, so give context.
- **latency** (*latencia*): how long one request waits. Our p99 (99 of every 100 requests are faster than this) went from 2.4 s to 180 ms.
- **scaling** (*escalado*, *escalar*): we didn't need it. *Escalar un problema* is to escalate it.
- **instance** (*instancia*): a virtual server. Serverless means there are none to add.
- **eventually** (*al final*) and **actually** (*en realidad*): GSI reads are eventually consistent, so a new order eventually shows up (*acaba apareciendo*) after a moment. Spanish *eventualmente* means "possibly".`,
          `**Primero, el porqué.** En el trabajo, un cambio nunca se cuenta una sola vez. Escribes el commit para el historial de Git, la pull request para quien revisa, un mensaje de Slack para el equipo y un correo para el cliente. Los datos son los mismos; las palabras cambian según quién lee. El registro funciona como la ropa: la misma persona lleva traje a la reunión con el cliente y sudadera a la daily, y las dos cosas están bien.

Nuestro cambio: durante el **incidente** del viernes pasado (*incident*: un problema serio en producción), la página del historial de pedidos superó el tiempo de espera. Añadimos un GSI (un índice secundario global: los mismos elementos ordenados por otra clave, aquí customerId, para hacer una Query en vez de un Scan, que lee todos los elementos, como hacía la función Lambda), y *cdk deploy* lo **aprovisionó** (*provision*; *levantar* con el equipo) al actualizar la pila de CloudFormation. Las palabras para contarlo:

- **biblioteca** (*library*): CDK se distribuye como la biblioteca *aws-cdk-lib*. En la oficina oirás *librería*; por escrito, *biblioteca*.
- **política** (*policy*, nunca politics): el documento de reglas de IAM. La nuestra permitía la tabla, pero no su índice.
- **excepción** (*exception*: por escrito se *lanza* y se *captura*; el equipo dice *tirar* y *cachear*): la *AccessDeniedException* que lanzó la consulta en staging.
- **registro** (*record*): un pedido de la tabla. *Registro* también es una línea de log y un registro DNS: da contexto.
- **latencia** (*latency*): cuánto espera una solicitud. Nuestra p99 (99 de cada 100 solicitudes tardan menos que esto) pasó de 2,4 s a 180 ms.
- **escalado** (*scaling*): no hizo falta. *Escalar un problema* es pasárselo a un superior (*escalate*).
- **instancia** (*instance*): un servidor virtual. Con serverless no hay ninguna que añadir.
- **eventually** (*al final*) y **actually** (*en realidad*): las lecturas de un GSI son de consistencia eventual, así que un pedido nuevo *acaba apareciendo* tras un momento. *Eventualmente* en español significa "quizás".`,
        ),
        termTable(TELL_IT_TWICE),
        traps(TELL_IT_TWICE),
        both(
          '**In short:** same facts, four readers: pick the language and the register first, then the words.',
          '**En resumen:** los mismos datos, cuatro lectores: elige primero el idioma y el registro, y después las palabras.',
        ),
      ),
    },
    {
      id: 'cards-tell-it-twice',
      kind: 'cards',
      title: both('Review deck: the trickiest terms (1)', 'Mazo de repaso: los términos más traicioneros (1)'),
      minutes: 6,
      body: both(
        'Ten terms that trip people up in both directions. Before you flip, say the formal form and the one you would use with the team. For eventually / actually, say what Spanish *eventualmente* and *actualmente* really mean.',
        'Diez términos que hacen tropezar en las dos direcciones. Antes de girar la tarjeta, di la forma formal y la que usarías con el equipo. Para eventually / actually, di qué significan de verdad *eventualmente* y *actualmente*.',
      ),
      cards: cardsFor(TELL_IT_TWICE),
    },
    {
      id: 'register-final',
      kind: 'register',
      title: both('Formal, team or slang?', '¿Formal, de equipo o jerga?'),
      minutes: 6,
      body: both(
        'Phrases about the GSI change, taken from Slack, pull requests, client emails and meetings, in both languages. Decide where each one fits best.',
        'Frases sobre el cambio del GSI, sacadas de Slack, pull requests, correos a clientes y reuniones, en los dos idiomas. Decide dónde encaja mejor cada una.',
      ),
      items: [
        {
          text: 'Se aprovisionó un índice secundario global mediante AWS CDK; la tabla permaneció disponible durante todo el proceso.',
          context: both('Change report for the client', 'Informe de cambios para el cliente'),
          answer: 'formal',
          explain: both(
            '*Aprovisionar* is the glossary\'s formal form (the team says *provisionar* or *levantar*), and the impersonal *se aprovisionó* reads like a document.',
            '*Aprovisionar* es la forma formal del glosario (el equipo dice *provisionar* o *levantar*), y el impersonal *se aprovisionó* suena a documento.',
          ),
        },
        {
          text: 'ya levanté el GSI en stg, pullea y me dices 👍',
          context: both('Slack, direct message', 'Slack, mensaje directo'),
          answer: 'slang',
          explain: both(
            '*Pullear*, *stg* and the emoji make it slang (*levantar* on its own is everyday team talk). With the team: "ya levanté el GSI en staging, haz pull y me cuentas". In writing: *aprovisionar* and *obtener los cambios*.',
            '*Pullear*, *stg* y el emoji lo convierten en jerga (*levantar* a secas es lenguaje normal de equipo). Con el equipo: "ya levanté el GSI en staging, haz pull y me cuentas". Por escrito: *aprovisionar* y *obtener los cambios*.',
          ),
        },
        {
          text: 'Hay que cachear la excepción y loguearla antes de reintentar.',
          context: both('Pull request comment', 'Comentario en una pull request'),
          answer: 'slang',
          explain: both(
            '*Loguear* is slang, and *cachear*, normal with the team, is ambiguous in writing (catch or cache?). Together, in a written review, they put it at the slang end. A clear comment: "hay que capturar la excepción y registrarla antes de reintentar".',
            '*Loguear* es jerga, y *cachear*, normal con el equipo, por escrito es ambiguo (¿catch o cache?). Juntos, en una revisión escrita, lo llevan al extremo de la jerga. Un comentario claro: "hay que capturar la excepción y registrarla antes de reintentar".',
          ),
        },
        {
          text: 'Heads-up: the new index is eventually consistent, so a brand-new order can take a second to show up in the history.',
          context: both('Slack, team channel', 'Slack, canal del equipo'),
          answer: 'team',
          explain: both(
            '*Heads-up* is friendly team English, and every fact is precise. *Eventually consistent* is correct technical English: in Spanish, *consistencia eventual* or *coherencia final*, never just *eventualmente*.',
            '*Heads-up* es inglés cercano de equipo, y cada dato es preciso. *Eventually consistent* es inglés técnico correcto: en español, *consistencia eventual* o *coherencia final*, nunca *eventualmente* a secas.',
          ),
        },
        {
          text: 'Following the deployment, the p99 latency of the order history endpoint decreased from 2.4 s to 180 ms.',
          context: both('Monthly service report', 'Informe mensual del servicio'),
          answer: 'formal',
          explain: both(
            '*Following the deployment*, *decreased* and the exact figures: report language. In Spanish: "tras el despliegue, la latencia p99… se redujo de 2,4 s a 180 ms", with a decimal comma in most Spanish-speaking countries (Mexico, much of Central America, the Dominican Republic and Puerto Rico usually use a point).',
            '*Following the deployment*, *decreased* y las cifras exactas: lenguaje de informe. En español: "tras el despliegue, la latencia p99… se redujo de 2,4 s a 180 ms", con coma decimal en la mayoría de los países hispanohablantes (México, buena parte de Centroamérica, la República Dominicana y Puerto Rico suelen usar punto).',
          ),
        },
        {
          text: '¿Qué librería usas para validar el body? ¿zod?',
          context: both('Slack, team channel', 'Slack, canal del equipo'),
          answer: 'team',
          explain: both(
            '*Librería* is what you hear in the office, even though it\'s a false friend (a bookstore). Fine with the team; in a document write *biblioteca*. *Lib* would be slang.',
            '*Librería* es lo que se oye en la oficina, aunque sea un falso amigo (una tienda de libros). Con el equipo vale; en un documento, escribe *biblioteca*. *Lib* sería jerga.',
          ),
        },
        {
          text: 'La latencia bajó un montón con el índice. ¿Lo vieron en el dashboard?',
          context: both('Stand-up', 'Daily'),
          answer: 'team',
          explain: both(
            '*Latencia* works in any register; *un montón* and the direct question make it team talk. In a report: "la latencia se redujo más de un 90 %".',
            '*Latencia* sirve en cualquier registro; *un montón* y la pregunta directa lo convierten en lenguaje de equipo. En un informe: "la latencia se redujo más de un 90 %".',
          ),
        },
        {
          text: "LGTM, ship it 🚀 Just add a test for the empty array edge case.",
          context: both('Pull request approval', 'Aprobación de una pull request'),
          answer: 'team',
          explain: both(
            '*LGTM* and *ship it* are how approvals are normally written on English-speaking teams; the rocket keeps it casual. In a formal review record: "Approved. Please add a test for the empty-array edge case." *Edge case* and *array* are standard English in any register; in a Spanish document, *caso límite*.',
            '*LGTM* y *ship it* son la forma normal de aprobar una PR en equipos de habla inglesa; el cohete le da el tono informal. En un registro formal de revisión: "Approved. Please add a test for the empty-array edge case." *Edge case* y *array* son inglés normal en cualquier registro; en un documento en español, *caso límite*.',
          ),
        },
        {
          text: 'Durante el incidente del viernes, el 12 % de las solicitudes al historial de pedidos superaron el tiempo de espera.',
          context: both('Post-incident analysis', 'Análisis posterior al incidente'),
          answer: 'formal',
          explain: both(
            '*Incidente* (in Spain *incidencia* is used for any ticket; *incidente* makes the severity clear), *solicitudes* and *superar el tiempo de espera* instead of "dio timeout": a formal document.',
            '*Incidente* (en España *incidencia* se usa para cualquier ticket; *incidente* deja claro que es serio), *solicitudes* y *superar el tiempo de espera* en vez de "dio timeout": un documento formal.',
          ),
        },
        {
          text: 'Al final no hizo falta escalar: con el índice sobra.',
          context: both('Meeting with the team', 'Reunión con el equipo'),
          answer: 'team',
          explain: both(
            '*Escalar* is the glossary\'s team form (formal: *escalado horizontal / vertical*). In English it\'s *scale*, not *escalate*. Here *al final* means "in the end": "In the end, we didn\'t need to scale", not "Eventually…" (*eventually* means "after some time").',
            '*Escalar* es la forma de equipo del glosario (formal: *escalado horizontal / vertical*). En inglés es *scale*, no *escalate*. Aquí *al final* significa "después de todo": "In the end, we didn\'t need to scale", no "Eventually…" (*eventually* es "con el tiempo, al cabo de un rato").',
          ),
        },
      ],
    },
    {
      id: 'write-commit',
      kind: 'rewrite',
      title: both('Write it: the commit message', 'Escríbelo: el mensaje de commit'),
      minutes: 7,
      body: both(
        'The repo is in English. Your notes are in Spanish. A good commit message has a short subject line in the imperative mood ("Add…", not "Added…"), ideally about 50 characters and never more than 72, a blank line, and a body wrapped at about 72 characters that says what changed and why. Watch two traps: *política* is a *policy*, and *array* stays *array* (not *matrix*).',
        'El repo está en inglés. Tus notas están en español. Un buen mensaje de commit tiene una línea de asunto corta en imperativo ("Add…", no "Added…"), de unos 50 caracteres y nunca más de 72, una línea en blanco y un cuerpo cortado a unos 72 caracteres que diga qué cambió y por qué. Cuidado con dos trampas: *política* es *policy*, y *array* se queda en *array* (no *matrix*).',
      ),
      target: 'en',
      source: `Notas para el commit:
- Añadí a la tabla Orders, en el stack de CDK, el índice secundario global byCustomer (clave de partición customerId, clave de ordenación createdAt).
- getOrdersByCustomer ahora hace Query sobre el índice en vez de Scan de toda la tabla.
- Motivo: el Scan causó los timeouts del incidente INC-482 (latencia p99 de 2,4 s).
- Corregí la política de IAM de la Lambda: solo permitía el ARN de la tabla y la Query lanzaba AccessDeniedException. Añadí table/Orders/index/*.
- Si el cliente no tiene pedidos, devolver un array vacío (antes lanzaba una excepción).`,
      task: both(
        'Write the commit message in English: an imperative subject line, then a body with the new GSI, the switch from Scan to Query and why, the IAM policy fix for the AccessDeniedException, and the empty array for customers with no orders.',
        'Escribe el mensaje de commit en inglés: una línea de asunto en imperativo y luego un cuerpo con el GSI nuevo, el cambio de Scan a Query y su motivo, la corrección de la política de IAM por la AccessDeniedException, y el array vacío para clientes sin pedidos.',
      ),
      minWords: 35,
      mustUse: [
        { any: ['GSI', 'GSIs', 'global secondary index*', 'index', 'indexes', 'indices'], label: 'GSI / index' },
        { any: ['quer*'], label: 'Query' },
        { any: ['scan*'], label: 'Scan' },
        { any: ['polic*', 'permission*', 'IAM', 'grant*', 'role', 'roles', 'ARN', 'access'], label: 'IAM policy' },
        { any: ['AccessDenied*', 'exception*', 'throw*', 'threw', 'thrown', 'error*', 'denied'], label: 'AccessDeniedException' },
        { any: ['empty', 'no orders', 'without orders', '[]', 'edge case*'], label: 'empty array' },
        { any: ['timeout*', 'timed out', 'time out', 'latenc*', 'slow*', 'p99', 'incident*', 'INC-482'], label: 'why: timeouts / latency' },
      ],
      avoid: [
        {
          any: ['politic*'],
          why: both(
            'An IAM *política* is a *policy* in English. *Politics* is governments and office power games.',
            'Una *política* de IAM en inglés es *policy*. *Politics* es la política de los gobiernos y los juegos de poder de la oficina.',
          ),
        },
        {
          any: ['matrix', 'matrices'],
          why: both(
            'Translated docs sometimes say *matriz*, but in code English it\'s an *array*. A *matrix* is a 2D grid of numbers.',
            'La documentación traducida a veces dice *matriz*, pero en inglés de código es un *array*. Una *matrix* es una cuadrícula 2D de números.',
          ),
        },
      ],
      model: `Query orders by customer through a new GSI

Add the byCustomer global secondary index (partition key customerId,
sort key createdAt) to the Orders table in the CDK stack.
getOrdersByCustomer now runs a Query on the index instead of a Scan
of the whole table. The Scan caused the timeouts in incident INC-482
and a p99 latency of 2.4 s.

Fix the Lambda's IAM policy: it only allowed the table ARN, so the
Query threw AccessDeniedException. Add table/Orders/index/*.

Return an empty array when a customer has no orders instead of
throwing an exception.`,
    },
    {
      id: 'write-pr',
      kind: 'rewrite',
      title: both('Write it: the pull request description', 'Escríbelo: la descripción de la pull request'),
      minutes: 9,
      body: both(
        'The reviewers in Mexico City prefer Spanish. A PR description is team register, but organized: what changes, why, how to test it, and what to watch out for. *Query*, *Scan* and *GSI* can stay in English (they\'re DynamoDB operation and feature names), and *hacer pull* is normal. Numbers: Mexico usually writes a decimal point (*2.4 s*); whichever you use, keep it consistent. The trap: *eventually consistent* is *de consistencia eventual* or *con coherencia final*, never just *eventualmente*, which in Spanish means "possibly".',
        'Quienes revisan en Ciudad de México prefieren el español. La descripción de una PR es registro de equipo, pero ordenado: qué cambia, por qué, cómo probarlo y qué tener en cuenta. *Query*, *Scan* y *GSI* pueden quedarse en inglés (son nombres de operaciones y funcionalidades de DynamoDB), y *hacer pull* es normal. Cifras: en México se suele escribir punto decimal (*2.4 s*); uses la que uses, mantenla en todo el texto. La trampa: *eventually consistent* es *de consistencia eventual* o *con coherencia final*, nunca *eventualmente* a secas, que en español significa "quizás".',
      ),
      target: 'es',
      source: `Query orders by customer through a new GSI (#214)

- Adds the byCustomer GSI (PK customerId, SK createdAt) to the Orders table in OrdersStack. No new libraries: just aws-cdk-lib.
- getOrdersByCustomer: Query on the index instead of a full-table Scan.
- Fixes the Lambda's IAM policy (adds table/Orders/index/*).
- Customers with no orders get an empty array instead of an exception.
Why: the Scan caused the INC-482 timeouts. In staging, p99 went from 2.4 s to 180 ms.
How to test: pull this branch, run npx cdk diff, run npm test, then open the history of a customer with orders and one without.
Heads-up: GSI reads are eventually consistent only. When we deploy, DynamoDB backfills the index; the table stays available.`,
      task: both(
        'Write the PR description in Spanish, with short sections: what changes (the GSI, Query instead of Scan, the IAM policy, the empty array), why (the incident and the latency), how to test it, and what to watch out for (eventual consistency and the deploy).',
        'Escribe la descripción de la PR en español, con secciones cortas: qué cambia (el GSI, Query en vez de Scan, la política de IAM, el array vacío), por qué (el incidente y la latencia), cómo probarlo y qué tener en cuenta (la consistencia eventual y el despliegue).',
      ),
      minWords: 60,
      mustUse: [
        { any: ['indice*', 'GSI'], label: 'índice / GSI' },
        { any: ['politica*', 'policy', 'permiso*'], label: 'política de IAM' },
        { any: ['latencia*', 'tiempo de respuesta', 'tiempos de respuesta'], label: 'latencia' },
        { any: ['consistencia eventual', 'coherencia final', 'consistencia final', 'coherencia eventual'], label: 'consistencia eventual / coherencia final' },
        { any: ['prueb*', 'probar*', 'probad*', 'verific*', 'comprob*', 'test*'], label: 'cómo probarlo' },
        { any: ['despleg*', 'desplieg*', 'implement*', 'deploy*'], label: 'desplegar / el despliegue' },
      ],
      avoid: [
        {
          any: ['eventualmente'],
          why: both(
            'In Spanish *eventualmente* means "possibly, not for sure". Write *de consistencia eventual* or *con coherencia final*; for *eventually* on its own, *al final*.',
            'En español *eventualmente* significa "quizás, no es seguro". Escribe *de consistencia eventual* o *con coherencia final*; para *eventually* a secas, *al final*.',
          ),
        },
        {
          any: ['librer*'],
          why: both(
            '*Library* is *biblioteca*. *Librería* is very common out loud, but a PR description is written: *biblioteca*.',
            '*Library* es *biblioteca*. *Librería* se oye mucho, pero la descripción de una PR se escribe: *biblioteca*.',
          ),
        },
      ],
      model: `## Qué cambia
- Añade a la tabla Orders el índice secundario global (GSI) byCustomer, con customerId como clave de partición y createdAt como clave de ordenación. Lo crea OrdersStack; no hay bibliotecas nuevas, solo aws-cdk-lib.
- getOrdersByCustomer hace una Query sobre el índice en lugar de un Scan de toda la tabla.
- Corrige la política de IAM de la Lambda: ahora incluye el ARN del índice (table/Orders/index/*).
- Si un cliente no tiene pedidos, devuelve un array vacío en vez de lanzar una excepción.

## Por qué
El Scan causó los timeouts del incidente INC-482. En staging, la latencia p99 bajó de 2.4 s a 180 ms.

## Cómo probarlo
1. Haz pull de esta rama y ejecuta npx cdk diff para ver el índice nuevo.
2. Ejecuta npm test.
3. Abre el historial de un cliente con pedidos y el de uno sin pedidos.

## A tener en cuenta
- Las lecturas de un GSI solo son de consistencia eventual: un pedido recién creado puede tardar un momento en aparecer en el historial.
- Al desplegar, DynamoDB rellena el índice con los datos que ya existen; la tabla sigue disponible mientras tanto.`,
    },
    {
      id: 'write-slack',
      kind: 'rewrite',
      title: both('Write it: the Slack update for the team', 'Escríbelo: el aviso en Slack para el equipo'),
      minutes: 7,
      body: both(
        'The PR is merged and deployed. #team-orders is in English and people read it between meetings: friendly, short, scannable. Three false friends wait in your notes: *escalar* a system is to *scale* it (to *escalate* is to pass a problem up), a database *registro* is a *record*, not a *register*, and *actualmente* is *currently*, not *actually*.',
        'La PR está fusionada y desplegada. En #team-orders se escribe en inglés y se lee entre reunión y reunión: el mensaje tiene que ser cercano, breve y entenderse de un vistazo. En tus notas esperan tres falsos amigos: *escalar* un sistema es *scale* (*escalate* es pasar un problema a un superior), un *registro* de una base de datos es un *record*, no un *register*, y *actualmente* es *currently*, no *actually*.',
      ),
      target: 'en',
      source: `Para #team-orders:
- Desplegamos a producción el GSI byCustomer a las 11:20, sin caída del servicio.
- Latencia p99 del historial de pedidos: de 2,4 s a 180 ms.
- Ya no hay timeouts; cerramos el incidente INC-482. El postmortem es el jueves.
- Actualmente la tabla tiene 1,2 millones de registros y el índice ya terminó de rellenarse.
- Ojo: las lecturas del índice son de consistencia eventual. Si un pedido recién creado no aparece enseguida, aparece al cabo de uno o dos segundos. No es un bug.
- No hizo falta escalar ni añadir capacidad.
- Hagan pull de main antes de tocar el stack.`,
      task: both(
        'Write the Slack message in English: the deploy, the latency before and after, the incident being closed and the postmortem, the eventual consistency note, that no scaling was needed, and the request to pull main.',
        'Escribe el mensaje de Slack en inglés: el despliegue, la latencia antes y después, el cierre del incidente y el postmortem, la nota sobre la consistencia eventual, que no hizo falta escalar, y que pidas a todo el equipo que haga pull de main.',
      ),
      minWords: 45,
      mustUse: [
        { any: ['deploy*', 'shipp*', 'ship', 'roll*', 'released', 'live', 'went out', 'prod', 'production'], label: 'deployed' },
        { any: ['GSI', 'index*'], label: 'GSI / index' },
        { any: ['latenc*', 'p99', 'faster', 'response time*'], label: 'latency' },
        { any: ['incident*', 'INC-482'], label: 'incident' },
        { any: ['eventually', 'eventual consistency'], label: 'eventually consistent' },
        { any: ['pull*', 'rebase*', 'fetch*'], label: 'pull main' },
      ],
      avoid: [
        {
          any: ['escalat*'],
          why: both(
            'Spanish *escalar* a system is *to scale* it. *To escalate* means passing a problem to someone higher up.',
            '*Escalar* un sistema en inglés es *to scale*. *To escalate* es pasarle un problema a alguien de más arriba.',
          ),
        },
        {
          any: ['register', 'registers'],
          why: both(
            'A row in a database is a *record* (or an *item* in DynamoDB). A *register* is a CPU register, a cash register or an official list.',
            'Una fila de una base de datos es un *record* (o un *item* en DynamoDB). Un *register* es un registro de la CPU, una caja registradora o una lista oficial.',
          ),
        },
        {
          any: ['actually'],
          why: both(
            'Spanish *actualmente* is *currently*. *Actually* means *en realidad*: "Actually the table has 1.2M records" sounds like you are correcting someone.',
            '*Actualmente* en inglés es *currently*. *Actually* es *en realidad*: "Actually the table has 1.2M records" suena a que corriges a alguien.',
          ),
        },
      ],
      model: `Heads-up, team 🚀 We deployed the byCustomer GSI to prod at 11:20, with no downtime.
- p99 latency on the order history page: 2.4 s → 180 ms.
- No more timeouts, so we're closing incident INC-482. Postmortem is on Thursday.
- The table currently holds 1.2M records, and the index has finished backfilling.
- Note: reads from the index are eventually consistent. If a brand-new order doesn't show up right away, it will within a second or two. Not a bug.
- We didn't need to scale or add capacity.
Please pull main before you touch the stack.`,
    },
    {
      id: 'write-client-email',
      kind: 'rewrite',
      title: both('Write it: the formal email to the client', 'Escríbelo: el correo formal al cliente'),
      minutes: 10,
      body: both(
        "The client's IT director, Patricia Ríos, reads Spanish and expects a formal email: *usted*, full sentences, no slang. No *levantamos*, no *deployamos*, no *provisionamos* (write *aprovisionamos*), and no *eventualmente*. Explain the cause and the fix without jargon she doesn't need, and say clearly that no data was exposed.",
        'La directora de TI del cliente, Patricia Ríos, lee en español y espera un correo formal: *usted*, frases completas, nada de jerga. Ni *levantamos*, ni *deployamos*, ni *provisionamos* (escribe *aprovisionamos*), ni *eventualmente*. Explica la causa y la solución sin la jerga que ella no necesita, y deja claro que no se expuso ningún dato.',
      ),
      target: 'es',
      source: `Notes for the email to Patricia Ríos (client IT director). Formal, in Spanish.
- Last Friday's incident: the order history page timed out for 12% of requests, 18:05 to 18:40.
- Root cause: the function read the entire orders table on every request.
- Fix: we added an index (a global secondary index) so each request reads only that customer's records. Provisioned with our infrastructure-as-code tooling (AWS CDK), deployed Tuesday at 11:20 with no downtime.
- Result: p99 latency from 2.4 s to 180 ms.
- No need for more servers or instances: DynamoDB is a managed service, and on-demand capacity scales on its own.
- Good to know: a new order can take a second or two to show up in the history (eventual consistency). No data is lost.
- Not a security issue; no customer data was exposed.
- We'll send the post-incident analysis by Friday.`,
      task: both(
        'Write the email in formal Spanish (usted): the incident and its cause, the fix (the index, provisioned and deployed with AWS CDK), the latency result, why no extra instances were needed (managed service), the short delay for new orders, that no data was exposed, and when the post-incident analysis will arrive.',
        'Redacta el correo en español formal (usted): el incidente y su causa, la solución (el índice, aprovisionado y desplegado con AWS CDK), el resultado en latencia, por qué no hicieron falta más instancias (servicio administrado), el pequeño retraso de los pedidos nuevos, que no se expuso ningún dato y cuándo llegará el análisis posterior al incidente.',
      ),
      minWords: 90,
      mustUse: [
        { any: ['incidente*'], label: 'incidente' },
        { any: ['indice*'], label: 'índice' },
        { any: ['aprovision*', 'despleg*', 'desplieg*', 'implement*'], label: 'aprovisionar / desplegar' },
        { any: ['latencia*', 'tiempo de respuesta', 'tiempos de respuesta'], label: 'latencia' },
        { any: ['administrad*', 'gestionad*', 'administra', 'gestiona'], label: 'servicio administrado' },
        { any: ['coherencia final', 'consistencia eventual', 'consistencia final', 'retras*', 'demor*', 'tarda', 'tardan', 'tardar uno', 'tardar unos', 'tardar un', 'segundos'], label: 'el pequeño retraso (coherencia final)' },
        { any: ['analisis*', 'informe*'], label: 'análisis posterior al incidente' },
      ],
      avoid: [
        {
          any: ['eventualmente'],
          why: both(
            'A client will read *eventualmente* as "maybe". Write *coherencia final* or *consistencia eventual*, and explain the delay in plain words.',
            'Un cliente leerá *eventualmente* como "quizás". Escribe *coherencia final* o *consistencia eventual*, y explica el retraso con palabras sencillas.',
          ),
        },
        {
          any: ['provision*'],
          why: both(
            '*Provisionar* is a very common calque; in a formal document *aprovisionar* is the more established form.',
            '*Provisionar* es un calco muy extendido; en un documento formal, *aprovisionar* es la forma más asentada.',
          ),
        },
        {
          any: ['deploy*', 'levant*'],
          why: both(
            '*Deployar* and *levantar* are team talk. In a client email: *desplegar* or *implementar*, and *aprovisionar* for resources.',
            '*Deployar* y *levantar* son lenguaje de equipo. En un correo a un cliente: *desplegar* o *implementar*, y *aprovisionar* para los recursos.',
          ),
        },
        {
          any: ['tu', 'tus', 'te', 'contigo'],
          why: both(
            'This email uses *usted*: *le escribo*, *su equipo*, not *te escribo*, *tu equipo*.',
            'Este correo es de *usted*: *le escribo*, *su equipo*, no *te escribo*, *tu equipo*.',
          ),
        },
      ],
      model: `Asunto: Incidente del viernes en el historial de pedidos: causa y solución

Estimada Sra. Ríos:

Le escribo para informarle sobre el incidente del viernes pasado y las medidas que hemos tomado.

Entre las 18:05 y las 18:40, el 12 % de las solicitudes al historial de pedidos superaron el tiempo de espera. La causa fue que la función leía la tabla de pedidos completa en cada solicitud.

Para resolverlo, añadimos a la tabla un índice secundario global, de modo que cada solicitud lee solo los registros del cliente correspondiente. Aprovisionamos el índice mediante infraestructura como código (AWS CDK) y lo desplegamos el martes a las 11:20, sin interrupción del servicio. Con este cambio, la latencia del percentil 99 bajó de 2,4 s a 180 ms.

No fue necesario añadir servidores ni instancias: DynamoDB es un servicio administrado y su capacidad bajo demanda escala automáticamente.

Un detalle a tener en cuenta: las lecturas del índice tienen coherencia final (consistencia eventual), por lo que un pedido recién creado puede tardar uno o dos segundos en aparecer en el historial. No se pierde ningún dato.

El incidente no fue un problema de seguridad y no se expusieron datos de clientes. Le enviaremos el análisis posterior al incidente a más tardar el viernes.

Quedo a su disposición para cualquier consulta.

Atentamente,`,
    },

    // ---------- Lesson 2: the technical interview ----------
    {
      id: 'technical-interview',
      kind: 'read',
      title: both('The technical interview', 'La entrevista técnica'),
      minutes: 6,
      body: join(
        both(
          `**Why first.** In an interview in your second language, the hard part isn't knowing the answer: it's saying it without freezing on one word. Interviewers listen for structure (context, action, result) and for the words a colleague would use. Three questions come up in almost every cloud interview: *explain your architecture*, *how do you handle an incident?* and *what is serverless?* Prepare their vocabulary now:

- **managed service** (*servicio administrado*; *gestionado* is more common in Spain): AWS runs the servers, patching and scaling for you. Like renting an apartment where the landlord handles repairs: you live there, but you don't fix the plumbing.
- **bucket** (*bucket*, never *cubo*): where S3 stores objects. AWS's machine-translated Spanish S3 guide keeps *bucket de S3*.
- **encryption** (*cifrado*; *encriptar* out loud): how data is protected at rest and in transit.
- **log** (*registro*, *los logs*): your first stop in an incident. *Loguear* is writing to the log; *loguearse* is signing in.
- **hacker** (*atacante* in a report, *hacker* with the team; *pirata informático* is newspaper language): it almost always sounds criminal in Spanish, so in an interview talk about the attack itself: an *atacante* (attacker) and a *brecha de seguridad* (breach).
- **release** (*versión*, *lanzamiento*) and **pull** (*hacer pull*; VS Code's Spanish interface says *Incorporar cambios*, and Git's own translation keeps *pull*). A pull request isn't you pulling: it asks the reviewers to pull (merge) your changes into their branch.
- **requirement** (*requisito*; *requerimiento* is very common in Latin America).
- **edge case** (*caso límite*; *caso borde* in Latin America): the customer with no orders. Mentioning them shows experience.
- **array** (*array* at work; *arreglo* in Latin American classes, *vector* in Spain, *matriz* in translated docs).

For *explain your architecture*, go front to back: who calls what, where the data lives, one trade-off. If you blank on a word, describe it ("the index that lets you query by another key") and keep going.`,
          `**Primero, el porqué.** En una entrevista en tu segundo idioma, lo difícil no es saber la respuesta: es decirla sin bloquearte en una palabra. Quien entrevista escucha la estructura (contexto, acción, resultado) y las palabras que usaría un colega. Tres preguntas salen en casi cualquier entrevista de nube: *explícame tu arquitectura*, *¿cómo manejas un incidente?* y *¿qué es serverless?* Prepara ahora su vocabulario:

- **servicio administrado** (*managed service*; en España es más común *gestionado*): AWS se encarga de los servidores, los parches y el escalado. Como alquilar un apartamento en el que el dueño se encarga de las reparaciones: tú vives ahí, pero no arreglas nada.
- **bucket** (nunca *cubo*): donde S3 guarda los objetos. La guía de S3 en español de AWS, traducida automáticamente, dice *bucket de S3*.
- **cifrado** (*encryption*; al hablar, *encriptar*): cómo se protegen los datos en reposo y en tránsito.
- **registro** (*log*; *los logs*): lo primero que miras en un incidente. *Loguear* es escribir en el log; *loguearse*, iniciar sesión.
- **atacante** (*hacker*; con el equipo, *hacker*; *pirata informático* es lenguaje de prensa): en español casi siempre suena a delito, así que en una entrevista habla del ataque: un *atacante* y una *brecha de seguridad* (breach).
- **versión** o **lanzamiento** (*release*) y **hacer pull** (*pull*; la interfaz de VS Code en español dice *Incorporar cambios*, y la traducción de Git deja *pull*). En una pull request no haces pull tú: pides que se incorporen (fusionen) tus cambios en la rama de destino.
- **requisito** (*requirement*; en Latinoamérica es muy común *requerimiento*).
- **caso límite** (*edge case*; *caso borde* en Latinoamérica): el cliente sin pedidos. Mencionarlos demuestra experiencia.
- **array** (en el trabajo, *array*; *arreglo* en las clases de Latinoamérica, *vector* en España, *matriz* en la documentación traducida).

Para *explícame tu arquitectura*, ve del frontend a los datos: quién llama a quién, dónde están los datos y una desventaja. Si se te va una palabra, descríbela ("el índice que te deja consultar por otra clave") y sigue.`,
        ),
        termTable(INTERVIEW),
        traps(INTERVIEW),
        both(
          '**In short:** answer in three beats (context, action, result), use the words a colleague would use, and describe what you can\'t name.',
          '**En resumen:** responde en tres tiempos (contexto, acción, resultado), usa las palabras de un colega y describe lo que no sepas nombrar.',
        ),
      ),
    },
    {
      id: 'cards-interview',
      kind: 'cards',
      title: both('Review deck: the trickiest terms (2)', 'Mazo de repaso: los términos más traicioneros (2)'),
      minutes: 6,
      body: both(
        'Ten more terms, the ones interviews love. Say each one out loud in a full sentence about your own project before you flip.',
        'Diez términos más, los que más salen en las entrevistas. Antes de girar la tarjeta, di cada uno en voz alta en una frase completa sobre tu propio proyecto.',
      ),
      cards: cardsFor(INTERVIEW),
    },
    {
      id: 'write-serverless',
      kind: 'rewrite',
      title: both('Write it: "What is serverless?" in English', 'Escríbelo: "What is serverless?" en inglés'),
      minutes: 8,
      body: both(
        'The interview is in English. You drafted your answer in Spanish; now say it the way you would out loud: about a minute, first person, one example from your own work, and one honest trade-off. Watch the calques: *servicio administrado* is a *managed service* (not *administrated*), and a system *scales*, it doesn\'t *escalate*.',
        'La entrevista es en inglés. Preparaste la respuesta en español; ahora dila como la dirías en voz alta: un minuto más o menos, en primera persona, con un ejemplo de tu propio trabajo y una desventaja honesta. Cuidado con los calcos: *servicio administrado* es *managed service* (no *administrated*), y un sistema *scales*, no *escalates*.',
      ),
      target: 'en',
      source: `Mi respuesta a "What is serverless?":
- Serverless no significa que no haya servidores: existen, pero los administra AWS.
- Yo escribo el código (por ejemplo, una función de AWS Lambda) y AWS se encarga de aprovisionar, parchear y escalar.
- Escala automáticamente cuando sube el tráfico y escala a cero cuando nadie lo usa. Pago por solicitud y por el tiempo de ejecución, no por servidores parados.
- Ejemplo: en mi último proyecto, la API era API Gateway + Lambda + DynamoDB, y el frontend estaba en un bucket de S3 detrás de CloudFront. Todo servicios administrados.
- Desventaja: los arranques en frío. La primera solicitud a un entorno de ejecución nuevo es más lenta; si la latencia baja es un requisito estricto, lo mido y valoro la concurrencia aprovisionada.`,
      task: both(
        'Write your spoken answer in English: what serverless means (and what it doesn\'t), who manages what, how it scales and how you pay, an example from your work, and one trade-off.',
        'Escribe en inglés tu respuesta hablada: qué significa serverless (y qué no), quién administra qué, cómo escala y cómo se paga, un ejemplo de tu trabajo y una desventaja.',
      ),
      minWords: 60,
      mustUse: [
        { any: ['serverless'], label: 'serverless' },
        { any: ['managed', 'manages', 'manage', 'handles', 'handle', 'takes care', 'operat*', 'runs', 'run', 'responsib*', 'looks after'], label: 'managed service / AWS manages' },
        { any: ['scal*'], label: 'scales' },
        { any: ['pay*', 'bill*', 'charg*', 'cost*', 'pricing', 'price*'], label: 'pay per use' },
        { any: ['Lambda', 'API Gateway', 'DynamoDB', 'Fargate', 'Step Functions', 'S3'], label: 'an AWS example' },
        { any: ['cold start*', 'cold-start*', 'latenc*', 'trade-off*', 'tradeoff*', 'downside*', 'drawback*', 'limit*', 'timeout*', '15 minutes', 'lock-in', 'edge case*'], label: 'a trade-off (cold starts, latency)' },
      ],
      avoid: [
        {
          any: ['escalat*'],
          why: both(
            'A system *scales* (Spanish *escala*). *Escalate* is passing a problem to someone higher up.',
            'Un sistema *scales* (en español, *escala*). *Escalate* es pasarle un problema a alguien de más arriba.',
          ),
        },
        {
          any: ['administrated'],
          why: both(
            '*Servicio administrado* is a *managed service* in English. *Administrated* is a calque nobody uses in tech.',
            '*Servicio administrado* en inglés es *managed service*. *Administrated* es un calco que nadie usa en tecnología.',
          ),
        },
      ],
      model: `Serverless doesn't mean there are no servers. It means AWS manages them for me: I write the code, for example an AWS Lambda function, and AWS takes care of provisioning, patching and scaling. It scales out automatically when traffic grows and scales to zero when nobody uses it, and I pay per request and for the time my code runs, not for idle servers. In my last project the API was API Gateway, Lambda and DynamoDB, and the frontend was in an S3 bucket behind CloudFront: all managed services. The main trade-off is cold starts: the first request to a new execution environment is slower, so if low latency is a hard requirement, I measure it and consider provisioned concurrency.`,
    },
    {
      id: 'write-incident-answer',
      kind: 'rewrite',
      title: both('Write it: "¿Cómo manejas un incidente?" in Spanish', 'Escríbelo: "¿Cómo manejas un incidente?" en español'),
      minutes: 9,
      body: both(
        'Now the interview is in Spanish, for a team in Madrid and Bogotá. Your notes are in English. Answer in the first person, in order: detect, communicate, mitigate, and learn afterwards. Team words like *los logs* or *hacer rollback* are fine out loud. Word choice: in Spain *incidencia* is used for any ticket, minor or serious; *incidente* is understood everywhere and makes the severity clear.',
        'Ahora la entrevista es en español, para un equipo de Madrid y Bogotá. Tus notas están en inglés. Responde en primera persona y en orden: detectar, comunicar, mitigar y aprender después. Palabras de equipo como *los logs* o *hacer rollback* valen al hablar. Sobre la palabra: en España, *incidencia* se usa para cualquier ticket, leve o grave; *incidente* se entiende en todas partes y deja claro que es serio.',
      ),
      target: 'es',
      source: `How I handle an incident (notes for the interview):
1. Detect: a CloudWatch alarm pages the on-call engineer. I check dashboards and logs to confirm the impact: who is affected and since when.
2. Communicate: open an incident channel in Slack, name an incident lead, post updates every 30 minutes, and tell the client if they're affected.
3. Mitigate first, fix later: if a new release caused it, roll back to the previous version; if it's load, scale out.
4. Security incidents (a leaked key, a breach): revoke and rotate the credentials first, then check CloudTrail.
5. Afterwards: a blameless postmortem within a week, with the root cause and action items that have an owner and a date.`,
      task: both(
        'Write your spoken answer in Spanish: how you detect the incident, how you communicate it, how you mitigate it (rollback or scaling), what changes if it\'s a security incident, and what you do afterwards.',
        'Escribe en español tu respuesta hablada: cómo detectas el incidente, cómo lo comunicas, cómo lo mitigas (rollback o escalado), qué cambia si es un incidente de seguridad y qué haces después.',
      ),
      minWords: 60,
      mustUse: [
        { any: ['incidente*'], label: 'incidente' },
        { any: ['registro*', 'log', 'logs', 'CloudWatch'], label: 'registros / logs' },
        { any: ['alarma*', 'alerta*'], label: 'alarma / alerta' },
        { any: ['comunic*', 'avis*', 'inform*', 'actualiz*', 'novedad*', 'canal*', 'Slack'], label: 'comunicar' },
        { any: ['revert*', 'reviert*', 'rollback', 'roll back', 'version anterior', 'mitig*', 'deshac*'], label: 'revertir / rollback' },
        { any: ['analisis posterior', 'revision posterior', 'retrospectiva', 'retro', 'postmortem', 'post mortem', 'post-mortem', 'causa raiz', 'lecciones aprendidas'], label: 'análisis posterior al incidente' },
      ],
      avoid: [
        {
          any: ['eventualmente'],
          why: both(
            '*Eventualmente* means "possibly". If you mean *eventually*, say *al final* or *con el tiempo*.',
            '*Eventualmente* significa "quizás". Si quieres decir *eventually*, di *al final* o *con el tiempo*.',
          ),
        },
      ],
      model: `Primero, detectar: normalmente me entero por una alarma de CloudWatch que avisa a la persona de guardia. Reviso los paneles y los registros para confirmar el impacto: a quién afecta y desde cuándo.
Después, comunicar: abro un canal para el incidente en Slack, nombramos a una persona responsable y publicamos actualizaciones cada 30 minutos, también al cliente si le afecta.
Luego, mitigar antes de arreglar: si la causa es una versión nueva, volvemos a la versión anterior; si es un problema de carga, escalamos.
Si es un incidente de seguridad, como una clave filtrada o una brecha, lo primero es revocar y rotar las credenciales, y después revisar CloudTrail.
Al final, hacemos un análisis posterior al incidente sin buscar culpables, con la causa raíz y acciones que tienen responsable y fecha.`,
    },

    {
      id: 'write-architecture',
      kind: 'rewrite',
      title: both('Write it: "Explícame tu arquitectura" in Spanish', 'Escríbelo: "Explícame tu arquitectura" en español'),
      minutes: 8,
      body: both(
        'Same interview, same team in Madrid and Bogotá. Your notes are in English. Go front to back: who calls what, where the data lives, how it\'s deployed and watched, and one trade-off you accepted. Service names stay in English (*API Gateway*, *Lambda*, *DynamoDB*), and a bucket is a *bucket de S3*, as AWS\'s Spanish S3 guide says.',
        'La misma entrevista, con el mismo equipo de Madrid y Bogotá. Tus notas están en inglés. Ve del frontend a los datos: quién llama a quién, dónde están los datos, cómo se despliega y se vigila, y una desventaja que aceptaste. Los nombres de los servicios se quedan en inglés (*API Gateway*, *Lambda*, *DynamoDB*), y un bucket es un *bucket de S3*, como dice la guía de S3 en español de AWS.',
      ),
      target: 'es',
      source: `My answer to "Explain your architecture" (my last project, order tracking):
- Front to back: the React frontend is static files in an S3 bucket, served through CloudFront.
- The browser calls API Gateway, which invokes Lambda functions (Node.js).
- Data lives in DynamoDB: one Orders table plus the byCustomer GSI to query one customer's orders.
- All the infrastructure is code in AWS CDK, deployed by a CI pipeline.
- Observability: CloudWatch logs, plus alarms on errors and p99 latency.
- Security: one IAM role per function with least privilege; encryption at rest is on by default in S3 and DynamoDB.
- Why: everything is a managed service, so nobody patches servers and we pay for what we use.
- Trade-off: DynamoDB needs its access patterns designed up front; a new kind of query can mean a new index.`,
      task: both(
        'Write your spoken answer in Spanish: the components front to back (frontend, API, functions, data), how the infrastructure is deployed, logs and alarms, security, why managed services, and one trade-off.',
        'Escribe en español tu respuesta hablada: los componentes del frontend a los datos (frontend, API, funciones, datos), cómo se despliega la infraestructura, registros y alarmas, seguridad, por qué servicios administrados y una desventaja.',
      ),
      minWords: 60,
      mustUse: [
        { any: ['arquitectura*', 'component*'], label: 'arquitectura / componentes' },
        { any: ['API Gateway'], label: 'API Gateway' },
        { any: ['Lambda', 'funcion*'], label: 'Lambda / funciones' },
        { any: ['DynamoDB', 'tabla*', 'base de datos', 'bases de datos'], label: 'DynamoDB / la tabla' },
        { any: ['bucket*', 'S3'], label: 'bucket de S3' },
        { any: ['administrad*', 'gestionad*', 'serverless', 'sin servidor'], label: 'servicios administrados / serverless' },
      ],
      avoid: [
        {
          any: ['cubo*'],
          why: both(
            'A bucket stays *bucket* in Spanish; AWS\'s Spanish S3 guide says *bucket de S3*.',
            'Un bucket se queda en *bucket*; la guía de S3 en español de AWS dice *bucket de S3*.',
          ),
        },
        {
          any: ['librer*'],
          why: both(
            '*Library* is *biblioteca*. *Librería* is common in the office, but in an interview *biblioteca* sounds more careful.',
            '*Library* es *biblioteca*. *Librería* se oye mucho en la oficina, pero en una entrevista *biblioteca* suena más cuidado.',
          ),
        },
      ],
      model: `Nuestra arquitectura es serverless, y te la explico del frontend a los datos. El frontend es una aplicación React: archivos estáticos en un bucket de S3, servidos a través de CloudFront. El navegador llama a API Gateway, que invoca funciones Lambda en Node.js. Los datos están en DynamoDB: una tabla Orders y un índice secundario global, byCustomer, para consultar los pedidos de un cliente sin leer toda la tabla.
Toda la infraestructura es código en AWS CDK, y la despliega un pipeline de CI. Para vigilarla usamos los registros de CloudWatch y alarmas de errores y de latencia p99. En seguridad, cada función tiene su rol de IAM con privilegios mínimos, y el cifrado en reposo viene activado de forma predeterminada en S3 y en DynamoDB.
Elegimos servicios administrados para no parchear servidores y pagar solo por lo que usamos. La desventaja es que en DynamoDB hay que diseñar los patrones de acceso desde el principio: un tipo de consulta nuevo puede exigir un índice nuevo.`,
    },

    // ---------- Check ----------
    {
      id: 'quiz-final',
      kind: 'quiz',
      title: both('Final check', 'Comprobación final'),
      minutes: 7,
      questions: [
        {
          q: both(
            'Which is the best subject line for the commit in this module?',
            '¿Cuál es la mejor línea de asunto para el commit de este módulo?',
          ),
          options: [
            'Add byCustomer GSI and query it instead of scanning',
            'Added a GSI because the page was slow',
            'Se añadió un índice a la tabla Orders',
            'fix',
          ],
          answer: 0,
          explain: both(
            'The usual convention, also in Git\'s own contribution guidelines, is the imperative mood ("Add", as in "this commit will add…"), short, and in the repo\'s language. "Added" is common but breaks the convention, Spanish doesn\'t fit an English repo, and "fix" says nothing.',
            'La convención habitual, también en las guías para contribuir al propio Git, es el imperativo ("Add", como en "este commit añadirá…"), breve y en el idioma del repo. "Added" es frecuente pero rompe la convención, el español no encaja en un repo en inglés y "fix" no dice nada.',
          ),
        },
        {
          q: both(
            'You have to tell the client, in Spanish, that GSI reads are eventually consistent. Which sentence is clearest?',
            'Tienes que decirle al cliente, en español, que las lecturas del GSI son eventually consistent. ¿Qué frase es la más clara?',
          ),
          options: [
            'Las lecturas del índice son eventualmente consistentes.',
            'Las lecturas del índice tienen coherencia final: un pedido nuevo puede tardar uno o dos segundos en aparecer.',
            'Las lecturas del índice son actualmente consistentes.',
            'Las lecturas del índice a veces son consistentes.',
          ],
          answer: 1,
          explain: both(
            'A Spanish reader takes *eventualmente* as "possibly" and *actualmente* as "now", so both say something else. "Sometimes consistent" sounds like a bug. *Coherencia final* plus the delay in plain words is right: DynamoDB global secondary indexes only support eventually consistent reads.',
            'Quien lee en español entiende *eventualmente* como "quizás" y *actualmente* como "ahora", así que las dos dicen otra cosa. "A veces son consistentes" suena a bug. *Coherencia final* más el retraso en palabras sencillas es lo correcto: los índices secundarios globales de DynamoDB solo admiten lecturas de consistencia eventual.',
          ),
        },
        {
          q: both(
            'Your Spanish notes say "No hizo falta escalar, el índice bastó." How do you put it in the English Slack update?',
            'Tus notas en español dicen "No hizo falta escalar, el índice bastó." ¿Cómo lo pones en el aviso de Slack en inglés?',
          ),
          options: [
            "We didn't need to escalate; the index was enough.",
            "We didn't need to scale; the index was enough.",
            "We didn't need to climb; the index was enough.",
            "Eventually we didn't scale; the index was enough.",
          ],
          answer: 1,
          explain: both(
            'Here *escalar* is about the system, so it\'s *scale*. *Escalate* would mean no one had to pass the problem to a manager, which is a different message. *Eventually* adds an "in the end" the notes don\'t have.',
            'Aquí *escalar* habla del sistema, así que es *scale*. *Escalate* significaría que nadie tuvo que pasarle el problema a un superior, que es otro mensaje. *Eventually* añade un "al final" que las notas no tienen.',
          ),
        },
        {
          q: both(
            'Which sentence fits a formal email to the client?',
            '¿Qué frase encaja en un correo formal al cliente?',
          ),
          options: [
            'Levantamos el índice con CDK.',
            'Provisionamos el índice con CDK.',
            'Aprovisionamos el índice mediante AWS CDK.',
            'Deployamos el índice con CDK.',
          ],
          answer: 2,
          explain: both(
            '*Aprovisionar* is the most established form in a formal document. *Provisionar* is a very common calque, and *levantar* and *deployar* are team talk.',
            '*Aprovisionar* es la forma más asentada en un documento formal. *Provisionar* es un calco muy extendido, y *levantar* y *deployar* son lenguaje de equipo.',
          ),
        },
        {
          q: both(
            'In an English interview: "What\'s your release process?" Your Spanish notes say "hacemos pull de main, abrimos una PR y sacamos la versión". Which answer sounds natural?',
            'En una entrevista en inglés: "What\'s your release process?" Tus notas en español dicen "hacemos pull de main, abrimos una PR y sacamos la versión". ¿Qué respuesta suena natural?',
          ),
          options: [
            'We pull main, open a pull request, and we ship the release.',
            'We pull main, open a pull request, and we liberate the version.',
            'We download main, open a pull request, and we relieve the version.',
            'We pull main, open a pull request, and we take out the version.',
          ],
          answer: 0,
          explain: both(
            'In English you *ship the release* or *cut a release*. *Liberate*, *relieve* and *take out* are word-for-word copies of *liberar*, *relevar* and *sacar*.',
            'En inglés se dice *ship the release* o *cut a release*. *Liberate*, *relieve* y *take out* son copias palabra por palabra de *liberar*, *relevar* y *sacar*.',
          ),
        },
        {
          q: both(
            'A teammate in Madrid asks: "¿Puedes mirar la incidencia 482?" What is it most likely?',
            'Un compañero de Madrid te pregunta: "¿Puedes mirar la incidencia 482?" ¿Qué es lo más probable?',
          ),
          options: [
            both('A ticket in the issue tracker', 'Un ticket en el gestor de tareas'),
            both('A major production outage', 'Una caída grave en producción'),
            both('A security breach by a hacker', 'Una brecha de seguridad causada por un hacker'),
            both('An incidental expense on the AWS bill', 'Un gasto imprevisto en la factura de AWS'),
          ],
          answer: 0,
          explain: both(
            'In Spain *incidencia* is the everyday word for any ticket in the tracker, minor or serious; *incidente* (incident) makes it clear that production is in trouble. It\'s a regional tendency, not a rule, so if in doubt, ask how serious it is.',
            'En España, *incidencia* es la palabra de todos los días para cualquier ticket del gestor, leve o grave; *incidente* (incident) deja claro que hay un problema serio en producción. Es una tendencia regional, no una regla: si tienes dudas, pregunta por su gravedad.',
          ),
        },
        {
          q: both(
            'In a Spanish interview you say "Lo primero que hago es loguearme y revisar los logs." What does *loguearme* mean?',
            'En una entrevista en español dices "Lo primero que hago es loguearme y revisar los logs." ¿Qué significa *loguearme*?',
          ),
          options: [
            both('Sign in', 'Iniciar sesión'),
            both('Write to the log', 'Escribir en el log'),
            both('Delete the logs', 'Borrar los logs'),
            both('Download the logs', 'Descargar los logs'),
          ],
          answer: 0,
          explain: both(
            '*Loguearse* (reflexive) is to sign in; *loguear* is to write to the log. In a formal answer, *iniciar sesión* and *registrar* avoid the confusion.',
            '*Loguearse* (con pronombre) es iniciar sesión; *loguear* es escribir en el log. En una respuesta formal, *iniciar sesión* y *registrar* evitan la confusión.',
          ),
        },
      ],
    },
  ],
};

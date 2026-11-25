// Module 0: Start here. Why tech Spanish mixes English, the three registers,
// and Spain vs Latin America. Free, short, before the vocabulary modules.
import { both, join } from '../../../engine/i18n';
import { termTable, traps, cardsFor } from '../glossary';

const LESSON_1 = ['deploy', 'merge', 'push', 'api', 'vpc', 'lambda-function', 'query'];
const LESSON_2 = ['library', 'eventually-ff'];
const LESSON_3 = ['environment', 'monitoring', 'requirement', 'run-execute'];

export default {
  slug: 'start-here',
  number: 0,
  free: true,
  title: both('Start here', 'Empieza aquí'),
  situation: both(
    'Your team is split between Madrid and Bogotá. In Slack, Lucía writes: "ya mergeé la PR del checkout, lo deployamos el jueves a prod después de la daily. si la lambda falla hacemos rollback y listo 👍". Everyone understands. Then your manager asks you to tell the client the same thing in a formal email, and the person reading it is the client\'s IT lead in Mexico City. Same news, different words.',
    'Tu equipo está repartido entre Madrid y Bogotá. En Slack, Lucía escribe: "ya mergeé la PR del checkout, lo deployamos el jueves a prod después de la daily. si la lambda falla hacemos rollback y listo 👍". Todo el mundo lo entiende. Luego tu jefa te pide que le cuentes lo mismo al cliente en un correo formal, y quien lo va a leer es el responsable de TI del cliente en Ciudad de México. La misma noticia, otras palabras.',
  ),
  overview: both(
    'Before the vocabulary modules, three ideas that make the rest easier: why tech Spanish is full of English (and why one command can have three translations), the three registers you switch between every day (formal document, with the team, slang), and which differences between Spain and Latin America matter and which don\'t. Then you turn Lucía\'s Slack message into a note for the client and check yourself with a short quiz.',
    'Antes de los módulos de vocabulario, tres ideas que facilitan todo lo demás: por qué el español técnico está lleno de inglés (y por qué un mismo comando puede tener tres traducciones), los tres registros entre los que cambias cada día (documento formal, con el equipo, jerga) y qué diferencias entre España y Latinoamérica importan y cuáles no. Después conviertes el mensaje de Slack de Lucía en una nota para el cliente y te pones a prueba con un cuestionario breve.',
  ),
  level: both('Beginner', 'Principiante'),
  hours: 0.5,
  skills: ['deploy', 'merge', 'library', 'environment'],
  steps: [
    // ---------- Lesson 1 ----------
    {
      id: 'why-english',
      kind: 'read',
      title: both('Why tech Spanish mixes English', 'Por qué el español técnico mezcla inglés'),
      minutes: 4,
      body: join(
        both(
          '**Why first.** Almost every tool you use at work, from Git to AWS, got its name in English first. Spanish-speaking teams had to talk about these tools long before anyone agreed on a translation. So three things happened at once: some words were translated, some were borrowed as they are, and some were turned into Spanish verbs.',
          '**Primero, el porqué.** Casi todas las herramientas que usas en el trabajo, de Git a AWS, recibieron su nombre primero en inglés. Los equipos hispanohablantes tuvieron que hablar de ellas mucho antes de que nadie se pusiera de acuerdo en una traducción. Así que pasaron tres cosas a la vez: algunas palabras se tradujeron, otras se tomaron tal cual y otras se convirtieron en verbos españoles.',
        ),
        both(
          '**One command, three translations.** `git push` sends the commits you made locally to the shared remote repository. GitHub\'s Spanish glossary (2022) calls it *subir*. VS Code\'s Spanish interface labels it *Insertar*. Git\'s own Spanish messages say *empujar* (`Empujando a origin…`), though they keep a few words in English (*hacer commit*, *hacer pull*). None of them is wrong: they are three teams\' choices. At work you\'ll mostly hear *subir*, *hacer push* and *pushear*.',
          '**Un comando, tres traducciones.** `git push` envía los commits que hiciste en local al repositorio remoto compartido. El glosario en español de GitHub (2022) lo llama *subir*. La interfaz en español de VS Code lo llama *Insertar*. Los mensajes en español del propio Git dicen *empujar* (`Empujando a origin…`), aunque dejan algunas palabras en inglés (*hacer commit*, *hacer pull*). Ninguna está mal: son decisiones de tres equipos distintos. En el trabajo oirás sobre todo *subir*, *hacer push* y *pushear*.',
        ),
        both(
          '**The -ear factory.** Add *-ear* (sometimes just *-ar*) to an English verb and you get a regular Spanish verb: *mergear*, *pushear*, *deployar* (also heard as *deployear*). They conjugate like any other (*ya lo mergeé*, *¿lo deployamos?*). Natural with the team, out of place in a contract.',
          '**La fábrica del -ear.** Añade *-ear* (a veces solo *-ar*) a un verbo inglés y tienes un verbo español regular: *mergear*, *pushear*, *deployar* (también se oye *deployear*). Se conjugan como cualquier otro (*ya lo mergeé*, *¿lo deployamos?*). Naturales con el equipo, fuera de lugar en un contrato.',
        ),
        both(
          '**Borrowed gender.** English nouns have no gender, so a borrowed noun usually takes the gender of the Spanish word people have in mind: *la API* (la interfaz), *la VPC* (la nube privada virtual), *la Lambda* (la función), *la query* (la consulta). Think of a guest who takes the seat already reserved for the Spanish word. When two Spanish words fit, both genders appear: *la PR* (la solicitud) and *el PR* (el pull request) are both common.',
          '**Género prestado.** Los sustantivos ingleses no tienen género, así que el préstamo suele tomar el de la palabra española que la gente tiene en mente: *la API* (la interfaz), *la VPC* (la nube privada virtual), *la Lambda* (la función), *la query* (la consulta). Piensa en un invitado que ocupa el asiento reservado para la palabra española. Cuando encajan dos palabras españolas, se oyen los dos géneros: *la PR* (la solicitud) y *el PR* (el pull request).',
        ),
        termTable(LESSON_1),
        traps(LESSON_1),
        both(
          '**In short:** tech Spanish borrows, translates and invents verbs at the same time, so expect several right answers for one English word, and give a borrowed noun the gender of its Spanish equivalent.',
          '**En resumen:** el español técnico toma prestado, traduce e inventa verbos a la vez, así que espera varias respuestas correctas para una palabra inglesa, y dale al préstamo el género de su equivalente en español.',
        ),
      ),
    },
    {
      id: 'cards-borrowed',
      kind: 'cards',
      title: both('Flashcards: borrowed words', 'Tarjetas: palabras prestadas'),
      minutes: 4,
      body: both(
        'Seven words you will hear in your first week: say the Spanish (and, for nouns, the gender) before you flip.',
        'Siete palabras que oirás en tu primera semana: di el español (y, si es un sustantivo, su género) antes de darle la vuelta a la tarjeta.',
      ),
      cards: cardsFor(LESSON_1),
    },

    // ---------- Lesson 2 ----------
    {
      id: 'three-registers',
      kind: 'read',
      title: both('The three registers', 'Los tres registros'),
      minutes: 4,
      body: join(
        both(
          '**Why first.** The same team says the same thing three ways in one day. "Lo subo a prod" in a DM, "¿hacemos el deploy?" in stand-up, "desplegaremos la versión 2.3" in the client email. Use the wrong one and you sound either stiff with your team or careless with the client.',
          '**Primero, el porqué.** El mismo equipo dice lo mismo de tres maneras en un solo día. "Lo subo a prod" por mensaje directo, "¿hacemos el deploy?" en la daily, "desplegaremos la versión 2.3" en el correo al cliente. Si eliges mal, suenas rígido con tu equipo o descuidado con el cliente.',
        ),
        both(
          'A **register** is the level of formality of your words. This course uses three. **Formal document**: contracts, client emails, design docs, runbooks, release notes; Spanish words where they exist (*desplegar*, *biblioteca*, *consulta*). **With the team**: Slack, stand-ups, PR comments; English mixed in (*hacer el deploy*, *la query*). **Slang**: quick messages between close teammates (*subir a prod*, *la lib*, *el env*). Registers work like clothes: a suit for the client meeting, jeans at the office, a hoodie at the hackathon. None is better; each fits a place.',
          'Un **registro** es el nivel de formalidad de tus palabras. Este curso usa tres. **Documento formal**: contratos, correos a clientes, documentos de diseño, manuales de operaciones, notas de versión; palabras en español donde existen (*desplegar*, *biblioteca*, *consulta*). **Con el equipo**: Slack, la daily, comentarios en las PR; con inglés mezclado (*hacer el deploy*, *la query*). **Jerga**: mensajes rápidos entre compañeros de confianza (*subir a prod*, *la lib*, *el env*). Los registros son como la ropa: traje para la reunión con el cliente, jeans en la oficina, sudadera con capucha en la hackatón. Ninguno es mejor; cada uno tiene su sitio.',
        ),
        both(
          '**How to pick:** ask who reads it and whether it will be kept or forwarded. If it might reach a client or an auditor, go formal. **One form per document:** AWS\'s Spanish docs (machine-translated) mostly say *implementación* but also *despliegue*, sometimes on the same page. Both are correct; in your document, pick one and keep it.',
          '**Cómo elegir:** pregúntate quién lo va a leer y si se va a guardar o reenviar. Si puede llegar a un cliente o a un auditor, usa el registro formal. **Una sola forma por documento:** la documentación de AWS en español (traducida automáticamente) dice sobre todo *implementación*, pero también *despliegue*, a veces en la misma página. Las dos son correctas; en tu documento, elige una y mantenla.',
        ),
        both(
          '**Your first false friends.** A false friend looks like a translation and isn\'t. *Library* is *biblioteca*; *librería* is a bookstore (you\'ll hear it at work anyway). *Eventually* is *al final* or *con el tiempo*; *eventualmente* means "possibly". *Actually* is *en realidad*; *actualmente* means "currently".',
          '**Tus primeros falsos amigos.** Un falso amigo parece una traducción y no lo es. *Library* es *biblioteca*; *librería* es la tienda de libros (aunque en el trabajo la oirás igual). *Eventually* es *al final* o *con el tiempo*; *eventualmente* significa "quizás, si se da el caso". *Actually* es *en realidad*; *actualmente* significa "ahora".',
        ),
        termTable(LESSON_2),
        traps(LESSON_2),
        both(
          '**In short:** match the register to the reader (formal, team or slang), keep one form per document, and in anything formal write *biblioteca*, *al final* and *en realidad*, not *librería*, *eventualmente* or *actualmente*.',
          '**En resumen:** ajusta el registro a quien lee (formal, equipo o jerga), mantén una sola forma por documento y, en todo lo formal, escribe *biblioteca*, *al final* y *en realidad*, no *librería*, *eventualmente* ni *actualmente*.',
        ),
      ),
    },

    // ---------- Lesson 3 ----------
    {
      id: 'spain-latam',
      kind: 'read',
      title: both('Spain and Latin America without fear', 'España y Latinoamérica sin miedo'),
      minutes: 4,
      body: join(
        both(
          '**Why first.** One Slack channel can hold people from Madrid, Bogotá, Mexico City and Buenos Aires. You\'ll see two words for the same thing and wonder which one is "right". Usually both are: these are habits of each region, not rules.',
          '**Primero, el porqué.** En un mismo canal de Slack puede haber gente de Madrid, Bogotá, Ciudad de México y Buenos Aires. Verás dos palabras para lo mismo y te preguntarás cuál es la "correcta". Casi siempre lo son las dos: son costumbres de cada región, no reglas.',
        ),
        both(
          '**The pairs you\'ll meet first** (Spain / Latin America, as common usage): *ordenador / computadora* (computer; *computador* in Colombia and Chile), *entorno / ambiente* (environment, as in *entorno de pruebas*), *monitorizar / monitorear* (to monitor), *coste / costo* (cost), *requisito / requerimiento* (requirement), *ejecutar / correr* (to run a script; *correr* is common in Latin America but informal everywhere, so documents say *ejecutar*). Everyone understands both sides. It\'s like British and American English: *lift* and *elevator* both get you upstairs.',
          '**Los pares que verás primero** (España / Latinoamérica, como uso habitual): *ordenador / computadora* (computer; en Colombia y Chile, *computador*), *entorno / ambiente* (environment, como en *entorno de pruebas*), *monitorizar / monitorear* (to monitor), *coste / costo* (cost), *requisito / requerimiento* (requirement), *ejecutar / correr* (to run, un script; *correr* es habitual en Latinoamérica, pero informal en todas partes: en un documento, *ejecutar*). Todo el mundo entiende ambas formas. Es como el inglés británico y el estadounidense: *lift* y *elevator* te suben igual.',
        ),
        both(
          '**What does matter: numbers.** Spain and much of South America write decimals with a comma (*0,25 s*) and thousands with a point (*1.500*); Mexico and much of Central America and the Caribbean do the opposite, like English. In a cost report, *1.500* can mean fifteen hundred in Madrid and one and a half in Mexico. Spell out the unit and currency, and if in doubt, add a line saying which separator you use. A safe habit when your readers use both systems: group thousands with a space (*1 500*), or not at all for four digits (*1500*), and use the separator only for decimals.',
          '**Lo que sí importa: los números.** España y buena parte de Sudamérica escriben los decimales con coma (*0,25 s*) y los miles con punto (*1.500*); México y buena parte de Centroamérica y el Caribe hacen lo contrario, como en inglés. En un informe de costos, *1.500* puede ser mil quinientos en Madrid y uno y medio en México. Escribe la unidad y la moneda y, si hay duda, añade una línea que diga qué separador usas. Un hábito seguro cuando quienes te leen usan los dos sistemas: separa los miles con un espacio (*1 500*), o con nada si son cuatro cifras (*1500*), y deja el separador solo para los decimales.',
        ),
        both(
          '**How to choose:** follow your client\'s or company\'s style, and keep one form per document (the same rule as registers).',
          '**Cómo elegir:** sigue el estilo de tu cliente o de tu empresa y mantén una sola forma por documento (la misma regla que con los registros).',
        ),
        termTable(LESSON_3),
        traps(LESSON_3),
        both(
          '**In short:** regional words are habits, not mistakes; pick the one your reader uses and stay consistent, and be careful with decimal commas and points in anything with numbers.',
          '**En resumen:** las palabras regionales son costumbres, no errores; elige la que usa quien te lee y sé coherente, y cuidado con la coma y el punto decimales en todo lo que lleve números.',
        ),
      ),
    },
    {
      id: 'cards-registers-regions',
      kind: 'cards',
      title: both('Flashcards: false friends and regional words', 'Tarjetas: falsos amigos y palabras regionales'),
      minutes: 3,
      body: both(
        'Your first false friends (library, eventually, actually) and four words that change between Spain and Latin America.',
        'Tus primeros falsos amigos (library, eventually, actually) y cuatro palabras que cambian entre España y Latinoamérica.',
      ),
      cards: cardsFor([...LESSON_2, ...LESSON_3]),
    },

    // ---------- Practice ----------
    {
      id: 'pick-register',
      kind: 'register',
      title: both('Formal, team or slang?', '¿Formal, equipo o jerga?'),
      minutes: 4,
      body: both(
        'Eight phrases from everyday work situations, in both languages. Decide where each one fits best.',
        'Ocho frases de situaciones de trabajo cotidianas, en los dos idiomas. Decide dónde encaja mejor cada una.',
      ),
      items: [
        {
          text: 'Mañana desplegaremos la nueva versión de la API en el entorno de producción.',
          context: both('Email to a client', 'Correo a un cliente'),
          answer: 'formal',
          explain: both(
            '*Desplegar* and *entorno* are the formal forms in the glossary, and the full sentence (future tense, no slang) suits a client.',
            '*Desplegar* y *entorno* son las formas formales del glosario, y la frase completa (futuro, sin jerga) es la adecuada para un cliente.',
          ),
        },
        {
          text: '¿Puedes hacer el deploy de la Lambda después de la daily?',
          context: both('Team Slack channel', 'Canal de Slack del equipo'),
          answer: 'team',
          explain: both(
            '*Hacer el deploy* and *la Lambda* are what teams say every day. In a document you\'d write *desplegar la función de Lambda*.',
            '*Hacer el deploy* y *la Lambda* son lo que dicen los equipos a diario. En un documento escribirías *desplegar la función de Lambda*.',
          ),
        },
        {
          text: 'Lo subo a prod en cuanto pase el pipeline 🚀',
          context: both('Direct message to a teammate', 'Mensaje directo a un compañero'),
          answer: 'slang',
          explain: both(
            '*Subir a prod* is the slang form of deploy to production. Careful: in GitHub\'s glossary, *subir* on its own means push; *subir a prod* means deploy. Fine between teammates, never in a client email.',
            '*Subir a prod* es la forma de jerga de desplegar en producción. Ojo: en el glosario de GitHub, *subir* a secas es push; *subir a prod* es desplegar. Bien entre compañeros, nunca en un correo a un cliente.',
          ),
        },
        {
          text: 'Usamos la librería boto3 para hablar con S3.',
          context: both('Reply in a team thread', 'Respuesta en un hilo del equipo'),
          answer: 'team',
          explain: both(
            '*Librería* is what you hear at the office, so it fits the team. It\'s still a false friend: in a document, write *biblioteca*.',
            '*Librería* es lo que se oye en la oficina, así que encaja con el equipo. Sigue siendo un falso amigo: en un documento, escribe *biblioteca*.',
          ),
        },
        {
          text: 'Corre los tests en el env de staging y me avisas.',
          context: both('Quick DM', 'Mensaje rápido'),
          answer: 'slang',
          explain: both(
            '*El env* is slang for *el entorno*: that is what makes this slang. *Correr* is everyday Latin American usage for run, but informal (Spain prefers *ejecutar*). A runbook would say *Ejecutar las pruebas en el entorno de preproducción (staging)*.',
            '*El env* es jerga para *el entorno*: eso es lo que lo vuelve jerga. *Correr* es lo habitual en Latinoamérica para run, pero es informal (en España se prefiere *ejecutar*). Un manual de operaciones diría *Ejecutar las pruebas en el entorno de preproducción (staging)*.',
          ),
        },
        {
          text: 'El entorno de pruebas se supervisa con Amazon CloudWatch.',
          context: both('Operations runbook', 'Manual de operaciones (runbook)'),
          answer: 'formal',
          explain: both(
            '*Supervisar* and *entorno* are the formal forms (in Spain, *monitorizar* also works in a document). With the team, Latin Americans more often say *lo monitoreamos*.',
            '*Supervisar* y *entorno* son las formas formales (en España, *monitorizar* también vale en un documento). Con el equipo, en Latinoamérica se dice más *lo monitoreamos*.',
          ),
        },
        {
          text: 'Can you push your branch before stand-up? I\'ll merge it after lunch.',
          context: both('Team Slack, English-speaking team', 'Slack de un equipo que trabaja en inglés'),
          answer: 'team',
          explain: both(
            'Plain, friendly and direct: normal team English. In a formal report you\'d write *the changes were merged into the main branch*.',
            'Sencillo, amable y directo: inglés normal de equipo. En un informe formal escribirías *the changes were merged into the main branch*.',
          ),
        },
        {
          text: 'The update was deployed to the production environment on March 3 with no downtime.',
          context: both('Release notes for customers', 'Notas de versión para clientes'),
          answer: 'formal',
          explain: both(
            'Passive voice, full words (*production environment*, not *prod*) and an exact date: formal English for customers.',
            'Voz pasiva, palabras completas (*production environment*, no *prod*) y fecha exacta: inglés formal para clientes.',
          ),
        },
      ],
    },
    {
      id: 'slack-to-client',
      kind: 'rewrite',
      title: both('From Slack to the client', 'De Slack al cliente'),
      minutes: 6,
      target: 'es',
      source: 'ya mergeé la PR del checkout, lo deployamos el jueves a prod después de la daily. si la lambda falla hacemos rollback y listo 👍',
      task: both(
        'Rewrite Lucía\'s message as a short formal note in Spanish for the client: say that the pull request was merged, when the new version will be deployed to production, and what happens if something fails. Use formal verbs (*desplegar* or *implementar*, *fusionar* or *combinar*) and *solicitud de cambios* instead of *la PR*.',
        'Reescribe el mensaje de Lucía como una nota formal y breve en español para el cliente: di que se fusionó la solicitud de cambios, cuándo se desplegará la nueva versión en producción y qué pasa si algo falla. Usa verbos formales (*desplegar* o *implementar*, *fusionar* o *combinar*) y *solicitud de cambios* en lugar de *la PR*.',
      ),
      minWords: 30,
      mustUse: [
        { any: ['despleg*', 'desplieg*', 'implement*'], label: 'desplegar / implementar' },
        { any: ['fusion*', 'combin*', 'incorpor*', 'integramos', 'integrado', 'integrada', 'integraron', 'integro'], label: 'fusionar / combinar' },
        { any: ['solicitud de cambios', 'solicitud de cambio', 'solicitudes de cambios', 'solicitudes de cambio', 'solicitud de fusion', 'solicitudes de fusion', 'solicitud de extraccion', 'solicitud de incorporacion', 'pull request', 'pull requests'], label: 'solicitud de cambios' },
        { any: ['produccion'], label: 'producción' },
      ],
      avoid: [
        { any: ['deploy*'], why: both('*Deployar* is team talk. Write *desplegar* or *implementar*.', '*Deployar* es lenguaje de equipo. Escribe *desplegar* o *implementar*.') },
        { any: ['merge*', 'mergea*'], why: both('*Mergear* is team talk. Write *fusionar* or *combinar*.', '*Mergear* es lenguaje de equipo. Escribe *fusionar* o *combinar*.') },
        { any: ['pr', 'prs'], why: both('*La PR* is team talk. Write *solicitud de cambios*.', '*La PR* es lenguaje de equipo. Escribe *solicitud de cambios*.') },
        { any: ['prod'], why: both('*Prod* is slang. Write *producción* or *entorno de producción*.', '*Prod* es jerga. Escribe *producción* o *entorno de producción*.') },
        { any: ['rollback*'], why: both('*Hacer rollback* is team talk. Write *revertir a la versión anterior* or *volver a la versión anterior*.', '*Hacer rollback* es lenguaje de equipo. Escribe *revertir a la versión anterior* o *volver a la versión anterior*.') },
        { any: ['daily'], why: both('*La daily* is team talk. Write *la reunión diaria*, or just give a time.', '*La daily* es lenguaje de equipo. Escribe *la reunión diaria*, o da una hora.') },
        { any: ['the', 'we', 'will', 'and', 'to'], why: both('Write the note in Spanish.', 'Escribe la nota en español.') },
      ],
      model: 'Estimado equipo: Les informamos que fusionamos la solicitud de cambios del nuevo proceso de pago. Desplegaremos la nueva versión en el entorno de producción el jueves, después de nuestra reunión diaria. Si la función de Lambda presenta algún error, revertiremos de inmediato a la versión anterior. Quedamos a su disposición para cualquier consulta. Saludos cordiales.',
    },

    // ---------- Check ----------
    {
      id: 'quiz',
      kind: 'quiz',
      title: both('Check yourself', 'Ponte a prueba'),
      minutes: 4,
      questions: [
        {
          q: both(
            'In VS Code\'s Spanish interface, what is the `git push` command called?',
            'En la interfaz en español de VS Code, ¿cómo se llama el comando `git push`?',
          ),
          options: ['Subir', 'Insertar', 'Empujar', 'Enviar'],
          answer: 1,
          explain: both(
            'VS Code says *Insertar*. GitHub\'s Spanish glossary (2022) says *subir*, and Git\'s own messages say *empujar* (`Empujando a origin`). Three tools, three choices: that\'s why tech Spanish has more than one right answer.',
            'VS Code dice *Insertar*. El glosario en español de GitHub (2022) dice *subir*, y los mensajes del propio Git dicen *empujar* (`Empujando a origin`). Tres herramientas, tres decisiones: por eso el español técnico tiene más de una respuesta correcta.',
          ),
        },
        {
          q: both(
            'A teammate writes: "Eventualmente vamos a migrar a DynamoDB." In its usual Spanish meaning, what does *eventualmente* say?',
            'Un compañero escribe: "Eventualmente vamos a migrar a DynamoDB." Con su significado habitual en español, ¿qué dice *eventualmente*?',
          ),
          options: [
            both('That it might happen, if it comes up', 'Que quizás pase, si se da el caso'),
            both('That it will definitely happen in the end', 'Que pasará seguro, al final'),
            both('That it is happening right now', 'Que está pasando ahora mismo'),
            both('That it will never happen', 'Que no pasará nunca'),
          ],
          answer: 0,
          explain: both(
            '*Eventualmente* means "possibly". If you mean *eventually*, write *al final*, *finalmente* or *con el tiempo*. Many people in tech use it as a calque of *eventually*, so ask when it matters.',
            '*Eventualmente* significa "quizás, si se da el caso". Si quieres decir *eventually*, escribe *al final*, *finalmente* o *con el tiempo*. Mucha gente en tecnología lo usa como calco de *eventually*: si importa, pregunta.',
          ),
        },
        {
          q: both(
            'You\'re writing a design doc in Spanish about boto3. Which word for *library* fits?',
            'Escribes un documento de diseño en español sobre boto3. ¿Qué palabra para *library* encaja?',
          ),
          options: ['biblioteca', 'librería', 'lib', 'library'],
          answer: 0,
          explain: both(
            '*Biblioteca* is the formal form. *Librería* (a bookstore) is a false friend you\'ll hear in the office, and *lib* is slang.',
            '*Biblioteca* es la forma formal. *Librería* (la tienda de libros) es un falso amigo que oirás en la oficina, y *lib* es jerga.',
          ),
        },
        {
          q: both(
            'A colleague in Bogotá says "ambiente de pruebas"; one in Madrid says "entorno de pruebas". Who is right?',
            'Una compañera de Bogotá dice "ambiente de pruebas"; uno de Madrid dice "entorno de pruebas". ¿Quién tiene razón?',
          ),
          options: [
            both('Both: it\'s a regional habit', 'Los dos: es una costumbre regional'),
            both('Only Madrid: *ambiente* is a mistake', 'Solo Madrid: *ambiente* es un error'),
            both('Only Bogotá: *entorno* is outdated', 'Solo Bogotá: *entorno* está anticuado'),
            both('Neither: you must say *staging*', 'Ninguno: hay que decir *staging*'),
          ],
          answer: 0,
          explain: both(
            '*Entorno* is usual in Spain and *ambiente* is very common in Latin America. Both are understood: follow your reader\'s style and keep one form per document.',
            '*Entorno* es lo habitual en España y *ambiente* es muy común en Latinoamérica. Las dos se entienden: sigue el estilo de quien te lee y mantén una sola forma por documento.',
          ),
        },
        {
          q: both(
            'Paragraph 1 of your client report says *desplegar*. What should paragraph 4 say?',
            'El párrafo 1 de tu informe para el cliente dice *desplegar*. ¿Qué debería decir el párrafo 4?',
          ),
          options: [
            both('*Desplegar* again', '*Desplegar* otra vez'),
            both('*Implementar*, to avoid repetition', '*Implementar*, para no repetir'),
            both('*Deployar*, since everyone says it', '*Deployar*, porque todo el mundo lo dice'),
            both('*Hacer el deploy*', '*Hacer el deploy*'),
          ],
          answer: 0,
          explain: both(
            '*Desplegar* and *implementar* are both correct (AWS\'s machine-translated Spanish docs use both), but switching makes a reader wonder whether they are two different things. One form per document. *Deployar* and *hacer el deploy* are team talk.',
            '*Desplegar* e *implementar* son correctas (la documentación de AWS en español, traducida automáticamente, usa las dos), pero cambiar hace que quien lee se pregunte si son dos cosas distintas. Una sola forma por documento. *Deployar* y *hacer el deploy* son lenguaje de equipo.',
          ),
        },
        {
          q: both(
            'A cost report from your Madrid office says "la factura de S3 de octubre fue de 1.500 €". How do you write the amount for the US team?',
            'Un informe de costos de la oficina de Madrid dice "la factura de S3 de octubre fue de 1.500 €". ¿Cómo escribes la cifra para el equipo de EE. UU.?',
          ),
          options: ['€1,500', '€1.500', '€1.5', '€15,000'],
          answer: 0,
          explain: both(
            'In Spain the point groups thousands, so 1.500 € is fifteen hundred euros. In English (and in Mexico) the comma groups thousands and the point marks decimals: €1,500. Copying "1.500" as is would read as one and a half.',
            'En España el punto separa los miles, así que 1.500 € son mil quinientos euros. En inglés (y en México) los miles van con coma y los decimales con punto: €1,500. Copiar "1.500" tal cual se leería como uno y medio.',
          ),
        },
      ],
    },
  ],
};

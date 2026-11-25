// Module 2: Talking about code.
// Lessons: types and structures (the matriz trap); functions and flow (cachear =
// catch or cache); the ecosystem (librería, the false friend); async out loud,
// reading code aloud in a review. Translations come from the glossary
// (termTable, traps, cardsFor); nothing here is presented as an "official"
// translation, because sources.mjs backs none of these terms.
import { both, join } from '../../../engine/i18n';
import { termTable, traps, cardsFor } from '../glossary';

const TYPES = ['string', 'array', 'list', 'integer', 'boolean', 'object', 'class', 'variable', 'constant', 'type'];
const FLOW = ['function', 'method', 'parameter', 'return', 'loop', 'exception', 'comment', 'syntax', 'compile', 'run-execute', 'script'];
const ECOSYSTEM = ['framework', 'library', 'dependency', 'package', 'module', 'import', 'sdk', 'api', 'endpoint', 'request-response', 'runtime', 'linter'];
const ASYNC = ['callback', 'promise', 'async'];

export default {
  slug: 'talking-code',
  number: 2,
  free: false,
  title: both('Talking about code', 'Hablar de código'),
  situation: both(
    'Your team in Monterrey and Valencia builds the backend for a study app: Lambda functions in Node.js, DynamoDB, an API in front. Pull requests are reviewed in English, because half the reviewers are in Seattle, but the daily stand-up is in Spanish. Today Diego joins the team and asks you to explain the `getProgress` handler in Spanish. Then, on a call about Sam\'s pull request, Marta says "aquí falta cachear la excepción", and Sam asks: "Wait, what are we caching?"',
    'Tu equipo de Monterrey y Valencia construye el backend de una app de estudio: funciones Lambda en Node.js, DynamoDB y una API delante. Las pull requests se revisan en inglés, porque la mitad de quienes revisan están en Seattle, pero la daily es en español. Hoy entra Diego al equipo y te pide que le expliques en español el handler `getProgress`. Luego, en una llamada sobre la pull request de Sam, Marta dice "aquí falta cachear la excepción", y Sam pregunta: "Wait, what are we caching?"',
  ),
  overview: both(
    'Code reviews, stand-ups and docs are full of the same few dozen words: types, functions, exceptions, libraries, promises. Most look alike in both languages, and that is exactly where the traps hide: *matriz* is not always a matrix, *cachear* can mean catch or cache, and *librería* is a bookstore. In four short lessons you learn the words in three registers, how to read code aloud in either language, and then you write two real texts: a Spanish explanation of a Lambda handler and an English review comment about a missing `await`.',
    'Las revisiones de código, las dailies y la documentación giran en torno a unas pocas docenas de palabras que se repiten: tipos, funciones, excepciones, bibliotecas, promesas. Casi todas se parecen en los dos idiomas, y ahí es justo donde se esconden las trampas: *matriz* no siempre es una matriz, *cachear* puede ser catch o cache, y *librería* es una tienda de libros. En cuatro lecciones cortas aprendes las palabras en tres registros y a leer código en voz alta en cualquiera de los dos idiomas, y después escribes dos textos reales: una explicación en español de un handler de Lambda y un comentario de revisión en inglés sobre un `await` que falta.',
  ),
  level: both('Beginner', 'Principiante'),
  hours: 1,
  skills: ['array', 'exception', 'library', 'promise', 'async'],
  steps: [
    // ---------- Lesson 1: types and structures ----------
    {
      id: 'types-structures',
      kind: 'read',
      title: both('Types and structures', 'Tipos y estructuras'),
      minutes: 6,
      body: join(
        both(
          '**Why first.** Half the comments in a code review are about data: "this should be an integer", "that array can be empty", "make it a constant". Without these words ready, you end up pointing at the screen. The good news: most of them are near-twins in both languages.',
          '**Primero, el porqué.** La mitad de los comentarios de una revisión de código hablan de datos: "esto debería ser un entero", "ese array puede venir vacío", "hazlo constante". Si no tienes estas palabras a mano, acabas señalando la pantalla. La buena noticia: casi todas son gemelas en los dos idiomas.',
        ),
        both(
          '**The basic types.** A **string** is text: an ARN, a bucket name, an email. In Spanish it\'s *una cadena (de caracteres)*, and at work also *un string*, masculine. An **integer** (*número entero*, *un int*) is a whole number, like a port. A **boolean** (*booleano*) is true or false. A **variable** (*la variable*) holds a value that can change; a **constant** (*constante*) doesn\'t change once set. The **type** (*tipo de datos*) says what kind of value it is; a statically typed (*con tipado estático*) language like TypeScript checks it for you.',
          '**Los tipos básicos.** Un **string** es texto: un ARN, el nombre de un bucket, un correo. En español es *una cadena (de caracteres)*, y en el trabajo también *un string*, en masculino. Un **integer** (*número entero*, *un int*) es un número sin decimales, como un puerto. Un **boolean** (*booleano*) es verdadero o falso. Una **variable** guarda un valor que puede cambiar; una **constante** (*constant*) no cambia una vez asignada. El **tipo** (*tipo de datos*) dice qué clase de valor es; un lenguaje con **tipado** estático, como TypeScript, lo comprueba por ti.',
        ),
        both(
          '**Collections and the matriz trap.** An **array** holds values in order, like a set of instance IDs; Python\'s version is the **list** (*lista*). Spanish has several words for array: *arreglo* (common in Latin American classes), *vector* (frequent in Spain, also used elsewhere) and, in translated documentation, *matriz*. In math a *matriz* is a 2D grid, but "devuelve una matriz de cadenas" in a translated doc just means "returns an array of strings".',
          '**Colecciones y la trampa de la matriz.** Un **array** guarda valores en orden, como un conjunto de IDs de instancias; en Python se llama **lista** (*list*). El español tiene varias palabras para array: *arreglo* (habitual en las clases en Latinoamérica), *vector* (frecuente en España, aunque también se usa en otros países) y, en documentación traducida, *matriz*. En matemáticas una *matriz* es una tabla de dos dimensiones, pero "devuelve una matriz de cadenas" en un documento traducido solo significa "devuelve un array de strings".',
        ),
        both(
          '**Objects and classes.** An **object** (*objeto*) groups named values: the Lambda event is a JSON object. A **class** (*clase*) is the blueprint for objects. Think of a cookie cutter and the cookies: one shape, many cookies. In CDK, your stack is a class, and each stack you create with `new` is an object.',
          '**Objetos y clases.** Un **objeto** (*object*) agrupa valores con nombre: el evento de Lambda es un objeto JSON. Una **clase** (*class*) es el molde de los objetos. Piensa en un cortador de galletas y las galletas: una forma, muchas galletas. En CDK, tu pila es una clase, y cada pila que creas con `new` es un objeto.',
        ),
        termTable(TYPES),
        traps(TYPES),
        both(
          '**In short:** the type words are near-twins (string, entero, booleano, objeto, clase); say *un string* and *la variable*, and when a translated doc says *matriz*, read "array".',
          '**En resumen:** las palabras de tipos son casi gemelas (string, entero, booleano, objeto, clase); di *un string* y *la variable*, y cuando un documento traducido diga *matriz*, lee "array".',
        ),
      ),
    },
    {
      id: 'cards-types',
      kind: 'cards',
      title: both('Flashcards: types and structures', 'Tarjetas: tipos y estructuras'),
      minutes: 5,
      body: both(
        'Ten words for data, both directions. For the Spanish side, say the gender too (*un string*, *la variable*).',
        'Diez palabras para hablar de datos, en las dos direcciones. En el lado español, di también el género (*un string*, *la variable*).',
      ),
      cards: cardsFor(TYPES),
    },

    // ---------- Lesson 2: functions and flow ----------
    {
      id: 'functions-flow',
      kind: 'read',
      title: both('Functions and flow', 'Funciones y flujo'),
      minutes: 6,
      body: join(
        both(
          '**Why first.** Explaining what code *does* is mostly verbs: it takes a parameter, loops over the files, throws an exception, returns a response. Verbs are where English and Spanish part ways, and where regional habits show.',
          '**Primero, el porqué.** Explicar lo que *hace* el código es sobre todo cuestión de verbos: recibe un parámetro, recorre los archivos, lanza una excepción, devuelve una respuesta. Ahí se separan el inglés y el español, y se notan las costumbres de cada región.',
        ),
        both(
          '**Functions and methods.** A **function** (*función*) is a named block of code you call. A **method** (*método*) is a function that belongs to an object: `client.send()` is the client\'s `send` method. **Parameters** are the names in the definition; **arguments** are the values you pass (careful: in English *argument* can also mean a quarrel; in code, in both languages, it is just the value: *argumento*). What comes out is the **return value**: *devolver* everywhere (and the usual verb in Spain); *retornar* is also very common in Latin America, and in Mexico you\'ll often hear *regresar*.',
          '**Funciones y métodos.** Una **función** (*function*) es un bloque de código con nombre al que llamas. Un **método** (*method*) es una función que pertenece a un objeto: `client.send()` es el método `send` del cliente. Los **parámetros** son los nombres de la definición; los **argumentos**, los valores que pasas (ojo: en inglés *argument* también es una discusión o pelea; en código, en los dos idiomas, es solo el valor que pasas). Lo que sale es el **valor de retorno**: *devolver* en todas partes (y es lo habitual en España); *retornar* también es muy común en Latinoamérica, y en México se oye mucho *regresar*.',
        ),
        both(
          '**Flow.** A **loop** (*bucle*; *ciclo* is also very common in Mexico and other Latin American countries) repeats code: for each file, upload it to S3. A **comment** (*comentario*) explains code to humans. A **syntax error** (*error de sintaxis*) is code the language can\'t even read. To **compile** (*compilar*) turns code into another form before it runs, like TypeScript compiling to JavaScript. To **run** is *ejecutar*; *correr* is everyday Latin American usage. A **script** is a short program you run; at work everyone says *script* (*guion* exists but you\'ll rarely hear it).',
          '**Flujo.** Un **bucle** (*loop*; en México y otros países de Latinoamérica también se dice mucho *ciclo*) repite código: por cada archivo, súbelo a S3. Un **comentario** (*comment*) explica el código a las personas. Un **error de sintaxis** (*syntax error*) es código que el lenguaje ni siquiera puede leer. **Compilar** (*compile*) transforma el código en otra forma antes de ejecutarlo, como hace TypeScript al compilarse a JavaScript. **Run** es *ejecutar*; *correr* es lo habitual al hablar en Latinoamérica. Un **script** es un programa corto que ejecutas; en el trabajo todo el mundo dice *script* (*guion* existe, pero casi no se oye).',
        ),
        both(
          '**Exceptions and the cachear trap.** An **exception** is an error signal. Code **throws** it (*lanzar*; *tirar* with the team) and other code **catches** it (*capturar*). Picture a fire alarm: it goes off where the smoke is, and whoever is trained for it responds. Teams, especially in Latin America, say "hay que cachear la excepción" for catch, but *cachear* also means storing something in a cache (and, in everyday Spanish, frisking someone). In writing, use *capturar*.',
          '**Las excepciones y la trampa de cachear.** Una **excepción** (*exception*) es una señal de error. Un código la **lanza** (*throw*; *tirar* con el equipo) y otro la **captura** (*catch*). Piensa en una alarma de incendios: suena donde está el humo y responde quien sabe qué hacer. Muchos equipos, sobre todo en Latinoamérica, dicen "hay que cachear la excepción" por catch, pero *cachear* también es guardar algo en caché (y, en el habla diaria, registrar a una persona). Por escrito, usa *capturar*.',
        ),
        termTable(FLOW),
        traps(FLOW),
        both(
          '**In short:** a function receives arguments and returns a value (*devolver* or *retornar*); code throws and catches exceptions (*lanzar*, *capturar*), and in writing *capturar* beats *cachear*, which can also mean cache.',
          '**En resumen:** una función recibe argumentos y devuelve un valor (*devolver* o *retornar*); el código lanza y captura excepciones, y por escrito *capturar* es mejor que *cachear*, que también puede ser cache.',
        ),
      ),
    },
    {
      id: 'cards-flow',
      kind: 'cards',
      title: both('Flashcards: functions and flow', 'Tarjetas: funciones y flujo'),
      minutes: 5,
      body: both(
        'Eleven words for what code does. Watch the regional pairs: *devolver / retornar*, *bucle / ciclo*, *ejecutar / correr*.',
        'Once palabras para lo que hace el código. Fíjate en los pares regionales: *devolver / retornar*, *bucle / ciclo*, *ejecutar / correr*.',
      ),
      cards: cardsFor(FLOW),
    },

    // ---------- Lesson 3: the ecosystem ----------
    {
      id: 'ecosystem',
      kind: 'read',
      title: both('The ecosystem', 'El ecosistema'),
      minutes: 6,
      body: join(
        both(
          '**Why first.** Nobody writes everything from scratch. Your Lambda function imports the AWS SDK, which you installed as a package and your project lists as a dependency. Talking about all that borrowed code is where one of the most common false friends in tech Spanish lives.',
          '**Primero, el porqué.** Nadie escribe todo desde cero. Tu función Lambda importa el AWS SDK, que instalaste como paquete y que tu proyecto declara como dependencia. Y al hablar de ese código ajeno aparece uno de los falsos amigos más comunes del español técnico.',
        ),
        both(
          '**Library and framework.** A **library** is code you call when you need it: `date-fns`, which formats dates in JavaScript, is a library. In Spanish it\'s *biblioteca*; *librería* is a bookstore. You\'ll hear *librería* in every office, but in a document write *biblioteca*. A **framework** works the other way round: it calls your code. A library is a toolbox you pick from; a framework is the frame of a house whose rooms you fill in. People just say *framework*.',
          '**Biblioteca y framework.** Una **biblioteca** (*library*) es código al que llamas cuando lo necesitas: `date-fns`, que da formato a fechas en JavaScript, es una biblioteca. Ojo: *librería* se parece a library, pero es la tienda de libros (bookstore). Oirás *librería* en todas las oficinas, pero en un documento escribe *biblioteca*. Un **framework** funciona al revés: es él quien llama a tu código. Una biblioteca es una caja de herramientas de la que eliges; un framework es la estructura de una casa cuyas habitaciones vas llenando. Se dice *framework*, sin más.',
        ),
        both(
          '**Modules, packages, dependencies.** A **module** (*módulo*) is a file of code that exports things you **import** (*importar*) elsewhere. A **package** (*paquete*) is what you install with npm or pip. A **dependency** (*dependencia*, *las deps*) is a package your project needs to work.',
          '**Módulos, paquetes, dependencias.** Un **módulo** (*module*) es un archivo de código que exporta cosas que **importas** (*import*) en otro sitio. Un **paquete** (*package*) es lo que instalas con npm o pip. Una **dependencia** (*dependency*, *las deps*) es un paquete que tu proyecto necesita para funcionar.',
        ),
        both(
          '**Talking to services.** An **SDK** (*el SDK*) is a kit of libraries and tools for one platform, like the AWS SDK for JavaScript v3. An **API** (*la API*, feminine because of *interfaz*) is the contract a program offers others; an **endpoint** is one address of it, like `/progress`. Translated docs often say *punto de conexión*; out loud, everyone says *endpoint*. Each call is a **request** (*solicitud*, *petición*) that gets a **response** (*respuesta*). The **runtime** (*entorno de ejecución*) runs your code: in Lambda, for example, Node.js 24 or Python 3.13. A **linter** checks code without running it.',
          '**Hablar con servicios.** Un **SDK** (*el SDK*) es un kit de bibliotecas y herramientas para una plataforma, como el AWS SDK para JavaScript v3. Una **API** (*la API*, femenino por *interfaz*) es el contrato que un programa ofrece a otros; un **endpoint** es una de sus direcciones, como `/progress`. En documentación traducida suele aparecer *punto de conexión*; al hablar, todos dicen *endpoint*. Cada llamada es una **solicitud** o **petición** (*request*) que recibe una **respuesta** (*response*). El **runtime** (*entorno de ejecución*) ejecuta tu código: en Lambda, por ejemplo, Node.js 24 o Python 3.13. Un **linter** revisa el código sin ejecutarlo.',
        ),
        termTable(ECOSYSTEM),
        traps(ECOSYSTEM),
        both(
          '**In short:** you call a library, a framework calls you; in a Spanish document, prefer *biblioteca* to *librería*; and say *el SDK* but *la API*.',
          '**En resumen:** tú llamas a una biblioteca y un framework te llama a ti; en un documento en español, mejor *biblioteca* que *librería*; y se dice *el SDK* pero *la API*.',
        ),
      ),
    },
    {
      id: 'cards-ecosystem',
      kind: 'cards',
      title: both('Flashcards: the ecosystem', 'Tarjetas: el ecosistema'),
      minutes: 5,
      body: both(
        'Twelve words for the code around your code. When you see *library*, say *biblioteca* before you flip.',
        'Doce palabras para el código que rodea a tu código. Cuando veas *library*, di *biblioteca* antes de girar la tarjeta.',
      ),
      cards: cardsFor(ECOSYSTEM),
    },

    // ---------- Lesson 4: async out loud ----------
    {
      id: 'async-out-loud',
      kind: 'read',
      title: both('Async out loud', 'Asíncrono en voz alta'),
      minutes: 6,
      body: join(
        both(
          '**Why first.** Asynchronous code is where reviews get hard to say out loud. "It returns a promise that the handler doesn\'t await" (in Spanish: "devuelve una promesa que el handler no espera con await") is easy to read and hard to say in your second language if you\'ve never practiced it.',
          '**Primero, el porqué.** El código asíncrono es donde las revisiones se vuelven difíciles de decir en voz alta. "It returns a promise that the handler doesn\'t await" o "devuelve una promesa que el handler no espera con await": las dos se leen fácil, pero cuesta decirlas en tu segundo idioma si nunca lo has practicado.',
        ),
        both(
          '**The idea.** Calling DynamoDB or S3 takes time. **Asynchronous** code (*asíncrono*; *asincrónico* is also common, especially in Latin America) starts that work and doesn\'t block while it waits. Picture a busy café: you order and get a buzzer. The **promise** (*promesa*) is the buzzer: a result that arrives later, or a failure. A **callback** (*función de devolución de llamada* in formal Spanish docs; out loud, everyone says *callback*) is the older way: you leave your number and they call you back. `async`/`await` is the modern syntax: `await` means "wait here for the buzzer". In the AWS SDK for JavaScript v3, `client.send()` returns a promise, and Lambda\'s Node.js runtimes expect async handlers: from Node.js 24 on, callback-style handlers aren\'t supported at all.',
          '**La idea.** Llamar a DynamoDB o a S3 lleva tiempo. El código **asíncrono** (*async*; también se dice mucho *asincrónico*, sobre todo en Latinoamérica) arranca ese trabajo y no se bloquea mientras espera. Piensa en una cafetería llena: pides y te dan un localizador (el aparato que vibra cuando tu pedido está listo). La **promesa** (*promise*) es el localizador: un resultado que llega después, o un fallo. Un **callback** (*función de devolución de llamada* en documentación formal; al hablar, todo el mundo dice *callback*) es la forma antigua: dejas tu número y te llaman. `async`/`await` es la sintaxis moderna: `await` significa "espera aquí al localizador". En el AWS SDK para JavaScript v3, `client.send()` devuelve una promesa, y los runtimes de Node.js en Lambda esperan handlers async: desde Node.js 24, los handlers con callback ya no se admiten.',
        ),
        both(
          '**Reading code aloud.** `const { Item } = await client.send(new GetCommand(params));` sounds like: "We await `client.send` with a new GetCommand and destructure Item from the result" (destructuring = pulling a named field out of an object into its own variable; in Spanish, *desestructurar*). The symbols: `( )` parentheses, `[ ]` square brackets, `{ }` curly braces, `" "` quotes, `.` dot, `;` semicolon, `=>` arrow, `_` underscore, `===` strictly equals.',
          '**Leer código en voz alta.** `const { Item } = await client.send(new GetCommand(params));` suena así: "Hacemos await de `client.send` con un nuevo GetCommand y desestructuramos Item del resultado" (con el equipo, también "sacamos Item del resultado"). Los símbolos: `( )` paréntesis, `[ ]` corchetes, `{ }` llaves, `" "` comillas, `.` punto, `;` punto y coma, `=>` flecha, `_` guion bajo, `===` estrictamente igual a.',
        ),
        both(
          '**Review phrases.** "This call isn\'t awaited" is *aquí falta el await* with the team, or *el handler no espera a que se resuelva la promesa de esta llamada* in a written review. "This can throw" is *esto puede lanzar una excepción*.',
          '**Frases de revisión.** *Aquí falta el await* (con el equipo) o *el handler no espera a que se resuelva la promesa de esta llamada* (por escrito) es "this call isn\'t awaited" en inglés. *Esto puede lanzar una excepción* es "this can throw".',
        ),
        termTable(ASYNC),
        traps(ASYNC),
        both(
          '**In short:** a promise is a result that arrives later, `await` waits for it, and a callback is the older way; out loud, braces are *llaves* and brackets are *corchetes*.',
          '**En resumen:** una promesa es un resultado que llega después, `await` la espera y un callback es la forma antigua; en voz alta, `{ }` son llaves (curly braces) y `[ ]` son corchetes (square brackets).',
        ),
      ),
    },
    {
      id: 'cards-async',
      kind: 'cards',
      title: both('Flashcards: async', 'Tarjetas: asíncrono'),
      minutes: 2,
      body: both(
        'Three words, both directions. Say each one inside a sentence about `client.send()`.',
        'Tres palabras, en las dos direcciones. Di cada una dentro de una frase sobre `client.send()`.',
      ),
      cards: cardsFor(ASYNC),
    },

    // ---------- Practice ----------
    {
      id: 'pick-register',
      kind: 'register',
      title: both('Formal, team or slang?', '¿Formal, equipo o jerga?'),
      minutes: 6,
      body: both(
        'Ten phrases about code, like the ones you hear at work, in both languages. Decide where each one fits best.',
        'Diez frases sobre código como las que se oyen en el trabajo, en los dos idiomas. Decide dónde encaja mejor cada una.',
      ),
      items: [
        {
          text: 'La función devuelve un valor booleano y lanza una excepción si el parámetro no es un número entero.',
          context: both('API reference', 'Referencia de la API'),
          answer: 'formal',
          explain: both(
            '*Devolver*, *lanzar una excepción*, *parámetro* and *número entero* are all the glossary\'s formal forms, in a full impersonal sentence.',
            '*Devolver*, *lanzar una excepción*, *parámetro* y *número entero* son las formas formales del glosario, en una frase completa e impersonal.',
          ),
        },
        {
          text: 'Ojo, el handler tira una excepción si el evento no trae el userId. ¿Le metemos un try/catch?',
          context: both('Comment on a pull request', 'Comentario en una pull request'),
          answer: 'team',
          explain: both(
            '*Tirar una excepción* is the team way to say *lanzar*, and *ojo* and *¿le metemos…?* are friendly. In a doc: *lanza una excepción*.',
            '*Tirar una excepción* es la forma de equipo de decir *lanzar*, y *ojo* y *¿le metemos…?* son cercanos. En un documento: *lanza una excepción*.',
          ),
        },
        {
          text: 'ya cacheé la excepción, la lambda ya no se cae 🙌',
          context: both('Direct message to a teammate', 'Mensaje directo a un compañero'),
          answer: 'slang',
          explain: both(
            'All lowercase, *ya cacheé*, *la lambda ya no se cae* and an emoji: chat shorthand, between close teammates only. Teams do say *cachear* for catch (mostly in Latin America), but it is ambiguous: it can also mean caching. In writing: *capturé la excepción*.',
            'Todo en minúsculas, *ya cacheé*, *la lambda ya no se cae* y un emoji: jerga de chat, solo entre compañeros de confianza. Los equipos sí dicen *cachear* por catch (sobre todo en Latinoamérica), pero es ambiguo: también puede ser guardar en caché. Por escrito: *capturé la excepción*.',
          ),
        },
        {
          text: 'El servicio expone un punto de conexión HTTPS que recibe solicitudes y devuelve respuestas en formato JSON.',
          context: both('Design document', 'Documento de diseño'),
          answer: 'formal',
          explain: both(
            '*Punto de conexión* and *solicitud / respuesta* are the formal forms. With the team you\'d say *el endpoint* and *la request* or *la petición*.',
            '*Punto de conexión* y *solicitud / respuesta* son las formas formales. Con el equipo dirías *el endpoint* y *la request* o *la petición*.',
          ),
        },
        {
          text: 'La función retorna una promesa, así que acuérdate del await.',
          context: both('Reply in a team thread', 'Respuesta en un hilo del equipo'),
          answer: 'team',
          explain: both(
            '*Retornar* is the casual form (very common in Latin America) and the tone is a friendly reminder. A doc would say *devuelve una promesa*.',
            '*Retornar* es la forma de equipo (muy común en Latinoamérica) y el tono es un recordatorio amistoso. Un documento diría *devuelve una promesa*.',
          ),
        },
        {
          text: 'Actualicé las deps y la lib de fechas, ya pasa el linter.',
          context: both('Quick DM', 'Mensaje rápido'),
          answer: 'slang',
          explain: both(
            '*Las deps*, *la lib* and *pasar el linter* are all slang forms in the glossary. Formal: *actualicé las dependencias y la biblioteca de fechas*.',
            '*Las deps*, *la lib* y *pasar el linter* son formas de jerga del glosario. En formal: *actualicé las dependencias y la biblioteca de fechas*.',
          ),
        },
        {
          text: 'Se recomienda guardar el nombre de la tabla en una variable de entorno, no en una constante del código.',
          context: both('Operations runbook', 'Manual de operaciones (runbook)'),
          answer: 'formal',
          explain: both(
            'Impersonal *se recomienda*, *variable de entorno*, *constante*: a sentence you could paste into any document.',
            '*Se recomienda* impersonal, *variable de entorno*, *constante*: una frase que podrías pegar en cualquier documento.',
          ),
        },
        {
          text: 'Heads up: `getUser` throws if the ID is missing. Can we catch that in the handler?',
          context: both('Team Slack, English-speaking team', 'Slack de un equipo que trabaja en inglés'),
          answer: 'team',
          explain: both(
            '*Heads up*, *we* and a direct question: friendly, clear team English. Note it\'s *catch*, never *cache*.',
            '*Heads up*, *we* y una pregunta directa: inglés de equipo claro y amable. Fíjate: es *catch*, nunca *cache*.',
          ),
        },
        {
          text: 'The `send` method returns a promise that resolves to the response object. If the request fails, the promise is rejected with a service exception.',
          context: both('SDK documentation', 'Documentación de un SDK'),
          answer: 'formal',
          explain: both(
            'Full terms (*method*, *promise*, *request*, *exception*), passive voice, no *we* or *you*: documentation English.',
            'Términos completos (*method*, *promise*, *request*, *exception*), voz pasiva y sin *we* ni *you*: inglés de documentación.',
          ),
        },
        {
          text: 'lgtm 🚀 just bump the deps real quick and rerun lint, ty 🙏',
          context: both('Quick DM between close teammates', 'Mensaje rápido entre compañeros de confianza'),
          answer: 'slang',
          explain: both(
            '*LGTM* (looks good to me) on its own is normal in any PR review, but all lowercase, *bump the deps real quick*, *ty* (thank you) and two emoji make this chat shorthand. In a review summary: *Approved. Please update the dependencies and rerun the linter.*',
            '*LGTM* (looks good to me, "me parece bien") por sí solo es normal en cualquier revisión de PR, pero todo en minúsculas, *bump the deps real quick*, *ty* (thank you) y dos emojis lo convierten en jerga de chat. En el resumen de una revisión: *Approved. Please update the dependencies and rerun the linter.*',
          ),
        },
      ],
    },
    {
      id: 'explain-handler',
      kind: 'rewrite',
      title: both('Explain a handler in Spanish', 'Explica un handler en español'),
      minutes: 8,
      target: 'es',
      source: `Review notes (getProgress.mjs):
- The handler is an async function. It reads userId from the path parameters.
- It uses the AWS SDK for JavaScript v3 library (lib-dynamodb): it calls send with a GetCommand and awaits the promise.
- The table name comes from an environment variable, not a hard-coded constant.
- If the item is missing, it returns a 404 response; otherwise a 200 with the item as JSON.
- The call is wrapped in try/catch: if DynamoDB throws, it logs the exception and returns a 500.`,
      task: both(
        'Diego prefers reading Spanish, and this explanation will stay in the PR as a comment for him, so write it in careful Spanish: explain step by step what the handler does, from the English review notes. You can keep *handler*, *SDK* and *endpoint* in English, but write *biblioteca* (not *librería*) and *capturar* (not *cachear*).',
        'Diego prefiere leer en español, y esta explicación se quedará en la PR como comentario para él, así que escríbela en un español cuidado: explica paso a paso qué hace el handler a partir de las notas de revisión en inglés. Puedes dejar *handler*, *SDK* y *endpoint* en inglés, pero escribe *biblioteca* (no *librería*) y *capturar* (no *cachear*).',
      ),
      minWords: 45,
      mustUse: [
        { any: ['funcion*', 'handler*'], label: 'función / handler' },
        { any: ['asincron*', 'async'], label: 'asíncrona' },
        { any: ['parametro*', 'argumento*', 'pathparameters'], label: 'parámetro' },
        { any: ['biblioteca*', 'sdk'], label: 'biblioteca / SDK' },
        { any: ['promesa*', 'await'], label: 'promesa' },
        { any: ['variable de entorno', 'variables de entorno', 'variable del entorno', 'variable de ambiente', 'variables de ambiente', 'process.env'], label: 'variable de entorno' },
        { any: ['devuelv*', 'devolv*', 'retorn*', 'regres*', 'respond*'], label: 'devolver / retornar' },
        { any: ['captur*', 'excepci*'], label: 'capturar la excepción' },
      ],
      avoid: [
        { any: ['librer*'], why: both('*Librería* is a bookstore. In a text that stays in the repo, write *biblioteca*.', '*Librería* es la tienda de libros. En un texto que se queda en el repositorio, escribe *biblioteca*.') },
        { any: ['cachea*', 'cachee*', 'cacheo*', 'cacha*'], why: both('*Cachear* can mean catch or cache. Write *capturar la excepción*.', '*Cachear* puede ser catch o cache. Escribe *capturar la excepción*.') },
      ],
      model: 'Hola, Diego: te explico el handler de esta PR. Es una función asíncrona que recibe el evento de la API y lee el parámetro userId de la ruta. Usa el AWS SDK para JavaScript v3 (la biblioteca lib-dynamodb): llama al método send con un GetCommand y espera la promesa con await. El nombre de la tabla sale de una variable de entorno, no de una constante en el código. Si el ítem no existe, devuelve una respuesta 404; si existe, devuelve un 200 con el ítem en JSON. La llamada va dentro de un try/catch: si DynamoDB lanza una excepción, la capturamos, la registramos en el log y devolvemos un 500.',
    },
    {
      id: 'review-comment',
      kind: 'rewrite',
      title: both('Write the review comment in English', 'Escribe el comentario de revisión en inglés'),
      minutes: 8,
      target: 'en',
      source: `Notas para la revisión de la PR de Sam (saveProgress):
- falta el await en client.send(new PutCommand(...)) → la función retorna su respuesta de éxito antes de que se guarde el ítem: el cliente recibe un 200 aunque la escritura falle, y el try/catch no se entera
- con el await puesto, si la condición falla, DynamoDB tira ConditionalCheckFailedException y el catch genérico la convierte en un 500 → nadie la cachea aparte, y el cliente recibe un 5xx por un simple duplicado
- proponer: devolver un 409 en ese caso
- pedirle que añada un test para el caso duplicado`,
      task: both(
        'Sam works in English. Turn your Spanish notes into one polite, specific review comment in English: the missing `await` (and why it matters), the exception that ends up as a generic 500, what you suggest, and the test. Watch the false friends: *cachear* here is *catch*, and *lanzar / tirar* is *throw*.',
        'Sam trabaja en inglés. Convierte tus notas en español en un comentario de revisión en inglés, amable y concreto: el `await` que falta (y por qué importa), la excepción que acaba en un 500 genérico, lo que propones y el test. Cuidado con los falsos amigos: aquí *cachear* es *catch*, y *lanzar / tirar* es *throw*.',
      ),
      minWords: 45,
      mustUse: [
        { any: ['await*'], label: 'await' },
        { any: ['promise*', 'resolv*', 'settl*', 'finish*', 'complet*'], label: 'promise / finishes' },
        { any: ['return*'], label: 'returns' },
        { any: ['catch*', 'handle', 'handles', 'handled', 'handling'], label: 'catch / handle' },
        { any: ['exception*', 'error*', 'throw*', 'raise*', 'reject*'], label: 'exception / throws' },
        { any: ['test*', 'spec', 'specs'], label: 'test' },
      ],
      avoid: [
        { any: ['cache*', 'cachea*'], why: both('Here *cachear* means *catch*. In English, *cache* is storing data for later: a different thing.', 'Aquí *cachear* significa *catch*. En inglés, *cache* es guardar datos para después: otra cosa.') },
        { any: ['launch*'], why: both('*Lanzar una excepción* is *throw an exception* in English, never *launch*.', '*Lanzar una excepción* es *throw an exception* en inglés, nunca *launch*.') },
      ],
      model: 'Nice work on this, Sam. Two things before we merge. First, `client.send(new PutCommand(...))` is missing an `await`. Without it, the handler returns its success response before the promise resolves: the client gets a 200 even when the write fails, the item may not be saved before Lambda freezes the environment, and the try/catch never sees the failure. Second, once the await is in, a failed condition makes DynamoDB throw `ConditionalCheckFailedException`, and the generic catch turns it into a 500, so the client gets a 5xx for a simple duplicate. Could you catch that exception by name (`err.name === "ConditionalCheckFailedException"`) and return a 409 Conflict instead? A unit test for the duplicate case would be great too. Thanks!',
    },

    // ---------- Check ----------
    {
      id: 'quiz',
      kind: 'quiz',
      title: both('Check yourself', 'Compruébalo'),
      minutes: 5,
      questions: [
        {
          q: both(
            'A translated Spanish doc says an API call "devuelve una matriz de cadenas". What does it return?',
            'Un documento traducido dice que una llamada a la API "devuelve una matriz de cadenas". ¿Qué devuelve?',
          ),
          options: [
            both('A 2D grid of characters', 'Una tabla de caracteres en dos dimensiones'),
            both('A list of templates', 'Una lista de plantillas'),
            both('An array of strings', 'Un array de strings'),
            both('A single long string', 'Un único string largo'),
          ],
          answer: 2,
          explain: both(
            'In translated documentation *matriz* usually means array, of any dimension. *Cadena* is string. In class you may hear *arreglo* (common in Latin American classes) or *vector* (frequent in Spain, also used elsewhere) for the same thing.',
            'En documentación traducida, *matriz* suele significar array, de cualquier dimensión. *Cadena* es string. En clase quizá oigas *arreglo* (habitual en las clases en Latinoamérica) o *vector* (frecuente en España, aunque también se usa en otros países) para lo mismo.',
          ),
        },
        {
          q: both(
            'On a call, Marta says: "Aquí falta cachear la excepción." What does she want?',
            'En una llamada, Marta dice: "Aquí falta cachear la excepción". ¿Qué quiere?',
          ),
          options: [
            both('Store the exception in a cache', 'Guardar la excepción en caché'),
            both('Catch the exception', 'Capturar la excepción (catch)'),
            both('Throw a new exception', 'Lanzar una excepción nueva'),
            both('Check the exception\'s type (inspect it)', 'Revisar el tipo de la excepción (inspeccionarla)'),
          ],
          answer: 1,
          explain: both(
            'With the team, *cachear* often means catch. Because it can also mean cache, write *capturar* in anything that stays, and say *catch* in English.',
            'Con el equipo, *cachear* suele significar catch. Como también puede ser cache, escribe *capturar* en todo lo que se guarde, y di *catch* en inglés.',
          ),
        },
        {
          q: both(
            'Which sentence best describes a library versus a framework?',
            '¿Qué frase describe mejor la diferencia entre una biblioteca y un framework?',
          ),
          options: [
            both('A library is paid; a framework is free.', 'Una biblioteca es de pago; un framework es gratis.'),
            both('A library only runs on servers; a framework only in the browser.', 'Una biblioteca solo se ejecuta en servidores; un framework, solo en el navegador.'),
            both('They are two names for the same thing.', 'Son dos nombres para lo mismo.'),
            both('You call a library; a framework calls your code.', 'Tú llamas a una biblioteca; un framework llama a tu código.'),
          ],
          answer: 3,
          explain: both(
            'A library is a toolbox you pick from (`date-fns`); a framework sets the structure and calls the code you fill in. In Spanish: *biblioteca* (better than *librería* in a document) and *framework*.',
            'Una biblioteca es una caja de herramientas de la que eliges (`date-fns`); un framework pone la estructura y llama al código que tú rellenas. En español: *biblioteca* (mejor que *librería* en un documento) y *framework*.',
          ),
        },
        {
          q: both(
            'Your English-speaking teammate writes "the handler throws if userId is missing". How do you say it in a formal Spanish document?',
            'Tu compañero que trabaja en inglés escribe "the handler throws if userId is missing". ¿Cómo lo dices en un documento formal en español?',
          ),
          options: [
            'El handler lanza una excepción si falta userId.',
            'El handler tira una excepción si falta userId.',
            'El handler cachea una excepción si falta userId.',
            'El handler devuelve una excepción si falta userId.',
          ],
          answer: 0,
          explain: both(
            '*Lanzar* is the formal verb for throw. *Tirar* is what teams say, *cachear* is catch (or cache), not throw, and *devolver* is return: returning an error value is not the same as throwing one.',
            '*Lanzar* es el verbo formal para throw. *Tirar* es lo que dicen los equipos, *cachear* es catch (o cache), no throw, y *devolver* es return: devolver un valor de error no es lo mismo que lanzar una excepción.',
          ),
        },
        {
          q: both(
            'Reading code aloud in a Spanish review: what do you call `{ }`?',
            'Leyendo código en voz alta en una revisión en español: ¿cómo llamas a `{ }`?',
          ),
          options: ['corchetes', 'paréntesis', 'llaves', 'comillas'],
          answer: 2,
          explain: both(
            '`{ }` are *llaves* (curly braces), `[ ]` are *corchetes* (square brackets), `( )` are *paréntesis* (parentheses) and `" "` are *comillas* (quotes).',
            '`{ }` son *llaves* (curly braces), `[ ]` son *corchetes* (square brackets), `( )` son *paréntesis* (parentheses) y `" "` son *comillas* (quotes).',
          ),
        },
        {
          q: both(
            'In the AWS SDK for JavaScript v3, what does `client.send(command)` return?',
            'En el AWS SDK para JavaScript v3, ¿qué devuelve `client.send(command)`?',
          ),
          options: [
            both('A callback', 'Un callback'),
            both('A promise', 'Una promesa'),
            both('A boolean', 'Un booleano'),
            both('The table name as a string', 'El nombre de la tabla como string'),
          ],
          answer: 1,
          explain: both(
            '`send` returns a promise, so you `await` it inside an async handler. If you don\'t, the handler can return before the call finishes, and a try/catch around it never sees the failure.',
            '`send` devuelve una promesa, así que la esperas con `await` dentro de un handler async. Si no, el handler puede terminar antes de que acabe la llamada, y un try/catch alrededor nunca ve el fallo.',
          ),
        },
        {
          q: both(
            'A teammate writes "elige el runtime de Python 3.13" for a Lambda function. What is the runtime here?',
            'Un compañero escribe "elige el runtime de Python 3.13" para una función Lambda. ¿Qué es aquí el runtime?',
          ),
          options: [
            both('How long the function is allowed to run', 'Cuánto tiempo puede ejecutarse la función'),
            both('The SDK the function imports', 'El SDK que importa la función'),
            both('The function\'s log group', 'El grupo de logs de la función'),
            both('The language environment Lambda runs your code in', 'El entorno de ejecución del lenguaje en el que Lambda ejecuta tu código'),
          ],
          answer: 3,
          explain: both(
            'A Lambda runtime is the language environment, such as Python 3.13 or Node.js 24. How long the function may run is the timeout. Formal Spanish: *entorno de ejecución*; *error en tiempo de ejecución* is a runtime error.',
            'Un runtime de Lambda es el entorno del lenguaje, como Python 3.13 o Node.js 24. Cuánto puede durar la función es el timeout (tiempo de espera). En español formal: *entorno de ejecución*; *error en tiempo de ejecución* es un runtime error.',
          ),
        },
        {
          q: both(
            'In a Spanish review: "Pásale el nombre del bucket como argumento." What should you do?',
            'En una revisión en español: "Pásale el nombre del bucket como argumento". ¿Qué tienes que hacer?',
          ),
          options: [
            both('Argue with the team about the bucket name', 'Discutir con el equipo el nombre del bucket'),
            both('Add a comment explaining the bucket name', 'Añadir un comentario que explique el nombre del bucket'),
            both('Pass the bucket name as a value to the function', 'Pasar el nombre del bucket como valor a la función'),
            both('Rename the bucket', 'Cambiar el nombre del bucket'),
          ],
          answer: 2,
          explain: both(
            'In code, an *argumento* is the value you pass to a function (its *parámetro* is the name in the definition). It has nothing to do with the other English sense of *argument*, a quarrel.',
            'En código, un *argumento* es el valor que pasas a una función (el *parámetro* es el nombre en la definición). No tiene nada que ver con el otro sentido de *argument* en inglés, una pelea.',
          ),
        },
      ],
    },
  ],
};

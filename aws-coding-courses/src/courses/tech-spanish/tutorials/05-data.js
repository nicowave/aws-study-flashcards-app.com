// Module 5: Data (paid).
// Lessons: databases (and the many meanings of "registro"); DynamoDB in
// Spanish; copies and moving data; data and AI. Translations come from the
// glossary (termTable, traps, cardsFor). The only "this is what AWS uses"
// claims are about DynamoDB's Spanish docs (clave de partición, clave de
// ordenación / clasificación, elemento / atributo, índice secundario global),
// backed by content/tech-spanish/sources.mjs (aws-ddb-core, aws-ddb-gsi).
// Everything else is presented as common usage.
import { both, join } from '../../../engine/i18n';
import { termTable, traps, cardsFor } from '../glossary';

const DATABASES = ['database', 'table', 'row-column', 'query', 'primary-key', 'schema', 'transaction', 'record', 'json'];
const DYNAMODB = ['item-attribute', 'partition-key', 'sort-key', 'index', 'scan'];
const COPIES = ['backup', 'restore', 'replica', 'migration', 'etl', 'stream', 'data-lake'];
const DATA_AI = ['dataset', 'big-data', 'machine-learning', 'llm'];

export default {
  slug: 'data',
  number: 5,
  free: false,
  title: both('Data', 'Datos'),
  situation: both(
    "You're a backend developer at an online bookstore whose team is split between Seattle, Ciudad de México and Valencia. Login has become slow: looking a user up by email scans a DynamoDB table with two million items, and the read bill went up 40% this month. You want to propose a global secondary index to Lucía, who reviews your PRs and prefers Spanish. The same week, the orders database moves to Aurora in the early hours of Saturday (UTC), and you have to warn the English-speaking engineering channel about the migration, the backup and what happens if something goes wrong. First you need the words: table, query, sort key, scan, backup, replica and the rest.",
    'Eres desarrollador o desarrolladora de backend en una librería en línea con el equipo repartido entre Seattle, Ciudad de México y Valencia. El login se ha vuelto lento: buscar a un usuario por su email hace un scan de una tabla de DynamoDB con dos millones de elementos, y la factura de lecturas subió un 40% este mes. Quieres proponerle un índice secundario global a Lucía, que revisa tus PR y prefiere el español. Esa misma semana, la base de datos de pedidos pasa a Aurora la madrugada del sábado (hora UTC), y tienes que avisar al canal de ingeniería, que está en inglés, de la migración, la copia de seguridad y qué pasa si algo sale mal. Antes necesitas las palabras: tabla, consulta, clave de ordenación, scan, backup, réplica y el resto.',
  ),
  overview: both(
    "Data words look easy, because many are near-twins (table and tabla, transaction and transacción), but a few cause real mix-ups: *registro* means several different things, AWS's own Spanish docs use two names for the sort key, and a replica is not a backup. In this module you learn the vocabulary of databases, of DynamoDB, of copying and moving data, and of data for AI, each in three registers. You finish by proposing a GSI in Spanish and writing an English heads-up about a data migration.",
    'El vocabulario de datos parece fácil, porque muchas palabras son casi gemelas (table y tabla, transaction y transacción), pero unas cuantas causan confusiones reales: *registro* significa varias cosas distintas, la propia documentación de AWS en español usa dos nombres para la sort key, y una réplica no es una copia de seguridad. En este módulo aprendes el vocabulario de las bases de datos, de DynamoDB, de copiar y mover datos, y de los datos para la IA, cada uno en tres registros. Terminas proponiendo un GSI en español y escribiendo en inglés un aviso sobre una migración de datos.',
  ),
  level: both('Intermediate', 'Intermedio'),
  hours: 1,
  skills: ['database', 'query', 'sort key', 'GSI', 'backup', 'migration', 'LLM'],
  steps: [
    // ---------- Lesson 1: databases ----------
    {
      id: 'databases',
      kind: 'read',
      title: both('Databases', 'Bases de datos'),
      minutes: 6,
      body: join(
        both(
          `**Why first.** Every app keeps data, and half the questions in a stand-up are about it: "which table?", "is that field in the schema?". Most of these words are near-twins in both languages. One isn't: in Spanish, *registro* hides several different ideas, and that causes real confusion in tickets.

- A **database** (*base de datos*; with the team *la base* or *la BD*, and as slang *la DB*) is an organized store of data that programs read and write.
- In a relational database, a **table** (*tabla*) holds one kind of thing in **rows** (*filas*) and **columns** (*columnas*). Think of a spreadsheet: each row is one customer, each column one property, like the email.
- A **query** (*consulta*) asks the database for data. With the team it's usually *la query* (feminine, like *consulta*); in much of Latin America you'll also hear *el query*.
- The **primary key** identifies each row, so it must be unique. In writing you'll see both *clave principal* and *clave primaria*: pick one per document. Out loud most people say *clave primaria* or *la PK* (in DynamoDB, *la PK* is usually the partition key).
- The **schema** (*esquema*) is the shape of the data: which tables, which columns, which types.
- A **transaction** (*transacción*) is a group of writes that succeed or fail together: the order and the payment are both saved, or neither is.
- **JSON** stays *JSON*; a **field** is a *campo*.
- A **record** is a *registro*. Careful: *registro* is also a **log** entry (*revisa los registros en CloudWatch*), a **DNS record** (*un registro de alias*) and, in an app, sign-up (*el registro falla* = sign-up is failing). When a ticket says *falta un registro*, ask which kind.`,
          `**Primero, el porqué.** Toda aplicación guarda datos, y la mitad de las preguntas de una daily tienen que ver con eso: "¿qué tabla?", "¿ese campo está en el esquema?". La mayoría de estas palabras se parecen mucho en los dos idiomas. Una no: en español, *registro* esconde varias ideas distintas.

- Una **base de datos** (*database*; con el equipo *la base* o *la BD*, y en jerga *la DB*) es un sistema que guarda datos organizados para que los programas los lean y los escriban.
- En una base de datos relacional, una **tabla** (*table*) guarda un tipo de cosa en **filas** (*rows*) y **columnas** (*columns*). Piensa en una hoja de cálculo: cada fila es un cliente, cada columna una propiedad, como el email.
- Una **consulta** (*query*) le pide datos a la base. Con el equipo se suele decir *la query*, en femenino, como *consulta*; en buena parte de Latinoamérica también se oye *el query*.
- La **clave principal** (*primary key*) identifica cada fila, así que tiene que ser única. Por escrito verás tanto *clave principal* como *clave primaria*: elige una por documento. Al hablar, casi todo el mundo dice *clave primaria* o *la PK* (en DynamoDB, *la PK* suele ser la clave de partición).
- El **esquema** (*schema*) es la forma de los datos: qué tablas, qué columnas, qué tipos.
- Una **transacción** (*transaction*) es un grupo de escrituras que salen bien o fallan juntas: se guardan el pedido y el pago, o ninguno de los dos.
- **JSON** se queda como *JSON*; un **campo** es un *field*.
- Un **registro** es un *record*. Cuidado: *registro* también es una entrada de **log** (*revisa los registros en CloudWatch*), un **registro DNS** (*un registro de alias*) y, en una aplicación, el alta de usuarios (*el registro falla* = no se pueden registrar usuarios nuevos). Cuando un ticket diga *falta un registro*, pregunta de qué tipo.`,
        ),
        termTable(DATABASES),
        traps(DATABASES),
        both(
          '**In short:** tables, rows, columns, queries and transactions translate almost word for word; *registro* is the trap, because it can be a record, a log entry, a DNS record or a sign-up.',
          '**En resumen:** tablas, filas, columnas, consultas y transacciones se traducen casi palabra por palabra; la trampa es *registro*, que puede ser una fila de una tabla (*record*), una entrada de log, un registro DNS o el alta de un usuario.',
        ),
      ),
    },
    {
      id: 'cards-databases',
      kind: 'cards',
      title: both('Flashcards: databases', 'Tarjetas: bases de datos'),
      minutes: 7,
      body: both(
        'Each term in both directions. For *record*, say out loud the other things *registro* can mean before you flip.',
        'Cada término en las dos direcciones. Para *registro*, di en voz alta las otras cosas que puede significar antes de girar la tarjeta.',
      ),
      cards: cardsFor(DATABASES),
    },

    // ---------- Lesson 2: DynamoDB in Spanish (keys, then reads and indexes) ----------
    {
      id: 'dynamodb-spanish',
      kind: 'read',
      title: both('DynamoDB in Spanish: items and keys', 'DynamoDB en español: elementos y claves'),
      minutes: 4,
      body: join(
        both(
          `**Why first.** DynamoDB has its own vocabulary, and its Spanish documentation adds a twist: it uses two names for the same key.

- An **item** is one entry in a table, like a row. AWS's Spanish docs call it *elemento*; the team says *el ítem*. An **attribute** (*atributo*) is one piece of data inside it, like a column, except that each item can have different attributes.
- The **partition key** (*clave de partición*, *la PK*) decides where an item is stored. Careful: *PK* also means primary key (lesson 1). In DynamoDB conversations, *PK* and *SK* almost always mean partition key and sort key.
- The **sort key** orders the items that share a partition key. AWS's Spanish docs say *clave de ordenación*, and the same page also says *clave de clasificación*. This course uses *clave de ordenación*; what matters is to keep one form through a document. Out loud it's *la sort key* or *la SK*.
- A table can use just a partition key as its primary key (like Users, keyed by userId), or a partition key plus a sort key; then the two together form the primary key. Picture a filing cabinet: the partition key is the drawer, the sort key is the order of the folders inside it.`,
          `**Primero, el porqué.** DynamoDB tiene su propio vocabulario, y su documentación en español añade un giro: usa dos nombres para la misma clave.

- Un **elemento** (*item*) es una entrada de la tabla, como una fila. Así lo llama la documentación de AWS en español; el equipo dice *el ítem*. Un **atributo** (*attribute*) es un dato dentro del elemento, como una columna, solo que cada elemento puede tener atributos distintos.
- La **clave de partición** (*partition key*, *la PK*) decide dónde se guarda un elemento. Cuidado: *PK* también es la clave principal (lección 1). Al hablar de DynamoDB, *PK* y *SK* casi siempre significan clave de partición y clave de ordenación.
- La **clave de ordenación** (*sort key*) ordena los elementos que comparten clave de partición. La documentación de AWS en español dice *clave de ordenación*, y la misma página dice también *clave de clasificación*. Este curso usa *clave de ordenación*; lo importante es mantener una sola forma en todo el documento. Al hablar se dice *la sort key* o *la SK*.
- Una tabla puede usar solo la clave de partición como clave principal (como Users, con userId), o clave de partición y clave de ordenación; entonces las dos juntas forman la clave principal. Imagina un archivador: la clave de partición es el cajón, y la clave de ordenación, el orden de las carpetas dentro.`,
        ),
        termTable(['item-attribute', 'partition-key', 'sort-key']),
        both(
          '**In short:** item and attribute are *elemento* and *atributo*, *la PK* in DynamoDB is the partition key, and the sort key has two Spanish names (pick one and stay with it).',
          '**En resumen:** item y attribute son *elemento* y *atributo*, *la PK* en DynamoDB es la clave de partición, y la sort key tiene dos nombres en español (elige uno y mantenlo).',
        ),
      ),
    },
    {
      id: 'dynamodb-reads-indexes',
      kind: 'read',
      title: both('DynamoDB in Spanish: reads and indexes', 'DynamoDB en español: lecturas e índices'),
      minutes: 4,
      body: join(
        both(
          `**Why first.** Our login is slow because of how it reads the table. To explain the fix, in either language, you need the names of the two ways to read and of the indexes.

- A **Query** reads the items that share one partition key value; you can add a condition on the sort key. A **Scan** reads every item in the table and filters afterwards, so on a big table it's slow and expensive. Scan and Query are API names, so with the team they stay in English: *hacer un scan*, *hacer una query*. A formal document can say *la operación Scan*. AWS's Spanish documentation (machine-translated) mostly calls a Scan an *análisis* (sometimes *examen*) and a Query a *consulta*.
- An **index** (*índice*) is a second copy of some attributes, organized for a different lookup.
- A **global secondary index** (*índice secundario global*, the form in AWS's Spanish docs, or just *un GSI*) uses a different partition key, so you can query by email instead of by user ID. You can add one to an existing table. GSI reads are **eventually consistent**: the index can lag the table for a moment. In Spanish you'll see *consistencia eventual*, but don't write *eventualmente consistente*; say *el índice se actualiza con un pequeño retraso*.
- A **local secondary index** (*índice secundario local*, *un LSI*) keeps the same partition key with a different sort key, and unlike a GSI it can only be created together with the table.`,
          `**Primero, el porqué.** Nuestro login es lento por cómo lee la tabla. Para explicar la solución, en cualquiera de los dos idiomas, necesitas los nombres de las dos formas de leer y de los índices.

- Una **Query** lee los elementos que comparten un mismo valor de clave de partición; puedes añadir una condición sobre la clave de ordenación. Un **Scan** lee todos los elementos de la tabla y filtra después, así que en una tabla grande es lento y caro. Scan y Query son nombres de la API, así que con el equipo se quedan en inglés: *hacer un scan*, *hacer una query*. En un documento formal, *la operación Scan*. La documentación de AWS en español (traducida automáticamente) llama casi siempre *análisis* a un Scan (a veces *examen*) y *consulta* a una Query.
- Un **índice** (*index*) es una segunda copia de algunos atributos, organizada para otra búsqueda.
- Un **índice secundario global** (así lo llama la documentación de AWS en español; con el equipo, *un GSI*) usa otra clave de partición, para que puedas consultar por email en vez de por ID de usuario. Se puede añadir a una tabla que ya existe. Las lecturas de un GSI tienen **consistencia eventual**: el índice puede ir un momento por detrás de la tabla. No escribas *eventualmente consistente*; di *el índice se actualiza con un pequeño retraso*.
- Un **índice secundario local** (*local secondary index*, *un LSI*) mantiene la misma clave de partición con otra clave de ordenación y, a diferencia de un GSI, solo se puede crear junto con la tabla.`,
        ),
        termTable(['scan', 'index']),
        both(
          '**In short:** a Query reads the items with one partition key value while a Scan reads everything, a GSI lets you query by another key (and lags a moment behind the table), and an LSI only changes the sort key.',
          '**En resumen:** una Query lee los elementos con un mismo valor de clave de partición mientras que un Scan lo lee todo, un GSI te deja consultar por otra clave (y va un momento por detrás de la tabla), y un LSI solo cambia la clave de ordenación.',
        ),
      ),
    },
    {
      id: 'cards-dynamodb',
      kind: 'cards',
      title: both('Flashcards: DynamoDB', 'Tarjetas: DynamoDB'),
      minutes: 5,
      body: both(
        'Five DynamoDB terms in both directions. For the sort key, give both Spanish names before you flip.',
        'Cinco términos de DynamoDB en las dos direcciones. Para la sort key, di los dos nombres en español antes de girar la tarjeta.',
      ),
      cards: cardsFor(DYNAMODB),
    },
    {
      id: 'gsi-proposal-es',
      kind: 'rewrite',
      title: both('Write it: propose a GSI in Spanish', 'Escríbelo: propón un GSI en español'),
      minutes: 9,
      body: both(
        "Your notes are in English, and Lucía reads Spanish more comfortably. It's a Slack message to a teammate, so the team register is fine (*un GSI*, *hacer un scan*, *una query*), but the reasoning has to be complete: she approves or rejects the PR based on it. *Coste* (Spain) and *costo* (Latin America) both pass. *Clave* and *llave* (common in Latin America) both pass.",
        'Tus notas están en inglés, y Lucía se siente más cómoda leyendo en español. Es un mensaje de Slack a una compañera, así que el registro de equipo vale (*un GSI*, *hacer un scan*, *una query*), pero el razonamiento tiene que estar completo: va a aprobar o rechazar la PR según lo que lea en él. *Coste* (España) y *costo* (Latinoamérica) valen los dos. *Clave* y *llave* (muy usada en Latinoamérica) valen las dos.',
      ),
      target: 'es',
      source: `Notes for Lucía (Slack, #backend):
- Login looks users up by email, but the partition key of the Users table is userId.
- So getUserByEmail does a Scan: it reads every item in the table (~2 million) to find one.
- p99 login latency is 1.8 s, and the scan eats most of our read capacity. Read cost is up 40% this month.
- Proposal: add a global secondary index (GSI) with the email attribute as its partition key.
- Then we run a Query on the GSI instead of a Scan: it reads only the matching item.
- A GSI can be added to the existing table; it backfills in the background, no downtime.
- Caveat: GSI reads are eventually consistent, so right after someone changes their email, the index may lag for a moment.
- Ask: can she review the CDK change in my PR before Thursday?`,
      task: both(
        'Write the Slack message to Lucía in Spanish: the table and its partition key, why getUserByEmail does a scan and what it costs (latency and read capacity), your proposal (a GSI with the email attribute as its key), how the query changes, that it can be added without downtime, the caveat about the index lagging for a moment, and your request for a review.',
        'Escribe el mensaje de Slack para Lucía en español: la tabla y su clave de partición, por qué getUserByEmail hace un scan y lo que cuesta (latencia y capacidad de lectura), tu propuesta (un GSI con el atributo email como clave), cómo cambia la consulta, que se puede añadir sin cortar el servicio, el matiz de que el índice puede ir un momento por detrás y tu petición de revisión.',
      ),
      minWords: 45,
      mustUse: [
        { any: ['tabla*'], label: 'tabla' },
        { any: ['clave de particion', 'claves de particion', 'llave de particion', 'llaves de particion', 'partition key', 'PK'], label: 'clave de partición' },
        { any: ['scan*', 'escane*', 'examen', 'analisis', 'recorr*', 'lee toda', 'leer toda', 'lee todos', 'leer todos', 'leemos toda', 'leemos todos'], label: 'scan' },
        { any: ['GSI', 'indice*'], label: 'GSI / índice secundario global' },
        { any: ['atributo*', 'campo*', 'email', 'correo'], label: 'el atributo email' },
        { any: ['consult*', 'query', 'querys', 'queries'], label: 'consulta / query' },
        { any: ['cost*', 'cuest*', 'capacidad*', 'RCU*', 'unidades de lectura', 'factura*', 'gast*', 'caro', 'cara', 'carisim*'], label: 'coste / costo' },
        { any: ['revis*', 'review*', 'mirar*', 'mirada', 'miras', 'ojeada', 'vistazo', 'echar un ojo', 'echas un ojo', 'echarle un ojo', 'visto bueno', 'aprob*'], label: 'revisar la PR' },
      ],
      avoid: [
        {
          any: ['eventualmente'],
          why: both(
            'In Spanish, *eventualmente* usually means "possibly" or "now and then", not "eventually". Say what happens in plain words: *el índice se actualiza con un pequeño retraso* or *puede ir un momento por detrás de la tabla*.',
            'En español, *eventualmente* suele significar "posiblemente" u "ocasionalmente", no "al final". Di lo que pasa con palabras claras: *el índice se actualiza con un pequeño retraso* o *puede ir un momento por detrás de la tabla*.',
          ),
        },
      ],
      model: `Hola, Lucía: te cuento una propuesta para el login. Ahora mismo getUserByEmail hace un scan de la tabla Users, porque la clave de partición es userId y no el email. Eso lee los 2 millones de elementos en cada login: el p99 está en 1,8 s, y el scan consume la mayor parte de la capacidad de lectura (el coste de lecturas subió un 40% este mes).

Propongo añadir un índice secundario global (GSI) con el atributo email como clave de partición. Así hacemos una consulta (Query) sobre el GSI en lugar del scan, y solo leemos el elemento que buscamos. El GSI se puede crear en la tabla actual y se rellena en segundo plano, sin cortar el servicio.

Un matiz: el índice se actualiza con un pequeño retraso, así que justo después de que alguien cambie su email puede que no lo encontremos durante un momento.

¿Puedes revisar el cambio de CDK en mi PR antes del jueves? ¡Gracias!`,
    },

    // ---------- Lesson 3: copies and moving data ----------
    {
      id: 'copies-moving-data',
      kind: 'read',
      title: both('Copies and moving data', 'Copias y movimiento de datos'),
      minutes: 7,
      body: join(
        both(
          `**Why first.** Before any risky change, someone asks "is there a backup?" and someone else answers "PITR is on". With copies and moves, a misunderstanding costs real data.

- A **backup** is a copy you keep to recover from a mistake. In a document it's *copia de seguridad* (in Latin America, *copia de respaldo* is also common in writing); with the team, *backup* or *respaldo*. DynamoDB's point-in-time recovery (**PITR**; *recuperación a un momento dado*) can restore a table as it was at any second of its recovery period (35 days at most).
- To **restore** is *restaurar*; with the team, *restaurar el backup* or, in many teams, *levantar el backup*. In some places *levantar un backup* means taking one, so say *restaurar* when it matters. In DynamoDB, a restore always creates a **new** table.
- A **replica** (*réplica*) is a copy kept up to date continuously, usually a few seconds behind; **replication** (*replicación*) is the process. A replica is **not** a backup: a backup is a photo of a room; a replica is a live video of it: if someone knocks over a vase, the video shows it broken too.
- A **migration** (*migración*) moves data or changes its structure: adding a column, or moving a database with AWS DMS.
- **ETL** (extract, transform, load; *extraer, transformar, cargar*) is a job that pulls data out, cleans it and loads it somewhere else. AWS Glue runs ETL jobs.
- A **stream** (*flujo de datos* or *secuencia*; with the team, *el stream*) is a continuous series of changes. DynamoDB Streams records every change to a table's items and can trigger a Lambda function.
- A **data lake** (*lago de datos*) keeps raw data in any format, usually in S3. A **data warehouse** (*almacén de datos*), such as Amazon Redshift, holds cleaned, structured data ready for reports.`,
          `**Primero, el porqué.** Antes de cualquier cambio arriesgado, alguien pregunta "¿hay backup?" y otra persona contesta "PITR está activado". Al copiar y mover datos, un malentendido cuesta datos de verdad.

- Una **copia de seguridad** (*backup*) es una copia que guardas para recuperarte de un error. En un documento se dice *copia de seguridad* (en Latinoamérica también es habitual *copia de respaldo* por escrito); con el equipo, *backup* o *respaldo*. La recuperación a un momento dado (*point-in-time recovery*, **PITR**) de DynamoDB puede restaurar una tabla tal como estaba en cualquier segundo de su periodo de recuperación (35 días como máximo).
- **Restaurar** es *restore*; con el equipo, *restaurar el backup* o, en muchos equipos, *levantar el backup*. En algunos sitios *levantar un backup* significa hacerlo, así que di *restaurar* cuando importe. En DynamoDB, una restauración siempre crea una tabla **nueva**.
- Una **réplica** (*replica*) es una copia que se actualiza continuamente, con unos segundos de retraso; la **replicación** (*replication*) es el proceso. Una réplica **no** es una copia de seguridad: una copia de seguridad es una foto de una habitación; una réplica, un video en vivo: si alguien tira un jarrón, el video también lo muestra roto.
- Una **migración** (*migration*) mueve datos o cambia su estructura: añade una columna, o mueve una base de datos con AWS DMS.
- **ETL** (*extract, transform, load*: extraer, transformar, cargar) es un proceso que saca los datos, los limpia y los carga en otro sitio. AWS Glue ejecuta procesos ETL.
- Un **flujo de datos** o **secuencia** (*stream*; con el equipo, *el stream*) es una serie continua de cambios. DynamoDB Streams registra cada cambio en los elementos de una tabla y puede activar una función Lambda.
- Un **lago de datos** (*data lake*) guarda datos en bruto de cualquier formato, normalmente en S3. Un **almacén de datos** (*data warehouse*), como Amazon Redshift, guarda datos limpios y ordenados para informes.`,
        ),
        termTable(COPIES),
        traps(COPIES),
        both(
          '**In short:** a backup is a photo you can restore (into a new table, in DynamoDB), a replica is a live copy that also copies your mistakes, and migrations, ETL jobs and streams are the ways data moves.',
          '**En resumen:** una copia de seguridad es una foto que puedes restaurar (en una tabla nueva, en DynamoDB), una réplica es una copia en vivo que también copia tus errores, y las migraciones, los procesos ETL y los streams son las formas en que se mueven los datos.',
        ),
      ),
    },
    {
      id: 'cards-copies',
      kind: 'cards',
      title: both('Flashcards: copies and moving data', 'Tarjetas: copias y movimiento de datos'),
      minutes: 6,
      body: both(
        'Seven terms in both directions. For backup, say the document form and the team form before you flip.',
        'Siete términos en las dos direcciones. Para backup, di la forma de documento y la de equipo antes de girar la tarjeta.',
      ),
      cards: cardsFor(COPIES),
    },

    // ---------- Lesson 4: data and AI ----------
    {
      id: 'data-and-ai',
      kind: 'read',
      title: both('Data and AI', 'Datos e IA'),
      minutes: 5,
      body: join(
        both(
          `**Why first.** AI projects bring new words fast, and teams mix the languages freely: "pásame el dataset", "afina el prompt", "corre el job de training". In a proposal for a client, though, you'll want the Spanish forms, and you need to know which ones exist.

- A **dataset** (*conjunto de datos*) is a collection of data prepared for one purpose, such as training a model. With the team it's just *el dataset*.
- **Big data** (*macrodatos*, also *datos masivos*) means data too big or too fast for one ordinary database. *Macrodatos* exists, but at the office everyone says *big data*. Amazon EMR runs tools like Spark over it.
- **Machine learning** (*aprendizaje automático*) is software that learns patterns from examples instead of following rules someone wrote by hand. You **train** (*entrenar*) a **model** (*modelo*) on a dataset; on AWS, Amazon SageMaker AI is the service for that. Think of a student who works through thousands of solved exercises until they can solve new ones alone: that practice is the training.
- An **LLM** (*modelo de lenguaje grande*; you'll also see *gran modelo de lenguaje* and *modelo de lenguaje de gran tamaño*: pick one and keep it) is a model trained on huge amounts of text that can write, summarize and answer questions. The **prompt** (*instrucción*, though everyone says *el prompt*) is what you send it, and **inference** (*inferencia*) is running the model to get an answer. Amazon Bedrock runs inference on the model you choose.
- In a formal document, write the Spanish form with the acronym the first time, *modelo de lenguaje grande (LLM)*; after that, *el LLM* is fine.`,
          `**Primero, el porqué.** Los proyectos de IA traen palabras nuevas muy deprisa, y los equipos mezclan los idiomas sin problema: "pásame el dataset", "afina el prompt", "corre el job de training". En una propuesta para un cliente, en cambio, querrás las formas en español, y necesitas saber cuáles existen.

- Un **conjunto de datos** (*dataset*) es una colección de datos preparada para un fin, como entrenar un modelo. Con el equipo se dice *el dataset*, sin más.
- **Macrodatos** (también *datos masivos*; en inglés, *big data*) son datos demasiado grandes o demasiado rápidos para una base de datos normal. *Macrodatos* existe, pero en la oficina todo el mundo dice *big data*. Amazon EMR ejecuta herramientas como Spark sobre ellos.
- El **aprendizaje automático** (*machine learning*) es software que aprende patrones a partir de ejemplos en lugar de seguir reglas escritas a mano. **Entrenas** (*train*) un **modelo** (*model*) con un conjunto de datos; en AWS, el servicio para eso es Amazon SageMaker AI. Piensa en un estudiante que resuelve miles de ejercicios ya corregidos hasta que puede resolver ejercicios nuevos por su cuenta: esa práctica es el entrenamiento.
- Un **LLM** (*modelo de lenguaje grande*; también verás *gran modelo de lenguaje* y *modelo de lenguaje de gran tamaño*: elige una forma y mantenla) es un modelo entrenado con enormes cantidades de texto que puede redactar, resumir y responder preguntas. El **prompt** (*instrucción*, aunque todo el mundo dice *el prompt*) es lo que le envías, y la **inferencia** (*inference*) es ejecutar el modelo para obtener una respuesta. Amazon Bedrock ejecuta la inferencia en el modelo que elijas.
- En un documento formal, escribe la forma en español con la sigla la primera vez, *modelo de lenguaje grande (LLM)*; después, *el LLM* está bien.`,
        ),
        termTable(DATA_AI),
        traps(DATA_AI),
        both(
          '**In short:** *conjunto de datos*, *aprendizaje automático* and *modelo de lenguaje grande* are the written forms, and *macrodatos* is the Spanish alternative to big data; with the team, dataset, big data, ML, LLM and prompt stay in English.',
          '**En resumen:** *conjunto de datos*, *aprendizaje automático* y *modelo de lenguaje grande* son las formas escritas, y *macrodatos* es la alternativa en español a big data; con el equipo, dataset, big data, ML, LLM y prompt se quedan en inglés.',
        ),
      ),
    },
    {
      id: 'cards-data-ai',
      kind: 'cards',
      title: both('Flashcards: data and AI', 'Tarjetas: datos e IA'),
      minutes: 4,
      body: both(
        'Four terms in both directions. For each one, say the formal Spanish form and what the team actually says.',
        'Cuatro términos en las dos direcciones. Para cada uno, di la forma formal en español y lo que de verdad dice el equipo.',
      ),
      cards: cardsFor(DATA_AI),
    },

    // ---------- Register practice ----------
    {
      id: 'register-data',
      kind: 'register',
      title: both('Formal, team or slang?', '¿Formal, de equipo o jerga?'),
      minutes: 6,
      body: both(
        'Phrases from real Slack messages, client emails, design docs and meetings, in both languages. Decide where each one fits best.',
        'Frases de mensajes de Slack, correos a clientes, documentos de diseño y reuniones reales, en los dos idiomas. Decide dónde encaja mejor cada una.',
      ),
      items: [
        {
          text: 'Le informamos de que la migración de la base de datos se realizará el sábado de 02:00 a 04:00 (UTC). Antes se hará una copia de seguridad completa.',
          context: both('Email to a client', 'Correo a un cliente'),
          answer: 'formal',
          explain: both(
            '"Base de datos", "migración" and "copia de seguridad" are the formal forms, and the passive with *se* ("se realizará", "se hará") reads like a document. With the team: "el sábado migramos la base, antes sacamos un backup".',
            '"Base de datos", "migración" y "copia de seguridad" son las formas formales, y las construcciones con *se* ("se realizará", "se hará") suenan a documento. Con el equipo: "el sábado migramos la base, antes sacamos un backup".',
          ),
        },
        {
          text: '¿Añadimos un GSI por email? Así dejamos de hacer un scan en cada login.',
          context: both('Slack, #backend', 'Slack, #backend'),
          answer: 'team',
          explain: both(
            '"Un GSI" and "hacer un scan" are how the team talks: the acronym and the API name stay in English. A design doc would say "índice secundario global" and "operación Scan".',
            '"Un GSI" y "hacer un scan" son como habla el equipo: la sigla y el nombre de la API se quedan en inglés. Un documento de diseño diría "índice secundario global" y "operación Scan".',
          ),
        },
        {
          text: 'La DB está frita: la query hace scan de toda la tabla y se come la capacidad 😅',
          context: both('Slack, direct message', 'Slack, mensaje directo'),
          answer: 'slang',
          explain: both(
            '"La DB" is the slang form ("la base" or "la BD" with the team, "base de datos" in writing), and "está frita" and "se come la capacidad" are slang too. Fine between two developers, never in a ticket for a client.',
            '"La DB" es la forma de jerga ("la base" o "la BD" con el equipo, "base de datos" por escrito), y "está frita" y "se come la capacidad" también son jerga. Bien entre dos desarrolladores, nunca en un ticket para un cliente.',
          ),
        },
        {
          text: 'La clave de ordenación es la fecha del pedido, lo que permite obtener los elementos en orden cronológico.',
          context: both('Design document', 'Documento de diseño'),
          answer: 'formal',
          explain: both(
            '"Clave de ordenación" and "elementos" are the forms in AWS\'s Spanish docs (which also say "clave de clasificación": pick one). With the team: "la sort key es la fecha", "los ítems salen ordenados".',
            '"Clave de ordenación" y "elementos" son las formas de la documentación de AWS en español (que también dice "clave de clasificación": elige una). Con el equipo: "la sort key es la fecha", "los ítems salen ordenados".',
          ),
        },
        {
          text: 'Levanto el backup de anoche en una tabla aparte y comparamos los datos.',
          context: both('Stand-up', 'Daily'),
          answer: 'team',
          explain: both(
            'In many teams, "levantar el backup" is how you say "restaurar la copia de seguridad" (in some places it means taking one, but "en una tabla aparte" leaves no doubt here). It is also accurate: a DynamoDB restore always creates a new table.',
            'En muchos equipos, "levantar el backup" es la forma de decir "restaurar la copia de seguridad" (en algunos sitios significa hacerlo, pero aquí "en una tabla aparte" no deja dudas). Además es exacto: una restauración de DynamoDB siempre crea una tabla nueva.',
          ),
        },
        {
          text: "Heads-up: I'm adding the new GSI after lunch. It takes a while to backfill, so don't query it until it shows as Active.",
          context: both('Slack, #backend', 'Slack, #backend'),
          answer: 'team',
          explain: both(
            'Clear and friendly, with contractions and "heads-up": normal team English. A formal note would say "The new global secondary index will be created this afternoon and will be available once its status is ACTIVE."',
            'Claro y cercano, con contracciones y "heads-up": inglés normal de equipo. Una nota formal diría "The new global secondary index will be created this afternoon and will be available once its status is ACTIVE."',
          ),
        },
        {
          text: 'The migration will be carried out during the scheduled maintenance window. A full backup will be taken beforehand, and the system will remain read-only for approximately two hours.',
          context: both('Email to a client', 'Correo a un cliente'),
          answer: 'formal',
          explain: both(
            'Passive voice ("will be carried out", "will be taken"), "scheduled maintenance window" and "approximately" read like a formal notice. With the team: "we\'re migrating early Saturday UTC (Friday evening in Seattle and Mexico City), backup first, about two hours read-only".',
            'La voz pasiva ("will be carried out", "will be taken"), "scheduled maintenance window" y "approximately" suenan a aviso formal. Con el equipo: "we\'re migrating early Saturday UTC (Friday evening in Seattle and Mexico City), backup first, about two hours read-only".',
          ),
        },
        {
          text: "lol the nightly ETL blew up again, the data lake's turning into a data swamp",
          context: both('Slack, #data', 'Slack, #data'),
          answer: 'slang',
          explain: both(
            '"Lol", "blew up" and "data swamp" (a joke for a messy, unmanaged data lake) are slang. With the team: "the nightly ETL job failed again". In Spanish: "el proceso ETL nocturno falló" in a report; as slang, "el ETL petó otra vez" in Spain or "el ETL tronó otra vez" in Mexico.',
            '"Lol", "blew up" y "data swamp" (broma para un data lake desordenado y sin gestionar) son jerga. Con el equipo: "the nightly ETL job failed again". En español: "el proceso ETL nocturno falló" en un informe; en jerga, "el ETL petó otra vez" en España o "el ETL tronó otra vez" en México.',
          ),
        },
        {
          text: 'La inferencia se ejecuta en Amazon Bedrock con un modelo de lenguaje grande (LLM) seleccionado por el cliente.',
          context: both('Proposal for a client', 'Propuesta para un cliente'),
          answer: 'formal',
          explain: both(
            '"Modelo de lenguaje grande (LLM)", with the acronym the first time, and "inferencia" are the formal forms. With the team: "el LLM corre en Bedrock".',
            '"Modelo de lenguaje grande (LLM)", con la sigla la primera vez, e "inferencia" son las formas formales. Con el equipo: "el LLM corre en Bedrock".',
          ),
        },
        {
          text: 'Pásame el dataset limpio y esta tarde entreno el modelo.',
          context: both('Slack, #ml', 'Slack, #ml'),
          answer: 'team',
          explain: both(
            '"El dataset" is what the team says; "entrenar el modelo" is the same in every register. In a report: "el conjunto de datos depurado".',
            '"El dataset" es lo que dice el equipo; "entrenar el modelo" es igual en todos los registros. En un informe: "el conjunto de datos depurado".',
          ),
        },
      ],
    },

    // ---------- Writing: migration heads-up in English ----------
    {
      id: 'migration-heads-up-en',
      kind: 'rewrite',
      title: both('Write it: a migration heads-up in English', 'Escríbelo: un aviso de migración en inglés'),
      minutes: 9,
      body: both(
        'Your notes are in Spanish, and #eng-announcements is in English. Engineers in three time zones will read it on Friday afternoon: say when, what changes for them, how the data is protected and what happens if it goes wrong. Give the time in UTC: for Seattle and Mexico City it is still Friday evening. Team register is fine; make it easy to scan.',
        'Tus notas están en español y #eng-announcements está en inglés. Lo van a leer ingenieros de tres zonas horarias el viernes por la tarde: di cuándo, qué cambia para ellos, cómo se protegen los datos y qué pasa si algo sale mal. Da la hora en UTC: en Seattle y Ciudad de México todavía es viernes por la tarde-noche. El registro de equipo está bien; que se pueda leer de un vistazo.',
      ),
      target: 'en',
      source: `Notas para el aviso en #eng-announcements (en inglés):
- Sábado 5 de diciembre, de 02:00 a 04:00 UTC (viernes por la tarde-noche en Seattle y Ciudad de México): migramos la base de datos de pedidos de RDS for PostgreSQL a Aurora PostgreSQL, con AWS DMS.
- Antes de empezar sacamos una copia de seguridad completa (snapshot manual) y comprobamos que se puede restaurar.
- Durante la migración, la API de pedidos queda en solo lectura: se pueden consultar pedidos, pero no crear pedidos nuevos.
- La réplica de lectura de reporting se vuelve a crear después.
- El proceso ETL nocturno de Glue hacia el lago de datos se pausa esa noche y se pone al día el domingo.
- Si algo sale mal: restauramos desde la copia y volvemos a la base de datos antigua.
- Dudas: en el hilo de este mensaje o a @Marta.`,
      task: both(
        'Write the heads-up in English: when the migration happens (with the time zone), which database moves where, the backup and the restore test, that the orders API will be read-only, what happens to the read replica and the nightly ETL job, the rollback plan, and where to ask questions.',
        'Escribe el aviso en inglés: cuándo es la migración (con la zona horaria), qué base de datos se mueve y adónde, la copia de seguridad y la prueba de restauración, que la API de pedidos quedará en solo lectura, qué pasa con la réplica de lectura y con el proceso ETL nocturno, el plan de vuelta atrás y dónde preguntar.',
      ),
      minWords: 50,
      mustUse: [
        { any: ['migrat*', 'moving', 'move', 'moves', 'cutover', 'cut over', 'cut-over'], label: 'migration' },
        { any: ['database*', 'DB', 'Aurora', 'Postgres*', 'RDS'], label: 'database' },
        { any: ['UTC', 'GMT'], label: 'time zone (UTC)' },
        { any: ['backup*', 'back up', 'backed up', 'backing up', 'snapshot*'], label: 'backup' },
        { any: ['restor*', 'recover*'], label: 'restore' },
        { any: ['read-only', 'read only', 'readonly', 'no writes', 'writes will', 'writes are', 'writes to', 'block* writes', 'disable* writes', "can't create", 'cannot create', 'can not create', "won't be able to create", 'no new orders', 'only serve reads', 'only accept reads', 'reads only', 'only reads', "can't place", 'cannot place', "won't be able to place", 'order creation', 'creating orders', 'placing orders'], label: 'read-only' },
        { any: ['replica*', 'replication'], label: 'read replica' },
        { any: ['ETL', 'Glue', 'data lake'], label: 'ETL / data lake' },
        { any: ['roll back', 'rollback*', 'roll-back*', 'rolling back', 'revert*', 'fall back', 'fallback*', 'switch back', 'go back', 'move back', 'back to the old', 'back at the old', 'back to RDS', 'traffic back', 'app back', 'point it back', 'undo'], label: 'rollback plan' },
      ],
      avoid: [
        {
          any: ['security copy', 'security copies', 'copy of security', 'copies of security', 'safety copy', 'safety copies'],
          why: both(
            '"Security copy" is a calque of "copia de seguridad". In English it\'s a "backup" (or a "snapshot", for a database or a disk).',
            '"Security copy" es un calco de "copia de seguridad". En inglés es un "backup" (o un "snapshot", para una base de datos o un disco).',
          ),
        },
        {
          any: ['realize the migration', 'realize a migration', 'realized the migration', 'realizing the migration', 'realise the migration', 'realised the migration', 'realize the backup', 'realize a backup', 'realization of the migration', 'realisation of the migration'],
          why: both(
            '"Realize" means "to notice". For "realizar una migración", write "run", "do" or "carry out the migration".',
            '"Realize" significa "darse cuenta". Para "realizar una migración", escribe "run", "do" o "carry out the migration".',
          ),
        },
      ],
      model: `Heads-up: orders database migration this Saturday, Dec 5, 02:00–04:00 UTC (Friday evening in Seattle and Mexico City).

- We're migrating the orders database from RDS for PostgreSQL to Aurora PostgreSQL with AWS DMS.
- Before we start, we'll take a full manual snapshot as a backup and test that we can restore it.
- During the window the orders API will be read-only: you can still look up orders, but nobody can create new ones.
- The reporting read replica will be recreated afterwards. The nightly Glue ETL job to the data lake is paused that night and will catch up on Sunday.
- If anything goes wrong, we'll restore from the backup and roll back to the old database.

Questions? Reply in this thread or ping @Marta.`,
    },

    // ---------- Final quiz ----------
    {
      id: 'quiz-data',
      kind: 'quiz',
      title: both('Check: data', 'Comprueba: datos'),
      minutes: 6,
      questions: [
        {
          q: both(
            'getUserByEmail reads every item in a two-million-item DynamoDB table to find one user. Which operation is it running?',
            'getUserByEmail lee todos los elementos de una tabla de DynamoDB con dos millones de elementos para encontrar a un usuario. ¿Qué operación está haciendo?',
          ),
          options: ['Query', 'Scan', 'GetItem', 'TransactWriteItems'],
          answer: 1,
          explain: both(
            'A Scan reads the whole table and filters afterwards. A Query reads the items with one partition key value, so it needs the partition key; GetItem reads one item by its full primary key. To look users up by email, add a GSI with email as its partition key and run a Query on it.',
            'Un Scan lee toda la tabla y filtra después. Una Query lee los elementos con un mismo valor de clave de partición, así que necesita la clave de partición; GetItem lee un elemento por su clave principal completa. Para buscar usuarios por email, añade un GSI con el email como clave de partición y haz una Query sobre él.',
          ),
        },
        {
          q: both(
            "How do AWS's Spanish DynamoDB docs translate *sort key*?",
            '¿Cómo traduce *sort key* la documentación de DynamoDB de AWS en español?',
          ),
          options: [
            both('Only *clave de ordenación*', 'Solo *clave de ordenación*'),
            both('Only *clave de clasificación*', 'Solo *clave de clasificación*'),
            both('Both, sometimes on the same page', 'Con las dos, a veces en la misma página'),
            both('They leave it as *sort key*', 'La dejan como *sort key*'),
          ],
          answer: 2,
          explain: both(
            'The same page says *clave de ordenación* and *clave de clasificación*. The docs are machine-translated, so neither is a standard: choose one (this course uses *clave de ordenación*) and keep it through the document. Out loud, the team says *la sort key* or *la SK*.',
            'La misma página dice *clave de ordenación* y *clave de clasificación*. Es una traducción automática, así que ninguna es un estándar: elige una (este curso usa *clave de ordenación*) y mantenla en todo el documento. Al hablar, el equipo dice *la sort key* o *la SK*.',
          ),
        },
        {
          q: both(
            'A ticket in Spanish says *falta un registro*. What can *registro* mean here?',
            'Un ticket en español dice *falta un registro*. ¿Qué puede significar *registro* aquí?',
          ),
          options: [
            both('Only a database record', 'Solo un registro (una fila) de una base de datos'),
            both('Only a log entry', 'Solo una entrada de log'),
            both('A database record, a log entry, a DNS record or a sign-up: ask which', 'Un registro de base de datos, una entrada de log, un registro DNS o un alta de usuario: pregunta cuál'),
            both('A schema', 'Un esquema'),
          ],
          answer: 2,
          explain: both(
            'In Spanish one word covers several ideas: a record in a table, a log entry (*los registros de CloudWatch*), a DNS record (*un registro de alias*) and, in an app, a user sign-up. When the context doesn\'t make it clear, ask before you go looking in the wrong place.',
            'En español una palabra cubre varias ideas: un registro (fila) de una tabla, una entrada de log (*los registros de CloudWatch*), un registro DNS (*un registro de alias*) y, en una aplicación, el alta de un usuario. Cuando el contexto no lo deja claro, pregunta antes de ir a buscar al sitio equivocado.',
          ),
        },
        {
          q: both(
            'You restore a DynamoDB table with point-in-time recovery to yesterday at 09:00. What happens?',
            'Con la recuperación a un momento dado, restauras una tabla de DynamoDB al estado en que estaba ayer a las 09:00. ¿Qué pasa?',
          ),
          options: [
            both('The table is overwritten in place', 'La tabla se sobrescribe en su sitio'),
            both('A new table is created with the data as it was at that moment', 'Se crea una tabla nueva con los datos como estaban en ese momento'),
            both('Only the GSIs are restored', 'Solo se restauran los GSI'),
            both('The read replica is promoted', 'Se promueve la réplica de lectura'),
          ],
          answer: 1,
          explain: both(
            'A DynamoDB restore always creates a new table; your app keeps using the old one until you point it at the new one or copy the data back. That\'s why you say *lo restauro en una tabla aparte*.',
            'Una restauración de DynamoDB siempre crea una tabla nueva; tu aplicación sigue usando la anterior hasta que la apuntes a la nueva o copies los datos de vuelta. Por eso se dice *lo restauro en una tabla aparte*.',
          ),
        },
        {
          q: both(
            'Someone deletes 500 orders by mistake. Why doesn\'t the read replica save you?',
            'Alguien borra 500 pedidos por error. ¿Por qué no te salva la réplica de lectura?',
          ),
          options: [
            both('Because replicas only copy the schema', 'Porque las réplicas solo copian el esquema'),
            both('Because the replica copies the deletion too: a replica is not a backup', 'Porque la réplica también copia el borrado: una réplica no es una copia de seguridad'),
            both('Because replicas can only be created with the table', 'Porque las réplicas solo se pueden crear junto con la tabla'),
            both('Because a replica is only an ETL job', 'Porque una réplica es solo un proceso ETL'),
          ],
          answer: 1,
          explain: both(
            'A replica is kept up to date continuously, so it receives the mistake within seconds. To go back in time you need a backup, such as a snapshot or point-in-time recovery. Remember the photo and the live video.',
            'Una réplica se actualiza continuamente, así que recibe el error en segundos. Para volver atrás en el tiempo necesitas una copia de seguridad, como un snapshot o la recuperación a un momento dado. Recuerda la foto y el video en vivo.',
          ),
        },
        {
          q: both(
            'Raw files of every format land in S3 and are queried later with Athena. What is that?',
            'Archivos en bruto de todo tipo llegan a S3 y después se consultan con Athena. ¿Qué es eso?',
          ),
          options: [
            both('A data lake (*lago de datos*)', 'Un lago de datos (*data lake*)'),
            both('A data warehouse (*almacén de datos*)', 'Un almacén de datos (*data warehouse*)'),
            both('A read replica (*réplica de lectura*)', 'Una réplica de lectura (*read replica*)'),
            both('A stream (*flujo de datos*)', 'Un flujo de datos (*stream*)'),
          ],
          answer: 0,
          explain: both(
            'A data lake keeps raw data in any format, usually in S3. A data warehouse, such as Redshift, holds cleaned, structured data ready for reports. An ETL job often moves data from the lake to the warehouse.',
            'Un lago de datos guarda datos en bruto, en cualquier formato, normalmente en S3. Un almacén de datos, como Redshift, guarda datos limpios y estructurados, listos para informes. A menudo un proceso ETL mueve los datos del lago al almacén.',
          ),
        },
        {
          q: both(
            'You write a formal proposal in Spanish. How do you name *machine learning* and the LLM the first time?',
            'Escribes una propuesta formal en español. ¿Cómo nombras *machine learning* y el LLM la primera vez?',
          ),
          options: [
            both('*Aprendizaje automático* and *modelo de lenguaje grande (LLM)*', '*Aprendizaje automático* y *modelo de lenguaje grande (LLM)*'),
            both('*Máquina que aprende* and *el LLM*', '*Máquina que aprende* y *el LLM*'),
            both('*Machine learning* and *el prompt*', '*Machine learning* y *el prompt*'),
            both('*Macrodatos* and *conjunto de datos*', '*Macrodatos* y *conjunto de datos*'),
          ],
          answer: 0,
          explain: both(
            '*Aprendizaje automático* is the usual written form, and *modelo de lenguaje grande* goes with its acronym the first time; after that, *el LLM* is fine. *Macrodatos* is big data and *conjunto de datos* is a dataset: other ideas.',
            '*Aprendizaje automático* es la forma habitual por escrito, y *modelo de lenguaje grande* va con su sigla la primera vez; después, *el LLM* está bien. *Macrodatos* es big data y *conjunto de datos* es un dataset: otras ideas.',
          ),
        },
        {
          q: both(
            'You want to tell a client: "El sábado realizaremos la migración, después de hacer una copia de seguridad completa; si hace falta, la API quedará en solo lectura." Which English sentence says that?',
            'Quieres decirle a un cliente: "El sábado realizaremos la migración, después de hacer una copia de seguridad completa; si hace falta, la API quedará en solo lectura." ¿Qué frase en inglés dice eso?',
          ),
          options: [
            'We will realize the migration on Saturday.',
            'We will make a security copy before the migration.',
            'We will carry out the migration on Saturday, after taking a full backup; if needed, the API will be read-only.',
            'Eventually, the orders API will be in read-only mode.',
          ],
          answer: 2,
          explain: both(
            '"Realize" means "to notice" (the trap comes from "realizar"), "security copy" is a calque of "copia de seguridad" (say "backup"), and "eventually" means "in the end", not "possibly" or "if needed". "Carry out the migration", "take a backup" and "if needed" are the natural forms.',
            '"Realize" significa "darse cuenta" (la trampa viene de "realizar"), "security copy" es un calco de "copia de seguridad" (di "backup") y "eventually" significa "al final", no "posiblemente" ni "si hace falta". "Carry out the migration", "take a backup" e "if needed" son las formas naturales.',
          ),
        },
      ],
    },
  ],
};

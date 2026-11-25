// Module 3: DevOps and CI/CD (paid).
// Lessons: the pipeline; containers and infrastructure as code; releasing
// without fear; when something goes down. Translations come from the glossary
// (termTable, traps, cardsFor). The only "this is what AWS uses" claim is about
// "implementación" / "despliegue" in CodeDeploy's Spanish docs, backed by
// content/tech-spanish/sources.mjs (aws-codedeploy, aws-codedeploy-deployments).
import { both, join } from '../../../engine/i18n';
import { termTable, traps, cardsFor } from '../glossary';

const PIPELINE = ['pipeline', 'ci', 'cd', 'artifact', 'staging', 'production', 'dev-env', 'environment', 'config', 'cache'];
const CONTAINERS = ['container', 'image', 'cluster', 'orchestration', 'iac', 'provision'];
const RELEASES = ['rollout', 'blue-green', 'canary', 'feature-flag'];
const INCIDENTS = ['on-call', 'incident', 'outage', 'alert', 'log', 'monitoring', 'postmortem', 'sla', 'uptime', 'hotfix-prod'];

export default {
  slug: 'devops-cicd',
  number: 3,
  free: false,
  title: both('DevOps and CI/CD', 'DevOps y CI/CD'),
  situation: both(
    "You're on the platform team of a payments startup with engineers in Austin, Madrid and Bogotá. On Tuesday at 14:00 the pipeline deploys version 4.7 of the checkout API. Ten minutes later a CloudWatch alarm fires, and you're on call. You have to tell the English-speaking #incidents channel what is going on while the team rolls back, and the next day write a short postmortem summary, in Spanish, for the leadership team. First you need the words: pipeline, staging, canary, incident, and everything in between.",
    'Estás en el equipo de plataforma de una startup de pagos con ingenieros en Austin, Madrid y Bogotá. El martes a las 14:00 el pipeline despliega la versión 4.7 de la API de checkout. Diez minutos después salta una alarma de CloudWatch, y tú estás de guardia. Tienes que contarle al canal #incidents, donde se escribe en inglés, qué está pasando mientras el equipo hace rollback, y al día siguiente escribir un resumen breve del postmortem, en español, para la dirección. Antes necesitas las palabras: pipeline, staging, canary, incidente y todo lo que hay en medio.',
  ),
  overview: both(
    'DevOps is where tech Spanish mixes the most. Some words do translate (contenedor, de guardia, incidente), some stay in English with the team (pipeline, staging, rollout), and some hide a trap (incidencia, provisionar, loguearse). In this module you follow a change from the build to production, learn how containers and infrastructure as code are named, compare blue/green, canary and feature flags, and practice the vocabulary of incidents in three registers. You finish by writing an incident notice in English and a formal postmortem summary in Spanish.',
    'DevOps es donde más se mezcla el español técnico. Algunas palabras sí se traducen (contenedor, de guardia, incidente), otras se quedan en inglés con el equipo (pipeline, staging, rollout) y otras esconden una trampa (incidencia, provisionar, loguearse). En este módulo sigues un cambio desde la compilación hasta producción, aprendes cómo se nombran los contenedores y la infraestructura como código, comparas blue/green, canary y feature flags, y practicas el vocabulario de los incidentes en tres registros. Terminas escribiendo un aviso de incidente en inglés y un resumen formal del postmortem en español.',
  ),
  level: both('Intermediate', 'Intermedio'),
  hours: 1,
  skills: ['CI/CD', 'pipeline', 'staging', 'blue/green', 'canary', 'incident', 'postmortem'],
  steps: [
    // ---------- Lesson 1: the pipeline ----------
    {
      id: 'the-pipeline',
      kind: 'read',
      title: both('The pipeline', 'El pipeline'),
      minutes: 6,
      body: join(
        both(
          `**Why first.** Between your laptop and your users there are several stops, each with its own name. When someone says "está en pre", "lo paso a QA" or "you broke the pipeline", you need to know where the change is and who it affects.

- A **pipeline** is the automated path a change follows: build, test, deploy. Think of an assembly line with an inspector at each station: a part that fails a check goes no further. On AWS, CodePipeline chains the stages and CodeBuild runs builds and tests. In Spanish, translated docs may say *canalización*; out loud it's *el pipeline*.
- The **build** (*compilación*; with the team, *la build*) turns source code into something you can run.
- **CI**, continuous integration (*integración continua*): every push or PR is built and tested automatically, so problems show up in minutes.
- **CD** has two meanings. Continuous **delivery** (*entrega continua*): every change that passes is ready for production, and a person approves the release. Continuous **deployment** (*implementación continua*): it reaches production on its own, with no manual step.
- An **artifact** (*artefacto*) is what the build produces, such as a Lambda .zip or a container image. You build it once and promote it unchanged from one environment to the next.
- An **environment** (*entorno*; in Latin America also *ambiente*) is a full copy of the system: **dev** to develop, **staging** (*preproducción*) to rehearse, and **production** (*producción*, "prod"), where real users are.
- The **config** (*configuración*) holds what changes between environments: table names, URLs. Keep it out of the code.
- A **cache** (*caché*) is a nearby copy that makes things fast. After a deploy you **invalidate** it so users get the new version.`,
          `**Primero, el porqué.** Entre tu máquina y tus usuarios hay varias paradas, cada una con su nombre. Cuando alguien dice "está en pre", "lo paso a QA" o "rompiste el pipeline", necesitas saber dónde está el cambio y a quién afecta.

- Un **pipeline** es el camino automático que sigue un cambio: compilar, probar, desplegar. Piensa en una cadena de montaje con un inspector en cada puesto: la pieza que falla un control no avanza. En AWS, CodePipeline encadena las etapas y CodeBuild compila y prueba. *Canalización* aparece en documentación traducida; al hablar se dice *el pipeline*.
- La **compilación** (*build*; con el equipo, *la build*) convierte el código fuente en algo ejecutable.
- **CI**, integración continua (*continuous integration*): cada push o PR se compila y se prueba automáticamente, así que los problemas aparecen en minutos.
- **CD** tiene dos significados. **Entrega** continua (*continuous delivery*): cada cambio que pasa está listo para producción, y una persona aprueba la salida. **Implementación** continua (*continuous deployment*): llega a producción automáticamente, sin pasos manuales.
- Un **artefacto** (*artifact*) es lo que produce la compilación, como el .zip de una Lambda o una imagen de contenedor. Se compila una vez y pasa tal cual de un entorno al siguiente.
- Un **entorno** (en Latinoamérica también *ambiente*) es una copia completa del sistema: **desarrollo** ("dev") para trabajar, **preproducción** (*staging*) para ensayar y **producción** ("prod"), donde están los usuarios reales.
- La **configuración** ("la config") guarda lo que cambia entre entornos: nombres de tablas, URL. Mantenla fuera del código.
- La **caché** es una copia cercana que lo acelera todo. Después de un despliegue la **invalidas** para que los usuarios reciban la versión nueva.`,
        ),
        termTable(PIPELINE),
        traps(PIPELINE),
        both(
          '**In short:** CI builds and tests every change, CD takes the same artifact through dev, staging and production, and the config is what changes between environments.',
          '**En resumen:** la integración continua compila y prueba cada cambio, la entrega continua lleva el mismo artefacto por desarrollo, preproducción y producción, y la configuración es lo que cambia entre entornos.',
        ),
      ),
    },
    {
      id: 'cards-pipeline',
      kind: 'cards',
      title: both('Flashcards: the pipeline', 'Tarjetas: el pipeline'),
      minutes: 7,
      body: both(
        'Each term in both directions. On the English → Spanish cards for staging and environment, say the Spain form and the Latin America form before you flip.',
        'Cada término en las dos direcciones. En las tarjetas inglés → español de staging y environment, di la forma de España y la de Latinoamérica antes de girarla.',
      ),
      cards: cardsFor(PIPELINE),
    },

    // ---------- Lesson 2: containers and infrastructure as code ----------
    {
      id: 'containers-iac',
      kind: 'read',
      title: both('Containers and infrastructure as code', 'Contenedores e infraestructura como código'),
      minutes: 6,
      body: join(
        both(
          `**Why first.** Hardly anyone builds servers by hand anymore. "Levanta un clúster en staging" or "provision the VPC with CDK" means code creates the machines, and you need the words to follow the conversation in either language.

- A **container** (*contenedor*: here Spanish does translate) packages your app with everything it needs to run. Like a shipping container: the same box travels by ship, train or truck, and what's inside doesn't notice.
- An **image** (*imagen de contenedor*) is the template, and a container is a running copy of it. You build the image once and push it to Amazon ECR, the AWS registry for images.
- A **cluster** (*clúster*, with an accent in Spanish) is a group of machines that run containers together. On AWS that's Amazon ECS or Amazon EKS; with AWS Fargate you don't manage the machines at all.
- **Orchestration** (*orquestación*) decides which container runs where, replaces the ones that fail and adds more when traffic grows. The orchestrator (Kubernetes, ECS) is the conductor: it plays no instrument, it keeps everyone in time.
- **Infrastructure as code**, IaC (*infraestructura como código*): you describe buckets, tables and networks in files that go through a PR like any other code. The AWS CDK lets you write them in TypeScript, Python or other languages and turns them into a CloudFormation template.
- To **provision** is to create and prepare those resources. In a Spanish document, *aprovisionar* is the most established form; *provisionar* is a very common calque, and with the team you'll hear *levantar* ("levanto la base de datos").`,
          `**Primero, el porqué.** Ya casi nadie monta servidores a mano. "Levanta un clúster en staging" o "provision the VPC with CDK" significa que el código crea las máquinas, y necesitas las palabras para seguir la conversación en los dos idiomas.

- Un **contenedor** (*container*: aquí el español sí traduce) empaqueta tu aplicación con todo lo que necesita para funcionar. Como un contenedor de mercancías: la misma caja viaja en barco, tren o camión, y lo que va dentro ni se entera.
- Una **imagen** (*image*) es la plantilla, y un contenedor es una copia de esa imagen en ejecución. Construyes la imagen una vez y la subes a Amazon ECR, el registro de imágenes de AWS.
- Un **clúster** (*cluster*, con tilde en español) es un grupo de máquinas que ejecutan contenedores juntas. En AWS son Amazon ECS o Amazon EKS; con AWS Fargate ni siquiera administras las máquinas.
- La **orquestación** (*orchestration*) decide qué contenedor corre dónde, reemplaza los que fallan y añade más cuando sube el tráfico. El orquestador (Kubernetes, ECS) es el director de orquesta: no toca ningún instrumento, pero hace que todos lleven el mismo compás.
- La **infraestructura como código**, IaC (*infrastructure as code*): describes buckets, tablas y redes en archivos que pasan por una PR como cualquier otro código. AWS CDK te deja escribirlos en TypeScript, Python u otros lenguajes y los convierte en una plantilla de CloudFormation.
- **Aprovisionar** (*provision*) es crear y preparar esos recursos. En un documento, *aprovisionar* es la forma más asentada; *provisionar* es un calco muy frecuente, y con el equipo oirás *levantar* ("levanto la base de datos").`,
        ),
        termTable(CONTAINERS),
        traps(CONTAINERS),
        both(
          '**In short:** the image is the template, the container is the running copy, the cluster runs them and orchestration keeps them alive; IaC provisions it all from code. Write *aprovisionar* in documents.',
          '**En resumen:** la imagen es la plantilla, el contenedor es la copia en marcha, el clúster los ejecuta y la orquestación los mantiene vivos; la IaC lo aprovisiona todo desde el código. En documentos, escribe *aprovisionar*.',
        ),
      ),
    },
    {
      id: 'cards-containers',
      kind: 'cards',
      title: both('Flashcards: containers and IaC', 'Tarjetas: contenedores e IaC'),
      minutes: 5,
      body: both(
        'Most of these translate cleanly. Watch the accent on *clúster* and the formal *aprovisionar*.',
        'Casi todas se traducen sin problema. Fíjate en la tilde de *clúster* y en el formal *aprovisionar*.',
      ),
      cards: cardsFor(CONTAINERS),
    },

    // ---------- Lesson 3: releasing without fear ----------
    {
      id: 'releasing-safely',
      kind: 'read',
      title: both('Releasing without fear', 'Lanzar sin miedo'),
      minutes: 5,
      body: join(
        both(
          `**Why first.** Releasing everything to everyone at once is a bet: if something is wrong, every user finds out at the same time. These techniques turn one big jump into small steps you can undo, and in a design review you'll be expected to name them correctly.

- A **rollout** (*implantación gradual* or *lanzamiento gradual*; the team says *el rollout*) is how a change reaches users over time: 10% today, everyone on Friday.
- A **blue/green deployment** (*implementación azul/verde*; out loud, almost always "blue/green") keeps two identical environments. Blue serves users while you deploy to green; when green looks good, you switch the traffic over. If something fails, you switch back, and that is your rollback. AWS CodeDeploy supports blue/green deployments.
- A **canary release** (*despliegue canario*) sends a small slice of traffic to the new version first. Miners once took a canary underground: if the air turned bad, the bird showed it first. CodeDeploy has ready-made canary settings for Lambda and ECS (for example, 10% of traffic for 5 minutes, then the rest), and it can roll back automatically when a CloudWatch alarm fires.
- A **feature flag** (*indicador de funcionalidad* in a document; *feature flag*, or just *flag*, with the team) turns a feature on or off without deploying again. It separates deploying the code from releasing the feature. AWS AppConfig offers feature flags.

**Which Spanish word for "deployment"?** AWS's Spanish documentation, which is machine-translated, uses both *implementación* and *despliegue*, sometimes on the same page. Both are correct: pick one per document.`,
          `**Primero, el porqué.** Lanzar todo para todos de una vez es una apuesta: si algo falla, todos los usuarios se enteran a la vez. Estas técnicas convierten un gran salto en pasos pequeños que se pueden deshacer, y en una revisión de diseño esperarán que las nombres bien.

- Un **rollout** (*implantación gradual* o *lanzamiento gradual*; el equipo dice *el rollout*) es cómo un cambio llega a los usuarios poco a poco: el 10% hoy, todos el viernes.
- Una **implementación azul/verde** (*blue/green deployment*; al hablar, casi siempre "blue/green") mantiene dos entornos idénticos. El azul atiende a los usuarios mientras despliegas en el verde; cuando el verde está bien, cambias el tráfico. Si algo falla, vuelves a cambiarlo, y ese es tu rollback. AWS CodeDeploy admite implementaciones azul/verde.
- Un **despliegue canario** (*canary release*) manda primero una pequeña parte del tráfico a la versión nueva. Los mineros bajaban un canario a la mina: si el aire se volvía peligroso, el pájaro lo notaba antes. CodeDeploy tiene configuraciones canario ya hechas para Lambda y ECS (por ejemplo, el 10% del tráfico durante 5 minutos y luego el resto), y puede revertir solo cuando salta una alarma de CloudWatch.
- Un **feature flag** (*indicador de funcionalidad* en un documento; *feature flag*, o solo *flag*, con el equipo) activa o desactiva una funcionalidad sin volver a desplegar. Separa desplegar el código de lanzar la funcionalidad. AWS AppConfig ofrece feature flags.

**¿Qué palabra para "deployment"?** La documentación de AWS en español, que es traducción automática, usa *implementación* y *despliegue*, a veces en la misma página. Las dos son correctas: elige una por documento.`,
        ),
        termTable(RELEASES),
        traps(RELEASES),
        both(
          '**In short:** a rollout goes step by step, blue/green switches between two environments, a canary tests the water with a little traffic, and a feature flag releases without a deploy.',
          '**En resumen:** el rollout va paso a paso, el azul/verde cambia entre dos entornos, el canario tantea el terreno con poco tráfico y el feature flag lanza sin desplegar.',
        ),
      ),
    },
    {
      id: 'cards-releasing',
      kind: 'cards',
      title: both('Flashcards: releasing without fear', 'Tarjetas: lanzar sin miedo'),
      minutes: 4,
      body: both(
        'A short deck. With the team these stay in English, so the formal Spanish form is the one to learn.',
        'Un mazo corto. Con el equipo se quedan en inglés, así que la forma que hay que aprender es la formal en español.',
      ),
      cards: cardsFor(RELEASES),
    },

    // ---------- Lesson 4: when something goes down ----------
    {
      id: 'when-it-goes-down',
      kind: 'read',
      title: both('When something goes down', 'Cuando algo se cae'),
      minutes: 7,
      body: join(
        both(
          `**Why first.** At 3 a.m. nobody reads long messages. When something goes down, the right word tells people how serious it is, and the wrong one (a Spanish *incidencia* turned into an English "incidence") makes them guess.

- **Monitoring** (*supervisión* in a document; *monitorización* in Spain, *monitoreo* in Latin America) watches metrics and logs all the time. On AWS: Amazon CloudWatch.
- An **alert** or **alarm** (*alerta*, *alarma*) fires when a metric crosses a line, say errors above 5%. In Spanish, the alarm *salta*.
- Whoever is **on call** (*de guardia*: Spanish translates this one) answers it.
- An **incident** (*incidente*) is a serious event in production. Careful: in Spain, *incidencia* is used for almost any reported problem, from a ticket to a production issue; *incidente* is the word everyone reads as serious. In English, "incidence" is a rate.
- An **outage** (*interrupción del servicio*; with the team, *una caída*; in slang, *se cayó*) is time when the service doesn't work.
- **Logs** (*registros*; with the team, *los logs*) are the lines a system writes as it runs. *Loguear* is writing to the log; *loguearse* is signing in.
- **Uptime** (*disponibilidad*) is the share of time the service works. The **SLA** (*acuerdo de nivel de servicio*; the team says *el SLA*) is the promise to the client: 99.9% a month leaves about 43 minutes of downtime.
- A **postmortem** (*análisis posterior al incidente*) explains what happened and what will change, without blame. Like an air-accident investigation, it looks for causes, not culprits.
- **Firefighting** is *apagar incendios*: the same metaphor in both languages.`,
          `**Primero, el porqué.** A las 3 de la mañana nadie lee mensajes largos. Cuando algo se cae, la palabra correcta le dice a la gente qué gravedad tiene, y la equivocada (una *incidencia* convertida en "incidence" en inglés) la obliga a adivinar.

- La **supervisión** (*monitoring*; *monitorización* en España, *monitoreo* en Latinoamérica) vigila sin parar métricas y registros. En AWS: Amazon CloudWatch.
- Una **alerta** o **alarma** (*alert*, *alarm*) salta cuando una métrica cruza un límite, por ejemplo errores por encima del 5%. En inglés, la alarma *fires*.
- Quien está **de guardia** (*on call*: esta sí se traduce) la atiende.
- Un **incidente** (*incident*) es un evento serio en producción. Cuidado: en España, *incidencia* se usa para casi cualquier problema reportado, desde un ticket hasta un fallo en producción; *incidente* es la palabra que todos leen como algo serio. En inglés, "incidence" es una tasa.
- Una **interrupción del servicio** (*outage*; con el equipo, *una caída*; en jerga, *se cayó*) es el tiempo sin servicio.
- Los **registros** (*logs*; con el equipo, *los logs*) son las líneas que escribe un sistema al funcionar. *Loguear* es escribir en el log; *loguearse* es iniciar sesión.
- La **disponibilidad** (*uptime*) es la parte del tiempo en que el servicio funciona. El **acuerdo de nivel de servicio** (*SLA*; el equipo dice *el SLA*) es la promesa al cliente: un 99,9% al mes deja unos 43 minutos de caída.
- Un **análisis posterior al incidente** (*postmortem*) explica qué pasó y qué va a cambiar, sin culpables. Como la investigación de un accidente aéreo, busca causas, no responsables.
- **Apagar incendios** (*firefighting*): misma metáfora en los dos idiomas.`,
        ),
        termTable(INCIDENTS),
        traps(INCIDENTS),
        both(
          '**In short:** the alarm fires, whoever is on call opens an incident, the outage ends with a fix or a rollback, and the postmortem explains it without blame. In English, never "incidence".',
          '**En resumen:** salta la alarma, quien está de guardia abre un incidente, la caída termina con un arreglo o un rollback, y el postmortem lo explica sin culpables. En inglés, nunca "incidence".',
        ),
      ),
    },
    {
      id: 'cards-incidents',
      kind: 'cards',
      title: both('Flashcards: incidents and on-call', 'Tarjetas: incidentes y guardias'),
      minutes: 7,
      body: both(
        'These are the words of a stressful night, so practice them until they come out on their own. Watch the false friends on *incident* and *log*.',
        'Son las palabras de una noche difícil, así que practícalas hasta que salgan solas. Atención a los falsos amigos de *incident* y *log*.',
      ),
      cards: cardsFor(INCIDENTS),
    },

    // ---------- Writing task 1: incident notice in English ----------
    {
      id: 'incident-notice-en',
      kind: 'rewrite',
      title: both('Write it: an incident notice on Slack', 'Escríbelo: un aviso de incidente en Slack'),
      minutes: 8,
      body: both(
        "It's 14:20 UTC. Your notes are in Spanish, and #incidents is in English. People in three time zones are waiting: keep it short, clear and scannable, and give the time zone. Team register is fine, but every key fact has to be there. SEV-2 is severity level 2 on your team's scale (SEV-1 is the worst).",
        'Son las 14:20 UTC. Tus notas están en español y en #incidents se escribe en inglés. Hay gente esperando en tres zonas horarias: que sea breve, claro y fácil de leer de un vistazo, y que indique la zona horaria. El registro de equipo está bien, pero tienen que estar todos los datos clave. SEV-2 es el nivel de gravedad 2 en la escala del equipo (SEV-1 es el peor).',
      ),
      target: 'en',
      source: `Notas para el aviso en #incidents:
- 14:00 UTC: desplegamos la versión 4.7 de la API de checkout.
- 14:10: los errores 5xx suben al 30%. A las 14:12 salta la alarma de CloudWatch.
- Impacto: caída parcial, falla más o menos el 30% de los pagos.
- Causa probable: la 4.7 lee una variable de entorno que solo existe en staging; en producción falta esa configuración. Los logs muestran el mismo error en cada petición fallida.
- Carla está de guardia y abrió el incidente a las 14:15 (SEV-2).
- Ahora: estamos haciendo rollback a la 4.6 desde el pipeline.
- Próximo aviso en 30 minutos. Postmortem mañana.`,
      task: both(
        'Write the notice for #incidents in English: that it is an incident, the impact (a partial outage), what was deployed, the alarm, the likely cause (a config or environment variable missing in production), what the logs show, who is on call, the rollback in progress, and when the next update and the postmortem come.',
        'Escribe el aviso para #incidents en inglés: que es un incidente, el impacto (una caída parcial), qué se desplegó, la alarma, la causa probable (una configuración o variable de entorno que falta en producción), qué muestran los logs, quién está de guardia, el rollback en curso y cuándo llegan el próximo aviso y el postmortem.',
      ),
      minWords: 50,
      mustUse: [
        { any: ['incident*', 'SEV-2', 'SEV2', 'SEV 2'], label: 'incident' },
        { any: ['outage*', 'downtime', 'degraded', 'degradation', 'disruption*', 'is down', 'went down', 'partially down', 'unavailab*', 'not available'], label: 'outage' },
        { any: ['deploy*', 'release*', 'shipped', 'rolled out', 'rollout*', 'roll-out*', 'went out', 'went live', 'pushed', 'push of'], label: 'deployed' },
        { any: ['alarm*', 'alert*', 'paged', 'page fired', 'got a page'], label: 'alarm / alert' },
        { any: ['config*', 'env var*', 'env*', 'setting*', 'variable*'], label: 'config / environment variable' },
        { any: ['log', 'logs', 'logging', 'logged'], label: 'logs' },
        { any: ['on-call', 'on call', 'oncall'], label: 'on call' },
        { any: ['rolling back', 'rolled back', 'roll back', 'rollback*', 'roll-back*', 'reverting', 'reverted', 'revert*', 'going back to', 'back to v4', 'back to 4', 'restor*'], label: 'rolling back' },
        { any: ['postmortem*', 'post-mortem*', 'post mortem*', 'incident review*', 'retro*', 'PIR'], label: 'postmortem' },
      ],
      avoid: [
        {
          any: ['incidence*'],
          why: both(
            '"Incidence" is a rate (how often something happens). For a problem in production, write "incident". The trap comes from Spanish "incidencia".',
            '"Incidence" es una tasa (con qué frecuencia pasa algo). Para un problema en producción, escribe "incident". La trampa viene de "incidencia".',
          ),
        },
        {
          any: ['ambient*'],
          why: both(
            '"Ambient" is about surroundings (ambient light, ambient noise). Latin American "ambiente" in tech is "environment": "staging environment".',
            '"Ambient" se refiere al ambiente físico (luz ambiente, ruido ambiente). El "ambiente" técnico de Latinoamérica es "environment": "staging environment".',
          ),
        },
        {
          any: ['monitoriz*', 'monitoris*'],
          why: both(
            '"Monitorize" is a calque of Spain\'s "monitorizar". In English the verb is just "monitor": "we\'re monitoring error rates".',
            '"Monitorize" es un calco de "monitorizar". En inglés el verbo es solo "monitor": "we\'re monitoring error rates".',
          ),
        },
        {
          any: ['incidente*', 'caida*', 'estamos', 'desplegamos', 'de guardia'],
          why: both(
            'Write the notice in English: #incidents is read by people who don\'t speak Spanish.',
            'Escribe el aviso en inglés: en #incidents lo leen personas que no hablan español.',
          ),
        },
      ],
      model: `🔴 Incident (SEV-2): checkout API errors

Impact: partial outage. About 30% of payments have been failing since 14:10 UTC.
What happened: at 14:00 UTC we deployed v4.7 of the checkout API. 5xx errors jumped to 30%, and the CloudWatch alarm fired at 14:12.
Likely cause: v4.7 reads an environment variable that only exists in staging, so that config is missing in production. The logs show the same error on every failed request.
Now: Carla is on call and opened the incident at 14:15. We're rolling back to v4.6 through the pipeline.
Next update in 30 minutes, or sooner if anything changes. Postmortem tomorrow.`,
    },

    // ---------- Register ----------
    {
      id: 'register-devops',
      kind: 'register',
      title: both('Formal, team or slang?', '¿Formal, de equipo o jerga?'),
      minutes: 6,
      body: both(
        'Phrases from real Slack messages, status pages, reports and stand-ups, in both languages. Decide where each one fits best.',
        'Frases de mensajes de Slack, páginas de estado, informes y dailies reales, en los dos idiomas. Decide dónde encaja mejor cada una.',
      ),
      items: [
        {
          text: 'Se produjo una interrupción del servicio de 23 minutos. El análisis posterior al incidente se compartirá el viernes.',
          context: both('Email to a client', 'Correo a un cliente'),
          answer: 'formal',
          explain: both(
            '"Interrupción del servicio" is the formal outage and "análisis posterior al incidente" the formal postmortem. Constructions with "se" ("se produjo", "se compartirá") read like a document. With the team: "la caída" and "el postmortem".',
            '"Interrupción del servicio" es el outage formal y "análisis posterior al incidente", el postmortem formal. Las construcciones con "se" ("se produjo", "se compartirá") suenan a documento. Con el equipo: "la caída" y "el postmortem".',
          ),
        },
        {
          text: 'Prod se cayó y está todo ardiendo 🔥 ¿Quién está de guardia?',
          context: both('Slack, 2 a.m.', 'Slack, a las 2 de la mañana'),
          answer: 'slang',
          explain: both(
            '"Está todo ardiendo 🔥" is pure slang, and "prod" and "se cayó" are slang forms too. With the team: "hay una caída en producción"; in a report: "interrupción del servicio". "De guardia" is the same in every register.',
            '"Está todo ardiendo 🔥" es jerga pura, y "prod" y "se cayó" también son formas de jerga. Con el equipo: "hay una caída en producción"; en un informe: "interrupción del servicio". "De guardia" es igual en todos los registros.',
          ),
        },
        {
          text: 'Abrí un incidente por la caída; ya estoy mirando los logs en CloudWatch.',
          context: both('Slack, #incidents', 'Slack, #incidents'),
          answer: 'team',
          explain: both(
            '"Caída" and "los logs" are the everyday team forms: clear and calm. A formal report would say "interrupción del servicio" and "registros".',
            '"Caída" y "los logs" son las formas normales de equipo: claras y tranquilas. Un informe formal diría "interrupción del servicio" y "registros".',
          ),
        },
        {
          text: 'Lo metemos detrás de un feature flag y hacemos el rollout al 10% el lunes.',
          context: both('Planning meeting', 'Reunión de planificación'),
          answer: 'team',
          explain: both(
            '"Feature flag" and "el rollout" stay in English with the team. In a document: "indicador de funcionalidad" and "implantación gradual".',
            '"Feature flag" y "el rollout" se quedan en inglés con el equipo. En un documento: "indicador de funcionalidad" e "implantación gradual".',
          ),
        },
        {
          text: 'Los recursos se aprovisionarán mediante infraestructura como código y se validarán en el entorno de preproducción.',
          context: both('Architecture proposal', 'Propuesta de arquitectura'),
          answer: 'formal',
          explain: both(
            '"Aprovisionar", "infraestructura como código" and "entorno de preproducción" are all formal forms. The team would say "levantamos todo con IaC y lo probamos en staging".',
            '"Aprovisionar", "infraestructura como código" y "entorno de preproducción" son todas formas formales. El equipo diría "levantamos todo con IaC y lo probamos en staging".',
          ),
        },
        {
          text: 'Mañana levanto el clúster en el env de stage.',
          context: both('Chat with a colleague', 'Chat con un compañero'),
          answer: 'slang',
          explain: both(
            '"El env" and "stage" are the slang forms; "levantar" is everyday team talk too. With the team: "mañana levanto el clúster en staging"; in a document: "mañana se aprovisionará el clúster en el entorno de preproducción".',
            '"El env" y "stage" son las formas de jerga; "levantar" también es lo normal con el equipo. Con el equipo: "mañana levanto el clúster en staging"; en un documento: "mañana se aprovisionará el clúster en el entorno de preproducción".',
          ),
        },
        {
          text: 'Pásame la config de staging y reviso los logs.',
          context: both('Stand-up', 'Daily'),
          answer: 'team',
          explain: both(
            '"La config", "staging" and "los logs" are how the team talks. In a document: "la configuración del entorno de preproducción" and "los registros".',
            '"La config", "staging" y "los logs" son como habla el equipo. En un documento: "la configuración del entorno de preproducción" y "los registros".',
          ),
        },
        {
          text: 'We are investigating elevated error rates affecting some customers. We will provide an update within 30 minutes.',
          context: both('Public status page', 'Página de estado pública'),
          answer: 'formal',
          explain: both(
            '"Elevated error rates", "affecting some customers" and "we will provide an update" are status-page English: precise, calm, no slang. On Slack the same news is "seeing more 5xx on checkout, looking into it".',
            '"Elevated error rates", "affecting some customers" y "we will provide an update" son inglés de página de estado: preciso, tranquilo, sin jerga. En Slack, la misma noticia sería "seeing more 5xx on checkout, looking into it".',
          ),
        },
        {
          text: 'Heads up: the canary is at 10% and the alarms are quiet. Promoting to 100% after lunch.',
          context: both('Slack, #deploys', 'Slack, #deploys'),
          answer: 'team',
          explain: both(
            '"Heads up", "the canary" and the dropped subject in "Promoting to 100%" are relaxed but precise: normal team English. A change report would say "the canary deployment completed without alarms".',
            '"Heads up", "the canary" y la frase sin sujeto "Promoting to 100%" son relajados pero precisos: inglés normal de equipo. Un informe de cambios diría "the canary deployment completed without alarms".',
          ),
        },
        {
          text: 'prod is on fire 🔥 all hands on deck, pls check the dashboards',
          context: both('Slack, late at night', 'Slack, de madrugada'),
          answer: 'slang',
          explain: both(
            '"On fire", "all hands on deck" and "pls" are slang. Fine with close teammates, never on a status page. Spanish has the same image: "está todo ardiendo".',
            '"On fire", "all hands on deck" y "pls" son jerga. Vale con compañeros de confianza, nunca en una página de estado. El español tiene la misma imagen: "está todo ardiendo".',
          ),
        },
      ],
    },

    // ---------- Writing task 2: postmortem summary in Spanish ----------
    {
      id: 'postmortem-summary-es',
      kind: 'rewrite',
      title: both('Write it: a postmortem summary for management', 'Escríbelo: el resumen de un postmortem para la dirección'),
      minutes: 10,
      body: both(
        "It's Wednesday. The leadership team in Madrid and Bogotá wants a short summary in Spanish, in a formal register: no slang, no \"se cayó\", no English verbs. Spain writes decimals with a comma (99,95%), and so does Colombia's standard, though you'll often see a point there; in Mexico you'd use a point. Pick one and stay consistent. It's blameless: no names.",
        'Es miércoles. La dirección, en Madrid y en Bogotá, quiere un resumen breve en español y en registro formal: nada de jerga, nada de "se cayó", nada de verbos en inglés. España escribe los decimales con coma (99,95%), y también la norma colombiana, aunque allí se ve mucho el punto; en México usarías punto. Elige uno y sé coherente. Es sin culpables: sin nombres.',
      ),
      target: 'es',
      source: `Postmortem notes: checkout outage, Nov 17 (blameless)
- Impact: partial outage of checkout from 14:10 to 14:33 UTC (23 min). About 30% of payments failed. Monthly uptime is still 99.95%, within our 99.9% SLA.
- Root cause: v4.7 read an environment variable that only existed in staging. CI passed because the tests ran with the staging config.
- Detection: a CloudWatch alarm fired at 14:12; the on-call engineer opened an incident at 14:15.
- Resolution: rolled back to v4.6 through the pipeline at 14:33. Service recovered.
- Action items: (1) check each environment's config in the pipeline before deploying to production; (2) canary deployments with automatic rollback when an alarm fires (CodeDeploy); (3) move the config into IaC (CDK).`,
      task: both(
        'Write the summary in formal Spanish: the outage and how long it lasted, the root cause (environment and configuration), how the incident was detected and resolved (back to the previous version), availability against the SLA, and the measures. Present it as the postmortem analysis.',
        'Escribe el resumen en español formal: la interrupción del servicio y cuánto duró, la causa (entorno y configuración), cómo se detectó y se resolvió el incidente (vuelta a la versión anterior), la disponibilidad frente al SLA y las medidas. Preséntalo como el análisis posterior al incidente.',
      ),
      minWords: 60,
      mustUse: [
        { any: ['interrupcion*', 'inactividad', 'indisponib*', 'fuera de servicio', 'no estuvo disponible'], label: 'interrupción del servicio' },
        { any: ['incidente*'], label: 'incidente' },
        { any: ['causa*', 'origen', 'debido a', 'se debio', 'motivo*', 'raiz'], label: 'causa' },
        { any: ['entorno*', 'ambiente*', 'preproduccion', 'staging'], label: 'entorno / ambiente' },
        { any: ['configur*', 'variable*', 'parametro*'], label: 'configuración' },
        { any: ['version anterior', 'version previa', 'version 4.6', 'la 4.6', 'v4.6', 'revert*', 'revirt*', 'reversion*', 'restaur*', 'restablec*', 'regres*', 'rollback'], label: 'volver a la versión anterior' },
        { any: ['disponibilidad', 'SLA', 'acuerdo de nivel de servicio', 'ANS', 'tiempo de actividad', 'uptime'], label: 'disponibilidad / SLA' },
        { any: ['analisis', 'postmortem*', 'post-mortem*', 'post mortem', 'revision posterior', 'lecciones aprendidas', 'informe del incidente'], label: 'análisis posterior al incidente' },
        { any: ['medida*', 'accion*', 'mejora*', 'proximos pasos', 'siguientes pasos'], label: 'medidas' },
      ],
      avoid: [
        {
          any: ['incidencia*'],
          why: both(
            'In Spain "incidencia" covers almost any reported problem, from a ticket to a production issue, but it is less usual in Latin America for a serious event, and it leads to the English trap "incidence". For readers in Madrid and Bogotá, "incidente" is the clear choice.',
            'En España "incidencia" se usa para casi cualquier problema reportado, desde un ticket hasta un fallo en producción, pero en Latinoamérica es menos habitual para algo grave, y lleva a la trampa del inglés "incidence". Para una dirección en Madrid y Bogotá, "incidente" es la opción clara.',
          ),
        },
        {
          any: ['se cayo', 'se cayeron', 'se nos cayo', 'ardiendo', 'apagar incendios', 'apagando incendios'],
          why: both(
            'That is team talk or slang. For management: "se produjo una interrupción del servicio" or "el servicio no estuvo disponible".',
            'Eso es charla de equipo o jerga. Para la dirección: "se produjo una interrupción del servicio" o "el servicio no estuvo disponible".',
          ),
        },
        {
          any: ['deploy*'],
          why: both(
            '"Deploy", "deployar" and "hacer el deploy" are team words. In a formal Spanish text, write "desplegar" / "despliegue" or "implementar" / "implementación", and keep one of them throughout.',
            '"Deploy", "deployar" y "hacer el deploy" son palabras de equipo. En un texto formal en español, escribe "desplegar" / "despliegue" o "implementar" / "implementación", y mantén una sola en todo el texto.',
          ),
        },
      ],
      model: `Asunto: Resumen del análisis posterior al incidente del 17 de noviembre

Impacto: entre las 14:10 y las 14:33 (UTC) se produjo una interrupción parcial del servicio de pagos. Durante esos 23 minutos falló aproximadamente el 30% de los pagos. La disponibilidad del mes se mantiene en el 99,95%, dentro del acuerdo de nivel de servicio (99,9%).

Causa: la versión 4.7 leía una variable de entorno que solo existía en el entorno de preproducción. Las pruebas de integración continua no detectaron el error porque usaban esa misma configuración.

Detección y resolución: a las 14:12 se activó una alarma de CloudWatch y la persona de guardia abrió un incidente a las 14:15. A las 14:33 se volvió a la versión anterior (4.6) desde la canalización de CI/CD y el servicio se recuperó.

Medidas: 1) validar la configuración de cada entorno en la canalización antes de desplegar en producción; 2) adoptar despliegues canario con reversión automática si se activa una alarma; 3) definir la configuración como infraestructura como código.

Este análisis no busca culpables: su objetivo es mejorar el proceso.`,
    },

    // ---------- Final check ----------
    {
      id: 'quiz-devops-cicd',
      kind: 'quiz',
      title: both('Check: DevOps and CI/CD', 'Comprueba: DevOps y CI/CD'),
      minutes: 6,
      questions: [
        {
          q: both(
            'Which practice sends every change that passes the pipeline to production on its own, with no manual approval?',
            '¿Qué práctica lleva a producción, sin aprobación manual, cada cambio que pasa el pipeline?',
          ),
          options: [
            both('Continuous integration', 'Integración continua'),
            both('Continuous delivery', 'Entrega continua'),
            both('Continuous deployment', 'Implementación continua'),
            both('Blue/green deployment', 'Implementación azul/verde'),
          ],
          answer: 2,
          explain: both(
            'Continuous deployment goes all the way to production by itself. Continuous delivery leaves every change ready, but a person approves the release. CI only builds and tests each change. Blue/green is how you switch traffic, not whether a person approves.',
            'La implementación continua llega sola hasta producción. La entrega continua deja cada cambio listo, pero una persona aprueba la salida. La CI solo compila y prueba cada cambio. El azul/verde es cómo cambias el tráfico, no si una persona lo aprueba.',
          ),
        },
        {
          q: both(
            'You build it once with `docker build` and push it to Amazon ECR; ECS then runs copies of it. What did you push?',
            'Lo construyes una vez con `docker build` y lo subes a Amazon ECR; después ECS ejecuta copias. ¿Qué subiste?',
          ),
          options: [
            both('A container', 'Un contenedor'),
            both('An image', 'Una imagen'),
            both('A cluster', 'Un clúster'),
            both('A stack', 'Una pila'),
          ],
          answer: 1,
          explain: both(
            'You push the image (imagen de contenedor), the template. Each running copy is a container, and the cluster is the group of machines that runs them.',
            'Subes la imagen (image), la plantilla. Cada copia en ejecución es un contenedor, y el clúster es el grupo de máquinas que los ejecuta.',
          ),
        },
        {
          q: both(
            'Which sentence fits a formal Spanish document for "Terraform provisions the VPC"?',
            '¿Qué frase encaja en un documento formal en español para "Terraform provisions the VPC"?',
          ),
          options: [
            'Terraform levanta la VPC.',
            'Terraform aprovisiona la VPC.',
            'Terraform provee la VPC.',
            'Terraform provisiona la VPC.',
          ],
          answer: 1,
          explain: both(
            '"Aprovisionar" is the most established form in writing. "Provisionar" is a very common calque, "levantar" is how the team talks, and "proveer" means to supply something, not to create infrastructure.',
            '"Aprovisionar" es la forma más asentada por escrito. "Provisionar" es un calco muy frecuente, "levantar" es como habla el equipo y "proveer" es suministrar algo, no crear infraestructura.',
          ),
        },
        {
          q: both(
            'CodeDeploy sends 10% of the traffic to the new Lambda version for 5 minutes, then the rest. What is that strategy called?',
            'CodeDeploy manda el 10% del tráfico a la versión nueva de la Lambda durante 5 minutos y luego el resto. ¿Cómo se llama esa estrategia?',
          ),
          options: ['blue/green', 'canary', 'feature flag', 'hotfix'],
          answer: 1,
          explain: both(
            'A canary (despliegue canario) tries the new version on a small slice of traffic first. Blue/green switches all traffic between two complete environments, and a feature flag turns a feature on without deploying.',
            'Un canario (canary) prueba primero la versión nueva con una parte pequeña del tráfico. El azul/verde cambia todo el tráfico entre dos entornos completos, y un feature flag activa una funcionalidad sin desplegar.',
          ),
        },
        {
          q: both(
            'A colleague in Madrid writes: "Tengo una incidencia con el acceso a la VPN." What does she most likely mean?',
            'Una compañera de Madrid escribe: "Tengo una incidencia con el acceso a la VPN." ¿Qué es lo más probable que quiera decir?',
          ),
          options: [
            both('A production incident that needs whoever is on call', 'Un incidente en producción que necesita a quien está de guardia'),
            both('A ticket or minor problem she needs help with', 'Un ticket o un problema menor con el que necesita ayuda'),
            both('An outage of the whole service', 'Una caída de todo el servicio'),
            both('A CloudWatch alarm', 'Una alarma de CloudWatch'),
          ],
          answer: 1,
          explain: both(
            'In Spain, "incidencia" is used for almost any reported problem; for VPN access, that is a ticket or a minor problem. "Incidente" is the word everyone reads as a serious event in production. In English, write "issue" or "ticket" here, and never "incidence", which is a rate.',
            'En España, "incidencia" se usa para casi cualquier problema reportado; con el acceso a la VPN, es un ticket o un problema menor. "Incidente" es la palabra que todo el mundo entiende como un evento serio en producción. En inglés, aquí escribe "issue" o "ticket", y nunca "incidence", que es una tasa.',
          ),
        },
        {
          q: both(
            'A code review comment says: "Loguea el payload antes de llamar a DynamoDB." What should you do?',
            'Un comentario de revisión dice: "Loguea el payload antes de llamar a DynamoDB." ¿Qué tienes que hacer?',
          ),
          options: [
            both('Sign in to the AWS console before the call', 'Iniciar sesión en la consola de AWS antes de la llamada'),
            both('Write the payload to the log before the call', 'Escribir el payload en el log antes de la llamada'),
            both('Delete the old logs in CloudWatch', 'Borrar los registros antiguos de CloudWatch'),
            both('Add a CloudWatch alarm for the payload', 'Añadir una alarma de CloudWatch para el payload'),
          ],
          answer: 1,
          explain: both(
            '"Loguear" means writing to the log. "Loguearse" (with "se") means signing in. In a formal text: "registrar el payload".',
            '"Loguear" es escribir en el log. "Loguearse" (con "se") es iniciar sesión. En un texto formal: "registrar el payload".',
          ),
        },
        {
          q: both(
            'Your SLA promises 99.9% uptime per month. About how much downtime does that allow in a 30-day month?',
            'Tu SLA promete un 99,9% de disponibilidad al mes. ¿Cuánto tiempo de caída permite, más o menos, en un mes de 30 días?',
          ),
          options: [
            both('About 4 minutes', 'Unos 4 minutos'),
            both('About 43 minutes', 'Unos 43 minutos'),
            both('About 7 hours', 'Unas 7 horas'),
            both('About a day', 'Alrededor de un día'),
          ],
          answer: 1,
          explain: both(
            'A 30-day month has 43,200 minutes; 0.1% of that is 43.2 minutes. 99.99% would leave about 4 minutes, and 99% about 7 hours. Spain writes 99,9% with a comma; Mexico and much of Central America, 99.9% with a point.',
            'Un mes de 30 días tiene 43.200 minutos; el 0,1% son 43,2 minutos. Con un 99,99% quedarían unos 4 minutos, y con un 99%, unas 7 horas. España escribe 99,9%, con coma; México y buena parte de Centroamérica, 99.9%, con punto.',
          ),
        },
        {
          q: both(
            'Which sentence is right for the English status update during an outage?',
            '¿Qué frase es correcta para el aviso en inglés durante una caída?',
          ),
          options: [
            'We are investigating an incidence in production.',
            'We are investigating an incident in production.',
            'We are monitorizing the situation.',
            'The staging ambient is also affected.',
          ],
          answer: 1,
          explain: both(
            '"Incident" is the word. "Incidence" is a rate (from Spanish "incidencia"), "monitorize" is a calque of "monitorizar" (just "monitor"), and "ambient" isn\'t "ambiente" in tech: that\'s "environment".',
            'La palabra es "incident". "Incidence" es una tasa (viene de "incidencia"), "monitorize" es un calco de "monitorizar" (basta con "monitor") y el "ambiente" técnico no es "ambient": es "environment".',
          ),
        },
      ],
    },
  ],
};

// Tech Spanish ↔ Tech English: spanish.aws-study-flashcards-app.com
// The one bilingual course: the interface switches between Spanish and English
// (course.languages), and every text written with both(en, es) follows it.
// Terms come from glossary.json (content/tech-spanish), never retyped here.
import meta from './meta.json';
import { siblingsOf } from '../../shared/courseSites';
import { both } from '../../engine/i18n';
import startHere from './tutorials/00-start-here';
import gitEveryday from './tutorials/01-git-everyday';
import talkingCode from './tutorials/02-talking-code';
import devopsCicd from './tutorials/03-devops-cicd';
import cloudAws from './tutorials/04-cloud-aws';
import data from './tutorials/05-data';
import security from './tutorials/06-security';
import teamwork from './tutorials/07-teamwork';
import finalProject from './tutorials/08-final-project';

const course = {
  ...meta,
  languages: ['es', 'en'],
  defaultLanguage: 'es',
  bundle: false, // not part of the Developer Path bundle
  mark: 'ñ',
  accent: '#f2a845',
  eyebrow: both('Course · Tech Spanish ↔ Tech English', 'Curso · Tech Spanish ↔ Tech English'),
  headline: both('Talk tech in both languages, and sound like you belong.', 'Habla de tecnología en los dos idiomas, y que suene natural.'),
  lede: both(
    'For Spanish speakers who work in English, and for people who learned tech in English and now work in Spanish. Learn which word goes in a formal document, which one your team really says, and which one is slang: deploy, merge, bucket, on-call, LGTM and 200 more.',
    'Para hispanohablantes que trabajan en inglés y para quien aprendió la tecnología en inglés y ahora trabaja en español. Aprende qué palabra va en un documento formal, cuál dice de verdad tu equipo y cuál es jerga: deploy, merge, bucket, on-call, LGTM y 200 más.',
  ),
  heroNote: both(
    'Start here and Module 1 are free. Switch the interface between Spanish and English at any time (top right).',
    '«Empieza aquí» y el Módulo 1 son gratis. Cambia la interfaz entre español e inglés cuando quieras (arriba a la derecha).',
  ),
  heroTerminal: `#deploys
ana   ¿Ya mergeaste la PR del índice?
leo   Sí, con LGTM de Marta. La deployo
      después de la daily.
ana   Perfecto. Para el cliente:
      "Implementamos el índice secundario
      global el martes."
you   Got it: merged, deploying after
      stand-up. ✓`,
  outcomes: [
    both('Pick the right word for the situation: **formal document**, **chat with the team** or **slang**', 'Elegir la palabra correcta para cada situación: **documento formal**, **conversación con el equipo** o **jerga**'),
    both('Talk about Git, code reviews, pipelines and incidents in Spanish and in English', 'Hablar de Git, revisiones de código, pipelines e incidentes en español y en inglés'),
    both('Describe an AWS architecture (Regions, VPCs, buckets, Lambda, DynamoDB) in both languages', 'Describir una arquitectura de AWS (regiones, VPC, buckets, Lambda, DynamoDB) en los dos idiomas'),
    both('Avoid the false friends that confuse teams: *library*, *actual*, *eventually*, *instance*', 'Evitar los falsos amigos que confunden a los equipos: *librería*, *actual*, *eventualmente*, *instancia*'),
    both('Know the differences between Spain and Latin America that matter at work', 'Conocer las diferencias entre España y Latinoamérica que importan en el trabajo'),
    both('Write the same change four ways: commit message, pull request, Slack message and client email', 'Contar el mismo cambio de cuatro maneras: mensaje de commit, pull request, mensaje de Slack y correo al cliente'),
  ],
  labels: {
    'nav.tutorials': both('Modules', 'Módulos'),
    'unit.name': both('Module', 'Módulo'),
    'home.tutorials': both('The modules', 'Los módulos'),
    'home.tutorialsLede': both(
      'Each module starts from a real moment at work. Read a little, drill the words with flashcards, sort phrases by register, write a real message, then check yourself.',
      'Cada módulo parte de un momento real de trabajo. Lee un poco, repasa las palabras con tarjetas, clasifica frases por registro, escribe un mensaje real y luego compruébalo.',
    ),
    'tut.finished': both('🎉 Module finished', '🎉 Módulo terminado'),
    'app.unlocked': both(() => 'Unlocked. Every module is yours. Enjoy!', () => 'Desbloqueado. Todos los módulos son tuyos. ¡Disfrútalo!'),
    'unlock.soon': both('Purchases open very soon. The free modules are ready now.', 'Las compras abren muy pronto. Los módulos gratis ya están listos.'),
    'unlock.allTutorials': both(
      (count, titles) => `All ${count} modules, including ${titles}`,
      (count, titles) => `Los ${count} módulos, incluidos ${titles}`,
    ),
    'unlock.everyTask': both('Every lesson, flashcard deck, register drill and writing task', 'Todas las lecciones, mazos de tarjetas, ejercicios de registro y de escritura'),
    'unlock.project': both('The final project: tell the same change in both languages, in the right register', 'El proyecto final: contar el mismo cambio en los dos idiomas, en el registro correcto'),
  },
  pricingLede: both(
    'All nine modules: 200+ terms with flashcards in both directions, register drills, writing tasks and the final project. Pay once, keep it.',
    'Los nueve módulos: más de 200 términos con tarjetas en las dos direcciones, ejercicios de registro, de escritura y el proyecto final. Pagas una vez y es tuyo.',
  ),
  faq: [
    {
      q: both('Who is this for?', '¿Para quién es?'),
      a: both(
        'Two kinds of people: Spanish speakers who work (or want to work) on English-speaking teams, and people who learned tech in English and now need to work in Spanish with clients, teams or family businesses. You need to already speak everyday Spanish or English; this course teaches the tech vocabulary and when to use each form.',
        'Para dos tipos de personas: hispanohablantes que trabajan (o quieren trabajar) en equipos de habla inglesa, y quienes aprendieron la tecnología en inglés y ahora necesitan trabajar en español con clientes, equipos o empresas familiares. Necesitas hablar ya español o inglés del día a día; el curso enseña el vocabulario técnico y cuándo usar cada forma.',
      ),
    },
    {
      q: both('Spain or Latin America?', '¿Español de España o de Latinoamérica?'),
      a: both(
        'Both. The lessons use neutral Spanish and point out where Spain and Latin America differ (*ordenador / computadora*, *entorno / ambiente*, *monitorizar / monitorear*). The regional notes describe common usage, not rules: they vary by country and company.',
        'Los dos. Las lecciones usan un español neutro y señalan dónde cambian España y Latinoamérica (*ordenador / computadora*, *entorno / ambiente*, *monitorizar / monitorear*). Las notas regionales describen el uso habitual, no normas: cambian según el país y la empresa.',
      ),
    },
    {
      q: both('Are these the "official" translations?', '¿Son las traducciones "oficiales"?'),
      a: both(
        'Often there is no single official translation: GitHub, VS Code and Git itself translate `git push` three different ways. Where AWS\'s Spanish documentation uses a term, we say so and link it (note that it is machine-translated). Where usage is debated, we show the options and say which fits a formal document.',
        'Muchas veces no hay una única traducción oficial: GitHub, VS Code y el propio Git traducen `git push` de tres maneras distintas. Cuando la documentación de AWS en español usa un término, lo decimos y lo enlazamos (ojo: está traducida automáticamente). Cuando el uso está en debate, mostramos las opciones y cuál encaja en un documento formal.',
      ),
    },
    {
      q: both('Do I need to know how to code?', '¿Necesito saber programar?'),
      a: both(
        'It helps to work in or around tech (developer, IT, support, sales engineer, product), but you won\'t write code. You will write the messages people write at work: commit messages, pull requests, Slack updates and emails.',
        'Ayuda trabajar en tecnología o cerca de ella (desarrollo, IT, soporte, preventa, producto), pero no vas a programar. Vas a escribir los mensajes que se escriben en el trabajo: mensajes de commit, pull requests, avisos en Slack y correos.',
      ),
    },
    {
      q: both('Is this an official AWS course?', '¿Es un curso oficial de AWS?'),
      a: both(
        'No. Level Up Study Hub is an independent study site by Nico Tek Solutions. AWS is a trademark of Amazon.com, Inc.',
        'No. Level Up Study Hub es un sitio de estudio independiente de Nico Tek Solutions. AWS es una marca comercial de Amazon.com, Inc.',
      ),
    },
  ],
  afterCourse: both(
    `**Next steps:**
- Use one new term from the course in your next stand-up or pull request.
- Study for an AWS certification with the [Cloud Practitioner study game](https://cloud.aws-study-flashcards-app.com): you now know the vocabulary in both languages.
- Keep the full glossary handy: every term is in the flashcards of each module.`,
    `**Siguientes pasos:**
- Usa un término nuevo del curso en tu próxima daily o pull request.
- Prepárate para una certificación de AWS con el [juego de estudio de Cloud Practitioner](https://cloud.aws-study-flashcards-app.com): ya conoces el vocabulario en los dos idiomas.
- Ten el glosario a mano: cada término está en las tarjetas de su módulo.`,
  ),
  siblings: siblingsOf(meta.id),
  tutorials: [startHere, gitEveryday, talkingCode, devopsCicd, cloudAws, data, security, teamwork, finalProject],
};

export default course;

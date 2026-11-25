// Module 6: Security (paid).
// Lessons: who you are and what you can do; secrets and encryption;
// permissions and threats. Translations come from the glossary (termTable,
// traps, cardsFor). "Cifrar" vs "encriptar", "token", "phishing" and "hacker"
// are presented as common usage: their notes in content/tech-spanish/sources.mjs
// are still pending. The only "AWS's Spanish docs say" claim is "roles de IAM"
// (aws-iam-roles), already introduced in Module 4. IAM role and policy are
// practiced in Module 4's deck; here they're only referenced.
import { both, join } from '../../../engine/i18n';
import { termTable, traps, cardsFor } from '../glossary';

const IDENTITY = ['authentication', 'authorization', 'sign-in', 'credentials', 'password', 'mfa', 'root-user'];
const SECRETS = ['token', 'api-key', 'secret', 'encryption', 'at-rest-transit', 'certificate'];
const THREATS = ['permissions', 'least-privilege', 'firewall', 'vulnerability', 'phishing', 'hacker', 'audit'];

export default {
  slug: 'security',
  number: 6,
  free: false,
  title: both('Security', 'Seguridad'),
  situation: both(
    "You're a backend developer at a SaaS company with engineers in Toronto, Madrid and Mexico City. Monday, 9:40: someone pushes a .env file with the Stripe API key and an AWS access key to a public GitHub repo. You have to warn the English-speaking #eng-security channel, explain what was leaked and lay out the rotation plan. On Friday you finish a review of a client's AWS account, Andina Retail, and send them a formal security note in Spanish about MFA and least privilege. First you need the words: authentication, token, cifrar or encriptar, política, and everything in between.",
    'Trabajas como desarrollador backend en una empresa SaaS con ingenieros en Toronto, Madrid y Ciudad de México. Lunes, 9:40: alguien sube a un repo público de GitHub un archivo .env con la clave de API de Stripe y una clave de acceso de AWS. Tienes que avisar en #eng-security, donde se escribe en inglés, explicar qué se filtró y presentar el plan de rotación. El viernes terminas la revisión de la cuenta de AWS de un cliente, Andina Retail, y le envías una nota de seguridad formal en español sobre MFA y privilegio mínimo. Antes necesitas las palabras: autenticación, token, cifrar o encriptar, política y todo lo que hay en medio.',
  ),
  overview: both(
    "Security vocabulary is short, but small mistakes cost a lot: *authentication* and *authorization* look alike, *política* is not politics, *clave* can be a password or a key, and *hacker* often sounds criminal in Spanish. In this module you learn how to talk about identities and sign-in, secrets and encryption (*cifrar* in a document, *encriptar* with the team), and permissions and threats, from least privilege to phishing and audits. You practice each term in three registers, write a leaked-key warning in English, and write a formal security note for a client in Spanish.",
    'El vocabulario de seguridad es corto, pero los errores pequeños salen caros: *authentication* y *authorization* se parecen, *política* no es politics, *clave* puede ser una contraseña o una key, y *hacker* en español suele sonar a delito. En este módulo aprendes a hablar de identidades e inicio de sesión, de secretos y cifrado (*cifrar* en un documento, *encriptar* con el equipo) y de permisos y amenazas, del privilegio mínimo al phishing y las auditorías. Practicas cada término en tres registros, escribes en inglés el aviso de una clave filtrada y redactas en español una nota de seguridad formal para un cliente.',
  ),
  level: both('Intermediate', 'Intermedio'),
  hours: 1,
  skills: ['authentication', 'MFA', 'API key', 'encryption', 'least privilege', 'phishing', 'audit'],
  steps: [
    // ---------- Lesson 1: who you are and what you can do ----------
    {
      id: 'who-you-are',
      kind: 'read',
      title: both('Who you are and what you can do', 'Quién eres y qué puedes hacer'),
      minutes: 6,
      body: join(
        both(
          `**Why first.** Every security conversation starts with two questions: *who are you?* and *what can you do?* English answers them with two words that look almost the same, and Spanish copies them. Mix them up in a ticket and the wrong team looks at the wrong system.

- **Authentication** (*autenticación*, "authn", "auth" with the team) proves who you are. **Authorization** (*autorización*, "authz") decides what you can do once you're in. Think of a hotel: reception checks your ID (authentication), and your key card opens your room, but not the kitchen (authorization). HTTP mixes the names up: 401 "Unauthorized" means *not authenticated*; 403 "Forbidden", *not authorized*.
- To **sign in** or **log in** is *iniciar sesión*; to **sign up** is *registrarse*. With the team you'll hear *loguearse* and *entrar*. Keep *loguearse* (to sign in) apart from *loguear* (to write to a log, Module 3).
- **Credentials** (*credenciales*, "las creds" in slang) are whatever proves who you are: a username and password, or an AWS access key.
- A **password** is a *contraseña*. In Latin America *clave* is very common too, and some say *la pass*. Careful: *clave* also means *key*, as in *clave de API*.
- **MFA** (*autenticación multifactor*; with the team, *el doble factor*) asks for a second proof, such as a code from an app or a security key. In writing it's *la* MFA (*la autenticación*); out loud, many people say *el* MFA.
- The **root user** (*usuario raíz*) is the identity created with the AWS account, with full access. Protect it with MFA (AWS now requires MFA when the root user signs in), lock its credentials away and don't use it for daily work.`,
          `**Primero, el porqué.** Toda conversación de seguridad empieza con dos preguntas: *¿quién eres?* y *¿qué puedes hacer?* El inglés las responde con dos palabras casi iguales, y el español las copia. Si las confundes en un ticket, el equipo equivocado revisa el sistema equivocado.

- La **autenticación** (*authentication*, "authn"; "auth" con el equipo) demuestra quién eres. La **autorización** (*authorization*, "authz") decide qué puedes hacer una vez dentro. Piensa en un hotel: en recepción comprueban tu identificación (autenticación), y tu tarjeta abre tu habitación, pero no la cocina (autorización). HTTP mezcla los nombres: el 401 "Unauthorized" significa *no autenticado*, y el 403 "Forbidden", *sin autorización*.
- **Sign in** o **log in** es *iniciar sesión*; **sign up** es *registrarse*. Con el equipo oirás *loguearse* y *entrar*. No confundas *loguearse* (iniciar sesión) con *loguear* (escribir en el log, Módulo 3).
- Las **credenciales** (*credentials*; "las creds" en jerga) son lo que demuestra quién eres: un usuario y una contraseña, o una clave de acceso de AWS.
- **Password** es *contraseña*. En Latinoamérica también es muy común *clave*, y hay quien dice *la pass*. Ojo: *clave* también significa *key*, como en *clave de API*.
- La **autenticación multifactor** (*MFA*; con el equipo, *el doble factor*) pide una segunda prueba, como un código de una app o una llave de seguridad. Por escrito, *la* MFA (la autenticación); al hablar, mucha gente dice *el* MFA.
- El **usuario raíz** (*root user*) es la identidad que se crea con la cuenta de AWS y tiene acceso total. Protégelo con MFA (AWS ya exige MFA cuando el usuario raíz inicia sesión), guarda sus credenciales bajo llave y no lo uses para el trabajo diario.`,
        ),
        termTable(IDENTITY),
        traps(IDENTITY),
        both(
          '**In short:** authentication is who you are and authorization is what you can do; write *iniciar sesión*, say *loguearse* with the team, and lock the root user away behind MFA.',
          '**En resumen:** la autenticación es quién eres y la autorización, qué puedes hacer; escribe *iniciar sesión*, di *loguearse* con el equipo y guarda el usuario raíz bajo llave, con MFA.',
        ),
      ),
    },
    {
      id: 'cards-identity',
      kind: 'cards',
      title: both('Flashcards: identity and sign-in', 'Tarjetas: identidad e inicio de sesión'),
      minutes: 6,
      body: both(
        'Each term in both directions. For password, say the formal form, *clave* (very common in Latin America) and the slang before you flip.',
        'Cada término en las dos direcciones. Para password, di la forma formal, *clave* (muy común en Latinoamérica) y la de jerga antes de girar la tarjeta.',
      ),
      cards: cardsFor(IDENTITY),
    },

    // ---------- Lesson 2: secrets and encryption ----------
    {
      id: 'secrets-encryption',
      kind: 'read',
      title: both('Secrets and encryption', 'Secretos y cifrado'),
      minutes: 6,
      body: join(
        both(
          `**Why first.** Many security incidents in small teams aren't movie hackers: they're a key pasted in the wrong place. To raise the alarm and explain the fix, you need words for what you protect and how.

- A **token** (*token* in Spanish too, in practice) is a temporary pass you get after signing in. Amazon Cognito issues ID, access and refresh tokens.
- An **API key** (*clave de API*, "la API key" with the team) is a long string that identifies an app when it calls an API. Calls to AWS itself are signed with an **access key** (*clave de acceso*) instead: an access key ID plus a secret access key, valid until someone deactivates it. Prefer the temporary credentials of an IAM role.
- A **secret** (*secreto*) is any value that must stay hidden: keys, passwords, connection strings. AWS Secrets Manager stores them and can rotate them automatically. To **rotate** (*rotar*) a key is to replace it with a new one and retire the old one.
- **Encryption** (*cifrado*) scrambles data so only someone with the key can read it: to **encrypt** is *cifrar*, to **decrypt** *descifrar*. With the team you'll hear *encriptar* everywhere; in a document, *cifrar* is the more careful choice.
- **At rest** (*en reposo*) is stored data; **in transit** (*en tránsito*) is data moving over the network. Picture a safe and an armored truck: different risks, different locks. S3 encrypts new objects at rest by default, and TLS (HTTPS) protects data in transit.
- A **certificate** (*certificado*, "el SSL" with the team) proves a domain is who it says it is and makes TLS possible. ACM issues free public certificates (us-east-1 for CloudFront).`,
          `**Primero, el porqué.** Muchos incidentes de seguridad en equipos pequeños no son hackers de película: son una clave pegada donde no debía estar. Para dar la alarma y explicar la solución, necesitas nombrar qué proteges y cómo.

- Un **token** (en la práctica, *token* también en español) es un pase temporal que recibes al iniciar sesión. Amazon Cognito emite tokens de ID, de acceso y de actualización (refresh).
- Una **clave de API** (*API key*; "la API key" con el equipo) es una cadena larga que identifica a una app cuando llama a una API. Las llamadas a AWS se firman con una **clave de acceso** (*access key*): un ID de clave de acceso más una clave de acceso secreta, válida hasta que alguien la desactive. Siempre que puedas, usa credenciales temporales de un rol de IAM.
- Un **secreto** (*secret*) es cualquier valor que debe quedar oculto: claves, contraseñas, cadenas de conexión. AWS Secrets Manager los guarda y puede rotarlos automáticamente. **Rotar** una clave (*rotate*) es sustituirla por una nueva y retirar la anterior.
- El **cifrado** (*encryption*) transforma los datos para que solo pueda leerlos quien tenga la clave: **cifrar** es *encrypt* y **descifrar**, *decrypt*. Con el equipo oirás *encriptar* por todas partes; en un documento, *cifrar* es la opción más cuidada.
- **En reposo** (*at rest*) son los datos guardados; **en tránsito** (*in transit*), los que viajan por la red. Piensa en una caja fuerte y un camión blindado: riesgos distintos, cerraduras distintas. S3 cifra los objetos nuevos por defecto, y TLS (HTTPS) protege los datos en tránsito.
- Un **certificado** (*certificate*; "el SSL" con el equipo) acredita la identidad de un dominio y hace posible TLS. ACM emite certificados públicos gratuitos (en us-east-1 para CloudFront).`,
        ),
        termTable(SECRETS),
        traps(SECRETS),
        both(
          '**In short:** tokens expire, keys and secrets live in Secrets Manager and get rotated, and in a document data at rest and in transit is *cifrado*, not *encriptado*.',
          '**En resumen:** los tokens caducan, las claves y los secretos viven en Secrets Manager y se rotan, y en un documento los datos se *cifran* en reposo y en tránsito.',
        ),
      ),
    },
    {
      id: 'cards-secrets',
      kind: 'cards',
      title: both('Flashcards: secrets and encryption', 'Tarjetas: secretos y cifrado'),
      minutes: 5,
      body: both(
        'Each term in both directions. For encryption, say both *cifrar* and *encriptar*, and which one you would write in a report.',
        'Cada término en las dos direcciones. Para encryption, di *cifrar* y *encriptar*, y cuál escribirías en un informe.',
      ),
      cards: cardsFor(SECRETS),
    },
    {
      id: 'write-leaked-key',
      kind: 'rewrite',
      title: both('Write it: a leaked-key warning on Slack', 'Escríbelo: el aviso de una clave filtrada en Slack'),
      minutes: 8,
      body: both(
        "It's Monday, 10:15. Your notes are in Spanish, and #eng-security is in English. Engineers in three cities will read it between meetings: short, calm and scannable. Team register is fine, but every key fact has to be there. Watch the false friend: Spanish *filtrarse* is *to leak*, not *to filter*.",
        'Es lunes, 10:15. Tus notas están en español y en #eng-security se escribe en inglés. Lo van a leer ingenieros de tres ciudades entre reunión y reunión: breve, tranquilo y fácil de leer de un vistazo. El registro de equipo está bien, pero tienen que estar todos los datos clave. Cuidado con el falso amigo: *filtrarse* es *to leak*, no *to filter*.',
      ),
      target: 'en',
      source: `Notas para el aviso en #eng-security:
- 9:40: alguien subió al repo público de GitHub un commit con un archivo .env. Dentro: la clave de API de Stripe y una clave de acceso de AWS del usuario de IAM ci-deploy.
- Se filtraron las dos. El escaneo de secretos de GitHub lo detectó a las 9:52.
- Ya hecho: a las 10:05 desactivamos la clave de acceso de AWS y revocamos la clave de Stripe; también quitamos el .env de main.
- Plan de rotación: claves nuevas hoy, guardadas solo en Secrets Manager; el pipeline las lee desde ahí. Nada de archivos .env en el repo.
- También reducimos los permisos de ci-deploy al privilegio mínimo.
- Estamos revisando CloudTrail para ver si alguien usó la clave de acceso entre las 9:40 y las 10:05. De momento, nada raro.
- Lo que necesitamos del equipo: actualizar main, no usar las claves viejas y avisar si ven errores 403.
- Próxima actualización a las 13:00.`,
      task: both(
        'Write the warning for #eng-security in English: what leaked and where (the Stripe API key and the AWS access key, in a commit to a public repo), that both keys were deactivated or revoked, the rotation plan (new keys stored in Secrets Manager), the permissions cut to least privilege, the CloudTrail check, what you need from the team, and when the next update comes.',
        'Escribe el aviso para #eng-security en inglés: qué se filtró y dónde (la clave de API de Stripe y la clave de acceso de AWS, en un commit a un repo público), que las dos claves se desactivaron o revocaron, el plan de rotación (claves nuevas guardadas en Secrets Manager), los permisos reducidos al privilegio mínimo, la revisión de CloudTrail, qué necesitas del equipo y cuándo llega la próxima actualización.',
      ),
      minWords: 50,
      mustUse: [
        { any: ['leak*', 'expos*', 'compromis*', 'publicly', 'public repo*', 'public GitHub', 'public repositor*', 'made public'], label: 'leaked / exposed' },
        { any: ['API key*', 'access key*', 'secret key*', 'key', 'keys', 'credential*', 'creds'], label: 'API key / access key' },
        { any: ['deactivat*', 'inactive', 'revok*', 'disabl*', 'invalidat*', 'kill*', 'delet*', 'turned off', 'shut off'], label: 'deactivated / revoked' },
        { any: ['rotat*', 'roll*', 'new key*', 'new credential*', 'replac*', 'regenerat*', 'reissu*'], label: 'rotation' },
        { any: ['Secrets Manager', 'secret store', 'secrets store', 'Parameter Store', 'vault'], label: 'Secrets Manager' },
        { any: ['least privilege', 'least-privilege', 'minimum permissions', 'only the permissions', 'scoped', 'scope down', 'scoping', 'permission*'], label: 'least privilege / permissions' },
        { any: ['CloudTrail', 'audit*', 'log', 'logs'], label: 'CloudTrail / audit' },
      ],
      avoid: [
        {
          any: ['got filtered', 'was filtered', 'were filtered', 'been filtered', 'filtrat*'],
          why: both(
            'Spanish *se filtró* is *it leaked* / *it was leaked*. In English, *filtered* means passed through a filter, which says the opposite.',
            '*Se filtró* en inglés es *it leaked* / *it was leaked*. En inglés, *filtered* significa que pasó por un filtro, que es casi lo contrario.',
          ),
        },
        {
          any: ['politic*'],
          why: both(
            'An IAM *política* is a *policy* in English. *Politics* is about governments and office power games.',
            'Una *política* de IAM en inglés es *policy*. *Politics* es la política de los gobiernos y los juegos de poder de la oficina.',
          ),
        },
        {
          any: ['encript*'],
          why: both(
            'English spells it with a *y*: *encrypt*, *encrypted*. *Encript-* is the Spanish *encriptar* leaking through.',
            'En inglés se escribe con *y*: *encrypt*, *encrypted*. *Encript-* es el *encriptar* del español que se cuela.',
          ),
        },
      ],
      model: `Heads-up: leaked credentials, contained.
At 9:40 someone pushed a commit with a .env file to our public GitHub repo. It held the Stripe API key and an AWS access key for the IAM user ci-deploy. GitHub secret scanning flagged it at 9:52. Treat both keys as compromised.
Done: at 10:05 we deactivated the AWS access key and revoked the Stripe key, and the .env file is gone from main.
Rotation plan: new keys go out today and live only in Secrets Manager; the pipeline reads them from there. No more .env files in the repo. We're also cutting ci-deploy's permissions down to least privilege.
Audit: we're checking CloudTrail for any use of the old access key between 9:40 and 10:05. Nothing suspicious so far.
Please pull main, don't use the old keys, and ping me if you see 403s. Next update at 13:00.`,
    },

    // ---------- Lesson 3: permissions and threats ----------
    {
      id: 'permissions-threats',
      kind: 'read',
      title: both('Permissions and threats', 'Permisos y amenazas'),
      minutes: 7,
      body: join(
        both(
          `**Why first.** Knowing who someone is (Lesson 1) is half the job. The other half is deciding what each identity may touch, and noticing when someone tries something they shouldn't.

- **Permissions** (*permisos*) say which actions an identity may perform on which resources. In AWS they're written in a **policy** (*política*, from Module 4) attached to a user or an **IAM role** (*rol de IAM*).
- **Least privilege** (*principio de privilegio mínimo*; you'll also read and hear *mínimo privilegio*, both fine in writing) means granting only what a task needs. Think of the cleaning crew: they get a key to the office, not to the safe. A Lambda function that reads one DynamoDB table gets read actions on that table, not AdministratorAccess.
- A **firewall** filters network traffic. Formal Spanish says *cortafuegos*, more common in Spain; in Latin America teams usually say *el firewall*. Security groups are a virtual firewall for your instances; AWS WAF is a web application firewall.
- A **vulnerability** (*vulnerabilidad*) is a weakness someone can use; an **exploit** is the code that uses it. Amazon Inspector scans EC2 instances, container images and Lambda functions for them.
- **Phishing** is a fake message that tricks you into handing over credentials. In a formal text: *suplantación de identidad (phishing)*, with the English word in brackets the first time.
- A **breach** is a *brecha de seguridad*. In a report, the attacker is an *atacante* (or *ciberdelincuente*); *pirata informático* is newspaper language. With the team: *hacker* and *hackear*.
- An **audit** (*auditoría*) checks what happened and whether you follow the rules; **compliance** is *cumplimiento normativo* in writing and *compliance* in the office. CloudTrail records API calls.`,
          `**Primero, el porqué.** Saber quién es alguien (Lección 1) es la mitad del trabajo. La otra mitad es decidir qué puede tocar cada identidad y detectar a quien intenta algo indebido.

- Los **permisos** (*permissions*) dicen qué acciones puede realizar una identidad sobre qué recursos. En AWS se escriben en una **política** (*policy*, del Módulo 4) asociada a un usuario o a un **rol de IAM** (*IAM role*).
- El **privilegio mínimo** (*least privilege*; también se dice y escribe *mínimo privilegio*) consiste en conceder solo lo que una tarea necesita. Piensa en el equipo de limpieza: recibe la llave de la oficina, no la de la caja fuerte. Una Lambda que lee una tabla de DynamoDB recibe solo lectura sobre esa tabla, no AdministratorAccess.
- Un **cortafuegos** (*firewall*) filtra el tráfico de red. *Cortafuegos* es la forma formal y se oye más en España; en Latinoamérica los equipos suelen decir *el firewall*. Los grupos de seguridad son un firewall virtual para tus instancias; AWS WAF filtra el tráfico web.
- Una **vulnerabilidad** (*vulnerability*) es una debilidad que alguien puede aprovechar; un **exploit** es el código que la aprovecha. Amazon Inspector las busca en EC2, imágenes de contenedor y Lambda.
- El **phishing** es un mensaje falso que te engaña para que entregues tus credenciales. En un texto formal: *suplantación de identidad (phishing)*, con la palabra inglesa entre paréntesis la primera vez.
- Una **brecha de seguridad** es un *breach*. En un informe, quien ataca es un *atacante* (o *ciberdelincuente*); *pirata informático* es lenguaje de prensa. Con el equipo: *hacker* y *hackear*.
- Una **auditoría** (*audit*) revisa qué pasó y si cumples las reglas; *compliance* es *cumplimiento normativo* por escrito y *compliance* en la oficina. CloudTrail registra las llamadas a la API.`,
        ),
        termTable(THREATS),
        traps([...THREATS, 'policy', 'iam-role']),
        both(
          "**In short:** permissions live in policies (*políticas*, not politics), least privilege grants only what's needed, and an audit proves it.",
          '**En resumen:** los permisos viven en las políticas (policies, no politics), el privilegio mínimo concede solo lo necesario y la auditoría lo demuestra.',
        ),
      ),
    },
    {
      id: 'cards-threats',
      kind: 'cards',
      title: both('Flashcards: permissions and threats', 'Tarjetas: permisos y amenazas'),
      minutes: 6,
      body: both(
        'Each term in both directions. For hacker and audit, say the formal Spanish form and the one you would use with the team.',
        'Cada término en las dos direcciones. Para hacker y audit, di la forma formal en español y la que usarías con el equipo.',
      ),
      cards: cardsFor(THREATS),
    },

    // ---------- Practice ----------
    {
      id: 'register-security',
      kind: 'register',
      title: both('Formal, team or slang?', '¿Formal, de equipo o jerga?'),
      minutes: 6,
      body: both(
        'Phrases from real Slack messages, client emails, security reports and meetings, in both languages. Decide where each one fits best.',
        'Frases de mensajes de Slack, correos a clientes, informes de seguridad y reuniones reales, en los dos idiomas. Decide dónde encaja mejor cada una.',
      ),
      items: [
        {
          text: 'Se recomienda habilitar la autenticación multifactor para el usuario raíz y no utilizarlo en las tareas diarias.',
          context: both('Security report for a client', 'Informe de seguridad para un cliente'),
          answer: 'formal',
          explain: both(
            '*Autenticación multifactor* and *usuario raíz* are the glossary\'s formal forms, and the impersonal *se recomienda* reads like a document. With the team: "activa el MFA en el root".',
            '*Autenticación multifactor* y *usuario raíz* son las formas formales del glosario, y el impersonal *se recomienda* suena a documento. Con el equipo: "activa el MFA en el root".',
          ),
        },
        {
          text: '¿Me pasas la pass de staging? No me puedo loguear 😩',
          context: both('Slack, direct message', 'Slack, mensaje directo'),
          answer: 'slang',
          explain: both(
            '*La pass* and the emoji make it slang; *loguearse* is everyday team talk (formal: *contraseña*, *iniciar sesión*). And the content is a problem too: passwords never go through Slack; they go in a password manager or Secrets Manager.',
            '*La pass* y el emoji lo hacen jerga; *loguearse* es lenguaje normal de equipo (formal: *contraseña*, *iniciar sesión*). Y el contenido también es un problema: las contraseñas nunca se pasan por Slack; van en un gestor de contraseñas o en Secrets Manager.',
          ),
        },
        {
          text: 'No tengo permisos para s3:PutObject. ¿Me agregas la acción a la política del rol?',
          context: both('Slack, team channel', 'Slack, canal del equipo'),
          answer: 'team',
          explain: both(
            '*Permisos*, *política* and *rol* are correct in any register; the friendly question (*¿me agregas…?*) makes it a team message. *La policy* would push it toward slang.',
            '*Permisos*, *política* y *rol* son correctos en cualquier registro; la pregunta cercana (*¿me agregas…?*) lo convierte en un mensaje de equipo. *La policy* lo acercaría a la jerga.',
          ),
        },
        {
          text: "pls don't paste creds in #general 🙏 use the vault",
          context: both('Slack, #general', 'Slack, #general'),
          answer: 'slang',
          explain: both(
            '*Creds*, *pls* and the emoji are English slang, like Spanish *las creds*. In a policy document: "credentials must never be shared in chat channels".',
            '*Creds*, *pls* y el emoji son jerga en inglés, como *las creds* en español. En un documento de normas: "las credenciales nunca deben compartirse en canales de chat".',
          ),
        },
        {
          text: 'All customer data is encrypted at rest and in transit, and access follows the principle of least privilege.',
          context: both('Security questionnaire for a client', 'Cuestionario de seguridad de un cliente'),
          answer: 'formal',
          explain: both(
            'Passive voice, full terms (*encrypted at rest and in transit*, *principle of least privilege*): a document. In Spanish: "Todos los datos de clientes se cifran en reposo y en tránsito…", with *cifrar*, not *encriptar*.',
            'Voz pasiva y términos completos (*encrypted at rest and in transit*, *principle of least privilege*): un documento. En español: "Todos los datos de clientes se cifran en reposo y en tránsito…", con *cifrar*, no *encriptar*.',
          ),
        },
        {
          text: 'Ojo: la API key de Stripe está en el .env, hay que moverla a Secrets Manager hoy.',
          context: both('Pull request comment', 'Comentario en una pull request'),
          answer: 'team',
          explain: both(
            '*La API key* is the glossary\'s team form (formal: *clave de API*). Clear, direct, no slang: a normal review comment.',
            '*La API key* es la forma de equipo del glosario (formal: *clave de API*). Claro, directo y sin jerga: un comentario de revisión normal.',
          ),
        },
        {
          text: 'Hubo un intento de phishing: alguien se hizo pasar por el CFO y pidió claves de acceso por correo.',
          context: both('Stand-up', 'Daily'),
          answer: 'team',
          explain: both(
            '*Phishing* in English is the team form. In a formal incident report: *intento de suplantación de identidad (phishing)*.',
            '*Phishing* en inglés es la forma de equipo. En un informe formal de incidente: *intento de suplantación de identidad (phishing)*.',
          ),
        },
        {
          text: 'The audit found five access keys older than 365 days. We recommend rotating them and moving to temporary credentials.',
          context: both('Audit summary for management', 'Resumen de auditoría para la dirección'),
          answer: 'formal',
          explain: both(
            'A finding plus *we recommend*: report language. In Spanish: *auditoría*, *claves de acceso*, *credenciales temporales*, and *rotarlas* or *sustituirlas*.',
            'Un hallazgo más *we recommend*: lenguaje de informe. En español: *auditoría*, *claves de acceso*, *credenciales temporales*, y *rotarlas* o *sustituirlas*.',
          ),
        },
        {
          text: "Heads-up: I'm rotating the database password at 3 p.m., so expect a few seconds of connection errors.",
          context: both('Slack, team channel', 'Slack, canal del equipo'),
          answer: 'team',
          explain: both(
            '*Heads-up* and the first person are friendly team English, but every fact is precise. Not slang, not a document.',
            '*Heads-up* y la primera persona son inglés cercano de equipo, pero cada dato es preciso. Ni jerga ni documento.',
          ),
        },
        {
          text: '¿Ya le pusiste el 2FA a tu user? Sin eso los de compliance no te dejan ni entrar 😅',
          context: both('Chat with a new teammate', 'Chat con un compañero nuevo'),
          answer: 'slang',
          explain: both(
            '*El 2FA* (the glossary\'s slang form; strictly, two-factor is one kind of MFA), *tu user* and the emoji make it slang; *los de compliance* is office shorthand. With the team: *el MFA* or *el doble factor*; in writing: *autenticación multifactor* and *el equipo de cumplimiento normativo*.',
            '*El 2FA* (la forma de jerga del glosario; en rigor, dos factores es un tipo de MFA), *tu user* y el emoji lo hacen jerga; *los de compliance* es lenguaje de oficina. Con el equipo: *el MFA* o *el doble factor*; por escrito: *autenticación multifactor* y *el equipo de cumplimiento normativo*.',
          ),
        },
      ],
    },
    {
      id: 'write-client-note',
      kind: 'rewrite',
      title: both('Write it: a security note for a client', 'Escríbelo: una nota de seguridad para un cliente'),
      minutes: 10,
      body: both(
        "It's Friday. Your notes from the review are in English, and the client's IT manager in Lima wants a formal note in Spanish. No slang, no *loguearse*, no *la policy*, no *encriptar*: the formal forms from this module. Address the client as *ustedes* / *su cuenta*.",
        'Es viernes. Tus notas de la revisión están en inglés, y el responsable de TI del cliente, en Lima, quiere una nota formal en español. Nada de jerga, nada de *loguearse*, *la policy* ni *encriptar*: las formas formales de este módulo. Dirígete al cliente con *ustedes* / *su cuenta*.',
      ),
      target: 'es',
      source: `Security review notes: Andina Retail AWS account (Nov 20)
- MFA: 3 of 12 IAM users have no MFA, including two admins. The root user has MFA, but it was used last month to change billing settings.
- Recommendation: require MFA for every human user who signs in. Keep the root user for the few tasks that need it and lock its credentials away.
- Least privilege: the CI role has the AdministratorAccess policy. Replace it with a policy that only allows what the pipeline does (upload to S3, invalidate CloudFront). One role per Lambda function.
- Long-lived access keys: 5 are older than a year. Move to temporary credentials (IAM roles, IAM Identity Center).
- Tooling: IAM Access Analyzer can generate policies from CloudTrail activity and find unused access.
- Next steps: workshop on Dec 3 to agree on the plan; we'll repeat the audit in January.`,
      task: both(
        'Write the note in formal Spanish: the MFA findings and the recommendation (including the root user), least privilege for the CI role and the Lambda roles, the long-lived access keys and the move to temporary credentials, and the next steps, including the new audit.',
        'Redacta la nota en español formal: lo que encontraste sobre la MFA y la recomendación (incluido el usuario raíz), el privilegio mínimo para el rol de CI y los roles de las Lambda, las claves de acceso de larga duración y el paso a credenciales temporales, y los próximos pasos, incluida la nueva auditoría.',
      ),
      minWords: 80,
      mustUse: [
        { any: ['autenticacion multifactor*', 'autenticacion de multiples factores', 'autenticacion de dos factores', 'dos factores', 'dos pasos', 'segundo factor', 'doble factor', 'MFA'], label: 'autenticación multifactor (MFA)' },
        { any: ['usuario raiz', 'usuarios raiz'], label: 'usuario raíz' },
        { any: ['privilegio minimo', 'minimo privilegio', 'privilegios minimos', 'minimos privilegios', 'menor privilegio'], label: 'privilegio mínimo' },
        { any: ['permiso*'], label: 'permisos' },
        { any: ['politica*'], label: 'política(s)' },
        { any: ['rol', 'roles'], label: 'rol(es) de IAM' },
        { any: ['credencial*', 'clave de acceso', 'claves de acceso'], label: 'credenciales / claves de acceso' },
        { any: ['auditori*', 'audit*'], label: 'auditoría' },
      ],
      avoid: [
        {
          any: ['loguea*', 'logue*', 'hacer login'],
          why: both(
            '*Loguearse* is team talk. In a formal note: *iniciar sesión* or *acceder*.',
            '*Loguearse* es lenguaje de equipo. En una nota formal: *iniciar sesión* o *acceder*.',
          ),
        },
        {
          any: ['policy', 'policies'],
          why: both(
            'In formal Spanish an IAM policy is a *política*: "la política AdministratorAccess".',
            'En español formal, una policy de IAM es una *política*: "la política AdministratorAccess".',
          ),
        },
        {
          any: ['role'],
          why: both(
            '*Role* doesn\'t exist in Spanish: it\'s *rol*, with one *l* (plural *roles*).',
            '*Role* no existe en español: es *rol*, con una sola *l* (plural *roles*).',
          ),
        },
        {
          any: ['encript*'],
          why: both(
            '*Encriptar* is everywhere in conversation, but in a formal document *cifrar* is the more careful choice.',
            '*Encriptar* se oye en todas partes, pero en un documento formal *cifrar* es la opción más cuidada.',
          ),
        },
        {
          any: ['password*', 'pass', 'creds'],
          why: both(
            'In a client document: *contraseña* and *credenciales*, never *la pass* or *las creds*.',
            'En un documento para un cliente: *contraseña* y *credenciales*, nunca *la pass* ni *las creds*.',
          ),
        },
        {
          any: ['compliance'],
          why: both(
            'In writing, *cumplimiento normativo*; *compliance* is office talk.',
            'Por escrito, *cumplimiento normativo*; *compliance* es lenguaje de oficina.',
          ),
        },
        {
          any: ['cuenta raiz'],
          why: both(
            'The account is the AWS account; its all-powerful identity is the *root user*: *usuario raíz*.',
            'La cuenta es la cuenta de AWS; su identidad con acceso total es el *usuario raíz*.',
          ),
        },
        {
          any: ['2FA'],
          why: both(
            '*2FA* is slang; in a client note write *autenticación multifactor (MFA)*.',
            '*2FA* es jerga; en una nota para un cliente, *autenticación multifactor (MFA)*.',
          ),
        },
      ],
      model: `Nota de seguridad: revisión de la cuenta de AWS de Andina Retail

El 20 de noviembre revisamos la configuración de identidades y permisos de su cuenta de AWS. A continuación resumimos los hallazgos y nuestras recomendaciones.

1. Autenticación multifactor (MFA). Tres de los doce usuarios de IAM, entre ellos dos administradores, no tienen la autenticación multifactor activada. Recomendamos exigirla a todas las personas que inicien sesión en la cuenta. El usuario raíz sí la tiene, pero se utilizó el mes pasado para cambiar la configuración de facturación; recomendamos reservarlo para las pocas tareas que lo requieren y guardar sus credenciales de forma segura.

2. Principio de privilegio mínimo. El rol de IAM del sistema de integración continua tiene asociada la política AdministratorAccess. Proponemos sustituirla por una política que conceda solo los permisos necesarios: subir archivos a S3 e invalidar la caché de CloudFront. Del mismo modo, cada función Lambda debería tener su propio rol.

3. Claves de acceso de larga duración. Cinco claves de acceso tienen más de un año de antigüedad. Recomendamos sustituirlas por credenciales temporales mediante roles de IAM e IAM Identity Center. IAM Access Analyzer puede generar políticas a partir de la actividad registrada en CloudTrail y detectar accesos que no se utilizan.

Próximos pasos: proponemos una sesión de trabajo el 3 de diciembre para acordar el plan, y repetiremos la auditoría en enero.`,
    },

    // ---------- Check ----------
    {
      id: 'quiz-security',
      kind: 'quiz',
      title: both('Check: security', 'Comprueba: seguridad'),
      minutes: 6,
      questions: [
        {
          q: both(
            'A user signs in without problems, but uploading a file to S3 returns 403 AccessDenied. Which part failed?',
            'Un usuario inicia sesión sin problemas, pero al subir un archivo a S3 recibe un 403 AccessDenied. ¿Qué parte falló?',
          ),
          options: [
            both('Authentication', 'La autenticación'),
            both('Authorization', 'La autorización'),
            both('MFA', 'La MFA'),
            both('Encryption in transit', 'El cifrado en tránsito'),
          ],
          answer: 1,
          explain: both(
            'The sign-in worked, so authentication (who you are) is fine. A 403 means the identity is known but lacks permissions for that action: authorization. Confusingly, HTTP 401 "Unauthorized" is the one that means not authenticated.',
            'El inicio de sesión funcionó, así que la autenticación (quién eres) está bien. Un 403 significa que se sabe quién eres, pero no tienes permisos para esa acción: autorización. Para confundir, el 401 "Unauthorized" de HTTP es el que significa no autenticado.',
          ),
        },
        {
          q: both(
            'You\'re writing a formal security document in Spanish. How do you say "we encrypt all data at rest"?',
            'Estás redactando un documento de seguridad formal en español. ¿Cómo dices "we encrypt all data at rest"?',
          ),
          options: [
            'Encriptamos todos los datos en descanso.',
            'Ciframos todos los datos en reposo.',
            'Codificamos todos los datos en reposo.',
            'Encriptamos todos los datos parados.',
          ],
          answer: 1,
          explain: both(
            '*Cifrar* is the more careful choice in writing (*encriptar* is very common out loud), and *at rest* is *en reposo*. *Codificar* is encoding, which isn\'t encryption: Base64 hides nothing.',
            '*Cifrar* es la opción más cuidada por escrito (*encriptar* es muy común al hablar), y *at rest* es *en reposo*. *Codificar* es encoding, que no es cifrar: Base64 no oculta nada.',
          ),
        },
        {
          q: both(
            'A colleague writes: "Asocia una política al rol de la Lambda." What is the *política*?',
            'Un compañero escribe: "Asocia una política al rol de la Lambda." ¿Qué es la *política*?',
          ),
          options: [
            both('Office politics about who owns the Lambda', 'Juegos de poder en la oficina sobre quién es dueño de la Lambda'),
            both('An IAM policy: a JSON document that allows or denies actions', 'Una policy de IAM: un documento JSON que permite o deniega acciones'),
            both("The company's privacy policy", 'La política de privacidad de la empresa'),
            both('A new law about data protection', 'Una nueva ley de protección de datos'),
          ],
          answer: 1,
          explain: both(
            'In IAM, *política* is the Spanish for *policy*: the JSON document attached to a user or role that lists allowed and denied actions. It\'s never *politics*.',
            'En IAM, *política* es *policy*: el documento JSON asociado a un usuario o rol que enumera las acciones permitidas y denegadas. Nunca es *politics*.',
          ),
        },
        {
          q: both(
            'An AWS access key was pushed to a public repo ten minutes ago. What do you do first?',
            'Hace diez minutos alguien subió una clave de acceso de AWS a un repo público. ¿Qué haces primero?',
          ),
          options: [
            both('Remove the commit from the Git history and carry on', 'Borrar el commit del historial de Git y seguir'),
            both('Make the repo private', 'Hacer privado el repo'),
            both('Deactivate the key, create a new one, and check CloudTrail for its use', 'Desactivar la clave, crear una nueva y revisar en CloudTrail si alguien la usó'),
            both('Change the root user\'s password', 'Cambiar la contraseña del usuario raíz'),
          ],
          answer: 2,
          explain: both(
            'Once a key is public, assume it was copied: bots scan public repos within minutes. Cleaning the history or hiding the repo doesn\'t make the key safe again. Deactivate it, replace it with a new one (stored in Secrets Manager), and check CloudTrail for whether anyone used it, and for what.',
            'Cuando una clave se hace pública, da por hecho que la copiaron: hay bots que revisan los repos públicos en minutos. Limpiar el historial u ocultar el repo no vuelve a hacerla segura. Desactívala, sustitúyela por una nueva (guardada en Secrets Manager) y revisa en CloudTrail si alguien la usó y para qué.',
          ),
        },
        {
          q: both(
            'HTTPS between the browser and CloudFront protects your data…',
            'HTTPS entre el navegador y CloudFront protege tus datos…',
          ),
          options: [
            both('at rest (en reposo)', 'en reposo (at rest)'),
            both('in transit (en tránsito)', 'en tránsito (in transit)'),
            both('in the backup', 'en la copia de seguridad'),
            both('in the database', 'en la base de datos'),
          ],
          answer: 1,
          explain: both(
            'TLS, the "S" in HTTPS, protects data while it travels over the network: in transit. Data stored on disk, such as S3 objects, is protected at rest; S3 encrypts new objects at rest by default.',
            'TLS, la "S" de HTTPS, protege los datos mientras viajan por la red: en tránsito. Los datos guardados en disco, como los objetos de S3, se protegen en reposo; S3 cifra en reposo los objetos nuevos de forma predeterminada.',
          ),
        },
        {
          q: both(
            'Which policy for a Lambda function that only reads one DynamoDB table follows least privilege?',
            '¿Qué política sigue el privilegio mínimo para una función Lambda que solo lee una tabla de DynamoDB?',
          ),
          options: [
            'AdministratorAccess',
            '"Action": "dynamodb:*", "Resource": "*"',
            both('"Action": ["dynamodb:GetItem", "dynamodb:Query"], "Resource": "<ARN of that table>"', '"Action": ["dynamodb:GetItem", "dynamodb:Query"], "Resource": "<ARN de esa tabla>"'),
            both('Use the root user\'s access keys in the function', 'Usar las claves de acceso del usuario raíz en la función'),
          ],
          answer: 2,
          explain: both(
            'Least privilege (*privilegio mínimo*) grants only the actions the task needs, on only the resource it uses. The other options give far more than reading one table, and the root user should never have access keys at all.',
            'El privilegio mínimo concede solo las acciones que la tarea necesita, y solo sobre el recurso que usa. Las demás opciones dan mucho más que leer una tabla, y el usuario raíz nunca debería tener claves de acceso.',
          ),
        },
        {
          q: both(
            'What does AWS recommend for the root user?',
            '¿Qué recomienda AWS para el usuario raíz?',
          ),
          options: [
            both('Use it for daily admin work, since it can do everything', 'Usarlo para la administración diaria, porque puede hacerlo todo'),
            both('Share its password with the team lead in case of emergency', 'Compartir su contraseña con el líder del equipo por si hay una emergencia'),
            both('Protect it with MFA and use it only for the few tasks that require it', 'Protegerlo con MFA y usarlo solo para las pocas tareas que lo requieren'),
            both('Create access keys for it so scripts can run as root', 'Crearle claves de acceso para que los scripts se ejecuten como root'),
          ],
          answer: 2,
          explain: both(
            'The root user (*usuario raíz*) has full access to the account, so a leak is a disaster. AWS recommends MFA (and now requires it at sign-in), no access keys, and day-to-day work through IAM roles or IAM Identity Center users.',
            'El usuario raíz tiene acceso total a la cuenta, así que una filtración es un desastre. AWS recomienda MFA (y ya la exige al iniciar sesión), ninguna clave de acceso y el trabajo diario con roles de IAM o usuarios de IAM Identity Center.',
          ),
        },
        {
          q: both(
            'An English job ad says: "We\'re looking for hackers who love clean code." How does it read, and what would a Spanish ad say?',
            'Un anuncio de empleo en inglés dice: "We\'re looking for hackers who love clean code." ¿Cómo se entiende y qué diría un anuncio en español?',
          ),
          options: [
            both('They want criminals; nobody would write that in Spanish', 'Buscan delincuentes; nadie escribiría eso en español'),
            both('Clever, hands-on programmers; in Spanish, something like "programadores con ingenio", since *hacker* usually sounds criminal', 'Programadores ingeniosos y prácticos; en español, algo como "programadores con ingenio", porque *hacker* suele sonar a delito'),
            both('Security auditors; in Spanish, "auditores"', 'Auditores de seguridad; en español, "auditores"'),
            both('People who write phishing emails for training', 'Gente que escribe correos de phishing para formación'),
          ],
          answer: 1,
          explain: both(
            'In technical English, a *hacker* can simply be someone who programs with skill and creativity. In Spanish, outside tech circles, *hacker* usually sounds criminal (*hacker ético* and *hackatón* are the exceptions); in a report, an attacker is an *atacante*, and a *breach* is a *brecha de seguridad*.',
            'En inglés técnico, un *hacker* puede ser simplemente alguien que programa con habilidad y creatividad. En español, fuera del mundo técnico, *hacker* suele sonar a delito (salvo en *hacker ético* o *hackatón*); en un informe se habla de un *atacante*, y un *breach* es una *brecha de seguridad*.',
          ),
        },
      ],
    },
  ],
};

// Module 4: Cloud and AWS.
// Lessons: where everything lives (Region, AZ, edge location, account); compute
// (the instancia false friend, escalar a problem vs scaling a system); networking;
// storage and stacks (bucket, never "cubo"; pila); costs and availability.
// Translations come from the glossary (termTable, traps, cardsFor). Where we say
// "AWS's Spanish docs use…", it's backed by content/tech-spanish/sources.mjs
// (aws-s3, aws-az, aws-elb, aws-lambda, aws-autoscaling, aws-iam-roles, aws-sg,
// aws-subnets, aws-cfn-stacks), and those docs are machine-translated. Everything
// else is presented as common usage.
import { both, join } from '../../../engine/i18n';
import { termTable, traps, cardsFor } from '../glossary';

const WHERE = ['cloud', 'region', 'az', 'edge-location', 'account', 'console', 'cli'];
const COMPUTE = ['instance', 'vm', 'server', 'serverless', 'lambda-function', 'scaling', 'compute', 'managed-service'];
const NETWORK = ['vpc', 'subnet', 'security-group', 'gateway', 'load-balancer', 'cdn', 'dns'];
const STORAGE = ['bucket', 'object-s3', 'storage', 'stack', 'resource', 'tag', 'iam-role', 'policy'];
const COSTS = ['pay-as-you-go', 'reserved-spot', 'billing', 'quota', 'latency', 'high-availability', 'fault-tolerance', 'disaster-recovery', 'shared-responsibility', 'migration-cloud'];

export default {
  slug: 'cloud-aws',
  number: 4,
  free: false,
  title: both('Cloud and AWS', 'Nube y AWS'),
  situation: both(
    "You're the bridge between the team and the client on a project for a logistics company in Bogotá. Your team, split between Austin and Madrid, is moving the company's customer portal to AWS: a static site in S3 behind CloudFront, Lambda functions, DynamoDB. The client's IT director, Sra. Ramírez, wants the architecture explained in formal Spanish, and asks on the first call: “¿Y los archivos dónde quedan, en un cubo?” The same week, your manager in Austin, Karen, forwards the October AWS bill with one line: “Why did this go up 38%?” Your Spanish notes on the cause are ready; she needs them in English.",
    'Eres el puente entre el equipo y el cliente en un proyecto para una empresa de logística de Bogotá. Tu equipo, repartido entre Austin y Madrid, está migrando el portal de clientes de la empresa a AWS: un sitio estático en S3 detrás de CloudFront, funciones de Lambda y DynamoDB. La directora de TI del cliente, la Sra. Ramírez, quiere que le expliquen la arquitectura en un español formal, y en la primera llamada pregunta: “¿Y los archivos dónde quedan, en un cubo?”. Esa misma semana, tu manager en Austin, Karen, reenvía la factura de AWS de octubre con una sola línea: “Why did this go up 38%?”. Tus notas en español sobre la causa están listas; ella las necesita en inglés.',
  ),
  overview: both(
    "Cloud vocabulary is half AWS product names and half everyday words that changed meaning: a *bucket* that is not a pail, an *instancia* that is not a formal request, a *pila* that is not a battery. Teams speak a mix of both languages, and AWS's Spanish documentation (machine-translated) settles some words but not all. In five lessons you learn where things live, compute, networking, storage and stacks, and costs, each in three registers. Then you write two real texts: an architecture summary for a Spanish-speaking client and an English explanation of why the AWS bill went up.",
    'El vocabulario de la nube es mitad nombres de productos de AWS y mitad palabras de siempre que cambiaron de significado: un *bucket* que no es un cubo, una *instancia* que no es una solicitud formal, una *pila* que no es una batería. Los equipos hablan una mezcla de los dos idiomas, y la documentación de AWS en español (traducida automáticamente) fija algunas palabras, pero no todas. En cinco lecciones aprendes dónde vive cada cosa, el cómputo, la red, el almacenamiento y las pilas, y los costos, cada uno en tres registros. Después escribes dos textos reales: un resumen de arquitectura para un cliente hispanohablante y una explicación en inglés de por qué subió la factura de AWS.',
  ),
  level: both('Intermediate', 'Intermedio'),
  hours: 1.25,
  skills: ['region', 'instance', 'VPC', 'bucket', 'stack', 'billing'],
  steps: [
    // ---------- Lesson 1: where everything lives ----------
    {
      id: 'where-it-lives',
      kind: 'read',
      title: both('Where everything lives', 'Dónde vive todo'),
      minutes: 6,
      body: join(
        both(
          "**Why first.** Every cloud conversation starts with “where”: which account, which Region, which zone. Get one of those wrong in a message and someone deploys to the wrong place, or looks for a resource that isn't there.",
          '**Primero, el porqué.** Toda conversación sobre la nube empieza por el “dónde”: qué cuenta, qué región, qué zona. Si te equivocas en uno de esos datos en un mensaje, alguien despliega en el sitio equivocado o busca un recurso que no está ahí.',
        ),
        both(
          "**The cloud** (*la nube*, *computación en la nube*) is renting computing from a provider instead of buying hardware. In AWS it is organized by place. A **Region** (*región*) is a geographic area, like `us-east-1` in Northern Virginia. Each Region has several **Availability Zones** (*zonas de disponibilidad*, *AZ*): each is one or more separate data centers with their own power and networking. Think of a Region as a city and the AZs as buildings in different neighborhoods: a fire in one doesn't reach the others. **Edge locations** (*ubicaciones de borde*) are much smaller sites near users, where CloudFront keeps copies of your files.",
          '**La nube** (*the cloud*, *computación en la nube*) es alquilar capacidad de cómputo a un proveedor en lugar de comprar hardware. En AWS se organiza por lugares. Una **región** (*Region*) es una zona geográfica, como `us-east-1`, en el norte de Virginia. Cada región tiene varias **zonas de disponibilidad** (*Availability Zones*, *AZ*): cada una es uno o varios centros de datos separados, con su propia energía y su propia red. Piensa en la región como una ciudad y en las AZ como edificios en barrios distintos: un incendio en uno no llega a los demás. Las **ubicaciones de borde** (*edge locations*) son sitios mucho más pequeños, cerca de los usuarios, donde CloudFront guarda copias de tus archivos.',
        ),
        both(
          "**Who and how.** Your **AWS account** (*cuenta de AWS*) is the container for everything you create and pay for; teams often have one for dev and one for prod. You work in it through the **console** (*consola de administración*, the web interface) or the **CLI** (*interfaz de línea de comandos*). In Spanish it's *la CLI*, feminine, because of *interfaz*. AWS's Spanish docs say *regiones* and *zonas de disponibilidad*; at work you'll also hear “la AZ”.",
          '**Quién y cómo.** Tu **cuenta de AWS** (*AWS account*) es el contenedor de todo lo que creas y pagas; los equipos suelen tener una para dev y otra para prod. Trabajas en ella desde la **consola de administración** (*console*, la interfaz web) o con la **CLI** (*interfaz de línea de comandos*). Es *la CLI*, en femenino, por *interfaz*. La documentación de AWS en español dice *regiones* y *zonas de disponibilidad*; en el trabajo también oirás “la AZ”.',
        ),
        termTable(WHERE),
        traps(WHERE),
        both(
          "**In short:** account, Region and AZ answer “where”; say *la CLI* and *la consola*, and write *zona de disponibilidad* in full the first time.",
          '**En resumen:** la cuenta, la región y la AZ responden al “dónde”; di *la CLI* y *la consola*, y escribe *zona de disponibilidad* sin abreviar la primera vez.',
        ),
      ),
    },
    {
      id: 'cards-where',
      kind: 'cards',
      title: both('Flashcards: where everything lives', 'Tarjetas: dónde vive todo'),
      minutes: 4,
      body: both(
        'Seven words for the map of AWS, both directions. Say the gender on the Spanish side: *la región*, *la AZ*, *la CLI*.',
        'Siete palabras para el mapa de AWS, en las dos direcciones. Di el género en el lado español: *la región*, *la AZ*, *la CLI*.',
      ),
      cards: cardsFor(WHERE),
    },

    // ---------- Lesson 2: compute ----------
    {
      id: 'compute',
      kind: 'read',
      title: both('Compute', 'Cómputo'),
      minutes: 6,
      body: join(
        both(
          "**Why first.** Compute (*cómputo* in Latin America; in Spain you'll often hear *computación* or *procesamiento*) is where your code runs, and where most of the bill comes from. And it's home to two confusing words: *instancia* and *escalar*.",
          '**Primero, el porqué.** El cómputo (*compute*; en España se oye más *computación* o *procesamiento*) es donde se ejecuta tu código, y de donde sale la mayor parte de la factura. Y ahí viven dos palabras que confunden a cualquiera: *instancia* y *escalar*.',
        ),
        both(
          "**Machines.** A **server** (*servidor*) is a computer that serves requests. A **virtual machine** (*máquina virtual*, *VM*) is a server made of software on top of a physical one. An EC2 **instance** is a virtual machine you rent by the second (for most Linux and Windows instances). In general Spanish, *instancia* is a formal written request (*presentar una instancia*, *a instancias de…*) or a court level (*primera instancia*), but in the cloud it is just the machine; teams say “levantar una instancia” for launching one.",
          '**Máquinas.** Un **servidor** (*server*) es una computadora que atiende solicitudes. Una **máquina virtual** (*virtual machine*, *VM*) es un servidor hecho de software sobre uno físico. Una **instancia** de EC2 (*instance*) es una máquina virtual que alquilas por segundos (en la mayoría de las instancias Linux y Windows). En el español general, *instancia* es una solicitud formal por escrito (*presentar una instancia*, *a instancias de…*) o un grado judicial (*primera instancia*), pero en la nube es solo la máquina; en los equipos se dice “levantar una instancia”.',
        ),
        both(
          "**No machines.** **Serverless** (*sin servidor*) means servers exist, but AWS runs them and you never patch them. A **Lambda function** (*función de Lambda*, *la Lambda*, feminine) runs your code for each event, for up to 30 minutes per invocation (older material may still say 15), and is billed by the millisecond. AWS's Spanish Lambda page calls it a *servicio de computación sin servidor*. A **managed service** (*servicio administrado*; *gestionado* in Spain) is one where AWS handles operations, like DynamoDB or RDS.",
          '**Sin máquinas.** **Sin servidor** (*serverless*) significa que los servidores existen, pero AWS los opera y tú nunca los parcheas. Una **función de Lambda** (*Lambda function*, *la Lambda*, en femenino) ejecuta tu código con cada evento, durante un máximo de 30 minutos por invocación (el material antiguo todavía puede decir 15), y se cobra por milisegundo. La página de Lambda en español de AWS la llama *servicio de computación sin servidor*. Un **servicio administrado** (*managed service*; *gestionado* en España) es uno en el que AWS se encarga de la operación, como DynamoDB o RDS.',
        ),
        both(
          "**The escalar trap.** **Scaling** a system is adding capacity: *scale out* is more instances (*escalado horizontal*), *scale up* is a bigger one (*escalado vertical*). AWS's Spanish docs write *escalado automático*, and keep *Auto Scaling* as the service name. But *escalar un problema* is to **escalate** it to someone senior. Like a hospital: you can add beds (scale) or call the senior doctor on call (escalate).",
          '**La trampa de escalar.** **Escalar** un sistema (*scaling*) es añadir capacidad: *scale out* es poner más instancias (*escalado horizontal*) y *scale up*, una más grande (*escalado vertical*). La documentación de AWS en español dice *escalado automático* y deja *Auto Scaling* como nombre del servicio. Pero *escalar un problema* es pasarlo a alguien con más autoridad (*escalate*). Como en un hospital: puedes añadir camas (scale) o llamar al jefe de guardia (escalate).',
        ),
        termTable(COMPUTE),
        traps(COMPUTE),
        both(
          "**In short:** an *instancia* is a virtual machine, not a formal request; *sin servidor* still has servers, just not yours; and when someone says *escalar*, check if they mean the system (scale) or the problem (escalate).",
          '**En resumen:** una *instancia* es una máquina virtual, no una solicitud formal; *sin servidor* sigue teniendo servidores, solo que no son tuyos; y cuando alguien diga *escalar*, comprueba si habla del sistema (scale) o del problema (escalate).',
        ),
      ),
    },
    {
      id: 'cards-compute',
      kind: 'cards',
      title: both('Flashcards: compute', 'Tarjetas: cómputo'),
      minutes: 4,
      body: both(
        'Eight words about where code runs. Watch the regional pair *administrado / gestionado*.',
        'Ocho palabras sobre dónde se ejecuta el código. Fíjate en el par regional *administrado / gestionado*.',
      ),
      cards: cardsFor(COMPUTE),
    },

    // ---------- Lesson 3: networking ----------
    {
      id: 'networking',
      kind: 'read',
      title: both('Networking', 'Red'),
      minutes: 6,
      body: join(
        both(
          "**Why first.** When something “can't connect”, the conversation turns into networking in seconds: which subnet, which security group, which port. Many of these words are acronyms, and in Spanish each acronym takes the gender of its main noun.",
          '**Primero, el porqué.** Cuando algo “no conecta”, la conversación pasa a la red en segundos: qué subred, qué grupo de seguridad, qué puerto. Muchas de estas palabras son siglas, y en español cada sigla toma el género de su sustantivo principal.',
        ),
        both(
          "**Your private network.** A **VPC** (*virtual private cloud*, *nube privada virtual*) is your own isolated network inside AWS: *la VPC*, feminine because of *nube*. Picture an office building. **Subnets** (*subredes*) are its floors, each in one AZ: public ones have a route to the internet through an internet gateway; private ones can't be reached from the internet. A **security group** (*grupo de seguridad*) is the guard at each door with a guest list: it only has *allow* rules, and it remembers who went out, so replies come back in. A **gateway** (*puerta de enlace*) is the building's exit: an internet gateway for public traffic, and a NAT gateway so private instances can go out without accepting connections from the internet. Spanish-speaking teams say *el gateway*, *el NAT*.",
          '**Tu red privada.** Una **VPC** (*virtual private cloud*, *nube privada virtual*) es tu propia red aislada dentro de AWS: *la VPC*, en femenino por *nube*. Imagina un edificio de oficinas. Las **subredes** (*subnets*) son sus pisos, cada uno en una AZ: las públicas tienen ruta a internet por una puerta de enlace de internet; a las privadas no se puede llegar desde internet. Un **grupo de seguridad** (*security group*) es el guardia de cada puerta con su lista de invitados: solo tiene reglas para *permitir*, y recuerda quién salió, así que las respuestas pueden volver a entrar. Una **puerta de enlace** (*gateway*) es la salida del edificio: una puerta de enlace de internet para el tráfico público y una puerta de enlace NAT para que las instancias privadas salgan a internet sin aceptar conexiones desde fuera. En el equipo se dice *el gateway* y *el NAT*.',
        ),
        both(
          "**Traffic from the outside.** A **load balancer** (*balanceador de carga*, *el ALB*) spreads requests across instances in several AZs, like a restaurant host seating guests at free tables. A **CDN** (*red de entrega de contenido*, *la CDN*) serves copies of your files from edge locations; in AWS that's CloudFront. **DNS** (*sistema de nombres de dominio*) turns a domain into an address; in Route 53 you create a **record** (*registro*) that points the domain at CloudFront or the load balancer. AWS's Spanish docs use *subredes*, *grupos de seguridad* and *balanceador de carga*.",
          '**El tráfico de fuera.** Un **balanceador de carga** (*load balancer*, *el ALB*) reparte las solicitudes entre instancias de varias AZ, como quien recibe en un restaurante y sienta a cada cliente en una mesa libre. Una **CDN** (*content delivery network*, *red de entrega de contenido*) sirve copias de tus archivos desde las ubicaciones de borde; en AWS es CloudFront. El **DNS** (*sistema de nombres de dominio*) convierte un dominio en una dirección; en Route 53 creas un **registro** (*record*) que apunta el dominio a CloudFront o al balanceador. La documentación de AWS en español usa *subredes*, *grupos de seguridad* y *balanceador de carga*.',
        ),
        termTable(NETWORK),
        traps(NETWORK),
        both(
          "**In short:** the VPC is the building, subnets are floors, the security group is the guard, the gateway is the exit; and it's *la VPC*, *la CDN*, *el DNS*.",
          '**En resumen:** la VPC es el edificio, las subredes son los pisos, el grupo de seguridad es el guardia y la puerta de enlace es la salida; y se dice *la VPC*, *la CDN*, *el DNS*.',
        ),
      ),
    },
    {
      id: 'cards-network',
      kind: 'cards',
      title: both('Flashcards: networking', 'Tarjetas: red'),
      minutes: 4,
      body: both(
        'Seven networking words. For each acronym, say its gender in Spanish: *la VPC*, *el SG*, *la CDN*, *el DNS*.',
        'Siete palabras de red. De cada sigla, di su género en español: *la VPC*, *el SG*, *la CDN*, *el DNS*.',
      ),
      cards: cardsFor(NETWORK),
    },

    // ---------- Lesson 4: storage and stacks ----------
    {
      id: 'storage-stacks',
      kind: 'read',
      title: both('Storage and stacks', 'Almacenamiento y pilas'),
      minutes: 6,
      body: join(
        both(
          "**Why first.** Storage words look easy to translate, and that's the trap: a dictionary gives you *cubo* for bucket. Nobody on a team says it, and a client who reads it in a proposal will wonder what you're selling.",
          '**Primero, el porqué.** Las palabras de almacenamiento parecen fáciles de traducir, y esa es la trampa: el diccionario te da *cubo* para bucket. Nadie en un equipo lo dice, y un cliente que lo lea en una propuesta se va a preguntar qué le estás vendiendo.',
        ),
        both(
          "**S3.** **Storage** (*almacenamiento*) in S3 is object storage. A **bucket** is the top-level container; Spanish keeps the English word, and AWS's Spanish S3 guide says *bucket de S3* and never *depósito* (and no team says *cubo*), and notes that buckets and objects are private by default. Each **object** (*objeto*) is a file plus its metadata, found by its **key** (*clave*), the full name such as `reports/2026/oct.pdf`. Think of a warehouse: the bucket is the building, each box has its full address written on it, and there are no real shelves, only addresses with slashes.",
          '**S3.** El **almacenamiento** (*storage*) de S3 es almacenamiento de objetos. Un **bucket** es el contenedor principal; en español se queda la palabra en inglés, y la guía de S3 en español de AWS dice *bucket de S3* y nunca *depósito* (y ningún equipo dice *cubo*), y explica que los buckets y los objetos son privados de forma predeterminada. Cada **objeto** (*object*) es un archivo con sus metadatos, que se encuentra por su **clave** (*key*), el nombre completo, como `reports/2026/oct.pdf`. Piensa en un almacén: el bucket es el edificio, cada caja lleva escrita su dirección completa, y no hay estanterías de verdad: solo direcciones con barras.',
        ),
        both(
          "**Stacks and permissions.** A **resource** (*recurso*) is anything you create: a bucket, a function, a table. A **stack** (*pila*) is a set of resources that CloudFormation or CDK creates, updates and deletes as one unit; AWS's Spanish docs say *pilas*, but teams say *el stack*. Careful: *stack* is also your tech stack. A **tag** (*etiqueta*) is a key-value label on a resource, such as `team=payments`. An **IAM role** (*rol de IAM*) is an identity that a person, an application or an AWS service (like a Lambda function) assumes to get temporary permissions, and a **policy** (*política*) is the JSON document that lists them. AWS's Spanish docs say *roles de IAM*.",
          '**Pilas y permisos.** Un **recurso** (*resource*) es cualquier cosa que creas: un bucket, una función, una tabla. Una **pila** (*stack*) es un conjunto de recursos que CloudFormation o CDK crea, actualiza y elimina como una sola unidad; la documentación de AWS en español dice *pilas*, pero en los equipos se dice *el stack*. Ojo: *stack* también es tu pila tecnológica. Una **etiqueta** (*tag*) es un par clave-valor en un recurso, como `team=payments`. Un **rol de IAM** (*IAM role*) es una identidad que asume una persona, una aplicación o un servicio de AWS (como una función de Lambda) para obtener permisos temporales, y una **política** (*policy*) es el documento JSON que los enumera. La documentación de AWS en español dice *roles de IAM*.',
        ),
        termTable(STORAGE),
        traps(STORAGE),
        both(
          "**In short:** *bucket de S3*, never *cubo*; *pila* in writing and *stack* out loud; *rol* with one *l*, and *política* here means policy, not politics.",
          '**En resumen:** *bucket de S3*, nunca *cubo*; *pila* por escrito y *stack* al hablar; *rol* con una sola *l*, y aquí *política* es policy, no politics.',
        ),
      ),
    },
    {
      id: 'cards-storage',
      kind: 'cards',
      title: both('Flashcards: storage and stacks', 'Tarjetas: almacenamiento y pilas'),
      minutes: 4,
      body: both(
        'Eight words for what you store and how you group it. The ⚠️ cards are the false friends.',
        'Ocho palabras sobre lo que guardas y cómo lo agrupas. Las tarjetas con ⚠️ son los falsos amigos.',
      ),
      cards: cardsFor(STORAGE),
    },

    // ---------- Lesson 5: costs and availability ----------
    {
      id: 'costs-availability',
      kind: 'read',
      title: both('Costs and availability', 'Costos y disponibilidad'),
      minutes: 7,
      body: join(
        both(
          "**Why first.** Sooner or later, someone outside the team asks two questions: “why does it cost this much?” and “what happens if it goes down?” Answering them well, in either language, builds trust.",
          '**Primero, el porqué.** Tarde o temprano, alguien de fuera del equipo hace dos preguntas: “¿por qué cuesta tanto?” y “¿qué pasa si se cae?”. Responderlas bien, en los dos idiomas, genera confianza.',
        ),
        both(
          "**How you pay.** **Pay-as-you-go** (*pago por uso*) means no upfront cost: **On-Demand** instances (*bajo demanda*) are billed by the second while they run (for most Linux and Windows instances). **Reserved Instances** (*instancias reservadas*) and Savings Plans trade a one- or three-year commitment for a discount. **Spot Instances** (*instancias de spot*) use spare capacity at a big discount, but AWS can take them back with a two-minute warning. Hotel analogy: a night at a time, a yearly lease, or a standby room. **Billing** (*facturación*) is where *la factura* lives; *costo* in Latin America, *coste* in Spain. A **quota** (*cuota*) caps how much you can use, or how fast you can call an API. Hit a rate quota and AWS starts rejecting requests: that's **throttling** (*limitación*), often with HTTP 429.",
          '**Cómo pagas.** **Pago por uso** (*pay-as-you-go*) significa sin costo inicial: las instancias **bajo demanda** (*On-Demand*) se cobran por segundo mientras están encendidas (en la mayoría de las instancias Linux y Windows). Las **instancias reservadas** (*Reserved Instances*) y los Savings Plans cambian un compromiso de uno o tres años por un descuento. Las **instancias de spot** (*Spot Instances*) usan capacidad sobrante con un gran descuento, pero AWS puede recuperarlas con dos minutos de aviso. Como un hotel: por noches, con contrato anual o una habitación en lista de espera. La **facturación** (*billing*) es donde vive *la factura*; *costo* en Latinoamérica, *coste* en España. Una **cuota** (*quota*) pone un tope a lo que puedes usar o a la velocidad con la que puedes llamar a una API. Al alcanzarla, AWS empieza a rechazar solicitudes: es la **limitación** (*throttling*), a menudo con un HTTP 429.',
        ),
        both(
          "**When things fail.** **Latency** (*latencia*) is how long one request takes; **throughput** is how many you handle per second. **High availability** (*alta disponibilidad*) keeps the service up, for example across two AZs. **Fault tolerance** (*tolerancia a fallos*) goes further: a failure causes no interruption at all. **Disaster recovery** (*recuperación ante desastres*, *DR*) is the plan to restore, often in another Region. The **shared responsibility model** (*modelo de responsabilidad compartida*): AWS secures the cloud itself, you secure what you put in it, like patching the OS of your EC2 instances. A **lift and shift** (*rehospedaje*) is a **migration** that moves servers to the cloud unchanged.",
          '**Cuando algo falla.** La **latencia** (*latency*) es cuánto tarda una solicitud; el **rendimiento** (*throughput*), cuántas atiendes por segundo. La **alta disponibilidad** (*high availability*) mantiene el servicio activo, por ejemplo en dos AZ. La **tolerancia a fallos** (*fault tolerance*) va más allá: un fallo no causa ninguna interrupción. La **recuperación ante desastres** (*disaster recovery*, *DR*) es el plan para restaurar, a menudo en otra región. El **modelo de responsabilidad compartida** (*shared responsibility model*): AWS protege la nube en sí y tú proteges lo que pones en ella, como parchear el sistema operativo de tus instancias EC2. Un **lift and shift** (*rehospedaje*) es una **migración** que lleva los servidores a la nube sin cambios.',
        ),
        termTable(COSTS),
        traps(COSTS),
        both(
          "**In short:** On-Demand is *bajo demanda* (never “under demand”), Spot can vanish with two minutes' notice, and *alta disponibilidad*, *tolerancia a fallos* and *recuperación ante desastres* are three different promises.",
          '**En resumen:** On-Demand es *bajo demanda* (nunca “under demand”), las spot pueden desaparecer con dos minutos de aviso, y *alta disponibilidad*, *tolerancia a fallos* y *recuperación ante desastres* son tres promesas distintas.',
        ),
      ),
    },
    {
      id: 'cards-costs',
      kind: 'cards',
      title: both('Flashcards: costs and availability', 'Tarjetas: costos y disponibilidad'),
      minutes: 5,
      body: both(
        "Ten words for money and uptime, the ones managers and clients use. Notice *costo* (Latin America) and *coste* (Spain): both are right.",
        'Diez palabras de dinero y disponibilidad, las que usan los managers y los clientes. Fíjate en *costo* (Latinoamérica) y *coste* (España): las dos son correctas.',
      ),
      cards: cardsFor(COSTS),
    },

    // ---------- Register ----------
    {
      id: 'register-cloud',
      kind: 'register',
      title: both('Formal, team or slang?', '¿Formal, equipo o jerga?'),
      minutes: 6,
      body: both(
        'Ten cloud phrases from real Slack channels, client emails, docs and meetings, in both languages. Decide where each one fits best.',
        'Diez frases sobre la nube sacadas de canales de Slack, correos a clientes, documentación y reuniones reales, en los dos idiomas. Decide dónde encaja mejor cada una.',
      ),
      items: [
        {
          text: 'Los buckets de S3 son privados de forma predeterminada; solo las identidades con permiso explícito, en una política de IAM o del bucket, pueden leer los objetos.',
          context: both('Security section of a client proposal', 'Sección de seguridad de una propuesta para un cliente'),
          answer: 'formal',
          explain: both(
            '*Bucket de S3*, *política* and *objeto* are the glossary\'s forms for a formal text, *identidades* is the precise word, and the sentence is complete and impersonal.',
            '*Bucket de S3*, *política* y *objeto* son las formas del glosario para un texto formal, *identidades* es la palabra precisa, y la frase es completa e impersonal.',
          ),
        },
        {
          text: '¿Quién levantó esa instancia en la cuenta de dev? Está prendida desde el viernes y ya se nota en la factura.',
          context: both('Team Slack channel', 'Canal de Slack del equipo'),
          answer: 'team',
          explain: both(
            '*Levantar una instancia*, *la cuenta de dev* and *la factura* are how teams talk. *Prendida* is Latin American; in Spain, *encendida*. In a report you\'d write *instancia en ejecución*.',
            '*Levantar una instancia*, *la cuenta de dev* y *la factura* es como se habla en los equipos. *Prendida* es de Latinoamérica; en España, *encendida*. En un informe escribirías *instancia en ejecución*.',
          ),
        },
        {
          text: 'nos están throttleando la lambda otra vez 😩 ¿alguien pidió el aumento?',
          context: both('Direct message during an incident', 'Mensaje directo durante un incidente'),
          answer: 'slang',
          explain: both(
            '*Nos están throttleando* and *la lambda* are the glossary\'s slang forms. Formally: *Lambda limitó las solicitudes al alcanzar la cuota de simultaneidad*.',
            '*Nos están throttleando* y *la lambda* son las formas de jerga del glosario. En formal: *Lambda limitó las solicitudes al alcanzar la cuota de simultaneidad*.',
          ),
        },
        {
          text: 'Under the shared responsibility model, the customer is responsible for patching the guest operating system on Amazon EC2 instances.',
          context: both('Security appendix of a contract', 'Anexo de seguridad de un contrato'),
          answer: 'formal',
          explain: both(
            'Full service names, *the customer*, and the complete term *shared responsibility model*: this is document English. In Spanish: *modelo de responsabilidad compartida*.',
            'Nombres completos de servicios, *the customer* y el término completo *shared responsibility model*: es inglés de documento. En español: *modelo de responsabilidad compartida*.',
          ),
        },
        {
          text: 'El balanceador de carga reparte el tráfico entre instancias ubicadas en dos zonas de disponibilidad, lo que proporciona alta disponibilidad al servicio.',
          context: both('Architecture document', 'Documento de arquitectura'),
          answer: 'formal',
          explain: both(
            '*Balanceador de carga*, *zonas de disponibilidad* and *alta disponibilidad*, written in full: the glossary\'s formal forms. With the team it would be *el ALB* and *dos AZ*.',
            '*Balanceador de carga*, *zonas de disponibilidad* y *alta disponibilidad*, escritos sin abreviar: las formas del glosario para un texto formal. Con el equipo sería *el ALB* y *dos AZ*.',
          ),
        },
        {
          text: 'Heads-up: I\'m requesting a quota increase for Lambda concurrency before Friday\'s launch. Shout if you need anything else raised.',
          context: both('Team Slack channel', 'Canal de Slack del equipo'),
          answer: 'team',
          explain: both(
            '*Heads-up* and *shout if…* are friendly team English, but the content is precise (*quota increase*, *Lambda concurrency*). Not slang, not a document.',
            '*Heads-up* y *shout if…* son inglés cercano de equipo, pero el contenido es preciso (*quota increase*, *Lambda concurrency*). Ni jerga ni documento.',
          ),
        },
        {
          text: 'Hay que taguear todo lo de prod antes del cierre de mes o finanzas nos mata 💀',
          context: both('Message in the team chat', 'Mensaje en el chat del equipo'),
          answer: 'slang',
          explain: both(
            '*Taguear* is the glossary\'s slang for tagging, and *nos mata* adds to it. In a document: *etiquetar los recursos de producción*.',
            '*Taguear* es la forma de jerga del glosario para tag, y *nos mata* lo refuerza. En un documento: *etiquetar los recursos de producción*.',
          ),
        },
        {
          text: 'Pasamos el backend a serverless y el stack ya está desplegado en la cuenta de prod.',
          context: both('Update in the daily stand-up', 'Actualización en la daily'),
          answer: 'team',
          explain: both(
            '*Serverless* and *el stack* are how teams say *sin servidor* and *pila*. Clear and accurate for colleagues; a client document would use the Spanish forms.',
            '*Serverless* y *el stack* es como dicen los equipos *sin servidor* y *pila*. Claro y correcto entre colegas; un documento para un cliente usaría las formas en español.',
          ),
        },
        {
          text: '¿Le subimos el tamaño a la VM o escalamos en horizontal con otra máquina detrás del ALB?',
          context: both('Architecture discussion in a meeting', 'Discusión de arquitectura en una reunión'),
          answer: 'team',
          explain: both(
            '*La VM* and *el ALB* are the team forms, and the question is a precise technical choice. Formally: *¿Aumentamos el tamaño de la máquina virtual (escalado vertical) o añadimos otra instancia detrás del balanceador de carga (escalado horizontal)?*',
            '*La VM* y *el ALB* son las formas de equipo, y la pregunta es una decisión técnica precisa. En formal: *¿Aumentamos el tamaño de la máquina virtual (escalado vertical) o añadimos otra instancia detrás del balanceador de carga (escalado horizontal)?*',
          ),
        },
        {
          text: 'lol the bill went brrr, someone left a NAT gateway running in dev 💸',
          context: both('Direct message to a teammate', 'Mensaje directo a un compañero'),
          answer: 'slang',
          explain: both(
            '*Lol* and *went brrr* are internet slang. To your manager: *The bill increased because a NAT gateway was left running in the dev account.*',
            '*Lol* y *went brrr* son jerga de internet. A tu manager: *The bill increased because a NAT gateway was left running in the dev account.*',
          ),
        },
      ],
    },

    // ---------- Writing ----------
    {
      id: 'client-architecture',
      kind: 'rewrite',
      title: both('Describe the architecture to a client', 'Describe la arquitectura a un cliente'),
      minutes: 10,
      target: 'es',
      source: `Architecture notes (customer portal, phase 1):
- Static site (React build) in a private S3 bucket, served through CloudFront, our CDN, from edge locations close to users.
- API: Lambda functions behind API Gateway. Serverless: no servers or instances to patch; it scales automatically with traffic.
- Data in DynamoDB, a managed service; data is replicated across multiple AZs in the Region.
- Each Lambda function gets its own IAM role with a least-privilege policy.
- All infrastructure is one CDK stack; every resource is tagged with project and cost center.
- Pay-as-you-go: cost grows with traffic, no upfront cost.`,
      task: both(
        'Sra. Ramírez reads Spanish and will forward your text to her board. Write her a short, formal summary of the architecture in Spanish (use *usted*), from the English notes. Use the forms AWS\'s Spanish docs use: *bucket de S3* (never *cubo* or *depósito*), *sin servidor*, *zonas de disponibilidad*, *rol de IAM* and *pila*; write *política* for policy; and keep product names (CloudFront, Lambda, DynamoDB) as they are.',
        'La Sra. Ramírez lee en español y va a reenviar tu texto a su junta directiva. Escríbele un resumen breve y formal de la arquitectura en español (trátala de *usted*), a partir de las notas en inglés. Usa las formas de la documentación de AWS en español: *bucket de S3* (nunca *cubo* ni *depósito*), *sin servidor*, *zonas de disponibilidad*, *rol de IAM* y *pila*; escribe *política* para policy, y deja los nombres de producto (CloudFront, Lambda, DynamoDB) como están.',
      ),
      minWords: 70,
      mustUse: [
        { any: ['bucket*'], label: 'bucket de S3' },
        { any: ['red de entrega*', 'red de distribucion*', 'cdn'], label: 'red de entrega de contenido (CDN)' },
        { any: ['sin servidor*'], label: 'sin servidor' },
        { any: ['funcion de lambda', 'funciones de lambda', 'funcion lambda', 'funciones lambda', 'funcion de aws lambda', 'funciones de aws lambda', 'aws lambda'], label: 'funciones de Lambda' },
        { any: ['zona de disponibilidad', 'zonas de disponibilidad'], label: 'zonas de disponibilidad' },
        { any: ['administrad*', 'gestionad*'], label: 'servicio administrado' },
        { any: ['rol', 'roles'], label: 'rol de IAM' },
        { any: ['politica*'], label: 'política' },
        { any: ['pila*', 'stack*'], label: 'pila' },
        { any: ['etiquet*'], label: 'etiquetas' },
        {
          any: [
            'por uso', 'segun el uso', 'en funcion del uso', 'bajo demanda',
            'por consumo', 'segun consumo', 'segun el consumo',
            'pagas por lo que', 'paga por lo que', 'pagan por lo que', 'pagar por lo que', 'pagara por lo que',
            'paga solo por', 'pagar solo por', 'pagara solo por', 'paga unicamente por', 'pagara unicamente por',
            'por lo que se usa', 'por lo que se utiliza', 'por lo que usa', 'por lo que utiliza',
          ],
          label: 'pago por uso',
        },
      ],
      avoid: [
        { any: ['cubo*', 'balde*'], why: both('Nobody calls a bucket a *cubo* or *balde*, and AWS\'s Spanish S3 guide says *bucket de S3*.', 'Nadie llama *cubo* ni *balde* a un bucket, y la guía de S3 en español de AWS dice *bucket de S3*.') },
        { any: ['deposito*'], why: both('AWS\'s Spanish S3 guide never says *depósito*: write *bucket de S3*.', 'La guía de S3 en español de AWS nunca dice *depósito*: escribe *bucket de S3*.') },
        { any: ['taguea*', 'tagea*'], why: both('*Taguear* is slang. In a document for a client, write *etiquetar* or *etiquetas*.', '*Taguear* es jerga. En un documento para un cliente, escribe *etiquetar* o *etiquetas*.') },
        { any: ['server'], why: both('*Server* is slang in Spanish. In a formal text, write *servidor*.', '*Server* es jerga en español. En un texto formal, escribe *servidor*.') },
        { any: ['managed service', 'upfront', 'least privilege', 'least-privilege', 'edge location*'], why: both('This is a formal Spanish text: translate it (servicio administrado, sin pagos iniciales, privilegios mínimos, ubicaciones de borde).', 'Es un texto formal en español: tradúcelo (servicio administrado, sin pagos iniciales, privilegios mínimos, ubicaciones de borde).') },
      ],
      model: 'Estimada Sra. Ramírez:\n\nLe resumo la arquitectura propuesta para la primera fase del portal de clientes. El sitio web estático se almacena en un bucket de S3 privado y se distribuye con Amazon CloudFront, la red de entrega de contenido (CDN) de AWS, desde ubicaciones de borde cercanas a sus usuarios. La API funciona con funciones de Lambda detrás de Amazon API Gateway: es una arquitectura sin servidor, por lo que no hay servidores ni instancias que mantener, y la capacidad se ajusta automáticamente al tráfico. Los datos se guardan en Amazon DynamoDB, un servicio administrado que replica la información en varias zonas de disponibilidad de la región. Cada función de Lambda tiene su propio rol de IAM con una política de privilegios mínimos. Toda la infraestructura se define en una sola pila de AWS CDK, y cada recurso lleva etiquetas de proyecto y de centro de costos. El modelo es de pago por uso: el costo crece con el tráfico y no hay pagos iniciales.\n\nQuedo a su disposición para cualquier consulta.\n\nAtentamente,',
    },
    {
      id: 'bill-explanation',
      kind: 'rewrite',
      title: both('Explain the AWS bill in English', 'Explica la factura de AWS en inglés'),
      minutes: 8,
      target: 'en',
      source: `Notas sobre la factura de octubre (subió un 38 %):
- 6 instancias EC2 bajo demanda que se levantaron para la prueba de carga y nadie apagó (siguen prendidas en la cuenta de dev)
- la transferencia de datos de salida a internet se triplicó: el nuevo video del onboarding se sirve directo desde el bucket, sin CloudFront
- un NAT gateway en dev que procesa todo el tráfico de las instancias privadas (se cobra por hora y por GB)
- no podemos saber qué equipo gastó qué: la mitad de los recursos no tienen etiquetas
- propuesta: terminar las instancias, servir el video por CloudFront, etiquetas obligatorias y activarlas como etiquetas de asignación de costos, alerta en AWS Budgets, evaluar Savings Plans o instancias reservadas para la carga estable`,
      task: both(
        'Karen asked: “Why did this go up 38%?” Turn your Spanish notes into a short, clear answer in English: the causes (the On-Demand instances, data transfer, the NAT gateway), why you can\'t split the bill by team (the missing tags), and your plan. Watch the calques: *bajo demanda* is *On-Demand* (never “under demand”), *etiquetas* are *tags*, and *facturación* is *billing*.',
        'Karen preguntó: “Why did this go up 38%?”. Convierte tus notas en español en una respuesta corta y clara en inglés: las causas (las instancias bajo demanda, la transferencia de datos, el NAT gateway), por qué no puedes repartir la factura por equipo (las etiquetas que faltan) y tu plan. Cuidado con los calcos: *bajo demanda* es *On-Demand* (nunca “under demand”), las *etiquetas* son *tags* y la *facturación* es *billing*.',
      ),
      minWords: 60,
      mustUse: [
        { any: ['on-demand', 'on demand', 'pay-as-you-go', 'pay as you go'], label: 'On-Demand' },
        { any: ['instance*', 'ec2'], label: 'instances' },
        { any: ['data transfer*', 'egress', 'outbound', 'transfer out', 'data out', 'outgoing', 'bandwidth', 'internet traffic'], label: 'data transfer' },
        { any: ['cloudfront', 'cdn'], label: 'CloudFront' },
        { any: ['tag*'], label: 'tags' },
        { any: ['bill*', 'cost*', 'spend*', 'invoice*'], label: 'bill / cost' },
        { any: ['budget*', 'alert*', 'alarm*'], label: 'budget alert' },
        { any: ['reserved', 'savings plan*', 'commit*', 'ri', 'ris'], label: 'Reserved Instances / Savings Plans' },
      ],
      avoid: [
        { any: ['under demand'], why: both('*Bajo demanda* is *On-Demand* in English. “Under demand” means something else.', '*Bajo demanda* es *On-Demand* en inglés. “Under demand” significa otra cosa.') },
        { any: ['etiquet*'], why: both('In English, AWS calls them *tags*.', 'En inglés, AWS las llama *tags*.') },
        { any: ['facturation*'], why: both('*Facturación* is *billing* in English; *facturation* isn\'t used.', '*Facturación* es *billing* en inglés; *facturation* no se usa.') },
      ],
      model: 'Hi Karen, here is why our October AWS bill went up about 38%. First, six On-Demand EC2 instances we launched for the load test were never stopped, and they are still running in the dev account. Second, data transfer out to the internet tripled: the new onboarding video is served straight from the S3 bucket instead of through CloudFront. Third, a NAT gateway in dev processes all the traffic from the private instances, and it is billed per hour and per GB. We also can\'t tell which team spent what, because half of our resources have no tags. Our plan: terminate the idle instances, serve the video through CloudFront, make tags mandatory and activate them as cost allocation tags, set up a budget alert in AWS Budgets, and look at Savings Plans or Reserved Instances for the steady workload.',
    },

    // ---------- Quiz ----------
    {
      id: 'quiz-cloud',
      kind: 'quiz',
      title: both('Check yourself', 'Compruébalo'),
      minutes: 6,
      questions: [
        {
          q: both(
            'In a formal Spanish proposal, how do you write “S3 bucket”?',
            'En una propuesta formal en español, ¿cómo escribes “S3 bucket”?',
          ),
          options: ['cubo de S3', 'depósito de S3', 'bucket de S3', 'balde de S3'],
          answer: 2,
          explain: both(
            'AWS\'s Spanish S3 guide says *bucket de S3* and never *depósito*, and nobody at work says *cubo*. Those docs are machine-translated, but here they match what every team says.',
            'La guía de S3 en español de AWS dice *bucket de S3* y nunca *depósito*, y en el trabajo nadie dice *cubo*. Esa documentación es una traducción automática, pero aquí coincide con lo que dicen todos los equipos.',
          ),
        },
        {
          q: both(
            'A Spanish-speaking teammate writes: “Levanté una instancia nueva en la otra AZ.” What did they do?',
            'Un compañero escribe: “Levanté una instancia nueva en la otra AZ”. ¿Qué hizo?',
          ),
          options: [
            both('Filed a formal request with another team', 'Presentó una solicitud formal ante otro equipo'),
            both('Launched a new EC2 instance in another Availability Zone', 'Lanzó una nueva instancia EC2 en otra zona de disponibilidad'),
            both('Moved the application to another Region', 'Movió la aplicación a otra región'),
            both('Raised a quota in another account', 'Subió una cuota en otra cuenta'),
          ],
          answer: 1,
          explain: both(
            '*Levantar una instancia* is launching a virtual machine. *Instancia* as a formal request is general Spanish, not cloud Spanish. An AZ is a zone inside the same Region, not another Region.',
            '*Levantar una instancia* es lanzar una máquina virtual. *Instancia* como solicitud formal es del español general, no del de la nube. Una AZ es una zona dentro de la misma región, no otra región.',
          ),
        },
        {
          q: both(
            'Since the outage, your AWS support case hasn\'t moved. Your manager says: “Si mañana sigue igual, lo escalo.” What will she do?',
            'Desde la caída, el caso de soporte con AWS no avanza. Tu manager dice: “Si mañana sigue igual, lo escalo”. ¿Qué hará?',
          ),
          options: [
            both('Add more instances behind the load balancer', 'Añadir más instancias detrás del balanceador de carga'),
            both('Raise the Lambda concurrency quota', 'Subir la cuota de simultaneidad de Lambda'),
            both('Close the case and open a new one', 'Cerrar el caso y abrir otro'),
            both('Escalate the case to someone with more authority', 'Pasar el caso a alguien con más autoridad'),
          ],
          answer: 3,
          explain: both(
            '*Escalar* a problem is to escalate it. *Escalar* a system is to scale it (out: more instances; up: a bigger one). Here *lo* is the stuck support case, a problem, so it\'s escalate. When in doubt, ask.',
            '*Escalar* un problema es pasarlo más arriba (escalate). *Escalar* un sistema es añadir capacidad (scale: horizontal, más instancias; vertical, una más grande). Aquí *lo* es el caso de soporte atascado, un problema, así que es escalate. Si dudas, pregunta.',
          ),
        },
        {
          q: both(
            'The team wants to run the nightly batch on Spot Instances to save money. What must the job be able to handle?',
            'El equipo quiere ejecutar el proceso nocturno en instancias de spot para ahorrar. ¿Qué tiene que soportar el proceso?',
          ),
          options: [
            both('Being interrupted with a two-minute warning', 'Que lo interrumpan con dos minutos de aviso'),
            both('A one-year commitment', 'Un compromiso de un año'),
            both('Running for no more than 30 minutes', 'No durar más de 30 minutos'),
            both('Having no IAM role', 'No tener rol de IAM'),
          ],
          answer: 0,
          explain: both(
            'Spot Instances use spare capacity at a big discount, and AWS can reclaim them with a two-minute notice. The one-year commitment is Reserved Instances or Savings Plans; the 30-minute limit is Lambda\'s (it used to be 15).',
            'Las instancias de spot usan capacidad sobrante con un gran descuento, y AWS puede recuperarlas con dos minutos de aviso. El compromiso de un año es de las instancias reservadas o los Savings Plans; el límite de 30 minutos es de Lambda (antes era de 15).',
          ),
        },
        {
          q: both(
            'Under the shared responsibility model, who patches the operating system of an EC2 instance?',
            'Según el modelo de responsabilidad compartida, ¿quién parchea el sistema operativo de una instancia EC2?',
          ),
          options: [
            both('AWS', 'AWS'),
            both('Nobody: EC2 is serverless', 'Nadie: EC2 es sin servidor'),
            both('You, the customer', 'Tú, el cliente'),
            both('Whoever owns the VPC', 'Quien sea dueño de la VPC'),
          ],
          answer: 2,
          explain: both(
            'AWS secures the cloud itself (hardware, facilities, the virtualization layer); you secure what runs in it, including the guest OS on EC2. With Lambda, a managed service, AWS patches the underlying OS for you.',
            'AWS protege la nube en sí (hardware, instalaciones, la capa de virtualización); tú proteges lo que se ejecuta en ella, incluido el sistema operativo de EC2. Con Lambda, un servicio administrado, AWS parchea el sistema operativo subyacente por ti.',
          ),
        },
        {
          q: both(
            'In the team chat: “Abre el 443 en el SG del ALB.” What do they want?',
            'En el chat del equipo: “Abre el 443 en el SG del ALB”. ¿Qué piden?',
          ),
          options: [
            both('A new public subnet for the load balancer, so port 443 can reach the internet', 'Una subred pública nueva para el balanceador de carga, para que el puerto 443 llegue a internet'),
            both('An inbound rule allowing port 443 in the load balancer\'s security group', 'Una regla de entrada que permita el puerto 443 en el grupo de seguridad del balanceador de carga'),
            both('A DNS record pointing to the load balancer', 'Un registro DNS que apunte al balanceador de carga'),
            both('A NAT gateway for port 443', 'Una puerta de enlace NAT para el puerto 443'),
          ],
          answer: 1,
          explain: both(
            '*El SG* is slang for the security group (*grupo de seguridad*, the form AWS\'s Spanish docs use), and *el ALB* is the Application Load Balancer. Security groups only have allow rules, so “opening” 443 means adding an inbound rule for HTTPS.',
            '*El SG* es la forma de jerga para el grupo de seguridad (la forma que usa la documentación de AWS en español), y *el ALB* es el Application Load Balancer. Los grupos de seguridad solo tienen reglas para permitir, así que “abrir” el 443 es añadir una regla de entrada para HTTPS.',
          ),
        },
        {
          q: both(
            'Your plan says the app must be restored in another Region if the whole Region fails. Which term names that plan?',
            'Tu plan dice que la aplicación debe restaurarse en otra región si falla la región entera. ¿Qué término nombra ese plan?',
          ),
          options: [
            both('High availability (alta disponibilidad)', 'Alta disponibilidad (high availability)'),
            both('Lift and shift (rehospedaje)', 'Rehospedaje (lift and shift)'),
            both('Throttling (limitación)', 'Limitación (throttling)'),
            both('Disaster recovery (recuperación ante desastres)', 'Recuperación ante desastres (disaster recovery)'),
          ],
          answer: 3,
          explain: both(
            'Restoring after a disaster, often in another Region, is disaster recovery (DR). High availability keeps the service up through smaller failures, such as one AZ going down. Lift and shift is a migration; throttling is a quota at work.',
            'Restaurar después de un desastre, a menudo en otra región, es la recuperación ante desastres (DR). La alta disponibilidad mantiene el servicio ante fallos más pequeños, como la caída de una AZ. El rehospedaje es una migración; la limitación es una cuota en acción.',
          ),
        },
        {
          q: both(
            'You\'re writing the formal incident report in Spanish. How do you say what the team called “nos están throttleando la lambda”?',
            'Estás escribiendo el informe formal del incidente en español. ¿Cómo dices lo que el equipo llamó “nos están throttleando la lambda”?',
          ),
          options: [
            'Nos throttlearon la lambda.',
            'La función de Lambda dejó de funcionar por un fallo de AWS en la región.',
            'Lambda limitó las solicitudes al alcanzar la cuota de simultaneidad.',
            'Lambda canceló la cuenta por exceso de uso.',
          ],
          answer: 2,
          explain: both(
            'The glossary\'s formal forms are *cuota* and *limitación*: Lambda rejects synchronous requests (with HTTP 429) once you reach your concurrency quota (asynchronous events are retried), and you can ask for an increase. *Throttlear* is slang, and blaming AWS or a cancelled account is simply wrong.',
            'Las formas del glosario para un texto formal son *cuota* y *limitación*: Lambda rechaza las solicitudes síncronas (con un HTTP 429) cuando alcanzas tu cuota de simultaneidad (los eventos asíncronos se reintentan), y puedes pedir un aumento. *Throttlear* es jerga, y culpar a AWS o hablar de una cuenta cancelada es simplemente incorrecto.',
          ),
        },
      ],
    },
  ],
};

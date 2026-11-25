// Sources read on 2026-11-25, and the notes that cite them.
//
// AWS Spanish docs are machine-translated (the pages say so, and that the
// English version wins in a conflict), so they show what AWS uses, not a
// standard. A NOTE's `pending` lists what still has to be checked against
// Fundéu, the RAE or Microsoft: those sites were unreachable from the session
// that built this. Until a pending item is checked, the glossary presents it
// as common usage, never as an "official" recommendation.

const checked = '2026-11-25';

export const SOURCES = {
  'aws-s3': { title: 'Amazon S3 — Guía del usuario (es_es)', url: 'https://docs.aws.amazon.com/es_es/AmazonS3/latest/userguide/Welcome.html', quote: 'De forma predeterminada, los buckets y los objetos de S3 son privados', checked },
  'aws-az': { title: 'Regiones y zonas de disponibilidad — Amazon EC2 (es_es)', url: 'https://docs.aws.amazon.com/es_es/AWSEC2/latest/UserGuide/using-regions-availability-zones.html', quote: 'Regiones de AWS, zonas de disponibilidad, locales AWS Outposts y de Wavelength', checked },
  'aws-elb': { title: '¿Qué es Elastic Load Balancing? (es_es)', url: 'https://docs.aws.amazon.com/es_es/elasticloadbalancing/latest/userguide/what-is-load-balancing.html', quote: 'Puede configurar su balanceador de carga para enrutar el tráfico', checked },
  'aws-lambda': { title: '¿Qué es AWS Lambda? (es_es)', url: 'https://docs.aws.amazon.com/es_es/lambda/latest/dg/welcome.html', quote: 'AWS Lambda es un servicio de computación sin servidor.', checked },
  'aws-autoscaling': { title: '¿Qué es Amazon EC2 Auto Scaling? (es_es)', url: 'https://docs.aws.amazon.com/es_es/autoscaling/ec2/userguide/what-is-amazon-ec2-auto-scaling.html', quote: 'el número mínimo de instancias en cada grupo de escalado automático', checked },
  'aws-iam-roles': { title: 'Roles de IAM (es_es)', url: 'https://docs.aws.amazon.com/es_es/IAM/latest/UserGuide/id_roles.html', quote: 'Roles de IAM - AWS Identity and Access Management', checked },
  'aws-sg': { title: 'Grupos de seguridad — Amazon VPC (es_es)', url: 'https://docs.aws.amazon.com/es_es/vpc/latest/userguide/vpc-security-groups.html', quote: 'Controlar el tráfico hacia los recursos de AWS mediante grupos de seguridad', checked },
  'aws-subnets': { title: 'Subredes para la VPC (es_es)', url: 'https://docs.aws.amazon.com/es_es/vpc/latest/userguide/configure-subnets.html', quote: 'Subredes para la VPC', checked },
  'aws-ddb-core': { title: 'Componentes principales de DynamoDB (es_es)', url: 'https://docs.aws.amazon.com/es_es/amazondynamodb/latest/developerguide/HowItWorks.CoreComponents.html', quote: 'El primer atributo es la clave de partición y el segundo, la clave de ordenación.', checked },
  'aws-ddb-gsi': { title: 'Índices secundarios globales — DynamoDB (es_es)', url: 'https://docs.aws.amazon.com/es_es/amazondynamodb/latest/developerguide/GSI.html', quote: 'Uso de índices secundarios globales en DynamoDB', checked },
  'aws-cfn-stacks': { title: 'Pilas de CloudFormation (es_es)', url: 'https://docs.aws.amazon.com/es_es/AWSCloudFormation/latest/UserGuide/stacks.html', quote: 'Administrar los recursos de AWS como una sola unidad con pilas CloudFormation', checked },
  'aws-codedeploy': { title: '¿Qué es CodeDeploy? (es_es)', url: 'https://docs.aws.amazon.com/es_es/codedeploy/latest/userguide/welcome.html', quote: 'CodeDeploy es un servicio de implementación que automatiza las implementaciones de aplicaciones', checked },
  'aws-codedeploy-deployments': { title: 'Trabajar con despliegues en CodeDeploy (es_es)', url: 'https://docs.aws.amazon.com/es_es/codedeploy/latest/userguide/deployments.html', quote: 'Trabajar con despliegues en CodeDeploy', checked },
  'github-glossary-2022': { title: 'GitHub Docs — glosario en español (copia de 2022 en el repo github/docs)', url: 'https://raw.githubusercontent.com/github/docs/0b15d0d2368e8fae73c98a7db6699e410c2f32ec/translations/es-ES/data/glossaries/external.yml', quote: 'Subir significa enviar tus cambios confirmados a un repositorio remoto en GitHub.com.', checked },
  'vscode-git-es': { title: 'VS Code, paquete de idioma español — comandos de Git', url: 'https://raw.githubusercontent.com/microsoft/vscode-loc/main/i18n/vscode-language-pack-es/translations/extensions/vscode.git.i18n.json', quote: 'push → "Insertar"; pull → "Incorporar cambios ("pull")"; merge → "Combinar..."', checked },
  'git-es-po': { title: 'Traducción oficial de Git al español (po/es.po)', url: 'https://raw.githubusercontent.com/git/git/master/po/es.po', quote: 'nada para hacer commit, el árbol de trabajo está limpio', checked },
};

// Keys used by `note` in glossary.source.mjs.
export const NOTES = {
  'deploy': { sources: ['aws-codedeploy', 'aws-codedeploy-deployments'], text: 'AWS en español usa sobre todo "implementación", pero también "despliegue", a veces en la misma página. Las dos son correctas: elige una y sé coherente en todo el documento.', pending: 'Fundéu: si tiene recomendación sobre "deploy".' },
  'git-ui': { sources: ['github-glossary-2022', 'vscode-git-es', 'git-es-po'], text: 'No hay una traducción única. GitHub (glosario de 2022): "subir", "fusionar", "confirmación", "solicitud de cambios", "bifurcación". VS Code: "Insertar", "Combinar", "Incorporar cambios" y deja "Commit". La traducción de Git deja "commit", "pull" y "merge" en inglés ("hacer commit", "hacer pull").', pending: 'docs.github.com/es actual, que puede usar otra forma para "pull request".' },
  'aws-terms': { sources: ['aws-az', 'aws-elb', 'aws-lambda', 'aws-autoscaling', 'aws-iam-roles', 'aws-sg', 'aws-subnets', 'aws-ddb-core', 'aws-ddb-gsi', 'aws-cfn-stacks'], text: 'Forma que usa la documentación de AWS en español (traducción automática: en caso de duda manda la versión en inglés). "Auto Scaling" queda en inglés como nombre del servicio; el concepto es "escalado automático".' },
  'aws-sortkey': { sources: ['aws-ddb-core'], text: 'AWS no es coherente: la misma página dice "clave de ordenación" y "clave de clasificación".' },
  'aws-bucket': { sources: ['aws-s3'], text: 'La guía de S3 en español dice "bucket(s) de S3" y nunca "depósito".' },
  'aws-endpoint': { sources: [], text: 'En documentación traducida aparece "punto de conexión"; al hablar, todo el mundo dice "endpoint".', pending: 'Confirmar el término en la documentación de AWS y Microsoft en español.' },
  'ms-pipeline': { sources: [], text: '"Canalización" aparece en documentación traducida; al hablar se dice "pipeline".', pending: 'Guía de estilo y terminología de Microsoft.' },
  'fundeu-bug': { sources: [], text: '"Error" o "fallo" en un documento; "bug" al hablar.', pending: 'Fundéu sobre "bug".' },
  'framework': { sources: [], text: '"Marco de trabajo" existe, pero casi nadie lo dice; en un documento, "framework" con la traducción al lado la primera vez.', pending: 'Fundéu sobre "framework".' },
  'library': { sources: [], text: '"Library" = biblioteca. "Librería" es la tienda de libros, pero el calco está muy extendido entre programadores.', pending: 'DLE: acepciones de "librería" y "biblioteca".' },
  'cloud': { sources: ['aws-lambda'], text: '"La nube" y "computación en la nube" son lo normal; AWS en español dice "servicio de computación".', pending: 'Fundéu sobre "nube" y "cloud computing".' },
  'backup': { sources: [], text: '"Copia de seguridad" en un documento; "backup" o "respaldo" al hablar.', pending: 'Fundéu sobre "backup".' },
  'bigdata': { sources: [], text: '"Macrodatos" es la alternativa en español; en la oficina se dice "big data".', pending: 'Fundéu sobre "big data".' },
  'ml': { sources: [], text: '"Aprendizaje automático" es la forma habitual por escrito.', pending: 'Fundéu sobre "machine learning".' },
  'token': { sources: [], text: '"Token" se deja en inglés en la práctica.', pending: 'Fundéu y Microsoft sobre "token".' },
  'encrypt': { sources: [], text: '"Cifrar" es la forma más cuidada por escrito; "encriptar" está muy extendido al hablar.', pending: 'Fundéu y DLE sobre "encriptar".' },
  'phishing': { sources: [], text: 'Se usa "phishing", con una explicación al lado la primera vez.', pending: 'Fundéu sobre "phishing".' },
  'hacker': { sources: [], text: '"Hackear" y "hacker" están muy extendidos.', pending: 'DLE y Fundéu sobre "hacker", "hackear" y "jaquear".' },
  'deadline': { sources: [], text: '"Fecha límite" o "plazo" en un documento.', pending: 'Fundéu sobre "deadline".' },
  'feedback': { sources: [], text: '"Comentarios", "opiniones" o "retroalimentación" por escrito; "feedback" al hablar.', pending: 'Fundéu sobre "feedback".' },
  'false-friends': { sources: [], text: '"Eventualmente" no significa "al final"; "actualmente" significa "ahora".', pending: 'RAE, Diccionario panhispánico de dudas: entrada "eventual".' },
};

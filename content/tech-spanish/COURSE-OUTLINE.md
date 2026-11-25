# Tech Spanish ↔ Tech English — temario del curso

> Un curso, dos puertas de entrada: hispanohablantes que trabajan en tecnología y quieren sonar naturales en inglés, y profesionales que aprendieron la tecnología en inglés y quieren trabajar en español (el caso de Nico). Cada lección usa los términos de `glossary.json`, así que el curso, las tarjetas y el glosario nunca se separan.

**Formato de cada lección:** lectura corta (el porqué) → tarjetas en las dos direcciones → ejercicio "¿formal, equipo o jerga?" → una situación real para resolver (un mensaje de Slack, un correo, un comentario de PR) → quiz.

**Duración estimada:** ~8 horas. Módulo 0 y Módulo 1 gratis, como los otros cursos.

## Módulo 0 · Empieza aquí (gratis)
1. **Por qué el español técnico mezcla inglés.** Vocabulario que nace en inglés, traducciones que no coinciden (push = subir / insertar / hacer push), el sufijo `-ear` y el género prestado (*la* API, *la* VPC, *la* Lambda).
2. **Los tres registros.** Documento formal, conversación con el equipo, jerga. Cómo elegir y cómo mantener una sola forma en un documento.
3. **España y Latinoamérica sin miedo.** *Ordenador / computadora*, *entorno / ambiente*, *monitorizar / monitorear*, *coste / costo*, decimales con coma o con punto. Qué cambia y qué no importa.

## Módulo 1 · Git y el día a día del desarrollo (gratis)
1. **Del commit a la PR.** commit, branch, merge, push, pull, pull request, fork. Escribir un mensaje de commit y la descripción de una PR en los dos idiomas.
2. **Bugs, fixes y rollbacks.** bug, debug, fix, hotfix, patch, revert, rollback. Situación: contarle al equipo qué se rompió y cómo se arregló.
3. **Versiones y trabajo pendiente.** release, backlog, sprint, feature, requirement, roadmap, MVP, deuda técnica.

## Módulo 2 · Hablar de código
1. **Tipos y estructuras.** string, array, list, integer, boolean, object, class (y la trampa de *matriz*).
2. **Funciones y flujo.** function, method, parameter / argument, return, loop, exception (y *cachear* = catch o cache).
3. **El ecosistema.** framework, library (falso amigo: *librería*), dependency, package, SDK, API, endpoint, runtime.
4. **Asíncrono en voz alta.** callback, promise, async; leer código en voz alta en una revisión.

## Módulo 3 · DevOps y CI/CD
1. **El pipeline.** CI, CD, build, artifact, staging, producción, entornos (*entorno / ambiente*).
2. **Contenedores e infraestructura como código.** container, image, cluster, orchestration, IaC, *aprovisionar / provisionar*.
3. **Lanzar sin miedo.** rollout, blue/green, canary, feature flag.
4. **Cuando algo se cae.** on-call, incident vs *incidencia*, outage, alert, logs (*loguear* vs *loguearse*), postmortem, SLA. Situación: escribir el aviso de un incidente en Slack.

## Módulo 4 · Nube y AWS
1. **Dónde vive todo.** region, Availability Zone, edge location, account, console, CLI.
2. **Cómputo.** instance (falso amigo: *instancia*), VM, server, serverless, Lambda function, scaling (*escalar* un problema vs *escalar* un sistema).
3. **Red.** VPC, subnet, security group, gateway, load balancer, CDN, DNS.
4. **Almacenamiento y pilas.** bucket (nunca "cubo"), objeto y clave, stack / *pila*, resource, tag.
5. **Costos y disponibilidad.** pay-as-you-go, Reserved / Spot, billing, quota y throttling, alta disponibilidad, tolerancia a fallos, recuperación ante desastres, responsabilidad compartida.

## Módulo 5 · Datos
1. **Bases de datos.** database, table, row / column, query, primary key, schema, transaction, *registro* (tres ideas en una palabra).
2. **DynamoDB en español.** item, attribute, partition key, sort key (*ordenación / clasificación*), GSI, scan vs query.
3. **Copias y movimiento de datos.** backup, restore, replica, migration, ETL, stream, data lake.
4. **Datos e IA.** dataset, big data, machine learning, LLM, prompt, inference.

## Módulo 6 · Seguridad
1. **Quién eres y qué puedes hacer.** authentication vs authorization, sign in, credentials, password (*clave*), MFA, root user.
2. **Secretos y cifrado.** token, API key, secret, encryption (*cifrar / encriptar*), en reposo y en tránsito, certificate.
3. **Permisos y amenazas.** IAM role, policy (*política* ≠ politics), least privilege, firewall, vulnerability, phishing, hacker, audit / compliance.

## Módulo 7 · Trabajo en equipo y reuniones
1. **Rituales ágiles.** stand-up (*la daily*), planning, retro, story points, estimate, kickoff.
2. **Revisión de código con buen tono.** code review, LGTM, nit, feedback, blocker. Situación: dejar tres comentarios en una PR (uno formal, uno de equipo, uno "nit").
3. **Plazos y prioridades.** deadline, ETA, priority, scope, follow-up, heads-up, stakeholder, PM / PO.
4. **Trabajo remoto.** remote, zona horaria, onboarding, pair programming. *Eventually / actually*: los falsos amigos que más confusiones causan en reuniones.

## Módulo 8 · Proyecto final
1. **Cuéntalo dos veces.** Toma un cambio real (por ejemplo, "añadimos un GSI y desplegamos con CDK") y escribe: el mensaje de commit, la descripción de la PR, el aviso en Slack para el equipo y el correo formal al cliente. Cada versión en el registro correcto, en los dos idiomas.
2. **Entrevista técnica.** Responder en voz alta tres preguntas típicas ("explícame tu arquitectura", "¿cómo manejas un incidente?", "¿qué es serverless?") en el idioma que no es el tuyo.

// Dev Track — Protocols & Backend flashcards
// Follows the AWS Study Hub module convention: {id, front, back, hint, tags, difficulty}

export const decks = [
  {
    id: 'tcp-udp',
    title: 'TCP, UDP & the handshake',
    cards: [
      { id: 'tu1', front: 'What do SYN, SYN-ACK and ACK stand for, and what do they do?', back: 'SYN = synchronize, ACK = acknowledge. They are TCP header flags used in the 3-way handshake: client SYN (here is my sequence number), server SYN-ACK (got it, here is mine), client ACK (got yours). After that every byte is numbered and can be acknowledged or retransmitted.', hint: 'Three messages, two sequence numbers.', tags: ['tcp', 'handshake', 'exam-trap'], difficulty: 1 },
      { id: 'tu2', front: 'What does TCP guarantee that UDP does not?', back: 'Delivery (retransmits lost segments), ordering (sequence numbers), and integrity (checksums, plus flow/congestion control). UDP only gives you a checksum and a port number.', hint: 'Reliable, ordered byte stream.', tags: ['tcp', 'udp'], difficulty: 1 },
      { id: 'tu3', front: 'When would you choose UDP over TCP for IoT telemetry?', back: 'When freshness beats completeness: a 1-second heartbeat or a high-rate sensor reading where the next sample arrives anyway. No handshake latency, no server-side connection state, and one lost packet never stalls the ones behind it (no head-of-line blocking).', hint: 'Would you rather get the next reading, or wait for the old one to be resent?', tags: ['udp', 'iot'], difficulty: 2 },
      { id: 'tu4', front: 'What is a SYN flood?', back: 'A denial-of-service attack: send many SYNs, never send the final ACK. The server keeps half-open connections in memory until it runs out. Mitigations: SYN cookies, rate limits, and putting a load balancer or WAF in front.', hint: 'Half-open connections.', tags: ['tcp', 'security', 'exam-trap'], difficulty: 2 },
      { id: 'tu5', front: 'What does the IP layer do that TCP does not?', back: 'Addressing and routing: IP gets a packet from one host to another across networks. It does not care whether the packet arrives, in what order, or how many times. TCP (or UDP) sits on top and adds ports and, for TCP, reliability.', hint: 'Layers.', tags: ['tcp', 'ip'], difficulty: 1 },
      { id: 'tu6', front: 'Which command shows you a live TCP handshake on your Mac?', back: 'sudo tcpdump -i any port 5001 — you will see [S] for SYN, [S.] for SYN-ACK and [.] for ACK.', hint: 'It dumps TCP.', tags: ['tcp', 'tools'], difficulty: 1 },
    ],
  },
  {
    id: 'tls',
    title: 'TLS, certificates & HTTPS',
    cards: [
      { id: 'tl1', front: 'What does HTTPS add to HTTP?', back: 'HTTP wrapped in TLS on port 443: encryption in transit, integrity, and authentication of the server via a certificate signed by a trusted CA.', hint: 'The S.', tags: ['tls', 'http'], difficulty: 1 },
      { id: 'tl2', front: 'What does a TLS certificate actually prove?', back: 'That a Certificate Authority (CA) the client already trusts vouched that whoever holds the private key controls this domain name. It proves identity of the server, not that the server is safe or the content is correct.', hint: 'Who vouched, and for what?', tags: ['tls', 'exam-trap'], difficulty: 2 },
      { id: 'tl3', front: 'Why does a self-signed certificate make browsers warn?', back: 'There is no chain to a CA in the browser trust store, so the browser cannot verify who issued it. Encryption still works; authentication does not.', hint: 'Chain of trust.', tags: ['tls'], difficulty: 1 },
      { id: 'tl4', front: 'What is mTLS and why do IoT fleets use it?', back: 'Mutual TLS: the client presents a certificate too, so the server can verify the device. Each sensor gets its own cert; a spoofed device without a valid cert is rejected at the connection, before any application code runs.', hint: 'Both sides show ID.', tags: ['tls', 'iot', 'security'], difficulty: 2 },
      { id: 'tl5', front: 'What is forward secrecy and what provides it?', back: 'Even if the server private key is stolen later, past sessions cannot be decrypted. Provided by ephemeral key exchange (ECDHE) that generates a fresh session key per connection.', hint: 'ECDHE, the E is for ephemeral.', tags: ['tls'], difficulty: 3 },
      { id: 'tl6', front: 'Command to inspect a live cert chain from the terminal?', back: 'openssl s_client -connect example.com:443 -servername example.com', hint: 'openssl has a client mode.', tags: ['tls', 'tools'], difficulty: 1 },
    ],
  },
  {
    id: 'dns',
    title: 'DNS & Route 53',
    cards: [
      { id: 'd1', front: 'Walk through a recursive DNS lookup for api.example.com.', back: 'Stub resolver asks the recursive resolver (ISP or 8.8.8.8). Resolver asks a root server (who handles .com?), then a .com TLD server (who is authoritative for example.com?), then the authoritative server (Route 53) for the A record. Each answer is cached according to its TTL.', hint: 'Root, TLD, authoritative.', tags: ['dns'], difficulty: 2 },
      { id: 'd2', front: 'A vs AAAA vs CNAME vs MX vs TXT?', back: 'A: name to IPv4. AAAA: name to IPv6. CNAME: name to another name (cannot sit at the zone apex). MX: mail servers. TXT: free text, used for domain verification and SPF/DKIM.', hint: 'Five record types you will be asked about.', tags: ['dns', 'exam-trap'], difficulty: 1 },
      { id: 'd3', front: 'What is TTL and how does it affect a migration?', back: 'Time To Live: seconds a resolver may cache an answer. Lower the TTL a day before cutting over so caches expire quickly; raise it afterwards to reduce lookups.', hint: 'Caching lifetime.', tags: ['dns'], difficulty: 2 },
      { id: 'd4', front: 'Why does Route 53 have alias records?', back: 'Alias lets a zone apex (example.com) point at CloudFront, an ALB or S3 without a CNAME, and Route 53 resolves it internally at no charge. CNAMEs are not allowed at the apex by the DNS spec.', hint: 'Apex problem.', tags: ['dns', 'aws'], difficulty: 2 },
      { id: 'd5', front: 'DNS transport: UDP or TCP?', back: 'UDP port 53 by default; falls back to TCP for answers larger than 512 bytes (or with EDNS, larger) and for zone transfers.', hint: 'Both, with a default.', tags: ['dns', 'udp'], difficulty: 2 },
      { id: 'd6', front: 'Command that shows the full resolution path?', back: 'dig +trace example.com', hint: 'dig, with a flag.', tags: ['dns', 'tools'], difficulty: 1 },
    ],
  },
  {
    id: 'http-rest',
    title: 'HTTP, REST & idempotency',
    cards: [
      { id: 'h1', front: 'Which HTTP methods are idempotent?', back: 'GET, PUT, DELETE, HEAD, OPTIONS. POST is not; PATCH is not guaranteed to be. Idempotent means repeating the request leaves the server in the same state as doing it once.', hint: 'Same result if repeated.', tags: ['http', 'rest', 'exam-trap'], difficulty: 2 },
      { id: 'h2', front: 'What is idempotent webhook (or sensor event) processing?', back: 'Senders retry on any failure, so the same event can arrive more than once. Key each event by a unique ID and do a conditional write (attribute_not_exists) before doing any work. First arrival does the work; duplicates no-op and still return 200 so the sender stops retrying.', hint: 'Never process twice.', tags: ['http', 'aws', 'iot', 'exam-trap'], difficulty: 2 },
      { id: 'h3', front: 'What is REST, in one sentence?', back: 'Resources as URLs, HTTP verbs as actions, representations (usually JSON) in the body, status codes as outcomes, and no server-side session state between requests.', hint: 'Not a protocol, a style.', tags: ['rest'], difficulty: 1 },
      { id: 'h4', front: 'Status code classes?', back: '2xx success, 3xx redirect, 4xx the client is wrong (400 bad request, 401 not authenticated, 403 not allowed, 404 missing, 409 conflict, 429 rate limited), 5xx the server is wrong.', hint: 'First digit tells the story.', tags: ['http'], difficulty: 1 },
      { id: 'h5', front: 'HTTP/1.1 vs HTTP/2?', back: 'HTTP/1.1 needs one TCP connection per in-flight request (or keep-alive queues). HTTP/2 multiplexes many streams over one TLS connection with binary framing and header compression.', hint: 'Multiplexing.', tags: ['http'], difficulty: 3 },
      { id: 'h6', front: 'Command that shows the full HTTP conversation, headers included?', back: 'curl -v https://example.com/api', hint: 'Be verbose.', tags: ['http', 'tools'], difficulty: 1 },
    ],
  },
  {
    id: 'ssh-ops',
    title: 'SSH & ops',
    cards: [
      { id: 's1', front: 'How does SSH key authentication work?', back: 'Your public key lives in ~/.ssh/authorized_keys on the server. The server sends a challenge; your client signs it with the private key; the server verifies with the public key. The private key never leaves your machine.', hint: 'Challenge and signature.', tags: ['ssh'], difficulty: 2 },
      { id: 's2', front: 'What does the "host key has changed" warning mean?', back: 'The server presented a different host key than the one saved in ~/.ssh/known_hosts. Either the server was rebuilt, or someone is intercepting you. Verify before continuing.', hint: 'It is the whole security model.', tags: ['ssh', 'security', 'exam-trap'], difficulty: 2 },
      { id: 's3', front: 'How do you reach a private RDS instance from your laptop?', back: 'SSH local port forward through a bastion: ssh -L 5432:rds-endpoint:5432 user@bastion. Then connect your client to localhost:5432.', hint: 'Dash L.', tags: ['ssh', 'aws'], difficulty: 2 },
    ],
  },
  {
    id: 'aspnet',
    title: 'ASP.NET Core vocabulary',
    cards: [
      { id: 'a1', front: 'What is MVC?', back: 'Model-View-Controller. Model = data and rules, View = what the user sees, Controller = handles the request, uses the model, picks the view. For a JSON API there is no View: a Controller returns data directly.', hint: 'Three parts.', tags: ['aspnet'], difficulty: 1 },
      { id: 'a2', front: 'What is Dependency Injection in ASP.NET Core?', back: 'You register services once in Program.cs (builder.Services.AddScoped<IRepo, Repo>()) and the framework hands them to constructors that ask for them. It decouples code from concrete implementations and makes testing and configuration swaps trivial.', hint: 'Register once, ask in constructors.', tags: ['aspnet'], difficulty: 2 },
      { id: 'a3', front: 'What is the middleware pipeline?', back: 'An ordered chain every request passes through before reaching your endpoint: HTTPS redirect, static files, routing, authentication, authorization, then the endpoint. Order matters; auth before routing is a classic bug.', hint: 'app.Use... in order.', tags: ['aspnet'], difficulty: 2 },
      { id: 'a4', front: 'Minimal APIs vs Controllers?', back: 'Minimal APIs: app.MapGet("/sensors", handler) in Program.cs, little ceremony, feels like Flask. Controllers: classes with attribute-routed methods, better for large codebases and filters. Learn Minimal first, then read Controllers.', hint: 'Flask-like vs class-based.', tags: ['aspnet'], difficulty: 2 },
      { id: 'a5', front: 'What is EF Core?', back: 'Entity Framework Core, the ORM. C# classes map to tables, DbContext is the unit of work, LINQ queries compile to SQL, migrations version the schema.', hint: 'The ORM.', tags: ['aspnet', 'sql'], difficulty: 1 },
    ],
  },
  {
    id: 'iot-geo',
    title: 'IoT, MQTT, WMTS & signals',
    cards: [
      { id: 'i1', front: 'What is MQTT and why do IoT devices use it?', back: 'A lightweight publish/subscribe protocol over TCP designed for flaky, low-power devices. Devices publish to topics on a broker; backends subscribe. Tiny headers, persistent sessions, last-will messages. AWS IoT Core is an MQTT broker.', hint: 'Pub/sub for sensors.', tags: ['iot', 'mqtt'], difficulty: 2 },
      { id: 'i2', front: 'MQTT QoS 0, 1, 2?', back: '0: at most once (fire and forget). 1: at least once (may duplicate, so receiver must be idempotent). 2: exactly once (two extra round trips). Most telemetry uses 0 or 1.', hint: 'Zero, one, two deliveries.', tags: ['iot', 'mqtt', 'exam-trap'], difficulty: 2 },
      { id: 'i3', front: 'What is WMTS?', back: 'OGC Web Map Tile Service: pre-rendered map tiles addressed as /{layer}/{tilematrixset}/{z}/{x}/{y}.png over plain HTTP. Tiles are static assets, so CDNs cache them aggressively.', hint: 'Tiles by z/x/y.', tags: ['geo', 'wmts'], difficulty: 1 },
      { id: 'i4', front: 'How many tiles at zoom level z?', back: '2^z by 2^z. Zoom 0 is one tile for the whole world; zoom 10 is 1,048,576 tiles.', hint: 'Powers of two.', tags: ['geo', 'wmts'], difficulty: 2 },
      { id: 'i5', front: 'What is RMS and why does it matter for electrical signals?', back: 'Root Mean Square: the effective value of a waveform that swings positive and negative. 120 V household power is the RMS value. A rolling RMS that jumps is the crudest arc-fault detector.', hint: 'The number on the outlet.', tags: ['signal'], difficulty: 2 },
      { id: 'i6', front: 'What does 60 Hz mean?', back: 'Sixty full cycles per second. US mains alternates polarity 120 times per second. Sampling must be well above 120 samples/second to see the waveform (Nyquist).', hint: 'Cycles per second.', tags: ['signal'], difficulty: 1 },
    ],
  },
]

export function getAllDecks() { return decks }
export function getDeckById(id) { return decks.find(d => d.id === id) || null }
export function getAllTags() {
  const s = new Set()
  decks.forEach(d => d.cards.forEach(c => c.tags.forEach(t => s.add(t))))
  return [...s].sort()
}
export function getExamTrapCards() {
  return decks.flatMap(d => d.cards.filter(c => c.tags.includes('exam-trap')).map(c => ({ ...c, deckId: d.id })))
}
export function getAllCards() {
  return decks.flatMap(d => d.cards.map(c => ({ ...c, deckId: d.id, deckTitle: d.title })))
}

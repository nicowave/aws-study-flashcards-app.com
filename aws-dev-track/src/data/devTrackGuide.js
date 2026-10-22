// Dev Track study guide: one chapter per topic
// Block types: paragraph, keyTerm, awsService, table, comparison, bulletList, numberedList, examTip, code
// Each section ends with an examTip (shown as a practical tip: what people get wrong in interviews or production).

export const chapters = [
  // ---------------------------------------------------------------------------
  {
    id: 'tcp-udp',
    title: 'TCP, UDP & the handshake',
    summary: 'How TCP buys reliability with a handshake, sequence numbers and connection state, and when UDP (or QUIC on top of it) is the better trade.',
    sections: [
      {
        id: 'tcp-s1',
        title: 'Layers: what IP, TCP and UDP each promise',
        content: [
          { type: 'paragraph', text: 'IP moves a packet from one host address to another and promises nothing else: packets can be lost, duplicated or reordered. TCP and UDP sit on top of IP and add port numbers so many programs can share one address. TCP also adds reliability; UDP deliberately does not.' },
          { type: 'keyTerm', term: 'Port and 4-tuple', definition: 'A port is a 16-bit number that picks the program on a host. A TCP connection is identified by the 4-tuple (source IP, source port, destination IP, destination port). Clients get a random ephemeral source port, which is why one client can open many connections to the same server port 443.' },
          { type: 'table', headers: ['Property', 'TCP', 'UDP'], rows: [
            ['Setup', '3-way handshake, 1 round trip before data', 'None: the first packet carries data'],
            ['Delivery', 'Retransmits lost segments until ACKed', 'Best effort; a lost datagram is gone'],
            ['Ordering', 'Byte stream delivered in order', 'Datagrams may arrive in any order'],
            ['Message boundaries', 'None: a stream of bytes, you must frame messages', 'Preserved: one send = one datagram'],
            ['Flow / congestion control', 'Yes (receive window, slow start)', 'No; the application must not flood the network'],
            ['Header size', '20 bytes minimum', '8 bytes'],
            ['Server state', 'Per connection (buffers, sequence numbers, timers)', 'None required'],
            ['Typical uses', 'HTTP/1.1, HTTP/2, SSH, databases, MQTT', 'DNS queries, VoIP, video, game state, heartbeats, QUIC']
          ]},
          { type: 'keyTerm', term: 'Framing', definition: 'Because TCP is a byte stream, two writes of 100 bytes can arrive as one read of 200 or as reads of 37 and 163. Protocols built on raw TCP add a length prefix (for example a 4-byte big-endian length before each message) or a delimiter. Forgetting this works on localhost and breaks under real network load.' },
          { type: 'examTip', text: 'Saying "UDP is unreliable so it is bad" misses the point. The real answer is a trade: UDP has no handshake, no per-connection state and no head-of-line blocking, so it wins when the next message makes the lost one irrelevant. And if you use raw TCP, say how you frame messages; "I just call read()" is the classic bug.' }
        ]
      },
      {
        id: 'tcp-s2',
        title: 'The 3-way handshake and connection teardown',
        content: [
          { type: 'paragraph', text: 'Before any data flows, both sides must agree on starting sequence numbers so every byte can be counted, acknowledged and resent. That agreement is the handshake, and it costs one full round trip (RTT) before the client can send its first byte of data.' },
          { type: 'numberedList', title: 'Opening a connection', items: [
            'Client sends SYN with its initial sequence number (ISN), chosen at random to resist spoofing.',
            'Server replies SYN-ACK: its own ISN, plus ACK = client ISN + 1.',
            'Client sends ACK = server ISN + 1. The connection is ESTABLISHED on both sides; the client may put data in this same packet.',
            'From now on each segment carries a sequence number; the receiver ACKs the next byte it expects. Missing ACK after a timeout means retransmit.'
          ]},
          { type: 'numberedList', title: 'Closing a connection', items: [
            'The side that finishes first sends FIN; the other ACKs it (the connection is now half-closed).',
            'The other side sends its own FIN when done; the first side ACKs.',
            'The side that sent the first FIN waits in TIME_WAIT (2 x maximum segment lifetime, 60 seconds on Linux) so stray late packets cannot be mistaken for a new connection on the same 4-tuple.',
            'RST aborts a connection immediately, for example when a packet arrives for a port nobody is listening on.'
          ]},
          { type: 'code', title: 'Watch it happen with tcpdump', text: '# terminal 1: capture traffic on port 5001\nsudo tcpdump -i any -n port 5001\n\n# terminal 2: listener and client\nnc -l 5001          # server\nnc localhost 5001   # client, then type a line\n\n# what you will see (flags)\n# [S]   SYN          client -> server\n# [S.]  SYN-ACK      server -> client\n# [.]   ACK          client -> server\n# [P.]  PUSH + ACK   data\n# [F.]  FIN + ACK    close\n# [R]   RST          abort' },
          { type: 'keyTerm', term: 'SYN flood', definition: 'An attacker sends many SYNs and never completes the handshake, filling the server backlog of half-open connections. SYN cookies let the server encode state in its ISN and keep nothing until the final ACK; load balancers absorb floods before they reach you.' },
          { type: 'examTip', text: 'Creating a new connection per request (for example a new HttpClient per call in .NET) piles up sockets in TIME_WAIT and can exhaust ephemeral ports under load. Reuse connections: keep-alive, a connection pool or a shared client. Try it: open the TCP vs UDP lab and watch how much of the timeline the handshake alone takes.' }
        ]
      },
      {
        id: 'tcp-s3',
        title: 'Loss, head-of-line blocking and QUIC',
        content: [
          { type: 'paragraph', text: 'When a TCP segment is lost, the receiver cannot hand later bytes to the application until the missing one is retransmitted, because TCP promises an ordered stream. Every reading behind the lost one waits. This is head-of-line blocking, and it is the main reason real-time telemetry, voice and games prefer UDP.' },
          { type: 'comparison', title: 'Behaviour under 10% packet loss', items: [
            { label: 'TCP', description: 'Every byte arrives, in order. Each loss costs at least one retransmission timeout or round trip, and everything queued behind it stalls. Throughput also drops because congestion control shrinks the window.' },
            { label: 'UDP', description: 'About 90% of datagrams arrive, some out of order, with no stall. The application decides what a gap means: ignore it (heartbeat), interpolate (sensor), or request it again itself.' },
            { label: 'QUIC (HTTP/3)', description: 'Runs over UDP but implements reliable, encrypted streams in user space. A loss stalls only the stream it belongs to, not the others. Combines transport and TLS 1.3 setup in 1 RTT, 0 RTT on resumption.' }
          ]},
          { type: 'bulletList', title: 'Decision rule', items: [
            'Every byte must arrive (file upload, firmware, payments, database traffic): TCP, usually via HTTPS.',
            'Freshness beats completeness and messages are small and frequent (heartbeats, high-rate telemetry, live audio): UDP.',
            'Many devices, flaky links, several consumers: MQTT over TCP to a broker (covered in the IoT chapter).',
            'Web traffic on lossy mobile networks: HTTP/3 over QUIC, handled for you by the browser and CDN.'
          ]},
          { type: 'examTip', text: 'Nobody gets marked down for "TCP is reliable". They get marked down for not knowing the cost: one RTT of setup, per-connection state on the server, and head-of-line blocking under loss. Try it: in the TCP vs UDP lab, set loss to 30% and run both protocols back to back.' }
        ]
      }
    ]
  },

  // ---------------------------------------------------------------------------
  {
    id: 'tls',
    title: 'TLS, certificates & HTTPS',
    summary: 'What the TLS handshake negotiates, what a certificate chain proves, and the handful of ways certificates break in production.',
    sections: [
      {
        id: 'tls-s1',
        title: 'What TLS gives you',
        content: [
          { type: 'paragraph', text: 'TLS (Transport Layer Security, the successor to SSL) runs on top of TCP and gives three properties: confidentiality (traffic is encrypted), integrity (tampering is detected), and authentication of the server (and optionally the client) through certificates. HTTPS is simply HTTP sent inside a TLS connection, on port 443 by default.' },
          { type: 'keyTerm', term: 'Symmetric vs asymmetric crypto', definition: 'Asymmetric keys (a public/private pair) are slow and are used only during the handshake to agree on keys and to sign. The bulk data is then encrypted with fast symmetric keys (AES-GCM or ChaCha20-Poly1305) derived from that agreement.' },
          { type: 'keyTerm', term: 'ECDHE and forward secrecy', definition: 'Elliptic Curve Diffie-Hellman Ephemeral: each connection generates fresh key pairs and derives a shared secret that is never sent on the wire. Because the keys are thrown away, stealing the server private key later cannot decrypt recorded past sessions. TLS 1.3 removed static RSA key exchange, so every TLS 1.3 connection has forward secrecy.' },
          { type: 'keyTerm', term: 'SNI', definition: 'Server Name Indication: the hostname the client wants, sent in the ClientHello so one IP address can serve many certificates. It is sent in clear text unless Encrypted Client Hello (ECH) is used, so the hostname of an HTTPS request is visible to the network; the path and headers are not.' },
          { type: 'examTip', text: 'A common mix-up is "the certificate encrypts the traffic". It does not: the certificate authenticates the server and its key signs the handshake; the traffic is encrypted with ephemeral session keys. Another: HTTPS hides the URL path and headers, but not the hostname (SNI) or the destination IP.' }
        ]
      },
      {
        id: 'tls-s2',
        title: 'The handshake: TLS 1.2 vs TLS 1.3',
        content: [
          { type: 'numberedList', title: 'TLS 1.3 full handshake (1 round trip)', items: [
            'ClientHello: supported versions and cipher suites, SNI, ALPN (for example h2), and key shares for its preferred groups (usually X25519). The client guesses the group so it can send its key share immediately.',
            'ServerHello: chosen suite and the server key share. Both sides can now derive handshake keys, so everything after this is encrypted, including the certificate.',
            'Server sends Certificate (leaf plus intermediates), CertificateVerify (a signature over the handshake proving it holds the private key), and Finished.',
            'Client verifies the chain and hostname, sends Finished, and can send the first HTTP request in the same flight.'
          ]},
          { type: 'table', headers: ['', 'TLS 1.2', 'TLS 1.3'], rows: [
            ['Full handshake', '2 RTT', '1 RTT'],
            ['Resumption', '1 RTT (session ID or ticket)', '1 RTT, or 0-RTT early data with a PSK'],
            ['Key exchange', 'RSA or (EC)DHE', '(EC)DHE only: forward secrecy always'],
            ['Certificate visible on the wire', 'Yes, in clear text', 'No, encrypted'],
            ['Cipher suites', 'Many, including weak CBC and RC4 legacy', '5 AEAD suites only'],
            ['Time to first response over TCP (new connection)', '4 RTT (1 TCP + 2 TLS + 1 request)', '3 RTT (1 TCP + 1 TLS + 1 request)']
          ]},
          { type: 'keyTerm', term: '0-RTT early data', definition: 'On a resumed TLS 1.3 connection the client can send data in its very first flight. The cost: early data can be replayed by an attacker, so servers should accept it only for idempotent requests such as GET.' },
          { type: 'keyTerm', term: 'ALPN', definition: 'Application-Layer Protocol Negotiation: the client lists protocols (h2, http/1.1) in the ClientHello and the server picks one, so HTTP/2 is agreed without an extra round trip.' },
          { type: 'examTip', text: 'If asked "how many round trips does HTTPS cost", count both layers: on a fresh connection, TCP takes 1 RTT and TLS 1.3 takes 1 more before the request can go out (TLS 1.2 takes 2). That is why connection reuse, TLS session resumption and terminating TLS at a nearby CDN edge make such a large latency difference.' }
        ]
      },
      {
        id: 'tls-s3',
        title: 'The chain of trust and how it breaks',
        content: [
          { type: 'paragraph', text: 'A certificate binds a public key to one or more hostnames, and is signed by a Certificate Authority. The server sends its leaf certificate plus any intermediate certificates; the client walks the signatures up to a root that is already in its trust store (shipped with the OS, browser or language runtime). The root is never sent; trust starts there by decision, not by proof.' },
          { type: 'bulletList', title: 'What the client checks', items: [
            'Each certificate is signed by the next one up, ending at a trusted root.',
            'The requested hostname matches a Subject Alternative Name (SAN) entry. The Common Name field is ignored by modern clients.',
            'The current time is between notBefore and notAfter on every certificate in the chain.',
            'Key usage allows server authentication, and the certificate is not revoked (OCSP or CRL, where checked).'
          ]},
          { type: 'table', headers: ['Failure', 'Typical error', 'Usual cause and fix'], rows: [
            ['Expired leaf', 'certificate has expired', 'Renewal job failed silently. Automate renewal (ACM, certbot timer) and alert on days remaining.'],
            ['Hostname mismatch', 'Hostname/IP does not match certificate altnames', 'Cert for www.example.com used on api.example.com. A wildcard *.example.com covers exactly one label: not example.com, not a.b.example.com.'],
            ['Self-signed or unknown CA', 'self signed certificate in certificate chain', 'Internal CA not in the client trust store, or a test cert left in place. Encryption works; authentication does not.'],
            ['Missing intermediate', 'unable to get local issuer certificate', 'Server sends only the leaf. Browsers often recover by fetching or caching the intermediate; curl, Java, Python and devices do not. Serve the full chain (fullchain.pem).'],
            ['Clock skew', 'certificate is not yet valid', 'Device without a real-time clock or NTP boots in 1970. Common on IoT hardware.']
          ]},
          { type: 'code', title: 'Inspect a live chain', text: '# show the chain the server actually sends, with SNI\nopenssl s_client -connect api.example.com:443 -servername api.example.com -showcerts </dev/null\n\n# dates, subject and SAN of the leaf\nopenssl s_client -connect api.example.com:443 -servername api.example.com </dev/null 2>/dev/null \\\n  | openssl x509 -noout -subject -dates -ext subjectAltName\n\n# what curl negotiates (TLS version, ALPN, verify result)\ncurl -vI https://api.example.com' },
          { type: 'awsService', name: 'AWS Certificate Manager (ACM)', description: 'Issues and automatically renews public certificates for use on CloudFront, Application Load Balancers and API Gateway. DNS validation with a CNAME record keeps renewals hands-free. Certificates for CloudFront must be requested in us-east-1.' },
          { type: 'examTip', text: '"It works in my browser" is not proof the chain is correct: browsers hide a missing intermediate, while API clients and devices fail. Always test with openssl s_client or curl from a clean machine. Try it: open the TLS lab and break the chain three ways (self-signed, expired, wrong hostname) and note which check fails each time.' }
        ]
      },
      {
        id: 'tls-s4',
        title: 'Mutual TLS for devices and services',
        content: [
          { type: 'paragraph', text: 'In ordinary TLS only the server proves who it is. In mutual TLS (mTLS) the server also sends a CertificateRequest and the client presents its own certificate and signs the handshake with its private key. The server validates that certificate against its own CA list before any application code runs.' },
          { type: 'comparison', title: 'Ways to authenticate a device or service', items: [
            { label: 'API key in a header', description: 'Simple, but it is a shared secret: anyone who copies it is the device. Must be rotated by hand. Never put it in a query string, where it ends up in logs.' },
            { label: 'Bearer token (OAuth, JWT)', description: 'Short-lived and scoped, good for users and services. Still a bearer secret: whoever holds it can use it until it expires.' },
            { label: 'mTLS client certificate', description: 'The private key never leaves the device (ideally it lives in a secure element). Rejected at the connection layer. Revoke one device without touching the others. Cost: you operate a CA and a provisioning process.' }
          ]},
          { type: 'awsService', name: 'AWS IoT Core', description: 'Authenticates devices with X.509 client certificates over mTLS on port 8883 (or 443 with ALPN). Each certificate is attached to an IoT policy that limits which topics the device may publish and subscribe to.' },
          { type: 'examTip', text: 'mTLS proves which key connected, not that the device is healthy or the data is honest; you still authorize per device (a policy that limits a device to its own topics). And plan certificate rotation before the first fleet cert expires, because a device that cannot connect cannot fetch its new certificate.' }
        ]
      }
    ]
  },

  // ---------------------------------------------------------------------------
  {
    id: 'dns',
    title: 'DNS & Route 53',
    summary: 'How a name becomes an address, which record type to use for what, and how TTL caching decides how fast a change reaches the world.',
    sections: [
      {
        id: 'dns-s1',
        title: 'Resolution: root, TLD, authoritative',
        content: [
          { type: 'paragraph', text: 'DNS is a distributed, cached database. Your laptop runs a stub resolver that asks one recursive resolver (your ISP, your VPC resolver, or a public one such as 8.8.8.8). The recursive resolver does the work: it walks the tree from the root down, caches every answer for its TTL, and returns the final answer.' },
          { type: 'numberedList', title: 'Lookup of api.example.com with an empty cache', items: [
            'Stub resolver checks the local cache and hosts file, then asks the recursive resolver.',
            'Recursive resolver asks a root server: "who handles .com?" The root returns the NS records for the .com TLD servers.',
            'It asks a .com TLD server: "who handles example.com?" The TLD returns the NS records set at your registrar (the delegation).',
            'It asks one of those authoritative servers (for example Route 53) for the A record of api.example.com and gets the answer with a TTL.',
            'It caches the answer for TTL seconds and returns it. The next client inside that window gets it straight from cache.'
          ]},
          { type: 'keyTerm', term: 'Transport', definition: 'Queries use UDP port 53 by default because a query and answer fit in one datagram each. If the answer is too large (beyond 512 bytes, or beyond the EDNS0 buffer size the client advertised) the server sets the truncated flag and the client retries over TCP 53. Zone transfers always use TCP. DNS over HTTPS (DoH) and DNS over TLS (DoT, port 853) encrypt queries.' },
          { type: 'code', title: 'See every hop', text: '# walk the delegation from the root yourself\ndig +trace api.example.com\n\n# ask a specific resolver, short answer with TTL\ndig @8.8.8.8 api.example.com A +noall +answer\n# api.example.com.  287  IN  A  203.0.113.10\n#                   ^ seconds left in that resolver cache\n\n# ask the authoritative server directly (bypass caches)\ndig example.com NS +short\ndig @ns-123.awsdns-15.com api.example.com A' },
          { type: 'examTip', text: 'When "DNS is not updating", ask whose cache you are looking at. Querying the authoritative server directly shows the truth; querying your usual resolver shows a cached copy with the TTL counting down. Try it: open the DNS lab, resolve a name, then run the second lookup and watch the cache hit skip every hop.' }
        ]
      },
      {
        id: 'dns-s2',
        title: 'Record types you will be asked about',
        content: [
          { type: 'table', headers: ['Type', 'Maps', 'Notes'], rows: [
            ['A', 'Name to IPv4 address', 'Can hold several addresses; clients pick one.'],
            ['AAAA', 'Name to IPv6 address', 'Publish alongside A for dual-stack.'],
            ['CNAME', 'Name to another name', 'Cannot coexist with any other record at the same name, so it cannot be used at the zone apex (example.com), which must hold SOA and NS.'],
            ['Alias (Route 53)', 'Name to an AWS resource', 'Route 53 extension. Works at the apex, resolves to the target IPs internally, and queries to AWS targets are free.'],
            ['MX', 'Domain to mail servers', 'Has a priority: lower number is tried first. Must point to a name, not an IP.'],
            ['TXT', 'Free text', 'Domain ownership checks, SPF, DKIM and DMARC for email.'],
            ['NS', 'Zone to its name servers', 'The delegation. Must match at the registrar and in the hosted zone.'],
            ['SOA', 'Zone metadata', 'Primary server, serial, and the negative-caching TTL.'],
            ['CAA', 'Which CAs may issue certificates', 'A CA must refuse to issue if it is not listed.'],
            ['SRV / PTR', 'Service host and port / IP to name', 'PTR lives in the reverse zone (in-addr.arpa) and is used for reverse lookups.']
          ]},
          { type: 'comparison', title: 'Pointing example.com at a load balancer or CDN', items: [
            { label: 'A record with a fixed IP', description: 'Breaks: load balancer and CDN IPs change without notice.' },
            { label: 'CNAME at the apex', description: 'Not allowed by the DNS spec, because the apex already has SOA and NS records. Fine for www.example.com.' },
            { label: 'Route 53 alias (or ALIAS/ANAME at other providers)', description: 'The right answer: apex-safe, follows the target as its IPs change, and free for AWS targets.' }
          ]},
          { type: 'examTip', text: 'The trap is the apex: "just CNAME example.com to the load balancer" is invalid. Put a CNAME on www (or use an alias) and an alias at the apex. A second trap: a CNAME on a name means that name cannot also have MX or TXT records.' }
        ]
      },
      {
        id: 'dns-s3',
        title: 'TTL, caching and safe migrations',
        content: [
          { type: 'paragraph', text: 'The TTL on a record tells resolvers how many seconds they may cache it. While a cached copy is alive, changing the record at the authoritative server has no effect for clients of that resolver. "DNS propagation" is really just caches expiring.' },
          { type: 'keyTerm', term: 'Negative caching', definition: 'A "this name does not exist" (NXDOMAIN) answer is cached too, for a time set by the SOA record of the zone (RFC 2308). If you query a name before you create it, resolvers may keep answering "does not exist" for that long.' },
          { type: 'numberedList', title: 'Cutting over to a new endpoint', items: [
            'At least one old-TTL before the change (a day ahead if the TTL is 86400), lower the TTL to 60 seconds.',
            'Wait for the old TTL to pass so every cache holds the short-TTL copy.',
            'Change the record. Clients move within about a minute.',
            'Keep the old endpoint running for a while: some clients and runtimes cache longer than the TTL says.',
            'Raise the TTL again once stable to cut query volume and latency.'
          ]},
          { type: 'table', headers: ['TTL', 'Good for', 'Cost'], rows: [
            ['30 to 60 s', 'Failover records, an imminent migration', 'More queries, a little more latency on misses'],
            ['300 s', 'Default for most application records', 'Changes take up to 5 minutes'],
            ['3600 to 86400 s', 'Stable records, MX, verification TXT', 'A mistake stays cached for hours'],
            ['NS at the TLD (often 172800 s)', 'Delegation, set by the TLD registry', 'Changing name servers can take up to 2 days to reach everyone']
          ]},
          { type: 'awsService', name: 'Amazon Route 53', description: 'Authoritative DNS with health checks and routing policies: simple, weighted (canary splits), latency-based, failover (primary and secondary), geolocation, geoproximity, multivalue answer and IP-based. Failover only helps clients as fast as the record TTL lets them re-ask.' },
          { type: 'examTip', text: 'Lowering the TTL at the moment of the cutover does nothing for caches that already hold the old record with the long TTL. Lower it at least one old-TTL in advance. Try it: the Protocol picker lab has this exact cutover scenario.' }
        ]
      }
    ]
  },

  // ---------------------------------------------------------------------------
  {
    id: 'http-rest',
    title: 'HTTP, REST & idempotency',
    summary: 'HTTP method semantics, status codes, caching and versions, and how to make handlers safe under the retries that at-least-once delivery guarantees.',
    sections: [
      {
        id: 'http-s1',
        title: 'Methods: safe, idempotent, neither',
        content: [
          { type: 'keyTerm', term: 'Safe', definition: 'The request does not change server state; it is read-only from the client point of view. Caches and crawlers may issue safe requests freely.' },
          { type: 'keyTerm', term: 'Idempotent', definition: 'Sending the same request N times leaves the server in the same state as sending it once. The response may differ (DELETE returns 204 then 404) but the resulting state does not. Idempotent requests can be retried automatically after a timeout.' },
          { type: 'table', headers: ['Method', 'Safe', 'Idempotent', 'Typical use and success code'], rows: [
            ['GET', 'Yes', 'Yes', 'Read a resource: 200, or 304 if unchanged'],
            ['HEAD', 'Yes', 'Yes', 'Headers only (size, ETag): 200'],
            ['OPTIONS', 'Yes', 'Yes', 'Allowed methods, CORS preflight: 204'],
            ['PUT', 'No', 'Yes', 'Create or fully replace at a known URL: 200, 201 or 204'],
            ['DELETE', 'No', 'Yes', 'Remove: 204 (a repeat may return 404, state is the same)'],
            ['POST', 'No', 'No', 'Create in a collection or run an action: 201 with Location, or 202'],
            ['PATCH', 'No', 'Not guaranteed', 'Partial update; "increment by 1" is not idempotent, "set field to 5" is']
          ]},
          { type: 'paragraph', text: 'REST is an architectural style, not a protocol: resources have URLs (/sensors/42/readings), the method says what to do, the body carries a representation (usually JSON), the status code says what happened, and each request carries everything the server needs, with no server-side session between calls.' },
          { type: 'examTip', text: 'Idempotent does not mean "returns the same response". DELETE twice gives 204 then 404, and it is still idempotent because the state is the same. And PATCH is not idempotent by definition; it depends on what the patch does.' }
        ]
      },
      {
        id: 'http-s2',
        title: 'Status codes and headers that matter',
        content: [
          { type: 'table', headers: ['Code', 'Meaning', 'When to use it'], rows: [
            ['200 / 201 / 202 / 204', 'OK / Created / Accepted / No Content', '201 after a create, with a Location header; 202 when work is queued; 204 when there is no body'],
            ['301 / 308 vs 302 / 307', 'Permanent vs temporary redirect', '307 and 308 keep the method and body; 301 and 302 may turn a POST into a GET'],
            ['304', 'Not Modified', 'Answer to a conditional GET (If-None-Match matched the ETag)'],
            ['400 / 422', 'Malformed / semantically invalid', 'Bad JSON or failed validation'],
            ['401 vs 403', 'Not authenticated vs not allowed', '401: who are you? (send credentials). 403: I know who you are, and no'],
            ['404 / 405 / 409', 'Missing / method not allowed / conflict', '409 for a duplicate create or a version conflict'],
            ['412', 'Precondition Failed', 'If-Match ETag no longer matches: someone else updated it first'],
            ['429', 'Too Many Requests', 'Rate limited; include Retry-After'],
            ['500 / 502 / 503 / 504', 'Server error / bad gateway / unavailable / gateway timeout', '502 and 504 usually come from the proxy or load balancer in front of you, not your code']
          ]},
          { type: 'keyTerm', term: 'ETag and conditional requests', definition: 'An ETag is a version identifier for a representation. GET with If-None-Match lets a cache revalidate cheaply (304, no body). PUT with If-Match gives optimistic concurrency: the update only applies if nobody changed the resource since you read it, otherwise 412.' },
          { type: 'keyTerm', term: 'Cache-Control', definition: 'Tells browsers and CDNs how long a response may be reused. max-age=31536000, immutable for versioned static files and map tiles; no-store for private data; s-maxage applies only to shared caches such as CloudFront.' },
          { type: 'code', title: 'Read a full HTTP conversation', text: '# request and response headers, TLS details, timing\ncurl -v https://api.example.com/sensors/42\n\n# create, show only the status line and Location\ncurl -s -o /dev/null -w "%{http_code} %{redirect_url}\\n" \\\n  -X POST https://api.example.com/sensors \\\n  -H "Content-Type: application/json" \\\n  -d \'{"serial":"S-0042"}\'\n\n# conditional GET: expect 304 if the ETag still matches\ncurl -I https://api.example.com/sensors/42 -H \'If-None-Match: "v7"\'' },
          { type: 'comparison', title: 'HTTP versions', items: [
            { label: 'HTTP/1.1', description: 'Text protocol over TCP. One request at a time per connection (pipelining is effectively unused), so browsers open about 6 connections per host.' },
            { label: 'HTTP/2', description: 'Binary framing, many concurrent streams multiplexed on one TLS connection, header compression (HPACK). A single lost TCP packet still stalls every stream.' },
            { label: 'HTTP/3', description: 'HTTP over QUIC (UDP). Independent streams so a loss only stalls its own stream, and faster setup. Served by most CDNs today.' }
          ]},
          { type: 'examTip', text: 'Do not return 200 with {"error": ...} in the body: clients, retries, load balancer health checks and monitoring all key off the status code. And know the 401 vs 403 split cold; it is asked constantly.' }
        ]
      },
      {
        id: 'http-s3',
        title: 'Retries, at-least-once delivery and idempotent handlers',
        content: [
          { type: 'paragraph', text: 'Networks fail in the worst place: after the server did the work but before the client saw the response. The client cannot tell "never arrived" from "arrived, answer lost", so it retries. Webhooks, SQS standard queues, SNS, EventBridge and MQTT QoS 1 all promise at-least-once delivery for the same reason. Your handler will see duplicates; the only question is whether they cause harm.' },
          { type: 'numberedList', title: 'Making a handler idempotent', items: [
            'Get a unique key per logical operation: the event id from the sender, or an Idempotency-Key header the client generates (a UUID) for each POST.',
            'Before doing any side effect, record the key with a conditional write: DynamoDB attribute_not_exists(event_id), or a unique index in SQL.',
            'If the write succeeds, do the work. If it fails because the key exists, skip the work.',
            'Return a success status for the duplicate too (200 or the stored original response), so the sender stops retrying.'
          ]},
          { type: 'code', title: 'Conditional write on the event id (Python, DynamoDB)', text: 'try:\n    table.put_item(\n        Item={"event_id": evt["id"], "received_at": now},\n        ConditionExpression="attribute_not_exists(event_id)",\n    )\nexcept table.meta.client.exceptions.ConditionalCheckFailedException:\n    return {"statusCode": 200}   # duplicate: already processed, do nothing\n\nfulfil_order(evt)                # first arrival only\nreturn {"statusCode": 200}' },
          { type: 'bulletList', title: 'Retry rules for clients', items: [
            'Retry automatically only idempotent requests, or POSTs that carry an idempotency key.',
            'Use exponential backoff with jitter (random spread) so thousands of clients do not retry in lockstep.',
            'Cap the attempts and honour Retry-After on 429 and 503.',
            'Retry 5xx and timeouts; do not retry 4xx except 408 and 429, because the same bad request will fail again.'
          ]},
          { type: 'awsService', name: 'Amazon SQS', description: 'Standard queues are at-least-once and best-effort ordered; FIFO queues add ordering and a 5-minute deduplication window by message deduplication id. A message that is not deleted before its visibility timeout ends becomes visible again and is delivered again.' },
          { type: 'examTip', text: 'Returning 500 on a duplicate is the classic mistake: the sender treats it as a failure and retries more. Another: checking "does this id exist?" and then inserting in two steps has a race; make the check and the insert one atomic conditional write. Try it: open the Idempotency lab, retry an event with the switch off, then on.' }
        ]
      }
    ]
  },

  // ---------------------------------------------------------------------------
  {
    id: 'ssh-ops',
    title: 'SSH & ops',
    summary: 'How SSH authenticates both ends, how to tunnel to private resources safely, and the commands that answer "is it listening and why not".',
    sections: [
      {
        id: 'ssh-s1',
        title: 'Two keys, two directions of trust',
        content: [
          { type: 'paragraph', text: 'SSH runs over TCP 22 and authenticates in both directions. The server proves its identity with its host key; the client proves the user identity, usually with a key pair. After key exchange (similar in spirit to TLS ECDHE) everything is encrypted.' },
          { type: 'comparison', title: 'The two key checks', items: [
            { label: 'Host key (server to you)', description: 'On first connect you are shown a fingerprint and the key is saved to ~/.ssh/known_hosts (trust on first use). On later connects a different key triggers "REMOTE HOST IDENTIFICATION HAS CHANGED": the server was rebuilt, or someone is in the middle.' },
            { label: 'User key (you to server)', description: 'Your public key is listed in ~/.ssh/authorized_keys on the server. The server sends a challenge, your client signs it with the private key, the server verifies with the public key. The private key never leaves your machine.' }
          ]},
          { type: 'code', title: 'Keys and a config file', text: '# create a modern key (ed25519), protect it with a passphrase\nssh-keygen -t ed25519 -C "laptop-2026"\nssh-copy-id -i ~/.ssh/id_ed25519.pub ubuntu@203.0.113.10\n\n# permissions SSH insists on\nchmod 700 ~/.ssh && chmod 600 ~/.ssh/id_ed25519\n\n# ~/.ssh/config\nHost bastion\n  HostName 203.0.113.10\n  User ubuntu\n  IdentityFile ~/.ssh/id_ed25519\nHost app\n  HostName 10.0.2.15\n  User ubuntu\n  ProxyJump bastion\n\n# debug a refused login\nssh -v app' },
          { type: 'examTip', text: 'Clearing known_hosts or setting StrictHostKeyChecking=no to make the warning go away disables the one check that stops a man-in-the-middle. Confirm the new fingerprint out of band (for example from the cloud console output) first. And "UNPROTECTED PRIVATE KEY FILE" means chmod 600, not a broken key.' }
        ]
      },
      {
        id: 'ssh-s2',
        title: 'Tunnels and bastions',
        content: [
          { type: 'table', headers: ['Flag', 'Direction', 'Example and use'], rows: [
            ['-L local:host:port', 'Your laptop port to a host reachable from the server', 'ssh -L 5432:db.internal:5432 bastion, then psql -h localhost: reach a private database'],
            ['-R remote:host:port', 'A server port back to your laptop', 'ssh -R 8080:localhost:3000 server: expose a local dev server through a remote host'],
            ['-D port', 'Dynamic SOCKS proxy', 'ssh -D 1080 bastion: browse internal web UIs through the bastion'],
            ['-J host', 'Jump through a host', 'ssh -J bastion app: reach a private instance without copying keys to the bastion'],
            ['-N', 'No remote command', 'Combine with -L to hold a tunnel open only']
          ]},
          { type: 'comparison', title: 'Reaching private instances on AWS', items: [
            { label: 'Bastion host with SSH', description: 'A small public instance with port 22 open only to known IPs. Familiar, but it is another server to patch, and keys must be managed.' },
            { label: 'EC2 Instance Connect', description: 'Pushes a short-lived public key to the instance for 60 seconds, controlled by IAM. Still uses SSH and port 22 (or the Instance Connect Endpoint for private subnets).' },
            { label: 'Systems Manager Session Manager', description: 'No inbound ports at all: the SSM agent dials out. Access is controlled by IAM and sessions are logged. Can also port-forward to a database.' }
          ]},
          { type: 'examTip', text: 'Opening the database port to 0.0.0.0/0 "just for a minute" is how databases get breached. Tunnel instead, and prefer ProxyJump (-J) over agent forwarding (-A): with -A, anyone with root on the bastion can use your agent to log in as you while you are connected. Try it: the Protocol picker lab includes the private-database scenario.' }
        ]
      },
      {
        id: 'ssh-s3',
        title: 'First-response ops commands',
        content: [
          { type: 'paragraph', text: 'Most "it does not work" reports reduce to four questions: is the process running, is it listening on the right address and port, can the network reach it, and what does it log. Work through them in that order instead of guessing.' },
          { type: 'code', title: 'Is it running, listening, reachable, logging?', text: '# running? (systemd services)\nsystemctl status myapi\njournalctl -u myapi -n 100 --no-pager -f\n\n# listening, and on which address?\nsudo ss -tlnp          # TCP listeners with process\nsudo ss -ulnp          # UDP listeners\nsudo lsof -i :5000     # who holds port 5000 (macOS too)\n\n# reachable from here?\nnc -vz 10.0.2.15 5000  # TCP connect test\ncurl -v http://localhost:5000/health\n\n# resources\ndf -h ; free -m ; top' },
          { type: 'keyTerm', term: '127.0.0.1 vs 0.0.0.0', definition: 'A server bound to 127.0.0.1 (localhost) accepts connections only from the same machine. Bound to 0.0.0.0 it accepts on every interface. A service that works with curl localhost but not from outside is very often bound to localhost, before any firewall question.' },
          { type: 'bulletList', title: 'Connection refused vs timed out', items: [
            'Connection refused: the packet reached the host and nothing is listening on that port (the kernel sent RST). Check the process and the bind address.',
            'Timed out: packets are being dropped silently. Check the security group, network ACL, host firewall and routing.',
            'Permission denied (publickey): SSH reached the server; the key, the user name or file permissions are wrong. ssh -v shows which keys were offered.'
          ]},
          { type: 'examTip', text: 'Telling "refused" from "timed out" is the fastest triage step there is and interviewers love it: refused means you reached the host and nothing listens; timeout means something in the path is dropping packets, usually a security group.' }
        ]
      }
    ]
  },

  // ---------------------------------------------------------------------------
  {
    id: 'aspnet',
    title: 'ASP.NET Core essentials',
    summary: 'The request pipeline, dependency injection lifetimes, Minimal APIs vs Controllers, configuration and EF Core, with the ordering and lifetime bugs that bite in production.',
    sections: [
      {
        id: 'asp-s1',
        title: 'Program.cs and the middleware pipeline',
        content: [
          { type: 'paragraph', text: 'An ASP.NET Core app is built in two phases in Program.cs. First you register services on builder.Services (the DI container). Then you call builder.Build() and add middleware to the app: an ordered chain that every request passes through on the way in and every response passes through on the way out. The Kestrel web server hands each request to the first middleware.' },
          { type: 'code', title: 'A minimal API with the pipeline in the right order', text: 'var builder = WebApplication.CreateBuilder(args);\n\n// 1. services (DI registrations)\nbuilder.Services.AddDbContext<AppDb>(o =>\n    o.UseNpgsql(builder.Configuration.GetConnectionString("Db")));\nbuilder.Services.AddScoped<IReadingStore, EfReadingStore>();\nbuilder.Services.AddAuthentication().AddJwtBearer();\nbuilder.Services.AddAuthorization();\nbuilder.Services.AddHostedService<UdpHeartbeatListener>();\n\nvar app = builder.Build();\n\n// 2. middleware (order matters)\napp.UseExceptionHandler("/error");\napp.UseHsts();\napp.UseHttpsRedirection();\napp.UseStaticFiles();\napp.UseRouting();\napp.UseCors();\napp.UseAuthentication();\napp.UseAuthorization();\n\n// 3. endpoints\napp.MapPost("/readings", async (Reading r, IReadingStore store) =>\n{\n    var created = await store.AddAsync(r);\n    return created ? Results.Created($"/readings/{r.Id}", r) : Results.Ok(r);\n}).RequireAuthorization();\n\napp.MapGet("/sensors/{serial}", (string serial, IReadingStore s) => s.GetSensor(serial));\n\napp.Run();' },
          { type: 'numberedList', title: 'Why that order', items: [
            'Exception handler first, so it wraps everything after it and catches their exceptions.',
            'HTTPS redirection and static files early: static files short-circuit and never pay for routing or auth (put them after auth only if they must be protected).',
            'UseRouting picks the endpoint, so later middleware can read its metadata (such as RequireAuthorization). In .NET 6+ it is added implicitly if you do not call it.',
            'UseCors after routing and before authorization, so preflight requests get their headers.',
            'UseAuthentication (who are you, sets HttpContext.User) before UseAuthorization (are you allowed). Reversed, every user looks anonymous.',
            'Endpoints run last; a middleware that does not call next() ends the pipeline there.'
          ]},
          { type: 'examTip', text: 'The classic pipeline bug is UseAuthorization before UseAuthentication: the user is still anonymous when the policy is checked, so every protected endpoint returns 401 even with a valid token. The opposite mistake, an endpoint without RequireAuthorization or [Authorize], lets requests through unchecked. When asked "what is middleware", say ordered, wraps the next one, can short-circuit, and give the auth ordering example.' }
        ]
      },
      {
        id: 'asp-s2',
        title: 'Dependency injection lifetimes',
        content: [
          { type: 'paragraph', text: 'You register an interface with an implementation and a lifetime; the container creates instances and passes them to constructors (or Minimal API handler parameters) that ask for them. Code depends on the interface, so tests can pass a fake and configuration can swap implementations without touching callers.' },
          { type: 'table', headers: ['Lifetime', 'One instance per', 'Use for', 'Watch out'], rows: [
            ['Transient (AddTransient)', 'Every resolution', 'Lightweight, stateless helpers', 'A disposable transient resolved from the root lives until the app stops'],
            ['Scoped (AddScoped)', 'HTTP request (or a scope you create)', 'DbContext, unit of work, per-request user context', 'Not available in singletons or background services without creating a scope'],
            ['Singleton (AddSingleton)', 'Application lifetime', 'Caches, configuration, HttpClient handlers, clients to AWS services', 'Must be thread-safe; shared by all concurrent requests']
          ]},
          { type: 'keyTerm', term: 'Captive dependency', definition: 'A longer-lived service holding a shorter-lived one, for example a singleton that takes a scoped DbContext in its constructor. The DbContext then lives forever and is shared across threads, which it does not support. In Development, scope validation throws "Cannot consume scoped service from singleton"; in Production it may silently misbehave.' },
          { type: 'code', title: 'Using a scoped DbContext from a BackgroundService (a singleton)', text: 'public class UdpHeartbeatListener(IServiceScopeFactory scopes) : BackgroundService\n{\n    protected override async Task ExecuteAsync(CancellationToken ct)\n    {\n        using var udp = new UdpClient(5000);\n        while (!ct.IsCancellationRequested)\n        {\n            var msg = await udp.ReceiveAsync(ct);\n            using var scope = scopes.CreateScope();          // new scope per unit of work\n            var db = scope.ServiceProvider.GetRequiredService<AppDb>();\n            db.Heartbeats.Add(Heartbeat.Parse(msg.Buffer));\n            await db.SaveChangesAsync(ct);\n        }\n    }\n}' },
          { type: 'examTip', text: 'If asked the three lifetimes, add the rule that proves you have shipped: a service may only depend on services that live at least as long as it does. Injecting DbContext into a singleton or a hosted service is the most common real bug; create a scope with IServiceScopeFactory. Related: use IHttpClientFactory instead of new HttpClient() per call, which exhausts sockets.' }
        ]
      },
      {
        id: 'asp-s3',
        title: 'Minimal APIs, Controllers and configuration',
        content: [
          { type: 'comparison', title: 'Two ways to define endpoints', items: [
            { label: 'Minimal APIs', description: 'app.MapGet("/sensors", handler) in Program.cs or grouped with MapGroup. Parameters bind from the route, query, body and DI by type. Little ceremony, fast startup, good for small services. Validation and filters are added explicitly.' },
            { label: 'Controllers', description: 'Classes deriving from ControllerBase with [ApiController] and attribute routes. Automatic 400 ValidationProblem responses from data annotations, action filters, conventions. Scales better for large APIs with many endpoints and shared behaviour.' }
          ]},
          { type: 'keyTerm', term: 'MVC', definition: 'Model-View-Controller: the model holds data and rules, the controller handles the request and uses the model, the view renders HTML. For a JSON API there is no view; the controller returns data, and the framework serializes it.' },
          { type: 'bulletList', title: 'Configuration sources, later ones win', items: [
            'appsettings.json',
            'appsettings.{Environment}.json, where the environment comes from ASPNETCORE_ENVIRONMENT (Development, Staging, Production)',
            'User secrets (Development only)',
            'Environment variables, with a double underscore for nesting: ConnectionStrings__Db',
            'Command-line arguments'
          ]},
          { type: 'keyTerm', term: 'Options pattern', definition: 'Bind a configuration section to a typed class with builder.Services.Configure<TileOptions>(builder.Configuration.GetSection("Tiles")) and inject IOptions<TileOptions>. Typed, testable, and validated at startup with ValidateOnStart.' },
          { type: 'examTip', text: 'Secrets in appsettings.json end up in git. Use user secrets locally and environment variables or a secrets store (AWS Secrets Manager, Parameter Store) in production, and remember that an environment variable overrides the JSON value, which is often the explanation for "my setting is ignored".' }
        ]
      },
      {
        id: 'asp-s4',
        title: 'EF Core: data access without surprises',
        content: [
          { type: 'paragraph', text: 'Entity Framework Core maps C# classes to tables. A DbContext is a unit of work: it tracks entities you load, and SaveChanges writes every change in one transaction. LINQ queries are translated to SQL and run when enumerated (ToListAsync, FirstOrDefaultAsync).' },
          { type: 'code', title: 'Unique index for idempotent inserts, and a migration', text: '// AppDb.OnModelCreating\nmodelBuilder.Entity<Reading>()\n    .HasIndex(r => new { r.Serial, r.Seq })\n    .IsUnique();\n\n// insert; a duplicate (serial, seq) violates the index\ntry { db.Readings.Add(r); await db.SaveChangesAsync(); return true; }\ncatch (DbUpdateException ex) when (IsUniqueViolation(ex)) { return false; }\n\n# terminal\ndotnet ef migrations add ReadingUniqueSeq\ndotnet ef database update' },
          { type: 'table', headers: ['Problem', 'Symptom', 'Fix'], rows: [
            ['N+1 queries', 'One query for the list, then one per row for related data', 'Include(s => s.Readings) or project with Select'],
            ['Tracking read-only data', 'High memory and CPU on large reads', 'AsNoTracking() for queries you will not update'],
            ['Client-side evaluation', 'Pulling a whole table to filter in memory', 'Keep filters translatable; check the generated SQL in logs'],
            ['Sync over async', 'Thread pool starvation under load', 'Use the Async methods end to end; never .Result or .Wait()'],
            ['Shared DbContext', 'A second operation was started on this context', 'One DbContext per request or scope; it is not thread-safe']
          ]},
          { type: 'examTip', text: 'Idempotency belongs in the database, not only in code: a unique index on the natural key (serial plus sequence number) makes duplicate inserts impossible even when two retries race on two servers. Catch the unique-violation error and treat it as "already stored".' }
        ]
      }
    ]
  },

  // ---------------------------------------------------------------------------
  {
    id: 'iot-geo',
    title: 'IoT, MQTT, WMTS & signals',
    summary: 'Publish/subscribe for device fleets with MQTT and its QoS levels, map tiles addressed by z/x/y, and the signal basics (RMS, frequency, sampling) behind sensor data.',
    sections: [
      {
        id: 'iot-s1',
        title: 'MQTT: publish/subscribe for devices',
        content: [
          { type: 'paragraph', text: 'MQTT is a small publish/subscribe protocol over TCP (1883, or 8883 with TLS). Devices keep one long-lived connection to a broker and publish messages to topics; backends subscribe to topics. Publishers and subscribers never know about each other, so you can add a consumer without touching the fleet.' },
          { type: 'table', headers: ['QoS', 'Guarantee', 'Handshake', 'Receiver must'], rows: [
            ['0', 'At most once', 'PUBLISH only, no acknowledgement', 'Accept that some messages are lost'],
            ['1', 'At least once', 'PUBLISH, then PUBACK; resent with the DUP flag until acknowledged', 'Be idempotent: duplicates will arrive'],
            ['2', 'Exactly once (between one client and the broker)', 'PUBLISH, PUBREC, PUBREL, PUBCOMP: two round trips', 'Nothing extra, but it costs the most latency and broker state']
          ]},
          { type: 'keyTerm', term: 'Effective QoS', definition: 'QoS is set per hop: the publisher to broker hop uses the publish QoS, the broker to subscriber hop uses the lower of the publish QoS and the subscription QoS. A QoS 2 publish to a QoS 0 subscriber is delivered at QoS 0.' },
          { type: 'bulletList', title: 'Features worth naming', items: [
            'Topics are hierarchical strings: sensors/S-0042/temperature. Wildcards in subscriptions only: + matches one level, # matches all remaining levels.',
            'Retained message: the broker keeps the last message on a topic and gives it to new subscribers immediately (good for "current state").',
            'Last Will and Testament: a message the broker publishes for a client that disconnects without saying goodbye (good for online/offline status).',
            'Persistent session (clean session false, or a session expiry in MQTT 5): the broker queues QoS 1 and 2 messages while the client is offline.',
            'Keep alive: the client pings within the agreed interval so the broker can detect dead connections.'
          ]},
          { type: 'code', title: 'Try a broker locally', text: 'brew install mosquitto\nbrew services start mosquitto\n\n# terminal 1: subscribe to everything under sensors/\nmosquitto_sub -h localhost -t \'sensors/#\' -q 1 -v\n\n# terminal 2: publish a reading at QoS 1, and a retained status\nmosquitto_pub -h localhost -t sensors/S-0042/temp -q 1 -m \'{"seq":17,"c":21.4}\'\nmosquitto_pub -h localhost -t sensors/S-0042/status -r -m online' },
          { type: 'awsService', name: 'AWS IoT Core', description: 'Managed MQTT broker (plus MQTT over WebSockets and HTTPS publish) with per-device X.509 authentication, a rules engine that routes messages to Lambda, Kinesis, DynamoDB or S3 using SQL-like statements, and device shadows that store desired and reported state. It supports QoS 0 and 1, not QoS 2.' },
          { type: 'examTip', text: 'QoS 2 is rarely the answer. Most fleets use QoS 0 for high-rate telemetry and QoS 1 for events that matter, plus an idempotent consumer keyed on device id and sequence number. That also survives duplicates introduced elsewhere, which QoS 2 between one client and the broker cannot prevent end to end.' }
        ]
      },
      {
        id: 'iot-s2',
        title: 'WMTS and tile math',
        content: [
          { type: 'paragraph', text: 'A web map is a grid of square images (tiles), usually 256 by 256 pixels, in the Web Mercator projection (EPSG:3857). At zoom z the world is 2^z tiles across and 2^z tiles down. Each tile is addressed by three integers, which makes it a static file: cacheable at a CDN, cheap to serve, and fetched only when it is on screen.' },
          { type: 'code', title: 'Longitude/latitude to tile x/y (Web Mercator)', text: 'function lonLatToTile(lon, lat, z) {\n  const n = 2 ** z;                        // tiles per side\n  const latRad = lat * Math.PI / 180;\n  const x = Math.floor((lon + 180) / 360 * n);\n  const y = Math.floor(\n    (1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2 * n\n  );\n  return { x, y, n };                      // y = 0 is the top (north) row\n}\n\n// zoom 0: 1 tile; zoom 10: 1024 x 1024 = 1,048,576 tiles\n// ground resolution at the equator: 156543.03 / 2^z metres per pixel' },
          { type: 'table', headers: ['Scheme', 'Address', 'Row origin'], rows: [
            ['XYZ (slippy map)', '/{z}/{x}/{y}.png', 'Top-left: y grows southward'],
            ['TMS', '/{z}/{x}/{y}.png', 'Bottom-left: y_tms = 2^z - 1 - y'],
            ['WMTS (OGC standard) REST', '/{layer}/{style}/{TileMatrixSet}/{TileMatrix}/{TileRow}/{TileCol}.png', 'Top-left: TileMatrix is the zoom, TileRow is y, TileCol is x (note row before column)'],
            ['WMTS KVP', '?SERVICE=WMTS&REQUEST=GetTile&TILEMATRIX=z&TILEROW=y&TILECOL=x', 'Same grid; capabilities XML describes the matrix sets']
          ]},
          { type: 'bulletList', title: 'Facts that come up', items: [
            'Web Mercator is cut at about 85.0511 degrees north and south so that the world fits in a square.',
            'Each zoom level up has 4 times the tiles of the one before; total tiles from zoom 0 to z is (4^(z+1) - 1) / 3.',
            'Tiles are good candidates for Cache-Control: public, max-age with a versioned URL, and for pre-rendering the low zoom levels.',
            'Areas shrink in pixels toward the equator and stretch toward the poles: Mercator preserves shape locally, not area.'
          ]},
          { type: 'examTip', text: 'Swapping x and y, or using TMS row order against an XYZ server, puts every tile in the wrong hemisphere or upside down; WMTS REST also lists TileRow before TileCol. And "return all sensors as GeoJSON on every pan" does not scale; tiles do, because the CDN serves them. Try it: open the Tile math lab, then change only the zoom and watch x and y double.' }
        ]
      },
      {
        id: 'iot-s3',
        title: 'Signals: Hz, RMS and sampling',
        content: [
          { type: 'keyTerm', term: 'Frequency (Hz)', definition: 'Cycles per second. Mains power is 60 Hz in North America and 50 Hz in most of the rest of the world. At 60 Hz one cycle lasts 1/60 s, about 16.67 ms, and the voltage crosses zero 120 times per second.' },
          { type: 'keyTerm', term: 'RMS (root mean square)', definition: 'The square root of the mean of the squared samples. It is the "effective" value: the DC voltage that would deliver the same power into a resistor. For a pure sine wave RMS = peak / sqrt(2), about 0.707 x peak, so 120 V RMS mains has a peak of about 170 V and swings about 340 V peak to peak.' },
          { type: 'table', headers: ['Waveform', 'RMS', 'Note'], rows: [
            ['Sine, peak A', 'A / sqrt(2) = 0.707 A', 'The number printed on outlets is RMS'],
            ['Square wave, +/-A', 'A', 'Always at full magnitude'],
            ['Triangle, peak A', 'A / sqrt(3) = 0.577 A', ''],
            ['DC, value A', 'A', 'RMS equals the value'],
            ['Average of a full sine cycle', '0', 'Why you use RMS, not the mean, for AC']
          ]},
          { type: 'keyTerm', term: 'Nyquist rate', definition: 'To reconstruct a signal you must sample at more than twice its highest frequency component. A 60 Hz fundamental needs more than 120 samples per second, but its harmonics and fast transients (the interesting part for fault detection) need far more: kilohertz rates in practice. Sampling too slowly causes aliasing, where high frequencies masquerade as low ones.' },
          { type: 'code', title: 'Rolling RMS over one cycle with a running sum (C#)', text: '// fs = 3840 samples/s -> 64 samples per 60 Hz cycle\nconst int Window = 64;\nvar buf = new double[Window];\ndouble sumSq = 0; int i = 0, count = 0;\n\ndouble Push(double sample)\n{\n    sumSq += sample * sample - buf[i] * buf[i];   // add new, drop oldest\n    buf[i] = sample;\n    i = (i + 1) % Window;\n    if (count < Window) count++;\n    return Math.Sqrt(Math.Max(sumSq, 0) / count); // guard tiny negative drift\n}\n\n// flag an anomaly when RMS leaves a band around nominal, e.g. 120 V +/- 10%' },
          { type: 'examTip', text: 'Use a window of whole cycles (one 60 Hz cycle = fs / 60 samples), otherwise the RMS ripples even on a perfect sine. And do not confuse peak with RMS: a 120 V circuit peaks near 170 V, which matters for component ratings and for any threshold you set on raw samples.' }
        ]
      }
    ]
  }
];

export const getChapterById = (id) => chapters.find(c => c.id === id) || null;

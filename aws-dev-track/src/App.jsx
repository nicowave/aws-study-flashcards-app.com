import { useState } from 'react'
import HandshakeLab from './labs/HandshakeLab.jsx'
import TlsLab from './labs/TlsLab.jsx'
import DnsLab from './labs/DnsLab.jsx'
import IdempotencyLab from './labs/IdempotencyLab.jsx'
import { ProtocolPickerLab, TileMathLab } from './labs/PickerAndTiles.jsx'
import { getAllDecks, getAllCards, getExamTrapCards } from './data/devTrackCards.js'

const HUB_URL = 'https://aws-study-flashcards-app.com'

function Flashcards() {
  const decks = getAllDecks()
  const [deckId, setDeckId] = useState('all')
  const [i, setI] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const cards = deckId === 'all' ? getAllCards() : deckId === 'traps' ? getExamTrapCards() : getAllCards().filter(c => c.deckId === deckId)
  const c = cards[i % cards.length]
  const go = d => { setI((i + d + cards.length) % cards.length); setFlipped(false) }
  return (
    <section className="lab">
      <header>
        <h2>Flashcards</h2>
        <p className="lead">Click the card to flip. Space flips, arrows move.</p>
      </header>
      <div className="row">
        <select value={deckId} onChange={e => { setDeckId(e.target.value); setI(0); setFlipped(false) }}>
          <option value="all">All decks ({getAllCards().length})</option>
          <option value="traps">Exam traps only ({getExamTrapCards().length})</option>
          {decks.map(d => <option key={d.id} value={d.id}>{d.title} ({d.cards.length})</option>)}
        </select>
        <span className="mono" style={{ fontSize: 13, color: 'var(--ink-soft)' }}>{(i % cards.length) + 1} / {cards.length}</span>
      </div>
      <button className={`card ${flipped ? 'back' : ''}`} onClick={() => setFlipped(f => !f)}
        onKeyDown={e => { if (e.key === 'ArrowRight') go(1); if (e.key === 'ArrowLeft') go(-1) }} aria-label={flipped ? 'Answer. Click to see question' : 'Question. Click to reveal answer'}>
        <div>{flipped ? c.back : c.front}</div>
        {!flipped && c.hint && <div className="hint">Hint: {c.hint}</div>}
        {flipped && <div className="hint">{c.tags.map(t => <span key={t} className={`pill ${t === 'exam-trap' ? 'trap' : ''}`}>{t}</span>)} difficulty {c.difficulty}/3</div>}
      </button>
      <div className="row">
        <button className="btn secondary" onClick={() => go(-1)}>Previous</button>
        <button className="btn" onClick={() => setFlipped(f => !f)}>{flipped ? 'Show question' : 'Show answer'}</button>
        <button className="btn secondary" onClick={() => go(1)}>Next</button>
      </div>
    </section>
  )
}

function Guide() {
  const G = [
    ['SYN / SYN-ACK / ACK', 'TCP header flags in the 3-way handshake. Synchronize, synchronize-acknowledge, acknowledge. Agree on sequence numbers so bytes can be counted and resent.'],
    ['TCP', 'Transmission Control Protocol. Reliable, ordered byte stream over IP. Costs a round trip to open and state on the server. Use for anything where every byte matters.'],
    ['UDP', 'User Datagram Protocol. No handshake, no retries, no ordering. Use for heartbeats, high-rate telemetry, DNS, voice/video.'],
    ['IP', 'Internet Protocol. Addresses and routes packets between hosts. Makes no promises about delivery.'],
    ['HTTP / HTTPS', 'The request/response language of the web and of REST APIs. HTTPS is HTTP inside TLS on port 443.'],
    ['TLS', 'Transport Layer Security. Encryption plus server identity via a certificate chain to a trusted CA. The thing people still call SSL.'],
    ['CA', 'Certificate Authority. The trusted third party (Let\'s Encrypt, DigiCert, AWS ACM) that signs a cert vouching a key holder controls a domain.'],
    ['ECDHE', 'Elliptic Curve Diffie-Hellman Ephemeral. The key exchange that gives forward secrecy: a fresh session key per connection.'],
    ['mTLS', 'Mutual TLS. Client presents a certificate too. How IoT fleets authenticate each device at the connection layer.'],
    ['DNS', 'Domain Name System. Names to addresses via root, TLD and authoritative servers. UDP 53. Answers cached for TTL seconds.'],
    ['TTL', 'Time To Live. Seconds a resolver may cache a DNS answer. Lower it before a migration.'],
    ['SSH', 'Secure Shell. Encrypted remote terminal over TCP 22 with key-pair auth. -L forwards a local port through the server.'],
    ['REST', 'Representational State Transfer. Resources as URLs, HTTP verbs as actions, JSON bodies, status codes as outcomes, stateless.'],
    ['Idempotent', 'Doing it twice equals doing it once. GET/PUT/DELETE are; POST is not. Event handlers are made idempotent with a conditional write on a unique event id.'],
    ['MVC', 'Model-View-Controller. In ASP.NET Core, Controller classes handle routes; for JSON APIs there is no View.'],
    ['ASP.NET Core', 'Microsoft\'s cross-platform web framework for C#. Learn Minimal APIs first, then Controllers, DI, middleware, EF Core.'],
    ['DI', 'Dependency Injection. Register services in Program.cs; constructors receive them. Decouples and makes testing easy.'],
    ['EF Core', 'Entity Framework Core. The ORM: C# classes to tables, LINQ to SQL, migrations for schema.'],
    ['IoT', 'Internet of Things. Cheap connected devices streaming to a backend. Ting: hundreds of thousands of sensors.'],
    ['MQTT / QoS', 'Lightweight pub/sub protocol for devices. QoS 0 at most once, 1 at least once (dedupe!), 2 exactly once. AWS IoT Core is a broker.'],
    ['WMTS / OGC', 'Web Map Tile Service, an Open Geospatial Consortium standard. Tiles at /z/x/y.png, static, CDN-friendly.'],
    ['RMS / Hz', 'Root Mean Square, the effective value of an AC waveform (120 V is RMS). Hertz, cycles per second; US mains is 60 Hz.'],
  ]
  return (
    <section className="lab guide">
      <header><h2>Reference: every acronym in the Ting Labs posting</h2><p className="lead">What it is, what it costs, when you pick the alternative. Same content as the PDF, for when you are at the keyboard.</p></header>
      <dl>{G.map(([k, v]) => <><dt key={k}>{k}</dt><dd key={k + 'd'}>{v}</dd></>)}</dl>
      <h2>Commands that make each one visible</h2>
      <pre>{`sudo tcpdump -i any port 5001                 # TCP handshake flags
openssl s_client -connect host:443             # TLS chain
dig +trace host                                # DNS walk
curl -v https://host/api                       # HTTP headers
ssh -v user@host ; ssh -L 5432:db:5432 bastion # SSH negotiation, tunnel
brew install dotnet ; dotnet new webapi        # ASP.NET Core
brew install mosquitto ; mosquitto_sub -t '#'  # MQTT broker`}</pre>
      <h2>The MiniTing project (build order)</h2>
      <ol style={{ maxWidth: '80ch' }}>
        <li>Python sensor simulator: N sensors, 1 reading/sec, deliberate duplicate seq numbers.</li>
        <li>ASP.NET Core BackgroundService: UDP heartbeats on 5000, length-prefixed TCP frames on 5001. Run tcpdump.</li>
        <li>Minimal API over HTTPS: POST /readings, GET /sensors, GET /sensors/{'{serial}'}/readings, GET /fleet/health. EF Core + unique index on (serial, seq).</li>
        <li>WMTS endpoint GET /wmts/sensors/{'{z}'}/{'{x}'}/{'{y}'}.png rendered with SkiaSharp, Cache-Control headers.</li>
        <li>Deploy: EC2 over SSH, nginx + certbot, Route 53 A record, dig and openssl to verify, SSH tunnel to Postgres.</li>
        <li>React dashboard on /fleet/health plus the tile layer.</li>
        <li>Stretch: 60 Hz waveform with injected noise; rolling RMS anomaly flag in C#.</li>
      </ol>
    </section>
  )
}

const TABS = [
  ['handshake', 'TCP vs UDP', HandshakeLab],
  ['tls', 'TLS', TlsLab],
  ['dns', 'DNS', DnsLab],
  ['idem', 'Idempotency', IdempotencyLab],
  ['pick', 'Protocol picker', ProtocolPickerLab],
  ['tiles', 'Tile math', TileMathLab],
  ['cards', 'Flashcards', Flashcards],
  ['guide', 'Reference', Guide],
]

export default function App() {
  const [tab, setTab] = useState('handshake')
  const Active = TABS.find(t => t[0] === tab)[2]
  return (
    <div className="shell">
      <div className="topbar">
        <div><h1>Dev Track: protocols and backend</h1><p className="lead" style={{ margin: 0 }}>Hands-on labs for the stuff behind every cloud API and IoT fleet.</p></div>
        <div className="brand"><a href={HUB_URL}>AWS Study Hub</a></div>
      </div>
      <nav className="tabs" aria-label="Labs">
        {TABS.map(([id, label]) => <button key={id} onClick={() => setTab(id)} aria-current={tab === id ? 'page' : undefined}>{label}</button>)}
      </nav>
      <Active />
    </div>
  )
}

import { useState } from 'react'

const SCENARIOS = [
  { q: 'A sensor sends a 1-second "I am alive" heartbeat. Missing one is fine; the next arrives in a second.', options: ['TCP', 'UDP', 'HTTPS POST', 'MQTT QoS 2'], a: 1, why: 'Freshness beats completeness and you do not want a handshake per beat or connection state for 300k devices. UDP.' },
  { q: 'A sensor uploads a 4 MB diagnostic log after a fault. Every byte must arrive.', options: ['UDP', 'HTTPS POST to the REST API', 'DNS TXT record', 'SSH'], a: 1, why: 'Reliable, ordered, encrypted, easy to authenticate and rate-limit. TCP via HTTPS.' },
  { q: '300,000 low-power devices on flaky Wi-Fi each publish a reading every 5 seconds to a backend that fans out to several consumers.', options: ['Raw TCP sockets per device', 'MQTT over TCP to a broker', 'UDP broadcast', 'FTP'], a: 1, why: 'Pub/sub decouples devices from consumers, sessions survive drops, tiny headers. MQTT (AWS IoT Core speaks it natively).' },
  { q: 'Your handler receives the same event_id twice, 40 ms apart.', options: ['Process both; the second is probably a new reading', 'Conditional write on event_id; second one no-ops and returns 200', 'Return 500 on the second so the sender stops', 'Delete the first and keep the second'], a: 1, why: 'Idempotency. Returning 500 makes the sender retry MORE.' },
  { q: 'You need to prove the device connecting to your API is really one of yours, not a clone.', options: ['Check its IP address', 'mTLS with a per-device certificate', 'Put the API key in the query string', 'Trust the User-Agent header'], a: 1, why: 'Client certificates are verified at the TLS layer before your code runs. IPs change; headers and query strings are trivially forged.' },
  { q: 'An engineer needs to query the production Postgres in a private subnet from her laptop.', options: ['Open port 5432 to the internet', 'SSH local port forward through a bastion', 'Email the CSV', 'Make the DB public with a strong password'], a: 1, why: 'ssh -L 5432:rds-endpoint:5432 user@bastion. Nothing on the DB is exposed.' },
  { q: 'You are cutting the API over to a new load balancer tomorrow.', options: ['Raise the DNS TTL to 24h', 'Lower the DNS TTL to 60s today', 'Change the A record at the exact moment', 'Use a CNAME at the zone apex'], a: 1, why: 'Resolvers cache for the TTL. Shorten it a day ahead so the world forgets the old answer fast.' },
  { q: 'The dashboard map needs sensor locations at any zoom level for a million users.', options: ['GET /sensors returning all 300k as GeoJSON', 'WMTS tiles /z/x/y.png behind CloudFront', 'WebSocket pushing every sensor', 'Render on the client from a CSV'], a: 1, why: 'Tiles are static assets: cacheable at the edge, tiny per request, and the client only asks for what is on screen.' },
]

export function ProtocolPickerLab() {
  const [i, setI] = useState(0)
  const [picked, setPicked] = useState(null)
  const [score, setScore] = useState({ right: 0, total: 0 })
  const s = SCENARIOS[i]
  const choose = k => { if (picked !== null) return; setPicked(k); setScore(sc => ({ right: sc.right + (k === s.a ? 1 : 0), total: sc.total + 1 })) }
  return (
    <section className="lab">
      <header>
        <h2>Protocol picker: which one, and why</h2>
        <p className="lead">The interview question is never "what is UDP". It is "what would you use here". Eight scenarios.</p>
      </header>
      <p><strong>{i + 1}/{SCENARIOS.length}.</strong> {s.q}</p>
      <div className="choices">
        {s.options.map((o, k) => (
          <button key={k} onClick={() => choose(k)} className={picked === null ? '' : k === s.a ? 'right' : k === picked ? 'wrong' : ''}>{o}</button>
        ))}
      </div>
      {picked !== null && <div className="explain"><strong>{picked === s.a ? 'Right.' : 'Not that one.'}</strong> {s.why}</div>}
      <div className="row">
        <button className="btn" onClick={() => { setI((i + 1) % SCENARIOS.length); setPicked(null) }} disabled={picked === null}>Next scenario</button>
        <span className="mono" style={{ fontSize: 13, color: 'var(--ink-soft)' }}>score {score.right}/{score.total}</span>
      </div>
    </section>
  )
}

function lonLatToTile(lon, lat, z) {
  const n = 2 ** z
  const x = Math.floor(((lon + 180) / 360) * n)
  const latR = (lat * Math.PI) / 180
  const y = Math.floor(((1 - Math.log(Math.tan(latR) + 1 / Math.cos(latR)) / Math.PI) / 2) * n)
  return { x, y, n }
}

export function TileMathLab() {
  const [lon, setLon] = useState(-77.0947)
  const [lat, setLat] = useState(38.9807)
  const [z, setZ] = useState(12)
  const { x, y, n } = lonLatToTile(lon, lat, z)
  return (
    <section className="lab">
      <header>
        <h2>WMTS tile math: lon/lat to z/x/y</h2>
        <p className="lead">Every tile server, including the one you automated at Esri, is this function. Move the sliders.</p>
      </header>
      <div className="row">
        <label className="toggle">lon <input type="number" step="0.01" value={lon} onChange={e => setLon(+e.target.value)} style={{ width: 110 }} /></label>
        <label className="toggle">lat <input type="number" step="0.01" value={lat} onChange={e => setLat(+e.target.value)} style={{ width: 110 }} /></label>
        <label className="toggle">zoom <input type="range" min="0" max="18" value={z} onChange={e => setZ(+e.target.value)} /> <span className="mono">{z}</span></label>
      </div>
      <pre>{`GET /wmts/sensors/${z}/${x}/${y}.png
tiles at this zoom: ${n} x ${n} = ${(n * n).toLocaleString()}
each tile covers ~${(40075 / n).toFixed(n > 1000 ? 3 : 1)} km of longitude at the equator`}</pre>
      <div className="tilegrid" aria-hidden="true">
        {Array.from({ length: 16 }, (_, k) => { const gx = k % 4, gy = Math.floor(k / 4); const hit = (x % 4) === gx && (y % 4) === gy; return <div key={k} className={hit ? 'hit' : ''}>{hit ? `${x},${y}` : ''}</div> })}
      </div>
      <div className="explain">
        <strong>Why it matters:</strong> a tile is addressed by integers, so it is a static file. Static files cache at the CDN edge and never touch your database. That is why WMTS scales to millions of users and <code>GET /sensors?bbox=...</code> does not. The y formula is Web Mercator: it stretches latitude so the map is a square.
      </div>
    </section>
  )
}

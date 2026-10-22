import { useState } from 'react'

const CHAIN = [
  { role: 'Leaf (server) cert', subject: 'api.example.com', issuer: "Let's Encrypt R11", proves: 'This server holds the private key for api.example.com.' },
  { role: 'Intermediate CA', subject: "Let's Encrypt R11", issuer: 'ISRG Root X1', proves: "Let's Encrypt is allowed to issue certs, vouched for by the root." },
  { role: 'Root CA', subject: 'ISRG Root X1', issuer: 'ISRG Root X1 (self-signed)', proves: 'Shipped inside your OS/browser trust store. Trust starts here, by fiat.' },
]

const STEPS = [
  { t: 'Client Hello', d: 'Browser says: here are the TLS versions and cipher suites I support, plus the hostname I want (SNI).' },
  { t: 'Server Hello + certificate chain', d: 'Server picks a cipher and sends its leaf cert plus intermediates. It does not send the root; you already have it.' },
  { t: 'Chain verification', d: 'Client checks: leaf signed by intermediate? Intermediate signed by a root in my trust store? Hostname matches? Not expired or revoked?' },
  { t: 'Key exchange (ECDHE)', d: 'Both sides generate ephemeral keys and derive a shared session secret. Stealing the server private key later does not decrypt this session: forward secrecy.' },
  { t: 'Encrypted application data', d: 'From here on HTTP flows inside TLS. That is HTTPS.' },
]

export default function TlsLab() {
  const [scenario, setScenario] = useState('good')
  const [step, setStep] = useState(0)
  const [mtls, setMtls] = useState(false)

  const broken = scenario === 'selfsigned' ? 1 : scenario === 'expired' ? 0 : scenario === 'hostname' ? 0 : -1
  const verdict = {
    good: { cls: 'ok', text: 'Chain verified. Padlock. The CA vouched that this server controls this hostname.' },
    selfsigned: { cls: 'bad', text: 'No trusted issuer. Encryption would still work, but nobody vouched for who this is. Browser warns.' },
    expired: { cls: 'bad', text: 'Leaf cert expired. Even a valid chain fails if the dates are wrong. This is the #1 production outage caused by certs.' },
    hostname: { cls: 'bad', text: 'Cert is for www.example.com but you asked for api.example.com. Valid cert, wrong name. Fails.' },
  }[scenario]

  return (
    <section className="lab">
      <header>
        <h2>TLS lab: what a certificate actually proves</h2>
        <p className="lead">Step through the handshake, then break the chain in different ways and see which check fails.</p>
      </header>
      <div className="row">
        <select value={scenario} onChange={e => { setScenario(e.target.value); setStep(0) }}>
          <option value="good">Valid chain</option>
          <option value="selfsigned">Self-signed cert</option>
          <option value="expired">Expired leaf</option>
          <option value="hostname">Hostname mismatch</option>
        </select>
        <label className="toggle"><input type="checkbox" checked={mtls} onChange={e => setMtls(e.target.checked)} /> mTLS (client presents a cert too)</label>
      </div>

      <div className="chain">
        {CHAIN.map((c, i) => {
          const isBroken = broken === i && step >= 2
          const isVerified = step >= 2 && scenario === 'good'
          const subj = scenario === 'hostname' && i === 0 ? 'www.example.com' : c.subject
          const issuer = scenario === 'selfsigned' && i === 0 ? 'api.example.com (self-signed)' : c.issuer
          return (
            <div key={c.role} className={`cert ${isBroken ? 'broken' : ''} ${isVerified ? 'verified' : ''}`} style={{ opacity: scenario === 'selfsigned' && i > 0 ? 0.35 : 1 }}>
              <h3>{c.role}</h3>
              <dl>
                <dt>subject</dt><dd>{subj}</dd>
                <dt>issuer</dt><dd>{issuer}</dd>
                <dt>valid</dt><dd>{scenario === 'expired' && i === 0 ? '2026-05-01 to 2026-07-30 (expired)' : '90 days, auto-renewed'}</dd>
              </dl>
              <p style={{ fontSize: 13, marginTop: 8, color: 'var(--ink-soft)' }}>{c.proves}</p>
            </div>
          )
        })}
        {mtls && (
          <div className="cert" style={{ borderStyle: 'dashed' }}>
            <h3>Client (device) cert</h3>
            <dl><dt>subject</dt><dd>sensor-00A1F3</dd><dt>issuer</dt><dd>Fleet Device CA</dd></dl>
            <p style={{ fontSize: 13, marginTop: 8, color: 'var(--ink-soft)' }}>With mTLS the server verifies the device too. A cloned sensor without a valid device cert is refused before any API code runs. This is how IoT fleets authenticate.</p>
          </div>
        )}
      </div>

      <div className="row">
        <button className="btn secondary" onClick={() => setStep(s => Math.max(0, s - 1))} disabled={step === 0}>Back</button>
        <button className="btn" onClick={() => setStep(s => Math.min(STEPS.length - 1, s + 1))} disabled={step === STEPS.length - 1}>Next step</button>
        <span className="mono" style={{ color: 'var(--ink-soft)', fontSize: 13 }}>step {step + 1} of {STEPS.length}</span>
      </div>
      <div className="explain"><strong>{STEPS[step].t}.</strong> {STEPS[step].d}</div>
      {step >= 2 && <div className="log"><div className={verdict.cls}>{verdict.text}</div></div>}

      <pre>{`# read a live chain yourself
openssl s_client -connect nico-tek.com:443 -servername nico-tek.com </dev/null | openssl x509 -noout -subject -issuer -dates

# local dev cert for ASP.NET Core (self-signed, then trusted by your Mac)
dotnet dev-certs https --trust`}</pre>
    </section>
  )
}

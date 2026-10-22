import { useState } from 'react'

const RECORDS = {
  A: 'name to an IPv4 address. The workhorse.',
  AAAA: 'name to an IPv6 address.',
  CNAME: 'name to another name. Not allowed at the zone apex (example.com itself).',
  ALIAS: 'Route 53 only. Apex-safe pointer to CloudFront, ALB or S3. Free queries.',
  MX: 'which servers accept mail for this domain.',
  TXT: 'free text. Domain verification, SPF, DKIM, DMARC.',
  NS: 'which name servers are authoritative for this zone.',
}

export default function DnsLab() {
  const [name, setName] = useState('miniting.nicolasroldos.com')
  const [ttl, setTtl] = useState(300)
  const [step, setStep] = useState(-1)
  const [cached, setCached] = useState(false)

  const parts = name.toLowerCase().split('.').filter(Boolean)
  const tld = parts[parts.length - 1] || 'com'
  const zone = parts.slice(-2).join('.')

  const hops = [
    { who: 'Your laptop', ip: 'stub resolver', say: `"Who is ${name}?" Checks its own cache first.` },
    { who: 'Recursive resolver', ip: '8.8.8.8 or your ISP', say: cached ? `Cache hit (TTL not expired). Answers immediately. No further hops.` : `Cache miss. Starts walking the tree from the top.` },
    { who: 'Root server', ip: 'a.root-servers.net', say: `"I don't know ${name}, but .${tld} is handled by these TLD servers."` },
    { who: `.${tld} TLD server`, ip: `a.gtld-servers.net`, say: `"I don't know the host, but ${zone} is served by these name servers." (the NS records you set at your registrar)` },
    { who: 'Authoritative (Route 53)', ip: 'ns-1234.awsdns-12.org', say: `"${name} is A 54.23.11.9, TTL ${ttl}s." Only this server actually knows.` },
    { who: 'Recursive resolver', ip: 'caches it', say: `Stores the answer for ${ttl} seconds and returns it to your laptop. Next lookup inside that window never leaves the resolver.` },
  ]
  const visible = cached ? hops.slice(0, 2) : hops

  return (
    <section className="lab">
      <header>
        <h2>DNS lab: where an answer actually comes from</h2>
        <p className="lead">Type a name, walk the resolution one hop at a time, then see what TTL does on the second lookup.</p>
      </header>
      <div className="row">
        <input type="text" value={name} onChange={e => { setName(e.target.value); setStep(-1) }} style={{ minWidth: 280 }} className="mono" />
        <label className="toggle">TTL <input type="number" value={ttl} min="1" onChange={e => setTtl(+e.target.value)} style={{ width: 80 }} /> s</label>
        <button className="btn" onClick={() => { setCached(false); setStep(0) }}>First lookup</button>
        <button className="btn secondary" onClick={() => { setCached(true); setStep(0) }}>Look up again (cached)</button>
        <button className="btn secondary" onClick={() => setStep(s => Math.min(visible.length - 1, s + 1))} disabled={step < 0 || step >= visible.length - 1}>Next hop</button>
      </div>
      <ol className="trace">
        {visible.map((h, i) => (
          <li key={i} className={i <= step ? 'active' : ''}>
            <div className="who">{h.who}<small>{h.ip}</small></div>
            <div>{h.say}</div>
          </li>
        ))}
      </ol>
      <div className="explain">
        <strong>TTL</strong> is why DNS changes "take time": every resolver on earth that cached your old answer keeps it until its timer runs out. Before a migration, drop the TTL to 60s a day ahead; after, raise it back to cut query volume. <strong>DNS rides on UDP 53</strong> (falls back to TCP for big answers), which is why a lookup costs one packet each way.
      </div>
      <h3>Record types you will get asked about</h3>
      <dl style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: '4px 12px', fontSize: 14 }}>
        {Object.entries(RECORDS).map(([k, v]) => <><dt key={k} className="mono" style={{ fontWeight: 600 }}>{k}</dt><dd key={k + 'd'} style={{ margin: 0, color: 'var(--ink-soft)' }}>{v}</dd></>)}
      </dl>
      <pre>{`dig +trace ${name}          # watch the root -> TLD -> Route 53 walk
dig ${name} +noall +answer  # just the answer and its TTL
dig @8.8.8.8 ${name}        # ask a specific resolver`}</pre>
    </section>
  )
}

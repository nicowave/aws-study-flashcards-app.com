import { useState } from 'react'

// The sender retries. Your handler either dedupes by event id (conditional write) or it doesn't.

const EVENTS = [
  { id: 'evt_7f3a', type: 'payment.succeeded', amount: '$49.00' },
  { id: 'evt_9c21', type: 'sensor.reading', amount: '121.3 V' },
  { id: 'evt_b048', type: 'payment.succeeded', amount: '$120.00' },
]

export default function IdempotencyLab() {
  const [idempotent, setIdempotent] = useState(false)
  const [rows, setRows] = useState([])
  const [emails, setEmails] = useState(0)
  const [log, setLog] = useState([])
  const [next, setNext] = useState(0)
  const [last, setLast] = useState(null)

  const push = (t, c) => setLog(l => [{ t, c }, ...l].slice(0, 12))

  function deliver(evt, isRetry) {
    const label = isRetry ? `retry of ${evt.id}` : `${evt.id} first delivery`
    if (idempotent) {
      // conditional write: attribute_not_exists(event_id)
      const exists = rows.some(r => r.id === evt.id)
      if (exists) { push(`${label}: ConditionalCheckFailed -> already processed, no-op, return 200`, 'ok'); return }
      setRows(r => [...r, { ...evt, dupe: false }])
      setEmails(e => e + 1)
      push(`${label}: PutItem OK (condition passed) -> fulfil, send email, return 200`, 'ok')
    } else {
      const dupe = rows.some(r => r.id === evt.id)
      setRows(r => [...r, { ...evt, dupe }])
      setEmails(e => e + 1)
      push(`${label}: inserted row, sent email${dupe ? '  <- DUPLICATE. Customer charged/emailed twice.' : ''}`, dupe ? 'bad' : 'ok')
    }
  }

  function sendNew() {
    const evt = EVENTS[next % EVENTS.length]
    setLast(evt); setNext(n => n + 1)
    deliver(evt, false)
  }
  function retry() { if (last) { push(`network blip: sender never saw our 200, so it resends ${last.id}`, 'warn'); deliver(last, true) } }
  function reset() { setRows([]); setEmails(0); setLog([]); setNext(0); setLast(null) }

  return (
    <section className="lab">
      <header>
        <h2>Idempotency lab: the sender will retry. What does your handler do?</h2>
        <p className="lead">Stripe, SQS, MQTT QoS 1 and every sensor with a retry loop deliver "at least once". Deliver an event, then hit retry a few times. Flip the switch and do it again.</p>
      </header>
      <div className="row">
        <label className="toggle"><input type="checkbox" checked={idempotent} onChange={e => { setIdempotent(e.target.checked); reset() }} /> Idempotent handler (conditional write on event_id)</label>
        <button className="btn" onClick={sendNew}>Deliver new event</button>
        <button className="btn secondary" onClick={retry} disabled={!last}>Sender retries last event</button>
        <button className="btn secondary" onClick={reset}>Reset</button>
      </div>
      <div className="row mono" style={{ fontSize: 13, color: 'var(--ink-soft)' }}>
        <span>rows in DynamoDB: {rows.length}</span>
        <span>emails sent: {emails}</span>
        <span style={{ color: rows.some(r => r.dupe) ? 'var(--bad)' : 'var(--ok)' }}>duplicates stored: {rows.filter(r => r.dupe).length}</span>
      </div>
      <table>
        <thead><tr><th>event_id</th><th>type</th><th>value</th><th>status</th></tr></thead>
        <tbody>
          {rows.length === 0 && <tr><td colSpan="4" style={{ color: 'var(--ink-soft)' }}>Table is empty. Deliver an event.</td></tr>}
          {rows.map((r, i) => <tr key={i} className={r.dupe ? 'dupe' : ''}><td className="mono">{r.id}</td><td>{r.type}</td><td className="mono">{r.amount}</td><td>{r.dupe ? 'duplicate row' : 'processed'}</td></tr>)}
        </tbody>
      </table>
      <div className="log" style={{ marginTop: 12 }}>{log.map((l, i) => <div key={i} className={l.c}>{l.t}</div>)}</div>
      <div className="explain">
        <strong>The rule:</strong> key every event by its unique id and write it with a condition <code>attribute_not_exists(event_id)</code> before doing any work. First arrival passes and does the work. Duplicates fail the condition, do nothing, and still return 200 so the sender stops retrying. Same result no matter how many times the event lands. That is idempotency, and it is the same rule for a Stripe webhook and a sensor reading.
      </div>
      <pre>{`# Python / boto3 (what the nico-tek.com Stripe backend does)
table.put_item(
    Item={"event_id": evt["id"], "type": evt["type"], "received_at": now},
    ConditionExpression="attribute_not_exists(event_id)",
)  # raises ConditionalCheckFailedException on a duplicate -> return 200, do nothing

// C# / EF Core equivalent: unique index on EventId, catch DbUpdateException on insert
modelBuilder.Entity<SensorEvent>().HasIndex(e => new { e.Serial, e.Seq }).IsUnique();`}</pre>
    </section>
  )
}

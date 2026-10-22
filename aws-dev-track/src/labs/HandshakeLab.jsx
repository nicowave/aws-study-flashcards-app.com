import { useState, useRef, useEffect } from 'react'

// A tiny simulator: a fake sensor talks to a fake server over TCP or UDP.
// You can drop packets and watch what each protocol does about it.

const sleep = ms => new Promise(r => setTimeout(r, ms))

export default function HandshakeLab() {
  const [proto, setProto] = useState('tcp')
  const [loss, setLoss] = useState(0)
  const [running, setRunning] = useState(false)
  const [packet, setPacket] = useState(null) // {label, dir, lost}
  const [log, setLog] = useState([])
  const [stats, setStats] = useState({ sent: 0, delivered: 0, retransmits: 0, ms: 0 })
  const abort = useRef(false)
  useEffect(() => () => { abort.current = true }, [])

  const push = (text, cls) => setLog(l => [...l, { text, cls }])

  async function send(label, dir, canFail = true) {
    if (abort.current) throw new Error('aborted')
    const lost = canFail && Math.random() * 100 < loss
    setPacket({ label, dir, lost: false, moved: false, key: Math.random() })
    setStats(s => ({ ...s, sent: s.sent + 1, ms: s.ms + 40 }))
    await sleep(40)
    setPacket(p => p && { ...p, moved: true })
    await sleep(950)
    if (lost) { setPacket(p => ({ ...p, lost: true })); push(`${label}  x  dropped in transit`, 'bad'); await sleep(600); return false }
    setStats(s => ({ ...s, delivered: s.delivered + 1 }))
    push(`${dir === 'right' ? 'sensor -> server' : 'server -> sensor'}  ${label}`, 'ok')
    return true
  }

  async function run() {
    abort.current = false
    setRunning(true); setLog([]); setStats({ sent: 0, delivered: 0, retransmits: 0, ms: 0 })
    try {
      if (proto === 'tcp') {
        push('TCP: open a connection first (3-way handshake)', 'warn')
        // handshake with retries
        while (!(await send('SYN seq=100', 'right'))) { push('no SYN-ACK... retransmit SYN', 'warn'); setStats(s => ({ ...s, retransmits: s.retransmits + 1 })) }
        while (!(await send('SYN-ACK seq=300 ack=101', 'left'))) { push('client resends SYN, server resends SYN-ACK', 'warn'); setStats(s => ({ ...s, retransmits: s.retransmits + 1 })) }
        await send('ACK ack=301', 'right', false)
        push('connection ESTABLISHED. Now the readings, in order, every one acknowledged.', 'warn')
        for (let i = 1; i <= 3; i++) {
          while (!(await send(`DATA reading#${i}`, 'right'))) { push(`reading#${i} not ACKed -> retransmit (later readings wait)`, 'warn'); setStats(s => ({ ...s, retransmits: s.retransmits + 1 })) }
          await send(`ACK reading#${i}`, 'left', false)
        }
        push('server has readings 1, 2, 3 in order. Guaranteed, but every loss cost a round trip.', 'ok')
      } else {
        push('UDP: no handshake. Just start throwing readings.', 'warn')
        for (let i = 1; i <= 5; i++) {
          const ok = await send(`reading#${i}`, 'right')
          if (!ok) push(`reading#${i} gone forever. Nobody retries. Next one is coming anyway.`, 'warn')
        }
        push('server has whatever arrived. Fast, stateless, lossy. Fine for heartbeats; not for a firmware download.', 'ok')
      }
    } catch (e) { /* aborted */ }
    setPacket(null); setRunning(false)
  }

  return (
    <section className="lab">
      <header>
        <h2>Handshake lab: TCP vs UDP under packet loss</h2>
        <p className="lead">Pick a protocol, set how unreliable the network is, and run. Watch what each one does when a packet dies.</p>
      </header>
      <div className="row">
        <label className="toggle"><input type="radio" checked={proto === 'tcp'} onChange={() => setProto('tcp')} disabled={running} /> TCP (reliable, ordered)</label>
        <label className="toggle"><input type="radio" checked={proto === 'udp'} onChange={() => setProto('udp')} disabled={running} /> UDP (fire and forget)</label>
        <label className="toggle">Packet loss <input type="range" min="0" max="60" value={loss} onChange={e => setLoss(+e.target.value)} disabled={running} /> <span className="mono">{loss}%</span></label>
        <button className="btn" onClick={run} disabled={running}>{running ? 'Running...' : 'Run'}</button>
      </div>

      <div className="wire">
        <div className="endpoint client">Sensor<small>10.0.0.42</small></div>
        <div className="endpoint server">Server<small>10.0.0.1:5001</small></div>
        <div className="lane">
          {packet && (
            <div key={packet.key} className={`packet ${packet.dir} ${packet.lost ? 'lost' : ''}`}
                 style={{ left: (packet.dir === 'right') === packet.moved ? 'calc(100% - 180px)' : '0', top: 40 }}>
              {packet.label}
            </div>
          )}
        </div>
      </div>

      <div className="row mono" style={{ fontSize: 13, color: 'var(--ink-soft)' }}>
        <span>sent {stats.sent}</span><span>delivered {stats.delivered}</span><span>retransmits {stats.retransmits}</span>
      </div>
      <div className="log" aria-live="polite">{log.map((l, i) => <div key={i} className={l.cls}>{l.text}</div>)}</div>

      <div className="explain">
        <strong>SYN</strong> = synchronize, <strong>ACK</strong> = acknowledge. Three messages let both sides agree on sequence numbers, so from then on every byte can be counted, acknowledged and resent. That is what "reliable" means. <strong>UDP</strong> skips all of it: no setup latency, no connection state on the server, no head-of-line blocking, and no promises. Sensors use UDP for heartbeats and high-rate telemetry, TCP (or MQTT over TCP) when every message must land.
      </div>
      <pre>{`# see it for real on your Mac while the MiniTing simulator runs
sudo tcpdump -i any port 5001      # [S] SYN   [S.] SYN-ACK   [.] ACK
sudo tcpdump -i any udp port 5000  # no flags, just datagrams`}</pre>
    </section>
  )
}

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import HandshakeLab from './HandshakeLab';

// The lab animates each packet with setTimeout and decides loss with Math.random.
// Fake only setTimeout, and feed Math.random a planned sequence.
//
// Each packet that can be lost draws Math.random twice (the loss roll, then an animation key);
// a packet that can't be lost (ACKs) draws once. A roll of DROP is below any loss % > 0, a roll
// of KEEP is above every loss % the slider allows (max 60), so KEEP is also safe for the keys.
const DROP = 0;
const KEEP = 0.999;
const planRandom = (rolls) => {
  const queue = [...rolls];
  vi.spyOn(Math, 'random').mockImplementation(() => (queue.length ? queue.shift() : KEEP));
};
// TCP: SYN, SYN-ACK, final ACK, then for each reading DATA + its ACK. `drops` = how many times
// each fallible packet is lost before it gets through.
const tcpPlan = ({ syn = 0, synAck = 0, data = {} } = {}) => {
  const q = [];
  const fallible = (n) => { for (let k = 0; k < n; k++) q.push(DROP, KEEP); q.push(KEEP, KEEP); };
  fallible(syn);
  fallible(synAck);
  q.push(KEEP); // final ACK
  for (let i = 1; i <= 3; i++) { fallible(data[i] || 0); q.push(KEEP); }
  return q;
};
// UDP: readings 1..5, each one fallible.
const udpPlan = (lost = []) => [1, 2, 3, 4, 5].flatMap((i) => [lost.includes(i) ? DROP : KEEP, KEEP]);

const radio = (name) => screen.getByRole('radio', { name });
const slider = () => screen.getByRole('slider');
const setLoss = (pct) => fireEvent.change(slider(), { target: { value: String(pct) } });
const runButton = () => screen.getByRole('button', { name: /Run/ });
const logLines = () => [...document.querySelector('[aria-live="polite"]').children].map((d) => d.textContent);
const delivered = () => logLines().filter((l) => /^(sensor -> server|server -> sensor) {2}/.test(l));
const stats = () => {
  const n = (label) => Number(screen.getByText(new RegExp(`^${label} \\d+$`)).textContent.split(' ')[1]);
  return { sent: n('sent'), delivered: n('delivered'), retransmits: n('retransmits') };
};
const runToEnd = async () => {
  fireEvent.click(runButton());
  await act(() => vi.runAllTimersAsync());
  expect(runButton()).toHaveTextContent(/^Run$/);
};

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
});

describe('HandshakeLab controls', () => {
  it('starts on TCP with 0% loss', () => {
    render(<HandshakeLab />);
    expect(radio(/TCP/)).toBeChecked();
    expect(radio(/UDP/)).not.toBeChecked();
    expect(slider()).toHaveValue('0');
    expect(screen.getByText('0%')).toBeInTheDocument();
  });

  it('the slider sets packet loss between 0 and 60%', () => {
    render(<HandshakeLab />);
    expect(slider()).toHaveAttribute('min', '0');
    expect(slider()).toHaveAttribute('max', '60');
    setLoss(35);
    expect(screen.getByText('35%')).toBeInTheDocument();
  });

  it('locks protocol and loss while a run is in progress', async () => {
    planRandom([]);
    render(<HandshakeLab />);
    fireEvent.click(runButton());
    expect(runButton()).toHaveTextContent('Running...');
    expect(runButton()).toBeDisabled();
    expect(radio(/TCP/)).toBeDisabled();
    expect(radio(/UDP/)).toBeDisabled();
    expect(slider()).toBeDisabled();
    await act(() => vi.runAllTimersAsync());
    expect(runButton()).toBeEnabled();
    expect(slider()).toBeEnabled();
  });

  it('stops cleanly if the lab is closed mid-run', async () => {
    planRandom([]);
    const errors = vi.spyOn(console, 'error');
    const { unmount } = render(<HandshakeLab />);
    fireEvent.click(runButton());
    await act(() => vi.advanceTimersByTimeAsync(1000));
    unmount();
    await act(() => vi.runAllTimersAsync());
    expect(vi.getTimerCount()).toBe(0);
    expect(errors).not.toHaveBeenCalled();
  });
});

describe('HandshakeLab TCP', () => {
  it('opens with the 3-way handshake SYN -> SYN-ACK -> ACK, in the right directions, before any data', async () => {
    planRandom(tcpPlan());
    render(<HandshakeLab />);
    await runToEnd();
    const d = delivered();
    expect(d.slice(0, 3)).toEqual([
      expect.stringMatching(/^sensor -> server {2}SYN seq=\d+$/),
      expect.stringMatching(/^server -> sensor {2}SYN-ACK seq=\d+ ack=\d+$/),
      expect.stringMatching(/^sensor -> server {2}ACK ack=\d+$/),
    ]);
    const all = logLines();
    const established = all.findIndex((l) => /ESTABLISHED/.test(l));
    expect(established).toBeGreaterThan(all.indexOf(d[2]));
    expect(established).toBeLessThan(all.findIndex((l) => /DATA/.test(l)));
  });

  it('acknowledges sequence numbers correctly: SYN-ACK acks client ISN+1, the final ACK acks server ISN+1', async () => {
    planRandom(tcpPlan());
    render(<HandshakeLab />);
    await runToEnd();
    const [syn, synAck, ack] = delivered();
    const clientIsn = Number(syn.match(/seq=(\d+)/)[1]);
    const [, serverIsn, ackOfSyn] = synAck.match(/seq=(\d+) ack=(\d+)/).map(Number);
    const finalAck = Number(ack.match(/ack=(\d+)/)[1]);
    expect(ackOfSyn).toBe(clientIsn + 1);
    expect(finalAck).toBe(serverIsn + 1);
  });

  it('with no loss, delivers readings 1, 2, 3 in order, each acknowledged, with no retransmits', async () => {
    planRandom(tcpPlan());
    render(<HandshakeLab />);
    await runToEnd();
    expect(delivered().slice(3)).toEqual([
      'sensor -> server  DATA reading#1', 'server -> sensor  ACK reading#1',
      'sensor -> server  DATA reading#2', 'server -> sensor  ACK reading#2',
      'sensor -> server  DATA reading#3', 'server -> sensor  ACK reading#3',
    ]);
    expect(stats()).toEqual({ sent: 9, delivered: 9, retransmits: 0 });
  });

  it('0% loss never drops a packet, whatever the random roll', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    render(<HandshakeLab />);
    await runToEnd();
    expect(logLines().some((l) => /dropped/.test(l))).toBe(false);
    expect(stats()).toEqual({ sent: 9, delivered: 9, retransmits: 0 });
  });

  it('a lost SYN is retransmitted, then the handshake completes', async () => {
    planRandom(tcpPlan({ syn: 1 }));
    render(<HandshakeLab />);
    setLoss(30);
    await runToEnd();
    const all = logLines();
    const drop = all.findIndex((l) => /^SYN seq=\d+ {2}x {2}dropped in transit$/.test(l));
    expect(drop).toBeGreaterThan(-1);
    expect(all[drop + 1]).toMatch(/retransmit SYN/);
    expect(all[drop + 2]).toMatch(/^sensor -> server {2}SYN seq=/);
    expect(stats()).toEqual({ sent: 10, delivered: 9, retransmits: 1 });
  });

  it('a lost SYN-ACK is resent before the final ACK', async () => {
    planRandom(tcpPlan({ synAck: 1 }));
    render(<HandshakeLab />);
    setLoss(30);
    await runToEnd();
    const all = logLines();
    const drop = all.findIndex((l) => /^SYN-ACK .* dropped in transit$/.test(l));
    expect(drop).toBeGreaterThan(-1);
    expect(all[drop + 1]).toMatch(/resends SYN-ACK/);
    expect(delivered().slice(0, 3).map((l) => l.split('  ')[1].split(' ')[0])).toEqual(['SYN', 'SYN-ACK', 'ACK']);
    expect(stats().retransmits).toBe(1);
  });

  it('a lost reading is retransmitted until it lands, later readings wait, and all arrive in order', async () => {
    planRandom(tcpPlan({ data: { 2: 2 } }));
    render(<HandshakeLab />);
    setLoss(50);
    await runToEnd();
    const all = logLines();
    expect(all.filter((l) => /^DATA reading#2 {2}x {2}dropped/.test(l))).toHaveLength(2);
    expect(all.filter((l) => /reading#2 not ACKed -> retransmit/.test(l))).toHaveLength(2);
    // reading#3 isn't sent until reading#2 is delivered and acknowledged (head-of-line)
    const ack2 = all.indexOf('server -> sensor  ACK reading#2');
    const firstR3 = all.findIndex((l) => /reading#3/.test(l));
    expect(firstR3).toBeGreaterThan(ack2);
    const readings = delivered().filter((l) => /DATA/.test(l)).map((l) => l.match(/#(\d)/)[1]);
    expect(readings).toEqual(['1', '2', '3']);
    expect(stats()).toEqual({ sent: 11, delivered: 9, retransmits: 2 });
    expect(all.at(-1)).toMatch(/in order/);
  });

  it('every reading arrives exactly once however many packets are lost', async () => {
    planRandom(tcpPlan({ syn: 2, synAck: 1, data: { 1: 1, 2: 3, 3: 1 } }));
    render(<HandshakeLab />);
    setLoss(60);
    await runToEnd();
    const readings = delivered().filter((l) => /DATA/.test(l));
    expect(readings).toEqual(['sensor -> server  DATA reading#1', 'sensor -> server  DATA reading#2', 'sensor -> server  DATA reading#3']);
    const drops = 2 + 1 + 1 + 3 + 1;
    expect(stats()).toEqual({ sent: 9 + drops, delivered: 9, retransmits: drops });
  });
});

describe('HandshakeLab UDP', () => {
  const runUdp = async (lost, loss) => {
    planRandom(udpPlan(lost));
    render(<HandshakeLab />);
    fireEvent.click(radio(/UDP/));
    setLoss(loss);
    await runToEnd();
  };

  it('sends readings with no handshake and no ACKs', async () => {
    await runUdp([], 0);
    const all = logLines();
    expect(all.some((l) => /SYN|ACK/.test(l))).toBe(false);
    expect(all[0]).toMatch(/no handshake/);
    expect(delivered()).toEqual([1, 2, 3, 4, 5].map((i) => `sensor -> server  reading#${i}`));
    expect(stats()).toEqual({ sent: 5, delivered: 5, retransmits: 0 });
  });

  it('a lost datagram is gone: nobody retries and the rest still go out', async () => {
    await runUdp([2, 4], 40);
    const all = logLines();
    expect(delivered()).toEqual([1, 3, 5].map((i) => `sensor -> server  reading#${i}`));
    expect(all.filter((l) => /reading#2/.test(l))).toEqual([
      'reading#2  x  dropped in transit',
      expect.stringMatching(/gone forever\. Nobody retries/),
    ]);
    expect(stats()).toEqual({ sent: 5, delivered: 3, retransmits: 0 });
  });

  it('the loss roll is strict: at 60% a 0.59 roll drops and a 0.60 roll delivers', async () => {
    planRandom([0.59, KEEP, 0.6, KEEP, 0.59, KEEP, 0.6, KEEP, 0.6, KEEP]);
    render(<HandshakeLab />);
    fireEvent.click(radio(/UDP/));
    setLoss(60);
    await runToEnd();
    expect(delivered()).toEqual([2, 4, 5].map((i) => `sensor -> server  reading#${i}`));
  });

  it('switching back to TCP runs the handshake again', async () => {
    await runUdp([], 0);
    fireEvent.click(radio(/TCP/));
    planRandom(tcpPlan());
    await runToEnd();
    expect(delivered()[0]).toMatch(/SYN seq=/);
  });
});

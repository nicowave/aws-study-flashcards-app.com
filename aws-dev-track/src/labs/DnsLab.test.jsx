import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DnsLab from './DnsLab';

const nameBox = () => screen.getByRole('textbox');
const ttlBox = () => screen.getByRole('spinbutton', { name: /TTL/ });
const hops = () => screen.getAllByRole('listitem');
const whos = () => hops().map((li) => li.querySelector('.who').firstChild.textContent);
const active = () => hops().map((li) => li.classList.contains('active'));
const hopText = (i) => hops()[i].textContent;
const btn = (name) => screen.getByRole('button', { name });

const setName = (value) => fireEvent.change(nameBox(), { target: { value } });
const stepToEnd = async (user) => {
  while (!btn('Next hop').disabled) await user.click(btn('Next hop'));
};

describe('DnsLab', () => {
  // Must stay first: React prints each missing-key warning only once per component per run.
  // Regression: the record-type list used keyless bare fragments (React key warning); it now uses <Fragment key>.
  it('renders without React key warnings', () => {
    const errors = vi.spyOn(console, 'error').mockImplementation(() => {});
    render(<DnsLab />);
    const keyWarnings = errors.mock.calls.filter((args) => String(args[0]).includes('unique "key"'));
    expect(keyWarnings).toEqual([]);
  });

  it('first lookup walks stub -> recursive resolver -> root -> TLD -> authoritative, then caches', () => {
    render(<DnsLab />);
    fireEvent.click(btn('First lookup'));
    const order = whos();
    expect(order).toHaveLength(6);
    expect(order[0]).toMatch(/laptop/i);
    expect(order[1]).toMatch(/Recursive resolver/);
    expect(order[2]).toMatch(/Root server/);
    expect(order[3]).toMatch(/TLD server/);
    expect(order[4]).toMatch(/Authoritative/);
    expect(order[5]).toMatch(/Recursive resolver/);
    expect(hopText(1)).toMatch(/Cache miss/);
    expect(hopText(5)).toMatch(/caches it|Stores the answer/);
  });

  it('each hop refers the resolver one level down the tree for the typed name', () => {
    render(<DnsLab />);
    setName('status.nico-tek.io');
    fireEvent.click(btn('First lookup'));
    expect(hopText(2)).toContain('.io is handled by these TLD servers');
    expect(whos()[3]).toBe('.io TLD server');
    expect(hopText(3)).toContain('nico-tek.io is served by these name servers');
    expect(hopText(3)).toMatch(/NS records/);
    expect(hopText(4)).toContain('status.nico-tek.io is A');
    expect(hopText(4)).toMatch(/Only this server actually knows/);
  });

  it('reads the TLD case-insensitively', () => {
    render(<DnsLab />);
    setName('API.Example.COM');
    fireEvent.click(btn('First lookup'));
    expect(whos()[3]).toBe('.com TLD server');
    expect(hopText(3)).toContain('example.com is served by');
  });

  it('the authoritative answer is an IPv4 A record with the chosen TTL, and the resolver caches it for that TTL', () => {
    render(<DnsLab />);
    fireEvent.change(ttlBox(), { target: { value: '60' } });
    fireEvent.click(btn('First lookup'));
    const answer = hopText(4).match(/is A (\d+\.\d+\.\d+\.\d+), TTL (\d+)s/);
    expect(answer).not.toBeNull();
    expect(answer[1].split('.').map(Number).every((o) => o >= 0 && o <= 255)).toBe(true);
    expect(answer[2]).toBe('60');
    expect(hopText(5)).toContain('Stores the answer for 60 seconds');
  });

  it('Next hop lights the hops one at a time, in order, and stops at the last', async () => {
    const user = userEvent.setup();
    render(<DnsLab />);
    expect(btn('Next hop')).toBeDisabled();
    expect(active().some(Boolean)).toBe(false);
    await user.click(btn('First lookup'));
    expect(active()).toEqual([true, false, false, false, false, false]);
    for (let k = 1; k < 6; k++) {
      await user.click(btn('Next hop'));
      expect(active()).toEqual([0, 1, 2, 3, 4, 5].map((i) => i <= k));
    }
    expect(btn('Next hop')).toBeDisabled();
  });

  it('a repeat lookup inside the TTL is answered by the resolver from cache: no root, TLD or authoritative hop', async () => {
    const user = userEvent.setup();
    render(<DnsLab />);
    await user.click(btn('First lookup'));
    await stepToEnd(user);
    await user.click(btn('Look up again (cached)'));
    expect(whos()).toHaveLength(2);
    expect(whos()[0]).toMatch(/laptop/i);
    expect(whos()[1]).toMatch(/Recursive resolver/);
    expect(hopText(1)).toMatch(/Cache hit/);
    expect(hopText(1)).toMatch(/No further hops/);
    expect(screen.queryByText(/Root server/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Authoritative/)).not.toBeInTheDocument();
    expect(active()).toEqual([true, false]);
    await stepToEnd(user);
    expect(active()).toEqual([true, true]);

    // and a fresh first lookup walks the whole tree again
    await user.click(btn('First lookup'));
    expect(whos()).toHaveLength(6);
  });

  it('editing the name restarts the walk', async () => {
    const user = userEvent.setup();
    render(<DnsLab />);
    await user.click(btn('First lookup'));
    await user.click(btn('Next hop'));
    setName('other.example.com');
    expect(active().some(Boolean)).toBe(false);
    expect(btn('Next hop')).toBeDisabled();
  });

  it('teaches that DNS uses UDP 53 with TCP fallback, and the dig commands use the typed name', () => {
    render(<DnsLab />);
    expect(screen.getByText(/DNS rides on UDP 53/)).toBeInTheDocument();
    expect(screen.getByText(/falls back to TCP/)).toBeInTheDocument();
    setName('status.nico-tek.io');
    const pre = screen.getByText(/dig \+trace/).textContent;
    expect(pre).toContain('dig +trace status.nico-tek.io');
    expect(pre).toContain('dig @8.8.8.8 status.nico-tek.io');
  });

  it('record types: CNAME is not allowed at the zone apex; ALIAS is the apex-safe Route 53 option', () => {
    render(<DnsLab />);
    const def = (term) => screen.getByText(term, { selector: 'dt' }).nextElementSibling.textContent;
    expect(def('A')).toMatch(/IPv4/);
    expect(def('AAAA')).toMatch(/IPv6/);
    expect(def('CNAME')).toMatch(/Not allowed at the zone apex/);
    expect(def('ALIAS')).toMatch(/Apex-safe/);
    expect(def('MX')).toMatch(/mail/);
    expect(def('NS')).toMatch(/authoritative/);
  });

  // Regression: the TLD hop used to name a.gtld-servers.net (.com/.net only) for every TLD, .org included.
  it('does not name the .com/.net gTLD servers for a .org name', () => {
    render(<DnsLab />);
    setName('sensors.example.org');
    fireEvent.click(btn('First lookup'));
    expect(whos()[3]).toBe('.org TLD server');
    expect(hops()[3].querySelector('small').textContent).not.toBe('a.gtld-servers.net');
  });

  // Regression: "Look up again (cached)" used to hit the cache for never-resolved names; now only resolved names hit.
  it('a name that was never looked up is not served from cache', async () => {
    const user = userEvent.setup();
    render(<DnsLab />);
    await user.click(btn('First lookup'));
    setName('never-seen.example.com');
    await user.click(btn('Look up again (cached)'));
    expect(hopText(1)).not.toMatch(/Cache hit/);
  });
});

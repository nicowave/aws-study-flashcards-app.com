import { describe, it, expect } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TlsLab from './TlsLab';

const ROLES = { leaf: 'Leaf (server) cert', intermediate: 'Intermediate CA', root: 'Root CA' };
const REQUESTED_HOST = 'api.example.com'; // the hostname the lab's client asks for (SNI)

const card = (name) => screen.getByRole('heading', { name }).closest('.cert');
const field = (name, label) => {
  const dt = within(card(name)).getByText(label, { selector: 'dt' });
  return dt.nextElementSibling.textContent;
};
const cert = (name) => ({
  subject: field(name, 'subject'),
  issuer: field(name, 'issuer'),
  valid: field(name, 'valid'),
});
const stepLabel = () => screen.getByText(/^step \d+ of \d+$/).textContent;
const stepTitle = () => screen.getByText(/^step \d+ of \d+$/).closest('.row').nextElementSibling.querySelector('strong').textContent;
const verdict = () => document.querySelector('.log');

// Click "Next step" until the explain box shows the chain-verification step.
const goToVerification = async (user) => {
  for (let k = 0; k < 10 && stepTitle() !== 'Chain verification.'; k++) {
    await user.click(screen.getByRole('button', { name: 'Next step' }));
  }
  expect(stepTitle()).toBe('Chain verification.');
};
const pick = (user, label) => user.selectOptions(screen.getByRole('combobox'), screen.getByRole('option', { name: label }));

describe('TlsLab handshake steps', () => {
  it('walks Client Hello -> Server Hello + chain -> verification -> key exchange -> encrypted data', async () => {
    const user = userEvent.setup();
    render(<TlsLab />);
    const titles = [stepTitle()];
    expect(screen.getByRole('button', { name: 'Back' })).toBeDisabled();
    while (!screen.getByRole('button', { name: 'Next step' }).disabled) {
      await user.click(screen.getByRole('button', { name: 'Next step' }));
      titles.push(stepTitle());
    }
    expect(titles.map((t) => t.replace(/\.$/, ''))).toEqual([
      'Client Hello',
      'Server Hello + certificate chain',
      'Chain verification',
      'Key exchange (ECDHE)',
      'Encrypted application data',
    ]);
    expect(stepLabel()).toBe(`step ${titles.length} of ${titles.length}`);
    await user.click(screen.getByRole('button', { name: 'Back' }));
    expect(stepTitle()).toBe('Key exchange (ECDHE).');
  });

  it('teaches SNI, that the root is not sent, and forward secrecy', async () => {
    const user = userEvent.setup();
    render(<TlsLab />);
    expect(screen.getByText(/hostname I want \(SNI\)/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Next step' }));
    expect(screen.getByText(/does not send the root/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Next step' }));
    await user.click(screen.getByRole('button', { name: 'Next step' }));
    expect(screen.getByText(/forward secrecy/)).toBeInTheDocument();
  });

  it('gives no verdict until the client has verified the chain', async () => {
    const user = userEvent.setup();
    render(<TlsLab />);
    await user.click(screen.getByRole('button', { name: 'Next step' }));
    expect(verdict()).toBeNull();
    await goToVerification(user);
    expect(verdict()).not.toBeNull();
  });
});

describe('TlsLab chain verification', () => {
  it('valid chain: each cert is issued by the next one up, the root signs itself, and it verifies', async () => {
    const user = userEvent.setup();
    render(<TlsLab />);
    const leaf = cert(ROLES.leaf);
    const inter = cert(ROLES.intermediate);
    const root = cert(ROLES.root);
    expect(leaf.subject).toBe(REQUESTED_HOST);
    expect(leaf.issuer).toBe(inter.subject);
    expect(inter.issuer).toBe(root.subject);
    expect(root.issuer).toContain(root.subject);
    expect(root.issuer).toMatch(/self-signed/);

    await goToVerification(user);
    expect(verdict()).toHaveTextContent(/Chain verified/);
    expect(verdict().firstChild).toHaveClass('ok');
    for (const name of Object.values(ROLES)) {
      expect(card(name)).toHaveClass('verified');
      expect(card(name)).not.toHaveClass('broken');
    }
  });

  it('expired leaf: the leaf validity ended in the past and verification fails on the dates', async () => {
    const user = userEvent.setup();
    render(<TlsLab />);
    await pick(user, 'Expired leaf');
    const { subject, valid } = cert(ROLES.leaf);
    expect(subject).toBe(REQUESTED_HOST); // right name, wrong dates
    const [, notAfter] = valid.match(/to (\d{4}-\d{2}-\d{2})/);
    expect(new Date(`${notAfter}T23:59:59Z`).getTime()).toBeLessThan(Date.now());

    await goToVerification(user);
    expect(verdict()).toHaveTextContent(/expired/i);
    expect(verdict().firstChild).toHaveClass('bad');
    expect(card(ROLES.leaf)).toHaveClass('broken');
    expect(card(ROLES.intermediate)).not.toHaveClass('broken');
    expect(card(ROLES.root)).not.toHaveClass('broken');
    expect(card(ROLES.leaf)).not.toHaveClass('verified');
  });

  it('hostname mismatch: the leaf is for another name and verification fails on the name', async () => {
    const user = userEvent.setup();
    render(<TlsLab />);
    await pick(user, 'Hostname mismatch');
    const leaf = cert(ROLES.leaf);
    expect(leaf.subject).not.toBe(REQUESTED_HOST);
    expect(leaf.issuer).toBe(cert(ROLES.intermediate).subject); // chain itself is fine

    await goToVerification(user);
    expect(verdict()).toHaveTextContent(leaf.subject);
    expect(verdict()).toHaveTextContent(REQUESTED_HOST);
    expect(verdict()).toHaveTextContent(/wrong name/i);
    expect(verdict().firstChild).toHaveClass('bad');
    expect(card(ROLES.leaf)).toHaveClass('broken');
    expect(card(ROLES.intermediate)).not.toHaveClass('broken');
  });

  it('self-signed: the leaf names itself as issuer and verification fails for lack of a trusted issuer', async () => {
    const user = userEvent.setup();
    render(<TlsLab />);
    await pick(user, 'Self-signed cert');
    const leaf = cert(ROLES.leaf);
    expect(leaf.issuer).toContain(leaf.subject);
    expect(leaf.issuer).toMatch(/self-signed/);

    await goToVerification(user);
    expect(verdict()).toHaveTextContent(/No trusted issuer/);
    expect(verdict()).toHaveTextContent(/Encryption would still work/);
    expect(verdict().firstChild).toHaveClass('bad');
    for (const name of Object.values(ROLES)) expect(card(name)).not.toHaveClass('verified');
  });

  // BUG: in the self-signed scenario the red "broken" marker goes on the Intermediate CA card
  // (TlsLab.jsx: `scenario === 'selfsigned' ? 1`), which the same scenario greys out as not part
  // of the chain. The cert that fails is the leaf: it signed itself and isn't in the trust store.
  it.fails('self-signed: the leaf, not the intermediate, is marked as the cert that failed', async () => {
    const user = userEvent.setup();
    render(<TlsLab />);
    await pick(user, 'Self-signed cert');
    await goToVerification(user);
    expect(card(ROLES.leaf)).toHaveClass('broken');
    expect(card(ROLES.intermediate)).not.toHaveClass('broken');
  });

  // BUG: every card's "valid" row says "90 days, auto-renewed", including the intermediate and
  // the root. Only the Let's Encrypt leaf is short-lived; intermediates last years and roots
  // (ISRG Root X1) decades, which is why the root can sit in the OS trust store.
  it.fails('only the leaf is described as a 90-day auto-renewed cert', () => {
    render(<TlsLab />);
    expect(cert(ROLES.leaf).valid).toMatch(/90 days/);
    expect(cert(ROLES.intermediate).valid).not.toMatch(/90 days|auto-renewed/);
    expect(cert(ROLES.root).valid).not.toMatch(/90 days|auto-renewed/);
  });

  it('changing the scenario restarts the handshake', async () => {
    const user = userEvent.setup();
    render(<TlsLab />);
    await goToVerification(user);
    await pick(user, 'Expired leaf');
    expect(stepTitle()).toBe('Client Hello.');
    expect(verdict()).toBeNull();
  });
});

describe('TlsLab mTLS', () => {
  it('off by default: only the server proves who it is', () => {
    render(<TlsLab />);
    expect(screen.getByRole('checkbox', { name: /mTLS/ })).not.toBeChecked();
    expect(screen.queryByRole('heading', { name: /Client \(device\) cert/ })).not.toBeInTheDocument();
  });

  it('on: the client presents a device cert from its own CA, which the server verifies', async () => {
    const user = userEvent.setup();
    render(<TlsLab />);
    await user.click(screen.getByRole('checkbox', { name: /mTLS/ }));
    const device = screen.getByRole('heading', { name: /Client \(device\) cert/ }).closest('.cert');
    const subject = within(device).getByText('subject').nextElementSibling.textContent;
    const issuer = within(device).getByText('issuer').nextElementSibling.textContent;
    expect(subject).not.toBe(REQUESTED_HOST);
    expect(issuer).not.toBe(subject); // issued by a device CA, not self-signed
    // and not by the public web CA: the fleet runs its own private CA
    expect(issuer).not.toBe(cert(ROLES.intermediate).subject);
    expect(within(device).getByText(/server verifies the device/)).toBeInTheDocument();
    expect(within(device).getByText(/refused before any API code runs/)).toBeInTheDocument();

    await user.click(screen.getByRole('checkbox', { name: /mTLS/ }));
    expect(screen.queryByRole('heading', { name: /Client \(device\) cert/ })).not.toBeInTheDocument();
  });
});

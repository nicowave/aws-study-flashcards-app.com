import { describe, it, expect } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import IdempotencyLab from './IdempotencyLab';

const btn = (name) => screen.getByRole('button', { name });
const toggle = () => screen.getByRole('checkbox', { name: /Idempotent handler/ });
const counter = (label) => Number(screen.getByText(new RegExp(`^${label}: \\d+$`)).textContent.split(': ')[1]);
const counts = () => ({ rows: counter('rows in DynamoDB'), emails: counter('emails sent'), dupes: counter('duplicates stored') });
const tableRows = () => {
  const body = screen.getAllByRole('rowgroup')[1];
  return within(body).getAllByRole('row')
    .map((r) => within(r).queryAllByRole('cell').map((c) => c.textContent))
    .filter((cells) => cells.length === 4)
    .map(([id, type, value, status]) => ({ id, type, value, status }));
};
const logLines = () => [...document.querySelectorAll('.log > div')].map((d) => d.textContent);

const deliverAndRetry = async (user, retries) => {
  await user.click(btn('Deliver new event'));
  for (let k = 0; k < retries; k++) await user.click(btn('Sender retries last event'));
};

describe('IdempotencyLab', () => {
  it('starts empty, and there is nothing to retry yet', () => {
    render(<IdempotencyLab />);
    expect(counts()).toEqual({ rows: 0, emails: 0, dupes: 0 });
    expect(screen.getByText(/Table is empty/)).toBeInTheDocument();
    expect(btn('Sender retries last event')).toBeDisabled();
    expect(toggle()).not.toBeChecked();
  });

  it('explains that the senders deliver at least once', () => {
    render(<IdempotencyLab />);
    expect(screen.getByText(/at least once/)).toBeInTheDocument();
  });

  it('naive handler: every retry of the same event inserts another row and sends another email', async () => {
    const user = userEvent.setup();
    render(<IdempotencyLab />);
    await deliverAndRetry(user, 3);
    const rows = tableRows();
    expect(rows).toHaveLength(4);
    expect(new Set(rows.map((r) => r.id)).size).toBe(1); // all the same event
    expect(rows.map((r) => r.status)).toEqual(['processed', 'duplicate row', 'duplicate row', 'duplicate row']);
    expect(counts()).toEqual({ rows: 4, emails: 4, dupes: 3 });
    expect(logLines().filter((l) => /DUPLICATE/.test(l))).toHaveLength(3);
    // each retry is explained as the sender not having seen our 200
    expect(logLines().filter((l) => /never saw our 200/.test(l))).toHaveLength(3);
  });

  it('idempotent handler: the conditional write lets the first delivery through and no-ops every retry', async () => {
    const user = userEvent.setup();
    render(<IdempotencyLab />);
    await user.click(toggle());
    await deliverAndRetry(user, 3);
    const rows = tableRows();
    expect(rows).toHaveLength(1);
    expect(rows[0].status).toBe('processed');
    expect(counts()).toEqual({ rows: 1, emails: 1, dupes: 0 });
    const lines = logLines();
    expect(lines.filter((l) => /PutItem OK \(condition passed\)/.test(l))).toHaveLength(1);
    const noops = lines.filter((l) => /ConditionalCheckFailed/.test(l));
    expect(noops).toHaveLength(3);
    // a duplicate still returns 200 so the sender stops retrying
    for (const l of noops) expect(l).toMatch(/no-op, return 200/);
  });

  it('idempotent handler: different events are each processed once', async () => {
    const user = userEvent.setup();
    render(<IdempotencyLab />);
    await user.click(toggle());
    await deliverAndRetry(user, 1);
    await deliverAndRetry(user, 2);
    const rows = tableRows();
    expect(rows).toHaveLength(2);
    expect(new Set(rows.map((r) => r.id)).size).toBe(2);
    expect(counts()).toEqual({ rows: 2, emails: 2, dupes: 0 });
  });

  it('the retry button resends the most recent event', async () => {
    const user = userEvent.setup();
    render(<IdempotencyLab />);
    await user.click(btn('Deliver new event'));
    await user.click(btn('Deliver new event'));
    const second = tableRows()[1].id;
    await user.click(btn('Sender retries last event'));
    expect(tableRows()[2].id).toBe(second);
    expect(logLines()[0]).toContain(`retry of ${second}`);
  });

  it('the log shows the newest line first', async () => {
    const user = userEvent.setup();
    render(<IdempotencyLab />);
    await user.click(btn('Deliver new event'));
    const id = tableRows()[0].id;
    await user.click(btn('Sender retries last event'));
    expect(logLines()[0]).toContain(`retry of ${id}`);
    expect(logLines()[1]).toMatch(/network blip/);
    expect(logLines().at(-1)).toContain(`${id} first delivery`);
  });

  it('Reset and flipping the switch both clear the table', async () => {
    const user = userEvent.setup();
    render(<IdempotencyLab />);
    await deliverAndRetry(user, 1);
    await user.click(btn('Reset'));
    expect(counts()).toEqual({ rows: 0, emails: 0, dupes: 0 });
    expect(btn('Sender retries last event')).toBeDisabled();
    await deliverAndRetry(user, 1);
    await user.click(toggle());
    expect(counts()).toEqual({ rows: 0, emails: 0, dupes: 0 });
    expect(logLines()).toEqual([]);
  });

  it('the code sample uses attribute_not_exists on the event id', () => {
    render(<IdempotencyLab />);
    expect(screen.getByText(/ConditionExpression="attribute_not_exists\(event_id\)"/)).toBeInTheDocument();
  });

  // Regression: the 4th "new" event used to reuse the 1st event's id; new events now get fresh ids, only retries repeat one.
  it('"Deliver new event" always delivers an event id the handler has not seen', async () => {
    const user = userEvent.setup();
    render(<IdempotencyLab />);
    for (let k = 0; k < 4; k++) await user.click(btn('Deliver new event'));
    const ids = tableRows().map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(counts().dupes).toBe(0);
  });
});

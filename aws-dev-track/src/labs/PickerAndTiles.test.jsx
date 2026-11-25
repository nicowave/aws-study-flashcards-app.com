import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProtocolPickerLab, TileMathLab } from './PickerAndTiles';

// ---------------------------------------------------------------------------
// Protocol picker
// ---------------------------------------------------------------------------

// The scenarios are private to the component, so the expected answers are written here,
// independently, from networking first principles. Keyed by a phrase in each question.
const EXPECTED = [
  { about: /heartbeat/i, answer: /^UDP$/ },
  { about: /4 MB diagnostic log/i, answer: /^HTTPS POST/ },
  { about: /300,000 low-power devices/i, answer: /^MQTT over TCP to a broker$/ },
  { about: /same event_id twice/i, answer: /^Conditional write on event_id/ },
  { about: /not a clone/i, answer: /^mTLS with a per-device certificate$/ },
  { about: /private subnet/i, answer: /^SSH local port forward through a bastion$/ },
  { about: /new load balancer/i, answer: /^Lower the DNS TTL to 60s today$/ },
  { about: /dashboard map/i, answer: /^WMTS tiles/ },
];

const counter = () => screen.getByText(/^\d+\/\d+\.$/);
const position = () => counter().textContent.match(/^(\d+)\/(\d+)/).slice(1).map(Number);
const questionText = () => counter().parentElement.textContent;
const expectedFor = (q) => {
  const hits = EXPECTED.filter((e) => e.about.test(q));
  expect(hits, `exactly one expectation for: ${q}`).toHaveLength(1);
  return hits[0];
};
const choiceButtons = () =>
  screen.getAllByRole('button').filter((b) => !/^Next scenario$/.test(b.textContent));
const score = () => screen.getByText(/^score \d+\/\d+$/).textContent;

describe('ProtocolPickerLab', () => {
  it('every scenario accepts the technically right protocol and explains why', async () => {
    const user = userEvent.setup();
    render(<ProtocolPickerLab />);
    const [, total] = position();
    expect(total).toBe(EXPECTED.length);
    // The lead promises a number of scenarios; it must match the deck.
    const words = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];
    expect(screen.getByText(new RegExp(`${words[total]} scenarios`, 'i'))).toBeInTheDocument();

    const seen = new Set();
    for (let k = 1; k <= total; k++) {
      expect(position()).toEqual([k, total]);
      const q = questionText();
      const { about, answer } = expectedFor(q);
      seen.add(about.source);
      expect(screen.getByRole('button', { name: 'Next scenario' })).toBeDisabled();

      await user.click(screen.getByRole('button', { name: answer }));
      expect(screen.getByText('Right.')).toBeInTheDocument();
      expect(screen.getByText('Right.').parentElement.textContent.length).toBeGreaterThan('Right. '.length + 10);
      expect(screen.getByRole('button', { name: answer })).toHaveClass('right');
      expect(score()).toBe(`score ${k}/${k}`);

      await user.click(screen.getByRole('button', { name: 'Next scenario' }));
    }
    expect(seen.size).toBe(EXPECTED.length);
    // After the last scenario it wraps back to the first.
    expect(position()).toEqual([1, total]);
  });

  it('a wrong pick says so, reveals the right answer and scores 0', async () => {
    const user = userEvent.setup();
    render(<ProtocolPickerLab />);
    const { answer } = expectedFor(questionText());
    const wrong = choiceButtons().find((b) => !answer.test(b.textContent));
    await user.click(wrong);
    expect(screen.getByText('Not that one.')).toBeInTheDocument();
    expect(wrong).toHaveClass('wrong');
    expect(screen.getByRole('button', { name: answer })).toHaveClass('right');
    expect(score()).toBe('score 0/1');
  });

  it('only the first pick counts', async () => {
    const user = userEvent.setup();
    render(<ProtocolPickerLab />);
    const { answer } = expectedFor(questionText());
    const wrong = choiceButtons().find((b) => !answer.test(b.textContent));
    await user.click(wrong);
    await user.click(screen.getByRole('button', { name: answer }));
    expect(screen.getByText('Not that one.')).toBeInTheDocument();
    expect(screen.queryByText('Right.')).not.toBeInTheDocument();
    expect(score()).toBe('score 0/1');
  });
});

// ---------------------------------------------------------------------------
// WMTS / slippy-map tile math
// ---------------------------------------------------------------------------

// Independent reference: the standard Web Mercator tile formula, written with asinh(tan φ)
// (mathematically equal to ln(tan φ + sec φ), but a different computation path).
const refTile = (lon, lat, z) => {
  const n = 2 ** z;
  const x = Math.floor(((lon + 180) / 360) * n);
  const phi = (lat * Math.PI) / 180;
  const y = Math.floor(((1 - Math.asinh(Math.tan(phi)) / Math.PI) / 2) * n);
  return { z, x, y };
};
// Web Mercator's latitude limit: the top edge of tile row 0.
const MAX_LAT = (Math.atan(Math.sinh(Math.PI)) * 180) / Math.PI; // ≈ 85.0511

const setInputs = ({ lon, lat, z }) => {
  if (lon !== undefined) fireEvent.change(screen.getByRole('spinbutton', { name: /lon/ }), { target: { value: String(lon) } });
  if (lat !== undefined) fireEvent.change(screen.getByRole('spinbutton', { name: /lat/ }), { target: { value: String(lat) } });
  if (z !== undefined) fireEvent.change(screen.getByRole('slider', { name: /zoom/ }), { target: { value: String(z) } });
};
const readTile = () => {
  const m = screen.getByText(/GET \/wmts\/sensors\//).textContent.match(/GET \/wmts\/sensors\/(-?\w+)\/(-?\w+)\/(-?\w+)\.png/);
  return { z: Number(m[1]), x: Number(m[2]), y: Number(m[3]) };
};
const pre = () => screen.getByText(/GET \/wmts\/sensors\//).textContent;

describe('TileMathLab', () => {
  it('the default point matches the reference formula', () => {
    render(<TileMathLab />);
    const lon = Number(screen.getByRole('spinbutton', { name: /lon/ }).value);
    const lat = Number(screen.getByRole('spinbutton', { name: /lat/ }).value);
    const z = Number(screen.getByRole('slider', { name: /zoom/ }).value);
    expect(readTile()).toEqual(refTile(lon, lat, z));
  });

  it.each([0, 1, 2, 3])('lon 0, lat 0 at z=%i is the tile just south-east of the centre', (z) => {
    render(<TileMathLab />);
    setInputs({ lon: 0, lat: 0, z });
    const half = z === 0 ? 0 : 2 ** (z - 1);
    expect(readTile()).toEqual({ z, x: half, y: half });
    expect(readTile()).toEqual(refTile(0, 0, z));
  });

  it('London at z=10 is the well-known tile 10/511/340', () => {
    render(<TileMathLab />);
    setInputs({ lon: -0.1276, lat: 51.5072, z: 10 });
    expect(readTile()).toEqual({ z: 10, x: 511, y: 340 });
  });

  it.each([
    ['Sydney (southern and eastern hemisphere)', 151.2093, -33.8688, 10],
    ['New York', -74.006, 40.7128, 10],
    ['Berlin', 13.405, 52.52, 14],
    ['Quito, almost on the equator', -78.4678, -0.1807, 18],
  ])('%s matches the reference formula', (_name, lon, lat, z) => {
    render(<TileMathLab />);
    setInputs({ lon, lat, z });
    expect(readTile()).toEqual(refTile(lon, lat, z));
  });

  it('lon -180 is the first column and just west of 180 is the last column', () => {
    render(<TileMathLab />);
    setInputs({ lon: -180, lat: 0, z: 3 });
    expect(readTile().x).toBe(0);
    setInputs({ lon: 179.99 });
    expect(readTile().x).toBe(7);
  });

  it('latitudes just inside the Mercator limit land in the top and bottom rows', () => {
    render(<TileMathLab />);
    setInputs({ lon: 0, lat: 85.05, z: 3 });
    expect(readTile().y).toBe(0);
    setInputs({ lat: -85.05 });
    expect(readTile().y).toBe(7);
  });

  it('north is up: a higher latitude never gives a larger y', () => {
    render(<TileMathLab />);
    setInputs({ lon: 10, z: 8 });
    let prev = Infinity;
    for (const lat of [-80, -45, -10, 0, 10, 45, 80]) {
      setInputs({ lat });
      const { y } = readTile();
      expect(y).toBeLessThanOrEqual(prev);
      prev = y;
    }
  });

  it('shows the tile count and the equatorial width of one tile', () => {
    render(<TileMathLab />);
    setInputs({ z: 4 });
    expect(pre()).toContain('tiles at this zoom: 16 x 16 = 256');
    expect(pre()).toContain(`~${(40075 / 16).toFixed(1)} km`);
    setInputs({ z: 12 });
    expect(pre()).toContain(`tiles at this zoom: 4096 x 4096 = ${(4096 * 4096).toLocaleString()}`);
    expect(pre()).toContain(`~${(40075 / 4096).toFixed(3)} km`);
  });

  // Regression: lon 180 used to give x = n (a 404 tile); longitude now wraps, so 180 is column 0 like -180.
  it('lon 180 gives a real column (0..n-1), not x = n', () => {
    render(<TileMathLab />);
    setInputs({ lon: 180, lat: 0, z: 3 });
    const { x } = readTile();
    expect(x).toBeGreaterThanOrEqual(0);
    expect(x).toBeLessThan(8);
  });

  // Regression: latitudes past ±85.0511° used to give y < 0, y >= n or ±Infinity; latitude and y are now clamped.
  it('latitudes beyond the Mercator limit still give a real row (0..n-1)', () => {
    render(<TileMathLab />);
    for (const lat of [86, 90, -86, -90]) {
      setInputs({ lon: 0, lat, z: 3 });
      const { y } = readTile();
      expect(Number.isFinite(y), `lat ${lat} (limit ±${MAX_LAT.toFixed(4)})`).toBe(true);
      expect(y).toBeGreaterThanOrEqual(0);
      expect(y).toBeLessThan(8);
    }
  });
});

// Rules the generated readiness questions (scripts/build-readiness.mjs) must keep.
// The exam domains and their weights come from each certification game's own data.
import { describe, it, expect } from 'vitest';
import { READINESS_QUESTIONS } from './readiness';
import { certifications } from './certifications';
import { domains as cloudDomains } from '../../../aws-cloud-practitioner-game/src/data/index.js';
import { domains as aiDomains } from '../../../aws-ai-study-game/src/data/index.js';
import { domains as saaDomains } from '../../../aws-saa-study-game/src/data/index.js';
import { domains as dvaDomains } from '../../../aws-dva-study-game/src/data/index.js';

const GAME_DOMAINS = {
  'cloud-practitioner': cloudDomains,
  'ai-practitioner': aiDomains,
  'solutions-architect-associate': saaDomains,
  'developer-associate': dvaDomains,
};
const CERT_IDS = Object.keys(READINESS_QUESTIONS);
// Cloud Practitioner uses `correctAnswer`, the other games `correct` (on purpose).
const gameAnswer = (q) => q.correctAnswer ?? q.correct;
const gameQuestion = (certId, q) => GAME_DOMAINS[certId].find((d) => d.name === q.domain)?.questions.find((x) => x.id === q.id);
const countByDomain = (certId) => {
  const counts = {};
  for (const q of READINESS_QUESTIONS[certId]) counts[q.domain] = (counts[q.domain] || 0) + 1;
  return counts;
};

describe('readiness questions', () => {
  it('cover exactly the live certifications on the hub', () => {
    const live = certifications.filter((c) => c.status === 'available').map((c) => c.id);
    expect(new Set(CERT_IDS)).toEqual(new Set(live));
    expect(new Set(Object.keys(GAME_DOMAINS))).toEqual(new Set(CERT_IDS));
  });

  it('give every certification the same number of questions', () => {
    const lengths = new Set(CERT_IDS.map((id) => READINESS_QUESTIONS[id].length));
    expect(lengths.size).toBe(1);
  });

  it.each(CERT_IDS)('%s: every question is well formed, with no repeats', (certId) => {
    const qs = READINESS_QUESTIONS[certId];
    expect(new Set(qs.map((q) => q.id)).size).toBe(qs.length); // also the React key in the review list
    for (const q of qs) {
      expect(q.domain, q.id).toBeTruthy();
      expect(q.question, q.id).toBeTruthy();
      expect(q.explanation, q.id).toBeTruthy();
      expect(q.options.length, q.id).toBeGreaterThanOrEqual(3);
      expect(new Set(q.options).size, `${q.id} has duplicate options`).toBe(q.options.length);
      expect(Number.isInteger(q.answer) && q.answer >= 0 && q.answer < q.options.length, q.id).toBe(true);
    }
  });

  describe("weighted like the real exam's domains", () => {
    it.each(CERT_IDS)("%s: every exam domain is asked at least once, and no other domain", (certId) => {
      const counts = countByDomain(certId);
      expect(new Set(Object.keys(counts))).toEqual(new Set(GAME_DOMAINS[certId].map((d) => d.name)));
      for (const n of Object.values(counts)) expect(n).toBeGreaterThanOrEqual(1);
    });

    it.each(CERT_IDS)("%s: each domain's share is within one question of its exam weight", (certId) => {
      const counts = countByDomain(certId);
      const total = READINESS_QUESTIONS[certId].length;
      const weights = GAME_DOMAINS[certId].map((d) => ({ name: d.name, w: parseFloat(d.weight) }));
      for (const { w } of weights) expect(w).toBeGreaterThan(0);
      const sum = weights.reduce((a, d) => a + d.w, 0);
      for (const { name, w } of weights) {
        const share = (w / sum) * total;
        expect(Math.abs(counts[name] - share), `${name}: ${counts[name]} questions for ${share.toFixed(2)}`).toBeLessThan(1);
      }
    });

    it.each(CERT_IDS)('%s: a heavier domain never gets fewer questions than a lighter one', (certId) => {
      const counts = countByDomain(certId);
      const ds = GAME_DOMAINS[certId];
      for (const a of ds) {
        for (const b of ds) {
          if (parseFloat(a.weight) > parseFloat(b.weight)) expect(counts[a.name], `${a.name} vs ${b.name}`).toBeGreaterThanOrEqual(counts[b.name]);
        }
      }
    });
  });

  describe("taken from the certification's own game", () => {
    it.each(CERT_IDS)('%s: every question is in that domain of the game, with the same option marked right', (certId) => {
      for (const q of READINESS_QUESTIONS[certId]) {
        const g = gameQuestion(certId, q);
        expect(g, `${q.id} is no longer in ${q.domain}`).toBeDefined();
        // same options in the same order, with the same one marked right (wording is checked below)
        expect(q.options.length, q.id).toBe(g.options.length);
        expect(q.answer, q.id).toBe(gameAnswer(g));
      }
    });

    // Regression: readiness.js once fell behind the games' wording. If this fails after
    // editing a game's questions, rerun `node scripts/build-readiness.mjs`.
    it('use the wording the games have today (question, options and explanation)', () => {
      const stale = [];
      for (const certId of CERT_IDS) {
        for (const q of READINESS_QUESTIONS[certId]) {
          const g = gameQuestion(certId, q);
          if (!g) continue;
          if (g.question !== q.question || JSON.stringify(g.options) !== JSON.stringify(q.options) || g.explanation !== q.explanation) {
            stale.push(`${certId}/${q.id}`);
          }
        }
      }
      expect(stale).toEqual([]);
    });
  });

  it.each(CERT_IDS)("%s: the score fits what the backend accepts (aws-backend/lambda/api/leads.js validDomains)", (certId) => {
    const counts = countByDomain(certId);
    expect(READINESS_QUESTIONS[certId].length).toBeLessThanOrEqual(30); // total 1..30
    expect(Object.keys(counts).length).toBeLessThanOrEqual(8); // 1..8 domains
    for (const n of Object.values(counts)) expect(n).toBeLessThanOrEqual(20); // each domain total 1..20
    for (const name of Object.keys(counts)) expect(name.length).toBeLessThanOrEqual(80); // name is cut at 80
  });
});

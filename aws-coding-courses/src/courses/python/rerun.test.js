// A learner presses Run many times. A check that changes the practice account
// (Tutorial 3's makes every site healthy to see that the handler stays quiet)
// must leave it as it found it, or only the first run can pass.
import { it, expect } from 'vitest';
import { nodePython } from '../../engine/python/nodePython';
import course from './index';

it('Tutorial 3, the alerting function: judged the same on every run', async () => {
  const py = await nodePython();
  const step = course.tutorials.find((t) => t.number === 3).steps.find((s) => s.id === 'handler');
  const file = step.files[0];
  await py.reset(typeof step.scenario === 'function' ? step.scenario() : step.scenario);
  const attempt = async (code) => {
    const result = await py.run({ path: file.path, files: { [file.path]: code }, probe: step.probe, invoke: file.invoke });
    return step.check({ result, probe: result.probe?.value, probeError: result.probe?.error, files: result.files, aws: result.aws, web: result.web, kind: 'run', sources: {} });
  };
  expect(await attempt(file.starter)).not.toBe(true);
  expect(await attempt(step.solution)).toBe(true);
  expect(await attempt(step.solution)).toBe(true);
  expect(await attempt(file.starter)).not.toBe(true);
}, 120000);

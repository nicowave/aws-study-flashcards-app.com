// Every "try" task must be solvable: running its answer passes its check,
// and doing nothing doesn't. Also checks the course data is well formed.
import { describe, it, expect, beforeAll } from 'vitest';
import { Shell } from '../engine/shell/shell';
import { nodePython } from '../engine/python/nodePython';
import { nodeRunner, prepareFiles, transpile } from '../engine/js/nodeJs';
import { runWebPage } from '../engine/js/webJsdom';
import bash from './bash/index';
import pythonCourse from './python/index';
import javascriptCourse from './javascript/index';
import typescriptCourse from './typescript/index';

const COURSES = [bash, pythonCourse, javascriptCourse, typescriptCourse];
const JS_RUNTIMES = ['web', 'node'];

const runCheck = (step, shell, result) => step.check({ shell, fs: shell.fs, aws: shell.aws, result, history: shell.history });
const freshShell = (step) => new Shell(typeof step.scenario === 'function' ? step.scenario() : step.scenario);

// Python steps: same idea, through the practice Python the site runs
let py;
beforeAll(async () => { py = await nodePython(); }, 60000);

const pyCheck = (step, result, kind, sources) => step.check({
  result, probe: result.probe?.value, probeError: result.probe?.error, files: result.files, aws: result.aws, web: result.web, kind, sources,
});

const pyAttempt = async (step, code) => {
  await py.reset(typeof step.scenario === 'function' ? step.scenario() : step.scenario);
  if (!step.files) {
    const result = await py.cell({ source: code, probe: step.probe });
    return { result, verdict: pyCheck(step, result, 'cell', {}) };
  }
  const [file, ...others] = step.files;
  const sources = { [file.path]: code, ...Object.fromEntries(others.map((f) => [f.path, f.starter ?? ''])) };
  const result = await py.run({ path: file.path, files: sources, probe: step.probe, invoke: file.invoke });
  return { result, verdict: pyCheck(step, result, 'run', sources) };
};

// JavaScript and TypeScript steps: web pages in jsdom, server code in the
// same runner the site's worker uses. A solution is code for the first file,
// or { path: code } for several files.
const jsr = nodeRunner();
const scenarioOf = (step) => (typeof step.scenario === 'function' ? step.scenario() : step.scenario) || {};

const jsAttempt = async (step, code) => {
  const scenario = scenarioOf(step);
  const files = step.files
    ? Object.fromEntries(step.files.map((f, i) => [f.path, typeof code === 'object' ? code[f.path] ?? f.starter ?? '' : i === 0 ? code : f.starter ?? '']))
    : {};
  if (step.runtime === 'web') {
    const r = await runWebPage({ files, storage: scenario.storage, web: scenario.web, probe: step.probe });
    return { result: r.result, diagnostics: r.diagnostics, verdict: step.check({ result: r.result, probe: r.probe, probeError: r.probeError, files, diagnostics: r.diagnostics, kind: 'run', sources: files }) };
  }
  await jsr.reset({ scenario });
  const prepared = await prepareFiles(files);
  const isTs = step.lang === 'ts' || Object.keys(files).some((p) => p.endsWith('.ts'));
  const result = step.files
    ? await jsr.run({ path: step.files[0].path, files: prepared.files, lineMaps: prepared.lineMaps, probe: step.probe, invoke: step.files[0].invoke })
    : await jsr.cell({ source: isTs ? transpile(code) : code, files: prepared.files, probe: step.probe });
  const verdict = step.check({
    result, invoke: result.invoke, aws: result.aws, web: result.web, cdk: result.cdk, probe: result.probe?.value, probeError: result.probe?.error,
    files, diagnostics: prepared.diagnostics, kind: step.files ? 'run' : 'cell', sources: files,
  });
  return { result, diagnostics: prepared.diagnostics, verdict };
};

for (const course of COURSES) {
  describe(course.title, () => {
    it('has well-formed tutorials', () => {
      const slugs = new Set();
      for (const t of course.tutorials) {
        expect(slugs.has(t.slug)).toBe(false);
        slugs.add(t.slug);
        expect(t.title && t.situation && t.level && t.hours).toBeTruthy();
        const ids = new Set();
        for (const s of t.steps) {
          expect(['read', 'try', 'quiz', 'cards', 'build']).toContain(s.kind);
          expect(ids.has(s.id)).toBe(false);
          ids.add(s.id);
          if (s.kind === 'try') expect(s.task && s.check && s.solution && s.scenario).toBeTruthy();
          if (s.kind === 'quiz') for (const q of s.questions) expect(q.options[q.answer]).toBeDefined();
          if (s.kind === 'cards') for (const c of s.cards) expect(c.id && c.front && c.back && c.difficulty).toBeTruthy();
        }
      }
      // At least one free tutorial so people can try before buying
      expect(course.tutorials.some((t) => t.free && t.number > 0)).toBe(true);
    });

    for (const t of course.tutorials) {
      for (const step of t.steps.filter((s) => s.kind === 'try' && JS_RUNTIMES.includes(s.runtime))) {
        it(`${t.slug} / ${step.id}: the answer passes and doing nothing doesn't`, async () => {
          if (!step.files) {
            const idle = await jsAttempt(step, 'undefined');
            expect(idle.verdict).not.toBe(true);
          }
          const { result, diagnostics, verdict } = await jsAttempt(step, step.solution);
          if (verdict !== true) console.log(step.id, { verdict, diagnostics, result: JSON.stringify(result).slice(0, 3000) });
          expect(verdict).toBe(true);
        });

        if (step.files) {
          it(`${t.slug} / ${step.id}: the unfinished starter doesn't pass yet`, async () => {
            const { verdict } = await jsAttempt(step, Object.fromEntries(step.files.map((f) => [f.path, f.starter ?? ''])));
            expect(verdict).not.toBe(true);
          });
        }
      }

      for (const step of t.steps.filter((s) => s.kind === 'try' && s.runtime === 'python')) {
        it(`${t.slug} / ${step.id}: the answer passes and doing nothing doesn't`, async () => {
          const idle = await pyAttempt({ ...step, files: undefined }, 'None');
          expect(idle.verdict).not.toBe(true);
          const { result, verdict } = await pyAttempt(step, step.solution);
          if (verdict !== true) console.log(step.id, { verdict, stdout: result.stdout.slice(0, 3000), stderr: result.stderr.slice(0, 3000), probe: result.probe });
          expect(verdict).toBe(true);
        });

        if (step.files) {
          it(`${t.slug} / ${step.id}: the unfinished starter doesn't pass yet`, async () => {
            const { result, verdict } = await pyAttempt(step, step.files[0].starter);
            expect(result.error?.type).not.toBe('SyntaxError');
            expect(result.error?.type).not.toBe('IndentationError');
            expect(verdict).not.toBe(true);
          });
        }
      }

      for (const step of t.steps.filter((s) => s.kind === 'try' && !s.runtime)) {
        it(`${t.slug} / ${step.id}: the answer passes and doing nothing doesn't`, () => {
          const idle = freshShell(step);
          const idleResult = idle.run('ls');
          expect(runCheck(step, idle, idleResult)).not.toBe(true);

          const shell = freshShell(step);
          let result;
          if (step.files) {
            const [file] = step.files;
            shell.fs.write(file.path, step.solution);
            if (file.executable) shell.fs.node(file.path).mode = 0o755;
            result = shell.run(file.runCommand || `bash ${file.path}`);
          } else {
            result = shell.run(step.solution);
          }
          const verdict = runCheck(step, shell, result);
          if (verdict !== true) console.log(step.id, { verdict, stdout: result.stdout.slice(0, 2000), stderr: result.stderr });
          expect(verdict).toBe(true);
        });

        if (step.files) {
          it(`${t.slug} / ${step.id}: the unfinished starter doesn't pass yet`, () => {
            const shell = freshShell(step);
            const [file] = step.files;
            shell.fs.write(file.path, file.starter);
            if (file.executable) shell.fs.node(file.path).mode = 0o755;
            const result = shell.run(file.runCommand || `bash ${file.path}`);
            expect(result.stderr).not.toMatch(/syntax error|internal error/);
            expect(runCheck(step, shell, result)).not.toBe(true);
          });
        }
      }
    }
  });
}

// Every "try" task must be solvable: running its answer passes its check,
// and doing nothing doesn't. Also checks the course data is well formed.
import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'node:fs';
import { localize } from '../engine/i18n';
import { tutorialProblems, missingTranslations, parityProblems } from './validate';
import { Shell } from '../engine/shell/shell';
import { nodePython } from '../engine/python/nodePython';
import { nodeRunner, prepareFiles, transpile } from '../engine/js/nodeJs';
import { runWebPage } from '../engine/js/webJsdom';
import bash from './bash/index';
import pythonCourse from './python/index';
import javascriptCourse from './javascript/index';
import typescriptCourse from './typescript/index';
import techSpanish from './tech-spanish/index';

const COURSES = [bash, pythonCourse, javascriptCourse, typescriptCourse, techSpanish];
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
    // A bilingual course is checked once per language, as each visitor sees it
    for (const lang of course.languages || ['en']) {
      const view = course.languages ? localize(course, lang) : course;
      it(`has well-formed tutorials${course.languages ? ` (${lang})` : ''}`, () => {
        const slugs = view.tutorials.map((t) => t.slug);
        expect(new Set(slugs).size).toBe(slugs.length);
        expect(view.tutorials.flatMap((t) => tutorialProblems(t, lang))).toEqual([]);
        // At least one free tutorial so people can try before buying
        expect(view.tutorials.some((t) => t.free && t.number > 0)).toBe(true);
      });
    }

    if (course.languages) {
      it('has every text in both languages', () => {
        expect(missingTranslations(course)).toEqual([]);
      });

      it('has the same steps, answers and cards in both languages', () => {
        const [a, b] = course.languages.map((lang) => localize(course, lang));
        expect(a.tutorials.flatMap((t, i) => parityProblems(t, b.tutorials[i]))).toEqual([]);
      });
    }

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

describe('Tech Spanish glossary', () => {
  it('uses the current glossary (run node build.mjs in content/tech-spanish after editing it)', () => {
    const source = readFileSync(new URL('../../../content/tech-spanish/glossary.json', import.meta.url), 'utf8');
    const copy = readFileSync(new URL('./tech-spanish/glossary.json', import.meta.url), 'utf8');
    expect(copy).toBe(source);
  });
});

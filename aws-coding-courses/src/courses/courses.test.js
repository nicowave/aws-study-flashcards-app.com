// Every "try" task must be solvable: running its answer passes its check,
// and doing nothing doesn't. Also checks the course data is well formed.
import { describe, it, expect } from 'vitest';
import { Shell } from '../engine/shell/shell';
import bash from './bash/index';

const COURSES = [bash];

const runCheck = (step, shell, result) => step.check({ shell, fs: shell.fs, aws: shell.aws, result, history: shell.history });
const freshShell = (step) => new Shell(typeof step.scenario === 'function' ? step.scenario() : step.scenario);

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
      for (const step of t.steps.filter((s) => s.kind === 'try')) {
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

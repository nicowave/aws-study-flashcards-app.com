// The owner's Mac has a disk that ignores upper/lower case; CI and cloud sessions run Linux, which
// doesn't. With Rewrite.jsx next to rewrite.js, `import './Rewrite'` loads rewrite.js on the Mac
// (the bundler tries ".js" first and the disk says it exists), so the build fails there and only there.
//   node --test scripts/file-names.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync } from 'node:fs';
import { join, parse } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const SKIP = new Set(['node_modules', 'dist', 'dist-next', 'cdk.out', '.git']);
// What an import without an extension can resolve to
const IMPORTABLE = new Set(['.js', '.jsx', '.mjs', '.cjs', '.ts', '.tsx', '.mts', '.json']);

// Pairs in one folder that an extensionless import can't tell apart on a case-insensitive disk
export function clashes(dir, found = []) {
  const byName = new Map();
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (SKIP.has(entry.name)) continue;
    if (entry.isDirectory()) {
      clashes(join(dir, entry.name), found);
      byName.set(entry.name, entry.name); // import './x' can also mean the folder x/
    } else if (IMPORTABLE.has(parse(entry.name).ext)) {
      const { name } = parse(entry.name);
      if (!byName.has(name)) byName.set(name, entry.name);
    }
  }
  const seen = new Map();
  for (const [name, file] of byName) {
    const key = name.toLowerCase();
    if (seen.has(key)) found.push(`${join(dir, seen.get(key))} <-> ${join(dir, file)}`);
    else seen.set(key, file);
  }
  return found;
}

test('no two importable files in a folder differ only by upper/lower case', () => {
  const apps = readdirSync(ROOT, { withFileTypes: true }).filter((e) => e.isDirectory() && e.name.startsWith('aws-'));
  assert.ok(apps.length >= 8, 'expected the app folders next to scripts/');
  const found = apps.flatMap((app) => clashes(join(ROOT, app.name)));
  assert.deepEqual(found.map((f) => f.replaceAll(ROOT, '')), [], 'rename one file of each pair (e.g. rewriteCheck.js)');
});

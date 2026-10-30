// The JavaScript/TypeScript runtimes for tests: the same runner and compiler
// the site uses, with TypeScript and its lib files from npm.
import { createRequire } from 'module';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';
import { createCompiler, loadLibs } from './compiler';
import { createJsRunner } from './runner';

const require = createRequire(import.meta.url);
let compiler = null;

export const nodeCompiler = async () => {
  if (!compiler) {
    const ts = require('typescript');
    const libDir = dirname(require.resolve('typescript/lib/lib.d.ts'));
    compiler = createCompiler(ts, await loadLibs(async (name) => readFileSync(join(libDir, name), 'utf8')));
  }
  return compiler;
};

/** Compile any .ts files, then hand everything to the runner like the site does. */
export const prepareFiles = async (files) => {
  if (!Object.keys(files).some((p) => p.endsWith('.ts'))) return { files, lineMaps: {}, diagnostics: [] };
  const c = await nodeCompiler();
  const { outputs, lineMaps, diagnostics } = c.compile(files);
  return { files: { ...files, ...outputs }, lineMaps, diagnostics };
};

export const nodeRunner = () => createJsRunner();

/** A console line in TypeScript: types removed, like the site's compiler worker does. */
export const transpile = (source) => {
  const ts = require('typescript');
  return ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } }).outputText;
};

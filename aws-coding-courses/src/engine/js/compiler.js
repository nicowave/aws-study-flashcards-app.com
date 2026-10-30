// Type-checks and compiles the learner's TypeScript with the real compiler,
// in strict mode, against the standard library and typings for the pretend
// AWS SDK and CDK. Code still runs when there are type errors (like tsc's
// default), and the checks get the errors so a task can require zero.
//
// Shared by the browser's compiler worker and the Node tests: the caller
// passes in the `typescript` module and the lib .d.ts files.
import sdkTypes from './typings/aws-sdk.d.ts?raw';
import cdkTypes from './typings/aws-cdk-lib.d.ts?raw';
import nodeTypes from './typings/node.d.ts?raw';

// Pinned: the browser loads this version from the CDN, the tests from npm.
// TypeScript 7 is the native compiler with no JavaScript API, so stay on 6.
export const TS_VERSION = '6.0.3';

// A console line after transpiling: drop what the compiler adds for whole
// files, the "use strict" line and the `export {}` it writes when the only
// import was type-only, so a cell of just types runs and shows nothing.
export const cleanCell = (js) => js.replace(/^\s*["']use strict["'];?[ \t]*$/m, '').replace(/^export \{\};?[ \t]*$/m, '');
export const TS_CDN = `https://cdn.jsdelivr.net/npm/typescript@${TS_VERSION}/lib/`;
export const ROOT_LIBS = ['lib.es2022.d.ts', 'lib.dom.d.ts', 'lib.dom.iterable.d.ts'];

/** Every lib file the roots pull in through /// <reference lib="..." />. */
export const loadLibs = async (readLib) => {
  const libs = {};
  let wave = [...ROOT_LIBS];
  while (wave.length) {
    const texts = await Promise.all(wave.map((name) => readLib(name)));
    const next = [];
    wave.forEach((name, i) => {
      libs[name] = texts[i];
      for (const m of texts[i].matchAll(/\/\/\/\s*<reference lib="([^"]+)"/g)) {
        const file = `lib.${m[1].toLowerCase()}.d.ts`;
        if (!(file in libs) && !wave.includes(file) && !next.includes(file)) next.push(file);
      }
    });
    wave = next;
  }
  return libs;
};

export const TS_TIPS = {
  2339: 'That property doesn\'t exist on this type. Check the spelling against the type or interface it comes from.',
  2345: 'The value you\'re passing doesn\'t match what the function expects. Compare its type with the parameter\'s type.',
  2322: 'This value\'s type doesn\'t match the variable or property it\'s going into.',
  2532: 'This might be undefined. Check it first (if (x) { … }), or use ?. to read it safely.',
  18048: 'This might be undefined. Check it first (if (x) { … }), or use ?. to read it safely.',
  18047: 'This might be null, for example when querySelector finds nothing. Check it first.',
  2531: 'This might be null, for example when querySelector finds nothing. Check it first.',
  7006: 'Strict mode wants a type for this parameter: (card: Card) instead of (card).',
  7005: 'Strict mode wants a type here, so TypeScript can check how it\'s used.',
  2304: 'TypeScript doesn\'t know that name. Check the spelling, and import it if it lives in another file or package.',
  2307: 'TypeScript can\'t find that module. Check the path (./file.js for your own files) or the package name.',
  2554: 'The function is called with the wrong number of arguments.',
  2741: 'An object is missing a property its type requires.',
  2353: 'This object has a property its type doesn\'t allow: often a typo in a property name.',
  2551: 'That property doesn\'t exist, but a similar one does: probably a typo.',
  2367: 'This comparison is always false: the two types never overlap. Often a typo in a string value.',
  2769: 'None of the ways to call this function match these arguments. Read the first error underneath.',
};

const FILE_ROOT = '/src/';

export const createCompiler = (ts, libs) => {
  const typings = { '/typings/aws-sdk.d.ts': sdkTypes, '/typings/aws-cdk-lib.d.ts': cdkTypes, '/typings/node.d.ts': nodeTypes };
  const libFiles = Object.fromEntries(Object.entries(libs).map(([name, text]) => [`/lib/${name}`, text]));
  let files = {};
  const versions = {};
  const snapshots = new Map();

  const options = {
    strict: true,
    target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    lib: ROOT_LIBS,
    types: [],
    skipLibCheck: true,
    noEmitOnError: false,
    sourceMap: true,
    esModuleInterop: true,
    allowJs: false,
    isolatedModules: false,
    forceConsistentCasingInFileNames: true,
    noFallthroughCasesInSwitch: true,
    newLine: ts.NewLineKind.LineFeed,
  };

  const read = (name) => files[name] ?? typings[name] ?? libFiles[name];
  const snapshot = (name) => {
    const text = read(name);
    if (text === undefined) return undefined;
    const key = `${name}@${versions[name] || 0}`;
    if (!snapshots.has(key)) snapshots.set(key, ts.ScriptSnapshot.fromString(text));
    return snapshots.get(key);
  };

  const host = {
    getCompilationSettings: () => options,
    getScriptFileNames: () => [...Object.keys(files), ...Object.keys(typings)],
    getScriptVersion: (name) => String(versions[name] || 0),
    getScriptSnapshot: snapshot,
    getCurrentDirectory: () => FILE_ROOT,
    getDefaultLibFileName: () => '/lib/lib.d.ts',
    fileExists: (name) => read(name) !== undefined,
    readFile: read,
    directoryExists: (dir) => ['/src', '/lib', '/typings', '/'].some((d) => dir === d || dir.startsWith(`${d}/`)),
    getDirectories: () => [],
  };
  const service = ts.createLanguageService(host, ts.createDocumentRegistry());

  const format = (d) => {
    const message = ts.flattenDiagnosticMessageText(d.messageText, '\n');
    const where = d.file && d.start !== undefined ? d.file.getLineAndCharacterOfPosition(d.start) : null;
    const file = d.file ? d.file.fileName.replace(FILE_ROOT, '') : null;
    return {
      file,
      line: where ? where.line + 1 : null,
      column: where ? where.character + 1 : null,
      code: d.code,
      category: d.category === ts.DiagnosticCategory.Error ? 'error' : 'warning',
      message,
      text: `${file ? `${file}(${where.line + 1},${where.character + 1}): ` : ''}${d.category === ts.DiagnosticCategory.Error ? 'error' : 'warning'} TS${d.code}: ${message}`,
      tip: TS_TIPS[d.code] || null,
    };
  };

  // generated line -> original line, from the source map's "mappings"
  const lineMap = (mappings) => {
    const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    const out = [];
    let srcLine = 0;
    for (const line of mappings.split(';')) {
      let first = null;
      for (const seg of line.split(',').filter(Boolean)) {
        const values = [];
        let value = 0;
        let shift = 0;
        for (const ch of seg) {
          const digit = B64.indexOf(ch);
          value += (digit & 31) << shift;
          if (digit & 32) shift += 5;
          else {
            values.push(value & 1 ? -(value >> 1) : value >> 1);
            value = 0;
            shift = 0;
          }
        }
        if (values.length >= 3) {
          srcLine += values[2];
          if (first === null) first = srcLine;
        }
      }
      out.push(first ?? srcLine);
    }
    return out;
  };

  return {
    /**
     * sources: { 'app.ts': text, ... } (other files are passed through).
     * Returns { outputs: { 'app.ts': javascript }, lineMaps, diagnostics }.
     */
    compile(sources) {
      const next = {};
      for (const [path, text] of Object.entries(sources)) {
        if (!/\.ts$/.test(path)) continue;
        const name = FILE_ROOT + path;
        next[name] = text;
        if (files[name] !== text) versions[name] = (versions[name] || 0) + 1;
      }
      files = next;
      const outputs = {};
      const maps = {};
      const diagnostics = [];
      for (const name of Object.keys(files)) {
        const path = name.slice(FILE_ROOT.length);
        for (const d of [...service.getSyntacticDiagnostics(name), ...service.getSemanticDiagnostics(name)]) diagnostics.push(format(d));
        const emitted = service.getEmitOutput(name);
        const js = emitted.outputFiles.find((f) => f.name.endsWith('.js'));
        const map = emitted.outputFiles.find((f) => f.name.endsWith('.js.map'));
        outputs[path] = js ? js.text.replace(/\n\/\/# sourceMappingURL=.*$/, '\n') : '';
        maps[path] = map ? lineMap(JSON.parse(map.text).mappings) : [];
      }
      for (const d of service.getCompilerOptionsDiagnostics()) diagnostics.push(format(d));
      return { outputs, lineMaps: maps, diagnostics: diagnostics.filter((d) => !d.file || !d.file.startsWith('/')) };
    },
  };
};

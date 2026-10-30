// The practice Python for tests: same sandbox as the site, Pyodide from npm.
import { createRequire } from 'module';
import { dirname } from 'path';
import { loadPyodide } from 'pyodide';
import { installPractice } from './runtime';

// Point Pyodide at its own folder: under the test runner it can't work that out
const indexURL = `${dirname(createRequire(import.meta.url).resolve('pyodide/package.json'))}/`;

let shared = null;

export const nodePython = async () => {
  shared = shared || loadPyodide({ indexURL }).then(installPractice);
  const handle = await shared;
  return {
    reset: (scenario) => handle({ op: 'reset', scenario }),
    run: (request) => handle({ op: 'run', ...request }),
    cell: (request) => handle({ op: 'cell', ...request }),
  };
};

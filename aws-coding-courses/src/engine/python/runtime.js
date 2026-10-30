// Sets up the practice Python inside a Pyodide instance. Shared by the
// browser worker and the Node tests, so both run exactly the same code.
import sandboxPy from './practice_sandbox.py?raw';
import awsPy from './practice_aws.py?raw';
import netPy from './practice_net.py?raw';

// Pinned: the browser loads this version from the CDN, the tests from npm.
export const PYODIDE_VERSION = '0.29.5';
export const PYODIDE_CDN = `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/`;

const LIB = '/lib/practice';

// Returns handle(request) -> response, both plain objects.
export const installPractice = (pyodide) => {
  pyodide.FS.mkdirTree(LIB);
  pyodide.FS.writeFile(`${LIB}/practice_sandbox.py`, sandboxPy);
  pyodide.FS.writeFile(`${LIB}/practice_aws.py`, awsPy);
  pyodide.FS.writeFile(`${LIB}/practice_net.py`, netPy);
  pyodide.runPython(`
import sys
sys.path.insert(0, '${LIB}')
sys.dont_write_bytecode = True
import practice_sandbox
practice_sandbox.install()
`);
  const handle = pyodide.pyimport('practice_sandbox').handle;
  return (request) => JSON.parse(handle(JSON.stringify(request)));
};

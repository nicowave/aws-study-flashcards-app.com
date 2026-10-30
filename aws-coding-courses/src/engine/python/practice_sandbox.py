# The practice Python's runner. JavaScript sends JSON requests to handle():
#   reset  load a step's scenario: files, pretend AWS account, pretend web
#   run    run a file (optionally as a Lambda function with a test event)
#   cell   run a snippet in the console, showing the last value like the REPL
# and gets back the output, any error with a plain-English tip, the files,
# the AWS state, and the result of the step's probe (used by the checks).
import ast
import builtins
import importlib
import json
import linecache
import os
import shutil
import sys
import traceback
import types
import uuid
import io
import decimal
import datetime

import practice_aws
import practice_net

HOME = '/home/learner'
MAX_OUTPUT = 200_000

_transcript = []
_size = [0]
_repl = {}
_env_keys = set()


class _Stream(io.TextIOBase):
    def __init__(self, name):
        self.name = name

    def writable(self):
        return True

    def isatty(self):
        return False

    def write(self, s):
        if not isinstance(s, str):
            raise TypeError(f'write() argument must be str, not {type(s).__name__}')
        if not s or _size[0] > MAX_OUTPUT:
            return len(s)
        _size[0] += len(s)
        if _size[0] > MAX_OUTPUT:
            s = s[: max(0, len(s) - (_size[0] - MAX_OUTPUT))] + '\n... (output cut off after 200,000 characters)\n'
        if _transcript and _transcript[-1][0] == self.name:
            _transcript[-1][1] += s
        else:
            _transcript.append([self.name, s])
        return len(s)

    def flush(self):
        pass


def _say(stream, text):
    _transcript.append([stream, text if text.endswith('\n') else text + '\n'])


def _no_input(prompt=''):
    raise RuntimeError("input() can't wait for typing in the practice Python. "
                       "Put the value in a variable instead, like: name = 'Dana'")


TIPS = {
    'NameError': "Python doesn't know that name. Check the spelling (capitals count), and that the variable is created, "
                 "or the module imported, above the line that uses it.",
    'UnboundLocalError': 'The function changes this variable, so Python treats it as a new local one that has no value yet. '
                         'Pass it in as a parameter, or give it a value first inside the function.',
    'IndentationError': 'The spaces at the start of the lines don\'t line up. Lines inside an if, for or def need the same '
                        'indent: 4 spaces each.',
    'TabError': 'This file mixes tabs and spaces at the start of lines. Use 4 spaces everywhere.',
    'SyntaxError': "Python couldn't read this line. Look for a missing colon at the end of an if, for or def line, "
                   'a missing bracket or quote, or = where you meant ==.',
    'KeyError': 'The dictionary has no such key. Print the dictionary, or its .keys(), to see what\'s there. '
                'd.get("name") returns None instead of failing.',
    'IndexError': 'The list is shorter than you think. Lists start at 0, so the last of 3 items is [2], or [-1].',
    'TypeError': 'A value is the wrong type for what you\'re doing with it: often text where a number was expected '
                 '(int() and float() convert), or a missing argument in a function call.',
    'ValueError': 'The type is right but the value isn\'t, like int("abc") or a date that doesn\'t match its format.',
    'AttributeError': 'This kind of value doesn\'t have that method or property. print(type(x)) shows what it really is; '
                      'a common cause is a variable that is None.',
    'ModuleNotFoundError': 'That module isn\'t installed here. The practice Python has the standard library and a pretend boto3, '
                           'the same as a Lambda function with no extra packages.',
    'ImportError': 'The module exists but doesn\'t have that name. Check the spelling after "import".',
    'ZeroDivisionError': 'Something was divided by zero, often an average of an empty list. Check the count first.',
    'FileNotFoundError': "There's no file with that name in this folder. import os; print(os.listdir()) shows what's here.",
    'RecursionError': 'A function keeps calling itself without stopping.',
    'JSONDecodeError': 'This text isn\'t valid JSON. Print it to see what you really got: often an error page or an empty string.',
    'ParamValidationError': 'boto3 checked the parameters before calling AWS. Parameter names are case-sensitive '
                            '(Bucket, not bucket), and lists must be lists: Values=["running"].',
    'ClientError': 'AWS answered with an error. The code in brackets says why; in your program it\'s '
                   'e.response["Error"]["Code"].',
    'URLError': 'The request didn\'t get an answer: the name doesn\'t exist, the connection was refused, or it timed out. '
                'e.reason says which.',
    'HTTPError': 'The site answered, with an error status. e.code is the number, like 404 or 503.',
    'TimeoutError': 'Nothing answered in time.',
    'SSLCertVerificationError': 'The site\'s certificate failed the check: expired, or for a different name.',
    'PracticeAccountError': 'This is a limit of the practice account, not of real AWS.',
}


def _user_frame(filename):
    return filename.startswith(HOME) or filename.startswith('<console') or not filename.startswith(('/', '<'))


def _trim(te):
    while te is not None:
        frames = [f for f in te.stack if _user_frame(f.filename)]
        te.stack = traceback.StackSummary.from_list(frames)
        if te.__cause__ is not None:
            _trim(te.__cause__)
        te = te.__context__ if te.__cause__ is None else None


def _tip_for(e):
    for cls in type(e).__mro__:
        if cls.__name__ in TIPS:
            return TIPS[cls.__name__]
    if isinstance(e, practice_aws.ClientError):
        return TIPS['ClientError']
    return None


def _report(e):
    te = traceback.TracebackException.from_exception(e)
    _trim(te)
    text = ''.join(te.format()).replace(HOME + '/', '')
    _say('err', text)
    tip = _tip_for(e)
    if tip:
        _say('tip', f'Tip: {tip}')
    line = None
    if isinstance(e, SyntaxError):
        line = e.lineno
    else:
        frames = [f for f in traceback.extract_tb(e.__traceback__) if _user_frame(f.filename)]
        if frames:
            line = frames[-1].lineno
    return {'type': type(e).__name__, 'message': str(e), 'line': line}


def _plain(value, depth=0):
    """Turn Python values into JSON for the checks."""
    if depth > 40:
        return repr(value)
    if value is None or isinstance(value, (bool, int, str)):
        return value
    if isinstance(value, float):
        return value if value == value and value not in (float('inf'), float('-inf')) else repr(value)
    if isinstance(value, decimal.Decimal):
        return {'$decimal': str(value)}
    if isinstance(value, (datetime.datetime, datetime.date)):
        return value.isoformat()
    if isinstance(value, dict):
        return {str(k): _plain(v, depth + 1) for k, v in value.items()}
    if isinstance(value, (list, tuple)):
        return [_plain(v, depth + 1) for v in value]
    if isinstance(value, (set, frozenset)):
        return sorted((_plain(v, depth + 1) for v in value), key=repr)
    if isinstance(value, bytes):
        return value.decode('utf-8', 'replace')
    if isinstance(value, BaseException):
        return {'$error': type(value).__name__, 'message': str(value)}
    return {'$repr': repr(value)[:500], 'type': type(value).__name__}


def _forget_user_modules():
    for name, mod in list(sys.modules.items()):
        f = getattr(mod, '__file__', None) or ''
        if f.startswith(HOME):
            del sys.modules[name]
    importlib.invalidate_caches()


def _files():
    out = {}
    for root, dirs, names in os.walk(HOME):
        dirs[:] = [d for d in dirs if d != '__pycache__' and not d.startswith('.')]
        for n in names:
            path = os.path.join(root, n)
            rel = os.path.relpath(path, HOME)
            try:
                if os.path.getsize(path) > 300_000:
                    out[rel] = None
                    continue
                with open(path, encoding='utf-8') as f:
                    out[rel] = f.read()
            except (UnicodeDecodeError, OSError):
                out[rel] = None
    return out


def _write_files(files):
    for rel, text in (files or {}).items():
        path = os.path.join(HOME, rel)
        os.makedirs(os.path.dirname(path), exist_ok=True)
        with open(path, 'w', encoding='utf-8') as f:
            f.write(text)
        linecache.checkcache(path)
        linecache.checkcache(rel)


def _begin():
    _transcript.clear()
    _size[0] = 0
    os.chdir(HOME)
    if HOME not in sys.path:
        sys.path.insert(0, HOME)


def _execute(code, ns):
    """Run code; returns (error info or None, exit code)."""
    try:
        exec(code, ns)
        return None, 0
    except SystemExit as e:
        if e.code is None or e.code == 0:
            return None, 0
        if isinstance(e.code, int):
            return None, e.code
        _say('err', str(e.code))
        return None, 1
    except BaseException as e:  # noqa: BLE001 - every learner error is reported, not raised
        return _report(e), 1


def _probe(expr, ns):
    if not expr:
        return None
    saved, saved_size = list(_transcript), _size[0]
    local = dict(ns)
    try:
        try:
            code = compile(expr, '<probe>', 'eval')
            value = eval(code, local)
        except SyntaxError:
            exec(compile(expr, '<probe>', 'exec'), local)
            value = local.get('RESULT')
        return {'value': _plain(value)}
    except BaseException as e:  # noqa: BLE001
        return {'error': type(e).__name__, 'message': str(e)}
    finally:
        _transcript[:] = saved
        _size[0] = saved_size


class LambdaContext:
    """The context object Lambda passes as the second argument."""

    def __init__(self, name='practice-function', timeout=30, memory=128):
        acct = practice_aws.STATE.get('account', '111122223333')
        region = practice_aws.STATE.get('region', 'us-east-1')
        self.function_name = name
        self.function_version = '$LATEST'
        self.invoked_function_arn = f'arn:aws:lambda:{region}:{acct}:function:{name}'
        self.memory_limit_in_mb = str(memory)
        self.aws_request_id = str(uuid.uuid4())
        self.log_group_name = f'/aws/lambda/{name}'
        self.log_stream_name = datetime.date.today().strftime('%Y/%m/%d') + '/[$LATEST]' + uuid.uuid4().hex
        self._deadline = __import__('time').time() + timeout

    def get_remaining_time_in_millis(self):
        return max(0, int((self._deadline - __import__('time').time()) * 1000))

    def __repr__(self):
        return f'<LambdaContext function_name={self.function_name} aws_request_id={self.aws_request_id}>'


def _invoke(ns, invoke):
    import time
    handler_name = invoke.get('handler', 'lambda_handler')
    fn = ns.get(handler_name)
    if not callable(fn):
        _say('err', f"Handler '{handler_name}' missing: the file needs a function named {handler_name}(event, context).")
        return {'error': {'type': 'Runtime.HandlerNotFound', 'message': f'Handler {handler_name} missing'}}
    ctx = LambdaContext(invoke.get('function', 'practice-function'), invoke.get('timeout', 30))
    event = json.loads(json.dumps(invoke.get('event', {})))
    _say('info', f'START RequestId: {ctx.aws_request_id} Version: $LATEST')
    started = time.perf_counter()
    out = {}
    try:
        response = fn(event, ctx)
        try:
            text = json.dumps(response, indent=2)
            out['response'] = json.loads(text)
        except (TypeError, ValueError) as e:
            out['error'] = {'type': 'Runtime.MarshalError', 'message': f'Unable to marshal response: {e}'}
            text = None
    except BaseException as e:  # noqa: BLE001
        out['error'] = _report(e)
        text = None
    took = (time.perf_counter() - started) * 1000
    _say('info', f'END RequestId: {ctx.aws_request_id}')
    _say('info', f'REPORT RequestId: {ctx.aws_request_id}\tDuration: {took:.2f} ms\tMemory Size: 128 MB')
    if took > invoke.get('timeout', 30) * 1000:
        _say('err', f"Task timed out after {invoke.get('timeout', 30):.2f} seconds")
        out['error'] = {'type': 'Sandbox.Timedout', 'message': 'Task timed out'}
    if 'error' in out:
        err = out['error']
        _say('info', 'Response:\n' + json.dumps({'errorMessage': err['message'], 'errorType': err['type']}, indent=2))
        if err['type'] == 'Runtime.MarshalError':
            _say('tip', 'Tip: Lambda turns the return value into JSON, and JSON has no Decimal, datetime or set. '
                        'Convert them first, e.g. float(amount) or str(when).')
    else:
        _say('info', 'Response:\n' + text)
    return out


def run_file(path, probe=None, invoke=None):
    _begin()
    _forget_user_modules()
    full = os.path.join(HOME, path)
    try:
        with open(full, encoding='utf-8') as f:
            source = f.read()
    except FileNotFoundError:
        _say('err', f"python: can't open file '{path}': [Errno 2] No such file or directory")
        return {'error': {'type': 'FileNotFoundError', 'message': path, 'line': None}, 'exitCode': 2}
    linecache.checkcache(path)
    module_name = os.path.splitext(os.path.basename(path))[0] if invoke else '__main__'
    ns = {'__name__': module_name, '__file__': full, '__builtins__': builtins}
    sys.argv = [path]
    try:
        code = compile(source, path, 'exec')
    except SyntaxError as e:
        return {'error': _report(e), 'exitCode': 1}
    error, exit_code = _execute(code, ns)
    result = {'error': error, 'exitCode': exit_code}
    if invoke and error is None:
        result['invoke'] = _invoke(ns, invoke)
    _repl.clear()
    _repl.update(ns)
    _repl['__name__'] = '__main__'
    result['probe'] = _probe(probe, ns)
    return result


def run_cell(source, probe=None):
    _begin()
    name = '<console>'
    linecache.cache[name] = (len(source), None, source.splitlines(True), name)
    try:
        tree = ast.parse(source, name, 'exec')
    except SyntaxError as e:
        return {'error': _report(e), 'exitCode': 1, 'probe': _probe(probe, _repl)}
    last = None
    if tree.body and isinstance(tree.body[-1], ast.Expr):
        last = ast.Expression(tree.body.pop().value)
    error, exit_code = _execute(compile(tree, name, 'exec'), _repl)
    if error is None and last is not None:
        try:
            value = eval(compile(last, name, 'eval'), _repl)
            if value is not None:
                _repl['_'] = value
                _say('out', repr(value))
        except BaseException as e:  # noqa: BLE001
            error, exit_code = _report(e), 1
    return {'error': error, 'exitCode': exit_code, 'probe': _probe(probe, _repl)}


def reset(scenario):
    scenario = scenario or {}
    os.chdir('/')
    shutil.rmtree(HOME, ignore_errors=True)
    os.makedirs(HOME)
    os.chdir(HOME)
    _write_files(scenario.get('files'))
    for k in _env_keys:
        os.environ.pop(k, None)
    _env_keys.clear()
    for k, v in (scenario.get('env') or {}).items():
        os.environ[k] = str(v)
        _env_keys.add(k)
    os.environ['AWS_DEFAULT_REGION'] = (scenario.get('aws') or {}).get('region', 'us-east-1')
    practice_aws.reset(scenario.get('aws'))
    practice_net.reset(scenario.get('web'), scenario.get('certs'))
    _forget_user_modules()
    _repl.clear()
    _repl.update({'__name__': '__main__', '__builtins__': builtins})
    if scenario.get('setup'):
        _begin()
        exec(compile(scenario['setup'], '<setup>', 'exec'), _repl)
        _transcript.clear()


def handle(raw):
    req = json.loads(raw)
    op = req.get('op')
    if op == 'reset':
        reset(req.get('scenario'))
        return json.dumps({'ok': True})
    _write_files(req.get('files'))
    if op == 'run':
        result = run_file(req['path'], req.get('probe'), req.get('invoke'))
    elif op == 'cell':
        result = run_cell(req['source'], req.get('probe'))
    else:
        return json.dumps({'error': {'type': 'BadRequest', 'message': f'unknown op {op}'}})
    out_text = ''.join(t for s, t in _transcript if s == 'out')
    err_text = ''.join(t for s, t in _transcript if s == 'err')
    result.update({
        'transcript': [{'stream': s, 'text': t} for s, t in _transcript],
        'stdout': out_text,
        'stderr': err_text,
        'files': _files(),
        'aws': practice_aws.snapshot(),
        'web': practice_net.snapshot(),
    })
    return json.dumps(result, default=lambda v: _plain(v))


def install():
    sys.stdout = _Stream('out')
    sys.stderr = _Stream('err')
    builtins.input = _no_input
    practice_net.install()
    practice_aws.install()
    helper = types.ModuleType('practice')
    helper.__dict__.update(context=LambdaContext, aws=practice_aws, net=practice_net, files=_files,
                           PracticeAccountError=practice_aws.PracticeAccountError)
    sys.modules['practice'] = helper
    os.makedirs(HOME, exist_ok=True)
    os.chdir(HOME)
    if HOME not in sys.path:
        sys.path.insert(0, HOME)

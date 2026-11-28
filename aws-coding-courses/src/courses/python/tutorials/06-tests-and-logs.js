// Tutorial 6: automated tests for the order pipeline from Tutorial 4, tests
// for code that calls AWS (without AWS), and logs a person can search.
import { VALIDATE_FUNCTION, BUCKET, GOOD_KEY, BAD_KEY, orderFiles, s3Event } from './04-upload-pipeline';

// ---------------------------------------------------------------------------
// The code under test
//   orders.py           validate_order, exactly as written in Tutorial 4
//   FRIDAY_ORDERS_PY    the same file after a "tidy-up" that added two bugs
//   lambda_function.py  the pipeline, now importing orders.py. AWS errors are
//                       caught as ClientError + error code, so a test can make them.
// The checks run the learner's tests against the right code and against
// versions with one bug each ("mutants"): good tests pass on the first and
// fail on every mutant. A test that asserts nothing passes on all of them.
// ---------------------------------------------------------------------------

// Swap one piece of code for another; fails loudly if the code has changed
const mutate = (source, from, to) => {
  if (!source.includes(from)) throw new Error(`Tutorial 6: this code is no longer in the source: ${from}`);
  return source.replace(from, to);
};

export const ORDERS_PY = `# orders.py: is this row a real order? (validate_order from Tutorial 4)
${VALIDATE_FUNCTION}
`;

const ZERO_BUG = ['if quantity <= 0:', 'if quantity < 0:'];
const CASE_BUG = [
  'currency = row["currency"].strip().upper()\n    if currency not in CURRENCIES:',
  'currency = row["currency"].strip()\n    if currency.upper() not in CURRENCIES:',
];

export const FRIDAY_ORDERS_PY = mutate(mutate(ORDERS_PY, ...ZERO_BUG), ...CASE_BUG)
  .replace('(validate_order from Tutorial 4)', '(after Friday\'s tidy-up)');

const ORDER_MUTANTS = {
  total: mutate(ORDERS_PY, '"total": unit_price * quantity,', '"total": unit_price + quantity,'),
  comma: mutate(ORDERS_PY, 'Decimal(row["unit_price"].strip())', 'Decimal(row["unit_price"].strip().replace(",", "."))'),
  sku: mutate(ORDERS_PY, '"order_date", "sku", "quantity"', '"order_date", "quantity"'),
  // refused, but for a reason that no longer names the column
  commaReason: mutate(ORDERS_PY, 'return None, f"unit_price {row[\'unit_price\']!r} is not a number"', 'return None, "that is not a number"'),
  skuReason: mutate(ORDERS_PY, 'return None, f"missing {column}"', 'return None, "a column is missing"'),
  zero: mutate(ORDERS_PY, ...ZERO_BUG),
  one: mutate(ORDERS_PY, 'if quantity <= 0:', 'if quantity <= 1:'),
  case: mutate(ORDERS_PY, ...CASE_BUG),
};

const lambdaTop = (logging) => String.raw`# lambda_function.py: check each uploaded order file and save the good orders.
# Trigger: S3 "object created" events for incoming/ only.
import csv
import io
import json
${logging ? 'import logging\n' : ''}import os
import urllib.parse

import boto3
from botocore.exceptions import ClientError

from orders import validate_order

s3 = boto3.client("s3")
table = boto3.resource("dynamodb").Table(os.environ.get("TABLE_NAME", "Orders"))
`;

const LAMBDA_HELPERS = String.raw`

def read_orders(text):
    """Check every row. Returns (orders, problems)."""
    orders, problems = [], []
    for line, row in enumerate(csv.DictReader(io.StringIO(text)), start=2):
        order, reason = validate_order(row)
        if reason:
            problems.append(f"line {line}: {reason}")
        else:
            orders.append(order)
    return orders, problems


def move(bucket, key, folder):
    """incoming/x.csv -> <folder>x.csv. S3 has no rename: copy, then delete."""
    new_key = folder + key.split("/", 1)[1]
    s3.copy_object(Bucket=bucket, Key=new_key, CopySource={"Bucket": bucket, "Key": key})
    s3.delete_object(Bucket=bucket, Key=key)
    return new_key


def save_order(order):
    """Save one order. Returns False if it was already saved (a retry or a resend)."""
    try:
        table.put_item(Item=order, ConditionExpression="attribute_not_exists(order_id)")
        return True
    except ClientError as e:
        if e.response["Error"]["Code"] == "ConditionalCheckFailedException":
            return False
        raise  # anything else is a real failure: let Lambda see it and retry
`;

// The handler, with one line per thing worth telling a person. `say` holds
// those lines: print() calls before the logging step, logger calls after.
const handler = (say) => String.raw`

def lambda_handler(event, context):
    summary = {"files": 0, "saved": 0, "duplicates": 0, "rejected": []}
    for record in event["Records"]:
        bucket = record["s3"]["bucket"]["name"]
        key = urllib.parse.unquote_plus(record["s3"]["object"]["key"])
        try:
            text = s3.get_object(Bucket=bucket, Key=key)["Body"].read().decode("utf-8")
        except ClientError as e:
            if e.response["Error"]["Code"] != "NoSuchKey":
                raise
            ${say.gone}
            continue
        summary["files"] += 1

        orders, problems = read_orders(text)
        if problems:
            new_key = move(bucket, key, "rejected/")
            s3.put_object(Bucket=bucket, Key=new_key + ".error.txt",
                          Body="\n".join(problems) + "\n", ContentType="text/plain")
            ${say.rejected}
            summary["rejected"].append(key)
            continue

        saved = 0
        for order in orders:
            order["source_file"] = key
            if save_order(order):
                saved += 1
        duplicates = len(orders) - saved
        summary["saved"] += saved
        summary["duplicates"] += duplicates
        move(bucket, key, "processed/")
        ${say.processed}

    ${say.summary}
    return summary
`;

const PRINTS = {
  gone: 'print(f"{key} is already gone: handled by an earlier try")',
  rejected: 'print(f"REJECTED {key}: {len(problems)} problem(s), first: {problems[0]}")',
  processed: 'print(f"OK {key}: {saved} saved, {duplicates} already there")',
  summary: 'print(json.dumps(summary))',
};

const LOGS = {
  gone: 'logger.info("Skipped %s: already handled by an earlier try", key)',
  rejected: 'logger.warning("Rejected %s: %d problem(s), first: %s", key, len(problems), problems[0])',
  processed: 'logger.info("Processed %s: %d saved, %d already there", key, saved, duplicates)',
  summary: 'logger.info("Done: %s", json.dumps(summary))',
};

export const LAMBDA_PY = `${lambdaTop(false)}${LAMBDA_HELPERS}${handler(PRINTS)}`;

const LOGGING_STARTER = `${lambdaTop(true)}
# TODO 1: make the logger, and let INFO through:
#         logger = logging.getLogger()
#         logger.setLevel(logging.INFO)
${LAMBDA_HELPERS}

# TODO 2: replace each of the four print() calls below with the logger, at the
#         level that fits:
#           a file that was processed, a retry that found nothing to do, and the
#           summary are normal work                      -> logger.info(...)
#           a rejected file needs a person to act        -> logger.warning(...)
#         Pass the values as arguments: logger.info("Processed %s: %d saved", key, saved)
${handler(PRINTS)}`;

export const LOGGING_SOLUTION = `${lambdaTop(true)}
logger = logging.getLogger()
logger.setLevel(logging.INFO)
${LAMBDA_HELPERS}${handler(LOGS)}`.trimEnd();

const LAMBDA_MUTANTS = {
  condition: mutate(LAMBDA_PY, 'table.put_item(Item=order, ConditionExpression="attribute_not_exists(order_id)")', 'table.put_item(Item=order)'),
  duplicate: mutate(LAMBDA_PY, '"ConditionalCheckFailedException":\n            return False', '"ConditionalCheckFailedException":\n            return True'),
  hidden: mutate(LAMBDA_PY, '            return False\n        raise  # anything else is a real failure: let Lambda see it and retry', '            return False\n        return False'),
  badfile: mutate(LAMBDA_PY, 'summary["rejected"].append(key)\n            continue', 'summary["rejected"].append(key)'),
};

// ---------------------------------------------------------------------------
// The tests the learner writes
// ---------------------------------------------------------------------------

const TEST_ORDERS_HEAD = String.raw`# test_orders.py: tests for validate_order
import unittest
from decimal import Decimal

from orders import validate_order

GOOD = {"order_id": "NW-2001", "partner": "northwind", "order_date": "2026-10-29",
        "sku": "CAB-USB-C", "quantity": "3", "unit_price": "12.50", "currency": "USD"}


class TestValidateOrder(unittest.TestCase):
    def test_good_row_is_accepted(self):
        order, reason = validate_order(GOOD)
        self.assertIsNone(reason)
        self.assertEqual(order["quantity"], 3)
        self.assertEqual(order["total"], Decimal("37.50"))
`;

const FIRST_TESTS = String.raw`
    def test_comma_price_is_refused(self):
        order, reason = validate_order({**GOOD, "unit_price": "4,99"})
        self.assertIsNone(order)
        self.assertIn("unit_price", reason)

    def test_missing_sku_is_refused(self):
        order, reason = validate_order({**GOOD, "sku": ""})
        self.assertIsNone(order)
        self.assertEqual(reason, "missing sku")
`;

const EDGE_TESTS = String.raw`
    def test_quantity_below_one_is_refused(self):
        for quantity in ["0", "-1"]:
            with self.subTest(quantity=quantity):
                order, reason = validate_order({**GOOD, "quantity": quantity})
                self.assertIsNone(order)
                self.assertIn("quantity", reason)

    def test_quantity_one_is_accepted(self):
        order, reason = validate_order({**GOOD, "quantity": "1"})
        self.assertIsNone(reason)
        self.assertEqual(order["quantity"], 1)

    def test_currency_is_cleaned(self):
        order, reason = validate_order({**GOOD, "currency": " eur "})
        self.assertIsNone(reason)
        self.assertEqual(order["currency"], "EUR")
`;

const TEST_MAIN = String.raw`

if __name__ == "__main__":
    unittest.main()
`;

const FIRST_STARTER = `${TEST_ORDERS_HEAD}
    # TODO 1: test_comma_price_is_refused
    #   A price of "4,99" must come back as (None, a reason).
    #   Assert that the order is None, and that "unit_price" is in the reason.

    # TODO 2: test_missing_sku_is_refused
    #   An empty sku ("") must come back as (None, "missing sku").
${TEST_MAIN}`;

const FIRST_SOLUTION = `${TEST_ORDERS_HEAD}${FIRST_TESTS}${TEST_MAIN}`.trimEnd();

const EDGE_STARTER = `${TEST_ORDERS_HEAD}${FIRST_TESTS}
    # TODO 1: finance found an order for 0 items. Test the edge from both sides:
    #   a quantity of "0" (and "-1") is refused, and a quantity of "1" is accepted.

    # TODO 2: the report shows "usd" and "USD" as two currencies.
    #   A currency of " eur " must be accepted, and stored as "EUR".
${TEST_MAIN}`;

const EDGE_SOLUTION = `${TEST_ORDERS_HEAD}${FIRST_TESTS}${EDGE_TESTS}${TEST_MAIN}`.trimEnd();

const TEST_LAMBDA_HEAD = String.raw`# test_lambda_function.py: test the pipeline without touching AWS
import io
import unittest
from unittest.mock import patch

from botocore.exceptions import ClientError

import lambda_function

ORDER = {"order_id": "NW-2001", "sku": "CAB-USB-C", "quantity": 3}
HEADER = "order_id,partner,order_date,sku,quantity,unit_price,currency"
# One good row and one bad one (quantity 0): the whole file must be rejected
BAD_FILE = HEADER + "\nGX-3001,globex,2026-10-29,HDMI-2M,2,8.99,GBP\nGX-3002,globex,2026-10-29,SSD-1TB,0,74.00,GBP\n"


def s3_event(key):
    """Only the parts of an S3 event that the handler reads."""
    return {"Records": [{"s3": {"bucket": {"name": "test-bucket"}, "object": {"key": key}}}]}


def aws_error(code):
    """The error boto3 raises when AWS answers put_item with this error code."""
    return ClientError({"Error": {"Code": code, "Message": "made up by the test"}}, "PutItem")


class TestHandler(unittest.TestCase):
    def test_bad_file_saves_nothing(self):
        with patch.object(lambda_function, "s3") as s3:
            with patch.object(lambda_function, "table") as table:
                s3.get_object.return_value = {"Body": io.BytesIO(BAD_FILE.encode("utf-8"))}
                summary = lambda_function.lambda_handler(s3_event("incoming/globex.csv"), None)
        table.put_item.assert_not_called()
        self.assertEqual(summary["rejected"], ["incoming/globex.csv"])


class TestSaveOrder(unittest.TestCase):
    def test_new_order_is_saved(self):
        with patch.object(lambda_function, "table") as table:
            saved = lambda_function.save_order(ORDER)
        self.assertTrue(saved)
`;

const MOCK_STARTER = `${TEST_LAMBDA_HEAD}        # TODO 1: the condition is what stops duplicates. Assert that put_item was
        #         called once, with Item=ORDER and the ConditionExpression.

    # TODO 2: test_duplicate_returns_false
    #   Make table.put_item raise aws_error("ConditionalCheckFailedException")
    #   with side_effect, and assert that save_order(ORDER) returns False.

    # TODO 3: test_other_errors_are_not_hidden
    #   Make it raise aws_error("ThrottlingException"):
    #   DynamoDB is too busy. save_order must let that error out (assertRaises).
${TEST_MAIN}`;

const MOCK_SOLUTION = `${TEST_LAMBDA_HEAD}${String.raw`        table.put_item.assert_called_once_with(
            Item=ORDER, ConditionExpression="attribute_not_exists(order_id)")

    def test_duplicate_returns_false(self):
        with patch.object(lambda_function, "table") as table:
            table.put_item.side_effect = aws_error("ConditionalCheckFailedException")
            self.assertFalse(lambda_function.save_order(ORDER))

    def test_other_errors_are_not_hidden(self):
        with patch.object(lambda_function, "table") as table:
            table.put_item.side_effect = aws_error("ThrottlingException")
            with self.assertRaises(ClientError):
                lambda_function.save_order(ORDER)
`}${TEST_MAIN}`.trimEnd();

// ---------------------------------------------------------------------------
// Checks
// ---------------------------------------------------------------------------

// Runs every TestCase the learner's file defined against each version of the
// module under test, by pointing the names their tests use at that version.
// Also notes any call the tests made to the practice AWS account.
const VARIANT_RUNNER = String.raw`import sys as _sys, types as _types, unittest as _unittest
import practice as _practice


def _run_variants(name, variants):
    cases = []
    for value in list(globals().values()):
        if (isinstance(value, type) and issubclass(value, _unittest.TestCase)
                and not value.__module__.startswith("unittest") and value not in cases):
            cases.append(value)
    spaces = []
    for case in cases:
        for attr in vars(case).values():
            space = getattr(attr, "__globals__", None)
            if space is not None and not any(space is s for s in spaces):
                spaces.append(space)
    # Things that look like tests but that unittest never runs
    stray = [key for key, value in list(globals().items())
             if isinstance(value, _types.FunctionType) and not key.startswith("_")
             and value.__code__.co_varnames[:value.__code__.co_argcount][:1] == ("self",)]
    unnamed = [key for case in cases for key, value in vars(case).items()
               if isinstance(value, _types.FunctionType) and not key.startswith(("test", "_"))
               and value.__code__.co_argcount == 1 and any(n.startswith("assert") for n in value.__code__.co_names)]
    loader = _unittest.TestLoader()
    out = {"tests": sum(len(loader.getTestCaseNames(case)) for case in cases), "variants": {},
           "stray": stray, "unnamed": unnamed}
    # Each version is run inside the module object the tests imported, so that
    # "import x", "from x import f" and a patch made by a decorator (which keeps
    # hold of the module it was given) all reach the version being tried.
    before = _sys.modules.get(name)
    module = before if before is not None else _types.ModuleType(name)
    kept = dict(module.__dict__)
    try:
        for label, source in variants.items():
            module.__dict__.clear()
            module.__dict__.update({"__name__": name, "__file__": name + ".py"})
            exec(compile(source, name + ".py", "exec"), module.__dict__)
            # Same boto3 objects (table, s3) in every version: a patch made on one
            # of them (patch.object(lambda_function.table, "put_item")) still applies
            for key, value in kept.items():
                now = module.__dict__.get(key)
                if type(now) is type(value) and type(value).__module__ == _practice.aws.__name__:
                    module.__dict__[key] = value
            _sys.modules[name] = module
            swapped = []
            for space in spaces:
                for key, value in list(space.items()):
                    if (callable(value) and getattr(value, "__module__", None) == name
                            and hasattr(module, getattr(value, "__name__", ""))):
                        swapped.append((space, key, value))
                        space[key] = getattr(module, value.__name__)
            result = _unittest.TestResult()
            calls = len(_practice.aws.CALLS)
            try:
                _unittest.TestSuite(loader.loadTestsFromTestCase(case) for case in cases).run(result)
            finally:
                for space, key, value in swapped:
                    space[key] = value
            failed = sorted({getattr(getattr(test, "test_case", test), "_testMethodName", str(test))
                             for test, _ in result.failures + result.errors})
            reached = [call["service"] + " " + call["op"] for call in _practice.aws.CALLS[calls:]]
            out["variants"][label] = {"ran": result.testsRun, "failed": failed, "aws": reached}
    finally:
        module.__dict__.clear()
        module.__dict__.update(kept)
        if before is None:
            _sys.modules.pop(name, None)
    return out
`;

const variantProbe = (name, variants) => `import json as _json
${VARIANT_RUNNER}
RESULT = _run_variants(${JSON.stringify(name)}, _json.loads(r'''${JSON.stringify(variants)}'''))`;

// misses: [[variant, what to tell the learner when their tests don't notice it]]
const judgeTests = ({ probe, probeError, result, kind }, file, misses) => {
  if (kind !== 'run' || result.error || probeError || !probe?.variants) return null;
  if (!probe.tests) return `No tests ran. Run \`${file}\`, the first editor: a test is a method whose name starts with \`test\`, inside a class that says \`(unittest.TestCase)\`.`;
  const right = probe.variants.correct;
  if (right.failed.length) return `\`${right.failed[0]}\` fails even when the code is right. Read its failure in the console: what the test expects doesn't match what the code should do.`;
  for (const [variant, message] of misses) {
    if (probe.variants[variant].failed.length) continue;
    if (probe.stray?.length) return `\`${probe.stray[0]}\` isn't inside the class, so \`unittest\` never runs it. Indent the whole function four spaces, in line with the test above it.`;
    if (probe.unnamed?.length) return `\`${probe.unnamed[0]}\` isn't run as a test: \`unittest\` only runs methods whose names start with \`test\`. Rename it \`test_${probe.unnamed[0]}\`.`;
    return message;
  }
  if (!/Ran \d+ tests?/.test(result.stderr)) return 'The tests are right, but running the file didn\'t run them. End it with `if __name__ == "__main__":` and, indented under it, `unittest.main()`.';
  return true;
};

// The check reads what the function logged from the probe below, not from the
// console, so it doesn't matter what an earlier test left in the bucket and table.
const checkLogging = ({ result, probe, probeError, kind, sources }) => {
  if (kind !== 'run' || !result.invoke || result.error) return null;
  if (result.invoke.error) return `The function failed with ${result.invoke.error.type}: ${result.invoke.error.message}`;
  if (probeError) return `Running the function again, the way a retry does, failed with ${probeError}.`;
  if (!Array.isArray(probe?.first?.logs) || probe.first.answer?.rejected?.length !== 1) return null;
  const code = Object.values(sources || {}).join('\n').replace(/#.*$/gm, '');
  const logs = probe.first.logs.map(([level, text]) => ({ level, text }));
  const quiet = (level) => level === 'DEBUG' || level === 'INFO';
  if (!logs.length && !/logger\.|logging\.(debug|info|warning|error)/.test(code)) {
    return 'Start with TODO 1: `logger = logging.getLogger()` and `logger.setLevel(logging.INFO)`. Then replace the first `print(...)` with `logger.info(...)`.';
  }
  // The line that reports the whole run names the rejected file too: it isn't the "rejected" line
  const isSummary = (l) => ['files', 'saved', 'duplicates'].every((word) => l.text.includes(word));
  const summary = logs.find(isSummary);
  const about = (word) => logs.filter((l) => l.text.includes(word) && !isSummary(l));
  const northwind = about('northwind');
  const globex = about('globex');
  // A learner may log more than one line about a file ("Reading x", then "Processed x"):
  // what counts is that normal work has a quiet line and the rejected file a loud one.
  if (northwind.length && !northwind.some((l) => quiet(l.level))) return `A file that was processed without trouble is normal work: log it with \`logger.info(...)\`, not ${northwind[0].level}. If everything is a warning, nobody can find the real ones.`;
  if (!logs.some((l) => quiet(l.level))) {
    const setsLevel = /setLevel\s*\(/.test(code);
    if (/basicConfig/.test(code) && !setsLevel) return '`logging.basicConfig()` does nothing in Lambda: the runtime has already set logging up, and basicConfig only acts when nothing is. Set the level on the logger instead: `logger.setLevel(logging.INFO)`.';
    if (setsLevel) return 'The level is set, but no INFO line came out of `lambda_handler`. Now TODO 2: inside the handler, replace each `print(...)` with `logger.info(...)` (or `logger.warning(...)` for the rejected file). Lines logged with `logger.debug` stay hidden at this level.';
    return 'Your INFO lines aren\'t in the log: Lambda only lets WARNING and above through until you say otherwise. Add `logger.setLevel(logging.INFO)` under `logger = logging.getLogger()`.';
  }
  if (!globex.some((l) => !quiet(l.level))) {
    if (!globex.length && logs.some((l) => !quiet(l.level) && !isSummary(l))) return 'Your warning doesn\'t say which file was rejected. Put the key in it: `logger.warning("Rejected %s: %d problem(s), first: %s", key, len(problems), problems[0])`.';
    return 'The Globex file was rejected, and someone has to tell the partner. Log that line with `logger.warning(...)`, so it stands out from normal work.';
  }
  if (!northwind.length) return 'Log the processed file too: `logger.info("Processed %s: %d saved, %d already there", key, saved, duplicates)`.';
  if (summary && !quiet(summary.level)) return `The summary of the run is normal work: log it with \`logger.info(...)\`, not ${summary.level}.`;
  const printed = `${probe.first.printed}${probe.retry.printed}`.trim();
  if (printed) return `One line still comes from print(), so it has no level and no request ID: ${printed.split('\n')[0].slice(0, 70)}`;
  if (!probe.retry.logs.some(([, text]) => /northwind/.test(text))) return 'On a retry both files are already gone. Log the skipped file too: `logger.info("Skipped %s: already handled by an earlier try", key)`.';
  return true;
};

// Puts both uploads back, runs the handler on them, then runs it again the way
// a retry does (both files gone by then). Keeps what was logged and printed.
// Ends by putting the uploads back once more, for the learner's next test.
const loggingProbe = () => {
  const { goodCsv, badCsv } = orderFiles();
  return `import contextlib, io, json, logging
import boto3, practice


class _Keep(logging.Handler):
    def __init__(self):
        super().__init__()
        self.seen = []

    def emit(self, record):
        self.seen.append([record.levelname, record.getMessage()])


def _attempt(event):
    keep, printed = _Keep(), io.StringIO()
    logging.getLogger().addHandler(keep)
    try:
        with contextlib.redirect_stdout(printed):
            answer = lambda_handler(event, practice.context())
    finally:
        logging.getLogger().removeHandler(keep)
    return {"answer": answer, "logs": keep.seen, "printed": printed.getvalue()}


def _upload_again():
    for key, text in json.loads(r'''${JSON.stringify({ [GOOD_KEY]: goodCsv, [BAD_KEY]: badCsv })}''').items():
        boto3.client("s3").put_object(Bucket=${JSON.stringify(BUCKET)}, Key=key, Body=text, ContentType="text/csv")


_event = json.loads(r'''${JSON.stringify(s3Event([[GOOD_KEY, goodCsv], [BAD_KEY, badCsv]]))}''')
_upload_again()
RESULT = {"first": _attempt(_event), "retry": _attempt(_event)}
_upload_again()  # so the learner's next test has both files to work on`;
};

// ---------------------------------------------------------------------------
// Scenarios
// ---------------------------------------------------------------------------

const ordersFolder = { files: { 'orders.py': ORDERS_PY } };

const emptyAccount = () => ({
  env: { TABLE_NAME: 'Orders' },
  files: { 'orders.py': ORDERS_PY },
  aws: { s3: { [BUCKET]: {} }, dynamodb: { Orders: { key: ['order_id'], items: [] } } },
});

// The console of the mocks lesson can also import the pipeline
const mockFolder = () => {
  const account = emptyAccount();
  return { ...account, files: { ...account.files, 'lambda_function.py': LAMBDA_PY } };
};

const pipelineScenario = () => {
  const { goodCsv, badCsv } = orderFiles();
  const csv = (body) => ({ body, contentType: 'text/csv' });
  return {
    env: { TABLE_NAME: 'Orders' },
    files: { 'orders.py': ORDERS_PY },
    aws: {
      s3: { [BUCKET]: { [GOOD_KEY]: csv(goodCsv), [BAD_KEY]: csv(badCsv) } },
      // NW-2005 was saved yesterday, so today's file has one duplicate
      dynamodb: { Orders: { key: ['order_id'], items: [
        { order_id: 'NW-2005', partner: 'northwind', order_date: '2026-10-28', sku: 'HDMI-2M', quantity: 2, unit_price: 19, currency: 'USD', total: 38, source_file: 'incoming/2026-10-28 northwind.csv' },
      ] } },
    },
  };
};

const GOOD_ROW = '{"order_id": "NW-2001", "partner": "northwind", "order_date": "2026-10-29",\n        "sku": "CAB-USB-C", "quantity": "3", "unit_price": "12.50", "currency": "USD"}';

// ---------------------------------------------------------------------------

const tutorial = {
  slug: 'test-it-before-it-ships',
  number: 6,
  title: 'Test it before it ships',
  situation: 'The order pipeline from Tutorial 4 ran for a month without trouble. Then, on a Friday afternoon, someone tidied up the checking code, tried one file by hand and deployed. On Monday finance found orders for 0 items in the table, and "usd" and "USD" listed as two currencies. Nobody could say when it started, because the logs were a wall of print lines. You write the tests that would have stopped that deploy in under a second, and logs that answer questions.',
  level: 'Advanced',
  hours: 4,
  skills: ['automated tests', 'unittest', 'edge cases', 'mocks', 'logging', 'continuous integration'],
  aws: ['AWS Lambda', 'Amazon CloudWatch Logs', 'Amazon DynamoDB', 'Amazon S3'],
  overview: 'You\'ll write automated tests with `unittest`, which comes with Python: first for `validate_order`, then for the edges where bugs hide. You\'ll test code that calls Amazon DynamoDB and Amazon S3 without touching AWS, using mocks, and swap `print` for the `logging` module so every line in Amazon CloudWatch Logs has a level, a time and a request ID. Then you run it all for real: pytest on your computer, and GitHub Actions on every push.',
  steps: [
    {
      id: 'why-tests',
      kind: 'read',
      runtime: 'python',
      title: 'Code that checks your code',
      minutes: 12,
      body: `In Tutorial 1 you checked a function by calling it with tricky inputs and looking at what came back. That's what happened on Friday too: one file, checked by eye. It works while the code is small and you remember every case. A month later nobody does.

An **automated test** is that same check, written down as code: call the function, and compare the answer with the one you expect. The computer does the looking, the same way every time, in milliseconds. Run all the tests before every deploy, and a change that breaks an old rule fails on your computer instead of in finance's report.

The practice folder has \`orders.py\`, with \`validate_order\` exactly as you wrote it in Tutorial 4. First by hand. Run the boxes on this page in order, from the top: each one builds on the ones before it.

\`\`\`python
from orders import validate_order

GOOD = ${GOOD_ROW}
validate_order(GOOD)
\`\`\`

\`\`\`python
validate_order({**GOOD, "quantity": "0"})
\`\`\`

\`{**GOOD, "quantity": "0"}\` is a copy of \`GOOD\` with one value changed: handy for trying one bad thing at a time.

### The same check, as a test

Python comes with a testing toolkit called \`unittest\`. A test looks like this:

\`\`\`python
import unittest

class TestValidateOrder(unittest.TestCase):
    def test_good_row_is_accepted(self):
        order, reason = validate_order(GOOD)
        self.assertIsNone(reason)
        self.assertEqual(order["quantity"], 3)

unittest.main()
\`\`\`

Three things are new:

- \`class TestValidateOrder(unittest.TestCase):\` starts a **class**: a named group of functions that belong together. You haven't written one before, and for tests you only need this recipe. The part in brackets says "this group is a set of tests".
- Each function inside whose name starts with \`test\` is **one test**. That name is how \`unittest\` finds them. Functions inside a class are called **methods**, and their first parameter is always \`self\`: the test itself, which is where the checking tools live.
- \`self.assertEqual(a, b)\` is an **assertion**: the test passes if \`a == b\` and fails if not. \`self.assertIsNone(x)\` passes if \`x\` is \`None\`.

\`unittest.main()\` runs every test it finds and prints a report: one \`.\` per passing test, then \`OK\`.

> The report is in red here because \`unittest\` writes it to *standard error*, the channel for messages that aren't a program's results, and this console shows that channel in red. Red doesn't mean failed. Read the last line.

### What a failure looks like

Now a test with the wrong expectation, and one with a typo:

\`\`\`python
from decimal import Decimal

class TestValidateOrder(unittest.TestCase):
    def test_total(self):
        order, reason = validate_order(GOOD)
        self.assertEqual(order["total"], Decimal("37.00"))

    def test_currency(self):
        order, reason = validate_order(GOOD)
        self.assertEqual(order["curency"], "USD")

unittest.main()
\`\`\`

Read it from the top:

| In the first line | Means |
|---|---|
| \`.\` | the test passed |
| \`F\` | **failure**: an assertion was false. The report shows both values: \`Decimal('37.50') != Decimal('37.00')\` |
| \`E\` | **error**: the test crashed before it could check anything, here with a \`KeyError\` |

Each problem gets its own block with the test's name and the line that failed, and the last line counts them: \`FAILED (failures=1, errors=1)\`. A failing test doesn't stop the others: you get the whole picture in one run.

### Where tests live

Tests go in their own file, next to the code, named \`test_\` plus the name of the file they test: \`test_orders.py\` for \`orders.py\`. The file ends with two lines that run the tests when you run the file. Python sets \`__name__\` to \`"__main__"\` only in the file you ran, so the tests run when you run this file, and not when another file imports it:

\`\`\`test_orders.py
if __name__ == "__main__":
    unittest.main()
\`\`\`

The Lambda function never imports the test file, so tests cost nothing where the code runs.`,
      scenario: ordersFolder,
    },
    {
      id: 'first-tests',
      kind: 'try',
      runtime: 'python',
      title: 'Your first tests',
      minutes: 20,
      body: `\`test_orders.py\` has one finished test. Use it as the pattern: **arrange** the input, **act** by calling the function, **assert** on what came back. \`orders.py\` is in the second editor so you can read the rules while you write. You don't need to change it.

Two assertions you'll want:

| Assertion | Passes when |
|---|---|
| \`self.assertIsNone(order)\` | \`order\` is \`None\` |
| \`self.assertIn("unit_price", reason)\` | the text \`"unit_price"\` is somewhere in \`reason\` |`,
      task: 'Add two tests to `test_orders.py`: a price of `"4,99"` is refused with a reason that mentions `unit_price`, and an empty `sku` is refused with the reason `"missing sku"`. Then run the file: three tests, `OK`.',
      hint: 'Copy the shape of the first test. `order, reason = validate_order({**GOOD, "unit_price": "4,99"})`, then `self.assertIsNone(order)` and `self.assertIn("unit_price", reason)`. For the sku: `{**GOOD, "sku": ""}` and `self.assertEqual(reason, "missing sku")`. Each test is a `def test_...(self):` indented inside the class.',
      solution: FIRST_SOLUTION,
      files: [{ path: 'test_orders.py', starter: FIRST_STARTER }, { path: 'orders.py', starter: ORDERS_PY }],
      scenario: {},
      probe: variantProbe('orders', { correct: ORDERS_PY, total: ORDER_MUTANTS.total, comma: ORDER_MUTANTS.comma, sku: ORDER_MUTANTS.sku, commaReason: ORDER_MUTANTS.commaReason, skuReason: ORDER_MUTANTS.skuReason }),
      check: (attempt) => judgeTests(attempt, 'test_orders.py', [
        ['total', 'Your tests would still pass if the total were worked out wrong. Keep the first test\'s `self.assertEqual(order["total"], Decimal("37.50"))`.'],
        ['comma', 'Your tests would still pass if `validate_order` started accepting a price of "4,99". Add a test that calls it with `{**GOOD, "unit_price": "4,99"}` and asserts that the order is `None`. (A test with no assertion can never fail.)'],
        ['sku', 'Your tests would still pass if `validate_order` stopped checking for an empty sku. Add a test with `{**GOOD, "sku": ""}` that asserts the order is `None` and the reason is `"missing sku"`.'],
        ['commaReason', 'Your test for "4,99" would still pass if the row were refused for some other reason. Say which one you expect: `self.assertIn("unit_price", reason)`.'],
        ['skuReason', 'Your test for the empty sku would still pass if the row were refused for some other reason. Say which one you expect: `self.assertEqual(reason, "missing sku")`.'],
      ]),
      success: 'Three rules are now written down twice: once in the code, once in a test that fails if the code ever stops following them. This step was checked the same way: your tests were run against versions of `validate_order` with one rule broken each, and they caught every one.',
    },
    {
      id: 'good-tests',
      kind: 'read',
      runtime: 'python',
      title: 'What a good test checks',
      minutes: 15,
      body: `A test is only worth having if it **fails when the code is wrong**. That sounds obvious, and it's where most weak tests go wrong.

Run the boxes on this page in order, from the top: the later ones use \`GOOD\` and the imports from the first.

### The test that can't fail

\`\`\`python
import unittest
from orders import validate_order

GOOD = ${GOOD_ROW}

class TestValidateOrder(unittest.TestCase):
    def test_quantity_zero(self):
        validate_order({**GOOD, "quantity": "0"})

unittest.main()
\`\`\`

\`OK\`, and it proves nothing: there's no assertion, so it passes whatever \`validate_order\` returns. It only fails if the function crashes. The quick way to know a test works is to **see it fail once**: break the rule in the code on purpose, run the test, and watch it go red. Then put the rule back.

A weaker cousin is the assertion that's too loose. \`self.assertTrue(reason)\` passes for *any* reason, so a row refused for the wrong reason still passes. Say what you mean: \`self.assertIn("quantity", reason)\`.

### Bugs live at the edges

The rule is "quantity must be more than 0". Testing 3 and -5 tells you little: almost any version of the code gets those right. Mistakes happen where the answer changes, between 0 and 1: \`<\` typed for \`<=\`. So test **both sides of every edge**: 0 is refused, 1 is accepted.

When several inputs should behave the same way, loop over them inside one test. \`self.subTest(...)\` labels each round, so a failure says *which* input it was, and the loop carries on to the others:

\`\`\`python
class TestValidateOrder(unittest.TestCase):
    def test_bad_prices_are_refused(self):
        for price in ["4,99", "free", "-3.00", "0", "NaN"]:
            with self.subTest(price=price):
                order, reason = validate_order({**GOOD, "unit_price": price})
                self.assertIsNone(order)

unittest.main()
\`\`\`

A list of edges worth a test for almost any function: **zero, one, a negative number, empty text, text with spaces around it, capitals where you expect small letters, and the thing that broke last time**.

### When code should raise an error

Some code is *meant* to fail on bad input. \`assertRaises\` passes only if the block raises that error:

\`\`\`python
from decimal import Decimal, InvalidOperation

class TestDecimal(unittest.TestCase):
    def test_comma_is_not_a_number(self):
        with self.assertRaises(InvalidOperation):
            Decimal("4,99")

unittest.main()
\`\`\`

(That report counts two tests: the console still remembers \`TestValidateOrder\` from the box above, and runs it again.)

### A bug report becomes a test first

When something breaks in production, the first move isn't to fix it. It's to **write the test that shows the bug**: it fails, which proves the test can see the problem. Then fix the code, and the same test passing proves the fix. It stays in the file for good, so that bug can't quietly return. That's called a **regression test**.

### Small habits

- **One reason to fail per test.** A test named \`test_quantity_zero_is_refused\` that fails tells you what broke before you've read a line of it. A test named \`test_everything\` doesn't.
- **Tests don't depend on each other**, or on the order they run in. Each one builds what it needs.
- **Don't test Python.** There's no point checking that \`Decimal\` can multiply. Test the rules *your* code adds.`,
      scenario: ordersFolder,
    },
    {
      id: 'regression',
      kind: 'try',
      runtime: 'python',
      title: 'Catch Friday\'s bugs',
      minutes: 25,
      body: `The second editor now has \`orders.py\` **as it was deployed on Friday**. Run \`test_orders.py\`: your three tests pass. That's the uncomfortable part: tests only catch what they check.

Monday's two bug reports:

1. An order for **0 items** was saved, with a total of 0.00.
2. Finance's report lists \`usd\` and \`USD\` as two different currencies.

Write the tests first. With the right tests, the run shows **failures**: that's the goal here, because it proves they can see both bugs. Then find the two lines in \`orders.py\`, fix them, and run again until it says \`OK\`.`,
      task: 'Add tests to `test_orders.py` that catch both bugs: a quantity of `"0"` is refused and a quantity of `"1"` is accepted (both sides of the edge), and a currency of `" eur "` is accepted and stored as `"EUR"`. The step is done when your tests fail on Friday\'s code and pass on the right code.',
      hint: 'Three tests: `validate_order({**GOOD, "quantity": "0"})` gives an order that `assertIsNone`; `{**GOOD, "quantity": "1"}` gives a reason that `assertIsNone` and `order["quantity"]` equal to 1; `{**GOOD, "currency": " eur "}` gives `order["currency"]` equal to `"EUR"`. Then, in `orders.py`: `quantity < 0` should be `<= 0`, and the currency needs `.upper()` where it\'s stored, not only where it\'s checked.',
      solution: EDGE_SOLUTION,
      files: [{ path: 'test_orders.py', starter: EDGE_STARTER }, { path: 'orders.py', starter: FRIDAY_ORDERS_PY }],
      scenario: {},
      probe: variantProbe('orders', { correct: ORDERS_PY, zero: ORDER_MUTANTS.zero, one: ORDER_MUTANTS.one, case: ORDER_MUTANTS.case, comma: ORDER_MUTANTS.comma }),
      check: (attempt) => judgeTests(attempt, 'test_orders.py', [
        ['comma', 'Keep the three tests from the last step: they still guard the old rules.'],
        ['zero', 'Your tests don\'t see the first bug yet: they pass even when an order for 0 items is accepted. Add a test that calls `validate_order({**GOOD, "quantity": "0"})` and asserts that the order is `None`.'],
        ['one', 'Zero is caught. Now the other side of the edge: your tests would also pass if someone "fixed" the bug by refusing a quantity of 1. Add a test that `"1"` is accepted: the reason is `None` and `order["quantity"]` is 1.'],
        ['case', 'Your tests don\'t see the second bug yet: the currency is checked in capitals but stored as it was typed. Add a test that `{**GOOD, "currency": " eur "}` gives `order["currency"] == "EUR"`.'],
      ]),
      success: 'Your tests fail on Friday\'s code and pass on the right code, which is exactly what a regression test is for. If the console still says `FAILED`, fix the two lines in `orders.py` (`<` for `<=`, and a lost `.upper()`) and run again. With these tests in place on Friday, the deploy would have stopped at the first run.',
    },
    {
      id: 'mocks',
      kind: 'read',
      runtime: 'python',
      title: 'Testing code that calls AWS, without AWS',
      minutes: 18,
      body: `\`validate_order\` was easy to test: values in, values out. \`save_order\` isn't: it calls DynamoDB. A test that used a real table would need an AWS account and credentials wherever it runs, would cost money, would take seconds instead of milliseconds, and would leave test orders behind. Worst of all, it couldn't test the interesting cases: you can't ask the real DynamoDB to be too busy for a moment.

So in a test you swap the table for a **mock**: a stand-in object that accepts any call, remembers it, and answers whatever you tell it to. Python's is \`MagicMock\`:

\`\`\`python
from unittest.mock import MagicMock

table = MagicMock()
table.put_item(Item={"order_id": "NW-1"})
\`\`\`

No error, though this "table" was invented a second ago. A mock makes up any method you ask for, and records how it was called:

\`\`\`python
table.put_item.call_count, table.put_item.call_args
\`\`\`

In a test you don't look, you assert. This passes silently when the call matches, and raises an \`AssertionError\` when it doesn't:

\`\`\`python
table.put_item.assert_called_once_with(Item={"order_id": "NW-1"})
\`\`\`

\`\`\`python
table.put_item.assert_called_once_with(Item={"order_id": "NW-2"})
\`\`\`

### Telling a mock what to answer

\`return_value\` is what a call gives back. \`side_effect\` makes the call **raise an error** instead, which is how you test what your code does when AWS says no:

\`\`\`python
from botocore.exceptions import ClientError

table.get_item.return_value = {"Item": {"order_id": "NW-1"}}
table.get_item(Key={"order_id": "NW-1"})
\`\`\`

\`\`\`python
table.put_item.side_effect = ClientError(
    {"Error": {"Code": "ConditionalCheckFailedException", "Message": "The conditional request failed"}}, "PutItem")
table.put_item(Item={"order_id": "NW-1"})
\`\`\`

That's the same \`ClientError\` you met in Tutorial 2, built by hand: the first argument is the answer AWS would send, the second is the name of the operation.

### Putting the mock where the code looks

The practice folder has the pipeline as \`lambda_function.py\`. It creates \`table\` and \`s3\` at the top of the file, as Tutorial 3 taught. \`patch.object\` swaps one of those names for a mock **for the length of a \`with\` block**, and puts the real one back afterwards, even if the test fails:

\`\`\`python
from unittest.mock import patch
import lambda_function

with patch.object(lambda_function, "table") as table:
    print(lambda_function.save_order({"order_id": "NW-1"}))
    print(table.put_item.call_args)

lambda_function.table
\`\`\`

Inside the block, \`save_order\` talked to the mock. After it, \`lambda_function.table\` is the real table again. Patch the name **in the file that uses it**: \`lambda_function.table\`, because that's where \`save_order\` looks it up.

### One change that makes the pipeline testable

Tutorial 4 caught the duplicate error as \`table.meta.client.exceptions.ConditionalCheckFailedException\`. With a mock table, that name is just another mock, and Python refuses to \`except\` something that isn't a real error class. So this version catches \`ClientError\` and looks at the code, the way Tutorial 2 did:

\`\`\`lambda_function.py
    except ClientError as e:
        if e.response["Error"]["Code"] == "ConditionalCheckFailedException":
            return False
        raise  # anything else is a real failure: let Lambda see it and retry
\`\`\`

Both spellings work against real AWS. This one can also be tested, and the last line matters: an error that *isn't* a duplicate must not be swallowed, or orders would vanish without a trace. The handler's check for a file that's already gone changed the same way: \`ClientError\` with the code \`NoSuchKey\`.

### What a mock can't tell you

A mock agrees with everything. If your code called \`table.put_item(Itme=order)\`, with the parameter misspelt, boto3 would refuse it before the request was even sent. A mock accepts it, and a test that only looks at what \`save_order\` returned still passes. (Python does protect you from misspelling the *assertions*: \`table.put_item.asert_called_once()\` raises an \`AttributeError\`.)

So mocks answer one question: **does my code make the calls I think it makes, and react properly to each answer?** Whether AWS accepts those calls is a different question, answered by the practice account in Tutorial 4, and by running against the real thing. AWS's own advice is to do both: fast tests with mocks for your logic, and tests in the cloud for how the pieces fit.

> Other tools you'll meet: botocore's **Stubber** hands a real boto3 client the answers you prepared, and checks them against the real API's shapes, and the **moto** library imitates whole AWS services. Neither is in the practice Python. Everything here uses only what comes with Python.`,
      scenario: mockFolder,
    },
    {
      id: 'mock-aws',
      kind: 'try',
      runtime: 'python',
      title: 'Test save_order with a mock',
      minutes: 30,
      body: `\`test_lambda_function.py\` already has one finished test, for the whole handler: it gives the handler a bad file through a mock S3, and asserts that **nothing** was saved. Read it first. \`io.BytesIO\` is \`io.StringIO\`'s sibling for bytes: it stands in for the \`Body\` that S3 returns. The file also has two helpers: \`s3_event(key)\` builds a tiny event, and \`aws_error(code)\` builds the \`ClientError\` AWS would raise.

\`save_order\` has three behaviours, and each needs a test:

| When DynamoDB… | \`save_order\` must… |
|---|---|
| accepts the write | return \`True\`, having asked for the condition |
| says the order exists already | return \`False\` |
| fails for any other reason | raise the error, so Lambda retries |

The third is the one people forget, and it's the costly one: if every error counted as "duplicate", a busy database would silently drop orders.`,
      task: 'Finish the three TODOs in `test_lambda_function.py`: assert that `put_item` was called once with `Item=ORDER` and the `ConditionExpression`; test that a `ConditionalCheckFailedException` makes `save_order` return `False`; and test that any other error comes out of `save_order`. No test may reach the practice AWS account.',
      hint: 'TODO 1: `table.put_item.assert_called_once_with(Item=ORDER, ConditionExpression="attribute_not_exists(order_id)")`. TODO 2: inside `with patch.object(lambda_function, "table") as table:` set `table.put_item.side_effect = aws_error("ConditionalCheckFailedException")`, then `self.assertFalse(lambda_function.save_order(ORDER))`. TODO 3: the same with `"ThrottlingException"`, and the call inside `with self.assertRaises(ClientError):`.',
      solution: MOCK_SOLUTION,
      files: [{ path: 'test_lambda_function.py', starter: MOCK_STARTER }, { path: 'lambda_function.py', starter: LAMBDA_PY }],
      scenario: emptyAccount,
      probe: variantProbe('lambda_function', { correct: LAMBDA_PY, ...LAMBDA_MUTANTS }),
      check: (attempt) => {
        const reached = attempt.kind === 'run' && attempt.probe?.variants?.correct?.aws;
        if (reached?.length) {
          return `A test reached the practice AWS account (${reached[0]}). Every call to \`save_order\` or the handler belongs inside \`with patch.object(lambda_function, "table") as table:\` (and \`"s3"\` for the handler).`;
        }
        return judgeTests(attempt, 'test_lambda_function.py', [
          ['badfile', 'Keep `test_bad_file_saves_nothing`: it guards the rule that one bad row rejects the whole file.'],
          ['condition', 'Your tests would still pass if someone deleted the `ConditionExpression`, and every re-sent file would overwrite saved orders. Finish TODO 1: `table.put_item.assert_called_once_with(Item=ORDER, ConditionExpression="attribute_not_exists(order_id)")`.'],
          ['duplicate', 'Your tests would still pass if a duplicate counted as saved. Finish TODO 2: set `table.put_item.side_effect = aws_error("ConditionalCheckFailedException")` and assert that `save_order(ORDER)` returns `False`.'],
          ['hidden', 'Your tests would still pass if `save_order` treated every AWS error as "duplicate" and returned `False`: lost orders, no error. Finish TODO 3: with `aws_error("ThrottlingException")` as the side effect, the call must raise (`with self.assertRaises(ClientError):`).'],
        ]);
      },
      success: 'Four tests, no AWS account, a few milliseconds. You just tested what happens when DynamoDB is too busy, which you could never arrange with the real one. To look at the practice table yourself, type `lambda_function.table.scan()["Items"]` in the console: your finished tests add nothing to it.',
    },
    {
      id: 'logging',
      kind: 'read',
      runtime: 'python',
      title: 'Logs you can search',
      minutes: 20,
      body: `Tests tell you the code is right before it ships. **Logs** tell you what it did afterwards. On Monday the question was "when did the first 0-item order arrive?", and the answer was buried in thousands of identical-looking \`print\` lines.

Python's \`logging\` module gives every line a **level**, how much it matters:

| Level | Use it for |
|---|---|
| \`DEBUG\` | detail you only want while hunting a bug |
| \`INFO\` | normal work: "processed this file, saved 11 orders" |
| \`WARNING\` | something a person should look at, though the program carried on |
| \`ERROR\` | something failed |
| \`CRITICAL\` | the program can't continue |

You ask for a **logger** once, then call the method named after the level:

\`\`\`python
import logging

logging.basicConfig(format="%(levelname)s %(message)s")
logger = logging.getLogger()
logger.warning("Rejected %s: %d problem(s)", "globex.csv", 2)
logger.info("Processed %s", "northwind.csv")
\`\`\`

\`basicConfig\` is how a script sets logging up: where the lines go and what they look like. (In Lambda you'll leave it out. More on that below.) Only the warning appeared. **By default, a logger lets WARNING and above through and drops the rest.** That's the point of levels: the INFO lines stay in the code, and one setting decides whether they're written:

\`\`\`python
logger.setLevel(logging.INFO)
logger.info("Processed %s", "northwind.csv")
\`\`\`

Notice the \`%s\` and \`%d\`. The message is a pattern, and the values follow as arguments: \`%s\` for anything, \`%d\` for a whole number. \`logging\` only builds the final text if the line is going to be written, and the pattern stays the same on every line, which makes lines easy to search for.

### Errors, with the traceback

Inside an \`except\` block, \`logger.exception\` logs your message at ERROR level **and** the full traceback: the line numbers you'd otherwise never see.

\`\`\`python
try:
    int("two")
except ValueError:
    logger.exception("Could not read the quantity")
\`\`\`

### What Lambda does with it

Everything your function writes ends up in **Amazon CloudWatch Logs**, in a log group named \`/aws/lambda/<function name>\`. You know that from \`print\`. With \`logging\` each line arrives with its level, the time and the **request ID** of the invocation that wrote it:

\`\`\`text
START RequestId: 1c8df7d3-2f4b-46da-9778-518e6eca8125 Version: $LATEST
[INFO]     2026-11-02T06:10:44.120Z  1c8df7d3-2f4b-46da-9778-518e6eca8125  Processed incoming/2026-11-02 northwind.csv: 12 saved, 0 already there
[WARNING]  2026-11-02T06:10:44.310Z  1c8df7d3-2f4b-46da-9778-518e6eca8125  Rejected incoming/2026-11-02 globex.csv: 2 problem(s), first: line 5: too many columns: is there a comma inside a value?
END RequestId: 1c8df7d3-2f4b-46da-9778-518e6eca8125
\`\`\`

When ten uploads are processed at once, the request ID is how you pull one invocation's lines out of the mix. Two things to know:

- **Lambda sets logging up for you**, and only lets WARNING and above through. So a Lambda function says \`logger.setLevel(logging.INFO)\` once, at the top of the file.
- **\`logging.basicConfig()\` does nothing in Lambda.** It's the usual way to set up logging in a script, but it only acts when nothing is set up yet, and in Lambda something already is. Code copied from a script logs nothing at INFO, and people lose an afternoon to it.

### Logs as data: the JSON format

A function's **log format** setting can be switched from text to **JSON**. Your code doesn't change, and each line arrives as a small JSON document:

\`\`\`json
{
  "timestamp": "2026-11-02T06:10:44.310Z",
  "level": "WARNING",
  "message": "Rejected incoming/2026-11-02 globex.csv: 2 problem(s), first: line 5: too many columns: is there a comma inside a value?",
  "logger": "root",
  "requestId": "1c8df7d3-2f4b-46da-9778-518e6eca8125"
}
\`\`\`

Now "show me every warning this week" is a filter on \`level\`, not a text search. In this format the level can also be chosen in the function's settings instead of the code, so you can turn DEBUG on for an hour without a deploy. A level set in the code with \`setLevel\` wins over the setting, so teams that use the setting leave \`setLevel\` out. Lines written with \`print\` stay plain text even in this format, with no level: one more reason to stop using it for logs.

### What never goes in a log

Logs are kept for a long time and read by many people. Log **which** order and **what** happened, never passwords, access keys, card numbers or a customer's personal details. A Lambda function's \`event\` can contain those: think before logging it whole.

### Testing what gets logged

If a warning matters enough that someone will set an alarm on it, it matters enough to test. \`assertLogs\` passes only if the block logs at that level or above, and keeps the lines for you to check:

\`\`\`python
import unittest

class TestLogs(unittest.TestCase):
    def test_a_rejected_file_logs_a_warning(self):
        with self.assertLogs(level="WARNING") as seen:
            logger.warning("Rejected %s: %d problem(s)", "globex.csv", 2)
        self.assertIn("globex.csv", seen.output[0])

unittest.main()
\`\`\``,
      scenario: {},
    },
    {
      id: 'log-the-handler',
      kind: 'try',
      runtime: 'python',
      title: 'Give the pipeline real logs',
      minutes: 20,
      body: `Here's the pipeline, still talking in \`print\`. **Test with the sample event** runs it the way Lambda does, with two uploads: Northwind's file (12 good orders, one of them saved yesterday) and Globex's (two bad rows). The console shows the log as CloudWatch Logs would.

Run it once before you change anything, and look at the plain lines between \`START\` and \`END\`. Then make them log lines. You can test as often as you like: the practice account puts both uploads back after every test. From the second test on, Northwind's orders are already in the table, so the function reports them as already there. That's the pipeline doing its job with a re-sent file.

There's a fourth \`print\` you won't see in the console: the line for a retry that finds a file already gone. It gets a log line too.`,
      task: 'Finish the two TODOs in `lambda_function.py`: create the logger and set its level to INFO, then replace all four `print()` calls. A processed file, a skipped retry and the summary are `INFO`; a rejected file is a `WARNING`.',
      hint: 'Under the imports: `logger = logging.getLogger()` and `logger.setLevel(logging.INFO)`. Then, for example, `logger.info("Processed %s: %d saved, %d already there", key, saved, duplicates)`, `logger.warning("Rejected %s: %d problem(s), first: %s", key, len(problems), problems[0])`, `logger.info("Skipped %s: already handled by an earlier try", key)` and `logger.info("Done: %s", json.dumps(summary))`.',
      solution: LOGGING_SOLUTION,
      files: [{ path: 'lambda_function.py', starter: LOGGING_STARTER, invoke: { event: s3Event([[GOOD_KEY, orderFiles().goodCsv], [BAD_KEY, orderFiles().badCsv]]), handler: 'lambda_handler', timeout: 60, function: 'order-intake' } }],
      scenario: pipelineScenario,
      probe: loggingProbe(),
      check: checkLogging,
      success: 'Every line now says how much it matters, when it happened and which invocation wrote it. An alarm can count the warnings, and a person can read one invocation from start to end. Nothing about what the function *does* changed, and the tests from the last step still pass: that\'s what they\'re for.',
    },
    {
      id: 'exam-tips',
      kind: 'read',
      title: 'Exam tips: AWS Certified Developer – Associate',
      minutes: 6,
      body: `The exam guide lists writing and running unit tests, mocking external dependencies, creating test events, and logging (including *structured* logging) among its skills. What to know:

- **Three kinds of tests.** A **unit test** checks one isolated piece of code. An **integration test** checks two or more components or services working together, usually in the cloud. An **end-to-end test** checks a whole application. AWS's guidance: mocks for your logic, and tests against real services for the rest, because only those show how your code behaves once deployed.
- **Test events** are JSON documents shaped like what a service sends. The Lambda console's **Test** button, \`aws lambda invoke --payload\` and AWS SAM's local invoke all take one. AWS SAM runs the function on your computer, in a container like Lambda's.
- **Where logs go.** Lambda sends a function's output to CloudWatch Logs, to the log group \`/aws/lambda/<function name>\` by default, with a log stream per instance of the function. The execution role needs \`logs:CreateLogGroup\`, \`logs:CreateLogStream\` and \`logs:PutLogEvents\`: the \`AWSLambdaBasicExecutionRole\` managed policy.
- **Log format: text or JSON.** Text is the default. JSON lines carry \`timestamp\`, \`level\`, \`message\` and \`requestId\`.
- **Log-level filtering needs the JSON format.** With it, a function's *application log level* (your code's lines) and *system log level* (Lambda's own \`START\` and \`REPORT\` lines) are settings, so you can turn on DEBUG without deploying new code. A level set in the code itself, with \`setLevel\`, wins over the setting.
- **\`print\` still works**, but its lines have no level, and stay plain text even in the JSON format.
- **Log groups outlive functions.** Deleting a function doesn't delete its log group. Delete it yourself, or set a **retention period** so old logs expire.
- **Reading logs quickly:** \`aws lambda invoke --log-type Tail\` returns the last 4 KB of the invocation's log with the response (base64-encoded, synchronous invocations only). \`aws logs tail\` shows a log group in your terminal, and \`--follow\` keeps it open.`,
    },
    {
      id: 'quiz',
      kind: 'quiz',
      title: 'Check yourself',
      minutes: 6,
      questions: [
        { q: 'A test calls `validate_order({**GOOD, "quantity": "0"})` and nothing else. The bug is in the code, yet the test passes. Why?', options: ['It has no assertion, so it can only fail if the function crashes', 'unittest only runs the first test in a class', 'Tests don\'t run on Fridays', 'The test needs a mock'], answer: 0, explain: 'A test without an assertion passes whatever the function returns. See a new test fail once, so you know it can.' },
        { q: 'The rule is "quantity must be more than 0". Which pair of inputs tests it best?', options: ['5 and 500', '-100 and 100', '3 and 4', '0 and 1'], answer: 3, explain: 'Mistakes like `<` for `<=` only show where the answer changes. Test both sides of the edge: 0 is refused, 1 is accepted.' },
        { q: 'The report starts with `.F.E`. What happened?', options: ['Four tests passed', 'Two passed, one assertion was false (F), and one test crashed with another error (E)', 'The file has a syntax error', 'Two tests were skipped'], answer: 1, explain: 'A dot is a pass, F is a failed assertion, E is a test that raised some other exception before it could finish.' },
        { q: 'Why does the test swap `lambda_function.table` for a mock instead of using a real DynamoDB table?', options: ['Mocks are more accurate than DynamoDB', 'DynamoDB can\'t be used from tests', 'It runs in milliseconds without credentials or cost, and can make DynamoDB "fail" on demand', 'boto3 requires it'], answer: 2, explain: 'Mocks make tests fast, free and able to reach the error cases. They can\'t prove AWS accepts the call: that takes a test against the real service.' },
        { q: 'A Lambda function calls `logger.info("Saved %d orders", n)`, but nothing shows up in CloudWatch Logs. The function has the default text log format. What\'s missing?', options: ['`logging.basicConfig()`', '`logger.setLevel(logging.INFO)`: by default only WARNING and above get through', 'A CloudWatch alarm', 'The `print` function'], answer: 1, explain: 'Lambda sets up logging for you at WARNING. basicConfig does nothing there, because logging is already set up.' },
        { q: 'You want to turn on DEBUG logs for a function for an hour without changing its code. What makes that possible?', options: ['The JSON log format, and the function\'s application log level setting', 'A bigger memory setting', 'Deleting the log group', 'Reserved concurrency'], answer: 0, explain: 'With the JSON log format, Lambda filters lines by level from a setting. The code must not pin the level itself with setLevel, which would win.' },
      ],
    },
    {
      id: 'cards',
      kind: 'cards',
      title: 'Flashcards',
      minutes: 5,
      cards: [
        { id: 'p6-testcase', front: 'The shape of a unittest test', back: '`class TestX(unittest.TestCase):` with methods named `test_...(self)`, each ending in an assertion like `self.assertEqual(got, expected)`', tags: ['testing'], difficulty: 'easy' },
        { id: 'p6-main', front: 'Make a test file run its tests when you run the file', back: '`if __name__ == "__main__":` then `unittest.main()`. Or, from a terminal, `python3 -m unittest` finds every `test*.py`.', tags: ['testing'], difficulty: 'easy' },
        { id: 'p6-fe', front: 'In a unittest report, what do `.`, `F` and `E` mean?', back: 'Passed; failure (an assertion was false); error (the test raised some other exception).', tags: ['testing'], difficulty: 'easy' },
        { id: 'p6-subtest', front: 'Check several inputs in one test, and see which one failed', back: '`for x in [...]:` then `with self.subTest(x=x):` around the assertions', tags: ['testing'], difficulty: 'medium' },
        { id: 'p6-raises', front: 'Assert that a block of code raises `ClientError`', back: '`with self.assertRaises(ClientError):` and the call inside the block', tags: ['testing'], difficulty: 'medium' },
        { id: 'p6-patch', front: 'Swap `lambda_function.table` for a mock during one test', back: '`with patch.object(lambda_function, "table") as table:`: the real one is put back when the block ends', hint: 'from unittest.mock import patch', tags: ['mocks'], difficulty: 'medium' },
        { id: 'p6-side-effect', front: 'Make a mocked `put_item` raise an AWS error', back: '`table.put_item.side_effect = ClientError({"Error": {"Code": "…", "Message": "…"}}, "PutItem")`', tags: ['mocks', 'boto3'], difficulty: 'hard' },
        { id: 'p6-called-with', front: 'Assert that a mock was called exactly once, with these arguments', back: '`table.put_item.assert_called_once_with(Item=ORDER, ConditionExpression="…")`', tags: ['mocks'], difficulty: 'medium' },
        { id: 'p6-logger', front: 'Set up logging in a Lambda function so INFO lines are written', back: '`logger = logging.getLogger()` and `logger.setLevel(logging.INFO)` at the top of the file. Not `basicConfig`: it does nothing there.', tags: ['logging', 'lambda'], difficulty: 'medium' },
        { id: 'p6-exception', front: 'Log an error together with its traceback', back: '`logger.exception("what I was doing")`, inside the `except` block', tags: ['logging'], difficulty: 'medium' },
        { id: 'p6-json', front: 'What does Lambda\'s JSON log format add to each `logging` line?', back: 'It arrives as JSON with `timestamp`, `level`, `message` and `requestId`, so you can filter by level. `print` lines stay plain text.', tags: ['logging', 'lambda', 'exam'], difficulty: 'hard' },
      ],
    },
    {
      id: 'build',
      kind: 'build',
      title: 'Build it for real',
      minutes: 50,
      body: `Run the tests on your own computer, have GitHub run them on every push, then watch real log lines arrive in CloudWatch Logs.

1. **A project folder** with four files: \`orders.py\` (button below, or your fixed one from the *Catch Friday's bugs* step), and from the editors \`test_orders.py\` from the *Catch Friday's bugs* step, \`test_lambda_function.py\` from *Test save_order with a mock*, and the \`lambda_function.py\` you gave real logs.

\`\`\`sh
mkdir -p ~/aws-study-projects/python/order-tests
cd ~/aws-study-projects/python/order-tests
\`\`\`

2. **A virtual environment with boto3.** The tests never call AWS, but \`lambda_function.py\` imports boto3, so it has to be installed:

\`\`\`sh
python3 -m venv .venv
source .venv/bin/activate
pip install boto3
\`\`\`

3. **Run every test with one command.** Without a file name, \`unittest\` looks through the folder for files named \`test*.py\` and runs them all. \`-v\` lists each test by name:

\`\`\`sh
python3 -m unittest -v
\`\`\`

They all pass. (If it stops with \`NoRegionError\` instead, boto3 can't find your default Region: run \`AWS_DEFAULT_REGION=us-east-1 python3 -m unittest -v\`.) Now break something on purpose: in \`orders.py\`, change \`quantity <= 0\` to \`quantity < 0\`, run it again, read the failure, and change it back.

4. **pytest.** Many Python projects run their tests with **pytest**, a test runner you install. It runs the \`unittest\` tests you already have, unchanged, and its reports are easier to read:

\`\`\`sh
pip install pytest
pytest
\`\`\`

pytest also lets a test be a plain function with a plain \`assert\`, no class needed. Save this as \`test_bad_rows.py\`. A line starting with \`@\` above a function is a **decorator**: it changes how the function is used. This one runs the test once for every pair in the list:

\`\`\`test_bad_rows.py
import pytest

from orders import validate_order

GOOD = {"order_id": "NW-2001", "partner": "northwind", "order_date": "2026-10-29",
        "sku": "CAB-USB-C", "quantity": "3", "unit_price": "12.50", "currency": "USD"}


@pytest.mark.parametrize("column, value", [
    ("quantity", "0"),
    ("quantity", "two"),
    ("unit_price", "4,99"),
    ("currency", "JPY"),
    ("order_date", "10/29/2026"),
])
def test_bad_rows_are_refused(column, value):
    order, reason = validate_order({**GOOD, column: value})
    assert order is None
    assert column in reason
\`\`\`

Run \`pytest -v\`: five more tests, one per row. When an \`assert\` fails, pytest shows the values on both sides.

5. **Put it on GitHub** (see *Start here*), with a \`.gitignore\` containing \`.venv/\`, \`__pycache__/\`, \`.pytest_cache/\`, \`function.zip\` and \`response.json\`.

6. **Have GitHub run the tests on every push.** That's **continuous integration**: nobody has to remember. GitHub Actions looks in one place only: a \`.github/workflows/\` folder at the **top of the repository**, not inside this project's folder. Your repository is \`aws-study-projects\`, so make the folder there and save the file below in it as \`tests.yml\`. The file is YAML: like Python, the indentation is part of the meaning, so keep the spaces exactly as shown.

\`\`\`sh
mkdir -p ~/aws-study-projects/.github/workflows
\`\`\`

\`\`\`yaml
name: tests

on: [push]

jobs:
  test:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: python/order-tests
    env:
      AWS_DEFAULT_REGION: us-east-1
    steps:
      - uses: actions/checkout@v7
      - uses: actions/setup-python@v7
        with:
          python-version: "3.13"
      - run: pip install boto3 pytest
      - run: pytest -v
\`\`\`

It starts a fresh Linux machine, fetches your code, installs Python 3.13 (the version your Lambda function runs on) and runs the tests. \`working-directory\` tells it which folder of the repository holds this project. \`AWS_DEFAULT_REGION\` is there because boto3 wants to know a Region when \`lambda_function.py\` creates its table, even though no test calls AWS. On your computer that comes from your AWS settings; GitHub's machine has no AWS setup at all, and needs none: no keys, no account.

Commit and push from the top of the repository (\`cd ~/aws-study-projects\`, then \`git add .github python/order-tests\`, \`git commit -m "Order tests, run on every push"\`, \`git push\`), and open the **Actions** tab of your repository to watch it run. Then push the \`<\` bug from step 3 and see the run fail, with pytest's report of the failing tests. Fix it and push again.

7. **See real logs.** Deploy the function on its own, with the JSON log format. No bucket or table is needed for this: you'll invoke it with an event that has no records.

\`\`\`sh
cat > trust.json <<'EOF'
{"Version": "2012-10-17", "Statement": [{"Effect": "Allow", "Principal": {"Service": "lambda.amazonaws.com"}, "Action": "sts:AssumeRole"}]}
EOF
aws iam create-role --role-name order-logs-demo-role --assume-role-policy-document file://trust.json
aws iam attach-role-policy --role-name order-logs-demo-role \\
  --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole

sleep 10   # a brand-new role takes a moment to reach Lambda
ACCOUNT=$(aws sts get-caller-identity --query Account --output text)
zip function.zip lambda_function.py orders.py
aws lambda create-function --function-name order-logs-demo \\
  --runtime python3.13 --handler lambda_function.lambda_handler \\
  --role "arn:aws:iam::$ACCOUNT:role/order-logs-demo-role" \\
  --zip-file fileb://function.zip --timeout 30 \\
  --logging-config LogFormat=JSON
\`\`\`

On Ubuntu or the Windows Subsystem for Linux, \`zip\` must be installed (\`sudo apt install -y zip\`, as in Tutorial 3). The zip now holds **two** files: \`lambda_function.py\` imports \`orders.py\`, so both must be at the top level of the zip. The test files stay out. If it says the role *cannot be assumed by Lambda*, wait ten seconds and run \`create-function\` again.

\`\`\`sh
aws lambda invoke --function-name order-logs-demo \\
  --cli-binary-format raw-in-base64-out --payload '{"Records": []}' response.json
cat response.json
aws logs tail /aws/lambda/order-logs-demo --since 10m --format json
\`\`\`

Logs can take a few minutes to show up. You'll see your \`Done:\` line as JSON, with \`"level": "INFO"\` and a \`requestId\`, among Lambda's own lines about the invocation. Now ask for one level only:

\`\`\`sh
aws logs tail /aws/lambda/order-logs-demo --since 1h --filter-pattern '{ $.level = "INFO" }'
\`\`\`

In the console, the same setting is on the function's page under **Configuration** → **Monitoring and operations tools** → **Logging configuration**, and the logs are in the CloudWatch console under **Log groups**.

**Cost:** GitHub Actions is free for public repositories. A handful of Lambda invocations and a few log lines fit in the free tier, like the earlier projects.

**Cleanup**, when you're done. The log group doesn't go away with the function, so delete it too:

\`\`\`sh
aws lambda delete-function --function-name order-logs-demo
aws logs delete-log-group --log-group-name /aws/lambda/order-logs-demo
aws iam detach-role-policy --role-name order-logs-demo-role \\
  --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole
aws iam delete-role --role-name order-logs-demo-role
\`\`\``,
      downloads: [
        { label: 'Download orders.py', filename: 'orders.py', content: () => ORDERS_PY },
      ],
      checklist: [
        '`python3 -m unittest -v` runs all my tests on my computer, and they pass',
        'I broke a rule on purpose and saw the test for it fail',
        'pytest runs the same tests, plus my `test_bad_rows.py`',
        'GitHub Actions runs the tests on every push, and I\'ve seen it go red and green',
        'I invoked the function and found my log line in CloudWatch Logs, as JSON with its level',
        'I deleted the function, its log group and the role',
      ],
    },
  ],
};

export default tutorial;

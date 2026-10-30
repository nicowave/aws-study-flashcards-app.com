// Tutorial 4: an upload to S3 starts a Lambda function that checks the file,
// saves the good orders to DynamoDB and moves bad files aside.

// ---------------------------------------------------------------------------
// The practice bucket: partners' order files, generated the same way every
// time (seeded) so the checks can work out the right answers.
//   - "2026-10-29 northwind.csv": 12 good orders. NW-2005 was already saved
//     yesterday at $19.00; today's file re-sends it at $21.50, and the saved
//     order must not change.
//   - "2026-10-29 globex.csv": 10 orders, 2 of them bad (a "4,99" price and
//     an unknown currency), so the whole file is rejected.
//   - archive/: 1,237 old files for the backfill, more than one page.
// The spaces in the file names arrive as "+" in the event.
// ---------------------------------------------------------------------------

export const BUCKET = 'partner-orders-learner';
export const GOOD_KEY = 'incoming/2026-10-29 northwind.csv';
export const BAD_KEY = 'incoming/2026-10-29 globex.csv';
const HEADER = 'order_id,partner,order_date,sku,quantity,unit_price,currency';
const SKUS = [['CAB-USB-C', 1250], ['DOCK-USB4', 18900], ['KB-WIRELESS', 4999], ['MOUSE-ERGO', 3450], ['HDMI-2M', 899], ['SSD-1TB', 7400], ['HEADSET-BT', 6200]];
const ARCHIVE_COUNT = 1237;

const rng = (seed) => () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const money = (cents) => (cents / 100).toFixed(2);

export const orderFiles = () => {
  const rand = rng(4004);
  const pick = (list) => list[Math.floor(rand() * list.length)];
  const good = [];
  for (let n = 1; n <= 12; n++) {
    const [sku, cents] = pick(SKUS);
    const id = `NW-${2000 + n}`;
    const price = id === 'NW-2005' ? 2150 : cents;
    good.push({ order_id: id, partner: 'northwind', order_date: '2026-10-29', sku: id === 'NW-2005' ? 'HDMI-2M' : sku,
      quantity: 1 + Math.floor(rand() * 20), unit_price: money(price), currency: rand() < 0.75 ? 'USD' : 'EUR' });
  }
  const bad = [];
  for (let n = 1; n <= 10; n++) {
    const [sku, cents] = pick(SKUS);
    bad.push({ order_id: `GX-${3000 + n}`, partner: 'globex', order_date: '2026-10-29', sku, quantity: 1 + Math.floor(rand() * 9),
      unit_price: n === 4 ? '4,99' : money(cents), currency: n === 8 ? 'JPY' : 'GBP' });
  }
  const csv = (rows) => `${HEADER}\n${rows.map((r) => HEADER.split(',').map((c) => r[c]).join(',')).join('\n')}\n`;
  return { good, bad, goodCsv: csv(good), badCsv: csv(bad) };
};

// Saved before today: NW-2005 at yesterday's price
const EXISTING = [
  { order_id: 'NW-1987', partner: 'northwind', order_date: '2026-10-28', sku: 'SSD-1TB', quantity: 4, unit_price: 74, currency: 'USD', total: 296, source_file: 'incoming/2026-10-28 northwind.csv' },
  { order_id: 'NW-2005', partner: 'northwind', order_date: '2026-10-28', sku: 'HDMI-2M', quantity: 2, unit_price: 19, currency: 'USD', total: 38, source_file: 'incoming/2026-10-28 northwind.csv' },
  { order_id: 'GX-2950', partner: 'globex', order_date: '2026-10-28', sku: 'KB-WIRELESS', quantity: 1, unit_price: 49, currency: 'GBP', total: 49, source_file: 'incoming/2026-10-28 globex.csv' },
];

export const archiveFiles = () => {
  const rand = rng(1237);
  const out = {};
  for (let n = 0; n < ARCHIVE_COUNT; n++) {
    const month = String(1 + (n % 12)).padStart(2, '0');
    const partner = ['northwind', 'globex', 'initech'][n % 3];
    const rows = Array.from({ length: 1 + Math.floor(rand() * 4) }, (_, i) => {
      const [sku, cents] = SKUS[Math.floor(rand() * SKUS.length)];
      return `AR-${n}-${i},${partner},2025-${month}-15,${sku},${1 + Math.floor(rand() * 9)},${money(cents)},USD`;
    });
    out[`archive/2025/${month}/${partner}-${String(n).padStart(4, '0')}.csv`] = `${HEADER}\n${rows.join('\n')}\n`;
  }
  return out;
};

const archiveTotals = () => {
  const files = Object.values(archiveFiles());
  return { count: files.length, bytes: files.reduce((sum, text) => sum + new TextEncoder().encode(text).length, 0) };
};

// What S3 sends Lambda when a file is uploaded. Keys are URL-encoded: spaces become "+"
const encodeKey = (key) => encodeURIComponent(key).replace(/%2F/g, '/').replace(/%20/g, '+');

export const s3Event = (files) => ({
  Records: files.map(([key, text], n) => ({
    eventVersion: '2.1',
    eventSource: 'aws:s3',
    awsRegion: 'us-east-1',
    eventTime: `2026-10-29T06:1${n}:44.120Z`,
    eventName: 'ObjectCreated:Put',
    userIdentity: { principalId: 'AWS:AIDAPARTNEREXAMPLE' },
    requestParameters: { sourceIPAddress: '198.51.100.24' },
    s3: {
      s3SchemaVersion: '1.0',
      configurationId: 'order-intake',
      bucket: { name: BUCKET, ownerIdentity: { principalId: 'A3NL1KOZZKExample' }, arn: `arn:aws:s3:::${BUCKET}` },
      object: { key: encodeKey(key), size: new TextEncoder().encode(text).length, eTag: `0d4a8e6c1f2b3a49${n}e5d6c7b8a9f0e1d2`, sequencer: `0067209A3C1F2B3A4${n}` },
    },
  })),
});

const csvFile = (body) => ({ body, contentType: 'text/csv' });

const oneFile = () => {
  const { goodCsv } = orderFiles();
  return { env: { TABLE_NAME: 'Orders' }, aws: { s3: { [BUCKET]: { [GOOD_KEY]: csvFile(goodCsv) } } } };
};

const pipelineScenario = () => {
  const { goodCsv, badCsv } = orderFiles();
  return {
    env: { TABLE_NAME: 'Orders' },
    aws: {
      s3: { [BUCKET]: { [GOOD_KEY]: csvFile(goodCsv), [BAD_KEY]: csvFile(badCsv) } },
      dynamodb: { Orders: { key: ['order_id'], items: EXISTING } },
    },
  };
};

const eventVariable = () => ({
  ...oneFile(),
  setup: `import json\nevent = json.loads(r'''${JSON.stringify(s3Event([[GOOD_KEY, orderFiles().goodCsv]]), null, 2)}''')`,
});

// ---------------------------------------------------------------------------
// Code the learner builds up
// ---------------------------------------------------------------------------

const READ_STARTER = `# lambda_function.py, part 1: see what arrives, and read the file
import urllib.parse

import boto3

s3 = boto3.client("s3")


def lambda_handler(event, context):
    for record in event["Records"]:
        bucket = record["s3"]["bucket"]["name"]
        key = record["s3"]["object"]["key"]  # TODO: decode it first
        print(f"New file: s3://{bucket}/{key}")
        # TODO: read the file with s3.get_object and print its first line
    return {"files": len(event["Records"])}
`;

const READ_SOLUTION = `# lambda_function.py, part 1: see what arrives, and read the file
import urllib.parse

import boto3

s3 = boto3.client("s3")


def lambda_handler(event, context):
    for record in event["Records"]:
        bucket = record["s3"]["bucket"]["name"]
        key = urllib.parse.unquote_plus(record["s3"]["object"]["key"])
        print(f"New file: s3://{bucket}/{key}")
        response = s3.get_object(Bucket=bucket, Key=key)
        text = response["Body"].read().decode("utf-8")
        print("First line:", text.splitlines()[0])
    return {"files": len(event["Records"])}`;

const VALIDATE_HEAD = `from datetime import date
from decimal import Decimal, InvalidOperation

REQUIRED = ["order_id", "partner", "order_date", "sku", "quantity", "unit_price", "currency"]
CURRENCIES = {"USD", "EUR", "GBP"}


def validate_order(row):
    """Return (order, None) for a good row, or (None, reason) for a bad one."""
    if None in row:
        return None, "too many columns: is there a comma inside a value?"
    for column in REQUIRED:
        if not (row.get(column) or "").strip():
            return None, f"missing {column}"

    try:
        quantity = int(row["quantity"])
    except ValueError:
        return None, f"quantity {row['quantity']!r} is not a whole number"
    if quantity <= 0:
        return None, "quantity must be more than 0"
`;

const VALIDATE_TAIL = `
    order = {
        "order_id": row["order_id"].strip(),
        "partner": row["partner"].strip(),
        "order_date": row["order_date"].strip(),
        "sku": row["sku"].strip(),
        "quantity": quantity,
        "unit_price": unit_price,
        "currency": currency,
        "total": unit_price * quantity,
    }
    return order, None`;

const VALIDATE_BODY = `
    try:
        unit_price = Decimal(row["unit_price"].strip())
    except InvalidOperation:
        return None, f"unit_price {row['unit_price']!r} is not a number"
    if unit_price <= 0:
        return None, "unit_price must be more than 0"

    currency = row["currency"].strip().upper()
    if currency not in CURRENCIES:
        return None, f"unknown currency {currency}"

    try:
        date.fromisoformat(row["order_date"].strip())
    except ValueError:
        return None, f"order_date {row['order_date']!r} is not a date like 2026-10-29"
${VALIDATE_TAIL}`;

const VALIDATE_FUNCTION = `${VALIDATE_HEAD}${VALIDATE_BODY}`;

const VALIDATE_STARTER = `# orders.py: is this row a real order?
${VALIDATE_HEAD}
    # TODO: unit_price -> Decimal, made from the text (never a float).
    #       Text that isn't a number raises InvalidOperation. It must be more than 0.
    unit_price = row["unit_price"]

    # TODO: currency must be in CURRENCIES, after .strip().upper()
    currency = row["currency"]

    # TODO: order_date must be a real date like 2026-10-29: date.fromisoformat()
    #       raises ValueError for anything else.
${VALIDATE_TAIL}


print(validate_order({"order_id": "NW-2001", "partner": "northwind", "order_date": "2026-10-29",
                      "sku": "CAB-USB-C", "quantity": "3", "unit_price": "12.50", "currency": "usd "}))
`;

const VALIDATE_SOLUTION = `# orders.py: is this row a real order?
${VALIDATE_FUNCTION}


print(validate_order({"order_id": "NW-2001", "partner": "northwind", "order_date": "2026-10-29",
                      "sku": "CAB-USB-C", "quantity": "3", "unit_price": "12.50", "currency": "usd "}))`;

const PIPELINE_HEAD = `# lambda_function.py: check each uploaded order file and save the good orders.
# Trigger: S3 "object created" events for incoming/ only.
import csv
import io
import json
import os
import urllib.parse

import boto3

s3 = boto3.client("s3")
table = boto3.resource("dynamodb").Table(os.environ.get("TABLE_NAME", "Orders"))

# --- Your validation from the last step ------------------------------------

${VALIDATE_FUNCTION}


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


# --- The new parts ---------------------------------------------------------
`;

export const PIPELINE_STARTER = `${PIPELINE_HEAD}
def save_order(order):
    """Save one order. Returns False if it was already saved (a retry or a resend)."""
    # TODO 1: put_item, only if no order with this order_id exists yet:
    #         ConditionExpression="attribute_not_exists(order_id)".
    #         Catch table.meta.client.exceptions.ConditionalCheckFailedException
    #         and return False; otherwise return True.
    pass


def lambda_handler(event, context):
    summary = {"files": 0, "saved": 0, "duplicates": 0, "rejected": []}
    for record in event["Records"]:
        bucket = record["s3"]["bucket"]["name"]
        key = urllib.parse.unquote_plus(record["s3"]["object"]["key"])
        # TODO 3: a retry can find the file already moved. Catch s3.exceptions.NoSuchKey,
        #         print a note and go on to the next record (continue).
        text = s3.get_object(Bucket=bucket, Key=key)["Body"].read().decode("utf-8")
        summary["files"] += 1

        orders, problems = read_orders(text)
        if problems:
            # TODO 2: one bad row rejects the whole file. Move it to rejected/, save
            #         the problems next to it as <new key>.error.txt (one per line),
            #         add the key to summary["rejected"], then continue.
            pass

        # TODO 1 (continued): save each order with save_order(), counting
        #         summary["saved"] and summary["duplicates"]. Then move the file
        #         to processed/.

    print(json.dumps(summary))
    return summary
`;

export const PIPELINE_SOLUTION = `${PIPELINE_HEAD}
def save_order(order):
    """Save one order. Returns False if it was already saved (a retry or a resend)."""
    try:
        table.put_item(Item=order, ConditionExpression="attribute_not_exists(order_id)")
        return True
    except table.meta.client.exceptions.ConditionalCheckFailedException:
        return False


def lambda_handler(event, context):
    summary = {"files": 0, "saved": 0, "duplicates": 0, "rejected": []}
    for record in event["Records"]:
        bucket = record["s3"]["bucket"]["name"]
        key = urllib.parse.unquote_plus(record["s3"]["object"]["key"])
        try:
            text = s3.get_object(Bucket=bucket, Key=key)["Body"].read().decode("utf-8")
        except s3.exceptions.NoSuchKey:
            print(f"{key} is already gone: handled by an earlier try. Skipping.")
            continue
        summary["files"] += 1

        orders, problems = read_orders(text)
        if problems:
            new_key = move(bucket, key, "rejected/")
            s3.put_object(Bucket=bucket, Key=new_key + ".error.txt",
                          Body="\\n".join(problems) + "\\n", ContentType="text/plain")
            print(f"REJECTED {key}: {len(problems)} problem(s)")
            summary["rejected"].append(key)
            continue

        for order in orders:
            order["source_file"] = key
            if save_order(order):
                summary["saved"] += 1
            else:
                summary["duplicates"] += 1
        move(bucket, key, "processed/")
        print(f"OK {key}: {len(orders)} orders")

    print(json.dumps(summary))
    return summary`;

const BACKFILL_STARTER = `# backfill.py: how much is in the archive?
import boto3

s3 = boto3.client("s3")
BUCKET = "${BUCKET}"


def folder_size(prefix):
    """(number of files, total bytes) under prefix."""
    count = 0
    total_bytes = 0
    response = s3.list_objects_v2(Bucket=BUCKET, Prefix=prefix)
    for obj in response["Contents"]:
        count += 1
        total_bytes += obj["Size"]
    return count, total_bytes


count, total_bytes = folder_size("archive/")
print(f"archive/: {count} files, {total_bytes} bytes")
`;

const BACKFILL_SOLUTION = `# backfill.py: how much is in the archive?
import boto3

s3 = boto3.client("s3")
BUCKET = "${BUCKET}"


def folder_size(prefix):
    """(number of files, total bytes) under prefix."""
    count = 0
    total_bytes = 0
    paginator = s3.get_paginator("list_objects_v2")
    for page in paginator.paginate(Bucket=BUCKET, Prefix=prefix):
        for obj in page.get("Contents", []):
            count += 1
            total_bytes += obj["Size"]
    return count, total_bytes


count, total_bytes = folder_size("archive/")
print(f"archive/: {count} files, {total_bytes} bytes")`;

// ---------------------------------------------------------------------------
// Checks
// ---------------------------------------------------------------------------

const getCalls = (aws, op) => (aws?.calls || []).filter((c) => c.service === 's3' && c.op === op);

const checkRead = ({ result, aws, kind }) => {
  if (kind !== 'run' || !result.invoke) return null;
  const err = result.invoke.error;
  if (err?.type === 'NoSuchKey') {
    return 'S3 says there\'s no such file: the key still has "+" where the file name has a space. Decode it with `urllib.parse.unquote_plus()` before using it.';
  }
  if (err) return null;
  const reads = getCalls(aws, 'get_object');
  if (!reads.length) return 'You have the bucket and key. Now read the file: `s3.get_object(Bucket=bucket, Key=key)`, then `["Body"].read().decode("utf-8")`.';
  if (!reads.some((c) => c.params.Key === GOOD_KEY)) return null;
  if (!result.stdout.includes(GOOD_KEY)) return `Print the decoded key, so the log shows \`${GOOD_KEY}\`.`;
  if (!result.stdout.includes(HEADER)) return 'The file is read. Print its first line too: `text.splitlines()[0]`.';
  return true;
};

const VALIDATE_ROWS = (() => {
  const good = { order_id: 'NW-2001', partner: 'northwind', order_date: '2026-10-29', sku: 'CAB-USB-C', quantity: '3', unit_price: '12.50', currency: 'usd ' };
  return [
    ['a good row', good],
    ['quantity 0', { ...good, quantity: '0' }],
    ['quantity "two"', { ...good, quantity: 'two' }],
    ['price "4,99" (a comma for the decimal point)', { ...good, unit_price: '4,99' }],
    ['a negative price', { ...good, unit_price: '-3.00' }],
    ['currency JPY', { ...good, currency: 'JPY' }],
    ['date "10/29/2026"', { ...good, order_date: '10/29/2026' }],
    ['an empty sku', { ...good, sku: '' }],
  ];
})();

const VALIDATE_PROBE = `import json
RESULT = [validate_order(row) for row in json.loads(r'''${JSON.stringify(VALIDATE_ROWS.map(([, row]) => row))}''')]`;

const checkValidate = ({ probe, probeError, result }) => {
  if (result.error || probeError || !Array.isArray(probe)) return null;
  const [goodOrder, goodReason] = probe[0] || [];
  if (goodReason) return `The good row was refused: "${goodReason}".`;
  if (!goodOrder) return null;
  if (typeof goodOrder.unit_price === 'string') return 'For the good row, `unit_price` is still text ("12.50"). Make it a Decimal: `Decimal(row["unit_price"].strip())`.';
  if (typeof goodOrder.unit_price === 'number') return '`unit_price` is a float. DynamoDB refuses floats, and floats round money wrong: build a `Decimal` from the text.';
  if (goodOrder.unit_price?.$decimal !== '12.50' || goodOrder.total?.$decimal !== '37.50') return 'For the good row, unit_price should be Decimal("12.50") and total Decimal("37.50").';
  if (goodOrder.currency !== 'USD') return `The currency should be cleaned to "USD" (it was "usd "), but it's ${JSON.stringify(goodOrder.currency)}.`;
  for (let i = 1; i < VALIDATE_ROWS.length; i++) {
    const [order, reason] = probe[i] || [];
    if (order || !reason) return `A row with ${VALIDATE_ROWS[i][0]} should give (None, "a reason"), but it came back as a good order.`;
  }
  return true;
};

const checkPipeline = ({ result, aws, probeError, kind }) => {
  if (kind !== 'run' || !result.invoke || result.error) return null;
  const err = result.invoke.error;
  if (err?.type === 'Runtime.MarshalError') return 'Lambda couldn\'t turn the return value into JSON. Return plain numbers and text in the summary: no Decimal values.';
  if (err) return `The function failed with ${err.type}: ${err.message}`;
  const objects = aws.s3[BUCKET] || {};
  const keys = Object.keys(objects);
  const items = Object.fromEntries((aws.dynamodb.Orders || []).map((i) => [i.order_id, i]));
  const { good, bad } = orderFiles();
  const missing = good.filter((o) => o.order_id !== 'NW-2005' && !items[o.order_id]).map((o) => o.order_id);
  if (missing.length === good.length - 1) return 'No Northwind orders were saved yet. Start with TODO 1: `save_order()`, then call it for each order.';
  if (missing.length) return `These Northwind orders aren't in the table: ${missing.join(', ')}.`;
  const wrong = good.find((o) => o.order_id !== 'NW-2005' && items[o.order_id] && Math.abs(Number(items[o.order_id].unit_price) - Number(o.unit_price)) > 0.001);
  if (wrong) return `${wrong.order_id} was saved with the wrong unit_price.`;
  if (Number(items['NW-2005']?.unit_price) !== 19) {
    return 'NW-2005 was already saved yesterday at 19.00, and today\'s file overwrote it. Save with `ConditionExpression="attribute_not_exists(order_id)"`, and count it as a duplicate.';
  }
  const leaked = bad.filter((o) => items[o.order_id]).map((o) => o.order_id);
  if (leaked.length) return `Globex's file has bad rows, so none of its orders should be saved, but ${leaked.join(', ')} were. Check the whole file first; save only if there are no problems.`;
  if (objects[GOOD_KEY] || objects[BAD_KEY]) return 'Both files are still in incoming/. When a file is done, `move()` it to processed/ or rejected/.';
  if (!keys.some((k) => k.startsWith('processed/') && k.includes('northwind'))) return 'The Northwind file should end up in processed/.';
  const rejected = keys.find((k) => k.startsWith('rejected/') && k.includes('globex') && !k.endsWith('.error.txt'));
  if (!rejected) return 'The Globex file should end up in rejected/.';
  const note = keys.find((k) => k.startsWith('rejected/') && k.endsWith('.error.txt'));
  const hasReason = (note && objects[note].text?.trim()) || Object.values(objects[rejected].metadata || {}).some((v) => String(v).trim());
  if (!hasReason) return 'Save the reasons next to the rejected file, as `<new key>.error.txt`, so the partner knows what to fix.';
  if (probeError) return `Running the function again with the same event, the way a retry does, failed with ${probeError}. When the file is already gone, catch \`s3.exceptions.NoSuchKey\` and skip it.`;
  return true;
};

const checkBackfill = ({ result, probe, probeError, kind }) => {
  if (kind !== 'run' || result.error?.type === 'SyntaxError') return null;
  const { count, bytes } = archiveTotals();
  const out = result.stdout.replace(/(\d),(?=\d{3})/g, '$1');
  if (/\b1000 files/.test(out)) return 'Exactly 1000 is suspicious: it\'s the most `list_objects_v2` returns in one call. Use a paginator to get every page.';
  if (!out.includes(String(count)) || !out.includes(String(bytes))) return null;
  if (probeError === 'KeyError') return 'Right for archive/! Now try `folder_size("nothing-here/")` in the console: an empty listing has no "Contents" key. Use `page.get("Contents", [])`.';
  if (!Array.isArray(probe) || JSON.stringify(probe[1]) !== '[0,0]') return null;
  return true;
};

// ---------------------------------------------------------------------------

const tutorial = {
  slug: 'upload-process-store',
  number: 4,
  title: 'Upload, process, store',
  situation: 'Three partners upload a file of orders to an Amazon S3 bucket every day. Someone downloads each one, checks it by eye and types the orders into the system. Typos slip through, and on busy days files wait until the next morning. You build the automatic version: an upload starts a Lambda function that checks the file, saves the good orders to Amazon DynamoDB, and moves bad files aside with the reason.',
  level: 'Advanced',
  hours: 5,
  skills: ['event-driven code', 'validation', 'Decimal', 'idempotency', 'error handling', 'pagination'],
  aws: ['S3 events', 'AWS Lambda', 'Amazon DynamoDB', 'Amazon SQS', 'Amazon CloudWatch'],
  overview: 'You\'ll read the event Amazon S3 sends AWS Lambda, check every row of a CSV file, and save orders to DynamoDB so that a retry or a re-sent file never creates a duplicate. Bad files go to rejected/ with the reason. Then you backfill a year of old files with a paginator, and deploy the whole pipeline for real.',
  steps: [
    {
      id: 'event-driven',
      kind: 'read',
      runtime: 'python',
      title: 'An upload that runs code',
      minutes: 12,
      body: `Until now, your programs ran when someone started them. This one runs **when something happens**: a file lands in a bucket.

\`\`\`text
partner uploads ──▶ Amazon S3 bucket ──▶ event ──▶ AWS Lambda function ──▶ Amazon DynamoDB
                    incoming/x.csv                 checks, saves, moves     Orders table
\`\`\`

You tell the bucket: *when a new object appears under \`incoming/\`, invoke this function*. Amazon S3 then calls your \`lambda_handler(event, context)\` with an **event** describing the upload. Nobody has to watch the bucket.

The console below already has a real-shaped event in a variable called \`event\`. Look around it:

\`\`\`python
print(json.dumps(event, indent=2))
\`\`\`

The parts you need are inside \`Records\`. There can be more than one record per event, so always loop:

\`\`\`python
record = event["Records"][0]
record["eventName"], record["s3"]["bucket"]["name"], record["s3"]["object"]["size"]
\`\`\`

### The classic bug: the key is URL-encoded

The partner uploaded \`incoming/2026-10-29 northwind.csv\`, with a space. Look at what the event says:

\`\`\`python
record["s3"]["object"]["key"]
\`\`\`

The space arrived as \`+\`. Keys in S3 events are **URL-encoded**: spaces become \`+\`, and characters like \`é\` or \`&\` become \`%C3%A9\` or \`%26\`. Use the raw key, and S3 answers "no such key", but only for files whose names have those characters, so the bug hides until a partner names a file differently. \`unquote_plus\` decodes it:

\`\`\`python
import urllib.parse
urllib.parse.unquote_plus(record["s3"]["object"]["key"])
\`\`\`

### Reading the file

\`get_object\` returns the file's details and a \`Body\` you read once. It arrives as **bytes**, so decode it to text:

\`\`\`python
import boto3
s3 = boto3.client("s3")
key = urllib.parse.unquote_plus(record["s3"]["object"]["key"])
text = s3.get_object(Bucket="${BUCKET}", Key=key)["Body"].read().decode("utf-8")
print(text[:200])
\`\`\`

> The event only says *that* a file arrived, never what's in it. Your function always fetches the file itself. That keeps events small, and means the file is read as it is now, not as it was.`,
      scenario: eventVariable,
    },
    {
      id: 'read-the-upload',
      kind: 'try',
      runtime: 'python',
      title: 'Read the uploaded file',
      minutes: 12,
      body: 'Here is the start of the Lambda function. **Test with the sample event** calls `lambda_handler` the way Lambda does, with the Northwind upload as the event, and shows the log and the return value, like the Test button in the Lambda console.',
      task: 'Make the handler decode the key, read the file from S3, and print the decoded key and the file\'s first line.',
      hint: '`key = urllib.parse.unquote_plus(record["s3"]["object"]["key"])`, then `text = s3.get_object(Bucket=bucket, Key=key)["Body"].read().decode("utf-8")` and `print(text.splitlines()[0])`.',
      solution: READ_SOLUTION,
      files: [{ path: 'lambda_function.py', starter: READ_STARTER, invoke: { event: s3Event([[GOOD_KEY, orderFiles().goodCsv]]), handler: 'lambda_handler', timeout: 60, function: 'order-intake' } }],
      scenario: oneFile,
      check: checkRead,
      success: 'That\'s the skeleton of every S3-triggered function: loop over the records, decode the key, fetch the object.',
    },
    {
      id: 'checking-rows',
      kind: 'read',
      runtime: 'python',
      title: 'Checking every row, and money in Decimal',
      minutes: 15,
      body: `The file is text, but \`csv.DictReader\` wants a file. \`io.StringIO\` wraps text so it behaves like an open file:

\`\`\`python
import csv, io
text = "order_id,quantity,unit_price\\nNW-1,3,12.50\\nNW-2,0,4,99\\n"
for row in csv.DictReader(io.StringIO(text)):
    print(row)
\`\`\`

See the second row: \`4,99\` was a price with a comma for the decimal point, and CSV split it into two columns. \`DictReader\` puts the extra value under the key \`None\`, so \`None in row\` spots it. That's the kind of thing a person catches by eye, and your function must catch too.

### A checking function that explains itself

The checking function returns **two things**: the cleaned order, or a reason it's bad. Python returns both as a tuple and the caller unpacks them:

\`\`\`py
order, reason = validate_order(row)
if reason:
    problems.append(f"line {line}: {reason}")
\`\`\`

A reason like \`line 5: unit_price '4,99' is not a number\` means the partner can fix the file without calling anyone.

### Never put money in a float

Floats are fast but approximate, and money has to add up exactly:

\`\`\`python
0.1 + 0.2
\`\`\`

\`\`\`python
from decimal import Decimal
Decimal("0.1") + Decimal("0.2")
\`\`\`

\`Decimal\` does exact decimal arithmetic. Make it **from the text**, not from a float: the float is already wrong before \`Decimal\` sees it.

\`\`\`python
Decimal(0.1), Decimal("0.1")
\`\`\`

Text that isn't a number raises \`InvalidOperation\`:

\`\`\`python
from decimal import InvalidOperation
try:
    Decimal("4,99")
except InvalidOperation:
    print("not a number")
\`\`\`

There's a second reason, which you'll meet in a moment: **DynamoDB doesn't accept floats at all.** boto3 refuses them with "Float types are not supported. Use Decimal types instead."

### Dates

\`date.fromisoformat()\` reads \`2026-10-29\` and raises \`ValueError\` for anything else, like \`10/29/2026\`. Keep the text in the order (DynamoDB has no date type, and ISO dates sort correctly as text); just check it's a real date.`,
      scenario: {},
    },
    {
      id: 'validate-order',
      kind: 'try',
      runtime: 'python',
      title: 'Write validate_order',
      minutes: 20,
      task: 'Finish `validate_order(row)`: `unit_price` becomes a `Decimal` made from the text and must be more than 0, `currency` is cleaned (`"usd "` → `"USD"`) and must be USD, EUR or GBP, and `order_date` must be a real ISO date. Every bad row returns `(None, "a reason")`.',
      hint: '`try: unit_price = Decimal(row["unit_price"].strip())` / `except InvalidOperation: return None, ...`. Then `if unit_price <= 0:`. `currency = row["currency"].strip().upper()` and `if currency not in CURRENCIES:`. Dates: `try: date.fromisoformat(...)` / `except ValueError:`.',
      solution: VALIDATE_SOLUTION,
      files: [{ path: 'orders.py', starter: VALIDATE_STARTER }],
      scenario: {},
      probe: VALIDATE_PROBE,
      check: checkValidate,
      success: 'Eight rows, eight right answers. Every rule you\'d check by eye is now written down, and checked the same way at 3 a.m.',
    },
    {
      id: 'dynamodb-idempotent',
      kind: 'read',
      runtime: 'python',
      title: 'Save each order exactly once',
      minutes: 18,
      body: `**Amazon DynamoDB** is AWS's serverless database: no server to run, and you pay per request. The practice account has an \`Orders\` table whose key is \`order_id\`. The table **resource** is the friendliest way to use it from Python:

\`\`\`python
import boto3
from decimal import Decimal
table = boto3.resource("dynamodb").Table("Orders")
table.put_item(Item={"order_id": "TEST-1", "unit_price": 12.5})
\`\`\`

There's the float error. With a Decimal it works, and numbers come back as Decimal too:

\`\`\`python
table.put_item(Item={"order_id": "TEST-1", "unit_price": Decimal("12.50"), "quantity": 3})
table.get_item(Key={"order_id": "TEST-1"})["Item"]
\`\`\`

That catches people when they return an item from a Lambda function. JSON has no Decimal:

\`\`\`python
import json
json.dumps(table.get_item(Key={"order_id": "TEST-1"})["Item"])
\`\`\`

So return plain numbers and text from your handler, converting with \`int()\` or \`str()\` where you need to.

### Events can arrive twice

Two facts every event-driven program has to live with:

- Amazon S3 delivers event notifications **at least once**. Occasionally the same upload produces two events.
- S3 invokes Lambda **asynchronously**. If your function fails, Lambda **retries it twice more**, and each retry starts from the top, even for the orders that were already saved.

Partners re-send files too. So the function must be **idempotent**: running it twice with the same input leaves the same result as running it once. For a database write, that's a **condition**: save this order *only if* no order with this ID exists yet.

\`\`\`python
table.put_item(Item={"order_id": "NW-2005", "unit_price": Decimal("21.50")},
               ConditionExpression="attribute_not_exists(order_id)")
\`\`\`

NW-2005 is already in the table, so DynamoDB refused, with \`ConditionalCheckFailedException\`. That isn't a failure here: it means "already saved, nothing to do". Catch it and count it as a duplicate:

\`\`\`python
try:
    table.put_item(Item={"order_id": "NW-2005", "unit_price": Decimal("21.50")},
                   ConditionExpression="attribute_not_exists(order_id)")
except table.meta.client.exceptions.ConditionalCheckFailedException:
    print("NW-2005 is already saved: skipping")
\`\`\`

Without the condition, \`put_item\` silently **replaces** the whole item. Today's file would overwrite an order confirmed yesterday, and nobody would know.

### Moving the file when it's done

S3 has no "move" or "rename". You copy the object to its new key, then delete the old one. Done files go to \`processed/\`, bad ones to \`rejected/\` with the reasons beside them.

If a retry comes in after the file has moved, \`get_object\` raises \`NoSuchKey\`. That's fine too: someone already handled it. Catch \`s3.exceptions.NoSuchKey\` and skip the record.

### The trap that costs real money

The function writes into the **same bucket** that triggers it. If the trigger fires on *every* new object, then moving a file to \`processed/\` creates a new object, which triggers the function, which writes again… a loop that can run up thousands of invocations an hour. The fix is in the trigger: **only fire for the \`incoming/\` prefix.** (Even better: a separate bucket for the output.)`,
      scenario: pipelineScenario,
    },
    {
      id: 'pipeline',
      kind: 'try',
      runtime: 'python',
      title: 'The whole pipeline',
      minutes: 35,
      body: `\`lambda_function.py\` has your \`validate_order\` and two helpers: \`read_orders(text)\` checks every row and returns \`(orders, problems)\`, and \`move(bucket, key, folder)\` copies and deletes. The sample event has **two** uploads:

| File | What's in it |
|---|---|
| \`2026-10-29 northwind.csv\` | 12 good orders. NW-2005 was already saved yesterday at $19.00 and is re-sent at today's price. |
| \`2026-10-29 globex.csv\` | 10 orders, 2 of them bad. **One bad row rejects the whole file**, so nobody has to work out which half got in. |

After a test, look at the results in the console: \`table.scan()["Items"]\`, or \`s3.list_objects_v2(Bucket="${BUCKET}")["Contents"]\`.`,
      task: 'Finish the three TODOs: save each Northwind order once (without overwriting NW-2005), move the Northwind file to `processed/`, move the Globex file to `rejected/` with its problems in `<new key>.error.txt`, and skip files that are already gone. The function must also survive being run a second time with the same event.',
      hint: 'TODO 1: `table.put_item(Item=order, ConditionExpression="attribute_not_exists(order_id)")` inside `try`, `return True`; `except table.meta.client.exceptions.ConditionalCheckFailedException: return False`. TODO 2: `new_key = move(bucket, key, "rejected/")`, then `s3.put_object(Bucket=bucket, Key=new_key + ".error.txt", Body="\\n".join(problems))`. TODO 3: wrap `get_object` in `try` / `except s3.exceptions.NoSuchKey: continue`.',
      solution: PIPELINE_SOLUTION,
      files: [{ path: 'lambda_function.py', starter: PIPELINE_STARTER, invoke: { event: s3Event([[GOOD_KEY, orderFiles().goodCsv], [BAD_KEY, orderFiles().badCsv]]), handler: 'lambda_handler', timeout: 60, function: 'order-intake' } }],
      scenario: pipelineScenario,
      probe: `import json, practice
RESULT = lambda_handler(json.loads(r'''${JSON.stringify(s3Event([[GOOD_KEY, orderFiles().goodCsv], [BAD_KEY, orderFiles().badCsv]]))}'''), practice.context())`,
      check: checkPipeline,
      success: 'That\'s the job a person did every morning, now done within seconds of each upload, and safe to retry. Press **Test** again: the second run finds both files gone and skips them, which is exactly what a retry should do.',
    },
    {
      id: 'backfill',
      kind: 'try',
      runtime: 'python',
      title: 'Backfill: more than 1,000 files',
      minutes: 15,
      body: `Before the pipeline, last year's files went into \`archive/\`. Finance wants to know how many there are before deciding whether to load them. A listing looks easy:

\`\`\`python
import boto3
s3 = boto3.client("s3")
response = s3.list_objects_v2(Bucket="${BUCKET}", Prefix="archive/")
len(response["Contents"]), response["IsTruncated"]
\`\`\`

\`list_objects_v2\` returns **at most 1,000 keys per call**. \`IsTruncated: True\` means there's more, and \`NextContinuationToken\` is how to ask for the next page. A **paginator** does that loop for you:

\`\`\`python
paginator = s3.get_paginator("list_objects_v2")
pages = list(paginator.paginate(Bucket="${BUCKET}", Prefix="archive/"))
len(pages), sum(len(p["Contents"]) for p in pages)
\`\`\`

One more trap: when nothing matches, the response has **no \`Contents\` key at all**, not an empty list:

\`\`\`python
"Contents" in s3.list_objects_v2(Bucket="${BUCKET}", Prefix="nothing-here/")
\`\`\`

So read it with \`page.get("Contents", [])\`.`,
      task: 'Fix `folder_size(prefix)` so it counts every file under the prefix, however many pages there are, and returns `(0, 0)` for an empty folder instead of crashing.',
      hint: '`for page in s3.get_paginator("list_objects_v2").paginate(Bucket=BUCKET, Prefix=prefix):` and inside it `for obj in page.get("Contents", []):`.',
      solution: BACKFILL_SOLUTION,
      files: [{ path: 'backfill.py', starter: BACKFILL_STARTER }],
      scenario: () => ({ aws: { s3: { [BUCKET]: archiveFiles() } } }),
      probe: '[list(folder_size("archive/")), list(folder_size("nothing-here/"))]',
      check: checkBackfill,
      success: `All ${ARCHIVE_COUNT.toLocaleString('en-US')} files counted. The same paginator loop is how you'd feed each old file through \`read_orders()\` to load the backfill.`,
    },
    {
      id: 'when-things-fail',
      kind: 'read',
      title: 'When something still goes wrong',
      minutes: 10,
      body: `Validation handles bad *files*. Some failures aren't the file's fault: DynamoDB throttles you, a bug slips into a new version, a file is too big to read before the timeout. Then the function raises an error, and Lambda's **asynchronous retries** kick in.

| What happens | Default | You can change it |
|---|---|---|
| Retries after a function error | 2 (3 tries in all) | 0, 1 or 2 |
| How long Lambda keeps trying an event | 6 hours | down to 60 seconds |
| After the last try | the event is **dropped** | send it to an on-failure destination |

**Dropped** is the dangerous word. An order file nobody processed, and nobody knows. So give the function an **on-failure destination**: an **Amazon SQS** queue where every failed event lands, with the error, for a person or a program to replay later. (The older way is a *dead-letter queue*. Destinations do the same job and also record why it failed.)

Then make sure someone hears about it. An **Amazon CloudWatch** alarm on the function's \`Errors\` metric can email you through SNS, the way your certificate alerts did in Tutorial 3:

\`\`\`sh
aws cloudwatch put-metric-alarm --alarm-name order-intake-errors \\
  --namespace AWS/Lambda --metric-name Errors \\
  --dimensions Name=FunctionName,Value=order-intake \\
  --statistic Sum --period 300 --evaluation-periods 1 \\
  --threshold 1 --comparison-operator GreaterThanOrEqualToThreshold \\
  --treat-missing-data notBreaching \\
  --alarm-actions arn:aws:sns:us-east-1:YOUR_ACCOUNT:alerts
\`\`\`

### Why idempotency makes all of this safe

Retries and replays are only safe because the function is idempotent. A retry after a half-finished run saves the remaining orders, skips the ones already saved, and finds the file where it was left. Without the condition on \`put_item\`, every retry would be a gamble.

### Settings worth knowing

- **Timeout**: the default is 3 seconds, far too short for reading a file and writing a dozen items. Use 30 to 60 seconds here. The maximum is 15 minutes.
- **Memory**: 128 MB to 10,240 MB. More memory also brings more CPU, so a bigger setting can finish sooner and cost about the same.
- **Big files**: Lambda isn't for gigabyte uploads. For those, look at AWS Glue or a container on AWS Fargate.`,
    },
    {
      id: 'exam-tips',
      kind: 'read',
      title: 'Exam tips: AWS Certified Developer – Associate',
      minutes: 6,
      body: `This tutorial covers some of the most-asked topics on the exam:

- **S3 → Lambda is asynchronous.** Lambda retries failed async invocations twice. Failed events go to an on-failure destination (SQS, SNS, another Lambda function or EventBridge) or a dead-letter queue (SQS or SNS).
- **Recursive triggers**: a function that writes to the bucket that triggers it needs a **prefix or suffix filter**, or a second bucket. Expect a question where costs explode overnight.
- **S3 event keys are URL-encoded.** Decode them before calling \`get_object\`.
- **Idempotency**: events can be delivered more than once. Use a **conditional write** (\`attribute_not_exists\`) or an idempotency key.
- **DynamoDB and Python**: boto3 needs \`Decimal\` for numbers, and \`ConditionalCheckFailedException\` means the condition was false, not that DynamoDB broke.
- **Pagination**: \`list_objects_v2\` returns up to 1,000 keys; most AWS list calls page their results. Use paginators.
- **Least privilege**: the function's role gets \`s3:GetObject\`, \`s3:PutObject\` and \`s3:DeleteObject\` on that bucket's objects, and \`dynamodb:PutItem\` on that table only. A resource-based policy (from \`lambda add-permission\`) is what lets S3 invoke the function.
- **Strong consistency**: S3 reads right after a write see the new object, so the function never reads a half-uploaded file.`,
    },
    {
      id: 'quiz',
      kind: 'quiz',
      title: 'Check yourself',
      minutes: 6,
      questions: [
        { q: 'The event says the key is `incoming/2026-10-29+batch.csv`, but `get_object` fails with NoSuchKey. Why?', options: ['The file hasn\'t finished uploading', 'Event keys are URL-encoded: the real key has a space. Decode with `urllib.parse.unquote_plus()`', 'The function needs a bigger timeout', 'S3 renamed the file'], answer: 1, explain: 'S3 event keys are URL-encoded. `unquote_plus` turns `+` back into a space and `%xx` back into characters.' },
        { q: '`table.put_item(Item={"order_id": "A1", "price": 9.99})` raises a TypeError. What\'s the fix?', options: ['Use `Decimal("9.99")`', 'Use `str(9.99)` and hope', 'Use `round(9.99, 2)`', 'Switch the table to provisioned capacity'], answer: 0, explain: 'boto3 refuses floats for DynamoDB. Build a Decimal from text so it\'s exact.' },
        { q: 'The same S3 upload triggered the function twice. What stops the orders being saved twice?', options: ['Nothing can', 'A bigger Lambda timeout', '`put_item` with `ConditionExpression="attribute_not_exists(order_id)"`', 'Reading the file twice'], answer: 2, explain: 'A conditional write only saves when the key doesn\'t exist yet. The second run gets ConditionalCheckFailedException and skips.' },
        { q: 'The function moves finished files to `processed/` in the same bucket. Overnight it ran 400,000 times. What went wrong?', options: ['A partner uploaded too many files', 'The trigger fires for every new object, so each move triggered it again. Filter the trigger to the `incoming/` prefix', 'Lambda retried too often', 'DynamoDB was throttled'], answer: 1, explain: 'A function writing to the bucket that triggers it creates a loop. A prefix filter (or a separate output bucket) breaks it.' },
        { q: '`list_objects_v2` on a folder of 1,237 files returns 1,000. Why?', options: ['The other files are still uploading', 'It returns at most 1,000 keys per call; use a paginator', 'The bucket is in another region', 'Prefix only matches 1,000 files'], answer: 1, explain: 'Most AWS list calls return results in pages. `IsTruncated` and `NextContinuationToken` say there\'s more; a paginator follows them.' },
        { q: 'After its retries, a failed event from S3 should go somewhere a person can find it. Which setting does that?', options: ['Reserved concurrency', 'An on-failure destination, such as an Amazon SQS queue', 'A bigger memory setting', 'S3 versioning'], answer: 1, explain: 'Without a destination or dead-letter queue, Lambda drops the event after the last retry.' },
      ],
    },
    {
      id: 'cards',
      kind: 'cards',
      title: 'Flashcards',
      minutes: 5,
      cards: [
        { id: 'p4-unquote', front: 'Get the real object key from an S3 event record', back: '`urllib.parse.unquote_plus(record["s3"]["object"]["key"])`', hint: 'keys are URL-encoded', tags: ['s3', 'lambda'], difficulty: 'medium' },
        { id: 'p4-read', front: 'Read an S3 object as text', back: '`s3.get_object(Bucket=b, Key=k)["Body"].read().decode("utf-8")`', tags: ['s3'], difficulty: 'easy' },
        { id: 'p4-stringio', front: 'Read CSV text (not a file) row by row as dictionaries', back: '`csv.DictReader(io.StringIO(text))`', tags: ['csv'], difficulty: 'medium' },
        { id: 'p4-decimal', front: 'Why `Decimal("12.50")` and not `12.50` for DynamoDB?', back: 'boto3 refuses floats ("Use Decimal types instead"), and floats round money wrong. Build the Decimal from text.', tags: ['dynamodb'], difficulty: 'medium' },
        { id: 'p4-condition', front: 'Save an item only if its key isn\'t there yet', back: '`table.put_item(Item=item, ConditionExpression="attribute_not_exists(order_id)")`, and catch `ConditionalCheckFailedException`', tags: ['dynamodb', 'idempotency'], difficulty: 'hard' },
        { id: 'p4-move', front: 'How do you move an object in S3?', back: 'There\'s no move: `copy_object` to the new key, then `delete_object` the old one.', tags: ['s3'], difficulty: 'easy' },
        { id: 'p4-paginate', front: 'List every key under a prefix, even past 1,000', back: '`for page in s3.get_paginator("list_objects_v2").paginate(Bucket=b, Prefix=p):` and `page.get("Contents", [])`', tags: ['s3', 'pagination'], difficulty: 'medium' },
        { id: 'p4-retries', front: 'What does Lambda do when an asynchronous invocation fails?', back: 'Retries twice more, then sends the event to an on-failure destination or dead-letter queue if one is set, or drops it.', tags: ['lambda'], difficulty: 'hard' },
      ],
    },
    {
      id: 'build',
      kind: 'build',
      title: 'Build it for real',
      minutes: 60,
      body: `Deploy the pipeline to your own AWS account with the AWS command line. Everything below uses your default region (the one you chose in *Start here*).

1. **A project folder** with your finished \`lambda_function.py\` from the pipeline step, plus the two practice files (buttons below):

\`\`\`sh
mkdir -p ~/aws-study-projects/python/order-intake
cd ~/aws-study-projects/python/order-intake
\`\`\`

2. **Names used in every command.** Bucket names are global, so this one includes your account number:

\`\`\`sh
ACCOUNT=$(aws sts get-caller-identity --query Account --output text)
REGION=$(aws configure get region)
BUCKET="order-intake-$ACCOUNT"
\`\`\`

3. **The bucket, the table and the failure queue:**

\`\`\`sh
aws s3 mb "s3://$BUCKET"
aws dynamodb create-table --table-name Orders \\
  --attribute-definitions AttributeName=order_id,AttributeType=S \\
  --key-schema AttributeName=order_id,KeyType=HASH \\
  --billing-mode PAY_PER_REQUEST
aws sqs create-queue --queue-name order-intake-failures
\`\`\`

4. **A role for the function.** The trust policy lets Lambda use the role. The managed policy allows writing logs. The inline policy allows exactly what the code does, on this bucket and this table only:

\`\`\`sh
cat > trust.json <<'EOF'
{
  "Version": "2012-10-17",
  "Statement": [{"Effect": "Allow", "Principal": {"Service": "lambda.amazonaws.com"}, "Action": "sts:AssumeRole"}]
}
EOF
aws iam create-role --role-name order-intake-role --assume-role-policy-document file://trust.json
aws iam attach-role-policy --role-name order-intake-role \\
  --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole

cat > access.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {"Effect": "Allow", "Action": ["s3:GetObject", "s3:PutObject", "s3:DeleteObject"], "Resource": "arn:aws:s3:::$BUCKET/*"},
    {"Effect": "Allow", "Action": "dynamodb:PutItem", "Resource": "arn:aws:dynamodb:$REGION:$ACCOUNT:table/Orders"},
    {"Effect": "Allow", "Action": "sqs:SendMessage", "Resource": "arn:aws:sqs:$REGION:$ACCOUNT:order-intake-failures"}
  ]
}
EOF
aws iam put-role-policy --role-name order-intake-role --policy-name order-intake-access --policy-document file://access.json
\`\`\`

5. **The function.** Wait about ten seconds after creating the role: a brand-new role takes a moment to reach Lambda.

\`\`\`sh
zip function.zip lambda_function.py
aws lambda create-function --function-name order-intake \\
  --runtime python3.13 --handler lambda_function.lambda_handler \\
  --role "arn:aws:iam::$ACCOUNT:role/order-intake-role" \\
  --zip-file fileb://function.zip --timeout 60 --memory-size 256 \\
  --environment "Variables={TABLE_NAME=Orders}"
\`\`\`

boto3 is already in Lambda's Python runtime, so the zip only needs your file.

6. **Failed events go to the queue,** after Lambda's two retries:

\`\`\`sh
cat > destination.json <<EOF
{"OnFailure": {"Destination": "arn:aws:sqs:$REGION:$ACCOUNT:order-intake-failures"}}
EOF
aws lambda put-function-event-invoke-config --function-name order-intake \\
  --maximum-retry-attempts 2 --destination-config file://destination.json
\`\`\`

7. **Let S3 call the function, then add the trigger, for \`incoming/\` only:**

\`\`\`sh
aws lambda add-permission --function-name order-intake \\
  --statement-id s3-invoke --action lambda:InvokeFunction \\
  --principal s3.amazonaws.com \\
  --source-arn "arn:aws:s3:::$BUCKET" --source-account "$ACCOUNT"

cat > notification.json <<EOF
{
  "LambdaFunctionConfigurations": [{
    "LambdaFunctionArn": "arn:aws:lambda:$REGION:$ACCOUNT:function:order-intake",
    "Events": ["s3:ObjectCreated:*"],
    "Filter": {"Key": {"FilterRules": [{"Name": "prefix", "Value": "incoming/"}, {"Name": "suffix", "Value": ".csv"}]}}
  }]
}
EOF
aws s3api put-bucket-notification-configuration --bucket "$BUCKET" \\
  --notification-configuration file://notification.json
\`\`\`

8. **Try it.** Upload both files (the quotes matter: the names have spaces), then watch the logs:

\`\`\`sh
aws s3 cp "2026-10-29 northwind.csv" "s3://$BUCKET/incoming/2026-10-29 northwind.csv"
aws s3 cp "2026-10-29 globex.csv" "s3://$BUCKET/incoming/2026-10-29 globex.csv"
aws logs tail /aws/lambda/order-intake --since 10m
aws s3 ls "s3://$BUCKET/" --recursive
aws dynamodb scan --table-name Orders --select COUNT
\`\`\`

You should see 12 orders saved, the Northwind file in \`processed/\`, and the Globex file and its \`.error.txt\` in \`rejected/\`. Upload the Northwind file again: the log shows 12 duplicates, and the count stays at 12.

9. **Push it to GitHub**: \`lambda_function.py\` and the three JSON policy files. They contain your account number but no secrets; if you'd rather not publish it, replace it with \`ACCOUNT_ID\` before you commit.

**Cost:** Lambda, SQS and CloudWatch Logs fit in the free tier at this size. DynamoDB on-demand and S3 cost a fraction of a cent for a few test files.

**Cleanup**, when you're done:

\`\`\`sh
aws s3 rb "s3://$BUCKET" --force
aws lambda delete-function --function-name order-intake
aws dynamodb delete-table --table-name Orders
aws sqs delete-queue --queue-url "$(aws sqs get-queue-url --queue-name order-intake-failures --query QueueUrl --output text)"
aws iam delete-role-policy --role-name order-intake-role --policy-name order-intake-access
aws iam detach-role-policy --role-name order-intake-role --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole
aws iam delete-role --role-name order-intake-role
aws logs delete-log-group --log-group-name /aws/lambda/order-intake
\`\`\``,
      downloads: [
        { label: 'Download 2026-10-29 northwind.csv (good file)', filename: '2026-10-29 northwind.csv', content: () => orderFiles().goodCsv },
        { label: 'Download 2026-10-29 globex.csv (bad file)', filename: '2026-10-29 globex.csv', content: () => orderFiles().badCsv },
      ],
      checklist: [
        'Uploading to incoming/ runs my function, and the logs show it',
        'Good orders are in the Orders table; uploading the same file again adds no duplicates',
        'The bad file is in rejected/ with an .error.txt that says what\'s wrong',
        'The trigger only fires for incoming/, and failed events go to the SQS queue',
        'The function\'s role can only touch this bucket and this table',
        'It\'s on GitHub, and I ran the cleanup when I was done',
      ],
    },
  ],
};

export default tutorial;

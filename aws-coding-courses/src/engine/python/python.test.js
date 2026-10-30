// The practice Python: output, errors, the console, the pretend AWS account
// and the pretend internet behave like the real things they stand in for.
import { describe, it, expect, beforeAll } from 'vitest';
import { nodePython } from './nodePython';

let py;
beforeAll(async () => { py = await nodePython(); }, 60000);

const run = async (code, { scenario = {}, probe, invoke, path = 'main.py' } = {}) => {
  await py.reset(scenario);
  return py.run({ path, files: { [path]: code }, probe, invoke });
};

describe('running code', () => {
  it('captures print output and exit codes', async () => {
    const r = await run('import sys\nprint("hello", 3 + 4)\nprint("oops", file=sys.stderr)\nsys.exit(2)');
    expect(r.stdout).toBe('hello 7\n');
    expect(r.stderr).toBe('oops\n');
    expect(r.exitCode).toBe(2);
    expect(r.error).toBeNull();
  });

  it('reports errors with the learner\'s line and a plain-English tip', async () => {
    const r = await run('teams = {"Network": 3}\nprint(teams["network"])');
    expect(r.error).toMatchObject({ type: 'KeyError', line: 2 });
    expect(r.stderr).toContain('File "main.py", line 2');
    expect(r.stderr).not.toContain('practice_sandbox');
    expect(r.transcript.some((c) => c.stream === 'tip' && c.text.includes('.get('))).toBe(true);
  });

  it('reports syntax errors before running anything', async () => {
    const r = await run('print("before")\nif True\n    print("x")');
    expect(r.error.type).toBe('SyntaxError');
    expect(r.stdout).toBe('');
  });

  it('imports the learner\'s own modules, fresh on every run', async () => {
    await py.reset({});
    let r = await py.run({ path: 'main.py', files: { 'helpers.py': 'X = 1', 'main.py': 'import helpers\nprint(helpers.X)' } });
    expect(r.stdout).toBe('1\n');
    r = await py.run({ path: 'main.py', files: { 'helpers.py': 'X = 2' } });
    expect(r.stdout).toBe('2\n');
  });

  it('reads scenario files and returns files the program wrote', async () => {
    const r = await run('with open("in.txt") as f:\n    n = len(f.read().splitlines())\nopen("out.txt", "w").write(f"{n} lines\\n")', {
      scenario: { files: { 'in.txt': 'a\nb\nc\n' } },
    });
    expect(r.files['out.txt']).toBe('3 lines\n');
  });

  it('runs a probe in the program\'s namespace without showing its output', async () => {
    const r = await run('def double(x):\n    print("called")\n    return x * 2', { probe: '[double(2), double(5)]' });
    expect(r.probe).toEqual({ value: [4, 10] });
    expect(r.stdout).toBe('');
  });

  it('explains that input() can\'t be used', async () => {
    const r = await run('name = input("Name? ")');
    expect(r.error.type).toBe('RuntimeError');
    expect(r.error.message).toMatch(/Put the value in a variable/);
  });
});

describe('the console', () => {
  it('shows the value of the last expression and keeps variables between cells', async () => {
    await py.reset({ setup: 'raw = "  network "' });
    let r = await py.cell({ source: 'team = raw.strip().title()\nteam' });
    expect(r.stdout).toBe("'Network'\n");
    r = await py.cell({ source: 'len(team)', probe: 'team' });
    expect(r.stdout).toBe('7\n');
    expect(r.probe.value).toBe('Network');
  });

  it('sees what a file defined after it runs', async () => {
    await py.reset({});
    await py.run({ path: 'a.py', files: { 'a.py': 'total = 41' } });
    const r = await py.cell({ source: 'total + 1' });
    expect(r.stdout).toBe('42\n');
  });
});

const ACCOUNT = {
  aws: {
    regions: ['us-east-1', 'eu-west-1'],
    ec2: {
      'us-east-1': {
        instances: [
          { id: 'i-0aaa', state: 'running', tags: { Name: 'web' }, volumes: ['vol-01'] },
          { id: 'i-0bbb', state: 'stopped', stoppedAt: '2026-06-01T10:00:00Z', volumes: ['vol-02'] },
        ],
        volumes: [{ id: 'vol-01', size: 8, instance: 'i-0aaa' }, { id: 'vol-02', size: 30, instance: 'i-0bbb' }, { id: 'vol-03', size: 100, type: 'gp2' }],
        snapshots: [{ id: 'snap-01', size: 30, started: '2025-12-01T00:00:00Z' }],
        addresses: [{ id: 'eipalloc-01', ip: '198.51.100.7' }],
      },
    },
    publicSnapshots: 6,
    s3: { 'my-bucket': { 'a.txt': 'hello', 'docs/b.txt': 'b' } },
    sns: ['alerts'],
    dynamodb: { Orders: { key: ['order_id'], items: [{ order_id: 'A1', total: '12.50' }] } },
  },
};

describe('pretend AWS', () => {
  it('answers like boto3: nested EC2 responses, missing Tags keys, aware datetimes', async () => {
    const r = await run(`import boto3, datetime
ec2 = boto3.client('ec2')
res = ec2.describe_instances()
for r in res['Reservations']:
    for i in r['Instances']:
        print(i['InstanceId'], i['State']['Name'], 'Tags' in i, i['LaunchTime'].tzinfo is not None)
vols = ec2.describe_volumes(Filters=[{'Name': 'status', 'Values': ['available']}])['Volumes']
print([v['VolumeId'] for v in vols])
print(boto3.client('sts').get_caller_identity()['Account'])`, { scenario: ACCOUNT });
    expect(r.error).toBeNull();
    expect(r.stdout).toBe("i-0aaa running True True\ni-0bbb stopped False True\n['vol-03']\n111122223333\n");
  });

  it('includes public snapshots unless OwnerIds is set', async () => {
    const r = await run(`import boto3
ec2 = boto3.client('ec2')
print(len(ec2.describe_snapshots()['Snapshots']), len(ec2.describe_snapshots(OwnerIds=['self'])['Snapshots']))`, { scenario: ACCOUNT });
    expect(r.stdout).toBe('7 1\n');
  });

  it('validates parameters the way botocore does', async () => {
    let r = await run("import boto3\nboto3.client('s3').get_object(bucket='my-bucket', Key='a.txt')", { scenario: ACCOUNT });
    expect(r.error.type).toBe('ParamValidationError');
    expect(r.error.message).toContain('Unknown parameter in input: "bucket"');
    r = await run("import boto3\nboto3.client('ec2').describe_volumes(Filters=[{'Name': 'status', 'Values': 'available'}])", { scenario: ACCOUNT });
    expect(r.error.message).toContain('Invalid type for parameter Filters[0].Values');
    r = await run("import boto3\nboto3.client('ec2').describe_instance()", { scenario: ACCOUNT });
    expect(r.error).toMatchObject({ type: 'AttributeError', message: "'EC2' object has no attribute 'describe_instance'" });
  });

  it('raises modeled errors that are also ClientErrors', async () => {
    const r = await run(`import boto3
from botocore.exceptions import ClientError
s3 = boto3.client('s3')
try:
    s3.get_object(Bucket='my-bucket', Key='nope')
except s3.exceptions.NoSuchKey as e:
    print('NoSuchKey', isinstance(e, ClientError), e.response['Error']['Code'])
try:
    s3.head_object(Bucket='my-bucket', Key='nope')
except ClientError as e:
    print('head', e.response['Error']['Code'])
try:
    boto3.client('ec2').create_tags(Resources=['vol-03'], Tags=[{'Key': 'review', 'Value': 'yes'}], DryRun=True)
except ClientError as e:
    print(e.response['Error']['Code'])`, { scenario: ACCOUNT });
    expect(r.stdout).toBe('NoSuchKey True NoSuchKey\nhead 404\nDryRunOperation\n');
  });

  it('pages S3 listings at 1000 keys and paginators follow the tokens', async () => {
    const objects = Object.fromEntries(Array.from({ length: 1250 }, (_, n) => [`archive/${String(n).padStart(4, '0')}.csv`, 'x']));
    const r = await run(`import boto3
s3 = boto3.client('s3')
first = s3.list_objects_v2(Bucket='big', Prefix='archive/')
print(len(first['Contents']), first['IsTruncated'])
n = 0
for page in s3.get_paginator('list_objects_v2').paginate(Bucket='big', Prefix='archive/'):
    n += len(page.get('Contents', []))
print(n)
print('Contents' in s3.list_objects_v2(Bucket='big', Prefix='nothing/'))`, { scenario: { aws: { s3: { big: objects } } } });
    expect(r.stdout).toBe('1000 True\n1250\nFalse\n');
  });

  it('stores DynamoDB numbers as Decimal, refuses floats, and checks conditions', async () => {
    const r = await run(`import boto3
from decimal import Decimal
from boto3.dynamodb.conditions import Attr
table = boto3.resource('dynamodb').Table('Orders')
try:
    table.put_item(Item={'order_id': 'B2', 'total': 9.99})
except TypeError as e:
    print('float:', e)
table.put_item(Item={'order_id': 'B2', 'total': Decimal('9.99'), 'qty': 3})
print(repr(table.get_item(Key={'order_id': 'B2'})['Item']['qty']))
print('Item' in table.get_item(Key={'order_id': 'ZZ'}))
try:
    table.put_item(Item={'order_id': 'A1', 'total': Decimal('1')}, ConditionExpression='attribute_not_exists(order_id)')
except table.meta.client.exceptions.ConditionalCheckFailedException:
    print('duplicate kept out')
table.put_item(Item={'order_id': 'C3', 'total': Decimal('5')}, ConditionExpression=Attr('order_id').not_exists())`, { scenario: ACCOUNT });
    expect(r.stdout).toBe("float: Float types are not supported. Use Decimal types instead.\nDecimal('3')\nFalse\nduplicate kept out\n");
    expect(r.aws.dynamodb.Orders.map((i) => i.order_id).sort()).toEqual(['A1', 'B2', 'C3']);
    expect(r.aws.dynamodb.Orders.find((i) => i.order_id === 'A1').total).toBe('12.50');
  });

  it('publishes to SNS with the real subject rules', async () => {
    const r = await run(`import boto3
sns = boto3.client('sns')
arn = 'arn:aws:sns:us-east-1:111122223333:alerts'
sns.publish(TopicArn=arn, Subject='Site down', Message='api is 503')
try:
    sns.publish(TopicArn=arn, Subject='two\\nlines', Message='x')
except sns.exceptions.InvalidParameterException as e:
    print(e.response['Error']['Code'])
try:
    sns.publish(TopicArn=arn + 'x', Message='x')
except sns.exceptions.NotFoundException:
    print('no topic')`, { scenario: ACCOUNT });
    expect(r.stdout).toBe('InvalidParameter\nno topic\n');
    expect(r.aws.sns['arn:aws:sns:us-east-1:111122223333:alerts'].messages).toHaveLength(1);
  });

  it('refuses regions that are not opted in and services it does not have', async () => {
    let r = await run("import boto3\nboto3.client('ec2', region_name='af-south-1').describe_instances()", { scenario: ACCOUNT });
    expect(r.error.message).toContain('AuthFailure');
    r = await run("import boto3\nboto3.client('rds')", { scenario: ACCOUNT });
    expect(r.error.type).toBe('PracticeAccountError');
  });
});

describe('pretend internet', () => {
  const WEB = {
    web: {
      'https://www.example.com': { status: 200, body: '<title>Shop</title>', ms: 180 },
      'https://api.example.com/health': { status: 503 },
      'https://slow.example.com': { hang: true },
    },
    certs: { 'www.example.com': { notAfter: 'Dec  5 12:00:00 2099 GMT' }, 'old.example.com': { notAfter: 'Jan  1 00:00:00 2020 GMT' } },
  };

  it('answers urlopen with statuses, HTTPError, DNS errors and timeouts', async () => {
    const r = await run(`import urllib.request, urllib.error, time
with urllib.request.urlopen('https://www.example.com', timeout=10) as resp:
    print(resp.status, resp.read().decode())
for url in ['https://api.example.com/health', 'https://nowhere.example.org', 'https://slow.example.com']:
    try:
        urllib.request.urlopen(url, timeout=5)
    except urllib.error.HTTPError as e:
        print('http', e.code)
    except urllib.error.URLError as e:
        print('url', type(e.reason).__name__)
    except TimeoutError:
        print('timeout')
start = time.monotonic(); time.sleep(30); print(round(time.monotonic() - start))`, { scenario: WEB });
    expect(r.stdout).toBe('200 <title>Shop</title>\nhttp 503\nurl gaierror\ntimeout\n30\n');
    expect(r.web.log.filter((e) => e.kind === 'http').every((e) => e.timeout !== null)).toBe(true);
  });

  it('warns when a request has no timeout', async () => {
    const r = await run("import urllib.request\ntry:\n    urllib.request.urlopen('https://slow.example.com')\nexcept Exception as e:\n    print(type(e).__name__)", { scenario: WEB });
    expect(r.stdout).toBe('TimeoutError\n');
    expect(r.stderr).toContain('never answered');
  });

  it('serves certificates through socket and ssl, and fails expired ones', async () => {
    const r = await run(`import socket, ssl
ctx = ssl.create_default_context()
def expiry(host):
    with socket.create_connection((host, 443), timeout=10) as sock:
        with ctx.wrap_socket(sock, server_hostname=host) as tls:
            return tls.getpeercert()['notAfter']
print(expiry('www.example.com'))
print(ssl.cert_time_to_seconds(expiry('www.example.com')) > 4e9)
try:
    expiry('old.example.com')
except ssl.SSLCertVerificationError as e:
    print(e.verify_message)`, { scenario: WEB });
    expect(r.error).toBeNull();
    expect(r.stdout).toBe('Dec  5 12:00:00 2099 GMT\nTrue\ncertificate has expired\n');
  });
});

describe('Lambda invocations', () => {
  it('calls the handler with the event and a context, and shows the response', async () => {
    const r = await run(`import json
def lambda_handler(event, context):
    print('got', event['n'])
    return {'statusCode': 200, 'body': json.dumps({'double': event['n'] * 2}), 'left': context.get_remaining_time_in_millis() > 0}`,
    { path: 'lambda_function.py', invoke: { event: { n: 21 } } });
    expect(r.invoke.response).toEqual({ statusCode: 200, body: '{"double": 42}', left: true });
    expect(r.transcript[0].text).toMatch(/^START RequestId/);
    expect(r.stdout).toBe('got 21\n');
  });

  it('explains responses Lambda can\'t turn into JSON', async () => {
    const r = await run('from decimal import Decimal\ndef lambda_handler(event, context):\n    return {"total": Decimal("1.5")}',
      { path: 'lambda_function.py', invoke: { event: {} } });
    expect(r.invoke.error.type).toBe('Runtime.MarshalError');
  });

  it('does not run the __main__ block when invoked as a function', async () => {
    const r = await run('def lambda_handler(e, c):\n    return 1\nif __name__ == "__main__":\n    print("local test")',
      { path: 'lambda_function.py', invoke: { event: {} } });
    expect(r.stdout).toBe('');
  });
});

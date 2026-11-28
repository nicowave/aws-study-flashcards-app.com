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

  it('keeps a probe\'s printing out of the output, even right after the program\'s own', async () => {
    const r = await run('def double(x):\n    print("called")\n    return x * 2\nprint("done")', { probe: 'double(4)' });
    expect(r.probe).toEqual({ value: 8 });
    expect(r.stdout).toBe('done\n');
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

  it('refuses a number with more digits than DynamoDB stores, as boto3 does: a Decimal made from a float', async () => {
    const r = await run(`import boto3
from decimal import Decimal
table = boto3.resource('dynamodb').Table('Orders')
def put(order_id, total):
    try:
        table.put_item(Item={'order_id': order_id, 'total': total})
        return 'stored'
    except Exception as e:
        return type(e).__name__
print(put('D1', Decimal('0.1')), put('D2', Decimal('1.2345678901234567890123456789012345678')))
print(put('D3', Decimal('1.23456789012345678901234567890123456789')), put('D4', Decimal('1e200')))
table.put_item(Item={'order_id': 'D5', 'total': Decimal(0.1)})`, { scenario: ACCOUNT });
    expect(r.stdout).toBe('stored stored\nInexact Overflow\n');
    expect(r.error).toMatchObject({ type: 'Inexact', line: 12 });
    expect(r.transcript.some((c) => c.stream === 'tip' && c.text.includes('Make it from text'))).toBe(true);
    expect(r.aws.dynamodb.Orders.map((i) => i.order_id).sort()).toEqual(['A1', 'D1', 'D2']);
  });

  it('lets a check try things on a fresh account, then puts back what the program left', async () => {
    const r = await run(`import boto3
from decimal import Decimal
table = boto3.resource('dynamodb').Table('Orders')
s3 = boto3.client('s3')
table.put_item(Item={'order_id': 'B2', 'total': Decimal('3')})
s3.put_object(Bucket='my-bucket', Key='mine.txt', Body='kept')`, {
      scenario: ACCOUNT,
      probe: `import practice
_now = practice.aws.checkpoint()
practice.aws.restore()
_fresh = [len(practice.aws.CALLS), sorted(i['order_id'] for i in table.scan()['Items']), 'mine.txt' in practice.aws.STATE['s3']['my-bucket']]
table.put_item(Item={'order_id': 'FROM-THE-CHECK', 'total': Decimal('1')})
s3.put_object(Bucket='my-bucket', Key='check.txt', Body='gone again')
practice.aws.restore(_now)
RESULT = {'fresh': _fresh, 'after': sorted(i['order_id'] for i in table.scan()['Items'])}`,
    });
    expect(r.error).toBeNull();
    expect(r.probe).toEqual({ value: { fresh: [0, ['A1'], false], after: ['A1', 'B2'] } });
    expect(r.aws.dynamodb.Orders.map((i) => i.order_id).sort()).toEqual(['A1', 'B2']);
    expect(Object.keys(r.aws.s3['my-bucket'])).toContain('mine.txt');
    expect(Object.keys(r.aws.s3['my-bucket'])).not.toContain('check.txt');
    // the program's own two calls, and the scan that looked after the restore
    expect(r.aws.calls.map((c) => c.op)).toEqual(['put_item', 'put_object', 'scan']);
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

describe('pretend Amazon Bedrock', () => {
  const TICKET = 'Ticket: HD-9001\\nSubject: VPN drops every 10 minutes\\nFrom: ana.ruiz@example.com\\n\\nHi team, since this morning the VPN disconnects every ten minutes when I work from home. I have a client demo at 3 pm and cannot work like this. Thanks!';
  const HEAD = `import boto3, json, time
from botocore.exceptions import ClientError
from botocore.config import Config
bedrock = boto3.client('bedrock-runtime')
MODEL = 'amazon.nova-micro-v1:0'
TICKET = "${TICKET}"
def ask(text, model=MODEL, client=bedrock, **kwargs):
    return client.converse(modelId=model, messages=[{'role': 'user', 'content': [{'text': text}]}], **kwargs)
def code_of(fn):
    try:
        fn()
        return 'ok'
    except ClientError as e:
        return e.response['Error']['Code']
`;
  const model = (bedrock) => ({ aws: { bedrock } });

  it('answers converse() in the real response shape, with a reply worked out from the prompt', async () => {
    const r = await run(`${HEAD}
r = ask('Summarize this help desk ticket in one sentence:\\n\\n' + TICKET)
print(sorted(k for k in r if k != 'ResponseMetadata'))
print(r['output']['message']['role'], '|', r['output']['message']['content'][0]['text'])
print(r['stopReason'], r['usage'], r['metrics'], r['ResponseMetadata']['HTTPStatusCode'], r['ResponseMetadata']['RetryAttempts'])
again = ask('Summarize this help desk ticket in one sentence:\\n\\n' + TICKET, inferenceConfig={'temperature': 0.1})
print(again['output']['message']['content'][0]['text'] == r['output']['message']['content'][0]['text'])
print(ask('What is the capital of France?')['output']['message']['content'][0]['text'][:23])`, { scenario: {} });
    expect(r.error).toBeNull();
    expect(r.stdout).toBe(`['metrics', 'output', 'stopReason', 'usage']
assistant | VPN drops every 10 minutes: Since this morning the VPN disconnects every ten minutes when I work from home.
end_turn {'inputTokens': 71, 'outputTokens': 27, 'totalTokens': 98} {'latencyMs': 395} 200 0
True
I'm the practice model:
`);
    const [call] = r.aws.bedrock.calls;
    expect(call).toMatchObject({ modelId: 'amazon.nova-micro-v1:0', region: 'us-east-1', attempts: 1, error: null, stopReason: 'end_turn', inputTokens: 71, outputTokens: 27 });
    expect(call.user).toContain('HD-9001');
    expect(call.reply).toContain('VPN drops every 10 minutes');
  });

  it('returns JSON when the prompt asks for it, and cuts the reply off at maxTokens', async () => {
    const r = await run(`${HEAD}
system = [{'text': 'Reply with JSON only, with the keys summary, category and urgency.'}]
r = ask(f'<ticket>\\n{TICKET}\\n</ticket>', system=system, inferenceConfig={'maxTokens': 200, 'temperature': 0.2})
print(json.loads(r['output']['message']['content'][0]['text']))
cut = ask(f'<ticket>\\n{TICKET}\\n</ticket>', system=system, inferenceConfig={'maxTokens': 12})
print(cut['stopReason'], cut['usage']['outputTokens'], len(cut['output']['message']['content'][0]['text']))
print(ask('<ticket>Subject: New starter\\n\\nPlease create an account and a laptop for Maya, who starts next month. No rush.</ticket>', system=system)['output']['message']['content'][0]['text'])`, { scenario: {} });
    expect(r.error).toBeNull();
    expect(r.stdout).toBe(`{'summary': 'VPN drops every 10 minutes: Since this morning the VPN disconnects every ten minutes when I work from home.', 'category': 'Network', 'urgency': 'high'}
max_tokens 12 48
{"summary": "New starter: Please create an account and a laptop for Maya, who starts next month.", "category": "Accounts", "urgency": "low"}
`);
  });

  it('changes the wording when the same text is sent again at a high temperature, never at a low one', async () => {
    const r = await run(`${HEAD}
prompt = 'Summarize this ticket:\\n\\n' + TICKET
warm = {ask(prompt, inferenceConfig={'temperature': 0.9})['output']['message']['content'][0]['text'] for _ in range(3)}
cool = {ask(prompt, inferenceConfig={'temperature': 0.2})['output']['message']['content'][0]['text'] for _ in range(3)}
print(len(warm), len(cool))`, { scenario: {} });
    expect(r.stdout).toBe('3 1\n');
  });

  it('gets JSON wrong in the ways a scenario asks for', async () => {
    const r = await run(`${HEAD}
system = [{'text': 'Reply with JSON only.'}]
for ticket_id in ['HD-1', 'HD-2', 'HD-3', 'HD-4', 'HD-5', 'HD-6']:
    text = ask(f'<ticket>\\nTicket: {ticket_id}\\n{TICKET}\\n</ticket>', system=system)['output']['message']['content'][0]['text']
    try:
        print(ticket_id, sorted(json.loads(text).items())[2][1])
    except ValueError:
        print(ticket_id, 'not JSON:', text[:11].replace('\\n', ' '), '...', text[-12:].replace('\\n', ' '))`, {
      scenario: model({ quirks: [
        { match: 'HD-2', style: 'fenced' }, { match: 'HD-3', style: 'prose' }, { match: 'HD-4', style: 'invalid' },
        { match: 'HD-5', style: 'wrong-value' }, { match: 'HD-6', style: { text: 'I cannot help with that.' } },
      ] }),
    });
    expect(r.stdout).toBe(`HD-1 high
HD-2 not JSON: \`\`\`json {   ... "high" } \`\`\`
HD-3 not JSON: Here is the ... ything else.
HD-4 not JSON: {"summary": ... y": "high",}
HD-5 critical
HD-6 not JSON: I cannot he ... p with that.
`);
  });

  it('refuses requests the way the service does: model IDs, inference profiles, long input, bad values', async () => {
    const r = await run(`${HEAD}
west = boto3.client('bedrock-runtime', region_name='us-west-2')
print(code_of(lambda: ask(TICKET, model='amazon.nova-micro-v9:0')))
print(code_of(lambda: ask(TICKET, client=west)))
print(code_of(lambda: ask(TICKET, model='us.amazon.nova-micro-v1:0', client=west)))
print(code_of(lambda: ask(TICKET, model='arn:aws:bedrock:us-east-1::foundation-model/amazon.nova-micro-v1:0')))
print(code_of(lambda: ask(TICKET, model='eu.amazon.nova-micro-v1:0')))
print(code_of(lambda: ask('ERROR disk full\\n' * 40000)))
print(code_of(lambda: ask(TICKET, inferenceConfig={'temperature': 1.5})))
print(code_of(lambda: ask(TICKET, model='amazon.nova-lite-v1:0')))
print(code_of(lambda: bedrock.converse(modelId=MODEL, messages=[{'role': 'assistant', 'content': [{'text': 'Hello'}]}])))
try:
    ask(TICKET, client=west)
except bedrock.exceptions.ValidationException as e:
    print(e.response['ResponseMetadata']['HTTPStatusCode'], e.response['Error']['Message'])
try:
    ask('ERROR disk full\\n' * 40000)
except ClientError as e:
    print(e)`, { scenario: model({ denied: ['amazon.nova-lite-v1:0'] }) });
    expect(r.stdout).toBe(`ValidationException
ValidationException
ok
ok
ValidationException
ValidationException
ValidationException
AccessDeniedException
ValidationException
400 Invocation of model ID amazon.nova-micro-v1:0 with on-demand throughput isn't supported. Retry your request with the ID or ARN of an inference profile that contains this model.
An error occurred (ValidationException) when calling the Converse operation: Input is too long for requested model.
`);
    expect(r.aws.bedrock.calls.filter((c) => c.error).length).toBe(9);
  });

  it('checks parameters before sending, like botocore', async () => {
    let r = await run(`${HEAD}\nbedrock.converse(modelId=MODEL, messages=[{'role': 'user', 'content': 'hello'}])`, { scenario: {} });
    expect(r.error.type).toBe('ParamValidationError');
    expect(r.error.message).toContain("Invalid type for parameter messages[0].content, value: 'hello', type: <class 'str'>, valid types: <class 'list'>, <class 'tuple'>");
    r = await run(`${HEAD}\nbedrock.converse(modelId=MODEL, system='Be brief.', messages=[{'role': 'user', 'content': [{'txt': 'hello'}]}], inferenceConfig={'max_tokens': 50, 'maxTokens': 0})`, { scenario: {} });
    expect(r.error.message).toContain('Unknown parameter in messages[0].content[0]: "txt", must be one of: text, image');
    expect(r.error.message).toContain("Invalid type for parameter system, value: 'Be brief.'");
    expect(r.error.message).toContain('Unknown parameter in inferenceConfig: "max_tokens", must be one of: maxTokens, temperature, topP, stopSequences');
    expect(r.error.message).toContain('Invalid value for parameter inferenceConfig.maxTokens, value: 0, valid min value: 1');
    expect(r.aws.bedrock.calls).toEqual([]);
    r = await run(`${HEAD}\nbedrock.invoke_model(modelId=MODEL, body='{}')`, { scenario: {} });
    expect(r.error).toMatchObject({ type: 'PracticeAccountError' });
    expect(r.error.message).toContain('Use converse()');
  });

  it('retries throttling like the SDK (3 tries by default), then raises with RetryAttempts', async () => {
    const r = await run(`${HEAD}
start = time.monotonic()
try:
    ask(TICKET)
except bedrock.exceptions.ThrottlingException as e:
    print(e.response['Error']['Code'], e.response['ResponseMetadata']['HTTPStatusCode'], e.response['ResponseMetadata']['RetryAttempts'], isinstance(e, ClientError))
print(round(time.monotonic() - start))
r = ask(TICKET)
print(r['ResponseMetadata']['RetryAttempts'], r['stopReason'])
patient = boto3.client('bedrock-runtime', config=Config(retries={'total_max_attempts': 6, 'mode': 'standard'}))
print(ask('Second ticket, the same trouble: ' + TICKET, client=patient)['ResponseMetadata']['RetryAttempts'])
print(code_of(lambda: ask('Third ticket: ' + TICKET, client=boto3.client('bedrock-runtime', config=Config(retries={'max_attempts': 0})))))`, {
      scenario: model({ faults: [
        { code: 'ThrottlingException', times: 4, match: 'HD-9001' },
        { code: 'ServiceUnavailableException', times: 5, match: 'Second ticket' },
        { code: 'InternalServerException', times: 1, match: 'Third ticket' },
      ] }),
    });
    expect(r.error).toBeNull();
    // 3 throttled tries (waiting 1 s and 2 s), then one more throttled try and a good one
    expect(r.stdout).toBe('ThrottlingException 429 2 True\n3\n1 end_turn\n5\nInternalServerException\n');
    expect(r.aws.bedrock.calls.map((c) => c.attempts)).toEqual([3, 2, 6, 1]);
    expect(r.aws.bedrock.attempts).toBe(12);
    expect(r.web.slept).toBe(0); // the SDK's own waits aren't the program's time.sleep()
  });

  it('never retries what trying again cannot fix, and lets a check change the failures', async () => {
    const r = await run(`${HEAD}
import practice
print(code_of(lambda: ask(TICKET)), practice.aws.STATE['bedrock']['log'][-1]['attempts'])
practice.aws.bedrock_set(faults=[{'code': 'ModelTimeoutException', 'times': -1}])
print(code_of(lambda: ask(TICKET)), code_of(lambda: ask(TICKET)), practice.aws.STATE['bedrock']['log'][-1]['attempts'])
practice.aws.bedrock_set()
print(code_of(lambda: ask(TICKET)))`, { scenario: model({ faults: [{ code: 'AccessDeniedException', times: -1 }] }) });
    expect(r.stdout).toBe('AccessDeniedException 1\nModelTimeoutException ModelTimeoutException 1\nok\n');
  });

  it('lets a scenario add a model and choose which attempts fail', async () => {
    const r = await run(`${HEAD}
once = boto3.client('bedrock-runtime', config=Config(retries={'total_max_attempts': 1}))
print([code_of(lambda: ask(TICKET, client=once)) for _ in range(5)])
print(code_of(lambda: ask(TICKET, model='acme.tiny-v1:0')), code_of(lambda: ask('Summarize: the printer on floor three jams.', model='acme.tiny-v1:0')))`, {
      scenario: model({ models: { 'acme.tiny-v1:0': { contextWindow: 20 } }, faults: [{ code: 'ThrottlingException', after: 1, times: 3, match: 'HD-9001' }] }),
    });
    expect(r.stdout).toBe("['ok', 'ThrottlingException', 'ThrottlingException', 'ThrottlingException', 'ok']\nValidationException ok\n");
  });

  it('takes model time off the practice clock, so a Lambda function can run out of it', async () => {
    const r = await run(`import boto3
bedrock = boto3.client('bedrock-runtime')
def lambda_handler(event, context):
    left = []
    for n in range(3):
        bedrock.converse(modelId='amazon.nova-micro-v1:0', messages=[{'role': 'user', 'content': [{'text': 'Ticket %d: the printer on floor three is jammed again and nobody can print the payroll run.' % n}]}])
        left.append(round(context.get_remaining_time_in_millis() / 1000, 1))
    return {'left': left}`,
    { path: 'lambda_function.py', invoke: { event: {}, timeout: 5 }, scenario: model({ latencyMs: 2500 }) });
    expect(r.invoke.response).toEqual({ left: [2.5, 0, 0] });
    expect(r.invoke.error).toMatchObject({ type: 'Sandbox.Timedout' });
    expect(r.stderr).toContain('Task timed out after 5.00 seconds');
  });
  it('refuses calls botocore would never send: positional arguments, unknown, missing and mistyped parameters', async () => {
    let r = await run(`${HEAD}\nbedrock.converse(MODEL, [])`, { scenario: {} });
    expect(r.error).toMatchObject({ type: 'TypeError', message: 'converse() only accepts keyword arguments.' });
    r = await run(`${HEAD}\nbedrock.converse(messages=[], max_tokens=50)`, { scenario: {} });
    expect(r.error.type).toBe('ParamValidationError');
    expect(r.error.message).toContain('Missing required parameter in input: "modelId"');
    expect(r.error.message).toContain('Unknown parameter in input: "max_tokens", must be one of: modelId, messages, system, inferenceConfig');
    r = await run(`${HEAD}\nbedrock.converse(modelId=MODEL, messages=[{'content': [{'text': 5}]}, 'hello'], system=['Be brief.'], inferenceConfig={'maxTokens': 200.0, 'temperature': '0.2', 'topP': -1, 'stopSequences': '.'})`, { scenario: {} });
    for (const problem of [
      'Missing required parameter in messages[0]: "role"',
      "Invalid type for parameter messages[0].content[0].text, value: 5, type: <class 'int'>, valid types: <class 'str'>",
      "Invalid type for parameter messages[1], value: 'hello', type: <class 'str'>, valid types: <class 'dict'>",
      "Invalid type for parameter system[0], value: 'Be brief.', type: <class 'str'>, valid types: <class 'dict'>",
      "Invalid type for parameter inferenceConfig.maxTokens, value: 200.0, type: <class 'float'>, valid types: <class 'int'>",
      "Invalid type for parameter inferenceConfig.temperature, value: '0.2', type: <class 'str'>",
      'Invalid value for parameter inferenceConfig.topP, value: -1, valid min value: 0',
      "Invalid type for parameter inferenceConfig.stopSequences, value: '.', type: <class 'str'>, valid types: <class 'list'>, <class 'tuple'>",
    ]) expect(r.error.message).toContain(problem);
    expect(r.aws.bedrock.calls).toEqual([]);
    r = await run(`${HEAD}\nbedrock.count_tokens(modelId=MODEL, input={})`, { scenario: {} });
    expect(r.error.message).toContain('response["usage"]');
    r = await run(`${HEAD}\nboto3.client('bedrock-runtime', region_name='mars-east-1').converse(modelId=MODEL, messages=[])`, { scenario: {} });
    expect(r.error.type).toBe('EndpointConnectionError');
  });

  it('refuses a conversation the service cannot use, each with its own message', async () => {
    const r = await run(`${HEAD}
def why(**kwargs):
    try:
        bedrock.converse(modelId=MODEL, **kwargs)
        return 'ok'
    except ClientError as e:
        return e.response['Error']['Code'] + ': ' + e.response['Error']['Message'][:58]
user = lambda text: {'role': 'user', 'content': [{'text': text}]}
print(why())
print(why(messages=[]))
print(why(messages=[{'role': 'user', 'content': []}]))
print(why(messages=[user('   ')]))
print(why(messages=[user('Summarize this:'), user(TICKET)]))
print(why(messages=[{'role': 'User', 'content': [{'text': TICKET}]}]))
print(why(messages=[user(TICKET)], inferenceConfig={'maxTokens': 20000}))
print(why(messages=[user(TICKET)], inferenceConfig={'topP': 2}))
print(why(messages=[user(TICKET)], inferenceConfig={'maxTokens': 10000, 'topP': 1, 'temperature': 0}))`, { scenario: {} });
    expect(r.stdout).toBe(`ValidationException: A conversation must start with a user message. Try again w
ValidationException: A conversation must start with a user message. Try again w
ValidationException: The content field in the Message object at messages.0 is e
ValidationException: The text field in the ContentBlock object at messages.0.co
ValidationException: A conversation must alternate between user and assistant r
ValidationException: 1 validation error detected: Value 'User' at 'messages.1.m
ValidationException: The maximum tokens you requested exceeds the model limit o
ValidationException: 1 validation error detected: Value '2' at 'inferenceConfig
ok
`);
    expect(r.aws.bedrock.calls.map((c) => c.error)).toEqual([...Array(8).fill('ValidationException'), null]);
  });

  it('reads a system message, earlier turns and several text blocks, and stops at a stop sequence', async () => {
    const r = await run(`${HEAD}
user = lambda text: {'role': 'user', 'content': [{'text': text}]}
text = lambda r: r['output']['message']['content'][0]['text']
r = bedrock.converse(modelId=MODEL, messages=[{'role': 'system', 'content': [{'text': 'Reply with JSON only.'}]}, user(f'<ticket>{TICKET}</ticket>')])
print(sorted(json.loads(text(r))))
r = bedrock.converse(modelId=MODEL, messages=[user('Hello'), {'role': 'assistant', 'content': [{'text': 'Send me a ticket.'}]}, user(TICKET)], inferenceConfig={'temperature': 0})
print(text(r)[:26], '|', r['usage'])
r = bedrock.converse(modelId=MODEL, messages=[{'role': 'user', 'content': [{'text': 'Summarize this ticket:'}, {'text': TICKET}]}], inferenceConfig={'temperature': 0})
print(text(r)[:26])
r = bedrock.converse(modelId=MODEL, messages=[user(TICKET)], inferenceConfig={'temperature': 0, 'stopSequences': ['never there', ' when', ':']})
print(text(r), '|', r['stopReason'], r['usage']['outputTokens'])
r = bedrock.converse(modelId=MODEL, messages=[user(TICKET)], inferenceConfig={'temperature': 0, 'stopSequences': ['never there']})
print(r['stopReason'])`, { scenario: {} });
    expect(r.error).toBeNull();
    expect(r.stdout).toBe(`['category', 'summary', 'urgency']
VPN drops every 10 minutes | {'inputTokens': 65, 'outputTokens': 27, 'totalTokens': 92}
VPN drops every 10 minutes
VPN drops every 10 minutes | stop_sequence 7
end_turn
`);
  });

  it('takes inference profiles by ID and by ARN, from the Regions of their geography only', async () => {
    const r = await run(`${HEAD}
def where(region, model):
    return code_of(lambda: ask(TICKET, model=model, client=boto3.client('bedrock-runtime', region_name=region)))
print(where('eu-west-1', MODEL), where('eu-west-1', 'eu.' + MODEL), where('eu-west-1', 'us.' + MODEL))
print(where('eu-west-2', MODEL), where('us-east-2', MODEL), where('us-east-2', 'us.' + MODEL))
print(where('us-east-1', 'arn:aws:bedrock:us-east-1:111122223333:inference-profile/us.' + MODEL), where('us-east-1', 'global.' + MODEL))
print(where('us-east-1', 'anthropic.claude-3-haiku-20240307-v1:0'), where('us-east-1', ''))`, { scenario: { aws: { regions: ['us-east-1', 'us-east-2', 'eu-west-1', 'eu-west-2'] } } });
    expect(r.stdout).toBe(`ValidationException ok ValidationException
ok ValidationException ok
ok ValidationException
ValidationException ValidationException
`);
  });

  it('counts attempts as Config says: max_attempts are retries, legacy mode tries five times', async () => {
    const r = await run(`${HEAD}
def retries(**settings):
    client = boto3.client('bedrock-runtime', config=Config(retries=settings)) if settings else boto3.client('bedrock-runtime')
    try:
        ask(TICKET, client=client)
    except ClientError as e:
        return e.response['ResponseMetadata']['RetryAttempts']
print(retries(), retries(mode='standard'), retries(mode='legacy'), retries(max_attempts=4), retries(max_attempts=0), retries(total_max_attempts=1), retries(total_max_attempts=7, max_attempts=1))`, {
      scenario: model({ faults: [{ code: 'ThrottlingException', times: -1 }] }),
    });
    expect(r.stdout).toBe('2 2 4 4 0 0 6\n');
    expect(r.aws.bedrock.attempts).toBe(3 + 3 + 5 + 5 + 1 + 1 + 7);
  });

  it('lets a check use its own failures and start the scenario\'s again afterwards', async () => {
    const r = await run(`${HEAD}
print(code_of(lambda: ask(TICKET)))`, {
      scenario: model({ faults: [{ code: 'ThrottlingException', times: 4 }] }),
      probe: `import practice
_now = practice.aws.checkpoint()
practice.aws.bedrock_set(faults=[{"code": "AccessDeniedException", "times": -1, "message": "Not today."}], quirks=[{"match": "HD-9001", "style": "prose"}])
try:
    ask(TICKET)
except ClientError as e:
    _said = e.response["Error"]["Message"]
practice.aws.restore(_now)
_left = len(practice.aws.STATE["bedrock"]["log"])
practice.aws.restore()
RESULT = [_said, _left, len(practice.aws.STATE["bedrock"]["log"]), code_of(lambda: ask(TICKET)), code_of(lambda: ask(TICKET))]`,
    });
    expect(r.stdout).toBe('ThrottlingException\n');
    // back at the start, the four throttled attempts come again: one call fails (3 tries), the next gets through
    expect(r.probe).toEqual({ value: ['Not today.', 1, 0, 'ThrottlingException', 'ok'] });
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

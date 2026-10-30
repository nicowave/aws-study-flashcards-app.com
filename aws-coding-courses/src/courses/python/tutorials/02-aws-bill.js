// Tutorial 2: find what's quietly costing money in an AWS account, with boto3.

// ---------------------------------------------------------------------------
// The practice account: four regions with a mix of busy and forgotten things.
// Dates are worked out from today, so "older than 90 days" stays true for ever.
// The checks work out the right answers from the same data.
// ---------------------------------------------------------------------------

const DAY = 86400000;
const ago = (days) => new Date(Date.now() - days * DAY).toISOString().replace(/\.\d+Z$/, 'Z');

export const REGIONS = ['us-east-1', 'us-east-2', 'us-west-2', 'eu-west-1'];

export const account = () => ({ aws: {
  account: '111122223333',
  regions: REGIONS,
  publicSnapshots: 40,
  ec2: {
    'us-east-1': {
      instances: [
        { id: 'i-0a12b34c56d78e901', type: 't3.medium', state: 'running', launched: ago(380), tags: { Name: 'web-prod', Team: 'web' }, volumes: ['vol-01a2b3c4d5e6f7a81'], publicIp: '198.51.100.10' },
        { id: 'i-0b23c45d67e89f012', type: 't3.micro', state: 'running', launched: ago(64), volumes: ['vol-02b3c4d5e6f7a8b92'] },
        { id: 'i-0c34d56e78f90a123', type: 'm5.large', state: 'stopped', launched: ago(410), stoppedAt: ago(120), tags: { Name: 'old-reporting', Team: 'finance' }, volumes: ['vol-03c4d5e6f7a8b9c03'] },
      ],
      volumes: [
        { id: 'vol-01a2b3c4d5e6f7a81', size: 8, type: 'gp3', instance: 'i-0a12b34c56d78e901', created: ago(380) },
        { id: 'vol-02b3c4d5e6f7a8b92', size: 8, type: 'gp3', instance: 'i-0b23c45d67e89f012', created: ago(64) },
        { id: 'vol-03c4d5e6f7a8b9c03', size: 100, type: 'gp3', instance: 'i-0c34d56e78f90a123', created: ago(410) },
        { id: 'vol-04d5e6f7a8b9c0d14', size: 200, type: 'gp2', created: ago(230), tags: { Name: 'db-migration-temp' } },
      ],
      snapshots: [
        { id: 'snap-0a1b2c3d4e5f60711', volume: 'vol-03c4d5e6f7a8b9c03', size: 100, started: ago(200), description: 'before upgrade', tags: { Name: 'old-reporting-before-upgrade' } },
        { id: 'snap-0b2c3d4e5f6a70822', volume: 'vol-01a2b3c4d5e6f7a81', size: 8, started: ago(6), description: 'nightly web-prod' },
      ],
      addresses: [
        { id: 'eipalloc-0a1b2c3d4e5f60901', ip: '198.51.100.10', instance: 'i-0a12b34c56d78e901', tags: { Name: 'web-prod-ip' } },
        { id: 'eipalloc-0b2c3d4e5f6a70a12', ip: '198.51.100.24', tags: { Name: 'old-vpn' } },
      ],
    },
    'us-east-2': {
      instances: [
        { id: 'i-0d45e67f89a01b234', type: 't3.small', state: 'stopped', launched: ago(150), stoppedAt: ago(45), tags: { Name: 'test-box' }, volumes: ['vol-05e6f7a8b9c0d1e25'] },
      ],
      volumes: [
        { id: 'vol-05e6f7a8b9c0d1e25', size: 30, type: 'gp3', instance: 'i-0d45e67f89a01b234', created: ago(150) },
        { id: 'vol-06f7a8b9c0d1e2f36', size: 50, type: 'gp3', created: ago(300) },
      ],
      snapshots: [
        { id: 'snap-0c3d4e5f6a7b80933', volume: 'vol-06f7a8b9c0d1e2f36', size: 50, started: ago(400), description: 'manual copy' },
      ],
      addresses: [],
    },
    'us-west-2': {
      instances: [
        { id: 'i-0e56f78a90b12c345', type: 'g4dn.xlarge', state: 'running', launched: ago(20), tags: { Name: 'ml-experiment', Owner: 'sam' }, volumes: ['vol-07a8b9c0d1e2f3a47'] },
      ],
      volumes: [
        { id: 'vol-07a8b9c0d1e2f3a47', size: 125, type: 'gp3', instance: 'i-0e56f78a90b12c345', created: ago(20) },
      ],
      snapshots: [],
      addresses: [{ id: 'eipalloc-0c3d4e5f6a7b80b23', ip: '203.0.113.50' }],
    },
    'eu-west-1': {
      instances: [],
      volumes: [],
      snapshots: [{ id: 'snap-0d4e5f6a7b8c90a44', volume: 'vol-0ffffffffffffffff', size: 20, started: ago(30), description: 'eu copy' }],
      addresses: [],
    },
  },
} });

const PRICE_PER_GB = { gp3: 0.08, gp2: 0.10, io1: 0.125, io2: 0.125, st1: 0.045, sc1: 0.015, standard: 0.05 };
const SNAPSHOT_PER_GB = 0.05;
const PUBLIC_IP = 0.005 * 720;
const COLLECTION = { instance: 'instances', volume: 'volumes', snapshot: 'snapshots', address: 'addresses' };

// What the report should find: { id: { region, kind, monthly } }
export const expectedForgotten = (scenario = account()) => {
  const out = {};
  for (const [region, d] of Object.entries(scenario.aws.ec2)) {
    for (const v of d.volumes) {
      if (!v.instance) out[v.id] = { region, kind: 'volume', monthly: v.size * PRICE_PER_GB[v.type] };
    }
    for (const i of d.instances) {
      if (i.state !== 'stopped') continue;
      const gbCost = d.volumes.filter((v) => v.instance === i.id).reduce((sum, v) => sum + v.size * PRICE_PER_GB[v.type], 0);
      out[i.id] = { region, kind: 'instance', monthly: gbCost };
    }
    for (const s of d.snapshots) {
      if (Date.now() - new Date(s.started) > 90 * DAY) out[s.id] = { region, kind: 'snapshot', monthly: s.size * SNAPSHOT_PER_GB };
    }
    for (const a of d.addresses) {
      if (!a.instance) out[a.id] = { region, kind: 'address', monthly: PUBLIC_IP };
    }
  }
  return out;
};

// A small CSV reader: quoted cells may contain commas (Python's csv module adds quotes)
const parseCsv = (text) => {
  const rows = [];
  let row = [];
  let cell = '';
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; } else if (c === '"') quoted = false; else cell += c;
    } else if (c === '"') quoted = true;
    else if (c === ',') { row.push(cell); cell = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(cell); rows.push(row); row = []; cell = '';
    } else cell += c;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  const [header = [], ...data] = rows.filter((r) => r.some((x) => x.trim() !== ''));
  return data.map((r) => Object.fromEntries(header.map((h, n) => [h.trim(), (r[n] ?? '').trim()])));
};

// ---------------------------------------------------------------------------
// Code the learner builds
// ---------------------------------------------------------------------------

const INSTANCES_STARTER = `# instances.py: list the servers in us-east-1
import boto3

ec2 = boto3.client("ec2", region_name="us-east-1")
response = ec2.describe_instances()


def name_of(instance):
    """The instance's Name tag, or "(no name)"."""
    # TODO: turn instance's Tags list into a dictionary and return its "Name".
    #       Untagged instances have no "Tags" key at all.
    return "?"


for reservation in response["Reservations"]:
    for instance in reservation["Instances"]:
        # TODO: print the ID, type, state and name on one line, like:
        #   i-0a12b34c56d78e901 t3.medium running web-prod
        print(instance["InstanceId"])
`;

const INSTANCES_SOLUTION = `# instances.py: list the servers in us-east-1
import boto3

ec2 = boto3.client("ec2", region_name="us-east-1")
response = ec2.describe_instances()


def name_of(instance):
    """The instance's Name tag, or "(no name)"."""
    tags = {t["Key"]: t["Value"] for t in instance.get("Tags", [])}
    return tags.get("Name", "(no name)")


for reservation in response["Reservations"]:
    for instance in reservation["Instances"]:
        print(instance["InstanceId"], instance["InstanceType"], instance["State"]["Name"], name_of(instance))`;

const REPORT_TOP = `# cost_report.py: what in this AWS account looks forgotten, and what does it cost?
# Usage: python cost_report.py
import csv
from datetime import datetime, timezone

import boto3

OUT_FILE = "forgotten.csv"
FIELDS = ["region", "kind", "id", "name", "detail", "monthly_usd"]

# About what each costs per month in us-east-1. Other regions are close.
# Storage only: io1 and io2 also charge for provisioned IOPS, and gp3 adds
# a charge above its 3,000 IOPS / 125 MB/s baseline.
PRICE_PER_GB = {"gp3": 0.08, "gp2": 0.10, "io1": 0.125, "io2": 0.125, "st1": 0.045, "sc1": 0.015, "standard": 0.05}
SNAPSHOT_PER_GB = 0.05
PUBLIC_IP = 0.005 * 720  # $0.005 an hour, about 720 hours a month
OLD_SNAPSHOT_DAYS = 90


def name_of(resource):
    tags = {t["Key"]: t["Value"] for t in resource.get("Tags", [])}
    return tags.get("Name", "(no name)")


def volume_cost(volume):
    return volume["Size"] * PRICE_PER_GB.get(volume["VolumeType"], 0.10)


def all_items(client, operation, key, **kwargs):
    """Every item from a describe_ call, following the pages."""
    items = []
    for page in client.get_paginator(operation).paginate(**kwargs):
        items.extend(page[key])
    return items


def check_region(region):
    ec2 = boto3.client("ec2", region_name=region)
    now = datetime.now(timezone.utc)
    found = []  # one dictionary per forgotten resource

    # 1. Unattached volumes: "available" means no server is using them
    volumes = all_items(ec2, "describe_volumes", "Volumes")
    for v in volumes:
        if v["State"] == "available":
            found.append({"region": region, "kind": "volume", "id": v["VolumeId"], "name": name_of(v),
                          "detail": f"{v['Size']} GB {v['VolumeType']}, unattached", "monthly_usd": volume_cost(v)})
`;

const REPORT_BOTTOM = `
    return found


def main():
    regions = [r["RegionName"] for r in boto3.client("ec2").describe_regions()["Regions"]]
    rows = []
    for region in regions:
        found = check_region(region)
        print(f"{region}: {len(found)} forgotten")
        rows.extend(found)

    with open(OUT_FILE, "w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=FIELDS)
        writer.writeheader()
        for row in rows:
            writer.writerow({**row, "monthly_usd": f"{row['monthly_usd']:.2f}"})

    total = sum(row["monthly_usd"] for row in rows)
    print(f"{len(regions)} regions checked")
    print(f"Forgotten: {len(rows)} resources, about \${total:.2f} a month")
    print(f"Saved {OUT_FILE}")


if __name__ == "__main__":
    main()
`;

export const REPORT_STARTER = `${REPORT_TOP}
    # 2. Stopped instances: the server costs nothing, but its volumes are still billed
    reservations = all_items(ec2, "describe_instances", "Reservations")
    # TODO: for each instance in each reservation whose State Name is "stopped",
    #       add a row with kind "instance". Its cost is the cost of the volumes
    #       attached to it: the volumes whose Attachments have its InstanceId.

    # 3. Old snapshots, of YOUR volumes
    # TODO: get the snapshots with all_items(..., OwnerIds=["self"]) and add a row
    #       (kind "snapshot") for each one older than OLD_SNAPSHOT_DAYS.
    #       Age: (now - s["StartTime"]).days   Cost: s["VolumeSize"] * SNAPSHOT_PER_GB

    # 4. Public IP addresses that aren't attached to anything
    # TODO: ec2.describe_addresses()["Addresses"]: add a row (kind "address", id =
    #       its AllocationId) for each one without an "AssociationId". Cost: PUBLIC_IP
${REPORT_BOTTOM}`;

export const REPORT_SOLUTION = `${REPORT_TOP}
    # 2. Stopped instances: the server costs nothing, but its volumes are still billed
    reservations = all_items(ec2, "describe_instances", "Reservations")
    for reservation in reservations:
        for instance in reservation["Instances"]:
            if instance["State"]["Name"] != "stopped":
                continue
            attached = [v for v in volumes
                        if any(a["InstanceId"] == instance["InstanceId"] for a in v["Attachments"])]
            gb = sum(v["Size"] for v in attached)
            found.append({"region": region, "kind": "instance", "id": instance["InstanceId"], "name": name_of(instance),
                          "detail": f"{instance['InstanceType']} stopped, {gb} GB of volumes still billed",
                          "monthly_usd": sum(volume_cost(v) for v in attached)})

    # 3. Old snapshots, of YOUR volumes
    for s in all_items(ec2, "describe_snapshots", "Snapshots", OwnerIds=["self"]):
        age = (now - s["StartTime"]).days
        if age > OLD_SNAPSHOT_DAYS:
            found.append({"region": region, "kind": "snapshot", "id": s["SnapshotId"], "name": name_of(s),
                          "detail": f"{s['VolumeSize']} GB, {age} days old", "monthly_usd": s["VolumeSize"] * SNAPSHOT_PER_GB})

    # 4. Public IP addresses that aren't attached to anything
    for a in ec2.describe_addresses()["Addresses"]:
        if "AssociationId" not in a:
            found.append({"region": region, "kind": "address", "id": a["AllocationId"], "name": name_of(a),
                          "detail": f"{a['PublicIp']}, not attached", "monthly_usd": PUBLIC_IP})
${REPORT_BOTTOM}`;

// The tagging step starts from a finished report
const reportCsv = () => {
  const rows = Object.entries(expectedForgotten()).map(([id, r]) => `${r.region},${r.kind},${id},,,${r.monthly.toFixed(2)}`);
  return `region,kind,id,name,detail,monthly_usd\n${rows.join('\n')}\n`;
};

const TAG_STARTER = `# tag_for_review.py: mark everything in forgotten.csv for a person to review
import csv
from datetime import date

import boto3
from botocore.exceptions import ClientError

TAG = {"Key": "cleanup-review", "Value": date.today().isoformat()}

# Group the IDs by region: one client per region
by_region = {}
with open("forgotten.csv", newline="") as f:
    for row in csv.DictReader(f):
        by_region.setdefault(row["region"], []).append(row["id"])

for region, ids in by_region.items():
    ec2 = boto3.client("ec2", region_name=region)
    # TODO 1: call create_tags with DryRun=True first. It always raises a ClientError:
    #         code "DryRunOperation" means you're allowed, so carry on;
    #         any other code (like "UnauthorizedOperation"): print it and skip
    #         to the next region with continue.
    # TODO 2: then tag for real: create_tags(Resources=ids, Tags=[TAG])
    print(f"{region}: {len(ids)} to tag")
`;

const TAG_SOLUTION = `# tag_for_review.py: mark everything in forgotten.csv for a person to review
import csv
from datetime import date

import boto3
from botocore.exceptions import ClientError

TAG = {"Key": "cleanup-review", "Value": date.today().isoformat()}

# Group the IDs by region: one client per region
by_region = {}
with open("forgotten.csv", newline="") as f:
    for row in csv.DictReader(f):
        by_region.setdefault(row["region"], []).append(row["id"])

for region, ids in by_region.items():
    ec2 = boto3.client("ec2", region_name=region)
    try:
        ec2.create_tags(Resources=ids, Tags=[TAG], DryRun=True)
    except ClientError as e:
        code = e.response["Error"]["Code"]
        if code != "DryRunOperation":
            print(f"{region}: not allowed to tag ({code}), skipping")
            continue
    ec2.create_tags(Resources=ids, Tags=[TAG])
    print(f"{region}: tagged {len(ids)}")`;

// ---------------------------------------------------------------------------
// Checks
// ---------------------------------------------------------------------------

const checkInstances = ({ result }) => {
  if (result.error?.type === 'KeyError' && /Tags/.test(result.error.message)) {
    return 'KeyError: \'Tags\'. One instance has no tags at all, so it has no "Tags" key. Use instance.get("Tags", []).';
  }
  if (result.error) return null;
  const lines = result.stdout.split('\n');
  const instances = account().aws.ec2['us-east-1'].instances;
  if (!instances.some((i) => result.stdout.includes(i.id))) return null;
  for (const i of instances) {
    const line = lines.find((l) => l.includes(i.id));
    if (!line) return `${i.id} is missing from the list.`;
    const name = i.tags?.Name || '(no name)';
    if (!line.includes(i.type) || !line.includes(i.state)) return `Print the type and state too: ${i.id} is a ${i.type}, ${i.state}.`;
    if (!line.includes(name)) return i.tags ? `${i.id}'s line needs its name, ${name}.` : `${i.id} has no tags, so its line should say (no name).`;
  }
  return true;
};

const checkReport = ({ files, result }) => {
  if (result.error) {
    if (result.error.type === 'TypeError' && /offset-naive/.test(result.error.message)) {
      return 'Python can\'t subtract a date without a time zone from one with. Use now = datetime.now(timezone.utc), which the starter already has.';
    }
    return null;
  }
  const text = files['forgotten.csv'];
  if (!text) return null;
  const rows = parseCsv(text);
  if (rows.length && !('id' in rows[0] && 'monthly_usd' in rows[0])) return 'forgotten.csv needs the columns region, kind, id, name, detail and monthly_usd.';
  const scenario = account();
  const want = expectedForgotten(scenario);
  const own = new Set(Object.values(scenario.aws.ec2).flatMap((d) => [...d.instances, ...d.volumes, ...d.snapshots, ...d.addresses].map((x) => x.id)));
  const ids = rows.map((r) => r.id);
  if (ids.some((id) => id.startsWith('snap-') && !own.has(id))) {
    return 'Some of those snapshots aren\'t yours: they\'re public snapshots shared by Amazon and Canonical. Ask for yours only with OwnerIds=["self"].';
  }
  const extra = ids.filter((id) => !want[id]);
  if (extra.length) {
    const kinds = new Set(extra.map((id) => id.split('-')[0]));
    if (kinds.has('snap')) return `Only snapshots older than ${90} days count: ${extra.filter((id) => id.startsWith('snap-')).join(', ')} is recent.`;
    if (kinds.has('i')) return 'Only stopped instances count. Running ones are doing work.';
    if (kinds.has('eipalloc')) return 'Only addresses without an AssociationId count. An attached address is in use.';
    return `These aren't forgotten: ${extra.join(', ')}.`;
  }
  const missing = Object.keys(want).filter((id) => !ids.includes(id));
  if (missing.length === Object.keys(want).length) return null;
  const missingKinds = [...new Set(missing.map((id) => want[id].kind))];
  if (missingKinds.length) {
    const todo = { instance: 'TODO 2: stopped instances', snapshot: 'TODO 3: old snapshots', address: 'TODO 4: unattached addresses', volume: 'the unattached volumes' };
    return `Not found yet: ${missingKinds.map((k) => todo[k]).join('; ')}.`;
  }
  for (const r of rows) {
    const exp = want[r.id];
    if (r.region !== exp.region) return `${r.id} is in ${exp.region}, but the report says ${r.region}.`;
    const cost = Number(r.monthly_usd);
    if (!(Math.abs(cost - exp.monthly) < 0.011)) {
      return exp.kind === 'instance'
        ? `${r.id} costs about $${exp.monthly.toFixed(2)} a month: the cost of the volumes attached to it.`
        : `${r.id}'s cost should be about $${exp.monthly.toFixed(2)} a month.`;
    }
  }
  const total = Object.values(want).reduce((s, r) => s + r.monthly, 0);
  const sum = rows.reduce((s, r) => s + Number(r.monthly_usd), 0);
  return Math.abs(sum - total) < 0.05 ? true : `The total should be about $${total.toFixed(2)} a month.`;
};

const checkTags = ({ aws, result }) => {
  if (result.error) return null;
  const want = expectedForgotten();
  const tagged = (id, r) => aws.ec2?.[r.region]?.[COLLECTION[r.kind]]?.find((x) => x.id === id)?.tags?.['cleanup-review'];
  const done = Object.entries(want).filter(([id, r]) => tagged(id, r));
  const tagCalls = (aws.calls || []).filter((c) => c.op === 'create_tags');
  const regions = [...new Set(Object.values(want).map((r) => r.region))];
  const dryRegions = new Set(tagCalls.filter((c) => c.params.DryRun === true).map((c) => c.region));
  if (!done.length) return dryRegions.size ? 'The dry runs worked. Now call create_tags again without DryRun, to tag for real.' : null;
  if (done.length < Object.keys(want).length) return `${Object.keys(want).length - done.length} resources aren't tagged yet. Tag every ID in each region.`;
  const skipped = regions.filter((r) => !dryRegions.has(r));
  if (skipped.length) return `Everything is tagged. Now make it safe: do the DryRun=True call first in every region (missing in ${skipped.join(', ')}).`;
  return true;
};

// ---------------------------------------------------------------------------
// The tutorial
// ---------------------------------------------------------------------------

const tutorial = {
  slug: 'what-are-we-paying-for',
  number: 2,
  title: 'What are we paying for?',
  situation: 'The AWS bill went from about $1,900 to $2,600 a month, and the finance lead asks why. Nobody remembers launching half of what\'s running. You write a Python program that lists every server, disk, snapshot and public IP address in every region, flags what looks forgotten, and estimates what each one costs.',
  level: 'Intermediate',
  hours: 4,
  skills: ['boto3', 'nested data', 'dictionary comprehensions', 'paginators', 'time zones', 'error handling'],
  aws: ['Amazon EC2', 'Amazon EBS', 'Elastic IP addresses', 'IAM policies'],
  overview: 'You\'ll learn boto3, Amazon\'s Python toolkit, and how to read the nested answers AWS sends back. Then you\'ll build `cost_report.py`: it checks every region for unattached volumes, stopped servers, old snapshots and idle IP addresses, writes `forgotten.csv` with a monthly cost for each, and tags them for review, safely, with a dry run first.',
  steps: [
    {
      id: 'boto3-basics',
      kind: 'read',
      runtime: 'python',
      title: 'boto3: AWS from Python',
      minutes: 12,
      body: `**boto3** is Amazon's Python toolkit, its software development kit. Everything you can click in the AWS console, boto3 can do from code, and it's how most AWS automation is written.

You make a **client** for one service, then call its methods. The console below is connected to a **practice AWS account** (number \`111122223333\`), so nothing you run costs money or touches a real account.

\`\`\`python
import boto3

sts = boto3.client("sts")
response = sts.get_caller_identity()
response
\`\`\`

**STS** (the AWS Security Token Service) answers "who am I?". Every boto3 answer is an ordinary Python **dictionary**, often with dictionaries and lists inside. \`pprint\` (pretty print) lays it out readably:

\`\`\`python
from pprint import pprint

pprint(response)
\`\`\`

\`ResponseMetadata\` is on every answer: the request ID (what AWS Support asks for when something goes wrong) and the HTTP status, \`200\` for success. The parts you want are the other keys:

\`\`\`python
response["Arn"]
\`\`\`

### Where do the credentials come from?

You never put a password or access key in the code. boto3 looks for credentials in a fixed order, and uses the first it finds:

1. Environment variables (\`AWS_ACCESS_KEY_ID\` and friends), if set.
2. Your AWS config files in \`~/.aws/\`: the sign-in you set up with \`aws configure sso\` in *Start here*.
3. The **role** of where it runs: an Amazon EC2 server's instance profile, or a container's role. (On Lambda, the execution role's short-lived keys arrive as the environment variables in step 1.)

So the same program works on your laptop and in AWS, unchanged. The region works the same way: \`boto3.client("ec2", region_name="eu-west-1")\` picks one, and without it boto3 uses your default region.`,
      scenario: account,
    },
    {
      id: 'whoami',
      kind: 'try',
      runtime: 'python',
      title: 'Which account is this?',
      minutes: 5,
      task: 'Print the 12-digit **account number** of the practice account, using boto3 at the `>>>` prompt.',
      hint: 'Make an STS client, call `get_caller_identity()`, and take its `"Account"` key.',
      solution: 'import boto3\n\nsts = boto3.client("sts")\nprint(sts.get_caller_identity()["Account"])',
      scenario: account,
      check: ({ result, aws }) => {
        const asked = (aws.calls || []).some((c) => c.op === 'get_caller_identity');
        if (asked && result.stdout.includes('111122223333')) return true;
        if (asked && !result.error) return 'You got the answer. Now print just its "Account" value.';
        return null;
      },
      success: 'A good first line for any script that changes things: print which account it\'s about to work on. It has saved many people from running a cleanup in production by mistake.',
    },
    {
      id: 'nested-data',
      kind: 'read',
      runtime: 'python',
      title: 'Reading nested answers',
      minutes: 15,
      body: `**Amazon EC2** (Elastic Compute Cloud) is AWS's virtual servers, called **instances**. Ask for the ones in us-east-1:

\`\`\`python
import boto3

ec2 = boto3.client("ec2", region_name="us-east-1")
response = ec2.describe_instances()
len(response["Reservations"])
\`\`\`

The instances aren't at the top level. They're grouped in **reservations** (one per launch request), so you go two levels down:

\`\`\`text
response
└─ "Reservations": [ ... ]           a list
   └─ { "Instances": [ ... ] }       each reservation has a list
      └─ { "InstanceId": "i-0a12…",  each instance is a dictionary
           "State": {"Name": "running"},
           "Tags": [{"Key": "Name", "Value": "web-prod"}] }
\`\`\`

\`\`\`python
first = response["Reservations"][0]["Instances"][0]
first["InstanceId"], first["InstanceType"], first["State"]["Name"]
\`\`\`

So looping over every instance is a loop inside a loop:

\`\`\`python
for reservation in response["Reservations"]:
    for instance in reservation["Instances"]:
        print(instance["InstanceId"], instance["State"]["Name"])
\`\`\`

### Tags

**Tags** are labels people put on resources: a \`Name\`, a \`Team\`, an \`Owner\`. AWS sends them as a list of little dictionaries, which is awkward to search:

\`\`\`python
first["Tags"]
\`\`\`

A **dictionary comprehension** turns that list into a normal dictionary in one line, like the list comprehension from Tutorial 1 but with \`key: value\`:

\`\`\`python
tags = {t["Key"]: t["Value"] for t in first["Tags"]}
tags["Name"]
\`\`\`

Now the trap. Look at the second instance's tags:

\`\`\`python
second = response["Reservations"][1]["Instances"][0]
second["Tags"]
\`\`\`

A \`KeyError\`. **Untagged resources don't get an empty list: the \`"Tags"\` key isn't there at all.** AWS leaves out keys that have no value, all over its answers. \`.get()\` with a fallback handles it:

\`\`\`python
second.get("Tags", [])
\`\`\`

> **Filters** let AWS do the searching: \`ec2.describe_instances(Filters=[{"Name": "instance-state-name", "Values": ["stopped"]}])\`. \`Values\` is always a list, even for one value.`,
      scenario: account,
    },
    {
      id: 'list-instances',
      kind: 'try',
      runtime: 'python',
      title: 'List the servers',
      minutes: 15,
      task: 'Finish `instances.py` so it prints one line per instance in us-east-1, with its **ID, type, state and Name tag**, and `(no name)` for an instance without one.',
      hint: 'In `name_of`: `tags = {t["Key"]: t["Value"] for t in instance.get("Tags", [])}`, then `return tags.get("Name", "(no name)")`. In the loop, print `instance["InstanceType"]` and `instance["State"]["Name"]` too.',
      solution: INSTANCES_SOLUTION,
      files: [{ path: 'instances.py', starter: INSTANCES_STARTER }],
      scenario: account,
      check: checkInstances,
      success: 'An untagged server running for two months, that nobody can name: that\'s exactly the kind of thing this tutorial hunts for. Tag everything you launch; it\'s how people find out who owns what.',
    },
    {
      id: 'regions-pages',
      kind: 'read',
      runtime: 'python',
      title: 'Every region, every page',
      minutes: 15,
      body: `A client talks to **one region**. Forgotten things love the regions nobody looks at, so ask which regions the account uses, and make a client for each:

\`\`\`python
import boto3

regions = [r["RegionName"] for r in boto3.client("ec2").describe_regions()["Regions"]]
regions
\`\`\`

\`\`\`python
for region in regions:
    ec2 = boto3.client("ec2", region_name=region)
    print(region, len(ec2.describe_volumes()["Volumes"]), "volumes")
\`\`\`

\`describe_regions()\` lists the regions **enabled** for this account. Newer regions must be opted into, and calling one you haven't enabled fails with \`AuthFailure\`.

### Pages

Most AWS list calls return **pages**: a chunk of results and a \`NextToken\` that means "there's more, ask again with this". A loop that makes one call can miss everything after the first page. EC2's describe calls are a little different: they return everything at once unless you ask for pages, which gets slow and throttled in big accounts. A **paginator** handles both, asking again for you until the list ends:

\`\`\`python
ec2 = boto3.client("ec2", region_name="us-east-1")
volumes = []
for page in ec2.get_paginator("describe_volumes").paginate():
    volumes.extend(page["Volumes"])
len(volumes)
\`\`\`

In a small account there's only one page, so a plain call looks fine. A paginator works either way, so **make it a habit** for every list. A few calls, like \`describe_addresses\`, always answer in one go and have no paginator:

\`\`\`python
ec2.can_paginate("describe_volumes"), ec2.can_paginate("describe_addresses")
\`\`\`

### Whose snapshots?

A **snapshot** is a backup copy of a disk. Count them:

\`\`\`python
everything = ec2.describe_snapshots()["Snapshots"]
mine = ec2.describe_snapshots(OwnerIds=["self"])["Snapshots"]
len(everything), len(mine)
\`\`\`

Without \`OwnerIds\`, AWS also returns every **public** snapshot you're allowed to see, shared by Amazon, Canonical and others. In a real account that's many thousands, and none of them are on your bill:

\`\`\`python
everything[-1]["OwnerId"], everything[-1].get("OwnerAlias")
\`\`\`

### What costs money

About what each forgotten thing costs per month in us-east-1 (other regions are a little different):

| Resource | Why it's billed | About |
|---|---|---|
| Amazon EBS volume, \`gp3\` | storage, attached or not | $0.08 per GB |
| Amazon EBS volume, \`gp2\` (older type) | storage, attached or not | $0.10 per GB |
| Snapshot | stored backup data | $0.05 per GB |
| Public IPv4 address | every public address, $0.005 an hour | $3.60 |
| Stopped instance | no charge for the server, but its volumes still are | its volumes |

An **EBS** (Elastic Block Store) volume is a server's disk. A volume whose state is \`available\` is attached to nothing: paid for, unused. Snapshots are billed for the data they really hold, which is often less than the disk's size, so size × $0.05 is the most one can cost.`,
      scenario: account,
    },
    {
      id: 'time-and-errors',
      kind: 'read',
      runtime: 'python',
      title: 'How old is it? And when AWS says no',
      minutes: 10,
      body: `boto3 gives dates as real \`datetime\` values, with a **time zone** (UTC). Python refuses to subtract a datetime without a time zone from one with:

\`\`\`python
import boto3
from datetime import datetime, timezone

ec2 = boto3.client("ec2", region_name="us-east-1")
snap = ec2.describe_snapshots(OwnerIds=["self"])["Snapshots"][0]
snap["StartTime"]
\`\`\`

\`\`\`python
datetime.now() - snap["StartTime"]
\`\`\`

\`datetime.now()\` is your computer's local time, with no zone attached. Ask for the time in UTC instead, and the subtraction works:

\`\`\`python
age = datetime.now(timezone.utc) - snap["StartTime"]
age.days
\`\`\`

### Errors from AWS

When AWS refuses a request, boto3 raises a \`ClientError\`. The **error code** says why, and it's what your code should look at:

\`\`\`python
from botocore.exceptions import ClientError

try:
    ec2.describe_instances(InstanceIds=["i-0123456789abcdef0"])
except ClientError as e:
    print(e.response["Error"]["Code"])
    print(e.response["Error"]["Message"])
\`\`\`

| Code | Means |
|---|---|
| \`UnauthorizedOperation\`, \`AccessDenied\` | your permissions don't allow this |
| \`InvalidInstanceID.NotFound\` (and similar) | no such resource in this region |
| \`RequestLimitExceeded\`, \`Throttling\` | too many calls too fast: boto3 already retries these a few times |
| \`DryRunOperation\` | a test run that would have worked (next steps) |`,
      scenario: account,
    },
    {
      id: 'cost-report',
      kind: 'try',
      runtime: 'python',
      title: 'The cost report',
      minutes: 35,
      body: `\`cost_report.py\` checks each region and writes \`forgotten.csv\`. The helpers are done, and so is check 1, unattached volumes: use it as the pattern for the other three. After a run, try \`check_region("us-east-2")\` at \`>>>\` to see one region's rows.`,
      task: 'Finish TODOs 2–4 so `forgotten.csv` lists exactly what\'s forgotten in every region: unattached volumes, stopped instances (costing their attached volumes), **your** snapshots older than 90 days, and public IP addresses attached to nothing, each with its monthly cost.',
      hint: '2: loop the reservations and instances like `instances.py`; `attached = [v for v in volumes if any(a["InstanceId"] == instance["InstanceId"] for a in v["Attachments"])]`. 3: `all_items(ec2, "describe_snapshots", "Snapshots", OwnerIds=["self"])`, then `if (now - s["StartTime"]).days > OLD_SNAPSHOT_DAYS`. 4: `if "AssociationId" not in a`.',
      solution: REPORT_SOLUTION,
      files: [{ path: 'cost_report.py', starter: REPORT_STARTER }],
      scenario: account,
      check: checkReport,
      success: 'Every row is a question for a person: "is this still needed?". In real accounts, reports like this routinely find 10–30% of the bill. Look at the file with `print(open("forgotten.csv").read())`.',
    },
    {
      id: 'least-privilege',
      kind: 'read',
      title: 'Only the permissions it needs',
      minutes: 10,
      body: `On a real account, the report should run with permissions that **can only look**. If its credentials ever leak, or a bug sneaks in, the worst it can do is read. That's **least privilege**, and it's one of the most tested ideas on AWS exams.

Permissions are written as an **IAM policy**: JSON that AWS Identity and Access Management (IAM) checks on every call. This one allows reading everything in EC2 and adding one tag, nothing else:

\`\`\`json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "ReadTheInventory",
      "Effect": "Allow",
      "Action": ["ec2:Describe*"],
      "Resource": "*"
    },
    {
      "Sid": "MarkForReview",
      "Effect": "Allow",
      "Action": "ec2:CreateTags",
      "Resource": "*",
      "Condition": {
        "ForAllValues:StringEquals": { "aws:TagKeys": ["cleanup-review"] }
      }
    }
  ]
}
\`\`\`

- **Action** names a service and an API call, \`ec2:DescribeVolumes\`. A \`*\` matches many: \`ec2:Describe*\` is every EC2 \`Describe\` call. (EC2 has a few other read-only calls, like \`GetConsoleOutput\`, that it doesn't cover.)
- **Resource** is what it applies to. EC2's \`Describe\` calls can't be limited to particular resources, so they need \`"*"\`.
- **Condition** narrows it further: this program may only add tags whose key is \`cleanup-review\`.
- Anything not allowed is denied. There's no \`ec2:TerminateInstances\` here, so even a bad bug can't delete a server.

> \`sts:GetCallerIdentity\` needs no permission at all: it always works, which is why it's the standard "who am I?" check.`,
    },
    {
      id: 'tag-for-review',
      kind: 'try',
      runtime: 'python',
      title: 'Tag for review, with a dry run first',
      minutes: 20,
      body: `Deleting things is a decision for a person: that "forgotten" volume might be the only copy of last year's tax records. What a program *can* do is **tag** everything it found, so people can filter for it in the console and decide. (The practice account won't stop or delete anything, by design.)

Before changing anything, check you're allowed. Most EC2 calls take \`DryRun=True\`: AWS checks the permissions and stops without doing the work. Oddly, it answers with an error either way:

| The answer | Means |
|---|---|
| \`ClientError\` with code \`DryRunOperation\` | you **are** allowed; nothing was changed |
| \`ClientError\` with code \`UnauthorizedOperation\` | you're not allowed |

\`\`\`python
import boto3
from botocore.exceptions import ClientError

ec2 = boto3.client("ec2", region_name="us-east-1")
try:
    ec2.create_tags(Resources=["vol-04d5e6f7a8b9c0d14"], Tags=[{"Key": "cleanup-review", "Value": "test"}], DryRun=True)
except ClientError as e:
    print(e.response["Error"]["Code"])
\`\`\`

\`forgotten.csv\` from the report is already in the practice folder.`,
      task: 'Finish `tag_for_review.py`: in each region, do a `DryRun=True` call first and carry on only if it says `DryRunOperation`, then tag every forgotten resource with `cleanup-review`.',
      hint: '`try: ec2.create_tags(Resources=ids, Tags=[TAG], DryRun=True)` `except ClientError as e:` get the code; `if code != "DryRunOperation":` print and `continue`. After the try block, the real `ec2.create_tags(Resources=ids, Tags=[TAG])`.',
      solution: TAG_SOLUTION,
      files: [{ path: 'tag_for_review.py', starter: TAG_STARTER }],
      scenario: () => ({ ...account(), files: { 'forgotten.csv': reportCsv() } }),
      check: checkTags,
      success: 'Now anyone can open the EC2 console, filter by the tag `cleanup-review`, and decide what goes. Programs find; people delete.',
    },
    {
      id: 'exam-tips',
      kind: 'read',
      title: 'Exam tips: AWS Certified Developer – Associate',
      minutes: 6,
      body: `What this tutorial covered that the exam asks about:

- **The credential chain.** The SDKs look in order: environment variables, the shared config and credentials files, then the role of the compute it runs on. On EC2, Lambda or containers the answer is always **an IAM role**, never access keys in code or environment variables.
- **Pagination.** Large results come in pages with a \`NextToken\`. The SDKs have paginators; the AWS command line follows pages for you unless you add \`--no-paginate\`. A question where "only the first 1,000 items" come back is about pagination.
- **DryRun** checks permissions without making the change. An \`UnauthorizedOperation\` error comes with an encoded message; \`aws sts decode-authorization-message\` turns it into readable text saying which permission was missing.
- **Throttling.** Errors like \`ThrottlingException\` or \`RequestLimitExceeded\` mean "slow down". The SDKs retry with **exponential backoff and jitter**: wait a little, then longer, with some randomness so many clients don't retry at the same moment.
- **Policy evaluation.** Everything starts denied; an \`Allow\` opens it; an explicit \`Deny\` beats any \`Allow\`. Least privilege means listing only the actions a job needs.
- **Tags for cost.** To see costs per team or project in the billing reports, tags must be **activated as cost allocation tags** in the Billing console.`,
    },
    {
      id: 'quiz',
      kind: 'quiz',
      title: 'Check yourself',
      minutes: 6,
      questions: [
        { q: '`instance["Tags"]` raises `KeyError: \'Tags\'` for one instance. Why?', options: ['The instance was deleted', 'It has no tags, and AWS leaves out the "Tags" key entirely', 'Tags are only in the console', 'boto3 needs a region'], answer: 1, explain: 'AWS omits keys with no value. Use `instance.get("Tags", [])`.' },
        { q: '`describe_snapshots()` returns thousands of snapshots in a small account. What\'s missing?', options: ['A paginator', '`OwnerIds=["self"]`: without it you also get public snapshots shared by others', 'A region', 'DryRun=True'], answer: 1, explain: 'Without OwnerIds, the answer includes every public snapshot you can see. Only your own are on your bill.' },
        { q: '`datetime.now() - volume["CreateTime"]` raises a TypeError. What\'s the fix?', options: ['`datetime.now(timezone.utc) - volume["CreateTime"]`', '`str(volume["CreateTime"])`', '`volume["CreateTime"].days`', 'Use time.time()'], answer: 0, explain: 'boto3 dates carry a time zone (UTC). `datetime.now()` has none, and Python won\'t mix the two.' },
        { q: 'You call `create_tags(..., DryRun=True)` and you have permission. What happens?', options: ['The tags are added', 'It returns an empty dictionary', 'It raises a ClientError with code DryRunOperation, and changes nothing', 'Nothing at all'], answer: 2, explain: 'A successful dry run still comes back as an error, with the code DryRunOperation. UnauthorizedOperation means you\'re not allowed.' },
        { q: 'Why use a paginator even when one call returns everything today?', options: ['It\'s faster', 'Long lists come in pages, and a single call only gets the first; the paginator handles both', 'It\'s required by boto3', 'It avoids throttling'], answer: 1, explain: 'Code that ignores NextToken works until the account grows, then silently misses resources.' },
        { q: 'The report will run on an EC2 instance every night. How should it get AWS credentials?', options: ['Access keys in the script', 'Access keys in an environment variable', 'An IAM role attached to the instance (instance profile)', 'The root user\'s password'], answer: 2, explain: 'boto3 picks up the instance\'s role automatically. Short-lived credentials, nothing to leak.' },
      ],
    },
    {
      id: 'cards',
      kind: 'cards',
      title: 'Flashcards',
      minutes: 5,
      cards: [
        { id: 'p2-client', front: 'Make an EC2 client for eu-west-1', back: '`boto3.client("ec2", region_name="eu-west-1")`', tags: ['boto3'], difficulty: 'easy' },
        { id: 'p2-whoami', front: 'Which account am I using, from Python?', back: '`boto3.client("sts").get_caller_identity()["Account"]`', tags: ['boto3', 'sts'], difficulty: 'easy' },
        { id: 'p2-nesting', front: 'Where are the instances in a describe_instances answer?', back: '`response["Reservations"][n]["Instances"]`: a list inside each reservation.', tags: ['ec2'], difficulty: 'medium' },
        { id: 'p2-tags', front: 'Turn a resource\'s tags into a dictionary, safely', back: '`{t["Key"]: t["Value"] for t in r.get("Tags", [])}`', hint: 'untagged = no "Tags" key', tags: ['ec2', 'dictionaries'], difficulty: 'medium' },
        { id: 'p2-paginator', front: 'Get every volume, however many pages', back: '`for page in ec2.get_paginator("describe_volumes").paginate(): volumes.extend(page["Volumes"])`', tags: ['boto3'], difficulty: 'medium' },
        { id: 'p2-owner', front: 'Only your own snapshots', back: '`ec2.describe_snapshots(OwnerIds=["self"])`', tags: ['ec2'], difficulty: 'easy' },
        { id: 'p2-utc', front: 'How old is `snap["StartTime"]`, in days?', back: '`(datetime.now(timezone.utc) - snap["StartTime"]).days`', tags: ['dates'], difficulty: 'medium' },
        { id: 'p2-dryrun', front: 'What does a successful `DryRun=True` call return?', back: 'A ClientError with code `DryRunOperation`. `UnauthorizedOperation` means no permission.', tags: ['ec2', 'iam'], difficulty: 'hard' },
      ],
    },
    {
      id: 'build',
      kind: 'build',
      title: 'Build it for real',
      minutes: 45,
      body: `Run the report against your own AWS account, with read-only permissions.

1. **A project folder with boto3**, in a virtual environment (Tutorial 1's Build step explains these). On Ubuntu or the Windows Subsystem for Linux, install \`python3-venv\` first if you haven't: \`sudo apt install -y python3-venv\`.

\`\`\`sh
mkdir -p ~/aws-study-projects/python/cost-report
cd ~/aws-study-projects/python/cost-report
python3 -m venv .venv
source .venv/bin/activate
pip install boto3
\`\`\`

2. **Copy your programs** from the editors into \`cost_report.py\` and \`tag_for_review.py\` in that folder.

3. **A read-only sign-in.** Your *Start here* sign-in can do everything, so give the report its own, smaller one. In the AWS console, open **IAM Identity Center** → **Permission sets** → **Create permission set** → **Custom permission set** → **Inline policy**, paste the policy from the *Only the permissions it needs* step, and name it \`CostReport\`. Then **AWS accounts** → your account → **Assign users or groups** → your user → \`CostReport\`.

4. **A profile for it.** Run \`aws configure sso\` again, choose the \`CostReport\` role this time, and name the profile \`cost-report\`. Check it:

\`\`\`sh
aws sts get-caller-identity --profile cost-report
\`\`\`

5. **Run the report** with that profile. boto3 reads \`AWS_PROFILE\`, so the code doesn't change:

\`\`\`sh
AWS_PROFILE=cost-report python3 cost_report.py
cat forgotten.csv
\`\`\`

A new account will likely find nothing, which is good news. To see it work, create a 1 GB gp3 volume in the EC2 console (**Volumes** → **Create volume**) without attaching it, and run the report again.

6. **Prove the limits work.** This should fail with \`UnauthorizedOperation\`:

\`\`\`sh
aws ec2 stop-instances --instance-ids i-0123456789abcdef0 --dry-run --profile cost-report
\`\`\`

7. **Tag what it found**, then filter by the \`cleanup-review\` tag in the EC2 console:

\`\`\`sh
AWS_PROFILE=cost-report python3 tag_for_review.py
\`\`\`

8. **Push it to GitHub**, with a \`.gitignore\` containing \`.venv/\` and \`forgotten.csv\`: resource IDs and account details don't belong in a public repository.

**Cost:** \`Describe\` calls and tags are free. A 1 GB gp3 test volume costs about $0.08 a month. **Clean up:** delete the test volume (**Volumes** → select → **Delete volume**), and remove the tag from anything else with \`aws ec2 delete-tags --resources vol-0123456789abcdef0 --tags Key=cleanup-review\` (use the real ID). Run it with your normal sign-in, not \`cost-report\`: the read-only profile isn't allowed to delete tags.`,
      checklist: [
        'cost_report.py runs against my account with the read-only `cost-report` profile',
        'It found my unattached test volume',
        'The stop-instances dry run was refused: the permissions really are read-only',
        'Both programs are on GitHub, with .venv and forgotten.csv in .gitignore',
        'I deleted the test volume',
      ],
    },
  ],
};

export default tutorial;

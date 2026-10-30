# A pretend AWS account for the practice Python, shaped like boto3: the same
# client names, method names, parameters, responses and errors as the real
# thing, for the services the tutorials use. Nothing leaves the browser.
#
# install() registers boto3, botocore and boto3.dynamodb.conditions in
# sys.modules; reset(scenario) loads the account from a step's scenario;
# snapshot() hands the state back to JavaScript for the task checks.
import copy
import datetime as _dt
import decimal
import fnmatch
import hashlib
import io
import re
import sys
import types
import urllib.parse
import uuid

UTC = _dt.timezone.utc
STATE = {}
CALLS = []

# ----------------------------------------------------------------------------
# botocore.exceptions
# ----------------------------------------------------------------------------


class BotoCoreError(Exception):
    fmt = 'An unspecified error occurred'

    def __init__(self, **kwargs):
        self.kwargs = kwargs
        super().__init__(self.fmt.format(**kwargs))


class ParamValidationError(BotoCoreError, ValueError):
    fmt = 'Parameter validation failed:\n{report}'


class NoCredentialsError(BotoCoreError):
    fmt = 'Unable to locate credentials'


class NoRegionError(BotoCoreError):
    fmt = 'You must specify a region.'


class EndpointConnectionError(BotoCoreError):
    fmt = 'Could not connect to the endpoint URL: "{endpoint_url}"'


class UnknownServiceError(BotoCoreError):
    fmt = 'Unknown service: \'{service_name}\'. Valid service names are: {known_service_names}'


class OperationNotPageableError(BotoCoreError):
    fmt = 'Operation cannot be paginated: {operation_name}'


class ClientError(Exception):
    def __init__(self, error_response, operation_name):
        self.response = error_response
        self.operation_name = operation_name
        err = error_response.get('Error', {})
        super().__init__(
            f"An error occurred ({err.get('Code', 'Unknown')}) when calling the "
            f"{operation_name} operation: {err.get('Message', 'Unknown')}"
        )


for _cls in (BotoCoreError, ParamValidationError, NoCredentialsError, NoRegionError,
             EndpointConnectionError, UnknownServiceError, OperationNotPageableError, ClientError):
    _cls.__module__ = 'botocore.exceptions'


class PracticeAccountError(RuntimeError):
    """Raised for real AWS features the practice account doesn't have."""


PracticeAccountError.__module__ = 'practice'

# One exception class per (service, error code), like botocore's error factory,
# so `except s3.exceptions.NoSuchKey` and `except ClientError` both work.
_MODELED = {
    's3': {'NoSuchKey', 'NoSuchBucket', 'BucketAlreadyExists', 'BucketAlreadyOwnedByYou', 'NoSuchUpload', 'InvalidObjectState'},
    'dynamodb': {'ConditionalCheckFailedException', 'ResourceNotFoundException', 'ProvisionedThroughputExceededException',
                 'TransactionCanceledException', 'ResourceInUseException'},
    'sns': {'NotFoundException', 'InvalidParameterException', 'AuthorizationErrorException'},
    'sts': {'ExpiredTokenException'},
    'ec2': set(),  # EC2 models no error codes: everything is a plain ClientError
}
# Some error codes have a differently named class, e.g. SNS's "NotFound" is NotFoundException
_CODE_CLASS = {'NotFound': 'NotFoundException', 'InvalidParameter': 'InvalidParameterException',
               'AuthorizationError': 'AuthorizationErrorException'}
_exc_classes = {}


def _exc(service, code):
    name = _CODE_CLASS.get(code, code)
    if name not in _MODELED.get(service, set()):
        return ClientError
    key = (service, name)
    if key not in _exc_classes:
        cls = type(name, (ClientError,), {})
        cls.__module__ = 'botocore.errorfactory'
        _exc_classes[key] = cls
    return _exc_classes[key]


class _Exceptions:
    def __init__(self, service):
        self._service = service
        self.ClientError = ClientError

    def __getattr__(self, name):
        if name in _MODELED.get(self._service, set()):
            return _exc(self._service, name)
        raise AttributeError(f"'{CLASS_NAMES.get(self._service, self._service)}Exceptions' object has no attribute '{name}'")


def _pascal(op):
    return ''.join(p.capitalize() if p not in ('v2',) else 'V2' for p in op.split('_'))


def _fail(service, op, code, message, status=400):
    raise _exc(service, code)({
        'Error': {'Code': code, 'Message': message},
        'ResponseMetadata': {'RequestId': _request_id(), 'HTTPStatusCode': status, 'RetryAttempts': 0},
    }, _pascal(op))


# ----------------------------------------------------------------------------
# Helpers
# ----------------------------------------------------------------------------


def _request_id():
    return str(uuid.uuid4()).upper()


def _meta(status=200):
    rid = _request_id()
    return {'RequestId': rid, 'HTTPStatusCode': status,
            'HTTPHeaders': {'x-amzn-requestid': rid, 'content-type': 'text/xml;charset=UTF-8'}, 'RetryAttempts': 0}


def _time(value):
    if isinstance(value, _dt.datetime):
        return value if value.tzinfo else value.replace(tzinfo=UTC)
    return _dt.datetime.fromisoformat(str(value).replace('Z', '+00:00'))


def _now():
    return _dt.datetime.now(UTC).replace(microsecond=0)


def _tags_list(tags):
    return [{'Key': k, 'Value': v} for k, v in (tags or {}).items()]


def _account():
    return STATE.get('account', '111122223333')


# ----------------------------------------------------------------------------
# Clients
# ----------------------------------------------------------------------------

CLASS_NAMES = {'s3': 'S3', 'ec2': 'EC2', 'sts': 'STS', 'sns': 'SNS', 'dynamodb': 'DynamoDB'}
KNOWN_SERVICES = sorted([
    'acm', 'apigateway', 'athena', 'autoscaling', 'ce', 'cloudformation', 'cloudfront', 'cloudtrail', 'cloudwatch',
    'codebuild', 'codecommit', 'codedeploy', 'codepipeline', 'cognito-idp', 'dynamodb', 'ec2', 'ecr', 'ecs', 'efs',
    'eks', 'elasticache', 'elbv2', 'events', 'firehose', 'glue', 'iam', 'kinesis', 'kms', 'lambda', 'logs',
    'organizations', 'rds', 'route53', 's3', 'scheduler', 'secretsmanager', 'ses', 'sesv2', 'sns', 'sqs', 'ssm',
    'stepfunctions', 'sts', 'xray',
])


def _check_params(service, op, spec, kwargs):
    allowed = spec.get('required', []) + spec.get('optional', [])
    problems = []
    for name in kwargs:
        if name not in allowed:
            problems.append(f'Unknown parameter in input: "{name}", must be one of: {", ".join(allowed)}')
    for name in spec.get('required', []):
        if name not in kwargs:
            problems.append(f'Missing required parameter in input: "{name}"')
    for name, kind in spec.get('types', {}).items():
        if name in kwargs:
            value = kwargs[name]
            if kind == 'list' and not isinstance(value, (list, tuple)):
                problems.append(f"Invalid type for parameter {name}, value: {value!r}, type: {type(value)}, valid types: <class 'list'>, <class 'tuple'>")
            if kind == 'str' and not isinstance(value, str):
                problems.append(f"Invalid type for parameter {name}, value: {value!r}, type: {type(value)}, valid types: <class 'str'>")
            if kind == 'filters' and isinstance(value, (list, tuple)):
                for i, f in enumerate(value):
                    if not isinstance(f, dict) or 'Name' not in f:
                        problems.append(f'Missing required parameter in input: "Filters[{i}].Name"')
                    elif not isinstance(f.get('Values', []), (list, tuple)):
                        problems.append(f"Invalid type for parameter Filters[{i}].Values, value: {f['Values']!r}, type: {type(f['Values'])}, valid types: <class 'list'>, <class 'tuple'>")
    if problems:
        raise ParamValidationError(report='\n'.join(problems))


class _Paginator:
    def __init__(self, client, op, spec):
        self._client, self._op, self._spec = client, op, spec

    def paginate(self, **kwargs):
        return _PageIterator(self._client, self._op, self._spec, kwargs)


class _PageIterator:
    def __init__(self, client, op, spec, kwargs):
        self._client, self._op, self._spec = client, op, spec
        self._config = kwargs.pop('PaginationConfig', {}) or {}
        self._kwargs = kwargs

    def __iter__(self):
        token_in, token_out, limit_key = self._spec['paginate']
        kwargs = dict(self._kwargs)
        if self._config.get('PageSize'):
            kwargs[limit_key] = self._config['PageSize']
        if self._config.get('StartingToken'):
            kwargs[token_in] = self._config['StartingToken']
        while True:
            page = getattr(self._client, self._op)(**kwargs)
            yield page
            token = page.get(token_out)
            if not token:
                return
            kwargs[token_in] = token

    def build_full_result(self):
        result_key = self._spec['result']
        merged = {result_key: []}
        for page in self:
            merged[result_key].extend(page.get(result_key, []))
        return merged

    def search(self, expression):
        raise PracticeAccountError('The practice account doesn\'t support paginator.search(). Loop over the pages instead: for page in paginator.paginate(...)')


class _Client:
    def __init__(self, service, region, config=None):
        if service not in SERVICES:
            if service in KNOWN_SERVICES:
                raise PracticeAccountError(
                    f"The practice AWS account doesn't include {service}. "
                    f"It has: {', '.join(sorted(SERVICES))}.")
            raise UnknownServiceError(service_name=service, known_service_names=', '.join(KNOWN_SERVICES))
        self._service = service
        self._region = region
        self._ops = SERVICES[service]
        self.exceptions = _Exceptions(service)
        self.meta = types.SimpleNamespace(
            region_name=region, config=config,
            service_model=types.SimpleNamespace(service_name=service),
            endpoint_url=f'https://{service}.{region}.amazonaws.com')

    def __repr__(self):
        return f'<botocore.client.{CLASS_NAMES[self._service]} object at 0x{id(self):x}>'

    def __getattr__(self, name):
        if name.startswith('_'):
            raise AttributeError(name)
        if name not in self._ops:
            raise AttributeError(f"'{CLASS_NAMES[self._service]}' object has no attribute '{name}'")
        spec = self._ops[name]
        positional_ok = spec.get('positional')

        def call(*args, **kwargs):
            if args:
                if not positional_ok:
                    raise TypeError(f'{name}() only accepts keyword arguments.')
                kwargs = {**dict(zip(positional_ok, args)), **kwargs}
            if spec.get('unsupported'):
                raise PracticeAccountError(f"The practice AWS account doesn't support {self._service}.{name}(). {spec['unsupported']}")
            _check_params(self._service, name, spec, kwargs)
            _region_gate(self._service, self._region, name)
            CALLS.append({'service': self._service, 'op': name, 'region': self._region,
                          'params': {k: _summary(v) for k, v in kwargs.items()}})
            result = spec['fn'](self, **kwargs)
            if isinstance(result, dict) and spec.get('meta', True):
                result['ResponseMetadata'] = _meta(spec.get('status', 200))
            return result

        call.__name__ = name
        return call

    def can_paginate(self, operation_name):
        return 'paginate' in self._ops.get(operation_name, {})

    def get_paginator(self, operation_name):
        spec = self._ops.get(operation_name)
        if not spec or 'paginate' not in spec:
            raise OperationNotPageableError(operation_name=operation_name)
        return _Paginator(self, operation_name, spec)

    def get_waiter(self, waiter_name):
        raise PracticeAccountError('The practice account has no waiters: everything it does finishes right away.')


def _summary(value):
    if isinstance(value, (bytes, bytearray)):
        return f'<{len(value)} bytes>'
    if isinstance(value, str) and len(value) > 300:
        return value[:300] + '…'
    if isinstance(value, (str, int, float, bool)) or value is None:
        return value
    if isinstance(value, dict):
        return {k: _summary(v) for k, v in list(value.items())[:20]}
    if isinstance(value, (list, tuple)):
        return [_summary(v) for v in list(value)[:20]]
    return repr(value)[:300]


def _region_gate(service, region, op):
    if service in ('s3', 'sts'):
        return
    enabled = STATE.get('regions', [])
    if region in enabled:
        return
    if region in OPT_IN_REGIONS:
        _fail(service, op, 'AuthFailure', 'AWS was not able to validate the provided access credentials', 401)
    if region not in ALL_REGIONS:
        raise EndpointConnectionError(endpoint_url=f'https://{service}.{region}.amazonaws.com/')


ALL_REGIONS = [
    'us-east-1', 'us-east-2', 'us-west-1', 'us-west-2', 'ca-central-1', 'sa-east-1', 'eu-west-1', 'eu-west-2',
    'eu-west-3', 'eu-central-1', 'eu-north-1', 'ap-south-1', 'ap-northeast-1', 'ap-northeast-2', 'ap-northeast-3',
    'ap-southeast-1', 'ap-southeast-2', 'af-south-1', 'ap-east-1', 'me-south-1', 'eu-south-1',
]
OPT_IN_REGIONS = ['af-south-1', 'ap-east-1', 'me-south-1', 'eu-south-1']


# ----------------------------------------------------------------------------
# Paging
# ----------------------------------------------------------------------------


def _page(items, token, limit, default_limit=None):
    """One page of items. Tokens are just the start index, base-36 so they look opaque."""
    start = int(token, 36) if token else 0
    size = limit or default_limit or len(items) or 1
    chunk = items[start:start + size]
    nxt = start + size
    return chunk, (_token(nxt) if nxt < len(items) else None)


def _token(n):
    digits = '0123456789abcdefghijklmnopqrstuvwxyz'
    s = ''
    while True:
        n, r = divmod(n, 36)
        s = digits[r] + s
        if not n:
            break
    return s


# ----------------------------------------------------------------------------
# STS
# ----------------------------------------------------------------------------


def _sts_identity(client):
    user = STATE.get('user', 'learner')
    return {'UserId': 'AIDAEXAMPLEUSERID1234', 'Account': _account(), 'Arn': f'arn:aws:iam::{_account()}:user/{user}'}


# ----------------------------------------------------------------------------
# EC2
# ----------------------------------------------------------------------------

STATE_CODES = {'pending': 0, 'running': 16, 'shutting-down': 32, 'terminated': 48, 'stopping': 64, 'stopped': 80}


def _ec2(client):
    return STATE.setdefault('ec2', {}).setdefault(client._region, {'instances': [], 'volumes': [], 'snapshots': [], 'addresses': []})


def _match_filters(service, op, obj, filters, getters):
    for f in filters or []:
        name, values = f['Name'], [str(v) for v in f.get('Values', [])]
        if name.startswith('tag:'):
            actual = [obj.get('tags', {}).get(name[4:])]
        elif name == 'tag-key':
            actual = list(obj.get('tags', {}).keys())
        elif name in getters:
            got = getters[name](obj)
            actual = got if isinstance(got, list) else [got]
        else:
            _fail(service, op, 'InvalidParameterValue', f"The filter '{name}' is invalid")
        if not any(a is not None and fnmatch.fnmatchcase(str(a), v) for a in actual for v in values):
            return False
    return True


def _instance_view(i, region):
    view = {
        'AmiLaunchIndex': 0,
        'ImageId': i.get('image', 'ami-0abcdef1234567890'),
        'InstanceId': i['id'],
        'InstanceType': i.get('type', 't3.micro'),
        'LaunchTime': _time(i.get('launched', '2026-01-05T09:00:00Z')),
        'Placement': {'AvailabilityZone': i.get('az', region + 'a'), 'Tenancy': 'default'},
        'PrivateIpAddress': i.get('privateIp', '10.0.1.10'),
        'State': {'Code': STATE_CODES[i.get('state', 'running')], 'Name': i.get('state', 'running')},
        'StateTransitionReason': (f"User initiated ({_time(i['stoppedAt']).strftime('%Y-%m-%d %H:%M:%S')} GMT)"
                                  if i.get('stoppedAt') else ''),
        'SubnetId': 'subnet-0a1b2c3d4e5f60718',
        'VpcId': 'vpc-0123456789abcdef0',
        'BlockDeviceMappings': [
            {'DeviceName': '/dev/xvda' if n == 0 else f'/dev/sd{chr(101 + n)}',
             'Ebs': {'AttachTime': _time(i.get('launched', '2026-01-05T09:00:00Z')), 'DeleteOnTermination': n == 0,
                     'Status': 'attached', 'VolumeId': v}}
            for n, v in enumerate(i.get('volumes', []))
        ],
    }
    if i.get('publicIp') and i.get('state', 'running') == 'running':
        view['PublicIpAddress'] = i['publicIp']
    if i.get('tags'):
        view['Tags'] = _tags_list(i['tags'])  # untagged instances have no 'Tags' key at all
    return view


def _ec2_describe_instances(client, Filters=None, InstanceIds=None, MaxResults=None, NextToken=None, DryRun=False):
    _dry(client, 'describe_instances', DryRun)
    getters = {'instance-state-name': lambda i: i.get('state', 'running'), 'instance-type': lambda i: i.get('type', 't3.micro'),
               'instance-id': lambda i: i['id'], 'availability-zone': lambda i: i.get('az', client._region + 'a')}
    found = [i for i in _ec2(client)['instances']
             if (not InstanceIds or i['id'] in InstanceIds) and _match_filters('ec2', 'describe_instances', i, Filters, getters)]
    for wanted in InstanceIds or []:
        if not any(i['id'] == wanted for i in _ec2(client)['instances']):
            _fail('ec2', 'describe_instances', 'InvalidInstanceID.NotFound', f"The instance ID '{wanted}' does not exist")
    chunk, token = _page(found, NextToken, MaxResults)
    out = {'Reservations': [{'Groups': [], 'Instances': [_instance_view(i, client._region)], 'OwnerId': _account(),
                             'ReservationId': 'r-' + hashlib.md5(i['id'].encode()).hexdigest()[:17]} for i in chunk]}
    if token:
        out['NextToken'] = token
    return out


def _volume_view(v, region):
    view = {
        'AvailabilityZone': v.get('az', region + 'a'),
        'CreateTime': _time(v.get('created', '2026-01-05T09:00:00Z')),
        'Encrypted': v.get('encrypted', True),
        'Size': v['size'],
        'SnapshotId': v.get('fromSnapshot', ''),
        'State': 'in-use' if v.get('instance') else 'available',
        'VolumeId': v['id'],
        'Iops': 3000 if v.get('type', 'gp3') == 'gp3' else max(100, v['size'] * 3),
        'VolumeType': v.get('type', 'gp3'),
        'MultiAttachEnabled': False,
        'Attachments': ([{'AttachTime': _time(v.get('created', '2026-01-05T09:00:00Z')), 'Device': v.get('device', '/dev/xvda'),
                          'InstanceId': v['instance'], 'State': 'attached', 'VolumeId': v['id'], 'DeleteOnTermination': False}]
                        if v.get('instance') else []),
    }
    if v.get('tags'):
        view['Tags'] = _tags_list(v['tags'])
    return view


def _ec2_describe_volumes(client, Filters=None, VolumeIds=None, MaxResults=None, NextToken=None, DryRun=False):
    _dry(client, 'describe_volumes', DryRun)
    getters = {'status': lambda v: 'in-use' if v.get('instance') else 'available', 'volume-type': lambda v: v.get('type', 'gp3'),
               'attachment.instance-id': lambda v: v.get('instance'), 'volume-id': lambda v: v['id'], 'size': lambda v: v['size']}
    found = [v for v in _ec2(client)['volumes']
             if (not VolumeIds or v['id'] in VolumeIds) and _match_filters('ec2', 'describe_volumes', v, Filters, getters)]
    chunk, token = _page(found, NextToken, MaxResults)
    out = {'Volumes': [_volume_view(v, client._region) for v in chunk]}
    if token:
        out['NextToken'] = token
    return out


def _public_snapshots(region):
    owners = [('137112412989', 'amazon'), ('099720109477', 'Canonical')]
    count = STATE.get('publicSnapshots', 0)
    out = []
    for n in range(count):
        owner, alias = owners[n % 2]
        sid = 'snap-0' + hashlib.md5(f'{region}{n}'.encode()).hexdigest()[:16]
        out.append({'id': sid, 'volume': 'vol-ffffffff', 'size': 8 + (n % 4) * 8, 'started': f'2025-{1 + n % 12:02d}-15T00:00:00Z',
                    'description': f'{alias} public image snapshot {n}', 'owner': owner, 'alias': alias})
    return out


def _snapshot_view(s):
    view = {
        'Description': s.get('description', ''),
        'Encrypted': s.get('encrypted', False),
        'OwnerId': s.get('owner', _account()),
        'Progress': '100%',
        'SnapshotId': s['id'],
        'StartTime': _time(s.get('started', '2026-01-05T09:00:00Z')),
        'State': 'completed',
        'VolumeId': s.get('volume', 'vol-ffffffff'),
        'VolumeSize': s['size'],
        'StorageTier': 'standard',
    }
    if s.get('alias'):
        view['OwnerAlias'] = s['alias']
    if s.get('tags'):
        view['Tags'] = _tags_list(s['tags'])
    return view


def _ec2_describe_snapshots(client, Filters=None, OwnerIds=None, SnapshotIds=None, RestorableByUserIds=None,
                            MaxResults=None, NextToken=None, DryRun=False):
    _dry(client, 'describe_snapshots', DryRun)
    mine = _ec2(client)['snapshots']
    pool = list(mine)
    if not OwnerIds:
        pool += _public_snapshots(client._region)  # without OwnerIds you also get every public snapshot you can see
    else:
        wanted = set(OwnerIds)
        pool = [s for s in mine if wanted & {'self', _account()}]
        pool += [s for s in _public_snapshots(client._region) if s['owner'] in wanted or s['alias'] in wanted]
    getters = {'status': lambda s: 'completed', 'volume-id': lambda s: s.get('volume'), 'owner-id': lambda s: s.get('owner', _account()),
               'snapshot-id': lambda s: s['id'], 'volume-size': lambda s: s['size']}
    found = [s for s in pool if (not SnapshotIds or s['id'] in SnapshotIds) and _match_filters('ec2', 'describe_snapshots', s, Filters, getters)]
    chunk, token = _page(found, NextToken, MaxResults)
    out = {'Snapshots': [_snapshot_view(s) for s in chunk]}
    if token:
        out['NextToken'] = token
    return out


def _ec2_describe_addresses(client, Filters=None, PublicIps=None, AllocationIds=None, DryRun=False):
    _dry(client, 'describe_addresses', DryRun)
    getters = {'domain': lambda a: 'vpc', 'instance-id': lambda a: a.get('instance'), 'public-ip': lambda a: a['ip'],
               'allocation-id': lambda a: a['id']}
    out = []
    for a in _ec2(client)['addresses']:
        if PublicIps and a['ip'] not in PublicIps:
            continue
        if AllocationIds and a['id'] not in AllocationIds:
            continue
        if not _match_filters('ec2', 'describe_addresses', a, Filters, getters):
            continue
        view = {'AllocationId': a['id'], 'Domain': 'vpc', 'PublicIp': a['ip'], 'PublicIpv4Pool': 'amazon',
                'NetworkBorderGroup': client._region}
        if a.get('instance'):
            view.update({'AssociationId': 'eipassoc-' + a['id'][9:], 'InstanceId': a['instance'],
                         'NetworkInterfaceId': 'eni-0' + a['id'][9:], 'PrivateIpAddress': '10.0.1.20'})
        if a.get('tags'):
            view['Tags'] = _tags_list(a['tags'])
        out.append(view)
    return {'Addresses': out}


def _ec2_describe_regions(client, RegionNames=None, AllRegions=False, Filters=None, DryRun=False):
    names = list(STATE.get('regions', ['us-east-1']))
    if AllRegions:
        names += [r for r in OPT_IN_REGIONS if r not in names]
    regions = [{'Endpoint': f'ec2.{r}.amazonaws.com', 'RegionName': r,
                'OptInStatus': 'not-opted-in' if r in OPT_IN_REGIONS and r not in STATE.get('regions', []) else 'opt-in-not-required'}
               for r in names if not RegionNames or r in RegionNames]
    return {'Regions': regions}


def _dry(client, op, dry):
    if dry:
        _fail('ec2', op, 'DryRunOperation', 'Request would have succeeded, but DryRun flag is set.', 412)


def _ec2_create_tags(client, Resources, Tags, DryRun=False):
    _dry(client, 'create_tags', DryRun)
    pools = _ec2(client)
    for rid in Resources:
        target = next((r for kind in ('instances', 'volumes', 'snapshots', 'addresses') for r in pools[kind] if r['id'] == rid), None)
        if target is None:
            prefix = rid.split('-')[0]
            kind = {'i': 'InvalidInstanceID', 'vol': 'InvalidVolume', 'snap': 'InvalidSnapshot', 'eipalloc': 'InvalidAllocationID'}.get(prefix, 'InvalidID')
            _fail('ec2', 'create_tags', f'{kind}.NotFound', f"The ID '{rid}' does not exist")
        for t in Tags:
            target.setdefault('tags', {})[t['Key']] = t.get('Value', '')
    return {}


# ----------------------------------------------------------------------------
# S3
# ----------------------------------------------------------------------------


class StreamingBody:
    def __init__(self, data):
        self._raw = io.BytesIO(data)
        self._amount = len(data)

    def read(self, amt=None):
        return self._raw.read(amt) if amt is not None else self._raw.read()

    def iter_lines(self, chunk_size=1024, keepends=False):
        for line in self._raw.read().splitlines(keepends):
            yield line

    def iter_chunks(self, chunk_size=1024):
        while True:
            chunk = self._raw.read(chunk_size)
            if not chunk:
                return
            yield chunk

    def close(self):
        pass

    def __enter__(self):
        return self

    def __exit__(self, *exc):
        self.close()

    def __iter__(self):
        return self.iter_chunks()

    def __repr__(self):
        return f'<botocore.response.StreamingBody object at 0x{id(self):x}>'


StreamingBody.__module__ = 'botocore.response'


def _bucket(op, name):
    buckets = STATE.setdefault('s3', {})
    if name not in buckets:
        _fail('s3', op, 'NoSuchBucket', 'The specified bucket does not exist', 404)
    return buckets[name]


def _obj(data, content_type='binary/octet-stream', metadata=None, modified=None):
    return {'data': data, 'type': content_type, 'meta': dict(metadata or {}), 'modified': modified or _now(),
            'etag': '"' + hashlib.md5(data).hexdigest() + '"'}


def _as_bytes(body):
    if body is None:
        return b''
    if isinstance(body, str):
        return body.encode('utf-8')
    if isinstance(body, (bytes, bytearray)):
        return bytes(body)
    if hasattr(body, 'read'):
        data = body.read()
        return data.encode('utf-8') if isinstance(data, str) else data
    raise ParamValidationError(report=f"Invalid type for parameter Body, value: {body!r}, type: {type(body)}, valid types: <class 'bytes'>, <class 'bytearray'>, file-like object")


def _s3_put_object(client, Bucket, Key, Body=None, ContentType=None, Metadata=None, **_):
    data = _as_bytes(Body)
    o = _obj(data, ContentType or 'binary/octet-stream', Metadata)
    _bucket('put_object', Bucket)[Key] = o
    return {'ETag': o['etag']}


def _s3_get_object(client, Bucket, Key, Range=None, **_):
    o = _bucket('get_object', Bucket).get(Key)
    if o is None:
        _fail('s3', 'get_object', 'NoSuchKey', 'The specified key does not exist.', 404)
    return {'Body': StreamingBody(o['data']), 'ContentLength': len(o['data']), 'ContentType': o['type'],
            'ETag': o['etag'], 'LastModified': o['modified'], 'Metadata': dict(o['meta']), 'AcceptRanges': 'bytes'}


def _s3_head_object(client, Bucket, Key, **_):
    o = _bucket('head_object', Bucket).get(Key)
    if o is None:
        _fail('s3', 'head_object', '404', 'Not Found', 404)  # HEAD has no body, so no NoSuchKey: just "404"
    return {'ContentLength': len(o['data']), 'ContentType': o['type'], 'ETag': o['etag'],
            'LastModified': o['modified'], 'Metadata': dict(o['meta'])}


def _s3_delete_object(client, Bucket, Key, **_):
    _bucket('delete_object', Bucket).pop(Key, None)
    return {}


def _s3_copy_object(client, Bucket, Key, CopySource, Metadata=None, MetadataDirective='COPY', ContentType=None, **_):
    if isinstance(CopySource, str):
        src_bucket, _, src_key = urllib.parse.unquote(CopySource.lstrip('/')).partition('/')
    else:
        src_bucket, src_key = CopySource['Bucket'], CopySource['Key']
    src = _bucket('copy_object', src_bucket).get(src_key)
    if src is None:
        _fail('s3', 'copy_object', 'NoSuchKey', 'The specified key does not exist.', 404)
    meta = Metadata if MetadataDirective == 'REPLACE' else src['meta']
    o = _obj(src['data'], ContentType or src['type'], meta)
    _bucket('copy_object', Bucket)[Key] = o
    return {'CopyObjectResult': {'ETag': o['etag'], 'LastModified': o['modified']}}


def _s3_list_objects_v2(client, Bucket, Prefix='', Delimiter=None, MaxKeys=None, ContinuationToken=None, StartAfter=None, **_):
    objects = _bucket('list_objects_v2', Bucket)
    keys = sorted(k for k in objects if k.startswith(Prefix or '') and (not StartAfter or k > StartAfter))
    prefixes = []
    if Delimiter:
        flat = []
        for k in keys:
            rest = k[len(Prefix or ''):]
            if Delimiter in rest:
                p = (Prefix or '') + rest.split(Delimiter)[0] + Delimiter
                if p not in prefixes:
                    prefixes.append(p)
            else:
                flat.append(k)
        keys = flat
    chunk, token = _page(keys, ContinuationToken, min(MaxKeys or 1000, 1000))
    out = {'IsTruncated': bool(token), 'Name': Bucket, 'Prefix': Prefix or '', 'MaxKeys': MaxKeys or 1000,
           'KeyCount': len(chunk), 'EncodingType': 'url'}
    if chunk:  # an empty listing has no 'Contents' key at all
        out['Contents'] = [{'Key': k, 'LastModified': objects[k]['modified'], 'ETag': objects[k]['etag'],
                            'Size': len(objects[k]['data']), 'StorageClass': 'STANDARD'} for k in chunk]
    if prefixes:
        out['CommonPrefixes'] = [{'Prefix': p} for p in prefixes]
    if ContinuationToken:
        out['ContinuationToken'] = ContinuationToken
    if token:
        out['NextContinuationToken'] = token
    return out


def _s3_list_buckets(client):
    return {'Buckets': [{'Name': b, 'CreationDate': _time('2026-01-05T09:00:00Z')} for b in sorted(STATE.get('s3', {}))],
            'Owner': {'ID': 'a1b2c3d4e5f6example'}}


def _s3_create_bucket(client, Bucket, CreateBucketConfiguration=None, **_):
    buckets = STATE.setdefault('s3', {})
    if Bucket in buckets:
        _fail('s3', 'create_bucket', 'BucketAlreadyOwnedByYou', 'Your previous request to create the named bucket succeeded and you already own it.', 409)
    buckets[Bucket] = {}
    return {'Location': f'/{Bucket}'}


def _s3_upload_file(client, Filename, Bucket, Key, ExtraArgs=None, Callback=None, Config=None):
    with open(Filename, 'rb') as f:
        data = f.read()
    extra = ExtraArgs or {}
    _bucket('put_object', Bucket)[Key] = _obj(data, extra.get('ContentType', 'binary/octet-stream'), extra.get('Metadata'))
    return None


def _s3_download_file(client, Bucket, Key, Filename, ExtraArgs=None, Callback=None, Config=None):
    o = _bucket('head_object', Bucket).get(Key)
    if o is None:
        _fail('s3', 'head_object', '404', 'Not Found', 404)
    with open(Filename, 'wb') as f:
        f.write(o['data'])
    return None


# ----------------------------------------------------------------------------
# SNS
# ----------------------------------------------------------------------------


def _topics():
    return STATE.setdefault('sns', {})


def _topic(op, arn):
    t = _topics().get(arn)
    if t is None:
        _fail('sns', op, 'NotFound', 'Topic does not exist', 404)
    return t


def _sns_create_topic(client, Name, Attributes=None, Tags=None):
    arn = f'arn:aws:sns:{client._region}:{_account()}:{Name}'
    _topics().setdefault(arn, {'subscriptions': [], 'messages': []})
    return {'TopicArn': arn}


def _sns_publish(client, Message, TopicArn=None, TargetArn=None, PhoneNumber=None, Subject=None, MessageStructure=None,
                 MessageAttributes=None, MessageGroupId=None, MessageDeduplicationId=None):
    arn = TopicArn or TargetArn
    if not arn:
        _fail('sns', 'publish', 'InvalidParameter', 'Invalid parameter: TopicArn or TargetArn Reason: no value for required parameter')
    if Subject is not None:
        if not Subject or len(Subject) >= 100 or any(c in Subject for c in '\r\n'):
            _fail('sns', 'publish', 'InvalidParameter', 'Invalid parameter: Subject')
    if not Message:
        _fail('sns', 'publish', 'InvalidParameter', 'Invalid parameter: Empty message')
    if len(Message.encode('utf-8')) > 262144:
        _fail('sns', 'publish', 'InvalidParameter', 'Invalid parameter: Message too long')
    topic = _topic('publish', arn)
    mid = str(uuid.uuid4())
    topic['messages'].append({'id': mid, 'subject': Subject, 'message': Message, 'time': _now().isoformat()})
    return {'MessageId': mid}


def _sns_subscribe(client, TopicArn, Protocol, Endpoint=None, Attributes=None, ReturnSubscriptionArn=False):
    topic = _topic('subscribe', TopicArn)
    topic['subscriptions'].append({'protocol': Protocol, 'endpoint': Endpoint, 'confirmed': False})
    return {'SubscriptionArn': 'pending confirmation'}


def _sns_list_topics(client, NextToken=None):
    return {'Topics': [{'TopicArn': a} for a in sorted(_topics())]}


def _sns_list_subscriptions_by_topic(client, TopicArn, NextToken=None):
    topic = _topic('list_subscriptions_by_topic', TopicArn)
    return {'Subscriptions': [{'SubscriptionArn': 'PendingConfirmation', 'Owner': _account(), 'Protocol': s['protocol'],
                               'Endpoint': s['endpoint'], 'TopicArn': TopicArn} for s in topic['subscriptions']]}


# ----------------------------------------------------------------------------
# Service table
# ----------------------------------------------------------------------------

_FILTERS = {'Filters': 'filters'}

SERVICES = {
    'sts': {
        'get_caller_identity': {'fn': _sts_identity},
    },
    'ec2': {
        'describe_instances': {'fn': _ec2_describe_instances, 'optional': ['Filters', 'InstanceIds', 'MaxResults', 'NextToken', 'DryRun'],
                               'types': {**_FILTERS, 'InstanceIds': 'list'}, 'paginate': ('NextToken', 'NextToken', 'MaxResults'), 'result': 'Reservations'},
        'describe_volumes': {'fn': _ec2_describe_volumes, 'optional': ['Filters', 'VolumeIds', 'MaxResults', 'NextToken', 'DryRun'],
                             'types': {**_FILTERS, 'VolumeIds': 'list'}, 'paginate': ('NextToken', 'NextToken', 'MaxResults'), 'result': 'Volumes'},
        'describe_snapshots': {'fn': _ec2_describe_snapshots,
                               'optional': ['Filters', 'OwnerIds', 'SnapshotIds', 'RestorableByUserIds', 'MaxResults', 'NextToken', 'DryRun'],
                               'types': {**_FILTERS, 'OwnerIds': 'list', 'SnapshotIds': 'list'},
                               'paginate': ('NextToken', 'NextToken', 'MaxResults'), 'result': 'Snapshots'},
        'describe_addresses': {'fn': _ec2_describe_addresses, 'optional': ['Filters', 'PublicIps', 'AllocationIds', 'DryRun'],
                               'types': {**_FILTERS, 'PublicIps': 'list', 'AllocationIds': 'list'}},
        'describe_regions': {'fn': _ec2_describe_regions, 'optional': ['RegionNames', 'AllRegions', 'Filters', 'DryRun'], 'types': _FILTERS},
        'create_tags': {'fn': _ec2_create_tags, 'required': ['Resources', 'Tags'], 'optional': ['DryRun'], 'types': {'Resources': 'list', 'Tags': 'list'}},
        'run_instances': {'unsupported': 'This tutorial only looks at what already exists.'},
        'stop_instances': {'unsupported': 'The report only lists and tags. Stopping or deleting is a decision for a person.'},
        'terminate_instances': {'unsupported': 'The report only lists and tags. Stopping or deleting is a decision for a person.'},
        'delete_volume': {'unsupported': 'The report only lists and tags. Stopping or deleting is a decision for a person.'},
        'delete_snapshot': {'unsupported': 'The report only lists and tags. Stopping or deleting is a decision for a person.'},
        'release_address': {'unsupported': 'The report only lists and tags. Stopping or deleting is a decision for a person.'},
    },
    's3': {
        'put_object': {'fn': _s3_put_object, 'required': ['Bucket', 'Key'],
                       'optional': ['Body', 'ContentType', 'Metadata', 'CacheControl', 'ContentEncoding', 'ServerSideEncryption', 'StorageClass', 'Tagging']},
        'get_object': {'fn': _s3_get_object, 'required': ['Bucket', 'Key'], 'optional': ['Range', 'VersionId', 'IfMatch']},
        'head_object': {'fn': _s3_head_object, 'required': ['Bucket', 'Key'], 'optional': ['VersionId']},
        'delete_object': {'fn': _s3_delete_object, 'required': ['Bucket', 'Key'], 'optional': ['VersionId'], 'status': 204},
        'copy_object': {'fn': _s3_copy_object, 'required': ['Bucket', 'Key', 'CopySource'],
                        'optional': ['Metadata', 'MetadataDirective', 'ContentType', 'StorageClass', 'ServerSideEncryption']},
        'list_objects_v2': {'fn': _s3_list_objects_v2, 'required': ['Bucket'],
                            'optional': ['Prefix', 'Delimiter', 'MaxKeys', 'ContinuationToken', 'StartAfter', 'EncodingType', 'FetchOwner'],
                            'paginate': ('ContinuationToken', 'NextContinuationToken', 'MaxKeys'), 'result': 'Contents'},
        'list_objects': {'unsupported': 'Use list_objects_v2, the current version.'},
        'list_buckets': {'fn': _s3_list_buckets},
        'create_bucket': {'fn': _s3_create_bucket, 'required': ['Bucket'], 'optional': ['CreateBucketConfiguration', 'ACL']},
        'upload_file': {'fn': _s3_upload_file, 'required': ['Filename', 'Bucket', 'Key'], 'optional': ['ExtraArgs', 'Callback', 'Config'],
                        'positional': ['Filename', 'Bucket', 'Key'], 'meta': False},
        'download_file': {'fn': _s3_download_file, 'required': ['Bucket', 'Key', 'Filename'], 'optional': ['ExtraArgs', 'Callback', 'Config'],
                          'positional': ['Bucket', 'Key', 'Filename'], 'meta': False},
    },
    'sns': {
        'create_topic': {'fn': _sns_create_topic, 'required': ['Name'], 'optional': ['Attributes', 'Tags']},
        'publish': {'fn': _sns_publish, 'required': ['Message'],
                    'optional': ['TopicArn', 'TargetArn', 'PhoneNumber', 'Subject', 'MessageStructure', 'MessageAttributes',
                                 'MessageGroupId', 'MessageDeduplicationId'], 'types': {'Message': 'str', 'Subject': 'str'}},
        'subscribe': {'fn': _sns_subscribe, 'required': ['TopicArn', 'Protocol'], 'optional': ['Endpoint', 'Attributes', 'ReturnSubscriptionArn']},
        'list_topics': {'fn': _sns_list_topics, 'optional': ['NextToken']},
        'list_subscriptions_by_topic': {'fn': _sns_list_subscriptions_by_topic, 'required': ['TopicArn'], 'optional': ['NextToken']},
    },
    'dynamodb': {
        'put_item': {'unsupported': "Use the table resource, like the tutorial: boto3.resource('dynamodb').Table('...').put_item(Item={...})."},
        'get_item': {'unsupported': "Use the table resource, like the tutorial: boto3.resource('dynamodb').Table('...').get_item(Key={...})."},
        'describe_table': {'fn': lambda client, TableName: {'Table': _table_desc(TableName)}, 'required': ['TableName']},
        'list_tables': {'fn': lambda client, **_: {'TableNames': sorted(STATE.get('dynamodb', {}))}, 'optional': ['Limit', 'ExclusiveStartTableName']},
    },
}


# ----------------------------------------------------------------------------
# DynamoDB (the table resource, the way most Python code uses it)
# ----------------------------------------------------------------------------


def _table_desc(name):
    t = STATE.get('dynamodb', {}).get(name)
    if t is None:
        _fail('dynamodb', 'describe_table', 'ResourceNotFoundException', f'Requested resource not found: Table: {name} not found')
    return {'TableName': name, 'TableStatus': 'ACTIVE', 'ItemCount': len(t['items']),
            'KeySchema': [{'AttributeName': k, 'KeyType': 'HASH' if i == 0 else 'RANGE'} for i, k in enumerate(t['key'])],
            'BillingModeSummary': {'BillingMode': 'PAY_PER_REQUEST'}}


class ConditionBase:
    def __and__(self, other):
        return _Logic('AND', self, other)

    def __or__(self, other):
        return _Logic('OR', self, other)

    def __invert__(self):
        return _Logic('NOT', self, None)


class _Logic(ConditionBase):
    def __init__(self, kind, a, b):
        self.kind, self.a, self.b = kind, a, b

    def test(self, item):
        if self.kind == 'AND':
            return self.a.test(item) and self.b.test(item)
        if self.kind == 'OR':
            return self.a.test(item) or self.b.test(item)
        return not self.a.test(item)


class _Cond(ConditionBase):
    def __init__(self, name, op, *values):
        self.name, self.op, self.values = name, op, values

    def test(self, item):
        present = self.name in item
        value = item.get(self.name)
        if self.op == 'exists':
            return present
        if self.op == 'not_exists':
            return not present
        if not present:
            return False
        v = [_store(x, self.name) for x in self.values]
        try:
            return {
                'eq': lambda: value == v[0], 'ne': lambda: value != v[0], 'lt': lambda: value < v[0], 'lte': lambda: value <= v[0],
                'gt': lambda: value > v[0], 'gte': lambda: value >= v[0], 'begins_with': lambda: str(value).startswith(str(v[0])),
                'between': lambda: v[0] <= value <= v[1], 'contains': lambda: v[0] in value, 'is_in': lambda: value in v[0],
            }[self.op]()
        except TypeError:
            return False


class Attr:
    def __init__(self, name):
        self.name = name

    def eq(self, value): return _Cond(self.name, 'eq', value)
    def ne(self, value): return _Cond(self.name, 'ne', value)
    def lt(self, value): return _Cond(self.name, 'lt', value)
    def lte(self, value): return _Cond(self.name, 'lte', value)
    def gt(self, value): return _Cond(self.name, 'gt', value)
    def gte(self, value): return _Cond(self.name, 'gte', value)
    def begins_with(self, value): return _Cond(self.name, 'begins_with', value)
    def between(self, low, high): return _Cond(self.name, 'between', low, high)
    def contains(self, value): return _Cond(self.name, 'contains', value)
    def is_in(self, values): return _Cond(self.name, 'is_in', values)
    def exists(self): return _Cond(self.name, 'exists')
    def not_exists(self): return _Cond(self.name, 'not_exists')
    def attribute_type(self, value): raise PracticeAccountError('attribute_type() isn\'t in the practice account.')


class Key(Attr):
    pass


_COND_TOKEN = re.compile(r'\s*((?:attribute_not_exists|attribute_exists|begins_with|AND|OR|NOT)\b|<>|<=|>=|[=<>(),]|[#:]?[A-Za-z_][A-Za-z0-9_.]*)', re.I)


def _parse_condition(expr, names, values, op):
    """Parse the string form: attribute_not_exists(order_id), #s = :done AND total > :zero."""
    tokens, pos = [], 0
    while pos < len(expr):
        m = _COND_TOKEN.match(expr, pos)
        if not m or not m.group(1):
            if expr[pos:].strip() == '':
                break
            _fail('dynamodb', op, 'ValidationException', f'Invalid ConditionExpression: Syntax error; token: "{expr[pos:].strip()[:10]}"')
        tokens.append(m.group(1))
        pos = m.end()

    def name(tok):
        if tok.startswith('#'):
            if tok not in (names or {}):
                _fail('dynamodb', op, 'ValidationException',
                      f'Invalid ConditionExpression: An expression attribute name used in the document path is not defined; attribute name: {tok}')
            return names[tok]
        return tok

    def value(tok):
        if tok not in (values or {}):
            _fail('dynamodb', op, 'ValidationException',
                  f'Invalid ConditionExpression: An expression attribute value used in expression is not defined; attribute value: {tok}')
        return values[tok]

    i = 0

    def parse_or():
        nonlocal i
        left = parse_and()
        while i < len(tokens) and tokens[i].upper() == 'OR':
            i += 1
            left = left | parse_and()
        return left

    def parse_and():
        nonlocal i
        left = parse_not()
        while i < len(tokens) and tokens[i].upper() == 'AND':
            i += 1
            left = left & parse_not()
        return left

    def parse_not():
        nonlocal i
        if i < len(tokens) and tokens[i].upper() == 'NOT':
            i += 1
            return ~parse_not()
        return parse_atom()

    def expect(tok):
        nonlocal i
        if i >= len(tokens) or tokens[i] != tok:
            _fail('dynamodb', op, 'ValidationException', f'Invalid ConditionExpression: Syntax error; expected "{tok}"')
        i += 1

    def parse_atom():
        nonlocal i
        if i >= len(tokens):
            _fail('dynamodb', op, 'ValidationException', 'Invalid ConditionExpression: The expression can not be empty;')
        tok = tokens[i]
        low = tok.lower()
        if low in ('attribute_not_exists', 'attribute_exists', 'begins_with'):
            i += 1
            expect('(')
            attr = name(tokens[i]); i += 1
            if low == 'begins_with':
                expect(',')
                v = value(tokens[i]); i += 1
                expect(')')
                return Attr(attr).begins_with(v)
            expect(')')
            return Attr(attr).not_exists() if low == 'attribute_not_exists' else Attr(attr).exists()
        if tok == '(':
            i += 1
            inner = parse_or()
            expect(')')
            return inner
        attr = name(tok); i += 1
        if i >= len(tokens):
            _fail('dynamodb', op, 'ValidationException', 'Invalid ConditionExpression: Syntax error; token: "<EOF>"')
        cmp = tokens[i]; i += 1
        rhs = value(tokens[i]); i += 1
        fn = {'=': 'eq', '<>': 'ne', '<': 'lt', '<=': 'lte', '>': 'gt', '>=': 'gte'}.get(cmp)
        if not fn:
            _fail('dynamodb', op, 'ValidationException', f'Invalid ConditionExpression: Syntax error; token: "{cmp}"')
        return getattr(Attr(attr), fn)(rhs)

    cond = parse_or()
    if i != len(tokens):
        _fail('dynamodb', op, 'ValidationException', f'Invalid ConditionExpression: Syntax error; token: "{tokens[i]}"')
    return cond


def _store(value, path):
    """Copy a value the way DynamoDB stores it: numbers become Decimal, floats are refused."""
    if isinstance(value, bool) or value is None or isinstance(value, str):
        return value
    if isinstance(value, float):
        raise TypeError('Float types are not supported. Use Decimal types instead.')
    if isinstance(value, int):
        return decimal.Decimal(value)
    if isinstance(value, decimal.Decimal):
        if not value.is_finite():
            raise TypeError('Infinity and NaN not supported')
        return value
    if isinstance(value, (bytes, bytearray)):
        return bytes(value)
    if isinstance(value, dict):
        return {str(k): _store(v, f'{path}.{k}') for k, v in value.items()}
    if isinstance(value, (list, tuple)):
        return [_store(v, f'{path}[{n}]') for n, v in enumerate(value)]
    if isinstance(value, (set, frozenset)):
        if not value:
            _fail('dynamodb', 'put_item', 'ValidationException', 'One or more parameter values were invalid: An empty set is not allowed')
        return {_store(v, path) for v in value}
    if isinstance(value, (_dt.datetime, _dt.date)):
        raise TypeError(f'Unsupported type "{type(value)}" for value "{value}"')
    raise TypeError(f'Unsupported type "{type(value)}" for value "{value!r}"')


class _BatchWriter:
    def __init__(self, table):
        self._table = table

    def put_item(self, Item):
        self._table.put_item(Item=Item)

    def delete_item(self, Key):
        self._table.delete_item(Key=Key)

    def __enter__(self):
        return self

    def __exit__(self, *exc):
        return False


class Table:
    def __init__(self, name, region):
        self.name = self.table_name = name
        self._region = region
        self.meta = types.SimpleNamespace(client=_Client('dynamodb', region))

    def __repr__(self):
        return f"dynamodb.Table(name='{self.name}')"

    def _data(self, op):
        _region_gate('dynamodb', self._region, op)
        t = STATE.get('dynamodb', {}).get(self.name)
        if t is None:
            _fail('dynamodb', op, 'ResourceNotFoundException', 'Requested resource not found')
        return t

    def _keyof(self, op, item, what='item'):
        t = self._data(op)
        key = []
        for name in t['key']:
            if name not in item:
                _fail('dynamodb', op, 'ValidationException',
                      f'One or more parameter values were invalid: Missing the key {name} in the {what}' if what == 'item'
                      else 'The provided key element does not match the schema')
            v = item[name]
            want = t.get('types', {}).get(name, 'S')
            got = 'S' if isinstance(v, str) else 'N' if isinstance(v, (int, decimal.Decimal)) and not isinstance(v, bool) else 'B' if isinstance(v, bytes) else '?'
            if got != want:
                _fail('dynamodb', op, 'ValidationException',
                      f'One or more parameter values were invalid: Type mismatch for key {name} expected: {want} actual: {got}')
            if v == '':
                _fail('dynamodb', op, 'ValidationException',
                      f'One or more parameter values are not valid. The AttributeValue for a key attribute cannot contain an empty string value. Key: {name}')
            key.append(v)
        return tuple(key)

    def _log(self, op, params):
        CALLS.append({'service': 'dynamodb', 'op': op, 'region': self._region, 'table': self.name,
                      'params': {k: _summary(v) for k, v in params.items()}})

    def _condition(self, op, cond, names, values):
        if cond is None:
            return None
        if isinstance(cond, str):
            return _parse_condition(cond, names, values, op)
        return cond

    def put_item(self, *args, **kwargs):
        if args:
            raise TypeError('put_item() only accepts keyword arguments.')
        _check_params('dynamodb', 'put_item', {'required': ['Item'], 'optional': [
            'ConditionExpression', 'ExpressionAttributeNames', 'ExpressionAttributeValues', 'ReturnValues']}, kwargs)
        item = {k: _store(v, k) for k, v in kwargs['Item'].items()}
        self._log('put_item', kwargs)
        key = self._keyof('put_item', item)
        t = self._data('put_item')
        existing = next((x for x in t['items'] if self._keyof('put_item', x) == key), None)
        cond = self._condition('put_item', kwargs.get('ConditionExpression'), kwargs.get('ExpressionAttributeNames'),
                               kwargs.get('ExpressionAttributeValues'))
        if cond is not None and not cond.test(existing or {}):
            _fail('dynamodb', 'put_item', 'ConditionalCheckFailedException', 'The conditional request failed')
        if existing is not None:
            t['items'].remove(existing)
        t['items'].append(item)
        out = {'ResponseMetadata': _meta()}
        if kwargs.get('ReturnValues') == 'ALL_OLD' and existing:
            out['Attributes'] = copy.deepcopy(existing)
        return out

    def get_item(self, *args, **kwargs):
        if args:
            raise TypeError('get_item() only accepts keyword arguments.')
        _check_params('dynamodb', 'get_item', {'required': ['Key'], 'optional': ['ConsistentRead', 'ProjectionExpression', 'ExpressionAttributeNames']}, kwargs)
        self._log('get_item', kwargs)
        key = self._keyof('get_item', {k: _store(v, k) for k, v in kwargs['Key'].items()}, 'key')
        found = next((x for x in self._data('get_item')['items'] if self._keyof('get_item', x) == key), None)
        out = {'ResponseMetadata': _meta()}
        if found is not None:
            out['Item'] = copy.deepcopy(found)  # a missing item means no 'Item' key, not an error
        return out

    def delete_item(self, *args, **kwargs):
        _check_params('dynamodb', 'delete_item', {'required': ['Key'], 'optional': ['ConditionExpression', 'ExpressionAttributeNames', 'ExpressionAttributeValues', 'ReturnValues']}, kwargs)
        self._log('delete_item', kwargs)
        t = self._data('delete_item')
        key = self._keyof('delete_item', {k: _store(v, k) for k, v in kwargs['Key'].items()}, 'key')
        t['items'] = [x for x in t['items'] if self._keyof('delete_item', x) != key]
        return {'ResponseMetadata': _meta()}

    def scan(self, *args, **kwargs):
        _check_params('dynamodb', 'scan', {'optional': ['FilterExpression', 'Limit', 'ExclusiveStartKey', 'ProjectionExpression',
                                                        'ExpressionAttributeNames', 'ExpressionAttributeValues', 'ConsistentRead']}, kwargs)
        self._log('scan', kwargs)
        cond = self._condition('scan', kwargs.get('FilterExpression'), kwargs.get('ExpressionAttributeNames'), kwargs.get('ExpressionAttributeValues'))
        items = [copy.deepcopy(x) for x in self._data('scan')['items']]
        matched = [x for x in items if cond is None or cond.test(x)]
        return {'Items': matched, 'Count': len(matched), 'ScannedCount': len(items), 'ResponseMetadata': _meta()}

    def query(self, *args, **kwargs):
        _check_params('dynamodb', 'query', {'required': ['KeyConditionExpression'], 'optional': [
            'FilterExpression', 'Limit', 'ExclusiveStartKey', 'ScanIndexForward', 'IndexName', 'ProjectionExpression',
            'ExpressionAttributeNames', 'ExpressionAttributeValues', 'ConsistentRead']}, kwargs)
        self._log('query', kwargs)
        names, values = kwargs.get('ExpressionAttributeNames'), kwargs.get('ExpressionAttributeValues')
        kc = self._condition('query', kwargs['KeyConditionExpression'], names, values)
        fc = self._condition('query', kwargs.get('FilterExpression'), names, values)
        items = [copy.deepcopy(x) for x in self._data('query')['items'] if kc.test(x) and (fc is None or fc.test(x))]
        return {'Items': items, 'Count': len(items), 'ScannedCount': len(items), 'ResponseMetadata': _meta()}

    def update_item(self, *args, **kwargs):
        raise PracticeAccountError('update_item() isn\'t in the practice account. Use get_item and put_item for these tasks.')

    def batch_writer(self, overwrite_by_pkeys=None):
        return _BatchWriter(self)


class _Resource:
    def __init__(self, service, region):
        if service != 'dynamodb':
            raise PracticeAccountError(
                f"The practice account supports boto3.resource('dynamodb') only. "
                f"Use boto3.client('{service}') for {service}.")
        self._region = region
        self.meta = types.SimpleNamespace(client=_Client('dynamodb', region))

    def Table(self, name):
        return Table(name, self._region)

    def __repr__(self):
        return 'dynamodb.ServiceResource()'


# ----------------------------------------------------------------------------
# boto3 itself
# ----------------------------------------------------------------------------


def _default_region(explicit):
    return explicit or STATE.get('defaultRegion', STATE.get('region', 'us-east-1'))


class Session:
    def __init__(self, aws_access_key_id=None, aws_secret_access_key=None, aws_session_token=None,
                 region_name=None, botocore_session=None, profile_name=None):
        if aws_access_key_id:
            STATE.setdefault('_flags', {})['hardcodedKeys'] = True
        self.region_name = _default_region(region_name)
        self.profile_name = profile_name or 'default'

    def client(self, service_name, region_name=None, api_version=None, use_ssl=True, verify=None, endpoint_url=None,
               aws_access_key_id=None, aws_secret_access_key=None, aws_session_token=None, config=None):
        if aws_access_key_id:
            STATE.setdefault('_flags', {})['hardcodedKeys'] = True
        region = region_name or (config.region_name if getattr(config, 'region_name', None) else None) or self.region_name
        return _Client(service_name, region, config)

    def resource(self, service_name, region_name=None, api_version=None, use_ssl=True, verify=None, endpoint_url=None,
                 aws_access_key_id=None, aws_secret_access_key=None, aws_session_token=None, config=None):
        return _Resource(service_name, region_name or self.region_name)

    def get_available_regions(self, service_name, partition_name='aws', allow_non_regional=False):
        return list(ALL_REGIONS)

    def get_available_services(self):
        return sorted(SERVICES)

    def get_credentials(self):
        return types.SimpleNamespace(access_key='AKIAIOSFODNN7EXAMPLE', secret_key='(hidden)', token=None, method='shared-credentials-file')


class Config:
    def __init__(self, region_name=None, retries=None, connect_timeout=60, read_timeout=60, **kwargs):
        self.region_name = region_name
        self.retries = retries
        self.connect_timeout = connect_timeout
        self.read_timeout = read_timeout


def client(*args, **kwargs):
    return Session().client(*args, **kwargs)


def resource(*args, **kwargs):
    return Session().resource(*args, **kwargs)


def install():
    """Register boto3 and botocore modules backed by this pretend account."""
    def module(name, **attrs):
        m = types.ModuleType(name)
        m.__dict__.update(attrs)
        sys.modules[name] = m
        return m

    exceptions = module('botocore.exceptions', BotoCoreError=BotoCoreError, ClientError=ClientError,
                        ParamValidationError=ParamValidationError, NoCredentialsError=NoCredentialsError,
                        NoRegionError=NoRegionError, EndpointConnectionError=EndpointConnectionError,
                        UnknownServiceError=UnknownServiceError, OperationNotPageableError=OperationNotPageableError)
    config = module('botocore.config', Config=Config)
    response = module('botocore.response', StreamingBody=StreamingBody)
    module('botocore', exceptions=exceptions, config=config, response=response, __version__='1.40.0')
    conditions = module('boto3.dynamodb.conditions', Key=Key, Attr=Attr, ConditionBase=ConditionBase)
    dynamodb = module('boto3.dynamodb', conditions=conditions)
    session = module('boto3.session', Session=Session)
    boto3 = module('boto3', client=client, resource=resource, Session=Session, session=session, dynamodb=dynamodb,
                   __version__='1.40.0')
    boto3.__path__ = []  # a package, so "import boto3.dynamodb.conditions" works
    dynamodb.__path__ = []
    sys.modules['botocore'].__path__ = []


# ----------------------------------------------------------------------------
# Scenario in, snapshot out
# ----------------------------------------------------------------------------


def reset(scenario):
    scenario = copy.deepcopy(scenario or {})
    STATE.clear()
    CALLS.clear()
    STATE['account'] = scenario.get('account', '111122223333')
    STATE['user'] = scenario.get('user', 'learner')
    STATE['region'] = scenario.get('region', 'us-east-1')
    STATE['regions'] = scenario.get('regions', ['us-east-1', 'us-east-2', 'us-west-2', 'eu-west-1'])
    STATE['publicSnapshots'] = scenario.get('publicSnapshots', 0)
    STATE['ec2'] = {r: {'instances': d.get('instances', []), 'volumes': d.get('volumes', []),
                        'snapshots': d.get('snapshots', []), 'addresses': d.get('addresses', [])}
                    for r, d in scenario.get('ec2', {}).items()}
    STATE['s3'] = {}
    for bucket, objects in scenario.get('s3', {}).items():
        STATE['s3'][bucket] = {}
        for k, v in objects.items():
            if isinstance(v, str):
                v = {'body': v}
            STATE['s3'][bucket][k] = _obj(v.get('body', '').encode('utf-8'), v.get('contentType', 'text/plain'),
                                          v.get('metadata'), _time(v['modified']) if v.get('modified') else None)
    STATE['sns'] = {}
    for name in scenario.get('sns', []):
        STATE['sns'][f"arn:aws:sns:{STATE['region']}:{STATE['account']}:{name}"] = {'subscriptions': [], 'messages': []}
    STATE['dynamodb'] = {}
    for name, t in scenario.get('dynamodb', {}).items():
        STATE['dynamodb'][name] = {'key': t['key'], 'types': t.get('types', {}),
                                   'items': [{k: _store(v, k) for k, v in item.items()} for item in t.get('items', [])]}


def snapshot():
    def plain(v):
        if isinstance(v, decimal.Decimal):
            return int(v) if v == v.to_integral_value() else float(v)
        if isinstance(v, dict):
            return {k: plain(x) for k, x in v.items()}
        if isinstance(v, (list, tuple)):
            return [plain(x) for x in v]
        if isinstance(v, (set, frozenset)):
            return sorted(plain(x) for x in v)
        if isinstance(v, bytes):
            return v.decode('utf-8', 'replace')
        if isinstance(v, _dt.datetime):
            return v.isoformat()
        return v

    s3 = {}
    for bucket, objects in STATE.get('s3', {}).items():
        s3[bucket] = {}
        for k, o in objects.items():
            entry = {'size': len(o['data']), 'contentType': o['type'], 'metadata': dict(o['meta'])}
            if len(o['data']) <= 20000:
                entry['text'] = o['data'].decode('utf-8', 'replace')
            s3[bucket][k] = entry
    return {
        'account': STATE.get('account'),
        'ec2': {r: {kind: [{'id': x['id'], 'tags': dict(x.get('tags', {}))} for x in d[kind]]
                    for kind in ('instances', 'volumes', 'snapshots', 'addresses')}
                for r, d in STATE.get('ec2', {}).items()},
        's3': s3,
        'sns': {arn: {'messages': list(t['messages']), 'subscriptions': list(t['subscriptions'])} for arn, t in STATE.get('sns', {}).items()},
        'dynamodb': {name: plain(t['items']) for name, t in STATE.get('dynamodb', {}).items()},
        'calls': plain(CALLS[-400:]),
        'callCount': len(CALLS),
        'flags': dict(STATE.get('_flags', {})),
    }

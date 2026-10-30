// Turns the learner's files into ES modules the browser (or Node, in the
// tests) can import: each file becomes a data: URL, its imports are pointed at
// the other files' URLs or at the pretend AWS SDK and CDK.
import sdkSource from './sdkCore.js?raw';
import cdkSource from './cdkCore.js?raw';

// Quotes encoded too, so a URL can sit inside an import's '...' or "..."
export const dataUrl = (source) => `data:text/javascript;charset=utf-8,${encodeURIComponent(source).replace(/'/g, '%27')}`;

const SDK = dataUrl(sdkSource);
const CDK = dataUrl(cdkSource);

const reexport = (from, names) => dataUrl(`export { ${names.join(', ')} } from ${JSON.stringify(from)};`);

const ERRORS = ['ServiceException'];
const CDK_NAMESPACES = {
  aws_s3: ['Bucket', 'BlockPublicAccess', 'BucketEncryption'],
  aws_dynamodb: ['Table', 'AttributeType', 'BillingMode'],
  aws_lambda: ['Function', 'Runtime', 'Code'],
  aws_lambda_nodejs: ['NodejsFunction'],
  aws_apigatewayv2: ['HttpApi', 'HttpMethod', 'CorsHttpMethod'],
  aws_apigatewayv2_integrations: ['HttpLambdaIntegration'],
  aws_apigatewayv2_authorizers: ['HttpUserPoolAuthorizer'],
  aws_cognito: ['UserPool', 'UserPoolClient'],
  aws_iam: ['PolicyStatement', 'Effect', 'Role', 'ServicePrincipal', 'ManagedPolicy'],
  aws_cloudfront: ['Distribution', 'ViewerProtocolPolicy'],
  aws_cloudfront_origins: ['S3BucketOrigin'],
  aws_s3_deployment: ['BucketDeployment', 'Source'],
};
const subpath = (ns) => `aws-cdk-lib/${ns.replace(/_/g, '-')}`; // aws_s3 -> aws-cdk-lib/aws-s3
const cdkSubpaths = Object.fromEntries(Object.entries(CDK_NAMESPACES).map(([ns, names]) => [subpath(ns), reexport(CDK, names)]));
const cdkRoot = dataUrl([
  `export { App, Stack, Stage, Duration, RemovalPolicy, CfnOutput, Tags } from ${JSON.stringify(CDK)};`,
  ...Object.keys(CDK_NAMESPACES).map((ns) => `export * as ${ns} from ${JSON.stringify(cdkSubpaths[subpath(ns)])};`),
].join('\n'));

// Stable across runs (same URL = same module), so their values must not be
// per-run: process is one object whose env the runner refills each run.
const processShim = dataUrl('const p = globalThis.__practiceProcess; export default p; export const env = p.env; export const argv = p.argv; export const exit = (...a) => p.exit(...a); export const cwd = () => p.cwd();');
const cryptoShim = dataUrl('export const randomUUID = () => globalThis.crypto.randomUUID(); export const getRandomValues = (a) => globalThis.crypto.getRandomValues(a); export default { randomUUID, getRandomValues };');

export const PACKAGES = {
  '@aws-sdk/client-dynamodb': reexport(SDK, ['DynamoDBClient', 'PutItemCommand', 'GetItemCommand', 'DeleteItemCommand', 'LowQueryCommand as QueryCommand',
    'LowScanCommand as ScanCommand', 'DescribeTableCommand', 'ListTablesCommand', 'ConditionalCheckFailedException', 'ResourceNotFoundException',
    'ServiceException as DynamoDBServiceException', ...ERRORS]),
  '@aws-sdk/lib-dynamodb': reexport(SDK, ['DynamoDBDocumentClient', 'PutCommand', 'GetCommand', 'QueryCommand', 'ScanCommand', 'UpdateCommand', 'DeleteCommand']),
  '@aws-sdk/util-dynamodb': reexport(SDK, ['marshall', 'unmarshall']),
  '@aws-sdk/client-sesv2': reexport(SDK, ['SESv2Client', 'SendEmailCommand', 'MessageRejected', 'ServiceException as SESv2ServiceException', ...ERRORS]),
  '@aws-sdk/client-s3': reexport(SDK, ['S3Client', 'ListBucketsCommand', 'ListObjectsV2Command', 'GetObjectCommand', 'HeadObjectCommand', 'PutObjectCommand',
    'DeleteObjectCommand', 'CopyObjectCommand', 'paginateListObjectsV2', 'NoSuchKey', 'NoSuchBucket', 'NotFound', 'ServiceException as S3ServiceException', ...ERRORS]),
  '@aws-sdk/client-sts': reexport(SDK, ['STSClient', 'GetCallerIdentityCommand', 'ServiceException as STSServiceException', ...ERRORS]),
  '@aws-sdk/client-cloudfront': reexport(SDK, ['CloudFrontClient', 'CreateInvalidationCommand', 'GetInvalidationCommand', 'ListDistributionsCommand',
    'NoSuchDistribution', 'ServiceException as CloudFrontServiceException', ...ERRORS]),
  '@aws-sdk/client-ec2': reexport(SDK, ['EC2Client', 'DescribeInstancesCommand', 'paginateDescribeInstances', 'ServiceException as EC2ServiceException', ...ERRORS]),
  'aws-cdk-lib': cdkRoot,
  ...cdkSubpaths,
  constructs: reexport(CDK, ['Construct']),
  'node:process': processShim,
  process: processShim,
  'node:crypto': cryptoShim,
  crypto: cryptoShim,
};

export const SDK_URL = SDK;
export const CDK_URL = CDK;

const NODE_BUILTINS = ['fs', 'path', 'os', 'http', 'https', 'child_process', 'util', 'events', 'stream', 'url', 'readline', 'zlib', 'buffer'];

export class ModuleError extends Error {
  constructor(message, code = 'ERR_MODULE_NOT_FOUND') {
    super(message);
    this.name = 'Error';
    this.code = code;
  }
}

const dirOf = (path) => (path.includes('/') ? path.slice(0, path.lastIndexOf('/') + 1) : '');
const normalize = (path) => {
  const out = [];
  for (const part of path.split('/')) {
    if (part === '..') out.pop();
    else if (part && part !== '.') out.push(part);
  }
  return out.join('/');
};

// Which learner file does './cards.js' mean? TypeScript code imports
// './cards.js' for the file cards.ts, like the real compiler expects.
export const resolveFile = (files, from, spec) => {
  const base = normalize(dirOf(from) + spec);
  const stem = base.replace(/\.(m?js|ts)$/, '');
  for (const candidate of [base, `${stem}.ts`, `${stem}.js`, `${stem}.mjs`, `${base}/index.ts`, `${base}/index.js`, `${base}/index.mjs`]) {
    if (candidate in files) return candidate;
  }
  return null;
};

const IMPORT_RE = /(\bimport\s*(?:[\w*{}\s,$]+?\s*from\s*)?|\bexport\s*(?:\*(?:\s*as\s+[\w$]+)?|\{[^}]*\})\s*from\s*)(['"])([^'"\n]+)\2/g;

// The values a module gets from the practice runner. Kept on the first line
// so line numbers in errors still match the editor.
const prelude = (source) => {
  const names = ['console', 'fetch', 'setTimeout', 'clearTimeout'];
  if (!/\bimport\b[^;]*\bprocess\b[^;]*from\s*['"](node:)?process['"]/.test(source)) names.push('process');
  return `const { ${names.join(', ')} } = globalThis.__practice;`;
};

let runCounter = 0;

/**
 * files: { path: compiled JavaScript }. Returns { url(path) } with a data:
 * URL per learner file, or throws a ModuleError for an import it can't find.
 */
export const linkModules = (files) => {
  runCounter += 1;
  const urls = {};
  const visiting = new Set();
  const link = (path) => {
    if (urls[path]) return urls[path];
    if (visiting.has(path)) throw new ModuleError(`Circular import: ${[...visiting, path].join(' -> ')}. Move the shared code into a third file.`, 'ERR_CIRCULAR');
    visiting.add(path);
    const source = files[path];
    const rewritten = source.replace(IMPORT_RE, (whole, head, q, spec) => {
      let target;
      if (spec.startsWith('.') || spec.startsWith('/')) {
        const found = resolveFile(files, path, spec);
        if (!found) throw new ModuleError(`Cannot find module './${normalize(dirOf(path) + spec)}' imported from ${path}`);
        target = link(found);
      } else if (PACKAGES[spec]) {
        target = PACKAGES[spec];
      } else {
        const bare = spec.replace(/^node:/, '');
        if (NODE_BUILTINS.includes(bare)) {
          throw new ModuleError(`The practice runner doesn't include the Node.js module '${spec}'. These tutorials run like a Lambda function: use the AWS SDK and fetch() instead.`);
        }
        throw new ModuleError(`Cannot find package '${spec}' imported from ${path}. The practice runner has the AWS SDK for JavaScript v3 packages the tutorials use, plus aws-cdk-lib and constructs.`);
      }
      return `${head}${q}${target}${q}`;
    });
    visiting.delete(path);
    // sourceURL names the file in stack traces; the run number makes each run a fresh module
    urls[path] = dataUrl(`${prelude(source)}${rewritten}\n//# sourceURL=${path}\n// run ${runCounter}`);
    return urls[path];
  };
  return { url: (path) => link(path) };
};

/** Rewrites console-cell imports into awaits on the same modules. */
export const cellImports = (source, files, from = '<console>') => source.replace(
  /^\s*import\s+([\w$*{}\s,]+?)\s+from\s+(['"])([^'"]+)\2\s*;?\s*$/gm,
  (whole, what, q, spec) => {
    let url;
    if (spec.startsWith('.')) {
      const found = resolveFile(files, from, spec);
      if (!found) throw new ModuleError(`Cannot find module '${spec}'`);
      url = linkModules(files).url(found);
    } else if (PACKAGES[spec]) url = PACKAGES[spec];
    else throw new ModuleError(`Cannot find package '${spec}'`);
    const mod = `(await __import(${JSON.stringify(url)}))`; // the runner passes its importer in
    what = what.trim();
    if (what.startsWith('* as ')) return `${what.slice(5).trim()} = ${mod};`;
    if (what.startsWith('{')) {
      return what.slice(1, -1).split(',').map((p) => p.trim()).filter(Boolean).map((p) => {
        const [name, alias] = p.split(/\s+as\s+/);
        return `${(alias || name).trim()} = ${mod}.${name.trim()};`;
      }).join(' ');
    }
    return `${what} = ${mod}.default;`;
  },
);

// Study guide: Security (26%)
export const securityGuide = {
  id: 'security',
  name: 'Security',
  icon: '🔐',
  color: '#f85149',
  weight: '26%',
  description: 'Authentication and authorization, encryption, and sensitive data management in application code.',
  sections: [
    {
      id: 'secs1',
      title: 'Authentication with Amazon Cognito',
      content: [
        { type: 'paragraph', text: 'Most DVA-C02 authentication questions come down to one decision: does the app need to know who the user is, or does it need AWS credentials so the user can call AWS services directly? Amazon Cognito answers both with two separate components that are often used together.' },
        { type: 'comparison', title: 'User pools vs identity pools', items: [
          { label: 'User pool', description: 'A user directory and OIDC identity provider. Handles sign-up, sign-in, MFA, password policies, account recovery, social sign-in (Google, Apple, Facebook, Amazon) and SAML or OIDC federation. Returns JWTs: ID, access and refresh tokens.' },
          { label: 'Identity pool', description: 'A credentials broker. Exchanges a token from a user pool, a social provider, a SAML provider, or a guest (unauthenticated) identity for temporary AWS credentials through STS, scoped by an IAM role.' },
          { label: 'Together', description: 'The common pattern: users sign in to the user pool, the app passes the token to the identity pool, and the SDK uses the returned credentials to call S3 or DynamoDB directly with least-privilege roles.' }
        ]},
        { type: 'table', headers: ['Token', 'Contains', 'Used for'], rows: [
          ['ID token', 'Identity claims: sub, email, name, cognito:groups, custom attributes', 'Telling the app who the user is; a Cognito authorizer accepts it when the method has no OAuth scopes'],
          ['Access token', 'Authorization claims: scope, cognito:groups, client_id', 'Calling APIs; required when an API Gateway method has OAuth scopes'],
          ['Refresh token', 'An opaque long-lived token', 'Getting new ID and access tokens without signing in again; never sent to your API']
        ]},
        { type: 'keyTerm', term: 'Managed login (hosted UI)', definition: 'Cognito-hosted, customizable sign-up and sign-in pages that implement the OAuth 2.0 flows (authorization code with PKCE for apps) and federated sign-in. Choose it when the requirement is "least code" for a sign-in page or social login.' },
        { type: 'keyTerm', term: 'Cognito Lambda triggers', definition: 'Functions that run at points in the user lifecycle: pre sign-up (validate or auto-confirm), post confirmation (write a profile record), pre token generation (add or change claims), custom message, and migrate user (move users from a legacy store on first sign-in).' },
        { type: 'keyTerm', term: 'Role-based access with groups', definition: 'Assign an IAM role and precedence to each user pool group. With the identity pool set to choose the role from the token, members of the admins group receive admin credentials and everyone else receives the default authenticated role.' },
        { type: 'bulletList', title: 'Verifying a JWT in your own code', items: [
          'Download the user pool JSON Web Key Set (JWKS) and verify the token signature with the matching key ID.',
          'Check exp (not expired), iss (your user pool URL) and token_use (id or access).',
          'Check aud on ID tokens or client_id on access tokens against your app client.',
          'Use a maintained library such as aws-jwt-verify instead of hand-written parsing; never trust a token you only base64-decoded.'
        ]},
        { type: 'examTip', text: 'Keywords map cleanly: "sign up and sign in", "social login", "hosted sign-in page" point to a user pool. "Temporary AWS credentials", "guest access", "upload directly to S3 from the mobile app" point to an identity pool. If both appear, the answer is usually both.' }
      ]
    },
    {
      id: 'secs2',
      title: 'Authorizing API Calls with API Gateway',
      content: [
        { type: 'paragraph', text: 'API Gateway decides whether a request reaches your backend before any integration runs. The exam tests which authorizer fits the caller and the information available in the request.' },
        { type: 'table', headers: ['Mechanism', 'How it works', 'Choose it when'], rows: [
          ['Cognito user pool authorizer (REST)', 'Validates user pool JWTs; optional OAuth scopes per method', 'Users sign in with a Cognito user pool and you want no authorizer code'],
          ['JWT authorizer (HTTP API)', 'Validates JWTs from any OIDC issuer, including Cognito, with audience and scope checks', 'HTTP APIs that need token validation without a Lambda function'],
          ['Lambda authorizer: TOKEN', 'Your function receives one token from a header and returns an IAM policy', 'Custom or third-party bearer tokens, such as a JWT from another IdP'],
          ['Lambda authorizer: REQUEST', 'Your function receives headers, query strings, stage variables and context', 'The decision depends on several request values, such as tenant header plus source IP'],
          ['IAM (SigV4)', 'Callers sign requests with AWS credentials and need execute-api:Invoke', 'Service-to-service calls, other AWS accounts, apps holding Cognito identity pool credentials'],
          ['Resource policy', 'A policy on the API allowing or denying accounts, IP ranges or VPC endpoints', 'Cross-account access with IAM auth, private APIs, IP allow lists']
        ]},
        { type: 'keyTerm', term: 'Authorizer caching', definition: 'API Gateway can cache a Lambda authorizer result for a TTL, keyed on the token or on the identity sources you choose, so the function is not invoked on every request. A cached policy is reused for other methods, so the returned policy must cover all resources the caller may hit.' },
        { type: 'keyTerm', term: 'Context from a Lambda authorizer', definition: 'Besides the principalId and policy, a Lambda authorizer can return a context map (for example tenantId) that API Gateway passes to the integration, so the backend does not re-parse the token.' },
        { type: 'comparison', title: 'Authentication and access controls that are not the same thing', items: [
          { label: 'API keys and usage plans', description: 'Identify a client for throttling and quotas. They are not a secure authorization mechanism on their own.' },
          { label: 'Mutual TLS', description: 'A custom domain can require client certificates from a trust store, authenticating the calling system at the TLS layer.' },
          { label: 'AWS WAF', description: 'Filters requests by IP, rate, geography or attack patterns. Protection, not user authorization.' }
        ]},
        { type: 'examTip', text: 'If a method has OAuth scopes and requests with an ID token fail, the fix is to send the access token. If the question says "another AWS account" or "the caller already has an IAM role", choose IAM authorization, with a resource policy for the cross-account case.' }
      ]
    },
    {
      id: 'secs3',
      title: 'IAM for Application Code: Roles, STS and Policies',
      content: [
        { type: 'paragraph', text: 'Application code should never hold long-term access keys. Every compute service can hand your code temporary role credentials that the SDK finds automatically and refreshes before they expire.' },
        { type: 'table', headers: ['Compute', 'Where the code gets credentials', 'Common trap'], rows: [
          ['EC2', 'Instance profile role through the instance metadata service (use IMDSv2)', 'Keys in config files or environment variables override the role'],
          ['Lambda', 'Execution role', 'The execution role controls what the function can call, not who can invoke it'],
          ['ECS / Fargate', 'Task role', 'The task execution role is only for pulling images, logs and injecting secrets'],
          ['EKS', 'IAM roles for service accounts or EKS Pod Identity', 'Relying on the node role gives every pod the same permissions'],
          ['CI/CD outside AWS', 'OIDC federation with AssumeRoleWithWebIdentity', 'Storing an IAM user key as a pipeline secret']
        ]},
        { type: 'comparison', title: 'Identity-based vs resource-based policies', items: [
          { label: 'Identity-based', description: 'Attached to a user, group or role. Says what that principal can do. Cannot by itself grant access to a resource in another account.' },
          { label: 'Resource-based', description: 'Attached to the resource: S3 bucket policy, Lambda function policy, SQS queue policy, SNS topic policy, KMS key policy, Secrets Manager secret policy, API Gateway resource policy. Names the principal, so it enables cross-account and service access without assuming a role.' },
          { label: 'Role trust policy', description: 'A special resource policy on a role that says who may call sts:AssumeRole on it. Cross-account access needs the trust policy plus a permission in the caller account to assume the role.' }
        ]},
        { type: 'numberedList', title: 'Policy evaluation order', items: [
          'Every request starts as an implicit deny.',
          'If any applicable policy has a matching explicit Deny, the request is denied. Nothing overrides this.',
          'Organizations SCPs, permissions boundaries and session policies must allow the action; they only limit and never grant.',
          'An identity-based or resource-based policy must allow the action. In the same account either is usually enough; across accounts both sides must allow.',
          'If no Allow remains, the implicit deny applies.'
        ]},
        { type: 'bulletList', title: 'Patterns the exam expects you to recognize', items: [
          'Cross-account: a role in the target account with a trust policy for the source principal; the code calls sts:AssumeRole and uses the returned credentials.',
          'Third parties: require sts:ExternalId in the trust policy to prevent the confused deputy problem.',
          'Service to service: S3 or SNS invoking Lambda, or SNS writing to SQS, uses the target resource policy with aws:SourceArn or aws:SourceAccount conditions.',
          'Per-user data in DynamoDB: dynamodb:LeadingKeys with the ${cognito-identity.amazonaws.com:sub} policy variable.',
          'Least privilege: start narrow, use IAM Access Analyzer to generate a policy from CloudTrail activity, and test with the IAM policy simulator.'
        ]},
        { type: 'keyTerm', term: 'Default credential provider chain', definition: 'The order in which the SDK looks for credentials and stops at the first match: explicit credentials in code, environment variables, shared config and credentials files (including SSO and web identity profiles), container credentials, and finally the EC2 instance profile. The exact list varies slightly by SDK, but environment variables always beat the instance role.' },
        { type: 'examTip', text: 'When a question says "remove the access keys" the answer is almost always a role: an instance profile, an execution role, a task role or OIDC federation. Moving keys into Secrets Manager or environment variables is a distractor, because they remain long-term credentials.' }
      ]
    },
    {
      id: 'secs4',
      title: 'AWS KMS and Envelope Encryption',
      content: [
        { type: 'paragraph', text: 'AWS KMS creates and protects keys in hardware security modules; key material for KMS-generated keys never leaves KMS unencrypted. Developers need to know which API to call for which data size, who controls access to a key, and how to stay inside request quotas.' },
        { type: 'table', headers: ['API', 'What it does', 'Use it for'], rows: [
          ['Encrypt / Decrypt', 'Encrypts or decrypts up to 4 KB directly in KMS', 'Small secrets such as a password or API token'],
          ['GenerateDataKey', 'Returns a plaintext data key and the same key encrypted under the KMS key', 'Envelope encryption of files and records of any size'],
          ['GenerateDataKeyWithoutPlaintext', 'Returns only the encrypted data key', 'A component that stores the key now while another decrypts later'],
          ['ReEncrypt', 'Decrypts and re-encrypts ciphertext under a different key inside KMS', 'Moving ciphertext to a new key without exposing plaintext']
        ]},
        { type: 'numberedList', title: 'Envelope encryption step by step', items: [
          'Call GenerateDataKey with the KMS key ID (and an encryption context).',
          'Encrypt the data locally with the plaintext data key, for example AES-GCM.',
          'Discard the plaintext data key from memory.',
          'Store the encrypted data key alongside the ciphertext.',
          'To decrypt, call KMS Decrypt on the encrypted data key, then decrypt the data locally.'
        ]},
        { type: 'comparison', title: 'Types of KMS keys', items: [
          { label: 'Customer managed key', description: 'You create it and control the key policy, grants, rotation, enable and disable, and deletion (7 to 30 day waiting period). Use is logged in CloudTrail. Required for cross-account use.' },
          { label: 'AWS managed key', description: 'Created by a service in your account (aws/s3, aws/lambda, aws/secretsmanager). Visible and logged, rotated automatically, but you cannot edit its key policy or use it cross-account.' },
          { label: 'AWS owned key', description: 'Owned and used by a service across many accounts. Free and invisible to you; no audit trail or control. The DynamoDB default.' }
        ]},
        { type: 'keyTerm', term: 'Key policy', definition: 'Every KMS key has exactly one key policy and it is the primary access control. IAM policies grant KMS permissions only if the key policy allows the account to delegate through IAM, which the default key policy does.' },
        { type: 'keyTerm', term: 'Grants', definition: 'Programmatic, fine-grained delegation of specific operations on one key to a principal, without editing the key policy. Services such as EBS use them; you retire or revoke a grant when it is no longer needed. A grant token lets you use a new grant before it propagates.' },
        { type: 'keyTerm', term: 'Encryption context', definition: 'Non-secret key-value pairs bound to ciphertext as additional authenticated data. Decrypt fails if the context does not match, the context is recorded in CloudTrail, and policies can require it with kms:EncryptionContext conditions.' },
        { type: 'keyTerm', term: 'Automatic key rotation', definition: 'For symmetric customer managed keys, KMS generates new key material on a schedule (yearly by default, with a configurable period) and also supports on-demand rotation. The key ID and ARN stay the same and old material is kept, so existing ciphertext still decrypts with no code change.' },
        { type: 'bulletList', title: 'Staying within KMS request quotas', items: [
          'Cryptographic operation quotas are per account and per Region, shared across keys; more keys do not add capacity.',
          'ThrottlingException means retry with exponential backoff, then reduce calls.',
          'Use the AWS Encryption SDK data key caching to reuse data keys for a bounded number of messages or time.',
          'Enable S3 Bucket Keys for SSE-KMS buckets with heavy traffic.',
          'Request a quota increase only after reducing unnecessary calls.'
        ]},
        { type: 'examTip', text: 'A 4 KB limit in the question means envelope encryption with GenerateDataKey. A ThrottlingException from KMS means caching data keys or Bucket Keys. AccessDenied from KMS in a cross-account scenario means the key policy is missing the other account, or the key is an AWS managed key.' }
      ]
    },
    {
      id: 'secs5',
      title: 'Encryption at Rest and in Transit for S3, DynamoDB and APIs',
      content: [
        { type: 'paragraph', text: 'Server-side encryption means the service receives plaintext over TLS and encrypts it before storing it. Client-side encryption means your code encrypts before sending, so the service only ever stores ciphertext. Questions usually hinge on who must control or hold the key.' },
        { type: 'table', headers: ['S3 option', 'Key managed by', 'Key points'], rows: [
          ['SSE-S3', 'Amazon S3', 'Default for all new objects; no KMS cost or KMS audit trail'],
          ['SSE-KMS', 'AWS KMS (AWS managed or customer managed key)', 'Key policy control and CloudTrail logging; enable Bucket Keys to reduce KMS requests'],
          ['DSSE-KMS', 'AWS KMS', 'Two independent layers of server-side encryption for multilayer compliance requirements'],
          ['SSE-C', 'You, outside AWS', 'The key is sent on every request over HTTPS; S3 keeps only a salted HMAC to validate it'],
          ['Client-side', 'You or KMS through your code', 'Use the Amazon S3 Encryption Client; S3 never receives plaintext']
        ]},
        { type: 'bulletList', title: 'Bucket policies that enforce encryption', items: [
          'Deny any request where aws:SecureTransport is false to force HTTPS.',
          'Deny s3:PutObject when s3:x-amz-server-side-encryption is not aws:kms to require SSE-KMS on every upload.',
          'Deny uploads that name a different key using s3:x-amz-server-side-encryption-aws-kms-key-id.',
          'Default bucket encryption covers uploads that send no encryption header; policies are for enforcing a specific choice.'
        ]},
        { type: 'comparison', title: 'DynamoDB encryption at rest choices', items: [
          { label: 'AWS owned key (default)', description: 'No charge and no setup, but no visibility in your account or CloudTrail.' },
          { label: 'AWS managed key (aws/dynamodb)', description: 'Visible in your account and logged in CloudTrail, but the key policy cannot be changed.' },
          { label: 'Customer managed key', description: 'Full control of the key policy, ability to disable the key, and audit of each use. Choose it when the team must control the key.' }
        ]},
        { type: 'awsService', name: 'AWS Certificate Manager (ACM)', description: 'Provisions and automatically renews public TLS certificates for integrated services such as CloudFront, API Gateway custom domains and load balancers. Certificates are Regional: CloudFront and edge-optimized API endpoints need the certificate in us-east-1; Regional endpoints and load balancers need it in their own Region.' },
        { type: 'keyTerm', term: 'Encryption in transit', definition: 'AWS service endpoints use TLS. You enforce it with aws:SecureTransport conditions, HTTPS-only CloudFront viewer protocol policies, TLS listeners on load balancers, and TLS connections to databases such as RDS.' },
        { type: 'examTip', text: 'DynamoDB always encrypts data at rest, so "turn on encryption" is never the answer; the choice is which key. For S3, "S3 must never see plaintext" means client-side encryption, while "keys must never be stored in AWS" with S3 doing the work means SSE-C.' }
      ]
    },
    {
      id: 'secs6',
      title: 'Managing Secrets and Sensitive Data in Code',
      content: [
        { type: 'paragraph', text: 'Credentials, connection strings and API keys never belong in source code, container images or plaintext configuration. Store them in a managed service, grant the code role read access, retrieve them at runtime, and cache them to control latency and cost.' },
        { type: 'table', headers: ['Feature', 'AWS Secrets Manager', 'SSM Parameter Store'], rows: [
          ['Primary purpose', 'Secrets such as database credentials and API keys', 'Configuration values and simple secrets'],
          ['Encryption', 'Always encrypted with a KMS key', 'SecureString parameters encrypted with a KMS key; String and StringList are not'],
          ['Rotation', 'Built in, using a rotation Lambda function or managed rotation', 'None built in'],
          ['Cross-account access', 'Resource policy on the secret plus a customer managed key', 'Limited; Secrets Manager is the usual cross-account choice'],
          ['Size', 'Up to 64 KB per secret', 'Standard 4 KB, advanced 8 KB'],
          ['Cost', 'Charged per secret per month plus API calls', 'Standard tier free; advanced tier charged'],
          ['Other', 'Multi-Region replication, random password generation', 'Hierarchies, versions, parameter policies on the advanced tier']
        ]},
        { type: 'numberedList', title: 'How a rotation Lambda function rotates a secret', items: [
          'createSecret: generate a new value and store it as the AWSPENDING version.',
          'setSecret: change the credential in the database or service.',
          'testSecret: confirm the new credential works.',
          'finishSecret: move the AWSCURRENT label to the new version.'
        ]},
        { type: 'bulletList', title: 'Retrieving secrets efficiently', items: [
          'Fetch secrets outside the Lambda handler or through a caching client so warm invocations reuse them.',
          'The AWS Parameters and Secrets Lambda Extension caches secrets and parameters behind a localhost endpoint in the execution environment.',
          'Call GetParameter with WithDecryption set to true for SecureString values, and grant kms:Decrypt on the key.',
          'Parameter Store can return a Secrets Manager secret through the /aws/reference/secretsmanager/ path.',
          'ECS task definitions and CodeBuild can inject secrets as environment variables at start-up through the execution or service role.'
        ]},
        { type: 'keyTerm', term: 'Lambda environment variables', definition: 'Always encrypted at rest, by default with the AWS managed key for Lambda. Specify a customer managed key to control the key policy and audit use, and use the console encryption helpers to encrypt values client-side if they must not be readable in the console. They are not a secrets manager and have no rotation.' },
        { type: 'awsService', name: 'AWS AppConfig', description: 'Deploys non-secret application configuration and feature flags without redeploying code, with JSON Schema or Lambda validators, gradual deployment strategies and automatic rollback on CloudWatch alarms.' },
        { type: 'bulletList', title: 'Protecting sensitive data in logs and data stores', items: [
          'Never log full request payloads, tokens or credentials; log identifiers instead.',
          'CloudWatch Logs data protection policies detect and mask sensitive data such as card numbers; only principals with logs:Unmask see it.',
          'Amazon Macie discovers and classifies sensitive data in S3 buckets.',
          'Classify data first, then match controls: encryption with customer managed keys, masking or tokenization, and least-privilege access.'
        ]},
        { type: 'examTip', text: '"Rotate automatically" means Secrets Manager. "Cheapest way to store an encrypted value" means a Parameter Store standard SecureString. "Feature flags with gradual rollout" means AppConfig. A SecureString that comes back unreadable means WithDecryption was not set or kms:Decrypt is missing.' }
      ]
    }
  ]
};

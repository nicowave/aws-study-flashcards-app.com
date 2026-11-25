// Module 2: Application Security
// Sources: official AWS documentation, linked on each card
// AWS Certified Developer – Associate (DVA-C02)

export const module2 = {
  id: 'module2',
  name: 'Application Security',
  description: 'Cognito, IAM in code, KMS, Secrets Manager and Parameter Store',
  icon: '🔐',
  color: '#f85149',
  gradient: 'linear-gradient(135deg, #f85149 0%, #f85149 100%)',
  source: 'Official AWS documentation (linked on each card)',
  cards: [
    {
      id: 'dva-sec-c1',
      front: 'Cognito user pool vs identity pool: which does what?',
      back: '• User pool: a user directory. Sign-up, sign-in, MFA, social and SAML/OIDC federation, managed login (hosted UI). Returns JWTs (ID, access, refresh).\n• Identity pool: exchanges a token (user pool, Google, SAML, or guest) for temporary AWS credentials via STS, scoped by an IAM role.\nRule: "sign users in" = user pool. "Call AWS services such as S3 or DynamoDB directly from the app" = identity pool, usually after a user pool.',
      hint: 'Who are you vs AWS credentials',
      tags: ['cognito', 'authentication'],
      difficulty: 'beginner',
      sources: [
        { title: 'What is Amazon Cognito? – Amazon Cognito Developer Guide', url: 'https://docs.aws.amazon.com/cognito/latest/developerguide/what-is-amazon-cognito.html', checked: '2026-11-25' },
        { title: 'Amazon Cognito identity pools – Amazon Cognito Developer Guide', url: 'https://docs.aws.amazon.com/cognito/latest/developerguide/cognito-identity.html', checked: '2026-11-25' }
      ]
    },
    {
      id: 'dva-sec-c2',
      front: 'Cognito ID token vs access token vs refresh token',
      back: '• ID token: who the user is (email, name, cognito:groups). Used by the app, and by a Cognito authorizer when no scopes are set.\n• Access token: what the user may do (scope, groups). Used to call APIs; required when a method has OAuth scopes.\n• Refresh token: long-lived, only used to get new ID and access tokens. Never sent to your API.\nVerify JWTs with the user pool JWKS public keys and check exp, iss and audience or client_id.',
      hint: 'Identity, authorization, renewal',
      tags: ['cognito', 'jwt'],
      difficulty: 'intermediate',
      sources: [
        { title: 'Understanding user pool JSON web tokens (JWTs) – Amazon Cognito Developer Guide', url: 'https://docs.aws.amazon.com/cognito/latest/developerguide/amazon-cognito-user-pools-using-tokens-with-identity-providers.html', checked: '2026-11-25' },
        { title: 'Verifying JSON web tokens – Amazon Cognito Developer Guide', url: 'https://docs.aws.amazon.com/cognito/latest/developerguide/amazon-cognito-user-pools-using-tokens-verifying-a-jwt.html', checked: '2026-11-25' }
      ]
    },
    {
      id: 'dva-sec-c3',
      front: 'API Gateway authorizers: Cognito vs Lambda TOKEN vs Lambda REQUEST vs IAM',
      back: '• Cognito user pool authorizer: validates user pool JWTs, no code.\n• Lambda TOKEN: custom logic on one bearer token header (for example a third-party JWT).\n• Lambda REQUEST: custom logic on headers, query strings, stage variables and context.\n• IAM (SigV4): callers sign with AWS credentials and need execute-api:Invoke; best for service-to-service and cross-account.\nLambda authorizers return an IAM policy and can cache results by TTL.\nAPI keys are for usage plans, not authorization.',
      hint: 'Who validates, and with what input',
      tags: ['api-gateway', 'authorization'],
      difficulty: 'intermediate',
      sources: [
        { title: 'Control and manage access to REST APIs in API Gateway – Amazon API Gateway Developer Guide', url: 'https://docs.aws.amazon.com/apigateway/latest/developerguide/apigateway-control-access-to-api.html', checked: '2026-11-25' },
        { title: 'Use API Gateway Lambda authorizers – Amazon API Gateway Developer Guide', url: 'https://docs.aws.amazon.com/apigateway/latest/developerguide/apigateway-use-lambda-authorizer.html', checked: '2026-11-25' }
      ]
    },
    {
      id: 'dva-sec-c4',
      front: 'ECS task role vs task execution role',
      back: '• Task role: credentials your application code uses (DynamoDB, S3, SQS calls).\n• Task execution role: used by the ECS agent to pull images from ECR, write logs to CloudWatch, and fetch secrets referenced in the task definition.\nTrap: an app getting AccessDenied on DynamoDB needs the permission on the TASK role, not the execution role.',
      hint: 'Your code vs the ECS agent',
      tags: ['ecs', 'iam', 'exam-trap'],
      difficulty: 'intermediate',
      sources: [
        { title: 'Amazon ECS task IAM role – Amazon Elastic Container Service Developer Guide', url: 'https://docs.aws.amazon.com/AmazonECS/latest/developerguide/task-iam-roles.html', checked: '2026-11-25' },
        { title: 'Amazon ECS task execution IAM role – Amazon Elastic Container Service Developer Guide', url: 'https://docs.aws.amazon.com/AmazonECS/latest/developerguide/task_execution_IAM_role.html', checked: '2026-11-25' }
      ]
    },
    {
      id: 'dva-sec-c5',
      front: 'Lambda execution role vs Lambda resource-based policy',
      back: '• Execution role: what the function can do (read S3, write DynamoDB, send logs). Lambda assumes it.\n• Resource-based policy: who can invoke the function (S3, SNS, EventBridge, API Gateway, another account). Added with lambda add-permission, ideally with a source ARN or account condition.\nPush sources use the resource policy; poll-based sources (SQS, Kinesis, DynamoDB Streams) use the execution role.',
      hint: 'Outbound vs inbound',
      tags: ['lambda', 'iam'],
      difficulty: 'intermediate',
      sources: [
        { title: 'Working with resource-based policies in Lambda – AWS Lambda Developer Guide', url: 'https://docs.aws.amazon.com/lambda/latest/dg/access-control-resource-based.html', checked: '2026-11-25' },
        { title: 'Creating and configuring an Amazon SQS event source mapping – AWS Lambda Developer Guide', url: 'https://docs.aws.amazon.com/lambda/latest/dg/services-sqs-configure.html', checked: '2026-11-25' }
      ]
    },
    {
      id: 'dva-sec-c6',
      front: 'IAM policy evaluation in one minute',
      back: '1. Start with implicit deny.\n2. Any matching explicit Deny wins, everywhere (SCP, RCP, boundary, identity, resource, session policy).\n3. Otherwise you need an Allow, and SCPs, RCPs, permissions boundaries and session policies only limit, never grant.\nSame account: an Allow in the identity policy OR the resource policy is usually enough.\nCross account: both sides must allow (identity policy in the caller account AND resource policy or role trust in the owning account).',
      hint: 'Explicit deny always wins',
      tags: ['iam', 'policy-evaluation'],
      difficulty: 'intermediate',
      sources: [
        { title: 'Policy evaluation logic – AWS Identity and Access Management User Guide', url: 'https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_evaluation-logic.html', checked: '2026-11-25' },
        { title: 'Cross-account policy evaluation logic – AWS Identity and Access Management User Guide', url: 'https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_evaluation-logic-cross-account.html', checked: '2026-11-25' }
      ]
    },
    {
      id: 'dva-sec-c7',
      front: 'Which STS API? AssumeRole, AssumeRoleWithWebIdentity, AssumeRoleWithSAML, GetSessionToken',
      back: '• AssumeRole: cross-account or switching roles; add sts:ExternalId in the trust policy for third parties.\n• AssumeRoleWithWebIdentity: OIDC tokens, for example GitHub Actions, EKS IRSA, or web identity federation.\n• AssumeRoleWithSAML: corporate SAML IdP federation.\n• GetSessionToken: temporary credentials for an IAM user, typically to satisfy an MFA condition.\nAll return temporary credentials: access key, secret key and session token.',
      hint: 'Match the identity source',
      tags: ['sts', 'iam', 'federation'],
      difficulty: 'advanced',
      sources: [
        { title: 'Request temporary security credentials – AWS Identity and Access Management User Guide', url: 'https://docs.aws.amazon.com/IAM/latest/UserGuide/id_credentials_temp_request.html', checked: '2026-11-25' },
        { title: 'The confused deputy problem – AWS Identity and Access Management User Guide', url: 'https://docs.aws.amazon.com/IAM/latest/UserGuide/confused-deputy.html', checked: '2026-11-25' }
      ]
    },
    {
      id: 'dva-sec-c8',
      front: 'SDK default credential provider chain: what wins on EC2?',
      back: 'The SDK uses the FIRST source it finds and never merges them. Explicit credentials in code and environment variables (AWS_ACCESS_KEY_ID...) come before the shared config and credentials files, which come before container credentials and finally the EC2 instance profile.\nTrap: stray environment variables or a ~/.aws/credentials file on an instance silently override the instance role. Remove them rather than adding permissions to the role.',
      hint: 'First match, no merging',
      tags: ['sdk', 'credentials', 'exam-trap'],
      difficulty: 'advanced',
      sources: [
        { title: 'AWS SDKs and Tools standardized credential providers – AWS SDKs and Tools Reference Guide', url: 'https://docs.aws.amazon.com/sdkref/latest/guide/standardized-credentials.html', checked: '2026-11-25' },
        { title: 'Default credentials provider chain in the AWS SDK for Java 2.x – AWS SDK for Java 2.x Developer Guide', url: 'https://docs.aws.amazon.com/sdk-for-java/latest/developer-guide/credentials-chain.html', checked: '2026-11-25' }
      ]
    },
    {
      id: 'dva-sec-c9',
      front: 'KMS Encrypt vs GenerateDataKey: when?',
      back: '• Encrypt / Decrypt: data up to 4 KB, such as a password or small token. The data travels to KMS.\n• GenerateDataKey: envelope encryption for anything larger. Returns a plaintext data key (encrypt locally, then discard it) and an encrypted copy (store it with the ciphertext).\n• GenerateDataKeyWithoutPlaintext: get only the encrypted key now, decrypt it later when needed.\nTo decrypt: call KMS Decrypt on the encrypted data key, then decrypt the data locally.',
      hint: '4 KB limit, envelope above it',
      tags: ['kms', 'envelope-encryption'],
      difficulty: 'intermediate',
      sources: [
        { title: 'Generate data keys – AWS Key Management Service Developer Guide', url: 'https://docs.aws.amazon.com/kms/latest/developerguide/data-keys.html', checked: '2026-11-25' },
        { title: 'Encrypt – AWS Key Management Service API Reference', url: 'https://docs.aws.amazon.com/kms/latest/APIReference/API_Encrypt.html', checked: '2026-11-25' }
      ]
    },
    {
      id: 'dva-sec-c10',
      front: 'S3 encryption options: SSE-S3 vs SSE-KMS vs DSSE-KMS vs SSE-C vs client-side',
      back: '• SSE-S3: S3-managed keys, default for new objects, no KMS cost.\n• SSE-KMS: KMS key, key policy control and CloudTrail audit; enable Bucket Keys to cut KMS requests.\n• DSSE-KMS: two independent layers of server-side encryption (a KMS data key, then a separate S3-managed key).\n• SSE-C: you send the key on every request over HTTPS; S3 does not store it. Blocked by default on new buckets since April 2026, so enable it first.\n• Client-side: encrypt before upload (S3 Encryption Client); S3 never sees plaintext.',
      hint: 'Who holds the key, who encrypts',
      tags: ['s3', 'encryption'],
      difficulty: 'intermediate',
      sources: [
        { title: 'Protecting data with server-side encryption – Amazon S3 User Guide', url: 'https://docs.aws.amazon.com/AmazonS3/latest/userguide/serv-side-encryption.html', checked: '2026-11-25' },
        { title: 'Using server-side encryption with customer-provided keys (SSE-C) – Amazon S3 User Guide', url: 'https://docs.aws.amazon.com/AmazonS3/latest/userguide/ServerSideEncryptionCustomerKeys.html', checked: '2026-11-25' }
      ]
    },
    {
      id: 'dva-sec-c11',
      front: 'KMS key policy vs IAM policy vs grant',
      back: '• Key policy: required on every KMS key and the primary control. IAM policies only work if the key policy allows the account (the default key policy does).\n• IAM policy: grants kms:* actions to principals, effective only when the key policy permits it.\n• Grant: programmatic, temporary delegation of specific operations on one key; retire or revoke when done.\nTrap: an IAM Allow for kms:Decrypt fails if the key policy does not trust the account, especially cross-account.',
      hint: 'The key policy comes first',
      tags: ['kms', 'iam', 'exam-trap'],
      difficulty: 'advanced',
      sources: [
        { title: 'Key policies in AWS KMS – AWS Key Management Service Developer Guide', url: 'https://docs.aws.amazon.com/kms/latest/developerguide/key-policies.html', checked: '2026-11-25' },
        { title: 'Grants in AWS KMS – AWS Key Management Service Developer Guide', url: 'https://docs.aws.amazon.com/kms/latest/developerguide/grants.html', checked: '2026-11-25' }
      ]
    },
    {
      id: 'dva-sec-c12',
      front: 'What is KMS encryption context and why use it?',
      back: 'Non-secret key-value pairs (for example tenantId=42) passed on Encrypt or GenerateDataKey and bound to the ciphertext as additional authenticated data.\n• Decrypt fails unless the exact same context is provided.\n• It appears in CloudTrail, so audits show what each request was for.\n• Key policies and grants can require it with kms:EncryptionContext conditions.\nNever put secrets in it, because it is logged in plaintext.',
      hint: 'Authenticated, not secret',
      tags: ['kms', 'encryption-context'],
      difficulty: 'advanced',
      sources: [
        { title: 'Encryption context – AWS Key Management Service Developer Guide', url: 'https://docs.aws.amazon.com/kms/latest/developerguide/encrypt_context.html', checked: '2026-11-25' }
      ]
    },
    {
      id: 'dva-sec-c13',
      front: 'Secrets Manager vs SSM Parameter Store: how to choose?',
      back: '• Secrets Manager: built-in rotation with a Lambda function (managed rotation for RDS and others), cross-account resource policies, multi-Region replication, random password generation. Charged per secret per month.\n• Parameter Store: hierarchical config and SecureString values encrypted with KMS, standard tier free, no built-in rotation.\nRule: "rotate automatically" = Secrets Manager. "Cheapest encrypted config value" = Parameter Store SecureString.',
      hint: 'Rotation vs cost',
      tags: ['secrets-manager', 'parameter-store'],
      difficulty: 'beginner',
      sources: [
        { title: 'Rotate AWS Secrets Manager secrets – AWS Secrets Manager User Guide', url: 'https://docs.aws.amazon.com/secretsmanager/latest/userguide/rotating-secrets.html', checked: '2026-11-25' },
        { title: 'Choosing parameter tiers in Parameter Store – AWS Systems Manager User Guide', url: 'https://docs.aws.amazon.com/systems-manager/latest/userguide/parameter-store-advanced-parameters.html', checked: '2026-11-25' }
      ]
    },
    {
      id: 'dva-sec-c14',
      front: 'Parameter Store standard vs advanced tier',
      back: '• Standard: free storage, values up to 4 KB, up to 10,000 parameters per account and Region, no parameter policies.\n• Advanced: charged per parameter, values up to 8 KB, higher parameter count, supports parameter policies (expiration, notifications).\nBoth tiers support SecureString. Read encrypted values with GetParameter WithDecryption=true and kms:Decrypt on the key. Neither tier rotates values for you.',
      hint: 'Size, count, policies',
      tags: ['parameter-store', 'limits'],
      difficulty: 'intermediate',
      sources: [
        { title: 'Choosing parameter tiers in Parameter Store – AWS Systems Manager User Guide', url: 'https://docs.aws.amazon.com/systems-manager/latest/userguide/parameter-store-advanced-parameters.html', checked: '2026-11-25' },
        { title: 'GetParameter – AWS Systems Manager API Reference', url: 'https://docs.aws.amazon.com/systems-manager/latest/APIReference/API_GetParameter.html', checked: '2026-11-25' }
      ]
    },
    {
      id: 'dva-sec-c15',
      front: 'Which Region must the ACM certificate be in?',
      back: '• CloudFront: us-east-1 (N. Virginia), always.\n• API Gateway edge-optimized custom domain: us-east-1.\n• API Gateway Regional custom domain, ALB, NLB: the same Region as the resource.\nTrap: a certificate requested in your app Region will not appear in the CloudFront console. Request or import a second certificate in us-east-1; ACM certificates are Regional and are not copied between Regions.',
      hint: 'CloudFront means N. Virginia',
      tags: ['acm', 'tls', 'exam-trap'],
      difficulty: 'intermediate',
      sources: [
        { title: 'Requirements for using SSL/TLS certificates with CloudFront – Amazon CloudFront Developer Guide', url: 'https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/cnames-and-https-requirements.html', checked: '2026-11-25' },
        { title: 'Get certificates ready in AWS Certificate Manager – Amazon API Gateway Developer Guide', url: 'https://docs.aws.amazon.com/apigateway/latest/developerguide/how-to-specify-certificate-for-custom-domain-name.html', checked: '2026-11-25' }
      ]
    }
  ]
};

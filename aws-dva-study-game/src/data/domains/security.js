// Domain 2: Security (26% of exam)
// DVA-C02 Exam Content

export const security = {
  id: 'security',
  name: 'Security',
  icon: '🔐',
  weight: '26%',
  color: '#f85149',
  description: 'Authentication and authorization, encryption, and sensitive data management in application code',
  questions: [
    {
      id: 'sec1',
      question: 'A mobile app must let customers sign up and sign in with an email and password, then upload photos directly to an Amazon S3 bucket from the device. The developer must not embed long-term AWS credentials in the app. Which solution meets these requirements?',
      options: [
        'A Cognito user pool only, signing S3 requests with the user pool access token',
        'A Cognito identity pool only, with each customer created as an IAM user',
        'A user pool for sign-in plus an identity pool for temporary AWS credentials',
        'One IAM user per customer, with its access keys kept in the device keychain'
      ],
      correctAnswer: 2,
      explanation: 'The user pool is the user directory that handles sign-up and sign-in and returns JWTs; the identity pool exchanges those tokens for temporary AWS credentials (through STS) scoped by an IAM role, which the SDK uses to call S3 directly. User pool tokens are not AWS credentials and cannot sign S3 requests. Identity pools do not create IAM users, and per-customer IAM users with stored access keys are the long-term credentials the requirement forbids.'
    },
    {
      id: 'sec2',
      question: 'An API Gateway REST API uses an Amazon Cognito user pool authorizer. The developer adds the OAuth scope orders/read to the GET /orders method. The client app keeps sending the ID token in the Authorization header, and every request is now rejected as unauthorized. What should the developer change?',
      options: [
        'Send the access token, because method scopes are checked against the access token',
        'Send the refresh token, because it carries the longest-lived authorization claims',
        'Add the scope to the ID token with a pre sign-up trigger and keep sending it',
        'Switch the method to IAM authorization so the ID token is checked as a SigV4 signature'
      ],
      correctAnswer: 0,
      explanation: 'When a method has OAuth scopes configured, the Cognito authorizer expects an access token and validates its scope claim; without scopes it accepts the ID token. Refresh tokens are only used to obtain new ID and access tokens and are never sent to the API. A pre sign-up trigger runs before registration and cannot add scopes, and IAM authorization requires SigV4-signed requests made with AWS credentials, not JWTs.'
    },
    {
      id: 'sec3',
      question: 'A developer is writing a Lambda authorizer for an API Gateway REST API. The authorization decision depends on a custom tenant header, a query string parameter, and the source IP address of the caller. Which authorizer configuration should the developer use?',
      options: [
        'A TOKEN authorizer that reads the extra values from the bearer token',
        'A Cognito user pool authorizer with a custom attribute for each value',
        'A TOKEN authorizer with an identity validation regular expression',
        'A REQUEST authorizer that receives headers, query strings and context'
      ],
      correctAnswer: 3,
      explanation: 'A REQUEST Lambda authorizer receives the full request identity, including headers, query string parameters, stage variables and the request context such as the source IP, so it can combine all three inputs. A TOKEN authorizer receives only a single token from one header, and a validation regular expression only pre-checks that token format. A Cognito authorizer validates user pool tokens and cannot run custom logic over headers and query strings.'
    },
    {
      id: 'sec4',
      question: 'A backend service running in AWS account B must call a private API Gateway REST API owned by account A. The team does not want to issue or rotate any tokens or API keys; the service should authenticate with the IAM role it already runs under. What should the developer configure?',
      options: [
        'A Cognito user pool authorizer that uses the client credentials grant',
        'IAM authorization with SigV4 signing and a resource policy for account B',
        'An API key in a usage plan, sent by the service in the x-api-key header',
        'A Lambda TOKEN authorizer that checks the account ID claimed by the caller'
      ],
      correctAnswer: 1,
      explanation: 'With IAM (AWS_IAM) authorization the caller signs each request with SigV4 using its role credentials, and for cross-account access the API resource policy must allow account B in addition to the caller having execute-api:Invoke. The client credentials grant still issues tokens that must be managed. API keys identify clients for usage plans and throttling but are not an authorization mechanism, and an account ID sent by the caller can be forged.'
    },
    {
      id: 'sec5',
      question: 'A security review finds that an application running on Amazon EC2 reads an IAM user access key and secret key from a configuration file to call Amazon SQS. The team wants to remove the stored keys with the least operational overhead and no changes to the SDK calls. What should the developer do?',
      options: [
        'Store the access keys in AWS Secrets Manager and read them at startup',
        'Attach an IAM role through an instance profile and delete the stored keys',
        'Move the keys into environment variables set by the instance user data',
        'Encrypt the configuration file with a KMS key and decrypt it at startup'
      ],
      correctAnswer: 1,
      explanation: 'An instance profile delivers temporary, automatically rotated role credentials through the instance metadata service, and the SDK default credential provider chain picks them up with no code changes. Storing the keys in Secrets Manager, environment variables or an encrypted file still relies on long-term IAM user keys that must be rotated manually, and each adds code or bootstrapping work.'
    },
    {
      id: 'sec6',
      question: 'An application runs as an Amazon ECS task on AWS Fargate. The image pulls from Amazon ECR and logs reach CloudWatch, but the application code receives AccessDenied when it calls DynamoDB. The DynamoDB permissions were added to the task execution role. How should the developer fix this?',
      options: [
        'Pass the execution role credentials to the container as environment variables',
        'Add the DynamoDB permissions to the ECS cluster container instance role',
        'Attach the DynamoDB policy to the Amazon ECS service-linked role',
        'Grant the DynamoDB permissions to the task role used by the application code'
      ],
      correctAnswer: 3,
      explanation: 'The task role supplies the credentials that application code inside the container uses for AWS API calls, so DynamoDB permissions belong there. The task execution role is used by the ECS agent for actions such as pulling images, writing logs and fetching referenced secrets. Fargate has no container instance role, the service-linked role is for ECS itself, and copying credentials into environment variables defeats the purpose of roles.'
    },
    {
      id: 'sec7',
      question: 'A Lambda function in account A must read items from a DynamoDB table in account B. The security team forbids long-term credentials and wants account B to control exactly what the function may do. Which approach should the developer implement?',
      options: [
        'Create a role in account B that trusts the function role, and call sts:AssumeRole from the function',
        'Create an IAM user in account B and store its access keys in the function environment variables',
        'Attach an identity policy in account A allowing DynamoDB actions on the table ARN in account B',
        'Peer the VPCs of both accounts so the function can reach the table over private addresses'
      ],
      correctAnswer: 0,
      explanation: 'A role in account B whose trust policy allows the function role to assume it, with a permissions policy limited to the table, gives temporary credentials and keeps control in account B. An IAM user with stored keys is a long-term credential. An identity policy in account A alone cannot grant access to a resource in account B without a grant on the account B side, and network connectivity does not provide IAM authorization.'
    },
    {
      id: 'sec8',
      question: 'A SaaS monitoring vendor needs to assume an IAM role in a customer account to read CloudWatch metrics. The customer wants to prevent the confused deputy problem, where another vendor customer tricks the vendor into using this role. What should be added to the role?',
      options: [
        'A permissions boundary attached to the vendor role in its own account',
        'An aws:SecureTransport condition in the role trust policy',
        'An sts:ExternalId condition in the role trust policy',
        'An inline policy that denies every action outside CloudWatch'
      ],
      correctAnswer: 2,
      explanation: 'Requiring a unique external ID in the trust policy means the vendor must pass the value agreed with this customer when calling AssumeRole, so a request made on behalf of a different customer fails. A permissions boundary in the vendor account limits the vendor, not who can assume the role. aws:SecureTransport only enforces TLS, and limiting the role to CloudWatch reduces impact but does not stop the wrong party from assuming it.'
    },
    {
      id: 'sec9',
      question: 'A team deploys to AWS from GitHub Actions. Today the workflow uses an IAM user access key stored as a repository secret. The security team wants no long-lived AWS credentials anywhere in the pipeline. What should the developer configure?',
      options: [
        'Add GitHub as an IAM OIDC identity provider and assume a role with web identity',
        'Keep the IAM user but rotate its access key automatically every 90 days',
        'Store the IAM user access key in Secrets Manager and fetch it in the workflow',
        'Copy temporary IAM Identity Center credentials into the workflow secrets'
      ],
      correctAnswer: 0,
      explanation: 'With GitHub registered as an OIDC provider, each workflow run presents a short-lived OIDC token and calls AssumeRoleWithWebIdentity, receiving temporary credentials; the role trust policy can restrict the repository and branch. Rotating or relocating an IAM user key still leaves a long-lived credential, and fetching it from Secrets Manager would itself need credentials. Identity Center session credentials expire and are tied to a person, so copying them into secrets is neither automated nor appropriate.'
    },
    {
      id: 'sec10',
      question: 'A developer belongs to an IAM group whose policy allows s3:GetObject on a bucket. A second policy attached to the developer contains an explicit Deny for s3:GetObject on the same bucket when aws:SourceIp is not in the corporate CIDR range. The developer calls GetObject from home. What happens?',
      options: [
        'The request is allowed, because the group allow is more specific than the deny',
        'The request is allowed, because policies are evaluated in the order they were attached',
        'The request is denied, because S3 reads always require a bucket policy allow',
        'The request is denied, because an explicit deny overrides any allow'
      ],
      correctAnswer: 3,
      explanation: 'In IAM policy evaluation an explicit Deny that matches the request always wins over any Allow, regardless of where each statement lives or how specific it is. Attachment order and specificity play no role. Within the same account, an identity policy allow is enough for S3 access without a bucket policy, so the denial comes from the matching Deny, not a missing bucket policy.'
    },
    {
      id: 'sec11',
      question: 'A developer configures an S3 event notification to invoke a Lambda function when objects are created. Saving the notification fails because Amazon S3 is not permitted to invoke the function. What should the developer add?',
      options: [
        'S3 read permissions on the Lambda function execution role',
        'A bucket policy that grants the function lambda:InvokeFunction',
        'A function resource policy allowing s3.amazonaws.com for the bucket',
        'An IAM role for S3 whose trust policy names lambda.amazonaws.com'
      ],
      correctAnswer: 2,
      explanation: 'Services that push events to Lambda, such as S3 and SNS, are authorized by the function resource-based policy (lambda add-permission) with the service principal and a source ARN or account condition. The execution role controls what the function can do, not who can invoke it. A bucket policy governs access to the bucket, and S3 event notifications do not assume a role to invoke Lambda.'
    },
    {
      id: 'sec12',
      question: 'A mobile app uses a Cognito identity pool to obtain AWS credentials and writes directly to a shared DynamoDB table. Each user must be able to read and write only the items whose partition key equals their own identity ID. What is the most secure way to enforce this?',
      options: [
        'A separate DynamoDB table for each user, created at sign-up',
        'A dynamodb:LeadingKeys condition on the identity ID',
        'Filtering of items by user ID in the app before saving them',
        'A DynamoDB stream that deletes items written by other users'
      ],
      correctAnswer: 1,
      explanation: 'A fine-grained access control condition on dynamodb:LeadingKeys using the ${cognito-identity.amazonaws.com:sub} policy variable restricts every request to items whose partition key matches the caller identity ID, enforced by IAM. A table per user does not scale and multiplies operational work. Client-side filtering is not a security control because the credentials still allow access to everything, and a stream reacts after the unauthorized write has already happened.'
    },
    {
      id: 'sec13',
      question: 'An application on an EC2 instance uses the AWS SDK default credential provider chain. The instance role has the right permissions, but calls fail with AccessDenied and CloudTrail shows them made by an old IAM user. A developer had exported AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY in the shell profile. Why is this happening?',
      options: [
        'The instance profile always wins, so the role must be missing a permission',
        'The SDK merges the permissions of every credential source it finds',
        'IMDSv2 blocks role credentials until the metadata hop limit is raised',
        'Environment variable credentials come earlier in the chain than the instance role'
      ],
      correctAnswer: 3,
      explanation: 'The default provider chain checks sources in order and stops at the first one it finds, and environment variables are checked before the EC2 instance metadata role, so the old IAM user keys are used. The SDK never merges credentials from several sources, and the instance profile is checked late in the chain, not first. The IMDSv2 hop limit affects containers on the instance, not a process on the host, and the trail shows a user, not a failed role lookup.'
    },
    {
      id: 'sec14',
      question: 'A web app signs users in with a Cognito user pool and obtains AWS credentials from an identity pool. Users in the admins group must get write access to an S3 bucket, while all other users get read-only access. What should the developer configure?',
      options: [
        'Assign an IAM role to each user pool group and have the identity pool choose the role from the token',
        'Create a separate user pool for administrators and a second user pool for every other user',
        'Give read-only users the unauthenticated role and give administrators the authenticated role',
        'Attach S3 permission policies directly to each user pool group in the Cognito console'
      ],
      correctAnswer: 0,
      explanation: 'User pool groups can carry an IAM role ARN and a precedence; the token then includes the role claims, and the identity pool setting to choose the role from the token issues credentials for that role. Separate user pools add operational overhead for a simple role split. The unauthenticated role is for guests who have not signed in, and user pool groups reference IAM roles rather than holding permission policies themselves.'
    },
    {
      id: 'sec15',
      question: 'A developer uses the AWS KMS Encrypt API to protect 2 MB PDF files before storing them, and every call fails because the plaintext is too large. The files must stay encrypted under the same KMS key. What should the developer do?',
      options: [
        'Request a quota increase for the maximum plaintext size of Encrypt',
        'Split each file into small chunks and call Encrypt once per chunk',
        'Call GenerateDataKey and encrypt each file locally with the data key',
        'Change the KMS key to an asymmetric RSA key spec that accepts larger input'
      ],
      correctAnswer: 2,
      explanation: 'Encrypt accepts at most 4 KB of plaintext, so larger data uses envelope encryption: GenerateDataKey returns a plaintext data key to encrypt the file locally and an encrypted copy of that key to store next to the ciphertext. The 4 KB limit is fixed, not an adjustable quota. Chunking multiplies KMS requests and cost, and asymmetric keys accept even less plaintext than symmetric keys.'
    },
    {
      id: 'sec16',
      question: 'A service encrypts millions of small messages per hour using envelope encryption with GenerateDataKey for every message, and it now receives ThrottlingException errors from AWS KMS. The team wants to cut KMS requests with minimal code change while keeping each message encrypted. What should the developer do?',
      options: [
        'Create one KMS key per message type to spread requests across keys',
        'Use the AWS Encryption SDK with data key caching and suitable reuse limits',
        'Switch from the customer managed key to the AWS managed key for the service',
        'Call the Encrypt API directly for each message instead of GenerateDataKey'
      ],
      correctAnswer: 1,
      explanation: 'Data key caching in the AWS Encryption SDK reuses a data key for a bounded number of messages, bytes or time, cutting GenerateDataKey calls sharply. KMS request quotas apply per account and Region across keys, so more keys or an AWS managed key do not raise the limit. Calling Encrypt for every message still sends one request per message, so throttling continues.'
    },
    {
      id: 'sec17',
      question: 'An S3 bucket uses SSE-KMS with a customer managed key, and a workload writes and reads millions of objects per day. The team sees high AWS KMS request costs and occasional KMS throttling. What change reduces KMS requests with no application code changes?',
      options: [
        'Enable S3 Bucket Keys for the SSE-KMS configuration on the bucket',
        'Change the bucket default encryption to SSE-C with a customer key',
        'Enable automatic key rotation on the customer managed key',
        'Replace the key with a multi-Region KMS key in the same Region'
      ],
      correctAnswer: 0,
      explanation: 'An S3 Bucket Key is a short-lived bucket-level key derived from the KMS key, so S3 no longer calls KMS for every object and KMS request volume and cost drop sharply. SSE-C would force every client to send the key with each request, which is a large code change. Key rotation changes key material, not request volume, and a multi-Region key has the same per-request behavior.'
    },
    {
      id: 'sec18',
      question: 'A compliance standard requires that objects in Amazon S3 be protected by two independent layers of encryption applied on the server side, using keys managed in AWS KMS. Which option meets this requirement with the least effort?',
      options: [
        'SSE-S3 default encryption with S3 Bucket Keys enabled',
        'SSE-KMS with a customer managed key and automatic rotation',
        'SSE-C with a key supplied by the client on every request',
        'DSSE-KMS, dual-layer server-side encryption with KMS keys'
      ],
      correctAnswer: 3,
      explanation: 'DSSE-KMS applies two layers of encryption to each object on the server side using AWS KMS keys, which is designed for standards that require multilayer encryption. SSE-S3, SSE-KMS and SSE-C each apply a single layer, and Bucket Keys or rotation do not add a second layer. Building two layers yourself with client-side encryption would work but adds far more effort.'
    },
    {
      id: 'sec19',
      question: 'A company policy states that encryption keys for certain documents must be generated and stored only in the company on-premises HSM and never persisted in AWS. The team still wants Amazon S3 to perform the encryption and decryption. Which option should the developer use?',
      options: [
        'SSE-KMS with a customer managed key that has imported key material',
        'SSE-C, sending the customer key with every request over HTTPS',
        'SSE-S3 default encryption with a bucket policy requiring TLS',
        'DSSE-KMS with a customer managed key in a CloudHSM key store'
      ],
      correctAnswer: 1,
      explanation: 'With SSE-C the client sends its own key in each PUT and GET request, S3 uses it to encrypt or decrypt and then discards it, storing only a salted HMAC of the key to validate later requests; HTTPS is required. Imported key material and a CloudHSM key store keep the key inside AWS KMS or AWS CloudHSM, which the policy forbids. SSE-S3 uses keys that S3 manages.'
    },
    {
      id: 'sec20',
      question: 'A multi-tenant application encrypts every tenant record with the same KMS key. The team wants a Decrypt call to fail if ciphertext from tenant A is presented while processing tenant B, and wants CloudTrail to show which tenant each KMS request was for. What should the developer do?',
      options: [
        'Create a KMS grant for each tenant and pass its grant token on Decrypt',
        'Enable automatic key rotation so that each tenant receives new key material',
        'Pass the tenant ID as encryption context on both Encrypt and Decrypt calls',
        'Store each tenant ciphertext under a separate S3 prefix with its own policy'
      ],
      correctAnswer: 2,
      explanation: 'Encryption context is non-secret key-value data bound to the ciphertext as additional authenticated data: Decrypt fails unless the exact same context is supplied, and the context is recorded in CloudTrail. Grants control who may use the key, not which ciphertext belongs to which tenant. Rotation changes key material for everyone on a schedule, and S3 prefixes do not bind ciphertext to a tenant at the cryptographic level.'
    },
    {
      id: 'sec21',
      question: 'Auditors require that the key material of a customer managed KMS key used by an application be rotated regularly. Existing ciphertext must remain decryptable, and the application code and key ID must not change. What should the developer do?',
      options: [
        'Create a new KMS key each year and re-encrypt every object with it',
        'Schedule the key for deletion each year and import fresh key material',
        'Switch the application to an AWS owned key that AWS rotates for you',
        'Enable automatic key rotation on the existing customer managed key'
      ],
      correctAnswer: 3,
      explanation: 'Automatic rotation adds new key material on a schedule while keeping the same key ID and ARN and retaining older material, so existing ciphertext still decrypts and no code changes are needed. Creating new keys and re-encrypting data is manual work that changes the key ID. Scheduling deletion destroys the key and makes data unrecoverable, and AWS owned keys give the team no visibility or audit evidence of rotation.'
    },
    {
      id: 'sec22',
      question: 'A batch application must let a short-lived processing role use a customer managed KMS key to decrypt data for the duration of each job, and remove that permission when the job ends. The key policy must not be edited for every job. What should the developer use?',
      options: [
        'Create a KMS grant for the role at job start and retire it when the job ends',
        'Add a statement to the key policy at job start and remove it at the end',
        'Attach an IAM policy to the role that allows kms:* on every key in the account',
        'Copy the key material into a new key for each job and delete it afterward'
      ],
      correctAnswer: 0,
      explanation: 'KMS grants delegate specific operations on one key to a principal programmatically and can be retired or revoked when no longer needed, without touching the key policy. Editing the key policy per job is exactly what is not allowed and risks breaking the policy. A kms:* policy on every key violates least privilege, and KMS key material cannot be exported or copied into another key.'
    },
    {
      id: 'sec23',
      question: 'A Lambda function in account B must read S3 objects in account A that are encrypted with SSE-KMS using a customer managed key in account A. The bucket policy already allows the function role to read the objects, but GetObject fails with a KMS AccessDenied error. What else is required?',
      options: [
        'Only an IAM policy in account B, because key policies apply within account A',
        'Account B allowed in the key policy, plus kms:Decrypt in the role IAM policy',
        'A replica of the key in account B created with the KMS ReplicateKey API',
        'A switch to the aws/s3 AWS managed key so that it can be shared'
      ],
      correctAnswer: 1,
      explanation: 'Cross-account use of a KMS key needs both sides: the key policy in account A must allow account B (or the role), and an IAM policy in account B must grant kms:Decrypt on the key ARN. An IAM policy alone cannot reach a key in another account. ReplicateKey creates multi-Region replicas within the same account, and AWS managed keys cannot be used cross-account because their key policies cannot be edited.'
    },
    {
      id: 'sec24',
      question: 'A developer requests a public ACM certificate for www.example.com in the eu-west-1 Region to use on an Amazon CloudFront distribution, but the certificate does not appear in the distribution settings. What should the developer do?',
      options: [
        'Enable cross-Region sharing on the certificate in eu-west-1',
        'Wait until DNS validation propagates to every CloudFront edge location',
        'Request or import the certificate in ACM in the us-east-1 Region',
        'Request a private certificate from AWS Private CA in eu-west-1'
      ],
      correctAnswer: 2,
      explanation: 'CloudFront, and API Gateway edge-optimized endpoints, can only use ACM certificates from us-east-1 (N. Virginia), whereas Regional API Gateway endpoints and load balancers use certificates in their own Region. ACM certificates are Regional resources with no cross-Region sharing setting. Validation status is not tied to edge locations, and a private CA certificate would not be trusted by public browsers.'
    },
    {
      id: 'sec25',
      question: 'A new DynamoDB table stores payment data. The security team requires that the team control the key policy for the table encryption key, be able to disable the key, and see each use of the key in CloudTrail. What should the developer configure?',
      options: [
        'Encryption at rest with a customer managed KMS key selected for the table',
        'Encryption at rest with the AWS owned key plus CloudTrail data events',
        'Encryption at rest turned on, because DynamoDB leaves it off by default',
        'The AWS managed key aws/dynamodb with an edited key policy for the team'
      ],
      correctAnswer: 0,
      explanation: 'A customer managed key gives full control of the key policy, lets the team disable or schedule deletion of the key, and logs its use in CloudTrail. The AWS owned key is the default and is invisible in the account. DynamoDB always encrypts data at rest and it cannot be turned off, and AWS managed keys are visible in CloudTrail but their key policies cannot be edited.'
    },
    {
      id: 'sec26',
      question: 'A healthcare application must ensure that Amazon S3 never receives the plaintext of uploaded records, even inside AWS. The team wants to keep key management in AWS KMS. Which approach meets this requirement?',
      options: [
        'Set the bucket default encryption to SSE-KMS with a customer managed key',
        'Add a bucket policy that denies any request where aws:SecureTransport is false',
        'Enable DSSE-KMS on the bucket with a customer managed key',
        'Encrypt on the client with the Amazon S3 Encryption Client and a KMS key'
      ],
      correctAnswer: 3,
      explanation: 'Client-side encryption encrypts the data in the application before upload, using a data key protected by KMS, so S3 stores only ciphertext. SSE-KMS and DSSE-KMS are server-side: S3 receives the plaintext over TLS and encrypts it at rest. Requiring aws:SecureTransport protects data in transit but S3 still receives the plaintext.'
    },
    {
      id: 'sec27',
      question: 'A Lambda function connects to an Amazon RDS for PostgreSQL database. The security team requires that the database password be rotated automatically every 30 days without redeploying the function and without service interruption. Which solution meets these requirements?',
      options: [
        'An SSM Parameter Store SecureString with an expiration parameter policy',
        'A Lambda environment variable encrypted with a customer managed key',
        'A Secrets Manager secret with rotation enabled, read at runtime',
        'A customer managed KMS key with automatic rotation protecting the password'
      ],
      correctAnswer: 2,
      explanation: 'Secrets Manager rotates the secret on a schedule using a rotation Lambda function (or managed rotation for supported databases) that updates both the database and the secret, and the function always reads the current value. Parameter Store has no built-in rotation; an expiration policy only notifies. Environment variables need a configuration update to change, and KMS key rotation changes the encryption key, not the database password.'
    },
    {
      id: 'sec28',
      question: 'A startup must store about 40 configuration values for its application, including a few third-party API keys that change only when the vendor reissues them. The keys must be encrypted with AWS KMS, no rotation is needed, and cost must be as low as possible. Which option should the developer choose?',
      options: [
        'AWS Secrets Manager secrets, one for each configuration value',
        'SSM Parameter Store standard parameters, with SecureString for the keys',
        'AWS AppConfig hosted configurations, with the keys in a feature flag',
        'A DynamoDB table encrypted at rest with a customer managed key'
      ],
      correctAnswer: 1,
      explanation: 'Standard Parameter Store parameters have no storage charge, and SecureString encrypts values with a KMS key, which fits values that do not need rotation. Secrets Manager charges for each secret per month and its main advantage, built-in rotation, is not required. AppConfig is meant for non-secret application configuration and feature flags, and a DynamoDB table means writing custom access code and paying for the table.'
    },
    {
      id: 'sec29',
      question: 'A Lambda function calls GetSecretValue from AWS Secrets Manager at the start of every invocation. Under heavy load this adds latency and API cost. The team wants to cache the secret inside the execution environment with minimal custom code. What should the developer do?',
      options: [
        'Add the AWS Parameters and Secrets Lambda Extension and read the secret through it',
        'Copy the secret value into a plaintext environment variable during deployment',
        'Turn on provisioned concurrency so that each environment fetches the secret once',
        'Increase the function memory so that each GetSecretValue call completes faster'
      ],
      correctAnswer: 0,
      explanation: 'The AWS Parameters and Secrets Lambda Extension runs a local cache in the execution environment, so the function retrieves secrets over a localhost endpoint and Secrets Manager is called only when the cache expires; caching client libraries work similarly. A plaintext environment variable exposes the secret and stops reflecting rotation. Provisioned concurrency does not change code that fetches the secret on every invocation, and more memory does not remove the network call.'
    },
    {
      id: 'sec30',
      question: 'A security policy requires that sensitive Lambda environment variables be encrypted at rest with a key whose key policy the team controls, whose use is logged, and which the team can disable in an emergency. What should the developer configure?',
      options: [
        'Keep the default encryption, which uses the AWS managed key for Lambda',
        'Move the values into SSM Parameter Store as standard String parameters',
        'Enable code signing on the function with an AWS Signer signing profile',
        'Set a customer managed KMS key in the function encryption configuration'
      ],
      correctAnswer: 3,
      explanation: 'Lambda always encrypts environment variables at rest; specifying a customer managed KMS key gives the team control of the key policy, CloudTrail visibility and the ability to disable the key. The default AWS managed key cannot have its policy edited or be disabled. A String parameter is not encrypted, and code signing verifies deployment packages rather than protecting configuration values.'
    },
    {
      id: 'sec31',
      question: 'An audit finds that a Lambda function writes full request payloads, including card numbers and email addresses, to Amazon CloudWatch Logs. While the code fix is being prepared, the team must stop that data from being visible to people who read the logs. What should the developer do immediately?',
      options: [
        'Associate a customer managed KMS key with the log group',
        'Apply a CloudWatch Logs data protection policy that masks the sensitive data',
        'Enable Amazon Macie automated sensitive data discovery for the account',
        'Reduce the log group retention period to the shortest available value'
      ],
      correctAnswer: 1,
      explanation: 'A CloudWatch Logs data protection policy detects sensitive data types such as card numbers and email addresses and masks them for readers without the logs:Unmask permission. Encrypting the log group with KMS protects data at rest but readers still see plaintext. Macie discovers sensitive data in S3, not in log groups, and shorter retention still leaves the data visible until it expires. The lasting fix is to stop logging the sensitive fields.'
    },
    {
      id: 'sec32',
      question: 'A team wants to change non-secret settings such as feature flags and request limits in a running application without redeploying code. Changes must be validated against a schema and rolled out gradually, with automatic rollback if a CloudWatch alarm fires. Which service should the developer use?',
      options: [
        'AWS Secrets Manager with a rotation schedule for each setting',
        'Lambda environment variables updated through the console',
        'AWS AppConfig with validators and a deployment strategy',
        'SSM Parameter Store advanced parameters with parameter policies'
      ],
      correctAnswer: 2,
      explanation: 'AWS AppConfig deploys configuration and feature flags with JSON Schema or Lambda validators, gradual deployment strategies and automatic rollback on CloudWatch alarms. Secrets Manager is for secrets and has no staged rollout of configuration. Updating environment variables applies the change to all new invocations at once with no validation, and Parameter Store policies handle expiration and notifications, not gradual deployment.'
    },
    {
      id: 'sec33',
      question: 'An application in account B must read a database secret stored in AWS Secrets Manager in account A. The secret is currently encrypted with the default aws/secretsmanager key, and cross-account reads fail. What should the developer do?',
      options: [
        'Re-encrypt with a customer managed key that allows account B, plus a resource policy',
        'Add a resource policy to the secret that allows account B, keeping the aws/secretsmanager key',
        'Replicate the secret to account B using the Secrets Manager multi-Region replication feature',
        'Edit the aws/secretsmanager key policy in account A so that account B can call kms:Decrypt'
      ],
      correctAnswer: 0,
      explanation: 'Cross-account access to a secret needs a resource policy on the secret, an IAM policy in account B, and a customer managed KMS key whose key policy allows account B to decrypt. The AWS managed aws/secretsmanager key cannot be used across accounts and its key policy cannot be edited, so a resource policy alone still fails. Replication copies secrets to other Regions in the same account, not to other accounts.'
    },
    {
      id: 'sec34',
      question: 'A developer stores a database password in SSM Parameter Store as a SecureString encrypted with a customer managed key. The application calls GetParameter, but the value it receives is an unreadable encrypted string. The role has ssm:GetParameter permission. What should the developer change?',
      options: [
        'Change the parameter type to String so the SDK can read the value directly',
        'Move the parameter to the advanced tier so that decryption is supported',
        'Call the KMS Encrypt API on the returned value to restore the plaintext',
        'Set WithDecryption to true and give the role kms:Decrypt on the key'
      ],
      correctAnswer: 3,
      explanation: 'GetParameter returns SecureString values encrypted unless WithDecryption is true, and the caller also needs kms:Decrypt on the KMS key that protects the parameter. Changing the type to String removes encryption, and both standard and advanced tiers support SecureString. Calling Encrypt would encrypt the value again rather than decrypting it.'
    }
  ]
};

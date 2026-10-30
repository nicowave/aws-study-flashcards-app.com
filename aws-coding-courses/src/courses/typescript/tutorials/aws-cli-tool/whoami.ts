// whoami.ts: which AWS account and user is this program running as?
import { STSClient, GetCallerIdentityCommand } from '@aws-sdk/client-sts';

const sts = new STSClient({});
const me = await sts.send(new GetCallerIdentityCommand({}));

const account: string = me.Account ?? 'unknown';
console.log(`Account  ${account}`);
console.log(`User     ${me.Arn ?? 'unknown'}`);

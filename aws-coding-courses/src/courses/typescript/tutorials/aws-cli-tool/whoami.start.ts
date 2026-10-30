// whoami.ts: which AWS account and user is this program running as?
import { STSClient, GetCallerIdentityCommand } from '@aws-sdk/client-sts';

const sts = new STSClient({});
const me = await sts.send(new GetCallerIdentityCommand({}));

// TypeScript stops this line. Read the error, then fix it.
const account: string = me.Account;
console.log(`Account  ${account}`);

// TODO: print the user's ARN on a second line, starting with "User", lined up like the first

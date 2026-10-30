// servers.ts: every EC2 server, with its state and its Name tag
import { EC2Client, DescribeInstancesCommand, type Instance } from '@aws-sdk/client-ec2';

const ec2 = new EC2Client({});

export function nameOf(instance: Instance): string {
  // TypeScript has two complaints about this line. Both are real bugs.
  return instance.Tags.find((tag) => tag.Key === 'Name').Value;
}

const out = await ec2.send(new DescribeInstancesCommand({}));
console.log(`${'ID'.padEnd(21)}${'STATE'.padEnd(10)}NAME`);
for (const reservation of out.Reservations ?? []) {
  for (const instance of reservation.Instances ?? []) {
    // TODO: print the state and the name too, each column padded like the header
    console.log(instance.InstanceId);
  }
}

// servers.ts: every EC2 server, with its state and its Name tag
import { EC2Client, DescribeInstancesCommand, type Instance } from '@aws-sdk/client-ec2';

const ec2 = new EC2Client({});

export function nameOf(instance: Instance): string {
  return instance.Tags?.find((tag) => tag.Key === 'Name')?.Value ?? '(no name)';
}

const out = await ec2.send(new DescribeInstancesCommand({}));
console.log(`${'ID'.padEnd(21)}${'STATE'.padEnd(10)}NAME`);
for (const reservation of out.Reservations ?? []) {
  for (const instance of reservation.Instances ?? []) {
    const id = instance.InstanceId ?? '?';
    const state = instance.State?.Name ?? '?';
    console.log(`${id.padEnd(21)}${state.padEnd(10)}${nameOf(instance)}`);
  }
}

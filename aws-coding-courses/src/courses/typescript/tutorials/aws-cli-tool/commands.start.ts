// commands.ts: turn the words after "ops" into a typed command
export type Command =
  | { kind: 'help' }
  | { kind: 'whoami' }
  | { kind: 'buckets' }
  | { kind: 'usage'; bucket: string }
  | { kind: 'servers' }
  | { kind: 'purge'; distributionId: string; paths: string[] };

/** What the words turned into: a command, or a mistake to explain */
export type Parsed = Command | { kind: 'mistake'; message: string };

export function parseArgs(argv: string[]): Parsed {
  const [name, ...rest] = argv;
  switch (name) {
    case undefined:
    case 'help':
    case '--help':
    case '-h':
      return { kind: 'help' };
    case 'whoami':
    case 'buckets':
    case 'servers':
      return { kind: name };
    case 'usage':
      if (!rest[0]) return { kind: 'mistake', message: 'usage needs a bucket name: ops usage <bucket>' };
      return { kind: 'usage', bucket: rest[0] };
    // TODO: 'purge' needs a distribution ID, then any number of paths.
    //       No paths means everything: ['/*']. A path that doesn't start
    //       with "/" is a mistake (CloudFront would refuse it).
    default:
      return { kind: 'mistake', message: `unknown command "${name}"` };
  }
}

/** One line about what a command will do. TypeScript checks every kind has a case. */
export function describe(cmd: Command): string {
  switch (cmd.kind) {
    case 'help':
      return 'show the help';
    case 'whoami':
      return 'show the account and user';
    case 'buckets':
      return 'list the buckets';
    case 'usage':
      return `count the objects in ${cmd.bucket}`;
    case 'servers':
      return 'list the servers';
    default: {
      const unhandled: never = cmd; // only reachable if a kind has no case above
      return unhandled;
    }
  }
}

for (const words of [['usage', 'team-assets'], ['purge', 'E2STAGE7XQ4LM'], ['purge', 'E2STAGE7XQ4LM', 'index.html'], ['dance']]) {
  const parsed = parseArgs(words);
  const said = parsed.kind === 'mistake' ? `mistake: ${parsed.message}` : describe(parsed);
  console.log(`ops ${words.join(' ')}`.padEnd(38), '->', said);
}

// usage.ts: how many objects does a bucket hold, and how much space do they take?
import { S3Client, ListObjectsV2Command, paginateListObjectsV2 } from '@aws-sdk/client-s3';

const s3 = new S3Client({});

/** Every item from every page, in one array. */
export async function collect<Page, Item>(pages: AsyncIterable<Page>, pick: (page: Page) => Item[] | undefined): Promise<Item[]> {
  const all: Item[] = [];
  // TODO: for await (const page of pages), add pick(page)'s items to all.
  //       pick can return undefined (a page with no objects): use ?? []
  return all;
}

/** 512 -> "512 B", 1536 -> "1.5 KB", 5400000 -> "5.1 MB" */
export function formatBytes(bytes: number): string {
  // TODO: divide by 1024 until it's under 1024, counting the steps:
  //       B, KB, MB, GB, TB. One decimal place for everything but bytes.
  return `${bytes} B`;
}

export async function measure(bucket: string): Promise<{ objects: number; bytes: number }> {
  // One call: at most 1,000 objects, however big the bucket is
  const page = await s3.send(new ListObjectsV2Command({ Bucket: bucket }));
  const objects = page.Contents ?? [];
  // TODO: use collect() with paginateListObjectsV2({ client: s3 }, { Bucket: bucket }) instead
  const bytes = objects.reduce((sum, o) => sum + (o.Size ?? 0), 0);
  return { objects: objects.length, bytes };
}

const { objects, bytes } = await measure('team-assets');
console.log(`team-assets: ${objects.toLocaleString('en-US')} objects, ${formatBytes(bytes)}`);

// usage.ts: how many objects does a bucket hold, and how much space do they take?
import { S3Client, paginateListObjectsV2 } from '@aws-sdk/client-s3';

const s3 = new S3Client({});

/** Every item from every page, in one array. */
export async function collect<Page, Item>(pages: AsyncIterable<Page>, pick: (page: Page) => Item[] | undefined): Promise<Item[]> {
  const all: Item[] = [];
  for await (const page of pages) {
    all.push(...(pick(page) ?? []));
  }
  return all;
}

/** 512 -> "512 B", 1536 -> "1.5 KB", 5400000 -> "5.1 MB" */
export function formatBytes(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return unit === 0 ? `${value} B` : `${value.toFixed(1)} ${units[unit]}`;
}

export async function measure(bucket: string): Promise<{ objects: number; bytes: number }> {
  const objects = await collect(paginateListObjectsV2({ client: s3 }, { Bucket: bucket }), (page) => page.Contents);
  const bytes = objects.reduce((sum, o) => sum + (o.Size ?? 0), 0);
  return { objects: objects.length, bytes };
}

const { objects, bytes } = await measure('team-assets');
console.log(`team-assets: ${objects.toLocaleString('en-US')} objects, ${formatBytes(bytes)}`);

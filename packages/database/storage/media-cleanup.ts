import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@skilltego/types";

type Client = SupabaseClient<Database>;

const PUBLIC_URL_MARKER = "/storage/v1/object/public/";

/**
 * Extracts { bucket, path } from a Supabase Storage public URL. Returns null
 * for anything that isn't one (external URLs, empty values) so callers can
 * safely pass in whatever a media/avatar/cover column happens to hold.
 */
export function parseStorageUrl(url: string | null | undefined): { bucket: string; path: string } | null {
  if (!url) return null;
  const index = url.indexOf(PUBLIC_URL_MARKER);
  if (index === -1) return null;

  const rest = url.slice(index + PUBLIC_URL_MARKER.length);
  const slash = rest.indexOf("/");
  if (slash === -1) return null;

  const bucket = rest.slice(0, slash);
  const path = decodeURIComponent(rest.slice(slash + 1));
  if (!bucket || !path) return null;

  return { bucket, path };
}

/**
 * Best-effort delete of one or more Storage objects, addressed by their public
 * URLs. Groups by bucket since storage.remove() takes a path array per bucket.
 * Never throws — a failed cleanup shouldn't block the caller's primary delete
 * (the DB row is the source of truth for what's "deleted"); failures are only
 * logged, and any leftover file is still catchable by an orphan scan later.
 */
export async function removeStorageObjectsByUrl(
  client: Client,
  urls: Array<string | null | undefined>,
): Promise<void> {
  const byBucket = new Map<string, string[]>();
  for (const url of urls) {
    const parsed = parseStorageUrl(url);
    if (!parsed) continue;
    const paths = byBucket.get(parsed.bucket) ?? [];
    paths.push(parsed.path);
    byBucket.set(parsed.bucket, paths);
  }

  await Promise.all(
    [...byBucket.entries()].map(async ([bucket, paths]) => {
      const { error } = await client.storage.from(bucket).remove(paths);
      if (error) console.error(`Storage cleanup failed for bucket "${bucket}":`, error.message);
    }),
  );
}

const LIST_PAGE_SIZE = 1000;
const USER_MEDIA_BUCKETS = ["avatars", "posts", "reels", "stories", "post-media"];

/**
 * Removes every object under a user's folder across every media bucket —
 * every upload (avatar/cover/post/reel/story media, plus legacy post-media
 * resume/voice-note uploads) lives at `{userId}/...` regardless of type, so
 * this catches all of it without needing to enumerate individual DB rows.
 * Pass the service-role client: this runs as part of account deletion, where
 * relying on the (about-to-be-deleted) user's own session would be fragile.
 */
export async function removeAllUserStorage(client: Client, userId: string): Promise<void> {
  await Promise.all(
    USER_MEDIA_BUCKETS.map(async (bucket) => {
      let offset = 0;
      for (;;) {
        const { data, error } = await client.storage.from(bucket).list(userId, {
          limit: LIST_PAGE_SIZE,
          offset,
        });
        if (error) {
          console.error(`Storage listing failed for bucket "${bucket}":`, error.message);
          return;
        }
        if (!data || data.length === 0) return;

        const paths = data.map((entry) => `${userId}/${entry.name}`);
        const { error: removeError } = await client.storage.from(bucket).remove(paths);
        if (removeError) {
          console.error(`Storage cleanup failed for bucket "${bucket}":`, removeError.message);
        }

        if (data.length < LIST_PAGE_SIZE) return;
        offset += LIST_PAGE_SIZE;
      }
    }),
  );
}

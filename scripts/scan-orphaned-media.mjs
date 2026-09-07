#!/usr/bin/env node
// Read-only Storage/DB diff: lists every object across all media buckets,
// collects every URL actually referenced from the database (posts, stories,
// profiles, messages), and reports objects in Storage that no row points to.
//
// This NEVER deletes anything — it only writes a JSON report to disk. Review
// scripts/orphaned-media-report.json yourself (spot-check a sample of the
// URLs) before deciding what, if anything, to remove.
//
// Usage: node --env-file=apps/web/.env.local scripts/scan-orphaned-media.mjs

import { createClient } from "@supabase/supabase-js";
import { writeFileSync } from "node:fs";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
  console.error("Run with: node --env-file=apps/web/.env.local scripts/scan-orphaned-media.mjs");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const BUCKETS = ["avatars", "posts", "reels", "stories", "post-media"];
const STORAGE_LIST_PAGE = 1000;
const DB_PAGE = 1000;

async function listAllUserFolders(bucket) {
  const folders = [];
  let offset = 0;
  for (;;) {
    const { data, error } = await supabase.storage.from(bucket).list("", {
      limit: STORAGE_LIST_PAGE,
      offset,
    });
    if (error) throw new Error(`list(${bucket}, root): ${error.message}`);
    if (!data || data.length === 0) break;
    for (const entry of data) {
      // Real files at bucket root (shouldn't happen under our path convention,
      // but don't silently drop them) have an `id`; folders don't.
      if (entry.id) folders.push({ isFile: true, name: entry.name, size: entry.metadata?.size ?? 0 });
      else folders.push({ isFile: false, name: entry.name });
    }
    if (data.length < STORAGE_LIST_PAGE) break;
    offset += STORAGE_LIST_PAGE;
  }
  return folders;
}

async function listAllObjectsInBucket(bucket) {
  const objects = [];
  const topLevel = await listAllUserFolders(bucket);

  for (const entry of topLevel) {
    if (entry.isFile) {
      objects.push({ bucket, path: entry.name, size: entry.size });
      continue;
    }

    let offset = 0;
    for (;;) {
      const { data, error } = await supabase.storage.from(bucket).list(entry.name, {
        limit: STORAGE_LIST_PAGE,
        offset,
      });
      if (error) throw new Error(`list(${bucket}, ${entry.name}): ${error.message}`);
      if (!data || data.length === 0) break;
      for (const file of data) {
        if (!file.id) continue; // nested folder — our convention doesn't produce these, skip defensively
        objects.push({ bucket, path: `${entry.name}/${file.name}`, size: file.metadata?.size ?? 0 });
      }
      if (data.length < STORAGE_LIST_PAGE) break;
      offset += STORAGE_LIST_PAGE;
    }
  }

  return objects;
}

const PUBLIC_URL_MARKER = "/storage/v1/object/public/";

function parseStorageUrl(url) {
  if (!url || typeof url !== "string") return null;
  const index = url.indexOf(PUBLIC_URL_MARKER);
  if (index === -1) return null;
  const rest = url.slice(index + PUBLIC_URL_MARKER.length);
  const slash = rest.indexOf("/");
  if (slash === -1) return null;
  return { bucket: rest.slice(0, slash), path: decodeURIComponent(rest.slice(slash + 1)) };
}

async function collectReferencedUrls() {
  const referenced = new Set();

  async function paginate(table, columns, extract) {
    let from = 0;
    for (;;) {
      const { data, error } = await supabase.from(table).select(columns).range(from, from + DB_PAGE - 1);
      if (error) throw new Error(`select ${table}: ${error.message}`);
      if (!data || data.length === 0) break;
      for (const row of data) {
        for (const url of extract(row)) {
          if (url) referenced.add(url);
        }
      }
      if (data.length < DB_PAGE) break;
      from += DB_PAGE;
    }
  }

  await paginate("posts", "media, thumbnail_url", (row) => [
    row.thumbnail_url,
    ...(Array.isArray(row.media) ? row.media.map((m) => m?.url) : []),
  ]);
  await paginate("stories", "media_url", (row) => [row.media_url]);
  await paginate("profiles", "avatar_url, cover_url, resume_url", (row) => [
    row.avatar_url,
    row.cover_url,
    row.resume_url,
  ]);
  await paginate("messages", "attachment", (row) => [row.attachment?.url]);

  return referenced;
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

async function main() {
  console.log("Collecting referenced URLs from the database...");
  const referenced = await collectReferencedUrls();
  console.log(`  Found ${referenced.size} referenced URLs.`);

  const referencedKeys = new Set(
    [...referenced]
      .map(parseStorageUrl)
      .filter(Boolean)
      .map((r) => `${r.bucket}/${r.path}`),
  );

  const report = { generatedAt: new Date().toISOString(), buckets: {}, totals: {} };
  let totalObjects = 0;
  let totalBytes = 0;
  let totalOrphanObjects = 0;
  let totalOrphanBytes = 0;

  for (const bucket of BUCKETS) {
    console.log(`Scanning bucket "${bucket}"...`);
    const objects = await listAllObjectsInBucket(bucket);
    const bucketBytes = objects.reduce((sum, o) => sum + o.size, 0);

    const orphans = objects.filter((o) => !referencedKeys.has(`${bucket}/${o.path}`));
    const orphanBytes = orphans.reduce((sum, o) => sum + o.size, 0);

    console.log(
      `  ${objects.length} objects (${formatBytes(bucketBytes)}), ${orphans.length} orphan candidates (${formatBytes(orphanBytes)})`,
    );

    report.buckets[bucket] = {
      objectCount: objects.length,
      totalBytes: bucketBytes,
      totalSize: formatBytes(bucketBytes),
      orphanCount: orphans.length,
      orphanBytes,
      orphanSize: formatBytes(orphanBytes),
      // Largest orphans first — the ones worth spot-checking / most worth removing.
      orphanSample: orphans
        .sort((a, b) => b.size - a.size)
        .slice(0, 50)
        .map((o) => ({ path: o.path, size: formatBytes(o.size) })),
      allOrphanPaths: orphans.map((o) => o.path),
    };

    totalObjects += objects.length;
    totalBytes += bucketBytes;
    totalOrphanObjects += orphans.length;
    totalOrphanBytes += orphanBytes;
  }

  report.totals = {
    objectCount: totalObjects,
    totalBytes,
    totalSize: formatBytes(totalBytes),
    orphanCount: totalOrphanObjects,
    orphanBytes: totalOrphanBytes,
    orphanSize: formatBytes(totalOrphanBytes),
  };

  const outPath = new URL("./orphaned-media-report.json", import.meta.url);
  writeFileSync(outPath, JSON.stringify(report, null, 2));

  console.log("\n=== Summary ===");
  console.log(`Total: ${totalObjects} objects, ${formatBytes(totalBytes)}`);
  console.log(`Orphan candidates: ${totalOrphanObjects} objects, ${formatBytes(totalOrphanBytes)}`);
  console.log(`Full report written to ${outPath.pathname}`);
  console.log("\nThis is a candidate list, not a delete list — nothing was removed.");
  console.log("Spot-check orphanSample entries before acting on any of it.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

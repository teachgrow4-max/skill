#!/usr/bin/env node
// Deletes exactly the objects listed in scripts/orphaned-media-report.json
// (produced by scan-orphaned-media.mjs) — nothing more, nothing inferred.
// Run the scanner again first if the report might be stale.
//
// Usage: node --env-file=apps/web/.env.local scripts/delete-orphaned-media.mjs

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const reportPath = new URL("./orphaned-media-report.json", import.meta.url);
const report = JSON.parse(readFileSync(reportPath, "utf-8"));

let totalDeleted = 0;
let totalFailed = 0;

for (const [bucket, info] of Object.entries(report.buckets)) {
  const paths = info.allOrphanPaths;
  if (!paths || paths.length === 0) continue;

  console.log(`Deleting ${paths.length} objects from "${bucket}"...`);
  const { data, error } = await supabase.storage.from(bucket).remove(paths);
  if (error) {
    console.error(`  Failed: ${error.message}`);
    totalFailed += paths.length;
    continue;
  }
  console.log(`  Removed ${data.length} objects.`);
  totalDeleted += data.length;
  if (data.length < paths.length) {
    console.warn(`  ${paths.length - data.length} path(s) were not found (already gone?).`);
  }
}

console.log(`\nDone. ${totalDeleted} objects deleted, ${totalFailed} failed.`);

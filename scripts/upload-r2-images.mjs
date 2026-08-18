#!/usr/bin/env node
/**
 * Upload all project images to Cloudflare R2.
 *
 * Strategy:
 *   - public/optimized/  → images/optimized/
 *   - public/partners/   → images/partners/
 *   - public/cases/      → images/cases/
 *   - public/*.{png,jpg,jpeg,gif,svg,avif,webp} → images/
 *     (skips Next.js demo files: file.svg, globe.svg, next.svg, vercel.svg, window.svg)
 *
 * Prefers optimised formats: if an .avif or .webp variant exists for a file,
 * the original .png/.jpg is still uploaded (needed as fallback by <picture> tags).
 *
 * Required env vars:
 *   R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET
 * Optional:
 *   R2_IMAGE_PREFIX  (default: "images/")
 *
 * Usage:
 *   node scripts/upload-r2-images.mjs
 */

import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { createReadStream, promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const publicDir = path.join(root, 'public');

const {
  R2_ACCOUNT_ID,
  R2_ACCESS_KEY_ID,
  R2_SECRET_ACCESS_KEY,
  R2_BUCKET,
  R2_IMAGE_PREFIX = 'images/',
} = process.env;

if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET) {
  console.error('Missing env vars. Required: R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET');
  process.exit(1);
}

const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId: R2_ACCESS_KEY_ID, secretAccessKey: R2_SECRET_ACCESS_KEY },
});

const CONTENT_TYPES = {
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif':  'image/gif',
  '.svg':  'image/svg+xml',
  '.avif': 'image/avif',
  '.webp': 'image/webp',
};

// Next.js demo files that have no use in production
const SKIP_FILES = new Set(['file.svg', 'globe.svg', 'next.svg', 'vercel.svg', 'window.svg']);

const IMAGE_EXTS = new Set(Object.keys(CONTENT_TYPES));

async function collectFiles(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];
  for (const e of entries) {
    if (e.isFile()) files.push(path.join(dir, e.name));
  }
  return files;
}

async function upload(localPath, r2Key) {
  const ext = path.extname(localPath).toLowerCase();
  const contentType = CONTENT_TYPES[ext] ?? 'application/octet-stream';

  await s3.send(new PutObjectCommand({
    Bucket: R2_BUCKET,
    Key: r2Key,
    Body: createReadStream(localPath),
    ContentType: contentType,
    CacheControl: 'public, max-age=31536000, immutable',
  }));
}

async function uploadDir(dir, r2Subdir) {
  let files;
  try {
    files = await collectFiles(dir);
  } catch {
    console.log(`  (skipping ${dir} — not found)`);
    return 0;
  }

  const imageFiles = files.filter(f => IMAGE_EXTS.has(path.extname(f).toLowerCase()));
  if (imageFiles.length === 0) {
    console.log(`  (no image files in ${path.relative(root, dir)})`);
    return 0;
  }

  let count = 0;
  for (const filePath of imageFiles.sort()) {
    const name = path.basename(filePath);
    if (SKIP_FILES.has(name)) continue;

    const prefix = R2_IMAGE_PREFIX.replace(/\/?$/, '/');
    const r2Key = `${prefix}${r2Subdir}${name}`;

    process.stdout.write(`  ${path.relative(publicDir, filePath).padEnd(60)} → ${r2Key}\n`);
    await upload(filePath, r2Key);
    count++;
  }
  return count;
}

(async () => {
  let total = 0;

  console.log('\n=== public/optimized/ ===');
  total += await uploadDir(path.join(publicDir, 'optimized'), 'optimized/');

  console.log('\n=== public/partners/ ===');
  total += await uploadDir(path.join(publicDir, 'partners'), 'partners/');

  console.log('\n=== public/cases/ ===');
  total += await uploadDir(path.join(publicDir, 'cases'), 'cases/');

  console.log('\n=== public/ (root images) ===');
  total += await uploadDir(publicDir, '');

  console.log(`\nDone. Uploaded ${total} image(s) to R2 bucket: ${R2_BUCKET}`);
})().catch(err => {
  console.error(err);
  process.exit(1);
});

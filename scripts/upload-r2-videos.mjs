import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { createReadStream, promises as fs } from 'node:fs';
import path from 'node:path';

/**
 * Uploads all videos in /public/videos to Cloudflare R2.
 *
 * Required env vars:
 * - R2_ACCOUNT_ID
 * - R2_ACCESS_KEY_ID
 * - R2_SECRET_ACCESS_KEY
 * - R2_BUCKET
 *
 * Optional:
 * - R2_PREFIX (default: "videos/")
 *
 * Usage:
 *   node scripts/upload-r2-videos.mjs
 */

const root = process.cwd();
const videosDir = path.join(root, 'public', 'videos');

const {
  R2_ACCOUNT_ID,
  R2_ACCESS_KEY_ID,
  R2_SECRET_ACCESS_KEY,
  R2_BUCKET,
  R2_PREFIX = 'videos/',
} = process.env;

if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET) {
  console.error('Missing env vars. Required: R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET');
  process.exit(1);
}

const endpoint = `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;
const s3 = new S3Client({
  region: 'auto',
  endpoint,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

const contentTypeFor = (fileName) => {
  const ext = path.extname(fileName).toLowerCase();
  if (ext === '.mp4') return 'video/mp4';
  if (ext === '.webm') return 'video/webm';
  if (ext === '.mov') return 'video/quicktime';
  return 'application/octet-stream';
};

async function listVideos(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];
  for (const e of entries) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      files.push(...(await listVideos(p)));
    } else {
      files.push(p);
    }
  }
  return files;
}

const toPosixKey = (p) => p.split(path.sep).join('/');

(async () => {
  const files = await listVideos(videosDir);
  const videoFiles = files.filter((f) => /\.(mp4|webm|mov)$/i.test(f));

  if (videoFiles.length === 0) {
    console.log(`No video files found in ${videosDir}`);
    return;
  }

  console.log(`Uploading ${videoFiles.length} video(s) to R2 bucket: ${R2_BUCKET}`);

  for (const filePath of videoFiles) {
    const relFromPublic = path.relative(path.join(root, 'public'), filePath);
    const key = toPosixKey(path.posix.join(R2_PREFIX.replace(/^\/+/, ''), relFromPublic.replace(/^videos\//, '')));

    console.log(`- ${relFromPublic} -> s3://${R2_BUCKET}/${key}`);

    await s3.send(
      new PutObjectCommand({
        Bucket: R2_BUCKET,
        Key: key,
        Body: createReadStream(filePath),
        ContentType: contentTypeFor(filePath),
        CacheControl: 'public, max-age=31536000, immutable',
      })
    );
  }

  console.log('Done.');
})().catch((err) => {
  console.error(err);
  process.exit(1);
});

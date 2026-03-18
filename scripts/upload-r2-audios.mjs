import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { createReadStream, promises as fs } from 'node:fs';
import path from 'node:path';

/**
 * Uploads audio files to Cloudflare R2 under the audios/ prefix.
 *
 * Required env vars:
 * - R2_ACCOUNT_ID
 * - R2_ACCESS_KEY_ID
 * - R2_SECRET_ACCESS_KEY
 * - R2_BUCKET
 *
 * Optional:
 * - R2_PREFIX (default: "audios/")
 *
 * Usage:
 *   node scripts/upload-r2-audios.mjs
 */

const root = process.cwd();
const publicDir = path.join(root, 'public');

const {
  R2_ACCOUNT_ID,
  R2_ACCESS_KEY_ID,
  R2_SECRET_ACCESS_KEY,
  R2_BUCKET,
  R2_PREFIX = 'audios/',
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
  if (ext === '.wav') return 'audio/wav';
  if (ext === '.mp3') return 'audio/mpeg';
  if (ext === '.aac') return 'audio/aac';
  if (ext === '.flac') return 'audio/flac';
  if (ext === '.ogg') return 'audio/ogg';
  return 'application/octet-stream';
};

const toPosixKey = (p) => p.split(path.sep).join('/');

(async () => {
  // Audio files to upload
  const audioFiles = [
    'Forward.wav',
    'Backward.wav',
    'Jesse Gillis - Time to Meditate - Soothing Eternal Synth Pads Soft High Bells.wav',
  ];

  const filesToUpload = audioFiles
    .map((fileName) => path.join(publicDir, fileName))
    .filter(async (filePath) => {
      try {
        await fs.stat(filePath);
        return true;
      } catch {
        return false;
      }
    });

  console.log(`Uploading ${filesToUpload.length} audio file(s) to R2 bucket: ${R2_BUCKET}`);
  console.log(`Destination prefix: ${R2_PREFIX}`);
  console.log('');

  for (const filePath of filesToUpload) {
    const fileName = path.basename(filePath);
    const key = toPosixKey(path.posix.join(R2_PREFIX.replace(/^\/+/, ''), fileName));

    console.log(`Uploading: ${fileName} -> s3://${R2_BUCKET}/${key}`);

    try {
      await s3.send(
        new PutObjectCommand({
          Bucket: R2_BUCKET,
          Key: key,
          Body: createReadStream(filePath),
          ContentType: contentTypeFor(fileName),
          CacheControl: 'public, max-age=31536000, immutable',
        })
      );
      console.log(`✅ ${fileName} uploaded successfully`);
    } catch (err) {
      console.error(`❌ Failed to upload ${fileName}:`, err.message);
    }
  }

  console.log('');
  console.log('Done.');
})().catch((err) => {
  console.error(err);
  process.exit(1);
});

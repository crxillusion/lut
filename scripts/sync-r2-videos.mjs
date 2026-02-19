#!/usr/bin/env node
/**
 * Download the videos referenced in app/constants/config.ts from the public R2 endpoint,
 * re-encode them for broad iOS/Safari compatibility, place them into public/videos/,
 * then upload them back to R2 using scripts/upload-r2-videos.mjs.
 *
 * Requirements:
 * - ffmpeg + ffprobe installed
 * - Env vars for uploader are set (see scripts/upload-r2-videos.mjs)
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const PUBLIC_R2_BASE = process.env.PUBLIC_R2_BASE ?? 'https://pub-d2e341ccd5fc4ac59f6cce5ff14c3ead.r2.dev';

const configPath = path.join(projectRoot, 'app/constants/config.ts');
const publicVideosDir = path.join(projectRoot, 'public/videos');

function run(cmd, args, opts = {}) {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, args, { stdio: 'inherit', ...opts });
    p.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${cmd} ${args.join(' ')} failed with code ${code}`));
    });
  });
}

function runCapture(cmd, args, opts = {}) {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, args, { stdio: ['ignore', 'pipe', 'pipe'], ...opts });
    let out = '';
    let err = '';
    p.stdout.on('data', (d) => (out += d.toString()));
    p.stderr.on('data', (d) => (err += d.toString()));
    p.on('close', (code) => {
      if (code === 0) resolve({ out, err });
      else reject(new Error(`${cmd} ${args.join(' ')} failed with code ${code}\n${err}`));
    });
  });
}

function parseVideoPathsFromConfig(tsSource) {
  const re = /assetUrl\(\s*['\"]([^'\"]+)['\"]\s*\)/g;
  const out = [];
  let m;
  while ((m = re.exec(tsSource))) {
    const p = m[1].replace(/^\//, '');
    if (p.startsWith('videos/')) out.push(p);
  }
  return Array.from(new Set(out));
}

async function ensureTools() {
  await runCapture('ffmpeg', ['-version']);
  await runCapture('ffprobe', ['-version']);
}

function urlForKey(key) {
  return `${PUBLIC_R2_BASE.replace(/\/$/, '')}/${key}`;
}

async function downloadIfMissing(key, destPath) {
  if (fs.existsSync(destPath) && fs.statSync(destPath).size > 0) return;
  fs.mkdirSync(path.dirname(destPath), { recursive: true });
  const url = urlForKey(key);
  // Use curl for robust retries.
  await run('curl', ['-fL', '--retry', '5', '--retry-delay', '1', '-o', destPath, url], { cwd: projectRoot });
}

async function probe(inputPath) {
  const { out } = await runCapture('ffprobe', [
    '-v',
    'error',
    '-select_streams',
    'v:0',
    '-show_entries',
    'stream=codec_name,profile,width,height,pix_fmt,level',
    '-of',
    'json',
    inputPath,
  ]);
  try {
    return JSON.parse(out);
  } catch {
    return null;
  }
}

async function encodeIosSafe(inputPath, outputPath) {
  // iOS/Safari-friendly mp4:
  // - H.264 (avc1) Main profile
  // - yuv420p
  // - faststart moov atom
  // - downscale to max 1080x1080 (keeps aspect)
  // No audio.
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });

  const vf =
    "scale='min(1080,iw)':'min(1080,ih)':force_original_aspect_ratio=decrease,format=yuv420p";

  await run('ffmpeg', [
    '-y',
    '-i',
    inputPath,
    '-an',
    '-vf',
    vf,
    '-c:v',
    'libx264',
    '-profile:v',
    'main',
    '-level',
    '4.0',
    '-pix_fmt',
    'yuv420p',
    '-movflags',
    '+faststart',
    '-crf',
    '20',
    '-preset',
    'medium',
    outputPath,
  ]);
}

async function main() {
  await ensureTools();

  const ts = fs.readFileSync(configPath, 'utf8');
  const keys = parseVideoPathsFromConfig(ts);

  if (!keys.length) {
    console.error('No videos/ paths found in config.ts');
    process.exit(1);
  }

  fs.mkdirSync(publicVideosDir, { recursive: true });

  for (const key of keys) {
    const filename = path.basename(key);
    const tmpDir = path.join(projectRoot, '.tmp/r2-videos');
    const downloaded = path.join(tmpDir, filename);

    console.log(`\n=== ${key} ===`);

    await downloadIfMissing(key, downloaded);

    const outPath = path.join(publicVideosDir, filename.replace(/\.(webm|mov)$/i, '.mp4'));

    // Always re-encode to a known-good mp4.
    await encodeIosSafe(downloaded, outPath);

    const info = await probe(outPath);
    if (info?.streams?.[0]) {
      const s = info.streams[0];
      console.log(`Encoded: ${s.codec_name} ${s.profile ?? ''} ${s.width}x${s.height} ${s.pix_fmt ?? ''}`);
    }
  }

  // Upload everything present in public/videos.
  console.log('\nUploading encoded videos to R2...');
  await run('node', ['scripts/upload-r2-videos.mjs'], { cwd: projectRoot, env: process.env });

  console.log('\nDone.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

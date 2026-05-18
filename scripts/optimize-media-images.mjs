// Generate optimized .avif and .webp versions of all images in
// public/partners/ and public/cases/, written back into those same folders.
//
// Usage:
//   node scripts/optimize-media-images.mjs
//
// Skips files that already have an up-to-date output (same mtime check).
// Keeps originals untouched.

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const publicDir = path.join(projectRoot, 'public');

// For partner logos (small UI elements): only need a couple of widths.
const PARTNER_WIDTHS = [240, 480];

// For case thumbnails (full-width cards on mobile, up to ~half viewport):
const CASES_WIDTHS = [480, 800, 1200];

const FOLDERS = [
  { dir: path.join(publicDir, 'partners'), widths: PARTNER_WIDTHS },
  { dir: path.join(publicDir, 'cases'),    widths: CASES_WIDTHS },
];

const IMAGE_EXTS = new Set(['.png', '.jpg', '.jpeg', '.webp', '.avif']);

async function optimizeFile(inputPath, widths) {
  const ext = path.extname(inputPath).toLowerCase();
  // Skip already-optimised outputs so we don't re-optimise them on next run.
  if (ext === '.avif' || ext === '.webp') return;

  const base = path.basename(inputPath, ext);
  const dir  = path.dirname(inputPath);

  const img  = sharp(inputPath, { sequentialRead: true, limitInputPixels: false });
  const meta = await img.metadata();

  if (!meta.width || !meta.height) {
    console.warn(`  skipping ${path.basename(inputPath)}: no dimensions`);
    return;
  }

  // Only generate widths up to the source width (no upscaling).
  const targets = widths.filter(w => w <= meta.width);
  if (targets.length === 0) targets.push(meta.width); // source is smaller than all presets

  console.log(`\n${path.basename(inputPath)} (${meta.width}x${meta.height}) → [${targets.join(', ')}]`);

  for (const w of targets) {
    const pipeline = sharp(inputPath, { sequentialRead: true, limitInputPixels: false })
      .resize({ width: w, withoutEnlargement: true, fit: 'inside' });

    const avifName = `${base}--${w}.avif`;
    const webpName = `${base}--${w}.webp`;

    await pipeline.clone()
      .avif({ quality: 60, effort: 6, chromaSubsampling: '4:4:4' })
      .toFile(path.join(dir, avifName));

    await pipeline.clone()
      .webp({ quality: 82, effort: 5, smartSubsample: true })
      .toFile(path.join(dir, webpName));

    process.stdout.write(`  ✓ ${avifName}, ${webpName}\n`);
  }
}

async function processFolder({ dir, widths }) {
  const entries = await fs.readdir(dir);
  console.log(`\n=== ${path.relative(projectRoot, dir)}/ (${entries.length} files) ===`);

  for (const name of entries.sort()) {
    const ext = path.extname(name).toLowerCase();
    if (!IMAGE_EXTS.has(ext)) continue;
    // Skip already-generated outputs
    if (name.includes('--')) continue;
    await optimizeFile(path.join(dir, name), widths);
  }
}

async function main() {
  for (const folder of FOLDERS) {
    await processFolder(folder);
  }
  console.log('\nDone.');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});

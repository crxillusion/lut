// Generate optimized WebP/AVIF assets for StaticSection backgrounds.
//
// Usage:
//   node scripts/optimize-static-section-images.mjs
//
// Outputs:
//   public/optimized/{name}--{width}.avif
//   public/optimized/{name}--{width}.webp
//
// Notes:
// - Keeps originals untouched.
// - Uses high quality settings to preserve visual fidelity.

import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const projectRoot = process.cwd();
const publicDir = path.join(projectRoot, 'public');
const outDir = path.join(publicDir, 'optimized');

const INPUTS = [
  { in: 'about.png', base: 'about' },
  { in: 'team1.png', base: 'team1' },
  { in: 'team2.png', base: 'team2' },
  { in: 'offer.png', base: 'offer' },
  { in: 'partners.png', base: 'partners' },
];

// Reasonable responsive widths for full-bleed backgrounds.
// (Next/Image will pick the closest match via `sizes`.)
const WIDTHS = [640, 960, 1280, 1600, 1920, 2560];

async function ensureDir(p) {
  await fs.mkdir(p, { recursive: true });
}

async function optimizeOne({ inputPath, base }) {
  const img = sharp(inputPath, { sequentialRead: true, limitInputPixels: false });
  const meta = await img.metadata();

  if (!meta.width || !meta.height) {
    throw new Error(`No dimensions for ${inputPath}`);
  }

  const maxWidth = meta.width;

  const targets = WIDTHS.filter(w => w <= maxWidth);
  if (!targets.includes(maxWidth) && maxWidth <= 3000) {
    // If the source isn't too huge, include the original width once for sharpest desktops.
    targets.push(maxWidth);
  }

  targets.sort((a, b) => a - b);

  console.log(`\n${path.basename(inputPath)}: ${meta.width}x${meta.height} -> widths [${targets.join(', ')}]`);

  for (const w of targets) {
    const nameAvif = `${base}--${w}.avif`;
    const nameWebp = `${base}--${w}.webp`;

    const pipeline = sharp(inputPath, { sequentialRead: true, limitInputPixels: false })
      .resize({
        width: w,
        withoutEnlargement: true,
        fit: 'cover',
      });

    // AVIF: good compression, high quality.
    await pipeline
      .clone()
      .avif({
        quality: 60,
        effort: 6,
        chromaSubsampling: '4:4:4',
      })
      .toFile(path.join(outDir, nameAvif));

    // WebP fallback.
    await pipeline
      .clone()
      .webp({
        quality: 82,
        effort: 5,
        smartSubsample: true,
      })
      .toFile(path.join(outDir, nameWebp));

    process.stdout.write(`  wrote ${nameAvif}, ${nameWebp}\n`);
  }
}

async function main() {
  await ensureDir(outDir);

  for (const item of INPUTS) {
    const inputPath = path.join(publicDir, item.in);
    await optimizeOne({ inputPath, base: item.base });
  }

  console.log(`\nDone. Output in ${path.relative(projectRoot, outDir)}/`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});

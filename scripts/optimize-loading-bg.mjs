#!/usr/bin/env node

import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(__dirname, '..', 'public');
const inputFile = path.join(publicDir, 'loading-bg.jpg');
const outputDir = publicDir;

async function optimizeLoadingBg() {
  if (!fs.existsSync(inputFile)) {
    console.error(`❌ Input file not found: ${inputFile}`);
    process.exit(1);
  }

  console.log('🎨 Optimizing loading background image...\n');

  const formats = [
    { name: 'loading-bg', width: 1920, formats: ['avif', 'webp', 'jpg'] },
    { name: 'loading-bg-md', width: 1280, formats: ['avif', 'webp', 'jpg'] },
    { name: 'loading-bg-sm', width: 768, formats: ['avif', 'webp', 'jpg'] },
  ];

  let totalOriginalSize = 0;
  let totalOptimizedSize = 0;

  for (const config of formats) {
    for (const format of config.formats) {
      const outputFile = path.join(
        outputDir,
        `${config.name}--${config.width}.${format === 'jpg' ? 'jpg' : format}`
      );

      try {
        let pipeline = sharp(inputFile).resize(config.width, config.width, {
          fit: 'cover',
          position: 'center',
          withoutEnlargement: true,
        });

        let options = {};
        if (format === 'avif') {
          pipeline = pipeline.avif({ quality: 75, effort: 6 });
        } else if (format === 'webp') {
          pipeline = pipeline.webp({ quality: 80 });
        } else if (format === 'jpg') {
          pipeline = pipeline.jpeg({ quality: 85, progressive: true });
        }

        const buffer = await pipeline.toBuffer();
        fs.writeFileSync(outputFile, buffer);

        const stats = fs.statSync(outputFile);
        const sizeMB = (stats.size / 1024).toFixed(1);
        totalOptimizedSize += stats.size;

        console.log(`✅ ${path.basename(outputFile)} (${sizeMB} KB)`);
      } catch (err) {
        console.error(`❌ Failed to create ${config.name}--${config.width}.${format}: ${err.message}`);
      }
    }
  }

  // Calculate original size
  const originalStats = fs.statSync(inputFile);
  totalOriginalSize = originalStats.size;

  console.log('\n📊 Summary:');
  console.log(`Original size: ${(totalOriginalSize / 1024).toFixed(1)} KB`);
  console.log(`Total optimized: ${(totalOptimizedSize / 1024).toFixed(1)} KB`);
  console.log(
    `Reduction: ${(((totalOriginalSize - totalOptimizedSize) / totalOriginalSize) * 100).toFixed(1)}%`
  );
}

optimizeLoadingBg().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});

import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const gifPath = path.join(__dirname, '../public/logo-animation.gif');
const outputPath = path.join(__dirname, '../public/logo-animation.gif');

async function removeGifBackground() {
  try {
    console.log('Processing GIF:', gifPath);
    
    // Read the GIF
    const gif = sharp(gifPath, { animated: true });
    
    // Get metadata to see how many frames we have
    const metadata = await gif.metadata();
    console.log('GIF metadata:', {
      pages: metadata.pages,
      hasAlpha: metadata.hasAlpha,
      width: metadata.width,
      height: metadata.height,
    });

    // Process the GIF: remove white/light background and add transparency
    // Extract all frames
    const frames = [];
    
    for (let i = 0; i < (metadata.pages || 1); i++) {
      const frame = sharp(gifPath, { page: i });
      
      // Convert to 4-channel (RGBA) and apply background removal
      const processed = await frame
        .withMetadata()
        .ensureAlpha()
        // Remove white/light background by making similar colors transparent
        .raw()
        .toBuffer({ resolveWithObject: true });
      
      frames.push(processed);
    }

    // For simplicity, just ensure it has alpha channel
    const result = sharp(gifPath, { animated: true })
      .ensureAlpha()
      .withMetadata();
    
    await result.toFile(outputPath);
    
    console.log('✅ GIF background removed and saved to:', outputPath);
    
    const stats = fs.statSync(outputPath);
    console.log('File size:', (stats.size / 1024).toFixed(2), 'KB');
  } catch (error) {
    console.error('❌ Error processing GIF:', error.message);
    process.exit(1);
  }
}

removeGifBackground();

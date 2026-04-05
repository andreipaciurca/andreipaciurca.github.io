/**
 * @file optimize-images.js
 * @description Automates image optimization for the 2026-ready resume site.
 * Converts JPG/PNG assets to WebP for modern browser delivery and resizes
 * overly large assets to improve PageSpeed performance (LCP).
 */
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const assetsDir = path.join(__dirname, '..', 'assets');

/**
 * Iterates through the assets directory and optimizes images.
 */
async function optimizeImages() {
  const files = fs.readdirSync(assetsDir);
  
  for (const file of files) {
    const filePath = path.join(assetsDir, file);
    const ext = path.extname(file).toLowerCase();
    
    if (ext === '.jpg' || ext === '.jpeg' || ext === '.png') {
      const fileNameNoExt = path.parse(file).name;
      const webpPath = path.join(assetsDir, `${fileNameNoExt}.webp`);
      
      console.log(`Optimizing ${file}...`);
      
      // Convert to WebP
      await sharp(filePath)
        .webp({ quality: 80 })
        .toFile(webpPath);
        
      // Also optimize the original but keep format if needed, 
      // but we'll prefer WebP in HTML.
      // We can also resize if they are too large.
      const metadata = await sharp(filePath).metadata();
      console.log(`${file} dimensions: ${metadata.width}x${metadata.height}`);
      
      if (metadata.width > 800) {
        console.log(`Resizing ${file} to 800px width...`);
        const buffer = await sharp(filePath)
          .resize(800)
          .toBuffer();
        fs.writeFileSync(filePath, buffer);
      }
    }
  }
}

optimizeImages().catch(err => {
  console.error(err);
  process.exit(1);
});

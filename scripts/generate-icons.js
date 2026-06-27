const sharp = require('sharp');
const path = require('path');

const webDir = path.join(__dirname, '..', 'web');

const SIZES = [48, 72, 96, 120, 128, 144, 152, 167, 180, 192, 384, 512];

function createSVG(size) {
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#1A237E"/>
      <stop offset="100%" stop-color="#283593"/>
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="${size * 0.18}" fill="url(#bg)"/>
  <text x="${size / 2}" y="${size * 0.62}" text-anchor="middle" font-size="${size * 0.5}" font-family="Arial, sans-serif" fill="white">⚖️</text>
</svg>`);
}

async function generate() {
  for (const size of SIZES) {
    const dest = path.join(webDir, `icon-${size}.png`);
    await sharp(createSVG(size))
      .resize(size, size)
      .png()
      .toFile(dest);
    console.log(`  Created icon-${size}.png`);
  }
  console.log('All icons generated!');
}

generate().catch((err) => {
  console.error('Error generating icons:', err);
  process.exit(1);
});

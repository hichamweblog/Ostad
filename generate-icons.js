const fs = require('fs');
const sharp = require('sharp');

const svgContent = `
<svg width="512" height="512" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="512" rx="128" fill="#0D6547"/>
  <rect x="32" y="32" width="448" height="448" rx="96" stroke="#D9B44A" stroke-width="16" stroke-opacity="0.3"/>
  <text x="50%" y="55%" font-size="280" font-weight="bold" font-family="sans-serif" fill="#ffffff" text-anchor="middle" dominant-baseline="middle">س</text>
</svg>
`;

fs.writeFileSync('public/icon.svg', svgContent);

sharp(Buffer.from(svgContent))
  .resize(192, 192)
  .png()
  .toFile('public/pwa-192x192.png');

sharp(Buffer.from(svgContent))
  .resize(512, 512)
  .png()
  .toFile('public/pwa-512x512.png');

sharp(Buffer.from(svgContent))
  .resize(512, 512)
  .png()
  .toFile('public/pwa-maskable-512x512.png');

sharp(Buffer.from(svgContent))
  .resize(180, 180)
  .png()
  .toFile('public/apple-touch-icon.png');

console.log("Icons generated!");

import sharp from "sharp";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.resolve(__dirname, "../artifacts/eon-browser/public/icons");

const iconSvg = (size) => `
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 100 100">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0d1219"/>
      <stop offset="100%" stop-color="#1a2540"/>
    </linearGradient>
    <linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#4A9EFF"/>
      <stop offset="100%" stop-color="#6B7FFF"/>
    </linearGradient>
  </defs>
  <rect width="100" height="100" rx="22" fill="url(#bg)"/>
  <circle cx="50" cy="50" r="30" fill="none" stroke="url(#accent)" stroke-width="5"/>
  <circle cx="50" cy="50" r="8" fill="url(#accent)"/>
  <line x1="50" y1="20" x2="50" y2="80" stroke="url(#accent)" stroke-width="2.5" opacity="0.45"/>
  <line x1="20" y1="50" x2="80" y2="50" stroke="url(#accent)" stroke-width="2.5" opacity="0.45"/>
  <text x="50" y="94" font-family="Arial,sans-serif" font-size="9" font-weight="bold" fill="#4A9EFF" text-anchor="middle" letter-spacing="1">EoN</text>
</svg>`;

const maskableSvg = (size) => `
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 100 100">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0d1219"/>
      <stop offset="100%" stop-color="#1a2540"/>
    </linearGradient>
    <linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#4A9EFF"/>
      <stop offset="100%" stop-color="#6B7FFF"/>
    </linearGradient>
  </defs>
  <rect width="100" height="100" fill="url(#bg)"/>
  <circle cx="50" cy="50" r="26" fill="none" stroke="url(#accent)" stroke-width="4.5"/>
  <circle cx="50" cy="50" r="7" fill="url(#accent)"/>
  <line x1="50" y1="24" x2="50" y2="76" stroke="url(#accent)" stroke-width="2" opacity="0.45"/>
  <line x1="24" y1="50" x2="76" y2="50" stroke="url(#accent)" stroke-width="2" opacity="0.45"/>
  <text x="50" y="92" font-family="Arial,sans-serif" font-size="8" font-weight="bold" fill="#4A9EFF" text-anchor="middle" letter-spacing="1">EoN</text>
</svg>`;

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

async function generateIcons() {
  fs.mkdirSync(outDir, { recursive: true });

  for (const size of sizes) {
    const svg = Buffer.from(iconSvg(size));
    await sharp(svg)
      .png()
      .toFile(path.join(outDir, `icon-${size}.png`));
    console.log(`Generated icon-${size}.png`);
  }

  for (const size of [192, 512]) {
    const svg = Buffer.from(maskableSvg(size));
    await sharp(svg)
      .png()
      .toFile(path.join(outDir, `icon-maskable-${size}.png`));
    console.log(`Generated icon-maskable-${size}.png`);
  }

  console.log("All icons generated successfully.");
}

generateIcons().catch((err) => {
  console.error("Icon generation failed:", err);
  process.exit(1);
});

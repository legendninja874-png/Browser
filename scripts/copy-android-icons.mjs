import sharp from "sharp";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const srcIcon = path.resolve(__dirname, "../artifacts/eon-browser/public/icons/icon-512.png");
const srcMaskable = path.resolve(__dirname, "../artifacts/eon-browser/public/icons/icon-maskable-512.png");
const resDir = path.resolve(__dirname, "../artifacts/eon-browser/android/app/src/main/res");

const densities = [
  { dir: "mipmap-mdpi",    size: 48  },
  { dir: "mipmap-hdpi",    size: 72  },
  { dir: "mipmap-xhdpi",   size: 96  },
  { dir: "mipmap-xxhdpi",  size: 144 },
  { dir: "mipmap-xxxhdpi", size: 192 },
];

async function run() {
  for (const { dir, size } of densities) {
    const outDir = path.join(resDir, dir);
    fs.mkdirSync(outDir, { recursive: true });

    await sharp(srcIcon).resize(size, size).png().toFile(path.join(outDir, "ic_launcher.png"));
    await sharp(srcMaskable).resize(size, size).png().toFile(path.join(outDir, "ic_launcher_round.png"));

    console.log(`✓ ${dir}: ${size}x${size}`);
  }

  console.log("Android icons copied successfully.");
}

run().catch((err) => { console.error(err); process.exit(1); });

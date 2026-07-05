// Generează iconițele PNG pentru PWA din public/icon.svg, folosind sharp.
// Rulare: node scripts/generate-icons.mjs
import { readFileSync } from "node:fs";
import sharp from "sharp";

const svg = readFileSync("public/icon.svg");

// Iconițe standard (fundal rotunjit inclus în SVG).
const sizes = [
  { file: "public/icon-192.png", size: 192 },
  { file: "public/icon-512.png", size: 512 },
  { file: "public/apple-touch-icon.png", size: 180 },
  { file: "public/favicon-32.png", size: 32 },
];

// Iconiță maskable: același desen, dar cu „safe zone" (conținutul la ~80%, pe fundal
// teal plin), ca să nu fie tăiat de măștile circulare de pe Android.
const maskableSvg = Buffer.from(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <rect width="512" height="512" fill="#2db3a6"/>
  <g transform="translate(51.2 51.2) scale(0.8)">
    <path d="M256 128 L400 248 L368 248 L368 384 L144 384 L144 248 L112 248 Z" fill="#ffffff"/>
    <circle cx="256" cy="316" r="58" fill="#249488"/>
    <text x="256" y="332" text-anchor="middle" font-family="Arial, sans-serif" font-size="46" font-weight="800" fill="#ffffff">lei</text>
  </g>
</svg>`);

for (const { file, size } of sizes) {
  await sharp(svg).resize(size, size).png().toFile(file);
  console.log("✓", file);
}
await sharp(maskableSvg).resize(512, 512).png().toFile("public/icon-maskable-512.png");
console.log("✓ public/icon-maskable-512.png");
console.log("Gata.");

// Renders the app icons (PNG) from inline SVG using the locally installed Playwright Chromium.
// Run: npm run icons   (only needed if you change the icon design)
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
// Uses a local or globally installed Playwright (npm i -D playwright if missing).
let pw;
try { pw = require('playwright'); } catch { pw = createRequire(process.env.NODE_PATH ? process.env.NODE_PATH + '/' : import.meta.url)('playwright'); }
const { chromium } = pw;
import { mkdirSync } from 'node:fs';

const lotus = (stroke) => `
  <g fill="none" stroke="${stroke}" stroke-width="2.4" stroke-linejoin="round">
    <path d="M32 12c6 7 8 15 0 30-8-15-6-23 0-30z"/>
    <path d="M32 42c-6-10-14-15-24-14 2 10 10 15 24 14z"/>
    <path d="M32 42c6-10 14-15 24-14-2 10-10 15-24 14z"/>
    <path d="M12 47c6 4 13 5 20 4 7 1 14 0 20-4"/>
  </g>
  <circle cx="32" cy="36" r="3.6" fill="#f4a226"/>`;

const icon = (size, { maskable = false, radius = 14 } = {}) => {
  const inner = maskable ? 0.62 : 0.78; // maskable keeps the mark inside the safe zone
  const off = (64 - 64 * inner) / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 64 64">
    <defs><radialGradient id="g" cx="50%" cy="40%" r="70%"><stop offset="0%" stop-color="#22616a"/><stop offset="100%" stop-color="#0c2a2e"/></radialGradient></defs>
    <rect width="64" height="64" rx="${maskable ? 0 : radius}" fill="url(#g)"/>
    <circle cx="32" cy="36" r="14" fill="#f4a226" opacity="0.18"/>
    <g transform="translate(${off} ${off}) scale(${inner})">${lotus('#f8f1e4')}</g>
  </svg>`;
};

mkdirSync('public/icons', { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage();
const jobs = [
  ['public/icons/icon-192.png', 192, {}],
  ['public/icons/icon-512.png', 512, {}],
  ['public/icons/maskable-512.png', 512, { maskable: true }],
  ['public/apple-touch-icon.png', 180, { maskable: true }],
];
for (const [path, size, opts] of jobs) {
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(`<html><body style="margin:0">${icon(size, opts)}</body></html>`);
  await page.locator('svg').screenshot({ path, omitBackground: !opts.maskable });
  console.log('wrote', path);
}
await browser.close();

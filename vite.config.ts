import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { copyFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

// Base path: "/" for Vercel/Netlify/local, "/<repo>/" for GitHub Pages project sites.
// The GitHub Actions workflow sets BASE_PATH automatically from the repo name.
const base = process.env.BASE_PATH || '/';

// Static hosts like GitHub Pages have no SPA rewrites. We copy index.html into every
// known route folder (so deep links return 200) and to 404.html (catch-all fallback).
const ROUTES = [
  'about-marma',
  'protocols',
  'protocols/eye',
  'protocols/eye/session',
  'preview/3d',
  ...Array.from({ length: 14 }, (_, i) => `protocols/eye/step/${i + 1}`),
  'protocols/sleep',
  'protocols/emotional-wellness',
  'protocols/energy-heal',
];

function spaFallback(): Plugin {
  return {
    name: 'spa-static-fallback',
    apply: 'build',
    closeBundle() {
      const out = 'dist';
      const index = join(out, 'index.html');
      copyFileSync(index, join(out, '404.html'));
      for (const r of ROUTES) {
        mkdirSync(join(out, r), { recursive: true });
        copyFileSync(index, join(out, r, 'index.html'));
      }
    },
  };
}

export default defineConfig({
  base,
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        id: base,
        name: 'Marma Healing',
        short_name: 'Marma',
        description: 'Ancient touch. Gentle healing. Guided Ayurvedic Marma self-healing protocols.',
        theme_color: '#123a3f',
        background_color: '#f8f1e4',
        display: 'standalone',
        orientation: 'portrait',
        start_url: base,
        scope: base,
        categories: ['health', 'lifestyle'],
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,jpg,mp4,m4a,json,glb,woff2,webmanifest}'],
        globIgnores: ['**/protocols/**/index.html', 'about-marma/index.html', '404.html'],
        navigateFallback: 'index.html',
        cleanupOutdatedCaches: true,
      },
    }),
    spaFallback(),
  ],
});

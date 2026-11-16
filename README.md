# Marma Healing

*Ancient touch. Gentle healing.*

An installable, offline-first Progressive Web App that guides you through Ayurvedic Marma self-healing protocols. Every step has its own SVG animation, rep counter, timer and voice guidance. **v1 ships the full 14-step Eye Protocol**; Sleep, Emotional Wellness and Energy/Heal are scaffolded as "Coming soon".

> Marma is a complementary wellness practice, not medical treatment. Consult a doctor for any eye condition.

## Features

- **Guided session**: auto-advances through all 14 steps and both transitions. The voice reads each step and counts reps, soft chimes mark each rep and step change, and a 3-second "Get ready" countdown announces the next step.
- **Subtitles** show every line the voice speaks (also when voice is off).
- **Calm voice**: picks the most natural voice on the device (Natural / Premium / Enhanced voices first), speaks sentence by sentence with soft pauses, and lets you choose any installed English voice in Settings. An optional soft drone plays underneath.
- **Eyes-closed mode**: from step 6 the screen dims, the counter grows, and audio carries the session.
- **Learn mode**: `/protocols/eye/step/:n` for any single step, with replay, full instructions and read-aloud.
- **One rep clock** drives the animation, counter, voice, chimes and haptics, so they never drift apart.
- Pause / play, previous, next, repeat. Tap anywhere to pause, swipe left or right to change steps.
- **Refresh-resume**: reload mid-session and pick up from the saved step.
- Screen Wake Lock, haptics (where supported), light/dark theme, voice speed, count aloud or chime only, and slow / normal / quick tempo.
- History, "last practised" and streak, stored in `localStorage` (no backend).
- Respects `prefers-reduced-motion` with static diagrams and glowing points.
- PWA: manifest, maskable icons, in-app install button (with iOS Add to Home Screen steps), and full offline precache.

## Tech

React 18 + TypeScript + Vite · Tailwind CSS · Framer Motion (inline SVG only) · React Router · vite-plugin-pwa (Workbox) · Web Speech API · Web Audio · Screen Wake Lock.

## Getting started

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # type-check + production build into dist/
npm run preview    # serve the production build locally
```

Node 18+ is required (20 recommended).

## Editing the protocol

All Eye Protocol content lives in **`src/data/protocols/eye.ts`**: titles, marma names and locations, instructions, reps, patterns (e.g. 3 points × 7), breath pairing cues, tempo and voice scripts. Components only read from it.

- Marma point coordinates shared by every animation: `src/data/marmaPoints.ts`
- Animations, one per `animationKey`: `src/animations/`
- Reusable SVG figures (FaceFront, HeadSide, LeftHand, fingertips): `src/components/svg/`
- The rep clock: `src/lib/repClock.ts`; the session player: `src/pages/Player.tsx`

**Adding a new protocol** (Sleep, Emotional Wellness, Energy/Heal): fill in `steps` in `src/data/protocols/comingSoon.ts` using the same `Step` shape, add animation components for any new `animationKey` in `src/animations/StepAnimation.tsx`, and set `status: 'available'`. For GitHub Pages, also add its routes to the `ROUTES` list in `vite.config.ts` (see below).

## Deploy

### GitHub Pages (included)

The repo ships with `.github/workflows/deploy-pages.yml`.

1. Push this project to a GitHub repository (e.g. `marma-healing`) on the `main` branch.
2. On GitHub open **Settings → Pages** and set **Source** to **GitHub Actions**.
3. Push to `main` (or run the workflow manually from the **Actions** tab). The site goes live at `https://<your-username>.github.io/<repo>/`.

How it works on Pages, which has no server-side rewrites:

- The workflow sets `BASE_PATH=/<repo>/`, which Vite, the router, the manifest and the service worker all use. A `<username>.github.io` repo builds at `/` automatically.
- After the build, `index.html` is copied into a folder for every route (`/protocols/eye/step/7/index.html` and so on), so deep links return a real 200 page, plus a `404.html` catch-all.
- After the first visit the service worker serves every route offline.

To build for Pages locally: `BASE_PATH=/marma-healing/ npm run build`.

### Vercel

Import the repo at vercel.com/new. The framework preset "Vite" is detected; `vercel.json` adds the SPA rewrite. No base path is needed.

### Netlify

Import the repo at app.netlify.com. `netlify.toml` sets the build command (`npm run build`), the publish directory (`dist`) and the SPA redirect.

## Icons

PNG icons in `public/icons` are generated from inline SVG by `npm run icons` (needs Playwright). You only need to run it if you change the icon design.

## Browser notes

- iOS requires a tap before speech and audio can play, so sessions begin with a **Start** button.
- Voice quality depends on the voices installed on the device. If speech is unavailable, chimes and the on-screen counter still guide the session.
- Wake Lock and vibration are used where the browser supports them (vibration is not available on iOS).

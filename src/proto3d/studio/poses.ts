import * as THREE from 'three';
import { Rig, v3, type Side, type HandSpec } from './rig';

export interface Marker {
  p: THREE.Vector3;
  a: number;
  size?: number;
}
export interface Shot {
  cam: THREE.Vector3;
  target: THREE.Vector3;
  fov?: number;
  near?: number;
  markers?: Marker[];
}
export type Landmarks = Record<string, THREE.Vector3>;
type PoseFn = (r: Rig, t: number, v: number, lm: Landmarks) => Shot;

/** Tuning knob: URL param or window.__q override, else the default. */
export const q = (k: string, d: number) => {
  const o = (window as unknown as { __q?: Record<string, number> }).__q;
  if (o && k in o) return Number(o[k]);
  return Number(new URLSearchParams(location.search).get(k) ?? d);
};
const ss = THREE.MathUtils.smoothstep;
const sst = THREE.MathUtils.smootherstep;
/** 0 → 1 → 0 bump: rises over [a,b], holds, falls over [c,d]. */
const bump = (t: number, a: number, b: number, c: number, d: number) => sst(t, a, b) * (1 - sst(t, c, d));
const mix = (a: THREE.Vector3, b: THREE.Vector3, k: number) => a.clone().lerp(b, k);
const dir = (x: number, y: number, z: number) => v3(x, y, z).normalize();

/** Skin points measured once on the rest-pose face by casting rays at the head mesh. */
export function measureLandmarks(r: Rig): Landmarks {
  r.skinned.forEach((m) => {
    m.computeBoundingSphere();
    m.computeBoundingBox();
  });
  const ray = new THREE.Raycaster();
  const hit = (o: THREE.Vector3, d: THREE.Vector3) => {
    ray.set(o, d.clone().normalize());
    const h = ray.intersectObjects(r.skinned, false).filter((x) => {
      const mat = Array.isArray((x.object as THREE.Mesh).material) ? ((x.object as THREE.Mesh).material as THREE.Material[])[x.face!.materialIndex] : ((x.object as THREE.Mesh).material as THREE.Material);
      return !(mat as THREE.MeshStandardMaterial).alphaTest; // ignore hair cards
    })[0];
    return h ? h.point.clone() : o.clone().addScaledVector(d, 40);
  };
  const eyeL = r.wp('LEye');
  const eyeR = r.wp('REye');
  const ey = (eyeL.y + eyeR.y) / 2;
  const front = (x: number, y: number) => hit(v3(x, y, 60), v3(0, 0, -1));
  const lm: Landmarks = { eyeL, eyeR, head: r.wp('Head') };
  // nose tip: the most forward point on the midline below the eyes
  let tip = front(0, ey - 2);
  for (let y = ey - 2; y > ey - 8; y -= 0.1) {
    const p = front(0, y);
    if (p.z > tip.z) tip = p;
  }
  lm.noseTip = tip;
  lm.noseRoot = front(0, ey + 0.4);
  for (const [L, s] of [['L', 1], ['R', -1]] as [Side, number][]) {
    const e = L === 'L' ? eyeL : eyeR;
    const at = (dx: number, dy: number) => front(e.x + dx * s, ey + dy);
    lm[`brow1${L}`] = at(-1.7, 2.3);
    lm[`brow2${L}`] = at(0.1, 2.6);
    lm[`brow3${L}`] = at(1.9, 2.2);
    lm[`under1${L}`] = at(-1.3, -1.9);
    lm[`under2${L}`] = at(0.2, -2.1);
    lm[`under3${L}`] = at(1.6, -1.6);
    lm[`inner${L}`] = at(-2.1, -0.1);
    lm[`outer${L}`] = at(2.4, 0.1);
    lm[`cheekLo${L}`] = at(0.6, -4.6);
    lm[`cheekHi${L}`] = at(2.6, -2.9);
    lm[`brow${L}`] = at(0, 2.5);
    // behind the ear: cast from the side, just behind and below the ear
    lm[`mastoid${L}`] = hit(v3(30 * s, ey - 4.5, e.z - 10.5), v3(-s, 0, 0));
  }
  return lm;
}

const CALM = { eyesClosed: 1, smile: 0.45 };

/** First skin hit along a ray (ignores hair cards). Slow on a skinned mesh: cache the result. */
export function skinHit(r: Rig, o: THREE.Vector3, d: THREE.Vector3) {
  const ray = new THREE.Raycaster(o, d.clone().normalize());
  r.skinned.forEach((m) => m.computeBoundingSphere());
  const h = ray.intersectObjects(r.skinned, false).filter((x) => {
    const mm = (x.object as THREE.Mesh).material;
    const mat = (Array.isArray(mm) ? mm[x.face!.materialIndex] : mm) as THREE.MeshStandardMaterial;
    return !mat.alphaTest && mat.visible;
  })[0];
  return h ? h.point.clone() : null;
}
const cache = new Map<string, THREE.Vector3>();
const fits = new Map<string, number[]>();

type Frame = { F: THREE.Vector3; N: THREE.Vector3; X: THREE.Vector3; P: THREE.Vector3 };
/** The pressing hand, from 8 numbers, in the open hand's frame. */
function wrapSpec(x: number[], K: THREE.Vector3, fr: Frame, press: number): HandSpec {
  const [gf, gx, gn, mf, mx, mn, tuck, flex] = x;
  return {
    contact: 'thumb',
    target: K.clone().addScaledVector(fr.N, q('kn', 0.3) - press * q('pd', 1.0)),
    fingers: fr.F.clone().multiplyScalar(gf).addScaledVector(fr.X, gx).addScaledVector(fr.N, gn),
    palm: fr.N.clone().multiplyScalar(mn).addScaledVector(fr.F, mf).addScaledVector(fr.X, mx),
    curl: [q('c1', 20), q('c2', 25), q('c3', 30), q('c4', 35)],
    thumb: { tuck, flex, bend: q('tb', 5) + press * 18 },
    pole: [q('ppx', 30), q('ppy', -55), q('ppz', -10)],
  };
}
/**
 * Search for a natural clasp: the thumb lies on the open palm (just above its surface, pointing towards the
 * fingers, like the demo video), while the rest of the pressing hand stays behind the open hand.
 */
function fitWrap(r: Rig, press: Side, K: THREE.Vector3, fr: Frame) {
  const c = (p: THREE.Vector3) => {
    const d = p.clone().sub(K);
    return [d.dot(fr.X), d.dot(fr.F), d.dot(fr.N)];
  };
  const h = r.hands[press];
  const score = (x: number[]) => {
    r.hand(press, wrapSpec(x, K, fr, 0));
    let e = 0;
    // thumb joints resting on the palm
    for (const b of [h.f[0][1], h.f[0][2]]) {
      const [, , n] = c(b.getWorldPosition(new THREE.Vector3()));
      e += n < 0.9 ? (0.9 - n) ** 2 * 20 : n > 2.2 ? (n - 2.2) ** 2 * 4 : 0;
    }
    // thumb pointing towards the open hand's fingers
    const td = r.tip(press, 0).sub(h.f[0][1].getWorldPosition(new THREE.Vector3())).normalize();
    const up = td.dot(fr.F);
    e += up < 0.5 ? (0.5 - up) ** 2 * 10 : 0;
    // everything else behind the open hand where it overlaps it
    const pts = [h.hand.getWorldPosition(new THREE.Vector3())];
    for (let i = 1; i <= 4; i++) for (const b of h.f[i]) pts.push(b.getWorldPosition(new THREE.Vector3()));
    for (let i = 1; i <= 4; i++) pts.push(r.tip(press, i));
    for (const p of pts) {
      const [x, f, n] = c(p);
      const inside = x > -7 && x < 4 && f > -8 && f < 10;
      if (inside && n > -3.2) e += (n + 3.2) ** 2;
    }
    // the pressing hand comes from below, beside the open hand's wrist, forearm hanging down
    const [, hf] = c(h.hand.getWorldPosition(new THREE.Vector3()));
    e += hf > -3 ? (hf + 3) ** 2 : 0;
    const elbowY = h.fore.getWorldPosition(new THREE.Vector3()).y;
    const wristY = h.hand.getWorldPosition(new THREE.Vector3()).y;
    e += elbowY > wristY - 8 ? (elbowY - wristY + 8) ** 2 * 0.2 : 0;
    // hand bone should not be far from the open hand (a real grip)
    const dist = h.hand.getWorldPosition(new THREE.Vector3()).distanceTo(K);
    e += dist > 9 ? (dist - 9) ** 2 * 0.5 : 0;
    // keep joints in a natural range
    e += x[6] < -10 || x[6] > 50 ? 1 : 0;
    e += x[7] < 0 || x[7] > 90 ? 1 : 0;
    // a relaxed thumb base: penalise extreme flex, which collapses the skin
    e += (x[7] / 90) ** 2 * 0.05;
    return e;
  };
  let rnd = 12345;
  const rand = () => ((rnd = (rnd * 16807) % 2147483647) / 2147483647);
  const lo = [-1, -1, -1, -1, -1, -1, -10, 0];
  const hi = [1, 1, 1, 1, 1, 1, 45, q("fmax", 65)];
  let best = [0.255, -0.968, 0.492, 0.685, 0.489, -0.027, -10, 65];
  let bestE = score(best);
  for (let i = 0; i < 2500; i++) {
    const x = lo.map((l, k) => l + rand() * (hi[k] - l));
    const e = score(x);
    if (e < bestE) [best, bestE] = [x, e];
  }
  let step = 0.25;
  for (let it = 0; it < 600; it++) {
    const x = best.map((v, k) => THREE.MathUtils.clamp(v + (rand() - 0.5) * 2 * step * (k >= 6 ? 40 : 1), lo[k], hi[k]));
    const e = score(x);
    if (e < bestE) [best, bestE] = [x, e];
    if (it % 150 === 149) step *= 0.5;
  }
  return [...best.map((v) => +v.toFixed(3)), +bestE.toFixed(3)];
}

/**
 * Step 1: Kurcha, filmed like Mayank's demo: seen from over the shoulder, the open palm turned towards
 * the face, the other hand wrapped around its little-finger edge with the thumb on the thumb mound.
 * v=0 left palm open, right thumb presses; v=1 mirrored.
 */
const kurcha: PoseFn = (r, t, v) => {
  r.reset({ eyesClosed: 0, smile: 0.3 });
  const open: Side = v === 0 ? 'L' : 'R';
  const press: Side = v === 0 ? 'R' : 'L';
  const s = open === 'L' ? 1 : -1;
  r.hand(open, {
    contact: 'wrist',
    target: v3(q('wx', 9) * s, q('wy', 132), q('wz', 22)),
    fingers: dir(-q('fx', 0.4) * s, q('fy', 0.35), 1),
    palm: dir(-q('nx', 0.2) * s, 1, q('nz', -0.3)),
    curl: [8, 6, 8, 12],
    spread: q('sp', 5),
    thumb: { tuck: q('ot', -10), flex: q('of', 5) },
    pole: [q('opx', 35), q('opy', -45), q('opz', -15)],
  });
  r.model.updateMatrixWorld(true);
  const fr = r.handFrame(open);
  // Kurcha: the soft mound at the base of the thumb, found on the skin by a ray from in front of the palm
  const key = `k${v}:${q('kl', 0.8)}:${q('kf', 0.6)}`;
  let K = cache.get(key);
  if (!K) {
    const K0 = r.wp(`${open}_Hand`).lerp(r.wp(`${open}_Finger01`), q('kl', 0.8)).addScaledVector(fr.F, q('kf', 0.6));
    K = skinHit(r, K0.clone().addScaledVector(fr.N, 8), fr.N.clone().negate()) ?? K0;
    cache.set(key, K);
  }
  const p = bump(t, 0.12, 0.38, 0.62, 0.9); // press amount
  const fk = `fit${v}`;
  let fit = fits.get(fk);
  if (!fit) {
    // found once with fitWrap (?fit=1) and checked by eye; fixed so every render matches
    fit = q('fit', 0) ? fitWrap(r, press, K, fr) : [0.255, -0.968, 0.492, 0.685, 0.489, -0.027, -10, 65];
    fits.set(fk, fit);
    (window as unknown as Record<string, unknown>).__fit = fit;
  }
  if (!q('only', 0)) r.hand(press, wrapSpec(fit, K, fr, p));
  const f = (x: THREE.Vector3) => x.toArray().map((n) => +n.toFixed(1));
  (window as unknown as Record<string, unknown>).__dbg = {
    K: f(K), pad: f(r.pad(press, 0)), hand: f(fr.P), pressHand: f(r.wp(`${press}_Hand`)), pressThumbTip: f(r.tip(press, 0)),
  };
  const h = r.wp('Head');
  return {
    // over the right shoulder (left shoulder for the mirrored variant)
    cam: h.clone().add(v3(-q('cx', 0) * s, q('cy', 22), q('cz', 12))),
    target: K.clone().add(v3(q('tx', 0) * s, q('ty', -3), q('tz', 0))),
    fov: q('fov', 27),
    near: 2,
    markers: [{ p: K.clone().addScaledVector(fr.N, 0.3), a: 1 - p * 0.6, size: 2.2 }],
  };
};

const sides: [Side, number][] = [
  ['L', 1],
  ['R', -1],
];
const P = (lm: Landmarks, k: string) => lm[k].clone();
/** Front close-up of the face. */
const faceCam = (_lm: Landmarks, dy = 0, dist = 72, fov = 22, dx = 0): Pick<Shot, 'cam' | 'target' | 'fov'> => ({
  target: v3(0, 167 + dy, 10),
  cam: v3(dx, 168.5 + dy, 10 + dist),
  fov,
});
/** A gaze dot floating in front of the face, where the eyes are looking. */
const gazeDot = (lm: Landmarks, yaw: number, pitch: number, a = 0.9): Marker => {
  const mid = P(lm, 'eyeL').add(P(lm, 'eyeR')).multiplyScalar(0.5);
  const d = q('gd', 14);
  return { p: mid.add(v3(Math.tan(THREE.MathUtils.degToRad(yaw)) * d, Math.tan(THREE.MathUtils.degToRad(pitch)) * d, d)), a, size: 1.6 };
};

/** Step 2: Vidhura. Bunched fingertips tap behind both ears. */
const bunchSpec = (x: number[], s: number, target: THREE.Vector3): HandSpec => ({
  contact: 'bunch',
  target,
  fingers: v3(x[0] * s, x[1], x[2]),
  palm: v3(x[3] * s, x[4], x[5]),
  curl: [x[6], x[6] + 4, x[6] + 8, x[6] + 12],
  spread: -12,
  thumb: { tuck: x[7], flex: x[8], bend: x[9] },
  pole: [40, -60, -30],
});
const vidhura: PoseFn = (r, t, _v, lm) => {
  r.reset({ eyesClosed: 0, smile: 0.35 });
  const touch = bump(t, 0.28, 0.42, 0.58, 0.78);
  for (const [L, s] of sides) {
    const m = P(lm, `mastoid${L}`);
    const target = m.clone().add(v3(s * (0.3 + 2.4 * (1 - touch)), -0.5 * (1 - touch), -1.2 * (1 - touch)));
    let x = fits.get('vid');
    if (!x && L === 'L') {
      x = q('fit', 0)
        ? search(
            (y) => {
              r.hand('L', bunchSpec(y, 1, m));
              const tips = [0, 1, 2, 3, 4].map((i) => r.tip('L', i));
              const c = tips.reduce((a, b) => a.add(b), new THREE.Vector3()).multiplyScalar(0.2);
              let e = tips.reduce((a, p) => a + p.distanceToSquared(c), 0);
              const hp = r.wp('L_Hand');
              e += hp.z > m.z - 4 ? (hp.z - m.z + 4) ** 2 * 0.5 : 0; // hand behind the ear
              e += hp.x < m.x + 1 ? (m.x + 1 - hp.x) ** 2 : 0; // not inside the head
              e += hp.y > m.y ? (hp.y - m.y) ** 2 * 0.3 : 0; // coming from below
              return e;
            },
            [0, 1, 0.5, 0, 0, -1, 40, 40, 40, 10],
            [-1, -1, -1, -1, -1, -1, 10, -20, 0, 0],
            [1, 1, 1, 1, 1, 1, 70, 70, 80, 60],
          )
        : [-0.066, 0.859, 0.91, -0.548, -0.651, -0.641, 52.065, 63.924, 4.228, 3.355]; // found with ?fit=1
      fits.set('vid', x);
      (window as unknown as Record<string, unknown>).__fit = x;
    }
    r.hand(L, bunchSpec(fits.get('vid')!, s, target));
  }
  const m = P(lm, 'mastoidL');
  return {
    target: v3(q('vtx', 7), 164.5, q('vtz', -3)),
    cam: v3(q('vcx', 66), 167, q('vcz', 40)),
    fov: 26,
    markers: [{ p: m.add(v3(0.6, 0, 0)), a: 1 - touch * 0.5, size: 2 }],
  };
};

/** Step 3: Near and far focus. First half far away, second half the tip of the nose. */
const nearFar: PoseFn = (r, t, _v, lm) => {
  r.reset({ eyesClosed: 0, smile: 0.25 });
  const near = bump(t, 0.5, 0.62, 0.9, 1.0);
  r.gaze(0, -q('np', 18) * near, q('nc', 9) * near);
  return {
    ...faceCam(lm, -0.5, 60, 20),
    markers: [{ p: P(lm, 'noseTip').add(v3(0, 0, 0.3)), a: near * 0.9, size: 1.4 }],
  };
};

/** Step 4: Figure 8 with the eyes only, head still. */
const figure8: PoseFn = (r, t, _v, lm) => {
  r.reset({ eyesClosed: 0, smile: 0.25 });
  const th = t * Math.PI * 2;
  const yaw = q('ey', 16) * Math.sin(2 * th);
  const pitch = q('ep', 18) * Math.sin(th);
  r.gaze(yaw, pitch);
  const trail: Marker[] = Array.from({ length: 36 }, (_, i) => {
    const a = (i / 36) * Math.PI * 2;
    const m = gazeDot(lm, q('ey', 16) * Math.sin(2 * a), q('ep', 18) * Math.sin(a), 0.4);
    m.size = 0.5;
    return m;
  });
  return { ...faceCam(lm, 0, 72, 24), markers: [...trail, gazeDot(lm, yaw, pitch)] };
};

/** Step 5: v=0 right then left, v=1 up then down, with the breath. */
const sideUpDown: PoseFn = (r, t, v, lm) => {
  r.reset({ eyesClosed: 0, smile: 0.25 });
  const a = Math.sin(t * Math.PI * 2);
  // mirror view, like the drawings: "look right" moves the eyes to the right of the screen
  const yaw = v === 0 ? q('sy', 24) * a : 0;
  const pitch = v === 1 ? q('sp', 20) * a : 0;
  r.gaze(yaw, pitch);
  return { ...faceCam(lm, 0, 72, 24), markers: [gazeDot(lm, yaw, pitch, Math.abs(a))] };
};

/** Stroke path helper: glide from a to b (0.05–0.7), lift and return (0.72–1). */
const stroke = (t: number) => {
  const u = t < 0.71 ? sst(t, 0.05, 0.7) : 1 - sst(t, 0.74, 0.98);
  const lift = bump(t, 0.7, 0.78, 0.92, 0.995);
  return { u, lift };
};

/** Step 6: four fingertips glide just below the eyebrows, inner to outer. */
const browStroke: PoseFn = (r, t, _v, lm) => {
  r.reset(CALM);
  const { u, lift } = stroke(t);
  const marks: Marker[] = [];
  for (const [L, s] of sides) {
    const a = P(lm, `brow1${L}`).add(v3(0.3 * s, -q('bd', 0.9), 0.15));
    const b = P(lm, `brow3${L}`).add(v3(0, -q('bd', 0.9), 0.15));
    const p = mix(a, b, u).add(v3(0, 0, lift * 1.4));
    r.hand(L, {
      contact: 'tips4',
      target: p,
      fingers: dir(-q('bfx', 0.8) * s, 1, -q('bfz', 0)),
      palm: dir(0.1 * s, q('bny', 0.2), -1),
      curl: [q('bc', 35), q('bc', 35), q('bc', 35), q('bc', 35) + 4],
      spread: -6,
      thumb: { tuck: 10, flex: 10 },
      pole: [q('bpx', 45), q('bpy', -55), q('bpz', 0)],
    });
    marks.push({ p: a, a: 0.35 * (1 - lift), size: 1.2 }, { p: b, a: 0.35 * (1 - lift), size: 1.2 });
  }
  return { ...faceCam(lm, 1, 80, 24), markers: marks };
};

/** Step 7: four fingertips glide along the bony rim below the eyes, inner to outer. */
const underEyeStroke: PoseFn = (r, t, _v, lm) => {
  r.reset(CALM);
  const { u, lift } = stroke(t);
  const marks: Marker[] = [];
  for (const [L, s] of sides) {
    const a = P(lm, `under1${L}`).add(v3(0, -q('ud', 0.4), 0.15));
    const b = P(lm, `under3${L}`).add(v3(0, -q('ud', 0.4), 0.15));
    const p = mix(a, b, u).add(v3(0, 0, lift * 1.4));
    r.hand(L, {
      contact: 'tips4',
      target: p,
      fingers: dir(-q('ufx', 0.2) * s, 1, -q('ufz', 0.3)),
      palm: dir(0.1 * s, q('uny', 0.2), -1),
      curl: [q('uc', 22), q('uc', 22), q('uc', 22), q('uc', 22) + 4],
      spread: -6,
      thumb: { tuck: 10, flex: 10 },
      pole: [45, -55, 0],
    });
    marks.push({ p: a, a: 0.35 * (1 - lift), size: 1.2 }, { p: b, a: 0.35 * (1 - lift), size: 1.2 });
  }
  return { ...faceCam(lm, -1, 80, 24), markers: marks };
};

/** Pull-and-release timing: grip, pull, hold, release. */
const pullAmt = (t: number) => bump(t, 0.15, 0.4, 0.55, 0.82);

/** Step 8: thumbs pull and release at three eyebrow points (v = point 0..2).
 * Hands rest at the sides of the forehead (eyes stay visible); each thumb reaches in to the point. */
const browSpec = (x: number[], s: number, target: THREE.Vector3): HandSpec => ({
  contact: 'thumb',
  target,
  fingers: v3(x[0] * s, x[1], x[2]),
  palm: v3(x[3] * s, x[4], x[5]),
  curl: [x[6], x[6] + 4, x[6] + 8, x[6] + 12],
  thumb: { tuck: x[7], flex: x[8], bend: x[9] },
  pole: [60, -50, -10],
});
const browPoints: PoseFn = (r, t, v, lm) => {
  r.reset(CALM);
  const pull = pullAmt(t);
  const marks: Marker[] = [];
  const key = `brow${v}`;
  for (const [L, s] of sides) {
    const pts = [1, 2, 3].map((i) => P(lm, `brow${i}${L}`));
    const target = pts[v].clone().add(v3(0, -0.5 + q('pu', 0.7) * pull, 0.1));
    if (!fits.get(key) && L === 'L') {
      const x = q('fit', 0)
        ? search(
            (y) => {
              r.hand('L', browSpec(y, 1, pts[v].clone().add(v3(0, -0.5, 0.1))));
              const hp = r.wp('L_Hand');
              const k2 = r.wp('L_Finger2');
              const tip2 = r.tip('L', 2);
              const eye = P(lm, 'eyeL');
              let e = 0;
              // hand and fingers beside the forehead, not over the eye or inside the head
              e += hp.x < 8 ? (8 - hp.x) ** 2 : 0;
              e += k2.x < 8.5 ? (8.5 - k2.x) ** 2 : 0;
              e += tip2.x < 8 ? (8 - tip2.x) ** 2 : 0;
              e += hp.y > eye.y + 2 ? 0 : (eye.y + 2 - hp.y) ** 2 * 0.2;
              // thumb tip actually reaches from the side: its base should be outside the eye
              const t0 = r.wp('L_Finger01');
              e += t0.x < 5 ? (5 - t0.x) ** 2 * 0.5 : 0;
              e += t0.z < 9 ? (9 - t0.z) ** 2 * 0.5 : 0;
              return e;
            },
            [0.1, 1, 0.1, -1, 0, 0.3, 20, 0, 50, 10],
            [-1, -1, -1, -1, -1, -1, 0, -30, 0, 0],
            [1, 1, 1, 1, 1, 1, 60, 60, 90, 50],
          )
        : BROW_FITS[v];
      fits.set(key, x);
      (window as unknown as Record<string, unknown>).__fit = x;
    }
    r.hand(L, browSpec(fits.get(key)!, s, target));
    pts.forEach((p, i) => marks.push({ p, a: i === v ? 1 - pull * 0.4 : 0.3, size: i === v ? 1.5 : 1 }));
  }
  return { ...faceCam(lm, 1, 92, 24), markers: marks };
};
// found with ?fit=1, one per point, and checked by eye
const BROW_FITS: number[][] = [
  [0.219, -0.252, -0.161, -0.776, 0.687, -0.154, 0.068, 53.862, 67.735, 6.993],
  [-0.576, -0.465, 0.577, -0.034, -0.036, -0.69, 59.565, -28.897, 5.875, 9.411],
  [0.746, -0.805, 0.647, 0.006, -0.841, -0.796, 9.256, 42.118, 63.952, 32.817],
];

/** Step 9: thumbs pull and release at three points on the bone below the eyes (v = point 0..2). */
const underEyePoints: PoseFn = (r, t, v, lm) => {
  r.reset(CALM);
  const pull = pullAmt(t);
  const marks: Marker[] = [];
  for (const [L, s] of sides) {
    const pts = [1, 2, 3].map((i) => P(lm, `under${i}${L}`));
    const target = pts[v].clone().add(v3(0, 0.1 - q('pu', 0.7) * pull, 0.15));
    r.hand(L, {
      contact: 'thumb',
      target,
      fingers: dir(q('qfx', 0.3) * s, 1, q('qfz', 0.2)),
      palm: dir(-q('qnx', 0.6) * s, 0, -1),
      curl: [q('qc', 85), q('qc', 85) + 5, q('qc', 85) + 5, q('qc', 85) + 5],
      thumb: { tuck: q('qtt', -5), flex: q('qtf', 15), bend: 0 },
      pole: [45, -60, 0],
    });
    pts.forEach((p, i) => marks.push({ p, a: i === v ? 1 - pull * 0.4 : 0.3, size: i === v ? 1.5 : 1 }));
  }
  return { ...faceCam(lm, -0.5, 80, 24), markers: marks };
};

/** Step 10: index fingertips pull and release at the inner corners of the eyes. */
const kaninaka: PoseFn = (r, t, _v, lm) => {
  r.reset(CALM);
  const pull = pullAmt(t);
  const marks: Marker[] = [];
  for (const [L, s] of sides) {
    const k = P(lm, `inner${L}`);
    r.hand(L, {
      contact: 'index',
      target: k.clone().add(v3(-0.15 * s * pull, 0.05 - q('ku', 0.6) * pull, 0.15)),
      fingers: dir(-q('kfx', 0.35) * s, 1, -q('kfz', 0.3)),
      palm: dir(q('knx', 0.3) * s, 0, -1),
      curl: [6, 85, 90, 95],
      thumb: { tuck: 40, flex: 40, bend: 20 },
      pole: [45, -55, 0],
    });
    marks.push({ p: k, a: 1 - pull * 0.4, size: 1.4 });
  }
  return { ...faceCam(lm, -0.5, 70, 22), markers: marks };
};

/** Step 11: Kaju Katli. One fingertip taps the 4 points of a diamond; v = point 0..3. */
const KAJU = ['noseRoot', 'outerL', 'noseTip', 'outerR'];
const kajuKatli: PoseFn = (r, t, v, lm) => {
  r.reset(CALM);
  const pt = (i: number) => {
    const k = KAJU[(i + 4) % 4];
    return P(lm, k).add(k.startsWith('outer') ? v3(k.endsWith('L') ? 0.2 : -0.2, 0, 0.1) : v3(0, 0, 0.1));
  };
  const cur = pt(v);
  const lifted = (p: THREE.Vector3) => p.clone().add(v3(0, 0, q('kl', 2.5)));
  const fromP = lifted(mix(pt(v - 1), cur, 0.5));
  const toP = lifted(mix(cur, pt(v + 1), 0.5));
  let p: THREE.Vector3;
  if (t < 0.12) p = mix(fromP, lifted(cur), sst(t, 0, 0.12));
  else if (t < 0.84) p = mix(lifted(cur), cur, sst(t, 0.12, 0.2) * (1 - sst(t, 0.76, 0.84)));
  else p = mix(lifted(cur), toP, sst(t, 0.84, 1));
  r.hand('R', {
    contact: 'index',
    target: p,
    fingers: dir(q('jfx', 0.25), q('jfy', 0.9), -q('jfz', 0.55)),
    palm: dir(q('jnx', 0.2), -q('jny', 0.3), -1),
    curl: [8, 80, 85, 90],
    thumb: { tuck: 40, flex: 35, bend: 20 },
    pole: [35, -60, 0],
  });
  const touching = sst(t, 0.12, 0.2) * (1 - sst(t, 0.76, 0.84));
  return {
    ...faceCam(lm, -1, 72, 22),
    markers: [0, 1, 2, 3].map((i) => ({ p: pt(i), a: i === v ? 1 - touching * 0.35 : 0.3, size: i === v ? 1.5 : 1 })),
  };
};

/** Small random + local search, deterministic. */
function search(score: (x: number[]) => number, x0: number[], lo: number[], hi: number[], n = 2000) {
  let rnd = 4242;
  const rand = () => (rnd = (rnd * 16807) % 2147483647) / 2147483647;
  let best = x0.slice();
  let bestE = score(best);
  for (let i = 0; i < n; i++) {
    const x = lo.map((l, k) => l + rand() * (hi[k] - l));
    const e = score(x);
    if (e < bestE) [best, bestE] = [x, e];
  }
  let step = 0.2;
  for (let it = 0; it < n / 2; it++) {
    const x = best.map((v, k) => THREE.MathUtils.clamp(v + (rand() - 0.5) * 2 * step * (hi[k] - lo[k]), lo[k], hi[k]));
    const e = score(x);
    if (e < bestE) [best, bestE] = [x, e];
    if (it % 200 === 199) step *= 0.5;
  }
  return [...best.map((v) => +v.toFixed(3)), +bestE.toFixed(4)];
}

/** Step 12: Nasa Mula pinch. Thumb and index hold the bridge, pull away from the face, release. */
const pinchSpec = (x: number[], thumbAt: THREE.Vector3): HandSpec => ({
  contact: 'thumb',
  target: thumbAt,
  fingers: v3(x[0], x[1], x[2]),
  palm: v3(x[3], x[4], x[5]),
  curl: [[x[7] * 0.6, x[7], x[7] * 0.6], 80, 85, 90],
  thumb: { tuck: x[6], flex: x[8], bend: 10 },
  pole: [35, -60, 0],
});
const nasaMula: PoseFn = (r, t, _v, lm) => {
  r.reset(CALM);
  const pull = pullAmt(t);
  const b = P(lm, 'noseRoot').add(v3(0, -q('ny0', 0.8), -0.4));
  const half = q('nw', 0.95);
  const out = v3(0, 0, q('nz0', 0.1) + q('npz', 0.8) * pull);
  // right hand: thumb on the right side of the bridge, index on the left
  const thumbAt = b.clone().add(v3(-half, 0, 0)).add(out);
  const idxAt = b.clone().add(v3(half, 0, 0)).add(out);
  let x = fits.get('nasa');
  if (!x) {
    x = q('fit', 0)
      ? search(
          (y) => {
            r.hand('R', pinchSpec(y, thumbAt));
            const e = r.pad('R', 1).distanceTo(idxAt) ** 2;
            const hz = r.wp('R_Hand').z;
            const knuckle = r.wp('R_Finger2').z;
            // hand below and to the side so the pinch stays visible from the front
            const hp = r.wp('R_Hand');
            const fr = r.handFrame('R');
            return (
              e +
              (hz < 16 ? (16 - hz) ** 2 : 0) +
              (knuckle < 15 ? (15 - knuckle) ** 2 : 0) +
              (hp.y > b.y - 6 ? (hp.y - b.y + 6) ** 2 * 0.3 : 0) +
              (hp.x > -3 ? (hp.x + 3) ** 2 * 0.3 : 0) +
              fr.N.z ** 2 * 3
            );
          },
          [0.2, 1, -0.3, 1, 0, -0.4, 45, 45, 40],
          [-1, -1, -1, -1, -1, -1, -20, 0, 0],
          [1, 1, 1, 1, 1, 1, 60, 90, 80],
        )
      : [0.988, 0.174, -0.578, -0.702, 0.86, -0.631, 36.481, 51.685, 3.195]; // found with ?fit=1
    fits.set('nasa', x);
    (window as unknown as Record<string, unknown>).__fit = x;
  }
  r.hand('R', pinchSpec(x, thumbAt));
  return { ...faceCam(lm, -0.5, 72, 22, q('ncx', 8)), markers: [{ p: b, a: 0.8 - pull * 0.3, size: 1.5 }] };
};

/** Step 13: index and middle fingertips push gently upward along the cheekbones. */
const cheekbones: PoseFn = (r, t, _v, lm) => {
  r.reset(CALM);
  const { u, lift } = stroke(t);
  const marks: Marker[] = [];
  for (const [L, s] of sides) {
    const a = P(lm, `cheekLo${L}`).add(v3(0, 0, 0.15));
    const b = P(lm, `cheekHi${L}`).add(v3(0, 0, 0.15));
    r.hand(L, {
      contact: 'tips2',
      target: mix(a, b, u).add(v3(0, 0, lift * 1.4)),
      fingers: dir(q('cfx', 0.3) * s, 1, -q('cfz', 0.3)),
      palm: dir(-0.2 * s, 0, -1),
      curl: [15, 15, 80, 85],
      spread: -4,
      thumb: { tuck: 30, flex: 30 },
      pole: [45, -60, 0],
    });
    marks.push({ p: a, a: 0.35 * (1 - lift), size: 1.2 }, { p: b, a: 0.35 * (1 - lift), size: 1.2 });
  }
  return { ...faceCam(lm, -1.5, 80, 24), markers: marks };
};

/** Step 14: Palming (the clip Mayank liked): rise, rest, lower. */
const palming: PoseFn = (r, t, _v, lm) => {
  r.reset(CALM);
  const rise = sst(t, 0, 0.3) * (1 - sst(t, 0.9, 1));
  for (const L of ['L', 'R'] as Side[]) {
    const s = L === 'L' ? 1 : -1;
    const eye = L === 'L' ? lm.eyeL : lm.eyeR;
    r.hand(L, {
      contact: 'heel',
      target: mix(eye.clone().add(v3(9 * s, -42, 14)), eye.clone().add(v3(0.3 * s, -0.3, 2.8)), rise),
      fingers: mix(dir(-0.1 * s, 1, 0.25), dir(-0.16 * s, 1, -0.32), rise),
      palm: mix(dir(0.5 * s, 0.1, -1), dir(0.08 * s, 0.4, -1), rise),
      curl: [10, 10, 10, 10],
      thumb: { tuck: 20 },
    });
  }
  const h = lm.head;
  return { cam: h.clone().add(v3(14, -10, 100)), target: h.clone().add(v3(0, 4, 0)) };
};

/** Debug: the left hand alone, palm to camera, with markers on the thumb and index pads. */
const handTest: PoseFn = (r) => {
  r.reset();
  r.hand('L', {
    contact: 'wrist',
    target: v3(10, 150, 30),
    fingers: dir(0, 1, 0),
    palm: dir(0, 0, 1),
    curl: [q('c', 10), q('c', 10), q('c', 10), q('c', 10)],
    thumb: { tuck: q('tt', 0), flex: q('tf', 0), bend: q('tb', 0) },
  });
  r.model.updateMatrixWorld(true);
  return {
    target: v3(10, 156, 30),
    cam: v3(10, 156, 80),
    fov: 26,
    markers: [
      { p: r.pad('L', 0), a: 1, size: 1 },
      { p: r.tip('L', 0), a: 0.6, size: 0.7 },
      { p: r.pad('L', 1), a: 1, size: 1 },
    ],
  };
};

export const POSES: Record<string, PoseFn> = {
  'hand-test': handTest,
  kurcha,
  vidhura,
  'near-far': nearFar,
  'figure-8': figure8,
  'side-up-down': sideUpDown,
  'below-eyebrows': browStroke,
  'under-eyes': underEyeStroke,
  'eyebrow-points': browPoints,
  'below-eye-points': underEyePoints,
  kaninaka,
  'kaju-katli': kajuKatli,
  'nasa-mula': nasaMula,
  cheekbones,
  palming,
};
export { ss, bump };

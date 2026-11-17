import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

const BASE = import.meta.env.BASE_URL + 'models/';

/** Finger joint names in the WebXR generic hand. */
const FINGERS = ['index', 'middle', 'ring', 'pinky'] as const;
type V3 = [number, number, number];

export interface Pose3D {
  /** World position of the wrist joint. */
  wrist: V3;
  /** Direction the fingers point (world). */
  fingers: V3;
  /** Direction the palm faces (world). */
  palm: V3;
  /** Curl per finger joint, degrees (towards the palm). */
  curl: number;
  /** Thumb tuck, degrees. */
  thumb: number;
  /** Direction the forearm runs from the wrist (world). */
  arm: V3;
}

interface Chain {
  nodes: THREE.Object3D[];
  restP: THREE.Vector3[];
  restQ: THREE.Quaternion[];
  axis: THREE.Vector3;
  thumb: boolean;
}
interface Rig {
  F0: THREE.Vector3;
  N0: THREE.Vector3;
  W0: THREE.Vector3;
  chains: Chain[];
}

/**
 * Measure the rest hand. The WebXR hand stores every joint as a sibling (no parent chain), so finger
 * curls are applied here as forward kinematics along each finger.
 */
function rig(root: THREE.Object3D): Rig {
  root.updateMatrixWorld(true);
  const wp = (n: string) => root.getObjectByName(n)!.getWorldPosition(new THREE.Vector3());
  const W0 = wp('wrist');
  const F0 = wp('middle-finger-tip').sub(W0).normalize();
  const L = wp('index-finger-phalanx-proximal').sub(wp('pinky-finger-phalanx-proximal')).normalize();
  let N0 = new THREE.Vector3().crossVectors(L, F0).normalize();
  if (wp('thumb-tip').sub(W0).dot(N0) < 0) N0 = N0.negate();
  // Rotating about A = F0 × N0 by +θ swings +F0 towards +N0 (the palm side).
  const A = new THREE.Vector3().crossVectors(F0, N0).normalize();
  const chain = (names: string[], axis: THREE.Vector3, thumb: boolean): Chain => {
    const nodes = names.map((n) => root.getObjectByName(n)!);
    return { nodes, restP: nodes.map((n) => n.position.clone()), restQ: nodes.map((n) => n.quaternion.clone()), axis, thumb };
  };
  const chains = FINGERS.map((f) => chain([`${f}-finger-phalanx-proximal`, `${f}-finger-phalanx-intermediate`, `${f}-finger-phalanx-distal`, `${f}-finger-tip`], A, false));
  // Thumb tucks across the palm, about the palm normal; pick the sign that moves the tip towards the index finger.
  const piv = root.getObjectByName('thumb-metacarpal')!.position.clone();
  const tip = root.getObjectByName('thumb-tip')!.position.clone();
  const idx = root.getObjectByName('index-finger-phalanx-proximal')!.position.clone();
  const T = N0.clone();
  const test = tip.clone().sub(piv).applyAxisAngle(T, 0.2).add(piv);
  if (test.distanceTo(idx) > tip.distanceTo(idx)) T.negate();
  chains.push(chain(['thumb-metacarpal', 'thumb-phalanx-proximal', 'thumb-phalanx-distal', 'thumb-tip'], T, true));
  return { F0, N0, W0: W0.sub(root.getWorldPosition(new THREE.Vector3())), chains };
}

function poseHand(root: THREE.Object3D, r: Rig, p: Pose3D) {
  const basis = (f: THREE.Vector3, n: THREE.Vector3) => {
    const x = f.clone().normalize();
    const y = n.clone().sub(x.clone().multiplyScalar(n.dot(x))).normalize();
    return new THREE.Matrix4().makeBasis(x, y, new THREE.Vector3().crossVectors(x, y));
  };
  const M = basis(new THREE.Vector3(...p.fingers), new THREE.Vector3(...p.palm));
  const M0 = basis(r.F0, r.N0);
  root.quaternion.setFromRotationMatrix(M.multiply(M0.transpose()));
  const off = r.W0.clone().applyQuaternion(root.quaternion);
  root.position.set(p.wrist[0] - off.x, p.wrist[1] - off.y, p.wrist[2] - off.z);
  for (const c of r.chains) {
    const P = c.restP.map((v) => v.clone());
    const Q = c.restQ.map((q) => q.clone());
    const angles = c.thumb ? [p.thumb * 0.5, p.thumb * 0.3, p.thumb * 0.2] : [p.curl * 0.6, p.curl, p.curl * 0.7];
    angles.forEach((deg, j) => {
      const R = new THREE.Quaternion().setFromAxisAngle(c.axis, THREE.MathUtils.degToRad(deg));
      for (let k = j + 1; k < P.length; k++) P[k].sub(P[j]).applyQuaternion(R).add(P[j]);
      for (let k = j; k < Q.length; k++) Q[k].premultiply(R);
    });
    c.nodes.forEach((n, i) => {
      n.position.copy(P[i]);
      n.quaternion.copy(Q[i]);
    });
  }
}

const lerpPose = (a: Pose3D, b: Pose3D, t: number): Pose3D => {
  const l = (x: number, y: number) => x + (y - x) * t;
  const l3 = (x: V3, y: V3) => x.map((v, i) => l(v, y[i])) as V3;
  return { wrist: l3(a.wrist, b.wrist), fingers: l3(a.fingers, b.fingers), palm: l3(a.palm, b.palm), curl: l(a.curl, b.curl), thumb: l(a.thumb, b.thumb), arm: l3(a.arm, b.arm) };
};

const mirror = (p: Pose3D): Pose3D => ({
  ...p,
  wrist: [-p.wrist[0], p.wrist[1], p.wrist[2]],
  fingers: [-p.fingers[0], p.fingers[1], p.fingers[2]],
  palm: [-p.palm[0], p.palm[1], p.palm[2]],
  arm: [-p.arm[0], p.arm[1], p.arm[2]],
});

/** Debug-tunable numbers: ?p=<json> overrides the "on the eyes" pose of the left hand. */
function readOverride(): Partial<Pose3D> {
  try {
    return JSON.parse(new URLSearchParams(location.search).get('p') ?? '{}');
  } catch {
    return {};
  }
}

/**
 * Step 14, Palming, in 3D: a scanned head; both hands rise from below and settle with the heel of the
 * palm over the closed eyes, fingers resting on the forehead. Drag to look from any side.
 */
export function Palming3D({ debug = false, onReady }: { debug?: boolean; onReady?: () => void }) {
  const host = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = host.current!;
    const qs = new URLSearchParams(location.search);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    el.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 200);
    const cam = (qs.get('cam') ?? '4,5,16').split(',').map(Number) as V3;
    camera.position.set(...cam);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 1.3, 0);
    controls.enablePan = false;
    controls.enableDamping = true;
    controls.minDistance = 10;
    controls.maxDistance = 40;

    scene.add(new THREE.HemisphereLight(0xfff4e6, 0x6b4a3a, 1.6));
    const key = new THREE.DirectionalLight(0xffffff, 2.2);
    key.position.set(6, 10, 14);
    scene.add(key);
    const rim = new THREE.DirectionalLight(0xffd9a8, 1.2);
    rim.position.set(-10, 4, -6);
    scene.add(rim);

    const skin = new THREE.MeshStandardMaterial({ color: 0xc8957a, roughness: 0.6, metalness: 0 });
    const loader = new GLTFLoader();
    const hands: THREE.Object3D[] = [];
    const rigs: Rig[] = [];
    const arms: THREE.Mesh[] = [];
    let head: THREE.Object3D | null = null;
    let disposed = false;

    Promise.all([
      loader.loadAsync(BASE + 'head.glb'),
      new THREE.TextureLoader().loadAsync(BASE + 'head-color.jpg'),
      loader.loadAsync(BASE + 'hand-left.glb'),
      loader.loadAsync(BASE + 'hand-right.glb'),
    ]).then(([h, tex, hl, hr]) => {
      if (disposed) return;
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.flipY = false;
      head = h.scene.getObjectByName('LeePerrySmith') ?? h.scene;
      head.traverse((o) => {
        if ((o as THREE.Mesh).isMesh) (o as THREE.Mesh).material = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.7 });
      });
      scene.add(head);
      for (const g of [hl, hr]) {
        const root = new THREE.Group();
        const inner = g.scene;
        inner.scale.setScalar(16);
        inner.traverse((o) => {
          if ((o as THREE.Mesh).isMesh) {
            (o as THREE.Mesh).material = skin;
            o.frustumCulled = false;
          }
        });
        root.add(inner);
        scene.add(root);
        hands.push(root);
        rigs.push(rig(root));
        const fa = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.62, 7.5, 28, 1, false), skin);
        fa.geometry.translate(0, -3.5, 0);
        fa.scale.set(1, 1, 0.8);
        scene.add(fa);
        arms.push(fa);
        if (debug && new URLSearchParams(location.search).has("axes")) root.add(new THREE.AxesHelper(2));
      }
      onReady?.();
    });

    // Poses (left hand = the hand on the viewer's right; the other mirrors it).
    const REST: Pose3D = { wrist: [2.6, -6, 4.2], fingers: [-0.1, 1, 0.1], palm: [-0.4, 0.1, -1], curl: 22, thumb: 0, arm: [0.3, -1, 0.3] };
    const ON: Pose3D = { wrist: [0.75, 1.42, 2.5], fingers: [-0.12, 1, -0.42], palm: [-0.1, 0.4, -1], curl: 24, thumb: Number(new URLSearchParams(location.search).get('th') ?? 25), arm: [0.55, -1, 0.45], ...readOverride() };
    const poses = (t: number): [Pose3D, Pose3D] => {
      // 0–0.3 rise, 0.3–0.9 hold, 0.9–1 lower (loop)
      const rise = THREE.MathUtils.smoothstep(t, 0, 0.3);
      const lower = THREE.MathUtils.smoothstep(t, 0.9, 1);
      const p = lerpPose(REST, ON, rise * (1 - lower));
      return [p, mirror(p)];
    };

    const resize = () => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(el);

    const t0 = performance.now();
    const fixed = debug ? Number(qs.get('t') ?? 'NaN') : NaN;
    const probe = debug && qs.has('probe');
    let raf = 0;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      const t = Number.isFinite(fixed) ? fixed : (((performance.now() - t0) / 1000) % 10) / 10;
      if (hands.length === 2) {
        if (probe) {
          const c = Number(qs.get('curl') ?? 0);
          const th = Number(qs.get('thumb') ?? 0);
          poseHand(hands[0], rigs[0], { wrist: [2, -2, 3], fingers: [0, 1, 0], palm: [0, 0, 1], curl: c, thumb: th, arm: [0, -1, 0] });
          poseHand(hands[1], rigs[1], { wrist: [-2, -2, 3], fingers: [0, 1, 0], palm: [0, 0, 1], curl: c, thumb: th, arm: [0, -1, 0] });
          if (head) head.visible = false;
        } else {
          const [l, r] = poses(t);
          poseHand(hands[0], rigs[0], l);
          poseHand(hands[1], rigs[1], r);
          [l, r].forEach((p, i) => {
            const dir = new THREE.Vector3(...p.arm).normalize();
            arms[i].quaternion.setFromUnitVectors(new THREE.Vector3(0, -1, 0), dir).multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), 0));
            arms[i].position.set(...p.wrist).addScaledVector(dir, -0.8);
          });
        }
      }
      controls.update();
      renderer.render(scene, camera);
    };
    loop();
    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
      controls.dispose();
      renderer.dispose();
      el.removeChild(renderer.domElement);
    };
  }, [debug, onReady]);

  return <div ref={host} className="h-full w-full touch-none" />;
}

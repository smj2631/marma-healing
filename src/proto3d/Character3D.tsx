import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

const BASE = import.meta.env.BASE_URL + 'models/avatar/';
type V3 = [number, number, number];

/** Two-bone IK: rotate upper arm + forearm so the hand bone reaches `target` (world), elbow hinting towards `pole`. */
function twoBoneIK(upper: THREE.Bone, lower: THREE.Bone, end: THREE.Bone, target: THREE.Vector3, pole: THREE.Vector3) {
  const a = upper.getWorldPosition(new THREE.Vector3());
  const b = lower.getWorldPosition(new THREE.Vector3());
  const c = end.getWorldPosition(new THREE.Vector3());
  const lab = a.distanceTo(b);
  const lcb = b.distanceTo(c);
  const lat = Math.min(a.distanceTo(target), lab + lcb - 1e-4);
  // desired elbow position
  const dir = target.clone().sub(a).normalize();
  const cosA = (lab * lab + lat * lat - lcb * lcb) / (2 * lab * lat);
  const ang = Math.acos(THREE.MathUtils.clamp(cosA, -1, 1));
  const poleDir = pole.clone().sub(a);
  poleDir.sub(dir.clone().multiplyScalar(poleDir.dot(dir))).normalize();
  const elbow = a.clone().add(dir.clone().multiplyScalar(Math.cos(ang) * lab)).add(poleDir.multiplyScalar(Math.sin(ang) * lab));
  const handPos = a.clone().add(dir.multiplyScalar(lat));
  aim(upper, b, elbow);
  upper.updateMatrixWorld(true);
  aim(lower, end.getWorldPosition(new THREE.Vector3()), handPos);
  lower.updateMatrixWorld(true);
}

/** Rotate `bone` (in world terms) so that the point `from` (currently a child position) moves onto `to`. */
function aim(bone: THREE.Bone, from: THREE.Vector3, to: THREE.Vector3) {
  const p = bone.getWorldPosition(new THREE.Vector3());
  const v1 = from.clone().sub(p).normalize();
  const v2 = to.clone().sub(p).normalize();
  const qWorld = new THREE.Quaternion().setFromUnitVectors(v1, v2);
  const parentQ = bone.parent!.getWorldQuaternion(new THREE.Quaternion());
  const boneWorld = bone.getWorldQuaternion(new THREE.Quaternion());
  const newWorld = qWorld.multiply(boneWorld);
  bone.quaternion.copy(parentQ.invert().multiply(newWorld));
}

/** Set a bone's world orientation. */
function setWorldQuat(bone: THREE.Object3D, q: THREE.Quaternion) {
  const parentQ = bone.parent!.getWorldQuaternion(new THREE.Quaternion());
  bone.quaternion.copy(parentQ.invert().multiply(q));
}

export interface CharacterProps {
  debug?: boolean;
  onReady?: () => void;
}

/**
 * Step 14, Palming, on a realistic full character (Microsoft Rocketbox avatar, MIT):
 * hair, skin textures, detailed hands. The hands rise and settle with the heel of the palm over
 * the closed eyes, fingers resting on the forehead.
 */
export function Character3D({ debug = false, onReady }: CharacterProps) {
  const host = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = host.current!;
    const qs = new URLSearchParams(location.search);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    el.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(28, 1, 1, 2000);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enablePan = false;
    controls.enableDamping = true;

    scene.add(new THREE.HemisphereLight(0xfff6ec, 0x8a6a58, 1.5));
    const key = new THREE.DirectionalLight(0xffffff, 2.4);
    key.position.set(80, 160, 220);
    scene.add(key);
    const fill = new THREE.DirectionalLight(0xffe2c4, 0.9);
    fill.position.set(-160, 60, 120);
    scene.add(fill);
    const rim = new THREE.DirectionalLight(0xffffff, 1.0);
    rim.position.set(0, 120, -200);
    scene.add(rim);

    const tl = new THREE.TextureLoader();
    const tex = (f: string, srgb = true) => {
      const t = tl.load(BASE + f);
      t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
      t.anisotropy = 4;
      return t;
    };
    const manager = new THREE.LoadingManager();
    // The FBX points at .tga files on the artist's disk; we ship converted images instead.
    manager.setURLModifier((url) => (/\.tga$/i.test(url) ? 'data:,' : url));
    const loader = new FBXLoader(manager);

    let model: THREE.Group | null = null;
    let disposed = false;
    const bones: Record<string, THREE.Bone> = {};
    let face: THREE.SkinnedMesh | null = null;

    loader.load(BASE + 'avatar.fbx', (fbx) => {
      if (disposed) return;
      model = fbx;
      const head = new THREE.MeshStandardMaterial({ map: tex('head_color.jpg'), normalMap: tex('head_normal.jpg', false), roughness: 0.62 });
      const body = new THREE.MeshStandardMaterial({ map: tex('body_color.jpg'), normalMap: tex('body_normal.jpg', false), roughness: 0.7 });
      const hair = new THREE.MeshStandardMaterial({ map: tex('opacity_color.webp'), transparent: true, alphaTest: 0.35, side: THREE.DoubleSide, roughness: 0.8 });
      const report: string[] = [];
      fbx.traverse((o) => {
        if ((o as THREE.Bone).isBone) bones[o.name] = o as THREE.Bone;
        const m = o as THREE.SkinnedMesh;
        if (m.isMesh) {
          m.frustumCulled = false;
          const mats = Array.isArray(m.material) ? m.material : [m.material];
          const pick = (mm: THREE.Material) => {
            const n = mm.name.toLowerCase();
            const map = (mm as THREE.MeshPhongMaterial).map?.name?.toLowerCase() ?? '';
            report.push(`${m.name}:${mm.name}:${map}`);
            if (n.includes('opacity') || map.includes('opacity')) return hair;
            if (n.includes('head') || map.includes('head')) return head;
            return body;
          };
          m.material = Array.isArray(m.material) ? mats.map(pick) : pick(mats[0]);
          if (m.morphTargetDictionary && Object.keys(m.morphTargetDictionary).length) face = m;
        }
      });
      if (debug) {
        (window as unknown as Record<string, unknown>).__report = { mats: report, bones: Object.keys(bones), morphs: face ? Object.keys(face.morphTargetDictionary!) : [] };
      }
      scene.add(fbx);
      // frame the head
      const headBone = Object.values(bones).find((b) => /head$/i.test(b.name));
      const hp = headBone ? headBone.getWorldPosition(new THREE.Vector3()) : new THREE.Vector3(0, 160, 0);
      controls.target.copy(hp).add(new THREE.Vector3(0, 4, 0));
      const cam = (qs.get('cam') ?? '35,10,95').split(',').map(Number) as V3;
      camera.position.copy(hp).add(new THREE.Vector3(...cam));
      setup();
      onReady?.();
    });

    // ---------- posing ----------
    interface Side {
      s: 1 | -1;
      upper: THREE.Bone;
      fore: THREE.Bone;
      hand: THREE.Bone;
      F0: THREE.Vector3;
      N0: THREE.Vector3;
      Q0: THREE.Quaternion;
      eye: THREE.Vector3;
      fingers: { b: THREE.Bone; axis: THREE.Vector3; k: number; thumb: boolean }[];
    }
    const sides: Side[] = [];
    const rest = new Map<THREE.Bone, THREE.Quaternion>();
    const morph = (name: string, v: number) => {
      if (!face) return;
      const i = face.morphTargetDictionary![`blendShape1.${name}`];
      if (i !== undefined) face.morphTargetInfluences![i] = v;
    };
    function setup() {
      model!.updateMatrixWorld(true);
      Object.values(bones).forEach((b) => rest.set(b, b.quaternion.clone()));
      const wp = (n: string) => bones[n].getWorldPosition(new THREE.Vector3());
      for (const L of ['L', 'R'] as const) {
        const hand = bones[`Bip01_${L}_Hand`];
        const H = wp(`Bip01_${L}_Hand`);
        const F0 = wp(`Bip01_${L}_Finger2`).sub(H).normalize();
        const lat = wp(`Bip01_${L}_Finger1`).sub(wp(`Bip01_${L}_Finger4`)).normalize();
        let N0 = new THREE.Vector3().crossVectors(lat, F0).normalize();
        if (wp(`Bip01_${L}_Finger01`).sub(H).dot(N0) < 0) N0 = N0.negate();
        const A = new THREE.Vector3().crossVectors(F0, N0).normalize(); // +rotation curls towards the palm
        const fingers: Side['fingers'] = [];
        for (const f of [1, 2, 3, 4]) {
          [`Bip01_${L}_Finger${f}`, `Bip01_${L}_Finger${f}1`, `Bip01_${L}_Finger${f}2`].forEach((n, k) => {
            const b = bones[n];
            const wq = b.getWorldQuaternion(new THREE.Quaternion()).invert();
            fingers.push({ b, axis: A.clone().applyQuaternion(wq), k, thumb: false });
          });
        }
        // thumb: tuck about the palm normal towards the index finger
        const tb = bones[`Bip01_${L}_Finger0`];
        const tp = tb.getWorldPosition(new THREE.Vector3());
        const tt = wp(`Bip01_${L}_Finger02`);
        const T = N0.clone();
        const test = tt.clone().sub(tp).applyAxisAngle(T, 0.2).add(tp);
        const idx = wp(`Bip01_${L}_Finger1`);
        if (test.distanceTo(idx) > tt.distanceTo(idx)) T.negate();
        [`Bip01_${L}_Finger0`, `Bip01_${L}_Finger01`, `Bip01_${L}_Finger02`].forEach((n, k) => {
          const b = bones[n];
          const wq = b.getWorldQuaternion(new THREE.Quaternion()).invert();
          fingers.push({ b, axis: T.clone().applyQuaternion(wq), k, thumb: true });
        });
        const eye = wp(`Bip01_${L}Eye`);
        sides.push({ s: eye.x > 0 ? 1 : -1, upper: bones[`Bip01_${L}_UpperArm`], fore: bones[`Bip01_${L}_Forearm`], hand, F0, N0, Q0: hand.getWorldQuaternion(new THREE.Quaternion()), eye, fingers });
      }
      if (debug) (window as unknown as Record<string, unknown>).__eyes = sides.map((x) => x.eye.toArray().map((v) => +v.toFixed(1)));
    }

    const P = (k: string, d: number) => Number(qs.get(k) ?? d);
    function pose(t: number) {
      if (!sides.length) return;
      rest.forEach((q, b) => b.quaternion.copy(q));
      model!.updateMatrixWorld(true);
      // calm face: eyes closed, a gentle smile
      morph(qs.get('eyes') ?? 'SR_05_Eye_Left_Blink', 1);
      morph(qs.get('eyes2') ?? 'SR_12_Eye_Right_Blink', 1);
      morph('AK_44_MouthSmileLeft', P('smile', 0.5));
      morph('AK_45_MouthSmileRight', P('smile', 0.5));
      morph('AK_07_CheekSquintLeft', 0.15);
      morph('AK_08_CheekSquintRight', 0.15);
      const rise = THREE.MathUtils.smootherstep(t, 0, 0.3) * (1 - THREE.MathUtils.smootherstep(t, 0.9, 1));
      for (const sd of sides) {
        const s = sd.s;
        // on the eyes: fingers up, slightly inwards and back over the forehead; palm facing the face
        const Fon = new THREE.Vector3(-0.16 * s, 1, -P('fb', 0.42)).normalize();
        const Non = new THREE.Vector3(0.08 * s, P('nu', 0.4), -1).normalize();
        const Foff = new THREE.Vector3(-0.1 * s, 1, 0.25).normalize();
        const Noff = new THREE.Vector3(0.5 * s, 0.1, -1).normalize();
        const F = Foff.clone().lerp(Fon, rise).normalize();
        const N = Noff.clone().lerp(Non, rise).normalize();
        const heelOn = sd.eye.clone().add(new THREE.Vector3(0.3 * s, -0.3, P('fz', 1.6)));
        const heelOff = sd.eye.clone().add(new THREE.Vector3(9 * s, -42, 14));
        const heel = heelOff.lerp(heelOn, rise);
        const wrist = heel.clone().addScaledVector(F, -P('hf', 2.6)).addScaledVector(N, -P('hn', 1.6));
        const pole = sd.upper.getWorldPosition(new THREE.Vector3()).add(new THREE.Vector3(P('px', 40) * s, -P('py', 55), P('pz', 10)));
        twoBoneIK(sd.upper, sd.fore, sd.hand, wrist, pole);
        // hand orientation
        const basis = (f: THREE.Vector3, n: THREE.Vector3) => {
          const x = f.clone().normalize();
          const y = n.clone().sub(x.clone().multiplyScalar(n.dot(x))).normalize();
          return new THREE.Matrix4().makeBasis(x, y, new THREE.Vector3().crossVectors(x, y));
        };
        const R = new THREE.Quaternion().setFromRotationMatrix(basis(F, N).multiply(basis(sd.F0, sd.N0).transpose()));
        setWorldQuat(sd.hand, R.multiply(sd.Q0));
        sd.hand.updateMatrixWorld(true);
        const curl = P('curl', 14);
        const thumb = P('thumb', 20);
        for (const f of sd.fingers) {
          const ang = f.thumb ? thumb * [0.5, 0.3, 0.2][f.k] : curl * [0.5, 1, 0.7][f.k];
          f.b.quaternion.multiply(new THREE.Quaternion().setFromAxisAngle(f.axis, THREE.MathUtils.degToRad(ang)));
        }
      }
    }

    const resize = () => {
      renderer.setSize(el.clientWidth, el.clientHeight);
      camera.aspect = el.clientWidth / el.clientHeight;
      camera.updateProjectionMatrix();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(el);

    const t0 = performance.now();
    const fixed = debug ? Number(qs.get('t') ?? 'NaN') : NaN;
    let raf = 0;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      if (model) pose(Number.isFinite(fixed) ? fixed : (((performance.now() - t0) / 1000) % 12) / 12);
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

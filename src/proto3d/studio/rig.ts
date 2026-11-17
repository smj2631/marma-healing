/**
 * Posing toolkit for the Rocketbox character (used only by the recording studio, never shipped to users).
 * Units are centimetres; the character faces +z, his left side is +x.
 */
import * as THREE from 'three';

export type Side = 'L' | 'R';
export type V3 = [number, number, number];
export const v3 = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

/** Rotate `bone` so that the world point `from` (a child) moves towards `to`. */
function aim(bone: THREE.Bone, from: THREE.Vector3, to: THREE.Vector3) {
  const p = bone.getWorldPosition(new THREE.Vector3());
  const q = new THREE.Quaternion().setFromUnitVectors(from.clone().sub(p).normalize(), to.clone().sub(p).normalize());
  const parentQ = bone.parent!.getWorldQuaternion(new THREE.Quaternion());
  const world = q.multiply(bone.getWorldQuaternion(new THREE.Quaternion()));
  bone.quaternion.copy(parentQ.invert().multiply(world));
  bone.updateMatrixWorld(true);
}

export function setWorldQuat(bone: THREE.Object3D, q: THREE.Quaternion) {
  const parentQ = bone.parent!.getWorldQuaternion(new THREE.Quaternion());
  bone.quaternion.copy(parentQ.invert().multiply(q));
  bone.updateMatrixWorld(true);
}

const basis = (f: THREE.Vector3, n: THREE.Vector3) => {
  const x = f.clone().normalize();
  const y = n.clone().sub(x.clone().multiplyScalar(n.dot(x))).normalize();
  return new THREE.Matrix4().makeBasis(x, y, new THREE.Vector3().crossVectors(x, y));
};

/** Per-finger curl: one number (spread over the 3 joints) or three joint angles, degrees. */
export type Curl = number | [number, number, number];

export interface HandSpec {
  /** Which point of the hand should touch `target`. */
  contact: 'heel' | 'index' | 'middle' | 'tips4' | 'tips2' | 'thumb' | 'bunch' | 'pinch' | 'wrist';
  target: THREE.Vector3;
  /** Direction the (straight) fingers point, world. */
  fingers: THREE.Vector3;
  /** Direction the palm faces, world. */
  palm: THREE.Vector3;
  /** index, middle, ring, pinky. */
  curl?: [Curl, Curl, Curl, Curl];
  /** Fan the fingers apart (+) or together (−), degrees. */
  spread?: number;
  /** Thumb: tuck towards the index finger / across the palm, and bend of its joints, degrees. */
  thumb?: { tuck?: number; flex?: number; bend?: number };
  /** Elbow hint, offset from the shoulder (x is mirrored for the right side). */
  pole?: V3;
}

interface HandRig {
  s: 1 | -1;
  upper: THREE.Bone;
  fore: THREE.Bone;
  hand: THREE.Bone;
  F0: THREE.Vector3;
  N0: THREE.Vector3;
  Q0: THREE.Quaternion;
  /** [finger][joint] bones; finger 0 = thumb. */
  f: THREE.Bone[][];
  /** Curl axis per finger bone, in that bone's local frame. */
  curlAxis: Map<THREE.Bone, THREE.Vector3>;
  spreadAxis: Map<THREE.Bone, THREE.Vector3>;
  thumbTuck: THREE.Vector3;
  thumbFlex: Map<THREE.Bone, THREE.Vector3>;
}

export class Rig {
  bones: Record<string, THREE.Bone> = {};
  face: THREE.SkinnedMesh | null = null;
  skinned: THREE.SkinnedMesh[] = [];
  rest = new Map<THREE.Bone, THREE.Quaternion>();
  hands = {} as Record<Side, HandRig>;
  eyeRest = {} as Record<Side, THREE.Quaternion>;

  constructor(public model: THREE.Object3D) {
    model.traverse((o) => {
      if ((o as THREE.Bone).isBone) this.bones[o.name] = o as THREE.Bone;
      const m = o as THREE.SkinnedMesh;
      if (m.isSkinnedMesh) {
        this.skinned.push(m);
        if (m.morphTargetDictionary && Object.keys(m.morphTargetDictionary).length) this.face = m;
      }
    });
    model.updateMatrixWorld(true);
    Object.values(this.bones).forEach((b) => this.rest.set(b, b.quaternion.clone()));
    for (const L of ['L', 'R'] as Side[]) this.hands[L] = this.measureHand(L);
    this.measureRest();
    for (const L of ['L', 'R'] as Side[]) this.eyeRest[L] = this.b(`${L}Eye`).getWorldQuaternion(new THREE.Quaternion());
  }

  b(n: string) {
    const bone = this.bones[`Bip01_${n}`];
    if (!bone) throw new Error('no bone ' + n);
    return bone;
  }
  wp(n: string) {
    return this.b(n).getWorldPosition(new THREE.Vector3());
  }

  private measureHand(L: Side): HandRig {
    const H = this.wp(`${L}_Hand`);
    const F0 = this.wp(`${L}_Finger2`).sub(H).normalize();
    const lat = this.wp(`${L}_Finger1`).sub(this.wp(`${L}_Finger4`)).normalize();
    let N0 = new THREE.Vector3().crossVectors(lat, F0).normalize();
    if (this.wp(`${L}_Finger01`).sub(H).dot(N0) < 0) N0 = N0.negate();
    const A = new THREE.Vector3().crossVectors(F0, N0).normalize(); // + swings fingers towards the palm side
    const local = (b: THREE.Bone, w: THREE.Vector3) => w.clone().applyQuaternion(b.getWorldQuaternion(new THREE.Quaternion()).invert()).normalize();
    const f: THREE.Bone[][] = [0, 1, 2, 3, 4].map((i) => [`${L}_Finger${i}`, `${L}_Finger${i}1`, `${L}_Finger${i}2`].map((n) => this.b(n)));
    const curlAxis = new Map<THREE.Bone, THREE.Vector3>();
    const spreadAxis = new Map<THREE.Bone, THREE.Vector3>();
    for (let i = 1; i <= 4; i++)
      f[i].forEach((b) => {
        curlAxis.set(b, local(b, A));
        spreadAxis.set(b, local(b, N0));
      });
    // thumb tuck: about the palm normal, signed so + moves the tip towards the index finger
    const t0 = this.wp(`${L}_Finger0`);
    const tip = this.wp(`${L}_Finger02`);
    const idx = this.wp(`${L}_Finger1`);
    const T = N0.clone();
    if (tip.clone().sub(t0).applyAxisAngle(T, 0.2).add(t0).distanceTo(idx) > tip.distanceTo(idx)) T.negate();
    // thumb flex: + moves the tip out in front of the palm (+N0)
    const D = tip.clone().sub(t0).normalize();
    const Fx = new THREE.Vector3().crossVectors(D, N0).normalize();
    if (tip.clone().sub(t0).applyAxisAngle(Fx, 0.2).dot(N0) < tip.clone().sub(t0).dot(N0)) Fx.negate();
    const thumbFlex = new Map<THREE.Bone, THREE.Vector3>();
    f[0].forEach((b) => thumbFlex.set(b, local(b, Fx)));
    const eyeX = this.wp(`${L}Eye`).x;
    return {
      s: eyeX > 0 ? 1 : -1,
      upper: this.b(`${L}_UpperArm`),
      fore: this.b(`${L}_Forearm`),
      hand: this.b(`${L}_Hand`),
      F0,
      N0,
      Q0: this.b(`${L}_Hand`).getWorldQuaternion(new THREE.Quaternion()),
      f,
      curlAxis,
      spreadAxis,
      thumbTuck: local(f[0][0], T),
      thumbFlex,
    };
  }

  morph(name: string, v: number) {
    const m = this.face;
    if (!m) return;
    const i = m.morphTargetDictionary![`blendShape1.${name}`];
    if (i !== undefined) m.morphTargetInfluences![i] = v;
  }

  /** Back to the rest pose with a calm face. */
  reset({ eyesClosed = 0, smile = 0.45 } = {}) {
    this.rest.forEach((q, b) => b.quaternion.copy(q));
    if (this.face) this.face.morphTargetInfluences!.fill(0);
    this.morph('SR_05_Eye_Left_Blink', eyesClosed);
    this.morph('SR_12_Eye_Right_Blink', eyesClosed);
    this.morph('AK_44_MouthSmileLeft', smile);
    this.morph('AK_45_MouthSmileRight', smile);
    this.morph('AK_07_CheekSquintLeft', smile * 0.3);
    this.morph('AK_08_CheekSquintRight', smile * 0.3);
    // arms relaxed down by the sides instead of the T-pose
    this.model.updateMatrixWorld(true);
    for (const L of ['L', 'R'] as Side[]) {
      const h = this.hands[L];
      const sh = h.upper.getWorldPosition(new THREE.Vector3());
      this.ik(L, sh.clone().add(v3(h.s * 6, -52, 4)), [h.s * 30, -10, -20]);
    }
    this.model.updateMatrixWorld(true);
  }

  /** Look direction: yaw (+ = character's left) and pitch (+ = up), degrees; converge turns both eyes inward. */
  gaze(yaw: number, pitch: number, converge = 0) {
    for (const L of ['L', 'R'] as Side[]) {
      const s = this.hands[L].s;
      const y = THREE.MathUtils.degToRad(yaw - s * converge);
      const p = THREE.MathUtils.degToRad(-pitch);
      const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(p, y, 0, 'YXZ'));
      setWorldQuat(this.b(`${L}Eye`), q.multiply(this.eyeRest[L].clone()));
    }
  }

  private ik(L: Side, wrist: THREE.Vector3, pole: V3) {
    const h = this.hands[L];
    const a = h.upper.getWorldPosition(new THREE.Vector3());
    const b = h.fore.getWorldPosition(new THREE.Vector3());
    const c = h.hand.getWorldPosition(new THREE.Vector3());
    const lab = a.distanceTo(b);
    const lcb = b.distanceTo(c);
    const lat = Math.min(a.distanceTo(wrist), lab + lcb - 1e-3);
    const dir = wrist.clone().sub(a).normalize();
    const ang = Math.acos(THREE.MathUtils.clamp((lab * lab + lat * lat - lcb * lcb) / (2 * lab * lat), -1, 1));
    const pd = a.clone().add(v3(pole[0] * h.s, pole[1], pole[2])).sub(a);
    pd.sub(dir.clone().multiplyScalar(pd.dot(dir))).normalize();
    const elbow = a.clone().addScaledVector(dir, Math.cos(ang) * lab).addScaledVector(pd, Math.sin(ang) * lab);
    aim(h.upper, b, elbow);
    aim(h.fore, h.hand.getWorldPosition(new THREE.Vector3()), a.clone().addScaledVector(dir, lat));
  }

  /** Pad of a fingertip (finger 0 = thumb), world. */
  pad(L: Side, i: number) {
    const h = this.hands[L];
    const [, mid, dist] = h.f[i];
    const pm = mid.getWorldPosition(new THREE.Vector3());
    const pdist = dist.getWorldPosition(new THREE.Vector3());
    const len = pdist.distanceTo(pm);
    const dir = pdist.clone().sub(pm).normalize();
    // palm-side normal of this phalanx: the hand's palm normal carried by the bone's rotation
    const n = this.palmNormalOf(L, dist);
    return pdist.addScaledVector(dir, len * (i === 0 ? 0.7 : 0.62)).addScaledVector(n, i === 0 ? 0.55 : 0.45);
  }
  /** Very tip of a finger (nail end), world. */
  tip(L: Side, i: number) {
    const h = this.hands[L];
    const [, mid, dist] = h.f[i];
    const pm = mid.getWorldPosition(new THREE.Vector3());
    const pdist = dist.getWorldPosition(new THREE.Vector3());
    return pdist.clone().addScaledVector(pdist.clone().sub(pm).normalize(), pdist.distanceTo(pm) * (i === 0 ? 1.0 : 0.95));
  }
  private palmNormalOf(L: Side, bone: THREE.Bone) {
    const h = this.hands[L];
    // N0 was measured at rest; express it in the bone's rest frame, then carry it to the current frame.
    const restWorld = this.restWorldQuat(bone);
    const local = h.N0.clone().applyQuaternion(restWorld.invert());
    return local.applyQuaternion(bone.getWorldQuaternion(new THREE.Quaternion())).normalize();
  }
  private restWorldCache = new Map<THREE.Bone, THREE.Quaternion>();
  private restWorldQuat(bone: THREE.Bone) {
    let q = this.restWorldCache.get(bone);
    if (!q) {
      // computed lazily on first use, which happens before any pose in setup() via measureRest()
      q = bone.getWorldQuaternion(new THREE.Quaternion());
      this.restWorldCache.set(bone, q);
    }
    return q.clone();
  }
  /** Record rest-frame world rotations of every finger bone (call right after construction). */
  measureRest() {
    for (const L of ['L', 'R'] as Side[]) this.hands[L].f.flat().forEach((b) => this.restWorldQuat(b));
  }

  /** Current hand frame: F fingers, N palm normal, X towards the index/thumb side; all world, unit. */
  handFrame(L: Side) {
    const h = this.hands[L];
    const q = h.hand.getWorldQuaternion(new THREE.Quaternion()).multiply(h.Q0.clone().invert());
    const F = h.F0.clone().applyQuaternion(q);
    const N = h.N0.clone().applyQuaternion(q);
    const X = new THREE.Vector3().crossVectors(N, F).normalize();
    // make X point towards the index finger
    const idx = this.wp(`${L}_Finger1`).sub(this.wp(`${L}_Finger4`));
    if (idx.dot(X) < 0) X.negate();
    return { F, N, X, P: h.hand.getWorldPosition(new THREE.Vector3()) };
  }

  heel(L: Side) {
    const h = this.hands[L];
    const q = h.hand.getWorldQuaternion(new THREE.Quaternion()).multiply(h.Q0.clone().invert());
    const F = h.F0.clone().applyQuaternion(q);
    const N = h.N0.clone().applyQuaternion(q);
    return h.hand.getWorldPosition(new THREE.Vector3()).addScaledVector(F, 2.6).addScaledVector(N, 1.6);
  }

  contactPoint(L: Side, c: HandSpec['contact']) {
    switch (c) {
      case 'heel':
        return this.heel(L);
      case 'wrist':
        return this.b(`${L}_Hand`).getWorldPosition(new THREE.Vector3());
      case 'index':
        return this.pad(L, 1);
      case 'middle':
        return this.pad(L, 2);
      case 'thumb':
        return this.pad(L, 0);
      case 'tips2':
        return this.pad(L, 1).add(this.pad(L, 2)).multiplyScalar(0.5);
      case 'tips4':
        return [1, 2, 3, 4].map((i) => this.pad(L, i)).reduce((a, b) => a.add(b), new THREE.Vector3()).multiplyScalar(0.25);
      case 'bunch':
        return [0, 1, 2, 3, 4].map((i) => this.tip(L, i)).reduce((a, b) => a.add(b), new THREE.Vector3()).multiplyScalar(0.2);
      case 'pinch':
        return this.pad(L, 0).add(this.pad(L, 1)).multiplyScalar(0.5);
    }
  }

  /** Pose one arm + hand so the chosen contact point lands on the target. */
  hand(L: Side, spec: HandSpec) {
    const h = this.hands[L];
    const pole = spec.pole ?? [40, -55, 10];
    let wrist = spec.target.clone().addScaledVector(spec.fingers.clone().normalize(), -8);
    for (let it = 0; it < 4; it++) {
      this.ik(L, wrist, pole);
      const R = new THREE.Quaternion().setFromRotationMatrix(basis(spec.fingers, spec.palm).multiply(basis(h.F0, h.N0).transpose()));
      setWorldQuat(h.hand, R.multiply(h.Q0.clone()));
      this.fingers(L, spec);
      h.hand.updateMatrixWorld(true);
      const err = spec.target.clone().sub(this.contactPoint(L, spec.contact));
      if (err.length() < 0.02) break;
      wrist = wrist.add(err);
    }
  }

  private fingers(L: Side, spec: HandSpec) {
    const h = this.hands[L];
    const deg = THREE.MathUtils.degToRad;
    for (let i = 0; i <= 4; i++) h.f[i].forEach((b) => b.quaternion.copy(this.rest.get(b)!));
    const curl = spec.curl ?? [8, 8, 8, 8];
    for (let i = 1; i <= 4; i++) {
      const c = curl[i - 1];
      const j = Array.isArray(c) ? c : [c * 0.8, c, c * 0.7];
      h.f[i].forEach((b, k) => {
        b.quaternion.multiply(new THREE.Quaternion().setFromAxisAngle(h.curlAxis.get(b)!, deg(j[k])));
      });
      const sp = (spec.spread ?? 0) * (i - 2.5) * 0.5;
      const b0 = h.f[i][0];
      b0.quaternion.multiply(new THREE.Quaternion().setFromAxisAngle(h.spreadAxis.get(b0)!, deg(sp * -h.s)));
    }
    const th = spec.thumb ?? {};
    const [t0, t1, t2] = h.f[0];
    t0.quaternion.multiply(new THREE.Quaternion().setFromAxisAngle(h.thumbTuck, deg(th.tuck ?? 0)));
    t0.quaternion.multiply(new THREE.Quaternion().setFromAxisAngle(h.thumbFlex.get(t0)!, deg(th.flex ?? 0)));
    t1.quaternion.multiply(new THREE.Quaternion().setFromAxisAngle(h.thumbFlex.get(t1)!, deg((th.bend ?? 0) * 0.5)));
    t2.quaternion.multiply(new THREE.Quaternion().setFromAxisAngle(h.thumbFlex.get(t2)!, deg((th.bend ?? 0) * 0.5)));
  }
}

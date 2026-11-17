import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { Rig } from './rig';
import { POSES, measureLandmarks, type Landmarks } from './poses';
import LM from './landmarks.json';

const BASE = import.meta.env.BASE_URL + 'models/avatar/';

/**
 * Recording studio (debug only, never linked from the app): poses the character for one step and
 * renders single frames on demand via window.__frame(t), t = 0..1 through one rep.
 * URL: /preview/3d?studio=<stepId>&v=<variant>[&rec][&t=0.4]
 */
export default function Studio() {
  const host = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = host.current!;
    const qs = new URLSearchParams(location.search);
    const stepId = qs.get('studio')!;
    const variant = Number(qs.get('v') ?? 0);
    const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    el.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(qs.get('bg') ?? '#fdf8ee');
    const camera = new THREE.PerspectiveCamera(28, 1, 0.5, 2000);
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

    // glowing point markers
    const glowTex = (() => {
      const c = document.createElement('canvas');
      c.width = c.height = 64;
      const g = c.getContext('2d')!;
      const grd = g.createRadialGradient(32, 32, 0, 32, 32, 32);
      grd.addColorStop(0, 'rgba(255,250,235,1)');
      grd.addColorStop(0.25, 'rgba(255,190,70,0.95)');
      grd.addColorStop(0.6, 'rgba(244,140,30,0.35)');
      grd.addColorStop(1, 'rgba(244,140,30,0)');
      g.fillStyle = grd;
      g.fillRect(0, 0, 64, 64);
      const t = new THREE.CanvasTexture(c);
      t.colorSpace = THREE.SRGBColorSpace;
      return t;
    })();
    const markers: THREE.Sprite[] = [];
    const marker = (i: number) => {
      while (markers.length <= i) {
        const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, depthTest: false, transparent: true, toneMapped: false }));
        sp.renderOrder = 10;
        scene.add(sp);
        markers.push(sp);
      }
      return markers[i];
    };

    const tl = new THREE.TextureLoader();
    const tex = (f: string, srgb = true) => {
      const t = tl.load(BASE + f);
      t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
      t.anisotropy = 4;
      return t;
    };
    const manager = new THREE.LoadingManager();
    manager.setURLModifier((url) => (/\.tga$/i.test(url) ? 'data:,' : url));
    let rig: Rig | null = null;
    let lm: Landmarks | null = null;
    let pending = 0;
    manager.onLoad = () => {
      pending = 1;
    };
    const hairDark = Number(qs.get('hairtone') ?? 0.55);
    const hideHair = !qs.has('hair'); // hair cards hidden: the scalp texture reads as a short crop and keeps the hands clear
    new FBXLoader(manager).load(BASE + 'avatar.fbx', (fbx) => {
      const head = new THREE.MeshStandardMaterial({ map: tex('head_color.jpg'), normalMap: tex('head_normal.jpg', false), roughness: 0.62 });
      const body = new THREE.MeshStandardMaterial({ map: tex('body_color.jpg'), normalMap: tex('body_normal.jpg', false), roughness: 0.7 });
      const hair = new THREE.MeshStandardMaterial({
        map: tex('opacity_color.webp'),
        color: new THREE.Color(hairDark, hairDark, hairDark),
        alphaTest: 0.3,
        alphaToCoverage: true,
        side: THREE.DoubleSide,
        roughness: 0.85,
      });
      const hidden = new THREE.MeshBasicMaterial({ visible: false });
      fbx.traverse((o) => {
        const m = o as THREE.SkinnedMesh;
        if (!m.isMesh) return;
        m.frustumCulled = false;
        const pick = (mm: THREE.Material) => {
          const n = mm.name.toLowerCase();
          const map = (mm as THREE.MeshPhongMaterial).map?.name?.toLowerCase() ?? '';
          if (n.includes('opacity') || map.includes('opacity')) return hideHair ? hidden : hair;
          if (n.includes('head') || map.includes('head')) return head;
          return body;
        };
        m.material = Array.isArray(m.material) ? m.material.map(pick) : pick(m.material);
      });
      scene.add(fbx);
      rig = new Rig(fbx);
      rig.reset();
      lm = qs.has('measure') ? measureLandmarks(rig) : Object.fromEntries(Object.entries(LM).map(([k, v]) => [k, new THREE.Vector3(...(v as [number, number, number]))]));
      (window as unknown as Record<string, unknown>).__lm = Object.fromEntries(
        Object.entries(lm).map(([k, v]) => [k, (v as THREE.Vector3).toArray().map((x) => +x.toFixed(2))]),
      );
      document.body.setAttribute('data-3d-ready', '1');
    });

    const resize = () => {
      renderer.setSize(el.clientWidth, el.clientHeight);
      camera.aspect = el.clientWidth / el.clientHeight;
      camera.updateProjectionMatrix();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(el);

    const frame = (t: number, over?: Record<string, number>) => {
      if (!rig || !lm) return false;
      (window as unknown as Record<string, unknown>).__q = over ?? {};
      const fn = POSES[stepId];
      if (!fn) throw new Error('no pose for ' + stepId);
      const shot = fn(rig, t, variant, lm);
      rig.model.updateMatrixWorld(true);
      const camOver = over?.cam ? String(over.cam) : qs.get('cam');
      const tgt = shot.target.clone();
      const pos = camOver ? tgt.clone().add(new THREE.Vector3(...(camOver.split(',').map(Number) as [number, number, number]))) : shot.cam.clone();
      camera.fov = Number(qs.get('fov') ?? shot.fov ?? 28);
      camera.near = shot.near ?? 0.5;
      camera.updateProjectionMatrix();
      camera.position.copy(pos);
      camera.lookAt(tgt);
      markers.forEach((m) => (m.visible = false));
      if (!qs.has('nomark'))
        (shot.markers ?? []).forEach((mk, i) => {
          const sp = marker(i);
          sp.visible = mk.a > 0.01;
          sp.material.opacity = mk.a;
          sp.position.copy(mk.p);
          const sz = (mk.size ?? 1.6) * (0.85 + 0.15 * mk.a);
          sp.scale.set(sz, sz, 1);
        });
      renderer.render(scene, camera);
      return true;
    };
    (window as unknown as Record<string, unknown>).__frame = frame;
    let raf = 0;
    const t0 = performance.now();
    const fixed = Number(qs.get('t') ?? 'NaN');
    const loop = () => {
      raf = requestAnimationFrame(loop);
      if (pending) frame(Number.isFinite(fixed) ? fixed : (((performance.now() - t0) / 1000) % 4) / 4);
    };
    if (!qs.has('rec')) loop();
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      renderer.dispose();
      el.removeChild(renderer.domElement);
    };
  }, []);
  return <div ref={host} className="fixed inset-0" />;
}

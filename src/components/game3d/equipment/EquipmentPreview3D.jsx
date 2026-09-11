import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';

const ARCHER_URL = 'https://base44.app/api/apps/6876751a602125f45f1861b9/files/public/6876751a602125f45f1861b9/3f915913a_ErikaArcher.fbx';
const IDLE_URL = 'https://base44.app/api/apps/6876751a602125f45f1861b9/files/public/6876751a602125f45f1861b9/9922e6dd0_Idle.fbx';

const DEFAULT_VISIBILITY = Object.freeze({ body: true, outfit: true, hair: true, weapon: true });

function classifyMesh(name = '') {
  const n = name.toLowerCase();
  if (/(weapon|sword|blade|bow|arrow|spear|staff|gun|rifle)/.test(n)) return 'weapon';
  if (/(hair|head|helmet|hat|mask)/.test(n)) return 'hair';
  if (/(cloth|clothes|outfit|armor|armour|chest|glove|boot|shoe|cape|wing|costume)/.test(n)) return 'outfit';
  return 'body';
}

export default function EquipmentPreview3D({ visibility = DEFAULT_VISIBILITY }) {
  const containerRef = useRef(null);
  const pivotRef = useRef(null);
  const cameraRef = useRef(null);
  const visibilityRef = useRef(visibility);

  useEffect(() => { visibilityRef.current = { ...DEFAULT_VISIBILITY, ...visibility }; }, [visibility]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;

    const scene = new THREE.Scene();
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    const camera = new THREE.PerspectiveCamera(32, container.clientWidth / container.clientHeight, 0.1, 100);
    camera.position.set(0, 1.42, 3.55);
    camera.lookAt(0, 1.02, 0);
    cameraRef.current = camera;

    scene.add(new THREE.HemisphereLight(0xe8f3ff, 0x071018, 1.05));
    const key = new THREE.DirectionalLight(0xffffff, 1.6);
    key.position.set(3.5, 5, 4.5);
    scene.add(key);
    const rim = new THREE.DirectionalLight(0x7dd3fc, 1.2);
    rim.position.set(-4, 2.5, -3);
    scene.add(rim);
    const warm = new THREE.PointLight(0xfbbf24, 0.45, 7);
    warm.position.set(2, 1.4, 1.5);
    scene.add(warm);

    const floor = new THREE.Mesh(
      new THREE.RingGeometry(0.72, 1.12, 96),
      new THREE.MeshBasicMaterial({ color: 0x9bdcff, transparent: true, opacity: 0.08, side: THREE.DoubleSide }),
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 0.015;
    scene.add(floor);

    const pivot = new THREE.Group();
    pivot.position.x = 0.25;
    scene.add(pivot);
    pivotRef.current = pivot;

    const loader = new FBXLoader();
    const clock = new THREE.Clock();
    let mixer = null;
    let frameId = 0;
    let disposed = false;

    loader.load(ARCHER_URL, (fbx) => {
      if (disposed) return;
      const box = new THREE.Box3().setFromObject(fbx);
      const size = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z) || 1;
      fbx.scale.setScalar(1.9 / maxDim);
      fbx.position.set(0, 0, 0);
      fbx.traverse((node) => {
        if (!node.isMesh) return;
        node.castShadow = false;
        node.receiveShadow = false;
        node.userData.appearanceGroup = classifyMesh(node.name);
      });
      pivot.add(fbx);
      mixer = new THREE.AnimationMixer(fbx);
      loader.load(IDLE_URL, (anim) => {
        if (disposed) return;
        const clip = anim.animations?.[0];
        if (clip && mixer) mixer.clipAction(clip).reset().fadeIn(0.25).play();
      });
    });

    const drag = { active: false, x: 0 };
    const onPointerDown = (e) => {
      drag.active = true;
      drag.x = e.clientX;
      renderer.domElement.setPointerCapture?.(e.pointerId);
    };
    const onPointerMove = (e) => {
      if (!drag.active || !pivotRef.current) return;
      const dx = e.clientX - drag.x;
      drag.x = e.clientX;
      pivotRef.current.rotation.y += dx * 0.008;
    };
    const onPointerUp = () => { drag.active = false; };
    const onWheel = (e) => {
      e.preventDefault();
      if (!cameraRef.current) return;
      cameraRef.current.position.z = THREE.MathUtils.clamp(cameraRef.current.position.z + e.deltaY * 0.0025, 2.55, 5.2);
    };

    renderer.domElement.style.cursor = 'grab';
    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    renderer.domElement.addEventListener('pointermove', onPointerMove);
    renderer.domElement.addEventListener('pointerup', onPointerUp);
    renderer.domElement.addEventListener('pointercancel', onPointerUp);
    renderer.domElement.addEventListener('wheel', onWheel, { passive: false });

    const animate = () => {
      frameId = requestAnimationFrame(animate);
      mixer?.update(clock.getDelta());
      pivot.traverse((node) => {
        if (!node.isMesh) return;
        const group = node.userData.appearanceGroup || 'body';
        node.visible = visibilityRef.current[group] !== false;
      });
      floor.rotation.z += 0.0012;
      renderer.render(scene, camera);
    };
    animate();

    const onResize = () => {
      if (!container.clientWidth || !container.clientHeight) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', onResize);

    return () => {
      disposed = true;
      cancelAnimationFrame(frameId);
      window.removeEventListener('resize', onResize);
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      renderer.domElement.removeEventListener('pointermove', onPointerMove);
      renderer.domElement.removeEventListener('pointerup', onPointerUp);
      renderer.domElement.removeEventListener('pointercancel', onPointerUp);
      renderer.domElement.removeEventListener('wheel', onWheel);
      if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement);
      renderer.dispose();
      scene.traverse((node) => {
        node.geometry?.dispose?.();
        if (Array.isArray(node.material)) node.material.forEach((m) => m?.dispose?.());
        else node.material?.dispose?.();
      });
    };
  }, []);

  return <div ref={containerRef} className="w-full h-full pointer-events-auto" title="Drag to rotate · Wheel to zoom" />;
}

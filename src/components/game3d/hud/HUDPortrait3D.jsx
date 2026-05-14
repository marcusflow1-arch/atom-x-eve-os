import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';

const ARCHER_URL = 'https://base44.app/api/apps/6876751a602125f45f1861b9/files/public/6876751a602125f45f1861b9/3f915913a_ErikaArcher.fbx';
const IDLE_URL = 'https://base44.app/api/apps/6876751a602125f45f1861b9/files/public/6876751a602125f45f1861b9/9922e6dd0_Idle.fbx';

/**
 * Small live 3D portrait of the archer — used in the bottom-center HUD
 * next to HP / Mana / XP bars. Idles continuously, framed on the face.
 */
export default function HUDPortrait3D({ size = 86 }) {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    scene.background = null;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(size, size);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(renderer.domElement);

    const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 50);
    // Frame on the head/shoulders
    camera.position.set(0, 1.65, 1.6);
    camera.lookAt(0, 1.55, 0);

    scene.add(new THREE.HemisphereLight(0xeaf0f6, 0x1a1d22, 0.9));
    const key = new THREE.DirectionalLight(0xffffff, 1.5);
    key.position.set(2, 3, 3);
    scene.add(key);
    const rim = new THREE.DirectionalLight(0x9ab6ff, 0.8);
    rim.position.set(-2, 1, -2);
    scene.add(rim);

    const loader = new FBXLoader();
    const clock = new THREE.Clock();
    let mixer = null;

    loader.load(ARCHER_URL, (fbx) => {
      const box = new THREE.Box3().setFromObject(fbx);
      const sz = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(sz.x, sz.y, sz.z);
      fbx.scale.setScalar(1.8 / maxDim);
      // Slight rotation for flattering 3/4 view
      fbx.rotation.y = 0.25;
      scene.add(fbx);
      mixer = new THREE.AnimationMixer(fbx);
      loader.load(IDLE_URL, (anim) => {
        const clip = anim.animations?.[0];
        if (clip && mixer) mixer.clipAction(clip).reset().play();
      });
    });

    let frameId;
    const animate = () => {
      frameId = requestAnimationFrame(animate);
      if (mixer) mixer.update(clock.getDelta());
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(frameId);
      if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement);
      renderer.dispose();
    };
  }, [size]);

  return (
    <div
      ref={containerRef}
      style={{
        width: size,
        height: size,
        background: 'radial-gradient(circle at 50% 40%, rgba(70,90,120,0.55), rgba(10,12,18,0.95))',
        border: '1px solid rgba(180,160,110,0.45)',
        boxShadow: '0 4px 14px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.06)',
        borderRadius: 4,
        overflow: 'hidden',
      }}
    />
  );
}
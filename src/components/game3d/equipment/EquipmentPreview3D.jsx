import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';

// Same archer + idle anim used by GameWorld3D — small isolated preview
const ARCHER_URL = 'https://base44.app/api/apps/6876751a602125f45f1861b9/files/public/6876751a602125f45f1861b9/3f915913a_ErikaArcher.fbx';
const IDLE_URL = 'https://base44.app/api/apps/6876751a602125f45f1861b9/files/public/6876751a602125f45f1861b9/9922e6dd0_Idle.fbx';

/**
 * Self-contained 3D preview of the player character for the equipment menu.
 * Matches the Where Winds Meet layout — character centered, soft rim light,
 * neutral gradient background. Drag to rotate.
 */
export default function EquipmentPreview3D() {
  const containerRef = useRef(null);
  const drag = useRef({ active: false, x: 0, yaw: 0 });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    scene.background = null;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    container.appendChild(renderer.domElement);

    const camera = new THREE.PerspectiveCamera(
      35,
      container.clientWidth / container.clientHeight,
      0.1,
      100,
    );
    camera.position.set(0, 1.5, 3.4);
    camera.lookAt(0, 1.0, 0);

    // 3-point lighting
    scene.add(new THREE.HemisphereLight(0xe6ecf2, 0x1a1d22, 0.7));
    const key = new THREE.DirectionalLight(0xffffff, 1.4);
    key.position.set(3, 4, 4);
    scene.add(key);
    const rim = new THREE.DirectionalLight(0xa8c0ff, 0.9);
    rim.position.set(-3, 2, -3);
    scene.add(rim);

    const pivot = new THREE.Group();
    scene.add(pivot);

    const loader = new FBXLoader();
    const clock = new THREE.Clock();
    let mixer = null;
    let model = null;

    loader.load(ARCHER_URL, (fbx) => {
      model = fbx;
      const box = new THREE.Box3().setFromObject(fbx);
      const size = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);
      const scale = 1.8 / maxDim;
      fbx.scale.setScalar(scale);
      fbx.position.set(0, 0, 0);
      fbx.traverse((n) => {
        if (n.isMesh) {
          n.castShadow = false;
          n.receiveShadow = false;
        }
      });
      pivot.add(fbx);

      mixer = new THREE.AnimationMixer(fbx);
      loader.load(IDLE_URL, (anim) => {
        const clip = anim.animations?.[0];
        if (clip && mixer) {
          mixer.clipAction(clip).reset().fadeIn(0.3).play();
        }
      });
    });

    // Drag to rotate
    const onDown = (e) => {
      drag.current.active = true;
      drag.current.x = e.clientX;
    };
    const onUp = () => { drag.current.active = false; };
    const onMove = (e) => {
      if (!drag.current.active) return;
      const dx = e.clientX - drag.current.x;
      drag.current.x = e.clientX;
      drag.current.yaw += dx * 0.01;
    };
    renderer.domElement.addEventListener('mousedown', onDown);
    window.addEventListener('mouseup', onUp);
    window.addEventListener('mousemove', onMove);

    let frameId;
    const animate = () => {
      frameId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      if (mixer) mixer.update(delta);
      // Slow auto-rotate when idle
      if (!drag.current.active) drag.current.yaw += delta * 0.15;
      pivot.rotation.y = drag.current.yaw;
      renderer.render(scene, camera);
    };
    animate();

    const onResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('resize', onResize);
      renderer.domElement.removeEventListener('mousedown', onDown);
      if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement);
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="w-full h-full cursor-grab active:cursor-grabbing"
      style={{
        background: 'radial-gradient(circle at 50% 60%, rgba(80,90,110,0.45) 0%, rgba(20,22,28,0.85) 70%)',
      }}
    />
  );
}
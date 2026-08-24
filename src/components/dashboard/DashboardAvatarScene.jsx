import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';

const YBOT_URL = 'https://base44.app/api/apps/6876751a602125f45f1861b9/files/public/6876751a602125f45f1861b9/608211a0f_YBot1.fbx';
const C1_URL = 'https://base44.app/api/apps/6876751a602125f45f1861b9/files/public/6876751a602125f45f1861b9/3f915913a_ErikaArcher.fbx';
const IDLE_URL = 'https://base44.app/api/apps/6876751a602125f45f1861b9/files/public/6876751a602125f45f1861b9/9922e6dd0_Idle.fbx';

export default function DashboardAvatarScene() {
  const containerRef = useRef(null);
  const rendererRef = useRef(null);
  const mixerRef = useRef(null);
  const animationRef = useRef(null);
  const [failed, setFailed] = useState(false);
  const [activeChar, setActiveChar] = useState(() => localStorage.getItem('luna_active_character') || 'ybot');

  useEffect(() => {
    const handler = (event) => setActiveChar(event.detail?.active || 'ybot');
    window.addEventListener('characterSwitched', handler);
    return () => window.removeEventListener('characterSwitched', handler);
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    if (rendererRef.current) {
      rendererRef.current.dispose();
      rendererRef.current.domElement?.remove();
      rendererRef.current = null;
    }

    const width = Math.max(1, container.clientWidth);
    const height = Math.max(1, container.clientHeight);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(30, width / height, 0.1, 100);
    camera.position.set(0, 1.35, -2.7);
    camera.lookAt(0, 1.05, 0);

    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
    } catch (error) {
      console.warn('[DashboardAvatarScene] WebGL unavailable:', error?.message);
      setFailed(true);
      return;
    }

    setFailed(false);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, height);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    scene.add(new THREE.AmbientLight(0xffffff, 0.7));
    const key = new THREE.DirectionalLight(0xffffff, 2.2);
    key.position.set(2, 4, 2);
    scene.add(key);
    const fill = new THREE.DirectionalLight(0xffffff, 1.1);
    fill.position.set(-2, 2, -1);
    scene.add(fill);
    const rim = new THREE.DirectionalLight(0xffffff, 1.4);
    rim.position.set(0, 2, -4);
    scene.add(rim);

    const loader = new FBXLoader();
    const modelUrl = activeChar === 'ybot' ? YBOT_URL : C1_URL;
    let disposed = false;
    const clock = new THREE.Clock();

    loader.load(modelUrl, (fbx) => {
      if (disposed) return;
      const box = new THREE.Box3().setFromObject(fbx);
      const size = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z) || 1;
      const scale = 2.5 / maxDim;
      fbx.scale.setScalar(scale);
      const center = box.getCenter(new THREE.Vector3());
      fbx.position.sub(center.multiplyScalar(scale));
      fbx.position.y += (size.y * scale) / 2;
      fbx.rotation.y = Math.PI;

      fbx.traverse((node) => {
        if (!node.isMesh || !node.material) return;
        const materials = Array.isArray(node.material) ? node.material : [node.material];
        materials.forEach((material) => {
          material.side = THREE.DoubleSide;
          material.envMapIntensity = 1.2;
          material.needsUpdate = true;
        });
      });

      scene.add(fbx);
      const mixer = new THREE.AnimationMixer(fbx);
      mixerRef.current = mixer;
      loader.load(IDLE_URL, (idle) => {
        if (!disposed && idle.animations?.length) mixer.clipAction(idle.animations[0]).play();
      });
    }, undefined, (error) => {
      if (!disposed) {
        console.warn('[DashboardAvatarScene] Failed to load avatar:', error);
        setFailed(true);
      }
    });

    const render = () => {
      if (disposed) return;
      animationRef.current = requestAnimationFrame(render);
      mixerRef.current?.update(clock.getDelta());
      renderer.render(scene, camera);
    };
    render();

    const resize = () => {
      if (!container || !renderer) return;
      const w = Math.max(1, container.clientWidth);
      const h = Math.max(1, container.clientHeight);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    const observer = new ResizeObserver(resize);
    observer.observe(container);
    window.addEventListener('resize', resize);

    return () => {
      disposed = true;
      cancelAnimationFrame(animationRef.current);
      window.removeEventListener('resize', resize);
      observer.disconnect();
      mixerRef.current = null;
      renderer.dispose();
      renderer.domElement?.remove();
      rendererRef.current = null;
      scene.traverse((node) => {
        if (node.isMesh) {
          node.geometry?.dispose();
          const materials = Array.isArray(node.material) ? node.material : [node.material];
          materials.forEach((material) => material?.dispose?.());
        }
      });
    };
  }, [activeChar]);

  return (
    <div ref={containerRef} className="relative w-full h-full overflow-hidden">
      {failed && (
        <div className="absolute inset-0 flex items-center justify-center text-white/35 text-xs">
          3D preview unavailable
        </div>
      )}
    </div>
  );
}

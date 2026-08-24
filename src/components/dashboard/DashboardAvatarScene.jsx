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
  // This dashboard viewer is intentionally locked to the Y-Bot requested for the screensaver.
  const [activeChar, setActiveChar] = useState('ybot');

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

    // Wider field of view + comfortable camera distance keeps the full avatar
    // visible even when the transparent viewer is rendered in a wide 70% panel.
    const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 100);
    camera.position.set(0, 1.45, 4.6);
    camera.lookAt(0, 1.15, 0);

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

      // Normalize the model and then fit the camera from the actual bounds so
      // head, hands and feet remain visible instead of being cropped.
      const initialBox = new THREE.Box3().setFromObject(fbx);
      const initialSize = initialBox.getSize(new THREE.Vector3());
      const maxDim = Math.max(initialSize.x, initialSize.y, initialSize.z) || 1;
      const scale = 1.65 / maxDim;
      fbx.scale.setScalar(scale);

      const scaledBox = new THREE.Box3().setFromObject(fbx);
      const scaledSize = scaledBox.getSize(new THREE.Vector3());
      const scaledCenter = scaledBox.getCenter(new THREE.Vector3());

      fbx.position.sub(scaledCenter);
      fbx.position.y += scaledSize.y / 2;
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

      // Fit vertically with generous breathing room. This is intentionally
      // calculated from the final normalized height rather than hard-coded.
      const verticalFov = THREE.MathUtils.degToRad(camera.fov);
      const fitDistance = (scaledSize.y / 2) / Math.tan(verticalFov / 2) * 1.28;
      camera.position.set(0, scaledSize.y * 0.50, Math.max(4.2, fitDistance));
      camera.lookAt(0, scaledSize.y * 0.52, 0);

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
import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';


const YBOT_URL = 'https://base44.app/api/apps/6876751a602125f45f1861b9/files/public/6876751a602125f45f1861b9/608211a0f_YBot1.fbx';
const C1_URL = 'https://base44.app/api/apps/6876751a602125f45f1861b9/files/public/6876751a602125f45f1861b9/3f915913a_ErikaArcher.fbx';
const IDLE_URL = 'https://base44.app/api/apps/6876751a602125f45f1861b9/files/public/6876751a602125f45f1861b9/9922e6dd0_Idle.fbx';

export default function MiniAvatarViewer({ size = 80, fill = false, style }) {
  const containerRef = useRef(null);
  const sceneRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const scene = new THREE.Scene();
    scene.background = null;
    sceneRef.current = scene;

    const activeChar = localStorage.getItem('luna_active_character') || 'ybot';
    const modelUrl = activeChar === 'ybot' ? YBOT_URL : C1_URL;

    const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
    camera.position.set(0, 1.85, -1.4);
    camera.lookAt(0, 1.7, 0);

    const w = fill ? (containerRef.current.clientWidth || 220) : size;
    const h = fill ? (containerRef.current.clientHeight || 256) : size;
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setClearColor(0x000000, 0);
    containerRef.current.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xffffff, 0.6));

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.0);
    keyLight.position.set(2, 3, 2);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xffffff, 1.0);
    fillLight.position.set(-2, 2, -1);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xffffff, 1.5);
    rimLight.position.set(0, 1.5, -3);
    scene.add(rimLight);

    let mixer = null;
    const clock = new THREE.Clock();

    const loader = new FBXLoader();

    loader.load(
      modelUrl,
      (fbx) => {
        const box = new THREE.Box3().setFromObject(fbx);
        const sizeVector = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(sizeVector.x, sizeVector.y, sizeVector.z);
        const scale = 2 / maxDim;
        fbx.scale.setScalar(scale);

        const center = box.getCenter(new THREE.Vector3());
        fbx.position.sub(center.multiplyScalar(scale));
        fbx.position.y += (sizeVector.y * scale) / 2;
        fbx.rotation.y = Math.PI;

        fbx.traverse((node) => {
          if (node.isMesh && node.material) {
            const mats = Array.isArray(node.material) ? node.material : [node.material];
            mats.forEach((mat) => {
              mat.side = THREE.DoubleSide;
              mat.envMapIntensity = 1.2;
              mat.needsUpdate = true;
            });
          }
        });

        scene.add(fbx);
        mixer = new THREE.AnimationMixer(fbx);

        loader.load(
          IDLE_URL,
          (idleFbx) => {
            if (idleFbx.animations && idleFbx.animations.length > 0) {
              const clip = idleFbx.animations[0];
              mixer.clipAction(clip).play();
            }
          },
          undefined,
          (err) => console.error('Error loading idle animation:', err)
        );
      },
      undefined,
      (err) => console.error('Error loading mini avatar:', err)
    );

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      const delta = clock.getDelta();
      if (mixer) mixer.update(delta);
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      renderer.dispose();
      if (containerRef.current && renderer.domElement) {
        containerRef.current.removeChild(renderer.domElement);
      }
    };
  }, [size]);

  return (
    <div 
      ref={containerRef} 
      className="overflow-hidden"
      style={fill ? { width: '100%', height: '100%', ...style } : { width: size, height: size, background: 'rgba(20, 20, 30, 0.6)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', ...style }} 
    />
  );
}
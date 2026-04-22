import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { base44 } from '@/api/base44Client';

const YBOT_URL = 'https://base44.app/api/apps/6876751a602125f45f1861b9/files/public/6876751a602125f45f1861b9/608211a0f_YBot1.fbx';

export default function StoreIdleViewer() {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;

    // --- Scene ---
    const scene = new THREE.Scene();

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    // --- Camera ---
    const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 100);
    camera.position.set(0, 0.8, 2.2);
    camera.lookAt(0, 0.5, 0);

    // --- Lights ---
    scene.add(new THREE.HemisphereLight(0xffffff, 0x444444, 1.2));
    const dir = new THREE.DirectionalLight(0xffffff, 2.0);
    dir.position.set(2, 4, 3);
    scene.add(dir);
    const fill = new THREE.DirectionalLight(0xffffff, 0.8);
    fill.position.set(-2, 2, -2);
    scene.add(fill);

    let mixer;
    let animFrameId;
    const clock = new THREE.Clock();

    // --- Load Y-Bot ---
    const fbxLoader = new FBXLoader();
    const gltfLoader = new GLTFLoader();

    fbxLoader.load(YBOT_URL, async (fbx) => {
      fbx.scale.set(0.001, 0.001, 0.001);
      fbx.position.set(0, -0.5, 0);
      fbx.traverse(c => {
        if (c.isMesh) { c.castShadow = !c.isSkinnedMesh; c.receiveShadow = true; }
      });
      scene.add(fbx);

      mixer = new THREE.AnimationMixer(fbx);
      mixer.timeScale = 1.0;

      // Fetch idle animation from admin
      try {
        const animations = await base44.entities.AnimationFBX.list();
        const idleAnim = animations.find(a => (a.name || '').toLowerCase().trim() === 'idle');
        if (idleAnim) {
          const lower = (idleAnim.file_url || '').toLowerCase();
          let animAsset;
          if (lower.endsWith('.glb') || lower.endsWith('.gltf')) {
            const gltf = await gltfLoader.loadAsync(idleAnim.file_url);
            animAsset = { animations: gltf.animations || [] };
          } else {
            animAsset = await fbxLoader.loadAsync(idleAnim.file_url);
          }
          if (animAsset?.animations?.length > 0) {
            const action = mixer.clipAction(animAsset.animations[0]);
            action.setLoop(THREE.LoopRepeat, Infinity);
            action.play();
          }
        } else if (fbx.animations?.length > 0) {
          // Fallback to embedded animation
          const action = mixer.clipAction(fbx.animations[0]);
          action.setLoop(THREE.LoopRepeat, Infinity);
          action.play();
        }
      } catch (e) {
        console.warn('StoreIdleViewer: could not load idle anim', e);
      }
    }, undefined, (err) => console.error('StoreIdleViewer: Y-Bot load error', err));

    // --- Render Loop ---
    const animate = () => {
      animFrameId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      if (mixer) mixer.update(delta);
      renderer.render(scene, camera);
    };
    animate();

    // --- Resize ---
    const handleResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animFrameId);
      window.removeEventListener('resize', handleResize);
      if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement);
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        background: 'transparent',
        position: 'relative',
        overflow: 'hidden',
        borderRadius: '0.75rem',
      }}
    />
  );
}
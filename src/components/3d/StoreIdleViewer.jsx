import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';

const MODEL_URL = 'https://base44.app/api/apps/6876751a602125f45f1861b9/files/mp/public/6876751a602125f45f1861b9/c586602ff_tomb_raider_laracroft.glb';
const IDLE_ANIM_URL = 'https://base44.app/api/apps/6876751a602125f45f1861b9/files/public/6876751a602125f45f1861b9/b7fd6fb1f_standingidle01.fbx';

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

    // --- Load GLB model then FBX idle animation ---
    const gltfLoader = new GLTFLoader();
    const fbxLoader = new FBXLoader();

    gltfLoader.load(MODEL_URL, (gltf) => {
      const model = gltf.scene;

      // Auto-center and scale
      const box = new THREE.Box3().setFromObject(model);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);
      const scale = 2 / maxDim;
      model.scale.multiplyScalar(scale);
      model.position.sub(center.multiplyScalar(scale));

      scene.add(model);
      mixer = new THREE.AnimationMixer(model);

      // If the GLB has its own idle, use it first
      if (gltf.animations?.length > 0) {
        const idleClip = gltf.animations.find(a => /idle/i.test(a.name)) || gltf.animations[0];
        const action = mixer.clipAction(idleClip);
        action.setLoop(THREE.LoopRepeat, Infinity);
        action.play();
      } else {
        // Load external FBX idle animation and retarget to GLB skeleton
        fbxLoader.load(IDLE_ANIM_URL, (fbx) => {
          if (fbx.animations?.length > 0) {
            const clip = fbx.animations[0];
            // Retarget tracks to match GLB bone names
            clip.tracks = clip.tracks.map(track => {
              // FBX mixamo rigs often have "mixamorig:" prefix
              const name = track.name.replace(/^mixamorig[: ]/i, '');
              return new track.constructor(name, track.times, track.values, track.interpolation);
            });
            const action = mixer.clipAction(clip);
            action.setLoop(THREE.LoopRepeat, Infinity);
            action.play();
          }
        }, undefined, (err) => console.warn('StoreIdleViewer: FBX anim load error', err));
      }
    }, undefined, (err) => console.error('StoreIdleViewer: model load error', err));

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
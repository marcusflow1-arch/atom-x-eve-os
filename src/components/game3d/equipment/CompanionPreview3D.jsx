import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';

/**
 * Self-contained live 3D preview of the active companion (wolf mount).
 * Loads the companion model and plays its idle clip. Same pattern as
 * EquipmentPreview3D, adapted for GLB-with-embedded-clips.
 */
export default function CompanionPreview3D({ companion }) {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !companion) return;

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
    camera.position.set(0, 1.1, 3.2);
    camera.lookAt(0, 0.7, 0);

    // 3-point lighting matching the player preview
    scene.add(new THREE.HemisphereLight(0xe6ecf2, 0x1a1d22, 0.7));
    const key = new THREE.DirectionalLight(0xffffff, 1.4);
    key.position.set(3, 4, 4);
    scene.add(key);
    const rim = new THREE.DirectionalLight(0xa8c0ff, 0.9);
    rim.position.set(-3, 2, -3);
    scene.add(rim);

    const pivot = new THREE.Group();
    scene.add(pivot);

    const clock = new THREE.Clock();
    let mixer = null;
    let frameId;
    let disposed = false;

    const setupModel = (model, clips = []) => {
      if (disposed) return;
      const box = new THREE.Box3().setFromObject(model);
      const size = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);
      const scale = 1.8 / maxDim;
      model.scale.setScalar(scale);
      // Center on pivot
      const center = box.getCenter(new THREE.Vector3()).multiplyScalar(scale);
      model.position.set(-center.x, -box.min.y * scale, -center.z);
      model.traverse((n) => {
        if (n.isMesh) {
          n.castShadow = false;
          n.receiveShadow = false;
        }
      });
      // Face slightly toward camera (rotate so wolf shows its side/3-quarter)
      pivot.rotation.y = Math.PI * 0.15;
      pivot.add(model);

      if (clips.length > 0) {
        mixer = new THREE.AnimationMixer(model);
        const findClip = (substr) => {
          if (!substr) return null;
          const lc = substr.toLowerCase();
          return clips.find((c) => (c.name || '').toLowerCase().includes(lc)) || null;
        };
        const idleClip = findClip(companion.idleClipName) || clips[0];
        if (idleClip) {
          mixer.clipAction(idleClip).reset().fadeIn(0.3).play();
        }
      }
    };

    if (companion.modelFormat === 'glb') {
      const gltfLoader = new GLTFLoader();
      gltfLoader.load(
        companion.modelUrl,
        (gltf) => {
          const root = gltf.scene || gltf.scenes?.[0];
          if (!root) return;
          // If a separate animations GLB is provided, load it and retarget
          // its clips onto this model. Otherwise use any embedded clips.
          if (companion.animationsUrl) {
            setupModel(root, []);
            gltfLoader.load(
              companion.animationsUrl,
              (animGltf) => {
                if (disposed) return;
                const clips = animGltf.animations || [];
                if (clips.length === 0) return;
                mixer = new THREE.AnimationMixer(root);
                const findClip = (substr) => {
                  if (!substr) return null;
                  const lc = substr.toLowerCase();
                  return clips.find((c) => (c.name || '').toLowerCase().includes(lc)) || null;
                };
                const idleClip = findClip(companion.idleClipName) || clips[0];
                if (idleClip) mixer.clipAction(idleClip).reset().fadeIn(0.3).play();
              },
              undefined,
              (err) => console.error('Companion preview anim GLB load error:', err),
            );
          } else {
            setupModel(root, gltf.animations || []);
          }
        },
        undefined,
        (err) => console.error('Companion preview GLB load error:', err),
      );
    } else {
      const fbxLoader = new FBXLoader();
      fbxLoader.load(companion.modelUrl, (fbx) => {
        setupModel(fbx, []);
        if (companion.idleAnim) {
          fbxLoader.load(companion.idleAnim, (af) => {
            if (af.animations?.[0] && !mixer) {
              mixer = new THREE.AnimationMixer(fbx);
            }
            if (af.animations?.[0] && mixer) {
              mixer.clipAction(af.animations[0]).reset().fadeIn(0.3).play();
            }
          });
        }
      });
    }

    const animate = () => {
      frameId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      if (mixer) mixer.update(delta);
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
      disposed = true;
      cancelAnimationFrame(frameId);
      window.removeEventListener('resize', onResize);
      if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement);
      renderer.dispose();
    };
  }, [companion]);

  return <div ref={containerRef} className="w-full h-full" />;
}
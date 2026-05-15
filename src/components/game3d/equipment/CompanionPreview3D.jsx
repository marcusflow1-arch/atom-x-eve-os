import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';
import { getActiveCompanion } from './companionFusionStore';
import { createCompanionLoadingManager } from '../companionData';

/**
 * Self-contained live 3D preview of the active companion — used in the equipment
 * menu in place of the static portrait box. Loads the companion's GLB mesh and
 * plays its idle animation (either embedded clips or pulled from the externalAnimUrl).
 */
export default function CompanionPreview3D() {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const companion = getActiveCompanion();
    if (!companion) return;

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
    // Match the player preview's camera framing so the companion's feet
    // line up with the player's feet at the same ground plane (y=0).
    camera.position.set(0, 1.5, 3.4);
    camera.lookAt(0, 1.0, 0);

    // 3-point lighting (same recipe as player preview)
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

    const setupModel = (root, clips) => {
      const box = new THREE.Box3().setFromObject(root);
      const size = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);
      // Bigger than before (was 1.6) — companion now reads at a comparable
      // visual weight to the player character in the preview.
      const scale = 2.4 / maxDim;
      root.scale.setScalar(scale);
      // Anchor feet to ground (y=0) and center horizontally, matching the
      // player preview where the character stands on the same ground plane.
      const center = box.getCenter(new THREE.Vector3());
      root.position.x -= center.x * scale;
      root.position.y -= box.min.y * scale;
      root.position.z -= center.z * scale;

      root.traverse((n) => {
        if (n.isMesh) {
          n.castShadow = false;
          n.receiveShadow = false;
        }
      });
      pivot.add(root);

      if (clips && clips.length > 0) {
        mixer = new THREE.AnimationMixer(root);
        const findClip = (substr) => {
          if (!substr) return null;
          const lc = substr.toLowerCase();
          return clips.find((c) => (c.name || '').toLowerCase().includes(lc)) || null;
        };
        const idleClip = findClip(companion.idleClipName) || clips[0];
        if (idleClip) mixer.clipAction(idleClip).reset().fadeIn(0.3).play();
      }
    };

    if (companion.modelFormat === 'glb') {
      // Bundle-aware loading manager — resolves relative .bin / texture paths
      // inside the .gltf to their Base44-hosted absolute URLs.
      const compManager = createCompanionLoadingManager(THREE, companion);
      const gltfLoader = compManager ? new GLTFLoader(compManager) : new GLTFLoader();
      gltfLoader.load(companion.modelUrl, (gltf) => {
        const root = gltf.scene || gltf.scenes?.[0];
        if (!root) return;
        // Embedded clips first; fall back to external animation source
        if (gltf.animations && gltf.animations.length > 0) {
          setupModel(root, gltf.animations);
        } else if (companion.externalAnimUrl) {
          const extLoader = new GLTFLoader();
          extLoader.load(
            companion.externalAnimUrl,
            (extGltf) => setupModel(root, extGltf.animations || []),
            undefined,
            () => setupModel(root, []),
          );
        } else {
          setupModel(root, []);
        }
      });
    } else {
      // FBX format
      const loader = new FBXLoader();
      loader.load(companion.modelUrl, (fbx) => {
        setupModel(fbx, fbx.animations || []);
      });
    }

    const animate = () => {
      frameId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      if (mixer) mixer.update(delta);
      // No auto-rotate — companion faces forward (toward camera), idling like the player preview.
      pivot.rotation.y = 0;
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
      window.removeEventListener('resize', onResize);
      if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement);
      renderer.dispose();
    };
  }, []);

  return <div ref={containerRef} className="w-full h-full" />;
}
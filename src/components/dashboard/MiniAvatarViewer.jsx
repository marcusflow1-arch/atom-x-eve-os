import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { useCompanionIdentity } from '@/components/onboarding/CompanionIdentityContext';
import { companionModel, applyCompanionAppearance, COMPANION_MOTIONS } from '@/components/onboarding/genesisAssets';
import { attachGeneratedFaceToBody } from '@/components/onboarding/faceComposite';

async function loadAsset(url) {
  if (/\.(glb|gltf)(?:\?|$)/i.test(url)) {
    const gltf = await new GLTFLoader().loadAsync(url);
    return { object: gltf.scene, animations: gltf.animations || [] };
  }
  const fbx = await new FBXLoader().loadAsync(url);
  return { object: fbx, animations: fbx.animations || [] };
}

export default function MiniAvatarViewer({ size = 80, fill = false, style }) {
  const containerRef = useRef(null);
  const savedCompanion = useCompanionIdentity();

  useEffect(() => {
    if (!containerRef.current) return undefined;
    const container = containerRef.current;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
    camera.position.set(0, 1.85, -1.4);
    camera.lookAt(0, 1.7, 0);

    const w = fill ? (container.clientWidth || 220) : size;
    const h = fill ? (container.clientHeight || 256) : size;
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(w, h);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.setClearColor(0x000000, 0);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    container.appendChild(renderer.domElement);

    scene.add(new THREE.HemisphereLight(0xe6f4ff, 0x101827, 1.3));
    const key = new THREE.DirectionalLight(0xffffff, 2.2);
    key.position.set(2, 3, 2);
    scene.add(key);
    const rim = new THREE.DirectionalLight(0x8fdcff, 1.4);
    rim.position.set(0, 2, -3);
    scene.add(rim);

    let disposed = false;
    let frameId = null;
    let mixer = null;
    let model = null;
    let faceComposite = null;
    const clock = new THREE.Clock();

    const start = async () => {
      try {
        const url = companionModel(savedCompanion);
        const asset = await loadAsset(url);
        if (disposed) return;
        model = asset.object;
        const box = new THREE.Box3().setFromObject(model);
        const sizeVector = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(sizeVector.x, sizeVector.y, sizeVector.z) || 1;
        model.scale.setScalar(2 / maxDim);
        const scaledBox = new THREE.Box3().setFromObject(model);
        const center = scaledBox.getCenter(new THREE.Vector3());
        model.position.set(-center.x, -scaledBox.min.y, -center.z);
        model.rotation.y = Math.PI;
        model.traverse((node) => {
          if (!node.isMesh) return;
          (Array.isArray(node.material) ? node.material : [node.material]).filter(Boolean).forEach((mat) => {
            mat.side = THREE.DoubleSide;
            if (typeof mat.envMapIntensity === 'number') mat.envMapIntensity = 1.2;
            mat.needsUpdate = true;
          });
        });
        applyCompanionAppearance(model, savedCompanion || {});
        scene.add(model);
        if (savedCompanion?.face_scan_generated && savedCompanion?.face_model_url) {
          const gltfLoader = new GLTFLoader();
          const fbxLoader = new FBXLoader();
          attachGeneratedFaceToBody({ baseModel: model, faceUrl: savedCompanion.face_model_url, gltfLoader, fbxLoader })
            .then((composite) => { if (disposed) composite.dispose?.(); else faceComposite = composite; })
            .catch((error) => console.warn('Mini avatar could not apply generated face:', error));
        }
        mixer = new THREE.AnimationMixer(model);
        const embedded = asset.animations?.[0];
        if (embedded) mixer.clipAction(embedded).play();
        else {
          try {
            const idle = await loadAsset(COMPANION_MOTIONS[0].url);
            if (!disposed && idle.animations?.[0]) mixer.clipAction(idle.animations[0]).play();
          } catch {}
        }
      } catch (err) {
        console.error('Error loading mini avatar:', err);
      }
    };
    start();

    const animate = () => {
      frameId = requestAnimationFrame(animate);
      mixer?.update(Math.min(clock.getDelta(), 0.05));
      renderer.render(scene, camera);
    };
    animate();

    const resize = () => {
      if (!fill || !containerRef.current) return;
      const nextW = containerRef.current.clientWidth || 220;
      const nextH = containerRef.current.clientHeight || 256;
      renderer.setSize(nextW, nextH);
      camera.aspect = nextW / nextH;
      camera.updateProjectionMatrix();
    };
    window.addEventListener('resize', resize);

    return () => {
      disposed = true;
      cancelAnimationFrame(frameId);
      window.removeEventListener('resize', resize);
      mixer?.stopAllAction();
      faceComposite?.dispose?.();
      faceComposite = null;
      renderer.dispose();
      renderer.domElement?.remove();
    };
  }, [size, fill, savedCompanion]);

  return (
    <div
      ref={containerRef}
      className="overflow-hidden"
      style={fill ? { width: '100%', height: '100%', ...style } : { width: size, height: size, background: 'rgba(20, 20, 30, 0.6)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', ...style }}
    />
  );
}

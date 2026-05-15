// Skybox loader for TransparentModel3DViewer.
//
// Bug fix (2026-05-15): the previous inline version mutated `child.material`
// without guarding for null materials or array materials, which corrupted
// shader programs and produced
//   "TypeError: Cannot read properties of null (reading 'trim')"
// inside three.js WebGLProgram.getUniforms on the next render.
//
// This version:
//   - skips meshes whose material is null/undefined
//   - handles array materials (multi-material meshes)
//   - sets needsUpdate so three.js re-links the shader cleanly

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';

function applySkyboxMaterials(obj) {
  obj.traverse((child) => {
    if (!child.isMesh || !child.material) return;
    const mats = Array.isArray(child.material) ? child.material : [child.material];
    mats.forEach((m) => {
      if (!m) return;
      m.side = THREE.BackSide;
      m.depthWrite = false;
      m.needsUpdate = true;
    });
  });
}

export function useSkybox(sceneRef, backgroundUrl, isModelLoaded) {
  const skyboxModelRef = useRef(null);

  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    if (skyboxModelRef.current) {
      scene.remove(skyboxModelRef.current);
      skyboxModelRef.current = null;
    }

    scene.background = null;
    if (!backgroundUrl) return;

    const lower = backgroundUrl.toLowerCase();

    if (lower.endsWith('.fbx') || lower.endsWith('.glb') || lower.endsWith('.gltf')) {
      const onLoaded = (obj) => {
        obj.scale.setScalar(500);
        applySkyboxMaterials(obj);
        skyboxModelRef.current = obj;
        scene.add(obj);
      };

      if (lower.endsWith('.fbx')) {
        new FBXLoader().load(backgroundUrl, onLoaded);
      } else {
        new GLTFLoader().load(backgroundUrl, (gltf) => onLoaded(gltf.scene));
      }
    } else {
      new THREE.TextureLoader().load(backgroundUrl, (texture) => {
        texture.colorSpace = THREE.SRGBColorSpace;
        scene.background = texture;
      });
    }
  }, [sceneRef, backgroundUrl, isModelLoaded]);
}
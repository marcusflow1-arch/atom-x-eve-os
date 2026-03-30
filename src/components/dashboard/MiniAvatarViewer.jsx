import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';
import { base44 } from '@/api/base44Client';

export default function MiniAvatarViewer({ size = 80, fill = false, style }) {
  const containerRef = useRef(null);
  const sceneRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = null;
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 1000);
    camera.position.set(0, 1.2, 2.5);

    const w = fill ? (containerRef.current.clientWidth || 220) : size;
    const h = fill ? (containerRef.current.clientHeight || 256) : size;
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setClearColor(0x000000, 0);
    containerRef.current.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(2, 3, 2);
    scene.add(directionalLight);

    let mixer = null;
    const clock = new THREE.Clock();

    // Load Y Bot model
    const loadModel = async () => {
      try {
        const models = await base44.entities.ModelFBX.filter({ name: 'Y Bot' });
        if (models.length === 0) return;

        const loader = new FBXLoader();
        loader.load(
          models[0].file_url,
          (fbx) => {
            fbx.traverse((node) => {
              if (node.isMesh || node.isSkinnedMesh) {
                node.frustumCulled = false;
                if (node.material) {
                  const applySide = (mat) => {
                    mat.side = THREE.DoubleSide;
                    mat.needsUpdate = true;
                  };
                  if (Array.isArray(node.material)) node.material.forEach(applySide);
                  else applySide(node.material);
                }
              }
            });

            // Scale and position
            const box = new THREE.Box3().setFromObject(fbx);
            const center = box.getCenter(new THREE.Vector3());
            const modelSize = box.getSize(new THREE.Vector3());
            const maxDim = Math.max(modelSize.x, modelSize.y, modelSize.z);
            const scale = 2 / maxDim;
            fbx.scale.multiplyScalar(scale);
            fbx.position.sub(center.multiplyScalar(scale));
            scene.add(fbx);

            // Setup animation
            if (fbx.animations && fbx.animations.length > 0) {
              mixer = new THREE.AnimationMixer(fbx);
              const idleAction = mixer.clipAction(fbx.animations[0]);
              idleAction.play();
            }

            // Load idle animation
            loadIdleAnimation(fbx);
          },
          undefined,
          (err) => console.error('Error loading mini avatar:', err)
        );
      } catch (error) {
        console.error('Failed to load avatar:', error);
      }
    };

    const loadIdleAnimation = async (model) => {
      try {
        const anims = await base44.entities.AnimationFBX.filter({ animation_type: 'idle' });
        if (anims.length > 0) {
          const loader = new FBXLoader();
          loader.load(
            anims[0].file_url,
            (animFbx) => {
              if (animFbx.animations && animFbx.animations.length > 0) {
                mixer = new THREE.AnimationMixer(model);
                const action = mixer.clipAction(animFbx.animations[0]);
                action.play();
              }
            },
            undefined,
            (err) => console.error('Error loading idle animation:', err)
          );
        }
      } catch (error) {
        console.error('Failed to load idle animation:', error);
      }
    };

    loadModel();

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
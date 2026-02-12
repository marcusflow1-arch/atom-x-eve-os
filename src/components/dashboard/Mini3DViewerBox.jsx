import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';

export default function Mini3DViewerBox() {
  const containerRef = useRef(null);
  const rendererRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const w = containerRef.current.clientWidth;
    const h = containerRef.current.clientHeight;

    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(30, w / h, 0.1, 100);
    camera.position.set(0, 1.2, 2.5);
    camera.lookAt(0, 0.8, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(w, h);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Lighting
    const ambient = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambient);
    const dir = new THREE.DirectionalLight(0xffffff, 1.5);
    dir.position.set(3, 5, 4);
    scene.add(dir);
    const rim = new THREE.PointLight(0x88ccff, 0.6, 10);
    rim.position.set(-2, 2, -2);
    scene.add(rim);

    // Load Y-Bot FBX
    let mixer = null;
    const loader = new FBXLoader();
    const yBotUrl = 'https://base44.app/api/apps/6876751a602125f45f1861b9/files/public/6876751a602125f45f1861b9/608211a0f_YBot1.fbx';

    loader.load(yBotUrl, (fbx) => {
      fbx.scale.set(0.01, 0.01, 0.01);
      fbx.position.set(0, -0.5, 0);
      scene.add(fbx);

      // Play idle animation if embedded
      if (fbx.animations && fbx.animations.length > 0) {
        mixer = new THREE.AnimationMixer(fbx);
        const action = mixer.clipAction(fbx.animations[0]);
        action.play();
      }

      // Slow rotation
      fbx.userData.rotateY = true;
    });

    // Animate
    const clock = new THREE.Clock();
    let animId;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      if (mixer) mixer.update(delta);

      // Rotate the model slowly
      scene.traverse((child) => {
        if (child.userData.rotateY) {
          child.rotation.y += delta * 0.3;
        }
      });

      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!containerRef.current) return;
      const nw = containerRef.current.clientWidth;
      const nh = containerRef.current.clientHeight;
      camera.aspect = nw / nh;
      camera.updateProjectionMatrix();
      renderer.setSize(nw, nh);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
    };
  }, []);

  return (
    <div
      className="rounded-2xl overflow-hidden pointer-events-auto"
      style={{
        background: 'rgba(255, 255, 255, 0.03)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        boxShadow: 'inset 0 0 20px rgba(255, 255, 255, 0.05)',
        height: '280px',
        width: '100%',
      }}
    >
      <div ref={containerRef} className="w-full h-full" />
    </div>
  );
}
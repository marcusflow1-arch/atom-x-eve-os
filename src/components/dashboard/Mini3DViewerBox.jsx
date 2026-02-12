import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';

export default function Mini3DViewerBox() {
  const containerRef = useRef(null);
  const rendererRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const w = containerRef.current.clientWidth;
    const h = containerRef.current.clientHeight;

    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(40, w / h, 0.1, 100);
    camera.position.set(1.8, 1.4, 1.8);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(w, h);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Lighting
    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambient);
    const dir = new THREE.DirectionalLight(0xffffff, 1.2);
    dir.position.set(3, 5, 4);
    scene.add(dir);
    const rim = new THREE.PointLight(0x88ccff, 0.5, 10);
    rim.position.set(-2, 2, -2);
    scene.add(rim);

    // White box with subtle edge wireframe
    const geo = new THREE.BoxGeometry(0.9, 0.9, 0.9);
    const mat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      roughness: 0.15,
      metalness: 0.05,
      clearcoat: 0.4,
      clearcoatRoughness: 0.2,
    });
    const cube = new THREE.Mesh(geo, mat);
    scene.add(cube);

    // Wireframe edges
    const edges = new THREE.EdgesGeometry(geo);
    const lineMat = new THREE.LineBasicMaterial({ color: 0xaabbcc, transparent: true, opacity: 0.3 });
    const wireframe = new THREE.LineSegments(edges, lineMat);
    cube.add(wireframe);

    // Animate
    const clock = new THREE.Clock();
    let animId;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();
      cube.rotation.y = t * 0.4;
      cube.rotation.x = Math.sin(t * 0.3) * 0.15;
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
      geo.dispose();
      mat.dispose();
      lineMat.dispose();
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
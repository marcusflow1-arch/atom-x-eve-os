import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { Loader2 } from 'lucide-react';

/**
 * GameViewer3D - A clean, interactive 3D scene with a procedural placeholder
 * model (an animated, glowing rotating object) so the page works without any
 * external assets. Uses OrbitControls so user can rotate/zoom.
 */
export default function GameViewer3D() {
  const containerRef = useRef(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;

    // Scene
    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x0a0e1a, 8, 25);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    container.appendChild(renderer.domElement);

    // Camera
    const camera = new THREE.PerspectiveCamera(50, container.clientWidth / container.clientHeight, 0.1, 100);
    camera.position.set(4, 3, 6);

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.minDistance = 3;
    controls.maxDistance = 14;
    controls.target.set(0, 0.5, 0);

    // Lights
    const hemi = new THREE.HemisphereLight(0x88aaff, 0x222244, 0.6);
    scene.add(hemi);

    const key = new THREE.DirectionalLight(0xffffff, 1.2);
    key.position.set(5, 8, 5);
    scene.add(key);

    const rim = new THREE.DirectionalLight(0x66ddff, 1.0);
    rim.position.set(-5, 3, -4);
    scene.add(rim);

    // Ground grid
    const grid = new THREE.GridHelper(20, 20, 0x334455, 0x1a2233);
    grid.position.y = -0.5;
    scene.add(grid);

    // Hero object — an icosahedron with emissive material
    const geometry = new THREE.IcosahedronGeometry(1, 1);
    const material = new THREE.MeshStandardMaterial({
      color: 0x22d3ee,
      emissive: 0x0891b2,
      emissiveIntensity: 0.4,
      metalness: 0.6,
      roughness: 0.25,
      flatShading: true,
    });
    const hero = new THREE.Mesh(geometry, material);
    hero.position.y = 0.6;
    scene.add(hero);

    // Wireframe overlay
    const wire = new THREE.Mesh(
      new THREE.IcosahedronGeometry(1.05, 1),
      new THREE.MeshBasicMaterial({ color: 0x67e8f9, wireframe: true, transparent: true, opacity: 0.25 })
    );
    wire.position.copy(hero.position);
    scene.add(wire);

    // Floating accent cubes
    const accents = [];
    for (let i = 0; i < 8; i++) {
      const cube = new THREE.Mesh(
        new THREE.BoxGeometry(0.25, 0.25, 0.25),
        new THREE.MeshStandardMaterial({
          color: 0x6366f1,
          emissive: 0x4338ca,
          emissiveIntensity: 0.6,
          metalness: 0.8,
          roughness: 0.3,
        })
      );
      const angle = (i / 8) * Math.PI * 2;
      cube.userData = { angle, radius: 2.5, baseY: 0.6 + Math.sin(i) * 0.3 };
      scene.add(cube);
      accents.push(cube);
    }

    setLoading(false);

    // Animate
    let frameId;
    const clock = new THREE.Clock();
    const animate = () => {
      frameId = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();

      hero.rotation.x = t * 0.3;
      hero.rotation.y = t * 0.5;
      wire.rotation.x = t * -0.2;
      wire.rotation.y = t * -0.35;

      accents.forEach((cube, i) => {
        const { angle, radius, baseY } = cube.userData;
        const a = angle + t * 0.4;
        cube.position.x = Math.cos(a) * radius;
        cube.position.z = Math.sin(a) * radius;
        cube.position.y = baseY + Math.sin(t * 1.5 + i) * 0.2;
        cube.rotation.x = t * 0.8;
        cube.rotation.y = t * 1.2;
      });

      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Resize
    const handleResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('resize', handleResize);
      controls.dispose();
      geometry.dispose();
      material.dispose();
      if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement);
      renderer.dispose();
    };
  }, []);

  return (
    <div className="relative w-full h-full">
      <div ref={containerRef} className="w-full h-full" />

      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40">
          <Loader2 className="w-10 h-10 text-cyan-400 animate-spin" />
        </div>
      )}

      {/* Hint overlay */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-black/50 backdrop-blur-md border border-white/10 text-white/60 text-xs pointer-events-none">
        Drag to rotate · Scroll to zoom
      </div>
    </div>
  );
}
import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

export default function BannerEnvironmentScene({ model }) {
  const mountRef = useRef(null);

  useEffect(() => {
    if (!mountRef.current || !model?.file_url) return;

    const container = mountRef.current;
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    // Scene
    const scene = new THREE.Scene();
    scene.background = null; // transparent; we want to sit behind UI

    // Camera
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 2000);
    camera.position.set(0, 1.7, 4);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(width, height);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(renderer.domElement);

    // Lights
    scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    const dir = new THREE.DirectionalLight(0xffffff, 1.2);
    dir.position.set(5, 10, 7);
    dir.castShadow = false;
    scene.add(dir);

    // Controls (disabled interactions; but keep for framing)
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enablePan = false;
    controls.enableZoom = false;
    controls.enableDamping = true;
    controls.enabled = false; // fully disabled for background

    // URL rewriter for textures from bundle_manifest or relative to file_url base
    const manager = new THREE.LoadingManager();
    manager.setURLModifier((url) => {
      // If URL already absolute, return as-is
      if (/^https?:\/\//i.test(url)) return url;
      // Try manifest mapping
      const manifest = model?.bundle_manifest || {};
      if (manifest[url]) return manifest[url];
      // Also try original_path keys that end with this url
      const key = Object.keys(manifest).find(k => k.endsWith(url));
      if (key) return manifest[key];
      // Fallback: resolve relative to the GLTF file base path
      try {
        const base = model.file_url.substring(0, model.file_url.lastIndexOf('/'));
        return `${base}/${url}`;
      } catch { return url; }
    });

    // Load GLTF/GLB environment
    const loader = new GLTFLoader(manager);
    let envRoot = new THREE.Group();
    scene.add(envRoot);

    loader.load(
      model.file_url,
      (gltf) => {
        envRoot.add(gltf.scene);
        // Frame the scene
        const box = new THREE.Box3().setFromObject(gltf.scene);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const fov = camera.fov * (Math.PI / 180);
        let cameraZ = Math.abs(maxDim / (2 * Math.tan(fov / 2)));
        cameraZ *= 1.2; // padding
        camera.position.set(center.x + 0.01, Math.max(1.7, center.y + size.y * 0.15), center.z + cameraZ);
        camera.lookAt(center);
      },
      undefined,
      (err) => {
        console.error('Environment load error', err);
      }
    );

    // Add a simple Y-Bot (capsule + head) and place on floor near center
    const ybot = new THREE.Group();
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.35, 1.1, 16, 16), new THREE.MeshStandardMaterial({ color: 0x66ccff, metalness: 0.1, roughness: 0.6 }));
    body.position.y = 1.0;
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.28, 32, 32), new THREE.MeshStandardMaterial({ color: 0x111111 }));
    head.position.y = 1.9;
    ybot.add(body); ybot.add(head);
    // Start at origin; later after env loads, try to drop to floor visually
    ybot.position.set(0, 0, 0);
    scene.add(ybot);

    // Subtle animation
    const clock = new THREE.Clock();
    const animate = () => {
      const t = clock.getElapsedTime();
      ybot.rotation.y = Math.sin(t * 0.3) * 0.2;
      controls.update();
      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    };
    animate();

    // Resize
    const onResize = () => {
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('resize', onResize);
      try { container.removeChild(renderer.domElement); } catch {}
      renderer.dispose();
    };
  }, [model]);

  if (!model) return null;

  return (
    <div
      ref={mountRef}
      className="pointer-events-none fixed inset-0 z-0"
      style={{ background: 'transparent' }}
    />
  );
}
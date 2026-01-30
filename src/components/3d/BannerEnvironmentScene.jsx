import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';
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
    manager.setURLModifier((rawUrl) => {
      const manifest = model?.bundle_manifest || {};
      try {
        // Normalize incoming url (strip query/hash, decode, normalize slashes)
        let url = rawUrl.split('?')[0].split('#')[0];
        url = decodeURIComponent(url).replace(/^\.\/?/, '').replace(/\\/g, '/');
        // Absolute -> return as-is
        if (/^https?:\/\//i.test(url)) return url;
        // Direct hit
        if (manifest[url]) return manifest[url];
        // Case-insensitive, suffix match across manifest keys
        const lower = url.toLowerCase();
        const key = Object.keys(manifest).find(k => k.replace(/\\/g, '/').toLowerCase().endsWith(lower));
        if (key) return manifest[key];
        // Fallback to base of model file
        const base = model.file_url.substring(0, model.file_url.lastIndexOf('/'));
        return `${base}/${url}`;
      } catch {
        return rawUrl;
      }
    });

    // Load environment (GLTF/GLB/FBX)
    let envRoot = new THREE.Group();
    scene.add(envRoot);

    const fileExt = (model.file_type || model.file_url.split('.').pop().split('?')[0] || '').toLowerCase();
    const basePath = model.file_url.substring(0, model.file_url.lastIndexOf('/')) + '/';

    const loadGLTF = () => {
      const gltfLoader = new GLTFLoader(manager);
      if (gltfLoader.setResourcePath) gltfLoader.setResourcePath(basePath);
      if (gltfLoader.setCrossOrigin) gltfLoader.setCrossOrigin('anonymous');
      gltfLoader.load(
        model.file_url,
        (gltf) => {
          const root = gltf.scene || gltf.scenes?.[0];
          if (root) envRoot.add(root);
          frameAndPlace(root || envRoot);
        },
        undefined,
        (err) => console.error('Environment GLTF load error', err)
      );
    };

    const loadFBX = () => {
      const fbxLoader = new FBXLoader(manager);
      fbxLoader.load(
        model.file_url,
        (fbx) => {
          envRoot.add(fbx);
          frameAndPlace(fbx);
        },
        undefined,
        (err) => console.error('Environment FBX load error', err)
      );
    };

    const frameAndPlace = (object3d) => {
      try {
        // Frame camera to object
        const box = new THREE.Box3().setFromObject(object3d);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z) || 1;
        const fov = camera.fov * (Math.PI / 180);
        let cameraZ = Math.abs(maxDim / (2 * Math.tan(fov / 2)));
        cameraZ *= 1.2;
        camera.position.set(center.x + 0.01, Math.max(1.7, center.y + size.y * 0.15), center.z + cameraZ);
        camera.lookAt(center);

        // Drop Y-Bot to nearest floor beneath center
        const raycaster = new THREE.Raycaster(new THREE.Vector3(center.x, center.y + size.y * 2, center.z), new THREE.Vector3(0, -1, 0));
        const intersects = raycaster.intersectObjects(envRoot.children, true);
        if (intersects && intersects.length > 0) {
          const p = intersects[0].point;
          ybot.position.set(p.x, p.y + 0.03, p.z);
        } else {
          ybot.position.set(center.x, center.y, center.z);
        }
      } catch (e) {
        console.warn('Frame/place failed', e);
      }
    };

    if (fileExt === 'fbx') loadFBX(); else loadGLTF();

    // Add a simple Y-Bot (capsule + head) and place on floor near center
    const ybot = new THREE.Group();
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.35, 1.1, 16, 16), new THREE.MeshStandardMaterial({ color: 0x66ccff, metalness: 0.1, roughness: 0.6 }));
    body.position.y = 1.0;
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.28, 32, 32), new THREE.MeshStandardMaterial({ color: 0x111111 }));
    head.position.y = 1.9;
    ybot.add(body); ybot.add(head);
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
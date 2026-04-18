import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';

export default function ModelViewer3D({ modelPath = '/models/lara.glb', fileType = 'glb', bundleManifest = null }) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;
    
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    
    camera.position.set(0, 1.2, 2.4);
    camera.lookAt(0, 0.8, 0);
    renderer.setSize(width, height);
    renderer.setClearColor(0x000000, 0);
    containerRef.current.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 5, 5);
    scene.add(ambientLight);
    scene.add(directionalLight);

    // Setup loading manager for bundle textures
    const manager = new THREE.LoadingManager();
    if (bundleManifest && typeof bundleManifest === 'object') {
      manager.setURLModifier((url) => {
        try {
          const u = new URL(url, window.location.href);
          const pathname = decodeURIComponent(u.pathname).replace(/^\//, '');
          const filename = pathname.split('/').pop();
          if (bundleManifest[pathname]) return bundleManifest[pathname];
          if (filename && bundleManifest[filename]) return bundleManifest[filename];
        } catch (e) { }
        return bundleManifest[url] || url;
      });
    }

    // Choose loader based on file type
    const ext = (fileType || modelPath.split('.').pop() || '').toLowerCase();
    const useFBX = ext === 'fbx';
    const loader = useFBX ? new FBXLoader(manager) : new GLTFLoader(manager);

    loader.load(modelPath, (asset) => {
      const model = asset?.scene || asset;
      
      // Center and scale the model
      const box = new THREE.Box3().setFromObject(model);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());
      
      const maxDim = Math.max(size.x, size.y, size.z) || 1;
      const scale = 3.2 / maxDim;
      
      model.scale.multiplyScalar(scale);
      model.position.sub(center.multiplyScalar(scale));
      
      scene.add(model);
    });

    let time = 0;
    const animate = () => {
      requestAnimationFrame(animate);
      time += 0.016;
      
      scene.children.forEach(child => {
        if (child.isMesh || child.isGroup) {
          // Subtle idle bob and sway
          child.position.y = Math.sin(time * 1.5) * 0.05;
          child.rotation.z = Math.sin(time * 0.8) * 0.02;
        }
      });
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (containerRef.current) {
        const w = containerRef.current.clientWidth;
        const h = containerRef.current.clientHeight;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      containerRef.current?.removeChild(renderer.domElement);
    };
  }, [modelPath, fileType, bundleManifest]);

  return <div ref={containerRef} className="w-full h-full" />;
}
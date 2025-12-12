import React, { useEffect, useRef, useState } from 'react';
import { Loader2, X } from 'lucide-react';

export default function ThreeModelViewer({ modelUrl }) {
  const canvasRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!modelUrl) return;

    let scene, camera, renderer, model, controls;
    let animationId;

    const initScene = async () => {
      try {
        const THREE = await import('three');
        const { OrbitControls } = await import('three/examples/jsm/controls/OrbitControls');
        const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader');
        const JSZip = (await import('jszip')).default;

        // Fetch and unzip the model
        const response = await fetch(modelUrl);
        const blob = await response.blob();
        const zip = await JSZip.loadAsync(blob);

        // Find .glb file
        let glbFile = null;
        for (const [path, file] of Object.entries(zip.files)) {
          if (path.toLowerCase().endsWith('.glb') && !file.dir) {
            glbFile = file;
            break;
          }
        }

        if (!glbFile) {
          throw new Error('No .glb file found in ZIP');
        }

        // Extract GLB
        const glbBlob = await glbFile.async('blob');
        const glbUrl = URL.createObjectURL(glbBlob);

        // Setup Three.js scene
        scene = new THREE.Scene();
        scene.background = null; // Transparent

        camera = new THREE.PerspectiveCamera(75, canvasRef.current.clientWidth / canvasRef.current.clientHeight, 0.1, 1000);
        camera.position.z = 5;

        renderer = new THREE.WebGLRenderer({ canvas: canvasRef.current, antialias: true, alpha: true });
        renderer.setSize(canvasRef.current.clientWidth, canvasRef.current.clientHeight);

        const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
        scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(5, 5, 5);
        scene.add(directionalLight);

        controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.autoRotate = true;
        controls.autoRotateSpeed = 2;

        const loader = new GLTFLoader();
        const gltf = await loader.loadAsync(glbUrl);
        model = gltf.scene;

        // Center and scale model
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = 3 / maxDim;

        model.scale.multiplyScalar(scale);
        model.position.sub(center.multiplyScalar(scale));

        scene.add(model);
        setLoading(false);

        const animate = () => {
          animationId = requestAnimationFrame(animate);
          controls.update();
          renderer.render(scene, camera);
        };
        animate();

        const handleResize = () => {
          if (!canvasRef.current) return;
          camera.aspect = canvasRef.current.clientWidth / canvasRef.current.clientHeight;
          camera.updateProjectionMatrix();
          renderer.setSize(canvasRef.current.clientWidth, canvasRef.current.clientHeight);
        };
        window.addEventListener('resize', handleResize);

        return () => {
          window.removeEventListener('resize', handleResize);
          cancelAnimationFrame(animationId);
          if (renderer) renderer.dispose();
          URL.revokeObjectURL(glbUrl);
        };
      } catch (err) {
        console.error('Failed to load model:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    initScene();
  }, [modelUrl]);

  if (loading) {
    return (
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <Loader2 className="w-12 h-12 text-white/30 animate-spin" />
      </div>
    );
  }

  if (error) {
    return null; // Silent fail for invisible box
  }

  return <canvas ref={canvasRef} className="w-full h-full" />;
}
import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass';

export default function AdvancedModel3DViewer({ modelUrl }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current || !modelUrl) return;

    const canvas = canvasRef.current;
    const scene = new THREE.Scene();

    // Transparent background
    const renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      alpha: true,
      antialias: true
    });
    renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);

    // Advanced color and tone mapping
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    renderer.useLegacyLights = false;

    // Camera
    const camera = new THREE.PerspectiveCamera(
      45,
      canvas.clientWidth / canvas.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 1.5, 3);

    // Orbit Controls
    const controls = new OrbitControls(camera, canvas);
    controls.enableDamping = true;

    // HDRI Environment
    const pmrem = new THREE.PMREMGenerator(renderer);
    new RGBELoader().setDataType(THREE.HalfFloatType).load(
      "https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/studio_small_08_1k.hdr",
      (hdr) => {
        const envMap = pmrem.fromEquirectangular(hdr).texture;
        scene.environment = envMap;
        hdr.dispose();
        pmrem.dispose();
      }
    );

    // Lighting Setup
    const keyLight = new THREE.DirectionalLight(0xffffff, 2.5);
    keyLight.position.set(1, 1, 1);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x88aaff, 1.2);
    fillLight.position.set(-1, 0.5, -1);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xffffff, 3.0);
    rimLight.position.set(0, 2, -2);
    scene.add(rimLight);

    scene.add(new THREE.AmbientLight(0xffffff, 0.3));

    // Post-Processing (Bloom)
    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));

    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(canvas.clientWidth, canvas.clientHeight),
      0.9,
      0.6,
      0.0
    );
    composer.addPass(bloomPass);

    // Load Model
    let mixer;
    const loader = new GLTFLoader();
    loader.load(
      modelUrl,
      (gltf) => {
        const model = gltf.scene;

        // Material fix for anime models
        model.traverse((node) => {
          if (node.isMesh || node.isSkinnedMesh) {
            node.frustumCulled = false;
            if (node.material) {
              const applyMaterial = (mat) => {
                mat.side = THREE.DoubleSide;
                mat.envMapIntensity = 1.5;
                mat.needsUpdate = true;
              };
              if (Array.isArray(node.material)) {
                node.material.forEach(applyMaterial);
              } else {
                applyMaterial(node.material);
              }
            }
          }
        });

        // Center and scale model
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = 2 / maxDim;
        model.scale.multiplyScalar(scale);
        model.position.sub(center.multiplyScalar(scale));

        scene.add(model);

        // Enable animation
        if (gltf.animations && gltf.animations.length > 0) {
          mixer = new THREE.AnimationMixer(model);
          const action = mixer.clipAction(gltf.animations[0]);
          action.play();
        }
      },
      undefined,
      (err) => console.error('Error loading model:', err)
    );

    // Render Loop
    const clock = new THREE.Clock();

    function animate() {
      requestAnimationFrame(animate);

      const delta = clock.getDelta();
      if (mixer) mixer.update(delta);

      controls.update();
      composer.render();
    }

    animate();

    // Resize Handling
    const handleResize = () => {
      renderer.setSize(canvas.clientWidth, canvas.clientHeight);
      camera.aspect = canvas.clientWidth / canvas.clientHeight;
      camera.updateProjectionMatrix();
      composer.setSize(canvas.clientWidth, canvas.clientHeight);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      composer.dispose();
    };
  }, [modelUrl]);

  return <canvas ref={canvasRef} className="w-full h-full" />;
}
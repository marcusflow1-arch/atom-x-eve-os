import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass';

export default function Enhanced3DViewer({ modelUrl }) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current || !modelUrl) return;

    // ----------------------
    //  BASIC SETUP
    // ----------------------
    const scene = new THREE.Scene();

    // Transparent background
    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true
    });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);

    // Advanced color and tone mapping
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    renderer.physicallyCorrectLights = true;

    containerRef.current.appendChild(renderer.domElement);

    // Camera
    const camera = new THREE.PerspectiveCamera(
      45,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 1.5, 3);

    // Orbit Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    // ----------------------
    //  OPTIONAL: HDRI Environment
    // ----------------------
    const pmrem = new THREE.PMREMGenerator(renderer);
    new RGBELoader().load(
      "https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/studio_small_08_1k.hdr",
      (hdr) => {
        const envMap = pmrem.fromEquirectangular(hdr).texture;
        scene.environment = envMap;
        hdr.dispose();
        pmrem.dispose();
      }
    );

    // ----------------------
    //  LIGHTING SETUP
    // ----------------------
    const keyLight = new THREE.DirectionalLight(0xffffff, 2.5);
    keyLight.position.set(1, 1, 1);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x88aaff, 1.2);
    fillLight.position.set(-1, 0.5, -1);
    scene.add(fillLight);

    // Rim light for anime/shader shine
    const rimLight = new THREE.DirectionalLight(0xffffff, 3.0);
    rimLight.position.set(0, 2, -2);
    scene.add(rimLight);

    // Soft ambient
    scene.add(new THREE.AmbientLight(0xffffff, 0.3));

    // ----------------------
    //  POST-PROCESSING (Bloom)
    // ----------------------
    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));

    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(containerRef.current.clientWidth, containerRef.current.clientHeight),
      0.9,   // bloom strength
      0.6,   // radius
      0.0    // threshold
    );
    composer.addPass(bloomPass);

    // ----------------------
    //  LOAD MODEL
    // ----------------------
    let mixer;
    const clock = new THREE.Clock();

    const loader = new GLTFLoader();
    loader.load(
      modelUrl,
      (gltf) => {
        const model = gltf.scene;

        // Material fix for anime models
        model.traverse((node) => {
          if (node.isMesh) {
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

        scene.add(model);

        // Enable animation
        if (gltf.animations.length > 0) {
          mixer = new THREE.AnimationMixer(model);
          const action = mixer.clipAction(gltf.animations[0]);
          action.play();
        }
      },
      undefined,
      (err) => console.error('Error loading model:', err)
    );

    // ----------------------
    //  RENDER LOOP
    // ----------------------
    function animate() {
      requestAnimationFrame(animate);

      const delta = clock.getDelta();
      if (mixer) mixer.update(delta);

      controls.update();
      composer.render();
    }

    animate();

    // ----------------------
    //  RESIZE HANDLING
    // ----------------------
    const handleResize = () => {
      if (!containerRef.current) return;
      renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
      camera.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight;
      camera.updateProjectionMatrix();
      composer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    };

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      if (containerRef.current && renderer.domElement) {
        containerRef.current.removeChild(renderer.domElement);
      }
    };
  }, [modelUrl]);

  return <div ref={containerRef} className="w-full h-full bg-transparent" />;
}
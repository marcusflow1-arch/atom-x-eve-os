import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';
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

    // Fully transparent renderer
    const renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      alpha: true,
      antialias: true,
      premultipliedAlpha: false,
    });
    
    // Prevent any background color — fully transparent
    renderer.setClearColor(0x000000, 0);
    renderer.autoClear = true;
    
    renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);

    // Physically correct lighting + tone mapping
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;

    // Camera
    const camera = new THREE.PerspectiveCamera(
      45,
      canvas.clientWidth / canvas.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 1.4, 3);

    // Orbit Controls — no auto-rotation, manual drag only
    const controls = new OrbitControls(camera, canvas);
    controls.enableDamping = true;
    controls.autoRotate = false;
    controls.enableZoom = false;
    controls.target.set(0, 0, 0);

    // HDR ENVIRONMENT (Balanced so it won't brighten background)
    const pmrem = new THREE.PMREMGenerator(renderer);
    new RGBELoader()
      .setDataType(THREE.HalfFloatType)
      .load(
        "https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/studio_small_09_1k.hdr",
        (hdr) => {
          const envMap = pmrem.fromEquirectangular(hdr).texture;
          
          // Apply only to scene lighting — NOT as visible background
          scene.environment = envMap;
          scene.background = null; // 100% transparent
        }
      );

    // LIGHTING (Balanced)
    // Key Light
    const keyLight = new THREE.DirectionalLight(0xffffff, 2.0);
    keyLight.position.set(1, 1.4, 1);
    scene.add(keyLight);

    // Fill Light
    const fillLight = new THREE.DirectionalLight(0xffffff, 1.0);
    fillLight.position.set(-1, 1, -1);
    scene.add(fillLight);

    // Rim Light (softened)
    const rimLight = new THREE.DirectionalLight(0xffffff, 2.2);
    rimLight.position.set(0, 1.2, -1.5);
    scene.add(rimLight);

    // Ambient (weak)
    scene.add(new THREE.AmbientLight(0xffffff, 0.25));

    // BLOOM POST-PROCESSING (NOT too bright)
    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));

    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(canvas.clientWidth, canvas.clientHeight),
      0.55,  // reduced bloom strength
      0.5,   // radius
      0.1    // threshold
    );
    composer.addPass(bloomPass);

    // Load Model
    let mixer;
    const isFbx = modelUrl.toLowerCase().includes('.fbx');
    const loader = isFbx ? new FBXLoader() : new GLTFLoader();
    
    loader.load(
      modelUrl,
      (asset) => {
        const model = isFbx ? asset : asset.scene;

        model.traverse((node) => {
          if (node.isMesh && node.material) {
            const m = node.material;

            // Avoid clipped/shadowed hair effect
            m.side = THREE.DoubleSide;

            // Balanced reflections
            m.envMapIntensity = 1.5;

            // Allow emissive glow
            m.emissiveIntensity = 1.2;

            m.needsUpdate = true;
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

        // Enable animation — find idle clip or fall back to first
        const animations = isFbx ? asset.animations : asset.animations;
        if (animations && animations.length > 0) {
          mixer = new THREE.AnimationMixer(model);
          const idleClip = animations.find(a =>
            /idle/i.test(a.name)
          ) || animations[0];
          const action = mixer.clipAction(idleClip);
          action.setLoop(THREE.LoopRepeat, Infinity);
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
      composer.setSize(canvas.clientWidth, canvas.clientHeight);

      camera.aspect = canvas.clientWidth / canvas.clientHeight;
      camera.updateProjectionMatrix();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      composer.dispose();
    };
  }, [modelUrl]);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', borderRadius: '1rem', overflow: 'hidden' }}>
      {/* Liquid glass background — see-through with shimmer */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(180,200,255,0.04) 40%, rgba(255,255,255,0.03) 100%)',
        backdropFilter: 'blur(2px) saturate(120%)',
        WebkitBackdropFilter: 'blur(2px) saturate(120%)',
        borderRadius: 'inherit',
        pointerEvents: 'none',
        zIndex: 0,
      }} />
      {/* Subtle top shimmer line */}
      <div style={{
        position: 'absolute',
        top: 0, left: 0, right: 0,
        height: '1px',
        background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
        pointerEvents: 'none',
        zIndex: 1,
      }} />
      <canvas
        ref={canvasRef}
        style={{
          display: 'block',
          width: '100%',
          height: '100%',
          position: 'relative',
          zIndex: 2,
          pointerEvents: 'auto',
          background: 'transparent',
        }}
      />
    </div>
  );
}
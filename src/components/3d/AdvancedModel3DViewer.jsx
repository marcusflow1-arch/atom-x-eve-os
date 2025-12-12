import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass';
import { SSAOPass } from 'three/examples/jsm/postprocessing/SSAOPass';
import { SMAAPass } from 'three/examples/jsm/postprocessing/SMAAPass';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass';
import { FXAAShader } from 'three/examples/jsm/shaders/FXAAShader';
import { ColorCorrectionShader } from 'three/examples/jsm/shaders/ColorCorrectionShader';
import { VignetteShader } from 'three/examples/jsm/shaders/VignetteShader';

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
    renderer.toneMappingExposure = 1.4;
    renderer.useLegacyLights = false;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

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

    // Cinematic Lighting Setup
    const keyLight = new THREE.DirectionalLight(0xffffff, 3.5);
    keyLight.position.set(2, 3, 2);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 2048;
    keyLight.shadow.mapSize.height = 2048;
    keyLight.shadow.camera.near = 0.5;
    keyLight.shadow.camera.far = 50;
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x88bbff, 1.5);
    fillLight.position.set(-2, 1, -1);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xffffff, 4.0);
    rimLight.position.set(0, 3, -3);
    scene.add(rimLight);

    const backLight = new THREE.DirectionalLight(0xffddaa, 2.0);
    backLight.position.set(-1, 2, -2);
    scene.add(backLight);

    scene.add(new THREE.AmbientLight(0xffffff, 0.4));

    // Cinematic Post-Processing Pipeline
    const composer = new EffectComposer(renderer);
    
    // Base render
    const renderPass = new RenderPass(scene, camera);
    composer.addPass(renderPass);

    // SSAO (Screen Space Ambient Occlusion) - Sketchfab's signature look
    const ssaoPass = new SSAOPass(scene, camera, canvas.clientWidth, canvas.clientHeight);
    ssaoPass.kernelRadius = 16;
    ssaoPass.minDistance = 0.001;
    ssaoPass.maxDistance = 0.1;
    ssaoPass.output = SSAOPass.OUTPUT.Default;
    composer.addPass(ssaoPass);

    // Bloom for glow/highlights
    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(canvas.clientWidth, canvas.clientHeight),
      1.2,  // strength
      0.8,  // radius
      0.2   // threshold
    );
    composer.addPass(bloomPass);

    // Color Correction
    const colorCorrectionPass = new ShaderPass(ColorCorrectionShader);
    colorCorrectionPass.uniforms['powRGB'].value = new THREE.Vector3(1.1, 1.1, 1.1);
    colorCorrectionPass.uniforms['mulRGB'].value = new THREE.Vector3(1.05, 1.0, 0.98);
    composer.addPass(colorCorrectionPass);

    // Vignette
    const vignettePass = new ShaderPass(VignetteShader);
    vignettePass.uniforms['darkness'].value = 1.2;
    vignettePass.uniforms['offset'].value = 0.95;
    composer.addPass(vignettePass);

    // FXAA (Anti-aliasing)
    const fxaaPass = new ShaderPass(FXAAShader);
    fxaaPass.uniforms['resolution'].value.set(1 / canvas.clientWidth, 1 / canvas.clientHeight);
    composer.addPass(fxaaPass);

    // Load Model
    let mixer;
    const loader = new GLTFLoader();
    loader.load(
      modelUrl,
      (gltf) => {
        const model = gltf.scene;

        // Enhanced PBR Materials (Sketchfab style)
        model.traverse((node) => {
          if (node.isMesh || node.isSkinnedMesh) {
            node.frustumCulled = false;
            node.castShadow = true;
            node.receiveShadow = true;
            
            if (node.material) {
              const applyPBRMaterial = (mat) => {
                mat.side = THREE.DoubleSide;
                
                // Enhanced PBR properties
                mat.envMapIntensity = 2.0;
                mat.metalness = mat.metalness || 0.1;
                mat.roughness = mat.roughness || 0.6;
                
                // Better lighting response
                if (!mat.metalnessMap && !mat.roughnessMap) {
                  mat.metalness = 0.0;
                  mat.roughness = 0.7;
                }
                
                // Subsurface scattering approximation for skin/organic materials
                if (mat.name && (mat.name.includes('skin') || mat.name.includes('face') || mat.name.includes('body'))) {
                  mat.roughness = 0.5;
                  mat.metalness = 0.0;
                  mat.envMapIntensity = 0.8;
                }
                
                // Enhanced reflections
                if (mat.name && (mat.name.includes('metal') || mat.name.includes('armor'))) {
                  mat.metalness = 0.9;
                  mat.roughness = 0.2;
                  mat.envMapIntensity = 3.0;
                }
                
                mat.needsUpdate = true;
              };
              
              if (Array.isArray(node.material)) {
                node.material.forEach(applyPBRMaterial);
              } else {
                applyPBRMaterial(node.material);
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
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      
      renderer.setSize(width, height);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      composer.setSize(width, height);
      
      // Update SSAO
      ssaoPass.setSize(width, height);
      
      // Update FXAA resolution
      fxaaPass.uniforms['resolution'].value.set(1 / width, 1 / height);
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
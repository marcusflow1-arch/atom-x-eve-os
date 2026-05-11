import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';
import { Loader2 } from 'lucide-react';

const ARCHER_URL = 'https://base44.app/api/apps/6876751a602125f45f1861b9/files/public/6876751a602125f45f1861b9/3f915913a_ErikaArcher.fbx';
const ANIMATION_URLS = {
  idle: 'https://base44.app/api/apps/6876751a602125f45f1861b9/files/public/6876751a602125f45f1861b9/9922e6dd0_Idle.fbx',
  run:  'https://base44.app/api/apps/6876751a602125f45f1861b9/files/public/6876751a602125f45f1861b9/4edd51169_Running.fbx',
  jump: 'https://base44.app/api/apps/6876751a602125f45f1861b9/files/public/6876751a602125f45f1861b9/b1e388a25_Jumping.fbx',
};

const WALK_SPEED = 2.8;
const RUN_SPEED = 6.2;
const ROT_SMOOTH = 0.18;
const BLEND = 0.2;

/**
 * GameWorld3D - Renders a 3D game world with the female archer character.
 * Camera follows behind the character. WASD to move (rotates character),
 * mouse drag to orbit camera.
 */
export default function GameWorld3D() {
  const containerRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const keys = useRef({});
  const drag = useRef({ active: false, x: 0, y: 0 });
  const orbit = useRef({ yaw: 0, pitch: 0.4, distance: 4.5 });

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;

    // Scene
    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x6b8eaa, 30, 120);
    scene.background = new THREE.Color(0x6b8eaa);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);

    // Camera
    const camera = new THREE.PerspectiveCamera(55, container.clientWidth / container.clientHeight, 0.1, 200);
    camera.position.set(0, 3, -5);

    // Lights
    scene.add(new THREE.HemisphereLight(0xcfe4ff, 0x4a3a2a, 1.0));
    const sun = new THREE.DirectionalLight(0xfff4d6, 2.2);
    sun.position.set(20, 30, 10);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.left = -30;
    sun.shadow.camera.right = 30;
    sun.shadow.camera.top = 30;
    sun.shadow.camera.bottom = -30;
    scene.add(sun);

    // Ground — grass arena
    const groundGeo = new THREE.PlaneGeometry(100, 100, 32, 32);
    const groundMat = new THREE.MeshStandardMaterial({ color: 0x4a6b3a, roughness: 0.95 });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // Stone center platform (like the SMITE arena)
    const platformGeo = new THREE.CylinderGeometry(8, 8.5, 0.3, 16);
    const platformMat = new THREE.MeshStandardMaterial({ color: 0x9a8868, roughness: 0.8 });
    const platform = new THREE.Mesh(platformGeo, platformMat);
    platform.position.y = 0.15;
    platform.receiveShadow = true;
    scene.add(platform);

    // Decorative rune circle in the middle (orange star)
    const runeGeo = new THREE.RingGeometry(2.5, 3.5, 8, 1);
    const runeMat = new THREE.MeshBasicMaterial({ color: 0xd4651a, side: THREE.DoubleSide, transparent: true, opacity: 0.7 });
    const rune = new THREE.Mesh(runeGeo, runeMat);
    rune.rotation.x = -Math.PI / 2;
    rune.position.y = 0.31;
    scene.add(rune);

    // Scattered rocks
    for (let i = 0; i < 12; i++) {
      const rockGeo = new THREE.DodecahedronGeometry(0.4 + Math.random() * 0.5);
      const rockMat = new THREE.MeshStandardMaterial({ color: 0x7a6a5a, roughness: 1 });
      const rock = new THREE.Mesh(rockGeo, rockMat);
      const angle = (i / 12) * Math.PI * 2;
      const dist = 12 + Math.random() * 8;
      rock.position.set(Math.cos(angle) * dist, 0.2, Math.sin(angle) * dist);
      rock.castShadow = true;
      rock.receiveShadow = true;
      scene.add(rock);
    }

    // Load the female archer + animations
    let mixer;
    let model;
    const actions = {};
    let currentActionName = 'idle';
    const clock = new THREE.Clock();
    const loader = new FBXLoader();

    const playAction = (name, timeScale = 1) => {
      const next = actions[name];
      if (!next || currentActionName === name) return;
      const prev = actions[currentActionName];
      next.enabled = true;
      next.setEffectiveTimeScale(timeScale);
      next.setEffectiveWeight(1);
      next.reset().fadeIn(BLEND).play();
      if (prev) prev.fadeOut(BLEND);
      currentActionName = name;
    };

    loader.load(ARCHER_URL, (fbx) => {
      model = fbx;
      const box = new THREE.Box3().setFromObject(fbx);
      const size = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);
      const scale = 1.7 / maxDim;
      fbx.scale.setScalar(scale);
      fbx.position.set(0, 0.3, 0);

      fbx.traverse((node) => {
        if (node.isMesh) {
          node.castShadow = !node.isSkinnedMesh;
          node.receiveShadow = true;
        }
      });

      scene.add(fbx);
      mixer = new THREE.AnimationMixer(fbx);

      // Load all animations in parallel
      const entries = Object.entries(ANIMATION_URLS);
      let loaded = 0;
      entries.forEach(([name, url]) => {
        loader.load(url, (animFbx) => {
          if (animFbx.animations?.length > 0) {
            const clip = animFbx.animations[0];
            clip.name = name;
            const action = mixer.clipAction(clip);
            if (name === 'jump') {
              action.setLoop(THREE.LoopOnce);
              action.clampWhenFinished = true;
            }
            actions[name] = action;
          }
          loaded++;
          if (loaded === entries.length) {
            if (actions.idle) {
              actions.idle.reset().fadeIn(0.2).play();
              currentActionName = 'idle';
            }
            setLoading(false);
          }
        }, undefined, () => {
          loaded++;
          if (loaded === entries.length) setLoading(false);
        });
      });
    }, undefined, (err) => {
      console.error('Archer load error:', err);
      setLoading(false);
    });

    // Controls
    const onKeyDown = (e) => {
      if (e.target?.matches?.('input, textarea')) return;
      const k = e.key.toLowerCase();
      keys.current[k] = true;
      // Space = jump (one-shot)
      if (k === ' ' && actions.jump && model) {
        actions.jump.reset().fadeIn(0.1).play();
        e.preventDefault();
      }
    };
    const onKeyUp = (e) => { keys.current[e.key.toLowerCase()] = false; };
    const onMouseDown = (e) => {
      drag.current = { active: true, x: e.clientX, y: e.clientY };
    };
    const onMouseUp = () => { drag.current.active = false; };
    const onMouseMove = (e) => {
      if (!drag.current.active) return;
      const dx = e.clientX - drag.current.x;
      const dy = e.clientY - drag.current.y;
      drag.current.x = e.clientX;
      drag.current.y = e.clientY;
      orbit.current.yaw -= dx * 0.005;
      orbit.current.pitch = Math.max(0.1, Math.min(Math.PI / 2.2, orbit.current.pitch + dy * 0.005));
    };
    const onWheel = (e) => {
      orbit.current.distance = Math.max(2, Math.min(12, orbit.current.distance + e.deltaY * 0.003));
      e.preventDefault();
    };
    const onContext = (e) => e.preventDefault();

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    renderer.domElement.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('mousemove', onMouseMove);
    renderer.domElement.addEventListener('wheel', onWheel, { passive: false });
    renderer.domElement.addEventListener('contextmenu', onContext);

    // Animation loop
    let frameId;
    const animate = () => {
      frameId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      if (mixer) mixer.update(delta);

      // Movement
      if (model) {
        const isRunning = !!keys.current['shift'];
        const speed = isRunning ? RUN_SPEED : WALK_SPEED;
        const yaw = orbit.current.yaw;
        const fx = -Math.sin(yaw), fz = -Math.cos(yaw);
        const rx = -Math.cos(yaw), rz = Math.sin(yaw);
        const move = new THREE.Vector3();
        if (keys.current['w']) { move.x += fx; move.z += fz; }
        if (keys.current['s']) { move.x -= fx; move.z -= fz; }
        if (keys.current['a']) { move.x += rx; move.z += rz; }
        if (keys.current['d']) { move.x -= rx; move.z -= rz; }

        const isMoving = move.lengthSq() > 0;
        if (isMoving) {
          move.normalize();
          model.position.x += move.x * speed * delta;
          model.position.z += move.z * speed * delta;
          const angle = Math.atan2(move.x, move.z);
          const targetQ = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), angle);
          model.quaternion.slerp(targetQ, ROT_SMOOTH);
        }

        // Animation state machine
        if (isMoving) {
          // Use 'run' clip, slowed for walk
          playAction('run', isRunning ? 1 : 0.55);
        } else {
          playAction('idle', 1);
        }

        // Camera follow
        const o = orbit.current;
        const camX = model.position.x + o.distance * Math.sin(o.yaw) * Math.cos(o.pitch);
        const camY = model.position.y + 1 + o.distance * Math.sin(o.pitch);
        const camZ = model.position.z + o.distance * Math.cos(o.yaw) * Math.cos(o.pitch);
        camera.position.lerp(new THREE.Vector3(camX, camY, camZ), 0.15);
        camera.lookAt(model.position.x, model.position.y + 1, model.position.z);
      }

      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('mousedown', onMouseDown);
      renderer.domElement.removeEventListener('wheel', onWheel);
      renderer.domElement.removeEventListener('contextmenu', onContext);
      if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement);
      renderer.dispose();
    };
  }, []);

  return (
    <div className="relative w-full h-full">
      <div ref={containerRef} className="w-full h-full" />
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-10 h-10 text-cyan-400 animate-spin" />
            <span className="text-white/70 text-sm tracking-wider">Loading world...</span>
          </div>
        </div>
      )}
    </div>
  );
}
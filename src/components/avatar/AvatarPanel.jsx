import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { useAuth } from '../auth/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Settings, User, Trophy } from 'lucide-react';

// Main Avatar Panel Component using vanilla Three.js
export default function AvatarPanel({ 
  compact = false, 
  glbBaseUrl = 'https://cdn.base44.io/avatars/' 
}) {
  const mountRef = useRef(null);
  const { user, avatar } = useAuth();
  
  const displayName = user?.username || user?.full_name || 'Player';
  const level = avatar?.level || 1;
  const experience = avatar?.experience || 0;
  const maxExp = level * 100; // Simple XP calculation

  useEffect(() => {
    if (!mountRef.current) return;
    const currentMount = mountRef.current;

    // Scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, currentMount.clientWidth / currentMount.clientHeight, 0.1, 1000);
    camera.position.set(0, 1.6, 2.8);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    currentMount.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 10, 5);
    scene.add(directionalLight);

    // Create fallback avatar (simple geometric representation)
    function createFallbackAvatar() {
      const avatarGroup = new THREE.Group();
      
      // Head
      const headGeometry = new THREE.SphereGeometry(0.3, 16, 16);
      const headMaterial = new THREE.MeshPhongMaterial({ 
        color: 0xffdbac,
        shininess: 30
      });
      const head = new THREE.Mesh(headGeometry, headMaterial);
      head.position.y = 0.5;
      avatarGroup.add(head);
      
      // Body
      const bodyGeometry = new THREE.CylinderGeometry(0.2, 0.3, 0.8, 8);
      const bodyMaterial = new THREE.MeshPhongMaterial({ 
        color: 0x4169e1,
        shininess: 20
      });
      const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
      body.position.y = -0.2;
      avatarGroup.add(body);
      
      // Arms
      const armGeometry = new THREE.CylinderGeometry(0.05, 0.08, 0.6, 6);
      const armMaterial = new THREE.MeshPhongMaterial({ color: 0xffdbac });
      
      const leftArm = new THREE.Mesh(armGeometry, armMaterial);
      leftArm.position.set(-0.35, 0.1, 0);
      leftArm.rotation.z = Math.PI / 6;
      avatarGroup.add(leftArm);
      
      const rightArm = new THREE.Mesh(armGeometry, armMaterial);
      rightArm.position.set(0.35, 0.1, 0);
      rightArm.rotation.z = -Math.PI / 6;
      avatarGroup.add(rightArm);
      
      // Legs
      const legGeometry = new THREE.CylinderGeometry(0.08, 0.06, 0.8, 6);
      const legMaterial = new THREE.MeshPhongMaterial({ color: 0x2c2c2c });
      
      const leftLeg = new THREE.Mesh(legGeometry, legMaterial);
      leftLeg.position.set(-0.15, -1.0, 0);
      avatarGroup.add(leftLeg);
      
      const rightLeg = new THREE.Mesh(legGeometry, legMaterial);
      rightLeg.position.set(0.15, -1.0, 0);
      avatarGroup.add(rightLeg);
      
      // Move the entire avatar group up so it's fully visible
      avatarGroup.position.set(0, 0.5, 0);
      return avatarGroup;
    }

    // Try to load GLTF, fallback to geometric avatar
    const loader = new GLTFLoader();
    const avatarUrl = avatar?.model_url || `${glbBaseUrl}base_humanoid.glb`;
    let mixer;
    let avatarModel;

    // Add simple rotation animation for fallback avatar
    function animateFallbackAvatar(model) {
      const animate = () => {
        if (model) {
          model.rotation.y += 0.005;
        }
      };
      return animate;
    }

    loader.load(
      avatarUrl, 
      (gltf) => {
        // Success: GLTF loaded
        avatarModel = gltf.scene;
        // Adjust GLTF model position to show full avatar, positioned higher
        avatarModel.position.set(0, 0, 0);
        scene.add(avatarModel);
        
        // Animation
        if (gltf.animations && gltf.animations.length) {
          mixer = new THREE.AnimationMixer(avatarModel);
          const idleAnimation = gltf.animations.find(a => a.name.toLowerCase().includes('idle')) || gltf.animations[0];
          if (idleAnimation) {
              mixer.clipAction(idleAnimation).play();
          }
        }
      }, 
      (progress) => {
        // Loading progress (optional)
        console.log('Avatar loading progress:', (progress.loaded / progress.total * 100) + '%');
      },
      (error) => {
        // Error: Fall back to geometric avatar
        console.log('GLTF loading failed, using fallback avatar:', error.message);
        avatarModel = createFallbackAvatar();
        scene.add(avatarModel);
        
        // Add simple rotation animation
        const fallbackAnimation = animateFallbackAvatar(avatarModel);
        
        // Store fallback animation function
        avatarModel.userData.animate = fallbackAnimation;
      }
    );

    // Mouse controls (simple rotation)
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };
    
    const onMouseDown = (e) => { 
      isDragging = true; 
      previousMousePosition = { x: e.offsetX, y: e.offsetY };
    };
    const onMouseUp = () => { isDragging = false; };
    const onMouseMove = (e) => {
      if (!isDragging || !avatarModel) return;
      
      const deltaMove = {
        x: e.offsetX - previousMousePosition.x,
        y: e.offsetY - previousMousePosition.y
      };

      avatarModel.rotation.y += deltaMove.x * 0.01;
      previousMousePosition = { x: e.offsetX, y: e.offsetY };
    };
    
    currentMount.addEventListener('mousedown', onMouseDown);
    currentMount.addEventListener('mouseup', onMouseUp);
    currentMount.addEventListener('mousemove', onMouseMove);

    // Render loop
    const clock = new THREE.Clock();
    let animationId;
    const animate = () => {
      animationId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      
      // Update GLTF animations
      if (mixer) mixer.update(delta);
      
      // Update fallback avatar animation
      if (avatarModel && avatarModel.userData.animate) {
        avatarModel.userData.animate();
      }
      
      renderer.render(scene, camera);
    };
    animate();

    // Resize handler
    const handleResize = () => {
      if (!currentMount) return;
      camera.aspect = currentMount.clientWidth / currentMount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      if (currentMount) {
        currentMount.removeEventListener('mousedown', onMouseDown);
        currentMount.removeEventListener('mouseup', onMouseUp);
        currentMount.removeEventListener('mousemove', onMouseMove);
        if (currentMount.contains(renderer.domElement)) {
          currentMount.removeChild(renderer.domElement);
        }
      }
      cancelAnimationFrame(animationId);
      renderer.dispose();
    };

  }, [avatar, glbBaseUrl]);


  if (compact) {
    return (
      <div className="relative w-full h-64 bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl overflow-hidden border border-blue-500/30 cursor-pointer hover:border-blue-400/50 transition-colors">
        <div ref={mountRef} className="w-full h-full" />
        
        {/* User Info Overlay */}
        <div className="absolute bottom-4 left-4 right-4">
          <div className="bg-black/60 backdrop-blur-sm rounded-lg p-3">
            <h3 className="text-white font-bold text-lg">{displayName}</h3>
            <div className="flex items-center justify-between mt-1">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse" />
                <span className="text-green-400 text-sm">Online</span>
              </div>
              <Badge variant="secondary" className="bg-blue-600/20 text-blue-400">
                Level {level}
              </Badge>
            </div>
            {/* XP Bar */}
            <div className="mt-2">
              <div className="flex justify-between text-xs text-slate-400 mb-1">
                <span>{experience} XP</span>
                <span>{maxExp} XP</span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-1.5">
                <div 
                  className="bg-blue-500 h-1.5 rounded-full transition-all duration-500" 
                  style={{ width: `${Math.min((experience / maxExp) * 100, 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Full Avatar Studio View (Non-compact) - Showing a simplified view for now
  return (
    <div className="p-6 bg-slate-900/50 rounded-2xl border border-slate-700/50">
        <div className="flex gap-6">
            <div ref={mountRef} className="w-96 h-80 bg-slate-800/50 rounded-xl" />
            <div className="flex-1 text-white">
                <h3 className="text-2xl font-bold">{displayName}</h3>
                <p className="text-slate-400">Level {level}</p>
                {/* Simplified view for non-compact mode */}
            </div>
        </div>
    </div>
  );
}
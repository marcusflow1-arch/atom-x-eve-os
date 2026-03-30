import React, { useRef, useEffect, useState } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import * as THREE from 'three';
import useAvatarStore from './useAvatarStore';

// --- Mannequin & Items (Fallback System) ---
function MannequinBody() {
  return (
    <group>
      {/* Torso */}
      <mesh position={[0, 0.5, 0]}>
        <capsuleGeometry args={[0.3, 0.8, 16, 16]} />
        <meshStandardMaterial color="#888888" metalness={0.3} roughness={0.7} />
      </mesh>
      {/* Neck */}
      <mesh position={[0, 1.1, 0]}>
        <cylinderGeometry args={[0.1, 0.12, 0.2, 16]} />
        <meshStandardMaterial color="#888888" metalness={0.3} roughness={0.7} />
      </mesh>
      {/* Head base */}
      <mesh position={[0, 1.4, 0]}>
        <sphereGeometry args={[0.25, 32, 32]} />
        <meshStandardMaterial color="#999999" metalness={0.3} roughness={0.7} />
      </mesh>
      {/* Arms */}
      <mesh position={[-0.45, 0.6, 0]} rotation={[0, 0, 0.2]}>
        <capsuleGeometry args={[0.08, 0.6, 8, 8]} />
        <meshStandardMaterial color="#888888" metalness={0.3} roughness={0.7} />
      </mesh>
      <mesh position={[0.45, 0.6, 0]} rotation={[0, 0, -0.2]}>
        <capsuleGeometry args={[0.08, 0.6, 8, 8]} />
        <meshStandardMaterial color="#888888" metalness={0.3} roughness={0.7} />
      </mesh>
      {/* Legs */}
      <mesh position={[-0.15, -0.5, 0]}>
        <capsuleGeometry args={[0.1, 0.8, 8, 8]} />
        <meshStandardMaterial color="#777777" metalness={0.3} roughness={0.7} />
      </mesh>
      <mesh position={[0.15, -0.5, 0]}>
        <capsuleGeometry args={[0.1, 0.8, 8, 8]} />
        <meshStandardMaterial color="#777777" metalness={0.3} roughness={0.7} />
      </mesh>
    </group>
  );
}

// Customization Items
function HeadItem({ type }) {
  if (type === 'blue_hat') return <mesh position={[0, 1.6, 0]}><cylinderGeometry args={[0.28, 0.28, 0.15, 32]} /><meshStandardMaterial color="#3b82f6" /></mesh>;
  if (type === 'red_cap') return <mesh position={[0, 1.6, 0]}><coneGeometry args={[0.3, 0.2, 32]} /><meshStandardMaterial color="#ef4444" /></mesh>;
  return null;
}

function BodyItem({ type }) {
  if (type === 'red_shirt') return <mesh position={[0, 0.5, 0]}><capsuleGeometry args={[0.32, 0.82, 16, 16]} /><meshStandardMaterial color="#dc2626" /></mesh>;
  if (type === 'blue_armor') return <mesh position={[0, 0.5, 0]}><capsuleGeometry args={[0.34, 0.84, 16, 16]} /><meshStandardMaterial color="#1e40af" metalness={0.8} /></mesh>;
  return null;
}

function AccessoryItem({ type }) {
  if (type === 'cape') return <mesh position={[0, 0.5, -0.35]} rotation={[0.2, 0, 0]}><boxGeometry args={[0.6, 0.8, 0.05]} /><meshStandardMaterial color="#7c3aed" /></mesh>;
  if (type === 'wings') return (
    <group position={[0, 0.8, -0.2]}>
      <mesh position={[-0.3, 0, 0]} rotation={[0, 0, 0.3]}><boxGeometry args={[0.4, 0.6, 0.05]} /><meshStandardMaterial color="#fbbf24" /></mesh>
      <mesh position={[0.3, 0, 0]} rotation={[0, 0, -0.3]}><boxGeometry args={[0.4, 0.6, 0.05]} /><meshStandardMaterial color="#fbbf24" /></mesh>
    </group>
  );
  return null;
}

function HandItem({ type }) {
  if (type === 'sword') return <mesh position={[0.5, 0.3, 0]} rotation={[0, 0, -0.5]}><boxGeometry args={[0.05, 0.8, 0.1]} /><meshStandardMaterial color="#94a3b8" metalness={0.9} /></mesh>;
  if (type === 'staff') return (
    <group position={[0.5, 0.5, 0]} rotation={[0, 0, -0.3]}>
      <mesh><cylinderGeometry args={[0.03, 0.03, 1.2, 16]} /><meshStandardMaterial color="#8b4513" /></mesh>
      <mesh position={[0, 0.6, 0]}><sphereGeometry args={[0.1]} /><meshStandardMaterial color="#8b5cf6" emissive="#8b5cf6" emissiveIntensity={0.5} /></mesh>
    </group>
  );
  return null;
}

function CustomModel({ url }) {
  const gltf = useLoader(GLTFLoader, url);
  const mixerRef = useRef();
  
  useEffect(() => {
    if (gltf && gltf.animations.length) {
        mixerRef.current = new THREE.AnimationMixer(gltf.scene);
        const action = mixerRef.current.clipAction(gltf.animations[0]);
        action.play();
    }
    return () => {
        if(mixerRef.current) mixerRef.current.stopAllAction();
    }
  }, [gltf]);

  useFrame((state, delta) => {
    if (mixerRef.current) {
        mixerRef.current.update(delta);
    }
  });

  return <primitive object={gltf.scene} scale={1.5} />;
}

// --- Main Avatar Component ---
export default function AvatarModel({ modelUrl }) {
  const groupRef = useRef();
  const equipped = useAvatarStore((state) => state?.equipped || { head: 'none', body: 'base', accessory: 'none', hand: 'none' });

  useFrame((state, delta) => {
    if (groupRef.current) {
        // Simple idle rotation
        groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.1;
    }
  });

  // Render Custom Model if available
  if (modelUrl) {
    return (
        <group ref={groupRef} position={[0, -1, 0]}>
            <CustomModel url={modelUrl} />
        </group>
    );
  }

  // Render Default Composite Avatar
  return (
    <group ref={groupRef} position={[0, -1, 0]}>
      <MannequinBody />
      {equipped.body !== 'base' && <BodyItem type={equipped.body} />}
      {equipped.head !== 'none' && <HeadItem type={equipped.head} />}
      {equipped.accessory !== 'none' && <AccessoryItem type={equipped.accessory} />}
      {equipped.hand !== 'none' && <HandItem type={equipped.hand} />}
    </group>
  );
}
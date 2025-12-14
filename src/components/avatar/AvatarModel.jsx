import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import useAvatarStore from './useAvatarStore';

// Mannequin body parts as primitive composites
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
      
      {/* Head base (sphere) */}
      <mesh position={[0, 1.4, 0]}>
        <sphereGeometry args={[0.25, 32, 32]} />
        <meshStandardMaterial color="#999999" metalness={0.3} roughness={0.7} />
      </mesh>
      
      {/* Left Arm */}
      <mesh position={[-0.45, 0.6, 0]} rotation={[0, 0, 0.2]}>
        <capsuleGeometry args={[0.08, 0.6, 8, 8]} />
        <meshStandardMaterial color="#888888" metalness={0.3} roughness={0.7} />
      </mesh>
      
      {/* Right Arm */}
      <mesh position={[0.45, 0.6, 0]} rotation={[0, 0, -0.2]}>
        <capsuleGeometry args={[0.08, 0.6, 8, 8]} />
        <meshStandardMaterial color="#888888" metalness={0.3} roughness={0.7} />
      </mesh>
      
      {/* Left Leg */}
      <mesh position={[-0.15, -0.5, 0]}>
        <capsuleGeometry args={[0.1, 0.8, 8, 8]} />
        <meshStandardMaterial color="#777777" metalness={0.3} roughness={0.7} />
      </mesh>
      
      {/* Right Leg */}
      <mesh position={[0.15, -0.5, 0]}>
        <capsuleGeometry args={[0.1, 0.8, 8, 8]} />
        <meshStandardMaterial color="#777777" metalness={0.3} roughness={0.7} />
      </mesh>
    </group>
  );
}

// Customization items
function HeadItem({ type }) {
  if (type === 'blue_hat') {
    return (
      <mesh position={[0, 1.6, 0]}>
        <cylinderGeometry args={[0.28, 0.28, 0.15, 32]} />
        <meshStandardMaterial color="#3b82f6" metalness={0.5} roughness={0.3} />
      </mesh>
    );
  }
  if (type === 'red_cap') {
    return (
      <mesh position={[0, 1.6, 0]}>
        <coneGeometry args={[0.3, 0.2, 32]} />
        <meshStandardMaterial color="#ef4444" metalness={0.5} roughness={0.3} />
      </mesh>
    );
  }
  return null;
}

function BodyItem({ type }) {
  if (type === 'red_shirt') {
    return (
      <mesh position={[0, 0.5, 0]}>
        <capsuleGeometry args={[0.32, 0.82, 16, 16]} />
        <meshStandardMaterial color="#dc2626" metalness={0.2} roughness={0.8} />
      </mesh>
    );
  }
  if (type === 'blue_armor') {
    return (
      <mesh position={[0, 0.5, 0]}>
        <capsuleGeometry args={[0.34, 0.84, 16, 16]} />
        <meshStandardMaterial color="#1e40af" metalness={0.8} roughness={0.2} />
      </mesh>
    );
  }
  return null;
}

function AccessoryItem({ type }) {
  if (type === 'cape') {
    return (
      <mesh position={[0, 0.5, -0.35]} rotation={[0.2, 0, 0]}>
        <boxGeometry args={[0.6, 0.8, 0.05]} />
        <meshStandardMaterial color="#7c3aed" metalness={0.3} roughness={0.7} />
      </mesh>
    );
  }
  if (type === 'wings') {
    return (
      <group position={[0, 0.8, -0.2]}>
        <mesh position={[-0.3, 0, 0]} rotation={[0, 0, 0.3]}>
          <boxGeometry args={[0.4, 0.6, 0.05]} />
          <meshStandardMaterial color="#fbbf24" metalness={0.6} roughness={0.3} />
        </mesh>
        <mesh position={[0.3, 0, 0]} rotation={[0, 0, -0.3]}>
          <boxGeometry args={[0.4, 0.6, 0.05]} />
          <meshStandardMaterial color="#fbbf24" metalness={0.6} roughness={0.3} />
        </mesh>
      </group>
    );
  }
  return null;
}

function HandItem({ type }) {
  if (type === 'sword') {
    return (
      <mesh position={[0.5, 0.3, 0]} rotation={[0, 0, -0.5]}>
        <boxGeometry args={[0.05, 0.8, 0.1]} />
        <meshStandardMaterial color="#94a3b8" metalness={0.9} roughness={0.1} />
      </mesh>
    );
  }
  if (type === 'staff') {
    return (
      <group position={[0.5, 0.5, 0]} rotation={[0, 0, -0.3]}>
        <mesh>
          <cylinderGeometry args={[0.03, 0.03, 1.2, 16]} />
          <meshStandardMaterial color="#8b4513" metalness={0.2} roughness={0.9} />
        </mesh>
        <mesh position={[0, 0.6, 0]}>
          <sphereGeometry args={[0.1, 16, 16]} />
          <meshStandardMaterial color="#8b5cf6" metalness={0.7} roughness={0.2} emissive="#8b5cf6" emissiveIntensity={0.3} />
        </mesh>
      </group>
    );
  }
  return null;
}

export default function AvatarModel() {
  const groupRef = useRef();
  const equipped = useAvatarStore((state) => state?.equipped || { head: 'none', body: 'base', accessory: 'none', hand: 'none' });
  
  useFrame((state) => {
    try {
      if (groupRef.current && state?.clock) {
        groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.1;
      }
    } catch (error) {
      // Suppress errors silently
    }
  });
  
  return (
    <group ref={groupRef} position={[0, -1, 0]}>
      <MannequinBody />
      
      {equipped.body !== 'base' && equipped.body !== 'none' && (
        <BodyItem type={equipped.body} />
      )}
      
      {equipped.head !== 'none' && (
        <HeadItem type={equipped.head} />
      )}
      
      {equipped.accessory !== 'none' && (
        <AccessoryItem type={equipped.accessory} />
      )}
      
      {equipped.hand !== 'none' && (
        <HandItem type={equipped.hand} />
      )}
    </group>
  );
}
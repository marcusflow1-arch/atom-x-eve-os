import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { motion, AnimatePresence } from 'framer-motion';
import { LOOT_RARITIES, addLootToInventory } from './lootStore';

const PICKUP_RANGE = 2.8;   // world units
const BOB_SPEED    = 1.8;   // rad/s
const SPIN_SPEED   = 1.2;   // rad/s
const BOB_AMP      = 0.18;  // meters

/**
 * WorldLootDrops
 * Manages Three.js loot objects inside the existing scene.
 * Also renders the DOM pickup-prompt overlay.
 *
 * Props:
 *   scene   — THREE.Scene
 *   camera  — THREE.Camera
 *   drops   — [{ dropId, name, category, rarity, icon, x, y, z }]
 *   onPickup(dropId) — callback fired after item is added to inventory
 *   playerRef — ref to the player model (THREE.Object3D)
 */
export default function WorldLootDrops({ scene, camera, drops, onPickup, playerRef }) {
  // Map of dropId → { mesh, light, data, born }
  const meshesRef = useRef({});
  const clockRef = useRef({ t: 0 });
  const [nearbyDrop, setNearbyDrop] = useState(null);  // { dropId, name, rarity, icon }
  const [screenPos, setScreenPos] = useState({ x: 0, y: 0 });
  const containerRef = useRef(null);
  const frameRef = useRef(null);
  const interactRef = useRef(false);

  // ── Keyboard E listener ─────────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e) => {
      if (e.target?.matches?.('input, textarea')) return;
      if (e.key.toLowerCase() === 'e') interactRef.current = true;
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // ── Sync Three.js objects whenever `drops` list changes ─────────────────
  useEffect(() => {
    if (!scene) return;

    // Remove meshes for drops that no longer exist
    const activeIds = new Set(drops.map((d) => d.dropId));
    Object.keys(meshesRef.current).forEach((id) => {
      if (!activeIds.has(id)) {
        const entry = meshesRef.current[id];
        scene.remove(entry.mesh);
        if (entry.light) scene.remove(entry.light);
        delete meshesRef.current[id];
      }
    });

    // Add meshes for new drops
    drops.forEach((drop) => {
      if (meshesRef.current[drop.dropId]) return; // already exists
      const rarity = LOOT_RARITIES[drop.rarity] || LOOT_RARITIES.common;

      // Outer glowing sphere
      const geo = new THREE.SphereGeometry(0.22, 12, 12);
      const mat = new THREE.MeshStandardMaterial({
        color: rarity.hex,
        emissive: rarity.hex,
        emissiveIntensity: 0.8,
        transparent: true,
        opacity: 0.92,
        roughness: 0.25,
        metalness: 0.6,
      });
      const sphere = new THREE.Mesh(geo, mat);
      sphere.position.set(drop.x, (drop.y || 0) + 0.8, drop.z);
      sphere.castShadow = false;

      // Inner bright core
      const coreGeo = new THREE.SphereGeometry(0.10, 8, 8);
      const coreMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.6 });
      const core = new THREE.Mesh(coreGeo, coreMat);
      sphere.add(core);

      // Rarity ring at base
      const ringGeo = new THREE.RingGeometry(0.28, 0.36, 24);
      const ringMat = new THREE.MeshBasicMaterial({ color: rarity.hex, side: THREE.DoubleSide, transparent: true, opacity: 0.55 });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = -Math.PI / 2;
      ring.position.y = -(0.8 - 0.02);
      sphere.add(ring);

      // Point light for glow aura
      const light = new THREE.PointLight(rarity.hex, 1.4, 3.5);
      light.position.copy(sphere.position);
      scene.add(sphere);
      scene.add(light);

      meshesRef.current[drop.dropId] = { mesh: sphere, light, data: drop, born: Date.now() };
    });
  }, [drops, scene]);

  // ── Animation loop: bob + spin + proximity check ────────────────────────
  useEffect(() => {
    if (!scene || !camera) return;

    const animate = () => {
      frameRef.current = requestAnimationFrame(animate);
      const dt = 0.016; // ~60fps approx
      clockRef.current.t += dt;
      const t = clockRef.current.t;

      let closest = null;
      let closestDist = PICKUP_RANGE;

      const player = playerRef?.current;
      const w = window.innerWidth;
      const h = window.innerHeight;
      const tmpVec = new THREE.Vector3();

      Object.values(meshesRef.current).forEach((entry) => {
        const { mesh, light, data } = entry;
        // Bob up and down
        const baseY = (data.y || 0) + 0.8;
        mesh.position.y = baseY + Math.sin(t * BOB_SPEED + entry.born * 0.001) * BOB_AMP;
        mesh.rotation.y += SPIN_SPEED * dt;
        // Ring pulse
        const ring = mesh.children[1];
        if (ring) ring.material.opacity = 0.3 + Math.abs(Math.sin(t * 2)) * 0.35;
        // Light flicker
        if (light) {
          light.position.copy(mesh.position);
          light.intensity = 1.2 + Math.sin(t * 3 + entry.born) * 0.3;
        }

        // Proximity to player
        if (player) {
          const dx = player.position.x - mesh.position.x;
          const dz = player.position.z - mesh.position.z;
          const dist = Math.sqrt(dx * dx + dz * dz);
          if (dist < closestDist) {
            closestDist = dist;
            closest = entry;
          }
        }
      });

      // Update nearest drop + screen projection for pickup prompt
      if (closest) {
        tmpVec.copy(closest.mesh.position);
        tmpVec.y += 0.4;
        tmpVec.project(camera);
        const sx = (tmpVec.x * 0.5 + 0.5) * w;
        const sy = (-tmpVec.y * 0.5 + 0.5) * h;
        setScreenPos({ x: sx, y: sy });
        setNearbyDrop(closest.data);

        // Handle E pickup
        if (interactRef.current) {
          interactRef.current = false;
          pickupDrop(closest);
        }
      } else {
        setNearbyDrop(null);
      }

      interactRef.current = false; // consume any leftover presses
    };

    frameRef.current = requestAnimationFrame(animate);
    return () => { if (frameRef.current) cancelAnimationFrame(frameRef.current); };
  }, [scene, camera, playerRef]);

  const pickupDrop = useCallback((entry) => {
    if (!scene) return;
    const { mesh, light, data } = entry;
    // Remove from scene
    scene.remove(mesh);
    if (light) scene.remove(light);
    delete meshesRef.current[data.dropId];
    // Add to inventory
    addLootToInventory(data);
    setNearbyDrop(null);
    // Notify parent to remove from drops list
    if (onPickup) onPickup(data.dropId);
    // Dispatch global toast event
    window.dispatchEvent(new CustomEvent('lootPickup', { detail: data }));
  }, [scene, onPickup]);

  const rarity = nearbyDrop ? (LOOT_RARITIES[nearbyDrop.rarity] || LOOT_RARITIES.common) : null;

  return (
    <>
      {/* Pickup prompt — rendered in DOM space over the 3D canvas */}
      <AnimatePresence>
        {nearbyDrop && rarity && (
          <motion.div
            key={nearbyDrop.dropId}
            initial={{ opacity: 0, scale: 0.85, y: 6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 6 }}
            transition={{ duration: 0.18 }}
            className="absolute pointer-events-none select-none"
            style={{
              left: screenPos.x,
              top: screenPos.y - 54,
              transform: 'translateX(-50%)',
              zIndex: 50,
            }}
          >
            <div
              className="flex flex-col items-center gap-1 px-3 py-2 rounded-xl"
              style={{
                background: 'rgba(8, 10, 16, 0.82)',
                backdropFilter: 'blur(12px) saturate(160%)',
                WebkitBackdropFilter: 'blur(12px) saturate(160%)',
                border: `1px solid ${rarity.color}60`,
                boxShadow: `0 4px 20px ${rarity.color}40`,
              }}
            >
              {/* Icon + name */}
              <div className="flex items-center gap-1.5">
                <span className="text-base">{nearbyDrop.icon}</span>
                <span className="text-white text-xs font-bold tracking-wide">{nearbyDrop.name}</span>
              </div>
              {/* Rarity */}
              <span
                className="text-[9px] font-bold tracking-[0.2em] uppercase"
                style={{ color: rarity.color }}
              >
                {rarity.label}
              </span>
              {/* Key hint */}
              <div className="flex items-center gap-1 mt-0.5">
                <span
                  className="text-[9px] px-1.5 py-0.5 rounded font-mono border"
                  style={{ background: 'rgba(255,255,255,0.1)', borderColor: 'rgba(255,255,255,0.25)', color: '#fff' }}
                >
                  E
                </span>
                <span className="text-white/50 text-[9px]">Pick Up</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
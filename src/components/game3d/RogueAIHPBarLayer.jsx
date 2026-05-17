// ─── RogueAIHPBarLayer ───────────────────────────────────────────────
// Projects each live rogue-AI head position to screen-space and renders
// the standard liquid-glass EnemyHealthBar above it (with level + name).
// Reads from window.__gw3dRogues (set by EnemyPlayerSpawner) and
// window.__gw3dCamera (set by GameWorld3D).

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import EnemyHealthBar from './EnemyHealthBar';

export default function RogueAIHPBarLayer() {
  const [bars, setBars] = useState([]);
  const tmpVec = useRef(new THREE.Vector3());
  const containerRef = useRef(null);

  useEffect(() => {
    let frameId;
    let frameCounter = 0;

    const tick = () => {
      frameId = requestAnimationFrame(tick);
      frameCounter++;
      // Throttle to ~20fps for HUD updates
      if (frameCounter % 3 !== 0) return;

      const rogues = window.__gw3dRogues;
      const camera = window.__gw3dCamera;
      if (!rogues || !camera || !containerRef.current) return;

      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      const next = [];
      rogues.forEach((r) => {
        if (!r.group || !r.alive || r.dying || !r.group.visible) return;
        tmpVec.current.set(r.group.position.x, r.group.position.y + 2.2, r.group.position.z);
        tmpVec.current.project(camera);
        const inView =
          tmpVec.current.z > -1 && tmpVec.current.z < 1 &&
          Math.abs(tmpVec.current.x) < 1.2 && Math.abs(tmpVec.current.y) < 1.2;
        if (!inView) return;
        next.push({
          id: r.id,
          x: (tmpVec.current.x * 0.5 + 0.5) * w,
          y: (-tmpVec.current.y * 0.5 + 0.5) * h,
          hp: r.hp,
          maxHp: r.maxHp,
          level: r.level,
          name: r.name,
        });
      });
      setBars(next);
    };
    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, []);

  return (
    <div ref={containerRef} className="absolute inset-0 pointer-events-none overflow-hidden z-10">
      {bars.map((b) => (
        <EnemyHealthBar
          key={b.id}
          x={b.x}
          y={b.y}
          hp={b.hp}
          maxHp={b.maxHp}
          level={b.level}
          name={b.name}
          visible
        />
      ))}
    </div>
  );
}
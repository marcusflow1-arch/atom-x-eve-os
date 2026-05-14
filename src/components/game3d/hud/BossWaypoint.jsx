import React, { useEffect, useState } from 'react';
import { Skull, X } from 'lucide-react';
import { subscribeTrackedBoss, setTrackedBoss } from '../bossGuidanceStore';
import { subscribeBosses } from '../bossStore';
import { subscribePlayerPosition } from '../playerPositionStore';

/**
 * BossWaypoint — directional HUD arrow that points the player toward the
 * boss they've pinned from the OnlinePlayersPanel.
 *
 * Pulls from three stores:
 *   • bossGuidanceStore   → which boss id is being tracked
 *   • bossStore           → live boss positions + hp
 *   • playerPositionStore → player x/z/yaw
 *
 * Renders a fixed bubble at top-center with:
 *   • Boss name + remaining HP
 *   • Distance in meters
 *   • Rotating arrow that points to the boss relative to the camera yaw
 */
export default function BossWaypoint() {
  const [trackedId, setTrackedId] = useState(null);
  const [bosses, setBosses] = useState([]);
  const [player, setPlayer] = useState({ x: 0, z: 0, yaw: 0 });

  useEffect(() => {
    const u1 = subscribeTrackedBoss(setTrackedId);
    const u2 = subscribeBosses(setBosses);
    const u3 = subscribePlayerPosition(setPlayer);
    return () => { u1(); u2(); u3(); };
  }, []);

  if (!trackedId) return null;
  const boss = bosses.find((b) => b.id === trackedId);
  if (!boss || !boss.alive) return null;

  const dx = boss.x - player.x;
  const dz = boss.z - player.z;
  const distance = Math.sqrt(dx * dx + dz * dz);

  // Angle to boss in world space, then subtract player yaw so the arrow rotates
  // relative to the camera. atan2(dx, dz) matches the yaw convention used in
  // GameWorld3D (forward = -z, right = +x).
  const worldAngle = Math.atan2(dx, dz);
  const relAngle = worldAngle - player.yaw;
  const arrowDeg = (relAngle * 180) / Math.PI;

  return (
    <div className="absolute top-20 left-1/2 -translate-x-1/2 z-30 pointer-events-none">
      <div className="flex items-center gap-3 px-4 py-2 rounded-full bg-black/70 backdrop-blur-md border border-red-500/40 shadow-2xl pointer-events-auto"
        style={{ boxShadow: '0 0 20px rgba(239,68,68,0.25)' }}
      >
        {/* Rotating arrow */}
        <div className="relative w-8 h-8 flex items-center justify-center">
          <div
            className="absolute inset-0 flex items-center justify-center transition-transform duration-150"
            style={{ transform: `rotate(${arrowDeg}deg)` }}
          >
            <div className="w-0 h-0 border-l-[7px] border-l-transparent border-r-[7px] border-r-transparent border-b-[14px] border-b-red-400"
              style={{ filter: 'drop-shadow(0 0 4px rgba(248,113,113,0.8))' }}
            />
          </div>
        </div>

        <Skull className="w-4 h-4 text-red-300" />

        <div className="flex flex-col">
          <span className="text-white text-xs font-bold tracking-wider">{boss.name}</span>
          <div className="flex items-center gap-2 text-[10px] text-white/60">
            <span>{Math.round(distance)}m</span>
            <span className="text-white/30">•</span>
            <span className="text-red-300">{Math.max(0, Math.round(boss.hp))} / {boss.maxHp} HP</span>
          </div>
        </div>

        <button
          onClick={() => setTrackedBoss(null)}
          className="ml-1 w-5 h-5 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/60 hover:text-white"
          title="Stop tracking"
        >
          <X className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}
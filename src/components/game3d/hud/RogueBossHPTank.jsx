import React, { useEffect, useState } from 'react';

const SHOW_RANGE = 18;

export default function RogueBossHPTank() {
  const [boss, setBoss] = useState(null);

  useEffect(() => {
    let frameId;
    let frameCounter = 0;

    const tick = () => {
      frameId = requestAnimationFrame(tick);
      frameCounter += 1;
      if (frameCounter % 3 !== 0) return;

      const rogues = window.__gw3dRogues || [];
      const player = window.__localPlayerPos;
      const activeBoss = rogues.find((r) => r.alive && !r.dying && r.group?.visible);

      if (!activeBoss || !player) {
        setBoss(null);
        return;
      }

      const dx = activeBoss.group.position.x - player.x;
      const dz = activeBoss.group.position.z - player.z;
      const distance = Math.sqrt(dx * dx + dz * dz);
      const damaged = activeBoss.hp < activeBoss.maxHp;

      setBoss(distance <= SHOW_RANGE || damaged ? {
        id: activeBoss.id,
        name: activeBoss.name || 'Arena Boss',
        level: activeBoss.level || 1,
        hp: activeBoss.hp,
        maxHp: activeBoss.maxHp,
        hpTankSize: activeBoss.hpTankSize || activeBoss.maxHp,
        hpTanks: activeBoss.hpTanks || 1,
      } : null);
    };

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, []);

  if (!boss) return null;

  const tankSize = boss.hpTankSize || boss.maxHp;
  const remainingTanks = tankSize > 0 ? Math.max(0, Math.ceil(boss.hp / tankSize)) : 0;
  const currentTankHp = boss.hp > 0 ? ((boss.hp - 1) % tankSize) + 1 : 0;
  const pct = tankSize > 0 ? Math.max(0, Math.min(1, currentTankHp / tankSize)) : 0;

  return (
    <div className="absolute top-5 left-1/2 -translate-x-1/2 z-30 pointer-events-none w-[min(520px,78vw)] select-none">
      <div className="text-center mb-2">
        <div className="text-[10px] font-bold tracking-[0.35em] uppercase text-red-200/80 drop-shadow">Level {boss.level}</div>
        <div className="text-lg font-black tracking-[0.18em] uppercase text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">{boss.name}</div>
      </div>

      <div
        className="relative rounded-xl border px-4 py-3 overflow-visible"
        style={{
          background: 'rgba(255, 255, 255, 0.08)',
          backdropFilter: 'blur(14px) saturate(180%)',
          WebkitBackdropFilter: 'blur(14px) saturate(180%)',
          borderColor: 'rgba(255, 100, 100, 0.38)',
          boxShadow: '0 8px 26px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.22)',
        }}
      >
      <div className="absolute -right-4 -top-4 rounded-full border border-red-200/40 bg-red-950/80 px-3 py-1 text-sm font-black tracking-wider text-red-100 shadow-[0_0_18px_rgba(255,60,80,0.45)]">
        ×{remainingTanks}
      </div>
      <div
        className="relative h-6 rounded-full overflow-hidden"
          style={{
            background: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid rgba(255,255,255,0.18)',
            boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.45)',
          }}
        >
          <div
            className="absolute inset-y-0 left-0 transition-all duration-300"
            style={{
              width: `${pct * 100}%`,
              background: 'linear-gradient(180deg, rgba(255,145,145,0.98) 0%, rgba(235,45,65,0.92) 55%, rgba(140,18,30,0.94) 100%)',
              boxShadow: '0 0 16px rgba(255,70,85,0.65), inset 0 1px 0 rgba(255,255,255,0.45)',
            }}
          />
          <div className="absolute inset-x-0 top-0 h-1/2 rounded-t-full bg-white/25" />
          <div className="absolute inset-0 flex items-center justify-center text-[11px] font-bold tracking-[0.2em] text-white/90 drop-shadow">
            {Math.max(0, Math.ceil(currentTankHp))} / {Math.ceil(tankSize)} HP
          </div>
        </div>
      </div>
    </div>
  );
}
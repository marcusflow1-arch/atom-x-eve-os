import React, { useEffect, useState } from 'react';
import {
  activateAXEMount,
  getAXEMountState,
  registerAXEMount,
  subscribeAXEMounts,
} from '../../axe/progression/AXEMountStore';
import {
  getAXEMountDefinition,
  getAXENextMountGrowthBand,
} from '../../axe/progression/AXEMountSystem';

export default function MountSubTab() {
  const [state, setState] = useState(getAXEMountState());
  const [lastResult, setLastResult] = useState(null);
  useEffect(() => subscribeAXEMounts(setState), []);

  return (
    <div className="h-full overflow-y-auto px-8 py-6 text-white">
      <div className="mx-auto max-w-5xl">
        <div className="border-b border-white/10 pb-4">
          <div className="text-[10px] uppercase tracking-[0.35em] text-amber-200/70">Ride & Registration</div>
          <h2 className="mt-1 text-2xl font-semibold">Mounts</h2>
          <p className="mt-1 text-sm text-white/45">
            Mount EXP grows through riding, PvE and PvP. Registration bonuses are independent from Pet bonuses.
          </p>
        </div>

        {lastResult && (
          <div className="mt-4 rounded-lg border border-white/10 bg-white/[0.04] px-4 py-2 text-xs text-white/65">
            {lastResult.ok ? 'Mount selection updated.' : lastResult.reason}
          </div>
        )}

        <div className="mt-5 grid grid-cols-1 gap-3 lg:grid-cols-2">
          {state.mounts.map((mount) => {
            const def = getAXEMountDefinition(mount.definitionId);
            const next = getAXENextMountGrowthBand(mount.totalXp);
            const registered = state.registeredMountId === mount.instanceId;
            const active = state.activeMountId === mount.instanceId;
            return (
              <div key={mount.instanceId} className="rounded-2xl border border-white/10 bg-slate-950/55 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-[10px] uppercase tracking-widest text-white/35">
                      {def?.rarity} · {def?.specialty}
                    </div>
                    <div className="mt-1 text-lg font-semibold">{def?.name || mount.definitionId}</div>
                    <div className="mt-1 text-xs text-amber-200/70">
                      Growth {mount.growthPercent}% · Speed ×{mount.speedMultiplier}
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <button
                      onClick={() => setLastResult(registerAXEMount(mount.instanceId))}
                      className={`rounded-lg px-3 py-1.5 text-[10px] font-semibold ${registered ? 'bg-cyan-300/20 text-cyan-100' : 'bg-white/10 text-white/65'}`}
                    >
                      {registered ? 'Registered' : 'Register Stats'}
                    </button>
                    <button
                      onClick={() => setLastResult(activateAXEMount(mount.instanceId))}
                      className={`rounded-lg px-3 py-1.5 text-[10px] font-semibold ${active ? 'bg-amber-300/20 text-amber-100' : 'bg-white/10 text-white/65'}`}
                    >
                      {active ? 'Active Mount' : 'Make Active'}
                    </button>
                  </div>
                </div>

                <div className="mt-3 text-xs text-emerald-200/75">
                  HP +{mount.bonuses.hp || 0} · Attack +{mount.bonuses.damage || 0} · Defense +{mount.bonuses.defense || 0}
                  {(mount.bonuses.attributionAttack || mount.bonuses.attributionDefense) ? (
                    <> · Attr ATK +{mount.bonuses.attributionAttack || 0} · Attr DEF +{mount.bonuses.attributionDefense || 0}</>
                  ) : null}
                </div>

                <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full bg-amber-300/80"
                    style={{
                      width: next
                        ? `${Math.min(100, (mount.totalXp / Math.max(1, next.totalXpRequired)) * 100)}%`
                        : '100%',
                    }}
                  />
                </div>
                <div className="mt-1 flex justify-between text-[10px] text-white/35">
                  <span>{mount.totalXp} total XP</span>
                  <span>{next ? `Next: ${next.percent}% @ ${next.totalXpRequired} XP` : 'MAX GROWTH'}</span>
                </div>

                <div className="mt-3 grid grid-cols-3 gap-2 text-center text-[10px] text-white/45">
                  <div className="rounded-lg bg-white/[0.04] px-2 py-2">Ride XP<br/><b className="text-white/75">{mount.sourceStats.ridingXp || 0}</b></div>
                  <div className="rounded-lg bg-white/[0.04] px-2 py-2">PvE XP<br/><b className="text-white/75">{mount.sourceStats.pveXp || 0}</b></div>
                  <div className="rounded-lg bg-white/[0.04] px-2 py-2">PvP XP<br/><b className="text-white/75">{mount.sourceStats.pvpXp || 0}</b></div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-5 rounded-xl border border-white/10 bg-white/[0.03] p-4 text-xs text-white/45">
          <b className="text-white/70">Anti-farm:</b> riding XP requires active movement over time, and repeated PvP kills against the same target are cooldown-gated before they can advance mount growth.
        </div>
      </div>
    </div>
  );
}

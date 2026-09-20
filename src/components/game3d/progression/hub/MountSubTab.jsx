import React, { useEffect, useState } from 'react';
import {
  activateAXEMount,
  addLegendaryAXEMountAbility,
  craftLegendaryAXEMount,
  getAXEMountState,
  previewLegendaryAXEMountCraft,
  registerAXEMount,
  rerollLegendaryAXEMountAbility,
  subscribeAXEMounts,
} from '../../axe/progression/AXEMountStore';
import {
  getAXEMountDefinition,
  getAXENextMountGrowthBand,
} from '../../axe/progression/AXEMountSystem';
import {
  AXE_LEGENDARY_MOUNT_PASSIVES,
} from '../../axe/progression/AXELegendaryMountSystem';

const confirmAction = (message) =>
  typeof window === 'undefined' ? true : window.confirm(message);

export default function MountSubTab() {
  const [state, setState] = useState(getAXEMountState());
  const [lastResult, setLastResult] = useState(null);
  useEffect(() => subscribeAXEMounts(setState), []);

  const attemptLegendaryCraft = (mount) => {
    const preview = previewLegendaryAXEMountCraft(mount.instanceId);
    if (!preview.ok) {
      setLastResult(preview);
      return;
    }
    if (!preview.canAfford) {
      setLastResult({ ok: false, reason: 'INSUFFICIENT_MATERIALS' });
      return;
    }
    if (!confirmAction('Craft this mount into a Legendary Mount? The listed materials will be consumed.')) return;
    setLastResult(craftLegendaryAXEMount(mount.instanceId, { confirmed: true }));
  };

  const addExtraAbility = (mount) => {
    if (!confirmAction('Consume a Mount Ability Seal to add this Legendary Mount’s extra ability?')) return;
    setLastResult(addLegendaryAXEMountAbility(mount.instanceId, { confirmed: true }));
  };

  const rerollAbility = (mount, index) => {
    if (!confirmAction('Reroll this Legendary Mount ability? The current roll will be replaced.')) return;
    setLastResult(rerollLegendaryAXEMountAbility(mount.instanceId, index, { confirmed: true }));
  };

  return (
    <div className="h-full overflow-y-auto px-8 py-6 text-white">
      <div className="mx-auto max-w-5xl">
        <div className="border-b border-white/10 pb-4">
          <div className="text-[10px] uppercase tracking-[0.35em] text-amber-200/70">Ride & Registration</div>
          <h2 className="mt-1 text-2xl font-semibold">Mounts</h2>
          <p className="mt-1 text-sm text-white/45">
            Mount EXP grows through riding, PvE and PvP. Legendary crafting adds persistent random abilities and a high-end passive.
          </p>
        </div>

        <div className="mt-3 flex flex-wrap gap-2 text-[10px] text-white/45">
          {Object.entries(state.materials || {}).map(([id, value]) => (
            <span key={id} className="rounded-md border border-white/10 bg-white/[0.03] px-2 py-1">
              {id.replaceAll('_', ' ')}: <b className="text-white/80">{value}</b>
            </span>
          ))}
        </div>

        {lastResult && (
          <div className="mt-4 rounded-lg border border-white/10 bg-white/[0.04] px-4 py-2 text-xs text-white/65">
            {lastResult.ok
              ? (lastResult.legendary ? 'Legendary Mount crafting completed.'
                : lastResult.ability ? `Ability acquired: ${lastResult.ability.label}`
                : 'Mount action completed.')
              : lastResult.reason}
          </div>
        )}

        <div className="mt-5 grid grid-cols-1 gap-3 lg:grid-cols-2">
          {state.mounts.map((mount) => {
            const def = getAXEMountDefinition(mount.definitionId);
            const next = getAXENextMountGrowthBand(mount.totalXp);
            const registered = state.registeredMountId === mount.instanceId;
            const active = state.activeMountId === mount.instanceId;
            const legendary = mount.legendary?.isLegendary ? mount.legendary : null;
            const craftPreview = !legendary ? previewLegendaryAXEMountCraft(mount.instanceId) : null;
            const passive = AXE_LEGENDARY_MOUNT_PASSIVES.find((entry) => entry.id === legendary?.passiveId);

            return (
              <div key={mount.instanceId} className="rounded-2xl border border-white/10 bg-slate-950/55 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-[10px] uppercase tracking-widest text-white/35">
                      {legendary ? 'legendary · ' : ''}{def?.rarity} · {def?.specialty}
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

                {!legendary && (
                  <div className="mt-4 rounded-xl border border-amber-300/15 bg-amber-300/[0.04] p-3">
                    <div className="text-[10px] uppercase tracking-[0.2em] text-amber-200/70">Legendary Evolution</div>
                    <div className="mt-1 text-xs text-white/45">
                      Requires 15%+ growth. Rolls three persistent abilities plus a unique passive.
                    </div>
                    <button
                      onClick={() => attemptLegendaryCraft(mount)}
                      disabled={!craftPreview?.ok || !craftPreview?.canAfford}
                      className="mt-3 w-full rounded-lg border border-amber-300/20 bg-amber-300/[0.08] px-3 py-2 text-xs font-semibold text-amber-100 disabled:opacity-30"
                    >
                      {!craftPreview?.ok
                        ? (craftPreview?.reason === 'GROWTH_REQUIRED' ? 'Reach 15% Growth' : 'Not Eligible')
                        : 'Craft Legendary Mount'}
                    </button>
                  </div>
                )}

                {legendary && (
                  <div className="mt-4 rounded-xl border border-fuchsia-300/15 bg-fuchsia-300/[0.035] p-3">
                    <div className="text-[10px] uppercase tracking-[0.2em] text-fuchsia-200/70">Legendary Ability Matrix</div>
                    {passive && (
                      <div className="mt-2 rounded-lg bg-white/[0.04] px-3 py-2">
                        <div className="text-xs font-semibold text-fuchsia-100">{passive.label}</div>
                        <div className="text-[10px] text-white/40">{passive.description}</div>
                      </div>
                    )}

                    <div className="mt-2 space-y-2">
                      {(legendary.abilities || []).map((ability, index) => (
                        <div key={`${ability.id}-${index}`} className="flex items-center justify-between rounded-lg bg-white/[0.04] px-3 py-2">
                          <div>
                            <div className="text-xs text-white/80">{ability.label}</div>
                            <div className="text-[10px] text-emerald-200/65">
                              {ability.stat} +{ability.value}{ability.unit === 'percent' ? '%' : ''}
                            </div>
                          </div>
                          <button
                            onClick={() => rerollAbility(mount, index)}
                            className="rounded-md border border-white/10 px-2 py-1 text-[9px] text-white/50"
                          >
                            Reroll
                          </button>
                        </div>
                      ))}
                    </div>

                    {!legendary.extraAbilityUnlocked && (
                      <button
                        onClick={() => addExtraAbility(mount)}
                        className="mt-3 w-full rounded-lg border border-fuchsia-300/20 bg-fuchsia-300/[0.08] px-3 py-2 text-xs font-semibold text-fuchsia-100"
                      >
                        Add Fourth Ability
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-5 rounded-xl border border-white/10 bg-white/[0.03] p-4 text-xs text-white/45">
          <b className="text-white/70">Safety:</b> riding XP requires active movement, repeated PvP targets are cooldown-gated, and high-value Legendary crafting/rerolls require an explicit confirmation before materials or rolls change.
        </div>
      </div>
    </div>
  );
}

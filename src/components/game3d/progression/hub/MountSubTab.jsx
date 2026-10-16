import CompanionSaveStatus from '../../equipment/CompanionSaveStatus';
import { useEffect, useState } from 'react';
import { subscribeCharacterChange } from '../../characterStorage';
import ProgressionReview from './ProgressionReview';
import MountSoulFusionPanel from './MountSoulFusionPanel';
import {
  activateAXEMount,
  addLegendaryAXEMountAbility,
  craftLegendaryAXEMount,
  getAXEMountState,
  previewLegendaryAXEMountCraft,
  registerAXEMount,
  rerollLegendaryAXEMountAbility,
  subscribeAXEMounts,
  setAXEMountSpiritualMode,
  strengthenAXEMountSpiritualWeapon,
} from '../../axe/progression/AXEMountStore';
import {
  getAXEMountDefinition,
  getAXENextMountGrowthBand,
} from '../../axe/progression/AXEMountSystem';
import {
  AXE_LEGENDARY_MOUNT_PASSIVES,
} from '../../axe/progression/AXELegendaryMountSystem';

export default function MountSubTab() {
  const [state, setState] = useState(getAXEMountState());
  const [lastResult, setLastResult] = useState(null);
  const [review, setReview] = useState(null);
  useEffect(() => subscribeAXEMounts(setState), []);
  useEffect(() => subscribeCharacterChange(() => { setReview(null); setLastResult(null); }), []);

  const requestReview = (mount, action, index) => {
    let preview;
    let title;
    let description;
    if (action === 'craft') {
      preview = previewLegendaryAXEMountCraft(mount.instanceId);
      title = `Evolve ${mount.definition.name}`;
      description = 'Craft a legendary mount with three random abilities and one passive. The materials below will be consumed.';
    } else if (action === 'extra') {
      preview = addLegendaryAXEMountAbility(mount.instanceId);
      title = 'Unlock a fourth ability';
      description = 'Add a permanent random ability to this legendary mount.';
    } else if (action === 'reroll') {
      preview = rerollLegendaryAXEMountAbility(mount.instanceId, index);
      title = `Reroll ${mount.legendary.abilities[index].label}`;
      description = 'Replace this ability with a random roll. The new roll may be weaker.';
    } else {
      const profile = mount.spiritualProfile;
      if (!profile.canAdvance) return;
      preview = { ok: true, canAfford: true, cost: { 'stored mount XP': profile.nextCost } };
      title = `Strengthen spiritual weapon to rank ${profile.rank + 1}`;
      description = 'Invest earned mount XP. Lifetime XP, growth, and legendary eligibility stay intact. These XP cannot be invested twice.';
    }
    if (!preview.ok && preview.reason !== 'CONFIRMATION_REQUIRED') return setLastResult(preview);
    if (!preview.canAfford) return setLastResult({ ok: false, reason: 'INSUFFICIENT_MATERIALS' });
    setReview({ title, description, cost: preview.cost, action, mountId: mount.instanceId,
      index, expectedRank: mount.spiritualProfile.rank });
  };

  const confirmReview = (pending) => {
    const options = { confirmed: true, expectedRank: pending.expectedRank };
    const result = pending.action === 'craft' ? craftLegendaryAXEMount(pending.mountId, options)
      : pending.action === 'extra' ? addLegendaryAXEMountAbility(pending.mountId, options)
      : pending.action === 'reroll' ? rerollLegendaryAXEMountAbility(pending.mountId, pending.index, options)
      : strengthenAXEMountSpiritualWeapon(pending.mountId, options);
    setLastResult(result);
    setReview(null);
  };

  return (
    <div className="h-full overflow-y-auto px-4 py-6 sm:px-8 text-white">
      <div className="mx-auto max-w-5xl">
        <div className="border-b border-white/10 pb-4">
          <div className="text-xs uppercase tracking-[0.35em] text-amber-200/70">Ride & Registration</div>
          <h2 className="mt-1 text-2xl font-semibold">Mounts</h2>
          <p className="mt-1 text-sm text-white/60">
            Mount EXP grows through riding, PvE and PvP. Legendary crafting adds persistent random abilities and a high-end passive.
          </p>
        </div>

        <div className="mt-3 flex flex-wrap gap-2 text-xs text-white/60">
          {Object.entries(state.materials || {}).map(([id, value]) => (
            <span key={id} className="rounded-md border border-white/10 bg-white/[0.03] px-2 py-1">
              {id.replaceAll('_', ' ')}: <b className="text-white/80">{value}</b>
            </span>
          ))}
        </div>

        <CompanionSaveStatus />

        <ProgressionReview review={review} onCancel={() => setReview(null)} onConfirm={confirmReview} />

        {lastResult && (
          <div role="status" className="mt-4 rounded-lg border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-white/80">
            {lastResult.ok
              ? (lastResult.message || (lastResult.legendary ? 'Legendary Mount crafting completed.'
                : lastResult.ability ? `Ability acquired: ${lastResult.ability.label}`
                : 'Mount action completed.'))
              : lastResult.message || lastResult.reason?.replaceAll('_', ' ')}
          </div>
        )}

        <MountSoulFusionPanel state={state} />

        <div className="mt-5 grid grid-cols-1 gap-4">
          {state.mounts.map((mount) => {
            const def = getAXEMountDefinition(mount.definitionId);
            const next = getAXENextMountGrowthBand(mount.totalXp);
            const registered = state.registeredMountId === mount.instanceId;
            const active = state.activeMountId === mount.instanceId;
            const legendary = mount.legendary?.isLegendary ? mount.legendary : null;
            const craftPreview = !legendary ? previewLegendaryAXEMountCraft(mount.instanceId) : null;
            const passive = AXE_LEGENDARY_MOUNT_PASSIVES.find((entry) => entry.id === legendary?.passiveId);

            return (
              <div key={mount.instanceId} className="grid grid-cols-1 gap-4 rounded-2xl border border-white/10 bg-slate-950/55 p-4 xl:grid-cols-2">
                <div className="xl:col-span-2">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-xs uppercase tracking-widest text-white/60">
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
                      className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${registered ? 'bg-cyan-300/20 text-cyan-100' : 'bg-white/10 text-white/65'}`}
                    >
                      {registered ? 'Registered' : 'Register Stats'}
                    </button>
                    <button
                      onClick={() => setLastResult(activateAXEMount(mount.instanceId))}
                      className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${active ? 'bg-amber-300/20 text-amber-100' : 'bg-white/10 text-white/65'}`}
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
                <div className="mt-1 flex justify-between text-xs text-white/60">
                  <span>{mount.totalXp} total XP</span>
                  <span>{next ? `Next: ${next.percent}% @ ${next.totalXpRequired} XP` : 'MAX GROWTH'}</span>
                </div>

                <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs text-white/60">
                  <div className="rounded-lg bg-white/[0.04] px-2 py-2">Ride XP<br/><b className="text-white/75">{mount.sourceStats.ridingXp || 0}</b></div>
                  <div className="rounded-lg bg-white/[0.04] px-2 py-2">PvE XP<br/><b className="text-white/75">{mount.sourceStats.pveXp || 0}</b></div>
                  <div className="rounded-lg bg-white/[0.04] px-2 py-2">PvP XP<br/><b className="text-white/75">{mount.sourceStats.pvpXp || 0}</b></div>
                </div>

                </div>
                <section aria-label={`${def?.name} spiritual weapon`} className="rounded-xl border border-cyan-200/20 bg-cyan-200/[0.04] p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-sm font-semibold text-cyan-100">Spiritual weapon</h3>
                    <span className="text-xs text-white/70">Rank {mount.spiritualProfile.rank} / {mount.spiritualProfile.maxRank}</span>
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-white/65">
                    Register this mount to apply combat bonuses. Utility travel speed applies while riding the active mount.
                  </p>
                  <div className="mt-3 flex gap-2" role="group" aria-label="Spiritual weapon mode">
                    {['offensive', 'utility'].map((mode) => (
                      <button key={mode} aria-pressed={mount.spiritualProfile.mode === mode}
                        onClick={() => setLastResult(setAXEMountSpiritualMode(mount.instanceId, mode))}
                        className={`flex-1 rounded-lg border px-3 py-2 text-xs capitalize ${mount.spiritualProfile.mode === mode ? 'border-cyan-200/40 bg-cyan-200/15 text-cyan-100' : 'border-white/15 text-white/65'}`}>
                        {mode}
                      </button>
                    ))}
                  </div>
                  <div className="mt-3 text-xs text-emerald-100">
                    {mount.spiritualProfile.mode === 'offensive'
                      ? `Attack +${mount.spiritualProfile.bonuses.damage}`
                      : `Evasion rating +${mount.spiritualProfile.bonuses.attackBlock} · Crit +${mount.spiritualProfile.bonuses.critChance}% · Mounted speed multiplier +${mount.spiritualProfile.bonuses.mountSpeedBonus}`}
                  </div>
                  <dl className="mt-3 flex flex-wrap justify-between gap-2 text-xs text-white/70">
                    <div><dt>Available XP</dt><dd className="text-base text-white">{mount.spiritualProfile.availableXp.toLocaleString()}</dd></div>
                    <div><dt>Invested XP</dt><dd className="text-base text-white">{mount.spiritualProfile.investedXp.toLocaleString()}</dd></div>
                  </dl>
                  <button onClick={() => requestReview(mount, 'spiritual')} disabled={!mount.spiritualProfile.canAdvance}
                    className="mt-3 w-full rounded-lg border border-cyan-200/25 bg-cyan-200/10 px-3 py-2 text-sm text-cyan-100 disabled:opacity-40">
                    {mount.spiritualProfile.isMaxRank ? 'Maximum spiritual rank' : `Strengthen · ${mount.spiritualProfile.nextCost.toLocaleString()} XP`}
                  </button>
                </section>

                {!legendary && (
                  <div className="rounded-xl border border-amber-300/15 bg-amber-300/[0.04] p-3">
                    <div className="text-xs uppercase tracking-[0.2em] text-amber-200/70">Legendary Evolution</div>
                    <div className="mt-1 text-xs text-white/60">
                      Requires 15%+ growth. Rolls three persistent abilities plus a unique passive.
                    </div>
                    <button
                      onClick={() => requestReview(mount, 'craft')}
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
                  <div className="rounded-xl border border-fuchsia-300/15 bg-fuchsia-300/[0.035] p-3">
                    <div className="text-xs uppercase tracking-[0.2em] text-fuchsia-200/70">Legendary Ability Matrix</div>
                    {passive && (
                      <div className="mt-2 rounded-lg bg-white/[0.04] px-3 py-2">
                        <div className="text-xs font-semibold text-fuchsia-100">{passive.label}</div>
                        <div className="text-xs text-white/60">{passive.description}</div>
                      </div>
                    )}

                    <div className="mt-2 space-y-2">
                      {(legendary.abilities || []).map((ability, index) => (
                        <div key={`${ability.id}-${index}`} className="flex items-center justify-between rounded-lg bg-white/[0.04] px-3 py-2">
                          <div>
                            <div className="text-xs text-white/80">{ability.label}</div>
                            <div className="text-xs text-emerald-200/65">
                              {ability.stat} +{ability.value}{ability.unit === 'percent' ? '%' : ''}
                            </div>
                          </div>
                          <button
                            onClick={() => requestReview(mount, 'reroll', index)}
                            className="rounded-md border border-white/10 px-2 py-1 text-xs text-white/50"
                          >
                            Reroll
                          </button>
                        </div>
                      ))}
                    </div>

                    {!legendary.extraAbilityUnlocked && (
                      <button
                        onClick={() => requestReview(mount, 'extra')}
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

        <div className="mt-5 rounded-xl border border-white/10 bg-white/[0.03] p-4 text-xs text-white/60">
          <b className="text-white/70">Safety:</b> riding XP requires active movement, repeated PvP targets are cooldown-gated, and high-value Legendary crafting/rerolls require an explicit confirmation before materials or rolls change.
        </div>
      </div>
    </div>
  );
}

import React, { useEffect, useMemo, useState } from 'react';
import {
  feedAXEPet,
  fuseAXEPets,
  getAXEPetState,
  overEnchantAXEPet,
  previewAXEPetFusionByIds,
  registerAXEPet,
  subscribeAXEPets,
  summonAXEPet,
  unsummonAXEPet,
} from '../../axe/progression/AXEPetStore';
import {
  AXE_PET_CONFIG,
  getAXEPetDefinition,
  xpForAXEPetLevel,
} from '../../axe/progression/AXEPetSystem';
import {
  AXE_PET_SPECIALTIES,
  getAXEPetFusionRecipe,
  getAXEPetTier,
} from '../../axe/progression/AXEPetTierSystem';

export default function PetSubTab() {
  const [state, setState] = useState(getAXEPetState());
  const [fusionSpecialty, setFusionSpecialty] = useState('balanced');
  const [fusionPreview, setFusionPreview] = useState(null);
  const [lastResult, setLastResult] = useState(null);

  useEffect(() => subscribeAXEPets((next) => {
    setState(next);
    setFusionPreview(null);
  }), []);

  const fusionGroup = useMemo(() => {
    const byTier = new Map();
    for (const pet of state.pets) {
      if (pet.registered || pet.summoned || pet.locked) continue;
      const tierId = pet.tierId || 'base';
      const recipe = getAXEPetFusionRecipe(tierId);
      if (!recipe) continue;
      const list = byTier.get(tierId) || [];
      list.push(pet);
      byTier.set(tierId, list);
    }

    for (const [tierId, pets] of byTier.entries()) {
      const recipe = getAXEPetFusionRecipe(tierId);
      if (recipe && pets.length >= recipe.requiredPetCount) {
        return pets.slice(0, recipe.requiredPetCount);
      }
    }
    return [];
  }, [state.pets]);

  const previewFusion = () => {
    if (!fusionGroup.length) {
      setLastResult({ ok: false, reason: 'NO_ELIGIBLE_FUSION_GROUP' });
      return;
    }
    const preview = previewAXEPetFusionByIds(
      fusionGroup.map((pet) => pet.instanceId),
      fusionSpecialty,
    );
    setFusionPreview(preview);
    setLastResult(null);
  };

  const confirmFusion = () => {
    if (!fusionPreview?.donorIds) return;
    const result = fuseAXEPets(fusionPreview.donorIds, {
      resultSpecialty: fusionSpecialty,
      confirmed: true,
    });
    setLastResult(result);
    setFusionPreview(null);
  };

  return (
    <div className="h-full overflow-y-auto px-8 py-6 text-white">
      <div className="mx-auto max-w-5xl">
        <div className="border-b border-white/10 pb-4">
          <div className="text-[10px] uppercase tracking-[0.35em] text-cyan-200/70">Companions</div>
          <h2 className="mt-1 text-2xl font-semibold">Pets</h2>
          <p className="mt-1 text-sm text-white/45">
            Pet registration, Lv 1–200 growth, over-enchant, Master tiers and God-pet specialization are separate from mounts.
          </p>
        </div>

        <div className="mt-3 flex flex-wrap gap-3 text-xs text-white/45">
          <span>Feed: <b className="text-white/80">{state.materials.pet_feed}</b></span>
          <span>Catalyst: <b className="text-white/80">{state.materials.pet_catalyst}</b></span>
          <span>Pet Souls: <b className="text-white/80">{state.materials.pet_soul || 0}</b></span>
          <span>God Essence: <b className="text-white/80">{state.materials.god_essence || 0}</b></span>
        </div>

        {lastResult && (
          <div className="mt-4 rounded-lg border border-white/10 bg-white/[0.04] px-4 py-2 text-xs text-white/65">
            {lastResult.ok
              ? (lastResult.result
                ? `Fusion complete — ${getAXEPetTier(lastResult.result.tierId).label} created.`
                : 'Pet action completed.')
              : lastResult.reason}
          </div>
        )}

        <div className="mt-5 grid grid-cols-1 gap-3 lg:grid-cols-2">
          {state.pets.map((pet) => {
            const def = getAXEPetDefinition(pet.definitionId);
            const tier = getAXEPetTier(pet.tierId || def?.tier || 'base');
            const registered = state.activeRegisteredPetId === pet.instanceId;
            const summoned = state.summonedPetId === pet.instanceId;
            const nextXP = xpForAXEPetLevel(pet.level);
            return (
              <div key={pet.instanceId} className="rounded-2xl border border-white/10 bg-slate-950/55 p-4">
                <div className="flex justify-between gap-3">
                  <div>
                    <div className="text-[10px] uppercase tracking-widest text-white/35">
                      {tier.label} · {pet.specialty || def?.specialty || 'balanced'}
                    </div>
                    <div className="mt-1 text-lg font-semibold">{def?.name || pet.definitionId}</div>
                    <div className="mt-1 text-xs text-white/45">
                      Lv {pet.level}/{AXE_PET_CONFIG.maxLevel} · Over-Enchant {pet.overEnchantPercent}%
                    </div>
                    <div className="mt-1 text-[10px] uppercase tracking-widest text-cyan-200/50">
                      Visual: {pet.visualProfile?.evolution || tier.visualEvolution}
                      {pet.visualProfile?.prestigeParticles ? ' · God Aura' : ''}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      const result = registerAXEPet(pet.instanceId);
                      setLastResult(result);
                    }}
                    className={`h-8 rounded-lg px-3 text-xs font-semibold ${registered ? 'bg-cyan-300/20 text-cyan-100' : 'bg-white/10 text-white/65'}`}
                  >
                    {registered ? 'Registered' : 'Register'}
                  </button>
                </div>

                <div className="mt-3 text-xs text-emerald-200/75">
                  HP +{pet.bonuses.hp} · Chi +{pet.bonuses.chi} · Defense +{pet.bonuses.defense} · Attack +{pet.bonuses.damage}
                  {(pet.bonuses.attributionAttack || pet.bonuses.attributionDefense) ? (
                    <> · Attr ATK +{pet.bonuses.attributionAttack || 0} · Attr DEF +{pet.bonuses.attributionDefense || 0}</>
                  ) : null}
                </div>

                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full bg-cyan-300/80" style={{ width: `${Math.min(100, (pet.xp / Math.max(1, nextXP)) * 100)}%` }} />
                </div>
                <div className="mt-1 flex justify-between text-[10px] text-white/35">
                  <span>{Math.round(pet.xp)} XP</span>
                  <span>{pet.level >= AXE_PET_CONFIG.maxLevel ? 'MAX' : nextXP}</span>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setLastResult(feedAXEPet(pet.instanceId))}
                    className="rounded-lg bg-white/[0.06] px-2 py-2 text-[10px]"
                  >
                    Feed
                  </button>
                  <button
                    onClick={() => setLastResult(overEnchantAXEPet(pet.instanceId))}
                    disabled={pet.overEnchantPercent >= AXE_PET_CONFIG.maxOverEnchantPercent}
                    className="rounded-lg bg-white/[0.06] px-2 py-2 text-[10px] disabled:opacity-30"
                  >
                    Over-Enchant
                  </button>
                  <button
                    onClick={() => {
                      const result = summoned ? unsummonAXEPet() : summonAXEPet(pet.instanceId);
                      setLastResult(result);
                    }}
                    className="rounded-lg bg-white/[0.06] px-2 py-2 text-[10px]"
                  >
                    {summoned ? 'Unsummon' : 'Summon'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-6 rounded-2xl border border-amber-300/15 bg-amber-300/[0.035] p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="text-[10px] uppercase tracking-[0.3em] text-amber-200/70">Pet Production / Fusion</div>
              <div className="mt-1 text-lg font-semibold">Master → God Pet Progression</div>
              <div className="mt-1 max-w-2xl text-xs text-white/45">
                Base pets can progress through Master, Adept Master, Grand Master and God tiers. Fusion never consumes a registered, summoned, or locked pet.
              </div>
            </div>
            <label className="text-[10px] uppercase tracking-widest text-white/40">
              Result Specialty
              <select
                value={fusionSpecialty}
                onChange={(e) => {
                  setFusionSpecialty(e.target.value);
                  setFusionPreview(null);
                }}
                className="ml-2 rounded-md border border-white/10 bg-slate-950 px-2 py-1.5 text-xs normal-case tracking-normal text-white"
              >
                {Object.values(AXE_PET_SPECIALTIES).map((specialty) => (
                  <option key={specialty.id} value={specialty.id}>{specialty.label}</option>
                ))}
              </select>
            </label>
          </div>

          {!fusionPreview ? (
            <button
              onClick={previewFusion}
              disabled={!fusionGroup.length}
              className="mt-4 rounded-lg border border-amber-300/20 bg-amber-300/[0.08] px-4 py-2 text-xs font-semibold text-amber-100 disabled:opacity-30"
            >
              {fusionGroup.length ? 'Preview Eligible Fusion' : 'Not Enough Eligible Pets'}
            </button>
          ) : (
            <div className="mt-4 rounded-xl border border-white/10 bg-black/20 p-4">
              {fusionPreview.ok ? (
                <>
                  <div className="text-sm font-semibold">
                    {getAXEPetTier(fusionPreview.sourceTier).label} → {getAXEPetTier(fusionPreview.resultTier).label}
                  </div>
                  <div className="mt-1 text-xs text-white/50">
                    Donors: {fusionPreview.donorIds.length} · Specialty: {fusionPreview.resultSpecialty} ·
                    Level retained: {fusionPreview.retainedLevel} · Over-Enchant retained: {fusionPreview.retainedOverEnchantPercent}%
                  </div>
                  <div className="mt-1 text-xs text-white/50">
                    Cost: {Object.entries(fusionPreview.materialCost || {}).map(([id, value]) => `${id.replaceAll('_', ' ')} ×${value}`).join(' · ') || 'None'}
                  </div>
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={confirmFusion}
                      disabled={!fusionPreview.canAfford}
                      className="rounded-lg border border-emerald-300/25 bg-emerald-300/[0.08] px-4 py-2 text-xs font-semibold text-emerald-100 disabled:opacity-30"
                    >
                      Confirm Fusion
                    </button>
                    <button onClick={() => setFusionPreview(null)} className="rounded-lg bg-white/[0.06] px-4 py-2 text-xs text-white/60">
                      Cancel
                    </button>
                  </div>
                </>
              ) : (
                <div className="text-xs text-rose-200/70">{fusionPreview.reason}</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

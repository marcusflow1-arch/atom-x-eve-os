import React, { useEffect, useState } from 'react';
import {
  feedAXEPet,
  getAXEPetState,
  overEnchantAXEPet,
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

export default function PetSubTab() {
  const [state, setState] = useState(getAXEPetState());
  useEffect(() => subscribeAXEPets(setState), []);

  return (
    <div className="h-full overflow-y-auto px-8 py-6 text-white">
      <div className="mx-auto max-w-5xl">
        <div className="border-b border-white/10 pb-4">
          <div className="text-[10px] uppercase tracking-[0.35em] text-cyan-200/70">Companions</div>
          <h2 className="mt-1 text-2xl font-semibold">Pets</h2>
          <p className="mt-1 text-sm text-white/45">Registered pet bonuses are separate from mount progression. Visible summon is optional.</p>
        </div>

        <div className="mt-3 flex gap-3 text-xs text-white/45">
          <span>Feed: <b className="text-white/80">{state.materials.pet_feed}</b></span>
          <span>Catalyst: <b className="text-white/80">{state.materials.pet_catalyst}</b></span>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-3 lg:grid-cols-2">
          {state.pets.map((pet) => {
            const def = getAXEPetDefinition(pet.definitionId);
            const registered = state.activeRegisteredPetId === pet.instanceId;
            const summoned = state.summonedPetId === pet.instanceId;
            const nextXP = xpForAXEPetLevel(pet.level);
            return (
              <div key={pet.instanceId} className="rounded-2xl border border-white/10 bg-slate-950/55 p-4">
                <div className="flex justify-between gap-3">
                  <div>
                    <div className="text-[10px] uppercase tracking-widest text-white/35">{def?.tier} · {def?.specialty}</div>
                    <div className="mt-1 text-lg font-semibold">{def?.name || pet.definitionId}</div>
                    <div className="mt-1 text-xs text-white/45">Lv {pet.level}/{AXE_PET_CONFIG.maxLevel} · Over-Enchant {pet.overEnchantPercent}%</div>
                  </div>
                  <button
                    onClick={() => registerAXEPet(pet.instanceId)}
                    className={`h-8 rounded-lg px-3 text-xs font-semibold ${registered ? 'bg-cyan-300/20 text-cyan-100' : 'bg-white/10 text-white/65'}`}
                  >
                    {registered ? 'Registered' : 'Register'}
                  </button>
                </div>

                <div className="mt-3 text-xs text-emerald-200/75">
                  HP +{pet.bonuses.hp} · Chi +{pet.bonuses.chi} · Defense +{pet.bonuses.defense} · Attack +{pet.bonuses.damage}
                </div>

                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full bg-cyan-300/80" style={{ width: `${Math.min(100, (pet.xp / Math.max(1, nextXP)) * 100)}%` }} />
                </div>
                <div className="mt-1 flex justify-between text-[10px] text-white/35">
                  <span>{Math.round(pet.xp)} XP</span><span>{pet.level >= AXE_PET_CONFIG.maxLevel ? 'MAX' : nextXP}</span>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2">
                  <button onClick={() => feedAXEPet(pet.instanceId)} className="rounded-lg bg-white/[0.06] px-2 py-2 text-[10px]">Feed</button>
                  <button onClick={() => overEnchantAXEPet(pet.instanceId)} disabled={pet.overEnchantPercent >= AXE_PET_CONFIG.maxOverEnchantPercent} className="rounded-lg bg-white/[0.06] px-2 py-2 text-[10px] disabled:opacity-30">Over-Enchant</button>
                  <button onClick={() => summoned ? unsummonAXEPet() : summonAXEPet(pet.instanceId)} className="rounded-lg bg-white/[0.06] px-2 py-2 text-[10px]">{summoned ? 'Unsummon' : 'Summon'}</button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

import React, { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, Lock, Swords } from 'lucide-react';
import { WEAPONS, MASTERY_MAX_LEVEL, getDamageScalingFor } from '../weaponSynergyData';
import { subscribeMastery } from '../weaponMasteryStore';
import WeaponMasteryTreePanel from '../weaponMastery/WeaponMasteryTreePanel';
import { resolveWeaponType, MILESTONE_LEVELS, MILESTONE_PASSIVES } from '../weaponMastery/weaponMasteryConfig';
import AdvancedClassPanel from '../../talents/AdvancedClassPanel';
import {
  getEquippedAXEItemInCategory,
  subscribeAXEEquipmentInventory,
} from '../../axe/equipment/AXEEquipmentInventoryStore';
import { resolveAXEWeaponIdentity } from '../../axe/weapons/AXEWeaponIdentity';

// Weapon Mastery has ONE job: proficiency for the weapon the player actually
// equips. It does not own a second enchant/rune/gear-upgrade backend.
// Blacksmith/equipment progression belongs to Services.

function weaponIcon(id) {
  return WEAPONS.find((weapon) => weapon.id === id)?.icon || '⚔️';
}

function MasteryCard({ weapon, entry, active, onOpen }) {
  const pct = entry?.isMaxLevel
    ? 100
    : (Number(entry?.killsIntoLevel || 0) / Math.max(1, Number(entry?.killsForNextLevel || 1))) * 100;

  return (
    <button
      onClick={onOpen}
      className={`rounded-2xl border p-4 text-left transition ${
        active
          ? 'border-white/25 bg-white/[0.10] shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]'
          : 'border-white/8 bg-black/[0.10] hover:border-white/18 hover:bg-white/[0.05]'
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-2xl">
          {weapon.icon}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm font-semibold text-white/90">{weapon.name}</div>
            {active && (
              <span className="rounded-md border border-emerald-200/20 bg-emerald-300/[0.08] px-2 py-1 text-[8px] font-semibold uppercase tracking-[0.20em] text-emerald-100">
                Equipped
              </span>
            )}
          </div>
          <div className="mt-1 text-[9px] uppercase tracking-[0.22em] text-white/35">
            Mastery {entry?.level || 1} / {MASTERY_MAX_LEVEL}
          </div>
        </div>
      </div>

      <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
        <div
          className="h-full rounded-full bg-white/55"
          style={{ width: `${Math.min(100, pct)}%` }}
        />
      </div>
      <div className="mt-1.5 flex justify-between text-[9px] text-white/30">
        <span>{entry?.isMaxLevel ? 'Mastered' : `${entry?.killsIntoLevel || 0} proficiency`}</span>
        <span>{entry?.isMaxLevel ? 'Complete' : `${entry?.killsForNextLevel || 0} next`}</span>
      </div>
    </button>
  );
}

function WeaponDetail({ weaponId, masteryEntry, activeIdentity, onBack }) {
  const weapon = WEAPONS.find((entry) => entry.id === weaponId);
  const type = resolveWeaponType(weaponId);
  const [view, setView] = useState('tree');
  const active = activeIdentity?.masteryWeaponId === weaponId;
  const scaling = getDamageScalingFor(weaponId);

  const milestones = useMemo(
    () => MILESTONE_LEVELS.map((level) => ({
      level,
      perk: MILESTONE_PASSIVES[type]?.[level] || null,
      unlocked: Number(masteryEntry?.level || 1) >= level,
    })).filter((entry) => entry.perk),
    [type, masteryEntry?.level],
  );

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 items-center justify-between gap-4 border-b border-white/10 px-6 py-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-white/55 hover:bg-white/[0.08]"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <div className="text-2xl">{weapon?.icon || '⚔️'}</div>
          <div>
            <div className="flex items-center gap-2">
              <div className="text-lg font-semibold text-white/90">{weapon?.name || weaponId}</div>
              {active && (
                <span className="rounded-md border border-emerald-200/20 bg-emerald-300/[0.08] px-2 py-0.5 text-[8px] uppercase tracking-wider text-emerald-100">
                  Current Equipment
                </span>
              )}
            </div>
            <div className="mt-0.5 text-[9px] uppercase tracking-[0.24em] text-white/35">
              Mastery Level {masteryEntry?.level || 1} / {MASTERY_MAX_LEVEL}
            </div>
          </div>
        </div>

        <div className="flex gap-1.5">
          {[
            { id: 'tree', label: 'Mastery Tree' },
            { id: 'milestones', label: 'Milestones' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setView(tab.id)}
              className={`rounded-lg border px-3 py-2 text-[9px] font-semibold uppercase tracking-[0.18em] ${
                view === tab.id
                  ? 'border-white/20 bg-white/[0.10] text-white'
                  : 'border-white/8 bg-white/[0.025] text-white/40 hover:text-white/65'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-[230px_1fr]">
        <aside className="min-h-0 overflow-y-auto border-r border-white/10 bg-black/[0.08] p-4">
          <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4 text-center">
            <div className="text-4xl font-light text-white">{masteryEntry?.level || 1}</div>
            <div className="mt-1 text-[9px] uppercase tracking-[0.26em] text-white/35">Proficiency Level</div>
          </div>

          <div className="mt-4 text-[9px] uppercase tracking-[0.25em] text-white/30">Damage Scales With</div>
          <div className="mt-2 space-y-1.5">
            {scaling.length ? scaling.map(({ stat, tier }) => (
              <div key={stat} className="flex justify-between rounded-lg border border-white/8 bg-white/[0.025] px-3 py-2 text-xs">
                <span className="capitalize text-white/55">{stat}</span>
                <span className="font-semibold text-white/80">{tier}</span>
              </div>
            )) : (
              <div className="text-xs text-white/30">No primary scaling metadata.</div>
            )}
          </div>

          <div className="mt-5 rounded-xl border border-white/8 bg-black/[0.10] p-3 text-[10px] leading-5 text-white/35">
            {active
              ? 'This mastery is active because this weapon family is equipped. Hits, skills and kills advance it automatically.'
              : 'This mastery is inactive. Equip a matching weapon from Inventory to make it active.'}
          </div>

          <button
            onClick={() => window.dispatchEvent(new CustomEvent('axeServiceRequested', { detail: { service: 'enchant' } }))}
            className="mt-3 w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-white/55 hover:bg-white/[0.08] hover:text-white/75"
          >
            Enhance Equipped Gear in Services
          </button>
        </aside>

        <section className="min-h-0 overflow-y-auto p-5">
          {view === 'tree' ? (
            <WeaponMasteryTreePanel weaponType={type} />
          ) : (
            <div className="mx-auto max-w-4xl">
              <div className="mb-4">
                <div className="text-[9px] uppercase tracking-[0.30em] text-white/35">Automatic Mastery Rewards</div>
                <div className="mt-1 text-xl font-semibold text-white/90">Milestones</div>
                <p className="mt-1 text-xs text-white/40">
                  Milestones unlock from real proficiency level. They are passive mastery rewards, not equipment enhancement.
                </p>
              </div>

              <div className="space-y-2">
                {milestones.map(({ level, perk, unlocked }) => (
                  <div
                    key={perk.id}
                    className={`flex items-start gap-3 rounded-xl border p-4 ${
                      unlocked
                        ? 'border-white/14 bg-white/[0.05]'
                        : 'border-white/6 bg-black/[0.08] opacity-55'
                    }`}
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04]">
                      {unlocked ? weaponIcon(weaponId) : <Lock className="h-3.5 w-3.5 text-white/35" />}
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="text-sm font-semibold text-white/80">{perk.name}</div>
                        <div className="text-[8px] uppercase tracking-wider text-white/30">Lv {level}</div>
                      </div>
                      <div className="mt-1 text-xs leading-5 text-white/40">{perk.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default function WeaponMasteryTab() {
  const [mastery, setMastery] = useState(null);
  const [selected, setSelected] = useState(null);
  const [topView, setTopView] = useState('mastery');
  const [equippedWeapon, setEquippedWeapon] = useState(() => getEquippedAXEItemInCategory('weapon'));

  useEffect(() => subscribeMastery(setMastery), []);
  useEffect(() => subscribeAXEEquipmentInventory(() => {
    setEquippedWeapon(getEquippedAXEItemInCategory('weapon'));
  }), []);

  const activeIdentity = useMemo(
    () => resolveAXEWeaponIdentity(equippedWeapon),
    [equippedWeapon],
  );

  if (!mastery) return null;

  if (selected && topView === 'mastery') {
    return (
      <WeaponDetail
        weaponId={selected}
        masteryEntry={mastery.weapons[selected]}
        activeIdentity={activeIdentity}
        onBack={() => setSelected(null)}
      />
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 items-center justify-between border-b border-white/10 px-6 py-3">
        <div>
          <div className="text-[9px] uppercase tracking-[0.30em] text-white/30">Equipped Weapon Identity</div>
          <div className="mt-1 flex items-center gap-2 text-sm text-white/75">
            <Swords className="h-4 w-4 text-white/45" />
            {activeIdentity.itemName || 'No weapon equipped'}
            {activeIdentity.masteryWeaponId && (
              <span className="text-[9px] uppercase tracking-wider text-white/30">
                · {activeIdentity.masteryWeaponId.replaceAll('_', ' ')}
              </span>
            )}
          </div>
        </div>

        <div className="flex rounded-xl border border-white/10 bg-black/[0.08] p-1">
          {[
            { id: 'mastery', label: 'Weapon Mastery' },
            { id: 'advanced', label: 'Advanced Classes' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setTopView(tab.id);
                setSelected(null);
              }}
              className={`rounded-lg px-4 py-2 text-[9px] font-semibold uppercase tracking-[0.18em] ${
                topView === tab.id
                  ? 'bg-white/[0.10] text-white'
                  : 'text-white/35 hover:text-white/60'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {topView === 'advanced' ? (
        <div className="min-h-0 flex-1 overflow-hidden">
          <AdvancedClassPanel />
        </div>
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto p-6">
          <div className="mb-5 max-w-3xl">
            <div className="text-[9px] uppercase tracking-[0.30em] text-white/30">Proficiency, Not Gear Enhancement</div>
            <h3 className="mt-1 text-xl font-semibold text-white/90">Weapon Mastery</h3>
            <p className="mt-1 text-xs leading-5 text-white/40">
              Mastery grows from combat with the weapon family you actually have equipped. It unlocks mastery nodes and milestones. Enchanting, reinforcement, sockets, refine and other item upgrades remain in Services so the two systems never conflict.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
            {WEAPONS.map((weapon) => (
              <MasteryCard
                key={weapon.id}
                weapon={weapon}
                entry={mastery.weapons[weapon.id]}
                active={activeIdentity.masteryWeaponId === weapon.id}
                onOpen={() => setSelected(weapon.id)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

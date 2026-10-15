// Wuxia blueprint §3 — choose the one archetype to specialize in (its passive
// doubles) and the two weapons drawn with Shift+1 / Shift+2.
import { useEffect, useState } from 'react';
import {
  getActiveEquippedAXEWeapon,
  getAXEInventoryItemsByCategory,
  subscribeAXEEquipmentInventory,
} from '../../axe/equipment/AXEEquipmentInventoryStore';
import {
  assignAXEQuickWeapon,
  setAXESpecializedArchetype,
  subscribeAXEWeaponAffinity,
} from '../../axe/weapons/AXEWeaponAffinityStore';
import {
  AXE_WEAPON_AFFINITY_MULTIPLIER,
  AXE_WEAPON_ARCHETYPES,
  AXE_WEAPON_ARCHETYPE_ORDER,
  getAXEArchetypePassive,
  inferAXEWeaponArchetype,
} from '../../axe/weapons/AXEWeaponArchetypes';

const pct = (v) => `+${Math.round(v * 100)}%`;
function passiveLines(p) {
  const out = [];
  if (p.damagePct) out.push(`${pct(p.damagePct)} damage`);
  if (p.defensePct) out.push(`${pct(p.defensePct)} total defense`);
  if (p.dodgePct) out.push(`${pct(p.dodgePct)} dodge rate`);
  if (p.moveSpeedPct) out.push(`${pct(p.moveSpeedPct)} movement speed`);
  if (p.critDodgePct) out.push(`${pct(p.critDodgePct)} critical dodge`);
  return out;
}

function ArchetypeCard({ id, specialized, inHand, onSpecialize }) {
  const def = AXE_WEAPON_ARCHETYPES[id];
  const isSpec = specialized === id;
  const base = passiveLines(getAXEArchetypePassive(id, null));
  const doubled = passiveLines(getAXEArchetypePassive(id, id));
  return (
    <div className={`rounded-2xl border p-4 ${isSpec ? 'border-amber-200/30 bg-amber-200/[0.06]' : 'border-white/8 bg-black/[0.10]'}`}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-sm font-semibold text-white/90">{def.label}</div>
          <div className="mt-0.5 text-[9px] uppercase tracking-[0.18em] text-white/35">{def.examples}</div>
        </div>
        {inHand && (
          <span className="rounded-md border border-emerald-200/20 bg-emerald-300/[0.08] px-2 py-1 text-[8px] font-semibold uppercase tracking-[0.18em] text-emerald-100">
            In hand
          </span>
        )}
      </div>
      <p className="mt-2 text-xs leading-5 text-white/45">{def.summary}</p>
      <div className="mt-3 space-y-1 text-[11px]">
        {base.map((line, i) => (
          <div key={line} className="flex justify-between gap-2">
            <span className={isSpec ? 'text-white/30 line-through' : 'text-white/70'}>{line}</span>
            <span className={isSpec ? 'font-semibold text-amber-100' : 'text-white/30'}>{doubled[i]} specialized</span>
          </div>
        ))}
      </div>
      <button
        onClick={() => onSpecialize(isSpec ? null : id)}
        className={`mt-4 w-full rounded-xl border px-3 py-2 text-[9px] font-semibold uppercase tracking-[0.18em] ${
          isSpec ? 'border-amber-200/30 bg-amber-200/[0.10] text-amber-100' : 'border-white/10 bg-white/[0.04] text-white/55 hover:bg-white/[0.08]'
        }`}
      >
        {isSpec ? 'Specialized (click to clear)' : 'Specialize'}
      </button>
    </div>
  );
}

export default function WeaponAffinityPanel() {
  const [affinity, setAffinity] = useState(null);
  const [weapons, setWeapons] = useState(() => getAXEInventoryItemsByCategory('weapon'));
  const [inHand, setInHand] = useState(() => getActiveEquippedAXEWeapon());
  const [message, setMessage] = useState('');

  useEffect(() => subscribeAXEWeaponAffinity(setAffinity), []);
  useEffect(() => subscribeAXEEquipmentInventory(() => {
    setWeapons(getAXEInventoryItemsByCategory('weapon'));
    setInHand(getActiveEquippedAXEWeapon());
  }), []);

  if (!affinity) return null;
  const handArchetype = inferAXEWeaponArchetype(inHand);

  return (
    <div className="space-y-6">
      <div className="max-w-3xl">
        <div className="text-[9px] uppercase tracking-[0.30em] text-white/30">Weapon Affinity</div>
        <h3 className="mt-1 text-xl font-semibold text-white/90">Five archetypes, one specialty</h3>
        <p className="mt-1 text-xs leading-5 text-white/40">
          Each weapon belongs to an archetype whose passive applies while it is in your hand. Specialize in one
          archetype and its passive doubles ({AXE_WEAPON_AFFINITY_MULTIPLIER}×). These stack with the native class
          passives and are provisional balance.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
        {AXE_WEAPON_ARCHETYPE_ORDER.map((id) => (
          <ArchetypeCard
            key={id}
            id={id}
            specialized={affinity.specialized}
            inHand={handArchetype === id}
            onSpecialize={(next) => setAXESpecializedArchetype(next)}
          />
        ))}
      </div>

      <div className="max-w-3xl">
        <div className="text-[9px] uppercase tracking-[0.30em] text-white/30">Quick-Switch</div>
        <h3 className="mt-1 text-base font-semibold text-white/90">Shift+1 / Shift+2</h3>
        <p className="mt-1 text-xs leading-5 text-white/40">
          Draw a quick-slot weapon instantly, even during the global cooldown; press the same keys again to return to
          the weapon you held. Your skill bar, stance and range follow the weapon in hand. A weapon that is not
          equipped takes the place of your other equipped weapon, never the one in your hand.
        </p>
        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
          {affinity.quickSlots.map((id, slot) => (
            <label key={slot} className="rounded-2xl border border-white/8 bg-black/[0.10] p-3">
              <div className="text-[9px] font-semibold uppercase tracking-[0.20em] text-white/40">Shift+{slot + 1}</div>
              <select
                value={id || ''}
                onChange={(e) => {
                  const r = assignAXEQuickWeapon(slot, e.target.value || null);
                  setMessage(r.ok ? '' : 'Could not assign that weapon');
                }}
                className="mt-2 w-full rounded-lg border border-white/10 bg-black/40 px-2 py-2 text-xs text-white/85"
              >
                <option value="">Empty</option>
                {weapons.map((w) => (
                  <option key={w.instanceId} value={w.instanceId}>
                    {w.name} · {AXE_WEAPON_ARCHETYPES[inferAXEWeaponArchetype(w)]?.label}
                    {w.instanceId === inHand?.instanceId ? ' (in hand)' : ''}
                  </option>
                ))}
              </select>
            </label>
          ))}
        </div>
        {message && <div className="mt-2 text-xs text-rose-200/80">{message}</div>}
      </div>
    </div>
  );
}

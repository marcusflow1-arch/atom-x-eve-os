// Shift+1 / Shift+2 draw the weapons in the two quick slots (AXEWeaponAffinityStore).
// Plain 1-0 stay the ability bar (AbilitySystem reads event.key, which is "!" / "@"
// with Shift held), so these never fire a skill.
import { useEffect, useRef, useState } from 'react';
import { quickSwitchAXEWeapon } from './AXEWeaponAffinityStore';
import { AXE_WEAPON_ARCHETYPES } from './AXEWeaponArchetypes';

const KEYS = Object.freeze({ Digit1: 0, Digit2: 1 });
const REASONS = Object.freeze({
  EMPTY_SLOT: 'Quick slot empty: assign a weapon in the Character Hub (Weapon Mastery, Affinity)',
  WEAPON_NOT_OWNED: 'That weapon is no longer in your inventory',
});

const typing = (el) => el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName));

export default function AXEWeaponQuickSwitchMount() {
  const [notice, setNotice] = useState(null);
  const timer = useRef(null);

  useEffect(() => {
    const onKey = (e) => {
      if (!e.shiftKey || e.ctrlKey || e.altKey || e.metaKey || e.repeat || typing(e.target)) return;
      const slot = KEYS[e.code];
      if (slot === undefined) return;
      e.preventDefault();
      const r = quickSwitchAXEWeapon(slot);
      const text = r.ok
        ? `${r.weapon?.name || 'Weapon'} · ${AXE_WEAPON_ARCHETYPES[r.archetype]?.label || ''}`
        : REASONS[r.reason] || 'Cannot switch weapons right now';
      setNotice({ slot: slot + 1, text, ok: r.ok, key: Date.now() });
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setNotice(null), 1600);
    };
    window.addEventListener('keydown', onKey);
    return () => { window.removeEventListener('keydown', onKey); clearTimeout(timer.current); };
  }, []);

  if (!notice) return null;
  // ink-wash notice: rice-paper text on ink, the slot number in a red seal
  return (
    <div
      key={notice.key}
      className="pointer-events-none fixed bottom-[15rem] left-1/2 z-[60] -translate-x-1/2 flex items-center gap-3 rounded-sm px-4 py-2"
      style={{ background: 'rgba(17,16,15,0.86)', boxShadow: '0 0 0 1px rgba(239,230,210,0.12), 0 8px 24px rgba(0,0,0,0.45)' }}
      role="status"
    >
      <span
        className="flex h-7 w-7 items-center justify-center rounded-[3px] text-sm font-bold"
        style={{ background: notice.ok ? '#a8281f' : '#4a4540', color: '#f3ead6', fontFamily: 'Georgia, "Noto Serif", serif' }}
      >
        {notice.slot}
      </span>
      <span className="text-sm tracking-wide" style={{ color: '#efe6d2', fontFamily: 'Georgia, "Noto Serif", serif' }}>
        {notice.text}
      </span>
    </div>
  );
}

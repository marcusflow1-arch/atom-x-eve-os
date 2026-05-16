import React, { useEffect, useState } from 'react';
import { ChevronsLeft } from 'lucide-react';
import { subscribeEquipment, getEquipmentState } from './equipmentStore';
import EquipmentPreview3D from './EquipmentPreview3D';
import AbilitiesTab from './AbilitiesTab';
import GearTab from './GearTab';
import TalentsTab from './TalentsTab';
import CompanionTab from './CompanionTab';
import WeaponPathTab from './WeaponPathTab';
import SkillsTab from './SkillsTab';
import MiscTab from './MiscTab';

const TABS = [
  { id: 'abilities', label: 'Abilities', hotkey: 'Q' },
  { id: 'gear',      label: 'Gear',     hotkey: null },
  { id: 'talents',   label: 'Talents',  hotkey: 'E' },
  { id: 'combat',    label: 'Combat',   hotkey: null },
  { id: 'skills',    label: 'Skills',   hotkey: null },
  { id: 'misc',      label: 'Loot',     hotkey: null },
  { id: 'companion', label: 'Companion', hotkey: null },
];

/**
 * Full-screen equipment menu (Where Winds Meet-inspired layout).
 * Toggled by pressing I inside the game. UI only — info text blank.
 */
export default function EquipmentMenu({ open, onClose }) {
  const [tab, setTab] = useState('gear');
  const [state, setState] = useState(getEquipmentState());

  useEffect(() => subscribeEquipment(setState), []);

  // Reset to Gear tab every time the menu is opened with the I key
  useEffect(() => {
    if (open) setTab('gear');
  }, [open]);

  // Hotkeys: Q/E to switch tabs, Esc/I to close
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      const k = e.key.toLowerCase();
      if (k === 'escape' || k === 'i') { e.preventDefault(); onClose(); }
      if (k === 'q') setTab((t) => (t === 'gear' ? 'abilities' : t === 'talents' ? 'gear' : 'abilities'));
      if (k === 'e') setTab((t) => (t === 'gear' ? 'talents' : t === 'abilities' ? 'gear' : 'talents'));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[80] text-white select-none"
      style={{
        background: 'linear-gradient(135deg, #1a1c22 0%, #25282f 40%, #2c2f37 70%, #1f2127 100%)',
      }}
    >
      {/* Top tabs */}
      <div className="absolute top-5 left-6 flex items-center gap-6 pointer-events-auto">
        {TABS.map((t) => {
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className="relative flex items-center gap-2 group"
            >
              <span
                className={`text-lg tracking-wider transition-all ${
                  active ? 'text-amber-400 font-semibold' : 'text-white/55 hover:text-white/80'
                }`}
              >
                {t.label}
              </span>
              {t.hotkey && (
                <span className="text-[10px] tracking-widest text-white/40 border border-white/15 px-1 py-px rounded-sm">
                  {t.hotkey}
                </span>
              )}
              {active && (
                <span className="absolute -bottom-1.5 left-0 right-0 h-0.5 bg-amber-400" />
              )}
            </button>
          );
        })}
      </div>

      {/* Top-right close */}
      <button
        onClick={onClose}
        className="absolute top-5 right-6 w-9 h-9 rounded-sm bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 flex items-center justify-center transition-all pointer-events-auto"
      >
        <ChevronsLeft className="w-5 h-5 text-white/80" />
      </button>

      {/* 3D Character Preview — fills the entire right side as a unified backdrop.
          Inventory grid + detail panel overlay on top of this with no opaque backgrounds,
          so it all reads as one continuous space. */}
      <div className="absolute top-16 right-0 bottom-16 left-[340px] pointer-events-none">
        <EquipmentPreview3D />
      </div>

      {/* Tab body (each tab renders its own GearActionsBar for the bottom controls) */}
      {tab === 'abilities' && <AbilitiesTab state={state} />}
      {tab === 'gear' &&      <GearTab state={state} />}
      {tab === 'talents' &&   <TalentsTab state={state} />}
      {tab === 'combat' &&    <WeaponPathTab />}
      {tab === 'skills' &&    <SkillsTab />}
      {tab === 'misc' &&      <MiscTab />}
      {tab === 'companion' && <CompanionTab />}
    </div>
  );
}
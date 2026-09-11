import React, { useEffect, useState } from 'react';
import { ChevronsLeft, Eye, EyeOff, Rotate3D } from 'lucide-react';
import { subscribeEquipment, getEquipmentState } from './equipmentStore';
import EquipmentPreview3D from './EquipmentPreview3D';
import AbilitiesTab from './AbilitiesTab';
import GearTab from './GearTab';
import TalentsTab from './TalentsTab';
import CompanionTab from './CompanionTab';
import SkillsTab from './SkillsTab';

const TABS = [
  { id: 'gear', label: 'Gear' },
  { id: 'skills', label: 'Skills' },
  { id: 'abilities', label: 'Abilities', hotkey: 'Q' },
  { id: 'talents', label: 'Talents', hotkey: 'E' },
  { id: 'companion', label: 'Companion' },
];

const APPEARANCE_GROUPS = [
  { id: 'outfit', label: 'Outfit' },
  { id: 'hair', label: 'Head' },
  { id: 'weapon', label: 'Weapon' },
  { id: 'body', label: 'Body' },
];

export default function EquipmentMenu({ open, onClose }) {
  const [tab, setTab] = useState('gear');
  const [state, setState] = useState(getEquipmentState());
  const [appearance, setAppearance] = useState({ body: true, outfit: true, hair: true, weapon: true });

  useEffect(() => subscribeEquipment(setState), []);
  useEffect(() => { if (open) setTab('gear'); }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      const k = e.key.toLowerCase();
      if (k === 'escape' || k === 'i') { e.preventDefault(); onClose(); }
      if (k === 'q') setTab('abilities');
      if (k === 'e') setTab('talents');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[80] text-white select-none overflow-hidden"
      style={{
        background: 'radial-gradient(circle at 72% 42%, rgba(48,110,135,0.16), transparent 33%), linear-gradient(135deg, rgba(5,9,15,0.76), rgba(8,13,22,0.58))',
        backdropFilter: 'blur(18px) saturate(135%)',
        WebkitBackdropFilter: 'blur(18px) saturate(135%)',
      }}
    >
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-200/30 to-transparent" />

      {/* Minimal navigation rail */}
      <div className="absolute top-5 left-1/2 -translate-x-1/2 z-30 pointer-events-auto flex items-center gap-1 rounded-full border border-white/10 bg-black/25 backdrop-blur-xl p-1.5 shadow-2xl">
        {TABS.map((item) => {
          const active = tab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              className={`relative rounded-full px-4 py-2 text-[11px] tracking-[0.18em] uppercase transition-all ${
                active ? 'bg-white/10 text-white' : 'text-white/45 hover:text-white/80 hover:bg-white/5'
              }`}
            >
              {item.label}
              {item.hotkey && <span className="ml-2 text-[9px] text-white/25">{item.hotkey}</span>}
              {active && <span className="absolute inset-x-4 -bottom-0.5 h-px bg-cyan-200/70" />}
            </button>
          );
        })}
      </div>

      <button
        onClick={onClose}
        className="absolute top-5 right-5 z-40 w-10 h-10 rounded-full border border-white/10 bg-black/30 hover:bg-white/10 flex items-center justify-center transition-all pointer-events-auto backdrop-blur-xl"
        title="Close"
      >
        <ChevronsLeft className="w-5 h-5 text-white/75" />
      </button>

      {/* Live character stage. The UI floats over it rather than hiding it. */}
      <div className="absolute top-12 right-0 bottom-8 left-[34%] z-0">
        <EquipmentPreview3D visibility={appearance} />
      </div>

      <div className="absolute top-24 right-6 z-30 pointer-events-auto w-44 rounded-2xl border border-white/10 bg-black/25 backdrop-blur-xl p-3 shadow-2xl">
        <div className="flex items-center gap-2 px-1 pb-2 text-[10px] tracking-[0.2em] uppercase text-white/40">
          <Rotate3D className="w-3.5 h-3.5" /> Appearance
        </div>
        <div className="space-y-1">
          {APPEARANCE_GROUPS.map((group) => {
            const enabled = appearance[group.id] !== false;
            return (
              <button
                key={group.id}
                onClick={() => setAppearance((prev) => ({ ...prev, [group.id]: !enabled }))}
                className="w-full flex items-center justify-between rounded-lg px-2.5 py-2 text-xs text-white/70 hover:bg-white/5 transition"
              >
                <span>{group.label}</span>
                {enabled ? <Eye className="w-3.5 h-3.5 text-cyan-200/80" /> : <EyeOff className="w-3.5 h-3.5 text-white/25" />}
              </button>
            );
          })}
        </div>
        <div className="mt-2 px-1 text-[9px] text-white/30 leading-relaxed">Drag the model to rotate. Scroll to zoom.</div>
      </div>

      {/* Existing feature panels stay intact; they now sit over the glass stage. */}
      <div className="absolute inset-0 z-10 pointer-events-none">
        <div className="pointer-events-auto h-full">
          {tab === 'abilities' && <AbilitiesTab state={state} />}
          {tab === 'gear' && <GearTab state={state} />}
          {tab === 'talents' && <TalentsTab state={state} />}
          {tab === 'skills' && <SkillsTab />}
          {tab === 'companion' && <CompanionTab />}
        </div>
      </div>

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 text-[9px] tracking-[0.22em] uppercase text-white/25 pointer-events-none">
        I / Esc close · drag model rotate · wheel zoom
      </div>
    </div>
  );
}

import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { subscribePlayerHUD } from './playerHUDStore';
import CharacterHubTabs from './progression/hub/CharacterHubTabs';
import HubSubTabs from './progression/hub/HubSubTabs';
import AttributesTab from './progression/hub/AttributesTab';
import WeaponMasteryTab from './progression/hub/WeaponMasteryTab';
import HaloSubTab from './progression/hub/HaloSubTab';
import TitleSubTab from './progression/hub/TitleSubTab';

// ─── Character Hub ────────────────────────────────────────────────────────
// MMORPG-style progression overlay (replaces the legacy split-panel screen).
// Top tabs: Attributes · Weapon Mastery (with Halo / Title sub-tabs)
// Opened with the C key (legacy hotkey preserved by the caller).
const MAIN_TABS = [
  { id: 'attributes', label: 'Attributes' },
  { id: 'mastery',    label: 'Weapon Mastery' },
];

const MASTERY_SUB_TABS = [
  { id: 'tree',  label: 'Mastery Trees' },
  { id: 'halo',  label: 'Halo' },
  { id: 'title', label: 'Title' },
];

export default function CharacterProgressionMenu({ isOpen, onClose }) {
  const [hud, setHud] = useState(null);
  const [mainTab, setMainTab] = useState('attributes');
  const [subTab, setSubTab] = useState('tree');

  useEffect(() => {
    if (!isOpen) return;
    return subscribePlayerHUD(setHud);
  }, [isOpen]);

  if (!isOpen || !hud) return null;

  return (
    <div
      className="fixed left-0 right-0 bottom-0 z-40 flex items-stretch"
      style={{
        top: '64px', // sit flush under the 64px (h-16) top header
        background: 'rgba(4,8,14,0.35)', // lighter so game world shows through
      }}
      onClick={onClose}
    >
      <div
        className="relative flex flex-col w-full h-full"
        style={{
          background: 'linear-gradient(135deg, rgba(14,22,34,0.55) 0%, rgba(8,12,20,0.55) 100%)',
          backdropFilter: 'blur(8px) saturate(120%)',
          WebkitBackdropFilter: 'blur(8px) saturate(120%)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header — engraved MMO style */}
        <div className="pt-5">
          <div className="text-center text-[11px] tracking-[0.45em] uppercase text-amber-200/80 font-semibold">
            Character
          </div>
          <CharacterHubTabs tabs={MAIN_TABS} activeId={mainTab} onChange={setMainTab} />
          {mainTab === 'mastery' && (
            <HubSubTabs tabs={MASTERY_SUB_TABS} activeId={subTab} onChange={setSubTab} />
          )}
        </div>

        {/* Body */}
        <div className="flex-1 min-h-0">
          {mainTab === 'attributes' && <AttributesTab hud={hud} />}
          {mainTab === 'mastery' && subTab === 'tree'  && <WeaponMasteryTab />}
          {mainTab === 'mastery' && subTab === 'halo'  && <HaloSubTab />}
          {mainTab === 'mastery' && subTab === 'title' && <TitleSubTab />}
        </div>

        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/80 transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Footer hint */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 text-[10px] text-white/40 tracking-[0.25em] uppercase">
          Press <span className="text-yellow-300 font-bold">C</span> or <span className="text-yellow-300 font-bold">Esc</span> to close
        </div>
      </div>
    </div>
  );
}
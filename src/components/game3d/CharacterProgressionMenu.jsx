import React, { useEffect, useState } from 'react';
import { X, Skull } from 'lucide-react';
import { subscribePlayerHUD } from './playerHUDStore';
import { subscribeKillCount } from './killCountStore';
import { base44 } from '@/api/base44Client';
import CharacterHubTabs from './progression/hub/CharacterHubTabs';
import HubSubTabs from './progression/hub/HubSubTabs';
import AttributesTab from './progression/hub/AttributesTab';
import WeaponMasteryTab from './progression/hub/WeaponMasteryTab';
import HaloSubTab from './progression/hub/HaloSubTab';
import WingsSubTab from './progression/hub/WingsSubTab';
import AuraSubTab from './progression/hub/AuraSubTab';
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
  { id: 'wings', label: 'Wings' },
  { id: 'aura',  label: 'Aura' },
  { id: 'title', label: 'Title' },
];

export default function CharacterProgressionMenu({ isOpen, onClose }) {
  const [hud, setHud] = useState(null);
  const [mainTab, setMainTab] = useState('attributes');
  const [subTab, setSubTab] = useState('tree');
  const [killCount, setKillCount] = useState(0);
  const [playerName, setPlayerName] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    return subscribePlayerHUD(setHud);
  }, [isOpen]);

  useEffect(() => subscribeKillCount(setKillCount), []);

  useEffect(() => {
    base44.auth.me()
      .then((u) => { if (u) setPlayerName(u.username || u.full_name || u.email?.split('@')[0] || 'Player'); })
      .catch(() => setPlayerName('Player'));
  }, []);

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
        {/* Top-left: player name + kill count */}
        <div className="absolute top-4 left-4 flex flex-col items-start gap-1.5 z-10">
          {playerName && (
            <div
              className="px-2.5 py-1 rounded-md text-[11px] font-bold tracking-wider"
              style={{
                background: 'rgba(8, 14, 22, 0.72)',
                border: '1px solid rgba(220, 200, 150, 0.45)',
                color: '#cffafe',
                textShadow: '0 1px 2px rgba(0,0,0,0.9), 0 0 8px rgba(34,211,238,0.4)',
              }}
            >
              {playerName}
            </div>
          )}
          <div
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold tracking-wider whitespace-nowrap"
            style={{
              background: 'rgba(20, 8, 8, 0.65)',
              border: '1px solid rgba(255, 90, 90, 0.5)',
              color: '#ffb4b4',
              textShadow: '0 1px 2px rgba(0,0,0,0.9)',
            }}
            title="Total rogue AI kills"
          >
            <Skull className="w-3 h-3" />
            <span className="opacity-80 text-[9px]">KILLS</span>
            <span className="tabular-nums text-white">{killCount}</span>
          </div>
        </div>

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
          {mainTab === 'mastery' && subTab === 'wings' && <WingsSubTab />}
          {mainTab === 'mastery' && subTab === 'aura'  && <AuraSubTab />}
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
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
import PalaceSubTab from './progression/hub/PalaceSubTab';
import ElixirSubTab from './progression/hub/ElixirSubTab';
import WingsSubTab from './progression/hub/WingsSubTab';
import AuraSubTab from './progression/hub/AuraSubTab';
import TitleSubTab from './progression/hub/TitleSubTab';
import SpiritServicesTab from './progression/hub/SpiritServicesTab';

const MAIN_TABS = [
  { id: 'attributes', label: 'Attributes' },
  { id: 'mastery', label: 'Progression' },
  { id: 'services', label: 'Spirit Services' },
];

const MASTERY_SUB_TABS = [
  { id: 'tree', label: 'Mastery' },
  { id: 'halo', label: 'Halo' },
  { id: 'palace', label: 'Palace' },
  { id: 'title', label: 'Title' },
  { id: 'elixirs', label: 'Elixirs' },
  { id: 'wings', label: 'Wings' },
  { id: 'aura', label: 'Aura' },
];

export default function CharacterProgressionMenu({ isOpen, onClose }) {
  const [hud, setHud] = useState(null);
  const [mainTab, setMainTab] = useState('attributes');
  const [subTab, setSubTab] = useState('tree');
  const [killCount, setKillCount] = useState(0);
  const [playerName, setPlayerName] = useState('');

  useEffect(() => {
    if (!isOpen) return undefined;
    return subscribePlayerHUD(setHud);
  }, [isOpen]);

  useEffect(() => subscribeKillCount(setKillCount), []);

  useEffect(() => {
    base44.auth.me()
      .then((user) => { if (user) setPlayerName(user.username || user.full_name || user.email?.split('@')[0] || 'Player'); })
      .catch(() => setPlayerName('Player'));
  }, []);

  if (!isOpen || !hud) return null;

  const navigate = (nextMain, nextSub) => {
    setMainTab(nextMain);
    if (nextSub) setSubTab(nextSub);
  };

  return (
    <div
      className="fixed left-0 right-0 bottom-0 z-40 flex items-stretch"
      style={{ top: '64px', background: 'rgba(2,6,12,0.28)' }}
      onClick={onClose}
    >
      <div
        className="relative flex flex-col w-full h-full border-t border-white/5"
        style={{
          background: 'radial-gradient(circle at 72% 25%, rgba(45,120,145,0.10), transparent 30%), linear-gradient(135deg, rgba(6,12,20,0.62), rgba(5,8,14,0.54))',
          backdropFilter: 'blur(16px) saturate(135%)',
          WebkitBackdropFilter: 'blur(16px) saturate(135%)',
        }}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="absolute top-4 left-5 z-10 flex items-center gap-2">
          {playerName && (
            <div className="rounded-full border border-white/10 bg-black/20 px-3 py-1.5 text-[10px] tracking-[0.18em] uppercase text-cyan-50/75">
              {playerName}
            </div>
          )}
          <div className="rounded-full border border-white/10 bg-black/20 px-3 py-1.5 flex items-center gap-1.5 text-[10px] text-white/45">
            <Skull className="w-3 h-3" /> {killCount.toLocaleString()}
          </div>
        </div>

        <div className="pt-5">
          <div className="text-center text-[9px] tracking-[0.42em] uppercase text-white/30">Character</div>
          <CharacterHubTabs tabs={MAIN_TABS} activeId={mainTab} onChange={setMainTab} />
          {mainTab === 'mastery' && <HubSubTabs tabs={MASTERY_SUB_TABS} activeId={subTab} onChange={setSubTab} />}
        </div>

        <div className="flex-1 min-h-0">
          {mainTab === 'attributes' && <AttributesTab hud={hud} />}
          {mainTab === 'mastery' && subTab === 'tree' && <WeaponMasteryTab />}
          {mainTab === 'mastery' && subTab === 'halo' && <HaloSubTab />}
          {mainTab === 'mastery' && subTab === 'palace' && <PalaceSubTab />}
          {mainTab === 'mastery' && subTab === 'title' && <TitleSubTab />}
          {mainTab === 'mastery' && subTab === 'elixirs' && <ElixirSubTab />}
          {mainTab === 'mastery' && subTab === 'wings' && <WingsSubTab />}
          {mainTab === 'mastery' && subTab === 'aura' && <AuraSubTab />}
          {mainTab === 'services' && <SpiritServicesTab hud={hud} onNavigate={navigate} />}
        </div>

        <button
          onClick={onClose}
          className="absolute top-4 right-5 w-9 h-9 rounded-full border border-white/10 bg-black/20 hover:bg-white/10 flex items-center justify-center text-white/60 hover:text-white transition"
          title="Close Character"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 text-[9px] text-white/25 tracking-[0.22em] uppercase pointer-events-none">
          C / Esc close
        </div>
      </div>
    </div>
  );
}

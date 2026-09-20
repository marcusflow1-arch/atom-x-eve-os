import React, { useEffect, useState } from 'react';
import { X, Skull, Sparkles } from 'lucide-react';
import { subscribePlayerHUD } from './playerHUDStore';
import { subscribeKillCount } from './killCountStore';
import { base44 } from '@/api/base44Client';
import CharacterHubTabs from './progression/hub/CharacterHubTabs';
import AttributesTab from './progression/hub/AttributesTab';
import WeaponMasteryTab from './progression/hub/WeaponMasteryTab';
import CharacterInventoryTab from './progression/hub/CharacterInventoryTab';
import AXEGlobalServicesMenu from './axe/services/AXEGlobalServicesMenu';

// AXE Character Hub
// C is the single home for Attributes, Weapon Mastery and all remote Services.
// The old standalone Services overlay is intentionally fused into this shell.
const MAIN_TABS = [
  { id: 'attributes', label: 'Attributes' },
  { id: 'inventory', label: 'Inventory / Gear' },
  { id: 'mastery', label: 'Weapon Mastery' },
  { id: 'services', label: 'Services' },
];

export default function CharacterProgressionMenu({
  isOpen,
  onClose,
  requestedService = null,
  onServiceRequestConsumed,
}) {
  const [hud, setHud] = useState(null);
  const [mainTab, setMainTab] = useState('attributes');
  const [serviceId, setServiceId] = useState('reinforcement');
  const [serviceItemId, setServiceItemId] = useState(null);
  const [killCount, setKillCount] = useState(0);
  const [playerName, setPlayerName] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    return subscribePlayerHUD(setHud);
  }, [isOpen]);

  useEffect(() => subscribeKillCount(setKillCount), []);

  useEffect(() => {
    base44.auth.me()
      .then((u) => {
        if (u) setPlayerName(u.username || u.full_name || u.email?.split('@')[0] || 'Player');
      })
      .catch(() => setPlayerName('Player'));
  }, []);

  // NPC/global service requests no longer open a second UI. They route directly
  // into the Services tab inside the C Character Hub.
  useEffect(() => {
    if (!isOpen || !requestedService) return;
    setServiceId(requestedService);
    setServiceItemId(null);
    setMainTab('services');
    onServiceRequestConsumed?.();
  }, [isOpen, requestedService, onServiceRequestConsumed]);

  if (!isOpen || !hud) return null;

  return (
    <div
      className="fixed inset-0 z-[150] flex items-stretch justify-stretch p-3 text-white"
      style={{
        background:
          'linear-gradient(115deg, rgba(5,7,10,0.72) 0%, rgba(7,9,12,0.58) 48%, rgba(3,5,8,0.76) 100%)',
        backdropFilter: 'blur(22px) saturate(105%)',
        WebkitBackdropFilter: 'blur(22px) saturate(105%)',
      }}
      onClick={onClose}
    >
      {/* Soft white light spots behind the glass, kept subtle so the world remains visible. */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at 10% 15%, rgba(255,255,255,0.12), transparent 17%), radial-gradient(circle at 64% 9%, rgba(255,255,255,0.08), transparent 13%), radial-gradient(circle at 86% 70%, rgba(255,255,255,0.09), transparent 18%), radial-gradient(circle at 35% 92%, rgba(255,255,255,0.05), transparent 16%)',
        }}
      />

      <div
        className="relative flex h-full w-full flex-col overflow-hidden border border-white/15 shadow-[0_28px_90px_rgba(0,0,0,0.55),inset_0_1px_0_rgba(255,255,255,0.14)]"
        style={{
          clipPath:
            'polygon(18px 0, calc(100% - 18px) 0, 100% 18px, 100% calc(100% - 18px), calc(100% - 18px) 100%, 18px 100%, 0 calc(100% - 18px), 0 18px)',
          background:
            'linear-gradient(105deg, rgba(126,130,137,0.54) 0%, rgba(86,91,99,0.40) 23%, rgba(49,54,62,0.28) 52%, rgba(19,23,29,0.46) 100%)',
          backdropFilter: 'blur(30px) saturate(115%)',
          WebkitBackdropFilter: 'blur(30px) saturate(115%)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Diamond/faceted finish. */}
        <div
          className="pointer-events-none absolute inset-0 opacity-55"
          style={{
            background:
              'linear-gradient(135deg, rgba(255,255,255,0.10) 0%, transparent 18%, transparent 82%, rgba(255,255,255,0.04) 100%), repeating-linear-gradient(45deg, rgba(255,255,255,0.018) 0 1px, transparent 1px 42px)',
          }}
        />
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(circle at 17% 20%, rgba(255,255,255,0.16), transparent 14%), radial-gradient(circle at 72% 18%, rgba(255,255,255,0.10), transparent 12%), radial-gradient(circle at 92% 78%, rgba(255,255,255,0.07), transparent 16%)',
          }}
        />

        {/* Header */}
        <header className="relative z-20 shrink-0 border-b border-white/10 bg-black/[0.08] px-5 pt-4 backdrop-blur-xl">
          <div className="flex items-center justify-between gap-4">
            <div className="flex min-w-[220px] items-center gap-3">
              <div
                className="flex h-10 w-10 rotate-45 items-center justify-center border border-white/20 bg-white/[0.06] shadow-[inset_0_1px_0_rgba(255,255,255,0.16)]"
              >
                <Sparkles className="-rotate-45 h-4 w-4 text-white/70" />
              </div>
              <div>
                <div className="text-[9px] font-semibold uppercase tracking-[0.42em] text-white/40">
                  AXE Character Interface
                </div>
                <div className="mt-0.5 text-sm font-semibold text-white/90">
                  {playerName || 'Player'}
                </div>
              </div>
            </div>

            <div className="min-w-0 flex-1">
              <div className="text-center text-[10px] font-semibold uppercase tracking-[0.5em] text-white/55">
                Character Hub
              </div>
              <CharacterHubTabs tabs={MAIN_TABS} activeId={mainTab} onChange={setMainTab} />
            </div>

            <div className="flex min-w-[220px] items-center justify-end gap-3">
              <div className="rounded-xl border border-white/10 bg-black/[0.12] px-3 py-2 backdrop-blur-xl">
                <div className="flex items-center gap-2 text-[10px] font-semibold tracking-wider text-white/55">
                  <Skull className="h-3.5 w-3.5 text-white/45" />
                  KILLS
                  <span className="tabular-nums text-white/90">{killCount}</span>
                </div>
              </div>
              <button
                onClick={onClose}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/[0.06] text-white/65 backdrop-blur-xl transition hover:bg-white/[0.12] hover:text-white"
                aria-label="Close Character Hub"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        </header>

        {/* Body */}
        <main className="relative z-10 min-h-0 flex-1">
          {mainTab === 'attributes' && <AttributesTab hud={hud} />}

          {mainTab === 'inventory' && (
            <CharacterInventoryTab
              onOpenService={(nextServiceId, itemId) => {
                setServiceId(nextServiceId);
                setServiceItemId(itemId);
                setMainTab('services');
              }}
            />
          )}

          {mainTab === 'mastery' && (
            <div className="h-full overflow-hidden">
              <div className="border-b border-white/8 px-7 py-3 text-[10px] uppercase tracking-[0.32em] text-white/35">
                Weapon Mastery · Combat Specialization
              </div>
              <div style={{ height: "calc(100% - 42px)" }}>
                <WeaponMasteryTab />
              </div>
            </div>
          )}

          {mainTab === 'services' && (
            <AXEGlobalServicesMenu
              embedded
              isOpen
              requestedService={serviceId}
              requestedItemId={serviceItemId}
            />
          )}
        </main>

        <footer className="relative z-20 shrink-0 border-t border-white/8 bg-black/[0.08] px-6 py-2 text-center text-[9px] uppercase tracking-[0.28em] text-white/30">
          C / ESC closes · Services are now part of the Character Hub
        </footer>
      </div>
    </div>
  );
}

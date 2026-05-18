import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Home, Package, Swords, Hammer, Castle, Shield } from 'lucide-react';
import { subscribe, loadMyClans, setActiveClan, clanAction, teardownClanStore } from './clanStore';
import ClanOverlaySidebar from './ClanOverlaySidebar';
import ClanOverlayHome from './ClanOverlayHome';
import ClanOverlayVault from './ClanOverlayVault';
import ClanOverlayMissions from './ClanOverlayMissions';
import ClanOverlayUpgrades from './ClanOverlayUpgrades';
import ClanOverlayHall from './ClanOverlayHall';
import ClanOverlayRanks from './ClanOverlayRanks';
import ClanOverlayChat from './ClanOverlayChat';

const TABS = [
  { key: 'home', label: 'Home', icon: Home, Component: ClanOverlayHome },
  { key: 'vault', label: 'Vault', icon: Package, Component: ClanOverlayVault },
  { key: 'missions', label: 'Missions', icon: Swords, Component: ClanOverlayMissions },
  { key: 'upgrades', label: 'Upgrades', icon: Hammer, Component: ClanOverlayUpgrades },
  { key: 'hall', label: 'Hall', icon: Castle, Component: ClanOverlayHall },
  { key: 'ranks', label: 'Ranks', icon: Shield, Component: ClanOverlayRanks },
];

/**
 * Root in-game clan overlay (Guild Wars 2 style).
 * Opened by pressing G — appears over the 3D world.
 *
 * Layout:
 *   [Sidebar — guild list] [Vertical tabs] [Main tab content] [Chat panel]
 *   [Footer — Create Guild / Stand Down]
 */
export default function ClanOverlay({ open, onClose, userId }) {
  const [snap, setSnap] = useState(null);
  const [tab, setTab] = useState('home');
  const [leaving, setLeaving] = useState(false);

  // Subscribe to the clan store while overlay is mounted
  useEffect(() => {
    const unsub = subscribe(setSnap);
    return () => unsub();
  }, []);

  // Load data once when overlay opens
  useEffect(() => {
    if (open && userId) loadMyClans(userId);
  }, [open, userId]);

  // Tear down realtime subscriptions when overlay closes (to avoid leaks)
  useEffect(() => {
    if (!open) {
      // Keep snapshot in memory but cancel subs
      return () => teardownClanStore();
    }
  }, [open]);

  if (!open || !snap) return null;

  const ActiveTab = TABS.find((t) => t.key === tab)?.Component || ClanOverlayHome;

  const handleStandDown = async () => {
    if (!snap.activeClan || !snap.myMembership) return;
    if (snap.myMembership.role === 'leader') {
      alert('Leaders cannot leave. Transfer ownership or dismantle the guild.');
      return;
    }
    setLeaving(true);
    try {
      await clanAction('leave_clan', { divisionId: snap.activeClan.id });
      // Reload
      await loadMyClans(userId);
    } catch (e) { console.error(e); alert(e.message); }
    finally { setLeaving(false); }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-auto"
        style={{ background: 'rgba(0, 0, 0, 0.55)', backdropFilter: 'blur(2px)' }}
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        <motion.div
          initial={{ y: 20, scale: 0.98 }}
          animate={{ y: 0, scale: 1 }}
          exit={{ y: 20, scale: 0.98 }}
          transition={{ type: 'spring', damping: 30, stiffness: 250 }}
          className="w-[92vw] max-w-[1280px] h-[80vh] max-h-[760px] flex flex-col overflow-hidden rounded-xl shadow-2xl"
          style={{
            background: 'linear-gradient(135deg, rgba(20, 24, 32, 0.94) 0%, rgba(15, 18, 25, 0.96) 100%)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            boxShadow: '0 20px 60px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.04)',
          }}
        >
          {/* Title bar */}
          <div className="flex items-center gap-3 px-5 py-3 border-b border-white/10"
            style={{ background: 'linear-gradient(90deg, rgba(80,60,30,0.18) 0%, rgba(15,18,25,0) 100%)' }}
          >
            <Shield className="w-5 h-5 text-amber-300" />
            <div className="text-white text-base font-bold tracking-wide">
              {snap.activeClan ? `${snap.activeClan.name}: ${snap.activeClan.motto || 'Sanctum of the Guild'}` : 'Guild Panel'}
            </div>
            <button onClick={onClose} className="ml-auto w-7 h-7 rounded flex items-center justify-center hover:bg-white/10 text-white/60 hover:text-white transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 flex overflow-hidden">
            {/* Left: guild list */}
            <ClanOverlaySidebar
              myClans={snap.myClans}
              activeClanId={snap.activeClanId}
              onSelect={(id) => setActiveClan(id, userId)}
              onCreateClan={() => alert('Open the Clan dashboard to create a new guild.')}
              onWhatIsGuild={() => alert('Guilds are persistent player groups with shared chat, vault, missions, and a private hall.')}
            />

            {/* Tab rail */}
            <div className="w-12 flex-shrink-0 flex flex-col items-center gap-1 py-3 border-r border-white/5">
              {TABS.map((t) => {
                const Icon = t.icon;
                const isActive = t.key === tab;
                return (
                  <button
                    key={t.key}
                    onClick={() => setTab(t.key)}
                    title={t.label}
                    className={`w-9 h-9 rounded flex items-center justify-center transition-all ${
                      isActive ? 'bg-amber-500/15 text-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.2)]' : 'text-white/40 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </button>
                );
              })}
            </div>

            {/* Main panel */}
            <ActiveTab
              clan={snap.activeClan}
              members={snap.members}
              onlineUserIds={snap.onlineUserIds}
              myMembership={snap.myMembership}
              vaultItems={snap.vaultItems}
              upgrades={snap.upgrades}
              missions={snap.missions}
              hall={snap.hall}
            />

            {/* Chat */}
            <ClanOverlayChat clan={snap.activeClan} messages={snap.messages} myMembership={snap.myMembership} />
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-5 py-3 border-t border-white/10 bg-black/30">
            <button
              onClick={() => alert('Open the Clan dashboard to create a new guild.')}
              className="px-4 py-1.5 text-xs font-semibold text-white/70 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 rounded transition-colors"
            >
              Create Guild
            </button>
            <div className="text-white/30 text-[10px] tracking-wider uppercase">Press G to close</div>
            <button
              onClick={handleStandDown}
              disabled={!snap.myMembership || leaving}
              className="px-4 py-1.5 text-xs font-semibold text-amber-200 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-400/30 rounded transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {leaving ? 'Standing Down...' : 'Stand Down'}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
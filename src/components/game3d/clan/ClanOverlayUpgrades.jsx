import React from 'react';
import { Hammer, Coins, Gem, CheckCircle2, Loader2, Lock } from 'lucide-react';
import { clanAction } from './clanStore';

const UPGRADE_TREE = [
  // Tactics — combat buffs
  { key: 'banner_strength', name: 'Banner of Strength', category: 'tactics', favor: 50, aetherium: 20, seconds: 1800 },
  { key: 'banner_speed', name: 'Banner of Swiftness', category: 'tactics', favor: 50, aetherium: 20, seconds: 1800 },
  // Economy — vault & favor
  { key: 'vault_tab_2', name: 'Vault Stash Tab II', category: 'economy', favor: 100, aetherium: 50, seconds: 3600 },
  { key: 'vault_tab_3', name: 'Vault Stash Tab III', category: 'economy', favor: 200, aetherium: 100, seconds: 7200 },
  { key: 'favor_boost', name: 'Favor Generation +25%', category: 'economy', favor: 150, aetherium: 75, seconds: 5400 },
  // Politics — roster
  { key: 'roster_expand', name: 'Roster Expansion', category: 'politics', favor: 200, aetherium: 100, seconds: 7200 },
  { key: 'guild_hall', name: 'Guild Hall License', category: 'politics', favor: 500, aetherium: 250, seconds: 10800 },
  // War — pvp
  { key: 'siege_workshop', name: 'Siege Workshop', category: 'war', favor: 300, aetherium: 150, seconds: 7200 },
  // Art of War — banners
  { key: 'guild_banner_xl', name: 'Heroic Banner', category: 'art_of_war', favor: 400, aetherium: 200, seconds: 9000 },
];

const CATEGORY_COLORS = {
  tactics: 'from-amber-500/20 to-amber-700/10 border-amber-400/30',
  economy: 'from-green-500/20 to-green-700/10 border-green-400/30',
  politics: 'from-blue-500/20 to-blue-700/10 border-blue-400/30',
  war: 'from-red-500/20 to-red-700/10 border-red-400/30',
  art_of_war: 'from-purple-500/20 to-purple-700/10 border-purple-400/30',
};

const CATEGORY_LABELS = {
  tactics: 'Tactics', economy: 'Economy', politics: 'Politics', war: 'War', art_of_war: 'Art of War',
};

function formatTime(seconds) {
  if (seconds >= 3600) return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
  if (seconds >= 60) return `${Math.floor(seconds / 60)}m`;
  return `${Math.floor(seconds)}s`;
}

/** Guild Upgrades — five-lane upgrade tree with timed builds. */
export default function ClanOverlayUpgrades({ clan, upgrades, myMembership, hall }) {
  if (!clan) return null;

  const canStart = myMembership && (myMembership.role === 'leader' || myMembership.role === 'officer');
  const byKey = Object.fromEntries(upgrades.map((u) => [u.upgrade_key, u]));

  const start = async (up) => {
    try {
      await clanAction('start_upgrade', {
        divisionId: clan.id, upgradeKey: up.key, upgradeName: up.name, category: up.category,
        buildSeconds: up.seconds, costFavor: up.favor, costAetherium: up.aetherium,
      });
    } catch (e) { console.error(e); }
  };

  const groups = Object.keys(CATEGORY_LABELS).map((cat) => ({
    cat,
    items: UPGRADE_TREE.filter((u) => u.category === cat),
  }));

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="px-6 py-4 border-b border-white/10 flex items-center gap-4"
        style={{ background: 'linear-gradient(90deg, rgba(140,80,30,0.18) 0%, rgba(15,18,25,0) 100%)' }}>
        <Hammer className="w-6 h-6 text-amber-300" />
        <div className="flex-1">
          <h2 className="text-white text-lg font-bold">Guild Upgrades</h2>
          <p className="text-white/50 text-xs">Spend Favor + Aetherium to unlock guild-wide perks.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-amber-300 text-sm">
            <Coins className="w-4 h-4" /><span className="font-bold">{hall?.favor || 0}</span>
          </div>
          <div className="flex items-center gap-1 text-cyan-300 text-sm">
            <Gem className="w-4 h-4" /><span className="font-bold">{hall?.aetherium || 0}</span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {groups.map(({ cat, items }) => (
          <div key={cat}>
            <div className="text-white/70 text-xs font-bold uppercase tracking-widest mb-2">{CATEGORY_LABELS[cat]}</div>
            <div className="grid grid-cols-2 gap-2">
              {items.map((up) => {
                const existing = byKey[up.key];
                const status = existing?.status || 'available';
                const inProgress = status === 'in_progress';
                const completed = status === 'completed';
                const tier = existing?.tier || 1;
                return (
                  <div key={up.key}
                    className={`p-3 rounded-lg bg-gradient-to-br border ${CATEGORY_COLORS[cat]}`}
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-white text-sm font-semibold truncate flex-1">{up.name}</span>
                      <span className="text-white/40 text-xs">T{tier}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs mb-2">
                      <span className="flex items-center gap-1 text-amber-300/80"><Coins className="w-3 h-3" />{up.favor}</span>
                      <span className="flex items-center gap-1 text-cyan-300/80"><Gem className="w-3 h-3" />{up.aetherium}</span>
                      <span className="text-white/40">{formatTime(up.seconds)}</span>
                    </div>
                    {completed ? (
                      <div className="flex items-center gap-1.5 text-green-300 text-xs"><CheckCircle2 className="w-3.5 h-3.5" />Completed</div>
                    ) : inProgress ? (
                      <div className="flex items-center gap-1.5 text-amber-300 text-xs"><Loader2 className="w-3.5 h-3.5 animate-spin" />Building...</div>
                    ) : (
                      <button
                        onClick={() => start(up)}
                        disabled={!canStart}
                        className="w-full px-2 py-1 text-xs font-semibold bg-white/5 border border-white/10 rounded hover:bg-white/10 text-white/80 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1"
                      >
                        {!canStart && <Lock className="w-3 h-3" />}
                        {canStart ? 'Start Build' : 'Officers Only'}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
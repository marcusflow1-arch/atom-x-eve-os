import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Users, Globe, Circle, Skull, Crosshair } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/components/auth/AuthContext';
import { subscribeBosses } from '../bossStore';
import { setTrackedBoss, subscribeTrackedBoss } from '../bossGuidanceStore';

/**
 * OnlinePlayersPanel — Game Mode presence widget.
 *
 * Mirrors the Luna dashboard's friends-online system:
 *   • "In World" tab → other players in the same multiplayer channel as us
 *     (driven by the global `multiplayerPlayersUpdate` event that
 *     MultiplayerSystem already broadcasts).
 *   • "Global" tab  → every other player currently online on the platform
 *     (polled from PlayerState every 5s, same query the dashboard uses).
 *
 * Mounted top-right in GameView, collapsible to a small bubble.
 */
export default function OnlinePlayersPanel() {
  const { user } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [tab, setTab] = useState('world'); // 'world' | 'global' | 'boss'
  const [worldPlayers, setWorldPlayers] = useState([]);
  const [bosses, setBosses] = useState([]);
  const [trackedBossId, setTrackedBossId] = useState(null);

  // Live boss state + currently tracked boss (for the "guide me" star icon)
  useEffect(() => {
    const u1 = subscribeBosses(setBosses);
    const u2 = subscribeTrackedBoss(setTrackedBossId);
    return () => { u1(); u2(); };
  }, []);

  // Listen to the same event MultiplayerSystem dispatches for the dashboard
  useEffect(() => {
    const onUpdate = (e) => {
      const players = (e.detail?.players || []).map((p) => ({
        id: p.player_id,
        name: p.display_name || 'Player',
        avatar: p.avatar_url || '',
      }));
      setWorldPlayers(players);
    };
    window.addEventListener('multiplayerPlayersUpdate', onUpdate);
    return () => window.removeEventListener('multiplayerPlayersUpdate', onUpdate);
  }, []);

  // Global online list — same source as the Luna dashboard friends panel
  const { data: globalUsers = [] } = useQuery({
    queryKey: ['gameViewGlobalUsers', user?.id],
    queryFn: async () => {
      const res = await base44.entities.PlayerState.list();
      const now = Date.now();
      return res
        .filter((p) => p.player_id !== user?.id && now - (p.last_update || 0) < 30000)
        .map((p) => ({
          id: p.player_id,
          name: p.display_name || 'Player',
          avatar: p.avatar_url || '',
          where: p.channel_id?.startsWith('game_')
            ? 'In Game'
            : p.channel_id?.startsWith('dashboard_')
            ? 'On Dashboard'
            : 'Online',
        }));
    },
    enabled: !!user?.id,
    refetchInterval: 5000,
  });

  const list = tab === 'world' ? worldPlayers : globalUsers;
  const count = list.length;

  if (collapsed) {
    return (
      <button
        onClick={() => setCollapsed(false)}
        className="absolute top-4 right-4 z-30 px-3 py-2 rounded-full bg-black/60 backdrop-blur-md border border-white/15 text-white/80 hover:text-white text-xs flex items-center gap-2 transition-all"
      >
        <Users className="w-3.5 h-3.5 text-cyan-300" />
        <span className="font-bold">{worldPlayers.length}</span>
        <span className="text-white/40">in world</span>
      </button>
    );
  }

  return (
    <div className="absolute top-4 right-4 z-30 w-64 rounded-xl bg-black/65 backdrop-blur-md border border-white/15 shadow-2xl flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-cyan-300" />
          <span className="text-white text-xs font-bold tracking-wider uppercase">Players</span>
        </div>
        <button
          onClick={() => setCollapsed(true)}
          className="text-white/40 hover:text-white text-xs"
          title="Collapse"
        >
          ✕
        </button>
      </div>

      {/* Tabs */}
      <div className="flex bg-white/5 m-2 rounded-lg p-1">
        <button
          onClick={() => setTab('world')}
          className={`flex-1 py-1 text-[10px] font-bold rounded-md transition-colors flex items-center justify-center gap-1 ${
            tab === 'world' ? 'bg-cyan-500/20 text-cyan-300' : 'text-white/50 hover:text-white'
          }`}
        >
          <Users className="w-3 h-3" />
          World ({worldPlayers.length})
        </button>
        <button
          onClick={() => setTab('global')}
          className={`flex-1 py-1 text-[10px] font-bold rounded-md transition-colors flex items-center justify-center gap-1 ${
            tab === 'global' ? 'bg-purple-500/20 text-purple-300' : 'text-white/50 hover:text-white'
          }`}
        >
          <Globe className="w-3 h-3" />
          Global ({globalUsers.length})
        </button>
        <button
          onClick={() => setTab('boss')}
          className={`flex-1 py-1 text-[10px] font-bold rounded-md transition-colors flex items-center justify-center gap-1 ${
            tab === 'boss' ? 'bg-red-500/20 text-red-300' : 'text-white/50 hover:text-white'
          }`}
        >
          <Skull className="w-3 h-3" />
          Boss ({bosses.filter((b) => b.alive).length})
        </button>
      </div>

      {/* List */}
      <div className="max-h-56 overflow-y-auto px-2 pb-2 space-y-1">
        {tab !== 'boss' && count === 0 && (
          <div className="text-[11px] text-white/40 text-center py-4">
            {tab === 'world' ? 'No other players in your world yet.' : 'No other players online.'}
          </div>
        )}
        {tab !== 'boss' && list.map((p) => (
          <div
            key={p.id}
            className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-white/5 transition-colors"
          >
            <div className="relative w-7 h-7 rounded-full bg-white/10 overflow-hidden flex items-center justify-center text-[11px] font-bold text-white/80">
              {p.avatar ? (
                <img src={p.avatar} alt={p.name} className="w-full h-full object-cover" />
              ) : (
                p.name.charAt(0).toUpperCase()
              )}
              <Circle className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 fill-green-500 text-green-500 stroke-[3px] stroke-black" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[12px] text-white/90 truncate font-medium">{p.name}</p>
              {tab === 'global' && (
                <p className="text-[10px] text-white/40 truncate">{p.where}</p>
              )}
            </div>
          </div>
        ))}

        {/* Boss tab — click any boss to pin its waypoint */}
        {tab === 'boss' && bosses.length === 0 && (
          <div className="text-[11px] text-white/40 text-center py-4">No bosses spawned.</div>
        )}
        {tab === 'boss' && bosses.map((b) => {
          const isTracked = trackedBossId === b.id;
          return (
            <button
              key={b.id}
              onClick={() => setTrackedBoss(isTracked ? null : b.id)}
              disabled={!b.alive}
              className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md transition-colors text-left ${
                !b.alive ? 'opacity-40' : isTracked ? 'bg-red-500/15 border border-red-400/40' : 'hover:bg-white/5 border border-transparent'
              }`}
              title={b.alive ? 'Click to track this boss' : 'Defeated'}
            >
              <div className="relative w-7 h-7 rounded-full bg-red-500/15 border border-red-400/30 flex items-center justify-center">
                <Skull className="w-3.5 h-3.5 text-red-300" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[12px] text-white/90 truncate font-bold">{b.name}</p>
                <div className="flex items-center gap-1.5">
                  <div className="flex-1 h-1 rounded-full bg-black/40 overflow-hidden">
                    <div
                      className="h-full bg-red-500 transition-all"
                      style={{ width: `${b.maxHp ? Math.max(0, (b.hp / b.maxHp) * 100) : 0}%` }}
                    />
                  </div>
                  <span className="text-[9px] text-white/50 tabular-nums">{Math.max(0, Math.round(b.hp))}</span>
                </div>
              </div>
              {b.alive && (
                <Crosshair className={`w-3.5 h-3.5 ${isTracked ? 'text-red-300' : 'text-white/40'}`} />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
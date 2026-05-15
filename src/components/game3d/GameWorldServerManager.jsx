import React, { useEffect, useState, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/components/auth/AuthContext';
import { Users, Wifi, WifiOff } from 'lucide-react';
import toast from 'react-hot-toast';

// One shared world server. Every player joins this single channel.
const WORLD_CHANNEL = 'game_world_main';
const MAX_PLAYERS = 20;
// A player is considered "online" if they've sent a heartbeat in this window.
const ONLINE_WINDOW_MS = 15000;
// How often we re-check the cap & sync the live online count.
const POLL_MS = 4000;

/**
 * GameWorldServerManager
 *
 * Manages the single shared "game_world_main" server:
 *  - Enforces a 20-player cap (blocks new joiners if the server is full)
 *  - Polls PlayerState in the world channel to compute live online count
 *  - Renders a small HUD widget showing the connection status and capacity
 *  - Bridges to the existing MultiplayerSystem for the actual presence sync
 */
export default function GameWorldServerManager() {
  const { user } = useAuth();
  const [status, setStatus] = useState('connecting'); // connecting | connected | full | error
  const [onlineCount, setOnlineCount] = useState(0);
  const joinedRef = useRef(false);

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;

    const checkAndJoin = async () => {
      try {
        const all = await base44.entities.PlayerState.filter({ channel_id: WORLD_CHANNEL });
        const now = Date.now();
        const live = (all || []).filter(
          (p) => p.player_id !== user.id && now - (p.last_update || 0) < ONLINE_WINDOW_MS,
        );
        const liveCount = live.length;
        if (cancelled) return;

        // Capacity check — block if full (and we're not already in the world)
        if (!joinedRef.current && liveCount >= MAX_PLAYERS) {
          setStatus('full');
          setOnlineCount(liveCount);
          return;
        }

        // Join the channel via the existing MultiplayerSystem event
        if (!joinedRef.current) {
          window.dispatchEvent(new CustomEvent('joinMultiplayerChannel', {
            detail: { channelId: WORLD_CHANNEL, hostId: WORLD_CHANNEL },
          }));
          joinedRef.current = true;
          setStatus('connected');
          toast.success(`Connected to world server (${liveCount + 1}/${MAX_PLAYERS})`, {
            id: 'world-join', duration: 2500,
          });
        }
        // +1 to include ourselves in the count once joined
        setOnlineCount(joinedRef.current ? liveCount + 1 : liveCount);
      } catch (err) {
        if (cancelled) return;
        console.error('[GameWorldServer] poll error:', err);
        setStatus('error');
      }
    };

    checkAndJoin();
    const interval = setInterval(checkAndJoin, POLL_MS);
    return () => { cancelled = true; clearInterval(interval); };
  }, [user?.id]);

  // Status pill — bottom-left, liquid-glass style
  const statusConfig = {
    connecting: { color: 'text-amber-300', bg: 'bg-amber-500/10', border: 'border-amber-400/30', label: 'Connecting...' },
    connected: { color: 'text-emerald-300', bg: 'bg-emerald-500/10', border: 'border-emerald-400/30', label: 'Online' },
    full: { color: 'text-red-300', bg: 'bg-red-500/10', border: 'border-red-400/30', label: 'Server Full' },
    error: { color: 'text-red-300', bg: 'bg-red-500/10', border: 'border-red-400/30', label: 'Connection Error' },
  };
  const cfg = statusConfig[status];
  const Icon = status === 'connected' ? Wifi : WifiOff;

  return (
    <div
      className="fixed bottom-4 left-4 z-40 pointer-events-none flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium tracking-wide backdrop-blur-md"
      style={{
        background: 'rgba(10, 14, 20, 0.6)',
        border: `1px solid ${cfg.border.replace('border-', '').replace('/30', '')}`,
      }}
    >
      <Icon className={`w-3.5 h-3.5 ${cfg.color}`} />
      <span className={cfg.color}>{cfg.label}</span>
      <span className="text-white/30">·</span>
      <Users className="w-3 h-3 text-white/60" />
      <span className="text-white/80 font-mono">{onlineCount}/{MAX_PLAYERS}</span>
      {status === 'full' && (
        <span className="text-red-300/80 ml-1">(Try again soon)</span>
      )}
    </div>
  );
}
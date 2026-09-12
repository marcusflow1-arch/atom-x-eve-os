import React, { useEffect, useState } from 'react';
import { Home, MessageSquare, Shield } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/components/auth/AuthContext';
import ClanChatOverlay from '@/components/clan/ClanChatOverlay';

export default function ClanBottomNav({ activeTab, onTabSelect, isStrongholdEnabled, isPrivileged }) {
  const { user } = useAuth();
  const [chatOpen, setChatOpen] = useState(false);
  const [clan, setClan] = useState(null);
  const [role, setRole] = useState(null);

  useEffect(() => {
    let cancelled = false;
    if (!user?.id) return;
    (async () => {
      try {
        const res = await base44.functions.invoke('clanSystem', { action: 'resolve_entry' });
        const payload = res?.data || res;
        if (cancelled || payload?.state !== 'clan' || !payload?.clanId) return;
        const [division, memberships] = await Promise.all([
          base44.entities.Division.get(payload.clanId),
          base44.entities.ClanMember.filter({ clan_id: payload.clanId, user_id: user.id }),
        ]);
        if (!cancelled) {
          setClan(division || null);
          setRole(memberships?.[0]?.role || 'member');
        }
      } catch (error) {
        console.warn('Could not prepare clan communications overlay', error);
      }
    })();
    return () => { cancelled = true; };
  }, [user?.id]);

  return (
    <>
      <div className="flex items-center justify-center w-full h-full">
        <div className="flex items-center">
          <button
            onClick={() => setChatOpen(true)}
            className="relative px-6 py-2 flex items-center gap-2 text-sm font-medium tracking-wide uppercase transition-all duration-300 mx-1 text-white/60 hover:text-emerald-300 hover:drop-shadow-[0_0_8px_rgba(52,211,153,0.45)]"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Clan Chat</span>
          </button>

          <div className="w-px h-5 bg-white/10 mx-2" />

          <button
            onClick={() => onTabSelect('games_chat')}
            className={`relative px-6 py-2 flex items-center gap-2 text-sm font-medium tracking-wide uppercase transition-all duration-300 mx-1 ${
              activeTab === 'games_chat'
                ? 'text-purple-300 drop-shadow-[0_0_10px_rgba(192,132,252,0.55)]'
                : 'text-white/60 hover:text-white'
            }`}
          >
            {activeTab === 'games_chat' && <div className="absolute inset-0 bg-purple-300/10 blur-md rounded-full -z-10 pointer-events-none" />}
            <MessageSquare className="w-4 h-4" />
            <span>GAME Chats</span>
          </button>

          <div className="w-px h-5 bg-white/10 mx-2" />

          <button
            onClick={() => onTabSelect('home')}
            className={`relative px-6 py-2 flex items-center gap-2 text-sm font-medium tracking-wide uppercase transition-all duration-300 mx-1 ${
              activeTab === 'home'
                ? 'text-cyan-300 drop-shadow-[0_0_10px_rgba(34,211,238,0.5)]'
                : 'text-white/60 hover:text-white'
            }`}
          >
            {activeTab === 'home' && <div className="absolute inset-0 bg-cyan-300/10 blur-md rounded-full -z-10 pointer-events-none" />}
            <Home className="w-4 h-4" />
            <span>{isStrongholdEnabled ? 'Stronghold' : 'Homepage'}</span>
          </button>

          {isPrivileged && (
            <>
              <div className="w-px h-5 bg-white/10 mx-2" />
              <button
                onClick={() => onTabSelect('admin_overview')}
                className={`relative px-6 py-2 flex items-center gap-2 text-sm font-medium tracking-wide uppercase transition-all duration-300 mx-1 ${
                  activeTab === 'admin_overview' ? 'text-amber-200' : 'text-white/60 hover:text-white'
                }`}
              >
                <Shield className="w-4 h-4" />
                <span>Clan Admin</span>
              </button>
            </>
          )}
        </div>
      </div>
      <ClanChatOverlay open={chatOpen} onClose={() => setChatOpen(false)} clan={clan} myRole={role} />
    </>
  );
}

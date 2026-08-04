import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, UserPlus, Check, Clock, Shield, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/components/auth/AuthContext';
import { glassCard } from './SectionShell';

// Drill-down player profile — shown when clicking a player anywhere in the focus hub.
// Add Friend is wired to the real FriendRequest backend (feeds FriendRequestsPanel / Friend list).
export default function PlayerProfilePanel({ player, onClose }) {
  const { user } = useAuth();
  const [relation, setRelation] = useState('loading'); // loading | self | friends | pending | none | sending

  useEffect(() => {
    let cancelled = false;
    const check = async () => {
      if (!user?.id || !player?.id) return;
      if (user.id === player.id) { setRelation('self'); return; }
      const [friends, reqs] = await Promise.all([
        base44.entities.Friend.filter({ user_id: user.id, friend_id: player.id }),
        base44.entities.FriendRequest.filter({ sender_id: user.id, receiver_id: player.id, status: 'pending' }),
      ]);
      if (cancelled) return;
      setRelation(friends.length > 0 ? 'friends' : reqs.length > 0 ? 'pending' : 'none');
    };
    setRelation('loading');
    check();
    return () => { cancelled = true; };
  }, [user?.id, player?.id]);

  const sendFriendRequest = async () => {
    setRelation('sending');
    await base44.entities.FriendRequest.create({
      sender_id: user.id,
      sender_name: user.username || user.full_name || 'Player',
      sender_avatar: user.avatar_url || '',
      receiver_id: player.id,
      status: 'pending',
      message: 'Sent from the Atom X Eve Focus Hub',
    });
    setRelation('pending');
  };

  if (!player) return null;

  return (
    <motion.div
      initial={{ x: 60, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 60, opacity: 0 }}
      transition={{ type: 'spring', damping: 26, stiffness: 240 }}
      className="absolute right-0 top-0 bottom-0 w-[360px] z-20 flex flex-col p-6"
      style={{ ...glassCard('rgba(34,211,238,0.30)'), borderRadius: '16px 0 0 16px', background: 'rgba(10,15,24,0.88)' }}
    >
      <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/5 hover:bg-white/15 border border-white/10 flex items-center justify-center text-white/60 hover:text-white transition-all">
        <X className="w-4 h-4" />
      </button>

      {/* Identity */}
      <div className="flex flex-col items-center mt-4">
        <div className="w-24 h-24 rounded-full overflow-hidden ring-2 ring-cyan-400/40 bg-slate-800 flex items-center justify-center">
          {player.avatar
            ? <img src={player.avatar} alt={player.name} className="w-full h-full object-cover" />
            : <span className="text-3xl font-black text-white/60">{(player.name || '?').charAt(0).toUpperCase()}</span>}
        </div>
        <h3 className="text-white font-bold text-lg mt-3 tracking-wide">{player.name}</h3>
        {player.subtitle && <p className="text-white/40 text-xs mt-0.5">{player.subtitle}</p>}
      </div>

      {/* Progression */}
      <div className="mt-6 rounded-xl p-4" style={glassCard()}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-white/40 text-[10px] font-bold uppercase tracking-widest">Global Level</span>
          <span className="text-cyan-300 font-black text-xl">{player.level ?? 1}</span>
        </div>
        <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
          <div className="h-full bg-gradient-to-r from-cyan-500 to-blue-400" style={{ width: `${Math.min(100, ((player.xp ?? 0) % 1000) / 10)}%` }} />
        </div>
        <p className="text-white/30 text-[10px] mt-1.5 text-right">{(player.xp ?? 0).toLocaleString()} XP</p>
      </div>

      {/* Top genres if available */}
      {player.genres?.length > 0 && (
        <div className="mt-4 rounded-xl p-4" style={glassCard()}>
          <span className="text-white/40 text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 mb-3"><Shield className="w-3 h-3" /> Top Genres</span>
          <div className="space-y-2">
            {[...player.genres].sort((a, b) => (b.level || 0) - (a.level || 0)).slice(0, 3).map((g) => (
              <div key={g.name} className="flex items-center justify-between text-xs">
                <span className="text-white/70">{g.name}</span>
                <span className="text-purple-300 font-bold">Lv. {g.level || 1}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex-1" />

      {/* Friend action — real backend, ties into the friends system */}
      {relation === 'loading' && (
        <div className="flex justify-center py-3"><Loader2 className="w-5 h-5 text-white/40 animate-spin" /></div>
      )}
      {relation === 'none' && (
        <button onClick={sendFriendRequest} className="w-full py-3 rounded-xl font-bold text-sm uppercase tracking-wider text-white bg-cyan-500/20 hover:bg-cyan-500/35 border border-cyan-400/40 transition-all flex items-center justify-center gap-2">
          <UserPlus className="w-4 h-4" /> Add Friend
        </button>
      )}
      {relation === 'sending' && (
        <button disabled className="w-full py-3 rounded-xl font-bold text-sm uppercase tracking-wider text-white/60 bg-white/5 border border-white/10 flex items-center justify-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" /> Sending...
        </button>
      )}
      {relation === 'pending' && (
        <div className="w-full py-3 rounded-xl font-bold text-sm uppercase tracking-wider text-yellow-300/90 bg-yellow-500/10 border border-yellow-400/30 flex items-center justify-center gap-2">
          <Clock className="w-4 h-4" /> Request Sent
        </div>
      )}
      {relation === 'friends' && (
        <div className="w-full py-3 rounded-xl font-bold text-sm uppercase tracking-wider text-green-300/90 bg-green-500/10 border border-green-400/30 flex items-center justify-center gap-2">
          <Check className="w-4 h-4" /> Friends
        </div>
      )}
      {relation === 'self' && (
        <div className="w-full py-3 rounded-xl font-bold text-sm uppercase tracking-wider text-white/40 bg-white/5 border border-white/10 text-center">
          This is you
        </div>
      )}
    </motion.div>
  );
}
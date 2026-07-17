import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, UserPlus, Gamepad2, Trophy, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/components/auth/AuthContext';

const RARITY_BORDER = {
  Common: 'border-slate-400/40',
  Uncommon: 'border-green-400/40',
  Rare: 'border-blue-400/50',
  Epic: 'border-purple-400/50',
  Legendary: 'border-amber-400/60',
  Mythic: 'border-red-400/60',
  Unique: 'border-cyan-400/60',
};

const SLOTS = 5;

export default function FriendHighlightsSlideshow() {
  const { user } = useAuth();
  const [friends, setFriends] = useState([]);
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [friendCards, setFriendCards] = useState([]);
  const [loadingCards, setLoadingCards] = useState(false);
  const [loadingFriends, setLoadingFriends] = useState(true);

  // Fetch friends list
  useEffect(() => {
    if (!user?.id) { setLoadingFriends(false); return; }
    let cancelled = false;
    (async () => {
      try {
        const res = await base44.entities.Friend.filter({ user_id: user.id });
        if (cancelled) return;
        setFriends(Array.isArray(res) ? res : (res?.data || []));
      } catch (e) {
        console.error('Friend fetch error', e);
      } finally {
        if (!cancelled) setLoadingFriends(false);
      }
    })();
    return () => { cancelled = true; };
  }, [user?.id]);

  // Fetch selected friend's recent card unlocks
  useEffect(() => {
    if (!selectedFriend?.friend_id) return;
    let cancelled = false;
    setLoadingCards(true);
    (async () => {
      try {
        const res = await base44.entities.UserCard.filter({ user_id: selectedFriend.friend_id });
        if (cancelled) return;
        const cards = (Array.isArray(res) ? res : (res?.data || []))
          .sort((a, b) => new Date(b.unlocked_date || b.created_date) - new Date(a.unlocked_date || a.created_date))
          .slice(0, 5);
        setFriendCards(cards);
      } catch (e) {
        console.error('Friend cards fetch error', e);
        setFriendCards([]);
      } finally {
        if (!cancelled) setLoadingCards(false);
      }
    })();
    return () => { cancelled = true; };
  }, [selectedFriend?.friend_id]);

  const slots = Array.from({ length: SLOTS }, (_, i) => friends[i] || null);
  const onlineCount = friends.filter(f => f.status === 'online').length;

  return (
    <div className="mb-2">
      {/* Friend selector boxes */}
      <div className="grid grid-cols-5 gap-2 mb-2">
        {slots.map((friend, idx) => {
          const isSelected = friend && selectedFriend?.id === friend.id;
          return (
            <button
              key={friend?.id || `slot-${idx}`}
              onClick={() => friend && setSelectedFriend(isSelected ? null : friend)}
              disabled={!friend}
              className={`relative rounded-xl border overflow-hidden transition-all flex-shrink-0 ${
                friend
                  ? isSelected
                    ? 'border-cyan-400/50 shadow-[0_0_12px_rgba(34,211,238,0.2)]'
                    : 'border-white/10 hover:border-white/25'
                  : 'border-dashed border-white/8 cursor-default'
              }`}
              style={{ height: '72px', background: friend ? 'rgba(255,255,255,0.04)' : 'transparent' }}
            >
              {friend ? (
                <>
                  {friend.friend_avatar ? (
                    <img src={friend.friend_avatar} alt={friend.friend_name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <User className="w-5 h-5 text-white/30" />
                    </div>
                  )}
                  {friend.status === 'online' && (
                    <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-green-500 border border-black/40" />
                  )}
                  <div className="absolute bottom-0 left-0 right-0 px-1 py-0.5 bg-gradient-to-t from-black/85 to-transparent">
                    <p className="text-white text-[8px] font-semibold truncate text-center leading-tight">{friend.friend_name}</p>
                  </div>
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <UserPlus className="w-5 h-5 text-white/12" />
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Highlights panel */}
      <div className="rounded-xl overflow-hidden border border-white/8"
        style={{ height: '130px', background: 'rgba(255,255,255,0.02)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}>
        <AnimatePresence mode="wait">
          {selectedFriend ? (
            <motion.div
              key={selectedFriend.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex h-full"
            >
              {/* Left — friend avatar */}
              <div className="relative flex-shrink-0 flex items-center justify-center" style={{ width: '90px' }}>
                <div className="absolute inset-0"
                  style={{ background: 'radial-gradient(circle at 50% 55%, rgba(99,102,241,0.10) 0%, transparent 70%)' }} />
                <div className="relative flex flex-col items-center gap-1">
                  <div className="w-11 h-11 rounded-full border border-white/15 overflow-hidden flex items-center justify-center"
                    style={{ background: 'rgba(255,255,255,0.04)' }}>
                    {selectedFriend.friend_avatar ? (
                      <img src={selectedFriend.friend_avatar} alt={selectedFriend.friend_name} className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-5 h-5 text-white/30" />
                    )}
                  </div>
                  <p className="text-white/70 text-[9px] font-medium text-center truncate max-w-[80px]">{selectedFriend.friend_name}</p>
                </div>
              </div>

              {/* Divider */}
              <div className="flex items-center justify-center flex-shrink-0">
                <div className="w-px bg-white/10" style={{ height: '60%' }} />
              </div>

              {/* Right — recent activity */}
              <div className="flex-1 flex flex-col justify-center px-3 min-w-0">
                {loadingCards ? (
                  <div className="flex items-center gap-2 text-white/40">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span className="text-[10px]">Loading highlights…</span>
                  </div>
                ) : friendCards.length > 0 ? (
                  <>
                    <p className="text-white/40 text-[8px] uppercase tracking-wide font-bold mb-1.5 flex items-center gap-1">
                      <Trophy className="w-2.5 h-2.5" /> Recent Unlocks
                    </p>
                    <div className="flex gap-1.5">
                      {friendCards.map((card) => (
                        <div key={card.id}
                          className={`flex-shrink-0 w-11 h-14 rounded-md border overflow-hidden ${RARITY_BORDER[card.card_rarity] || RARITY_BORDER.Common}`}
                          style={{ background: 'rgba(255,255,255,0.03)' }}>
                          {card.card_image ? (
                            <img src={card.card_image} alt={card.card_name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Gamepad2 className="w-3 h-3 text-white/20" />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="text-white/30 text-[10px] flex items-center gap-1.5">
                    {selectedFriend.current_game ? (
                      <>
                        <Gamepad2 className="w-3 h-3 text-blue-400" />
                        <span>Playing <span className="text-blue-300">{selectedFriend.current_game}</span></span>
                      </>
                    ) : (
                      <span>No recent activity</span>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex h-full items-center justify-center px-4"
            >
              <p className="text-white/30 text-[10px] text-center leading-relaxed">
                {loadingFriends
                  ? 'Loading friends…'
                  : onlineCount > 0
                    ? 'Click a friend above to see what they\'ve been up to'
                    : friends.length > 0
                      ? 'Your friends are offline — check back later'
                      : 'Add friends to see their highlights here'}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
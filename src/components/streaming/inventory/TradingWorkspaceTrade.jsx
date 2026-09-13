import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeftRight, CheckCircle2, Lock, UserRound } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/components/auth/AuthContext';

const dataOf = (response) => response?.data || response || {};

export default function TradingWorkspaceTrade({ item, owned }) {
  const { user } = useAuth();
  const [friends, setFriends] = useState([]);
  const [busyId, setBusyId] = useState(null);
  const [sentTo, setSentTo] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    (async () => {
      try {
        const rows = await base44.entities.Friend.filter({ user_id: user.id }, '-favorite', 250);
        if (!cancelled) setFriends((rows || []).map((row) => ({ id: row.friend_id, name: row.friend_name || 'Friend', avatar: row.friend_avatar || '', status: row.status || 'offline' })));
      } catch (e) {
        if (!cancelled) setError(e?.message || 'Friends could not be loaded.');
      }
    })();
    return () => { cancelled = true; };
  }, [user?.id]);

  const blocked = !owned || item?.isEquipped || item?.tradeStatus === 'locked_in_trade';
  const requestTrade = async (friend) => {
    if (blocked) return;
    setBusyId(friend.id); setError(''); setSentTo('');
    try {
      const response = await base44.functions.invoke('friendCardTrade', { action: 'start', payload: { partnerId: friend.id } });
      const data = dataOf(response);
      if (data.error) throw new Error(data.error);
      if (data.session?.status === 'accepted') {
        await base44.functions.invoke('friendCardTrade', { action: 'syncOffer', payload: { partnerId: friend.id, cardIds: [item.userCardId] } });
      }
      setSentTo(friend.name);
    } catch (e) { setError(e?.message || 'Trade request failed.'); }
    finally { setBusyId(null); }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="mx-auto w-full max-w-3xl p-7">
      <div className="mb-5 flex items-center gap-3 border-b border-white/[0.055] pb-4"><ArrowLeftRight className="h-4 w-4 text-cyan-100/55" /><div><p className="text-[8px] font-bold uppercase tracking-[.2em] text-white/25">Friends</p><h3 className="mt-1 text-sm font-semibold text-white/78">Trade this card with a friend</h3></div></div>
      {blocked && <div className="mb-4 flex items-start gap-2 bg-amber-100/[0.035] p-3 text-[10px] text-amber-50/55 ring-1 ring-amber-100/[0.08]"><Lock className="mt-0.5 h-3.5 w-3.5" />{item?.isEquipped ? 'Unequip this card before trading it.' : 'This card is already reserved by a market listing or another trade.'}</div>}
      {error && <div className="mb-4 border-l border-red-200/30 bg-red-200/[0.025] px-3 py-2 text-[10px] text-red-100/65">{error}</div>}
      {sentTo && <div className="mb-4 flex items-center gap-2 bg-emerald-200/[0.035] px-3 py-2 text-[10px] text-emerald-100/65 ring-1 ring-emerald-100/[0.07]"><CheckCircle2 className="h-3.5 w-3.5" />Trade request ready with {sentTo}. Open Friends to continue the live exchange.</div>}
      <div className="divide-y divide-white/[0.045] border-y border-white/[0.045]">
        {friends.length ? friends.map((friend) => <div key={friend.id} className="flex items-center gap-3 py-3"><div className="grid h-8 w-8 place-items-center overflow-hidden bg-white/[0.035] ring-1 ring-white/[0.06]">{friend.avatar ? <img src={friend.avatar} alt="" className="h-full w-full object-cover" /> : <UserRound className="h-3.5 w-3.5 text-white/25" />}</div><div className="min-w-0 flex-1"><p className="truncate text-xs font-medium text-white/68">{friend.name}</p><p className="mt-0.5 text-[8px] uppercase tracking-[.12em] text-white/22">{friend.status}</p></div><button disabled={blocked || busyId === friend.id} onClick={() => requestTrade(friend)} className="h-8 bg-white/[0.04] px-3 text-[8px] font-bold uppercase tracking-[.12em] text-white/48 ring-1 ring-white/[0.06] transition hover:bg-cyan-100/[0.07] hover:text-cyan-50/70 disabled:opacity-25">{busyId === friend.id ? 'Sending…' : 'Trade'}</button></div>) : <div className="py-12 text-center text-[10px] text-white/24">No friends are available in your Friends list.</div>}
      </div>
      <p className="mt-4 text-[10px] leading-5 text-white/24">The selected card is not duplicated. Friend trading, Inventory and the Trading Post all reference the same owned UserCard record.</p>
    </motion.div>
  );
}

import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Swords, Trophy, Skull } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const DUEL_MAX_HP = 100;
const DUEL_DAMAGE = 10;       // damage per middle-click on opponent
const DUEL_RANGE = 6;         // max distance in world units for a hit to land

/**
 * DuelSystem — global handler for the active duel between two players.
 *
 * - Listens to DuelSession entity changes for the local user.
 * - Renders a red ring under both duelers via dispatching `duelMarker` events
 *   that GameWorld3D picks up (renders the red circle in-world).
 * - On middle-click of the opponent within range, applies damage by updating
 *   the DuelSession row. Win/lose screen shows when status flips to finished.
 */
export default function DuelSystem({ userId }) {
  const [duel, setDuel] = useState(null); // active DuelSession row
  const [result, setResult] = useState(null); // { won: bool, opponentName }
  const duelRef = useRef(null);

  // Hydrate + subscribe to duels involving me
  useEffect(() => {
    if (!userId) return;
    let cancelled = false;

    const refresh = async () => {
      try {
        const [asA, asB] = await Promise.all([
          base44.entities.DuelSession.filter({ challenger_id: userId, status: 'active' }),
          base44.entities.DuelSession.filter({ opponent_id: userId, status: 'active' }),
        ]);
        if (cancelled) return;
        const active = [...(asA || []), ...(asB || [])][0] || null;
        setDuel(active);
        duelRef.current = active;
      } catch (e) { console.warn('[Duel] refresh', e); }
    };

    refresh();
    const unsub = base44.entities.DuelSession.subscribe((event) => {
      const d = event.data;
      if (!d) return;
      if (d.challenger_id !== userId && d.opponent_id !== userId) return;

      if (d.status === 'finished') {
        // Show win/lose screen + dismiss the duel
        if (d.winner_id === userId) {
          setResult({ won: true, opponentName: d.winner_id === d.challenger_id ? d.opponent_name : d.challenger_name });
        } else if (d.loser_id === userId) {
          setResult({ won: false, opponentName: d.winner_id === d.challenger_id ? d.challenger_name : d.opponent_name });
        }
        setDuel(null);
        duelRef.current = null;
      } else if (d.status === 'active') {
        setDuel(d);
        duelRef.current = d;
      }
    });
    return () => { cancelled = true; unsub && unsub(); };
  }, [userId]);

  // Broadcast the duel pair so GameWorld3D can draw red circles under both players.
  // Also expose the active duel to middleClickHandler via a global flag.
  useEffect(() => {
    if (duel && userId) {
      const opponentId = duel.challenger_id === userId ? duel.opponent_id : duel.challenger_id;
      window.__activeDuel = { duelId: duel.id, opponentId };
    } else {
      window.__activeDuel = null;
    }
    window.dispatchEvent(new CustomEvent('duelMarker', {
      detail: duel ? {
        active: true,
        challengerId: duel.challenger_id,
        opponentId: duel.opponent_id,
      } : { active: false },
    }));
  }, [duel?.id, duel?.challenger_id, duel?.opponent_id, userId]);

  // Handle middle-click damage: a player-target middle-click while duel is active
  // dispatches `duelAttack` from the middleClickHandler. We apply damage here.
  useEffect(() => {
    if (!userId) return;
    const onDuelAttack = async (e) => {
      const targetId = e.detail?.targetPlayerId;
      const distance = e.detail?.distance ?? 0;
      const d = duelRef.current;
      if (!d || !targetId) return;
      if (distance > DUEL_RANGE) return;

      // Verify target is the other duelist
      const otherId = d.challenger_id === userId ? d.opponent_id : d.challenger_id;
      if (targetId !== otherId) return;

      // Apply damage to the right column
      const isOpponent = otherId === d.opponent_id;
      const newHP = Math.max(0, (isOpponent ? d.opponent_hp : d.challenger_hp) - DUEL_DAMAGE);
      const patch = isOpponent ? { opponent_hp: newHP } : { challenger_hp: newHP };

      if (newHP <= 0) {
        patch.status = 'finished';
        patch.winner_id = userId;
        patch.loser_id = otherId;
      }
      try {
        await base44.entities.DuelSession.update(d.id, patch);
      } catch (err) { console.warn('[Duel] damage update failed', err); }
    };
    window.addEventListener('duelAttack', onDuelAttack);
    return () => window.removeEventListener('duelAttack', onDuelAttack);
  }, [userId]);

  const myHP = duel ? (duel.challenger_id === userId ? duel.challenger_hp : duel.opponent_hp) : 0;
  const theirHP = duel ? (duel.challenger_id === userId ? duel.opponent_hp : duel.challenger_hp) : 0;
  const theirName = duel ? (duel.challenger_id === userId ? duel.opponent_name : duel.challenger_name) : '';

  return (
    <>
      {/* Active duel HUD */}
      <AnimatePresence>
        {duel && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-24 left-1/2 -translate-x-1/2 z-[60] flex items-center gap-6 px-6 py-3 rounded-2xl pointer-events-none"
            style={{
              background: 'rgba(20, 8, 8, 0.85)',
              backdropFilter: 'blur(18px) saturate(160%)',
              border: '1px solid rgba(239, 68, 68, 0.5)',
              boxShadow: '0 8px 28px rgba(0,0,0,0.6), 0 0 24px rgba(239, 68, 68, 0.25)',
            }}
          >
            <div className="flex items-center gap-2">
              <Swords className="w-5 h-5 text-red-300" />
              <span className="text-xs uppercase tracking-[0.25em] font-bold text-red-200">Duel</span>
            </div>
            <HPBar label="You" hp={myHP} maxHp={duel.max_hp || DUEL_MAX_HP} color="#22d3ee" />
            <div className="text-red-300 text-xs font-mono">VS</div>
            <HPBar label={theirName || 'Opponent'} hp={theirHP} maxHp={duel.max_hp || DUEL_MAX_HP} color="#ef4444" />
            <div className="text-[10px] text-white/50 font-mono ml-2">Mid-click to strike</div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Win / Lose screen */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 backdrop-blur-md"
            onClick={() => setResult(null)}
          >
            <motion.div
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="px-12 py-8 rounded-3xl text-center"
              style={{
                background: result.won
                  ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.25), rgba(20, 30, 40, 0.95))'
                  : 'linear-gradient(135deg, rgba(239, 68, 68, 0.25), rgba(20, 12, 14, 0.95))',
                border: `1px solid ${result.won ? 'rgba(16, 185, 129, 0.6)' : 'rgba(239, 68, 68, 0.6)'}`,
                boxShadow: result.won
                  ? '0 16px 60px rgba(16, 185, 129, 0.4)'
                  : '0 16px 60px rgba(239, 68, 68, 0.4)',
              }}
            >
              {result.won ? (
                <Trophy className="w-20 h-20 mx-auto text-emerald-300 mb-3" />
              ) : (
                <Skull className="w-20 h-20 mx-auto text-red-300 mb-3" />
              )}
              <div className="text-5xl font-black tracking-wider mb-2"
                   style={{ color: result.won ? '#6ee7b7' : '#fca5a5' }}>
                {result.won ? 'YOU WON' : 'YOU WERE DEFEATED'}
              </div>
              <div className="text-white/70 text-sm">
                {result.won ? 'You defeated' : 'Defeated by'}{' '}
                <span className="font-bold text-white">{result.opponentName}</span>
              </div>
              <button
                onClick={() => setResult(null)}
                className="mt-6 px-6 py-2 rounded-full text-sm font-bold tracking-wider uppercase text-white/80 hover:text-white border border-white/20 hover:bg-white/10 transition-all"
              >
                Continue
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function HPBar({ label, hp, maxHp, color }) {
  const pct = Math.max(0, Math.min(1, hp / maxHp));
  return (
    <div className="flex flex-col gap-1 w-40">
      <div className="flex items-center justify-between text-[10px] font-mono">
        <span className="text-white/70 truncate">{label}</span>
        <span style={{ color }}>{Math.ceil(hp)}/{maxHp}</span>
      </div>
      <div className="h-2 rounded-full bg-white/10 overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ background: color }}
          animate={{ width: `${pct * 100}%` }}
          transition={{ duration: 0.2 }}
        />
      </div>
    </div>
  );
}
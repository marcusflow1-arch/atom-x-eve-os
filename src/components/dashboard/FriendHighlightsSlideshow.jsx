import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Heart, Shield, Sparkles, Loader2, Sword, Star, TrendingUp } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/components/auth/AuthContext';

const MOOD_LABELS = {
  joyful: 'Joyful', content: 'Content', neutral: 'Neutral',
  melancholic: 'Melancholic', irritable: 'Irritable', aggressive: 'Aggressive',
  contemplative: 'Contemplative', energetic: 'Energetic', tired: 'Tired', curious: 'Curious',
};

const TRAIT_KEYS = ['loyalty', 'curiosity', 'caution', 'humor', 'wisdom', 'impulsiveness'];

const STAT_KEYS = [
  { key: 'hp', label: 'HP', icon: Heart, color: 'text-pink-400' },
  { key: 'strength', label: 'STR', icon: Sword, color: 'text-red-400' },
  { key: 'intelligence', label: 'INT', icon: Sparkles, color: 'text-purple-400' },
  { key: 'will', label: 'WILL', icon: Shield, color: 'text-blue-400' },
  { key: 'tenacity', label: 'TEN', icon: TrendingUp, color: 'text-green-400' },
];

export default function FriendHighlightsSlideshow({ selectedFriend }) {
  const { user } = useAuth();
  const targetId = selectedFriend?.id || user?.id;
  const [aiState, setAiState] = useState(null);
  const [progression, setProgression] = useState(null);
  const [recentEquipment, setRecentEquipment] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!targetId) { setLoading(false); return; }
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const [stateRes, progRes, cardsRes] = await Promise.all([
          base44.entities.AIBehaviorState.filter({ user_id: targetId }),
          base44.entities.AvatarProgression.filter({ user_id: targetId }),
          base44.entities.UserCard.filter({ user_id: targetId, card_type: 'Equipment' }),
        ]);
        if (cancelled) return;
        const states = Array.isArray(stateRes) ? stateRes : (stateRes?.data || []);
        setAiState(states[0] || null);
        const progs = Array.isArray(progRes) ? progRes : (progRes?.data || []);
        setProgression(progs[0] || null);
        const cards = (Array.isArray(cardsRes) ? cardsRes : (cardsRes?.data || []))
          .sort((a, b) => new Date(b.unlocked_date || b.created_date) - new Date(a.unlocked_date || a.created_date))
          .slice(0, 4);
        setRecentEquipment(cards);
      } catch (e) {
        console.error('AI state fetch error', e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [targetId]);

  const isFriend = !!selectedFriend;
  const displayName = isFriend ? selectedFriend.name : (user?.username || user?.full_name || 'Your');

  if (loading) {
    return (
      <div className="flex items-center gap-2 h-[200px] px-4">
        <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />
        <span className="text-white/40 text-xs">Loading {isFriend ? `${displayName}'s` : 'your'} AI companion…</span>
      </div>
    );
  }

  if (!aiState && !progression) {
    return (
      <div className="flex items-center justify-center h-[200px] px-4">
        <p className="text-white/30 text-[10px]">
          {isFriend ? 'No AI companion data found for this friend.' : 'Your AI companion is initializing…'}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col justify-center gap-2.5 rounded-xl overflow-hidden border border-white/8 px-4 py-3"
      style={{ height: '200px', background: 'rgba(255,255,255,0.02)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}>
      {/* Top row — Level + Mood + Energy + Alignment */}
      <div className="flex items-center gap-3 flex-wrap">
        {progression && (
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-cyan-500/10 border border-cyan-400/20">
            <Star className="w-3 h-3 text-cyan-400" />
            <span className="text-cyan-300 text-[10px] font-bold">Lvl {progression.global_level || 1}</span>
          </div>
        )}
        {aiState && (
          <>
            <div className="flex items-center gap-1.5">
              <Heart className="w-3 h-3 text-pink-400" />
              <span className="text-white/80 text-[10px] font-medium">
                {MOOD_LABELS[aiState.current_mood] || 'Neutral'}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Zap className="w-3 h-3 text-amber-400" />
              <span className="text-white/80 text-[10px] font-medium">
                Energy {Math.round(aiState.energy_level || 0)}%
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Shield className="w-3 h-3 text-blue-400" />
              <span className="text-white/80 text-[10px] font-medium">
                {(aiState.moral_alignment || 0) >= 0 ? 'Good' : 'Dark'} ({Math.abs(Math.round(aiState.moral_alignment || 0))})
              </span>
            </div>
          </>
        )}
      </div>

      {/* Stats + Personality side by side */}
      <div className="flex items-start gap-4">
        {/* Stats */}
        {progression?.stats && (
          <div className="flex-shrink-0">
            <p className="text-white/40 text-[8px] uppercase tracking-wide font-bold mb-1">Stats</p>
            <div className="flex gap-1.5">
              {STAT_KEYS.map(({ key, label, icon: Icon, color }) => (
                <div key={key} className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-white/5 border border-white/5">
                  <Icon className={`w-2.5 h-2.5 ${color}`} />
                  <span className="text-white/50 text-[8px]">{label}</span>
                  <span className="text-white/80 text-[8px] font-bold">{progression.stats[key] ?? 0}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Personality traits */}
        {aiState?.behavioral_traits && (
          <div className="flex-1 min-w-0">
            <p className="text-white/40 text-[8px] uppercase tracking-wide font-bold mb-1 flex items-center gap-1">
              <Sparkles className="w-2.5 h-2.5" /> Personality
            </p>
            <div className="flex flex-wrap gap-1">
              {TRAIT_KEYS.map((key) => {
                const val = aiState.behavioral_traits[key] ?? 50;
                return (
                  <div key={key} className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-white/5 border border-white/5">
                    <span className="text-white/50 text-[8px] capitalize">{key.slice(0, 3)}</span>
                    <span className="text-white/80 text-[8px] font-bold">{Math.round(val)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Recent equipment */}
      <div>
        <p className="text-white/40 text-[8px] uppercase tracking-wide font-bold mb-1 flex items-center gap-1">
          <Sword className="w-2.5 h-2.5" /> Recent Equipment
        </p>
        {recentEquipment.length > 0 ? (
          <div className="flex gap-1.5">
            {recentEquipment.map((eq) => (
              <div key={eq.id} className="w-9 h-11 rounded border border-white/10 overflow-hidden"
                style={{ background: 'rgba(255,255,255,0.03)' }}>
                {eq.card_image ? (
                  <img src={eq.card_image} alt={eq.card_name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Sword className="w-3 h-3 text-white/20" />
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-white/25 text-[9px]">No recent equipment obtained</p>
        )}
      </div>
    </div>
  );
}
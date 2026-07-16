import React, { createContext, useContext, useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/components/auth/AuthContext';

const AIPresenceContext = createContext(null);

export function useAIPresence() {
  return useContext(AIPresenceContext);
}

export function AIPresenceProvider({ children }) {
  const { user } = useAuth();
  const [mood, setMood] = useState('neutral');
  const [moodIntensity, setMoodIntensity] = useState(50);
  const [moralAlignment, setMoralAlignment] = useState(0);
  const [energyLevel, setEnergyLevel] = useState(75);
  const [thoughts, setThoughts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) { setLoading(false); return; }
    let cancelled = false;
    const load = async () => {
      try {
        const [decisions, states] = await Promise.all([
          base44.entities.AIDecisionLog.filter({ user_id: user.id }),
          base44.entities.AIBehaviorState.filter({ user_id: user.id }),
        ]);
        if (cancelled) return;
        const recent = (Array.isArray(decisions) ? decisions : decisions?.data || [])
          .filter(d => d.ai_reaction)
          .sort((a, b) => new Date(b.created_date) - new Date(a.created_date))
          .slice(0, 8);
        setThoughts(recent);
        const state = (Array.isArray(states) ? states : states?.data || [])[0];
        if (state) {
          setMood(state.current_mood || 'neutral');
          setMoodIntensity(state.mood_intensity || 50);
          setMoralAlignment(state.moral_alignment || 0);
          setEnergyLevel(state.energy_level || 75);
        }
      } catch (e) {
        console.error('AIPresence load error:', e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [user?.id]);

  return (
    <AIPresenceContext.Provider value={{ mood, moodIntensity, moralAlignment, energyLevel, thoughts, loading }}>
      {children}
    </AIPresenceContext.Provider>
  );
}
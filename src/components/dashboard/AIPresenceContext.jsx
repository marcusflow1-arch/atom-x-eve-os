import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/components/auth/AuthContext';

const AIPresenceContext = createContext(null);

export function useAIPresence() {
  return useContext(AIPresenceContext);
}

function thoughtFromExperience(experience) {
  if (!experience) return null;
  const core = experience.action || experience.context || experience.title || experience.event_type;
  if (!core) return null;
  return {
    id: `experience-${experience.id}`,
    ai_reaction: experience.is_key_memory
      ? `I am keeping this one. ${core}`
      : `I noticed this: ${core}`,
    decision_type: experience.event_type || 'experience',
    decision_context: experience.game_name || experience.outcome || '',
    created_date: experience.observed_at || experience.created_date,
  };
}

export function AIPresenceProvider({ children }) {
  const { user } = useAuth();
  const [mood, setMood] = useState('neutral');
  const [moodIntensity, setMoodIntensity] = useState(50);
  const [moralAlignment, setMoralAlignment] = useState(0);
  const [energyLevel, setEnergyLevel] = useState(75);
  const [thoughts, setThoughts] = useState([]);
  const [seed, setSeed] = useState(null);
  const [agents, setAgents] = useState([]);
  const [recentExperiences, setRecentExperiences] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user?.id) { setLoading(false); return; }
    try {
      const [mindResponse, decisions] = await Promise.all([
        base44.functions.invoke('avatarMindCore', { action: 'getMind', payload: {} }),
        base44.entities.AIDecisionLog.filter({ user_id: user.id }, '-created_date', 12),
      ]);
      const mind = mindResponse?.data || mindResponse || {};
      const behavior = mind.behavior;
      const experiences = mind.recent_experiences || [];
      if (behavior) {
        setMood(behavior.current_mood || 'neutral');
        setMoodIntensity(behavior.mood_intensity || 50);
        setMoralAlignment(behavior.moral_alignment || 0);
        setEnergyLevel(behavior.energy_level || 75);
      }
      setSeed(mind.seed || null);
      setAgents(mind.agents || []);
      setRecentExperiences(experiences);

      const decisionThoughts = (Array.isArray(decisions) ? decisions : decisions?.data || [])
        .filter((item) => item.ai_reaction)
        .map((item) => ({ ...item, created_date: item.created_date || item.updated_date }));
      const experienceThoughts = experiences.map(thoughtFromExperience).filter(Boolean);
      const merged = [...decisionThoughts, ...experienceThoughts]
        .sort((a, b) => new Date(b.created_date || 0) - new Date(a.created_date || 0))
        .slice(0, 10);
      if (!merged.length && mind.seed) {
        merged.push({
          id: 'seed-thought',
          ai_reaction: mind.seed.identity_summary || 'I am still a blank seed. I am watching, remembering, and waiting until I know enough to say who I am becoming.',
          decision_type: 'identity_seed',
          decision_context: `${mind.seed.observation_count || 0} observations`,
          created_date: new Date().toISOString(),
        });
      }
      setThoughts(merged);
    } catch (error) {
      console.error('AIPresence load error:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    if (!user?.id) return undefined;
    const onMindUpdated = () => load();
    window.addEventListener('atom:mind-updated', onMindUpdated);
    const stateUnsub = base44.entities.AIBehaviorState?.subscribe?.((event) => {
      if (event?.data?.user_id === user.id) load();
    });
    return () => {
      window.removeEventListener('atom:mind-updated', onMindUpdated);
      stateUnsub?.();
    };
  }, [user?.id, load]);

  return (
    <AIPresenceContext.Provider value={{ mood, moodIntensity, moralAlignment, energyLevel, thoughts, seed, agents, recentExperiences, loading, refresh: load }}>
      {children}
    </AIPresenceContext.Provider>
  );
}

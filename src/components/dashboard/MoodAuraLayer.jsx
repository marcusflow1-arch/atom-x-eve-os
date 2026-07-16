import React from 'react';
import { useAIPresence } from './AIPresenceContext';

const MOOD_GLOW = {
  joyful: 'rgba(251, 191, 36, 0.045)',
  content: 'rgba(52, 211, 153, 0.035)',
  neutral: 'rgba(168, 85, 247, 0.035)',
  melancholic: 'rgba(96, 165, 250, 0.035)',
  irritable: 'rgba(251, 113, 133, 0.035)',
  aggressive: 'rgba(248, 113, 113, 0.045)',
  contemplative: 'rgba(168, 85, 247, 0.035)',
  energetic: 'rgba(34, 211, 238, 0.035)',
  tired: 'rgba(148, 163, 184, 0.025)',
  curious: 'rgba(168, 85, 247, 0.035)',
};

export default function MoodAuraLayer() {
  const { mood, loading } = useAIPresence();
  if (loading) return null;
  const glow = MOOD_GLOW[mood] || MOOD_GLOW.neutral;
  return (
    <div
      className="fixed inset-0 pointer-events-none z-0"
      style={{
        background: `radial-gradient(ellipse 80% 50% at 50% 100%, ${glow} 0%, transparent 70%)`,
        transition: 'background 2s ease',
      }}
    />
  );
}
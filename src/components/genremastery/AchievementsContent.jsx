import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Gamepad2 } from 'lucide-react';
import AchievementCardGrid from './achievements/AchievementCardGrid';
import { Badge } from '@/components/ui/badge';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/components/auth/AuthContext';
import ShinyCard from '@/components/shared/ShinyCard';
import CardEnhancementOverlay from '@/components/profile/CardEnhancementOverlay';
import SkillTreeOverlay from '@/components/achievements/SkillTreeOverlay';
import BlacksmithOverlay from '@/components/achievements/BlacksmithOverlay';
import AchievementDetailOverlay from '@/components/achievements/AchievementDetailOverlay';
import { allMockGames } from '@/components/store/mockData';

export default function AchievementsContent({ genre, selectedGame, onSelectGame, games }) {
  const { user, isAuthenticated, updateUserData } = useAuth();
  const [localAchievements, setLocalAchievements] = useState({});
  const [userCards, setUserCards] = useState([]);
  const [selectedCard, setSelectedCard] = useState(null);
  const [selectedAchievement, setSelectedAchievement] = useState(null);
  const [trackedAchievements, setTrackedAchievements] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch achievements
  useEffect(() => {
    const fetchAchievements = async () => {
      setIsLoading(true);
      try {
        const achievementsResponse = await base44.entities.Achievement.list();
        const achievements = achievementsResponse.data || achievementsResponse;
        const byGame = {};
        achievements.forEach(ach => {
          if (!byGame[ach.game]) byGame[ach.game] = [];
          byGame[ach.game].push(ach);
        });
        setLocalAchievements(byGame);
        setTrackedAchievements(user?.tracked_achievements || []);
      } catch (e) {
        console.error('Failed to fetch achievements:', e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAchievements();
  }, [user]);

  // Fetch user cards when game changes
  useEffect(() => {
    const fetchUserCards = async () => {
      if (!user || !selectedGame) return;
      try {
        const cards = await base44.entities.UserCard.filter({ user_id: user.id, game_name: selectedGame.title });
        setUserCards(cards);
      } catch (e) { console.error('Failed to fetch user cards:', e); }
    };
    fetchUserCards();
  }, [user, selectedGame]);

  // Trading cards for selected game
  const tradingCards = useMemo(() => {
    if (!selectedGame || !localAchievements[selectedGame.title]) return [];
    const gameAchs = localAchievements[selectedGame.title] || [];
    const cards = [];
    gameAchs.forEach(ach => {
      if (ach.reward) {
        const userCard = userCards.find(c => c.card_name === ach.reward.name);
        const isUnlocked = user?.unlocked_achievements?.includes(ach.id);
        cards.push({
          id: ach.id,
          title: ach.reward.name || ach.title,
          series: selectedGame.title,
          rarity: ach.rarity,
          image: selectedGame.cover_image || selectedGame.cover,
          description: ach.reward.description || ach.description,
          stats: ach.reward.stats || {},
          group: (() => {
            const t = (ach.reward.type || '').toLowerCase();
            if (t.includes('companion') || t.includes('pet') || t.includes('mount')) return 'companion';
            if (t.includes('equip') || t.includes('material') || t.includes('gear') || t.includes('weapon') || t.includes('armor')) return 'equipment';
            if (t.includes('abilit') || t.includes('skill')) return 'skill';
            return 'achievement';
          })(),
          isPurchased: userCard?.acquisition_method === 'purchased',
          isUnlocked,
        });
      }
    });
    return cards;
  }, [selectedGame, localAchievements, userCards, user]);

  // Fallback cards
  const generateCardsForGame = useCallback((game) => {
    if (!game) return [];
    return Array.from({ length: 12 }, (_, i) => ({
      id: `card-${game.id}-${i}`,
      title: `${game.title} Card ${i + 1}`,
      series: game.title,
      rarity: ['Common', 'Rare', 'Epic', 'Legendary', 'Mythic'][Math.floor(Math.random() * 5)],
      image: game.cover_image || game.cover,
      description: `A collectible trading card from ${game.title}.`,
      stats: { strength: Math.floor(Math.random() * 100), magic: Math.floor(Math.random() * 100) },
      group: ['achievement', 'skill', 'equipment', 'companion'][i % 4],
    }));
  }, []);

  const displayCards = useMemo(() => {
    if (!selectedGame) return [];
    return tradingCards.length > 0 ? tradingCards : generateCardsForGame(selectedGame);
  }, [selectedGame, tradingCards, generateCardsForGame]);

  const handleTrackAchievement = useCallback(async (achievement) => {
    if (!isAuthenticated || !user) return;
    const isTracked = trackedAchievements.includes(achievement.id);
    const newTracked = isTracked ? trackedAchievements.filter(id => id !== achievement.id) : [...trackedAchievements, achievement.id];
    setTrackedAchievements(newTracked);
    await updateUserData({ tracked_achievements: newTracked });
  }, [isAuthenticated, user, updateUserData, trackedAchievements]);

  useEffect(() => {
    if (!selectedCard) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        setSelectedCard(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [selectedCard]);

  if (!selectedGame) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center px-8">
        <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${genre.color} opacity-20 flex items-center justify-center mb-6`}>
          <Trophy className="w-10 h-10 text-white/40" />
        </div>
        <h2 className="text-xl font-bold text-white/30 mb-2">Select a Game</h2>
        <p className="text-white/20 text-sm max-w-sm">
          Choose a game from the {genre.name} library to view its achievement cards.
        </p>
      </div>
    );
  }

  return (
    <div className="relative h-full flex flex-col overflow-hidden">
      {!selectedCard && (
        <>
          {/* Game Header */}
          <div className="p-5 pb-3 border-b border-white/6 flex items-center gap-4">
            <div className="w-12 h-16 rounded-lg overflow-hidden border border-white/10 flex-shrink-0">
              {selectedGame.cover_image ? (
                <img src={selectedGame.cover_image} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center">
                  <Gamepad2 className="w-5 h-5 text-white/25" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-white font-bold text-lg truncate">{selectedGame.title}</h2>
              <div className="flex items-center gap-2 mt-0.5">
                <Badge className="bg-white/10 text-white/70 border-white/20 text-[10px]">{selectedGame.genre || genre.name}</Badge>
                <span className="text-white/30 text-xs">{displayCards.length} cards</span>
              </div>
            </div>
          </div>

          {/* Grouped vertical layout */}
          <div className="relative flex-1 overflow-hidden">
            <div className="flex-1 h-full overflow-y-auto p-5 w-full">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-6 h-6 border-2 border-white/20 border-t-cyan-400 rounded-full animate-spin" />
          </div>
        ) : displayCards.length > 0 ? (
          <AchievementCardGrid cards={displayCards} onSelect={setSelectedCard} />
        ) : (
          <div className="h-64 flex flex-col items-center justify-center text-slate-500">
            <Trophy className="w-12 h-12 mb-3 opacity-20" />
            <p className="text-sm font-medium">No achievements yet</p>
            <p className="text-xs text-white/20 mt-1">Play to earn records, forge items and skills</p>
          </div>
        )}
            </div>
          </div>
        </>
      )}

      <AnimatePresence>
        {selectedCard && (
          <CardEnhancementOverlay card={selectedCard} onClose={() => setSelectedCard(null)} />
        )}
      </AnimatePresence>

      {/* Overlays */}

      <AnimatePresence>
        {selectedAchievement && (
          <AchievementDetailOverlay
            achievement={selectedAchievement}
            onClose={() => setSelectedAchievement(null)}
            onTrack={handleTrackAchievement}
            isTracked={trackedAchievements.includes(selectedAchievement.id)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
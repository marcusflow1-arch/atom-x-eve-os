import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Gamepad2, Layers, DollarSign } from 'lucide-react';
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

          {/* Cards Grid */}
          <div className="relative flex-1 overflow-hidden">
            <div className="flex-1 h-full overflow-y-auto p-5">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-6 h-6 border-2 border-white/20 border-t-cyan-400 rounded-full animate-spin" />
          </div>
        ) : displayCards.length > 0 ? (
          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {displayCards.map((card, i) => (
              <motion.div
                key={card.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.02 }}
                onClick={() => setSelectedCard(card)}
                whileHover={{ scale: 1.05, y: -4 }}
                className="aspect-[2.5/3.5] rounded-xl overflow-hidden cursor-pointer border border-white/10 hover:border-white/25 transition-all relative bg-slate-900/80 shadow-lg hover:shadow-xl hover:shadow-blue-500/10"
              >
                <div className="relative w-full h-3/5 overflow-hidden">
                  <img src={card.image} alt={card.title} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 to-transparent" />
                  {card.isPurchased && !card.isUnlocked && (
                    <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-green-500/90 flex items-center justify-center border border-white/20">
                      <DollarSign className="w-3 h-3 text-white" />
                    </div>
                  )}
                </div>
                <div className="p-2 flex flex-col gap-1">
                  <h3 className="text-white font-bold text-[10px] leading-tight line-clamp-2">{card.title}</h3>
                  <div className="flex gap-1 flex-wrap">
                    <Badge variant="outline" className={`text-[8px] h-3.5 px-1 border ${
                      card.rarity === 'Legendary' ? 'border-orange-500/50 text-orange-400' :
                      card.rarity === 'Epic' ? 'border-purple-500/50 text-purple-400' :
                      card.rarity === 'Rare' ? 'border-blue-500/50 text-blue-400' :
                      card.rarity === 'Mythic' ? 'border-red-500/50 text-red-400' :
                      'border-slate-500/50 text-slate-400'
                    }`}>
                      {card.rarity}
                    </Badge>
                    {card.isPurchased && (
                      <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-[8px] h-3.5 px-1">
                        BOUGHT
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent opacity-0 hover:opacity-100 transition-opacity pointer-events-none" />
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="h-64 flex flex-col items-center justify-center text-slate-500">
            <Layers className="w-12 h-12 mb-3 opacity-20" />
            <p className="text-sm font-medium">No trading cards found</p>
            <p className="text-xs text-white/20 mt-1">Unlock achievements to earn cards</p>
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
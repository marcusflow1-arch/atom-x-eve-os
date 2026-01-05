import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Star, Lock, Check, Play, Image as ImageIcon, DollarSign } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useCart } from '../CartContext';
import { allMockGames } from '../store/mockData';

const H_CATEGORIES = [
  'Overview',
  'AI Achievements',
  'Story & Missions',
  'Gameplay Systems',
  'Gear & Upgrades',
  'Media',
  'Store Data'
];

export default function AuraGameXMB({ selectedGame, onBack }) {
  const containerRef = useRef(null);
  const { isPurchased } = useCart();
  const [activeIndex, setActiveIndex] = useState(0);
  const [vIndex, setVIndex] = useState(0);
  const [achievements, setAchievements] = useState([]);
  const [userAchievements, setUserAchievements] = useState([]);
  const [user, setUser] = useState(null);

  const game = useMemo(() => {
    if (!selectedGame) return null;
    const enriched = allMockGames?.[selectedGame.id] || selectedGame;
    return enriched;
  }, [selectedGame]);

  const owned = useMemo(() => {
    try { return isPurchased ? isPurchased(game?.id) : false; } catch { return false; }
  }, [game, isPurchased]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const me = await base44.auth.me();
        if (!mounted) return;
        setUser(me || null);
        if (!game?.title) return;
        const ach = await base44.entities.Achievement.filter({ game: game.title });
        if (!mounted) return;
        setAchievements(Array.isArray(ach) ? ach.slice(0, 8) : []);
        if (me?.id && Array.isArray(ach) && ach.length) {
          const ua = await base44.entities.UserAchievement.filter({ user_id: me.id });
          if (!mounted) return;
          setUserAchievements(Array.isArray(ua) ? ua : []);
        }
      } catch (_) {
        // Silent: show only real data if available
      }
    })();
    return () => { mounted = false; };
  }, [game?.title]);

  useEffect(() => { setVIndex(0); }, [activeIndex]);

  useEffect(() => {
    const onKey = (e) => {
      if (!containerRef.current) return;
      switch (e.key) {
        case 'ArrowLeft':
        case 'a':
        case 'A':
          setActiveIndex((i) => (i > 0 ? i - 1 : H_CATEGORIES.length - 1));
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          setActiveIndex((i) => (i + 1) % H_CATEGORIES.length);
          break;
        case 'ArrowUp':
        case 'w':
        case 'W':
          setVIndex((vi) => Math.max(0, vi - 1));
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          setVIndex((vi) => Math.min(getVerticalItems().length - 1, vi + 1));
          break;
        case 'Escape':
          onBack?.();
          break;
        default:
          break;
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [activeIndex, onBack]);

  const getVerticalItems = () => {
    if (!game) return [];
    const items = [];

    if (H_CATEGORIES[activeIndex] === 'Overview') {
      if (game.description) items.push({ label: 'Description', value: game.description });
      if (game.developer) items.push({ label: 'Developer', value: game.developer });
      if (game.publisher) items.push({ label: 'Publisher', value: game.publisher });
      if (game.releaseDate || game.original_year) items.push({ label: 'Release', value: game.releaseDate || game.original_year });
      if (game.genre) items.push({ label: 'Genre', value: game.genre });
      if (game.tags?.length) items.push({ label: 'Tags', value: game.tags.join(', ') });
    }

    if (H_CATEGORIES[activeIndex] === 'AI Achievements') {
      // Show up to 4 visible achievements based on backend data
      const slots = (achievements || []).slice(0, 4).map((a) => {
        const ua = userAchievements.find((u) => u.achievement_id === a.id && u.user_id === user?.id);
        const unlocked = ua?.status === 'unlocked';
        return {
          type: 'achievement',
          id: a.id,
          title: a.title,
          rarity: a.rarity,
          status: unlocked ? 'Unlocked' : (ua?.status || 'locked'),
          unlocked
        };
      });
      if (slots.length) items.push(...slots);
    }

    if (H_CATEGORIES[activeIndex] === 'Story & Missions') {
      if (game.story) items.push({ label: 'Story', value: game.story });
      if (game.campaign) items.push({ label: 'Campaign', value: game.campaign });
      if (Array.isArray(game.missions) && game.missions.length) {
        items.push({ label: 'Missions', value: game.missions.join(' • ') });
      }
      // If none of the above exist, reuse description minimally
      if (!items.length && game.description) items.push({ label: 'Synopsis', value: game.description });
    }

    if (H_CATEGORIES[activeIndex] === 'Gameplay Systems') {
      if (game.tags?.length) items.push({ label: 'Mechanics', value: game.tags.join(', ') });
      if (typeof game.aiEnhanced === 'boolean') items.push({ label: 'AI Systems', value: game.aiEnhanced ? 'AI-Enhanced' : 'Standard' });
      if (game.genre) items.push({ label: 'Combat Type', value: game.genre });
    }

    if (H_CATEGORIES[activeIndex] === 'Gear & Upgrades') {
      if (Array.isArray(game.ability_unlocks) && game.ability_unlocks.length) {
        items.push({ label: 'Ability Unlocks', value: game.ability_unlocks.map((u) => u.name).join(' • ') });
      }
      if (Array.isArray(game.passive_modifiers) && game.passive_modifiers.length) {
        items.push({ label: 'Passives', value: game.passive_modifiers.join(' • ') });
      }
      if (Array.isArray(game.card_rewards) && game.card_rewards.length) {
        items.push({ label: 'Card Rewards', value: game.card_rewards.join(' • ') });
      }
    }

    if (H_CATEGORIES[activeIndex] === 'Media') {
      if (game.trailer_url) items.push({ type: 'media', label: 'Trailer', src: game.trailer_url, mediaType: 'trailer' });
      if (Array.isArray(game.screenshots) && game.screenshots.length) {
        items.push({ type: 'media', label: 'Screenshots', list: game.screenshots, mediaType: 'images' });
      }
    }

    if (H_CATEGORIES[activeIndex] === 'Store Data') {
      if (typeof game.price !== 'undefined') items.push({ icon: DollarSign, label: 'Price', value: `$${game.price}` });
      if (game.edition) items.push({ label: 'Edition', value: game.edition });
      if (owned !== null) items.push({ label: 'Ownership', value: owned ? 'Owned' : 'Not Owned' });
      if (game.rating) items.push({ label: 'Rating', value: String(game.rating) });
      if (game.reviews) items.push({ label: 'Reviews', value: String(game.reviews) });
      if (Array.isArray(game.platforms) && game.platforms.length) items.push({ label: 'Platforms', value: game.platforms.join(', ') });
    }

    return items;
  };

  const items = getVerticalItems();

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      className="min-h-screen w-full relative overflow-hidden outline-none"
      style={{ background: 'linear-gradient(135deg, #0a1628 0%, #1a2640 50%, #0f1c35 100%)' }}
    >
      {/* Header */}
      <div className="px-8 py-4 flex items-center justify-between" style={{ background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(50px) saturate(200%)', WebkitBackdropFilter: 'blur(50px) saturate(200%)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <button onClick={onBack} className="text-white/70 hover:text-white flex items-center gap-2">
          <ChevronLeft className="w-4 h-4" /> Back
        </button>
        <div className="flex items-center gap-3">
          <img src={game?.cover_image || game?.image} alt={game?.title} className="w-10 h-10 rounded-lg object-cover" />
          <div>
            <h1 className="text-white font-bold">{game?.title}</h1>
            <p className="text-white/50 text-xs">XMB Mode • Use Arrow Keys / WASD</p>
          </div>
        </div>
        <div />
      </div>

      {/* Horizontal Axis (Categories) */}
      <div className="relative z-10 px-8 pt-6">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveIndex((i) => (i > 0 ? i - 1 : H_CATEGORIES.length - 1))}
            className="w-8 h-8 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 text-white"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="relative overflow-hidden flex-1">
            <motion.div
              className="flex gap-3"
              animate={{ x: -activeIndex * 140 }}
              transition={{ type: 'spring', stiffness: 260, damping: 30 }}
            >
              {H_CATEGORIES.map((c, idx) => (
                <button
                  key={c}
                  onClick={() => setActiveIndex(idx)}
                  className={`px-4 py-2 rounded-xl border transition-all whitespace-nowrap ${
                    activeIndex === idx
                      ? 'bg-white/20 border-white/40 text-white shadow-[0_0_20px_rgba(255,255,255,0.15)]'
                      : 'bg-white/5 border-white/10 text-white/70 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {c}
                </button>
              ))}
            </motion.div>
          </div>
          <button
            onClick={() => setActiveIndex((i) => (i + 1) % H_CATEGORIES.length)}
            className="w-8 h-8 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 text-white"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Vertical Axis (Context) */}
      <div className="relative z-10 grid grid-cols-[320px,1fr] gap-8 px-8 pt-6">
        {/* Left rail preview */}
        <div className="rounded-2xl overflow-hidden border border-white/10" style={{ background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(30px) saturate(160%)' }}>
          <div className="aspect-video relative">
            <img src={game?.cover_image || game?.image} alt={game?.title} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
            {typeof game?.price !== 'undefined' && (
              <div className="absolute bottom-2 right-2 bg-black/60 border border-white/10 rounded-md px-2 py-1 text-white text-sm">
                ${'{'}game.price{'}'}
              </div>
            )}
          </div>
          <div className="p-4">
            <h2 className="text-white font-bold text-lg mb-1">{game?.title}</h2>
            <div className="flex items-center gap-3 text-white/70 text-sm">
              {game?.genre && <span>{game.genre}</span>}
              {game?.rating && (
                <span className="flex items-center gap-1"><Star className="w-3 h-3 text-yellow-400 fill-current" />{game.rating}</span>
              )}
            </div>
          </div>
        </div>

        {/* Vertical content list */}
        <div className="relative">
          <div className="absolute -left-10 top-1 text-white/40 text-xs">{H_CATEGORIES[activeIndex]}</div>
          <div className="max-h-[60vh] overflow-y-auto pr-2 space-y-3">
            <AnimatePresence initial={false} mode="wait">
              {items.map((it, idx) => (
                <motion.div
                  key={(it.id || it.label || it.title || 'row') + '-' + idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className={`p-4 rounded-xl border transition-all ${
                    vIndex === idx ? 'border-cyan-400/60 shadow-[0_0_20px_rgba(34,211,238,0.25)]' : 'border-white/10'
                  }`}
                  style={{ background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(20px) saturate(160%)' }}
                >
                  {/* Media item */}
                  {it.type === 'media' ? (
                    <div>
                      <div className="flex items-center gap-2 mb-3 text-white/80">
                        {it.mediaType === 'trailer' ? <Play className="w-4 h-4" /> : <ImageIcon className="w-4 h-4" />}
                        <span className="font-semibold">{it.label}</span>
                      </div>
                      {it.mediaType === 'trailer' && (
                        <a href={it.src} target="_blank" rel="noreferrer" className="text-cyan-300 hover:underline">Open Trailer</a>
                      )}
                      {it.mediaType === 'images' && Array.isArray(it.list) && (
                        <div className="grid grid-cols-3 gap-3">
                          {it.list.slice(0, 6).map((src, i) => (
                            <img key={i} src={src} alt={`shot-${i}`} className="w-full h-24 object-cover rounded-lg" />
                          ))}
                        </div>
                      )}
                    </div>
                  ) : it.type === 'achievement' ? (
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-white font-semibold">{it.title}</div>
                        <div className="text-white/50 text-xs">{it.rarity}</div>
                      </div>
                      <div className={`flex items-center gap-2 text-sm ${it.unlocked ? 'text-green-400' : 'text-white/50'}`}>
                        {it.unlocked ? <Check className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                        <span>{it.status}</span>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="text-white/60 text-xs uppercase tracking-wider mb-1">{it.label}</div>
                      <div className="text-white leading-relaxed">{it.value}</div>
                    </div>
                  )}
                </motion.div>
              ))}
              {!items.length && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-white/60">
                  No data available for this section.
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
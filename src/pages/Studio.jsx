import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import DevZoneSection from '@/components/game/DevZoneSection';
import { cacheGame, cacheStudio, getCachedStudio, normalizeGameMetadata } from '@/lib/gameMetadataCache';

const DEFAULT_GAME = {
  id: 'cyberpunk-2088',
  title: 'Cyberpunk 2088',
  cover_image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600&q=80',
  description: 'Experience a world transformed by technology and ancient power.',
  developer: 'Rockstar Games',
  publisher: 'Rockstar Games',
  retailer: 'Atom X Eve',
  retailer_type: 'Digital Retailer / Platform Storefront',
};

export default function Studio() {
  const cachedStudio = getCachedStudio('primary');
  const cachedGame = cachedStudio?.game || null;
  const [game, setGame] = useState(cachedGame ? normalizeGameMetadata(cachedGame) : normalizeGameMetadata(DEFAULT_GAME));
  const [ready, setReady] = useState(Boolean(cachedStudio || cachedGame));

  useEffect(() => {
    let cancelled = false;
    const hydrate = async () => {
      try {
        // Use the local record first. This refresh is deliberately non-blocking.
        const games = await base44.entities.Game.list?.({ limit: 1 });
        const fetched = Array.isArray(games) ? games[0] : null;
        if (fetched && !cancelled) {
          const normalized = cacheGame(fetched);
          setGame(normalized);
          cacheStudio({
            name: normalized.developer,
            developer: normalized.developer,
            publisher: normalized.publisher,
            logo: normalized.developer_logo || normalized.studio_logo || normalized.logo,
            description: normalized.developer_description || normalized.studio_description || '',
            game: normalized,
          }, 'primary');
        }
      } catch (err) {
        console.warn('Background studio refresh skipped:', err);
      } finally {
        if (!cancelled) setReady(true);
      }
    };
    hydrate();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0f1419] to-[#1a1f2e] p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-12">
          <h1 className="text-5xl font-black text-white mb-2">Developer Studio</h1>
          <p className="text-white/60 text-lg">Development insights, roadmap, and studio updates</p>
        </div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="border border-white/10 rounded-2xl overflow-hidden" style={{ background:'rgba(10, 14, 20, 0.5)', backdropFilter:'blur(20px)', WebkitBackdropFilter:'blur(20px)' }}>
          <div className="p-8">
            <DevZoneSection game={game} />
            {!ready && <span className="sr-only">Refreshing studio metadata</span>}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

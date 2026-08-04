import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Gamepad2, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import SectionShell, { glassCard, EmptyState, LoadingState } from '../SectionShell';

// Games Vault — real Game backend; open any title's full detail page
export default function GamesSection({ accent }) {
  const navigate = useNavigate();
  const [games, setGames] = useState(null);

  useEffect(() => {
    base44.entities.Game.list('-created_date', 60).then(setGames);
  }, []);

  if (games === null) return <LoadingState />;

  return (
    <SectionShell title="Games Vault" accent={accent} subtitle="Every reconstructed title in the Atom X Eve catalog">
      {games.length === 0 ? (
        <EmptyState icon={Gamepad2} message="The vault is empty — titles appear here once added to the catalog." />
      ) : (
        <div className="grid grid-cols-4 xl:grid-cols-6 gap-4">
          {games.map((g, i) => (
            <motion.button
              key={g.id}
              initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: Math.min(i * 0.02, 0.5) }}
              onClick={() => navigate(createPageUrl(`GameDetail?id=${g.id}`))}
              className="text-left overflow-hidden group" style={glassCard('rgba(96,165,250,0.25)')}
            >
              <div className="relative aspect-[3/4] bg-black/40 overflow-hidden">
                {(g.cover_image || g.image)
                  ? <img src={g.cover_image || g.image} alt={g.title || g.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  : <div className="w-full h-full flex items-center justify-center"><Gamepad2 className="w-8 h-8 text-white/15" /></div>}
                {g.rating != null && (
                  <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-black/70 text-yellow-300 text-[10px] font-bold flex items-center gap-0.5">
                    <Star className="w-2.5 h-2.5 fill-yellow-300" /> {g.rating}
                  </span>
                )}
              </div>
              <div className="p-2.5">
                <p className="text-white font-semibold text-xs truncate">{g.title || g.name}</p>
                <p className="text-white/35 text-[10px] truncate mt-0.5">{g.genre || '—'}</p>
              </div>
            </motion.button>
          ))}
        </div>
      )}
    </SectionShell>
  );
}
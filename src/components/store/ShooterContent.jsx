import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Crosshair, Star, ShoppingBag } from 'lucide-react';

const SHOOTER_TAGS = ['shooter', 'fps', 'first-person', 'third-person', 'battle royale', 'tactical', 'hero shooter', 'gun'];

export default function ShooterContent({ games = [], onNavigateToGame }) {
    const shooterGames = useMemo(() => {
        const filtered = games.filter(g => {
            const genre = (g.genre || '').toLowerCase();
            const tags = (g.tags || []).map(t => (t || '').toLowerCase());
            return SHOOTER_TAGS.some(s => genre.includes(s) || tags.some(t => t.includes(s)));
        });
        return filtered.length > 0 ? filtered : games.slice(0, 20);
    }, [games]);

    const SUB_CATEGORIES = ['All', 'First-Person', 'Third-Person', 'Battle Royale', 'Tactical', 'Hero Shooter'];
    const [activeSub, setActiveSub] = React.useState('All');

    const displayed = useMemo(() => {
        if (activeSub === 'All') return shooterGames;
        return shooterGames.filter(g => {
            const genre = (g.genre || '').toLowerCase();
            const tags = (g.tags || []).map(t => (t || '').toLowerCase());
            const sub = activeSub.toLowerCase();
            return genre.includes(sub) || tags.some(t => t.includes(sub));
        });
    }, [shooterGames, activeSub]);

    return (
        <div className="w-full h-full flex flex-col overflow-hidden text-white">
            {/* Header */}
            <div className="flex-shrink-0 px-8 pt-8 pb-4">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-red-500/20 border border-red-500/30 flex items-center justify-center">
                        <Crosshair className="w-5 h-5 text-red-400" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-white tracking-wide">Shooter Games</h1>
                        <p className="text-white/50 text-sm">{shooterGames.length} titles available</p>
                    </div>
                </div>

                {/* Sub-category pills */}
                <div className="flex items-center gap-2 flex-wrap">
                    {SUB_CATEGORIES.map(sub => (
                        <button
                            key={sub}
                            onClick={() => setActiveSub(sub)}
                            className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all border ${
                                activeSub === sub
                                    ? 'bg-red-500/20 border-red-500/40 text-red-300'
                                    : 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10 hover:text-white'
                            }`}
                        >
                            {sub}
                        </button>
                    ))}
                </div>
            </div>

            {/* Game Grid */}
            <div className="flex-1 overflow-y-auto px-8 pb-24 custom-scrollbar">
                <motion.div
                    key={activeSub}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="grid grid-cols-3 md:grid-cols-4 xl:grid-cols-6 2xl:grid-cols-8 gap-4"
                >
                    {displayed.map((game, idx) => (
                        <motion.div
                            key={game.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.04 }}
                            whileHover={{ y: -8, scale: 1.02 }}
                            onClick={() => onNavigateToGame && onNavigateToGame(game.id)}
                            className="group relative aspect-[3/4] rounded-xl overflow-hidden cursor-pointer shadow-lg bg-slate-900 border border-white/5 hover:border-red-400/40 hover:shadow-red-500/20 transition-all"
                        >
                            <img src={game.cover_image || game.image} alt={game.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent opacity-80 group-hover:opacity-60 transition-opacity" />
                            <div className="absolute top-2 right-2 z-10">
                                <button
                                    onClick={(e) => { e.stopPropagation(); onNavigateToGame && onNavigateToGame(game.id); }}
                                    className="w-7 h-7 rounded-md bg-black/60 backdrop-blur-md border border-red-400/40 flex items-center justify-center hover:bg-red-500/20 transition-all opacity-0 group-hover:opacity-100"
                                >
                                    <ShoppingBag className="w-3.5 h-3.5 text-red-300" />
                                </button>
                            </div>
                            <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-2 group-hover:translate-y-0 transition-transform">
                                <h4 className="text-white font-bold text-sm leading-tight mb-1 truncate">{game.title}</h4>
                                <div className="flex items-center justify-between text-xs text-white/60">
                                    <span className="truncate">{game.genre}</span>
                                    {game.rating && (
                                        <div className="flex items-center gap-1 text-yellow-500 flex-shrink-0 ml-1">
                                            <Star className="w-3 h-3 fill-current" />
                                            <span>{game.rating}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                    {displayed.length === 0 && (
                        <div className="col-span-full flex flex-col items-center justify-center py-24 text-white/30">
                            <Crosshair className="w-12 h-12 mb-4 opacity-40" />
                            <p className="text-lg font-semibold">No shooter games found</p>
                            <p className="text-sm mt-1">Try a different sub-category</p>
                        </div>
                    )}
                </motion.div>
            </div>
        </div>
    );
}
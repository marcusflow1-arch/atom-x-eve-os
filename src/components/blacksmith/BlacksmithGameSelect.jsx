import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Layers, ChevronRight, Gamepad2, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

export default function BlacksmithGameSelect({ itemsData, onGameSelect }) {
    const [selectedGenre, setSelectedGenre] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    const genres = useMemo(() => {
        const uniqueGenres = [...new Set(itemsData.map(item => item.genre))].sort();
        return uniqueGenres;
    }, [itemsData]);

    const gamesByGenre = useMemo(() => {
        return itemsData.reduce((acc, item) => {
            if (!acc[item.genre]) acc[item.genre] = [];
            // Dedup games
            if (!acc[item.genre].some(g => g.game_id === item.game_id)) {
                acc[item.genre].push({
                    id: item.game_id,
                    title: item.game_title,
                    image: item.preview_image_url
                });
            }
            return acc;
        }, {});
    }, [itemsData]);

    const filteredGenres = useMemo(() => {
        return genres.filter(g => g.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [genres, searchTerm]);

    return (
        <div className="flex gap-8 h-full">
            {/* Left Column: Genres (Liquid Glass Box) */}
            <div className="w-80 flex-shrink-0 flex flex-col">
                <div className="relative mb-6">
                     <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                     <Input 
                        placeholder="Search genres..." 
                        value={searchTerm} 
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9 bg-slate-800/50 border-white/10 text-white rounded-xl focus:ring-blue-500/50"
                     />
                </div>

                <div 
                    className="flex-1 rounded-3xl overflow-hidden flex flex-col p-4 space-y-2 border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.3)]"
                    style={{
                        background: 'rgba(30, 41, 59, 0.4)',
                        backdropFilter: 'blur(20px)',
                        WebkitBackdropFilter: 'blur(20px)',
                    }}
                >
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 px-2">Genres</div>
                    <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-2">
                        {filteredGenres.map(genre => (
                            <button
                                key={genre}
                                onClick={() => setSelectedGenre(genre)}
                                className={`w-full text-left px-4 py-3 rounded-xl flex items-center justify-between transition-all duration-300 ${
                                    selectedGenre === genre
                                        ? 'bg-gradient-to-r from-blue-600/80 to-blue-500/80 text-white shadow-lg shadow-blue-500/20 border border-blue-400/50'
                                        : 'bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white border border-transparent'
                                }`}
                            >
                                <span className="font-bold">{genre}</span>
                                {selectedGenre === genre && <ChevronRight className="w-4 h-4" />}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Right Column: Games List (Appears on selection) */}
            <div className="flex-1 relative">
                <AnimatePresence mode="wait">
                    {selectedGenre ? (
                        <motion.div
                            key="games-list"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="h-full flex flex-col"
                        >
                             <div 
                                className="flex-1 rounded-3xl overflow-hidden p-6 border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.3)]"
                                style={{
                                    background: 'rgba(15, 23, 42, 0.6)',
                                    backdropFilter: 'blur(30px)',
                                    WebkitBackdropFilter: 'blur(30px)',
                                }}
                            >
                                <h2 className="text-2xl font-black text-white mb-6 flex items-center gap-3">
                                    <Layers className="w-6 h-6 text-blue-400" />
                                    {selectedGenre} Games
                                </h2>

                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 overflow-y-auto max-h-[calc(100vh-300px)] pr-2 custom-scrollbar">
                                    {gamesByGenre[selectedGenre]?.map(game => (
                                        <motion.div
                                            key={game.id}
                                            whileHover={{ scale: 1.05, y: -5 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={() => onGameSelect(game)}
                                            className="group cursor-pointer relative aspect-[3/4] rounded-2xl overflow-hidden border border-white/10 shadow-lg bg-slate-800"
                                        >
                                            <img 
                                                src={game.image} 
                                                alt={game.title} 
                                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 opacity-80 group-hover:opacity-100" 
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                                            
                                            <div className="absolute bottom-0 left-0 right-0 p-4">
                                                <h3 className="text-white font-bold text-lg leading-tight group-hover:text-blue-400 transition-colors">
                                                    {game.title}
                                                </h3>
                                                <div className="flex items-center gap-2 mt-2">
                                                     <Badge className="bg-white/10 hover:bg-white/20 text-white/80 border-white/10 text-[10px]">
                                                        Select
                                                     </Badge>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="empty-state"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="h-full flex items-center justify-center rounded-3xl border border-white/5 bg-slate-900/20 backdrop-blur-sm"
                        >
                            <div className="text-center text-slate-500">
                                <Gamepad2 className="w-16 h-16 mx-auto mb-4 opacity-20" />
                                <h3 className="text-xl font-bold">Select a Genre</h3>
                                <p>Choose a genre on the left to view available games.</p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
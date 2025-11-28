import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Play, Trophy, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { mockGameDetails } from './mockLibraryData';

const GameDetailsDrawer = ({ gameId, onClose }) => {
    const [gameDetails, setGameDetails] = useState(null);

    useEffect(() => {
        if (gameId) {
            // Simulate fetching game details
            setTimeout(() => {
                setGameDetails(mockGameDetails[gameId] || null);
            }, 200);
        } else {
            setGameDetails(null);
        }
    }, [gameId]);

    if (!gameDetails) return null;

    // FIXED: Add safety checks for all properties
    const genres = gameDetails.genres || (gameDetails.genre ? [gameDetails.genre] : ['Uncategorized']);
    const coverImage = gameDetails.cover_image || gameDetails.cover || 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=600&h=800&fit=crop';
    const achievements = gameDetails.achievements || [];

    return (
        <AnimatePresence>
            <motion.aside
                initial={{ x: 300, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 300, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="w-80 flex-shrink-0 bg-slate-800/50 border-l border-slate-700/50 p-6 overflow-y-auto"
            >
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-white">Game Details</h3>
                    <Button variant="ghost" size="icon" onClick={onClose}>
                        <X className="w-4 h-4" />
                    </Button>
                </div>

                <img 
                    src={coverImage} 
                    alt={gameDetails.title}
                    className="w-full aspect-[3/4] object-cover rounded-lg mb-4"
                />

                <h4 className="text-xl font-bold text-white mb-2">{gameDetails.title}</h4>
                <p className="text-slate-400 text-sm mb-4">{gameDetails.description || 'No description available.'}</p>

                <div className="space-y-3 mb-6">
                    <div className="flex items-center justify-between">
                        <span className="text-slate-400 text-sm">Genre</span>
                        <Badge variant="outline">{genres.join(', ')}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-slate-400 text-sm">Rating</span>
                        <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                            <span className="text-white text-sm">{gameDetails.rating || 'N/A'}</span>
                        </div>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-slate-400 text-sm">Achievements</span>
                        <div className="flex items-center gap-1">
                            <Trophy className="w-4 h-4 text-blue-400" />
                            <span className="text-white text-sm">{achievements.length}</span>
                        </div>
                    </div>
                </div>

                <Button className="w-full bg-blue-600 hover:bg-blue-700">
                    <Play className="w-4 h-4 mr-2" />
                    Play Now
                </Button>
            </motion.aside>
        </AnimatePresence>
    );
};

export default GameDetailsDrawer;
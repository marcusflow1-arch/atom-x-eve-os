import React from 'react';
import { Play } from 'lucide-react';

const GameCard = ({ game, onSelect, onDoubleClick }) => {
    // FIXED: Add safety checks for all properties
    const genres = game.genres || (game.genre ? [game.genre] : []);
    const coverImage = game.cover_image || game.cover || 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=600&h=800&fit=crop';
    
    return (
        <div
            onClick={onSelect}
            onDoubleClick={onDoubleClick}
            className="group relative overflow-hidden rounded-lg bg-slate-800/50 border border-slate-700/50 hover:border-blue-500/50 transition-all cursor-pointer"
        >
            <div className="aspect-[3/4] relative">
                <img 
                    src={coverImage} 
                    alt={game.title} 
                    className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Play className="w-12 h-12 text-white" />
                </div>
            </div>
            <div className="p-3">
                <h4 className="text-white font-semibold text-sm truncate">{game.title}</h4>
                <p className="text-slate-400 text-xs truncate">
                    {genres.length > 0 ? genres.join(', ') : 'Uncategorized'}
                </p>
            </div>
        </div>
    );
};

export default GameCard;
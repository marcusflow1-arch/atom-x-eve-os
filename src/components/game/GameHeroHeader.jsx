import React from 'react';
import { Play, Star, Heart, ShoppingCart } from 'lucide-react';

export default function GameHeroHeader({
  game,
  isOwned,
  isFavorite,
  designMode,
  onPlay,
  onFavorite,
  onAddLibrary,
}) {
  const headerStyles = {
    default: {
      bg: 'bg-gradient-to-b from-slate-800 to-slate-900',
      text: 'text-white',
      title: 'text-5xl',
      description: 'text-slate-300',
    },
    minimal: {
      bg: 'bg-white',
      text: 'text-black',
      title: 'text-4xl',
      description: 'text-gray-600',
    },
    dark: {
      bg: 'bg-black',
      text: 'text-white',
      title: 'text-6xl',
      description: 'text-gray-400',
    },
  };

  const style = headerStyles[designMode];

  return (
    <div className={`relative ${style.bg} ${style.text} pt-24 pb-12 px-8`}>
      {/* Banner Background */}
      <div className="absolute inset-0 opacity-20">
        <img
          src={game.banner_image || game.cover_image}
          alt={game.title}
          className="w-full h-full object-cover"
        />
        <div className={`absolute inset-0 ${style.bg}`} />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-6xl mx-auto flex gap-8">
        {/* Cover Image */}
        <div className="flex-shrink-0">
          <img
            src={game.cover_image}
            alt={game.title}
            className={`w-48 h-64 object-cover rounded-xl shadow-2xl ${
              designMode === 'minimal' ? 'border-4 border-black' : 'border border-white/20'
            }`}
          />
        </div>

        {/* Info */}
        <div className="flex-1 flex flex-col justify-end">
          <h1 className={`${style.title} font-black mb-4 leading-tight`}>
            {game.title}
          </h1>
          <p className={`${style.description} text-lg mb-8 max-w-2xl leading-relaxed`}>
            {game.description || 'No description available'}
          </p>

          {/* Buttons */}
          <div className="flex gap-3 flex-wrap">
            <button
              onClick={onPlay}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-bold transition-all ${
                isOwned
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              <Play className="w-5 h-5 fill-current" />
              {isOwned ? 'Play Now' : 'Buy Now'}
            </button>

            <button
              onClick={onAddLibrary}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-bold transition-all border-2 ${
                isOwned
                  ? `border-green-600 ${designMode === 'minimal' ? 'text-black bg-green-100' : 'text-green-400 bg-green-600/10'}`
                  : `border-white/30 ${designMode === 'minimal' ? 'text-black bg-gray-200' : 'text-white bg-white/10'}`
              }`}
            >
              <ShoppingCart className="w-5 h-5" />
              {isOwned ? 'In Library' : 'Add to Library'}
            </button>

            <button
              onClick={onFavorite}
              className={`w-12 h-12 rounded-lg flex items-center justify-center transition-all ${
                isFavorite
                  ? designMode === 'minimal'
                    ? 'bg-red-100 text-red-600'
                    : 'bg-red-600/20 text-red-400'
                  : designMode === 'minimal'
                  ? 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                  : 'bg-white/10 text-white/60 hover:bg-white/20'
              }`}
            >
              <Heart className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
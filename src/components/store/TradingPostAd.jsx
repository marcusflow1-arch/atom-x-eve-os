import React from 'react';

export default function TradingPostAd({ game }) {
  return (
    <div className="rounded-2xl overflow-hidden border border-white/10 bg-gradient-to-r from-cyan-900/20 to-blue-900/20 p-6 relative">
      <div className="flex items-center gap-6">
        {/* Ad Image */}
        <div className="w-48 h-48 flex-shrink-0 rounded-xl overflow-hidden">
          <img
            src={game.image}
            alt={game.title}
            className="w-full h-full object-cover hover:scale-110 transition-transform duration-500"
          />
        </div>

        {/* Ad Content */}
        <div className="flex-1">
          <p className="text-cyan-400 text-xs font-bold uppercase tracking-widest mb-2">Featured Game</p>
          <h3 className="text-2xl font-bold text-white mb-2">{game.title}</h3>
          <p className="text-white/60 text-sm mb-4 line-clamp-3">{game.description}</p>
          
          <button className="px-6 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold transition-all">
            Explore Now
          </button>
        </div>

        {/* Decorative Element */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-cyan-500/10 to-transparent rounded-bl-full" />
      </div>
    </div>
  );
}
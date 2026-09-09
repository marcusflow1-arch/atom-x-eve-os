import React from 'react';
import { Trophy, Search, DollarSign, ArrowLeftRight } from 'lucide-react';

export default function AlpineGenreSidebar({ genres, selectedGenre, onSelectGenre, gameCount, marketView, onMarketView }) {
  return (
    <aside className="alpine-filter-panel">
      <p className="alpine-kicker">Achievement</p>
      <div className="alpine-achievement-chip"><Trophy /> <span>{selectedGenre.name} Games</span><strong>{gameCount}</strong></div>
      <label className="alpine-search"><Search /><input type="text" placeholder="Search games..." /></label>
      <p className="alpine-kicker alpine-genre-title">Genres</p>
      <nav className="alpine-genres">
        {genres.map((genre) => (
          <button key={genre.id} onClick={() => onSelectGenre(genre)} className={selectedGenre.id === genre.id ? 'active' : ''}>
            {React.createElement(genre.icon)}<span>{genre.name}</span>
          </button>
        ))}
      </nav>
      <div className="alpine-market-links">
        <button onClick={() => onMarketView(marketView === 'blackmarket' ? 'cards' : 'blackmarket')} className={marketView === 'blackmarket' ? 'active' : ''}><DollarSign />Black Market</button>
        <button onClick={() => onMarketView(marketView === 'tradingpost' ? 'cards' : 'tradingpost')} className={marketView === 'tradingpost' ? 'active' : ''}><ArrowLeftRight />Trading Post</button>
      </div>
    </aside>
  );
}
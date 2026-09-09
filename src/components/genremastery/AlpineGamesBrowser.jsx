import React from 'react';
import { Gamepad2, Trophy, Scroll } from 'lucide-react';

export default function AlpineGamesBrowser({ games, loading, selectedGame, onSelectGame, rightPanel }) {
  return (
    <aside className="alpine-games-browser">
      <h2>Games Browser</h2>
      <div className="alpine-browser-rule" />
      <div className="alpine-game-list">
        {loading ? <div className="alpine-loader" /> : games.length === 0 ? <p className="alpine-empty"><Gamepad2 />No games in this genre yet</p> : games.map((game) => (
          <button key={game.id} onClick={() => onSelectGame(game)} className={selectedGame?.id === game.id && rightPanel === 'games' ? 'active' : ''}>
            <div className="alpine-game-cover">{game.cover_image ? <img src={game.cover_image} alt={game.title} /> : <Gamepad2 />}</div>
            <div className="alpine-game-copy">
              <h3>{game.title}</h3><p>{game.genre || 'Game'}</p>
              <span><Scroll />{game.questCount}<Trophy />{game.achievementCards}</span>
            </div>
          </button>
        ))}
      </div>
    </aside>
  );
}
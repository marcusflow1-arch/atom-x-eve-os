import React from 'react';
import { motion } from 'framer-motion';

const genres = [
  "Fantasy", "RPG", "Sci-Fi Action", "Fighter", "Fighting Games", 
  "Shooter", "MMORPG", "Mobile Strategy", "Horror", "Action/Adventure"
];

export default function GenreFilter({ activeGenre, onSelectGenre }) {
  return (
    <>
      <style>{`
        @keyframes underline-grow {
          0% { transform: scaleX(0); opacity: 0.0; }
          60% { transform: scaleX(1.02); opacity: 1; }
          100% { transform: scaleX(1); opacity: 1; }
        }
        @keyframes underline-glow {
          0% { box-shadow: 0 0 0px rgba(59,130,246,0); }
          50% { box-shadow: 0 0 12px rgba(59,130,246,0.35); }
          100% { box-shadow: 0 0 4px rgba(59,130,246,0.12); }
        }
        .genre-label {
          position: relative;
          padding: 10px 16px;
          cursor: pointer;
          white-space: nowrap;
        }
        .genre-label::after {
          content: "";
          position: absolute;
          left: 10%;
          right: 10%;
          height: 3px;
          bottom: -2px;
          background: linear-gradient(90deg, #3B82F6, #60A5FA);
          transform-origin: center;
          transform: scaleX(0);
          opacity: 0;
          border-radius: 2px;
        }
        .genre-label:hover::after,
        .genre-label[aria-pressed="true"]::after {
          animation: underline-grow 360ms cubic-bezier(.2,.8,.2,1) forwards,
                     underline-glow 1600ms ease-in-out infinite alternate;
          opacity: 1;
        }
      `}</style>
      <div className="flex-shrink-0 overflow-x-auto hidden-scroll">
        <div className="flex items-center gap-2">
          {genres.map(genre => (
            <button
              key={genre}
              role="tab"
              aria-pressed={activeGenre === genre}
              onClick={() => onSelectGenre(genre === activeGenre ? null : genre)}
              className={`genre-label text-sm font-medium rounded-md transition-colors ${
                activeGenre === genre ? 'text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              {genre}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
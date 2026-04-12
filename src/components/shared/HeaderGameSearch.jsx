import { useState, useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';

export default function HeaderGameSearch({ onGameSelect }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [games, setGames] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);

  // Fetch all games once
  useEffect(() => {
    const fetchGames = async () => {
      try {
        const response = await base44.entities.Game.list();
        const gamesList = response.data || response;
        setGames(Array.isArray(gamesList) ? gamesList : []);
      } catch (error) {
        console.error('Failed to fetch games:', error);
        setGames([]);
      }
    };
    fetchGames();
  }, []);

  // Filter games based on search term
  const filteredGames = games.filter(game =>
    game.title.toLowerCase().includes(searchTerm.toLowerCase())
  ).slice(0, 8);

  const handleInputChange = (e) => {
    setSearchTerm(e.target.value);
    setIsOpen(true);
    setSelectedIndex(-1);
  };

  const handleClear = () => {
    setSearchTerm('');
    setIsOpen(false);
    setSelectedIndex(-1);
    inputRef.current?.focus();
  };

  const handleGameSelect = (game) => {
    if (onGameSelect) {
      onGameSelect(game.id);
    }
    setSearchTerm('');
    setIsOpen(false);
    setSelectedIndex(-1);
  };

  const handleKeyDown = (e) => {
    if (!isOpen && filteredGames.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < filteredGames.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && filteredGames[selectedIndex]) {
          handleGameSelect(filteredGames[selectedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        setSelectedIndex(-1);
        break;
      default:
        break;
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target) && 
          inputRef.current && !inputRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative w-80 flex-shrink-0">
      {/* Search Input */}
      <div className="relative">
        <div 
          className="flex items-center gap-2 px-4 py-2 rounded-full transition-all border"
          style={{
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.12)',
          }}
        >
          <Search className="w-4 h-4 text-white/50 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search games..."
            value={searchTerm}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsOpen(true)}
            className="flex-1 bg-transparent text-sm text-white placeholder-white/40 outline-none"
          />
          {searchTerm && (
            <button
              onClick={handleClear}
              className="text-white/40 hover:text-white transition-colors flex-shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Dropdown Results */}
        <AnimatePresence>
          {isOpen && filteredGames.length > 0 && (
            <motion.div
              ref={dropdownRef}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
              className="absolute top-full left-0 right-0 mt-2 rounded-xl overflow-hidden z-50 max-h-72 overflow-y-auto"
              style={{
                background: 'rgba(20, 30, 50, 0.95)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255,255,255,0.12)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
              }}
            >
              {filteredGames.map((game, idx) => (
                <motion.button
                  key={game.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: idx * 0.02 }}
                  onClick={() => handleGameSelect(game)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors border-b last:border-b-0 ${
                    selectedIndex === idx
                      ? 'bg-white/10'
                      : 'hover:bg-white/5'
                  }`}
                >
                  <img
                    src={game.cover_image || 'https://via.placeholder.com/40x54'}
                    alt={game.title}
                    className="w-10 h-14 object-cover rounded border border-white/10 flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">
                      {game.title}
                    </p>
                    <p className="text-xs text-white/50 mt-0.5">
                      {game.genre}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs font-bold text-green-400">
                      ${game.price}
                    </p>
                  </div>
                </motion.button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* No Results Message */}
        <AnimatePresence>
          {isOpen && searchTerm && filteredGames.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="absolute top-full left-0 right-0 mt-2 px-4 py-3 rounded-xl text-center text-sm text-white/50"
              style={{
                background: 'rgba(20, 30, 50, 0.95)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255,255,255,0.12)',
              }}
            >
              No games found
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
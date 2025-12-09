import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Maximize2, ArrowRight, GripVertical, Gamepad2, ChevronLeft, ChevronRight } from 'lucide-react';
import { useRef } from 'react';
import ShinyCard from '../shared/ShinyCard';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

const INITIAL_GENRES = [
  "MMORPG", "RPG", "Fear", "Shooter", "Action",
  "Adventure", "Strategy", "Puzzle", "Racing", "Sports"
];

// Helper to generate consistent mock games
const generateGames = (genre, count) => Array.from({ length: count }, (_, i) => ({
  id: `${genre.toLowerCase()}-${i}`,
  title: `${genre} Title ${i + 1}`,
  image: `https://images.unsplash.com/photo-${[
    '1542751371-adc38448a05e',
    '1552820728-8b83bb6b773f',
    '1538481199705-c710c4e965fc',
    '1511512578047-dfb367046420',
    '1550745165-9bc0b252726f',
    '1509198397868-475647b2a1e5',
    '1505489435671-80810714716e',
    '1542751371-adc38448a05e',
    '1616514128080-292762c767c0',
    '1605901309584-818e25960b8f'
  ][i % 10]}?w=400&h=400&fit=crop`
}));

const MOCK_GAMES = INITIAL_GENRES.reduce((acc, genre) => {
  acc[genre] = generateGames(genre, 40);
  return acc;
}, { default: generateGames('Game', 40) });

const GamesCarousel = ({ games, onSelectGame }) => {
  const scrollRef = useRef(null);

  const scroll = (direction) => {
    if (scrollRef.current) {
      const { current } = scrollRef;
      const scrollAmount = current.clientWidth * 0.8;
      current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="relative group/carousel">
      <motion.div
        key="games-view"
        ref={scrollRef}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        className="flex gap-3 overflow-x-auto pb-2 no-scrollbar scroll-smooth"
      >
        {games.map((game) => (
          <div 
            key={game.id}
            onClick={() => onSelectGame(game)}
            className="flex-shrink-0 w-24 flex flex-col gap-2 cursor-pointer group/game"
          >
            <div className="w-24 h-32 rounded-lg bg-slate-800 border border-white/10 overflow-hidden relative group-hover/game:border-blue-400/50 transition-colors">
              {game.image ? (
                <img src={game.image} alt={game.title} className="w-full h-full object-cover opacity-60 group-hover/game:opacity-100 transition-opacity" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white/20">
                  <Gamepad2 className="w-8 h-8" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
              <div className="absolute bottom-2 left-2 right-2 text-[10px] font-bold text-white leading-tight line-clamp-2">
                {game.title}
              </div>
            </div>
          </div>
        ))}
      </motion.div>
      
      {/* Left Arrow */}
      <button 
        onClick={(e) => { e.stopPropagation(); scroll('left'); }}
        className="absolute -left-2 top-16 -translate-y-1/2 z-20 w-6 h-6 bg-black/80 border border-white/20 rounded-full flex items-center justify-center opacity-0 group-hover/carousel:opacity-100 transition-opacity hover:bg-blue-600 hover:border-blue-400 text-white shadow-lg"
      >
        <ChevronLeft size={14} />
      </button>

      {/* Right Arrow */}
      <button 
        onClick={(e) => { e.stopPropagation(); scroll('right'); }}
        className="absolute -right-2 top-16 -translate-y-1/2 z-20 w-6 h-6 bg-black/80 border border-white/20 rounded-full flex items-center justify-center opacity-0 group-hover/carousel:opacity-100 transition-opacity hover:bg-blue-600 hover:border-blue-400 text-white shadow-lg"
      >
        <ChevronRight size={14} />
      </button>
    </div>
  );
};

const CardsCarousel = ({ genre, activeGame, onCardClick }) => {
  const scrollRef = useRef(null);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (!isHovered) return;
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        scroll('right');
      } else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        scroll('left');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isHovered]);

  const scroll = (direction) => {
    if (scrollRef.current) {
      const { current } = scrollRef;
      const scrollAmount = current.clientWidth * 0.5;
      current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div 
      className="relative group/cards"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Left Arrow - Outside, No Box */}
      <button 
        onClick={(e) => { e.stopPropagation(); scroll('left'); }}
        className="absolute -left-6 top-1/2 -translate-y-1/2 z-20 text-white/30 hover:text-white transition-colors opacity-0 group-hover/cards:opacity-100"
      >
        <ChevronLeft size={24} />
      </button>

      {/* Scroll Container */}
      <motion.div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto pb-2 no-scrollbar scroll-smooth px-1"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 20 }}
      >
        {/* Mock 10 cards for scroll */}
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="flex-shrink-0 w-[30%] min-w-[90px]">
            <ShinyCard 
              onClick={() => onCardClick && onCardClick({ 
                title: activeGame ? `${activeGame.title} Card ${i+1}` : `${genre} Card ${i+1}`, 
                id: `${genre}-${i}`,
                image: activeGame?.image
              })}
            />
          </div>
        ))}
      </motion.div>

      {/* Right Arrow - Outside, No Box */}
      <button 
        onClick={(e) => { e.stopPropagation(); scroll('right'); }}
        className="absolute -right-6 top-1/2 -translate-y-1/2 z-20 text-white/30 hover:text-white transition-colors opacity-0 group-hover/cards:opacity-100"
      >
        <ChevronRight size={24} />
      </button>
    </div>
  );
};

export default function LunaCardScroll({ onExpand, onCardClick }) {
  // State for pagination per genre
  const [pages, setPages] = useState({});
  // State for order of genres
  const [genres, setGenres] = useState(INITIAL_GENRES);
  
  // State for view mode per genre: 'cards' | 'games'
  const [viewModes, setViewModes] = useState({});
  // State for selected game filter per genre
  const [selectedGames, setSelectedGames] = useState({});

  const togglePage = (genre) => {
    setPages(prev => ({
      ...prev,
      [genre]: !prev[genre] ? 1 : 0
    }));
  };

  const toggleViewMode = (genre) => {
    setViewModes(prev => {
      const current = prev[genre] || 'cards';
      // If switching to games, clear selected game filter
      if (current === 'cards') {
        setSelectedGames(pg => ({ ...pg, [genre]: null }));
        return { ...prev, [genre]: 'games' };
      } else {
        return { ...prev, [genre]: 'cards' };
      }
    });
  };

  const selectGame = (genre, game) => {
    setSelectedGames(prev => ({ ...prev, [genre]: game }));
    setViewModes(prev => ({ ...prev, [genre]: 'cards' }));
  };

  const handleOnDragEnd = (result) => {
    if (!result.destination) return;

    if (result.type === 'GENRE_ROW') {
      const items = Array.from(genres);
      const [reorderedItem] = items.splice(result.source.index, 1);
      items.splice(result.destination.index, 0, reorderedItem);
      setGenres(items);
    }
  };

  return (
    <div className="w-80 h-[400px] flex flex-col mt-6">
      <DragDropContext onDragEnd={handleOnDragEnd}>
        {/* Scroll Container with custom scrollbar */}
        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
          <style>{`
            .custom-scrollbar::-webkit-scrollbar {
              width: 2px;
            }
            .custom-scrollbar::-webkit-scrollbar-track {
              background: rgba(255, 255, 255, 0.05);
            }
            .custom-scrollbar::-webkit-scrollbar-thumb {
              background: rgba(255, 255, 255, 0.3);
              border-radius: 10px;
            }
            .custom-scrollbar::-webkit-scrollbar-thumb:hover {
              background: rgba(255, 255, 255, 0.5);
            }
            .no-scrollbar::-webkit-scrollbar {
              display: none;
            }
            .no-scrollbar {
              -ms-overflow-style: none;
              scrollbar-width: none;
            }
          `}</style>

          <Droppable droppableId="genres-list" type="GENRE_ROW">
            {(provided) => (
              <div 
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="space-y-8 pb-4"
              >
                {genres.map((genre, index) => {
                  const viewMode = viewModes[genre] || 'cards';
                  const activeGame = selectedGames[genre];
                  const gamesList = MOCK_GAMES[genre] || MOCK_GAMES.default;

                  return (
                    <Draggable key={genre} draggableId={genre} index={index}>
                      {(providedDrag) => (
                        <div 
                          ref={providedDrag.innerRef}
                          {...providedDrag.draggableProps}
                          className="relative group"
                        >
                          <div className="flex items-center justify-between mb-3 pl-1">
                            <div className="flex items-center gap-2 overflow-hidden">
                              <h3 className="text-xs font-bold tracking-[0.2em] text-white/50 uppercase whitespace-nowrap">
                                {activeGame ? activeGame.title : genre}
                              </h3>
                              {activeGame && (
                                <button 
                                  onClick={() => {
                                    setSelectedGames(prev => ({ ...prev, [genre]: null }));
                                    setViewModes(prev => ({ ...prev, [genre]: 'games' }));
                                  }}
                                  className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded hover:bg-white/20 text-white/60 hover:text-white transition-colors flex items-center gap-1"
                                >
                                  <ChevronLeft className="w-3 h-3" /> Back
                                </button>
                              )}
                            </div>
                            
                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button 
                                onClick={() => toggleViewMode(genre)}
                                className={`transition-colors ${viewMode === 'games' ? 'text-blue-400' : 'text-white/40 hover:text-white'}`}
                                title={viewMode === 'cards' ? "View Games" : "View Cards"}
                              >
                                <Gamepad2 className="w-3 h-3" />
                              </button>

                              <button 
                                onClick={() => onExpand && onExpand(genre)}
                                className="text-white/40 hover:text-white transition-colors"
                                title="Expand View"
                              >
                                <Maximize2 className="w-3 h-3" />
                              </button>
                              
                              {/* Drag Handle */}
                              <div 
                                {...providedDrag.dragHandleProps}
                                className="cursor-grab active:cursor-grabbing p-1 hover:bg-white/5 rounded"
                              >
                                <GripVertical className="w-3 h-3 text-white/30 hover:text-white/60" />
                              </div>
                            </div>
                          </div>
                          
                          <div className="relative min-h-[120px]">
                            <AnimatePresence mode="wait">
                              {viewMode === 'games' ? (
                                <GamesCarousel 
                                  games={gamesList} 
                                  onSelectGame={(game) => selectGame(genre, game)} 
                                />
                              ) : (
                                <CardsCarousel 
                                  genre={genre}
                                  activeGame={activeGame}
                                  onCardClick={onCardClick}
                                />
                              )}
                            </AnimatePresence>
                          </div>
                        </div>
                      )}
                    </Draggable>
                  );
                })}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </div>
      </DragDropContext>
    </div>
  );
}
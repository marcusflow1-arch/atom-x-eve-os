import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Maximize2, ArrowRight, Circle, GripVertical } from 'lucide-react';
import ShinyCard from '../shared/ShinyCard';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

const INITIAL_GENRES = [
  "MMORPG",
  "RPG",
  "Fear",
  "Shooter",
  "Action",
  "Adventure",
  "Strategy",
  "Puzzle",
  "Racing",
  "Sports"
];

export default function LunaCardScroll({ onExpand, onCardClick }) {
  // State for pagination per genre
  const [pages, setPages] = useState({});
  // State for order of genres
  const [genres, setGenres] = useState(INITIAL_GENRES);

  const togglePage = (genre) => {
    setPages(prev => ({
      ...prev,
      [genre]: !prev[genre] ? 1 : 0
    }));
  };

  const handleOnDragEnd = (result) => {
    if (!result.destination) return;

    if (result.type === 'GENRE_ROW') {
      const items = Array.from(genres);
      const [reorderedItem] = items.splice(result.source.index, 1);
      items.splice(result.destination.index, 0, reorderedItem);
      setGenres(items);
    }
    // Note: Horizontal card dragging logic would go here if we implemented full cross-list DnD,
    // but for now we are focusing on row reordering as per request for "drag all four boxes upward".
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
          `}</style>

          <Droppable droppableId="genres-list" type="GENRE_ROW">
            {(provided) => (
              <div 
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="space-y-8 pb-4"
              >
                {genres.map((genre, index) => (
                  <Draggable key={genre} draggableId={genre} index={index}>
                    {(providedDrag) => (
                      <div 
                        ref={providedDrag.innerRef}
                        {...providedDrag.draggableProps}
                        className="relative group"
                      >
                        <div className="flex items-center justify-between mb-3 pl-1">
                          <h3 className="text-xs font-bold tracking-[0.2em] text-white/50 uppercase">{genre}</h3>
                          
                          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
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
                        
                        <div className="relative">
                          <div className="grid grid-cols-3 gap-3">
                            {/* Content changes based on page state */}
                            {Array.from({ length: 3 }).map((_, i) => (
                              <ShinyCard 
                                key={`${genre}-${pages[genre] || 0}-${i}`} 
                                onClick={() => onCardClick && onCardClick({ title: `${genre} Card ${i+1}`, id: `${genre}-${i}` })}
                              />
                            ))}
                          </div>

                          {/* Arrow for Pagination - Now for ALL genres */}
                          <div className="absolute right-0 top-0 bottom-0 w-12 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20 bg-gradient-to-l from-slate-900/80 to-transparent">
                            <button 
                              onClick={() => togglePage(genre)}
                              className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 flex items-center justify-center transition-all shadow-lg"
                            >
                              <ArrowRight className="w-4 h-4 text-white" />
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </div>
      </DragDropContext>
    </div>
  );
}
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Play, Maximize2 } from 'lucide-react';

/**
 * Game media gallery with fullscreen viewer
 * @param {Object} props
 * @param {Object} props.game - Game object
 * @param {Array} props.videos - Array of video objects
 * @param {Array} props.screenshots - Array of screenshot objects
 */
export default function GameMediaGallery({ game, videos = [], screenshots = [] }) {
  const [selectedMediaItem, setSelectedMediaItem] = useState(null);
  const [isViewingMedia, setIsViewingMedia] = useState(false);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [showNavArrows, setShowNavArrows] = useState(false);
  const [mouseTimeout, setMouseTimeout] = useState(null);

  const allMedia = [...videos, ...screenshots];

  // Auto-select first media item
  useEffect(() => {
    if (allMedia.length > 0 && !selectedMediaItem) {
      setSelectedMediaItem(allMedia[0]);
    }
  }, [game]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isViewingMedia) return;
      
      if (e.key === 'Escape') {
        setIsViewingMedia(false);
        setCurrentMediaIndex(0);
      } else if (e.key === 'ArrowLeft') {
        handlePrevious();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isViewingMedia, currentMediaIndex]);

  const handleMouseMove = () => {
    setShowNavArrows(true);
    if (mouseTimeout) clearTimeout(mouseTimeout);
    const timeout = setTimeout(() => setShowNavArrows(false), 2000);
    setMouseTimeout(timeout);
  };

  const handleNext = () => {
    setCurrentMediaIndex((prev) => (prev + 1) % allMedia.length);
  };

  const handlePrevious = () => {
    setCurrentMediaIndex((prev) => (prev - 1 + allMedia.length) % allMedia.length);
  };

  const handleFullscreen = () => {
    setIsViewingMedia(true);
  };

  return (
    <>
      {/* Media Preview */}
      {selectedMediaItem && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative bg-black/40 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden"
        >
          <div className="aspect-video relative">
            <img 
              src={selectedMediaItem.image || selectedMediaItem.icon || game.cover_image}
              alt={selectedMediaItem.title || selectedMediaItem.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            
            <button
              onClick={handleFullscreen}
              className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/60 backdrop-blur-md border border-white/20 flex items-center justify-center hover:bg-black/80 hover:scale-110 transition-all group"
            >
              <Maximize2 className="w-4 h-4 text-white group-hover:text-cyan-400" />
            </button>

            <div className="absolute bottom-0 left-0 right-0 p-4">
              <h4 className="text-white font-bold text-lg mb-1">
                {selectedMediaItem.title || selectedMediaItem.name}
              </h4>
              {selectedMediaItem.title && (
                <p className="text-white/60 text-sm">Click fullscreen to view in theater mode</p>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* Thumbnails */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
        {videos.map((video, i) => (
          <div 
            key={i}
            onClick={() => {
              setCurrentMediaIndex(i);
              setSelectedMediaItem(allMedia[i]);
            }}
            className={`relative w-32 aspect-video bg-black rounded-lg overflow-hidden cursor-pointer group border transition-all flex-shrink-0 ${
              selectedMediaItem === allMedia[i] ? 'border-cyan-400 ring-2 ring-cyan-400/30' : 'border-white/10 hover:border-cyan-400/30'
            }`}
          >
            <img 
              src={video.image} 
              alt={video.title}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 flex items-center justify-center transition-colors pointer-events-none">
              <Play className="w-4 h-4 text-white" />
            </div>
          </div>
        ))}
        {screenshots.map((screenshot, i) => (
          <div 
            key={i}
            onClick={() => {
              setCurrentMediaIndex(videos.length + i);
              setSelectedMediaItem(allMedia[videos.length + i]);
            }}
            className={`w-32 aspect-video bg-black rounded-md overflow-hidden cursor-pointer group flex-shrink-0 border transition-all ${
              selectedMediaItem === allMedia[videos.length + i] ? 'border-cyan-400 ring-2 ring-cyan-400/30' : 'border-white/10 hover:border-cyan-400/30'
            }`}
          >
            <img 
              src={screenshot.image} 
              alt={screenshot.title}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
            />
          </div>
        ))}
      </div>

      {/* Fullscreen Viewer */}
      <AnimatePresence>
        {isViewingMedia && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="fixed inset-0 z-[200]"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setIsViewingMedia(false);
              }
            }}
            onMouseMove={handleMouseMove}
          >
            <div className="absolute inset-0 bg-black">
              <img 
                src={allMedia[currentMediaIndex]?.image || allMedia[currentMediaIndex]?.icon || game.cover_image}
                alt={allMedia[currentMediaIndex]?.title || allMedia[currentMediaIndex]?.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/20" />
            </div>

            {/* Navigation Arrows */}
            <AnimatePresence>
              {showNavArrows && (
                <>
                  <motion.button
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    onClick={(e) => { e.stopPropagation(); handlePrevious(); }}
                    className="absolute left-8 top-1/2 -translate-y-1/2 w-16 h-16 rounded-full bg-black/40 backdrop-blur-md border border-white/20 flex items-center justify-center hover:bg-black/60 hover:scale-110 transition-all z-10"
                  >
                    <ChevronRight className="w-8 h-8 text-white rotate-180" />
                  </motion.button>

                  <motion.button
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    onClick={(e) => { e.stopPropagation(); handleNext(); }}
                    className="absolute right-8 top-1/2 -translate-y-1/2 w-16 h-16 rounded-full bg-black/40 backdrop-blur-md border border-white/20 flex items-center justify-center hover:bg-black/60 hover:scale-110 transition-all z-10"
                  >
                    <ChevronRight className="w-8 h-8 text-white" />
                  </motion.button>
                </>
              )}
            </AnimatePresence>

            {/* Info */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center"
              >
                <h3 className="text-white text-2xl font-bold mb-2">
                  {allMedia[currentMediaIndex]?.title || allMedia[currentMediaIndex]?.name}
                </h3>
                <p className="text-white/60 text-sm">
                  Use arrow keys or click arrows • ESC to exit
                </p>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
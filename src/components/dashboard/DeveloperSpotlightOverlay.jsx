import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Gamepad2, Users, Rocket, Layers, Star, Zap, BookOpen } from 'lucide-react';
import { MOCK_DEV_CARDS } from './DeveloperSpotlightRibbon';

const allCards = [
  ...MOCK_DEV_CARDS,
  { id: "devcard-5", gameThumbnail: "https://images.unsplash.com/photo-1519681577777-62842e439223?w=150&h=100&fit=crop&auto=format", developerName: "Moonstone Studios", cardTitle: "Mythic Saga: The Awakening", tag: "NEW", releaseDate: "2026-03-05", description: "Embark on an epic fantasy adventure and awaken your inner hero.", specifications: { engine: "Unity", features: ["Open World", "Magic System"], platforms: ["PC", "Xbox Series X"] }, treePath: "Fantasy > Ancient Prophecies", releaseNotes: "New characters, skill trees, and questline.", developerInfo: "Known for rich narratives and fantasy worlds.", unlockPrice: "29.99 AGP", coverImage: "https://images.unsplash.com/photo-1519681577777-62842e439223?q=80&w=1920" },
  { id: "devcard-6", gameThumbnail: "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=150&h=100&fit=crop&auto=format", developerName: "Pixel Pioneers", cardTitle: "Retroverse: Arcade Legends", tag: "LIMITED", releaseDate: "2026-03-20", description: "Classic arcade games reimagined with modern graphics and multiplayer.", specifications: { engine: "GameMaker", features: ["Retro Graphics", "Multiplayer"], platforms: ["PC", "Switch"] }, treePath: "Arcade > Classic Revivals", releaseNotes: "5 new arcade games and global leaderboards.", developerInfo: "Bringing retro gaming to a new generation.", unlockPrice: "14.99 AGP", coverImage: "https://images.unsplash.com/photo-1506196555132-723049b1ed1e?q=80&w=1920" },
  { id: "devcard-7", gameThumbnail: "https://images.unsplash.com/photo-1614732414444-096e5f1122d5?w=150&h=100&fit=crop&auto=format", developerName: "Chronos Games", cardTitle: "Time Rift: Paradox Unleashed", tag: "NEW", releaseDate: "2026-04-10", description: "Manipulate time to solve puzzles and uncover a conspiracy.", specifications: { engine: "Unreal Engine 4", features: ["Time Manipulation", "Physics Puzzles"], platforms: ["PC"] }, treePath: "Puzzle > Time Paradox", releaseNotes: "New time-bending mechanics.", developerInfo: "Innovative puzzle games with unique mechanics.", unlockPrice: "17.99 AGP", coverImage: "https://images.unsplash.com/photo-1533965935109-1736b42b6a03?q=80&w=1920" },
  { id: "devcard-8", gameThumbnail: "https://images.unsplash.com/photo-1505356829705-eb8b8f2d57c7?w=150&h=100&fit=crop&auto=format", developerName: "AstroNova Interactive", cardTitle: "Galactic Harvest: Asteroid Fields", tag: "UPDATE", releaseDate: "2026-02-25", description: "Mine rare resources in the Andromeda asteroid fields.", specifications: { engine: "Godot", features: ["Resource Management", "Space Mining"], platforms: ["PC"] }, treePath: "Simulation > Space Colonization", releaseNotes: "New asteroid types and colony modules.", developerInfo: "Deep and engaging simulation games.", unlockPrice: "Free Update", coverImage: "https://images.unsplash.com/photo-1505356829705-eb8b8f2d57c7?q=80&w=1920" },
];

function OverlayDevCard({ card, onClick, isSelected }) {
  return (
    <motion.div
      onClick={() => onClick(card)}
      whileHover={{ scale: 1.04 }}
      className={`relative w-full aspect-[4/3] rounded-xl overflow-hidden cursor-pointer transition-all ${isSelected ? 'ring-2 ring-cyan-400' : 'ring-1 ring-white/10 hover:ring-white/20'}`}
      style={{ background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)' }}
    >
      <img src={card.gameThumbnail} alt={card.cardTitle} className="w-full h-full object-cover absolute inset-0 opacity-40" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
      <div className="relative p-3 h-full flex flex-col justify-end">
        <div className="flex justify-between items-start mb-1">
          <span className="text-white text-sm font-bold leading-tight line-clamp-2">{card.cardTitle}</span>
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold flex-shrink-0 ml-1 ${card.tag === 'NEW' ? 'bg-green-500/20 text-green-300' : card.tag === 'LIMITED' ? 'bg-orange-500/20 text-orange-300' : 'bg-blue-500/20 text-blue-300'}`}>{card.tag}</span>
        </div>
        <p className="text-white/60 text-xs truncate">{card.developerName}</p>
      </div>
    </motion.div>
  );
}

function CardDetailPanel({ card, onClose }) {
  if (!card) return null;
  return (
    <motion.div
      initial={{ x: '100%' }} animate={{ x: '0%' }} exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="fixed right-0 top-0 bottom-0 w-[400px] bg-black/85 backdrop-blur-xl border-l border-white/10 p-8 flex flex-col z-50"
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-white text-xl font-bold">Card Details</h3>
        <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 text-white/60 hover:text-white"><X className="w-5 h-5" /></button>
      </div>
      <div className="flex-1 overflow-y-auto space-y-5" style={{ scrollbarWidth: 'none' }}>
        <div className="aspect-video rounded-xl overflow-hidden border border-white/10">
          <img src={card.coverImage || card.gameThumbnail} alt="" className="w-full h-full object-cover" />
        </div>
        <h2 className="text-white text-2xl font-bold">{card.cardTitle}</h2>
        <p className="text-white/60 text-sm">{card.developerName} &middot; {card.releaseDate}</p>
        <p className="text-white/80 text-sm leading-relaxed">{card.description}</p>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="bg-white/5 p-3 rounded-lg border border-white/10"><h4 className="text-white/50 text-xs mb-1 flex items-center gap-1"><Gamepad2 className="w-3 h-3" /> Engine</h4><p className="text-white">{card.specifications.engine}</p></div>
          <div className="bg-white/5 p-3 rounded-lg border border-white/10"><h4 className="text-white/50 text-xs mb-1 flex items-center gap-1"><Layers className="w-3 h-3" /> Features</h4><p className="text-white">{card.specifications.features.join(', ')}</p></div>
          <div className="bg-white/5 p-3 rounded-lg border border-white/10"><h4 className="text-white/50 text-xs mb-1 flex items-center gap-1"><Rocket className="w-3 h-3" /> Platforms</h4><p className="text-white">{card.specifications.platforms.join(', ')}</p></div>
          <div className="bg-white/5 p-3 rounded-lg border border-white/10"><h4 className="text-white/50 text-xs mb-1 flex items-center gap-1"><Zap className="w-3 h-3" /> Path</h4><p className="text-white">{card.treePath}</p></div>
        </div>
        <div><h4 className="text-white/50 text-xs mb-1 flex items-center gap-1"><BookOpen className="w-3 h-3" /> Release Notes</h4><p className="text-white/80 text-sm bg-white/5 p-3 rounded-lg border border-white/10">{card.releaseNotes}</p></div>
        <div><h4 className="text-white/50 text-xs mb-1 flex items-center gap-1"><Users className="w-3 h-3" /> Developer</h4><p className="text-white/80 text-sm bg-white/5 p-3 rounded-lg border border-white/10">{card.developerInfo}</p></div>
      </div>
      <div className="mt-5 flex gap-3">
        <button className="flex-1 py-3 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 font-bold rounded-xl border border-cyan-500/30 transition-colors">Unlock ({card.unlockPrice})</button>
        <button className="py-3 px-5 bg-white/5 hover:bg-white/10 text-white/70 rounded-xl border border-white/10 transition-colors"><Star className="w-5 h-5" /></button>
      </div>
    </motion.div>
  );
}

export default function DeveloperSpotlightOverlay({ onClose }) {
  const [selectedCard, setSelectedCard] = useState(null);

  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') { selectedCard ? setSelectedCard(null) : onClose(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [selectedCard, onClose]);

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[38] flex flex-col p-8 pointer-events-auto"
      style={{ background: 'rgba(8,12,18,0.95)', backdropFilter: 'blur(40px) saturate(150%)', WebkitBackdropFilter: 'blur(40px) saturate(150%)' }}
    >
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-white text-3xl font-black flex items-center gap-3"><Rocket className="w-7 h-7 text-cyan-400" /> Developer Spotlight</h1>
          <p className="text-white/50 text-sm ml-10">Live Developer Releases &middot; Press <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-[10px] font-mono border border-white/20">P</kbd> to toggle</p>
        </div>
        <button onClick={onClose} className="p-3 rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-colors"><X className="w-6 h-6" /></button>
      </div>
      <div className="flex-1 min-h-0 grid grid-cols-4 gap-6 overflow-hidden">
        <div className="col-span-1 flex flex-col bg-white/5 rounded-2xl p-5 border border-white/10">
          <h2 className="text-white/60 text-xs uppercase tracking-wider font-bold mb-4">Browse By</h2>
          <button className="w-full text-left p-3 rounded-lg flex items-center gap-3 bg-cyan-500/20 text-cyan-300"><Gamepad2 className="w-5 h-5" /> Games</button>
          <button className="w-full text-left p-3 rounded-lg flex items-center gap-3 text-white/50 hover:bg-white/5 hover:text-white mt-1"><Users className="w-5 h-5" /> Developers</button>
        </div>
        <div className="col-span-3 bg-white/5 rounded-2xl p-5 border border-white/10 overflow-y-auto grid grid-cols-3 gap-5" style={{ scrollbarWidth: 'none' }}>
          {allCards.map(card => <OverlayDevCard key={card.id} card={card} onClick={setSelectedCard} isSelected={selectedCard?.id === card.id} />)}
        </div>
      </div>
      <AnimatePresence>{selectedCard && <CardDetailPanel card={selectedCard} onClose={() => setSelectedCard(null)} />}</AnimatePresence>
    </motion.div>
  );
}
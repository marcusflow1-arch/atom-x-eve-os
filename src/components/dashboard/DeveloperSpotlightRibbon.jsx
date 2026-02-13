import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, Rocket } from 'lucide-react';

export const MOCK_DEV_CARDS = [
  { id: "devcard-1", gameThumbnail: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=150&h=100&fit=crop&auto=format", developerName: "Neon Dreams Studio", cardTitle: "Cyber Protocol 2.0: Resurgence", tag: "NEW", releaseDate: "2026-03-01", description: "Experience the next evolution of cybernetic warfare with new maps, weapons, and a gripping storyline.", specifications: { engine: "Unreal Engine 5", features: ["Ray Tracing", "DLSS 3.0"], platforms: ["PC", "PS5", "Xbox Series X"] }, treePath: "Cybernetics > Offensive Protocols > Resurgence Protocol", releaseNotes: "Major update with performance improvements, new character skins, and balance adjustments.", developerInfo: "Neon Dreams Studio is known for their innovative approach to sci-fi action games.", unlockPrice: "19.99 AGP", coverImage: "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=1920" },
  { id: "devcard-2", gameThumbnail: "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=150&h=100&fit=crop&auto=format", developerName: "Quantum Forge", cardTitle: "Void Runners: Nexus Expansion", tag: "LIMITED", releaseDate: "2026-03-15", description: "Unlock the secrets of the Void Nexus and command new Void-Forged mechs.", specifications: { engine: "Custom Engine", features: ["Procedural Generation", "Co-op Multiplayer"], platforms: ["PC"] }, treePath: "Void Exploration > Nexus Access > Void-Forged Mechs", releaseNotes: "Adds new biome, enemy types, and a limited-time event pass.", developerInfo: "Quantum Forge specializes in innovative indie titles.", unlockPrice: "9.99 AGP", coverImage: "https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=1920" },
  { id: "devcard-3", gameThumbnail: "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=150&h=100&fit=crop&auto=format", developerName: "Ancient Lore Studios", cardTitle: "Elden Ring: Echoes of the Past", tag: "NEW", releaseDate: "2026-04-01", description: "Delve into forgotten histories and face ancient evils in a new region.", specifications: { engine: "FromSoftware Engine", features: ["Open World", "New Bosses"], platforms: ["PC", "PS5", "Xbox Series X"] }, treePath: "Ancient Lore > Forgotten History > Echoes", releaseNotes: "New region, two major bosses, and new equipment.", developerInfo: "Renowned developer of action RPGs with deep lore.", unlockPrice: "24.99 AGP", coverImage: "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?q=80&w=1920" },
  { id: "devcard-4", gameThumbnail: "https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=150&h=100&fit=crop&auto=format", developerName: "Starfield Interactive", cardTitle: "Stellar Odyssey: Galactic Cores", tag: "UPDATE", releaseDate: "2026-02-20", description: "Explore the volatile Galactic Cores and engage in epic fleet battles.", specifications: { engine: "Unity", features: ["Exploration", "Fleet Management"], platforms: ["PC"] }, treePath: "Galactic Exploration > Core Systems", releaseNotes: "New star systems, faction missions, and balancing changes.", developerInfo: "Starfield Interactive crafts immersive space simulations.", unlockPrice: "Free Update", coverImage: "https://images.unsplash.com/photo-1552820728-8b83bb6b773f?q=80&w=1920" },
];

function DevCard({ card, onClick }) {
  const [isHovered, setIsHovered] = useState(false);
  return (
    <motion.div
      onClick={() => onClick(card)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={{ scale: 1.03 }}
      className="relative flex-shrink-0 w-48 h-28 rounded-xl overflow-hidden cursor-pointer"
      style={{
        background: 'rgba(255,255,255,0.05)',
        backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
        border: '1px solid rgba(255,255,255,0.1)',
        boxShadow: isHovered ? '0 0 15px rgba(34,211,238,0.2)' : '0 4px 15px rgba(0,0,0,0.3)'
      }}
    >
      <img src={card.gameThumbnail} alt={card.cardTitle} className="w-full h-full object-cover absolute inset-0 opacity-40" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
      {isHovered && <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/10 to-transparent pointer-events-none" />}
      <div className="relative p-3 h-full flex flex-col justify-end">
        <div className="flex justify-between items-start mb-1">
          <span className="text-white text-[11px] font-bold leading-tight line-clamp-2">{card.cardTitle}</span>
          <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-semibold flex-shrink-0 ml-1 ${card.tag === 'NEW' ? 'bg-green-500/20 text-green-300' : card.tag === 'LIMITED' ? 'bg-orange-500/20 text-orange-300' : 'bg-blue-500/20 text-blue-300'}`}>{card.tag}</span>
        </div>
        <p className="text-white/60 text-[10px] truncate">{card.developerName}</p>
      </div>
    </motion.div>
  );
}

export default function DeveloperSpotlightRibbon({ onOpenOverlay }) {
  const scrollRef = useRef(null);
  if (MOCK_DEV_CARDS.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="w-full rounded-2xl p-4 relative overflow-hidden group"
      style={{
        background: 'rgba(255,255,255,0.03)',
        backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.1)',
        boxShadow: 'inset 0 0 20px rgba(255,255,255,0.05), 0 8px 20px rgba(0,0,0,0.4)'
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-white font-bold text-sm flex items-center gap-2">
          <Rocket className="w-4 h-4 text-cyan-400" />
          Developer Spotlight
        </h2>
        <button onClick={onOpenOverlay} className="text-cyan-400 text-xs flex items-center group/btn hover:text-cyan-300 transition-colors">
          View All <ChevronRight className="w-3 h-3 ml-0.5 transform group-hover/btn:translate-x-1 transition-transform" />
        </button>
      </div>
      <div ref={scrollRef} className="flex gap-3 overflow-x-auto py-1" style={{ scrollbarWidth: 'none' }}>
        {MOCK_DEV_CARDS.map(card => <DevCard key={card.id} card={card} onClick={onOpenOverlay} />)}
      </div>
    </motion.div>
  );
}
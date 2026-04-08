import React, { useState } from 'react';
import { motion } from 'framer-motion';
import FarmCardBrowser from './FarmCardBrowser';
import FarmCardDetail from './FarmCardDetail';

export default function FarmTopicContent({ topic, gameId, gameTitle, isOwned, onJoinRoomRequest, intent }) {
  const [selectedCard, setSelectedCard] = useState(null);

  return (
    <div className="h-full flex">
      {/* LEFT: Card Browser */}
      <div className="w-[280px] flex-shrink-0 flex flex-col h-full" style={{
        borderRight: '1px solid rgba(255,255,255,0.04)',
        background: 'rgba(15, 20, 25, 0.3)',
      }}>
        <div className="px-3 pt-3 pb-2 flex-shrink-0">
          <h3 className="text-[10px] font-bold text-white/30 uppercase tracking-wider">Achievement Cards</h3>
        </div>
        <div className="flex-1 overflow-hidden">
          <FarmCardBrowser
            gameTitle={gameTitle}
            selectedCard={selectedCard}
            onSelectCard={setSelectedCard}
          />
        </div>
      </div>

      {/* RIGHT: Detail Panel */}
      <div className="flex-1 h-full overflow-hidden">
        <FarmCardDetail card={selectedCard} activeTopic={topic} gameTitle={gameTitle} />
      </div>
    </div>
  );
}
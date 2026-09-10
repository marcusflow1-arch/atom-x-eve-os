import React from 'react';
import ClanChatRailButton from '@/components/clan/ClanChatRailButton';

const recentSlots = [1, 2, 3, 4];

export default function GameChatRailSection() {
  return (
    <div className="game-chat-rail-section">
      <ClanChatRailButton />
      <div className="game-chat-rail-divider" />
      <span className="game-chat-rail-label">Recent<br />Game Chats</span>
      <div className="game-chat-recent-list">
        {recentSlots.map((slot) => (
          <div key={slot} className="game-chat-recent-slot" title="No recent game chat">
            <span>?</span>
          </div>
        ))}
      </div>
    </div>
  );
}
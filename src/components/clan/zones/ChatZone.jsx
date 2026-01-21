import React from 'react';
import ZoneChatPanel from '@/components/clan/shared/ZoneChatPanel';

export default function ChatZone({ game, clan, user }) {
    return (
        <div className="h-full w-full">
            <ZoneChatPanel 
                clanId={clan?.id} 
                gameId={game?.id} 
                zoneId="general" 
                title={`# ${game.title} - General`} 
                className="bg-transparent border-none"
            />
        </div>
    );
}
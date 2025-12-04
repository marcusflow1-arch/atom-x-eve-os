import React from 'react';
import { MessageSquare, Trophy, Globe, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ForumSidebar({ activeSection, onSectionChange, activeGame, onGameChange }) {
    
    return (
        <div className="w-full lg:w-64 flex-shrink-0 space-y-6">
            <div className="space-y-1">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider px-2 mb-2">
                    Main Channels
                </h3>
                <Button
                    variant="ghost"
                    className={`w-full justify-start ${activeSection === 'feed' ? 'bg-blue-600/20 text-blue-400' : 'text-slate-400'}`}
                    onClick={() => onSectionChange('feed')}
                >
                    <Activity className="w-4 h-4 mr-2" />
                    Community Feed
                </Button>
                <Button
                    variant="ghost"
                    className={`w-full justify-start ${activeSection === 'general_discussion' ? 'bg-blue-600/20 text-blue-400' : 'text-slate-400'}`}
                    onClick={() => onSectionChange('general_discussion')}
                >
                    <Globe className="w-4 h-4 mr-2" />
                    General Lounge
                </Button>
                <Button
                    variant="ghost"
                    className={`w-full justify-start ${activeSection === 'achievement_discussion' ? 'bg-blue-600/20 text-blue-400' : 'text-slate-400'}`}
                    onClick={() => onSectionChange('achievement_discussion')}
                >
                    <Trophy className="w-4 h-4 mr-2" />
                    Achievement Hunters
                </Button>
            </div>

            <div className="space-y-1">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider px-2 mb-2">
                    Game Forums
                </h3>
                {['Cyberpunk 2088', 'Neon Racer', 'Galactic Empire'].map(game => (
                    <Button
                        key={game}
                        variant="ghost"
                        className={`w-full justify-start ${activeGame === game ? 'bg-indigo-600/20 text-indigo-400' : 'text-slate-400'}`}
                        onClick={() => onGameChange(game)}
                    >
                        <div className="w-2 h-2 rounded-full bg-indigo-500 mr-2" />
                        {game}
                    </Button>
                ))}
            </div>
        </div>
    );
}
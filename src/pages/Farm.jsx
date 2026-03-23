import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import FarmHub from '@/components/farm/FarmHub';
import FarmGameView from '@/components/farm/FarmGameView';
import PageErrorBoundary from '@/components/error/PageErrorBoundary';
import { getFarmGameById } from '@/components/farm/farmData';
import GlassPageFrame from '@/components/shared/GlassPageFrame';
import ForumBottomNav from '@/components/community/ForumBottomNav';
import { createPageUrl } from '@/utils';

export default function FarmPage() {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const [view, setView] = useState('hub'); // 'hub' | 'game'
    const [selectedGame, setSelectedGame] = useState(null);

    // Save visited game to Recent Farm Games
    useEffect(() => {
        if (selectedGame) {
            try {
                const stored = JSON.parse(localStorage.getItem('recent_farm_games') || '[]');
                const filtered = stored.filter(g => g.name !== selectedGame.title);
                const toSave = [{
                    id: selectedGame.id,
                    name: selectedGame.title,
                    image: selectedGame.cover_image || selectedGame.banner_image || selectedGame.image || "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=100&q=80"
                }, ...filtered].slice(0, 5);
                
                localStorage.setItem('recent_farm_games', JSON.stringify(toSave));
                window.dispatchEvent(new Event('recentFarmGamesUpdated'));
            } catch (e) {
                console.error("Failed to save recent farm game", e);
            }
        }
    }, [selectedGame]);

    // Handle Deep Linking & Navigation Entry
    useEffect(() => {
        const gameId = searchParams.get('gameId');
        if (gameId) {
            const game = getFarmGameById(gameId);
            if (game) {
                setSelectedGame(game);
                setView('game');
            }
        } else {
            // Reset if no param (e.g. back navigation)
            if (view !== 'hub') {
                 // Keep current state if user is navigating within app, 
                 // but if they hit back to /Farm, maybe show Hub.
                 // For now, let's rely on manual state for in-app nav, 
                 // and params for initial load.
            }
        }
    }, [searchParams]);

    const handleSelectGame = (game) => {
        setSearchParams({ gameId: game.id });
        setSelectedGame(game);
        setView('game');
    };

    const handleBackToHub = () => {
        setSearchParams({});
        setView('hub');
        setTimeout(() => setSelectedGame(null), 300);
    };

    const handleTabSelect = (tabId) => {
        if (tabId === 'hub') {
            navigate(createPageUrl('Community'));
        } else if (tabId === 'farm_hub') {
            handleBackToHub();
        }
    };

    return (
        <PageErrorBoundary pageName="Farm">
            <GlassPageFrame bottomContent={<ForumBottomNav activeTab="farm_hub" onTabSelect={handleTabSelect} />}>
            <div 
                className="min-h-screen text-white overflow-hidden relative"
                style={{ background: 'linear-gradient(135deg, #0f1419 0%, #1a1f2e 25%, #0d1117 50%, #1a1f2e 75%, #0f1419 100%)' }}
            >
                {/* Ambient Background Elements */}
                <div className="absolute inset-0 pointer-events-none z-0">
                    <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-blue-400/5 rounded-full blur-[150px]" />
                    <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-cyan-300/5 rounded-full blur-[120px]" />
                </div>

                <div className="relative z-10 h-screen pt-16 flex flex-col">
                    <AnimatePresence mode="wait">
                        {view === 'hub' ? (
                            <motion.div 
                                key="hub"
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95, filter: 'blur(10px)' }}
                                transition={{ duration: 0.3 }}
                                className="flex-1 overflow-y-auto custom-scrollbar"
                            >
                                <div className="max-w-[1600px] mx-auto w-full">
                                    <FarmHub onSelectGame={handleSelectGame} />
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div 
                                key="game"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.3 }}
                                className="flex-1 h-full overflow-hidden"
                            >
                                <FarmGameView game={selectedGame} onBack={handleBackToHub} />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
            </GlassPageFrame>
        </PageErrorBoundary>
    );
}
import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import FarmHub from '@/components/farm/FarmHub';
import FarmGameView from '@/components/farm/FarmGameView';
import PageErrorBoundary from '@/components/error/PageErrorBoundary';

export default function FarmPage() {
    const [view, setView] = useState('hub'); // 'hub' | 'game'
    const [selectedGame, setSelectedGame] = useState(null);

    const handleSelectGame = (game) => {
        setSelectedGame(game);
        setView('game');
    };

    const handleBackToHub = () => {
        setView('hub');
        // Small delay to clear selection after animation starts if we were doing fancy transitions
        setTimeout(() => setSelectedGame(null), 300);
    };

    return (
        <PageErrorBoundary pageName="Farm">
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
        </PageErrorBoundary>
    );
}
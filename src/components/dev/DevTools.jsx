import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, Database, RefreshCw, Trash2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';

/**
 * Dev tools panel for development environment
 * Only visible in dev mode
 */
export default function DevTools() {
    const [isOpen, setIsOpen] = useState(false);
    const [useMockData, setUseMockData] = useState(false);
    const [seeding, setSeeding] = useState(false);

    useEffect(() => {
        const mockEnabled = window.localStorage.getItem('USE_MOCK_DATA') === 'true';
        setUseMockData(mockEnabled);
    }, []);

    const toggleMockData = () => {
        const newValue = !useMockData;
        window.localStorage.setItem('USE_MOCK_DATA', newValue.toString());
        setUseMockData(newValue);
        window.location.reload();
    };

    const seedDemoData = async () => {
        setSeeding(true);
        try {
            const response = await base44.functions.invoke('seedDemoData');
            alert(`Seeding complete!\nGames: ${response.results.games}\nAchievements: ${response.results.achievements}`);
            window.location.reload();
        } catch (error) {
            alert(`Seeding failed: ${error.message}`);
        }
        setSeeding(false);
    };

    const clearLocalStorage = () => {
        if (confirm('Clear all local storage? This will reset dev settings.')) {
            window.localStorage.clear();
            window.location.reload();
        }
    };

    // Only show in dev mode
    if (import.meta.env.PROD) return null;

    return (
        <>
            {/* Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="fixed bottom-4 right-4 w-12 h-12 bg-purple-600 hover:bg-purple-700 rounded-full shadow-lg flex items-center justify-center z-[100] transition-all"
                title="Dev Tools"
            >
                <Settings className="w-6 h-6 text-white" />
            </button>

            {/* Dev Panel */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, x: 100 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 100 }}
                        className="fixed bottom-20 right-4 w-80 bg-slate-900 border border-purple-500/30 rounded-xl shadow-2xl z-[100] p-4"
                    >
                        <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                            <Settings className="w-4 h-4" />
                            Dev Tools
                        </h3>

                        <div className="space-y-3">
                            {/* Mock Data Toggle */}
                            <div className="flex items-center justify-between p-3 bg-slate-800 rounded-lg">
                                <div>
                                    <p className="text-white text-sm font-medium">Use Mock Data</p>
                                    <p className="text-white/40 text-xs">Fallback to static data</p>
                                </div>
                                <button
                                    onClick={toggleMockData}
                                    className={`w-10 h-6 rounded-full transition-colors ${
                                        useMockData ? 'bg-purple-600' : 'bg-slate-600'
                                    }`}
                                >
                                    <div className={`w-4 h-4 bg-white rounded-full transition-transform ${
                                        useMockData ? 'translate-x-5' : 'translate-x-1'
                                    }`} />
                                </button>
                            </div>

                            {/* Seed Demo Data */}
                            <button
                                onClick={seedDemoData}
                                disabled={seeding}
                                className="w-full flex items-center justify-center gap-2 p-3 bg-green-600 hover:bg-green-700 disabled:bg-slate-700 disabled:text-slate-400 text-white rounded-lg transition-colors"
                            >
                                {seeding ? (
                                    <>
                                        <RefreshCw className="w-4 h-4 animate-spin" />
                                        Seeding...
                                    </>
                                ) : (
                                    <>
                                        <Database className="w-4 h-4" />
                                        Seed Demo Data
                                    </>
                                )}
                            </button>

                            {/* Clear Storage */}
                            <button
                                onClick={clearLocalStorage}
                                className="w-full flex items-center justify-center gap-2 p-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                            >
                                <Trash2 className="w-4 h-4" />
                                Clear Local Storage
                            </button>
                        </div>

                        <div className="mt-4 pt-4 border-t border-white/10">
                            <p className="text-white/30 text-xs text-center">
                                Dev mode only • Hidden in production
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
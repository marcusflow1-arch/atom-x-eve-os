
import React from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Search, Filter, ChevronRight, Mic, MicOff, X, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

export default function AchievementFilterBar({
    searchTerm,
    rarityFilter,
    statusFilter,
    categoryFilter,
    onSearch,
    onRarityChange,
    onStatusChange,
    onCategoryChange,
    // Achievement Tracker Integration
    isTrackingPanelVisible,
    onToggleTrackingPanel
}) {
    const [isListening, setIsListening] = React.useState(false);
    const [recognition, setRecognition] = React.useState(null);

    React.useEffect(() => {
        if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            const recognitionInstance = new SpeechRecognition();
            recognitionInstance.continuous = false;
            recognitionInstance.interimResults = false;
            recognitionInstance.lang = 'en-US';

            recognitionInstance.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                onSearch(transcript);
                setIsListening(false);
            };

            recognitionInstance.onerror = () => setIsListening(false);
            recognitionInstance.onend = () => setIsListening(false);

            setRecognition(recognitionInstance);
        }
    }, [onSearch]);

    const startListening = () => {
        if (recognition && !isListening) {
            setIsListening(true);
            recognition.start();
        }
    };

    // Options from the Achievement entity schema
    const rarities = ["Common", "Uncommon", "Rare", "Epic", "Legendary", "Mythical", "Unique", "Limitless"];
    const statuses = ["all", "unlocked", "locked"];
    const categories = ["standard", "ability", "emoji", "dance", "equipment", "companion", "hidden"];

    return (
        <div className="mb-6 space-y-4">
            {/* Info Banner */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-r from-blue-900/40 via-purple-900/40 to-pink-900/40 border border-blue-500/30 rounded-lg p-4"
            >
                <div className="flex items-center gap-3">
                    <Sparkles className="w-5 h-5 text-yellow-400" />
                    <p className="text-sm text-slate-200">
                        <span className="font-semibold text-white">Unlock achievements to claim rewards!</span> Each one adds abilities, equipment, or companions to your arsenal.
                    </p>
                </div>
            </motion.div>

            <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700/50 flex flex-wrap items-center gap-4">
                {/* Achievement Search Input with Voice */}
                <div className="relative flex-grow min-w-[200px] max-w-[300px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                        placeholder="Search achievements..."
                        value={searchTerm}
                        onChange={(e) => onSearch(e.target.value)}
                        className="bg-slate-900/70 border-slate-700 pl-9 pr-20 w-full"
                    />
                    {searchTerm && (
                        <Button
                            onClick={() => onSearch('')}
                            size="icon"
                            variant="ghost"
                            className="absolute right-10 top-1/2 -translate-y-1/2 h-6 w-6 text-slate-400"
                        >
                            <X className="w-3 h-3" />
                        </Button>
                    )}
                    <Button
                        onClick={startListening}
                        size="icon"
                        variant="ghost"
                        className={`absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 ${
                            isListening ? 'text-red-500 animate-pulse' : 'text-slate-400 hover:text-white'
                        }`}
                    >
                        {isListening ? <MicOff className="w-3 h-3" /> : <Mic className="w-3 h-3" />}
                    </Button>
                </div>

                {/* Rarity Filter */}
                <Select value={rarityFilter} onValueChange={onRarityChange}>
                    <SelectTrigger className="bg-slate-900/70 border-slate-700 w-full sm:w-[120px]">
                        <SelectValue placeholder="Rarity" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Rarities</SelectItem>
                        {rarities.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                    </SelectContent>
                </Select>

                {/* Status Filter */}
                <Select value={statusFilter} onValueChange={onStatusChange}>
                    <SelectTrigger className="bg-slate-900/70 border-slate-700 w-full sm:w-[120px]">
                        <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="unlocked">Unlocked</SelectItem>
                        <SelectItem value="locked">Locked</SelectItem>
                    </SelectContent>
                </Select>

                {/* Category Filter */}
                <Select value={categoryFilter} onValueChange={onCategoryChange}>
                    <SelectTrigger className="bg-slate-900/70 border-slate-700 w-full sm:w-[120px]">
                        <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        {categories.map(c => <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>)}
                    </SelectContent>
                </Select>

                {/* Achievement Tracker Toggle */}
                <div className="flex items-center gap-2 ml-auto">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 bg-slate-800/50 backdrop-blur-sm hover:bg-blue-600/20 border border-blue-500/30 text-blue-400 hover:text-blue-300"
                        onClick={onToggleTrackingPanel}
                    >
                        <ChevronRight className={`w-4 h-4 mr-2 transition-transform ${!isTrackingPanelVisible ? 'rotate-180' : ''}`} />
                        Achievement Tracking
                    </Button>
                </div>
            </div>
        </div>
    );
}

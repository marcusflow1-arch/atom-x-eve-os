import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Mic, Filter, Grid, Users, Mic2, Gamepad2, ChevronRight, Hash, Shield, Trophy, Target, Sparkles, MessageSquare, Plus, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import LiquidGlassCard from '@/components/shared/LiquidGlassCard';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

import { MOCK_FARM_GAMES } from './farmData';

export default function FarmHub({ onSelectGame }) {
    const [searchQuery, setSearchQuery] = useState('');
    const [isListening, setIsListening] = useState(false);
    const [filterOpen, setFilterOpen] = useState(false);
    
    // Filters
    const [genreFilter, setGenreFilter] = useState('all');
    const [activityFilter, setActivityFilter] = useState('any'); // any, high (>10k), medium (>5k)
    const [ownedOnly, setOwnedOnly] = useState(false);
    
    const recognitionRef = useRef(null);

    // Initialize Speech Recognition
    useEffect(() => {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = false;
            recognitionRef.current.interimResults = false;
            
            recognitionRef.current.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                setSearchQuery(transcript);
                setIsListening(false);
            };

            recognitionRef.current.onerror = (event) => {
                console.error("Speech recognition error", event.error);
                setIsListening(false);
            };
            
            recognitionRef.current.onend = () => {
                setIsListening(false);
            };
        }
    }, []);

    const toggleVoiceSearch = () => {
        if (!recognitionRef.current) {
            alert("Voice search is not supported in this browser.");
            return;
        }

        if (isListening) {
            recognitionRef.current.stop();
        } else {
            recognitionRef.current.start();
            setIsListening(true);
        }
    };
    
    // Logic: Apply filters before rendering
    const filteredGames = MOCK_FARM_GAMES.filter(g => {
        // 1. Search Query (Text or Voice result)
        const matchesSearch = g.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                              g.genre.toLowerCase().includes(searchQuery.toLowerCase());
        
        // 2. Genre Filter
        const matchesGenre = genreFilter === 'all' || g.genre === genreFilter;
        
        // 3. Activity Level
        let matchesActivity = true;
        if (activityFilter === 'high') matchesActivity = g.activeUsers > 15000;
        if (activityFilter === 'medium') matchesActivity = g.activeUsers > 5000 && g.activeUsers <= 15000;
        
        // 4. Owned Filter
        const matchesOwned = !ownedOnly || g.tags.includes('Owned');

        return matchesSearch && matchesGenre && matchesActivity && matchesOwned;
    });

    // Extract unique genres for filter
    const genres = ['all', ...new Set(MOCK_FARM_GAMES.map(g => g.genre))];

    return (
        <div className="flex flex-col gap-8 h-full">
            {/* Hero Search Section */}
            <div className="flex flex-col items-center justify-center pt-12 pb-6 gap-6 text-center px-4">
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-2"
                >
                    <h1 className="text-4xl font-bold text-white tracking-tight">Global Farm Hub</h1>
                    <p className="text-white/40 text-lg">Find your community. Join the harvest.</p>
                </motion.div>

                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="w-full max-w-2xl relative z-20"
                >
                    <div className="relative group">
                        <div className={`absolute inset-0 bg-blue-500/20 rounded-full blur-xl transition-opacity ${isListening ? 'opacity-100 animate-pulse' : 'opacity-0 group-hover:opacity-100'}`} />
                        <Input 
                            className="w-full h-14 pl-12 pr-12 rounded-full bg-white/5 border-white/10 text-lg text-white placeholder:text-white/30 focus:border-blue-400/50 focus:bg-white/10 transition-all shadow-xl"
                            placeholder={isListening ? "Listening..." : "Search for a game..."}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 w-5 h-5" />
                        
                        <button 
                            onClick={toggleVoiceSearch}
                            className={`absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full transition-all ${
                                isListening ? 'bg-red-500/20 text-red-400' : 'hover:bg-white/10 text-white/40 hover:text-white'
                            }`}
                        >
                            {isListening ? <Loader2 className="w-5 h-5 animate-spin" /> : <Mic className="w-5 h-5" />}
                        </button>
                    </div>
                </motion.div>

                {/* Filter Toggles */}
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="w-full max-w-2xl"
                >
                    <div className="flex items-center justify-center gap-2 mb-4">
                         <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => setFilterOpen(!filterOpen)}
                            className={`rounded-full gap-2 transition-all ${filterOpen ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
                        >
                            <Filter className="w-4 h-4" />
                            Filters
                            {filterOpen ? <ChevronRight className="w-4 h-4 rotate-90" /> : <ChevronRight className="w-4 h-4" />}
                        </Button>
                        
                        {/* Quick Filter Chips (visible even if closed) */}
                        {!filterOpen && (
                             <div className="flex gap-2">
                                {ownedOnly && (
                                    <Badge variant="secondary" className="bg-blue-500/20 text-blue-300 border-blue-500/30 flex gap-1 items-center cursor-pointer" onClick={() => setOwnedOnly(false)}>
                                        Owned <X className="w-3 h-3" />
                                    </Badge>
                                )}
                                {genreFilter !== 'all' && (
                                    <Badge variant="secondary" className="bg-purple-500/20 text-purple-300 border-purple-500/30 flex gap-1 items-center cursor-pointer" onClick={() => setGenreFilter('all')}>
                                        {genreFilter} <X className="w-3 h-3" />
                                    </Badge>
                                )}
                             </div>
                        )}
                    </div>

                    <AnimatePresence>
                        {filterOpen && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                            >
                                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 grid grid-cols-1 md:grid-cols-3 gap-6 text-left backdrop-blur-md">
                                    
                                    {/* Genre Filter */}
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold text-white/40 uppercase tracking-wider">Genre</Label>
                                        <Select value={genreFilter} onValueChange={setGenreFilter}>
                                            <SelectTrigger className="bg-black/20 border-white/10 text-white">
                                                <SelectValue placeholder="All Genres" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {genres.map(g => (
                                                    <SelectItem key={g} value={g} className="capitalize">
                                                        {g === 'all' ? 'All Genres' : g}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {/* Activity Filter */}
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold text-white/40 uppercase tracking-wider">Activity</Label>
                                        <Select value={activityFilter} onValueChange={setActivityFilter}>
                                            <SelectTrigger className="bg-black/20 border-white/10 text-white">
                                                <SelectValue placeholder="Any Activity" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="any">Any Activity</SelectItem>
                                                <SelectItem value="medium">Medium (&gt; 5k)</SelectItem>
                                                <SelectItem value="high">High (&gt; 15k)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {/* Owned Toggle */}
                                    <div className="space-y-2 flex flex-col justify-center">
                                        <Label className="text-xs font-bold text-white/40 uppercase tracking-wider mb-2">Ownership</Label>
                                        <div className="flex items-center gap-3">
                                            <Switch 
                                                checked={ownedOnly} 
                                                onCheckedChange={setOwnedOnly} 
                                                id="owned-mode"
                                            />
                                            <Label htmlFor="owned-mode" className="text-sm font-medium text-white cursor-pointer">
                                                Show Owned Games Only
                                            </Label>
                                        </div>
                                    </div>

                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            </div>

            {/* Game Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-20 px-4">
                {filteredGames.length > 0 ? (
                    filteredGames.map((game, i) => (
                        <motion.div
                            key={game.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.05 }}
                        >
                            <LiquidGlassCard 
                                className="h-full flex flex-col group cursor-pointer hover:border-blue-500/30 transition-all overflow-hidden"
                                onClick={() => onSelectGame(game)}
                            >
                                {/* Card Image */}
                                <div className="h-40 w-full relative overflow-hidden">
                                    <div className="absolute inset-0 bg-gradient-to-t from-[#0f1419] to-transparent z-10" />
                                    <img 
                                        src={game.image} 
                                        alt={game.title}
                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                    />
                                    {game.tags.includes('Owned') && (
                                        <div className="absolute top-2 right-2 z-20">
                                            <Badge className="bg-blue-500/80 hover:bg-blue-500 backdrop-blur-sm border-0">OWNED</Badge>
                                        </div>
                                    )}
                                </div>

                                {/* Card Content */}
                                <div className="p-5 flex flex-col gap-4 flex-1">
                                    <div>
                                        <h3 className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors">{game.title}</h3>
                                        <p className="text-white/40 text-sm">{game.genre}</p>
                                    </div>

                                    <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/5">
                                        <div className="flex items-center gap-2 text-white/60 text-xs font-medium">
                                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                            {game.activeUsers.toLocaleString()} online
                                        </div>
                                        <div className="flex items-center gap-2 text-white/40 text-xs">
                                            <Mic2 className="w-3 h-3" />
                                            {game.voiceRooms} rooms
                                        </div>
                                    </div>
                                </div>
                            </LiquidGlassCard>
                        </motion.div>
                    ))
                ) : (
                    <div className="col-span-full flex flex-col items-center justify-center py-20 text-white/30">
                        <Gamepad2 className="w-12 h-12 mb-4 opacity-50" />
                        <p className="text-lg font-medium">No games found</p>
                        <p className="text-sm opacity-50">Try adjusting your search or filters</p>
                        <Button 
                            variant="link" 
                            className="text-blue-400 mt-2"
                            onClick={() => { 
                                setSearchQuery(''); 
                                setGenreFilter('all');
                                setActivityFilter('any');
                                setOwnedOnly(false);
                            }}
                        >
                            Clear all filters
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
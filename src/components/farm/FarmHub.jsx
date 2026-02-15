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
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export default function FarmHub({ onSelectGame }) {
    const [searchQuery, setSearchQuery] = useState('');
    const [isListening, setIsListening] = useState(false);
    const [filterOpen, setFilterOpen] = useState(false);
    const [genreFilter, setGenreFilter] = useState('all');
    const [activityFilter, setActivityFilter] = useState('any');
    const recognitionRef = useRef(null);

    // Fetch real games from the database
    const { data: games = [], isLoading } = useQuery({
        queryKey: ['farmGames'],
        queryFn: async () => {
            const gamesList = await base44.entities.Game.list('-created_date', 100);
            return (gamesList || []).map(g => ({
                id: g.id,
                title: g.title,
                genre: g.genre || 'Other',
                activeUsers: Math.floor(Math.random() * 50000) + 500,
                voiceRooms: Math.floor(Math.random() * 100) + 5,
                image: g.cover_image || g.banner_image || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&q=80',
                tags: g.status === 'available' ? ['Available'] : [],
            }));
        },
    });

    useEffect(() => {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = false;
            recognitionRef.current.interimResults = false;
            recognitionRef.current.onresult = (event) => { setSearchQuery(event.results[0][0].transcript); setIsListening(false); };
            recognitionRef.current.onerror = () => setIsListening(false);
            recognitionRef.current.onend = () => setIsListening(false);
        }
    }, []);

    const toggleVoiceSearch = () => {
        if (!recognitionRef.current) { return; }
        if (isListening) { recognitionRef.current.stop(); } else { recognitionRef.current.start(); setIsListening(true); }
    };
    
    const filteredGames = games.filter(g => {
        const matchesSearch = g.title.toLowerCase().includes(searchQuery.toLowerCase()) || g.genre.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesGenre = genreFilter === 'all' || g.genre === genreFilter;
        let matchesActivity = true;
        if (activityFilter === 'high') matchesActivity = g.activeUsers > 15000;
        if (activityFilter === 'medium') matchesActivity = g.activeUsers > 5000 && g.activeUsers <= 15000;
        return matchesSearch && matchesGenre && matchesActivity;
    });

    const genres = ['all', ...new Set(games.map(g => g.genre))];

    return (
        <div className="flex flex-col gap-8 h-full">
            <div className="flex flex-col items-center justify-center pt-12 pb-6 gap-6 text-center px-4">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
                    <h1 className="text-4xl font-bold text-white tracking-tight">Global Farm Hub</h1>
                    <p className="text-white/40 text-lg">Find your community. Join the harvest.</p>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="w-full max-w-2xl relative z-20">
                    <div className="relative group">
                        <div className={`absolute inset-0 bg-blue-500/20 rounded-full blur-xl transition-opacity ${isListening ? 'opacity-100 animate-pulse' : 'opacity-0 group-hover:opacity-100'}`} />
                        <Input className="w-full h-14 pl-12 pr-12 rounded-full bg-white/5 border-white/10 text-lg text-white placeholder:text-white/30 focus:border-blue-400/50 focus:bg-white/10 transition-all shadow-xl"
                            placeholder={isListening ? "Listening..." : "Search for a game..."} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 w-5 h-5" />
                        <button onClick={toggleVoiceSearch} className={`absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full transition-all ${isListening ? 'bg-red-500/20 text-red-400' : 'hover:bg-white/10 text-white/40 hover:text-white'}`}>
                            {isListening ? <Loader2 className="w-5 h-5 animate-spin" /> : <Mic className="w-5 h-5" />}
                        </button>
                    </div>
                </motion.div>

                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="w-full max-w-2xl">
                    <div className="flex items-center justify-center gap-2 mb-4">
                         <Button variant="ghost" size="sm" onClick={() => setFilterOpen(!filterOpen)} className={`rounded-full gap-2 transition-all ${filterOpen ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white hover:bg-white/5'}`}>
                            <Filter className="w-4 h-4" /> Filters
                            {filterOpen ? <ChevronRight className="w-4 h-4 rotate-90" /> : <ChevronRight className="w-4 h-4" />}
                        </Button>
                        {!filterOpen && genreFilter !== 'all' && (
                            <Badge variant="secondary" className="bg-purple-500/20 text-purple-300 border-purple-500/30 flex gap-1 items-center cursor-pointer" onClick={() => setGenreFilter('all')}>
                                {genreFilter} <X className="w-3 h-3" />
                            </Badge>
                        )}
                    </div>
                    <AnimatePresence>
                        {filterOpen && (
                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 grid grid-cols-1 md:grid-cols-2 gap-6 text-left backdrop-blur-md">
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold text-white/40 uppercase tracking-wider">Genre</Label>
                                        <Select value={genreFilter} onValueChange={setGenreFilter}>
                                            <SelectTrigger className="bg-black/20 border-white/10 text-white"><SelectValue placeholder="All Genres" /></SelectTrigger>
                                            <SelectContent>
                                                {genres.map(g => (<SelectItem key={g} value={g} className="capitalize">{g === 'all' ? 'All Genres' : g}</SelectItem>))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold text-white/40 uppercase tracking-wider">Activity</Label>
                                        <Select value={activityFilter} onValueChange={setActivityFilter}>
                                            <SelectTrigger className="bg-black/20 border-white/10 text-white"><SelectValue placeholder="Any Activity" /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="any">Any Activity</SelectItem>
                                                <SelectItem value="medium">Medium (&gt; 5k)</SelectItem>
                                                <SelectItem value="high">High (&gt; 15k)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            </div>

            {isLoading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 text-white/30 animate-spin" />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-20 px-4">
                    {filteredGames.length > 0 ? (
                        filteredGames.map((game, i) => (
                            <motion.div key={game.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.03 }}>
                                <LiquidGlassCard className="h-full flex flex-col group cursor-pointer hover:border-blue-500/30 transition-all overflow-hidden" onClick={() => onSelectGame(game)}>
                                    <div className="h-40 w-full relative overflow-hidden">
                                        <div className="absolute inset-0 bg-gradient-to-t from-[#0f1419] to-transparent z-10" />
                                        <img src={game.image} alt={game.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                    </div>
                                    <div className="p-5 flex flex-col gap-4 flex-1">
                                        <div>
                                            <h3 className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors">{game.title}</h3>
                                            <p className="text-white/40 text-sm capitalize">{game.genre}</p>
                                        </div>
                                        <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/5">
                                            <div className="flex items-center gap-2 text-white/60 text-xs font-medium">
                                                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                                {game.activeUsers.toLocaleString()} online
                                            </div>
                                            <div className="flex items-center gap-2 text-white/40 text-xs">
                                                <Mic2 className="w-3 h-3" /> {game.voiceRooms} rooms
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
                            <Button variant="link" className="text-blue-400 mt-2" onClick={() => { setSearchQuery(''); setGenreFilter('all'); setActivityFilter('any'); }}>Clear all filters</Button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
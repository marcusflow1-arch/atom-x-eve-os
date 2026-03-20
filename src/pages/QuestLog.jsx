import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, Gamepad2, Pin, Trophy, ChevronRight, Target, Crosshair, Swords, Zap, CheckCircle2, Clock, Calendar, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import PageErrorBoundary from '@/components/error/PageErrorBoundary';

// Mock Data (Shared source ideally, but duplicated for now to ensure standalone function)
const GAMES_DATA = [
  {
    id: 'cyberpunk',
    title: 'Cyberpunk 2077',
    genre: 'RPG',
    image: 'https://images.unsplash.com/photo-1605901309584-818e25960b8f?w=800&q=80',
    quests: [
      { 
        id: 'cp1', title: 'Street Cred', desc: 'Reach 50 Street Cred', 
        lore: 'Night City respects power and reputation. Make a name for yourself in the afterlife and the streets to unlock better gear and cyberware from ripperdocs.', 
        objectives: [{text: 'Complete gigs for fixers', progress: 12, total: 20}, {text: 'Defeat gang members', progress: 45, total: 100}], 
        rewards: ['500 XP', 'Iconic Jacket'], progress: 42, total: 50, rarity: 'Epic', xp: 500, status: 'Active' 
      },
      { 
        id: 'cp2', title: 'Cyberpsycho Sighting', desc: 'Neutralize 10 Cyberpsychos', 
        lore: 'Regina needs you to investigate recent cyberpsycho attacks. Try to take them alive if possible, MaxTac is watching.', 
        objectives: [{text: 'Find cyberpsycho locations', progress: 4, total: 10}, {text: 'Send info to Regina', progress: 4, total: 10}], 
        rewards: ['300 XP', 'Legendary Mod'], progress: 4, total: 10, rarity: 'Rare', xp: 300, status: 'Active' 
      },
      { 
        id: 'cp6', title: 'Joytoy', desc: 'Visit Jig-Jig Street', 
        lore: 'Sometimes you just need to relax. Take a walk down Jig-Jig street.', 
        objectives: [{text: 'Enter the district', progress: 1, total: 1}], 
        rewards: ['100 XP'], progress: 1, total: 1, rarity: 'Common', xp: 100, status: 'Completed', complete: true 
      },
    ]
  },
  {
    id: 'elden_ring',
    title: 'Elden Ring',
    genre: 'RPG',
    image: 'https://images.unsplash.com/photo-1593305841991-05c297bb45ec?w=800&q=80',
    quests: [
      { 
        id: 'er1', title: 'Shardbearer', desc: 'Defeat 2 Shardbearers', 
        lore: 'The demigods hold the shards of the Elden Ring. Claim their Great Runes to gain audience with the Two Fingers.', 
        objectives: [{text: 'Defeat Godrick', progress: 1, total: 1}, {text: 'Defeat Rennala', progress: 0, total: 1}], 
        rewards: ['2000 XP', 'Great Rune'], progress: 1, total: 2, rarity: 'Legendary', xp: 2000, status: 'Active' 
      },
      { 
        id: 'er2', title: 'Ranni\'s Aid', desc: 'Serve Ranni the Witch', 
        lore: 'Seek the dark moon. Enter her service and discover the hidden truth of the Lands Between.', 
        objectives: [{text: 'Meet at Ranni\'s Rise', progress: 0, total: 1}], 
        rewards: ['800 XP', 'Dark Moon Greatsword'], progress: 0, total: 1, rarity: 'Epic', xp: 800, status: 'Locked' 
      },
    ]
  },
  {
    id: 'apex',
    title: 'Apex Legends',
    genre: 'FPS',
    image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&q=80',
    quests: [
      { 
        id: 'al1', title: 'Champion', desc: 'Win a Battle Royale match', 
        lore: 'Prove you have what it takes to be an Apex Champion in the Outlands.', 
        objectives: [{text: 'Survive to the end', progress: 3, total: 5}], 
        rewards: ['600 XP', 'Apex Pack'], progress: 3, total: 5, rarity: 'Epic', xp: 600, status: 'Active' 
      },
      { 
        id: 'al2', title: 'Damage Dealer', desc: 'Deal 2000 damage in one game', 
        lore: 'Drop hot and shoot everything that moves.', 
        objectives: [{text: 'Deal damage to enemy players', progress: 1450, total: 2000}], 
        rewards: ['300 XP', 'Damage Badge'], progress: 1450, total: 2000, rarity: 'Rare', xp: 300, status: 'Active' 
      },
    ]
  },
  {
    id: 'general',
    title: 'Galactic Directives',
    genre: 'Misc',
    image: 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=800&q=80',
    quests: [
      { 
        id: 'g1', title: 'Social Alliance', desc: 'Join 2 clan events', 
        lore: 'The Republic requires strong alliances to stand against the Empire. Gather your companions and coordinate your efforts.', 
        objectives: [{text: 'Participate in Flashpoint', progress: 1, total: 1}, {text: 'Participate in Operation', progress: 0, total: 1}], 
        rewards: ['100 XP', 'Fleet Commendations'], progress: 1, total: 2, rarity: 'Common', xp: 100, status: 'Active' 
      },
      { 
        id: 'g2', title: 'Night Operation', desc: 'Play after midnight', 
        lore: 'Some missions require the cover of darkness. Execute operations during standard night cycles.', 
        objectives: [{text: 'Log in between 00:00 and 04:00', progress: 6, total: 10}], 
        rewards: ['150 XP', 'Covert Title'], progress: 6, total: 10, rarity: 'Common', xp: 150, status: 'Active' 
      },
      { 
        id: 'g4', title: 'Daily Login', desc: 'Login 7 days in a row', 
        lore: 'Consistent effort yields the highest rewards in the galaxy.', 
        objectives: [{text: 'Log in daily', progress: 3, total: 7}], 
        rewards: ['50 XP', 'Supply Crate'], progress: 3, total: 7, rarity: 'Common', xp: 50, status: 'Active' 
      },
    ]
  }
];

export default function QuestLog({ isEmbedded, onClose, initialGame }) {
  const navigate = useNavigate();
  const [activeGameId, setActiveGameId] = useState(initialGame || 'cyberpunk');
  const [pinnedGameId, setPinnedGameId] = useState(() => localStorage.getItem('luna_pinned_quest_game') || 'cyberpunk');
  const [genreFilter, setGenreFilter] = useState('All');
  const [expandedQuestId, setExpandedQuestId] = useState(null);

  useEffect(() => {
    if (initialGame) {
      setActiveGameId(initialGame);
    }
  }, [initialGame]);

  const activeGame = GAMES_DATA.find(g => g.id === activeGameId) || GAMES_DATA[0];

  const handlePinGame = (id) => {
    setPinnedGameId(id);
    localStorage.setItem('luna_pinned_quest_game', id);
  };

  const filteredGames = GAMES_DATA.filter(g => genreFilter === 'All' || g.genre === genreFilter);

  // Statistics
  const totalQuests = activeGame.quests.length;
  const completedQuests = activeGame.quests.filter(q => q.complete).length;
  const progressPercent = Math.round((completedQuests / totalQuests) * 100);

  const swtorColors = {
    bg: 'bg-[#060a12]',
    panel: 'bg-[#0d1522]',
    panelBorder: 'border-[#1b3652]',
    panelGlow: 'shadow-[0_0_15px_rgba(27,54,82,0.6)]',
    textPrimary: 'text-[#8caecc]',
    textTitle: 'text-[#e5c56d]',
    accentCyan: 'text-[#00f0ff]',
    borderHighlight: 'border-[#4288cc]',
    progressBg: 'bg-[#080d16]',
    progressFill: 'bg-[#dfa732]',
  };

  return (
    <PageErrorBoundary pageName="QuestLog">
      <div 
        className={isEmbedded ? `w-full h-full p-6 flex flex-col overflow-hidden ${swtorColors.bg} text-white font-sans relative` : `min-h-screen w-full ${swtorColors.bg} text-white pt-24 px-8 pb-8 flex flex-col relative`}
      >
        {/* Holographic grid background */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(#4288cc 1px, transparent 1px), linear-gradient(90deg, #4288cc 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

        {/* SWTOR-style Header Area */}
        <div className="flex items-center justify-between mb-8 relative z-10 border-b-2 border-[#1b3652] pb-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-[#0d1522] border border-[#e5c56d] rounded-sm flex items-center justify-center shadow-[0_0_10px_rgba(229,197,109,0.3)]">
              <FileText className="w-6 h-6 text-[#e5c56d]" />
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-widest text-[#e5c56d] uppercase drop-shadow-[0_0_5px_rgba(229,197,109,0.5)]">Mission Log</h1>
              <p className="text-[#8caecc] text-sm uppercase tracking-widest font-semibold">Datapad // Directives & Bounties</p>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="bg-[#0d1522] border border-[#1b3652] rounded-sm px-4 py-2 flex items-center gap-3">
              <div className="text-right">
                <span className="block text-[10px] text-[#8caecc] uppercase tracking-wider">Legacy XP Earned</span>
                <span className="block text-lg font-bold text-[#e5c56d] font-mono tracking-wider">12,450</span>
              </div>
              <div className="w-8 h-8 rounded-sm bg-[#e5c56d]/10 flex items-center justify-center border border-[#e5c56d]/30">
                <Zap className="w-4 h-4 text-[#e5c56d]" />
              </div>
            </div>
            
            <Button 
              onClick={() => isEmbedded && onClose ? onClose() : navigate(createPageUrl('LunaTemplate'))} 
              variant="outline" 
              className="bg-[#0d1522] border-[#1b3652] hover:bg-[#152336] text-[#8caecc] hover:text-white rounded-sm font-semibold uppercase tracking-wider text-xs"
            >
              {isEmbedded ? 'Close Terminal' : 'Return to Ship'}
            </Button>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="flex-1 grid grid-cols-12 gap-8 min-h-0 relative z-10">
          
          {/* LEFT SIDEBAR: Categories/Games */}
          <div className="col-span-4 flex flex-col gap-4">
            {/* Search & Filter */}
            <div className="bg-[#0d1522] p-4 rounded-sm border border-[#1b3652] shadow-[0_0_10px_rgba(0,0,0,0.5)]">
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4288cc]" />
                <input 
                  type="text" 
                  placeholder="Query Database..." 
                  className="w-full bg-[#060a12] border border-[#1b3652] rounded-sm py-2.5 pl-10 pr-4 text-sm text-[#e2f1ff] placeholder:text-[#4288cc]/50 focus:outline-none focus:border-[#4288cc] transition-colors font-mono"
                />
              </div>
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {['All', 'RPG', 'FPS', 'Misc'].map(genre => (
                  <button
                    key={genre}
                    onClick={() => setGenreFilter(genre)}
                    className={`px-3 py-1.5 rounded-sm text-[10px] font-bold uppercase tracking-wider transition-all whitespace-nowrap border ${
                      genreFilter === genre 
                        ? 'bg-[#1b3652] text-white border-[#4288cc] shadow-[0_0_8px_rgba(66,136,204,0.4)]' 
                        : 'bg-transparent text-[#8caecc] border-[#1b3652] hover:bg-[#152336] hover:text-white'
                    }`}
                  >
                    {genre}
                  </button>
                ))}
              </div>
            </div>

            {/* Missions List Header */}
            <div className="flex items-center gap-2 text-[#e5c56d] font-bold uppercase tracking-widest text-sm px-2 mt-2">
              <Hexagon className="w-4 h-4" />
              <span>Active Directories</span>
              <div className="flex-1 h-px bg-gradient-to-r from-[#e5c56d]/50 to-transparent ml-2" />
            </div>

            {/* Games List */}
            <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar pr-2 pb-4">
              {filteredGames.map(game => (
                <button
                  key={game.id}
                  onClick={() => setActiveGameId(game.id)}
                  className={`w-full p-3 flex items-center gap-4 transition-all group relative border-l-4 ${
                    activeGameId === game.id 
                      ? 'bg-gradient-to-r from-[#152336] to-transparent border-l-[#e5c56d] shadow-[inset_20px_0_20px_-20px_rgba(229,197,109,0.3)]' 
                      : 'bg-[#0d1522] border-l-[#1b3652] hover:bg-[#111c2c] hover:border-l-[#4288cc]'
                  }`}
                >
                  <div className={`w-12 h-12 rounded-sm bg-cover bg-center border ${activeGameId === game.id ? 'border-[#e5c56d]' : 'border-[#1b3652]'}`} style={{ backgroundImage: `url(${game.image})` }} />
                  <div className="flex-1 text-left min-w-0">
                    <div className={`font-bold text-sm truncate uppercase tracking-wider ${activeGameId === game.id ? 'text-[#e5c56d]' : 'text-[#8caecc] group-hover:text-white'}`}>{game.title}</div>
                    <div className="flex items-center gap-3 mt-1 text-[10px] text-[#4288cc] font-mono">
                      <span>{game.genre}</span>
                      <span className="text-[#1b3652]">|</span>
                      <span>{game.quests.filter(q => q.complete).length}/{game.quests.length} COMPLETED</span>
                    </div>
                  </div>
                  {pinnedGameId === game.id && <Pin className="w-3 h-3 text-[#e5c56d] absolute top-2 right-2" fill="currentColor" />}
                </button>
              ))}
            </div>
          </div>

          {/* RIGHT CONTENT: Quests & Details */}
          <div className="col-span-8 flex flex-col gap-6">
            
            {/* Game Header Area - SWTOR style */}
            <div className="bg-[#0d1522] border border-[#1b3652] rounded-sm p-6 relative overflow-hidden shadow-[0_0_20px_rgba(0,0,0,0.5)] shrink-0">
              <div className="absolute top-0 right-0 w-64 h-full bg-cover bg-right opacity-20" style={{ backgroundImage: `url(${activeGame.image})`, maskImage: 'linear-gradient(to left, black, transparent)', WebkitMaskImage: 'linear-gradient(to left, black, transparent)' }} />
              
              <div className="relative z-10 flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-3xl font-black text-white uppercase tracking-widest">{activeGame.title}</h2>
                    <Badge className="bg-[#1b3652] text-[#8caecc] border-none rounded-sm uppercase tracking-wider text-[10px]">{activeGame.genre}</Badge>
                  </div>
                  
                  <div className="flex items-center gap-6 mt-4">
                    <div className="flex items-center gap-2 text-[#8caecc] text-xs font-mono font-bold">
                      <Clock className="w-4 h-4 text-[#4288cc]" />
                      <span>TIME LOGGED: 24.5 HRS</span>
                    </div>
                    <div className="flex items-center gap-2 text-[#8caecc] text-xs font-mono font-bold">
                      <Trophy className="w-4 h-4 text-[#e5c56d]" />
                      <span>DIRECTIVES: {completedQuests}/{totalQuests}</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <Button 
                    onClick={() => handlePinGame(activeGame.id)}
                    variant="outline"
                    className={`h-8 rounded-sm text-[10px] uppercase font-bold tracking-wider ${
                      pinnedGameId === activeGame.id 
                        ? 'bg-[#e5c56d]/10 text-[#e5c56d] border-[#e5c56d]' 
                        : 'bg-transparent text-[#8caecc] border-[#1b3652] hover:bg-[#1b3652]'
                    }`}
                  >
                    <Pin className="w-3 h-3 mr-2" fill={pinnedGameId === activeGame.id ? "currentColor" : "none"} />
                    {pinnedGameId === activeGame.id ? 'Tracked' : 'Track Operations'}
                  </Button>
                  
                  <Button 
                    onClick={() => {
                      localStorage.setItem('luna_pinned_card_game_name', activeGame.title);
                      localStorage.setItem('luna_pinned_card_game_genre', activeGame.genre);
                      window.dispatchEvent(new Event('storage'));
                      navigate(createPageUrl('GenreMastery'));
                    }}
                    variant="outline"
                    className="h-8 bg-transparent border-[#1b3652] text-[#8caecc] hover:bg-[#1b3652] hover:text-white rounded-sm text-[10px] uppercase font-bold tracking-wider"
                  >
                    <Target className="w-3 h-3 mr-2" /> View Collections
                  </Button>
                </div>
              </div>
            </div>

            {/* Quests Accordion List Header */}
            <div className="flex items-center gap-2 text-[#4288cc] font-bold uppercase tracking-widest text-sm shrink-0">
              <Crosshair className="w-4 h-4" />
              <span>Mission Objectives</span>
              <div className="flex-1 h-px bg-gradient-to-r from-[#1b3652] to-transparent ml-2" />
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-3 pb-8">
              {activeGame.quests.map((quest) => {
                const pct = Math.round((quest.progress / quest.total) * 100);
                const isExpanded = expandedQuestId === quest.id;
                
                return (
                  <motion.div
                    key={quest.id}
                    layout
                    className={`rounded-sm border transition-all duration-300 ${
                      isExpanded 
                        ? 'bg-[#0d1522] border-[#4288cc] shadow-[0_0_15px_rgba(66,136,204,0.15)]' 
                        : quest.complete 
                          ? 'bg-[#060a12] border-[#1b3652]/50 opacity-70' 
                          : 'bg-[#0d1522] border-[#1b3652] hover:border-[#4288cc]/50 hover:bg-[#111c2c]'
                    }`}
                  >
                    {/* Collapsed Header */}
                    <div 
                      className="p-4 cursor-pointer flex justify-between items-center group"
                      onClick={() => setExpandedQuestId(isExpanded ? null : quest.id)}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-6 h-6 flex items-center justify-center transition-transform duration-300 ${isExpanded ? 'rotate-90' : ''}`}>
                          <ChevronRight className={`w-5 h-5 ${quest.complete ? 'text-green-500' : 'text-[#4288cc]'}`} />
                        </div>
                        <div>
                          <h4 className={`font-bold uppercase tracking-widest text-sm ${
                            quest.complete ? 'text-green-500 line-through' : isExpanded ? 'text-white' : 'text-[#8caecc] group-hover:text-[#e2f1ff]'
                          }`}>
                            {quest.title}
                          </h4>
                          {!isExpanded && (
                            <p className="text-[11px] text-[#4288cc] mt-1 font-mono">{quest.desc}</p>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-6">
                        <span className={`text-[10px] px-2 py-0.5 rounded-sm border uppercase tracking-widest font-bold ${
                          quest.rarity === 'Legendary' ? 'border-[#e5c56d]/50 text-[#e5c56d] bg-[#e5c56d]/10' :
                          quest.rarity === 'Epic' ? 'border-purple-500/50 text-purple-400 bg-purple-500/10' :
                          'border-[#1b3652] text-[#8caecc] bg-[#060a12]'
                        }`}>
                          {quest.rarity}
                        </span>
                        
                        <div className="w-32 flex flex-col items-end gap-1">
                          <span className="text-[10px] font-mono font-bold text-[#8caecc]">{pct}% COMPLETE</span>
                          <div className="h-1.5 w-full bg-[#060a12] rounded-sm overflow-hidden border border-[#1b3652]">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${pct}%` }}
                              className={`h-full ${quest.complete ? 'bg-green-500' : 'bg-[#e5c56d]'}`} 
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Expanded Content */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden border-t border-[#1b3652]"
                        >
                          <div className="p-6 bg-[#060a12] grid grid-cols-3 gap-8">
                            
                            {/* Left Col: Lore & Description */}
                            <div className="col-span-2 space-y-4">
                              <div>
                                <h5 className="text-[10px] text-[#4288cc] uppercase tracking-widest font-bold mb-2">Mission Briefing</h5>
                                <p className="text-sm text-[#e2f1ff] leading-relaxed border-l-2 border-[#1b3652] pl-3 italic">
                                  "{quest.lore}"
                                </p>
                              </div>
                              
                              <div>
                                <h5 className="text-[10px] text-[#4288cc] uppercase tracking-widest font-bold mb-3 flex items-center gap-2 mt-6">
                                  <CircleDot className="w-3 h-3" />
                                  Objectives
                                </h5>
                                <div className="space-y-3 pl-2">
                                  {quest.objectives?.map((obj, i) => {
                                    const objPct = Math.round((obj.progress / obj.total) * 100);
                                    const objDone = obj.progress >= obj.total;
                                    return (
                                      <div key={i} className="flex items-center gap-3">
                                        <div className={`w-4 h-4 border flex items-center justify-center rounded-sm ${objDone ? 'border-green-500 bg-green-500/20' : 'border-[#4288cc] bg-[#0d1522]'}`}>
                                          {objDone && <CheckSquare className="w-3 h-3 text-green-500" />}
                                        </div>
                                        <div className="flex-1">
                                          <div className="flex justify-between text-xs mb-1">
                                            <span className={`${objDone ? 'text-green-400' : 'text-[#8caecc]'}`}>{obj.text}</span>
                                            <span className="font-mono text-[#4288cc]">{obj.progress}/{obj.total}</span>
                                          </div>
                                          <div className="h-1 w-full bg-[#0d1522] rounded-sm overflow-hidden">
                                            <div className={`h-full ${objDone ? 'bg-green-500' : 'bg-[#4288cc]'}`} style={{ width: `${objPct}%` }} />
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>
                            
                            {/* Right Col: Rewards */}
                            <div className="col-span-1 border-l border-[#1b3652] pl-6">
                              <h5 className="text-[10px] text-[#e5c56d] uppercase tracking-widest font-bold mb-3 flex items-center gap-2">
                                <Star className="w-3 h-3" />
                                Requisition Rewards
                              </h5>
                              <div className="space-y-2">
                                {quest.rewards?.map((reward, i) => (
                                  <div key={i} className="flex items-center gap-2 text-xs text-[#8caecc] bg-[#0d1522] p-2 border border-[#1b3652] rounded-sm">
                                    <div className="w-6 h-6 bg-[#1b3652] rounded-sm flex items-center justify-center">
                                      {reward.includes('XP') ? <Zap className="w-3 h-3 text-[#e5c56d]" /> : <ShieldAlert className="w-3 h-3 text-[#4288cc]" />}
                                    </div>
                                    <span className="font-mono">{reward}</span>
                                  </div>
                                ))}
                              </div>
                              
                              {!quest.complete && (
                                <Button className="w-full mt-6 bg-[#1a3a5c] hover:bg-[#204a75] text-[#e2f1ff] border border-[#4288cc] rounded-sm uppercase tracking-widest text-[10px] font-bold h-10">
                                  <Map className="w-3 h-3 mr-2" /> Show on Map
                                </Button>
                              )}
                            </div>
                            
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>

          </div>
        </div>
      </div>
    </PageErrorBoundary>
  );
}
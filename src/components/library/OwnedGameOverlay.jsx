import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Play, Bot, Settings, ChevronDown, Download, Trophy, Sword, Zap, Package, Users, MessageSquare, TrendingUp, Hash, Mic, MicOff, Send, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { useAuth } from '../auth/AuthContext';

// Mock chat channels
const CHAT_CHANNELS = [
    { id: 'general', name: 'General Chat', users: 1543, description: 'General discussion about the game' },
    { id: 'help', name: 'Help & Tips', users: 892, description: 'Get help from other players' },
    { id: 'trading', name: 'Trading', users: 456, description: 'Trade items and gear' },
    { id: 'lfg', name: 'Looking for Group', users: 678, description: 'Find party members' },
    { id: 'pvp', name: 'PvP Discussion', users: 334, description: 'PvP strategies and matchmaking' },
    { id: 'endgame', name: 'Endgame Content', users: 221, description: 'Discuss raids and endgame' },
    { id: 'builds', name: 'Character Builds', users: 567, description: 'Share and discuss builds' },
    { id: 'lore', name: 'Lore & Story', users: 189, description: 'Discuss game story and lore' }
];

// Mock chat messages
const MOCK_MESSAGES = [
    { id: 1, user: 'DragonSlayer', avatar: 'https://i.pravatar.cc/150?u=dragon', message: 'Anyone know where to find the Ancient Sword?', timestamp: '2 min ago', isVoice: false },
    { id: 2, user: 'MysticMage', avatar: 'https://i.pravatar.cc/150?u=mystic', message: 'Check the Frozen Temple, third floor', timestamp: '1 min ago', isVoice: false },
    { id: 3, user: 'ShadowNinja', avatar: 'https://i.pravatar.cc/150?u=shadow', message: 'LFG for raid tonight at 8pm EST', timestamp: '30 sec ago', isVoice: false },
    { id: 4, user: 'HealerQueen', avatar: 'https://i.pravatar.cc/150?u=healer', message: 'I can join! I\'m a level 85 healer', timestamp: 'Just now', isVoice: false }
];

const CommunityChatTab = ({ game }) => {
    const { user } = useAuth();
    const [selectedChannel, setSelectedChannel] = useState(CHAT_CHANNELS[0]);
    const [messages, setMessages] = useState(MOCK_MESSAGES);
    const [messageInput, setMessageInput] = useState('');
    const [isVoiceToText, setIsVoiceToText] = useState(false);
    const [isPushToTalk, setIsPushToTalk] = useState(false);
    const [isListening, setIsListening] = useState(false);

    const handleSendMessage = () => {
        if (!messageInput.trim()) return;
        
        const newMessage = {
            id: messages.length + 1,
            user: user?.username || user?.full_name || 'Guest',
            avatar: user?.avatar_url || `https://i.pravatar.cc/150?u=${user?.email}`,
            message: messageInput,
            timestamp: 'Just now',
            isVoice: false
        };
        
        setMessages([...messages, newMessage]);
        setMessageInput('');
    };

    const startVoiceToText = () => {
        if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            const recognition = new SpeechRecognition();
            recognition.continuous = false;
            recognition.interimResults = false;
            recognition.lang = 'en-US';

            recognition.onstart = () => setIsListening(true);
            recognition.onend = () => setIsListening(false);
            recognition.onerror = () => setIsListening(false);
            
            recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                setMessageInput(transcript);
            };

            recognition.start();
        }
    };

    const togglePushToTalk = () => {
        setIsPushToTalk(!isPushToTalk);
        // In production, this would connect to voice chat service
    };

    return (
        <div className="flex gap-4 h-[600px]">
            {/* Left Side - Channel List */}
            <div className="w-64 flex-shrink-0 bg-slate-800/30 rounded-lg border border-slate-700/50 overflow-hidden flex flex-col">
                <div className="p-4 border-b border-slate-700/50 bg-slate-800/50">
                    <h3 className="font-bold text-white flex items-center gap-2">
                        <Hash className="w-5 h-5 text-blue-400" />
                        Channels
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">Select a channel to join</p>
                </div>
                
                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                    {CHAT_CHANNELS.map(channel => (
                        <button
                            key={channel.id}
                            onClick={() => setSelectedChannel(channel)}
                            className={`w-full text-left p-3 rounded-lg transition-all ${
                                selectedChannel.id === channel.id
                                    ? 'bg-blue-600/30 border border-blue-500/50'
                                    : 'hover:bg-slate-700/30 border border-transparent'
                            }`}
                        >
                            <div className="flex items-center justify-between mb-1">
                                <span className={`font-semibold text-sm ${
                                    selectedChannel.id === channel.id ? 'text-white' : 'text-slate-300'
                                }`}>
                                    # {channel.name}
                                </span>
                                <Badge className="text-xs bg-slate-700 text-slate-300">
                                    {channel.users}
                                </Badge>
                            </div>
                            <p className="text-xs text-slate-400 line-clamp-1">{channel.description}</p>
                        </button>
                    ))}
                </div>
            </div>

            {/* Right Side - Chat Area */}
            <div className="flex-1 flex flex-col bg-slate-800/30 rounded-lg border border-slate-700/50 overflow-hidden">
                {/* Channel Header */}
                <div className="p-4 border-b border-slate-700/50 bg-slate-800/50">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="font-bold text-white flex items-center gap-2">
                                <Hash className="w-5 h-5 text-blue-400" />
                                {selectedChannel.name}
                            </h3>
                            <p className="text-xs text-slate-400 mt-0.5">{selectedChannel.description}</p>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-400">
                            <Users className="w-4 h-4" />
                            <span>{selectedChannel.users} online</span>
                        </div>
                    </div>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.map(msg => (
                        <div key={msg.id} className="flex gap-3">
                            <img 
                                src={msg.avatar} 
                                alt={msg.user}
                                className="w-10 h-10 rounded-full flex-shrink-0"
                            />
                            <div className="flex-1">
                                <div className="flex items-baseline gap-2 mb-1">
                                    <span className="font-bold text-white text-sm">{msg.user}</span>
                                    <span className="text-xs text-slate-500">{msg.timestamp}</span>
                                </div>
                                <p className="text-slate-300 text-sm">{msg.message}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Input Area */}
                <div className="p-4 border-t border-slate-700/50 bg-slate-800/50">
                    <div className="flex gap-2 items-end">
                        {/* Text Input */}
                        <div className="flex-1">
                            <Input
                                value={messageInput}
                                onChange={(e) => setMessageInput(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                                placeholder={`Message #${selectedChannel.name}...`}
                                className="bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-500"
                            />
                        </div>

                        {/* Voice to Text Button */}
                        <Button
                            onClick={startVoiceToText}
                            variant="outline"
                            size="icon"
                            className={`${isListening ? 'border-red-500 bg-red-500/20 text-red-400 animate-pulse' : 'border-slate-600 text-slate-400 hover:text-white'}`}
                            title="Voice to Text"
                        >
                            {isListening ? <MicOff className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                        </Button>

                        {/* Push to Talk Button */}
                        <Button
                            onClick={togglePushToTalk}
                            variant="outline"
                            size="icon"
                            className={`${isPushToTalk ? 'border-green-500 bg-green-500/20 text-green-400' : 'border-slate-600 text-slate-400 hover:text-white'}`}
                            title="Push to Talk (Hold to speak)"
                        >
                            <Mic className="w-5 h-5" />
                        </Button>

                        {/* Send Button */}
                        <Button
                            onClick={handleSendMessage}
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                            size="icon"
                        >
                            <Send className="w-5 h-5" />
                        </Button>
                    </div>

                    {/* Status Messages */}
                    <div className="mt-2 text-xs text-slate-500 flex items-center gap-4">
                        {isListening && (
                            <span className="text-red-400 flex items-center gap-1">
                                <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                                Listening...
                            </span>
                        )}
                        {isPushToTalk && (
                            <span className="text-green-400 flex items-center gap-1">
                                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                                Voice chat active - Hold Mic button to speak
                            </span>
                        )}
                        {!isListening && !isPushToTalk && (
                            <span>Use Voice to Text to dictate messages or Push to Talk for live voice chat</span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default function OwnedGameOverlay({ game, onClose }) {
    const [activeTab, setActiveTab] = useState('overview');

    if (!game) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
                onClick={onClose}
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    transition={{ duration: 0.3, type: 'spring', damping: 25 }}
                    onClick={(e) => e.stopPropagation()}
                    className="relative w-full max-w-6xl max-h-[90vh] bg-slate-900 rounded-2xl border-2 border-blue-500/30 shadow-2xl shadow-blue-500/20 overflow-hidden flex flex-col"
                >
                    {/* Close Button */}
                    <button
                        onClick={onClose}
                        className="absolute top-6 right-6 z-50 bg-slate-800/90 hover:bg-slate-700 text-white p-2 rounded-full transition-all hover:scale-110"
                    >
                        <X className="w-6 h-6" />
                    </button>

                    {/* Hero Banner with Top Actions */}
                    <div className="relative h-96 flex-shrink-0">
                        <img
                            src={game.banner || game.cover_image || game.cover}
                            alt={game.title}
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-black/50 to-transparent" />
                        
                        {/* Top Action Bar */}
                        <div className="absolute top-6 left-6 right-20 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Badge className="bg-green-500/20 text-green-300 border-green-500/50 text-sm px-3 py-1">
                                    <Download className="w-3 h-3 mr-1" />
                                    Installed
                                </Badge>
                                <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/50 text-sm px-3 py-1">
                                    {game.genre}
                                </Badge>
                            </div>

                            <div className="flex items-center gap-3">
                                <Button 
                                    size="lg"
                                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 rounded-lg flex items-center gap-2 transition-all hover:scale-105"
                                >
                                    <Play className="w-5 h-5" />
                                    Play
                                </Button>
                                
                                <Button 
                                    size="lg"
                                    variant="outline"
                                    className="border-green-500/50 bg-green-500/10 text-green-400 hover:bg-green-500/20 font-bold px-6 py-3 rounded-lg flex items-center gap-2 transition-all hover:scale-105"
                                >
                                    <Bot className="w-5 h-5" />
                                    AI Play
                                </Button>

                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button 
                                            size="lg"
                                            variant="outline"
                                            className="border-slate-500/50 bg-slate-500/10 text-slate-300 hover:bg-slate-500/20 p-3 rounded-lg transition-all hover:scale-105"
                                        >
                                            <Settings className="w-5 h-5" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-56 bg-slate-800 border-slate-700">
                                        <DropdownMenuItem className="text-slate-300 hover:bg-slate-700 cursor-pointer">
                                            <Settings className="w-4 h-4 mr-2" />
                                            Graphics Settings
                                        </DropdownMenuItem>
                                        <DropdownMenuItem className="text-slate-300 hover:bg-slate-700 cursor-pointer">
                                            <Bot className="w-4 h-4 mr-2" />
                                            Enable Legacy Mode
                                        </DropdownMenuItem>
                                        <DropdownMenuItem className="text-slate-300 hover:bg-slate-700 cursor-pointer">
                                            <Settings className="w-4 h-4 mr-2" />
                                            General Options
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </div>

                        {/* Game Title */}
                        <div className="absolute bottom-6 left-6 right-6">
                            <h1 className="text-5xl font-black text-white mb-3">{game.title}</h1>
                            <p className="text-lg text-slate-300 max-w-3xl">
                                {game.description || 'Experience the ultimate gaming adventure in this critically acclaimed title.'}
                            </p>
                        </div>
                    </div>

                    {/* Tabbed Content */}
                    <div className="flex-1 overflow-y-auto p-6">
                        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                            <TabsList className="grid w-full grid-cols-6 bg-slate-800/50 mb-6">
                                <TabsTrigger value="overview" className="data-[state=active]:bg-blue-600">Overview</TabsTrigger>
                                <TabsTrigger value="achievements" className="data-[state=active]:bg-blue-600">Achievements</TabsTrigger>
                                <TabsTrigger value="equipment" className="data-[state=active]:bg-blue-600">Equipment</TabsTrigger>
                                <TabsTrigger value="abilities" className="data-[state=active]:bg-blue-600">Abilities</TabsTrigger>
                                <TabsTrigger value="community" className="data-[state=active]:bg-blue-600">Community Chat</TabsTrigger>
                                <TabsTrigger value="updates" className="data-[state=active]:bg-blue-600">Updates</TabsTrigger>
                            </TabsList>

                            <TabsContent value="overview" className="space-y-6">
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                    <div className="lg:col-span-2 space-y-6">
                                        <div>
                                            <h3 className="text-2xl font-bold text-white mb-4">About This Game</h3>
                                            <p className="text-slate-300 leading-relaxed">
                                                {game.description || 'An epic adventure awaits in this groundbreaking title that redefines the genre. Explore vast worlds, engage in intense combat, and uncover secrets that will change everything.'}
                                            </p>
                                        </div>

                                        <div>
                                            <h4 className="text-xl font-semibold text-white mb-4">Screenshots</h4>
                                            <div className="grid grid-cols-2 gap-4">
                                                {[game.cover, game.banner, game.cover_image, game.cover].filter(Boolean).slice(0, 4).map((img, i) => (
                                                    <img
                                                        key={i}
                                                        src={img}
                                                        alt={`Screenshot ${i + 1}`}
                                                        className="w-full aspect-video object-cover rounded-lg hover:scale-105 transition-transform cursor-pointer"
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                                            <h4 className="font-semibold text-white mb-4">Your Stats</h4>
                                            <div className="space-y-3 text-sm">
                                                <div className="flex justify-between">
                                                    <span className="text-slate-400">Playtime:</span>
                                                    <span className="text-white font-semibold">12.5 hours</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-slate-400">Achievements:</span>
                                                    <span className="text-white font-semibold">8 / 15</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-slate-400">Last Played:</span>
                                                    <span className="text-white font-semibold">2 hours ago</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                                            <h4 className="font-semibold text-white mb-4">System Info</h4>
                                            <div className="space-y-2 text-xs text-slate-400">
                                                <div>
                                                    <span className="font-semibold text-slate-300">Developer:</span> {game.developer || 'Studio XYZ'}
                                                </div>
                                                <div>
                                                    <span className="font-semibold text-slate-300">Publisher:</span> {game.publisher || 'Publisher ABC'}
                                                </div>
                                                <div>
                                                    <span className="font-semibold text-slate-300">Release Date:</span> {game.releaseDate || '2024'}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </TabsContent>

                            <TabsContent value="achievements">
                                <div className="text-center py-20">
                                    <Trophy className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
                                    <h3 className="text-2xl font-bold text-white mb-2">Achievements</h3>
                                    <p className="text-slate-400">Track your progress and unlock rewards</p>
                                </div>
                            </TabsContent>

                            <TabsContent value="equipment">
                                <div className="text-center py-20">
                                    <Sword className="w-16 h-16 text-blue-400 mx-auto mb-4" />
                                    <h3 className="text-2xl font-bold text-white mb-2">Equipment</h3>
                                    <p className="text-slate-400">Manage your gear and loadouts</p>
                                </div>
                            </TabsContent>

                            <TabsContent value="abilities">
                                <div className="text-center py-20">
                                    <Zap className="w-16 h-16 text-purple-400 mx-auto mb-4" />
                                    <h3 className="text-2xl font-bold text-white mb-2">Abilities</h3>
                                    <p className="text-slate-400">Unlock and upgrade your powers</p>
                                </div>
                            </TabsContent>

                            <TabsContent value="community">
                                <CommunityChatTab game={game} />
                            </TabsContent>

                            <TabsContent value="updates">
                                <div className="text-center py-20">
                                    <TrendingUp className="w-16 h-16 text-orange-400 mx-auto mb-4" />
                                    <h3 className="text-2xl font-bold text-white mb-2">Updates</h3>
                                    <p className="text-slate-400">Latest patches and news</p>
                                </div>
                            </TabsContent>
                        </Tabs>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
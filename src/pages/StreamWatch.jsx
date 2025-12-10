import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { X, Send, Trophy, Star, Gift, Award, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

// Mock streamer data
const MOCK_STREAMERS = [
  { 
    id: 1, 
    name: 'ProGamer_Elite', 
    intro: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&h=450&fit=crop', 
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop',
    category: 'FPS', 
    game: 'Counter-Strike 2',
    viewers: 12500
  }
];

// Mock chat messages
const MOCK_CHAT = [
  { id: 1, user: 'Viewer123', message: 'Great shot!', timestamp: '10:23' },
  { id: 2, user: 'FanGamer', message: 'How do you aim so well?', timestamp: '10:24' },
  { id: 3, user: 'ProWatcher', message: 'Amazing gameplay!', timestamp: '10:25' }
];

// Season Pass Data
const SEASON_PASS_TIERS = [
  { tier: 1, reward: 'Bronze Card', icon: Award, progress: 100, claimed: true },
  { tier: 2, reward: 'Silver Card', icon: Star, progress: 100, claimed: true },
  { tier: 3, reward: 'Gold Card', icon: Trophy, progress: 60, claimed: false },
  { tier: 4, reward: 'Platinum Card', icon: Crown, progress: 0, claimed: false },
  { tier: 5, reward: 'Diamond Card', icon: Gift, progress: 0, claimed: false }
];

export default function StreamWatch() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const streamerId = searchParams.get('id');
  const streamer = MOCK_STREAMERS.find(s => s.id === parseInt(streamerId)) || MOCK_STREAMERS[0];

  const [chatMessage, setChatMessage] = useState('');
  const [seasonRank, setSeasonRank] = useState(2);
  const [timeWatched, setTimeWatched] = useState('24h 35m');
  const [monthsSubscribed, setMonthsSubscribed] = useState(3);

  const handleSendMessage = () => {
    if (chatMessage.trim()) {
      // Send message logic
      setChatMessage('');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 p-6">
      <div className="max-w-[1800px] mx-auto">
        {/* Close Button */}
        <button
          onClick={() => navigate(-1)}
          className="fixed top-6 right-6 z-50 w-10 h-10 bg-black/60 hover:bg-black/80 backdrop-blur-md rounded-full flex items-center justify-center text-white transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Stream Player & Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Stream Player */}
            <div className="relative aspect-video bg-black rounded-xl overflow-hidden">
              <img src={streamer.intro} alt={streamer.name} className="w-full h-full object-cover" />
              <div className="absolute top-4 left-4">
                <div className="bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-2">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                  LIVE
                </div>
              </div>
            </div>

            {/* Stream Info */}
            <div className="bg-slate-800/60 backdrop-blur-xl border border-white/10 rounded-xl p-6">
              <div className="flex items-center gap-4 mb-4">
                <img src={streamer.avatar} alt={streamer.name} className="w-16 h-16 rounded-full border-2 border-blue-400" />
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-white">{streamer.name}</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">{streamer.category}</Badge>
                    <span className="text-white/60 text-sm">Playing: {streamer.game}</span>
                  </div>
                </div>
                <Button className="bg-red-600 hover:bg-red-700">Follow</Button>
              </div>
            </div>

            {/* Season Pass System */}
            <div className="bg-slate-800/60 backdrop-blur-xl border border-white/10 rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-white">Season Pass</h3>
                <Button size="sm" className="bg-yellow-600 hover:bg-yellow-700">
                  <Crown className="w-4 h-4 mr-2" />
                  Upgrade
                </Button>
              </div>

              {/* Stats Row */}
              <div className="grid grid-cols-4 gap-4 mb-6">
                <div className="bg-slate-900/60 rounded-lg p-4 text-center">
                  <div className="text-white/50 text-xs mb-1">Season Rank</div>
                  <div className="text-2xl font-bold text-white">{seasonRank}</div>
                </div>
                <div className="bg-slate-900/60 rounded-lg p-4 text-center">
                  <div className="text-white/50 text-xs mb-1">Time Watched</div>
                  <div className="text-xl font-bold text-white">{timeWatched}</div>
                </div>
                <div className="bg-slate-900/60 rounded-lg p-4 text-center">
                  <div className="text-white/50 text-xs mb-1">Rewards</div>
                  <div className="text-2xl font-bold text-green-400">3/5</div>
                </div>
                <div className="bg-slate-900/60 rounded-lg p-4 text-center">
                  <div className="text-white/50 text-xs mb-1">Months Subscribed</div>
                  <div className="text-2xl font-bold text-purple-400">{monthsSubscribed}</div>
                </div>
              </div>

              {/* Season Pass Progression */}
              <div>
                <h4 className="text-white font-semibold mb-4">Collectible Cards</h4>
                <div className="space-y-4">
                  {SEASON_PASS_TIERS.map((tier, idx) => {
                    const Icon = tier.icon;
                    return (
                      <motion.div
                        key={tier.tier}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="bg-slate-900/40 rounded-lg p-4 border border-white/10"
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-16 h-16 rounded-lg flex items-center justify-center ${
                            tier.claimed ? 'bg-green-500/20' : tier.progress > 0 ? 'bg-blue-500/20' : 'bg-slate-700/20'
                          }`}>
                            <Icon className={`w-8 h-8 ${
                              tier.claimed ? 'text-green-400' : tier.progress > 0 ? 'text-blue-400' : 'text-white/30'
                            }`} />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <h5 className="text-white font-semibold">Tier {tier.tier}: {tier.reward}</h5>
                              {tier.claimed ? (
                                <Badge className="bg-green-500/20 text-green-300 border-green-500/30">Claimed</Badge>
                              ) : tier.progress === 100 ? (
                                <Button size="sm" className="bg-blue-600 hover:bg-blue-700 h-7 text-xs">Claim</Button>
                              ) : (
                                <span className="text-white/40 text-sm">{tier.progress}%</span>
                              )}
                            </div>
                            <div className="w-full bg-slate-700/50 rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full transition-all ${
                                  tier.claimed ? 'bg-green-500' : 'bg-blue-500'
                                }`}
                                style={{ width: `${tier.progress}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Right: Chat */}
          <div className="lg:col-span-1">
            <div className="bg-slate-800/60 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden flex flex-col h-[calc(100vh-8rem)]">
              <div className="p-4 border-b border-white/10">
                <h3 className="text-white font-bold">Stream Chat</h3>
                <p className="text-white/60 text-sm">{streamer.viewers.toLocaleString()} viewers</p>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {MOCK_CHAT.map(msg => (
                  <div key={msg.id} className="flex gap-2">
                    <div className="flex-1">
                      <div className="flex items-baseline gap-2">
                        <span className="text-blue-400 font-semibold text-sm">{msg.user}</span>
                        <span className="text-white/30 text-xs">{msg.timestamp}</span>
                      </div>
                      <p className="text-white/80 text-sm">{msg.message}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Chat Input */}
              <div className="p-4 border-t border-white/10">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Send a message..."
                    className="flex-1 bg-slate-900/60 border border-white/20 rounded-lg px-3 py-2 text-white text-sm placeholder:text-white/40 focus:outline-none focus:border-blue-500"
                  />
                  <Button onClick={handleSendMessage} size="sm" className="bg-blue-600 hover:bg-blue-700">
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
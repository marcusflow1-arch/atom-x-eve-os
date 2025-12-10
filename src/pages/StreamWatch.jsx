import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { X, Send, Trophy, Star, Gift, Award, Crown, Users } from 'lucide-react';
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
            <div className="bg-slate-800/60 backdrop-blur-xl border border-white/10 rounded-xl p-4">
              <div className="flex items-center gap-4">
                <img src={streamer.avatar} alt={streamer.name} className="w-12 h-12 rounded-full border-2 border-blue-400" />
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-white">{streamer.name}</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30 text-xs">{streamer.category}</Badge>
                    <span className="text-white/60 text-sm">Playing: {streamer.game}</span>
                  </div>
                </div>
                <Button size="sm" className="bg-red-600 hover:bg-red-700">Follow</Button>
              </div>
            </div>

            {/* Sponsors & General Information */}
            <div className="grid md:grid-cols-3 gap-8">
                {/* About Section */}
                <div className="space-y-6">
                  <div>
                    <h3 className="text-white font-bold text-sm uppercase tracking-wider mb-4 flex items-center gap-2">
                      <Users className="w-4 h-4 text-blue-400" />
                      About
                    </h3>
                    <p className="text-white/70 text-sm leading-relaxed mb-4">
                      Professional gamer and content creator. Join me for epic gameplay sessions and community events!
                    </p>
                    <p className="text-white/60 text-xs leading-relaxed">
                      Streaming since 2020 with a focus on competitive gameplay and community building. Always looking to help new players improve their skills.
                    </p>
                  </div>

                  <div>
                    <h4 className="text-white/80 font-semibold text-xs uppercase tracking-wider mb-2">Stream Schedule</h4>
                    <div className="space-y-1.5 text-xs text-white/60">
                      <div>Mon-Fri: 7PM-11PM EST</div>
                      <div>Weekends: 2PM-8PM EST</div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-white/80 font-semibold text-xs uppercase tracking-wider mb-2">Setup</h4>
                    <div className="space-y-1.5 text-xs text-white/60">
                      <div>• PC: RTX 4090, i9-13900K</div>
                      <div>• Monitor: 360Hz 1440p</div>
                      <div>• Mic: Shure SM7B</div>
                    </div>
                  </div>
                </div>

                {/* Sponsors */}
                <div className="space-y-6">
                  <div>
                    <h3 className="text-white font-bold text-sm uppercase tracking-wider mb-4 flex items-center gap-2">
                      <Star className="w-4 h-4 text-yellow-400" />
                      Sponsors
                    </h3>
                    <div className="grid grid-cols-3 gap-3 mb-4">
                      <div className="w-full aspect-square bg-slate-700/50 rounded-lg flex items-center justify-center border border-white/10 hover:border-white/30 transition-colors">
                        <span className="text-white/40 text-xs">Logo</span>
                      </div>
                      <div className="w-full aspect-square bg-slate-700/50 rounded-lg flex items-center justify-center border border-white/10 hover:border-white/30 transition-colors">
                        <span className="text-white/40 text-xs">Logo</span>
                      </div>
                      <div className="w-full aspect-square bg-slate-700/50 rounded-lg flex items-center justify-center border border-white/10 hover:border-white/30 transition-colors">
                        <span className="text-white/40 text-xs">Logo</span>
                      </div>
                      <div className="w-full aspect-square bg-slate-700/50 rounded-lg flex items-center justify-center border border-white/10 hover:border-white/30 transition-colors">
                        <span className="text-white/40 text-xs">Logo</span>
                      </div>
                      <div className="w-full aspect-square bg-slate-700/50 rounded-lg flex items-center justify-center border border-white/10 hover:border-white/30 transition-colors">
                        <span className="text-white/40 text-xs">Logo</span>
                      </div>
                      <div className="w-full aspect-square bg-slate-700/50 rounded-lg flex items-center justify-center border border-white/10 hover:border-white/30 transition-colors">
                        <span className="text-white/40 text-xs">Logo</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-white/80 font-semibold text-xs uppercase tracking-wider mb-2">Partnership Info</h4>
                    <p className="text-white/60 text-xs leading-relaxed">
                      For sponsorship inquiries and business partnerships, reach out via email or Discord DM.
                    </p>
                  </div>

                  <div>
                    <h4 className="text-white/80 font-semibold text-xs uppercase tracking-wider mb-2">Affiliate Links</h4>
                    <div className="space-y-1.5">
                      <a href="#" className="block text-blue-400 hover:text-blue-300 text-xs transition-colors">
                        💻 Gaming PC Specs
                      </a>
                      <a href="#" className="block text-blue-400 hover:text-blue-300 text-xs transition-colors">
                        🎧 Audio Equipment
                      </a>
                      <a href="#" className="block text-blue-400 hover:text-blue-300 text-xs transition-colors">
                        🖱️ Peripherals
                      </a>
                    </div>
                  </div>
                </div>

                {/* Social Links & Info */}
                <div className="space-y-6">
                  <div>
                    <h3 className="text-white font-bold text-sm uppercase tracking-wider mb-4 flex items-center gap-2">
                      <Trophy className="w-4 h-4 text-purple-400" />
                      Links
                    </h3>
                    <div className="space-y-2.5">
                      <a href="#" className="block text-blue-400 hover:text-blue-300 text-sm transition-colors">
                        🎮 Discord Community
                      </a>
                      <a href="#" className="block text-blue-400 hover:text-blue-300 text-sm transition-colors">
                        🐦 Twitter/X
                      </a>
                      <a href="#" className="block text-blue-400 hover:text-blue-300 text-sm transition-colors">
                        📺 YouTube Channel
                      </a>
                      <a href="#" className="block text-blue-400 hover:text-blue-300 text-sm transition-colors">
                        📷 Instagram
                      </a>
                      <a href="#" className="block text-blue-400 hover:text-blue-300 text-sm transition-colors">
                        🎵 TikTok
                      </a>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-white/80 font-semibold text-xs uppercase tracking-wider mb-2">Achievements</h4>
                    <div className="space-y-1.5 text-xs text-white/60">
                      <div>🏆 Regional Champion 2023</div>
                      <div>🥇 Tournament Winner x5</div>
                      <div>⭐ 100K+ Followers</div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-white/80 font-semibold text-xs uppercase tracking-wider mb-2">Support</h4>
                    <div className="space-y-2">
                      <button className="w-full bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 rounded-lg px-3 py-2 text-blue-300 text-xs font-semibold transition-all">
                        Subscribe
                      </button>
                      <button className="w-full bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 rounded-lg px-3 py-2 text-purple-300 text-xs font-semibold transition-all">
                        Donate
                      </button>
                    </div>
                  </div>
                </div>
              </div>

            {/* Season Pass System - Full Width Replica */}
            <div>
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-2xl font-bold text-white mb-1">Streamer Season Pass</h3>
                    <p className="text-white/60 text-sm">Earn exclusive rewards by watching {streamer.name}</p>
                  </div>
                  <Button className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-bold">
                    <Crown className="w-4 h-4 mr-2" />
                    Upgrade Pass
                  </Button>
                </div>

                {/* Progress Bar */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white/70 text-sm">Season Progress</span>
                    <span className="text-white font-bold">Level {seasonRank}</span>
                  </div>
                  <div className="w-full h-3 bg-slate-700/50 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full" style={{ width: '40%' }} />
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-4 gap-3 mb-6">
                  <div className="bg-slate-800/60 backdrop-blur-sm rounded-lg p-3 border border-white/10">
                    <div className="text-white/50 text-xs uppercase tracking-wider mb-1">Season Rank</div>
                    <div className="text-2xl font-bold text-white">{seasonRank}</div>
                  </div>
                  <div className="bg-slate-800/60 backdrop-blur-sm rounded-lg p-3 border border-white/10">
                    <div className="text-white/50 text-xs uppercase tracking-wider mb-1">Time Watched</div>
                    <div className="text-xl font-bold text-blue-400">{timeWatched}</div>
                  </div>
                  <div className="bg-slate-800/60 backdrop-blur-sm rounded-lg p-3 border border-white/10">
                    <div className="text-white/50 text-xs uppercase tracking-wider mb-1">Rewards Claimed</div>
                    <div className="text-2xl font-bold text-green-400">3/5</div>
                  </div>
                  <div className="bg-slate-800/60 backdrop-blur-sm rounded-lg p-3 border border-white/10">
                    <div className="text-white/50 text-xs uppercase tracking-wider mb-1">Months Subbed</div>
                    <div className="text-2xl font-bold text-purple-400">{monthsSubscribed}</div>
                  </div>
                </div>

                {/* Rewards Track */}
                <div className="relative">
                  <div className="absolute top-12 left-0 right-0 h-1 bg-slate-700/50" />
                  <div className="relative grid grid-cols-5 gap-4">
                    {SEASON_PASS_TIERS.map((tier, idx) => {
                      const Icon = tier.icon;
                      const isLocked = tier.progress === 0;
                      const isClaimed = tier.claimed;
                      const canClaim = tier.progress === 100 && !isClaimed;

                      return (
                        <motion.div
                          key={tier.tier}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.1 }}
                          className="relative"
                        >
                          {/* Reward Box */}
                          <div className={`relative rounded-xl p-4 border-2 transition-all ${
                            isClaimed 
                              ? 'bg-green-500/10 border-green-500/50' 
                              : canClaim 
                                ? 'bg-blue-500/20 border-blue-500 animate-pulse' 
                                : isLocked
                                  ? 'bg-slate-800/40 border-slate-700/50'
                                  : 'bg-slate-800/60 border-slate-600/50'
                          }`}>
                            {/* Icon */}
                            <div className="flex justify-center mb-3">
                              <div className={`w-16 h-16 rounded-lg flex items-center justify-center ${
                                isClaimed 
                                  ? 'bg-green-500/20' 
                                  : canClaim 
                                    ? 'bg-blue-500/30' 
                                    : 'bg-slate-700/50'
                              }`}>
                                <Icon className={`w-8 h-8 ${
                                  isClaimed 
                                    ? 'text-green-400' 
                                    : canClaim 
                                      ? 'text-blue-400' 
                                      : 'text-white/20'
                                }`} />
                              </div>
                            </div>

                            {/* Title */}
                            <h5 className={`text-center text-sm font-bold mb-1 ${
                              isLocked ? 'text-white/30' : 'text-white'
                            }`}>
                              {tier.reward}
                            </h5>

                            {/* Progress/Status */}
                            <div className="text-center">
                              {isClaimed ? (
                                <Badge className="bg-green-500/20 text-green-300 border-green-500/30 text-xs">Claimed</Badge>
                              ) : canClaim ? (
                                <Button size="sm" className="bg-blue-600 hover:bg-blue-700 h-6 text-xs w-full">Claim</Button>
                              ) : (
                                <span className="text-white/40 text-xs">{tier.progress}%</span>
                              )}
                            </div>
                          </div>

                          {/* Tier Number */}
                          <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-slate-800 border border-white/20 rounded-full w-6 h-6 flex items-center justify-center">
                            <span className="text-white/80 text-xs font-bold">{tier.tier}</span>
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
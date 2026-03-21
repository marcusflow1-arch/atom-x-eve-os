import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Users, MessageCircle, Video, AlertCircle, Plus, UserPlus, Mic, Send, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import PostCard from '@/components/community/PostCard';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

const ACTION_TABS = [
  { id: 'guide', label: 'Guide', icon: Trophy },
  { id: 'farm', label: 'Farm Queue', icon: Users },
  { id: 'recruit', label: 'Recruit', icon: UserPlus },
  { id: 'bugs', label: 'Report Bug', icon: AlertCircle },
  { id: 'media', label: 'Videos', icon: Video },
  { id: 'discuss', label: 'Discuss', icon: MessageCircle },
];

export default function FarmCardDetail({ card, activeTopic }) {
  const [activeTab, setActiveTab] = useState(activeTopic || 'guide');
  const [chatInput, setChatInput] = useState('');

  // Sync tab when topic changes
  React.useEffect(() => {
    if (activeTopic === 'achievements') setActiveTab('guide');
    else if (activeTopic === 'farming') setActiveTab('farm');
    else if (activeTopic === 'recruitment') setActiveTab('recruit');
    else if (activeTopic === 'bugs') setActiveTab('bugs');
    else if (activeTopic === 'content') setActiveTab('media');
    else if (activeTopic) setActiveTab('discuss');
  }, [activeTopic]);

  if (!card) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <Trophy className="w-7 h-7 text-white/15" />
          </div>
          <p className="text-white/30 text-sm font-medium mb-1">Select a card</p>
          <p className="text-white/15 text-xs">Choose an achievement from the left to see guides, farm queues, and discussions.</p>
        </div>
      </div>
    );
  }

  const RARITY_GRADIENT = {
    Common: 'from-white/5 to-white/[0.02]',
    Uncommon: 'from-green-500/10 to-green-500/[0.02]',
    Rare: 'from-blue-500/10 to-blue-500/[0.02]',
    Epic: 'from-purple-500/10 to-purple-500/[0.02]',
    Legendary: 'from-yellow-500/10 to-yellow-500/[0.02]',
    Mythical: 'from-red-500/10 to-red-500/[0.02]',
  };

  const gradient = RARITY_GRADIENT[card.rarity] || RARITY_GRADIENT.Common;

  return (
    <div className="h-full flex flex-col">
      {/* Card Header */}
      <div className={`flex-shrink-0 p-5 bg-gradient-to-b ${gradient}`} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            {card.icon || '🏆'}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold text-white truncate">{card.title}</h2>
            <p className="text-white/40 text-xs mt-1 line-clamp-2">{card.description}</p>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="outline" className="text-[10px] border-white/10 text-white/40">{card.rarity}</Badge>
              <Badge variant="outline" className="text-[10px] border-white/10 text-white/40 capitalize">{card.category}</Badge>
              {card.points && <Badge variant="outline" className="text-[10px] border-white/10 text-white/40">{card.points} XP</Badge>}
            </div>
          </div>
        </div>
      </div>

      {/* Action Tabs */}
      <div className="flex-shrink-0 flex items-center gap-1 px-4 pt-3 pb-2 overflow-x-auto no-scrollbar" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
        {ACTION_TABS.map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-semibold whitespace-nowrap transition-all ${
                isActive ? 'bg-white/[0.08] text-white border border-white/10' : 'text-white/30 hover:text-white/60 border border-transparent'
              }`}
            >
              <tab.icon className="w-3 h-3" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-5">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
          >
            {activeTab === 'guide' && <GuideTab card={card} />}
            {activeTab === 'farm' && <FarmQueueTab card={card} />}
            {activeTab === 'recruit' && <RecruitTab card={card} />}
            {activeTab === 'bugs' && <BugReportTab card={card} />}
            {activeTab === 'media' && <MediaTab card={card} />}
            {activeTab === 'discuss' && <DiscussTab card={card} chatInput={chatInput} setChatInput={setChatInput} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

// --- SUB TAB COMPONENTS ---

function GlassBox({ children, className = '' }) {
  return (
    <div className={`rounded-xl p-4 ${className}`} style={{
      background: 'rgba(100, 120, 140, 0.06)',
      border: '1px solid rgba(255,255,255,0.05)',
      backdropFilter: 'blur(8px)',
    }}>
      {children}
    </div>
  );
}

function GuideTab({ card }) {
  return (
    <div className="space-y-4">
      <GlassBox>
        <h3 className="text-sm font-bold text-white/80 mb-2">How to Unlock</h3>
        <p className="text-xs text-white/40 leading-relaxed">
          {card.description || 'No guide available yet. Be the first to write one!'}
        </p>
      </GlassBox>
      {card.reward && (
        <GlassBox>
          <h3 className="text-sm font-bold text-white/80 mb-2">Reward</h3>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center text-yellow-400">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-white/70 font-semibold">{card.reward.name || card.reward.type || 'Unknown'}</p>
              {card.reward.description && <p className="text-[11px] text-white/30">{card.reward.description}</p>}
            </div>
          </div>
        </GlassBox>
      )}
      <GlassBox>
        <h3 className="text-sm font-bold text-white/80 mb-3">Community Tips</h3>
        <div className="space-y-2">
          {['Use stealth approach on the left path', 'Bring at least 2 healers for boss phase', 'Timing window is tight — practice in training mode'].map((tip, i) => (
            <div key={i} className="flex items-start gap-2 text-xs text-white/40">
              <ChevronRight className="w-3 h-3 text-cyan-400/50 mt-0.5 flex-shrink-0" />
              <span>{tip}</span>
            </div>
          ))}
        </div>
      </GlassBox>
      <Button variant="outline" className="w-full border-white/8 text-white/40 hover:text-white/70 text-xs h-9">
        <Plus className="w-3 h-3 mr-2" /> Submit a Guide
      </Button>
    </div>
  );
}

function FarmQueueTab({ card }) {
  const mockQueues = [
    { id: 1, host: 'FarmKing', players: 3, max: 4, status: 'Waiting' },
    { id: 2, host: 'GrindSquad', players: 4, max: 4, status: 'Full' },
  ];

  return (
    <div className="space-y-3">
      <p className="text-xs text-white/30 mb-2">Active farm parties for "{card.title}"</p>
      {mockQueues.map(q => (
        <GlassBox key={q.id} className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-white/70">{q.host}'s Party</p>
            <p className="text-[11px] text-white/30">{q.players}/{q.max} players • {q.status}</p>
          </div>
          <Button size="sm" disabled={q.status === 'Full'} className={`text-xs h-7 rounded-md ${q.status === 'Full' ? 'bg-white/5 text-white/20' : 'bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 border border-cyan-500/20'}`}>
            {q.status === 'Full' ? 'Full' : 'Join'}
          </Button>
        </GlassBox>
      ))}
      <Button variant="outline" className="w-full border-white/8 text-white/40 hover:text-white/70 text-xs h-9">
        <Plus className="w-3 h-3 mr-2" /> Create Farm Party
      </Button>
    </div>
  );
}

function RecruitTab({ card }) {
  return (
    <div className="space-y-3">
      <p className="text-xs text-white/30 mb-2">Find help or offer help for "{card.title}"</p>
      <GlassBox>
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold text-white/70">LF 1 more — need tank</p>
          <Badge className="text-[10px] bg-blue-500/15 text-blue-300 border-blue-500/20">NA East</Badge>
        </div>
        <p className="text-[11px] text-white/30">Posted by @RaidLeader • 5m ago</p>
      </GlassBox>
      <GlassBox>
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold text-white/70">Sherpa run — all welcome</p>
          <Badge className="text-[10px] bg-green-500/15 text-green-300 border-green-500/20">Open</Badge>
        </div>
        <p className="text-[11px] text-white/30">Posted by @Helper42 • 20m ago</p>
      </GlassBox>
      <Button variant="outline" className="w-full border-white/8 text-white/40 hover:text-white/70 text-xs h-9">
        <UserPlus className="w-3 h-3 mr-2" /> Post Recruitment
      </Button>
    </div>
  );
}

function BugReportTab({ card }) {
  return (
    <div className="space-y-3">
      <p className="text-xs text-white/30 mb-2">Known issues for "{card.title}"</p>
      <GlassBox>
        <div className="flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-red-400/60 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-xs font-semibold text-white/70">Progress doesn't track in co-op</p>
            <p className="text-[11px] text-white/30">12 reports • Acknowledged by devs</p>
          </div>
        </div>
      </GlassBox>
      <Button variant="outline" className="w-full border-white/8 text-white/40 hover:text-white/70 text-xs h-9">
        <AlertCircle className="w-3 h-3 mr-2" /> Report a Bug
      </Button>
    </div>
  );
}

function MediaTab({ card }) {
  return (
    <div className="space-y-3">
      <p className="text-xs text-white/30 mb-2">Community videos & guides for "{card.title}"</p>
      {[1, 2].map(i => (
        <GlassBox key={i} className="flex items-center gap-3 cursor-pointer group">
          <div className="w-20 h-12 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
            <Video className="w-5 h-5 text-white/20 group-hover:text-cyan-400 transition-colors" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-white/70 group-hover:text-white transition-colors truncate">Speed run walkthrough #{i}</p>
            <p className="text-[11px] text-white/30">@Creator{i} • 2.4k views</p>
          </div>
        </GlassBox>
      ))}
      <Button variant="outline" className="w-full border-white/8 text-white/40 hover:text-white/70 text-xs h-9">
        <Video className="w-3 h-3 mr-2" /> Upload Video
      </Button>
    </div>
  );
}

function DiscussTab({ card, chatInput, setChatInput }) {
  const mockMessages = [
    { id: 1, user: 'TrophyHunter', msg: 'Has anyone figured out the hidden step?', time: '2m' },
    { id: 2, user: 'GuideMaster', msg: 'You need to interact with the NPC first before the door opens.', time: '5m' },
    { id: 3, user: 'Newbie99', msg: 'Thanks! That worked perfectly', time: '8m' },
  ];

  return (
    <div className="flex flex-col h-full min-h-[300px]">
      <p className="text-xs text-white/30 mb-3">Chat about "{card.title}"</p>
      <div className="flex-1 space-y-2 mb-3">
        {mockMessages.map(m => (
          <div key={m.id} className="flex items-start gap-2">
            <div className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center text-[10px] font-bold text-white/30 flex-shrink-0 mt-0.5">
              {m.user[0]}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-semibold text-white/60">{m.user}</span>
                <span className="text-[10px] text-white/20">{m.time}</span>
              </div>
              <p className="text-xs text-white/40">{m.msg}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <Input
          value={chatInput}
          onChange={(e) => setChatInput(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 h-8 text-xs bg-white/[0.04] border-white/[0.06] text-white placeholder:text-white/20 rounded-lg"
        />
        <Button size="sm" className="h-8 w-8 p-0 bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 border border-cyan-500/20 rounded-lg">
          <Send className="w-3 h-3" />
        </Button>
      </div>
    </div>
  );
}
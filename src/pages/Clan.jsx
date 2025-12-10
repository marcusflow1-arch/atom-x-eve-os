import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, Shield, Calendar, MessageSquare, Plus, Search, 
  Crown, Sword, Star, Trophy, Settings, LogOut, X, 
  ChevronRight, MapPin, Clock, UserPlus, Send, Radio, Edit
} from 'lucide-react';
import { useAuth } from '../components/auth/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';

// --- Components ---

const CreateClanModal = ({ isOpen, onClose, onCreate }) => {
  const [formData, setFormData] = useState({ name: '', description: '', gameTags: '' });

  const handleSubmit = (e) => {
    e.preventDefault();
    onCreate({ 
      ...formData, 
      gameTags: formData.gameTags.split(',').map(t => t.trim()) 
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-slate-900 border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl"
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white">Establish New Division</h2>
          <button onClick={onClose}><X className="w-5 h-5 text-slate-400 hover:text-white" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Division Name</label>
            <Input 
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
              className="bg-black/20 border-white/10 text-white"
              placeholder="e.g. Solar Vanguard"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Manifesto</label>
            <textarea 
              value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})}
              className="w-full bg-black/20 border border-white/10 rounded-md p-3 text-sm text-white focus:outline-none focus:border-blue-500"
              placeholder="What is your clan about?"
              rows={3}
              required
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Focus Tags (comma separated)</label>
            <Input 
              value={formData.gameTags}
              onChange={e => setFormData({...formData, gameTags: e.target.value})}
              className="bg-black/20 border-white/10 text-white"
              placeholder="e.g. PVP, Raids, Casual"
            />
          </div>
          <div className="pt-4 flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white">Create Division</Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

const InviteMemberModal = ({ isOpen, onClose, onInvite }) => {
  const [email, setEmail] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onInvite(email);
    setEmail('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-slate-900 border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl"
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white">Recruit Agent</h2>
          <button onClick={onClose}><X className="w-5 h-5 text-slate-400 hover:text-white" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Agent Email</label>
            <Input 
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="bg-black/20 border-white/10 text-white"
              placeholder="agent@example.com"
              required
              type="email"
            />
          </div>
          <div className="pt-4 flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white">Send Invite</Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

const ClanCard = ({ clan, onJoin }) => (
  <div className="bg-white/5 border border-white/10 rounded-xl p-5 hover:bg-white/10 transition-all group">
    <div className="flex justify-between items-start mb-4">
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-slate-700 to-slate-900 border border-white/10 flex items-center justify-center overflow-hidden">
          {clan.icon ? <img src={clan.icon} alt={clan.name} className="w-full h-full object-cover" /> : <Shield className="w-8 h-8 text-slate-500" />}
        </div>
        <div>
          <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors">{clan.name}</h3>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Users className="w-3 h-3" /> {clan.memberCount} Members
            <span className="w-1.5 h-1.5 bg-slate-600 rounded-full" />
            <Star className="w-3 h-3 text-yellow-500" /> Lvl {clan.level}
          </div>
        </div>
      </div>
      <Button size="sm" onClick={() => onJoin(clan)} variant="outline" className="border-blue-500/30 text-blue-400 hover:bg-blue-500/10">
        View
      </Button>
    </div>
    <p className="text-sm text-slate-400 line-clamp-2 mb-4">{clan.description}</p>
    <div className="flex flex-wrap gap-2">
      {clan.gameTags?.map((tag, i) => (
        <Badge key={i} variant="secondary" className="bg-black/30 text-slate-300 border border-white/5">{tag}</Badge>
      ))}
    </div>
  </div>
);

const EventCard = ({ event, onJoin, isJoined }) => (
  <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex gap-4 hover:border-white/20 transition-all">
    <div className="flex-shrink-0 w-16 flex flex-col items-center justify-center bg-black/20 rounded-lg border border-white/5">
      <span className="text-xs font-bold text-slate-500 uppercase">{format(new Date(event.startTime), 'MMM')}</span>
      <span className="text-xl font-bold text-white">{format(new Date(event.startTime), 'd')}</span>
    </div>
    <div className="flex-1">
      <div className="flex justify-between items-start">
        <h4 className="text-white font-bold">{event.title}</h4>
        <Badge className={`
          ${event.eventType === 'raid' ? 'bg-red-500/20 text-red-400 border-red-500/30' : 
            event.eventType === 'tournament' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' : 
            'bg-blue-500/20 text-blue-400 border-blue-500/30'}
        `}>
          {event.eventType}
        </Badge>
      </div>
      <p className="text-sm text-slate-400 mt-1 mb-3">{event.description}</p>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 text-xs text-slate-500">
          <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {format(new Date(event.startTime), 'h:mm a')}</span>
          <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {event.participants?.length || 0}/{event.maxParticipants}</span>
        </div>
        <Button 
          size="sm" 
          disabled={isJoined}
          onClick={() => onJoin(event.id)}
          className={isJoined ? "bg-green-600/20 text-green-400" : "bg-white/10 hover:bg-white/20"}
        >
          {isJoined ? 'Joined' : 'Join Party'}
        </Button>
      </div>
    </div>
  </div>
);

// --- Main Page ---

export default function ClanPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('overview');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [settingsData, setSettingsData] = useState({ description: '', banner: '' });

  // 1. Fetch User's Clan Membership
  const { data: membership, isLoading: loadingMembership } = useQuery({
    queryKey: ['myClanMembership', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const members = await base44.entities.ClanMember.filter({ userId: user.id });
      return members[0] || null;
    },
    enabled: !!user
  });

  // 2. Fetch Clan Details (if member)
  const { data: myClan, isLoading: loadingClan } = useQuery({
    queryKey: ['myClan', membership?.divisionId],
    queryFn: async () => {
        if (!membership) return null;
        return await base44.entities.Division.get(membership.divisionId);
    },
    enabled: !!membership
  });

  // Pre-fill settings
  useEffect(() => {
    if (myClan) {
      setSettingsData({ description: myClan.description, banner: myClan.banner });
    }
  }, [myClan]);

  // 3. Fetch All Clans (if not member)
  const { data: allClans, isLoading: loadingAllClans } = useQuery({
    queryKey: ['allClans'],
    queryFn: async () => base44.entities.Division.list(),
    enabled: !membership
  });

  // 4. Fetch Clan Events
  const { data: events } = useQuery({
    queryKey: ['clanEvents', myClan?.id],
    queryFn: async () => {
        if (!myClan) return [];
        return await base44.entities.ClanEvent.filter({ divisionId: myClan.id });
    },
    enabled: !!myClan,
    refetchInterval: 30000
  });

  // 5. Fetch Clan Messages
  const { data: messages } = useQuery({
    queryKey: ['clanMessages', myClan?.id],
    queryFn: async () => {
        if (!myClan) return [];
        // Ideally sorting would happen on backend
        const msgs = await base44.entities.ClanMessage.filter({ divisionId: myClan.id });
        return msgs.sort((a, b) => new Date(a.created_date) - new Date(b.created_date)); 
    },
    enabled: !!myClan && activeTab === 'chat',
    refetchInterval: 5000
  });

  // 6. Fetch Members
  const { data: members } = useQuery({
      queryKey: ['clanMembers', myClan?.id],
      queryFn: async () => {
          if (!myClan) return [];
          const clanMembers = await base44.entities.ClanMember.filter({ divisionId: myClan.id });
          // Fetch user details for each member
          const memberDetails = await Promise.all(clanMembers.map(async (m) => {
              const u = await base44.entities.User.get(m.userId);
              return { ...m, user: u };
          }));
          return memberDetails;
      },
      enabled: !!myClan && activeTab === 'roster'
  });


  // Mutations
  const createClanMutation = useMutation({
    mutationFn: (data) => base44.functions.invoke('clanSystem', { action: 'create_clan', data }),
    onSuccess: (res) => {
      if (res.data.success) {
        queryClient.invalidateQueries(['myClanMembership']);
        setIsCreateModalOpen(false);
      }
    }
  });

  const sendMessageMutation = useMutation({
    mutationFn: (content) => base44.entities.ClanMessage.create({
        divisionId: myClan.id,
        author: user.username || 'Unknown',
        authorAvatar: user.avatar_url,
        content,
        isAnnouncement: false,
        isPinned: false
    }),
    onSuccess: () => {
        setChatMessage('');
        queryClient.invalidateQueries(['clanMessages']);
    }
  });

  const createEventMutation = useMutation({
      mutationFn: (data) => base44.entities.ClanEvent.create({
          divisionId: myClan.id,
          creatorId: user.id,
          ...data
      }),
      onSuccess: () => queryClient.invalidateQueries(['clanEvents'])
  });

  const joinEventMutation = useMutation({
      mutationFn: (eventId) => base44.functions.invoke('clanSystem', { action: 'join_event', data: { eventId } }),
      onSuccess: () => queryClient.invalidateQueries(['clanEvents'])
  });

  const inviteMemberMutation = useMutation({
    mutationFn: (email) => base44.functions.invoke('clanSystem', { action: 'invite_member', data: { divisionId: myClan.id, inviteeEmail: email } }),
    onSuccess: (res) => {
      if (res.data.success) {
        alert("Invite sent successfully!");
        setIsInviteModalOpen(false);
      } else {
        alert(res.data.error || "Failed to invite");
      }
    }
  });

  const updateClanMutation = useMutation({
    mutationFn: (updates) => base44.functions.invoke('clanSystem', { action: 'update_clan', data: { divisionId: myClan.id, updates } }),
    onSuccess: () => {
      alert("Settings updated!");
      queryClient.invalidateQueries(['myClan']);
    }
  });

  // --- Render Logic ---

  if (loadingMembership || (membership && loadingClan)) {
    return <div className="h-screen flex items-center justify-center text-slate-500">Loading Sector Data...</div>;
  }

  // Not in a clan view
  if (!membership) {
    return (
      <div className="min-h-screen bg-slate-950 text-white p-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-end mb-12">
            <div>
              <h1 className="text-4xl font-black tracking-tighter mb-2">Divisions</h1>
              <p className="text-slate-400">Join an elite unit or establish your own legacy.</p>
            </div>
            <Button 
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-500 text-white px-8 h-12 rounded-xl font-bold shadow-lg shadow-blue-900/20"
            >
              <Plus className="w-5 h-5 mr-2" /> Establish Division
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {allClans?.map(clan => (
              <ClanCard key={clan.id} clan={clan} onJoin={(c) => alert(`Request to join ${c.name} sent!`)} />
            ))}
            {(!allClans || allClans.length === 0) && (
                <div className="col-span-full py-20 text-center text-slate-500 border border-dashed border-white/10 rounded-3xl">
                    <Shield className="w-16 h-16 mx-auto mb-4 opacity-20" />
                    <p>No active divisions found. Be the first to start one.</p>
                </div>
            )}
          </div>
        </div>
        <CreateClanModal 
          isOpen={isCreateModalOpen} 
          onClose={() => setIsCreateModalOpen(false)} 
          onCreate={(data) => createClanMutation.mutate(data)} 
        />
      </div>
    );
  }

  // Clan Dashboard View
  const isLeader = membership.role === 'leader';

  return (
    <div className="h-screen w-full bg-slate-950 text-white flex overflow-hidden">
      
      {/* Sidebar Navigation */}
      <div className="w-64 bg-slate-900 border-r border-white/5 flex flex-col p-4">
        <div className="mb-8 p-2">
           <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center mb-4 shadow-lg shadow-blue-500/20">
              {myClan.icon ? <img src={myClan.icon} className="w-full h-full object-cover rounded-xl" /> : <Shield className="w-6 h-6 text-white" />}
           </div>
           <h2 className="font-bold text-lg leading-tight">{myClan.name}</h2>
           <p className="text-xs text-slate-500 mt-1 uppercase tracking-wider">Level {myClan.level} Division</p>
        </div>

        <nav className="space-y-1 flex-1">
          {[
            { id: 'overview', label: 'Overview', icon: Star },
            { id: 'roster', label: 'Roster', icon: Users },
            { id: 'events', label: 'Operations', icon: Calendar },
            { id: 'chat', label: 'Comms', icon: MessageSquare },
            ...(isLeader ? [{ id: 'settings', label: 'Settings', icon: Settings }] : []),
          ].map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === item.id 
                  ? 'bg-blue-600/10 text-blue-400' 
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="pt-4 border-t border-white/5">
           <Button variant="ghost" className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-900/10">
              <LogOut className="w-4 h-4 mr-2" /> Leave Division
           </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden bg-slate-950 relative">
        {/* Header Graphic */}
        <div className="h-48 w-full relative">
            <div className="absolute inset-0 bg-gradient-to-b from-blue-900/20 to-slate-950" />
            <img src={myClan.banner || "https://images.unsplash.com/photo-1533134486753-c833f0ed4866?w=1200"} className="w-full h-full object-cover opacity-30 mix-blend-overlay" />
            <div className="absolute bottom-6 left-8">
               <h1 className="text-3xl font-black uppercase tracking-widest">{activeTab}</h1>
            </div>
        </div>

        <div className="flex-1 overflow-y-auto p-8">
            <div className="max-w-5xl mx-auto">
                
                {activeTab === 'overview' && (
                    <div className="grid grid-cols-3 gap-6">
                        <div className="col-span-2 space-y-6">
                            {/* Announcements */}
                            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                                <h3 className="text-sm font-bold text-slate-400 uppercase mb-4 flex items-center gap-2">
                                   <Radio className="w-4 h-4" /> Priority Transmission
                                </h3>
                                <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                                    <p className="text-blue-100 italic">"Welcome to the division. We raid every Friday at 20:00 EST. Prepare your loadouts."</p>
                                    <div className="mt-2 text-right text-xs text-blue-400 font-bold">- Commander</div>
                                </div>
                            </div>

                            {/* Recent Activity */}
                            <div className="space-y-4">
                                <h3 className="text-sm font-bold text-slate-400 uppercase">Recent Activity</h3>
                                {[1,2,3].map(i => (
                                    <div key={i} className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/5">
                                        <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center">
                                            <Trophy className="w-4 h-4 text-yellow-500" />
                                        </div>
                                        <div>
                                            <p className="text-sm text-white"><span className="font-bold text-blue-400">SlayerX</span> achieved <span className="font-bold text-yellow-400">Dragon Hunter</span></p>
                                            <p className="text-xs text-slate-500">2 hours ago</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-6">
                            {/* Stats */}
                            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                                <div className="space-y-4">
                                    <div>
                                        <div className="text-xs text-slate-500 uppercase">Total XP</div>
                                        <div className="text-2xl font-mono font-bold text-white">2,540,200</div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-slate-500 uppercase">Global Rank</div>
                                        <div className="text-2xl font-mono font-bold text-white">#42</div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-slate-500 uppercase">Active Members</div>
                                        <div className="text-2xl font-mono font-bold text-white">24<span className="text-slate-500 text-sm">/50</span></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'roster' && (
                    <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                        <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/5">
                            <h3 className="font-bold text-white">Active Personnel</h3>
                            <Button size="sm" onClick={() => setIsInviteModalOpen(true)} className="bg-blue-600 hover:bg-blue-500"><UserPlus className="w-4 h-4 mr-2" /> Invite</Button>
                        </div>
                        <div className="divide-y divide-white/5">
                            {members?.map(member => (
                                <div key={member.id} className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-slate-800 overflow-hidden">
                                            {member.user?.avatar_url && <img src={member.user.avatar_url} className="w-full h-full object-cover" />}
                                        </div>
                                        <div>
                                            <div className="font-bold text-white flex items-center gap-2">
                                                {member.user?.full_name || 'Unknown Agent'}
                                                {member.role === 'leader' && <Crown className="w-3 h-3 text-yellow-500" />}
                                            </div>
                                            <div className="text-xs text-slate-500 capitalize">{member.role} • Joined {format(new Date(member.joinedAt), 'MMM d, yyyy')}</div>
                                        </div>
                                    </div>
                                    <Badge variant="outline" className="border-green-500/30 text-green-400 bg-green-500/10">Online</Badge>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'events' && (
                    <div className="space-y-6">
                        <div className="flex justify-between items-center">
                            <h3 className="text-lg font-bold text-white">Scheduled Operations</h3>
                            <Button 
                                onClick={() => createEventMutation.mutate({ title: 'New Raid', description: 'Weekly Raid', startTime: new Date().toISOString(), eventType: 'raid' })}
                                className="bg-blue-600 hover:bg-blue-500"
                            >
                                <Plus className="w-4 h-4 mr-2" /> Create Operation
                            </Button>
                        </div>
                        <div className="grid gap-4">
                            {events?.map(event => (
                                <EventCard 
                                    key={event.id} 
                                    event={event} 
                                    onJoin={(id) => joinEventMutation.mutate(id)} 
                                    isJoined={event.participants?.includes(user?.id)}
                                />
                            ))}
                            {(!events || events.length === 0) && (
                                <div className="text-center py-12 text-slate-500">No active operations scheduled.</div>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'chat' && (
                    <div className="bg-white/5 border border-white/10 rounded-2xl flex flex-col h-[600px]">
                        <div className="flex-1 p-4 overflow-y-auto space-y-4">
                            {messages?.map(msg => (
                                <div key={msg.id} className={`flex gap-3 ${msg.author === user.username ? 'flex-row-reverse' : ''}`}>
                                    <div className="w-8 h-8 rounded-full bg-slate-700 flex-shrink-0" />
                                    <div className={`max-w-[70%] rounded-2xl p-3 ${
                                        msg.author === user.username 
                                            ? 'bg-blue-600 text-white rounded-tr-none' 
                                            : 'bg-white/10 text-slate-200 rounded-tl-none'
                                    }`}>
                                        <div className="text-xs opacity-50 mb-1">{msg.author}</div>
                                        <p className="text-sm">{msg.content}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="p-4 border-t border-white/10 bg-white/5">
                            <form 
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    if(chatMessage.trim()) sendMessageMutation.mutate(chatMessage);
                                }}
                                className="flex gap-2"
                            >
                                <Input 
                                    value={chatMessage}
                                    onChange={e => setChatMessage(e.target.value)}
                                    placeholder="Transmission..."
                                    className="bg-black/20 border-white/10 text-white"
                                />
                                <Button type="submit" size="icon" className="bg-blue-600 hover:bg-blue-500">
                                    <Send className="w-4 h-4" />
                                </Button>
                            </form>
                        </div>
                    </div>
                )}

                {activeTab === 'settings' && isLeader && (
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-6">
                    <div>
                      <h3 className="text-lg font-bold text-white mb-4">Division Settings</h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Manifesto</label>
                          <textarea 
                            value={settingsData.description}
                            onChange={e => setSettingsData({...settingsData, description: e.target.value})}
                            className="w-full bg-black/20 border border-white/10 rounded-md p-3 text-sm text-white"
                            rows={3}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Banner URL</label>
                          <Input 
                            value={settingsData.banner}
                            onChange={e => setSettingsData({...settingsData, banner: e.target.value})}
                            className="bg-black/20 border-white/10 text-white"
                          />
                        </div>
                        <Button 
                          onClick={() => updateClanMutation.mutate(settingsData)}
                          className="bg-blue-600 hover:bg-blue-500"
                        >
                          Save Changes
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

            </div>
        </div>

        <InviteMemberModal 
          isOpen={isInviteModalOpen}
          onClose={() => setIsInviteModalOpen(false)}
          onInvite={(email) => inviteMemberMutation.mutate(email)}
        />
      </div>
    </div>
  );
}
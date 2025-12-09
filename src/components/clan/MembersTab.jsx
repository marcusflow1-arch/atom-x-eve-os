import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, MessageSquare, UserPlus, Repeat, Crown, Shield, Award, UserMinus, Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const rankStyles = {
  Leader: 'bg-yellow-500/30 border-yellow-400/50 text-yellow-300',
  Officer: 'bg-cyan-500/30 border-cyan-400/50 text-cyan-300',
  Member: 'bg-slate-500/30 border-slate-400/50 text-slate-300',
  Recruit: 'bg-green-500/30 border-green-400/50 text-green-300',
};

const statusColors = {
  online: 'bg-green-500 ring-green-400/50',
  away: 'bg-yellow-500 ring-yellow-400/50',
  offline: 'bg-gray-600 ring-gray-500/50',
};

const MemberRow = ({ member, currentUser, onPromote, onDemote, onKick, onMessage, onTrade }) => {
    const canManage = currentUser.role === 'Leader' || (currentUser.role === 'Officer' && member.role !== 'Leader' && member.role !== 'Officer');
    
    return (
        <motion.div
            layout
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-12 items-center p-4 bg-slate-800/50 rounded-lg hover:bg-slate-800 transition-colors"
        >
            <div className="col-span-4 flex items-center gap-3">
                <div className="relative">
                    <img src={member.avatar} alt={member.name} className="w-12 h-12 rounded-full" />
                    <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full ring-2 ${statusColors[member.status]}`}></div>
                </div>
                <div>
                    <div className="flex items-center gap-2">
                        <span className="font-semibold text-white">{member.name}</span>
                        {member.role === 'Leader' && <Crown className="w-4 h-4 text-yellow-400" />}
                        {member.role === 'Officer' && <Shield className="w-4 h-4 text-cyan-400" />}
                    </div>
                    <p className="text-xs text-slate-400">Joined: {member.joinedAt}</p>
                </div>
            </div>
            <div className="col-span-2">
                <span className={`text-xs font-semibold px-2 py-1 rounded-full border ${rankStyles[member.role]}`}>
                    {member.role}
                </span>
            </div>
            <div className="col-span-3">
                <p className="text-sm text-slate-300">{member.activity}</p>
                <p className="text-xs text-slate-500">Last seen: {member.lastSeen}</p>
            </div>
            <div className="col-span-3 flex justify-end gap-1">
                <Button variant="ghost" size="icon" onClick={() => onMessage(member)} title="Send Message">
                    <MessageSquare className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => onTrade(member)} title="Initiate Trade">
                    <Repeat className="w-4 h-4" />
                </Button>
                {canManage && member.name !== currentUser.name && (
                    <>
                        {member.role !== 'Leader' && (
                            <Button variant="ghost" size="icon" onClick={() => onPromote(member)} title="Promote">
                                <UserPlus className="w-4 h-4" />
                            </Button>
                        )}
                        {member.role !== 'Recruit' && member.role !== 'Leader' && (
                            <Button variant="ghost" size="icon" onClick={() => onDemote(member)} title="Demote">
                                <UserMinus className="w-4 h-4" />
                            </Button>
                        )}
                        <Button variant="ghost" size="icon" onClick={() => onKick(member)} title="Kick Member" className="text-red-400 hover:text-red-300">
                            <Settings className="w-4 h-4" />
                        </Button>
                    </>
                )}
            </div>
        </motion.div>
    );
};

export default function MembersTab({ members, onlineMembers, currentUser }) {
    const [search, setSearch] = useState('');
    const [filterRole, setFilterRole] = useState('all');
    const [filterStatus, setFilterStatus] = useState('all');
    const [showMemberDetails, setShowMemberDetails] = useState(null);

    const filteredMembers = members.filter(m => {
        return (
            m.name.toLowerCase().includes(search.toLowerCase()) &&
            (filterRole === 'all' || m.role === filterRole) &&
            (filterStatus === 'all' || m.status === filterStatus)
        );
    });

    const handlePromote = (member) => {
        console.log('Promoting member:', member.name);
        // Integrate with backend to promote member
    };

    const handleDemote = (member) => {
        console.log('Demoting member:', member.name);
        // Integrate with backend to demote member
    };

    const handleKick = (member) => {
        if (window.confirm(`Are you sure you want to kick ${member.name}?`)) {
            console.log('Kicking member:', member.name);
            // Integrate with backend to kick member
        }
    };

    const handleMessage = (member) => {
        console.log('Messaging member:', member.name);
        // Open messaging interface
    };

    const handleTrade = (member) => {
        console.log('Trading with member:', member.name);
        // Open trade interface
    };

    return (
        <div className="space-y-6">
            {/* Member Stats */}
            <div className="grid grid-cols-4 gap-4">
                <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700">
                    <h3 className="text-2xl font-bold text-white">{members.length}</h3>
                    <p className="text-sm text-slate-400">Total Members</p>
                </div>
                <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700">
                    <h3 className="text-2xl font-bold text-green-400">{onlineMembers.length}</h3>
                    <p className="text-sm text-slate-400">Online Now</p>
                </div>
                <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700">
                    <h3 className="text-2xl font-bold text-cyan-400">{members.filter(m => m.role === 'Officer').length}</h3>
                    <p className="text-sm text-slate-400">Officers</p>
                </div>
                <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700">
                    <h3 className="text-2xl font-bold text-green-400">{members.filter(m => m.role === 'Recruit').length}</h3>
                    <p className="text-sm text-slate-400">New Recruits</p>
                </div>
            </div>

            {/* Filters */}
            <div className="flex gap-4 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                <div className="relative flex-grow">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <Input 
                        placeholder="Search members..." 
                        value={search} 
                        onChange={e => setSearch(e.target.value)} 
                        className="pl-10 bg-slate-900 border-slate-600"
                    />
                </div>
                <Select value={filterRole} onValueChange={setFilterRole}>
                    <SelectTrigger className="w-[180px] bg-slate-900 border-slate-600">
                        <SelectValue placeholder="Filter by Role" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Roles</SelectItem>
                        <SelectItem value="Leader">Leader</SelectItem>
                        <SelectItem value="Officer">Officer</SelectItem>
                        <SelectItem value="Member">Member</SelectItem>
                        <SelectItem value="Recruit">Recruit</SelectItem>
                    </SelectContent>
                </Select>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-[180px] bg-slate-900 border-slate-600">
                        <SelectValue placeholder="Filter by Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="online">Online</SelectItem>
                        <SelectItem value="away">Away</SelectItem>
                        <SelectItem value="offline">Offline</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Members List */}
            <div className="space-y-2">
                <div className="grid grid-cols-12 p-3 text-xs font-bold text-slate-400 uppercase bg-slate-800/30 rounded">
                    <div className="col-span-4">Member</div>
                    <div className="col-span-2">Rank</div>
                    <div className="col-span-3">Activity</div>
                    <div className="col-span-3 text-right">Actions</div>
                </div>
                <div className="max-h-96 overflow-y-auto space-y-2">
                    <AnimatePresence>
                        {filteredMembers.map(member => (
                            <MemberRow 
                                key={member.id} 
                                member={member} 
                                currentUser={currentUser}
                                onPromote={handlePromote}
                                onDemote={handleDemote}
                                onKick={handleKick}
                                onMessage={handleMessage}
                                onTrade={handleTrade}
                            />
                        ))}
                    </AnimatePresence>
                </div>
            </div>

            {/* Invite New Members */}
            {(currentUser.role === 'Leader' || currentUser.role === 'Officer') && (
                <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700">
                    <h3 className="text-lg font-bold text-white mb-3">Invite New Members</h3>
                    <div className="flex gap-2">
                        <Input placeholder="Enter username or email" className="flex-grow bg-slate-900 border-slate-600" />
                        <Button>Send Invite</Button>
                    </div>
                </div>
            )}
        </div>
    );
}
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PlusCircle, Swords, Users, ShieldCheck, Repeat, Trophy, Calendar, Gamepad2, Target, Clock, Award, Star, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

const events = [
    { id: 1, title: "Diablo II Hellfire Run", time: "Tonight @ 8PM EST", game: "Diablo II: Eternal", attendees: 5, maxAttendees: 8 },
    { id: 2, title: "Vanguard Ops Qualifiers", time: "Tomorrow @ 3PM EST", game: "Vanguard Ops", attendees: 12, maxAttendees: 16 },
    { id: 3, title: "RE4 Mercenaries High Score Chase", time: "Sunday @ 7PM EST", game: "Resident Evil 4", attendees: 3, maxAttendees: 6 },
];

const clanAchievements = [
    { id: 1, title: "Raid Conquerors", description: "Complete 25 guild raids", progress: 18, target: 25, reward: "Guild Banner: Crimson Storm" },
    { id: 2, title: "PvP Dominance", description: "Win 50 clan wars", progress: 34, target: 50, reward: "Exclusive Guild Mount" },
    { id: 3, title: "Community Builder", description: "Recruit 100 active members", progress: 67, target: 100, reward: "Guild Hall Expansion" }
];

const Tile = ({ icon, title, subtitle, className, onClick }) => (
    <motion.div
        whileHover={{ scale: 1.05, zIndex: 10 }}
        whileTap={{ scale: 0.98 }}
        className={`bg-slate-800/70 rounded-lg p-4 flex flex-col items-center justify-center text-center cursor-pointer border border-slate-700 hover:border-cyan-400 transition-all ${className}`}
        onClick={onClick}
    >
        {icon}
        <h3 className="mt-2 font-bold text-white">{title}</h3>
        <p className="text-xs text-slate-400">{subtitle}</p>
    </motion.div>
);

export default function DashboardTab({ currentUser, onlineMembers }) {
    const [showCreateRaid, setShowCreateRaid] = useState(false);
    const [showCreateDivision, setShowCreateDivision] = useState(false);
    const [raidForm, setRaidForm] = useState({
        name: '',
        type: 'pve',
        maxPlayers: 8,
        description: '',
        scheduledTime: ''
    });
    const [divisionForm, setDivisionForm] = useState({
        name: '',
        description: '',
        isPrivate: false,
        password: ''
    });

    const handleCreateRaid = () => {
        console.log('Creating raid:', raidForm);
        // Here you would integrate with backend
        setShowCreateRaid(false);
        setRaidForm({ name: '', type: 'pve', maxPlayers: 8, description: '', scheduledTime: '' });
    };

    const handleCreateDivision = () => {
        console.log('Creating division:', divisionForm);
        // Here you would integrate with backend
        setShowCreateDivision(false);
        setDivisionForm({ name: '', description: '', isPrivate: false, password: '' });
    };

    return (
        <div className="space-y-6">
            {/* Quick Actions Grid */}
            <div className="grid grid-cols-3 lg:grid-cols-6 gap-4">
                <Tile 
                    icon={<PlusCircle className="w-8 h-8 text-green-400"/>} 
                    title="Create Division" 
                    subtitle="Start a new group" 
                    onClick={() => setShowCreateDivision(true)}
                />
                <Tile 
                    icon={<Swords className="w-8 h-8 text-red-400"/>} 
                    title="Start a Raid" 
                    subtitle="Assemble your team" 
                    onClick={() => setShowCreateRaid(true)}
                />
                <Tile 
                    icon={<Users className="w-8 h-8 text-blue-400"/>} 
                    title="View Members" 
                    subtitle={`${onlineMembers.length} online`}
                />
                <Tile 
                    icon={<ShieldCheck className="w-8 h-8 text-yellow-400"/>} 
                    title="Plan an Event" 
                    subtitle="Schedule activities"
                />
                <Tile 
                    icon={<Repeat className="w-8 h-8 text-purple-400"/>} 
                    title="Initiate Trade" 
                    subtitle="Exchange items"
                />
                <Tile 
                    icon={<Gamepad2 className="w-8 h-8 text-orange-400"/>} 
                    title="Active Lobbies" 
                    subtitle="Join active games"
                />
            </div>

            {/* Create Raid Modal */}
            {showCreateRaid && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
                    onClick={() => setShowCreateRaid(false)}
                >
                    <div className="bg-slate-800 p-6 rounded-lg w-96" onClick={e => e.stopPropagation()}>
                        <h3 className="text-xl font-bold text-white mb-4">Create Raid</h3>
                        <div className="space-y-4">
                            <Input
                                placeholder="Raid Name"
                                value={raidForm.name}
                                onChange={(e) => setRaidForm({...raidForm, name: e.target.value})}
                            />
                            <Select value={raidForm.type} onValueChange={(value) => setRaidForm({...raidForm, type: value})}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Raid Type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="pve">PvE Mission</SelectItem>
                                    <SelectItem value="pvp">PvP Battle</SelectItem>
                                    <SelectItem value="gvg">Guild vs Guild</SelectItem>
                                </SelectContent>
                            </Select>
                            <Input
                                type="number"
                                placeholder="Max Players"
                                value={raidForm.maxPlayers}
                                onChange={(e) => setRaidForm({...raidForm, maxPlayers: parseInt(e.target.value)})}
                            />
                            <Textarea
                                placeholder="Description"
                                value={raidForm.description}
                                onChange={(e) => setRaidForm({...raidForm, description: e.target.value})}
                            />
                            <Input
                                type="datetime-local"
                                value={raidForm.scheduledTime}
                                onChange={(e) => setRaidForm({...raidForm, scheduledTime: e.target.value})}
                            />
                            <div className="flex gap-2">
                                <Button onClick={handleCreateRaid} className="flex-1">Create Raid</Button>
                                <Button variant="outline" onClick={() => setShowCreateRaid(false)}>Cancel</Button>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Create Division Modal */}
            {showCreateDivision && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
                    onClick={() => setShowCreateDivision(false)}
                >
                    <div className="bg-slate-800 p-6 rounded-lg w-96" onClick={e => e.stopPropagation()}>
                        <h3 className="text-xl font-bold text-white mb-4">Create Division</h3>
                        <div className="space-y-4">
                            <Input
                                placeholder="Division Name"
                                value={divisionForm.name}
                                onChange={(e) => setDivisionForm({...divisionForm, name: e.target.value})}
                            />
                            <Textarea
                                placeholder="Description"
                                value={divisionForm.description}
                                onChange={(e) => setDivisionForm({...divisionForm, description: e.target.value})}
                            />
                            <div className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    id="private"
                                    checked={divisionForm.isPrivate}
                                    onChange={(e) => setDivisionForm({...divisionForm, isPrivate: e.target.checked})}
                                />
                                <label htmlFor="private" className="text-sm text-slate-300">Private Division</label>
                            </div>
                            {divisionForm.isPrivate && (
                                <Input
                                    placeholder="Password"
                                    type="password"
                                    value={divisionForm.password}
                                    onChange={(e) => setDivisionForm({...divisionForm, password: e.target.value})}
                                />
                            )}
                            <div className="flex gap-2">
                                <Button onClick={handleCreateDivision} className="flex-1">Create Division</Button>
                                <Button variant="outline" onClick={() => setShowCreateDivision(false)}>Cancel</Button>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Upcoming Events */}
                <div className="lg:col-span-2 bg-slate-800/70 rounded-lg p-6 border border-slate-700">
                    <h3 className="font-bold text-lg text-white mb-4 flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-yellow-400"/> Upcoming Events
                    </h3>
                    <div className="space-y-3">
                        {events.map(event => (
                            <div key={event.id} className="bg-slate-700/50 p-4 rounded-md">
                                <div className="flex justify-between items-start mb-2">
                                    <h4 className="font-semibold text-blue-300">{event.title}</h4>
                                    <span className="text-xs text-slate-400">{event.attendees}/{event.maxAttendees}</span>
                                </div>
                                <div className="text-xs text-slate-300 flex justify-between items-center">
                                    <span>{event.time}</span>
                                    <span className="font-bold text-slate-400">{event.game}</span>
                                </div>
                                <Button size="sm" className="mt-2 w-full">Join Event</Button>
                            </div>
                        ))}
                    </div>
                    <Button className="w-full mt-4" variant="outline">Create New Event</Button>
                </div>
            
                {/* Online Members */}
                <div className="bg-slate-800/70 rounded-lg p-6 border border-slate-700">
                    <h3 className="font-bold text-lg text-white mb-4 flex items-center gap-2">
                        <Users className="w-5 h-5 text-green-400"/> Online Now ({onlineMembers.length})
                    </h3>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                        {onlineMembers.map(member => (
                            <div key={member.id} className="flex items-center gap-3 p-2 bg-slate-700/30 rounded">
                                <img src={member.avatar} alt={member.name} className="w-8 h-8 rounded-full" />
                                <div className="flex-grow">
                                    <p className="text-sm font-semibold text-white">{member.name}</p>
                                    <p className="text-xs text-green-400">{member.activity}</p>
                                </div>
                                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            
            {/* Clan Achievement Progress */}
            <div className="bg-slate-800/70 rounded-lg p-6 border border-slate-700">
                <h3 className="font-bold text-lg text-white mb-4 flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-yellow-400"/> Clan Achievement Progress
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {clanAchievements.map(achievement => (
                        <div key={achievement.id} className="space-y-2">
                            <div className="flex justify-between items-center">
                                <h4 className="font-semibold text-slate-200">{achievement.title}</h4>
                                <span className="text-sm text-slate-400">{achievement.progress}/{achievement.target}</span>
                            </div>
                            <div className="w-full bg-slate-600 rounded-full h-2">
                                <div 
                                    className="bg-gradient-to-r from-blue-500 to-cyan-400 h-2 rounded-full transition-all duration-500" 
                                    style={{width: `${(achievement.progress / achievement.target) * 100}%`}}
                                ></div>
                            </div>
                            <p className="text-xs text-slate-500">{achievement.description}</p>
                            <p className="text-xs text-yellow-400 font-semibold">Reward: {achievement.reward}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
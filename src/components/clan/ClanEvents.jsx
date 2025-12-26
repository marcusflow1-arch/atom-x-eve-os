import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/components/auth/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar as CalendarIcon, Clock, MapPin, Users, Plus, Star } from 'lucide-react';
import { format } from 'date-fns';
import { motion } from 'framer-motion';

export default function ClanEvents({ clan }) {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [newEvent, setNewEvent] = useState({ title: '', description: '', eventType: 'raid', startTime: '', maxParticipants: 10 });

    const { data: events } = useQuery({
        queryKey: ['clanEvents', clan.id],
        queryFn: () => base44.entities.ClanEvent.filter({ divisionId: clan.id }),
        enabled: !!clan.id
    });

    const createMutation = useMutation({
        mutationFn: (data) => base44.entities.ClanEvent.create({
            ...data,
            divisionId: clan.id,
            creatorId: user.id,
            participants: [user.id]
        }),
        onSuccess: () => {
            queryClient.invalidateQueries(['clanEvents']);
            setIsCreateOpen(false);
            setNewEvent({ title: '', description: '', eventType: 'raid', startTime: '', maxParticipants: 10 });
        }
    });

    const joinMutation = useMutation({
        mutationFn: async (eventId) => {
            const event = events.find(e => e.id === eventId);
            if (event.participants.includes(user.id)) return;
            const newParticipants = [...event.participants, user.id];
            return await base44.entities.ClanEvent.update(eventId, { participants: newParticipants });
        },
        onSuccess: () => queryClient.invalidateQueries(['clanEvents'])
    });

    const getEventColor = (type) => {
        switch(type) {
            case 'raid': return 'text-red-400 bg-red-500/10 border-red-500/20';
            case 'pvp': return 'text-orange-400 bg-orange-500/10 border-orange-500/20';
            case 'meeting': return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
            default: return 'text-green-400 bg-green-500/10 border-green-500/20';
        }
    };

    return (
        <div className="space-y-6 p-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-white mb-1">Event Calendar</h2>
                    <p className="text-white/60 text-sm">Schedule raids, meetings, and game nights.</p>
                </div>
                <Button onClick={() => setIsCreateOpen(true)} className="bg-purple-600 hover:bg-purple-700">
                    <Plus className="w-4 h-4 mr-2" /> Schedule Event
                </Button>
            </div>

            <div className="space-y-4">
                {events?.sort((a,b) => new Date(a.startTime) - new Date(b.startTime)).map(event => {
                    const isJoined = event.participants.includes(user.id);
                    const colorClass = getEventColor(event.eventType);
                    const date = new Date(event.startTime);

                    return (
                        <motion.div 
                            key={event.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="bg-slate-800/40 backdrop-blur-md border border-white/10 rounded-2xl p-4 flex items-center gap-6 group hover:bg-white/5 transition-colors"
                        >
                            {/* Date Box */}
                            <div className="flex-shrink-0 w-16 h-16 bg-white/5 rounded-xl border border-white/10 flex flex-col items-center justify-center">
                                <span className="text-xs font-bold text-white/40 uppercase">{format(date, 'MMM')}</span>
                                <span className="text-2xl font-black text-white">{format(date, 'd')}</span>
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-3 mb-1">
                                    <Badge variant="outline" className={`capitalize ${colorClass}`}>
                                        {event.eventType}
                                    </Badge>
                                    <span className="text-xs text-white/40 flex items-center gap-1">
                                        <Clock className="w-3 h-3" /> {format(date, 'h:mm a')}
                                    </span>
                                </div>
                                <h3 className="text-lg font-bold text-white truncate">{event.title}</h3>
                                <p className="text-white/60 text-sm truncate">{event.description}</p>
                            </div>

                            {/* Action */}
                            <div className="flex-shrink-0 flex items-center gap-4">
                                <div className="text-right hidden sm:block">
                                    <div className="text-xs text-white/40 uppercase font-bold tracking-wider mb-1">Attending</div>
                                    <div className="flex items-center justify-end gap-2">
                                        <Users className="w-4 h-4 text-white/40" />
                                        <span className="text-white font-mono">{event.participants.length}/{event.maxParticipants}</span>
                                    </div>
                                </div>
                                
                                {isJoined ? (
                                    <Button variant="secondary" className="bg-green-500/20 text-green-300 w-24">
                                        Going
                                    </Button>
                                ) : (
                                    <Button 
                                        onClick={() => joinMutation.mutate(event.id)}
                                        className="bg-white/10 hover:bg-white/20 text-white w-24"
                                    >
                                        RSVP
                                    </Button>
                                )}
                            </div>
                        </motion.div>
                    );
                })}

                {events?.length === 0 && (
                    <div className="text-center py-16 text-white/30 bg-white/5 rounded-2xl border border-dashed border-white/10">
                        <CalendarIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>No upcoming events scheduled.</p>
                    </div>
                )}
            </div>

            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogContent className="bg-slate-900/95 border-white/10 text-white">
                    <DialogHeader>
                        <DialogTitle>Schedule New Event</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <Input 
                            placeholder="Event Title" 
                            value={newEvent.title}
                            onChange={e => setNewEvent({ ...newEvent, title: e.target.value })}
                            className="bg-slate-800 border-white/10"
                        />
                        <Input 
                            placeholder="Description" 
                            value={newEvent.description}
                            onChange={e => setNewEvent({ ...newEvent, description: e.target.value })}
                            className="bg-slate-800 border-white/10"
                        />
                        <div className="grid grid-cols-2 gap-4">
                            <Select 
                                value={newEvent.eventType} 
                                onValueChange={val => setNewEvent({ ...newEvent, eventType: val })}
                            >
                                <SelectTrigger className="bg-slate-800 border-white/10">
                                    <SelectValue placeholder="Type" />
                                </SelectTrigger>
                                <SelectContent className="bg-slate-800 border-white/10 text-white">
                                    <SelectItem value="raid">Raid</SelectItem>
                                    <SelectItem value="pvp">PvP</SelectItem>
                                    <SelectItem value="dungeon">Dungeon</SelectItem>
                                    <SelectItem value="meeting">Meeting</SelectItem>
                                    <SelectItem value="casual">Casual</SelectItem>
                                </SelectContent>
                            </Select>
                            <Input 
                                type="datetime-local"
                                onChange={e => setNewEvent({ ...newEvent, startTime: e.target.value })}
                                className="bg-slate-800 border-white/10"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                        <Button onClick={() => createMutation.mutate(newEvent)} className="bg-purple-600 hover:bg-purple-700">Create Event</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
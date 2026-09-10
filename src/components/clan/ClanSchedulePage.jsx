import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/components/auth/AuthContext';
import { motion } from 'framer-motion';
import { Calendar, Clock, Users, Plus, Gamepad2, Sword, Target, Trophy, Coffee, Mic } from 'lucide-react';
import LiquidGlassCard from '@/components/shared/LiquidGlassCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format, isToday, isTomorrow, isThisWeek, addDays } from 'date-fns';

export default function ClanSchedulePage({ clan }) {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [newEvent, setNewEvent] = useState({
        title: '',
        description: '',
        eventType: 'casual',
        startTime: '',
        maxParticipants: 8,
        game: ''
    });

    const { data: events, isLoading } = useQuery({
        queryKey: ['clanScheduleEvents', clan?.id],
        queryFn: async () => {
            const allEvents = await base44.entities.ClanEvent.filter({ divisionId: clan.id });
            return allEvents.sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
        },
        enabled: !!clan?.id
    });

    const createEventMutation = useMutation({
        mutationFn: async () => {
            return await base44.entities.ClanEvent.create({
                divisionId: clan.id,
                creatorId: user.id,
                ...newEvent,
                participants: [user.id]
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['clanScheduleEvents', clan.id]);
            setIsCreateOpen(false);
            setNewEvent({ title: '', description: '', eventType: 'casual', startTime: '', maxParticipants: 8, game: '' });
        }
    });

    const joinEventMutation = useMutation({
        mutationFn: async (eventId) => {
            const event = events.find(e => e.id === eventId);
            if (!event) return;
            const updatedParticipants = [...(event.participants || []), user.id];
            return await base44.entities.ClanEvent.update(eventId, { participants: updatedParticipants });
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['clanScheduleEvents', clan.id]);
        }
    });

    const getEventIcon = (type) => {
        switch(type) {
            case 'raid': return <Sword className="w-5 h-5 text-red-400" />;
            case 'dungeon': return <Target className="w-5 h-5 text-purple-400" />;
            case 'pvp': return <Trophy className="w-5 h-5 text-yellow-400" />;
            case 'meeting': return <Mic className="w-5 h-5 text-blue-400" />;
            case 'tournament': return <Trophy className="w-5 h-5 text-orange-400" />;
            default: return <Coffee className="w-5 h-5 text-green-400" />;
        }
    };

    const getEventColor = (type) => {
        switch(type) {
            case 'raid': return 'border-red-500/30 bg-red-500/10';
            case 'dungeon': return 'border-purple-500/30 bg-purple-500/10';
            case 'pvp': return 'border-yellow-500/30 bg-yellow-500/10';
            case 'meeting': return 'border-blue-500/30 bg-blue-500/10';
            case 'tournament': return 'border-orange-500/30 bg-orange-500/10';
            default: return 'border-green-500/30 bg-green-500/10';
        }
    };

    const categorizeEvents = () => {
        const today = [];
        const tomorrow = [];
        const thisWeek = [];
        const later = [];

        events?.forEach(event => {
            const date = new Date(event.startTime);
            if (isToday(date)) today.push(event);
            else if (isTomorrow(date)) tomorrow.push(event);
            else if (isThisWeek(date)) thisWeek.push(event);
            else later.push(event);
        });

        return { today, tomorrow, thisWeek, later };
    };

    const { today, tomorrow, thisWeek, later } = categorizeEvents();

    const EventCard = ({ event }) => {
        const hasJoined = event.participants?.includes(user?.id);
        const isFull = event.participants?.length >= event.maxParticipants;

        return (
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-4 rounded-xl border ${getEventColor(event.eventType)} transition-all hover:scale-[1.02]`}
            >
                <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
                        {getEventIcon(event.eventType)}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-bold text-white truncate">{event.title}</h4>
                            <Badge className="bg-white/10 text-white/60 border-none text-xs capitalize">
                                {event.eventType}
                            </Badge>
                        </div>
                        {event.game && (
                            <p className="text-xs text-cyan-400 flex items-center gap-1 mb-1">
                                <Gamepad2 className="w-3 h-3" /> {event.game}
                            </p>
                        )}
                        <div className="flex items-center gap-3 text-xs text-white/50">
                            <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {format(new Date(event.startTime), 'h:mm a')}
                            </span>
                            <span className="flex items-center gap-1">
                                <Users className="w-3 h-3" />
                                {event.participants?.length || 0}/{event.maxParticipants}
                            </span>
                        </div>
                    </div>
                    <div className="flex-shrink-0">
                        {hasJoined ? (
                            <Badge className="bg-green-500/20 text-green-300 border-none">Joined</Badge>
                        ) : (
                            <Button
                                size="sm"
                                disabled={isFull}
                                onClick={() => joinEventMutation.mutate(event.id)}
                                className="bg-white/10 hover:bg-white/20 text-white text-xs"
                            >
                                {isFull ? 'Full' : 'Join'}
                            </Button>
                        )}
                    </div>
                </div>
            </motion.div>
        );
    };

    const EventSection = ({ title, events: sectionEvents, emptyText }) => {
        if (sectionEvents.length === 0) return null;
        return (
            <div className="mb-6">
                <h3 className="text-sm font-bold text-white/60 uppercase tracking-wider mb-3">{title}</h3>
                <div className="space-y-3">
                    {sectionEvents.map(event => <EventCard key={event.id} event={event} />)}
                </div>
            </div>
        );
    };

    return (
        <div className="h-full overflow-y-auto custom-scrollbar p-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                        <Calendar className="w-6 h-6 text-green-400" /> Event Schedule
                    </h2>
                    <p className="text-sm text-white/50 mt-1">
                        {events?.length || 0} upcoming events
                    </p>
                </div>
                <Button
                    onClick={() => setIsCreateOpen(true)}
                    className="bg-green-600 hover:bg-green-500 text-white"
                >
                    <Plus className="w-4 h-4 mr-2" /> Create Event
                </Button>
            </div>

            {/* Events Grid */}
            <div className="grid grid-cols-2 gap-6">
                <LiquidGlassCard className="p-6">
                    <EventSection title="Today" events={today} />
                    <EventSection title="Tomorrow" events={tomorrow} />
                    {today.length === 0 && tomorrow.length === 0 && (
                        <div className="text-center py-8 text-white/30">
                            <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
                            <p>No events in the next 2 days</p>
                        </div>
                    )}
                </LiquidGlassCard>

                <LiquidGlassCard className="p-6">
                    <EventSection title="This Week" events={thisWeek} />
                    <EventSection title="Later" events={later} />
                    {thisWeek.length === 0 && later.length === 0 && (
                        <div className="text-center py-8 text-white/30">
                            <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
                            <p>No future events scheduled</p>
                        </div>
                    )}
                </LiquidGlassCard>
            </div>

            {/* Create Event Dialog */}
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogContent className="bg-slate-900 border-white/10 text-white">
                    <DialogHeader>
                        <DialogTitle>Create Event</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <Input
                            placeholder="Event title"
                            value={newEvent.title}
                            onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                            className="bg-black/50 border-white/10 text-white"
                        />
                        <Select
                            value={newEvent.eventType}
                            onValueChange={(v) => setNewEvent({ ...newEvent, eventType: v })}
                        >
                            <SelectTrigger className="bg-black/50 border-white/10 text-white">
                                <SelectValue placeholder="Event Type" />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-900 border-white/10">
                                <SelectItem value="casual">Casual</SelectItem>
                                <SelectItem value="raid">Raid</SelectItem>
                                <SelectItem value="dungeon">Dungeon</SelectItem>
                                <SelectItem value="pvp">PvP</SelectItem>
                                <SelectItem value="meeting">Meeting</SelectItem>
                                <SelectItem value="tournament">Tournament</SelectItem>
                            </SelectContent>
                        </Select>
                        <Input
                            type="datetime-local"
                            value={newEvent.startTime}
                            onChange={(e) => setNewEvent({ ...newEvent, startTime: e.target.value })}
                            className="bg-black/50 border-white/10 text-white"
                        />
                        <Input
                            placeholder="Game (optional)"
                            value={newEvent.game}
                            onChange={(e) => setNewEvent({ ...newEvent, game: e.target.value })}
                            className="bg-black/50 border-white/10 text-white"
                        />
                        <Input
                            type="number"
                            placeholder="Max participants"
                            value={newEvent.maxParticipants}
                            onChange={(e) => setNewEvent({ ...newEvent, maxParticipants: parseInt(e.target.value) || 8 })}
                            className="bg-black/50 border-white/10 text-white"
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                        <Button 
                            onClick={() => createEventMutation.mutate()}
                            disabled={!newEvent.title || !newEvent.startTime}
                            className="bg-green-600 hover:bg-green-500"
                        >
                            Create
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { 
    ClipboardList, CheckCircle2, XCircle, AlertCircle, 
    Gamepad2, Trophy, Target, ArrowRight, Clock, Settings
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import AssignmentManager from './AssignmentManager';

export default function AssignmentList({ clanId, userId, onSelectGame, isLeader, members }) {
    const queryClient = useQueryClient();
    const [viewMode, setViewMode] = useState('list'); // 'list' or 'manage'

    // Fetch Assignments
    const { data: assignments, isLoading } = useQuery({
        queryKey: ['myAssignments', clanId, userId],
        queryFn: async () => {
            // In real app: base44.entities.ClanAssignment.filter({ clanId, assigneeId: userId })
            // Mock data for demo
            return [
                {
                    id: '1', type: 'game', targetName: 'Destiny 2', targetId: 'destiny2',
                    priority: 'critical', status: 'pending', notes: 'Raid team needs a 6th for tonight.',
                    dueDate: new Date(Date.now() + 86400000).toISOString()
                },
                {
                    id: '2', type: 'objective', targetName: 'Farm 1000 Iron', targetId: 'farm_iron',
                    priority: 'recommended', status: 'accepted', notes: 'Stockpile for guild upgrades.',
                    dueDate: new Date(Date.now() + 172800000).toISOString()
                },
                {
                    id: '3', type: 'game', targetName: 'Final Fantasy XIV', targetId: 'ffxiv',
                    priority: 'optional', status: 'completed', notes: 'Check out the new patch.',
                    dueDate: new Date(Date.now() - 86400000).toISOString()
                }
            ];
        }
    });

    const updateStatusMutation = useMutation({
        mutationFn: async ({ id, status }) => {
            // await base44.entities.ClanAssignment.update(id, { status });
            console.log(`Updated assignment ${id} to ${status}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['myAssignments']);
        }
    });

    const handleAction = (assignment, action) => {
        if (action === 'accept') {
            updateStatusMutation.mutate({ id: assignment.id, status: 'accepted' });
        } else if (action === 'decline') {
            updateStatusMutation.mutate({ id: assignment.id, status: 'declined' });
        } else if (action === 'go') {
            if (assignment.type === 'game' && onSelectGame) {
                // Mock game object
                onSelectGame({ 
                    id: assignment.targetId, 
                    title: assignment.targetName,
                    cover_image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800' // Placeholder
                });
            }
        }
    };

    const getPriorityColor = (p) => {
        switch(p) {
            case 'critical': return 'text-red-400 border-red-500/50 bg-red-500/10';
            case 'priority': return 'text-orange-400 border-orange-500/50 bg-orange-500/10';
            case 'recommended': return 'text-blue-400 border-blue-500/50 bg-blue-500/10';
            default: return 'text-slate-400 border-slate-500/50 bg-slate-500/10';
        }
    };

    const getIcon = (type) => {
        switch(type) {
            case 'game': return Gamepad2;
            case 'objective': return Target;
            case 'achievement': return Trophy;
            default: return ClipboardList;
        }
    };

    // Management View
    if (viewMode === 'manage' && isLeader) {
        return (
            <div className="w-full max-w-4xl mx-auto space-y-4">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <Settings className="w-6 h-6 text-cyan-400" />
                        Assignment Control
                    </h2>
                    <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => setViewMode('list')}
                        className="text-white/50 hover:text-white"
                    >
                        Back to Assessments
                    </Button>
                </div>
                <AssignmentManager clanId={clanId} members={members} />
            </div>
        );
    }

    if (isLoading) return <div className="text-white/40 text-center py-8">Loading directives...</div>;

    return (
        <div className="w-full max-w-4xl mx-auto space-y-4">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <ClipboardList className="w-6 h-6 text-cyan-400" />
                    Active Directives
                </h2>
                {isLeader && (
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setViewMode('manage')}
                        className="text-white/50 hover:text-white hover:bg-white/10"
                        title="Assignment Settings"
                    >
                        <Settings className="w-5 h-5" />
                    </Button>
                )}
            </div>

            <div className="grid gap-4">
                {assignments?.map((assignment) => {
                    const Icon = getIcon(assignment.type);
                    return (
                        <motion.div
                            key={assignment.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`
                                relative overflow-hidden rounded-xl border p-4 flex items-center gap-4 transition-all
                                ${assignment.status === 'completed' ? 'bg-white/5 border-white/5 opacity-60' : 'bg-slate-900/80 border-white/10'}
                            `}
                        >
                            {/* Priority Stripe */}
                            <div className={`absolute left-0 top-0 bottom-0 w-1 ${getPriorityColor(assignment.priority).replace('text-', 'bg-').split(' ')[0]}`} />

                            {/* Icon */}
                            <div className="w-12 h-12 rounded-lg bg-black/40 flex items-center justify-center border border-white/10 shrink-0">
                                <Icon className="w-6 h-6 text-white/70" />
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-3 mb-1">
                                    <h3 className="font-bold text-white text-lg truncate">{assignment.targetName}</h3>
                                    <Badge variant="outline" className={`text-[10px] uppercase tracking-wider ${getPriorityColor(assignment.priority)}`}>
                                        {assignment.priority}
                                    </Badge>
                                    {assignment.dueDate && (
                                        <span className="text-xs text-white/40 flex items-center gap-1">
                                            <Clock className="w-3 h-3" />
                                            {format(new Date(assignment.dueDate), 'MMM d')}
                                        </span>
                                    )}
                                </div>
                                <p className="text-white/60 text-sm truncate">{assignment.notes}</p>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-2">
                                {assignment.status === 'pending' && (
                                    <>
                                        <Button 
                                            size="sm" 
                                            onClick={() => handleAction(assignment, 'accept')}
                                            className="bg-green-600/20 text-green-400 hover:bg-green-600/40 border border-green-600/50"
                                        >
                                            <CheckCircle2 className="w-4 h-4 mr-2" /> Accept
                                        </Button>
                                        <Button 
                                            size="sm" 
                                            onClick={() => handleAction(assignment, 'decline')}
                                            variant="ghost"
                                            className="text-white/40 hover:text-white"
                                        >
                                            <XCircle className="w-4 h-4" />
                                        </Button>
                                    </>
                                )}

                                {assignment.status === 'accepted' && (
                                    <>
                                        <Badge className="bg-green-500/10 text-green-400 border-green-500/30 mr-2">
                                            In Progress
                                        </Badge>
                                        {assignment.type === 'game' && (
                                            <Button 
                                                size="sm" 
                                                onClick={() => handleAction(assignment, 'go')}
                                                className="bg-cyan-600 hover:bg-cyan-500 text-white"
                                            >
                                                Launch Workspace <ArrowRight className="w-4 h-4 ml-2" />
                                            </Button>
                                        )}
                                    </>
                                )}

                                {assignment.status === 'completed' && (
                                    <Badge className="bg-white/10 text-white/50">Completed</Badge>
                                )}
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
}
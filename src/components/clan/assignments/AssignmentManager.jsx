import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { CalendarDays, Check, Plus, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';

const invoke = async (action, data) => {
    const result = await base44.functions.invoke('clanOperations', { action, data });
    const payload = result?.data || result;
    if (payload?.success === false) throw new Error(payload.error || 'Clan assignment request failed');
    return payload;
};

export default function AssignmentManager({ clanId, members = [] }) {
    const queryClient = useQueryClient();
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [newAssignment, setNewAssignment] = useState({ type: 'objective', gameId: 'general', targetName: '', priority: 'recommended', assigneeId: 'all', dueDate: '', notes: '' });

    const { data: games = [] } = useQuery({ queryKey: ['availableGames'], queryFn: () => base44.entities.Game.list('-original_year', 500) });
    const { data: assignments = [], isLoading } = useQuery({
        queryKey: ['clanAssignmentsAdmin', clanId],
        queryFn: () => base44.entities.ClanAssignment.filter({ clanId }, '-created_date', 300),
        enabled: !!clanId,
    });

    const createMutation = useMutation({
        mutationFn: (assignment) => invoke('create_assignment', { clanId, assignment }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['clanAssignmentsAdmin', clanId] });
            queryClient.invalidateQueries({ queryKey: ['gameObjectives'] });
            setIsCreateOpen(false);
            setNewAssignment({ type: 'objective', gameId: 'general', targetName: '', priority: 'recommended', assigneeId: 'all', dueDate: '', notes: '' });
        },
    });

    const statusMutation = useMutation({
        mutationFn: ({ id, status }) => invoke('set_assignment_status', { clanId, assignmentId: id, status }),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['clanAssignmentsAdmin', clanId] }),
    });

    const memberLabel = (id) => {
        if (!id || id === 'all') return 'All Members';
        const member = members.find((row) => String(row.user_id || row.userId) === String(id));
        return member?.user?.full_name || member?.display_name || member?.username || String(id).slice(0, 10);
    };

    return (
        <div className="h-full overflow-y-auto p-5 md:p-7">
            <div className="mb-5 flex items-center justify-between">
                <div><div className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/30">Member operations</div><h3 className="mt-1 text-lg font-semibold text-white/90">Assignments & Tasks</h3><p className="mt-1 text-xs text-white/38">Issue game-specific objectives, farming duties, meetings and achievement tasks.</p></div>
                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <DialogTrigger asChild><Button className="gap-2 bg-white/[0.08] text-white hover:bg-white/[0.12]"><Plus className="h-4 w-4" />New Task</Button></DialogTrigger>
                    <DialogContent className="border-white/10 bg-[#20262e] text-white sm:max-w-lg">
                        <DialogHeader><DialogTitle>Assign clan task</DialogTitle></DialogHeader>
                        <div className="grid gap-4 py-2">
                            <Input placeholder="Task title" value={newAssignment.targetName} onChange={(e) => setNewAssignment({ ...newAssignment, targetName: e.target.value })} className="border-white/10 bg-black/10" />
                            <div className="grid grid-cols-2 gap-3">
                                <Select value={newAssignment.type} onValueChange={(value) => setNewAssignment({ ...newAssignment, type: value })}><SelectTrigger className="border-white/10 bg-black/10"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="objective">Objective</SelectItem><SelectItem value="game">Game Session</SelectItem><SelectItem value="farming">Farming</SelectItem><SelectItem value="achievement">Achievement</SelectItem><SelectItem value="meeting">Meeting</SelectItem></SelectContent></Select>
                                <Select value={newAssignment.priority} onValueChange={(value) => setNewAssignment({ ...newAssignment, priority: value })}><SelectTrigger className="border-white/10 bg-black/10"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="optional">Optional</SelectItem><SelectItem value="recommended">Recommended</SelectItem><SelectItem value="priority">Priority</SelectItem><SelectItem value="critical">Critical</SelectItem></SelectContent></Select>
                            </div>
                            <Select value={newAssignment.gameId} onValueChange={(value) => setNewAssignment({ ...newAssignment, gameId: value })}><SelectTrigger className="border-white/10 bg-black/10"><SelectValue placeholder="Game" /></SelectTrigger><SelectContent><SelectItem value="general">General / All games</SelectItem>{games.map((game) => <SelectItem key={game.id} value={game.id}>{game.title}</SelectItem>)}</SelectContent></Select>
                            <Select value={newAssignment.assigneeId} onValueChange={(value) => setNewAssignment({ ...newAssignment, assigneeId: value })}><SelectTrigger className="border-white/10 bg-black/10"><SelectValue placeholder="Assign to" /></SelectTrigger><SelectContent><SelectItem value="all">All Members</SelectItem>{members.map((member) => { const id = member.user_id || member.userId; return id ? <SelectItem key={id} value={id}>{memberLabel(id)}</SelectItem> : null; })}</SelectContent></Select>
                            <Input type="datetime-local" value={newAssignment.dueDate} onChange={(e) => setNewAssignment({ ...newAssignment, dueDate: e.target.value })} className="border-white/10 bg-black/10" />
                            <Input placeholder="Instructions / strategy notes" value={newAssignment.notes} onChange={(e) => setNewAssignment({ ...newAssignment, notes: e.target.value })} className="border-white/10 bg-black/10" />
                        </div>
                        <DialogFooter><Button onClick={() => createMutation.mutate(newAssignment)} disabled={!newAssignment.targetName.trim() || createMutation.isPending}>Issue Task</Button></DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.025]">
                <div className="grid grid-cols-12 gap-3 border-b border-white/[0.06] px-4 py-3 text-[9px] font-bold uppercase tracking-wider text-white/30"><div className="col-span-4">Directive</div><div className="col-span-2">Type</div><div className="col-span-2">Assigned</div><div className="col-span-2">Due</div><div className="col-span-2 text-right">Status</div></div>
                {isLoading ? <div className="p-8 text-center text-xs text-white/30">Loading tasks…</div> : assignments.length ? assignments.map((item) => (
                    <div key={item.id} className="grid grid-cols-12 items-center gap-3 border-b border-white/[0.045] px-4 py-3 text-xs last:border-0 hover:bg-white/[0.025]">
                        <div className="col-span-4 min-w-0"><div className="flex items-center gap-2"><Target className="h-3.5 w-3.5 text-cyan-200/55" /><strong className="truncate font-medium text-white/82">{item.targetName || item.title}</strong></div>{item.notes && <p className="mt-1 truncate pl-5 text-[10px] text-white/30">{item.notes}</p>}</div>
                        <div className="col-span-2"><Badge variant="outline" className="border-white/10 text-[9px] text-white/45">{item.type || 'objective'}</Badge></div>
                        <div className="col-span-2 truncate text-white/42">{memberLabel(item.assigneeId)}</div>
                        <div className="col-span-2 flex items-center gap-1 text-white/35"><CalendarDays className="h-3 w-3" />{item.dueDate ? new Date(item.dueDate).toLocaleDateString() : 'Open'}</div>
                        <div className="col-span-2 flex justify-end gap-2">{item.status === 'completed' ? <span className="flex items-center gap-1 text-emerald-300/70"><Check className="h-3 w-3" />Completed</span> : <button type="button" onClick={() => statusMutation.mutate({ id: item.id, status: 'completed' })} className="rounded-lg bg-white/[0.055] px-2 py-1 text-[9px] text-white/55 hover:bg-white/[0.09]">Complete</button>}</div>
                    </div>
                )) : <div className="p-10 text-center text-xs text-white/28">No clan tasks have been issued yet.</div>}
            </div>
        </div>
    );
}

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { 
    Users, Plus, Search, Calendar as CalendarIcon,
    AlertTriangle, Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';

export default function AssignmentManager({ clanId, members }) {
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [newAssignment, setNewAssignment] = useState({
        type: 'game',
        targetName: '',
        priority: 'recommended',
        assigneeId: 'all', // 'all' or specific user ID
        dueDate: undefined,
        notes: ''
    });

    const createMutation = useMutation({
        mutationFn: async (data) => {
            // await base44.entities.ClanAssignment.create({ ...data, clanId, status: 'pending' });
            console.log('Created assignment:', data);
        },
        onSuccess: () => {
            setIsCreateOpen(false);
            setNewAssignment({ type: 'game', targetName: '', priority: 'recommended', assigneeId: 'all', notes: '' });
        }
    });

    return (
        <div className="w-full h-full">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-white">Assignment Control</h3>
                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-amber-600 hover:bg-amber-700 text-white gap-2">
                            <Plus className="w-4 h-4" /> New Directive
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-[#12141a] border-white/10 text-white sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>Issue New Directive</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            {/* Type & Target */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-white/50 uppercase">Type</label>
                                    <Select 
                                        value={newAssignment.type} 
                                        onValueChange={(val) => setNewAssignment({...newAssignment, type: val})}
                                    >
                                        <SelectTrigger className="bg-white/5 border-white/10 text-white">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-slate-900 border-white/10 text-white">
                                            <SelectItem value="game">Game</SelectItem>
                                            <SelectItem value="objective">Objective</SelectItem>
                                            <SelectItem value="achievement">Achievement</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-white/50 uppercase">Priority</label>
                                    <Select 
                                        value={newAssignment.priority} 
                                        onValueChange={(val) => setNewAssignment({...newAssignment, priority: val})}
                                    >
                                        <SelectTrigger className="bg-white/5 border-white/10 text-white">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-slate-900 border-white/10 text-white">
                                            <SelectItem value="optional">Optional</SelectItem>
                                            <SelectItem value="recommended">Recommended</SelectItem>
                                            <SelectItem value="priority">Priority</SelectItem>
                                            <SelectItem value="critical">Critical</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {/* Target Name */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-white/50 uppercase">Target Name</label>
                                <Input 
                                    placeholder="e.g. Destiny 2 or 'Complete Raid'"
                                    value={newAssignment.targetName}
                                    onChange={(e) => setNewAssignment({...newAssignment, targetName: e.target.value})}
                                    className="bg-white/5 border-white/10 text-white"
                                />
                            </div>

                            {/* Assignee */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-white/50 uppercase">Assign To</label>
                                <Select 
                                    value={newAssignment.assigneeId} 
                                    onValueChange={(val) => setNewAssignment({...newAssignment, assigneeId: val})}
                                >
                                    <SelectTrigger className="bg-white/5 border-white/10 text-white">
                                        <SelectValue placeholder="Select Member" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-slate-900 border-white/10 text-white">
                                        <SelectItem value="all">All Members</SelectItem>
                                        {members?.map(m => (
                                            <SelectItem key={m.userId} value={m.userId}>
                                                {m.user?.full_name || m.userId}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Due Date */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-white/50 uppercase">Due Date</label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant={"outline"}
                                            className={`w-full justify-start text-left font-normal bg-white/5 border-white/10 text-white hover:bg-white/10 hover:text-white ${!newAssignment.dueDate && "text-muted-foreground"}`}
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {newAssignment.dueDate ? format(newAssignment.dueDate, "PPP") : <span>Pick a date</span>}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0 bg-slate-900 border-white/10 text-white" align="start">
                                        <Calendar
                                            mode="single"
                                            selected={newAssignment.dueDate}
                                            onSelect={(date) => setNewAssignment({...newAssignment, dueDate: date})}
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>

                            {/* Notes */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-white/50 uppercase">Notes / Instructions</label>
                                <Input 
                                    placeholder="Add details..."
                                    value={newAssignment.notes}
                                    onChange={(e) => setNewAssignment({...newAssignment, notes: e.target.value})}
                                    className="bg-white/5 border-white/10 text-white"
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button onClick={() => createMutation.mutate(newAssignment)} className="bg-amber-600 hover:bg-amber-700">
                                Issue Directive
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Assignments Table (Mock) */}
            <div className="rounded-xl border border-white/10 bg-black/20 overflow-hidden">
                <div className="grid grid-cols-12 gap-4 p-4 border-b border-white/10 bg-white/5 text-xs font-bold text-white/50 uppercase tracking-wider">
                    <div className="col-span-4">Directive</div>
                    <div className="col-span-2">Type</div>
                    <div className="col-span-2">Priority</div>
                    <div className="col-span-2">Assigned To</div>
                    <div className="col-span-2 text-right">Status</div>
                </div>
                <div className="divide-y divide-white/5">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="grid grid-cols-12 gap-4 p-4 items-center text-sm text-white/80 hover:bg-white/5 transition-colors">
                            <div className="col-span-4 font-medium">Operation: Iron Harvest</div>
                            <div className="col-span-2 text-white/50">Objective</div>
                            <div className="col-span-2">
                                <Badge variant="outline" className="text-orange-400 border-orange-500/30">Priority</Badge>
                            </div>
                            <div className="col-span-2 flex -space-x-2">
                                <div className="w-6 h-6 rounded-full bg-slate-700 border border-black flex items-center justify-center text-[10px]">A</div>
                                <div className="w-6 h-6 rounded-full bg-slate-700 border border-black flex items-center justify-center text-[10px]">B</div>
                                <div className="w-6 h-6 rounded-full bg-slate-700 border border-black flex items-center justify-center text-[10px]">+3</div>
                            </div>
                            <div className="col-span-2 text-right">
                                <span className="text-green-400">2/5 Accepted</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Megaphone, FileText, Vote, ShieldQuestion, Plus, Edit, Calendar, Target, Users, Award } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const initialAnnouncements = [
    {
        id: 1,
        title: "Clan Wars Victory & Future Strategy",
        author: "Marcus",
        timestamp: "2 days ago",
        content: "A massive congratulations to everyone for our decisive victory in the last Clan War! Your coordination was flawless. Moving forward, we'll be focusing on strengthening our defenses for the upcoming season. Officers will be holding strategy sessions in the #raid-planning channel all week. Your input is valuable!",
        pinned: true
    },
    {
        id: 2,
        title: "New Recruitment Drive: Seeking Vanguard Ops Specialists",
        author: "Shadow_Stryker",
        timestamp: "5 days ago",
        content: "We're officially opening recruitment for our competitive Vanguard Ops division. We are looking for dedicated players with a high skill ceiling and a collaborative mindset. If you know anyone who would be a good fit, please direct them to an Officer for a tryout.",
        pinned: false
    }
];

const initialPolls = [
    {
        id: 1,
        question: "What should be our next featured game for clan events?",
        options: [
            { text: "Diablo II: Eternal", votes: 45 },
            { text: "Cyberpunk 2088", votes: 32 },
            { text: "Nexus Clash (MOBA)", votes: 18 },
        ],
        isOpen: true,
        createdBy: "Marcus",
        expiresAt: "2024-02-15T23:59:59",
        voters: []
    }
];

const initialTasks = [
    {
        id: 1,
        title: "Complete Leviathan Raid",
        description: "Organize and complete the Abyssal Leviathan world event",
        assignedTo: "All Members",
        priority: "high",
        dueDate: "2024-02-10",
        status: "in_progress",
        createdBy: "Marcus"
    },
    {
        id: 2,
        title: "Recruit 5 New Members",
        description: "Expand our guild with skilled players for upcoming season",
        assignedTo: "Officers",
        priority: "medium",
        dueDate: "2024-02-20",
        status: "pending",
        createdBy: "Marcus"
    }
];

const AnnouncementCard = ({ announcement, currentUser, onEdit, onDelete }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`bg-slate-800/70 p-6 rounded-lg border ${announcement.pinned ? 'border-yellow-500/50' : 'border-slate-700'} relative`}
    >
        {announcement.pinned && (
            <div className="absolute top-2 right-2 bg-yellow-500/20 px-2 py-1 rounded text-xs text-yellow-400 font-semibold">
                PINNED
            </div>
        )}
        <h3 className="text-xl font-bold text-blue-300 mb-2">{announcement.title}</h3>
        <p className="text-xs text-slate-400 mb-4">Posted by {announcement.author} - {announcement.timestamp}</p>
        <div className="prose prose-slate prose-invert max-w-none">
            <p className="text-slate-300">{announcement.content}</p>
        </div>
        {currentUser.role === 'Leader' && (
            <div className="flex gap-2 mt-4">
                <Button size="sm" variant="outline" onClick={() => onEdit(announcement)}>
                    <Edit className="w-3 h-3 mr-1" />Edit
                </Button>
                <Button size="sm" variant="destructive" onClick={() => onDelete(announcement.id)}>
                    Delete
                </Button>
            </div>
        )}
    </motion.div>
);

const PollCard = ({ poll, currentUser, onVote }) => {
    const totalVotes = poll.options.reduce((sum, opt) => sum + opt.votes, 0);
    const hasVoted = poll.voters.includes(currentUser.name);
    
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-800/70 p-6 rounded-lg border border-slate-700"
        >
            <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold text-yellow-300">{poll.question}</h3>
                <div className="text-xs text-slate-400">
                    <p>By {poll.createdBy}</p>
                    <p>Expires: {new Date(poll.expiresAt).toLocaleDateString()}</p>
                </div>
            </div>
            <div className="space-y-3">
                {poll.options.map((option, index) => {
                    const percentage = totalVotes > 0 ? (option.votes / totalVotes) * 100 : 0;
                    return (
                        <div key={index}>
                            <div className="flex justify-between items-center text-sm font-semibold mb-1">
                                <span className="text-slate-200">{option.text}</span>
                                <span className="text-slate-400">{option.votes} votes</span>
                            </div>
                            <div className="w-full bg-slate-600 rounded-full h-4 relative cursor-pointer" 
                                 onClick={() => !hasVoted && poll.isOpen && onVote(poll.id, index)}>
                                <div className="bg-yellow-500 h-4 rounded-full transition-all duration-300" 
                                     style={{width: `${percentage}%`}}></div>
                                <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-black mix-blend-lighten">
                                    {Math.round(percentage)}%
                                </span>
                            </div>
                        </div>
                    )
                })}
            </div>
            <div className="mt-4 flex justify-between items-center">
                <p className="text-xs text-slate-400">Total votes: {totalVotes}</p>
                {hasVoted && <p className="text-xs text-green-400">✓ You voted</p>}
            </div>
        </motion.div>
    );
};

const TaskCard = ({ task, currentUser }) => {
    const priorityColors = {
        low: 'border-blue-500/50 text-blue-400',
        medium: 'border-yellow-500/50 text-yellow-400',
        high: 'border-red-500/50 text-red-400'
    };

    const statusColors = {
        pending: 'bg-slate-600 text-slate-300',
        in_progress: 'bg-blue-600 text-blue-100',
        completed: 'bg-green-600 text-green-100'
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`bg-slate-800/70 p-4 rounded-lg border-l-4 ${priorityColors[task.priority]}`}
        >
            <div className="flex justify-between items-start mb-2">
                <h4 className="font-bold text-white">{task.title}</h4>
                <span className={`px-2 py-1 rounded text-xs font-semibold ${statusColors[task.status]}`}>
                    {task.status.replace('_', ' ').toUpperCase()}
                </span>
            </div>
            <p className="text-sm text-slate-300 mb-3">{task.description}</p>
            <div className="flex justify-between items-center text-xs text-slate-400">
                <span>Assigned to: {task.assignedTo}</span>
                <span>Due: {new Date(task.dueDate).toLocaleDateString()}</span>
            </div>
        </motion.div>
    );
};

export default function GuildInfoTab({ currentUser }) {
    const [announcements, setAnnouncements] = useState(initialAnnouncements);
    const [polls, setPolls] = useState(initialPolls);
    const [tasks, setTasks] = useState(initialTasks);
    const [showCreateAnnouncement, setShowCreateAnnouncement] = useState(false);
    const [showCreatePoll, setShowCreatePoll] = useState(false);
    const [showCreateTask, setShowCreateTask] = useState(false);
    const [newAnnouncement, setNewAnnouncement] = useState({ title: '', content: '', pinned: false });
    const [newPoll, setNewPoll] = useState({ question: '', options: ['', ''], expiresIn: 7 });
    const [newTask, setNewTask] = useState({ title: '', description: '', assignedTo: 'All Members', priority: 'medium', dueDate: '' });

    const handleCreateAnnouncement = () => {
        const announcement = {
            id: announcements.length + 1,
            ...newAnnouncement,
            author: currentUser.name,
            timestamp: 'just now'
        };
        setAnnouncements([announcement, ...announcements]);
        setNewAnnouncement({ title: '', content: '', pinned: false });
        setShowCreateAnnouncement(false);
    };

    const handleCreatePoll = () => {
        const poll = {
            id: polls.length + 1,
            question: newPoll.question,
            options: newPoll.options.filter(opt => opt.trim()).map(text => ({ text, votes: 0 })),
            isOpen: true,
            createdBy: currentUser.name,
            expiresAt: new Date(Date.now() + newPoll.expiresIn * 24 * 60 * 60 * 1000).toISOString(),
            voters: []
        };
        setPolls([poll, ...polls]);
        setNewPoll({ question: '', options: ['', ''], expiresIn: 7 });
        setShowCreatePoll(false);
    };

    const handleCreateTask = () => {
        const task = {
            id: tasks.length + 1,
            ...newTask,
            createdBy: currentUser.name,
            status: 'pending'
        };
        setTasks([task, ...tasks]);
        setNewTask({ title: '', description: '', assignedTo: 'All Members', priority: 'medium', dueDate: '' });
        setShowCreateTask(false);
    };

    const handleVote = (pollId, optionIndex) => {
        setPolls(polls.map(poll => {
            if (poll.id === pollId && !poll.voters.includes(currentUser.name)) {
                const updatedOptions = [...poll.options];
                updatedOptions[optionIndex].votes++;
                return {
                    ...poll,
                    options: updatedOptions,
                    voters: [...poll.voters, currentUser.name]
                };
            }
            return poll;
        }));
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
                {/* Announcements */}
                <div>
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                            <Megaphone className="text-blue-400"/>Announcements
                        </h2>
                        {currentUser.role === 'Leader' && (
                            <Button onClick={() => setShowCreateAnnouncement(true)}>
                                <Plus className="w-4 h-4 mr-2"/>New Announcement
                            </Button>
                        )}
                    </div>
                    <div className="space-y-4">
                        {announcements.map((ann) => (
                            <AnnouncementCard 
                                key={ann.id} 
                                announcement={ann} 
                                currentUser={currentUser}
                                onEdit={() => {}}
                                onDelete={() => {}}
                            />
                        ))}
                    </div>
                </div>

                {/* Guild Tasks */}
                {currentUser.role === 'Leader' && (
                    <div>
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                                <Target className="text-green-400"/>Guild Tasks
                            </h2>
                            <Button onClick={() => setShowCreateTask(true)}>
                                <Plus className="w-4 h-4 mr-2"/>Assign Task
                            </Button>
                        </div>
                        <div className="space-y-3">
                            {tasks.map((task) => (
                                <TaskCard key={task.id} task={task} currentUser={currentUser} />
                            ))}
                        </div>
                    </div>
                )}
            </div>
            
            {/* Sidebar */}
            <div className="lg:col-span-1 space-y-6">
                {/* Active Polls */}
                <div>
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <Vote className="text-yellow-400"/>Active Polls
                        </h2>
                        {(currentUser.role === 'Leader' || currentUser.role === 'Officer') && (
                            <Button size="sm" onClick={() => setShowCreatePoll(true)}>
                                <Plus className="w-3 h-3 mr-1"/>Create
                            </Button>
                        )}
                    </div>
                    <div className="space-y-4">
                        {polls.filter(poll => poll.isOpen).map((poll) => (
                            <PollCard key={poll.id} poll={poll} currentUser={currentUser} onVote={handleVote} />
                        ))}
                    </div>
                </div>
                
                {/* Guild Resources */}
                <div>
                    <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                        <FileText className="text-green-400"/>Resources
                    </h2>
                    <div className="space-y-2">
                        <Button variant="outline" className="w-full justify-start">Clan Rules & Guidelines</Button>
                        <Button variant="outline" className="w-full justify-start">Event Participation Guide</Button>
                        <Button variant="outline" className="w-full justify-start">Trading & Economy FAQ</Button>
                        <Button variant="outline" className="w-full justify-start">Voice Chat Setup</Button>
                    </div>
                </div>
            </div>

            {/* Modals */}
            <AnimatePresence>
                {showCreateAnnouncement && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
                        onClick={() => setShowCreateAnnouncement(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0.9 }}
                            className="bg-slate-800 p-6 rounded-lg w-96 max-w-md"
                            onClick={e => e.stopPropagation()}
                        >
                            <h3 className="text-xl font-bold text-white mb-4">Create Announcement</h3>
                            <div className="space-y-4">
                                <Input
                                    placeholder="Announcement Title"
                                    value={newAnnouncement.title}
                                    onChange={(e) => setNewAnnouncement({...newAnnouncement, title: e.target.value})}
                                />
                                <Textarea
                                    placeholder="Announcement Content"
                                    value={newAnnouncement.content}
                                    onChange={(e) => setNewAnnouncement({...newAnnouncement, content: e.target.value})}
                                    rows={4}
                                />
                                <div className="flex items-center space-x-2">
                                    <input
                                        type="checkbox"
                                        id="pin-announcement"
                                        checked={newAnnouncement.pinned}
                                        onChange={(e) => setNewAnnouncement({...newAnnouncement, pinned: e.target.checked})}
                                    />
                                    <label htmlFor="pin-announcement" className="text-sm text-slate-300">Pin this announcement</label>
                                </div>
                                <div className="flex gap-2">
                                    <Button onClick={handleCreateAnnouncement} className="flex-1">Post Announcement</Button>
                                    <Button variant="outline" onClick={() => setShowCreateAnnouncement(false)}>Cancel</Button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}

                {showCreatePoll && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
                        onClick={() => setShowCreatePoll(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0.9 }}
                            className="bg-slate-800 p-6 rounded-lg w-96 max-w-md"
                            onClick={e => e.stopPropagation()}
                        >
                            <h3 className="text-xl font-bold text-white mb-4">Create Poll</h3>
                            <div className="space-y-4">
                                <Input
                                    placeholder="Poll Question"
                                    value={newPoll.question}
                                    onChange={(e) => setNewPoll({...newPoll, question: e.target.value})}
                                />
                                {newPoll.options.map((option, index) => (
                                    <Input
                                        key={index}
                                        placeholder={`Option ${index + 1}`}
                                        value={option}
                                        onChange={(e) => {
                                            const newOptions = [...newPoll.options];
                                            newOptions[index] = e.target.value;
                                            setNewPoll({...newPoll, options: newOptions});
                                        }}
                                    />
                                ))}
                                <Button
                                    variant="outline"
                                    onClick={() => setNewPoll({...newPoll, options: [...newPoll.options, '']})}
                                    className="w-full"
                                >
                                    Add Option
                                </Button>
                                <Select
                                    value={newPoll.expiresIn.toString()}
                                    onValueChange={(value) => setNewPoll({...newPoll, expiresIn: parseInt(value)})}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Poll Duration" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="1">1 Day</SelectItem>
                                        <SelectItem value="3">3 Days</SelectItem>
                                        <SelectItem value="7">1 Week</SelectItem>
                                        <SelectItem value="14">2 Weeks</SelectItem>
                                    </SelectContent>
                                </Select>
                                <div className="flex gap-2">
                                    <Button onClick={handleCreatePoll} className="flex-1">Create Poll</Button>
                                    <Button variant="outline" onClick={() => setShowCreatePoll(false)}>Cancel</Button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}

                {showCreateTask && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
                        onClick={() => setShowCreateTask(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0.9 }}
                            className="bg-slate-800 p-6 rounded-lg w-96 max-w-md"
                            onClick={e => e.stopPropagation()}
                        >
                            <h3 className="text-xl font-bold text-white mb-4">Assign Task</h3>
                            <div className="space-y-4">
                                <Input
                                    placeholder="Task Title"
                                    value={newTask.title}
                                    onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                                />
                                <Textarea
                                    placeholder="Task Description"
                                    value={newTask.description}
                                    onChange={(e) => setNewTask({...newTask, description: e.target.value})}
                                    rows={3}
                                />
                                <Select
                                    value={newTask.assignedTo}
                                    onValueChange={(value) => setNewTask({...newTask, assignedTo: value})}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Assign To" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="All Members">All Members</SelectItem>
                                        <SelectItem value="Officers">Officers Only</SelectItem>
                                        <SelectItem value="Recruits">New Recruits</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Select
                                    value={newTask.priority}
                                    onValueChange={(value) => setNewTask({...newTask, priority: value})}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Priority" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="low">Low Priority</SelectItem>
                                        <SelectItem value="medium">Medium Priority</SelectItem>
                                        <SelectItem value="high">High Priority</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Input
                                    type="date"
                                    value={newTask.dueDate}
                                    onChange={(e) => setNewTask({...newTask, dueDate: e.target.value})}
                                />
                                <div className="flex gap-2">
                                    <Button onClick={handleCreateTask} className="flex-1">Assign Task</Button>
                                    <Button variant="outline" onClick={() => setShowCreateTask(false)}>Cancel</Button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
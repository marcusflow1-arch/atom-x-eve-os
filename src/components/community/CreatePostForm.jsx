import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Star, Search, Gamepad2, Trophy, Globe, BookOpen, HelpCircle } from 'lucide-react';
import { motion } from 'framer-motion';

// Expanded mock list with genres for the form
const availableGames = [
    { title: "Elder Scrolls: Reborn", genre: "RPG" },
    { title: "Cyberpunk 2088", genre: "RPG" },
    { title: "Vanguard Ops", genre: "FPS" },
    { title: "Nexus Clash", genre: "MOBA" },
    { title: "StarCraft: Ghost Protocol", genre: "Strategy" },
    { title: "Diablo II: Eternal", genre: "RPG" },
    { title: "Final Fantasy XXVII", genre: "RPG" },
    { title: "Call of Duty: Future Warfare", genre: "FPS" },
    { title: "Elden Ring 2", genre: "RPG" },
    { title: "Minecraft 2", genre: "Sandbox" }
];

const StarRating = ({ rating, setRating }) => (
    <div className="flex items-center gap-1">
        <p className="text-sm font-medium text-slate-300 mr-2">Rating:</p>
        {[1, 2, 3, 4, 5].map((star) => (
            <Star
                key={star}
                className={`w-6 h-6 cursor-pointer transition-colors ${
                    rating >= star ? 'text-yellow-400 fill-yellow-400' : 'text-slate-600 hover:text-yellow-400/50'
                }`}
                onClick={() => setRating(star)}
            />
        ))}
    </div>
);

export default function CreatePostForm({ onSubmit, onCancel, initialType = 'general_discussion' }) {
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        title: '',
        content: '',
        type: initialType,
        game_title: '',
        genre: '',
        rating: 0,
        image_url: '',
        community: 'discussions' // used as sub-category/tag
    });

    const handleGameSelect = (gameTitle) => {
        const game = availableGames.find(g => g.title === gameTitle);
        setFormData({ 
            ...formData, 
            game_title: gameTitle, 
            genre: game ? game.genre : '',
            type: 'game_discussion' // Default to discussion when game is selected
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(formData);
    };

    const renderStep1 = () => (
        <div className="space-y-4">
            <h3 className="text-lg font-medium text-white mb-4">Where do you want to post?</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                    type="button"
                    onClick={() => { setFormData({...formData, type: 'game_discussion'}); setStep(2); }}
                    className={`p-6 rounded-xl border-2 transition-all flex flex-col items-center gap-3 text-center ${
                        formData.type.includes('game') 
                        ? 'border-blue-500 bg-blue-500/10 text-white' 
                        : 'border-slate-700 bg-slate-800/50 text-slate-400 hover:border-slate-500 hover:text-white'
                    }`}
                >
                    <Gamepad2 className="w-8 h-8" />
                    <span className="font-bold">Game Forum</span>
                    <span className="text-xs opacity-70">Specific game discussions, reviews, or guides</span>
                </button>

                <button
                    type="button"
                    onClick={() => { setFormData({...formData, type: 'general_discussion'}); setStep(3); }}
                    className={`p-6 rounded-xl border-2 transition-all flex flex-col items-center gap-3 text-center ${
                        formData.type === 'general_discussion'
                        ? 'border-green-500 bg-green-500/10 text-white' 
                        : 'border-slate-700 bg-slate-800/50 text-slate-400 hover:border-slate-500 hover:text-white'
                    }`}
                >
                    <Globe className="w-8 h-8" />
                    <span className="font-bold">General Lounge</span>
                    <span className="text-xs opacity-70">Off-topic, tech talk, and community chat</span>
                </button>

                <button
                    type="button"
                    onClick={() => { setFormData({...formData, type: 'achievement_discussion'}); setStep(3); }}
                    className={`p-6 rounded-xl border-2 transition-all flex flex-col items-center gap-3 text-center ${
                        formData.type === 'achievement_discussion'
                        ? 'border-yellow-500 bg-yellow-500/10 text-white' 
                        : 'border-slate-700 bg-slate-800/50 text-slate-400 hover:border-slate-500 hover:text-white'
                    }`}
                >
                    <Trophy className="w-8 h-8" />
                    <span className="font-bold">Achievement Hunt</span>
                    <span className="text-xs opacity-70">Trophy hunting, 100% completion tips</span>
                </button>
            </div>
        </div>
    );

    const renderStep2 = () => (
        <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-medium text-white">Select a Game</h3>
                <Button variant="ghost" size="sm" onClick={() => setStep(1)} className="text-slate-400">Back</Button>
            </div>
            
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input 
                    placeholder="Search for a game..." 
                    className="pl-10 bg-slate-800 border-slate-700"
                    onChange={(e) => {
                        // Implement search filter if list was long
                    }}
                />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[300px] overflow-y-auto custom-scrollbar">
                {availableGames.map(game => (
                    <button
                        key={game.title}
                        type="button"
                        onClick={() => { handleGameSelect(game.title); setStep(3); }}
                        className={`p-3 rounded-lg text-left transition-all flex justify-between items-center ${
                            formData.game_title === game.title
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                        }`}
                    >
                        <span className="font-medium">{game.title}</span>
                        <span className={`text-xs px-2 py-1 rounded-full ${formData.game_title === game.title ? 'bg-blue-500' : 'bg-slate-900 text-slate-400'}`}>
                            {game.genre}
                        </span>
                    </button>
                ))}
            </div>
        </div>
    );

    const renderStep3 = () => (
        <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-medium text-white">Post Details</h3>
                <Button variant="ghost" size="sm" onClick={() => setStep(formData.type.includes('game') ? 2 : 1)} className="text-slate-400">Back</Button>
            </div>

            {formData.type.includes('game') && (
                <div className="flex gap-2 mb-4">
                    <Button 
                        type="button"
                        size="sm"
                        variant={formData.type === 'game_discussion' ? 'default' : 'outline'}
                        onClick={() => setFormData({...formData, type: 'game_discussion'})}
                        className={formData.type === 'game_discussion' ? 'bg-blue-600' : 'border-slate-700'}
                    >
                        Discussion
                    </Button>
                    <Button 
                        type="button"
                        size="sm"
                        variant={formData.type === 'game_review' ? 'default' : 'outline'}
                        onClick={() => setFormData({...formData, type: 'game_review'})}
                        className={formData.type === 'game_review' ? 'bg-green-600' : 'border-slate-700'}
                    >
                        Review
                    </Button>
                </div>
            )}

            <Input 
                placeholder="Title" 
                value={formData.title} 
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                className="text-lg font-semibold bg-slate-800 border-slate-700"
                required
            />

            {formData.type === 'game_review' && (
                <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700">
                    <StarRating rating={formData.rating} setRating={(r) => setFormData({...formData, rating: r})} />
                </div>
            )}

            <Select value={formData.community} onValueChange={(v) => setFormData({...formData, community: v})}>
                <SelectTrigger className="bg-slate-800 border-slate-700">
                    <SelectValue placeholder="Select Category" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-700 text-white">
                    <SelectItem value="discussions">General Discussion</SelectItem>
                    <SelectItem value="guide">Guide / Tips</SelectItem>
                    <SelectItem value="question">Question</SelectItem>
                    <SelectItem value="bugs">Bug Report</SelectItem>
                    <SelectItem value="feedback">Feedback</SelectItem>
                </SelectContent>
            </Select>

            <Textarea 
                placeholder="Write your post content here..." 
                value={formData.content} 
                onChange={(e) => setFormData({...formData, content: e.target.value})}
                className="min-h-[200px] bg-slate-800 border-slate-700"
                required
            />

            <Input 
                placeholder="Image URL (Optional)" 
                value={formData.image_url} 
                onChange={(e) => setFormData({...formData, image_url: e.target.value})}
                className="bg-slate-800 border-slate-700"
            />

            <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                    Create Post
                </Button>
            </div>
        </div>
    );

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onCancel}>
            <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
                <div className="p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold text-white">Create Post</h2>
                        <div className="flex items-center gap-1">
                            {[1, 2, 3].map(i => (
                                <div key={i} className={`w-2 h-2 rounded-full ${step >= i ? 'bg-blue-500' : 'bg-slate-700'}`} />
                            ))}
                        </div>
                    </div>

                    <form onSubmit={handleSubmit}>
                        {step === 1 && renderStep1()}
                        {step === 2 && renderStep2()}
                        {step === 3 && renderStep3()}
                    </form>
                </div>
            </div>
        </div>
    );
}
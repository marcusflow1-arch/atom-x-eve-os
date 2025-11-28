
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Star } from 'lucide-react';
import { motion } from 'framer-motion';

const StarRating = ({ rating, setRating }) => (
    <div className="flex items-center gap-1">
        <p className="text-sm font-medium text-slate-300 mr-2">Rating:</p>
        {[1, 2, 3, 4, 5].map((star) => (
            <Star
                key={star}
                className={`w-6 h-6 cursor-pointer transition-colors ${
                    rating >= star ? 'text-yellow-400 fill-yellow-400' : 'text-slate-500 hover:text-yellow-400/50'
                }`}
                onClick={() => setRating(star)}
            />
        ))}
    </div>
);

// A mock list of games that could be in the user's library or the store
const gameList = [
    "Elder Scrolls: Reborn",
    "Cyberpunk 2088",
    "Vanguard Ops",
    "Nexus Clash",
    "StarCraft: Ghost Protocol",
    "Diablo II: Eternal"
];

export default function CreatePostForm({ onSubmit, onCancel, initialType = 'general_discussion' }) {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [type, setType] = useState(initialType);
    const [gameTitle, setGameTitle] = useState('');
    const [rating, setRating] = useState(0);
    const [imageUrl, setImageUrl] = useState('');
    
    const handleSubmit = (e) => {
        e.preventDefault();
        const postData = { title, content, type, image_url: imageUrl };
        if (type === 'game_review' || type === 'game_discussion') {
            postData.game_title = gameTitle;
        }
        if (type === 'game_review') {
            postData.rating = rating;
        }
        onSubmit(postData);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={onCancel}
        >
            <div 
                className="bg-slate-900/60 backdrop-blur-lg p-8 rounded-2xl border border-slate-700 w-full max-w-2xl shadow-2xl" 
                onClick={(e) => e.stopPropagation()}
            >
                <h2 className="text-2xl font-bold text-white mb-6">Create a New Post</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <Select value={type} onValueChange={setType}>
                        <SelectTrigger className="bg-slate-700/50 border-slate-600 text-slate-100 font-semibold rounded-lg focus:ring-2 focus:ring-blue-400 h-11">
                            <SelectValue placeholder="Choose post type" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800/90 backdrop-blur-lg border-slate-700 text-slate-100">
                            <SelectItem value="game_review" className="focus:bg-blue-500/30">Game Review</SelectItem>
                            <SelectItem value="game_discussion" className="focus:bg-blue-500/30">Game Discussion</SelectItem>
                            <SelectItem value="general_discussion" className="focus:bg-blue-500/30">General Discussion</SelectItem>
                        </SelectContent>
                    </Select>

                    {(type === 'game_review' || type === 'game_discussion') && (
                        <Select onValueChange={setGameTitle}>
                            <SelectTrigger className="bg-slate-700/50 border-slate-600 text-slate-100 font-semibold rounded-lg focus:ring-2 focus:ring-blue-400 h-11">
                                <SelectValue placeholder="Select a Game" />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-800/90 backdrop-blur-lg border-slate-700 text-slate-100">
                                {gameList.map(game => <SelectItem key={game} value={game} className="focus:bg-blue-500/30">{game}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    )}
                    
                    <Input 
                        placeholder="Post Title" 
                        value={title} 
                        onChange={(e) => setTitle(e.target.value)}
                        className="text-lg font-semibold bg-slate-700/50 border-slate-600 placeholder:text-slate-400 text-white rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition h-11"
                        required
                    />

                    {type === 'game_review' && <StarRating rating={rating} setRating={setRating} />}
                    
                    <Textarea 
                        placeholder="What's on your mind? Share your thoughts..." 
                        value={content} 
                        onChange={(e) => setContent(e.target.value)}
                        className="h-40 bg-slate-700/50 border-slate-600 placeholder:text-slate-400 text-slate-100 font-medium rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition"
                        required
                    />
                    <Input 
                        placeholder="Image URL (Optional)" 
                        value={imageUrl} 
                        onChange={(e) => setImageUrl(e.target.value)}
                        className="bg-slate-700/50 border-slate-600 placeholder:text-slate-400 text-slate-100 font-medium rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition h-11"
                    />
                    <div className="flex justify-end gap-3 pt-4">
                        <Button type="button" variant="ghost" className="text-slate-300 hover:bg-slate-700/50 hover:text-white" onClick={onCancel}>Cancel</Button>
                        <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-semibold">Post</Button>
                    </div>
                </form>
            </div>
        </motion.div>
    );
}

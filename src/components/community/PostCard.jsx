import React from 'react';
import { ArrowUp, ArrowDown, MessageSquare, Star } from 'lucide-react';
import { motion } from 'framer-motion';

const StarDisplay = ({ rating }) => (
    <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
            <Star
                key={star}
                className={`w-4 h-4 ${
                    rating >= star ? 'text-yellow-400 fill-yellow-400' : 'text-slate-600'
                }`}
            />
        ))}
    </div>
);

export default function PostCard({ post, onVote, onSelect, isDetailView = false }) {
    
    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex gap-3 bg-slate-800/50 p-4 rounded-lg border border-slate-700 hover:border-slate-600 transition-colors duration-200"
        >
            {/* Vote Section */}
            <div className="flex flex-col items-center justify-start space-y-1 flex-shrink-0 text-slate-400 pt-1">
                <button onClick={(e) => { e.stopPropagation(); onVote(post, 'up'); }} className="p-1 rounded-full hover:bg-green-500/20 hover:text-green-400">
                    <ArrowUp className="w-5 h-5" />
                </button>
                <span className="font-bold text-lg text-white">{post.score}</span>
                <button onClick={(e) => { e.stopPropagation(); onVote(post, 'down'); }} className="p-1 rounded-full hover:bg-red-500/20 hover:text-red-400">
                    <ArrowDown className="w-5 h-5" />
                </button>
            </div>

            {/* Content Section */}
            <div className="w-full" onClick={!isDetailView ? onSelect : undefined} style={{ cursor: isDetailView ? 'default' : 'pointer' }}>
                <div className="text-xs text-slate-400 mb-2 flex items-center gap-2 flex-wrap">
                    {post.type === 'game_review' && <span className="font-bold text-yellow-400 bg-yellow-500/10 px-2 py-1 rounded-full">REVIEW</span>}
                    {post.type === 'game_discussion' && <span className="font-bold text-teal-400 bg-teal-500/10 px-2 py-1 rounded-full">DISCUSSION</span>}
                    {post.game_title && <span className="font-bold text-blue-400">{post.game_title}</span>}
                    {post.game_title && <span className="text-slate-600">•</span>}
                    <span>Posted by <span className="font-semibold text-slate-300">{post.created_by.split('@')[0]}</span></span>
                </div>

                <div className="flex items-start justify-between">
                    <h2 className="text-xl font-bold text-white mb-2">{post.title}</h2>
                    {post.type === 'game_review' && <StarDisplay rating={post.rating} />}
                </div>
                
                {post.image_url && (
                    <img src={post.image_url} alt={post.title} className="max-h-96 w-full object-contain rounded-md my-3 bg-slate-900" />
                )}

                <p className={`text-slate-300 prose prose-sm prose-invert max-w-none ${!isDetailView ? 'line-clamp-3' : ''}`}>
                    {post.content}
                </p>

                {!isDetailView && (
                    <div className="mt-4 flex items-center gap-2 text-slate-400 hover:text-white transition-colors duration-200">
                        <MessageSquare className="w-5 h-5" />
                        <span className="font-semibold text-sm">View Post & Comments</span>
                    </div>
                )}
            </div>
        </motion.div>
    );
}
import React from 'react';
import { ArrowUp, ArrowDown, MessageSquare, Star, Gamepad2 } from 'lucide-react';
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
            className="flex gap-4 p-5 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-300 backdrop-blur-md shadow-sm group"
        >
            {/* Vote Section */}
            <div className="flex flex-col items-center justify-start gap-1 flex-shrink-0 text-slate-400 pt-1">
                <button onClick={(e) => { e.stopPropagation(); onVote(post, 'up'); }} className="p-1.5 rounded-xl bg-white/5 hover:bg-green-500/20 hover:text-green-400 transition-colors">
                    <ArrowUp className="w-4 h-4" />
                </button>
                <span className="font-bold text-sm text-white font-mono">{post.score}</span>
                <button onClick={(e) => { e.stopPropagation(); onVote(post, 'down'); }} className="p-1.5 rounded-xl bg-white/5 hover:bg-red-500/20 hover:text-red-400 transition-colors">
                    <ArrowDown className="w-4 h-4" />
                </button>
            </div>

            {/* Content Section */}
            <div className="flex-1 min-w-0" onClick={!isDetailView ? onSelect : undefined} style={{ cursor: isDetailView ? 'default' : 'pointer' }}>
                <div className="flex items-center gap-2 mb-2 text-xs">
                    <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${
                            post.type === 'game_review' ? 'bg-yellow-400' :
                            post.type === 'game_discussion' ? 'bg-teal-400' :
                            post.type === 'achievement_discussion' ? 'bg-amber-400' : 'bg-blue-400'
                        }`} />
                        <span className="font-bold tracking-wide text-white/60 uppercase">{post.type?.replace('_', ' ') || 'Discussion'}</span>
                    </div>
                    <span className="text-white/20">•</span>
                    <span className="text-white/40">Posted by <span className="text-white hover:underline">{post.user?.full_name || post.created_by?.split('@')[0] || 'Anonymous'}</span></span>
                    <span className="text-white/20">•</span>
                    <span className="text-white/40">{new Date(post.created_date || Date.now()).toLocaleDateString()}</span>
                </div>

                <div className="flex items-start justify-between gap-4">
                    <h2 className="text-lg font-bold text-white leading-tight mb-2 group-hover:text-cyan-400 transition-colors">{post.title}</h2>
                    {post.type === 'game_review' && <StarDisplay rating={post.rating} />}
                </div>
                
                {post.image_url && (
                    <div className="relative w-full aspect-video rounded-xl overflow-hidden my-3 border border-white/10">
                        <img src={post.image_url} alt={post.title} className="w-full h-full object-cover" />
                    </div>
                )}

                <p className={`text-slate-300 text-sm leading-relaxed ${!isDetailView ? 'line-clamp-3' : ''}`}>
                    {post.content}
                </p>

                {/* Footer / Meta */}
                <div className="mt-4 flex items-center gap-4">
                    {post.game_title && (
                        <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white/5 border border-white/5 text-[10px] text-white/60">
                            <Gamepad2 className="w-3 h-3" />
                            {post.game_title}
                        </div>
                    )}
                    
                    <div className="flex items-center gap-1.5 text-white/40 text-xs hover:text-cyan-400 transition-colors">
                        <MessageSquare className="w-4 h-4" />
                        <span>Comments</span>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
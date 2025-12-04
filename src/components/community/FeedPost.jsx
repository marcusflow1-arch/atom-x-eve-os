import React from 'react';
import { motion } from 'framer-motion';
import { Trophy, Swords, Heart, MessageSquare, Share2, MoreHorizontal, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import moment from 'moment';

const FeedPost = ({ post, onVote, onComment, onShare }) => {
    const isChallenge = post.type === 'challenge';
    const isAchievement = post.type === 'achievement_share';
    const achievement = post.achievement_data;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 mb-4 hover:border-slate-700 transition-all"
        >
            {/* Header */}
            <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                    <Avatar className="w-10 h-10 border border-slate-700">
                        <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${post.created_by}`} />
                        <AvatarFallback>{post.created_by?.substring(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="font-bold text-white">{post.created_by || 'Anonymous'}</span>
                            {post.is_ai_generated && (
                                <Badge variant="secondary" className="text-[10px] bg-blue-900/30 text-blue-400 border-blue-800">
                                    AI Generated
                                </Badge>
                            )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-400">
                            <span>{moment(post.created_date).fromNow()}</span>
                            <span>•</span>
                            <span className="capitalize">{post.type.replace('_', ' ')}</span>
                        </div>
                    </div>
                </div>
                <Button variant="ghost" size="icon" className="text-slate-500">
                    <MoreHorizontal className="w-4 h-4" />
                </Button>
            </div>

            {/* Content */}
            <div className="mb-4">
                {post.title && <h3 className="text-lg font-bold text-white mb-2">{post.title}</h3>}
                <p className="text-slate-300 whitespace-pre-wrap">{post.content}</p>
            </div>

            {/* Achievement/Challenge Card */}
            {achievement && (
                <div className={`mb-4 p-4 rounded-lg border ${
                    isChallenge ? 'bg-orange-900/10 border-orange-500/30' : 'bg-blue-900/10 border-blue-500/30'
                }`}>
                    <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-lg text-2xl ${
                            isChallenge ? 'bg-orange-500/20' : 'bg-blue-500/20'
                        }`}>
                            {achievement.icon || <Trophy />}
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center justify-between">
                                <h4 className={`font-bold ${
                                    isChallenge ? 'text-orange-400' : 'text-blue-400'
                                }`}>{achievement.title}</h4>
                                <Badge variant="outline" className="border-slate-600">
                                    {achievement.rarity || 'Common'}
                                </Badge>
                            </div>
                            <p className="text-sm text-slate-400 mt-1">{achievement.description}</p>
                            <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
                                <Star className="w-3 h-3" /> {achievement.points} Points • {achievement.game}
                            </p>
                        </div>
                    </div>
                    {isChallenge && (
                        <div className="mt-4 flex justify-end">
                            <Button size="sm" className="bg-orange-600 hover:bg-orange-700 text-white">
                                Accept Challenge
                            </Button>
                        </div>
                    )}
                </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-800/50">
                <div className="flex items-center gap-4">
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => onVote(post, 'up')}
                        className="text-slate-400 hover:text-green-400"
                    >
                        <Heart className="w-4 h-4 mr-2" />
                        {post.score || 0}
                    </Button>
                    <Button variant="ghost" size="sm" className="text-slate-400 hover:text-blue-400">
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Comment
                    </Button>
                    <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
                        <Share2 className="w-4 h-4 mr-2" />
                        Share
                    </Button>
                </div>
            </div>
        </motion.div>
    );
};

export default FeedPost;
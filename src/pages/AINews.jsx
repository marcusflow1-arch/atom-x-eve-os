import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, TrendingUp, Zap, Users, Search, Filter, Eye, Heart, Share2 } from 'lucide-react';

const newsData = [
    {
        id: 1,
        title: "AI-Driven NPCs Now Display Emergent Emotions in Elder Scrolls: Reborn",
        excerpt: "Latest neural network update brings unprecedented realism to character interactions, with NPCs forming relationships and grudges based on player actions.",
        category: "Game Update",
        timestamp: "2 hours ago",
        trending: true,
        readTime: "3 min read",
        views: "12.5K",
        likes: "342",
        image: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=250&fit=crop",
        author: "AI Gaming Lab"
    },
    {
        id: 2,
        title: "Cyberpunk 2088 AI Revolution: City Adapts to Player Behavior",
        excerpt: "Night City's AI systems now dynamically alter crime rates, NPC behavior, and even weather patterns based on collective player actions across all servers.",
        category: "AI Innovation",
        timestamp: "5 hours ago",
        trending: true,
        readTime: "4 min read",
        views: "18.2K",
        likes: "567",
        image: "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=250&fit=crop",
        author: "Neural Systems Team"
    },
    {
        id: 3,
        title: "Neural Network Breakthrough: AI Creates Unique Quests in Real-Time",
        excerpt: "Advanced procedural generation now creates fully voiced, story-driven quests that adapt to individual player preferences and past choices.",
        category: "Technology",
        timestamp: "8 hours ago",
        trending: false,
        readTime: "5 min read",
        views: "9.8K",
        likes: "234",
        image: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=400&h=250&fit=crop",
        author: "Quest AI Division"
    },
    {
        id: 4,
        title: "AI Online Tournaments: 2.4M Players Compete in WoW: AI Ascension",
        excerpt: "Record-breaking participation in the first AI-assisted raid tournament, where neural networks provide real-time strategy optimization.",
        category: "Esports",
        timestamp: "12 hours ago",
        trending: false,
        readTime: "2 min read",
        views: "45.1K",
        likes: "1.2K",
        image: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400&h=250&fit=crop",
        author: "Esports Analytics"
    },
    {
        id: 5,
        title: "Machine Learning Models Now Predict Player Burnout with 94% Accuracy",
        excerpt: "Revolutionary wellness AI suggests optimal play sessions and personalized content recommendations to maintain long-term engagement.",
        category: "Player Wellness",
        timestamp: "1 day ago",
        trending: false,
        readTime: "6 min read",
        views: "7.3K",
        likes: "198",
        image: "https://images.unsplash.com/photo-1555255707-c07966088b7b?w=400&h=250&fit=crop",
        author: "Player Health Team"
    }
];

const categoryColors = {
    "Game Update": "bg-gradient-to-r from-blue-500/20 to-blue-600/20 text-blue-300 border-blue-500/30",
    "AI Innovation": "bg-gradient-to-r from-purple-500/20 to-purple-600/20 text-purple-300 border-purple-500/30",
    "Technology": "bg-gradient-to-r from-green-500/20 to-green-600/20 text-green-300 border-green-500/30",
    "Esports": "bg-gradient-to-r from-orange-500/20 to-orange-600/20 text-orange-300 border-orange-500/30",
    "Player Wellness": "bg-gradient-to-r from-cyan-500/20 to-cyan-600/20 text-cyan-300 border-cyan-500/30"
};

export default function AINewsPage() {
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');

    const filteredNews = newsData.filter(article => {
        const categoryMatch = selectedCategory === 'all' || article.category === selectedCategory;
        const searchMatch = article.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           article.excerpt.toLowerCase().includes(searchTerm.toLowerCase());
        return categoryMatch && searchMatch;
    });

    const categories = ['all', ...new Set(newsData.map(article => article.category))];

    return (
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 min-h-screen text-slate-200 font-sans p-6">
            <style>{`
                .news-container {
                    background: rgba(15, 23, 42, 0.6);
                    backdrop-filter: blur(20px);
                    border: 1px solid rgba(148, 163, 184, 0.2);
                    border-radius: 16px;
                    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
                    position: relative;
                    overflow: hidden;
                }

                .news-container::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: 
                        radial-gradient(circle at 20% 20%, rgba(59, 130, 246, 0.08) 0%, transparent 50%),
                        radial-gradient(circle at 80% 80%, rgba(168, 85, 247, 0.08) 0%, transparent 50%);
                    pointer-events: none;
                }

                .news-card {
                    background: rgba(30, 41, 59, 0.6);
                    backdrop-filter: blur(10px);
                    border: 1px solid rgba(71, 85, 105, 0.4);
                    border-radius: 12px;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    position: relative;
                    overflow: hidden;
                    cursor: pointer;
                }

                .news-card::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: -100%;
                    width: 100%;
                    height: 100%;
                    background: linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.05) 50%, transparent 100%);
                    transition: left 0.8s ease;
                }

                .news-card:hover::before {
                    left: 100%;
                }

                .news-card:hover {
                    transform: translateY(-4px);
                    border-color: rgba(59, 130, 246, 0.5);
                    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.4);
                }

                .trending-badge {
                    background: linear-gradient(135deg, rgba(239, 68, 68, 0.8) 0%, rgba(220, 38, 38, 0.8) 100%);
                    box-shadow: 0 0 20px rgba(239, 68, 68, 0.4);
                    animation: pulseGlow 2s ease-in-out infinite;
                }

                @keyframes pulseGlow {
                    0%, 100% { box-shadow: 0 0 20px rgba(239, 68, 68, 0.4); }
                    50% { box-shadow: 0 0 30px rgba(239, 68, 68, 0.6); }
                }

                .hero-section {
                    background: linear-gradient(135deg, rgba(15, 23, 42, 0.9) 0%, rgba(30, 41, 59, 0.9) 100%);
                    backdrop-filter: blur(20px);
                    border: 1px solid rgba(59, 130, 246, 0.3);
                    border-radius: 20px;
                    position: relative;
                    overflow: hidden;
                }

                .hero-section::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: 
                        radial-gradient(circle at 30% 40%, rgba(59, 130, 246, 0.1) 0%, transparent 50%),
                        radial-gradient(circle at 70% 60%, rgba(168, 85, 247, 0.1) 0%, transparent 50%);
                    pointer-events: none;
                }

                .search-container {
                    background: rgba(30, 41, 59, 0.8);
                    border: 1px solid rgba(71, 85, 105, 0.5);
                    border-radius: 12px;
                    transition: all 0.3s ease;
                }

                .search-container:focus-within {
                    border-color: rgba(59, 130, 246, 0.6);
                    box-shadow: 0 0 20px rgba(59, 130, 246, 0.2);
                }

                .category-filter {
                    background: rgba(51, 65, 85, 0.6);
                    border: 1px solid rgba(100, 116, 139, 0.4);
                    transition: all 0.3s ease;
                }

                .category-filter:hover {
                    background: rgba(59, 130, 246, 0.2);
                    border-color: rgba(59, 130, 246, 0.5);
                }

                .category-filter.active {
                    background: linear-gradient(135deg, rgba(59, 130, 246, 0.8) 0%, rgba(37, 99, 235, 0.8) 100%);
                    border-color: rgba(59, 130, 246, 0.8);
                    box-shadow: 0 0 15px rgba(59, 130, 246, 0.4);
                }

                .image-overlay {
                    background: linear-gradient(180deg, transparent 0%, rgba(0, 0, 0, 0.8) 100%);
                    transition: all 0.3s ease;
                }

                .news-card:hover .image-overlay {
                    background: linear-gradient(180deg, rgba(59, 130, 246, 0.1) 0%, rgba(0, 0, 0, 0.9) 100%);
                }
            `}</style>
            
            {/* Hero Header Section */}
            <div className="hero-section p-8 mb-8 relative z-10">
                <div className="text-center">
                    <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 mb-4">
                        AI Gaming News
                    </h1>
                    <p className="text-xl text-slate-400 mb-6">Stay updated with the latest AI gaming innovations and breakthroughs</p>
                    
                    {/* Stats Bar */}
                    <div className="flex justify-center gap-8 text-sm">
                        <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-green-400" />
                            <span className="text-slate-300">2.1M Active Readers</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-blue-400" />
                            <span className="text-slate-300">50+ Daily Articles</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Zap className="w-4 h-4 text-purple-400" />
                            <span className="text-slate-300">Breaking AI News</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto">
                {/* Search and Filters */}
                <div className="news-container p-6 mb-8">
                    <div className="flex flex-col lg:flex-row gap-4 items-center">
                        <div className="relative flex-1">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <Input 
                                placeholder="Search news articles..."
                                className="pl-12 search-container bg-transparent text-white h-12"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="flex gap-2 overflow-x-auto">
                            {categories.map(category => (
                                <Button
                                    key={category}
                                    onClick={() => setSelectedCategory(category)}
                                    className={`category-filter whitespace-nowrap px-6 py-3 rounded-lg font-medium ${
                                        selectedCategory === category ? 'active' : ''
                                    }`}
                                >
                                    {category === 'all' ? 'All News' : category}
                                </Button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Trending Section */}
                <div className="news-container p-6 mb-8">
                    <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                        <TrendingUp className="w-6 h-6 text-orange-400" />
                        Trending Now
                    </h2>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {filteredNews.filter(article => article.trending).map(article => (
                            <div key={article.id} className="news-card p-0 overflow-hidden">
                                <div className="relative">
                                    <img src={article.image} alt={article.title} className="w-full h-48 object-cover" />
                                    <div className="image-overlay absolute inset-0"></div>
                                    <Badge className="trending-badge absolute top-4 right-4 text-white font-bold">
                                        <TrendingUp className="w-3 h-3 mr-1" />
                                        Trending
                                    </Badge>
                                    <div className="absolute bottom-4 left-4 right-4">
                                        <Badge className={`${categoryColors[article.category]} mb-2`}>
                                            {article.category}
                                        </Badge>
                                        <h3 className="text-xl font-bold text-white leading-tight">{article.title}</h3>
                                    </div>
                                </div>
                                <div className="p-6">
                                    <p className="text-slate-400 mb-4">{article.excerpt}</p>
                                    <div className="flex items-center justify-between text-sm">
                                        <div className="flex items-center gap-4 text-slate-500">
                                            <span className="flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                {article.timestamp}
                                            </span>
                                            <span>{article.readTime}</span>
                                            <span className="text-slate-400">by {article.author}</span>
                                        </div>
                                        <div className="flex items-center gap-3 text-slate-500">
                                            <span className="flex items-center gap-1">
                                                <Eye className="w-3 h-3" />
                                                {article.views}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Heart className="w-3 h-3" />
                                                {article.likes}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* All Articles */}
                <div className="news-container p-6">
                    <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                        <Zap className="w-6 h-6 text-blue-400" />
                        Latest Articles
                    </h2>
                    <div className="space-y-6">
                        {filteredNews.map(article => (
                            <div key={article.id} className="news-card overflow-hidden">
                                <div className="flex flex-col lg:flex-row">
                                    <div className="lg:w-80 relative">
                                        <img src={article.image} alt={article.title} className="w-full h-48 lg:h-full object-cover" />
                                        <div className="image-overlay absolute inset-0"></div>
                                        {article.trending && (
                                            <Badge className="trending-badge absolute top-4 right-4 text-white font-bold">
                                                <TrendingUp className="w-3 h-3 mr-1" />
                                                Hot
                                            </Badge>
                                        )}
                                    </div>
                                    <div className="flex-1 p-6">
                                        <div className="flex items-start justify-between mb-3">
                                            <Badge className={categoryColors[article.category]}>
                                                {article.category}
                                            </Badge>
                                            <div className="flex items-center gap-3 text-sm text-slate-500">
                                                <span className="flex items-center gap-1">
                                                    <Eye className="w-3 h-3" />
                                                    {article.views}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Heart className="w-3 h-3" />
                                                    {article.likes}
                                                </span>
                                                <Share2 className="w-4 h-4 cursor-pointer hover:text-blue-400 transition-colors" />
                                            </div>
                                        </div>
                                        <h3 className="text-xl font-bold text-white mb-3 leading-tight">{article.title}</h3>
                                        <p className="text-slate-400 mb-4">{article.excerpt}</p>
                                        <div className="flex items-center justify-between text-sm text-slate-500">
                                            <div className="flex items-center gap-4">
                                                <span className="flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    {article.timestamp}
                                                </span>
                                                <span>{article.readTime}</span>
                                                <span className="text-slate-400">by {article.author}</span>
                                            </div>
                                            <Button variant="ghost" className="text-blue-400 hover:text-blue-300 p-0">
                                                Read More →
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {filteredNews.length === 0 && (
                        <div className="text-center py-12">
                            <Search className="w-16 h-16 mx-auto mb-4 text-slate-600" />
                            <h3 className="text-xl text-slate-500 mb-2">No articles found</h3>
                            <p className="text-slate-600">Try adjusting your search or filter criteria.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
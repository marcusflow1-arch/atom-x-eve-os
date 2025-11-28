import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trophy, Award, Star, Crown, Gem, Zap, Target, Users, Calendar, Filter } from 'lucide-react';

const achievementData = [
    {
        id: 1,
        title: "Neural Network Pioneer",
        description: "First player to complete all AI-enhanced storylines across 5 different game genres.",
        category: "Story Completion",
        rarity: "Legendary",
        points: 2500,
        unlocked: true,
        dateUnlocked: "2024-01-15",
        progress: 100,
        maxProgress: 100,
        icon: "🧠",
        rewards: ["Exclusive Neural Interface Skin", "2500 AGP Bonus", "Pioneer Title"],
        playerCount: "0.1%"
    },
    {
        id: 2,
        title: "AI Whisperer",
        description: "Successfully negotiate with 50 AI companions across different games without using force.",
        category: "Social",
        rarity: "Epic",
        points: 1500,
        unlocked: true,
        dateUnlocked: "2024-01-20",
        progress: 100,
        maxProgress: 100,
        icon: "🤝",
        rewards: ["Diplomatic Badge", "AI Companion Boost", "1500 AGP"],
        playerCount: "2.3%"
    },
    {
        id: 3,
        title: "Quantum Leap Master",
        description: "Achieve perfect synchronization with AI systems in 10 consecutive quantum puzzle challenges.",
        category: "Skill",
        rarity: "Mythic",
        points: 5000,
        unlocked: false,
        dateUnlocked: null,
        progress: 7,
        maxProgress: 10,
        icon: "⚛️",
        rewards: ["Quantum Master Title", "Exclusive Quantum Armor Set", "5000 AGP"],
        playerCount: "0.01%"
    },
    {
        id: 4,
        title: "Data Stream Dancer",
        description: "Complete 25 hacking sequences with 100% accuracy in under 30 seconds each.",
        category: "Speed",
        rarity: "Epic",
        points: 2000,
        unlocked: true,
        dateUnlocked: "2024-01-10",
        progress: 100,
        maxProgress: 100,
        icon: "💃",
        rewards: ["Speed Hacker Badge", "Enhanced Cyberdeck", "2000 AGP"],
        playerCount: "1.8%"
    },
    {
        id: 5,
        title: "Machine Learning Prodigy",
        description: "Train AI companions to achieve 95%+ efficiency rating in 5 different combat scenarios.",
        category: "Training",
        rarity: "Rare",
        points: 1000,
        unlocked: false,
        dateUnlocked: null,
        progress: 3,
        maxProgress: 5,
        icon: "🎓",
        rewards: ["AI Trainer Badge", "Training Manual", "1000 AGP"],
        playerCount: "5.7%"
    },
    {
        id: 6,
        title: "Synthetic Savior",
        description: "Save 100 AI entities from deletion or corruption across all supported games.",
        category: "Heroic",
        rarity: "Legendary",
        points: 3000,
        unlocked: true,
        dateUnlocked: "2024-01-25",
        progress: 100,
        maxProgress: 100,
        icon: "🛡️",
        rewards: ["Savior's Crown", "AI Protection Aura", "3000 AGP"],
        playerCount: "0.5%"
    }
];

const categoryColors = {
    "Story Completion": "bg-gradient-to-r from-blue-500/20 to-blue-600/20 text-blue-300 border-blue-500/30",
    "Social": "bg-gradient-to-r from-green-500/20 to-green-600/20 text-green-300 border-green-500/30",
    "Skill": "bg-gradient-to-r from-purple-500/20 to-purple-600/20 text-purple-300 border-purple-500/30",
    "Speed": "bg-gradient-to-r from-orange-500/20 to-orange-600/20 text-orange-300 border-orange-500/30",
    "Training": "bg-gradient-to-r from-cyan-500/20 to-cyan-600/20 text-cyan-300 border-cyan-500/30",
    "Heroic": "bg-gradient-to-r from-yellow-500/20 to-yellow-600/20 text-yellow-300 border-yellow-500/30"
};

const rarityColors = {
    "Mythic": "from-red-500 to-pink-500",
    "Legendary": "from-orange-500 to-yellow-500",
    "Epic": "from-purple-500 to-indigo-500",
    "Rare": "from-blue-500 to-cyan-500",
    "Uncommon": "from-green-500 to-emerald-500",
    "Common": "from-slate-500 to-gray-500"
};

export default function AIAchievementsPage() {
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [selectedRarity, setSelectedRarity] = useState('all');

    const filteredAchievements = achievementData.filter(achievement => {
        const categoryMatch = selectedCategory === 'all' || achievement.category === selectedCategory;
        const rarityMatch = selectedRarity === 'all' || achievement.rarity === selectedRarity;
        return categoryMatch && rarityMatch;
    });

    const categories = ['all', ...new Set(achievementData.map(a => a.category))];
    const rarities = ['all', ...new Set(achievementData.map(a => a.rarity))];

    const unlockedCount = achievementData.filter(a => a.unlocked).length;
    const totalPoints = achievementData.filter(a => a.unlocked).reduce((sum, a) => sum + a.points, 0);

    return (
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 min-h-screen text-slate-200 font-sans p-6">
            <style>{`
                .achievement-container {
                    background: rgba(15, 23, 42, 0.6);
                    backdrop-filter: blur(20px);
                    border: 1px solid rgba(148, 163, 184, 0.2);
                    border-radius: 16px;
                    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
                    position: relative;
                    overflow: hidden;
                }

                .achievement-container::before {
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

                .achievement-card {
                    background: rgba(30, 41, 59, 0.6);
                    backdrop-filter: blur(10px);
                    border: 1px solid rgba(71, 85, 105, 0.4);
                    border-radius: 12px;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    position: relative;
                    overflow: hidden;
                    cursor: pointer;
                }

                .achievement-card.unlocked {
                    border-color: rgba(34, 197, 94, 0.5);
                    background: rgba(30, 41, 59, 0.8);
                }

                .achievement-card.locked {
                    opacity: 0.7;
                    filter: grayscale(0.3);
                }

                .achievement-card::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: -100%;
                    width: 100%;
                    height: 100%;
                    background: linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.05) 50%, transparent 100%);
                    transition: left 0.8s ease;
                }

                .achievement-card:hover::before {
                    left: 100%;
                }

                .achievement-card:hover {
                    transform: translateY(-4px);
                    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.4);
                }

                .achievement-card.unlocked:hover {
                    border-color: rgba(34, 197, 94, 0.8);
                    box-shadow: 0 12px 40px rgba(34, 197, 94, 0.2);
                }

                .rarity-glow {
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    height: 3px;
                    border-radius: 12px 12px 0 0;
                }

                .progress-bar {
                    background: rgba(15, 23, 42, 0.8);
                    border-radius: 8px;
                    overflow: hidden;
                    border: 1px solid rgba(71, 85, 105, 0.4);
                }

                .progress-fill {
                    height: 8px;
                    background: linear-gradient(90deg, rgba(59, 130, 246, 0.8) 0%, rgba(147, 197, 253, 1) 100%);
                    border-radius: 6px;
                    position: relative;
                    overflow: hidden;
                }

                .progress-fill::after {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: -100%;
                    width: 100%;
                    height: 100%;
                    background: linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.4) 50%, transparent 100%);
                    animation: shimmer 2s ease-in-out infinite;
                }

                @keyframes shimmer {
                    0% { left: -100%; }
                    100% { left: 100%; }
                }

                .stats-panel {
                    background: linear-gradient(135deg, rgba(15, 23, 42, 0.9) 0%, rgba(30, 41, 59, 0.9) 100%);
                    border: 1px solid rgba(59, 130, 246, 0.3);
                    backdrop-filter: blur(20px);
                    border-radius: 16px;
                    position: relative;
                    overflow: hidden;
                }

                .stats-panel::before {
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

                .filter-button {
                    background: rgba(51, 65, 85, 0.6);
                    border: 1px solid rgba(100, 116, 139, 0.4);
                    transition: all 0.3s ease;
                }

                .filter-button:hover {
                    background: rgba(59, 130, 246, 0.2);
                    border-color: rgba(59, 130, 246, 0.5);
                }

                .filter-button.active {
                    background: linear-gradient(135deg, rgba(59, 130, 246, 0.8) 0%, rgba(37, 99, 235, 0.8) 100%);
                    border-color: rgba(59, 130, 246, 0.8);
                    box-shadow: 0 0 15px rgba(59, 130, 246, 0.4);
                }
            `}</style>

            {/* Hero Header */}
            <div className="stats-panel p-8 mb-8 relative z-10">
                <div className="text-center">
                    <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500 mb-4">
                        AI Achievements
                    </h1>
                    <p className="text-xl text-slate-400 mb-6">Unlock legendary rewards through AI-powered gaming challenges</p>
                    
                    {/* Achievement Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div className="text-center">
                            <div className="text-3xl font-bold text-green-400">{unlockedCount}</div>
                            <div className="text-sm text-slate-400">Unlocked</div>
                        </div>
                        <div className="text-center">
                            <div className="text-3xl font-bold text-blue-400">{achievementData.length}</div>
                            <div className="text-sm text-slate-400">Total</div>
                        </div>
                        <div className="text-center">
                            <div className="text-3xl font-bold text-yellow-400">{totalPoints.toLocaleString()}</div>
                            <div className="text-sm text-slate-400">Points Earned</div>
                        </div>
                        <div className="text-center">
                            <div className="text-3xl font-bold text-purple-400">{Math.round((unlockedCount / achievementData.length) * 100)}%</div>
                            <div className="text-sm text-slate-400">Completion</div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto">
                {/* Filters */}
                <div className="achievement-container p-6 mb-8">
                    <div className="flex flex-col lg:flex-row gap-4 items-center">
                        <div className="flex items-center gap-2">
                            <Filter className="w-5 h-5 text-slate-400" />
                            <span className="text-slate-300 font-medium">Filters:</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {categories.map(category => (
                                <Button
                                    key={category}
                                    onClick={() => setSelectedCategory(category)}
                                    className={`filter-button whitespace-nowrap px-4 py-2 rounded-lg text-sm font-medium ${
                                        selectedCategory === category ? 'active' : ''
                                    }`}
                                >
                                    {category === 'all' ? 'All Categories' : category}
                                </Button>
                            ))}
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {rarities.map(rarity => (
                                <Button
                                    key={rarity}
                                    onClick={() => setSelectedRarity(rarity)}
                                    className={`filter-button whitespace-nowrap px-4 py-2 rounded-lg text-sm font-medium ${
                                        selectedRarity === rarity ? 'active' : ''
                                    }`}
                                >
                                    {rarity === 'all' ? 'All Rarities' : rarity}
                                </Button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Achievements Grid */}
                <div className="achievement-container p-6">
                    <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                        <Trophy className="w-6 h-6 text-yellow-400" />
                        Achievement Gallery
                    </h2>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {filteredAchievements.map(achievement => (
                            <div key={achievement.id} className={`achievement-card p-6 ${achievement.unlocked ? 'unlocked' : 'locked'}`}>
                                <div className={`rarity-glow bg-gradient-to-r ${rarityColors[achievement.rarity]}`}></div>
                                
                                <div className="flex items-start gap-4 mb-4">
                                    <div className="text-4xl flex-shrink-0">{achievement.icon}</div>
                                    <div className="flex-1">
                                        <div className="flex items-start justify-between mb-2">
                                            <div>
                                                <h3 className="text-xl font-bold text-white">{achievement.title}</h3>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <Badge className={categoryColors[achievement.category]}>
                                                        {achievement.category}
                                                    </Badge>
                                                    <Badge className={`bg-gradient-to-r ${rarityColors[achievement.rarity]} text-white font-bold`}>
                                                        {achievement.rarity}
                                                    </Badge>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-2xl font-bold text-yellow-400">{achievement.points}</div>
                                                <div className="text-xs text-slate-400">AGP</div>
                                            </div>
                                        </div>
                                        <p className="text-slate-400 text-sm mb-4">{achievement.description}</p>
                                    </div>
                                </div>

                                {/* Progress Bar */}
                                <div className="mb-4">
                                    <div className="flex justify-between text-sm mb-2">
                                        <span className="text-slate-400">Progress</span>
                                        <span className="text-slate-300">{achievement.progress}/{achievement.maxProgress}</span>
                                    </div>
                                    <div className="progress-bar">
                                        <div 
                                            className="progress-fill"
                                            style={{ width: `${(achievement.progress / achievement.maxProgress) * 100}%` }}
                                        ></div>
                                    </div>
                                </div>

                                {/* Rewards */}
                                <div className="mb-4">
                                    <h4 className="text-sm font-bold text-slate-300 mb-2 flex items-center gap-2">
                                        <Gem className="w-4 h-4" />
                                        Rewards
                                    </h4>
                                    <div className="flex flex-wrap gap-1">
                                        {achievement.rewards.map((reward, index) => (
                                            <Badge key={index} variant="outline" className="text-xs border-slate-600 text-slate-400">
                                                {reward}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>

                                {/* Footer */}
                                <div className="flex justify-between items-center text-xs text-slate-500 pt-4 border-t border-slate-700">
                                    <div className="flex items-center gap-4">
                                        <span className="flex items-center gap-1">
                                            <Users className="w-3 h-3" />
                                            {achievement.playerCount} of players
                                        </span>
                                        {achievement.unlocked && (
                                            <span className="flex items-center gap-1">
                                                <Calendar className="w-3 h-3" />
                                                Unlocked {achievement.dateUnlocked}
                                            </span>
                                        )}
                                    </div>
                                    {achievement.unlocked ? (
                                        <Badge className="bg-green-600 text-white">
                                            <Award className="w-3 h-3 mr-1" />
                                            Unlocked
                                        </Badge>
                                    ) : (
                                        <Badge variant="outline" className="border-slate-600 text-slate-400">
                                            <Target className="w-3 h-3 mr-1" />
                                            In Progress
                                        </Badge>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    {filteredAchievements.length === 0 && (
                        <div className="text-center py-12">
                            <Trophy className="w-16 h-16 mx-auto mb-4 text-slate-600" />
                            <h3 className="text-xl text-slate-500 mb-2">No achievements found</h3>
                            <p className="text-slate-600">Try adjusting your filter criteria.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
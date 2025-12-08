import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
    LayoutGrid, ShoppingBag, Trophy, User, Users, Library, 
    MessageSquare, Hammer, Gamepad2, Settings, Home, 
    Lightbulb, Heart, Swords, Crown, GitGraph, Share2, Activity
} from 'lucide-react';
import { createPageUrl } from '@/utils';
import { NAV_GROUPS, ALL_NAV_ITEMS } from '../components/dashboard/NavigationConfig';

const TreeNode = ({ node, depth = 0 }) => {
    const isLeaf = !node.children || node.children.length === 0;
    
    return (
        <div className="flex flex-col items-center relative">
            {/* Connecting Line from Parent */}
            {depth > 0 && (
                <div className="h-8 w-px bg-gradient-to-b from-blue-500/50 to-blue-500 absolute -top-8" />
            )}

            {/* Node Content */}
            <motion.div
                initial={{ opacity: 0, scale: 0.8, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ delay: depth * 0.1 }}
                className="relative z-10"
            >
                {node.path ? (
                    <Link to={node.path}>
                        <div className={`
                            flex items-center gap-3 px-6 py-4 rounded-xl backdrop-blur-xl border transition-all duration-300
                            ${isLeaf 
                                ? 'bg-white/5 border-white/10 hover:bg-blue-500/20 hover:border-blue-400 hover:shadow-[0_0_30px_rgba(59,130,246,0.3)]' 
                                : 'bg-blue-900/20 border-blue-500/30 shadow-[0_0_20px_rgba(59,130,246,0.1)]'
                            }
                        `}>
                            {node.icon && (
                                <div className={`
                                    p-2 rounded-lg 
                                    ${isLeaf ? 'bg-white/5' : 'bg-blue-500/20'}
                                `}>
                                    <node.icon className={`w-5 h-5 ${isLeaf ? 'text-white/70' : 'text-blue-400'}`} />
                                </div>
                            )}
                            <div className="flex flex-col">
                                <span className={`font-bold ${isLeaf ? 'text-white' : 'text-blue-100 uppercase tracking-wider text-sm'}`}>
                                    {node.name}
                                </span>
                                {node.description && (
                                    <span className="text-xs text-white/40 mt-0.5">{node.description}</span>
                                )}
                            </div>
                        </div>
                    </Link>
                ) : (
                    <div className="flex items-center gap-3 px-6 py-4 rounded-xl bg-blue-900/20 border border-blue-500/30 backdrop-blur-xl">
                        {node.icon && (
                            <div className="p-2 rounded-lg bg-blue-500/20">
                                <node.icon className="w-5 h-5 text-blue-400" />
                            </div>
                        )}
                        <span className="font-bold text-blue-100 uppercase tracking-wider text-sm">
                            {node.name}
                        </span>
                    </div>
                )}
            </motion.div>

            {/* Children */}
            {!isLeaf && (
                <div className="flex gap-8 mt-8 relative">
                    {/* Horizontal Connector */}
                    {node.children.length > 1 && (
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[calc(100%-4rem)] h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />
                    )}
                    
                    {node.children.map((child, index) => (
                        <div key={index} className="flex flex-col items-center relative pt-8">
                            {/* Vertical Connector to Child */}
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 h-8 w-px bg-gradient-to-b from-blue-500/50 to-blue-500" />
                            <TreeNode node={child} depth={depth + 1} />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default function NavigationTree() {
    // Construct Tree Data
    const treeData = {
        name: 'App Root',
        icon: GitGraph,
        children: [
            {
                name: 'Home',
                icon: Home,
                children: [
                    { name: 'Luna Dashboard', path: createPageUrl('LunaTemplate'), icon: Activity, description: 'Main Hub' },
                    { name: 'News & Updates', path: createPageUrl('AINews'), icon: Home, description: 'Latest Info' }
                ]
            },
            {
                name: 'Gaming',
                icon: Gamepad2,
                children: [
                    { name: 'Library', path: createPageUrl('Library'), icon: Library, description: 'My Games' },
                    { name: 'Store', path: createPageUrl('Store'), icon: ShoppingBag, description: 'Purchase Games' },
                    { name: 'Achievements', path: createPageUrl('Achievements'), icon: Trophy, description: 'Track Progress' },
                    { name: 'Blacksmith', path: createPageUrl('Blacksmith'), icon: Hammer, description: 'Crafting' },
                    { name: 'Seasonal Pass', path: createPageUrl('SeasonalPass'), icon: Crown, description: 'Rewards' }
                ]
            },
            {
                name: 'Community',
                icon: Users,
                children: [
                    { name: 'Forums', path: createPageUrl('Community'), icon: MessageSquare, description: 'Discussions' },
                    { name: 'Clans', path: createPageUrl('Clan'), icon: Users, description: 'Guild Management' },
                    { name: 'Challenges', path: createPageUrl('Challenges'), icon: Swords, description: 'PvP & PvE' }
                ]
            },
            {
                name: 'Profile',
                icon: User,
                children: [
                    { name: 'Ideals', path: createPageUrl('Ideals'), icon: Lightbulb, description: 'Character Trait' },
                    { name: 'Support', path: createPageUrl('AdamXEve'), icon: Heart, description: 'Help Center' },
                    { name: 'Admin', path: createPageUrl('Admin'), icon: Settings, description: 'System Settings' }
                ]
            }
        ]
    };

    return (
        <div className="min-h-screen bg-slate-950 text-white overflow-x-auto overflow-y-auto p-20">
            {/* Background Effects */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-blue-500/5 rounded-full blur-[120px]" />
                <div className="absolute bottom-0 right-0 w-[800px] h-[600px] bg-purple-500/5 rounded-full blur-[120px]" />
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />
            </div>

            <div className="relative z-10 min-w-[1200px] flex flex-col items-center">
                <div className="text-center mb-16">
                    <h1 className="text-4xl font-black tracking-tight mb-4 bg-clip-text text-transparent bg-gradient-to-r from-white via-blue-200 to-white">
                        Navigation Architecture
                    </h1>
                    <p className="text-white/40">Interactive sitemap of the application structure</p>
                </div>

                <TreeNode node={treeData} />
            </div>
        </div>
    );
}
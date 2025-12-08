import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { 
    LayoutGrid, ShoppingBag, Trophy, User, Gavel, Users, Bot, Library, 
    Download, Mail, Bell, MessageSquare, LogIn, LogOut, Heart, Hammer, 
    Clapperboard, ArrowLeftRight, Radio, Gamepad2, Settings, Home, 
    Lightbulb, Rocket, Swords, Layers, Crown, Target, Star, Globe, Shield, Sparkles
} from 'lucide-react';
import { NAV_GROUPS } from '@/components/dashboard/NavigationConfig';

export default function CrossInterface() {
    const navigate = useNavigate();
    const [activeCategoryIndex, setActiveCategoryIndex] = useState(0);
    const [activeItemIndex, setActiveItemIndex] = useState(0);
    const [isNavigating, setIsNavigating] = useState(false);

    // Convert NAV_GROUPS object to array for the vertical axis
    const categories = React.useMemo(() => {
        return Object.entries(NAV_GROUPS).map(([key, group], index) => ({
            id: key,
            label: key,
            icon: group.icon,
            items: group.items || (group.isLink ? [{ name: 'Go to ' + key, path: group.path, icon: group.icon }] : []),
            color: index % 2 === 0 ? 'text-blue-400' : 'text-purple-400'
        }));
    }, []);

    // Handle Keyboard Navigation
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (isNavigating) return;

            switch (e.key) {
                case 'ArrowUp':
                    e.preventDefault();
                    if (activeCategoryIndex > 0) {
                        setActiveCategoryIndex(prev => prev - 1);
                        setActiveItemIndex(0); // Reset item index when changing category
                    }
                    break;
                case 'ArrowDown':
                    e.preventDefault();
                    if (activeCategoryIndex < categories.length - 1) {
                        setActiveCategoryIndex(prev => prev + 1);
                        setActiveItemIndex(0);
                    }
                    break;
                case 'ArrowLeft':
                    e.preventDefault();
                    if (activeItemIndex > 0) {
                        setActiveItemIndex(prev => prev - 1);
                    }
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    if (activeItemIndex < categories[activeCategoryIndex].items.length - 1) {
                        setActiveItemIndex(prev => prev + 1);
                    }
                    break;
                case 'Enter':
                    e.preventDefault();
                    const item = categories[activeCategoryIndex].items[activeItemIndex];
                    if (item && item.path) {
                        setIsNavigating(true);
                        // Add a small delay for visual feedback
                        setTimeout(() => {
                            navigate(item.path);
                            setIsNavigating(false);
                        }, 300);
                    }
                    break;
                default:
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [activeCategoryIndex, activeItemIndex, categories, navigate, isNavigating]);

    // Calculate vertical offset to center the active category
    // Each item is h-20 (80px) + gap-4 (16px) = 96px
    // Center of screen is 50vh
    // We want the center of the active item to be at a specific Y position
    // Let's say the "Cross" intersection is at top: 40% of screen.
    const ITEM_HEIGHT = 96; // 80px + 16px gap
    const CROSS_Y_PERCENT = 40; // 40% down the screen

    return (
        <div 
            className="h-screen w-full relative overflow-hidden bg-slate-900 text-white select-none"
            style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)' }}
        >
            {/* Ambient Background Effects */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-[120px]" />
                <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-purple-500/5 rounded-full blur-[120px]" />
                
                {/* Horizontal Cross Line (Subtle) */}
                <div className="absolute top-[40%] left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                {/* Vertical Cross Line (Subtle) */}
                <div className="absolute top-0 bottom-0 left-32 w-px bg-gradient-to-b from-transparent via-white/10 to-transparent" />
            </div>

            {/* Main Container */}
            <div className="relative w-full h-full">
                
                {/* VERTICAL AXIS (Categories) */}
                <div className="absolute top-0 bottom-0 left-16 w-32 flex flex-col items-center z-20 pointer-events-none">
                    <motion.div 
                        className="flex flex-col items-center gap-4 py-8 pointer-events-auto"
                        animate={{ 
                            y: `calc(${CROSS_Y_PERCENT}vh - ${activeCategoryIndex * ITEM_HEIGHT}px - 40px)` // 40px is half item height
                        }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    >
                        {categories.map((cat, idx) => {
                            const isActive = idx === activeCategoryIndex;
                            const Icon = cat.icon;
                            return (
                                <motion.div
                                    key={cat.id}
                                    onClick={() => {
                                        setActiveCategoryIndex(idx);
                                        setActiveItemIndex(0);
                                    }}
                                    animate={{ 
                                        scale: isActive ? 1.2 : 0.9,
                                        opacity: isActive ? 1 : 0.4,
                                        x: isActive ? 0 : -10
                                    }}
                                    className={`
                                        w-20 h-20 flex-shrink-0 rounded-2xl flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors
                                        ${isActive ? 'bg-white/10 shadow-[0_0_30px_rgba(255,255,255,0.15)] border border-white/20' : 'hover:bg-white/5 border border-transparent'}
                                    `}
                                >
                                    <Icon className={`w-8 h-8 ${isActive ? 'text-white' : 'text-white/60'}`} />
                                    {isActive && (
                                        <motion.span 
                                            initial={{ opacity: 0 }} 
                                            animate={{ opacity: 1 }} 
                                            className="text-[10px] uppercase font-bold tracking-widest"
                                        >
                                            {cat.label}
                                        </motion.span>
                                    )}
                                </motion.div>
                            );
                        })}
                    </motion.div>
                </div>

                {/* HORIZONTAL AXIS (Items) */}
                <div className="absolute left-0 right-0 top-[40%] -translate-y-1/2 h-40 z-10 flex items-center pointer-events-none">
                    <motion.div 
                        className="flex items-center gap-6 pl-48 pointer-events-auto" // pl-48 to start after vertical column
                        animate={{ 
                            x: -activeItemIndex * (220 + 24) // Item width 220 + gap 24
                        }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    >
                        {categories[activeCategoryIndex].items.map((item, idx) => {
                            const isActive = idx === activeItemIndex;
                            const ItemIcon = item.icon || Star;
                            
                            return (
                                <motion.div
                                    key={item.name + idx}
                                    onClick={() => {
                                        setActiveItemIndex(idx);
                                        // Optional: Navigate on click if already active? 
                                        // Or just select it. Let's make double click or explicit click navigate.
                                        if (isActive) navigate(item.path);
                                    }}
                                    animate={{ 
                                        scale: isActive ? 1.1 : 0.95,
                                        opacity: isActive ? 1 : 0.3,
                                        y: isActive ? 0 : 10
                                    }}
                                    className={`
                                        w-[220px] h-[140px] flex-shrink-0 rounded-xl relative overflow-hidden cursor-pointer group
                                        border transition-all duration-300
                                        ${isActive 
                                            ? 'bg-gradient-to-br from-white/10 to-white/5 border-white/30 shadow-2xl' 
                                            : 'bg-white/5 border-white/5 hover:bg-white/10'
                                        }
                                    `}
                                >
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent z-10" />
                                    
                                    {/* Mock Image Placeholder if needed, or just abstract pattern */}
                                    <div className="absolute inset-0 opacity-20">
                                        <div className="w-full h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-400 via-purple-900 to-black" />
                                    </div>

                                    <div className="absolute bottom-0 left-0 right-0 p-4 z-20">
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className={`p-1.5 rounded-lg ${isActive ? 'bg-white/20' : 'bg-white/5'}`}>
                                                <ItemIcon className="w-4 h-4 text-white" />
                                            </div>
                                            <span className="text-xs font-bold uppercase tracking-wider text-white/50">
                                                {categories[activeCategoryIndex].label}
                                            </span>
                                        </div>
                                        <h3 className={`font-bold text-lg leading-tight ${isActive ? 'text-white' : 'text-white/70'}`}>
                                            {item.name}
                                        </h3>
                                    </div>

                                    {/* Active Pulse Border */}
                                    {isActive && (
                                        <motion.div 
                                            layoutId="active-glow"
                                            className="absolute inset-0 border-2 border-white/40 rounded-xl z-30"
                                            transition={{ duration: 0.2 }}
                                        />
                                    )}
                                </motion.div>
                            );
                        })}
                        
                        {/* Empty State / Coming Soon */}
                        {categories[activeCategoryIndex].items.length === 0 && (
                            <div className="w-[220px] h-[140px] flex items-center justify-center text-white/20 italic">
                                No items available
                            </div>
                        )}
                    </motion.div>
                </div>

                {/* Selection Highlight (The Crosshair) */}
                <div className="absolute left-16 top-[40%] -translate-y-1/2 -translate-x-1/2 w-[600px] h-32 pointer-events-none z-0">
                    <div className="w-full h-full bg-blue-500/10 blur-3xl rounded-full opacity-50" />
                </div>
                
                {/* Instructions */}
                <div className="absolute bottom-12 right-12 flex gap-6 text-white/40 text-xs font-mono uppercase tracking-widest z-30">
                    <div className="flex items-center gap-2">
                        <div className="px-2 py-1 bg-white/10 rounded border border-white/10">↑ ↓</div>
                        <span>Category</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="px-2 py-1 bg-white/10 rounded border border-white/10">← →</div>
                        <span>Select</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="px-2 py-1 bg-white/10 rounded border border-white/10">Enter</div>
                        <span>Open</span>
                    </div>
                </div>

            </div>
        </div>
    );
}
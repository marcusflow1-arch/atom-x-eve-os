import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
    LayoutGrid, ShoppingBag, Trophy, User, Gavel, Users, Bot, Library, 
    Download, Mail, Bell, MessageSquare, LogIn, LogOut, Heart, Hammer, 
    Clapperboard, ArrowLeftRight, Radio, Gamepad2, Settings, Home, 
    Lightbulb, Rocket, Swords, Layers, Crown, Target, Star, Monitor, Zap, Disc, Shield
} from 'lucide-react';
import { createPageUrl } from '@/utils';

// Mock Data Structure for the Cross Menu
const MENU_DATA = [
    {
        id: 'settings',
        label: 'Settings',
        icon: Settings,
        items: [
            { id: 'system', label: 'System Settings', icon: Monitor },
            { id: 'account', label: 'Account Management', icon: User },
            { id: 'network', label: 'Network', icon: Radio },
            { id: 'admin', label: 'Admin Panel', icon: Gavel, path: createPageUrl('Admin') },
        ]
    },
    {
        id: 'games',
        label: 'Games',
        icon: Gamepad2,
        items: [
            { id: 'library', label: 'Game Library', icon: Library, path: createPageUrl('Library'), image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800' },
            { id: 'store', label: 'Store', icon: ShoppingBag, path: createPageUrl('Store'), image: 'https://images.unsplash.com/photo-1555680202-c86f0e12f086?w=800' },
            { id: 'achievements', label: 'Trophies', icon: Trophy, path: createPageUrl('Achievements') },
            { id: 'blacksmith', label: 'Blacksmith', icon: Hammer, path: createPageUrl('Blacksmith') },
        ]
    },
    {
        id: 'media',
        label: 'Media',
        icon: Clapperboard,
        items: [
            { id: 'news', label: 'AI News', icon: Radio, path: createPageUrl('AINews') },
            { id: 'videos', label: 'Video Gallery', icon: Disc },
            { id: 'screenshots', label: 'Captures', icon: LayoutGrid },
        ]
    },
    {
        id: 'community',
        label: 'Community',
        icon: Users,
        items: [
            { id: 'friends', label: 'Friends', icon: User },
            { id: 'clan', label: 'Clans', icon: Shield, path: createPageUrl('Clan') },
            { id: 'forums', label: 'Forums', icon: MessageSquare, path: createPageUrl('Community') },
            { id: 'messages', label: 'Messages', icon: Mail },
        ]
    },
    {
        id: 'profile',
        label: 'Profile',
        icon: User,
        items: [
            { id: 'my_profile', label: 'My Profile', icon: User, path: createPageUrl('PlayerProfile') },
            { id: 'ideals', label: 'Ideals', icon: Lightbulb, path: createPageUrl('Ideals') },
            { id: 'inventory', label: 'Inventory', icon: Layers },
            { id: 'pass', label: 'Seasonal Pass', icon: Crown, path: createPageUrl('SeasonalPass') },
        ]
    }
];

export default function CrossMenu() {
    const navigate = useNavigate();
    const [activeCol, setActiveCol] = useState(1); // Start at 'Games' (index 1)
    const [activeRow, setActiveRow] = useState(0); // Vertical index
    const [isNavigating, setIsNavigating] = useState(false);

    // Keyboard Navigation
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (isNavigating) return;

            switch (e.key) {
                case 'ArrowLeft':
                    e.preventDefault();
                    if (activeCol > 0) {
                        setActiveCol(prev => prev - 1);
                        setActiveRow(0); // Reset vertical position when changing category
                    }
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    if (activeCol < MENU_DATA.length - 1) {
                        setActiveCol(prev => prev + 1);
                        setActiveRow(0);
                    }
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    if (activeRow > 0) {
                        setActiveRow(prev => prev - 1);
                    }
                    break;
                case 'ArrowDown':
                    e.preventDefault();
                    if (activeRow < MENU_DATA[activeCol].items.length - 1) {
                        setActiveRow(prev => prev + 1);
                    }
                    break;
                case 'Enter':
                    e.preventDefault();
                    const item = MENU_DATA[activeCol].items[activeRow];
                    if (item && item.path) {
                        setIsNavigating(true);
                        setTimeout(() => {
                            navigate(item.path);
                            setIsNavigating(false);
                        }, 300);
                    }
                    break;
                case 'Escape':
                    // Optional: Navigate back or reset
                    break;
                default:
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [activeCol, activeRow, isNavigating, navigate]);

    // Active Item for Background
    const currentCategory = MENU_DATA[activeCol];
    const currentItem = currentCategory.items[activeRow];

    return (
        <div className="h-screen w-full relative overflow-hidden bg-slate-950 text-white font-sans select-none">
            {/* Dynamic Background */}
            <AnimatePresence mode="wait">
                <motion.div 
                    key={currentCategory.id + (currentItem?.id || 'root')}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5 }}
                    className="absolute inset-0 z-0"
                >
                    {/* Gradient Base */}
                    <div className="absolute inset-0 bg-gradient-to-br from-slate-900 to-black" />
                    
                    {/* Background Image if available */}
                    {currentItem?.image && (
                        <div className="absolute inset-0">
                            <img 
                                src={currentItem.image} 
                                alt="bg" 
                                className="w-full h-full object-cover opacity-30 blur-sm scale-105" 
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/50 to-transparent" />
                        </div>
                    )}
                    
                    {/* Ambient Glows */}
                    <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-blue-500/10 rounded-full blur-[150px]" />
                    <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-purple-500/10 rounded-full blur-[150px]" />
                    
                    {/* Wave Effect */}
                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay"></div>
                </motion.div>
            </AnimatePresence>

            {/* Content Container */}
            <div className="relative z-10 w-full h-full flex flex-col justify-center">
                
                {/* HORIZONTAL AXIS (Categories) */}
                {/* Positioned somewhat near top-middle */}
                <div className="absolute top-[20%] left-0 w-full h-32 flex items-center">
                    <motion.div 
                        className="flex items-center px-[10%]"
                        animate={{ x: -activeCol * 140 }} // Shift logic: Center is approx 10% + active width
                        transition={{ type: "spring", stiffness: 250, damping: 25 }}
                        style={{ marginLeft: '10vw' }} // Initial offset to position first item
                    >
                        {MENU_DATA.map((category, index) => {
                            const isActive = index === activeCol;
                            const Icon = category.icon;
                            
                            return (
                                <motion.div
                                    key={category.id}
                                    onClick={() => {
                                        setActiveCol(index);
                                        setActiveRow(0);
                                    }}
                                    className="flex flex-col items-center justify-center w-32 flex-shrink-0 cursor-pointer relative"
                                    animate={{ 
                                        scale: isActive ? 1.2 : 0.9,
                                        opacity: isActive ? 1 : 0.5,
                                        y: isActive ? 0 : 20
                                    }}
                                >
                                    <div className={`
                                        p-4 rounded-2xl mb-2 transition-colors duration-300
                                        ${isActive ? 'bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.3)]' : 'bg-transparent text-white'}
                                    `}>
                                        <Icon className="w-8 h-8" />
                                    </div>
                                    <span className={`text-xs font-bold uppercase tracking-widest ${isActive ? 'text-white' : 'text-transparent'}`}>
                                        {category.label}
                                    </span>
                                    
                                    {/* Active Indicator Dot */}
                                    {isActive && (
                                        <motion.div 
                                            layoutId="active-dot"
                                            className="absolute -bottom-4 w-1.5 h-1.5 rounded-full bg-blue-400" 
                                        />
                                    )}
                                </motion.div>
                            );
                        })}
                    </motion.div>
                </div>

                {/* VERTICAL AXIS (Items) */}
                {/* Aligned with the active category column */}
                <div className="absolute top-[35%] left-[calc(10vw+4rem)] w-96 bottom-0"> {/* Matches the left offset of horizontal active item */}
                    <motion.div
                        className="flex flex-col gap-4 py-4"
                        animate={{ y: -activeRow * 90 }} // 90px = item height + gap
                        transition={{ type: "spring", stiffness: 250, damping: 25 }}
                    >
                        {currentCategory.items.map((item, index) => {
                            const isActive = index === activeRow;
                            const ItemIcon = item.icon || Star;

                            return (
                                <motion.div
                                    key={item.id}
                                    onClick={() => {
                                        setActiveRow(index);
                                        if (isActive && item.path) navigate(item.path);
                                    }}
                                    className={`
                                        h-20 w-full flex items-center gap-4 px-6 rounded-xl cursor-pointer transition-all duration-300
                                        ${isActive 
                                            ? 'bg-white/10 backdrop-blur-md border border-white/20 shadow-xl' 
                                            : 'hover:bg-white/5 border border-transparent opacity-60'
                                        }
                                    `}
                                    animate={{
                                        scale: isActive ? 1 : 0.95,
                                        x: isActive ? 20 : 0
                                    }}
                                >
                                    {/* Item Icon */}
                                    <div className={`
                                        w-10 h-10 rounded-full flex items-center justify-center
                                        ${isActive ? 'bg-blue-500 text-white' : 'bg-white/10 text-white/50'}
                                    `}>
                                        <ItemIcon className="w-5 h-5" />
                                    </div>

                                    {/* Item Label */}
                                    <div className="flex-1">
                                        <h3 className={`font-semibold text-lg ${isActive ? 'text-white' : 'text-white/70'}`}>
                                            {item.label}
                                        </h3>
                                        {isActive && (
                                            <motion.p 
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                className="text-xs text-blue-300 font-mono"
                                            >
                                                {item.path ? 'Press Enter to Open' : 'Action Available'}
                                            </motion.p>
                                        )}
                                    </div>
                                    
                                    {/* Arrow Hint */}
                                    {isActive && (
                                        <motion.div
                                            initial={{ x: -5, opacity: 0 }}
                                            animate={{ x: 0, opacity: 1 }}
                                            className="text-white/50"
                                        >
                                            <ArrowLeftRight className="w-4 h-4" />
                                        </motion.div>
                                    )}
                                </motion.div>
                            );
                        })}
                    </motion.div>
                </div>
            </div>

            {/* Info / Metadata Corner */}
            <div className="absolute top-12 right-12 text-right">
                <div className="text-4xl font-light text-white/80 mb-1">
                    {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
                <div className="text-sm font-bold text-white/40 uppercase tracking-widest">
                    {new Date().toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}
                </div>
            </div>
            
            {/* Nav Hints */}
            <div className="absolute bottom-12 right-12 flex gap-6 text-white/40 text-xs font-mono uppercase tracking-widest z-30">
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full border border-white/20 flex items-center justify-center">
                        <ArrowLeftRight className="w-3 h-3" />
                    </div>
                    <span>Category</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full border border-white/20 flex items-center justify-center">
                        <ArrowLeftRight className="w-3 h-3 rotate-90" />
                    </div>
                    <span>Browse</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="px-2 py-1 bg-white/10 rounded border border-white/10">Enter</div>
                    <span>Select</span>
                </div>
            </div>
        </div>
    );
}
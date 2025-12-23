import { 
    LayoutGrid, ShoppingBag, Trophy, User, Gavel, Users, Bot, Library, 
    Download, Mail, Bell, MessageSquare, LogIn, LogOut, Heart, Hammer, 
    Clapperboard, ArrowLeftRight, Radio, Gamepad2, Settings, Home, 
    Lightbulb, Rocket, Swords, Layers, Crown, Target, Plus, Globe, TrendingUp
} from 'lucide-react';
import { createPageUrl } from '@/utils';

// Hierarchical navigation structure with main pages and sub-pages
export const NAV_HIERARCHY = [
    {
        name: 'Luna Dashboard',
        icon: Home,
        path: createPageUrl('LunaTemplate'),
        subPages: [
            { name: 'Blacksmith', icon: Hammer, path: createPageUrl('LunaTemplate') + '?panel=blacksmith' },
            { name: 'Season Pass', icon: Crown, path: createPageUrl('LunaTemplate') + '?panel=seasonpass' },
            { name: 'Entertainment', icon: Clapperboard, path: createPageUrl('LunaTemplate') + '?panel=entertainment' },
            { name: 'Clan', icon: Users, path: createPageUrl('LunaTemplate') + '?panel=clan' },
            { name: 'Forum', icon: MessageSquare, path: createPageUrl('LunaTemplate') + '?panel=forum' },
        ]
    },
    {
        name: 'Store',
        icon: ShoppingBag,
        path: createPageUrl('Store'),
        subPages: [
            { name: 'Library', icon: Library, path: createPageUrl('Store') + '?subview=library' },
            { name: 'Achievements', icon: Trophy, path: createPageUrl('Store') + '?subview=achievements' },
        ]
    },
];

// Flat list for backward compatibility
export const ALL_NAV_ITEMS = [
    { name: 'Luna Dashboard', icon: Home, path: createPageUrl('LunaTemplate') },
    { name: 'Store', icon: ShoppingBag, path: createPageUrl('Store') },
];

export const NAV_GROUPS = {
    'Home': {
        isLink: true,
        path: createPageUrl('LunaTemplate'),
        icon: Home,
    },
    'Games': {
        icon: Gamepad2,
        items: [
            { name: 'Store', icon: ShoppingBag, path: createPageUrl('Store') },
        ],
    },
};
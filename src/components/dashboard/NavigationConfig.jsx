import { 
    LayoutGrid, ShoppingBag, Trophy, User, Gavel, Users, Bot, Library, 
    Download, Mail, Bell, MessageSquare, LogIn, LogOut, Heart, Hammer, 
    Clapperboard, ArrowLeftRight, Radio, Gamepad2, Settings, Home, 
    Lightbulb, Rocket, Swords, Layers, Crown, Target, Plus, Globe, TrendingUp, Calendar, Award, Cpu
} from 'lucide-react';
import { createPageUrl } from '@/utils';

// Hierarchical navigation structure with main pages and sub-pages
export const NAV_HIERARCHY = [
    {
        name: 'Luna Dashboard',
        icon: Home,
        path: createPageUrl('LunaTemplate'),
        subPages: [
            { name: 'Forum', icon: MessageSquare, path: createPageUrl('Community') },
            { name: 'Plan', icon: Calendar, path: createPageUrl('Plan') },
        ]
    },
    {
        name: 'Store',
        icon: ShoppingBag,
        path: createPageUrl('Store'),
        subPages: [
            { name: 'Trading Post', icon: ArrowLeftRight, path: createPageUrl('Store') + '?mode=trading' },
            { name: 'Dev Post', icon: Hammer, path: createPageUrl('Store') + '?mode=devcards' },
        ]
    },
    {
        name: 'Cards',
        icon: Trophy,
        path: createPageUrl('GenreMastery'),
        subPages: [
            { name: 'Achievements', icon: Award, path: createPageUrl('Achievements') },
            { name: 'Card Collection', icon: Layers, path: createPageUrl('CardCollection') },
        ]
    },
    {
        name: 'Aura',
        icon: Radio,
        path: createPageUrl('Aura'),
        subPages: [
            { name: 'Home Dashboard', icon: Home, path: createPageUrl('StreamingHome') },
            { name: 'Discovery', icon: Globe, path: createPageUrl('Discover') },
            { name: 'Aura', icon: Radio, path: createPageUrl('Aura') },
        ]
    },
    {
        name: 'Engine',
        icon: Cpu,
        path: createPageUrl('Engine'),
        subPages: []
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
import { 
    LayoutGrid, ShoppingBag, Trophy, User, Gavel, Users, Bot, Library, 
    Download, Mail, Bell, MessageSquare, LogIn, LogOut, Heart, Hammer, 
    Clapperboard, ArrowLeftRight, Radio, Gamepad2, Settings, Home, 
    Lightbulb, Rocket, Swords, Layers, Crown, Target, Plus, Globe, TrendingUp, Cpu
} from 'lucide-react';
import { createPageUrl } from '@/utils';

// Hierarchical navigation structure with main pages and sub-pages
export const NAV_HIERARCHY = [
    {
        name: 'Welcome',
        icon: Globe,
        path: createPageUrl('OnboardingHome'),
        subPages: []
    },
    {
        name: 'Luna Dashboard',
        icon: Home,
        path: createPageUrl('LunaTemplate'),
        subPages: [
            { name: 'Clan', icon: Users, path: createPageUrl('Clan') },
            { name: 'Forum', icon: MessageSquare, path: createPageUrl('Community') },
        ]
    },
    {
        name: 'Store',
        icon: ShoppingBag,
        path: createPageUrl('Store'),
        subPages: [
            { name: 'Achievements', icon: Trophy, path: createPageUrl('Achievements') },
        ]
    },
    {
        name: 'Aura',
        icon: Radio,
        path: createPageUrl('Aura'),
        subPages: []
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
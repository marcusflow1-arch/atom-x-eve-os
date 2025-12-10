
import { 
    LayoutGrid, ShoppingBag, Trophy, User, Gavel, Users, Bot, Library, 
    Download, Mail, Bell, MessageSquare, LogIn, LogOut, Heart, Hammer, 
    Clapperboard, ArrowLeftRight, Radio, Gamepad2, Settings, Home, 
    Lightbulb, Rocket, Swords, Layers, Crown, Target, Plus, Globe
} from 'lucide-react';
import { createPageUrl } from '@/utils';

export const ALL_NAV_ITEMS = [
    { name: 'Luna Dashboard', icon: Home, path: createPageUrl('LunaTemplate') },
    { name: 'Store', icon: ShoppingBag, path: createPageUrl('Store') },
    { name: 'Library', icon: Library, path: createPageUrl('Library') },
    { name: 'Achievements', icon: Trophy, path: createPageUrl('Achievements') },
    { name: 'Seasonal Pass', icon: Crown, path: createPageUrl('SeasonalPass') },
    { name: 'Blacksmith', icon: Hammer, path: createPageUrl('Blacksmith') },
    { name: 'Clans', icon: Users, path: createPageUrl('Clan') },
    { name: 'Forums', icon: MessageSquare, path: createPageUrl('Community') },
    { name: 'World Events', icon: Globe, path: createPageUrl('WorldEvents') },
    { name: 'Support', icon: Heart, path: createPageUrl('AdamXEve') },
];

export const NAV_GROUPS = {
    'Home': {
        isLink: true,
        path: createPageUrl('LunaTemplate'), // Updated to Luna Dashboard
        icon: Home,
    },
    'Games': {
        icon: Gamepad2,
        items: [
            { name: 'Store', icon: ShoppingBag, path: createPageUrl('Store') },
            { name: 'Library', icon: Library, path: createPageUrl('Library') },
            { name: 'Achievements', icon: Trophy, path: createPageUrl('Achievements') },
            { name: 'Blacksmith', icon: Hammer, path: createPageUrl('Blacksmith') },
        ],
    },
    'Community': {
        icon: Users,
        items: [
            { name: 'Forums', icon: MessageSquare, path: createPageUrl('Community') },
        ],
    },
    'Profile': {
        icon: User,
        items: [
            { name: 'Support', icon: Heart, path: createPageUrl('AdamXEve') },
        ],
    },
};

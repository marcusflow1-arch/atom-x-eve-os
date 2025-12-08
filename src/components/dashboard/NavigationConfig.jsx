import { 
    LayoutGrid, ShoppingBag, Trophy, User, Gavel, Users, Bot, Library, 
    Download, Mail, Bell, MessageSquare, LogIn, LogOut, Heart, Hammer, 
    Clapperboard, ArrowLeftRight, Radio, Gamepad2, Settings, Home, 
    Lightbulb, Rocket, Swords, Layers, Crown, Target
} from 'lucide-react';
import { createPageUrl } from '@/utils';

export const ALL_NAV_ITEMS = [
    { name: 'Luna Dashboard', icon: Home, path: createPageUrl('LunaTemplate') },
    { name: 'Store', icon: ShoppingBag, path: createPageUrl('Store') },
    { name: 'Library', icon: Library, path: createPageUrl('Library') },
    { name: 'Achievements', icon: Trophy, path: createPageUrl('Achievements') },
    { name: 'Skill Tree', icon: Layers, path: createPageUrl('GenreMastery') },
    { name: 'Seasonal Pass', icon: Crown, path: createPageUrl('SeasonalPass') },
    { name: 'Blacksmith', icon: Hammer, path: createPageUrl('Blacksmith') },
    { name: 'Events', icon: Trophy, path: createPageUrl('Events') },
    { name: 'Forums', icon: MessageSquare, path: createPageUrl('Community') },
    { name: 'Clans', icon: Users, path: createPageUrl('Clan') },
    { name: 'Game Dev Hub', icon: Rocket, path: createPageUrl('GameDevHub') },
    { name: 'Challenges', icon: Swords, path: createPageUrl('Challenges') },
    { name: 'AI Console', icon: Bot, path: createPageUrl('AIConsole') },
    { name: 'Marketplace', icon: Gavel, path: createPageUrl('Marketplace') },
    { name: 'Ideals', icon: Lightbulb, path: createPageUrl('Ideals') },
    { name: 'Support', icon: Heart, path: createPageUrl('AdamXEve') },
    { name: 'Admin', icon: Settings, path: createPageUrl('Admin') },
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
            { name: 'Skill Tree', icon: Layers, path: createPageUrl('GenreMastery') },
            { name: 'Blacksmith', icon: Hammer, path: createPageUrl('Blacksmith') },
            { name: 'Events', icon: Trophy, path: createPageUrl('Events') },
        ],
    },
    'Community': {
        icon: Users,
        items: [
            { name: 'Forums', icon: MessageSquare, path: createPageUrl('Community') },
            { name: 'Clans', icon: Users, path: createPageUrl('Clan') },
            { name: 'Game Dev Hub', icon: Rocket, path: createPageUrl('GameDevHub') },
            { name: 'Challenges', icon: Swords, path: createPageUrl('Challenges') },
        ],
    },
    'AI & Tools': {
        icon: Bot,
        items: [
            { name: 'AI Console', icon: Bot, path: createPageUrl('AIConsole') },
            { name: 'Marketplace', icon: Gavel, path: createPageUrl('Marketplace') },
        ],
    },
    'Profile': {
        icon: User,
        items: [
            { name: 'Ideals', icon: Lightbulb, path: createPageUrl('Ideals') },
            { name: 'Support', icon: Heart, path: createPageUrl('AdamXEve') },
        ],
    },
};
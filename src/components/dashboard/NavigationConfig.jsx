import { 
    LayoutGrid, ShoppingBag, Trophy, User, Gavel, Users, Bot, Library, 
    Download, Mail, Bell, MessageSquare, LogIn, LogOut, Heart, Hammer, 
    Clapperboard, ArrowLeftRight, Radio, Gamepad2, Settings, Home, 
    Lightbulb, Rocket, Swords, Layers, Crown, Target, Plus, Globe, TrendingUp, Calendar, Award, Cpu
} from 'lucide-react';
import { createPageUrl } from '@/utils';

const storeUrl = createPageUrl('Store');

// Single source of truth for application navigation. Store contextual views
// resolve through the same routes on desktop, mobile, and dashboard menus.
export const NAV_HIERARCHY = [
    {
        name: 'Luna Dashboard', icon: Home, path: createPageUrl('LunaTemplate'),
        subPages: [
            { name: 'Forum', icon: MessageSquare, path: createPageUrl('Community') },
            { name: 'Plan', icon: Calendar, path: createPageUrl('Plan') },
        ]
    },
    {
        name: 'Store', icon: ShoppingBag, path: storeUrl,
        subPages: [
            { name: 'Games', icon: Gamepad2, path: `${storeUrl}?mode=store&subview=games` },
            { name: 'Trading Post', icon: ArrowLeftRight, path: `${storeUrl}?mode=trading` },
            { name: 'Dev Cards', icon: Hammer, path: `${storeUrl}?mode=devcards` },
            { name: 'Marketplace', icon: ShoppingBag, path: `${storeUrl}?mode=marketplace` },
        ]
    },
    {
        name: 'Cards', icon: Trophy, path: createPageUrl('GenreMastery'),
        subPages: [
            { name: 'Achievements', icon: Award, path: `${createPageUrl('GenreMastery')}?mode=achievements` },
            { name: 'Skill Tree', icon: Layers, path: `${createPageUrl('GenreMastery')}?mode=skilltree` },
        ]
    },
    {
        name: 'Aura', icon: Radio, path: createPageUrl('Aura'),
        subPages: [
            { name: 'Home Dashboard', icon: Home, path: createPageUrl('StreamingHome') },
            { name: 'Discovery', icon: Globe, path: createPageUrl('Discover') },
            { name: 'Aura', icon: Radio, path: createPageUrl('Aura') },
        ]
    },
    { name: 'Engine', icon: Cpu, path: createPageUrl('Engine'), subPages: [] },
];

export const ALL_NAV_ITEMS = [
    { name: 'Luna Dashboard', icon: Home, path: createPageUrl('LunaTemplate') },
    { name: 'Store', icon: ShoppingBag, path: storeUrl },
    { name: 'Cards', icon: Trophy, path: createPageUrl('GenreMastery') },
    { name: 'Aura', icon: Radio, path: createPageUrl('Aura') },
];

export const NAV_GROUPS = {
    Home: { isLink: true, path: createPageUrl('LunaTemplate'), icon: Home },
    Games: {
        icon: Gamepad2,
        items: [
            { name: 'Store', icon: ShoppingBag, path: storeUrl },
            { name: 'Library', icon: Library, path: `${storeUrl}?mode=library` },
            { name: 'Trading Post', icon: ArrowLeftRight, path: `${storeUrl}?mode=trading` },
        ],
    },
};

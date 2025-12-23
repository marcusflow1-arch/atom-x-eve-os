
import { 
    LayoutGrid, ShoppingBag, Trophy, User, Gavel, Users, Bot, Library, 
    Download, Mail, Bell, MessageSquare, LogIn, LogOut, Heart, Hammer, 
    Clapperboard, ArrowLeftRight, Radio, Gamepad2, Settings, Home, 
    Lightbulb, Rocket, Swords, Layers, Crown, Target, Plus, Globe, TrendingUp
} from 'lucide-react';
import { createPageUrl } from '@/utils';

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

/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * 
 * Example file structure:
 * 
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *   
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *   
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 * 
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */
import AIAchievements from './pages/AIAchievements';
import AIBattle from './pages/AIBattle';
import AINews from './pages/AINews';
import AIStory from './pages/AIStory';
import AbilityAchievements from './pages/AbilityAchievements';
import Achievements from './pages/Achievements';
import AdamXEve from './pages/AdamXEve';
import Admin from './pages/Admin';
import AdminUIBuilder from './pages/AdminUIBuilder';
import Aura from './pages/Aura';
import AvatarHome from './pages/AvatarHome';
import AvatarStudio from './pages/AvatarStudio';
import Blacksmith from './pages/Blacksmith';
import BlankTransition from './pages/BlankTransition';
import CardCollection from './pages/CardCollection';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Clan from './pages/Clan';
import ClanHub from './pages/ClanHub';
import Community from './pages/Community';
import CrossGameFusion from './pages/CrossGameFusion';
import Discover from './pages/Discover';
import Engine from './pages/Engine';
import EnvGuide from './pages/EnvGuide';
import Events from './pages/Events';
import Farm from './pages/Farm';
import Friends from './pages/Friends';
import GameDetail from './pages/GameDetail';
import GameDevHub from './pages/GameDevHub';
import GameProfile from './pages/GameProfile';
import GeneratedUI from './pages/GeneratedUI';
import GenreMastery from './pages/GenreMastery';
import Home from './pages/Home';
import Ideals from './pages/Ideals';
import InstallApp from './pages/InstallApp';
import Launcher from './pages/Launcher';
import Leaderboard from './pages/Leaderboard';
import Library from './pages/Library';
import LunaTemplate from './pages/LunaTemplate';
import Mailbox from './pages/Mailbox';
import Notifications from './pages/Notifications';
import OnboardingHome from './pages/OnboardingHome';
import OrderConfirmation from './pages/OrderConfirmation';
import Orders from './pages/Orders';
import PlayerProfile from './pages/PlayerProfile';
import QuestLog from './pages/QuestLog';
import SocialFeed from './pages/SocialFeed';
import Store from './pages/Store';
import Storyline from './pages/Storyline';
import StreamDetail from './pages/StreamDetail';
import StreamWatch from './pages/StreamWatch';
import StreamerProfile from './pages/StreamerProfile';
import StreamerProfileEdit from './pages/StreamerProfileEdit';
import Streaming from './pages/Streaming';
import StreamingHome from './pages/StreamingHome';
import StreamingHub from './pages/StreamingHub';
import WorldEvents from './pages/WorldEvents';
import YBotTest from './pages/YBotTest';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AIAchievements": AIAchievements,
    "AIBattle": AIBattle,
    "AINews": AINews,
    "AIStory": AIStory,
    "AbilityAchievements": AbilityAchievements,
    "Achievements": Achievements,
    "AdamXEve": AdamXEve,
    "Admin": Admin,
    "AdminUIBuilder": AdminUIBuilder,
    "Aura": Aura,
    "AvatarHome": AvatarHome,
    "AvatarStudio": AvatarStudio,
    "Blacksmith": Blacksmith,
    "BlankTransition": BlankTransition,
    "CardCollection": CardCollection,
    "Cart": Cart,
    "Checkout": Checkout,
    "Clan": Clan,
    "ClanHub": ClanHub,
    "Community": Community,
    "CrossGameFusion": CrossGameFusion,
    "Discover": Discover,
    "Engine": Engine,
    "EnvGuide": EnvGuide,
    "Events": Events,
    "Farm": Farm,
    "Friends": Friends,
    "GameDetail": GameDetail,
    "GameDevHub": GameDevHub,
    "GameProfile": GameProfile,
    "GeneratedUI": GeneratedUI,
    "GenreMastery": GenreMastery,
    "Home": Home,
    "Ideals": Ideals,
    "InstallApp": InstallApp,
    "Launcher": Launcher,
    "Leaderboard": Leaderboard,
    "Library": Library,
    "LunaTemplate": LunaTemplate,
    "Mailbox": Mailbox,
    "Notifications": Notifications,
    "OnboardingHome": OnboardingHome,
    "OrderConfirmation": OrderConfirmation,
    "Orders": Orders,
    "PlayerProfile": PlayerProfile,
    "QuestLog": QuestLog,
    "SocialFeed": SocialFeed,
    "Store": Store,
    "Storyline": Storyline,
    "StreamDetail": StreamDetail,
    "StreamWatch": StreamWatch,
    "StreamerProfile": StreamerProfile,
    "StreamerProfileEdit": StreamerProfileEdit,
    "Streaming": Streaming,
    "StreamingHome": StreamingHome,
    "StreamingHub": StreamingHub,
    "WorldEvents": WorldEvents,
    "YBotTest": YBotTest,
}

export const pagesConfig = {
    mainPage: "Store",
    Pages: PAGES,
    Layout: __Layout,
};
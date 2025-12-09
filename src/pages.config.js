import Dashboard from './pages/Dashboard';
import Marketplace from './pages/Marketplace';
import Achievements from './pages/Achievements';
import Blacksmith from './pages/Blacksmith';
import Clan from './pages/Clan';
import AIConsole from './pages/AIConsole';
import Library from './pages/Library';
import AINews from './pages/AINews';
import AIAchievements from './pages/AIAchievements';
import Store from './pages/Store';
import InstallApp from './pages/InstallApp';
import Mailbox from './pages/Mailbox';
import Notifications from './pages/Notifications';
import Community from './pages/Community';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import OrderConfirmation from './pages/OrderConfirmation';
import AdamXEve from './pages/AdamXEve';
import Storyline from './pages/Storyline';
import GameDetail from './pages/GameDetail';
import StreamingHub from './pages/StreamingHub';
import StreamDetail from './pages/StreamDetail';
import AvatarStudio from './pages/AvatarStudio';
import AbilityAchievements from './pages/AbilityAchievements';
import PlayerProfile from './pages/PlayerProfile';
import GameProfile from './pages/GameProfile';
import Orders from './pages/Orders';
import Ideals from './pages/Ideals';
import GameDevHub from './pages/GameDevHub';
import Events from './pages/Events';
import Challenges from './pages/Challenges';
import Admin from './pages/Admin';
import SeasonalPass from './pages/SeasonalPass';
import LunaTemplate from './pages/LunaTemplate';
import GenreMastery from './pages/GenreMastery';
import CrossMenu from './pages/CrossMenu';
import SteamLibrary from './pages/SteamLibrary';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Dashboard": Dashboard,
    "Marketplace": Marketplace,
    "Achievements": Achievements,
    "Blacksmith": Blacksmith,
    "Clan": Clan,
    "AIConsole": AIConsole,
    "Library": Library,
    "AINews": AINews,
    "AIAchievements": AIAchievements,
    "Store": Store,
    "InstallApp": InstallApp,
    "Mailbox": Mailbox,
    "Notifications": Notifications,
    "Community": Community,
    "Cart": Cart,
    "Checkout": Checkout,
    "OrderConfirmation": OrderConfirmation,
    "AdamXEve": AdamXEve,
    "Storyline": Storyline,
    "GameDetail": GameDetail,
    "StreamingHub": StreamingHub,
    "StreamDetail": StreamDetail,
    "AvatarStudio": AvatarStudio,
    "AbilityAchievements": AbilityAchievements,
    "PlayerProfile": PlayerProfile,
    "GameProfile": GameProfile,
    "Orders": Orders,
    "Ideals": Ideals,
    "GameDevHub": GameDevHub,
    "Events": Events,
    "Challenges": Challenges,
    "Admin": Admin,
    "SeasonalPass": SeasonalPass,
    "LunaTemplate": LunaTemplate,
    "GenreMastery": GenreMastery,
    "CrossMenu": CrossMenu,
    "SteamLibrary": SteamLibrary,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};
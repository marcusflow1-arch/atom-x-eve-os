import {useCallback,useEffect,useState} from 'react';
import {useLocation,useNavigate} from 'react-router-dom';
import StoreBottomNav from '@/components/store/StoreBottomNav';
import GlassPageFrame from '@/components/shared/GlassPageFrame';
import GameHubTabs from '@/components/game/GameHubTabs';
import StorefrontTopBar from '@/components/store/redesign/StorefrontTopBar';
import {useStoreCatalog} from '@/components/store/redesign/useStoreCatalog';
import LunaBottomNav from '@/components/dashboard/LunaBottomNav';
import {useAuth} from '@/components/auth/AuthContext';
import {useCart} from '@/components/CartContext';

export default function GameDetail(){
 const location=useLocation(),navigate=useNavigate(),{user}=useAuth(),{getCartCount}=useCart();
 const [game,setGame]=useState(null),[view,setView]=useState('overview'),[search,setSearch]=useState(''),[searchPanelsOpen,setSearchPanelsOpen]=useState(false);
 const query=new URLSearchParams(location.search),gameId=query.get('id'),from=query.get('from')||'store';
 const {data:games=[]}=useStoreCatalog();
 const handleGameLoaded=useCallback(loaded=>setGame(loaded),[]);
 useEffect(()=>{setView('overview');setSearchPanelsOpen(false);setSearch('');setGame(null);},[gameId]);
 useEffect(()=>{const close=e=>{if(e.key==='Escape')setSearchPanelsOpen(false);};window.addEventListener('keydown',close);return()=>window.removeEventListener('keydown',close);},[]);
 const openGame=id=>{setSearchPanelsOpen(false);navigate('/GameDetail?id='+encodeURIComponent(id)+'&from=store');};
 const openSearch=value=>navigate('/Store?section=all&q='+encodeURIComponent(value));
 return <GlassPageFrame showTriggerTab={!!game} gameData={game} activeGameView={view} onGameViewChange={setView}
  topContent={<StorefrontTopBar user={user} games={games} cartCount={getCartCount?.()||0} searchTerm={search} onSearchChange={setSearch} onSelectGame={openGame} onSearchOpen={()=>setSearchPanelsOpen(true)} onSearchSubmit={openSearch}/>}
  bottomContent={<StoreBottomNav activeTab="store" onTabChange={tab=>navigate(tab==='store'||tab==='overview'?'/Store':'/Store?mode='+encodeURIComponent(tab))}/>}>
  {searchPanelsOpen&&<LunaBottomNav hideNav forceLibraryOpen libraryLabel="Store Library" games={games} searchTerm={search} onLibraryClose={()=>setSearchPanelsOpen(false)}/>}
  <div className="h-[100dvh] overflow-hidden"><GameHubTabs gameId={gameId} onClose={()=>navigate(from==='library'?'/Library':'/Store')} onGameLoaded={handleGameLoaded} returnLabel={from==='library'?'Library':'Store'} view={view} onViewChange={setView}/></div>
 </GlassPageFrame>;
}

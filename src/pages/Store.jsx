import {useEffect,useState} from 'react';
import {useNavigate,useSearchParams} from 'react-router-dom';
import {useStoreCatalog} from '@/components/store/redesign/useStoreCatalog';
import {useAuth} from '@/components/auth/AuthContext';
import {useCart} from '@/components/CartContext';
import GlassPageFrame from '@/components/shared/GlassPageFrame';
import PageErrorBoundary from '@/components/error/PageErrorBoundary';
import {WishlistProvider} from '@/components/store/WishlistContext';
import StorefrontTopBar from '@/components/store/redesign/StorefrontTopBar';
import StorefrontLayout from '@/components/store/redesign/StorefrontLayout';
import StoreBottomNav from '@/components/store/StoreBottomNav';
import LunaBottomNav from '@/components/dashboard/LunaBottomNav';
import TradingPostContent from '@/components/store/TradingPostContent';
import MarketplaceContent from '@/components/store/MarketplaceContent';
import DevCardsContent from '@/components/store/DevCardsContent';
import Library from './Library';
import Achievements from './Achievements';

export default function Store(){
 const navigate=useNavigate(),[params]=useSearchParams(),{user}=useAuth(),{getCartCount}=useCart();
 const mode=params.get('mode')||'store',subview=params.get('subview')||'games';
 const [search,setSearch]=useState(params.get('q')||'');
 useEffect(()=>setSearch(params.get('q')||''),[params]);
 const [searchPanelsOpen,setSearchPanelsOpen]=useState(false);
 useEffect(()=>{
  if(!searchPanelsOpen)return;
  const closeOnEscape=event=>{if(event.key==='Escape')setSearchPanelsOpen(false);};
  window.addEventListener('keydown',closeOnEscape);
  return()=>window.removeEventListener('keydown',closeOnEscape);
 },[searchPanelsOpen]);
 useEffect(()=>setSearchPanelsOpen(false),[mode,subview]);
 const {data:games=[],isLoading,error,refetch}=useStoreCatalog();
 const openGame=id=>navigate('/GameDetail?id='+encodeURIComponent(id)+'&from=store');
 const changeTab=tab=>navigate(tab==='store'?'/Store':'/Store?mode='+encodeURIComponent(tab));
 let content;
 if(subview==='library')content=<Library/>;
 else if(subview==='achievements')content=<Achievements/>;
 else if(mode==='trading')content=<TradingPostContent searchTerm={search}/>;
 else if(mode==='marketplace')content=<MarketplaceContent/>;
 else if(mode==='devcards')content=<DevCardsContent onNavigateToGame={openGame}/>;
 else if(isLoading)content=<div role="status" className="grid h-full place-items-center bg-[#0b101a] text-sm text-slate-400">Loading the store…</div>;
 else if(error)content=<div role="alert" className="grid h-full place-content-center gap-4 bg-[#0b101a] text-center text-white/70"><p>The catalog couldn't load.</p><button onClick={()=>refetch()} className="text-cyan-200">Try again</button></div>;
 else content=<StorefrontLayout initialTab={params.get('section')||'discover'} games={games} searchTerm={search} onClearSearch={()=>setSearch('')} onNavigateToGame={openGame}/>;
 return <PageErrorBoundary pageName="Store"><WishlistProvider><GlassPageFrame
  topContent={<StorefrontTopBar user={user} games={games} cartCount={getCartCount?.()||0} searchTerm={search} onSearchChange={setSearch} onSelectGame={openGame} onSearchOpen={()=>setSearchPanelsOpen(true)}/>}
  bottomContent={<StoreBottomNav activeTab={mode} onTabChange={changeTab}/>}>
  {searchPanelsOpen&&<LunaBottomNav hideNav forceLibraryOpen libraryLabel="Store Library" games={games} searchTerm={search} onLibraryClose={()=>setSearchPanelsOpen(false)}/>}
  <div className="h-screen w-full overflow-hidden pt-16 pb-[53px]">{content}</div>
 </GlassPageFrame></WishlistProvider></PageErrorBoundary>;
}

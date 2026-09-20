import {useState} from 'react';
import {useQuery} from '@tanstack/react-query';
import {useNavigate,useSearchParams} from 'react-router-dom';
import {base44} from '@/api/base44Client';
import {useAuth} from '@/components/auth/AuthContext';
import {useCart} from '@/components/CartContext';
import GlassPageFrame from '@/components/shared/GlassPageFrame';
import PageErrorBoundary from '@/components/error/PageErrorBoundary';
import {WishlistProvider} from '@/components/store/WishlistContext';
import StorefrontTopBar from '@/components/store/redesign/StorefrontTopBar';
import StorefrontLayout from '@/components/store/redesign/StorefrontLayout';
import StoreBottomNav from '@/components/store/StoreBottomNav';
import TradingPostContent from '@/components/store/TradingPostContent';
import MarketplaceContent from '@/components/store/MarketplaceContent';
import DevCardsContent from '@/components/store/DevCardsContent';
import Library from './Library';
import Achievements from './Achievements';

export default function Store(){
 const navigate=useNavigate(),[params]=useSearchParams(),{user}=useAuth(),{getCartCount}=useCart();
 const mode=params.get('mode')||'store',subview=params.get('subview')||'games';
 const [search,setSearch]=useState('');
 const {data:games=[],isLoading,error,refetch}=useQuery({queryKey:['store-catalog'],queryFn:async()=>{
  const all=[],seen=new Set();let offset=0;
  while(true){
   const rows=await base44.entities.Game.list('title',200,offset);
   const page=rows?.data||rows;
   if(!Array.isArray(page))throw new Error('The game catalog returned an invalid response.');
   for(const game of page)if(game.id&&!seen.has(game.id)){seen.add(game.id);all.push(game);}
   if(page.length<200)break;
   offset+=page.length;
  }
  return all;
 },staleTime:60000});
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
 else content=<StorefrontLayout games={games} searchTerm={search} onClearSearch={()=>setSearch('')} onNavigateToGame={openGame}/>;
 return <PageErrorBoundary pageName="Store"><WishlistProvider><GlassPageFrame
  topContent={<StorefrontTopBar user={user} games={games} cartCount={getCartCount?.()||0} searchTerm={search} onSearchChange={setSearch} onSelectGame={openGame}/>}
  bottomContent={<StoreBottomNav activeTab={mode} onTabChange={changeTab}/>}>
  <div className="h-screen w-full overflow-hidden pt-16 pb-[53px]">{content}</div>
 </GlassPageFrame></WishlistProvider></PageErrorBoundary>;
}

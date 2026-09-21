import {useNavigate} from 'react-router-dom';
import {Menu,ShoppingCart,WalletCards} from 'lucide-react';
import StoreSearch from './StoreSearch';

const PRIMARY_LINKS=[
 {label:'Clan',to:'/Clan'},
 {label:'Forum',to:'/Community'},
 {label:'Cards',to:'/GenreMastery'},
 {label:'Aura',to:'/Aura'},
];

export default function StorefrontTopBar({user,cartCount=0,searchTerm,onSearchChange,games=[],onSelectGame,onSearchOpen}){
 const navigate=useNavigate();
 const balance=Number(user?.avatar_gamer_points||0);
 const level=user?.level||user?.avatar_level||null;

 return <div className="flex w-full min-w-0 items-center gap-3 xl:gap-4">
  <div className="flex shrink-0 items-center gap-3">
   <button
    type="button"
    aria-label="Open main navigation"
    onClick={()=>navigate('/LunaTemplate')}
    className="grid h-9 w-9 place-items-center rounded-xl bg-white/[0.045] text-white/55 ring-1 ring-white/[0.07] transition hover:bg-white/[0.08] hover:text-white"
   >
    <Menu size={17}/>
   </button>
   <button
    type="button"
    onClick={()=>navigate('/LunaTemplate')}
    className="whitespace-nowrap text-[11px] font-bold uppercase tracking-[.16em] text-white"
   >
    ATOM X EVE Store
   </button>
  </div>

  <div aria-hidden="true" className="hidden h-8 w-px shrink-0 bg-gradient-to-b from-transparent via-white/25 to-transparent md:block"/>

  <nav aria-label="Store global navigation" className="hidden shrink-0 items-center gap-1 lg:flex">
   {PRIMARY_LINKS.map(link=><button
    key={link.label}
    type="button"
    onClick={()=>navigate(link.to)}
    className="rounded-lg px-2.5 py-2 text-[11px] font-semibold text-white/45 transition hover:bg-white/[0.055] hover:text-white"
   >{link.label}</button>)}
  </nav>

  <div className="mx-auto min-w-[180px] max-w-2xl flex-1">
   <StoreSearch games={games} value={searchTerm} onChange={onSearchChange} onSelect={onSelectGame} onOpen={onSearchOpen}/>
  </div>

  <div className="flex shrink-0 items-center gap-2">
   <button
    type="button"
    onClick={()=>navigate('/Profile')}
    className="hidden items-center gap-2 rounded-xl bg-white/[0.04] px-3 py-2 ring-1 ring-white/[0.07] transition hover:bg-white/[0.07] md:flex"
    title="Platform balance"
   >
    <WalletCards size={15} className="text-cyan-200/75"/>
    <div className="text-left leading-none">
     <div className="text-[9px] uppercase tracking-[.14em] text-white/30">Balance</div>
     <div className="mt-1 text-[11px] font-semibold tabular-nums text-white/80">{balance.toLocaleString()} AGP</div>
    </div>
   </button>

   {level&&<div className="hidden rounded-xl bg-white/[0.035] px-3 py-2 text-center ring-1 ring-white/[0.06] 2xl:block">
    <div className="text-[9px] uppercase tracking-[.14em] text-white/25">Level</div>
    <div className="mt-1 text-[11px] font-semibold text-white/70">{level}</div>
   </div>}

   <button aria-label={'Shopping cart, '+cartCount+' items'} onClick={()=>navigate('/Cart')} className="relative shrink-0 rounded-xl bg-white/5 p-2.5 text-white/70 transition hover:bg-white/10 hover:text-white">
    <ShoppingCart size={18}/>{cartCount>0&&<span className="absolute -right-1 -top-1 rounded-full bg-cyan-200 px-1.5 text-[10px] text-slate-950">{cartCount}</span>}
   </button>

   <button aria-label="My profile" onClick={()=>navigate('/Profile')} className="hidden h-9 w-9 shrink-0 overflow-hidden rounded-full bg-cyan-300/10 text-cyan-100 ring-1 ring-cyan-200/10 sm:block">
    {user?.avatar_url?<img src={user.avatar_url} alt="" className="h-full w-full object-cover"/>:<span className="grid h-full w-full place-items-center text-xs font-semibold">{(user?.full_name||'P')[0]}</span>}
   </button>
  </div>
 </div>;
}

import {useNavigate} from 'react-router-dom';
import {ShoppingCart} from 'lucide-react';
import StoreSearch from './StoreSearch';
export default function StorefrontTopBar({user,cartCount=0,searchTerm,onSearchChange,games=[],onSelectGame,onSearchOpen}){
 const navigate=useNavigate();
 return <div className="flex w-full items-center gap-4">
  <button onClick={()=>navigate('/LunaTemplate')} className="shrink-0 text-xs font-bold tracking-[.16em] text-white">ATOM X EVE</button>
  <div className="mx-auto w-full max-w-2xl min-w-0"><StoreSearch games={games} value={searchTerm} onChange={onSearchChange} onSelect={onSelectGame} onOpen={onSearchOpen}/></div>
  <button aria-label={'Shopping cart, '+cartCount+' items'} onClick={()=>navigate('/Cart')} className="relative shrink-0 rounded-xl bg-white/5 p-2.5 text-white/70">
   <ShoppingCart size={18}/>{cartCount>0&&<span className="absolute -right-1 -top-1 rounded-full bg-cyan-200 px-1.5 text-[10px] text-slate-950">{cartCount}</span>}
  </button>
  <button aria-label="My profile" onClick={()=>navigate('/Profile')} className="hidden h-9 w-9 shrink-0 overflow-hidden rounded-full bg-cyan-300/10 text-cyan-100 sm:block">{user?.avatar_url?<img src={user.avatar_url} alt="" className="h-full w-full object-cover"/>:(user?.full_name||'P')[0]}</button>
 </div>;
}

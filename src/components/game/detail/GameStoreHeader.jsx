import {useNavigate} from 'react-router-dom';
import {Menu,ShoppingCart,WalletCards,Home,Users,Swords,Trophy} from 'lucide-react';
import GameStoreSearch from './GameStoreSearch';
import './game-detail.css';

const PRIMARY_LINKS=[
 {label:'Luna Dashboard',to:'/LunaTemplate',icon:Home},
 {label:'Clan',to:'/Clan',icon:Users},
 {label:'War',to:'/AIBattle',icon:Swords},
 {label:'Achievements',to:'/GenreMastery?mode=achievements',icon:Trophy},
];
export default function GameStoreHeader({user,cartCount=0,searchTerm='',onSearchChange,games=[],onSelectGame,onSearchOpen,onSearchSubmit}){
 const navigate=useNavigate();
 const raw=user?.avatar_gamer_points;
 const balance=raw!==null&&raw!==undefined&&Number.isFinite(Number(raw))?Number(raw):null;
 return <div className="gdh-topbar">
  <button type="button" className="gdh-header-icon" aria-label="Open main navigation" onClick={()=>window.dispatchEvent(new Event('openAppDrawer'))}><Menu size={19}/></button>
  <button type="button" className="gdh-brand" onClick={()=>navigate('/Store')}>Atom XE <span>Store</span></button>
  <span className="gdh-header-divider" aria-hidden="true"/>
  <nav className="gdh-primary-links" aria-label="Store global navigation">
   {PRIMARY_LINKS.map(({label,to,icon:Icon})=><button key={label} type="button" title={label} aria-label={label} onClick={()=>navigate(to)}><Icon size={16}/><span>{label}</span></button>)}
  </nav>
  <div className="gdh-header-search"><GameStoreSearch games={games} value={searchTerm} onChange={onSearchChange} onSelect={onSelectGame} onOpen={onSearchOpen} onSubmit={onSearchSubmit}/></div>
  <button type="button" className="gdh-balance" onClick={()=>navigate('/Profile')} aria-label={balance===null?'View your balance':'Balance: '+balance.toLocaleString()+' AGP'}><WalletCards size={16}/><span><small>Balance</small><strong>{balance===null?'—':balance.toLocaleString()} <em>AGP</em></strong></span></button>
  <button type="button" className="gdh-header-icon gdh-cart" aria-label={'Shopping cart, '+cartCount+' items'} onClick={()=>navigate('/Cart')}><ShoppingCart size={18}/>{cartCount>0&&<span>{cartCount}</span>}</button>
  <button type="button" className="gdh-profile" aria-label="My profile" onClick={()=>navigate('/Profile')}>{user?.avatar_url?<img src={user.avatar_url} alt=""/>:<span>{(user?.full_name||'P')[0]}</span>}</button>
 </div>;
}

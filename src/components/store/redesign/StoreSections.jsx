import {useEffect,useState} from 'react';
import {ArrowRight,ChevronLeft,ChevronRight,Pause,Play,Gamepad2} from 'lucide-react';
import WishlistButton from '../WishlistButton';
import {label,priceLabel,comingSoon,discountPercent} from './discovery';
import {mediaUrl} from '@/components/game/detail/gameDetailData';
import StoreSection from './StoreSection';
export {default as StoreSection} from './StoreSection';

export function GameCover({game,wide=false,eager=false}){
 const sources=[...(wide?[game.banner_image,...(Array.isArray(game.screenshots)?game.screenshots:[])]:[]),game.cover_image,game.image].map(mediaUrl).filter(Boolean);
 const [failed,setFailed]=useState([]);
 const key=sources.join('|');
 useEffect(()=>setFailed([]),[key]);
 const src=sources.find(url=>!failed.includes(url));
 return src?<img src={src} alt="" loading={eager?'eager':'lazy'} onError={()=>setFailed(previous=>[...previous,src])} className="sf-cover"/>:<div className="sf-cover-fallback"><Gamepad2 size={32}/></div>;
}
export function GamePrice({game}){
 const discount=discountPercent(game);
 return <span className="sf-price">{discount>0&&!comingSoon(game)&&<><span className="sf-discount">−{discount}%</span><del>{new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(game.price)}</del></>}<strong>{priceLabel(game)}</strong></span>;
}
export function GameCard({game,onSelect,reason}){
 return <article className="sf-game-card">
  <button onClick={()=>onSelect(game.id)} className="sf-game-link"><div className="sf-game-art"><GameCover game={game} wide/>{comingSoon(game)&&<span className="sf-art-label">Coming soon</span>}</div>
   <h3>{game.title}</h3><p className="sf-game-genre">{label(game.genre)||'Discover this game'}</p><GamePrice game={game}/>{reason&&<p className="sf-game-reason">{reason}</p>}
  </button><WishlistButton game={game} className="absolute right-2 top-2"/>
 </article>;
}
export function Shelf({title,subtitle,games,onSelect,onViewAll,empty}){
 return <StoreSection title={title} subtitle={subtitle} onViewAll={onViewAll}>
  {games.length?<div className="sf-ranked-list">{games.slice(0,4).map((game,index)=><button key={game.id} onClick={()=>onSelect(game.id)}><span className="sf-rank">{String(index+1).padStart(2,'0')}</span><div className="sf-row-art"><GameCover game={game} wide/></div><span className="sf-row-info"><strong>{game.title}</strong><small>{label(game.genre)}</small></span><GamePrice game={game}/></button>)}</div>:<p className="sf-muted">{empty||'No games in this section yet.'}</p>}
 </StoreSection>;
}
export function DiscoveryHero({games,onSelect}){
 const [index,setIndex]=useState(0),[paused,setPaused]=useState(false),[hover,setHover]=useState(false);
 useEffect(()=>{
  if(paused||hover||games.length<2||window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)return;
  const timer=setInterval(()=>{if(!document.hidden)setIndex(i=>(i+1)%games.length);},12000);
  return()=>clearInterval(timer);
 },[paused,hover,games.length]);
 if(!games.length)return null;
 const game=games[index%games.length];
 return <section aria-label="Discover a different game" aria-roledescription="carousel" className="sf-hero" onMouseEnter={()=>setHover(true)} onMouseLeave={()=>setHover(false)} onFocusCapture={()=>setHover(true)} onBlurCapture={e=>{if(!e.currentTarget.contains(e.relatedTarget))setHover(false);}}>
  <div className="sf-hero-art"><GameCover game={game} wide eager/></div>
  <div className="sf-hero-copy"><p className="sf-eyebrow">Your next adventure</p><h1>{game.title}</h1><p>{game.description||label(game.genre)+' · Find your next game.'}</p><div className="sf-hero-actions"><button className="sf-action" onClick={()=>onSelect(game.id)}>Explore game<ArrowRight size={16}/></button><GamePrice game={game}/></div></div>
  <div className="sf-hero-controls"><span>A different discovery each visit</span><div><button aria-label="Previous discovery" onClick={()=>setIndex(i=>(i-1+games.length)%games.length)}><ChevronLeft size={18}/></button><span>{index%games.length+1} / {games.length}</span><button aria-label="Next discovery" onClick={()=>setIndex(i=>(i+1)%games.length)}><ChevronRight size={18}/></button><button aria-label={paused?'Resume discoveries':'Pause discoveries'} onClick={()=>setPaused(!paused)}>{paused?<Play size={14}/>:<Pause size={14}/>}</button></div></div>
 </section>;
}

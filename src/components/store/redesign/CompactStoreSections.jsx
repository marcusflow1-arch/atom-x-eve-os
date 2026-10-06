import {useEffect,useRef,useState} from 'react';
import {ArrowRight,ChevronLeft,ChevronRight,Gamepad2,Pause,Play,RefreshCw} from 'lucide-react';
import WishlistButton from '../WishlistButton';
import {GameCover} from './StoreSections';
import {label,priceLabel,comingSoon,releaseTime,normalize} from './discovery';

export const demoUrl = game => {
 const value=String(game.demo_url || (game.is_demo ? game.play_link : '') || '').trim();
 return /^(https?:\/\/|\/(?!\/))/i.test(value) ? value : '';
};
export const isDemo = game => Boolean(demoUrl(game));
export function CompactGameCard({game,onSelect,reason,demo=false}){
 return <article className="sf-game">
  <button className="sf-game-open" onClick={()=>onSelect(game.id)}><div className="sf-game-image"><GameCover game={game}/>{demo&&<span className="sf-demo-badge"><Play size={10}/>Demo</span>}</div><h3>{game.title}</h3><p>{label(game.genre)}{comingSoon(game)?' · Coming soon':''}</p><strong>{demo?'Try before you buy':priceLabel(game)}</strong>{reason&&<small>{reason}</small>}</button>
  {demo&&demoUrl(game)&&<a className="sf-demo-link" href={demoUrl(game)} target="_blank" rel="noopener noreferrer"><Play size={10}/>Play demo</a>}
  <WishlistButton game={game} className="sf-wishlist"/>
 </article>;
}
export function CompactShelf({title,subtitle,games,onSelect,onViewAll,demo=false,empty,onRotate}){
 const rail=useRef(null);
 return <section className="sf-shelf" aria-label={title}>
  <header><div><h2>{title}</h2>{subtitle&&<p>{subtitle}</p>}</div><div className="sf-shelf-actions">{onRotate&&<button onClick={onRotate}><RefreshCw size={13}/><span>Show different games</span></button>}{onViewAll&&<button onClick={onViewAll}>View all<ArrowRight size={13}/></button>}{games.length>3&&<><button aria-label={'Scroll '+title+' left'} onClick={()=>rail.current?.scrollBy({left:-350,behavior:'smooth'})}><ChevronLeft size={15}/></button><button aria-label={'Scroll '+title+' right'} onClick={()=>rail.current?.scrollBy({left:350,behavior:'smooth'})}><ChevronRight size={15}/></button></>}</div></header>
  {games.length?<div className="sf-game-rail" ref={rail}>{games.slice(0,6).map(game=><CompactGameCard key={game.id} game={game} onSelect={onSelect} demo={demo}/>)}</div>:<div className="sf-inline-empty"><Gamepad2 size={19}/><p>{empty||'Games will appear here as they are added.'}</p></div>}
 </section>;
}
export function CompactHero({games,onSelect}){
 const [index,setIndex]=useState(0),[paused,setPaused]=useState(false),[hover,setHover]=useState(false);
 useEffect(()=>{if(paused||hover||games.length<2||window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)return;const timer=setInterval(()=>{if(!document.hidden)setIndex(i=>(i+1)%games.length);},12000);return()=>clearInterval(timer);},[paused,hover,games.length]);
 if(!games.length)return <div className="sf-inline-empty">No games in this catalog yet.</div>;
 const game=games[index%games.length];
 return <section className="sf-hero" aria-label="Featured games" aria-roledescription="carousel" onMouseEnter={()=>setHover(true)} onMouseLeave={()=>setHover(false)} onFocusCapture={()=>setHover(true)} onBlurCapture={e=>{if(!e.currentTarget.contains(e.relatedTarget))setHover(false);}}>
  <div className="sf-hero-art"><GameCover game={game} wide eager/></div><div className="sf-hero-shade"/>
  <div className="sf-hero-copy"><span className="sf-kicker">In the spotlight · {label(game.genre)}</span><h1>{game.title}</h1><p>{game.description||'Explore this world and discover its achievements.'}</p><div><button className="sf-primary" onClick={()=>onSelect(game.id)}>Explore game<ArrowRight size={14}/></button><span>{priceLabel(game)}</span></div></div>
  <div className="sf-hero-controls"><button aria-label="Previous discovery" onClick={()=>setIndex(i=>(i-1+games.length)%games.length)}><ChevronLeft size={14}/></button><span>{index%games.length+1} / {games.length}</span><button aria-label="Next discovery" onClick={()=>setIndex(i=>(i+1)%games.length)}><ChevronRight size={14}/></button><button aria-label={paused?'Resume discoveries':'Pause discoveries'} onClick={()=>setPaused(!paused)}>{paused?<Play size={12}/>:<Pause size={12}/>}</button></div>
 </section>;
}
export function TopSeven({ranked,discovery,onSelect,onViewAll,salesLoading,salesError}){
 const games=(ranked.length?ranked:discovery).slice(0,7);
 return <section className="sf-top-seven" aria-label="Top seven"><header><div><h2>Top seven</h2><p>{ranked.length?'By completed purchases · 30 days':salesLoading?'Loading sales · discovery picks shown':salesError?'Sales unavailable · discovery picks':'Discovery picks · rotates with the catalog'}</p></div><button aria-label="See all top sellers" onClick={onViewAll}><ArrowRight size={15}/></button></header><ol>{games.map((game,index)=><li key={game.id}><button onClick={()=>onSelect(game.id)}><span className="sf-rank">{String(index+1).padStart(2,'0')}</span><div className="sf-ranked-cover"><GameCover game={game}/></div><span><strong>{game.title}</strong><small>{label(game.genre)}</small></span><b>{priceLabel(game)}</b></button></li>)}</ol></section>;
}
export function newestArrivals(games){return games.filter(g=>!comingSoon(g)&&Number.isFinite(Date.parse(g.created_date))).sort((a,b)=>Date.parse(b.created_date)-Date.parse(a.created_date));}
export function releaseOrder(games){return games.filter(g=>!comingSoon(g)&&releaseTime(g)>0).sort((a,b)=>releaseTime(b)-releaseTime(a)||normalize(a.title).localeCompare(normalize(b.title)));}

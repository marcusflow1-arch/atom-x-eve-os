import {useEffect,useState} from 'react';
import {ArrowRight,ChevronLeft,ChevronRight,Pause,Play,Gamepad2} from 'lucide-react';
import WishlistButton from '../WishlistButton';
import {label,priceLabel,comingSoon} from './discovery';

export function GameCover({game,wide=false,eager=false}){
 const [failed,setFailed]=useState(false);
 const src=(wide&&game.banner_image)||game.cover_image||game.image;
 useEffect(()=>setFailed(false),[src]);
 return src&&!failed?<img src={src} alt="" loading={eager?'eager':'lazy'} onError={()=>setFailed(true)} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.035]"/>:<div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-700 to-slate-950 text-white/30"><Gamepad2 size={36}/></div>;
}
export function GameCard({game,onSelect,reason}){
 return <article className="group relative min-w-0">
  <button onClick={()=>onSelect(game.id)} className="block w-full text-left">
   <div className="aspect-[16/10] overflow-hidden rounded-xl bg-white/5"><GameCover game={game}/></div>
   <div className="pt-3"><h3 className="truncate text-sm font-semibold text-white group-hover:text-cyan-200">{game.title}</h3>
    <p className="mt-1 truncate text-xs text-white/40">{label(game.genre)}{comingSoon(game)?' · Coming soon':''}</p>
    <p className="mt-2 text-xs font-medium text-white/80">{priceLabel(game)}</p>
    {reason&&<p className="mt-2 text-xs text-cyan-200/65">{reason}</p>}
   </div>
  </button>
  <WishlistButton game={game} className="absolute right-2 top-2"/>
 </article>;
}
export function Shelf({title,subtitle,games,onSelect,onViewAll,empty='No games in this section yet.'}){
 return <section>
  <div className="mb-4 flex items-end justify-between gap-4"><div><h2 className="text-xl font-semibold tracking-tight text-white">{title}</h2>{subtitle&&<p className="mt-1 text-xs text-white/40">{subtitle}</p>}</div>{onViewAll&&<button className="flex shrink-0 items-center gap-1 text-xs text-cyan-200" onClick={onViewAll}>View all<ArrowRight size={14}/></button>}</div>
  {games.length?<div className="divide-y divide-white/[0.06]">{games.slice(0,4).map((game,i)=><button key={game.id} onClick={()=>onSelect(game.id)} className="group flex w-full items-center gap-4 rounded-lg py-3 text-left hover:bg-white/[0.03]">
   <span className="w-5 text-xs text-white/25">{String(i+1).padStart(2,'0')}</span>
   <div className="h-16 w-28 shrink-0 overflow-hidden rounded-lg"><GameCover game={game}/></div>
   <div className="min-w-0 flex-1"><h3 className="truncate text-sm font-medium text-white/90">{game.title}</h3><p className="mt-1 text-xs text-white/40">{label(game.genre)}</p></div><span className="shrink-0 text-xs text-white/75">{priceLabel(game)}</span>
  </button>)}</div>:<p className="rounded-xl bg-white/[0.025] px-4 py-10 text-sm text-white/40">{empty}</p>}
 </section>;
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
 return <section aria-label="Discover a different game" aria-roledescription="carousel" onMouseEnter={()=>setHover(true)} onMouseLeave={()=>setHover(false)} onFocusCapture={()=>setHover(true)} onBlurCapture={e=>{if(!e.currentTarget.contains(e.relatedTarget))setHover(false);}} className="relative isolate min-h-[330px] overflow-hidden rounded-2xl bg-slate-900 md:min-h-[390px]">
  <div className="absolute inset-0 -z-20"><GameCover game={game} wide eager/></div>
  <div className="absolute inset-0 -z-10 bg-gradient-to-r from-slate-950/95 via-slate-950/65 to-slate-950/10"/>
  <div className="absolute inset-0 -z-10 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent"/>
  <div className="flex min-h-[330px] flex-col justify-end p-7 pb-20 md:min-h-[390px] md:p-10 md:pb-20">
   <p className="mb-3 text-[10px] font-semibold uppercase tracking-[.24em] text-cyan-200">A new world to discover</p>
   <h1 className="max-w-2xl text-3xl font-semibold tracking-tight text-white md:text-5xl">{game.title}</h1>
   <p className="mt-3 max-w-lg line-clamp-2 text-sm leading-relaxed text-slate-300">{game.description||label(game.genre)+' · Find your next game.'}</p>
   <div className="mt-6 flex items-center gap-5"><button onClick={()=>onSelect(game.id)} className="flex items-center gap-2 rounded-lg bg-cyan-100 px-5 py-3 text-sm font-semibold text-slate-950 hover:bg-white">Explore game<ArrowRight size={16}/></button><span className="text-sm text-white/80">{priceLabel(game)}</span></div>
  </div>
  <div className="absolute bottom-5 left-7 right-7 flex items-center justify-between md:left-10 md:right-10">
   <span className="text-[11px] text-white/50">Across every genre. A different find each visit.</span>
   <div className="flex items-center gap-3 text-white/80">
    <button aria-label="Previous discovery" onClick={()=>setIndex(i=>(i-1+games.length)%games.length)}><ChevronLeft size={18}/></button>
    <span className="text-xs tabular-nums">{index%games.length+1} / {games.length}</span>
    <button aria-label="Next discovery" onClick={()=>setIndex(i=>(i+1)%games.length)}><ChevronRight size={18}/></button>
    <button aria-label={paused?'Resume discoveries':'Pause discoveries'} onClick={()=>setPaused(!paused)}>{paused?<Play size={14}/>:<Pause size={14}/>}</button>
   </div>
  </div>
 </section>;
}

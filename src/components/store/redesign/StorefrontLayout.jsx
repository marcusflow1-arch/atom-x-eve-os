import {useEffect,useMemo,useState} from 'react';
import {useQuery} from '@tanstack/react-query';
import {RefreshCw,SlidersHorizontal,X,Sparkles} from 'lucide-react';
import {base44} from '@/api/base44Client';
import {useAuth} from '@/components/auth/AuthContext';
import {filterGames,genresOf,label,priceOf,queryScore,releaseTime,comingSoon,discoveryOrder,rotateGames,recommendations} from './discovery';
import {GameCard,Shelf,DiscoveryHero} from './StoreSections';
import StorePreferences from './StorePreferences';
import {useStorePreferences} from './useStorePreferences';

const initialFilters={genres:[],price:'any',mode:'',availability:'all',hideOwned:false};
const TABS=[['discover','Discover'],['all','All games'],['sellers','Top sellers'],['new','New releases'],['you','For you']];
export default function StorefrontLayout({onNavigateToGame,games=[],searchTerm='',onClearSearch}){
 const {user}=useAuth();
 const [tab,setTab]=useState('discover'),[filters,setFilters]=useState(initialFilters),[showFilters,setShowFilters]=useState(false),[sort,setSort]=useState('discovery'),[offset,setOffset]=useState(0),[limit,setLimit]=useState(24);
 const {preference,save,saving,error,playedIds,ownedIds}=useStorePreferences();
 const genres=useMemo(()=>[...new Set(games.flatMap(genresOf))].sort(),[games]);
 const day=new Date().toISOString().slice(0,10);
 useEffect(()=>{
  try{const key='store-rotation:'+day+':'+(user?.id||'guest');const next=Number(localStorage.getItem(key)||0);setOffset(next);localStorage.setItem(key,String(next+6));}catch{}
 },[day,user?.id]);
 const {data:salesData,isLoading:salesLoading,error:salesError}=useQuery({queryKey:['store-sales'],queryFn:async()=>{
  const {data}=await base44.functions.invoke('storeDiscovery',{action:'sales'});if(data.error)throw new Error(data.error);return data;
 },staleTime:300000});
 const deck=useMemo(()=>discoveryOrder(games,day),[games,day]);
 const discovery=useMemo(()=>rotateGames(deck,offset),[deck,offset]);
 const selected=useMemo(()=>filterGames(discovery,{...filters,query:searchTerm},ownedIds),[discovery,filters,searchTerm,ownedIds]);
 const sellers=useMemo(()=>games.filter(g=>Number(salesData?.sales?.[g.id])>0).sort((a,b)=>salesData.sales[b.id]-salesData.sales[a.id]),[games,salesData]);
 const newGames=useMemo(()=>games.filter(g=>releaseTime(g)>0&&!comingSoon(g)).sort((a,b)=>releaseTime(b)-releaseTime(a)),[games]);
 const matches=useMemo(()=>recommendations(discovery,preference,playedIds),[discovery,preference,playedIds]);
 const reasons=new Map(matches.map(r=>[r.game.id,r.reason]));
 const filtering=!!searchTerm||filters.genres.length>0||filters.price!=='any'||!!filters.mode||filters.availability!=='all'||filters.hideOwned;
 const overview=tab==='discover'&&!filtering;
 const availableIds=new Set(selected.map(g=>g.id));
 let results=tab==='sellers'?sellers.filter(g=>availableIds.has(g.id)):tab==='new'?newGames.filter(g=>availableIds.has(g.id)):tab==='you'?matches.map(r=>r.game).filter(g=>availableIds.has(g.id)):selected;
 results=[...results].sort((a,b)=>sort==='price'?(priceOf(a)??Infinity)-(priceOf(b)??Infinity):sort==='title'?a.title.localeCompare(b.title):sort==='new'?releaseTime(b)-releaseTime(a):searchTerm?queryScore(b,searchTerm)-queryScore(a,searchTerm):0);
 useEffect(()=>setLimit(24),[tab,filters,searchTerm,sort]);
 const update=(key,value)=>setFilters(f=>({...f,[key]:value}));
 const toggleGenre=g=>update('genres',filters.genres.includes(g)?filters.genres.filter(x=>x!==g):[...filters.genres,g]);
 const reset=()=>{setFilters(initialFilters);onClearSearch?.();};
 return <main className="h-full w-full overflow-y-auto bg-[#0b101a] px-4 pb-24 text-white md:px-8 xl:px-10" data-testid="store-discovery">
  <div className="sticky top-0 z-20 -mx-4 flex flex-wrap items-center justify-between gap-3 bg-[#0b101a]/95 px-4 py-5 backdrop-blur-xl md:-mx-8 md:px-8 xl:-mx-10 xl:px-10">
   <nav aria-label="Store sections" className="flex flex-wrap gap-1">{TABS.map(([id,title])=><button key={id} type="button" aria-current={tab===id?'page':undefined} onClick={()=>setTab(id)} className={'rounded-lg px-4 py-2 text-sm transition '+(tab===id?'bg-white/10 text-white':'text-white/45 hover:bg-white/5 hover:text-white')}>{title}</button>)}</nav>
   <button aria-expanded={showFilters} aria-controls="store-filters" onClick={()=>setShowFilters(!showFilters)} className="flex items-center gap-2 rounded-lg bg-white/5 px-4 py-2 text-xs text-white/70"><SlidersHorizontal size={15}/>Filters{filtering&&<span className="h-1.5 w-1.5 rounded-full bg-cyan-200"/>}</button>
  </div>
  {showFilters&&<section id="store-filters" aria-label="Filter games" className="mb-6 rounded-xl bg-white/[0.04] p-5">
   <fieldset><legend className="mb-3 text-xs text-white/50">Genres · match any selected genre</legend><div className="flex flex-wrap gap-2">{genres.map(g=><button type="button" key={g} aria-pressed={filters.genres.includes(g)} onClick={()=>toggleGenre(g)} className={'rounded-full px-3 py-1.5 text-xs '+(filters.genres.includes(g)?'bg-cyan-100 text-slate-950':'bg-white/5 text-white/60')}>{label(g)}</button>)}</div></fieldset>
   <div className="mt-5 flex flex-wrap items-end gap-4">
    <label className="text-xs text-white/60">Price<select value={filters.price} onChange={e=>update('price',e.target.value)} className="mt-2 block rounded-lg bg-slate-900 px-3 py-2"><option value="any">Any price</option><option value="free">Free to play</option><option value="10">$10 or less</option><option value="25">$25 or less</option><option value="50">$50 or less</option></select></label>
    <label className="text-xs text-white/60">Play style<select value={filters.mode} onChange={e=>update('mode',e.target.value)} className="mt-2 block rounded-lg bg-slate-900 px-3 py-2"><option value="">Any play style</option><option>Single player</option><option>Co-op</option><option>Multiplayer</option></select></label>
    <label className="text-xs text-white/60">Availability<select value={filters.availability} onChange={e=>update('availability',e.target.value)} className="mt-2 block rounded-lg bg-slate-900 px-3 py-2"><option value="all">All games</option><option value="available">Available now</option><option value="soon">Coming soon</option></select></label>
    <label className="flex items-center gap-2 pb-2 text-xs text-white/60"><input type="checkbox" checked={filters.hideOwned} onChange={e=>update('hideOwned',e.target.checked)} className="accent-cyan-300"/>Hide games in my library</label>
    <button className="pb-2 text-xs text-cyan-200" onClick={reset}>Reset filters</button>
   </div>
  </section>}
  {filtering&&<div className="mb-5 flex flex-wrap items-center gap-2 text-xs">
    {searchTerm&&<span className="rounded-full bg-cyan-300/10 px-3 py-1.5 text-cyan-100">Search: {searchTerm}</span>}
    {filters.genres.map(g=><button key={g} onClick={()=>toggleGenre(g)} className="flex items-center gap-2 rounded-full bg-white/5 px-3 py-1.5">{label(g)}<X size={12}/></button>)}
    <button onClick={reset} className="text-white/40 hover:text-white">Clear all</button>
  </div>}
  {overview&&<div className="space-y-10">
   <DiscoveryHero games={discovery.slice(0,8)} onSelect={onNavigateToGame}/>
   <section className="flex flex-wrap items-center gap-x-6 gap-y-3"><h2 className="text-sm font-medium text-white/50">Browse by genre</h2><div className="flex flex-wrap gap-2">{genres.map(g=><button key={g} onClick={()=>{update('genres',[g]);setTab('all');}} className="rounded-full bg-white/[0.045] px-4 py-2 text-xs text-white/60 hover:bg-cyan-200/10 hover:text-cyan-100">{label(g)}</button>)}</div></section>
   <section><div className="mb-5 flex items-center justify-between gap-4"><div><h2 className="text-xl font-semibold">Worth discovering</h2><p className="mt-1 text-xs text-white/40">A rotating selection from the whole catalog.</p></div><button onClick={()=>setOffset(v=>v+6)} className="flex items-center gap-2 text-xs text-cyan-200"><RefreshCw size={14}/>Show different games</button></div>
    <div className="grid grid-cols-2 gap-5 md:grid-cols-3 2xl:grid-cols-6">{rotateGames(discovery,8,6).map(g=><GameCard key={g.id} game={g} onSelect={onNavigateToGame}/>)}</div>
   </section>
   <div className="grid gap-10 lg:grid-cols-2">
    <Shelf title="Top sellers" subtitle={salesData?.complete===false?"Recent completed purchases · ranking sample":"Completed purchases · past 30 days"} games={sellers} onSelect={onNavigateToGame} onViewAll={()=>setTab('sellers')} empty={salesLoading?'Loading top sellers…':salesError?'Sales rankings are unavailable right now.':'Rankings will appear as games are purchased.'}/>
    <Shelf title="New releases" subtitle="Latest confirmed release dates" games={newGames} onSelect={onNavigateToGame} onViewAll={()=>setTab('new')} empty="No confirmed release dates in the catalog yet."/>
   </div>
   <div className="flex flex-wrap items-center justify-between gap-5 rounded-2xl bg-gradient-to-r from-cyan-300/[0.08] to-blue-500/[0.035] px-6 py-6"><div className="flex items-center gap-4"><Sparkles className="text-cyan-200/70"/><div><h2 className="text-lg font-medium">More of what you love. A little of what you haven't tried.</h2><p className="mt-1 text-sm text-white/40">Choose your genres and games to shape your recommendations.</p></div></div><button onClick={()=>setTab('you')} className="rounded-lg bg-white/10 px-5 py-2.5 text-sm text-cyan-100">Make it yours</button></div>
  </div>}
  {tab==='you'&&<div className="mb-8"><StorePreferences games={games} genres={genres} preference={preference} onSave={save} saving={saving} error={error}/></div>}
  <section className={overview?'mt-12':''}>
   {tab==='sellers'&&salesData?.complete===false&&<p className="mb-4 text-xs text-white/50">Rankings reflect the most recent 10,000 completed orders within the past 30 days.</p>}
   <div className="mb-6 flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-xl font-semibold">{searchTerm?'Search results':tab==='you'?'Recommended for you':tab==='sellers'?'Top sellers':tab==='new'?'New releases':'Explore all games'}</h2><p role="status" className="mt-1 text-xs text-white/40">{results.length} {results.length===1?'game':'games'}{filtering?' match your filters':''}</p></div>
    <label className="flex items-center gap-2 text-xs text-white/45">Sort by<select value={sort} onChange={e=>setSort(e.target.value)} className="rounded-lg bg-slate-900 px-3 py-2 text-white/75"><option value="discovery">{searchTerm?'Relevance':tab==='sellers'?'Best selling':tab==='new'?'Release date':tab==='you'?'Best match':'Discovery'}</option><option value="new">Release date</option><option value="price">Price: low to high</option><option value="title">Title: A–Z</option></select></label>
   </div>
   {results.length?<div className="grid grid-cols-2 gap-x-5 gap-y-8 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6">{results.slice(0,limit).map(g=><GameCard key={g.id} game={g} onSelect={onNavigateToGame} reason={tab==='you'?reasons.get(g.id):undefined}/>)}</div>:<div className="rounded-2xl bg-white/[0.025] px-6 py-14 text-center"><p className="text-white/60">{tab==='you'?'Select your favorite genres or games above to get started.':tab==='sellers'?(salesError?'Sales rankings could not load.':salesLoading?'Loading rankings…':'No completed purchases in this period yet.'):tab==='new'?'No dated releases match these filters.':'No games match these filters.'}</p>{filtering&&<button onClick={reset} className="mt-4 text-sm text-cyan-200">Clear filters</button>}</div>}
   {results.length>limit&&<div className="mt-8 text-center"><button onClick={()=>setLimit(v=>v+24)} className="rounded-lg bg-white/5 px-6 py-3 text-sm text-white/70">Show more games · {results.length-limit} remaining</button></div>}
  </section>
 </main>;
}

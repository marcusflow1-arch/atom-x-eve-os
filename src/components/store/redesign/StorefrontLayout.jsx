import {useEffect,useMemo,useRef,useState} from 'react';
import {useQuery} from '@tanstack/react-query';
import * as Dialog from '@radix-ui/react-dialog';
import {ArrowRight,RefreshCw,SlidersHorizontal,Sparkles,Trophy,X} from 'lucide-react';
import {base44} from '@/api/base44Client';
import {useAuth} from '@/components/auth/AuthContext';
import {filterGames,genresOf,label,priceOf,queryScore,releaseTime,comingSoon,discoveryOrder,rotateGames,recommendations,uniqueCatalog,buildStoreShelves} from './discovery';
import {GameCard,GameCover,StoreSection,Shelf,DiscoveryHero} from './StoreSections';
import StorePreferences from './StorePreferences';
import StoreFilterRail from './StoreFilterRail';
import {useStorePreferences} from './useStorePreferences';
import './storefront.css';

const initialFilters={genres:[],price:'any',mode:'',availability:'all',hideOwned:false,onSale:false};
const TABS=[['discover','Discover'],['all','All games'],['sellers','Top sellers'],['new','New releases'],['offers','Offers'],['you','For you']];
export default function StorefrontLayout({onNavigateToGame,games=[],searchTerm='',onClearSearch,initialTab='discover'}){
 const {user}=useAuth(),main=useRef(null);
 const [tab,setTab]=useState(TABS.some(t=>t[0]===initialTab)?initialTab:'discover'),[filters,setFilters]=useState(initialFilters),[mobileFilters,setMobileFilters]=useState(false),[sort,setSort]=useState('discovery'),[offset,setOffset]=useState(0),[limit,setLimit]=useState(24);
 const {preference,save,saving,error,playedIds,ownedIds}=useStorePreferences();
 const catalog=useMemo(()=>uniqueCatalog(games,ownedIds),[games,ownedIds]);
 const counts=useMemo(()=>catalog.reduce((all,g)=>{genresOf(g).forEach(genre=>all[genre]=(all[genre]||0)+1);return all;},{}),[catalog]);
 const genres=useMemo(()=>Object.keys(counts).sort(),[counts]);
 const day=new Date().toISOString().slice(0,10);
 useEffect(()=>{try{const key='store-rotation:'+day+':'+(user?.id||'guest');const next=Number(localStorage.getItem(key)||0);setOffset(next);localStorage.setItem(key,String(next+6));}catch{}},[day,user?.id]);
 useEffect(()=>{if(TABS.some(t=>t[0]===initialTab))setTab(initialTab);},[initialTab]);
 const {data:salesData,isLoading:salesLoading,error:salesError}=useQuery({queryKey:['store-sales'],queryFn:async()=>{
  const {data}=await base44.functions.invoke('storeDiscovery',{action:'sales'});if(data.error)throw new Error(data.error);return data;
 },staleTime:300000});
 const discovery=useMemo(()=>rotateGames(discoveryOrder(catalog,day),offset),[catalog,day,offset]);
 const shelves=useMemo(()=>buildStoreShelves(catalog,{day,offset,sales:salesData?.sales}),[catalog,day,offset,salesData]);
 const selected=useMemo(()=>filterGames(discovery,{...filters,query:searchTerm},ownedIds),[discovery,filters,searchTerm,ownedIds]);
 const newGames=useMemo(()=>catalog.filter(g=>releaseTime(g)>0&&!comingSoon(g)).sort((a,b)=>releaseTime(b)-releaseTime(a)),[catalog]);
 const matches=useMemo(()=>recommendations(discovery,preference,playedIds),[discovery,preference,playedIds]);
 const reasons=new Map(matches.map(r=>[r.game.id,r.reason]));
 const filtering=!!searchTerm||filters.genres.length>0||filters.price!=='any'||!!filters.mode||filters.availability!=='all'||filters.hideOwned||filters.onSale;
 const overview=tab==='discover'&&!filtering;
 const availableIds=new Set(selected.map(g=>g.id));
 let results=searchTerm?selected:tab==='sellers'?shelves.sellers.filter(g=>availableIds.has(g.id)):tab==='new'?newGames.filter(g=>availableIds.has(g.id)):tab==='you'?matches.map(r=>r.game).filter(g=>availableIds.has(g.id)):tab==='offers'?selected.filter(g=>priceOf(g)!==null&&priceOf(g)<=25&&!comingSoon(g)):selected;
 results=[...results].sort((a,b)=>sort==='price'?(priceOf(a)??Infinity)-(priceOf(b)??Infinity):sort==='title'?a.title.localeCompare(b.title):sort==='new'?releaseTime(b)-releaseTime(a):searchTerm?queryScore(b,searchTerm)-queryScore(a,searchTerm):0);
 useEffect(()=>setLimit(24),[tab,filters,searchTerm,sort]);
 const update=(key,value)=>setFilters(f=>({...f,[key]:value}));
 const reset=()=>{setFilters(initialFilters);onClearSearch?.();};
 const go=next=>{setTab(next);setSort('discovery');main.current?.scrollTo?.({top:0});};
 const rail=<StoreFilterRail filters={filters} genres={genres} counts={counts} update={update} onReset={reset}/>;
 const chips=[...filters.genres.map(g=>({name:label(g),clear:()=>update('genres',filters.genres.filter(x=>x!==g))})),...(filters.price!=='any'?[{name:filters.price==='free'?'Free to play':'Under $'+filters.price,clear:()=>update('price','any')}]:[]),...(filters.mode?[{name:label(filters.mode),clear:()=>update('mode','')}]:[]),...(filters.availability!=='all'?[{name:filters.availability==='soon'?'Coming soon':'Available now',clear:()=>update('availability','all')}]:[]),...(filters.onSale?[{name:'On sale',clear:()=>update('onSale',false)}]:[]),...(filters.hideOwned?[{name:'Hide owned',clear:()=>update('hideOwned',false)}]:[])];
 return <div className="sf-store">
  <aside className="sf-filter-rail" aria-label="Filter games">{rail}</aside>
  <main className="sf-store-main" ref={main}>
   <nav className="sf-browse-nav" aria-label="Browse the store">{TABS.map(([id,title])=><button key={id} aria-current={tab===id?'page':undefined} onClick={()=>go(id)}>{title}</button>)}
    <Dialog.Root open={mobileFilters} onOpenChange={setMobileFilters}><Dialog.Trigger asChild><button className="sf-mobile-filter"><SlidersHorizontal size={16}/>Filters</button></Dialog.Trigger><Dialog.Portal><Dialog.Overlay className="sf-filter-overlay"/><Dialog.Content className="sf-filter-sheet"><Dialog.Title className="sr-only">Filter games</Dialog.Title><Dialog.Description className="sr-only">Choose genres, a price, and how you want to play.</Dialog.Description><Dialog.Close className="sf-close" aria-label="Close filters"><X size={20}/></Dialog.Close>{rail}<Dialog.Close className="sf-action">Show {results.length} games</Dialog.Close></Dialog.Content></Dialog.Portal></Dialog.Root>
   </nav>
   <div className="sf-store-content">
    {tab==='you'&&<StorePreferences games={catalog} genres={genres} preference={preference} onSave={save} saving={saving} error={error}/>}
    {overview&&<>
     <div className="sf-feature-grid"><DiscoveryHero games={shelves.featured} onSelect={onNavigateToGame}/><aside className="sf-daily-picks"><div className="sf-section-heading"><div><span className="sf-eyebrow">A fresh selection</span><h2>Today's hot picks</h2></div></div><p className="sf-muted">A rotating mix of worlds worth exploring.</p>{shelves.picks.map(game=><button key={game.id} onClick={()=>onNavigateToGame(game.id)}><div><GameCover game={game} wide/></div><span><strong>{game.title}</strong><small>{label(game.genre)}</small></span><ArrowRight size={15}/></button>)}<button className="sf-refresh" onClick={()=>setOffset(value=>value+5)}><RefreshCw size={14}/>Show me something different</button></aside></div>
     <div className="sf-identity-band"><Trophy size={28}/><div><strong>Play the game. Grow your AI counterpart.</strong><p>Explore each game's achievements, abilities, and equipment rewards.</p></div><button onClick={()=>go('all')}>Find your next game<ArrowRight size={16}/></button></div>
     <StoreSection title="What's new" subtitle={shelves.newestType==='releases'?'Explore the latest releases in the catalog.':'Recently added to Atom XE.'} games={shelves.newest} onSelect={onNavigateToGame} onViewAll={()=>go('new')}/>
     <StoreSection title="Great games, smaller prices" subtitle="Current offers, free games, and finds under $25." games={shelves.offers} onSelect={onNavigateToGame} onViewAll={()=>go('offers')}/>
     <section className="sf-section"><div className="sf-section-heading"><div><h2>Browse by genre</h2><p>Go straight to the kind of game you love.</p></div></div><div className="sf-genre-tiles">{genres.slice(0,8).map((g,index)=>{const game=discovery.find(game=>genresOf(game).includes(g));return <button key={g} onClick={()=>{update('genres',[g]);go('all');}}>{game&&<GameCover game={game} wide/>}<span>{label(g)}<small>{counts[g]} games</small></span><b aria-hidden="true">{String(index+1).padStart(2,'0')}</b></button>;})}</div></section>
     <div className="sf-split-shelves"><Shelf title="Top sellers" subtitle="Completed purchases in the last 30 days." games={shelves.sellers} onSelect={onNavigateToGame} onViewAll={()=>go('sellers')} empty={salesLoading?'Loading top sellers…':salesError?'Sales rankings are temporarily unavailable.':'A little early for a ranking. Discover something new below.'}/><Shelf title="A little outside your usual" subtitle="Give a different genre a chance." games={shelves.surprises} onSelect={onNavigateToGame} onViewAll={()=>{setOffset(value=>value+7);go('all');}}/></div>
     <StoreSection title="Free to jump in" subtitle="New adventures with no entry price." games={shelves.free} onSelect={onNavigateToGame} onViewAll={()=>{update('price','free');go('all');}}/>
     <StoreSection title="On the horizon" subtitle="Upcoming games to keep an eye on." games={shelves.upcoming} onSelect={onNavigateToGame} onViewAll={()=>{update('availability','soon');go('all');}}/>
     <div className="sf-preference-banner"><Sparkles size={25}/><div><h2>A store that gets to know your taste.</h2><p>Choose favorite genres and games you've played.</p></div><button className="sf-action" onClick={()=>go('you')}>Personalize your picks<ArrowRight size={15}/></button></div>
    </>}
    <section className="sf-section sf-results" aria-label="Game results"><div className="sf-section-heading"><div><h2>{searchTerm?'Results for “'+searchTerm+'”':overview?'More to discover':TABS.find(t=>t[0]===tab)?.[1]}</h2><p role="status">{results.length} {results.length===1?'game matches':'games match'} {filtering?'your filters':'your selection'}</p></div><label className="sf-sort">Sort by<select value={sort} onChange={e=>setSort(e.target.value)}><option value="discovery">{tab==='sellers'?'Most purchased':tab==='you'?'Best matches':'Discoveries'}</option><option value="new">Newest releases</option><option value="price">Price: low to high</option><option value="title">Title: A–Z</option></select></label></div>
     {filtering&&<div className="sf-filter-chips">{searchTerm&&<button onClick={onClearSearch}>“{searchTerm}”<X size={13}/></button>}{chips.map(chip=><button key={chip.name} onClick={chip.clear}>{chip.name}<X size={13}/></button>)}<button className="sf-clear" onClick={reset}>Clear all</button></div>}
     {results.length?<div className="sf-card-grid">{results.slice(0,limit).map(game=><GameCard key={game.id} game={game} onSelect={onNavigateToGame} reason={tab==='you'&&!searchTerm?reasons.get(game.id):null}/>)}</div>:<div className="sf-empty"><h3>{tab==='you'&&!filtering?'Choose what you enjoy.':tab==='sellers'&&!filtering?'No purchase rankings yet.':'No games match these filters.'}</h3><p>{tab==='you'?'Save your preferences above to discover games for you.':'Try another genre or widen your filters.'}</p><button onClick={reset}>Reset filters</button></div>}
     {results.length>limit&&<button className="sf-load-more" onClick={()=>setLimit(value=>value+24)}>Show more games</button>}
    </section>
   </div>
  </main>
 </div>;
}

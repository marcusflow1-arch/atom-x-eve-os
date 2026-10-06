import {useEffect,useMemo,useRef,useState} from 'react';
import {useQuery} from '@tanstack/react-query';
import {ArrowRight,ChevronLeft,ChevronRight,Gamepad2,SlidersHorizontal,Sparkles,X} from 'lucide-react';
import {base44} from '@/api/base44Client';
import {useAuth} from '@/components/auth/AuthContext';
import {filterGames,genresOf,label,priceOf,queryScore,releaseTime,comingSoon,discoveryOrder,rotateGames,recommendations,uniqueCatalog} from './discovery';
import {CompactGameCard,CompactHero,CompactShelf,TopSeven,isDemo,newestArrivals,releaseOrder} from './CompactStoreSections';
import StorePreferences from './StorePreferences';
import {useStorePreferences} from './useStorePreferences';
import './compact-store.css';

const initialFilters={genres:[],price:'any',mode:'',availability:'all',hideOwned:false,onSale:false};
const TABS=[['discover','Discover'],['all','All games'],['sellers','Top sellers'],['new','New releases'],['demos','Demos'],['you','For you']];
const PAGE_SIZE=15;
export default function StorefrontLayout({onNavigateToGame,games=[],searchTerm='',onClearSearch}){
 const {user}=useAuth(),{preference,save,saving,error,playedIds,ownedIds}=useStorePreferences();
 const [tab,setTab]=useState('discover'),[filters,setFilters]=useState(initialFilters),[showFilters,setShowFilters]=useState(false),[sort,setSort]=useState('discovery'),[offset,setOffset]=useState(0),[page,setPage]=useState(0);
 const viewport=useRef(null);
 const catalog=useMemo(()=>uniqueCatalog(games,ownedIds),[games,ownedIds]);
 const genres=useMemo(()=>[...new Set(catalog.flatMap(genresOf))].sort(),[catalog]);
 const day=new Date().toISOString().slice(0,10);
 useEffect(()=>{try{const key='store-rotation:'+day+':'+(user?.id||'guest');const value=Number(localStorage.getItem(key)||0);setOffset(value);localStorage.setItem(key,String(value+7));}catch{}},[day,user?.id]);
 const sales=useQuery({queryKey:['store-sales'],queryFn:async()=>{const {data}=await base44.functions.invoke('storeDiscovery',{action:'sales'});if(data.error)throw new Error(data.error);return data;},staleTime:300000});
 const discovery=useMemo(()=>rotateGames(discoveryOrder(catalog,day),offset),[catalog,day,offset]);
 const purchases=game=>(game.catalog_ids||[game.id]).reduce((total,id)=>total+Number(sales.data?.sales?.[id]||0),0);
 const sellers=catalog.filter(g=>purchases(g)>0&&!comingSoon(g)).sort((a,b)=>purchases(b)-purchases(a));
 const newGames=useMemo(()=>releaseOrder(catalog),[catalog]),demos=useMemo(()=>catalog.filter(isDemo),[catalog]),arrivals=useMemo(()=>newestArrivals(catalog),[catalog]);
 const matches=useMemo(()=>recommendations(discovery,preference,playedIds),[discovery,preference,playedIds]);
 const selected=filterGames(discovery,{...filters,query:searchTerm},ownedIds),availableIds=new Set(selected.map(g=>g.id));
 const filtering=!!searchTerm.trim()||filters.genres.length>0||filters.price!=='any'||!!filters.mode||filters.availability!=='all'||filters.hideOwned||filters.onSale;
 const overview=tab==='discover'&&!filtering;
 const reasons=new Map(matches.map(r=>[r.game.id,r.reason]));
 const pools={sellers,new:newGames,demos,you:matches.map(r=>r.game),arrivals};
 let results=searchTerm.trim()?selected:(pools[tab]||selected).filter(g=>availableIds.has(g.id));
 results=[...results].sort((a,b)=>sort==='price'?(priceOf(a)??Infinity)-(priceOf(b)??Infinity):sort==='title'?a.title.localeCompare(b.title):sort==='new'?releaseTime(b)-releaseTime(a):searchTerm?queryScore(b,searchTerm)-queryScore(a,searchTerm):0);
 const pageCount=Math.max(1,Math.ceil(results.length/PAGE_SIZE)),currentPage=Math.min(page,pageCount-1);
 useEffect(()=>{setPage(0);viewport.current?.scrollTo?.({top:0});},[tab,filters,searchTerm,sort]);
 const update=(key,value)=>setFilters(f=>({...f,[key]:value}));
 const toggleGenre=g=>update('genres',filters.genres.includes(g)?filters.genres.filter(x=>x!==g):[...filters.genres,g]);
 const reset=()=>{setFilters(initialFilters);onClearSearch?.();};
 const goPage=next=>{setPage(next);viewport.current?.scrollTo?.({top:0});};
 const resultTitle=searchTerm?'Search results':({you:'Recommended for you',sellers:'Top sellers',new:'New releases',demos:'Playable demos',arrivals:'New to the store'}[tab]||'Explore all games');
 return <main className="sf-store" data-testid="store-discovery">
  <header className="sf-nav"><nav aria-label="Store sections">{TABS.map(([id,title])=><button key={id} aria-current={tab===id?'page':undefined} onClick={()=>setTab(id)}>{title}</button>)}</nav><button className="sf-filter-toggle" aria-expanded={showFilters} aria-controls="store-filters" onClick={()=>setShowFilters(v=>!v)}><SlidersHorizontal size={14}/>Filters{filtering&&<i/>}</button></header>
  <div className="sf-layout">
   <aside id="store-filters" className="sf-filters" data-open={showFilters} aria-label="Filter games"><div className="sf-filter-title"><span>Browse by genre</span><button aria-label="Close filters" onClick={()=>setShowFilters(false)}><X size={15}/></button></div>
    <fieldset><legend className="sr-only">Genres · match any selected genre</legend>{genres.map(g=><button key={g} aria-label={label(g)} aria-pressed={filters.genres.includes(g)} onClick={()=>toggleGenre(g)}><span>{label(g)}</span><i>{catalog.filter(game=>genresOf(game).includes(g)).length}</i></button>)}</fieldset>
    <div className="sf-filter-group"><label>Price<select value={filters.price} onChange={e=>update('price',e.target.value)}><option value="any">Any price</option><option value="free">Free to play</option><option value="10">$10 or less</option><option value="25">$25 or less</option><option value="50">$50 or less</option></select></label><label>Play style<select value={filters.mode} onChange={e=>update('mode',e.target.value)}><option value="">Any play style</option><option>Single player</option><option>Co-op</option><option>Multiplayer</option></select></label><label>Availability<select value={filters.availability} onChange={e=>update('availability',e.target.value)}><option value="all">All games</option><option value="available">Available now</option><option value="soon">Coming soon</option></select></label><label className="sf-check"><input type="checkbox" checked={filters.onSale} onChange={e=>update('onSale',e.target.checked)}/>On sale</label><label className="sf-check"><input type="checkbox" checked={filters.hideOwned} onChange={e=>update('hideOwned',e.target.checked)}/>Hide games I own</label><button className="sf-text-button" onClick={reset}>Reset filters</button></div>
    <a className="sf-studio-link" href="/Store?mode=devcards"><Sparkles size={15}/><span>Meet the creators<small>Studio updates & upcoming projects</small></span><ArrowRight size={13}/></a>
   </aside>
   <div ref={viewport} className="sf-viewport">
    {filtering&&<div className="sf-active-filters">{searchTerm&&<span>Search: {searchTerm}</span>}{filters.genres.map(g=><button key={g} onClick={()=>toggleGenre(g)}>{label(g)}<X size={11}/></button>)}<button onClick={reset}>Clear all</button></div>}
    {overview?<div className="sf-overview"><div className="sf-feature-row"><CompactHero games={discovery.filter(g=>!comingSoon(g)).slice(0,7)} onSelect={onNavigateToGame}/><TopSeven ranked={sellers} discovery={discovery.filter(g=>!comingSoon(g))} onSelect={onNavigateToGame} onViewAll={()=>setTab('sellers')} salesLoading={sales.isLoading} salesError={sales.error}/></div>
      <CompactShelf title="New releases" subtitle="Latest releases in the catalog" games={newGames} onSelect={onNavigateToGame} onViewAll={()=>setTab('new')} empty="Release dates will appear here when they are added."/>
      <div className="sf-paired-shelves"><CompactShelf title="Demos" subtitle="Try something before you commit" games={demos.slice(0,3)} onSelect={onNavigateToGame} onViewAll={()=>setTab('demos')} demo empty="No playable demos have been published yet. New demos will appear here."/><CompactShelf title="New to the store" subtitle="Recently added to the catalog" games={arrivals.slice(0,3)} onSelect={onNavigateToGame} onViewAll={()=>setTab('arrivals')} empty="New additions will appear here as games arrive."/></div>
      <CompactShelf title="Worth discovering" subtitle="A different mix from across the catalog" games={rotateGames(discovery,7,6)} onSelect={onNavigateToGame} onRotate={()=>setOffset(value=>value+7)}/>
      <div className="sf-overview-footer"><span><Gamepad2 size={16}/>{catalog.length.toLocaleString()} games to explore</span><button onClick={()=>setTab('all')}>Browse the full catalog<ArrowRight size={14}/></button><button onClick={()=>setTab('you')}><Sparkles size={14}/>Make it yours</button></div>
    </div>:<>
      {tab==='you'&&<StorePreferences games={catalog} genres={genres} preference={preference} onSave={save} saving={saving} error={error}/>}
      <section className="sf-results" aria-label={resultTitle}><header><div><h1>{resultTitle}</h1><p role="status">{results.length} {results.length===1?'game':'games'}{filtering?' match your filters':''}{results.length>0&&<span> · Showing {currentPage*PAGE_SIZE+1}–{Math.min((currentPage+1)*PAGE_SIZE,results.length)}</span>}</p></div><label>Sort by<select aria-label="Sort games" value={sort} onChange={e=>setSort(e.target.value)}><option value="discovery">{searchTerm?'Relevance':tab==='sellers'?'Best selling':tab==='new'?'Release date':tab==='you'?'Best match':'Discovery'}</option><option value="new">Release date</option><option value="price">Price: low to high</option><option value="title">Title: A–Z</option></select></label></header>
       {tab==='sellers'&&sales.data?.complete===false&&<p className="sf-note">Rankings use the most recent completed orders in the past 30 days.</p>}
       {results.length?<div className="sf-game-grid">{results.slice(currentPage*PAGE_SIZE,(currentPage+1)*PAGE_SIZE).map(g=><CompactGameCard key={g.id} game={g} onSelect={onNavigateToGame} reason={tab==='you'?reasons.get(g.id):undefined} demo={tab==='demos'&&isDemo(g)}/>)}</div>:<div className="sf-empty"><Gamepad2 size={26}/><h2>{tab==='demos'?'No playable demos yet':tab==='sellers'?(sales.error?'Sales rankings are unavailable':sales.isLoading?'Loading rankings…':'No completed purchases yet'):tab==='you'?'Choose your favorite genres above':'No games match these filters.'}</h2><p>{tab==='demos'?'Demos appear when a playable demo link is published.':'Try a different filter or explore another section.'}</p>{filtering&&<button onClick={reset}>Clear filters</button>}</div>}
       {pageCount>1&&<nav className="sf-pagination" aria-label="Game results pages"><button disabled={currentPage===0} onClick={()=>goPage(currentPage-1)}><ChevronLeft size={15}/>Previous</button><span>Page {currentPage+1} of {pageCount}</span><button disabled={currentPage>=pageCount-1} onClick={()=>goPage(currentPage+1)}>Next<ChevronRight size={15}/></button></nav>}
      </section>
    </>}
   </div>
  </div>
 </main>;
}

import {useEffect,useMemo,useRef,useState} from 'react';
import {useSearchParams} from 'react-router-dom';
import {ArrowRight,ArrowUpRight,Building2,ChevronLeft,ChevronRight,Edit3,Search,SlidersHorizontal,X} from 'lucide-react';
import {GameCover} from './redesign/StoreSections';
import {discoveryOrder,label,normalize} from './redesign/discovery';
import {useStudioHub} from './devstore/useStudioHub';
import {filterStudios,firstLetter} from './devstore/studioDiscovery';
import {ProjectCard,StudioCard,StudioComposer,StudioFeed,StudioLogo} from './devstore/StudioHubParts';
import StudioHubProfile from './devstore/StudioHubProfile';
import './devstore/studio-hub.css';

export default function DevCardsContent({onNavigateToGame}){
 const hub=useStudioHub(),[params,setParams]=useSearchParams();
 const selectedKey=params.get('studio')||'';
 const [view,setView]=useState('discover'),[query,setQuery]=useState(''),[letter,setLetter]=useState('all'),[genre,setGenre]=useState('all'),[status,setStatus]=useState('all'),[sort,setSort]=useState('az'),[page,setPage]=useState(0),[filtersOpen,setFiltersOpen]=useState(false),[composer,setComposer]=useState(null),[featureIndex,setFeatureIndex]=useState(0);
 const scroll=useRef(null),scrollPositions=useRef(new Map()),focusReturn=useRef(null);
 const studios=hub.studios,editable=hub.editableStudios;
 const selected=studios.find(s=>s.key===selectedKey);
 const genres=useMemo(()=>[...new Set(studios.flatMap(s=>s.genres).map(normalize))].sort(),[studios]);
 const letters=new Set(studios.map(firstLetter));
 const filtered=useMemo(()=>filterStudios(studios,{query,letter,genre,status,sort}),[studios,query,letter,genre,status,sort]);
 const projects=useMemo(()=>filtered.flatMap(studio=>studio.projects.map(project=>({studio,project}))),[filtered]);
 const featured=useMemo(()=>discoveryOrder(studios.flatMap(studio=>studio.projects.map(project=>({id:project.key,genre:project.genre,studio,project}))),new Date().toISOString().slice(0,10)).slice(0,8),[studios]);
 const feature=featured[featureIndex%Math.max(1,featured.length)];
 const filtering=Boolean(query.trim()||letter!=='all'||genre!=='all'||status!=='all');
 const directory=view==='directory'||filtering;
 const items=view==='projects'?projects:filtered;
 const pageCount=Math.max(1,Math.ceil(items.length/15)),activePage=Math.min(page,pageCount-1);
 useEffect(()=>{setPage(0);if(!selectedKey)scroll.current?.scrollTo?.({top:0});},[query,letter,genre,status,sort,view]);
 useEffect(()=>{if(scroll.current)scroll.current.scrollTop=scrollPositions.current.get(selectedKey)||0;},[selectedKey]);
 const openStudio=key=>{focusReturn.current=document.activeElement;const next=new URLSearchParams(params);next.set('mode','devcards');next.set('studio',key);setParams(next);setComposer(null);};
 const back=()=>{const next=new URLSearchParams(params);next.delete('studio');setParams(next);setComposer(null);requestAnimationFrame(()=>focusReturn.current?.isConnected&&focusReturn.current.focus());};
 const compose=initial=>{setComposer(initial);scroll.current?.scrollTo?.({top:0,behavior:'smooth'});};
 const clear=()=>{setQuery('');setLetter('all');setGenre('all');setStatus('all');};
 const goPage=next=>{setPage(next);scroll.current?.scrollTo?.({top:0});};
 useEffect(()=>{const escape=event=>{if(event.key!=='Escape')return;if(composer){setComposer(null);event.stopPropagation();}else if(selectedKey){back();event.stopPropagation();}else setFiltersOpen(false);};window.addEventListener('keydown',escape);return()=>window.removeEventListener('keydown',escape);},[composer,selectedKey,params]);
 const paging=pageCount>1&&<nav className="dev-pagination" aria-label={view==='projects'?'Project pages':'Studio directory pages'}><button disabled={activePage===0} onClick={()=>goPage(activePage-1)}><ChevronLeft size={14}/>Previous</button><span>Page {activePage+1} of {pageCount}</span><button disabled={activePage+1>=pageCount} onClick={()=>goPage(activePage+1)}>Next<ChevronRight size={14}/></button></nav>;
 return <main className="dev-hub" aria-label="Developer studios">
  <header className="dev-hub-header"><div><Building2 size={20}/><span><strong>Dev</strong><small>Meet the minds behind the games</small></span></div><nav aria-label="Developer discovery sections">{[['discover','Discover'],['projects','In development'],['directory','Studios A–Z']].map(([key,name])=><button key={key} aria-current={!selectedKey&&view===key?'page':undefined} onClick={()=>{if(selectedKey)back();setView(key);}}>{name}</button>)}</nav><button className="dev-mobile-filters" aria-expanded={filtersOpen} aria-controls="dev-directory-filters" onClick={()=>setFiltersOpen(v=>!v)}><SlidersHorizontal size={15}/>Find a studio</button>{editable.length>0&&<button className="dev-publish-shortcut" onClick={()=>compose({studio_key:editable.includes(selectedKey)?selectedKey:editable[0]})}><Edit3 size={14}/>Write update</button>}</header>
  <div className="dev-hub-layout">
   <aside id="dev-directory-filters" className="dev-filters" data-open={filtersOpen}>
    <div className="dev-filter-heading"><span>Find your studio</span><button aria-label="Close studio filters" onClick={()=>setFiltersOpen(false)}><X size={14}/></button></div>
    <label className="dev-search"><Search size={15}/><input aria-label="Search studios and projects" placeholder="Studio or game name" value={query} onChange={e=>{if(selectedKey)back();setQuery(e.target.value);}}/>{query&&<button aria-label="Clear studio search" onClick={()=>setQuery('')}><X size={12}/></button>}</label>
    <div className="dev-alphabet" aria-label="Browse studios by initial">{['all','#',...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'].map(char=><button key={char} aria-label={char==='all'?'All studio initials':'Studios starting with '+char} aria-pressed={letter===char} disabled={char!=='all'&&!letters.has(char)} onClick={()=>{if(selectedKey)back();setLetter(char);}}>{char==='all'?'All':char}</button>)}</div>
    <label>Genre<select aria-label="Filter studios by genre" value={genre} onChange={e=>{if(selectedKey)back();setGenre(e.target.value);}}><option value="all">All genres</option>{genres.map(g=><option key={g} value={g}>{label(g)}</option>)}</select></label>
    <label>Studio activity<select aria-label="Filter studio activity" value={status} onChange={e=>{if(selectedKey)back();setStatus(e.target.value);}}><option value="all">All studios</option><option value="projects">Projects in development</option><option value="games">Games in the store</option></select></label>
    <label>Sort studios<select aria-label="Sort studios" value={sort} onChange={e=>setSort(e.target.value)}><option value="az">Name: A–Z</option><option value="za">Name: Z–A</option><option value="projects">Most current projects</option></select></label>
    {filtering&&<button className="dev-text-button" onClick={clear}>Clear studio filters</button>}
    <div className="dev-directory-count"><strong>{studios.length}</strong><span>studios to discover</span></div><p className="dev-source-note">Studio profiles, linked games and published updates from the Atom X Eve catalog.</p>
   </aside>
   <div className="dev-viewport" ref={scroll} onScroll={e=>scrollPositions.current.set(selectedKey,e.currentTarget.scrollTop)}>
    {hub.isLoading?<div className="dev-empty" role="status">Loading studios and projects…</div>:hub.isError?<div className="dev-empty" role="alert"><h2>The studio directory couldn’t load.</h2><p>{hub.error?.message}</p><button className="dev-primary" onClick={()=>hub.refetch()}>Try again</button></div>:<>
     {composer&&<StudioComposer key={composer.id||composer.studio_key} initial={composer} studios={studios.filter(s=>editable.includes(s.key))} onClose={()=>setComposer(null)}/>}
     {selectedKey?(selected?<StudioHubProfile key={selected.key} studio={selected} studios={studios} editableStudios={editable} onBack={back} onSelectStudio={openStudio} onNavigateToGame={onNavigateToGame} onCompose={compose}/>:<div className="dev-empty"><h2>Studio not found</h2><button onClick={back}>Back to the directory</button></div>):view==='projects'?<>
      <header className="dev-section-heading"><div><span className="dev-eyebrow">A look at what’s next</span><h1>In development</h1><p>{projects.length} current and upcoming projects</p></div></header><div className="dev-project-grid">{projects.slice(activePage*15,(activePage+1)*15).map(({project,studio})=><ProjectCard key={project.key} project={project} studio={studio} onSelectStudio={openStudio} onNavigateToGame={onNavigateToGame}/>)}</div>{paging}{!projects.length&&<div className="dev-empty">No projects match these filters.</div>}
     </>:directory?<>
      <header className="dev-section-heading"><div><span className="dev-eyebrow">The people behind the worlds</span><h1>Studio directory</h1><p role="status">{filtered.length} studios{filtering?' match your filters':''}</p></div><span>{sort==='za'?'Z → A':sort==='projects'?'Current projects':'A → Z'}</span></header><div className="dev-studio-grid">{filtered.slice(activePage*15,(activePage+1)*15).map(studio=><StudioCard key={studio.key} studio={studio} onSelect={openStudio}/>)}</div>{paging}{!filtered.length&&<div className="dev-empty"><Search size={26}/><h2>No studios match.</h2><p>Try another name, initial or genre.</p><button onClick={clear}>Clear studio filters</button></div>}
     </>:<div className="dev-discover">
      <div className="dev-discovery-intro"><div><span className="dev-eyebrow">Inside the studio</span><h1>See what’s taking shape.</h1><p>Follow the projects, meet their creators, and find your next world.</p></div><button className="dev-text-button" onClick={()=>setView('directory')}>Browse studios A–Z<ArrowRight size={14}/></button></div>
      <div className="dev-spotlight-row">{feature?<section className="dev-project-spotlight"><div className="dev-spotlight-art"><GameCover game={{cover_image:feature.project.image||feature.studio.cover}} wide/></div><div className="dev-spotlight-shade"/><div className="dev-spotlight-copy"><button onClick={()=>openStudio(feature.studio.key)}><StudioLogo studio={feature.studio}/>{feature.studio.name}<ArrowUpRight size={12}/></button><span>{label(feature.project.status)}</span><h2>{feature.project.title}</h2><p>{feature.project.description}</p><button className="dev-primary" onClick={()=>openStudio(feature.studio.key)}>Explore the studio<ArrowRight size={14}/></button></div>{featured.length>1&&<div className="dev-spotlight-controls"><button aria-label="Previous studio spotlight" onClick={()=>setFeatureIndex(i=>(i-1+featured.length)%featured.length)}><ChevronLeft size={15}/></button><span>{featureIndex%featured.length+1} / {featured.length}</span><button aria-label="Next studio spotlight" onClick={()=>setFeatureIndex(i=>(i+1)%featured.length)}><ChevronRight size={15}/></button></div>}</section>:<div className="dev-empty"><Building2 size={28}/><h2>Discover the studios in your library.</h2><p>Upcoming projects will be featured as studios add them.</p></div>}
       <section className="dev-studios-to-know"><header className="dev-section-heading"><h2>Studios to know</h2></header>{(feature?[feature.studio,...studios.filter(s=>s.key!==feature.studio.key)]:studios).slice(0,4).map(studio=><button key={studio.key} onClick={()=>openStudio(studio.key)}><StudioLogo studio={studio}/><span><strong>{studio.name}</strong><small>{studio.games.length} store titles · {studio.projects.length} projects</small></span><ArrowRight size={14}/></button>)}<button className="dev-text-button" onClick={()=>setView('directory')}>All {studios.length} studios<ArrowRight size={13}/></button></section>
      </div>
      <div className="dev-discover-columns"><StudioFeed studios={studios} editableStudios={editable} onSelectStudio={openStudio} onNavigateToGame={onNavigateToGame} onCompose={compose}/><aside><header className="dev-section-heading"><div><h2>On the horizon</h2><p>From the studio catalog</p></div></header>{featured.slice(0,4).map(({project,studio})=><ProjectCard key={project.key} project={project} studio={studio} onSelectStudio={openStudio} onNavigateToGame={onNavigateToGame} compact/>)}<button className="dev-text-button" onClick={()=>setView('projects')}>All projects<ArrowRight size={13}/></button></aside></div>
     </div>}
    </>}
   </div>
  </div>
 </main>;
}

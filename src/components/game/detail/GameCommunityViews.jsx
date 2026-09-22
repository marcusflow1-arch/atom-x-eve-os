import {useState} from 'react';
import {useQuery} from '@tanstack/react-query';
import {useNavigate} from 'react-router-dom';
import {ArrowUpRight,Building2,Radio,Play,Gamepad2} from 'lucide-react';
import {base44} from '@/api/base44Client';
import {useStoreCatalog} from '@/components/store/redesign/useStoreCatalog';
import {GameCard} from '@/components/store/redesign/StoreSections';
import {comingSoon,normalize,uniqueCatalog} from '@/components/store/redesign/discovery';
import {mediaUrl,trailerSource} from './gameDetailData';
import GameImage from './GameImage';

const rows=response=>{const data=response?.data||response;if(!Array.isArray(data))throw new Error('Invalid response');return data;};
function usePublishedStudio(game){
 return useQuery({queryKey:['published-studio',game.id,game.developer],queryFn:async()=>{
  if(game.developer){const profiles=rows(await base44.entities.StudioProfile.filter({developer_name:game.developer},'-updated_date',1));if(profiles[0])return profiles[0];}
  return rows(await base44.entities.StudioProfile.filter({game_key:game.title.toLowerCase().trim()},'-updated_date',1))[0]||null;
 },staleTime:300000});
}
function LoadState({loading,error,retry,children}){
 if(loading)return <p className="gd-muted" role="status">Loading…</p>;
 if(error)return <div className="gd-empty" role="alert"><p>This section couldn't load.</p><button className="gd-text-button" onClick={retry}>Try again</button></div>;
 return children;
}
export function StudioGameViews({game,view}){
 const profile=usePublishedStudio(game),catalog=useStoreCatalog(),navigate=useNavigate();
 const studio=profile.data,developer=studio?.developer_name||game.developer||game.studio;
 const names=new Set((studio?.notable_games||[]).map(g=>normalize(g.title)));
 const releases=uniqueCatalog((catalog.data||[]).filter(g=>g.id===game.id||developer&&normalize(g.developer||g.studio)===normalize(developer)||names.has(normalize(g.title))));
 const currentProjects=releases.filter(g=>comingSoon(g));
 const profileProjects=Array.isArray(studio?.upcoming_projects)?studio.upcoming_projects.filter(project=>project?.title||project?.name):[];
 const missingTitles=(studio?.notable_games||[]).filter(title=>!releases.some(g=>normalize(g.title)===normalize(title.title)));
 const projects=[...currentProjects.map(project=>({title:project.title,description:project.description,id:project.id})),...profileProjects.filter(project=>!currentProjects.some(g=>normalize(g.title)===normalize(project.title||project.name)))];
 const open=id=>navigate('/GameDetail?id='+encodeURIComponent(id)+'&from=store');
 return <section className="gd-community-view" aria-label={view==='games'?'Games by this studio':'Studio information'}>
  <div className="gd-section-heading"><div><span className="gd-eyebrow">{view==='games'?'The studio catalog':'Behind the game'}</span><h2>{developer||'The studio behind '+game.title}</h2><p>{view==='games'?'Explore the studio’s games.':'Meet the creators and see what they’re working on.'}</p></div><Building2 size={26}/></div>
  <LoadState loading={profile.isLoading||catalog.isLoading} error={profile.error||catalog.error} retry={()=>{profile.refetch();catalog.refetch();}}>
   {view==='games'?<>
    {!developer&&!names.size&&<p className="gd-muted gd-published-note">The studio hasn't been linked yet. Currently showing this game.</p>}
    <div className="sf-card-grid">{releases.map(g=><GameCard key={g.id} game={g} onSelect={open}/>)}</div>
    {!!missingTitles.length&&<div className="gd-studio-other"><h3>More from the studio</h3><p className="gd-muted">Listed in the studio profile; not currently available in this store.</p>{missingTitles.map((title,index)=><div key={title.title+index}><Gamepad2 size={17}/><strong>{title.title}</strong>{title.year&&<span>{title.year}</span>}</div>)}</div>}
   </>:<>
    <div className="gd-studio-summary"><div>{studio?.logo_url&&<GameImage src={studio.logo_url} alt={developer+' logo'} className="gd-studio-logo"/>}<p className="gd-description">{studio?.description||'The studio has not published its overview yet.'}</p>{mediaUrl(studio?.website)&&<a className="gd-text-button" href={mediaUrl(studio.website)} target="_blank" rel="noopener noreferrer">Visit studio website<ArrowUpRight size={14}/></a>}</div><dl>{[['Founded',studio?.founded_year],['Headquarters',studio?.headquarters],['Team',studio?.employees],['Parent company',studio?.parent_company]].filter(([,value])=>value).map(([name,value])=><div key={name}><dt>{name}</dt><dd>{value}</dd></div>)}</dl></div>
    <div className="gd-section-heading"><div><h2>In the works</h2><p>Current and upcoming projects published by this studio.</p></div></div>
    {projects.length?<div className="gd-project-grid">{projects.map((project,index)=><article key={project.id||project.title||index}><small>{project.status||'In development'}</small><h3>{project.title||project.name}</h3>{project.description&&<p>{project.description}</p>}{project.id&&<button className="gd-text-button" onClick={()=>open(project.id)}>Explore project<ArrowUpRight size={14}/></button>}</article>)}</div>:<p className="gd-muted">No upcoming projects have been published here yet.</p>}
   </>}
  </LoadState>
 </section>;
}

function Broadcast({url,title,poster}){
 const [playing,setPlaying]=useState(false),[failed,setFailed]=useState(false);
 const source=trailerSource(url);if(!source)return null;
 return <div className="gd-broadcast">
  {playing&&!failed&&source.kind==='embed'?<iframe src={source.url} title={title} allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowFullScreen/>:playing&&!failed&&source.kind==='video'?<video controls autoPlay playsInline src={source.url} onError={()=>setFailed(true)}/>:<><GameImage src={poster} alt=""/>{source.kind==='external'||failed?<a href={source.url} target="_blank" rel="noopener noreferrer"><ArrowUpRight size={22}/>Open broadcast</a>:<button onClick={()=>setPlaying(true)}><Play size={25}/>Watch broadcast</button>}</>}
 </div>;
}
export function GameStreams({game}){
 const {data:streams=[],isLoading,error,refetch}=useQuery({queryKey:['game-live-streams',game.id,game.title],queryFn:async()=>{
  const responses=await Promise.all([base44.entities.Stream.filter({game_id:game.id,is_live:true},'-started_at',100),base44.entities.AuraStream.filter({game_id:game.id,is_live:true},'-started_at',100)]);
  const streams=responses.flatMap(rows);
  // The two stream catalogs can reference the same broadcast.
  return [...new Map(streams.map(stream=>[(stream.streamer_id||stream.id)+'|'+(stream.playback_url||stream.video_url||stream.id),stream])).values()];
 },refetchInterval:60000,staleTime:30000});
 const [selectedId,setSelectedId]=useState(null);
 const selected=streams.find(stream=>stream.id===selectedId)||streams[0];
 const official=mediaUrl(game.stream_url||game.live_stream_url);
 const selectedUrl=selected?mediaUrl(selected.playback_url||selected.video_url):official;
 return <section className="gd-community-view" aria-label="Game streams"><div className="gd-section-heading"><div><span className="gd-eyebrow">Watch this world in motion</span><h2>{game.title} streams</h2><p>Live channels playing this game.</p></div><Radio size={26}/></div>
  <LoadState loading={isLoading} error={error} retry={refetch}>
   {streams.length||official?<div className="gd-stream-grid"><div>{selectedUrl?<Broadcast key={selected?.id||official} url={selectedUrl} title={selected?.title||game.title+' broadcast'} poster={selected?.thumbnail_url||selected?.preview_image_url||game.banner_image||game.cover_image}/>:<div className="gd-empty"><Radio size={25}/><p>This channel hasn't published a playback URL yet.</p></div>}<h3>{selected?.title||'Official broadcast'}</h3>{selected&&<p className="gd-muted">Live · {Number(selected.viewer_count||0).toLocaleString()} watching</p>}</div><div className="gd-stream-list">{streams.map(stream=><button key={stream.id} aria-pressed={selected?.id===stream.id} onClick={()=>setSelectedId(stream.id)}><Radio size={17}/><span><strong>{stream.title}</strong><small>{Number(stream.viewer_count||0).toLocaleString()} watching</small></span></button>)}</div></div>:<div className="gd-empty"><Radio size={28}/><h3>No live streams right now.</h3><p>Streams will appear when a creator goes live with {game.title}.</p><button className="gd-text-button" onClick={()=>refetch()}>Check again</button></div>}
  </LoadState>
 </section>;
}

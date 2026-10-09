import { useEffect, useMemo, useRef, useState } from 'react';
import { Camera, Circle, Download, Gamepad2, Image, Search, Sparkles, Square, Upload, Video, Flag } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/components/auth/AuthContext';
import { captureLiveMoment, downloadRecordDraft, formatTime, privateUrl, restoreRecordDraft, reviewMoment, saveMoment, saveRecordDraft, startRecording, stopRecording, supportsCapture, useRecordsCapture } from './recordsCapture';
import './records.css';

function PrivateImage({uri,alt='',...props}){
  const [url,setUrl]=useState('');
  useEffect(()=>{let live=true;setUrl('');if(uri)privateUrl(uri).then(value=>{if(live)setUrl(value);}).catch(()=>{});return()=>{live=false;};},[uri]);
  return url?<img src={url} alt={alt} {...props}/>:<div className="records-image-placeholder"><Image size={20}/></div>;
}
export default function RecordsWorkspace(){
  const {user}=useAuth(),capture=useRecordsCapture(),video=useRef(null),upload=useRef(null);
  const [records,setRecords]=useState([]),[selectedId,setSelectedId]=useState(''),[moments,setMoments]=useState([]);
  const [game,setGame]=useState(''),[catalog,setCatalog]=useState([]),[filterGame,setFilterGame]=useState('all'),[search,setSearch]=useState('');
  const [tab,setTab]=useState('all'),[momentId,setMomentId]=useState(''),[ai,setAi]=useState(false);
  const [url,setUrl]=useState(''),[busy,setBusy]=useState(''),[error,setError]=useState(''),[loading,setLoading]=useState(true),[tick,setTick]=useState(0),[limit,setLimit]=useState(100);
  const [position,setPosition]=useState(0),[duration,setDuration]=useState(0);
  const ownCapture=capture.record?.user_id===user?.id,capturing=ownCapture&&capture.active;
  const record=records.find(row=>row.id===selectedId),moment=moments.find(row=>row.id===momentId);
  const refresh=()=>setTick(value=>value+1);
  useEffect(()=>{restoreRecordDraft(user?.id);},[user?.id]);
  useEffect(()=>{
    let live=true;
    if(!user?.id){setLoading(false);setRecords([]);return;}
    setLoading(true);
    base44.entities.GameplayRecord.filter({user_id:user.id},'-captured_at',limit).then(rows=>{
      if(!live)return;setRecords(rows||[]);setSelectedId(prior=>prior&&rows.some(r=>r.id===prior)?prior:rows[0]?.id||'');
    }).catch(e=>{if(live)setError(e.message||'Your records could not load.');}).finally(()=>{if(live)setLoading(false);});
    return()=>{live=false;};
  },[user?.id,capture.revision,tick,limit]);
  useEffect(()=>{
    let live=true;
    base44.entities.Game.list('title',1000).then(rows=>{if(live)setCatalog(rows||[]);}).catch(()=>{});
    return()=>{live=false;};
  },[]);
  useEffect(()=>{
    let live=true;setMoments([]);
    if(selectedId&&user?.id)base44.entities.GameplayMoment.filter({user_id:user.id,record_id:selectedId},'timestamp',500)
      .then(rows=>{if(live)setMoments(rows||[]);}).catch(e=>{if(live)setError(e.message);});
    return()=>{live=false;};
  },[selectedId,user?.id,capture.revision,tick]);
  useEffect(()=>{
    let live=true;setUrl('');setPosition(0);setDuration(Number(record?.duration)||0);setMomentId('');
    if(record?.media_uri)privateUrl(record.media_uri).then(value=>{if(live)setUrl(value);}).catch(e=>{if(live)setError(e.message);});
    return()=>{live=false;};
  },[record?.id,record?.media_uri]);
  const games=useMemo(()=>[...new Set([...catalog.map(g=>g.title),...records.map(r=>r.game_name)].filter(Boolean))].sort((a,b)=>a.localeCompare(b)),[catalog,records]);
  const visible=records.filter(row=>(filterGame==='all'||row.game_name===filterGame)&&(!search||(row.title+' '+row.game_name).toLowerCase().includes(search.toLowerCase())));
  const shownMoments=moments.filter(row=>tab==='all'||(tab==='screenshots'?!!row.image_uri:row.kind===tab));
  const run=async(name,fn)=>{if(busy)return;setBusy(name);setError('');try{await fn();}catch(e){setError(e.message||'That action could not finish.');}finally{setBusy('');}};
  const seek=at=>{const next=Math.max(0,Math.min(duration,Number(at)||0));if(video.current){video.current.currentTime=next;}setPosition(next);};
  const begin=()=>run('Starting capture',async()=>{const created=await startRecording({userId:user.id,gameName:game,aiEnabled:ai});setSelectedId(created.id);});
  const saveFrame=(kind,analyze=false)=>run(analyze?'Reviewing frame':'Saving screenshot',async()=>{
    const next=await saveMoment({video:video.current,record,timestamp:video.current.currentTime,kind,analyze});
    setMomentId(next.id);refresh();
  });
  const uploadFile=async event=>{
    const file=event.target.files?.[0];event.target.value='';if(!file)return;
    await run('Uploading footage',async()=>{
      if(!game.trim())throw new Error('Enter the game name before uploading.');
      if(!/^(video|image)\//.test(file.type))throw new Error('Choose a video or image file.');
      if(file.size>200*1024*1024)throw new Error('Use a clip smaller than 200 MB.');
      const {file_uri}=await base44.integrations.Core.UploadPrivateFile({file});
      if(!file_uri)throw new Error('Upload did not return a saved file.');
      const row=await base44.entities.GameplayRecord.create({user_id:user.id,title:file.name,game_name:game.trim(),media_uri:file_uri,media_type:file.type.startsWith('image/')?'image':'video',status:'ready',captured_at:new Date().toISOString(),size_bytes:file.size});
      if(row.media_type==='image')await base44.entities.GameplayMoment.create({user_id:user.id,record_id:row.id,timestamp:0,image_uri:file_uri,kind:'screenshot',source:'manual',title:file.name});
      setRecords(prev=>[row,...prev]);setSelectedId(row.id);refresh();
    });
  };
  const canFrame=record?.media_type==='video'&&url&&!capturing;
  return <div className="records-app">
    <header className="records-header"><div className="records-brand"><Gamepad2 size={23}/><div><h1>Records</h1><p>Your play. Worth keeping.</p></div></div><span className="records-private">Private collection</span></header>
    <section className="records-capture-bar" aria-label="Record or import gameplay">
      <label className="records-game-input">Game<input list="records-game-options" placeholder="Choose or type a game" value={game} onChange={e=>setGame(e.target.value)} disabled={capturing||capture.starting}/></label>
      <datalist id="records-game-options">{games.map(name=><option key={name} value={name}/>)}</datalist>
      <label className="records-ai-toggle"><input type="checkbox" checked={ai} onChange={e=>setAi(e.target.checked)} disabled={capturing||capture.starting}/><span>AI coach<small>Review a frame every 15s</small></span></label>
      {capturing?<><button className="records-primary recording" onClick={stopRecording}><Square size={14}/>Stop & save · {formatTime(capture.elapsed)}</button><button onClick={()=>run('Bookmarking',()=>captureLiveMoment('highlight'))} disabled={!!busy}><Flag size={15}/>Mark moment</button></>:<button className="records-primary" disabled={!!busy||capture.starting||capture.saving||!!capture.draft||!game.trim()||!user?.id||!supportsCapture()} onClick={begin}><Circle size={14}/>Record screen</button>}
      <button disabled={!!busy||!game.trim()||!user?.id} onClick={()=>upload.current?.click()}><Upload size={15}/>Upload</button>
      <input ref={upload} type="file" accept="video/*,image/*" hidden onChange={uploadFile}/>
    </section>
    <p className="records-helper">{capturing?'Recording continues if this window is minimized or closed. Reopen Records, or stop browser sharing, to finish.':'Choose the game, then share its window. Audio depends on your browser and the surface shared. Sessions stop at 30 minutes or 200 MB.'} {ai?'Selected frames are sent to AI only during your recording; reviews can miss fast events.':''}</p>
    {(error||(ownCapture&&capture.error))&&<div className="records-notice" role="alert">{error||capture.error}<button onClick={()=>{setError('');refresh();}}>Reload library</button></div>}
    {(busy||capture.saving)&&<p className="records-status" role="status">{busy||'Saving recording…'}</p>}
    {ownCapture&&capture.draft&&!capture.saving&&<div className="records-notice"><span>Recording ready to recover</span><button onClick={()=>run('Saving recording',saveRecordDraft)}>Retry save</button><button onClick={downloadRecordDraft}><Download size={14}/>Download copy</button></div>}
    {capturing&&capture.tip&&<div className="records-live-tip"><Sparkles size={16}/><span><strong>Frame-based coach</strong>{capture.tip}</span></div>}
    <div className="records-layout">
      <aside className="records-library">
        <div className="records-section-label">LIBRARY <span>{records.length}</span></div>
        <label className="records-search"><Search size={15}/><input placeholder="Search footage" aria-label="Search footage" value={search} onChange={e=>setSearch(e.target.value)}/></label>
        <select aria-label="Filter recordings by game" value={filterGame} onChange={e=>setFilterGame(e.target.value)}><option value="all">All games</option>{[...new Set(records.map(r=>r.game_name))].sort().map(name=><option key={name}>{name}</option>)}</select>
        <div className="records-record-list">{visible.map(row=><button key={row.id} className={'records-record '+(row.id===selectedId?'is-selected':'')} onClick={()=>setSelectedId(row.id)}>
          <span className="records-record-icon">{row.media_type==='image'?<Image size={19}/>:<Video size={19}/>}</span><span><strong>{row.title}</strong><small>{row.game_name}</small><small>{row.captured_at?new Date(row.captured_at).toLocaleDateString():''} · {row.status==='ready'?(row.media_type==='image'?'Screenshot':row.duration?formatTime(row.duration):'Video'):row.status==='recording'&&row.id!==capture.record?.id?'Interrupted session':row.status}</small></span>
        </button>)}</div>
        {!visible.length&&<p className="records-empty-small">{loading?'Loading your recordings…':records.length?'No footage matches your filters.':'Your first recording will appear here.'}</p>}
        {records.length>=limit&&<button onClick={()=>setLimit(n=>n+100)}>Load older recordings</button>}
      </aside>
      <main className="records-review">
        {!record?<div className="records-empty"><div><Gamepad2 size={42}/><h2>Keep the moment.<br/>Learn from the next one.</h2><p>Record a game or upload footage to start your private timeline of highlights, screenshots and coaching notes.</p><div className="records-empty-steps"><span>01 Choose a game</span><span>02 Capture your play</span><span>03 Review & improve</span></div></div></div>:<>
          <div className="records-review-heading"><div><span className="records-section-label">{record.game_name}</span><h2>{record.title}</h2></div>{url&&<a className="records-icon-link" href={url} download target="_blank" rel="noreferrer" aria-label="Open original recording"><Download size={17}/></a>}</div>
          <div className="records-player">
            {url?(record.media_type==='image'?<img src={url} alt={record.title}/>:<video key={url} ref={video} src={url} crossOrigin="anonymous" controls playsInline onTimeUpdate={e=>setPosition(e.currentTarget.currentTime)} onLoadedMetadata={e=>{
              const d=e.currentTarget.duration;
              if(Number.isFinite(d)){setDuration(d);if(!record.duration)base44.entities.GameplayRecord.update(record.id,{duration:d}).catch(()=>{});}
            }} onError={()=>setError('This video cannot be played here. Try an MP4 or WebM upload, or open the original file.')}/>):<div className="records-player-placeholder"><Video size={32}/><p>{capturing&&record.id===capture.record?.id?'Capturing your shared screen…':capture.saving&&ownCapture?'Saving your footage…':'No saved video for this session yet.'}</p></div>}
          </div>
          <div className="records-tools"><span>{formatTime(position)} / {formatTime(duration)}</span>
            <button disabled={!canFrame||!!busy} onClick={()=>saveFrame('highlight')}><Flag size={14}/>Bookmark</button>
            <button disabled={!canFrame||!!busy} onClick={()=>saveFrame('screenshot')}><Camera size={14}/>Screenshot</button>
            <button disabled={!canFrame||!!busy} onClick={()=>saveFrame('observation',true)}><Sparkles size={14}/>Review this frame</button>
          </div>
          <section className="records-timeline" aria-label="Gameplay timeline">
            <div className="records-section-label">TIMELINE <span>{moments.length} moments</span></div>
            <div className="records-track"><input aria-label="Seek recording timeline" type="range" min="0" max={duration||1} step=".1" value={Math.min(position,duration||1)} disabled={!url||record.media_type!=='video'} onChange={e=>seek(e.target.value)}/>
              {duration>0&&moments.map(m=><button key={m.id} title={formatTime(m.timestamp)+' · '+m.title} aria-label={'Seek to '+m.title+' at '+formatTime(m.timestamp)} className={'records-marker '+m.kind} style={{left:Math.min(100,100*m.timestamp/duration)+'%'}} onClick={()=>{setMomentId(m.id);seek(m.timestamp);}}/>)}
            </div>
            <nav className="records-tabs" aria-label="Moment filters">{[['all','All moments'],['highlight','Highlights'],['coaching','AI suggestions'],['screenshots','Screenshots']].map(([key,label])=><button key={key} aria-pressed={tab===key} onClick={()=>setTab(key)}>{label}</button>)}</nav>
            <div className="records-moments">{shownMoments.map(m=><button className={'records-moment '+(m.id===momentId?'is-selected':'')} key={m.id} onClick={()=>{setMomentId(m.id);seek(m.timestamp);}}>
              <PrivateImage uri={m.image_uri}/><span><small>{formatTime(m.timestamp)} · {m.source==='ai'?'AI sample':m.kind}</small><strong>{m.title}</strong>{m.ai_review&&<small>{m.ai_review.confidence} confidence</small>}</span>
            </button>)}</div>
            {!shownMoments.length&&<p className="records-empty-small">{tab==='coaching'?'No AI coaching suggestions yet. Review a frame, or enable AI coach before recording.':'Bookmark a play or capture a screenshot to add a moment.'}</p>}
          </section>
          {moment&&<section className="records-insight"><div><span className="records-section-label">{formatTime(moment.timestamp)} / MOMENT REVIEW</span><h3>{moment.title}</h3></div>
            {moment.ai_review?<><p>{moment.ai_review.summary}</p><div className="records-insight-grid">{[['evidence','What is visible'],['suggestion','Try next time'],['practice','Practice focus']].map(([key,label])=><div key={key}><h4>{label}</h4><p>{moment.ai_review[key]||'Insufficient evidence in this frame.'}</p></div>)}</div><small>Single-frame review · {moment.ai_review.confidence} confidence. {moment.ai_review.limitations}</small></>:<><p>Review this saved screenshot for evidence-based suggestions.</p><button disabled={!!busy} onClick={()=>run('Reviewing frame',async()=>{await reviewMoment(moment.id);refresh();})}><Sparkles size={14}/>Analyze saved frame</button></>}
          </section>}
        </>}
      </main>
    </div>
  </div>;
}

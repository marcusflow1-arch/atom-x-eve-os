import {useEffect,useState} from 'react';
import {label} from './discovery';
export default function StorePreferences({games,genres,preference,onSave,saving,error}){
 const [draft,setDraft]=useState(preference),[search,setSearch]=useState(''),[saved,setSaved]=useState(false);
 useEffect(()=>setDraft(preference),[preference]);
 const toggle=(field,value)=>{setSaved(false);setDraft(p=>({...p,[field]:(p[field]||[]).includes(value)?p[field].filter(v=>v!==value):[...(p[field]||[]),value]}));};
 return <form onSubmit={async e=>{e.preventDefault();setSaved(await onSave(draft));}} className="rounded-2xl bg-white/[0.035] p-5 md:p-7">
  <div className="flex flex-wrap items-start justify-between gap-4"><div><h2 className="text-xl font-semibold">Make the store yours</h2><p className="mt-2 text-sm text-white/45">Choose what you enjoy. Your picks help surface similar games.</p></div><button disabled={saving} className="rounded-lg bg-cyan-100 px-5 py-2.5 text-sm font-semibold text-slate-950 disabled:opacity-40">{saving?'Saving…':'Save preferences'}</button></div>
  <fieldset className="mt-6"><legend className="mb-3 text-sm text-white/70">Genres you like</legend><div className="flex flex-wrap gap-2">{genres.map(g=><label key={g} className={'cursor-pointer rounded-full px-3 py-2 text-xs '+(draft.genres?.includes(g)?'bg-cyan-200/15 text-cyan-100 ring-1 ring-cyan-300/35':'bg-white/5 text-white/55')}><input type="checkbox" className="mr-2 accent-cyan-300" checked={draft.genres?.includes(g)||false} onChange={()=>toggle('genres',g)}/>{label(g)}</label>)}</div></fieldset>
  <label className="mt-6 flex items-center gap-3 text-sm text-white/70"><input type="checkbox" checked={draft.use_play_history!==false} onChange={e=>{setSaved(false);setDraft(p=>({...p,use_play_history:e.target.checked}));}} className="accent-cyan-300"/>Use games I've played for recommendations</label>
  {draft.use_play_history!==false&&<fieldset className="mt-5"><legend className="text-sm text-white/70">Games you've played</legend><p className="mt-1 text-xs text-white/35">Recent launches in Atom X Eve count automatically. Add other games here.</p>
   <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Find a game you enjoyed…" aria-label="Find games you've played" className="mt-3 w-full rounded-lg bg-slate-950/60 px-3 py-2 text-sm"/>
   <div className="mt-3 grid max-h-44 grid-cols-1 gap-2 overflow-y-auto sm:grid-cols-2 lg:grid-cols-3">{games.filter(g=>g.title.toLowerCase().includes(search.toLowerCase())).map(g=><label key={g.id} className="flex items-center gap-2 text-xs text-white/60"><input type="checkbox" className="accent-cyan-300" checked={draft.played_game_ids?.includes(g.id)||false} onChange={()=>toggle('played_game_ids',g.id)}/><span className="truncate">{g.title}</span></label>)}</div>
  </fieldset>}
  {error&&<p role="alert" className="mt-4 text-sm text-rose-300">{error}</p>}{saved&&<p role="status" className="mt-4 text-sm text-cyan-200">Preferences saved.</p>}
 </form>;
}

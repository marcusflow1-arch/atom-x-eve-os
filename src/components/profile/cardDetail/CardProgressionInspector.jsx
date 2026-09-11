import React, { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import TiltCard from '@/components/profile/cardDetail/TiltCard';
import useCardProgression from '@/components/profile/cardDetail/useCardProgression';
import ProgressionRecord from '@/components/profile/cardDetail/ProgressionRecord';
import ProgressionForge from '@/components/profile/cardDetail/ProgressionForge';
import ProgressionSkills from '@/components/profile/cardDetail/ProgressionSkills';
import '@/components/profile/cardDetail/cardProgression.css';

export default function CardProgressionInspector({ card, onClose }) {
  const [tab,setTab]=useState('Record');
  const [copyId,setCopyId]=useState(card?.ownedCopies?.[0]?.id || '');
  const selectedCard = copyId ? {...card,ownedCopies:card.ownedCopies.filter(c=>c.id===copyId)} : card;
  const {state,error,busy,loading,eligible,act,reload}=useCardProgression(selectedCard);
  const p=state?.progression;
  const disabled=busy || state?.userCard?.is_equipped || state?.userCard?.trade_status==='locked_in_trade' || p?.condition==='Fractured';
  return <div className="card-runtime absolute inset-0 z-50 flex flex-col overflow-hidden" data-card-overlay="true" data-testid="card-progression-inspector">
    <header className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-border p-4">
      <div className="min-w-0"><h1 className="text-sm font-semibold truncate max-w-[50vw]">{card.title}</h1><p className="text-xs text-muted-foreground mt-1" data-testid="progression-header">{p?`Tier ${p.stage} · Level ${p.level}/${p.max_level} · Enchant +${p.over_enchant_rank} · ${p.condition}`:eligible?'Loading saved progression…':'Unowned card preview'}</p></div>
      <div className="flex items-center gap-2"><nav className="flex gap-1" aria-label="Card sections">{['Record','Forge','Skill Tree'].map(name=><button className={`cr-action ${tab===name?'bg-primary/15':''}`} key={name} aria-pressed={tab===name} disabled={!p || busy} onClick={()=>setTab(name)}>{name}</button>)}</nav><button aria-label="Close card inspector" className="p-2 text-muted-foreground" disabled={busy} onClick={onClose}><X size={18}/></button></div>
    </header>
    <div className="flex-1 overflow-y-auto min-h-0 p-4 md:p-6" data-testid="progression-scroll">
      {error && <div role="alert" className="cr-panel mb-4 text-sm border-secondary/50">{error}<button className="cr-action ml-3" disabled={busy} onClick={reload}>Retry card</button></div>}
      {busy && <p role="status" className="flex gap-2 text-primary text-xs mb-4"><Loader2 size={14} className="animate-spin"/>Saving progression…</p>}
      {loading?<p role="status" className="p-10 text-center text-muted-foreground">Loading card progression…</p>:<div className="grid lg:grid-cols-[230px_minmax(0,1fr)] gap-6 items-start">
        <aside className="max-w-[260px] w-full mx-auto lg:sticky lg:top-0"><TiltCard card={card} level={p?.level || 1} stars={p?.stars || 1} ascension={p?.ascension || 0}/>{p&&<div className="cr-panel mt-5"><p className="cr-label">Total power</p><p className="text-3xl text-primary mt-2">{p.power_score}</p><p className="text-xs text-muted-foreground mt-3">Updates from your saved progression.</p></div>}{card.ownedCopies?.length>1&&<label className="block text-xs text-muted-foreground mt-4">Owned copy<select className="cr-input mt-2" aria-label="Owned card copy" value={copyId} disabled={busy} onChange={e=>setCopyId(e.target.value)}>{card.ownedCopies.map((c,i)=><option value={c.id} key={c.id}>Copy {i+1} · {c.id.slice(-6)}</option>)}</select></label>}</aside>
        <main className="min-w-0">{state?<>{disabled&&!busy&&<p className="cr-panel text-sm mb-5">{p.condition==='Fractured'?'This card is fractured. Use Restore stability in the Forge.':'This card is equipped or reserved in a trade. Release it before upgrading.'}</p>}{tab==='Record'&&<ProgressionRecord state={state} card={card}/>} {tab==='Forge'&&<ProgressionForge state={state} act={act} busy={busy} disabled={disabled}/>} {tab==='Skill Tree'&&<ProgressionSkills state={state} act={act} disabled={disabled}/>}</>:<section className="cr-panel"><p className="cr-label">Card preview</p><h2 className="text-2xl mt-2">{card.title}</h2><p className="mt-4 text-sm text-muted-foreground">{card.description || 'Collect this card to build its progression.'}</p><p className="mt-4 text-sm">{eligible?'Saved progression is unavailable. Retry above.':'Unlock or acquire this card to use the Forge and Skill Tree.'}</p></section>}</main>
      </div>}
    </div>
  </div>;
}
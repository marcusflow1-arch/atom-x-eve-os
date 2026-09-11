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
  const locked=state?.userCard?.is_equipped || state?.userCard?.trade_status==='locked_in_trade';
  const actionsDisabled=busy || locked || p?.condition==='Fractured';
  return <div className="card-runtime absolute inset-0 z-50 flex flex-col overflow-hidden" data-card-overlay="true" data-testid="card-progression-inspector">
    <header className="cr-header">
      <div className="min-w-0"><h1 className="truncate text-sm font-semibold">{card.title}</h1><p className="mt-1 text-xs text-muted-foreground" data-testid="progression-header">{p?`Tier ${p.stage} · Level ${p.level}/${p.max_level} · Enchant +${p.over_enchant_rank} · ${p.condition}`:eligible?'Loading saved progression…':'Unowned card preview'}</p></div>
      <nav className="cr-section-tabs" aria-label="Card sections">{['Record','Forge','Skill Tree'].map(name=><button className="cr-section-tab" key={name} aria-pressed={tab===name} disabled={busy} onClick={()=>setTab(name)}>{name}</button>)}</nav>
      <button aria-label="Close card inspector" className="cr-close" disabled={busy} onClick={onClose}><X size={20}/></button>
    </header>
    <div className="cr-layout">
      <aside className="cr-card-column">
        <div className="cr-card-stage"><TiltCard card={card} level={p?.level || 1} stars={p?.stars || 1} ascension={p?.ascension || 0}/></div>
        <div className="cr-card-meta">
          {p&&<><p className="cr-label">Live card power</p><div className="cr-power-row"><strong>{p.power_score}</strong><span>Level {p.level}<br/>Stage {p.stage}</span></div><p className="text-xs text-muted-foreground">Saved instantly from Record, Forge, and Skill Tree actions.</p></>}
          {card.ownedCopies?.length>1&&<label className="mt-5 block text-xs text-muted-foreground">Owned copy<select className="cr-input mt-2" aria-label="Owned card copy" value={copyId} disabled={busy} onChange={e=>setCopyId(e.target.value)}>{card.ownedCopies.map((c,i)=><option value={c.id} key={c.id}>Copy {i+1} · {c.id.slice(-6)}</option>)}</select></label>}
        </div>
      </aside>
      <main className="cr-view-content" data-testid="progression-scroll">
        {error&&<div role="alert" className="cr-panel mb-4 text-sm border-secondary/50">{error}<button className="cr-action ml-3" disabled={busy} onClick={reload}>Retry card</button></div>}
        {busy&&<p role="status" className="mb-4 flex gap-2 text-xs text-primary"><Loader2 size={14} className="animate-spin"/>Saving progression…</p>}
        {loading?<p role="status" className="p-10 text-center text-muted-foreground">Loading saved card information…</p>:state?<>{locked&&!busy&&<p className="cr-panel mb-5 text-sm">This card is equipped or reserved in a trade. Release it before upgrading.</p>}{p?.condition==='Fractured'&&!busy&&<p className="cr-panel mb-5 text-sm">This card is fractured. Open Forge, then Enchant, to restore its stability.</p>}{tab==='Record'&&<ProgressionRecord state={state} card={card}/>} {tab==='Forge'&&<ProgressionForge state={state} act={act} busy={busy} disabled={actionsDisabled}/>} {tab==='Skill Tree'&&<ProgressionSkills state={state} act={act} disabled={actionsDisabled}/>}</>:<section className="cr-panel"><p className="cr-label">{tab}</p><h2 className="mt-2 text-2xl">{card.title}</h2><p className="mt-4 text-sm text-muted-foreground">{card.description || 'Collect this card to build its progression.'}</p><p className="mt-4 text-sm">{eligible?'Saved progression is unavailable. Retry above.':'Unlock or acquire this card to use its Record, Forge, and Skill Tree.'}</p></section>}
      </main>
    </div>
  </div>;
}
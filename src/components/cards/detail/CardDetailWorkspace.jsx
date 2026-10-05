import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, BookOpen, Check, ChevronRight, Crown, Gem, GitBranch, Hammer, History, Lock, RefreshCw, ScrollText, Shield, ShoppingBag, Sparkles } from 'lucide-react';
import useCardDetail from './useCardDetail';
import { cardIdentity, displayCard, format, RARITY_COLORS } from './cardDetailModel';
import { Meter, Empty } from './CardDetailPrimitives';
import { CardOverview, CardChronicle, CardSkills } from './CardRecordPanels';
import CardUpgradePanel from './CardUpgradePanel';
import CardExchangePanel from './CardExchangePanel';
import './card-detail.css';

const TABS=[['overview','Overview',BookOpen],['upgrade','Upgrade',Hammer],['skills','Skill paths',GitBranch],['exchange','Exchange',ShoppingBag],['chronicle','Chronicle',History]];
export default function CardDetailWorkspace({card={},onClose,allowLegacyAchievement=false}) {
  const identity=cardIdentity(card,allowLegacyAchievement);
  return <CardWorkspace key={JSON.stringify(identity)||String(card.id||card.title)} card={card} identity={identity} onClose={onClose}/>;
}
function CardWorkspace({card,identity,onClose}) {
  const detail=useCardDetail(identity);
  const {state,loading,busy,notice,refresh}=detail;
  const [tab,setTab]=useState('overview'),[upgrade,setUpgrade]=useState('level'),[imageError,setImageError]=useState(false);
  const root=useRef(null),closeButton=useRef(null);
  const item=displayCard(card,state),p=state?.progression,u=state?.userCard;
  useEffect(()=>{const previous=document.activeElement;closeButton.current?.focus();return ()=>{if(previous?.isConnected)previous.focus();};},[]);
  const focusTab=(event,index)=>{
    if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
    event.preventDefault();
    const next=event.key==='Home'?0:event.key==='End'?TABS.length-1:(index+(event.key==='ArrowRight'?1:-1)+TABS.length)%TABS.length;
    setTab(TABS[next][0]);root.current.querySelector('[data-tab="'+TABS[next][0]+'"]')?.focus();
  };
  const keydown=event=>{
    if(event.key==='Escape'){event.preventDefault();event.stopPropagation();onClose?.();}
    if(event.key==='Tab'){
      const nodes=[...root.current.querySelectorAll('button:not(:disabled),a[href],input:not(:disabled),select:not(:disabled),summary,[tabindex="0"]')].filter(el=>el.getAttribute('tabindex')!=='-1');
      const first=nodes[0],last=nodes[nodes.length-1];
      if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}
      if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}
    }
  };
  const jump=(id)=>{setUpgrade(id);setTab('upgrade');};
  return <div ref={root} className="cdw" data-card-overlay="true" style={{'--cdw-rarity':RARITY_COLORS[item.rarity]||RARITY_COLORS.Common}} onKeyDown={keydown} aria-label={item.title+' card details'}>
    <header className="cdw-top"><button ref={closeButton} className="cdw-back" onClick={onClose} aria-label="Return to cards"><ArrowLeft size={16}/><span>Collection</span></button><span className="cdw-breadcrumb"><ChevronRight size={12}/>Card sanctum</span><span className="cdw-save">{busy?<><Sparkles size={12}/>Updating…</>:p?<><Check size={12}/>Progress saved</>:<><Lock size={12}/>Collection preview</>}</span><button className="cdw-icon-button" disabled={loading||busy||!identity} onClick={refresh} aria-label="Refresh card"><RefreshCw size={15}/></button></header>
    <div className="cdw-layout">
      <aside className="cdw-showcase" aria-label="Card portrait and progress">
        <div className="cdw-showcase-top"><span>{item.game || 'Achievement collection'}</span><span>{u?'Owned':'Discover'}</span></div>
        <div className="cdw-relic-stage">
          <svg className="cdw-sigil" viewBox="0 0 360 430" fill="none" aria-hidden="true"><circle cx="180" cy="216" r="157"/><circle cx="180" cy="216" r="146" strokeDasharray="1 12"/><path d="M180 14 348 216 180 416 12 216Z M180 37 326 216 180 394 34 216Z M0 216H360 M180 0V430"/><path d="m166 20 14-14 14 14-14 14Z m0 393 14-14 14 14-14 14Z"/></svg>
          <div className="cdw-relic">
            <span className="cdw-relic-cap"><Crown size={17}/></span>
            <div className="cdw-relic-image">{item.image&&!imageError?<img src={item.image} onError={()=>setImageError(true)} alt={item.title+' card artwork'}/>:<div className="cdw-art-fallback"><ScrollText size={62}/><span>Achievement relic</span></div>}<div className="cdw-relic-shade"/></div>
            <div className="cdw-relic-top"><span>{item.rarity}</span>{p&&<b>+{p.over_enchant_rank||0}</b>}</div>
            <div className="cdw-relic-caption"><span>{item.type}</span><h2>{item.title}</h2><div className="cdw-relic-stars" aria-label={p?p.stars+' stars':'Uncollected card'}>{Array.from({length:5},(_,i)=><span key={i} data-lit={Boolean(p&&i<p.stars)}>✦</span>)}</div></div>
            <i className="cdw-corner cdw-corner-tl"/><i className="cdw-corner cdw-corner-tr"/><i className="cdw-corner cdw-corner-bl"/><i className="cdw-corner cdw-corner-br"/>
          </div>
        </div>
        <div className="cdw-showcase-power"><span>Card power</span><strong>{format(p?.power_score)}</strong><small>{p?'Combined effective attributes':'Revealed when collected'}</small></div>
        {p?<><Meter label={'Level '+p.level+' / '+p.max_level} value={p.xp} max={p.xp_to_next}/><div className="cdw-mini-ranks"><button onClick={()=>jump('enchant')}><Gem size={15}/><strong>+{p.over_enchant_rank||0}</strong><span>Enchant</span></button><button onClick={()=>jump('divine')}><Shield size={15}/><strong>{p.stage} / 5</strong><span>Divine</span></button><button onClick={()=>jump('ascension')}><Crown size={15}/><strong>{p.ascension||0} / 5</strong><span>Ascension</span></button></div><p className="cdw-showcase-note">{u?.is_equipped?'Equipped to your avatar':u?.trade_status==='locked_in_trade'?'Reserved by a trade or listing':'Bound to your collection · Ready to grow'}</p></>:<p className="cdw-showcase-note">Earn the linked achievement or collect this card from the market to begin its progression.</p>}
      </aside>
      <main className="cdw-main">
        <div className="cdw-title"><div><p className="cdw-eyebrow">Your achievements. Your avatar’s legacy.</p><h1>{item.title}</h1><div className="cdw-item-meta"><span className="cdw-rarity">{item.rarity}</span><i/><span>{item.type}</span>{item.game&&<><i/><span>{item.game}</span></>}</div></div>{p&&<span className="cdw-title-level"><small>LEVEL</small>{p.level}</span>}</div>
        <nav className="cdw-tabs" role="tablist" aria-label="Card detail sections">{TABS.map(([id,label,Icon],i)=><button key={id} data-tab={id} id={'cdw-tab-'+id} role="tab" aria-selected={tab===id} aria-controls={'cdw-panel-'+id} tabIndex={tab===id?0:-1} onKeyDown={event=>focusTab(event,i)} onClick={()=>setTab(id)}><Icon size={15}/>{label}{id==='skills'&&p?.skill_points>0&&<small>{p.skill_points}</small>}</button>)}</nav>
        <div className="cdw-content" role="tabpanel" tabIndex={0} id={'cdw-panel-'+tab} aria-labelledby={'cdw-tab-'+tab} aria-busy={loading||busy}>
          {notice&&<div className={'cdw-notice cdw-notice-'+notice.type} role={notice.type==='error'?'alert':'status'}>{notice.type==='success'?<Check size={16}/>:<Shield size={16}/>}<span>{notice.text}</span></div>}
          {loading?<Empty icon={Sparkles} title="Opening your card record">Loading progression, materials and upgrade paths…</Empty>:<>
            {identity&&!p&&<div className="cdw-notice" role="alert"><span>Your owned card record could not be loaded. No upgrades are available until it is verified.</span><button className="cdw-button" onClick={refresh}>Retry</button></div>}
            {p&&u?.trade_status==='locked_in_trade'&&<div className="cdw-notice"><Lock size={15}/><span>This card is reserved. Cancel its listing or finish the trade before upgrading.</span></div>}
            {tab==='overview'&&<CardOverview card={card} item={item} state={state} onUpgrade={jump}/>}
            {tab==='upgrade'&&(p&&state.workshop?<CardUpgradePanel detail={detail} section={upgrade} onSection={setUpgrade}/>:<Empty title={p?'Upgrade terms unavailable':'Collect this card to unlock the forge'}>{p?'Refresh to load current upgrade costs.':'Grow its level, socket enchantments, advance its divine stage and unlock a higher level cap through ascension.'}</Empty>)}
            {tab==='skills'&&<CardSkills detail={detail}/>}
            {tab==='exchange'&&<CardExchangePanel detail={detail} item={item}/>}
            {tab==='chronicle'&&<CardChronicle state={state}/>}
          </>}
        </div>
        <footer className="cdw-bottom"><ScrollText size={13}/><span>{p?'Every upgrade becomes part of this card’s story.':'Discover. Achieve. Build your legacy.'}</span><span>{p?'Saved to your account':'Achievement collection'}</span></footer>
      </main>
    </div>
  </div>;
}

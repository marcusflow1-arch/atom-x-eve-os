import { useState } from 'react';
import { ArrowUpRight, Check, ChevronRight, Crown, Gem, GitBranch, History, Lock, Shield, Sparkles, Swords, Trophy } from 'lucide-react';
import { Action, Empty, SectionTitle } from './CardDetailPrimitives';
import { dateLabel, format, signed, STAT_LABELS, words } from './cardDetailModel';

const PATHS=[['level','Card level','Earn XP and strengthen your attributes.',Sparkles],['enchant','Enchantment','Infuse sockets and over-enchant your card.',Gem],['divine','Divine stage','Fuse compatible cards to evolve its stage.',Shield],['ascension','Ascension','Break the level cap and unlock more growth.',Crown]];
export function CardOverview({card,item,state,onUpgrade}) {
  const p=state?.progression,u=state?.userCard;
  const stats=p?.effective_stats||card.stats||{};
  return <div className="cdw-overview">
    <SectionTitle eyebrow="The card at a glance" title="A record worth strengthening."/>
    <div className="cdw-path-grid">{PATHS.map(([id,label,description,Icon])=><button key={id} className="cdw-path" onClick={()=>onUpgrade(id)}><div><Icon size={19}/><ChevronRight size={14}/></div><span>{label}</span><strong>{!p?'—':id==='level'?p.level+' / '+p.max_level:id==='enchant'?'+'+(p.over_enchant_rank||0):id==='divine'?p.stage+' / 5':(p.ascension||0)+' / 5'}</strong><p>{description}</p></button>)}</div>
    <section className="cdw-attributes"><div className="cdw-line-heading"><h3>{p?'Effective attributes':'Card attributes'}</h3><span>{p?'Growth ×'+format(p.growth_multiplier):'Definition preview'}</span></div>
      <div className="cdw-stat-table"><div className="cdw-stat-head"><span>Attribute</span><span>Base</span><span>Bonus¹</span><span>Total</span></div>{Object.entries(STAT_LABELS).map(([key,label])=><div key={key}><span>{label}</span><span>{format(p?.base_stats?.[key]??stats[key])}</span><span>{p?signed(Number(stats[key]||0)-Number(p.base_stats?.[key]||0)):'—'}</span><strong>{format(stats[key])}</strong></div>)}</div><p className="cdw-footnote">¹ Includes growth, enhancements and socket modifiers. Card power is the sum of the five effective attributes.</p>
    </section>
    {state?.combat_preview&&<CombatPreview state={state}/>}
    <div className="cdw-record-grid"><section><div className="cdw-line-heading"><h3>Origin &amp; purpose</h3><Trophy size={16}/></div><p className="cdw-description">{item.description||'This card is part of '+(item.game||'your achievement collection')+'. Its earned progression follows it through upgrades and trading.'}</p>{card.requirements&&typeof card.requirements==='string'&&<p>{card.requirements}</p>}</section><section><div className="cdw-line-heading"><h3>Collection record</h3><History size={16}/></div><dl className="cdw-facts"><div><dt>Acquired</dt><dd>{dateLabel(u?.created_date)}</dd></div><div><dt>Source</dt><dd>{u?words(u.acquisition_method)||'Not recorded':'Not collected'}</dd></div><div><dt>Copies in this entry</dt><dd>{u?format(u.quantity??1):'—'}</dd></div><div><dt>Status</dt><dd>{u?.is_equipped?'Equipped':u?.trade_status==='locked_in_trade'?'Reserved':u?'In collection':'To unlock'}</dd></div></dl></section></div>
  </div>;
}
function CombatPreview({state}) {
  const preview=state.combat_preview;
  const metrics = [['Damage before mitigation', preview.base_damage], ['Cooldown', format(Number(preview.cooldown_ms)/1000)+' s'], ['Cooldown reduction', format(Number(preview.cooldown_reduction)*100)+'%'], ['Card multiplier', '×'+format(preview.card_multiplier)]];
  return <section className="cdw-combat-preview"><Swords size={22}/><div><h3>Avatar combat link</h3><p>Computed with your level {state.avatar_level} avatar. Final combat results depend on the opponent and active effects.</p><div>{metrics.map(([label,value])=><span key={label}>{label} <strong>{typeof value === 'number' ? format(value) : value}</strong></span>)}</div></div></section>;
}
export function CardChronicle({state}) {
  const [filter,setFilter]=useState('all');
  const all=state?.events||[];
  const events=all.filter(event=>filter==='all'||(filter==='forge'?['trained','level_up','enhance','combine','ascend','enchant','over_enchant'].includes(event.event_type):filter==='skills'?/skill|perk/.test(event.event_type):false));
  return <><SectionTitle eyebrow="An evolving legacy" title="Card chronicle" aside={<span className="cdw-count">{all.length} records</span>}>A timeline of confirmed progression. Showing up to the 30 most recent events.</SectionTitle><div className="cdw-segments" aria-label="History filters">{[['all','All events'],['forge','Upgrades'],['skills','Skills & perks']].map(([id,label])=><button key={id} aria-pressed={filter===id} onClick={()=>setFilter(id)}>{label}</button>)}</div>{events.length?<ol className="cdw-timeline">{events.map(event=><li key={event.id}><span className="cdw-event-dot"><History size={13}/></span><div><div className="cdw-event-meta"><span>{words(event.event_type)}</span><time dateTime={event.created_date}>{dateLabel(event.created_date)}</time></div><h3>{event.summary}</h3>{event.before?.power_score!=null&&event.after?.power_score!=null&&event.before.power_score!==event.after.power_score&&<p>Power {format(event.before.power_score)} <ArrowUpRight size={12}/> <strong>{format(event.after.power_score)}</strong></p>}{event.metadata?.success_chance!=null&&<p>Success chance {format(event.metadata.success_chance)}% · {event.metadata.success?'Succeeded':'Attempt failed'}</p>}{event.metadata?.consumed?.length>0&&<details><summary>Consumed cards ({event.metadata.consumed.length})</summary><p>{event.metadata.consumed.join(', ')}</p></details>}</div></li>)}</ol>:<Empty title="No records in this view" icon={History}>{state?'Your confirmed upgrades and skill changes will appear here.':'Collect this card to start its personal history.'}</Empty>}</>;
}
export function CardSkills({detail}) {
  const {state,busy,act}=detail,p=state?.progression;
  if(!p)return <Empty title="A skill path waiting to be unlocked" icon={GitBranch}>Collect this card, then earn skill points through levels, divine stages and ascension.</Empty>;
  const unlocked=p.unlocked_skill_nodes||[],active=p.active_perks||[],tree=state.skillTree||[];
  const locked=state.userCard?.trade_status==='locked_in_trade';
  return <><SectionTitle eyebrow="Mastery & expression" title="Shape your card’s path" aside={<span className="cdw-count">{format(p.skill_points)} skill points</span>}>Unlock connected nodes. Up to three unlocked perks can be active together.</SectionTitle><div className="cdw-perk-bar">{Array.from({length:3},(_,i)=>{const node=tree.find(n=>n.id===active[i]);return <div key={i} data-filled={Boolean(node)}><Gem size={18}/><span>{node?.name||'Open perk slot'}<small>{node?'Active perk':'Unlock a perk below'}</small></span>{node&&<button aria-label={'Deactivate '+node.name} disabled={busy||locked} onClick={()=>act('togglePerk',{nodeId:node.id})}>Remove</button>}</div>;})}</div>
    <div className="cdw-skill-lanes">{[...new Set(tree.map(n=>n.lane))].map(lane=><section key={lane}><div className="cdw-line-heading"><h3>{lane}</h3><GitBranch size={15}/></div>{tree.filter(n=>n.lane===lane).map(node=>{
      const owned=unlocked.includes(node.id),enabled=active.includes(node.id);
      const prior=tree.find(n=>n.id===node.prerequisite);
      const reason=locked?'Card is reserved.':!owned&&p.level<node.minLevel?'Requires level '+node.minLevel:!owned&&p.stage<node.minStage?'Requires divine stage '+node.minStage:!owned&&node.prerequisite&&!unlocked.includes(node.prerequisite)?'Unlock '+(prior?.name||'the previous node')+' first.':!owned&&p.skill_points<node.cost?'Needs '+node.cost+' skill points.':owned&&node.perk&&!enabled&&active.length>=3?'Remove a perk to make room.':'';
      return <article className="cdw-skill-node" key={node.id} data-owned={owned}><span className="cdw-node-rune">{owned?<Check size={15}/>:<Lock size={15}/>}</span><span className="cdw-eyebrow">{node.perk?'Equipable perk':'Passive node'}</span><h4>{node.name}</h4><p>{node.effect}</p><small>Level {node.minLevel} · Divine {node.minStage}{prior?' · After '+prior.name:''}</small>{owned&&!node.perk?<span className="cdw-unlocked"><Check size={12}/>Unlocked</span>:<Action busy={busy} reason={reason} secondary={owned} onClick={()=>act(owned?'togglePerk':'unlockSkill',{nodeId:node.id})}>{owned?(enabled?'Deactivate perk':'Activate perk'):'Unlock · '+node.cost+' SP'}</Action>}</article>;
    })}</section>)}</div>{!tree.length&&<Empty title="Skill paths unavailable">Refresh this card to load its skill tree.</Empty>}
  </>;
}

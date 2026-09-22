import { useEffect, useRef, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { ArrowLeft, ArrowRight, Check, ChevronRight, Compass, Crown, Gem, Heart, History, Layers, Loader2, Map, Shield, Sparkles, Swords, Trophy, Users, X, Zap } from 'lucide-react';
import useBattleArena from './useBattleArena';
import { arenaPresentation } from './arenaPresentation';
import { BattleAvatar, RiftEnemy } from './BattleAvatar';
import { joinDashboard, useDashboardSession } from '@/components/social/dashboardSession';
import './battleExpeditions.css';

const icons={quest:Compass,dungeon:Map,world_boss:Crown,pvp:Swords};
const effectLabels={strike:'Damage',heal:'Restore HP',shield:'Shield'};
const pct=(value,max)=>Math.max(0,Math.min(100,100*(Number(value)||0)/Math.max(1,Number(max)||1)));
const background=image=>image?{backgroundImage:'linear-gradient(90deg,rgba(7,15,23,.9),rgba(7,15,23,.2)),url('+JSON.stringify(image)+')'}:{};
function Health({name,hp,max,shield=0,enemy=false}){
  return <div className={'ab-health '+(enemy?'is-enemy':'')}>
    <div><strong>{name}</strong><span>{Math.ceil(hp)} <small>/ {max} HP</small>{shield>0&&<em> +{shield} shield</em>}</span></div>
    <progress aria-label={name+' health'} value={hp} max={Math.max(1,max)}/></div>;
}
function Cards({cards=[],onPlay,busy,player,turn,world}){
  return <div className="ab-cards" aria-label="Equipped battle cards">{Array.from({length:4},(_,index)=>{
    const c=cards[index];if(!c)return <div key={index} className="ab-card ab-empty-card"><Layers size={20}/><span>Empty slot</span></div>;
    const cooldown=player?.cooldowns?.[c.id]||0,resonance=world&&(c.game_id===world.id||c.game_name===world.title);
    const disabled=busy||!turn||cooldown>0||(player?.ap??0)<c.cost;
    return <button key={c.id} type="button" className={'ab-card '+(resonance?'has-resonance':'')} disabled={onPlay?disabled:true}
      onClick={()=>onPlay?.(c.id)} aria-label={c.name+', '+c.cost+' AP, '+effectLabels[c.effect]+' '+(c.value+(resonance?5:0))}>
      <div className="ab-card-art">{c.image?<img src={c.image} alt="" loading="lazy"/>:<Sparkles size={28}/>}<b>{c.cost}<small>AP</small></b></div>
      <span className="ab-card-rarity">{c.rarity} · {c.type}</span><strong>{c.name}</strong>
      <span>{effectLabels[c.effect]} {c.value+(resonance?5:0)}</span>
      <small>{cooldown?'Ready in '+cooldown+' turn'+(cooldown>1?'s':''):resonance?'World resonance +5':c.game_name||'Luna ability'}</small>
    </button>;
  })}</div>;
}
function BattleControls({battle,run}){
  const e=battle.encounter,me=e.players.find(p=>p.id===battle.user?.id);
  const [now,setNow]=useState(Date.now());const timed=useRef('');
  useEffect(()=>{const timer=setInterval(()=>setNow(Date.now()),100);return()=>clearInterval(timer);},[]);
  const serverNow=now+battle.serverOffset,remaining=Math.max(0,(e.deadline-serverNow)/1000);
  useEffect(()=>{
    if(e.status!=='active'||!e.deadline||remaining>0||battle.busy)return;
    const key=e.id+':'+e.revision;if(timed.current===key)return;timed.current=key;
    battle.command('timeout').catch(()=>{timed.current='';});
  },[e.id,e.revision,e.deadline,e.status,remaining,battle.busy]);
  if(!me)return null;
  const mine=e.turn===me.id,defending=e.phase==='defend';
  const target=e.players.find(p=>p.id===e.turn);
  const progress=defending?pct(serverNow-e.defense_started_at,6000):0;
  return <div className="ab-controls">
    <div className="ab-turn-label" role="status"><div><span className="ab-eyebrow">{defending?'INCOMING ATTACK':'ROUND '+e.round}</span>
      <h3>{defending?(mine?'Read the strike. Choose your response.':target?.name+' is defending'):mine?'Your move. Make it count.':(target?.name||'Player')+' is choosing a card'}</h3></div>
      <span className="ab-ap"><Zap size={15}/>{me.ap}<small>/ 5 AP</small></span>
      {e.deadline>0&&<span className="ab-clock">{Math.ceil(remaining)}s</span>}
    </div>
    {defending?<div className="ab-defense">
      <div className="ab-defense-copy"><Shield size={19}/><p><strong>{e.enemy?.intent}</strong><span>Brace safely at any time. Evade in the blue window; parry in the narrow gold window.</span></p></div>
      <div className="ab-timing" aria-label="Incoming strike timing"><span className="ab-evade-window"/><span className="ab-parry-window"/><i style={{left:progress+'%'}}/></div>
      <div className="ab-actions"><button disabled={!mine||battle.busy} onClick={()=>run(()=>battle.command('brace'))}>Brace <small>60% less damage</small></button><button disabled={!mine||battle.busy} onClick={()=>run(()=>battle.command('evade'))}>Evade <small>Blue window</small></button><button disabled={!mine||battle.busy} onClick={()=>run(()=>battle.command('parry'))}>Parry <small>Gold window · counter</small></button></div>
    </div>:<>
      <Cards cards={me.cards} player={me} busy={battle.busy} turn={mine&&e.phase==='turn'} world={e.world} onPlay={card_id=>run(()=>battle.command('card',{card_id}))}/>
      <div className="ab-actions"><button disabled={!mine||battle.busy||e.phase!=='turn'} onClick={()=>run(()=>battle.command('strike'))}><Swords size={15}/>Strike <small>16 damage · +1 AP</small></button><button disabled={!mine||battle.busy||e.phase!=='turn'} onClick={()=>run(()=>battle.command('guard'))}><Shield size={15}/>Guard <small>18 shield · +1 AP</small></button><p>Each card uses your turn. AP recovers between turns.</p></div>
    </>}
  </div>;
}
function Encounter({battle,run,onBack,onClose}){
  const e=battle.encounter,me=e.players.find(p=>p.id===battle.user?.id),isHost=e.host_id===battle.user?.id;
  const session=useDashboardSession();
  const [confirmLeave,setConfirmLeave]=useState(false);
  const duel=e.route.type==='pvp',finished=['victory','defeat','abandoned'].includes(e.status);
  const canClaim=e.status==='victory'&&(!duel||e.winner_id===me?.id),claimed=e.claimed.includes(me?.id);
  const last=e.log[e.log.length-1],opponent=duel?e.players.find(p=>p.id!==me?.id):null;
  const ready=e.players.length>=e.route.min;
  const inHostDashboard=session.host_id===e.host_id&&session.status==='connected';
  async function accept(){
    await joinDashboard({id:e.host_id,name:e.host_name});
    await battle.command('join');
  }
  return <div className="ab-encounter">
    <div className="ab-encounter-heading"><button className="ab-back" onClick={onBack}><ArrowLeft size={16}/>Expeditions</button><div><span className="ab-eyebrow">{e.world.title} / {duel?'FRIENDLY DUEL':'ROOM '+(e.stage+1)+' OF '+e.route.stages.length}</span><h2>{e.route.title}</h2></div><button className="ab-text-button" onClick={()=>setConfirmLeave(true)} disabled={finished||!me}>Withdraw</button></div>
    {confirmLeave&&<div className="ab-alert" role="alert"><p>{isHost?'Withdrawing ends this expedition for the group.':'Withdrawing removes you from this fight.'}</p><button onClick={()=>run(async()=>{await battle.command('leave');setConfirmLeave(false);})}>Withdraw</button><button onClick={()=>setConfirmLeave(false)}>Keep playing</button></div>}
    {e.status==='lobby'?<div className="ab-lobby">
      <div className="ab-lobby-heading"><span className="ab-badge"><Users size={14}/>ASSEMBLE YOUR PARTY</span><h2>{duel?'A rival. A deck. Your dashboard.':'Your next expedition starts together.'}</h2><p>Each player brings their saved avatar and equipped cards. Join {e.host_name}’s dashboard, then the host starts the battle.</p></div>
      <div className="ab-lobby-roster">{e.players.map(p=><article key={p.id}><div className="ab-lobby-avatar"><BattleAvatar player={p}/></div><strong>{p.name}</strong><span><Check size={13}/>Ready · {p.cards.length} cards · {p.max_hp} HP</span></article>)}
        {e.invited_ids.filter(id=>!e.players.some(p=>p.id===id)).map(id=><article key={id} className="ab-waiting-player"><Users size={25}/><strong>{e.declined.includes(id)?'Invitation declined':'Waiting for player'}</strong><span>{e.declined.includes(id)?'Choose another expedition to regroup.':'They can accept from AI Battle.'}</span></article>)}</div>
      <div className="ab-lobby-actions">{!me&&!e.declined.includes(battle.user?.id)?<><button className="ab-primary" disabled={battle.busy} onClick={()=>run(accept)}><Users size={17}/>Accept & join dashboard</button><button disabled={battle.busy} onClick={()=>run(async()=>{await battle.command('decline');onBack();})}>Decline</button></>:me?<>{e.players.length>1&&!inHostDashboard&&<button onClick={()=>run(()=>joinDashboard({id:e.host_id,name:e.host_name}))}>Join host dashboard</button>}{isHost?<button className="ab-primary" disabled={battle.busy||!ready} onClick={()=>run(()=>battle.command('start'))}><Swords size={17}/>{ready?'Enter arena':'Waiting for players'}</button>:<span>Waiting for {e.host_name} to start.</span>}</>:<p>You declined this invitation.</p>}</div>
    </div>:<>
      <div className="ab-arena" style={background(e.world.image)}>
        <div className="ab-arena-top"><div className="ab-party-health">{e.players.filter(p=>!duel||p.id===me?.id).map(p=><Health key={p.id} name={p.name} hp={p.hp} max={p.max_hp} shield={p.shield}/>)}</div>
          {duel?opponent&&<Health name={opponent.name} hp={opponent.hp} max={opponent.max_hp} shield={opponent.shield} enemy/>:e.enemy&&<Health name={e.enemy.name} hp={e.enemy.hp} max={e.enemy.max_hp} enemy/>}
        </div>
        <div className="ab-arena-floor"/><div className="ab-allies">{e.players.filter(p=>!duel||p.id===me?.id).map(p=><BattleAvatar key={p.id} player={p} active={e.turn===p.id&&!finished} event={last}/>)}</div>
        <div className="ab-foes">{duel?opponent&&<BattleAvatar player={opponent} active={e.turn===opponent.id&&!finished} event={last}/>:e.enemy&&<RiftEnemy enemy={e.enemy} event={last}/>}</div>
        <div className="ab-arena-caption" aria-live="polite">{last?.text||'The arena is ready.'}</div>
      </div>
      {finished?<div className="ab-result"><Trophy size={28}/><div><span className="ab-eyebrow">ENCOUNTER COMPLETE</span><h2>{e.status==='victory'?(duel?(e.winner_id===me?.id?'Victory':'Defeat'):'Route secured'):(e.status==='abandoned'?'Expedition ended':'Regroup for another try')}</h2><p>{canClaim?(claimed?'Chest opened. '+e.route.xp+' Expedition XP recorded in your journal.':'A field chest is waiting. Open it to record your expedition reward.'):'Your deck and character are ready for your next encounter.'}</p></div>
        {canClaim&&!claimed?<button className="ab-primary" disabled={battle.busy} onClick={()=>run(()=>battle.command('claim'))}><Gem size={16}/>Open field chest · {e.route.xp} XP</button>:<button onClick={onBack}>Choose next expedition<ArrowRight size={15}/></button>}
      </div>:e.phase==='camp'?<div className="ab-result"><Compass size={28}/><div><span className="ab-eyebrow">CAMP / ROOM CLEARED</span><h2>Catch your breath.</h2><p>Continue to restore 20% health and refresh the party’s action points.</p></div><button className="ab-primary" disabled={!isHost||battle.busy} onClick={()=>run(()=>battle.command('continue'))}>{isHost?'Enter next room':'Waiting for host'}<ArrowRight size={16}/></button></div>:<BattleControls battle={battle} run={run}/>}
      <details className="ab-combat-log"><summary><History size={14}/>Battle log · {e.log.length} recent actions</summary><ol>{e.log.map((line,index)=><li key={index} className={'is-'+line.kind}>{line.text}</li>)}</ol></details>
    </>}
    <p className="ab-footnote">Your encounter is saved. <button onClick={onClose}>Return to dashboard</button> and resume from the battle notice.</p>
  </div>;
}
export default function BattleExpeditions({onClose,onClassic,initialEncounterId}){
  const [encounterId,setEncounterId]=useState(initialEncounterId||null);
  const [worldId,setWorldId]=useState('luna'),[routeId,setRouteId]=useState('patrol'),[tab,setTab]=useState('explore');
  const [invites,setInvites]=useState([]),[error,setError]=useState('');
  const battle=useBattleArena(encounterId),{hub,user}=battle;
  useEffect(()=>{arenaPresentation.setVisible(!!encounterId);return()=>arenaPresentation.setVisible(false);},[encounterId]);
  useEffect(()=>{if(initialEncounterId)setEncounterId(initialEncounterId);},[initialEncounterId]);
  const run=async task=>{setError('');try{return await task();}catch(e){setError(e.message||'This action could not finish. Please try again.');}};
  const world=hub?.worlds.find(w=>w.id===worldId)||hub?.worlds[0];
  const route=hub?.routes.find(r=>r.id===routeId);
  const pending=hub?.encounters.filter(e=>['lobby','active'].includes(e.status)&&!e.declined.includes(user?.id))||[];
  const journal=hub?.encounters.filter(e=>!['lobby','active'].includes(e.status))||[];
  const xp=journal.reduce((total,e)=>total+(e.claimed.includes(user?.id)?e.route.xp:0),0);
  const selectRoute=id=>{setRouteId(id);setInvites([]);};
  const create=()=>run(async()=>{const response=await battle.create({world_id:world.id,route_id:route.id,invited_ids:invites});setEncounterId(response.encounter.id);});
  return <Dialog.Root open onOpenChange={open=>{if(!open)onClose();}}><Dialog.Portal><Dialog.Content className="ab-workspace" data-dashboard-utility-workspace aria-describedby="ab-description">
    <header className="ab-header"><div className="ab-brand"><Swords size={22}/><div><span className="ab-eyebrow">LUNA / PLAY BEYOND THE GAME</span><Dialog.Title>AI Battle</Dialog.Title></div></div><div className="ab-header-actions"><span><Layers size={15}/>{hub?.player.cards.length||0}/4 cards</span><span><Zap size={15}/>{xp} recent XP</span><Dialog.Close className="ab-close" aria-label="Close AI Battle"><X size={19}/></Dialog.Close></div></header>
    <Dialog.Description id="ab-description" className="sr-only">Explore worlds connected to your games, bring achievement cards into battle, and fight beside or against other players on your dashboard.</Dialog.Description>
    {error&&<div className="ab-alert" role="alert"><p>{error}</p><button onClick={()=>setError('')} aria-label="Dismiss battle error"><X size={15}/></button></div>}
    {battle.error&&<div className="ab-alert" role="alert"><p>{battle.error.message||'AI Battle could not connect.'}</p><button onClick={battle.refresh}>Reconnect</button></div>}
    <main className="ab-scroll">
    {battle.isLoading?<div className="ab-loading" role="status"><Loader2 className="animate-spin"/><p>Preparing your expedition…</p></div>:encounterId&&battle.encounter?<Encounter battle={battle} run={run} onBack={()=>setEncounterId(null)} onClose={onClose}/>:hub&&<>
      <nav className="ab-tabs" aria-label="AI Battle sections">{[['explore','Explore',Compass],['duels','Card duels',Swords],['journal','Journal',History]].map(([id,title,Icon])=><button key={id} aria-current={tab===id?'page':undefined} onClick={()=>{setTab(id);if(id==='duels')selectRoute('duel');else if(routeId==='duel')selectRoute('patrol');}}><Icon size={16}/>{title}</button>)}<button className="ab-classic" onClick={onClassic}>Existing activities<ChevronRight size={14}/></button></nav>
      {pending.length>0&&<section className="ab-pending" aria-label="Current expeditions">{pending.map(e=><button key={e.id} onClick={()=>setEncounterId(e.id)}><span className="ab-status-dot"/><div><strong>{e.players.some(p=>p.id===user?.id)?'Resume '+e.route.title:e.host_name+' invited you'}</strong><span>{e.world.title} · {e.players.length} player{e.players.length!==1?'s':''}</span></div><ArrowRight size={17}/></button>)}</section>}
      {tab==='journal'?<section className="ab-journal"><span className="ab-eyebrow">YOUR LAST 30 EXPEDITIONS</span><h2>Every journey leaves a mark.</h2><p>Field chests record Expedition XP here. Your equipped cards come from your existing collection.</p>{journal.length?journal.map(e=><button key={e.id} onClick={()=>setEncounterId(e.id)}><Trophy size={20}/><div><strong>{e.route.title}</strong><span>{e.world.title} · {e.status}</span></div><b>{e.claimed.includes(user.id)?'+'+e.route.xp+' XP':e.status==='victory'?'View chest':'View encounter'}</b><ChevronRight size={16}/></button>):<div className="ab-empty"><Compass size={30}/><h3>Your first chapter is waiting.</h3><p>Complete an expedition to begin your journal.</p><button onClick={()=>setTab('explore')}>Explore routes</button></div>}</section>:<>
      <section className="ab-hero" style={background(world?.image)}><div className="ab-hero-copy"><span className="ab-badge"><span className="ab-status-dot"/>{tab==='duels'?'DASHBOARD ARENA':'YOUR GAMES. A CONNECTED FRONTIER.'}</span><h2>{tab==='duels'?<>Bring your cards.<br/><em>Challenge a friend.</em></>:<>The worlds you play.<br/><em>The power you earned.</em></>}</h2><p>{tab==='duels'?'Two avatars. Four cards each. Trade turns, manage action points, and outthink your opponent on the shared dashboard.':'Turn your card collection into an expedition. Cross rifts, clear dungeons, and rally your party against a shared world boss.'}</p><div className="ab-hero-facts"><span><Trophy size={15}/>Game-earned cards</span><span><Users size={15}/>1–5 players</span><span><Shield size={15}/>Active defense</span></div></div><div className="ab-hero-orbit" aria-hidden="true"><i/><i/><Compass size={70}/><span>EXPEDITION<br/>NETWORK</span></div></section>
      <div className="ab-planner"><div className="ab-main-column">
        {tab==='explore'&&<section><div className="ab-section-title"><div><span className="ab-eyebrow">01 / CHOOSE YOUR WORLD</span><h3>Follow your collection.</h3></div><span>{hub.worlds.length} connected {hub.worlds.length===1?'world':'worlds'}</span></div><div className="ab-worlds">{hub.worlds.map(w=><button key={w.id} aria-pressed={world?.id===w.id} onClick={()=>setWorldId(w.id)} className={world?.id===w.id?'is-selected':''}>{w.image?<img src={w.image} alt=""/>:<Compass size={23}/>}<span><strong>{w.title}</strong><small>{w.id==='luna'?'Open to every player':w.cards+' cards · '+w.earned+' earned'}</small></span>{world?.id===w.id&&<Check size={15}/>}</button>)}</div><p className="ab-help">Worlds follow your played games and owned cards. Cards from the selected game gain +5 effect strength in its rifts.</p></section>}
        <section><div className="ab-section-title"><div><span className="ab-eyebrow">{tab==='duels'?'01':'02'} / CHOOSE YOUR ENCOUNTER</span><h3>{tab==='duels'?'An invitation, never an ambush.':'Find your next challenge.'}</h3></div></div><div className="ab-routes">{hub.routes.filter(r=>tab==='duels'?r.type==='pvp':r.type!=='pvp').map(r=>{const Icon=icons[r.type]||Compass;return <button key={r.id} className={'ab-route '+(routeId===r.id?'is-selected':'')} aria-pressed={routeId===r.id} onClick={()=>selectRoute(r.id)}><div className="ab-route-symbol"><Icon size={24}/></div><div><span className="ab-eyebrow">{r.type.replace('_',' ')}</span><h4>{r.title}</h4><p>{r.description}</p><div className="ab-route-meta"><span><Users size={13}/>{r.min===r.max?r.min:r.min+'–'+r.max} players</span><span><Map size={13}/>{r.stages.length||1} {r.stages.length>1?'rooms':'arena'}</span><span><Gem size={13}/>{r.xp} XP</span></div></div><span className="ab-radio" aria-hidden="true">{routeId===r.id&&<Check size={12}/>}</span></button>;})}</div></section>
        <section className="ab-achievement-path"><Trophy size={24}/><div><h3>Your achievements become your arsenal.</h3><p>Earn cards through your games, equip them in the Skill Book, then bring their abilities into an expedition. Abilities strike, Equipment protects, and Companions restore health.</p></div><div><span>PLAY</span><ChevronRight size={12}/><span>EARN</span><ChevronRight size={12}/><span>EQUIP</span><ChevronRight size={12}/><span>BATTLE</span></div></section>
      </div><aside className="ab-preparation"><span className="ab-eyebrow">EXPEDITION LOADOUT</span><h3>Ready when you are.</h3><p>Four slots. Every card has a purpose.</p><div className="ab-loadout-list">{hub.player.cards.length?hub.player.cards.map(c=><div key={c.id}>{c.image?<img src={c.image} alt=""/>:<Layers size={20}/>}<div><strong>{c.name}</strong><span>{effectLabels[c.effect]} {c.value} · {c.cost} AP</span><small>{c.game_name||c.type}</small></div></div>):<div className="ab-empty-deck"><Layers size={26}/><strong>Equip your first card</strong><p>Open the dashboard’s Cards / Skill Book and equip an owned card to enter battle.</p></div>}</div>
        <div className="ab-prep-divider"/><div className="ab-section-title"><h4>Bring your party</h4><span>{invites.length+1}/{route?.max||5}</span></div><p>{route?.min>1?'Choose at least one player to invite.':'Go solo, or invite friends and dashboard visitors.'}</p>
        <div className="ab-contacts">{hub.contacts.length?hub.contacts.map(p=><label key={p.id}><input type="checkbox" checked={invites.includes(p.id)} disabled={!invites.includes(p.id)&&invites.length>=(route?.max||5)-1} onChange={event=>setInvites(ids=>event.target.checked?[...ids,p.id]:ids.filter(id=>id!==p.id))}/>{p.portrait?<img src={p.portrait} alt=""/>:<Users size={17}/>}<span><strong>{p.name}</strong><small>{p.in_dashboard?'On your dashboard':p.kind==='party'?'Party member':'Friend'}</small></span></label>):<p className="ab-help">Add a friend or invite someone to your dashboard to adventure together.</p>}</div>
        <button className="ab-primary ab-depart" disabled={battle.busy||!hub.player.cards.length||!route||invites.length+1<(route?.min||1)||pending.some(e=>e.host_id===user?.id)} onClick={create}>{battle.busy?<Loader2 size={16} className="animate-spin"/>:<ArrowRight size={16}/>}Create {tab==='duels'?'duel lobby':'expedition'}</button><p className="ab-help">Your cards lock when you join. Invited players choose whether to accept.</p>
      </aside></div>
      </>}
    </>}
    </main><footer className="ab-footer"><span><Heart size={12}/>Your avatar. Your progress. Your party.</span><span>AI BATTLE / LUNA</span></footer>
  </Dialog.Content></Dialog.Portal></Dialog.Root>;
}

// Offline vertical slice. A 100-player server and voice transport are NOT
// implemented; this shared state couples the three theaters in one local match.
export const FLEET_ROLES = Object.freeze([
 { id:'pilot', name:'Starfighter Pilot', description:'Bombard the flagship from orbit.' },
 { id:'security_director', name:'Security Director', description:'Coordinate defense and automated turrets.' },
 { id:'security_trooper', name:'Security Foot Soldier', description:'Protect ship corridors and control stations.' },
 { id:'breacher', name:'Heavy Assault', description:'Clear the boarding corridors.' },
 { id:'infiltrator', name:'Stealth Infiltrator', description:'Hunt the enemy Jedi commander.' },
 { id:'saboteur', name:'Reactor Saboteur', description:'Destroy the capital ship reactor.' },
 { id:'ground', name:'Planetary Relay Squad', description:'Capture fleet communications on the planet.' },
 { id:'commander', name:'Flagship Commander', description:'Coordinate all three battlefronts.' },
]);
export const clamp=(n,lo=0,hi=100)=>Math.max(lo,Math.min(hi,Number(n)||0));
export const commanderMaxHP=h=>Math.round(240*(0.3+0.7*(clamp(h)/100)**1.8));
export const commanderFocusDebuff=h=>Math.round(100*(1-1/(1+Math.exp(-0.08*(clamp(h)-40)))));
export const getSecurityState=h=>h>75?{turrets:100,vents:'LOCKED'}:h>40?{turrets:50,vents:'PARTIAL'}:h>10?{turrets:10,vents:'OPEN'}:{turrets:0,vents:'OPEN'};
export function newFleetMatch(role='pilot'){
 return {status:'active',role:FLEET_ROLES.some(r=>r.id===role)?role:'pilot',theater:'orbit',turn:0,hull:100,ownHull:100,shields:60,reactor:100,
  commanderHP:240,relay:0,relayOwner:'hostile',guards:3,jedi:2,breach:false,
  tickets:{friendly:100,hostile:100},actions:{torpedoes:0,strikes:0,broadcasts:0},victory:null,
  log:[{text:'Fleet command: Hostile flagship detected. Secure the relay and prepare a boarding team.',theater:'command'}]};
}
const say=(s,text,theater)=>{s.log=[{text,theater},...s.log].slice(0,9)};
const finish=s=>{
 s.commanderHP=Math.min(s.commanderHP,commanderMaxHP(s.hull));
 s.relayOwner=s.relay===100?'friendly':s.relay>0?'contested':'hostile';
 if(s.tickets.friendly===0||s.ownHull===0){s.status='defeat';say(s,'Fleet command lost the engagement.','command');return s;}
 s.victory=s.hull===0?'Flagship destroyed by orbital fire':s.reactor===0?'Enemy reactor sabotaged':s.commanderHP===0?'Jedi commander defeated':s.tickets.hostile===0?'Enemy reinforcements depleted':null;
 if(s.victory){s.status='victory';say(s,'MISSION COMPLETE — '+s.victory,'command');}
 return s;
};
export function dispatchFleetAction(prev,action){
 if(action?.type==='RESTART')return newFleetMatch(action.role||prev.role);
 if(prev.status!=='active')return prev;
 const s={...prev,tickets:{...prev.tickets},actions:{...prev.actions},log:[...prev.log],turn:prev.turn+1};
 switch(action?.type){
 case 'GO_ORBIT':s.theater='orbit';say(s,'Pilot channel: Orbital battle resumed.','orbit');break;
 case 'GO_PLANET':s.theater='planet';say(s,'Ground command: Capture the planetary communications relay.','planet');break;
 case 'GO_BOARD':
  if(!s.breach&&s.hull>75){s.tickets.friendly=clamp(s.tickets.friendly-10);say(s,'Early boarding under active point defenses cost 10 tickets.','boarding');}
  s.breach=true;s.theater='boarding';say(s,'Breach established: clear guards, Jedi, and the commander.','boarding');break;
 case 'TORPEDO':{
  if(s.theater!=='orbit')return prev;
  const dmg=s.relayOwner==='friendly'?23:15,absorbed=Math.min(dmg,s.shields);
  s.shields=clamp(s.shields-absorbed);s.hull=clamp(s.hull-(dmg-absorbed));s.actions.torpedoes++;
  say(s,absorbed===dmg?'Torpedo hit enemy shields.':'Torpedo breached the enemy hull.','orbit');break;
 }
 case 'CLEAR_GUARD':
  if(s.theater!=='boarding'||!s.breach||!s.guards)return prev;
  s.guards=clamp(s.guards-(s.role==='breacher'?2:1));s.tickets.hostile=clamp(s.tickets.hostile-2);s.actions.strikes++;say(s,'Security trooper defeated; '+s.guards+' remain.','boarding');break;
 case 'DEFEAT_JEDI':
  if(s.theater!=='boarding'||s.guards||!s.jedi)return prev;
  s.jedi=clamp(s.jedi-(s.role==='infiltrator'?2:1));s.tickets.hostile=clamp(s.tickets.hostile-5);s.actions.strikes++;say(s,'Enemy Jedi defeated; '+s.jedi+' remain.','boarding');break;
 case 'ATTACK_COMMANDER':
  if(s.theater!=='boarding'||s.guards||s.jedi)return prev;
  s.commanderHP=clamp(s.commanderHP-32,0,commanderMaxHP(s.hull));s.actions.strikes++;
  say(s,'Commander struck. Remaining HP: '+s.commanderHP+'.','boarding');break;
 case 'SABOTAGE':
  if(s.theater!=='boarding'||s.guards)return prev;
  s.reactor=clamp(s.reactor-(s.role==='saboteur'?50:34));say(s,'Reactor sabotage successful. Core at '+s.reactor+'%.','boarding');break;
 case 'CAPTURE_RELAY':
  if(s.theater!=='planet')return prev;
  s.relay=clamp(s.relay+(s.role==='ground'?50:25));say(s,s.relay===100?'Relay captured — friendly fleet targeting enhanced.':'Relay code upload: '+s.relay+'%.','planet');break;
 case 'CLEAR_GROUND':
  if(s.theater!=='planet')return prev;
  s.tickets.hostile=clamp(s.tickets.hostile-5);say(s,'Ground infantry cleared from relay perimeter.','planet');break;
 case 'RADIO':s.actions.broadcasts++;say(s,action.message||'Requesting reinforcement support.',action.channel||'squad');break;
 default:return prev;
 }
 return finish(s);
}
export function currentObjective(s){
 if(s.status==='victory')return s.victory;
 if(s.status==='defeat')return 'Defeat — restart the operation.';
 if(s.theater==='orbit')return s.shields?'Break the flagship shields with torpedoes.':'Damage the hull or board the enemy flagship.';
 if(s.theater==='planet')return s.relay<100?'Capture the communications relay.':'Defend the relay and support the orbiting fleet.';
 if(s.guards)return 'Clear '+s.guards+' boarding security guards.';
 if(s.jedi)return 'Defeat '+s.jedi+' enemy Jedi on the bridge.';
 return 'Defeat the commander or sabotage the reactor.';
}

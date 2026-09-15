import {base44} from '@/api/base44Client';
import {useSyncExternalStore} from 'react';

const empty={channel_id:null,host_id:null,players:[],status:'offline',error:''};
let snapshot=empty;
const listeners=new Set();
export const dashboardSession={
 getSnapshot:()=>snapshot,
 subscribe(fn){listeners.add(fn);return()=>listeners.delete(fn);},
 publish(next){snapshot={...empty,...next};listeners.forEach(fn=>fn());},
};
export const useDashboardSession=()=>useSyncExternalStore(dashboardSession.subscribe,dashboardSession.getSnapshot);
export function unwrap(result){const body=result?.data??result;if(body?.error)throw new Error(body.error);return body||{};}
export async function joinDashboard(target){
 const id=String(target.friend_id||target.player_id||target.id||'').trim();
 if(!id)throw new Error('Choose a player first.');
 const detail={
  channelId:`dashboard_${id}`,
  hostId:id,
  hostName:target.friend_name||target.name||target.display_name||'Friend',
  socialJoin:true,
 };
 // Joining is a UI/session action first. Never make the button wait on a
 // presence preflight: immediately move Luna into the requested dashboard
 // channel, then let the heartbeat establish/verify the live room.
 window.__lunaPendingDashboardJoin=detail;
 window.dispatchEvent(new CustomEvent('joinMultiplayerChannel',{detail}));
 try{
  const body=unwrap(await base44.functions.invoke('dashboardSession',{action:'join',data:{host_id:id}}));
  const resolved={...detail,channelId:body.channel_id||detail.channelId,hostName:body.host_name||detail.hostName};
  window.__lunaPendingDashboardJoin=resolved;
  if(body.env_url)window.dispatchEvent(new CustomEvent('changeEnvironment',{detail:{envUrl:body.env_url}}));
  return {...body,channel_id:resolved.channelId,host_name:resolved.hostName};
 }catch(error){
  // The room heartbeat owns the authoritative connected/error state. A stale
  // presence lookup must not turn Join Dashboard into an unclickable action.
  console.warn('[dashboardSession] join preflight failed; heartbeat will retry',error);
  return {success:true,pending:true,channel_id:detail.channelId,host_id:id,host_name:detail.hostName};
 }
}
export function openPlayerMessage(target){
 window.__lunaPendingMessageTarget=target;
 window.dispatchEvent(new CustomEvent('openLunaMessages',{detail:{target}}));
}
export function isLivePlayer(p,now=Date.now()){
 return !!p?.player_id&&p.status!=='offline'&&Number(p.last_update)>now-20000;
}

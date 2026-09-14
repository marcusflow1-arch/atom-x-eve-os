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
 const id=String(target.friend_id||target.player_id||target.id||'');
 if(!id)throw new Error('Choose a player first.');
 const body=unwrap(await base44.functions.invoke('dashboardSession',{action:'join',data:{host_id:id}}));
 const detail={channelId:body.channel_id,hostId:id,hostName:body.host_name||target.friend_name||target.name||'Friend',socialJoin:true};
 // Retained until the Luna route mounts when accepting from Notifications.
 window.__lunaPendingDashboardJoin=detail;
 window.dispatchEvent(new CustomEvent('joinMultiplayerChannel',{detail}));
 if(body.env_url)window.dispatchEvent(new CustomEvent('changeEnvironment',{detail:{envUrl:body.env_url}}));
 return body;
}
export function openPlayerMessage(target){
 window.__lunaPendingMessageTarget=target;
 window.dispatchEvent(new CustomEvent('openLunaMessages',{detail:{target}}));
}
export function isLivePlayer(p,now=Date.now()){
 return !!p?.player_id&&p.status!=='offline'&&Number(p.last_update)>now-20000;
}

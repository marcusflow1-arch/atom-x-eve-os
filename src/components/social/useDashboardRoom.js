import {useEffect,useRef,useState} from 'react';
import {base44} from '@/api/base44Client';
import {dashboardSession,unwrap} from './dashboardSession';

export function useDashboardRoom(channel,user,envUrl){
 const [participants,setParticipants]=useState([]);
 const env=useRef(envUrl);env.current=envUrl;
 useEffect(()=>{
  setParticipants([]);
  if(!user?.id||!channel?.startsWith('dashboard_')){dashboardSession.publish({});return;}
  let disposed=false,timer;
  const hostId=channel.slice(10);
  dashboardSession.publish({channel_id:channel,host_id:hostId,status:'connecting'});
  const tick=async()=>{
   let retryDelay=15000;
   try{
    const state=unwrap(await base44.functions.invoke('dashboardSession',{action:'heartbeat',data:{host_id:hostId,env_url:env.current}}));
    if(disposed)return;
    dashboardSession.publish({...state,status:'connected'});
    const others=state.players.filter(p=>p.player_id!==user.id);
    setParticipants(previous=>{
     const next=others.map(p=>p.player_id).sort();
     return previous.join('|')===next.join('|')?previous:next;
    });
    window.dispatchEvent(new CustomEvent('multiplayerPlayersUpdate',{detail:{players:others,channelId:channel}}));
    if(hostId!==user.id&&state.env_url&&state.env_url!==env.current)
      window.dispatchEvent(new CustomEvent('changeEnvironment',{detail:{envUrl:state.env_url}}));
   }catch(error){
    if(disposed)return;
    retryDelay=60000;
    const message=error.response?.data?.error||error.message||'Dashboard connection interrupted.';
    dashboardSession.publish({channel_id:channel,host_id:hostId,status:'error',error:message});
    setParticipants([]);
    window.dispatchEvent(new CustomEvent('multiplayerPlayersUpdate',{detail:{players:[],channelId:channel}}));
   }finally{if(!disposed)timer=setTimeout(tick,retryDelay);}
  };
  tick();
  return()=>{
   disposed=true;clearTimeout(timer);
   dashboardSession.publish({});
   // Expire only the room being left; backend checks the current channel.
   base44.functions.invoke('dashboardSession',{action:'leave',data:{channel_id:channel}}).catch(()=>{});
  };
 },[channel,user?.id]);
 return participants;
}
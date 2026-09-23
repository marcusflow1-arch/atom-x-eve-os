import { useEffect, useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/components/auth/AuthContext';

const requestId=()=>globalThis.crypto?.randomUUID?.()||Date.now().toString(36)+'-'+Math.random().toString(36).slice(2);
const QUEUE_COOLDOWN_MS=5000;

async function invoke(action,data={}){
  try{
    const response=await base44.functions.invoke('ai-battle-arena',{action,data});
    const body=response?.data??response;
    if(body?.error)throw Object.assign(new Error(body.error),{state:body});
    return body;
  }catch(error){
    const body=error?.response?.data??error?.data;
    if(body?.error)throw Object.assign(new Error(body.error),{state:body});
    throw error;
  }
}

export default function useBattleArena(encounterId){
  const {user}=useAuth(),client=useQueryClient();
  const offset=useRef(0);
  const queueLock=useRef(false);
  const key=['battle-expeditions',user?.id];
  const hub=useQuery({queryKey:key,enabled:!!user?.id,queryFn:()=>invoke('hub'),staleTime:6000,refetchInterval:6000,refetchOnWindowFocus:false,retry:false});
  const fightKey=['battle-encounter',user?.id,encounterId];
  const fight=useQuery({queryKey:fightKey,enabled:!!user?.id&&!!encounterId,queryFn:()=>invoke('state',{encounter_id:encounterId}),refetchInterval:1500,refetchOnWindowFocus:false,retry:false});
  const body=fight.data;
  useEffect(()=>{if(body?.server_time)offset.current=body.server_time-Date.now();},[body?.server_time]);
  useEffect(()=>{
    if(!encounterId)return undefined;
    const encounter=body?.encounter || hub.data?.encounters?.find(r=>r.id===encounterId) || null;
    window.dispatchEvent(new CustomEvent('lunaBattleStateChanged',{detail:{encounter,userId:user?.id||null}}));
    return()=>window.dispatchEvent(new CustomEvent('lunaBattleStateChanged',{detail:{encounter:null,userId:user?.id||null}}));
  },[body?.encounter,hub.data?.encounters,encounterId,user?.id]);
  const mutation=useMutation({
    mutationFn:async({action,data})=>invoke(action,{...data,request_id:requestId()}),retry:false,
    onSuccess:body=>{
      if(body.encounter)client.setQueryData(['battle-encounter',user?.id,body.encounter.id],body);
      if(body.server_time)offset.current=body.server_time-Date.now();
      client.invalidateQueries({queryKey:key});
      if(body.reward){
        client.invalidateQueries({queryKey:['luna-skill-book',user?.id]});
        client.invalidateQueries({queryKey:['luna-equipment-loadout',user?.id]});
        window.dispatchEvent(new CustomEvent('lunaProgressionChanged',{detail:{reward:body.reward}}));
        window.dispatchEvent(new CustomEvent('syncPlayerStats',{detail:{source:'ai_battle_reward',reward:body.reward}}));
      }
    },
    onError:error=>{
      if(error.state?.encounter)client.setQueryData(['battle-encounter',user?.id,error.state.encounter.id],error.state);
      if(encounterId)client.invalidateQueries({queryKey:fightKey});
    }
  });
  const queue=async(data={})=>{
    if(queueLock.current||mutation.isPending)throw new Error('Matchmaking request already sent. Please wait a few seconds.');
    queueLock.current=true;
    try{return await mutation.mutateAsync({action:'queue',data});}
    finally{window.setTimeout(()=>{queueLock.current=false;},QUEUE_COOLDOWN_MS);}
  };
  const encounter=body?.encounter || hub.data?.encounters?.find(r=>r.id===encounterId);
  return {user,hub:hub.data,encounter,isLoading:hub.isLoading||(!!encounterId&&fight.isLoading&&!encounter),error:hub.error||fight.error,busy:mutation.isPending,serverOffset:offset.current,refresh:()=>{hub.refetch();if(encounterId)fight.refetch();},create:data=>mutation.mutateAsync({action:'create',data}),field:data=>mutation.mutateAsync({action:'field',data}),queue,demoBot:data=>mutation.mutateAsync({action:'demoBot',data}),queueStatus:()=>mutation.mutateAsync({action:'queueStatus',data:{}}),cancelQueue:()=>mutation.mutateAsync({action:'cancelQueue',data:{}}),command:(command,data={})=>mutation.mutateAsync({action:'command',data:{encounter_id:encounterId,expected_revision:encounter?.revision,command,...data}})};
}

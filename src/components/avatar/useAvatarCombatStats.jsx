import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/components/auth/AuthContext';
const unwrap = response => response?.data ?? response;
async function invoke(action, data={}) {
  try {
    const body=unwrap(await base44.functions.invoke('avatarStats',{action,data}));
    if(body?.error)throw new Error(body.error);
    return body;
  } catch(error) { throw new Error(error?.response?.data?.error || error?.message || 'Avatar stats could not be saved.'); }
}
export default function useAvatarCombatStats() {
  const {user}=useAuth(), client=useQueryClient(), key=['avatar-combat-stats',user?.id];
  const query=useQuery({queryKey:key,queryFn:()=>invoke('getState'),enabled:Boolean(user?.id),staleTime:15000});
  useEffect(()=>{
    if(!user?.id)return;
    const refresh=()=>{void client.invalidateQueries({queryKey:['avatar-combat-stats',user.id]},{cancelRefetch:false});};
    const events=['syncPlayerStats','avatarLevelUp','lunaProgressionChanged','lunaEquipmentChanged','cardProgressionChanged'];
    events.forEach(name=>window.addEventListener(name,refresh));
    return()=>events.forEach(name=>window.removeEventListener(name,refresh));
  },[client,user?.id]);
  const mutation=useMutation({
    mutationFn:({action='allocate',data})=>invoke(action,{...data,expected_revision:query.data?.revision,request_id:crypto.randomUUID()}),
    retry:false,
    onSuccess:next=>{
      client.setQueryData(key,next);
      void client.invalidateQueries({queryKey:['luna-skill-book',user?.id]});
      void client.invalidateQueries({queryKey:['avatar-progression',user?.id]});
      window.dispatchEvent(new CustomEvent('avatarCombatStatsSaved',{detail:{user_id:user?.id,state:next}}));
    },
    onError:()=>{void query.refetch();},
  });
  return {...query,state:query.data,save:mutation.mutateAsync,saving:mutation.isPending,saveError:mutation.error};
}

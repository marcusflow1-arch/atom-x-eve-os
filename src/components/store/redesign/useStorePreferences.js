import {useEffect,useState} from 'react';
import {useQuery} from '@tanstack/react-query';
import {base44} from '@/api/base44Client';
import {useAuth} from '@/components/auth/AuthContext';
const defaults={genres:[],played_game_ids:[],use_play_history:true};
export function useStorePreferences(){
 const {user}=useAuth();
 const [preference,setPreference]=useState(defaults),[saving,setSaving]=useState(false),[error,setError]=useState('');
 const query=useQuery({queryKey:['store-preferences',user?.id],enabled:!!user?.id,queryFn:async()=>{
  const {data}=await base44.functions.invoke('storeDiscovery',{action:'context'});
  if(data.error)throw new Error(data.error);return data;
 }});
 useEffect(()=>{
  setPreference(defaults);setError('');
  if(!user?.id){try{setPreference(JSON.parse(localStorage.getItem('atomxe-store-guest-preferences'))||defaults);}catch{}}
 },[user?.id]);
 useEffect(()=>{if(query.data?.preference)setPreference(query.data.preference);},[query.data]);
 const save=async next=>{
  setSaving(true);setError('');
  try{
   if(user?.id){const {data}=await base44.functions.invoke('storeDiscovery',{action:'save',data:next});if(data.error)throw new Error(data.error);}
   else localStorage.setItem('atomxe-store-guest-preferences',JSON.stringify(next));
   setPreference(next);return true;
  }catch(e){setError(e.response?.data?.error||e.message);return false;}finally{setSaving(false);}
 };
 return {preference,save,saving,error:error||(query.error?'Saved preferences could not load.':''),playedIds:query.data?.played_game_ids||[],ownedIds:query.data?.owned_game_ids||user?.purchased_items||[]};
}

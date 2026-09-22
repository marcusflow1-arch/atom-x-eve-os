import {useEffect,useRef,useState} from 'react';
import {useQuery,useQueryClient} from '@tanstack/react-query';
import {useNavigate} from 'react-router-dom';
import {Bell,Check,X,MessageSquare} from 'lucide-react';
import {toast} from 'react-hot-toast';
import {base44} from '@/api/base44Client';
import {useAuth} from '@/components/auth/AuthContext';
import {joinDashboard,openPlayerMessage,unwrap} from './dashboardSession';

export function useSocialNotifications(){
 const {user}=useAuth();
 const query=useQuery({queryKey:['system-social-notifications',user?.id],enabled:!!user?.id,
  queryFn:async()=>unwrap(await base44.functions.invoke('socialActions',{action:'get_pending_actions'})),
  retry:false,
  refetchInterval:(query)=>query.state.error?120000:30000,
  refetchIntervalInBackground:false});
 return {...query,notifications:query.data?.notifications||[]};
}
export function SocialNotificationAlerts(){
 const {notifications}=useSocialNotifications();
 const seen=useRef(new Set());const navigate=useNavigate();
 const {user}=useAuth();
 useEffect(()=>{
  if(!user?.id)return;
  const record=event=>{const id=event.detail?.game?.id;if(id)base44.functions.invoke('storeDiscovery',{action:'record_play',data:{game_id:id}}).catch(()=>{});};
  window.addEventListener('atomxe:game-launch',record);
  return()=>window.removeEventListener('atomxe:game-launch',record);
 },[user?.id]);
 useEffect(()=>{
  const fresh=notifications.filter(n=>n.status==='unread'&&!seen.current.has(n.id));
  notifications.forEach(n=>seen.current.add(n.id));
  if(!fresh.length)return;
  const latest=fresh[0];
  toast.custom(t=><button onClick={()=>{toast.dismiss(t.id);navigate('/Notifications');}}
    className="max-w-xs rounded-xl bg-slate-900/95 p-4 text-left text-white shadow-xl ring-1 ring-cyan-200/15">
    <span className="block text-xs text-cyan-200">System notifications</span>
    <span className="mt-1 block text-sm">{latest.body||latest.title}</span>
    <span className="mt-2 block text-xs text-white/50">View {fresh.length>1?fresh.length+' new notifications':'and respond'}</span>
   </button>,{duration:6000});
 },[notifications,navigate]);
 return null;
}
export default function SocialNotifications(){
 const {notifications,isLoading,error,refetch}=useSocialNotifications();
 const [busy,setBusy]=useState(''),[failure,setFailure]=useState('');
 const navigate=useNavigate(),queries=useQueryClient();
 const respond=async(notice,accept)=>{
  if(busy)return;setBusy(notice.id);setFailure('');
  try{
   const id=notice.related_entity_id;
   let result;
   if(notice.action_kind==='party_invite'){
    result=unwrap(await base44.functions.invoke('partySystem',{action:accept?'accept_invite':'decline_invite',data:{inviteId:id}}));
    window.dispatchEvent(new Event('lunaSocialChanged'));
    if(accept)window.dispatchEvent(new Event('openLunaParty'));
   }else{
    result=unwrap(await base44.functions.invoke('socialActions',{action:notice.action_kind==='friend_request'?'respond_friend_request':'respond_dashboard_invite',data:{request_id:id,decision:accept?'accept':'decline'}}));
   }
   window.dispatchEvent(new Event('lunaSocialChanged'));
   await queries.invalidateQueries({predicate:q=>/friend|social|party/i.test(String(q.queryKey[0]))});
   await refetch();
   if(accept&&notice.action_kind==='dashboard_invite'&&result.accepted){
    await joinDashboard({id:result.host_user_id,name:result.host_name});
    navigate('/LunaTemplate');
   }
  }catch(e){setFailure(e.response?.data?.error||e.message||'Please try again.');}
  finally{setBusy('');}
 };
 const openMessage=n=>{openPlayerMessage({id:n.actor_id,name:n.actor_name,avatar:n.actor_avatar});navigate('/LunaTemplate');};
 return <section aria-label="System notifications" className="space-y-3">
  <h2 className="flex items-center gap-2 text-lg font-semibold"><Bell size={18}/>System notifications</h2>
  {(failure||error)&&<p role="alert" className="text-sm text-rose-300">{failure||'Notifications could not load.'}<button onClick={()=>refetch()} className="ml-2 underline">Retry</button></p>}
  {isLoading?<p role="status">Loading notifications…</p>:!notifications.length?<p className="py-10 text-sm text-white/45">You're all caught up.</p>:notifications.map(n=><article key={n.id} className="rounded-xl bg-white/[0.045] p-4">
   <div className="flex items-start gap-3">{n.actor_avatar&&<img src={n.actor_avatar} alt="" className="h-10 w-10 rounded-full object-cover"/>}
    <div className="min-w-0 flex-1"><p className="text-sm font-medium">{n.title}{n.status==='unread'&&<span className="ml-2 text-cyan-300">•</span>}</p>
    <p className="mt-1 text-sm text-white/60">{n.body}</p><time className="mt-1 block text-xs text-white/30">{n.created_date?new Date(n.created_date).toLocaleString():''}</time>
    {n.actionable?<div className="mt-3 flex gap-2">
     <button disabled={!!busy} onClick={()=>respond(n,true)} className="flex items-center gap-1 rounded-lg bg-cyan-200 px-3 py-2 text-xs font-semibold text-slate-950 disabled:opacity-50"><Check size={14}/>{busy===n.id?'Working…':n.action_kind==='friend_request'?'Accept':'Join'}</button>
     <button disabled={!!busy} onClick={()=>respond(n,false)} className="flex items-center gap-1 rounded-lg bg-white/5 px-3 py-2 text-xs"><X size={14}/>Decline</button>
    </div>:n.type==='message'?<button onClick={()=>openMessage(n)} className="mt-3 flex items-center gap-1 text-xs text-cyan-200"><MessageSquare size={14}/>Open message</button>:null}
   </div></div>
  </article>)}
 </section>;
}
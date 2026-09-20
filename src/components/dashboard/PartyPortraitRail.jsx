import {useState} from 'react';
import {useAuth} from '@/components/auth/AuthContext';
import {usePartySession} from '@/components/social/partySession';
import {useDashboardSession,openPlayerMessage} from '@/components/social/dashboardSession';
import {MessageSquare,Users,LogOut} from 'lucide-react';

export default function PartyPortraitRail(){
 const {user}=useAuth(),party=usePartySession(),session=useDashboardSession();
 const [selected,setSelected]=useState(null);
 const byId=new Map();
 for(const m of party.members||[])byId.set(m.user_id,{id:m.user_id,name:m.user_name,avatar:m.user_avatar,party:true});
 for(const p of session.players||[]) if(p.player_id!==user?.id || party.party) byId.set(p.player_id,{...byId.get(p.player_id),id:p.player_id,name:p.display_name,avatar:p.avatar_url,present:true});
 const members=[...byId.values()].slice(0,5);
 if(!members.length)return null;
 return <div data-social-controls className="absolute top-[26px] z-50 flex flex-col gap-2 pointer-events-auto" style={{right:'calc(min(338px, 30vw) + 10px)'}} aria-label="Party and dashboard members">
  {members.map(m=><div key={m.id} className="relative">
   <button type="button" aria-label={m.name+(m.present?' · On this dashboard':' · In party')} aria-expanded={selected===m.id}
    onClick={()=>setSelected(selected===m.id?null:m.id)} className="relative h-16 w-16 overflow-hidden rounded-xl bg-slate-800/70 ring-1 ring-white/15 backdrop-blur-xl">
    {m.avatar?<img src={m.avatar} alt="" className="h-full w-full object-cover"/>:<span className="text-xl text-cyan-100">{m.name?.[0]||'P'}</span>}
    <span className="absolute bottom-0 inset-x-0 truncate bg-slate-950/80 px-1 py-1 text-[9px] text-white">{m.id===user?.id?'You':m.name}</span>
    <span className={'absolute right-1 top-1 h-2 w-2 rounded-full '+(m.present?'bg-emerald-300':'bg-slate-400')}/>
   </button>
   {selected===m.id&&<div className="absolute right-[72px] top-0 w-44 rounded-xl bg-slate-950/95 p-2 text-xs text-white shadow-xl">
    {m.id!==user?.id&&<button className="flex w-full gap-2 rounded p-2 hover:bg-white/10" onClick={()=>{openPlayerMessage({id:m.id,name:m.name,avatar:m.avatar});setSelected(null);}}><MessageSquare size={14}/>Message</button>}
    <button className="flex w-full gap-2 rounded p-2 hover:bg-white/10" onClick={()=>{window.dispatchEvent(new Event('openLunaParty'));setSelected(null);}}><Users size={14}/>Manage party</button>
    {session.host_id!==user?.id&&<button className="flex w-full gap-2 rounded p-2 hover:bg-white/10" onClick={()=>window.dispatchEvent(new CustomEvent('joinMultiplayerChannel',{detail:{channelId:'dashboard_'+user.id,hostId:user.id,hostName:'My'}}))}><LogOut size={14}/>My dashboard</button>}
   </div>}
  </div>)}
 </div>;
}

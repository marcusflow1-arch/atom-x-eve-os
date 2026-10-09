import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation, useNavigate } from 'react-router-dom';
import { ChevronDown, Flag, Heart, LogIn, MessageSquare, Mic, Repeat2, UserMinus, UserPlus, Users, LayoutDashboard, Trophy, Layers3, Gamepad2, ArrowUpRight, Shield, RefreshCw } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/components/auth/AuthContext';
import { joinDashboard, openPlayerMessage } from '@/components/social/dashboardSession';
import { sendTradeRequest } from '@/components/game3d/social/tradeRequest';
import { showError, showSuccess } from '@/components/error/ErrorToast';
import GenesisModelPreview from '@/components/onboarding/GenesisModelPreview';
import './gamer-profile.css';

const unwrap=result=>{const body=result?.data??result??{};if(body.error||body.success===false)throw new Error(body.error||'Action unsuccessful');return body;};
export const asSocialTarget=player=>({
 id:String(player?.friend_id||player?.player_id||player?.id||''),
 name:player?.friend_name||player?.name||player?.display_name||'Player',
 avatar:player?.friend_avatar||player?.avatar_url||(typeof player?.avatar==='string'?player.avatar:'')||'',
 is_friend:Boolean(player?.friend||player?.is_friend),status:player?.status||'offline',genres:player?.genres||[]
});
const date=value=>value?new Date(value).toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric'}):'';
function Empty({children}){return <p className="gamer-empty">{children}</p>;}
function Collection({rows,kind}){
 if(!rows?.length)return <Empty>No {kind} shared yet.</Empty>;
 return <div className={'gamer-collection '+kind}>{rows.map(item=><article key={item.id} className="gamer-collection-item">
   {item.image||item.cover_image?<img src={item.image||item.cover_image} alt="" loading="lazy"/>:<div className="gamer-collection-art">{kind==='achievements'?<Trophy/>:kind==='cards'?<Layers3/>:<Gamepad2/>}</div>}
   <div><small>{kind==='games'?item.genre:item.rarity}</small><h3>{item.name||item.title}</h3><p>{item.game_name||item.game||item.description||''}</p>
   {kind==='achievements'&&<span>{item.points} points {item.unlocked_at?'· '+date(item.unlocked_at):''}</span>}
   {kind==='cards'&&<span>{item.equipped?'Equipped':'Collection'} {item.acquired_at?'· '+date(item.acquired_at):''}</span>}
   {kind==='games'&&<span>{item.last_played?'Last played '+date(item.last_played):item.acquired_at?'Added '+date(item.acquired_at):'In collection'}</span>}
   </div>
 </article>)}</div>;
}
export default function LunaGamerProfile({player,onClose,initialTab='overview'}){
 const {user}=useAuth(),navigate=useNavigate(),location=useLocation();
 const p=asSocialTarget(player),self=p.id===String(user?.id);
 const [tab,setTab]=useState(initialTab),[more,setMore]=useState(false),[busy,setBusy]=useState(''),[friend,setFriend]=useState(p.is_friend),[following,setFollowing]=useState(false),[reporting,setReporting]=useState(false),[reason,setReason]=useState('harassment'),[details,setDetails]=useState(''),[requested,setRequested]=useState(false);
 const {data:profile,isLoading,error,refetch}=useQuery({
  queryKey:['friend-console-profile',user?.id,p.id],
  enabled:Boolean(user?.id&&p.id),retry:false,staleTime:30000,
  queryFn:async()=>unwrap(await base44.functions.invoke('friendConsoleProfile',{target_user_id:p.id})).profile
 });
 const name=profile?.name||p.name;
 useEffect(()=>{
  if(!user?.id||!p.id||self)return;
  let live=true;
  Promise.all([base44.entities.Follow.filter({follower_id:user.id,followed_id:p.id}),base44.entities.Friend.filter({user_id:user.id,friend_id:p.id})])
    .then(([follows,friends])=>{if(live){setFollowing(Boolean(follows?.length));setFriend(Boolean(friends?.length));}}).catch(()=>{});
  return()=>{live=false;};
 },[p.id,user?.id,self]);
 useEffect(()=>{const refresh=()=>refetch();window.addEventListener('lunaSocialChanged',refresh);return()=>window.removeEventListener('lunaSocialChanged',refresh);},[refetch]);
 const act=async(action,task,success)=>{if(busy||!p.id||!user?.id)return;setBusy(action);try{await task();if(success)showSuccess(success);}catch(e){showError(e,action);}finally{setBusy('');}};
 const toLuna=()=>{if(!/LunaTemplate/i.test(location.pathname))navigate('/LunaTemplate');};
 const message=()=>{openPlayerMessage({id:p.id,friend_id:p.id,friend_name:name,name,friend_avatar:profile?.avatar_url||p.avatar,is_friend:friend});toLuna();};
 const voice=()=>{window.__lunaPendingVoiceTargetId=p.id;message();};
 const join=()=>act('Join dashboard',async()=>{toLuna();await joinDashboard({...p,name});onClose?.();});
 const trade=()=>act('Trade',()=>sendTradeRequest({id:user.id},{id:p.id,name}),'Trade request sent.');
 const invite=()=>act('Party invite',async()=>unwrap(await base44.functions.invoke('partySystem',{action:'invite_member',data:{inviteeId:p.id}})),'Party invitation sent.');
 const inviteDashboard=()=>act('Dashboard invite',async()=>unwrap(await base44.functions.invoke('socialActions',{action:'send_dashboard_invite',data:{target_user_id:p.id}})),'Dashboard invitation sent.');
 const toggleFollow=()=>act('Follow',async()=>{const rows=await base44.entities.Follow.filter({follower_id:user.id,followed_id:p.id});if(rows?.length){await Promise.all(rows.map(row=>base44.entities.Follow.delete(row.id)));setFollowing(false);}else{await base44.entities.Follow.create({follower_id:user.id,followed_id:p.id});setFollowing(true);}});
 const friendAction=()=>act(friend?'Unfriend':'Add friend',async()=>{
  if(friend){if(!window.confirm('Remove '+name+' from your friends?'))return;unwrap(await base44.functions.invoke('socialActions',{action:'remove_friend',data:{friend_user_id:p.id}}));setFriend(false);}
  else{unwrap(await base44.functions.invoke('socialActions',{action:'send_friend_request',data:{target_user_id:p.id}}));setRequested(true);showSuccess('Friend request sent.');}
  window.dispatchEvent(new CustomEvent('lunaSocialChanged',{detail:{type:'friends',friendId:p.id}}));refetch();
 });
 const report=()=>act('Report',async()=>{unwrap(await base44.functions.invoke('forumSystem',{action:'report',data:{target_type:'user',target_id:p.id,reason,details:details.trim()}}));setReporting(false);setMore(false);},'Report submitted.');
 const tabs=[['overview','Overview'],['achievements','Achievements'],['cards','Cards'],['games','Games']];
 return <div className="gamer-profile" data-luna-gamer-profile={p.id}><div className="gamer-profile-layout">
  <aside className="gamer-identity">
    <div className="gamer-eyebrow">ATOM XE / PLAYER CONSOLE</div>
    <div className="gamer-identity-heading"><h1>{name}</h1><span className={'gamer-presence '+(profile?.online?'online':'')}><i/>{profile?.status||p.status}{self?' · You':friend?' · Friend':''}</span></div>
    <div className="gamer-avatar-stage">
      {profile?.avatar?<GenesisModelPreview key={p.id} config={profile.avatar} compact controls="none" idleOnly initialYaw={-.2}/>:
      <div className="gamer-avatar-fallback">{(profile?.avatar_url||p.avatar)?<img src={profile?.avatar_url||p.avatar} alt={name}/>:<Shield size={56}/>}<span>{isLoading?'Loading avatar…':profile?'No avatar shared yet':'Avatar visible to friends'}</span></div>}
      {profile&&<div className="gamer-level"><span>AI AVATAR</span><strong>{profile.level}</strong><span>LEVEL</span></div>}
    </div>
    <div className="gamer-now"><small>CURRENT ACTIVITY</small><p>{profile?.current_game|| (profile?.online?'Exploring Atom XE':'Offline')}</p></div>
    <button className="gamer-primary" onClick={()=>{navigate('/PlayerProfile?userId='+encodeURIComponent(p.id)+'&view=dashboard');onClose?.();}} disabled={!profile}><LayoutDashboard size={16}/>View dashboard<ArrowUpRight size={14}/></button>
    {!self&&<button onClick={join} disabled={!!busy||!user?.id}><LogIn size={16}/>Join dashboard</button>}
    {!self&&<div className="gamer-social-buttons"><button onClick={message} disabled={!user?.id}><MessageSquare size={15}/>Message</button><button onClick={voice} disabled={!user?.id}><Mic size={15}/>Voice</button></div>}
  </aside>
  <main className="gamer-main">
    <header className="gamer-main-header"><div><span className="gamer-eyebrow">THE PLAYER BEHIND THE AVATAR</span><h2>{tab==='dashboard'?'Dashboard preview':'Every game leaves a mark.'}</h2></div><button className="gamer-refresh" onClick={()=>refetch()} aria-label="Refresh profile"><RefreshCw size={15}/></button></header>
    {isLoading&&<p className="gamer-status" role="status">Loading player collection…</p>}
    {error&&<div className="gamer-status" role="alert">{error.message||'Profile could not load.'} <button onClick={()=>refetch()}>Try again</button></div>}
    {profile&&<div className="gamer-stats">{[['Achievements',profile.counts?.achievements,Trophy,'achievements'],['Cards',profile.counts?.cards,Layers3,'cards'],['Games',profile.counts?.games,Gamepad2,'games']].map(([label,value,Icon,key])=><button key={key} onClick={()=>setTab(key)}><Icon size={16}/><strong>{Number(value)||0}</strong><span>{label}</span></button>)}</div>}
    <nav className="gamer-tabs" aria-label="Profile sections">{tabs.map(([key,label])=><button key={key} aria-pressed={tab===key} onClick={()=>setTab(key)}>{label}</button>)}</nav>
    {profile&&<div className="gamer-tab-content">
      {tab==='overview'&&<>
        <section className="gamer-section"><header><div><span className="gamer-eyebrow">PROGRESS, MADE PERSONAL</span><h2>Recent unlocks</h2></div><button onClick={()=>setTab('achievements')}>View all <ArrowUpRight size={13}/></button></header><Collection kind="achievements" rows={profile.achievements?.slice(0,3)}/></section>
        <section className="gamer-section"><header><h2>Recently played & added</h2><button onClick={()=>setTab('games')}>Library <ArrowUpRight size={13}/></button></header><Collection kind="games" rows={profile.games?.slice(0,4)}/></section>
        <section className="gamer-section"><header><h2>Signature collection</h2><button onClick={()=>setTab('cards')}>Cards <ArrowUpRight size={13}/></button></header><Collection kind="cards" rows={profile.cards?.slice(0,4)}/></section>
        <section className="gamer-section"><header><h2>Genre strengths</h2></header><div className="gamer-genres">{profile.genre_ranks?.map(g=><div key={g.id}><span>{g.name}</span><strong>Lv {g.level}</strong></div>)}</div>{!profile.genre_ranks?.length&&<Empty>Genre progress will appear as this avatar plays.</Empty>}</section>
      </>}
      {tab==='achievements'&&<section className="gamer-section"><header><h2>Achievements</h2><span>{profile.achievement_points} unlocked points</span></header><Collection kind="achievements" rows={profile.achievements}/></section>}
      {tab==='cards'&&<section className="gamer-section"><header><h2>Card collection</h2><span>Equipped cards are marked</span></header><Collection kind="cards" rows={profile.cards}/></section>}
      {tab==='games'&&<section className="gamer-section"><header><h2>Games</h2><span>Latest activity first</span></header><Collection kind="games" rows={profile.games}/></section>}
      {tab==='dashboard'&&<section className="gamer-section gamer-dashboard-preview"><header><h2>{name}'s dashboard</h2><span>Read-only preview</span></header><p>Avatar progress and equipped cards. Join the dashboard to appear together and talk.</p><div className="gamer-preview-summary"><div><small>Avatar level</small><strong>{profile.level}</strong></div><div><small>Total avatar XP</small><strong>{Number(profile.xp).toLocaleString()}</strong></div><div><small>Presence</small><strong>{profile.online?'Online':'Offline'}</strong></div></div><h3>Equipped cards</h3><Collection kind="cards" rows={profile.cards?.filter(c=>c.equipped)}/>{!self&&<button className="gamer-primary" onClick={join} disabled={!!busy}><LogIn size={15}/>Join this dashboard</button>}</section>}
    </div>}
    {!profile&&!isLoading&&!error&&<Empty>Sign in to view this player's profile.</Empty>}
    {!self&&<footer className="gamer-actions">
      <button onClick={friendAction} disabled={!!busy||requested||!user?.id}>{friend?<UserMinus size={15}/>:<UserPlus size={15}/>} {friend?'Friends':requested?'Request sent':'Add friend'}</button>
      <button onClick={invite} disabled={!!busy||!user?.id}><Users size={15}/>Invite to party</button>
      <button onClick={trade} disabled={!!busy||!user?.id}><Repeat2 size={15}/>Trade</button>
      <button onClick={()=>setMore(v=>!v)} aria-expanded={more}>More <ChevronDown size={14}/></button>
      {more&&<div className="gamer-more"><button onClick={toggleFollow} disabled={!!busy||!user?.id}><Heart size={14}/>{following?'Unfollow':'Follow'}</button><button onClick={inviteDashboard} disabled={!!busy||!user?.id}><LayoutDashboard size={14}/>Invite to dashboard</button><button onClick={()=>setReporting(v=>!v)}><Flag size={14}/>Report player</button></div>}
      {reporting&&<div className="gamer-report"><label>Reason<select value={reason} onChange={e=>setReason(e.target.value)}>{['harassment','spam','hate','other'].map(r=><option key={r}>{r}</option>)}</select></label><textarea value={details} onChange={e=>setDetails(e.target.value)} placeholder="Optional details" aria-label="Report details" maxLength={1000}/><button onClick={report} disabled={!!busy||!user?.id}>Submit report</button></div>}
    </footer>}
  </main>
 </div></div>;
}

import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import CompanionIdentityProvider from '@/components/onboarding/CompanionIdentityContext';
import GenesisWizard from '@/components/onboarding/GenesisWizard';
import GenesisLoadingScreen from '@/components/onboarding/GenesisLoadingScreen';
import '@/components/onboarding/genesis.css';
export default function AvatarGenesisGate({ user, children }) {
  const [state,setState]=useState({status:'checking',avatar:null,profile:null,error:''}),[attempt,setAttempt]=useState(0);
  const location=useLocation(),navigate=useNavigate();
  useEffect(()=>{
    let active=true;
    if(!user?.id){setState({status:'ready',avatar:null,profile:null,error:''});return;}
    setState({status:'checking',avatar:null,profile:null,error:''});
    (async()=>{try{
      const avatars=await base44.entities.Avatar.filter({user_id:user.id},'created_date',1);
      const avatar=avatars[0]||null;
      const ready=avatar && avatar.setup_status !== 'pending';
      const profiles=ready?[]:await base44.entities.OnboardingProfile.filter({user_id:user.id,environment:'live'},'created_date',1);
      if(active)setState({status:ready?'ready':'setup',avatar,profile:profiles[0]||null,error:''});
    }catch(error){if(active)setState({status:'error',avatar:null,profile:null,error:'We could not retrieve your saved companion. Retry to reconnect; your identity has not been reset.'});}})();
    return()=>{active=false;};
  },[user?.id,attempt]);
  const complete=avatar=>{sessionStorage.setItem('atom_eve_intro_seen_session','true');setState({status:'ready',avatar,profile:null,error:''});navigate('/LunaTemplate',{replace:true});};
  const preview=location.pathname==='/SetupPreview' && import.meta.env.DEV && user?.role==='admin';
  if(state.status==='error'&&!preview)return <div className="genesis-surface genesis-shell genesis-success"><h1>Reconnect to your world.</h1><p role="alert">{state.error}</p><button className="genesis-primary" onClick={()=>setAttempt(v=>v+1)}>Retry connection</button></div>;
  return <CompanionIdentityProvider avatar={state.avatar}>
    {preview || state.status==='ready' ? children : state.status==='setup' ? <GenesisWizard key={user.id} user={user} initialProfile={state.profile} onComplete={complete}/> : null}
    <AnimatePresence>{state.status==='checking'&&!preview&&<GenesisLoadingScreen/>}</AnimatePresence>
  </CompanionIdentityProvider>;
}
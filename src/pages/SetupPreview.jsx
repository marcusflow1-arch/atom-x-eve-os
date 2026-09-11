import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';
import GenesisWizard from '@/components/onboarding/GenesisWizard';
import GenesisLoadingScreen from '@/components/onboarding/GenesisLoadingScreen';
export default function SetupPreview() {
  const {user}=useAuth(); const [state,setState]=useState({loading:true,profile:null,error:''});
  const allowed=import.meta.env.DEV && user?.role==='admin';
  useEffect(()=>{if(!allowed)return;let active=true;base44.entities.OnboardingProfile.filter({user_id:user.id,environment:'preview'},'created_date',1).then(rows=>{if(active)setState({loading:false,profile:rows[0]||null,error:''});}).catch(()=>{if(active)setState({loading:false,profile:null,error:'Could not load your preview draft. Please reopen the preview.'});});return()=>{active=false;};},[allowed,user?.id]);
  if(!allowed)return <div className="genesis-surface genesis-success"><h1>Developer preview only</h1><p>This screen does not change published user identities.</p><Link to="/LunaTemplate">Return home</Link></div>;
  if(state.loading)return <GenesisLoadingScreen label="Opening developer preview"/>;
  if(state.error)return <div className="genesis-surface genesis-success"><p role="alert">{state.error}</p><Link to="/LunaTemplate">Return home</Link></div>;
  return <GenesisWizard user={user} initialProfile={state.profile} preview/>;
}
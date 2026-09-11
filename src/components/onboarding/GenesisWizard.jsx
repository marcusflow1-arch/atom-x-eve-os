import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Check, Moon } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import GenesisProfileFields from '@/components/onboarding/GenesisProfileFields';
import GenesisCompanionFields from '@/components/onboarding/GenesisCompanionFields';
import GenesisAppearanceFields from '@/components/onboarding/GenesisAppearanceFields';
import GenesisVoiceFields from '@/components/onboarding/GenesisVoiceFields';
import GenesisReview from '@/components/onboarding/GenesisReview';
import GenesisModelPreview from '@/components/onboarding/GenesisModelPreview';
import GenesisLoadingScreen from '@/components/onboarding/GenesisLoadingScreen';
import '@/components/onboarding/genesis.css';
export default function GenesisWizard({ user, initialProfile, preview = false, onComplete }) {
  const [step,setStep]=useState(0),[busy,setBusy]=useState(false),[error,setError]=useState(''),[saved,setSaved]=useState(null);
  const [profile,setProfile]=useState({display_name:user?.full_name||'',username:user?.username||'',date_of_birth:'',phone:'',...initialProfile});
  const [config,setConfig]=useState(initialProfile?.companion||{gender:'female',name:'Eve',personality:'calm',height_scale:1,material_colors:{},morph_targets:{},voice:{uri:'',pitch:1,rate:1}});
  const [capabilities,setCapabilities]=useState({materials:[],morphs:[]}); const reduced=useReducedMotion();
  const submit=async e=>{e.preventDefault();if(busy)return;setError('');if(step<4){setStep(s=>s+1);return;}setBusy(true);try{const response=await base44.functions.invoke('avatarSystem',{action:'completeSetup',profile,companion:config,preview});if(!response.data?.success)throw new Error(response.data?.error||'Could not save setup.');if(preview)setSaved(response.data.profile);else onComplete(response.data.avatar);}catch(err){setError(err.response?.data?.error||err.message||'Could not save setup. Please retry.');}finally{setBusy(false);}};
  if(saved) return <div className="genesis-surface genesis-shell genesis-success" data-saved-profile-id={saved.id}><Check size={40}/><p className="genesis-kicker">PREVIEW SAVED · LIVE IDENTITY UNCHANGED</p><h1>Meet {config.name}.</h1><p>Your developer draft is saved separately. You can reopen this preview without recreating your live companion.</p><div><button className="genesis-secondary" onClick={()=>{setSaved(null);setStep(1);}}>Edit preview</button><Link className="genesis-primary" to="/LunaTemplate">Return home</Link></div></div>;
  return <div className="genesis-surface genesis-shell" data-testid="genesis-wizard"><header><span className="genesis-brand"><Moon size={24}/>ATOM × EVE</span>{preview?<span className="genesis-preview-badge">Developer preview<Link to="/LunaTemplate">Exit preview</Link></span>:<span className="genesis-preview-badge">First-time setup</span>}</header>
    <ol className="genesis-steps">{['Account','Companion','Appearance','Voice','Review'].map((label,i)=><li key={label} aria-current={step===i?'step':undefined}><span>{step>i?'✓':`0${i+1}`}</span>{label}</li>)}</ol>
    <div className="genesis-workspace"><GenesisModelPreview config={config} onCapabilities={setCapabilities}/><form className="genesis-editor" onSubmit={submit}><fieldset disabled={busy}><AnimatePresence mode="wait" initial={false}><motion.div key={step} initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-8}} transition={{duration:reduced?0:.18}}>
      {step===0&&<GenesisProfileFields profile={profile} setProfile={setProfile} email={user?.email}/>}{step===1&&<GenesisCompanionFields config={config} setConfig={setConfig}/>}{step===2&&<GenesisAppearanceFields config={config} setConfig={setConfig} capabilities={capabilities}/>}{step===3&&<GenesisVoiceFields config={config} setConfig={setConfig}/>}{step===4&&<GenesisReview profile={profile} config={config} preview={preview}/>}
    </motion.div></AnimatePresence></fieldset>{error&&<p className="genesis-error" role="alert">{error}</p>}<footer className="genesis-actions">{step>0?<button className="genesis-secondary" type="button" disabled={busy} onClick={()=>setStep(s=>s-1)}><ArrowLeft size={15}/>Back</button>:<span>Setup once. Keep it with you.</span>}<button className="genesis-primary" type="submit" disabled={busy}>{step===4?(preview?'Save preview':'Begin my journey'):'Continue'}<ArrowRight size={15}/></button></footer></form></div>
    <AnimatePresence>{busy&&<GenesisLoadingScreen label={preview?'Saving your preview':'Preparing your world'}/>}</AnimatePresence>
  </div>;
}
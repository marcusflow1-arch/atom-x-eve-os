import {useState} from 'react';
import {useCompanionIdentity} from './CompanionIdentityContext';
import {playerAppearance} from './playerAppearance';
import GenesisModelPreview from './GenesisModelPreview';
import GenesisCompanionFields from './GenesisCompanionFields';
import GenesisFaceScan from './GenesisFaceScan';
import GenesisAppearanceFields from './GenesisAppearanceFields';
import {saveAppearance} from './saveAppearance';
import './genesis.css';
export default function AvatarAppearanceDialog({onClose,onSaved,create=false}){
 const saved=useCompanionIdentity(),[config,setConfig]=useState(()=>playerAppearance(saved)),[caps,setCaps]=useState({}),[step,setStep]=useState(0),[name,setName]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const save=async()=>{setBusy(true);setError('');try{const avatar=await saveAppearance(config,{broadcast:!create});await onSaved?.(avatar,name);if(create)window.dispatchEvent(new CustomEvent('avatarAppearanceSaved',{detail:{avatar}}));onClose?.();}catch(e){setError(e.message);}finally{setBusy(false);}};
 return <div className="fixed inset-0 z-[300] bg-black/80 p-3 grid place-items-center" role="dialog" aria-modal="true" aria-label={create?'Create character':'Customize character'}><div className="genesis-surface w-full max-w-6xl max-h-[95vh] overflow-y-auto rounded-2xl border border-cyan-200/20 bg-slate-950 p-5">
 <div className="flex justify-between items-center"><h2>{create?'Create character':'Customize your character'}</h2><button type="button" disabled={busy} onClick={onClose} aria-label="Close character creator">Close</button></div>
 <div className="grid lg:grid-cols-2 gap-6 mt-4"><div className="h-[420px] lg:sticky lg:top-4"><GenesisModelPreview config={config} compact interactive onCapabilities={setCaps}/></div><div className="genesis-fields">
 {create&&<label>Character name<input maxLength={24} value={name} onChange={e=>setName(e.target.value)} placeholder="Choose a name"/></label>}
 <nav className="flex flex-wrap gap-3 my-4">{['Body','Face','Appearance'].map((label,i)=><button key={label} type="button" disabled={busy} aria-current={step===i?'step':undefined} onClick={()=>setStep(i)} className="genesis-secondary">{label}</button>)}</nav>
 <fieldset disabled={busy}>{step===0&&<GenesisCompanionFields config={config} setConfig={setConfig}/>} {step===1&&<GenesisFaceScan config={config} setConfig={setConfig}/>} {step===2&&<GenesisAppearanceFields config={config} setConfig={setConfig} capabilities={caps}/>}</fieldset>
 {error&&<p role="alert" className="genesis-error">{error}</p>}
 <footer className="flex gap-3 justify-end mt-5">{step>0&&<button type="button" className="genesis-secondary" disabled={busy} onClick={()=>setStep(step-1)}>Back</button>}{step<2?<button type="button" className="genesis-primary" disabled={busy} onClick={()=>setStep(step+1)}>Next</button>:<button type="button" className="genesis-primary" disabled={busy||(create&&!name.trim())} onClick={save}>{busy?'Saving…':create?'Create character':'Save appearance'}</button>}</footer>
 </div></div></div></div>;
}
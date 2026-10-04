import {useEffect,useRef,useState} from 'react';
import {Check, ChevronRight, Layers3, Moon, RotateCcw, X} from 'lucide-react';
import {useCompanionIdentity} from './CompanionIdentityContext';
import {playerAppearance} from './playerAppearance';
import GenesisModelPreview from './GenesisModelPreview';
import CharacterAppearanceEditor,{CREATOR_SECTIONS,CreatorNavigation} from './CharacterAppearanceEditor';
import CustomizationAssetManager from './CustomizationAssetManager';
import {useCustomizationCatalog} from './useCustomizationCatalog';
import {saveAppearance} from './saveAppearance';
import {validateAXECharacterName} from '@/components/game3d/axe/characters/AXECharacterEntry';
import './genesis.css';
import './character-creator.css';

export default function AvatarAppearanceDialog({onClose,onSaved,create=false,initialAvatar,embedded=false}) {
 const saved=useCompanionIdentity(),catalog=useCustomizationCatalog();
 const [config,setConfig]=useState(()=>playerAppearance(initialAvatar||saved)),[caps,setCaps]=useState({});
 const [section,setSection]=useState('body'),[name,setName]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const [layers,setLayers]=useState({loading:false,error:''}),[workshop,setWorkshop]=useState(false),[previewKey,setPreviewKey]=useState(0);
 const dialog=useRef(null),close=useRef(onClose),busyRef=useRef(busy),loadedGender=useRef('');
 close.current=onClose;busyRef.current=busy;
 useEffect(()=>{
  const previous=document.activeElement;dialog.current?.focus();
  const oldOverflow=document.body.style.overflow;if(!embedded)document.body.style.overflow='hidden';
  const keys=e=>{
   if(e.key==='Escape'&&!busyRef.current){e.preventDefault();close.current?.();}
   if(e.key==='Tab'&&!embedded){
    const list=[...dialog.current.querySelectorAll('button:not(:disabled),input:not(:disabled):not([hidden]),select:not(:disabled),a[href],[tabindex="0"]')].filter(el=>el.getClientRects().length&&!el.closest('[hidden]'));
    if(!list.length)return;
    if(e.shiftKey&&(document.activeElement===list[0]||document.activeElement===dialog.current)){e.preventDefault();list.at(-1).focus();}
    else if(!e.shiftKey&&document.activeElement===list.at(-1)){e.preventDefault();list[0].focus();}
   }
  };
  const element=dialog.current;element?.addEventListener('keydown',keys);
  return()=>{element?.removeEventListener('keydown',keys);if(!embedded)document.body.style.overflow=oldOverflow;previous?.focus?.();};
 },[embedded]);
 const onCapabilities=value=>{loadedGender.current=config.gender;setCaps(value);};
 const save=async()=>{
  if(busy||layers.loading||layers.error)return;
  if(create){const check=validateAXECharacterName(name);if(!check.ok){setError(check.reason==='invalid-characters'?"Use letters, numbers, spaces, apostrophes or hyphens.":'Choose a name between 2 and 24 characters.');return;}}
  setBusy(true);setError('');
  try{
   const avatar=await saveAppearance({...config,...(create?{name:name.trim()}: {})},{broadcast:!create});
   await onSaved?.(avatar,name.trim());
   if(create)window.dispatchEvent(new CustomEvent('avatarAppearanceSaved',{detail:{avatar}}));
   onClose?.();
  }catch(e){setError(e.response?.data?.error||e.message||'Could not save your character. Please try again.');}
  finally{setBusy(false);}
 };
 const changeConfig=value=>setConfig(current=>{const next=typeof value==='function'?value(current):value;if(current.gender!==next.gender){loadedGender.current='';setCaps({});setLayers({loading:true,error:''});}return next;});
 const index=CREATOR_SECTIONS.findIndex(s=>s.id===section);
 return <div className={'creator-shell'+(embedded?' creator-embedded':'')} ref={dialog} tabIndex={-1} role={embedded?undefined:'dialog'} aria-modal={embedded?undefined:true} aria-label={create?'Create your AI avatar':'Customize your AI avatar'}>
  <header className="creator-topbar"><div className="creator-brand"><Moon size={21}/><span>ATOM XE<small>CHARACTER STUDIO</small></span></div><div className="creator-heading"><h1>{create?'Create your AI counterpart':'Make it yours'}</h1><p>A look of your own. A companion that grows with you.</p></div>{catalog.data?.canManage&&<button type="button" className="creator-tools" disabled={busy||!loadedGender.current} onClick={()=>setWorkshop(true)}><Layers3 size={17}/><span>Assets</span></button>}<button type="button" className="creator-close" disabled={busy} onClick={onClose} aria-label="Close character creator"><X size={20}/></button></header>
  <div className="creator-workspace">
   <aside className="creator-rail"><CreatorNavigation section={section} onChange={id=>{setSection(id);setWorkshop(false);}}/><div className="creator-rail-footer"><span>01 / IDENTITY</span><p>Your appearance follows your avatar across Atom XE.</p>{catalog.data?.canManage&&<button type="button" disabled={busy} onClick={()=>setWorkshop(true)}><Layers3 size={15}/>Import layers</button>}</div></aside>
   <section className="creator-stage" aria-label="Live character preview"><div className="creator-stage-label"><span><i/>LIVE PREVIEW</span><strong>{name||config.name||(config.gender==='female'?'Artemis':'Getsuga')}</strong><small>{config.gender==='female'?'Female':'Male'} · Authored idle</small></div><div className="creator-stage-ring"/><div className="creator-model"><GenesisModelPreview key={config.gender+'-'+previewKey} config={config} compact idleOnly onCapabilities={onCapabilities} onCustomizationState={setLayers}/></div><div className="creator-stage-footer"><span>Drag to rotate · Scroll to zoom</span><button type="button" onClick={()=>setPreviewKey(k=>k+1)} aria-label="Reset preview camera"><RotateCcw size={15}/></button></div>{layers.loading&&<p className="creator-preview-status" role="status">Fitting your selected layers…</p>}{layers.error&&<p className="creator-preview-error" role="alert">{layers.error} <button type="button" onClick={()=>setPreviewKey(k=>k+1)}>Retry</button></p>}</section>
   <section className="creator-options" aria-label="Appearance options">{workshop?<CustomizationAssetManager gender={config.gender} capabilities={caps} onClose={()=>setWorkshop(false)}/>:<fieldset disabled={busy}><CharacterAppearanceEditor config={config} setConfig={changeConfig} capabilities={loadedGender.current===config.gender?caps:{}} section={section} onSectionChange={setSection} showNavigation={false}/></fieldset>}</section>
  </div>
  <footer className="creator-bottom"><div className="creator-identity">{create?<label htmlFor="creator-name">AVATAR NAME<input id="creator-name" maxLength={24} value={name} disabled={busy} onChange={e=>{setName(e.target.value);setError('');}} placeholder="Give your companion a name"/></label>:<span><Check size={15}/>Changes are saved when you finish.</span>}{error&&<p className="creator-error" role="alert">{error}</p>}</div><div className="creator-actions"><span>{index+1} / {CREATOR_SECTIONS.length}</span>{index<CREATOR_SECTIONS.length-1&&<button type="button" className="creator-next" disabled={busy} onClick={()=>{setSection(CREATOR_SECTIONS[index+1].id);setWorkshop(false);}}>Next<ChevronRight size={15}/></button>}<button type="button" className="creator-save" disabled={busy||layers.loading||Boolean(layers.error)||(create&&!name.trim())||!loadedGender.current} onClick={save}>{busy?'Saving…':create?'Create avatar':'Save appearance'}<Check size={16}/></button></div></footer>
 </div>;
}

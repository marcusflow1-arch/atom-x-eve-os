import {useState} from 'react';
import {Check, ChevronRight, Fingerprint, Layers3, Palette, PersonStanding, Scissors, Shirt, Sparkles, UserRound} from 'lucide-react';
import {SHAPE_CONTROLS} from '../../../base44/shared/avatarCustomization.ts';
import {AVATAR_STYLE_PRESETS,COMPANION_MODELS,DEFAULT_AVATAR_APPEARANCE} from './genesisAssets';
import {useCustomizationCatalog} from './useCustomizationCatalog';
import GenesisFaceScan from './GenesisFaceScan';
import './character-creator.css';

export const CREATOR_SECTIONS=[
 {id:'body',label:'Body',icon:PersonStanding,description:'Choose your starting model and proportions.'},
 {id:'face',label:'Face',icon:UserRound,description:'Refine the features that make your avatar yours.'},
 {id:'hair',label:'Hair',icon:Scissors,description:'Find a hairstyle, brows and facial hair.'},
 {id:'skin',label:'Skin',icon:Palette,description:'Complexion, surface finish and age appearance.'},
 {id:'wardrobe',label:'Wardrobe',icon:Shirt,description:'Build a look from compatible clothing layers.'},
 {id:'details',label:'Details',icon:Fingerprint,description:'Tattoos, accents and finishing touches.'},
 {id:'style',label:'Art style',icon:Sparkles,description:'Choose how your character is rendered.'},
];
const SKIN=['#f5dccb','#e7c3a3','#d2a080','#b97855','#976441','#714b35','#503326','#32211b'];
const HAIR=['#17191d','#3a281e','#704630','#a36a3b','#d4b278','#e9dfcd','#b64039','#d79aa4','#8670bc','#3e8791','#ececf0','#747d87'];
const EYES=['#4b3527','#98663b','#627342','#41937c','#7aa2c2','#697083','#ac83bf','#dda847'];
export function chooseCreatorBody(current,gender) {
 if(current.gender===gender)return current;
 return {...current,gender,model_url:COMPANION_MODELS[gender].url,female_model_variant:gender==='female'?'artemis_archer':'',
  base_body_gender:gender,base_body_model_url:COMPANION_MODELS[gender].url,selected_assets:{},customization_assets:[],morph_targets:{},shape_controls:{},material_colors:{},face_shape:{},face_fit_source:'manual'};
}
export function CreatorNavigation({section,onChange}) {
 return <nav className="creator-navigation" aria-label="Character customization sections">{CREATOR_SECTIONS.map(({id,label,icon:Icon},i)=><button type="button" key={id} aria-current={section===id?'page':undefined} onClick={()=>onChange(id)}><Icon size={18}/><span>{label}</span><small>{String(i+1).padStart(2,'0')}</small></button>)}</nav>;
}
function Range({label,value,onChange,min=0,max=1,step=.01,disabled=false,format=v=>Math.round(v*100)+'%',note}) {
 return <label className="creator-range"><span>{label}<output>{format(value)}</output></span><input aria-label={label} type="range" min={min} max={max} step={step} value={value} disabled={disabled} onChange={e=>onChange(Number(e.target.value))}/>{note&&<small>{note}</small>}</label>;
}
function Colors({label,value,choices,onChange,disabled=false}) {
 return <fieldset className="creator-colors" disabled={disabled}><legend>{label}</legend><div>{choices.map((color,i)=><button type="button" key={color} aria-label={label+' preset '+(i+1)} aria-pressed={value?.toLowerCase()===color} style={{'--swatch':color}} onClick={()=>onChange(color)}>{value?.toLowerCase()===color&&<Check size={15}/>}</button>)}<label className="creator-custom-color"><input type="color" aria-label={'Custom '+label.toLowerCase()} value={value||choices[0]} onChange={e=>onChange(e.target.value)}/><span>+</span></label></div></fieldset>;
}
export default function CharacterAppearanceEditor({config,setConfig,capabilities={},section:controlled,onSectionChange,showNavigation=true}) {
 const [local,setLocal]=useState('body'),section=controlled||local;
 const change=id=>{setLocal(id);onSectionChange?.(id);};
 const catalog=useCustomizationCatalog();
 const caps=capabilities.customization||{},supported=new Set(caps.shapes||[]);
 const update=patch=>setConfig(c=>({...c,...patch}));
 const title=CREATOR_SECTIONS.find(s=>s.id===section)||CREATOR_SECTIONS[0];
 const assets=(catalog.data?.assets||[]).filter(a=>a.published&&a.gender===config.gender);
 const layer=(slot,title)=> {
  const options=assets.filter(a=>a.slot===slot),selected=config.selected_assets?.[slot]||'';
  const choose=asset=>setConfig(c=>{
   const selected_assets={...(c.selected_assets||{})};if(asset)selected_assets[slot]=asset.id;else delete selected_assets[slot];
   // A full outfit and separate top/bottom occupy the same body regions.
   if(slot==='outfit'&&asset){delete selected_assets.top;delete selected_assets.bottom;}
   if(['top','bottom'].includes(slot)&&asset)delete selected_assets.outfit;
   const known=new Map([...(c.customization_assets||[]),...(catalog.data?.assets||[])].map(a=>[a.id,a]));
   return {...c,selected_assets,customization_assets:Object.values(selected_assets).map(id=>known.get(id)).filter(Boolean)};
  });
  return <section className="creator-group" key={slot}><h3>{title}<span>{options.length} available</span></h3><div className="creator-layer-grid"><button type="button" aria-pressed={!selected} onClick={()=>choose(null)}><span className="creator-layer-placeholder"><Layers3 size={24}/></span><strong>{['tattoo','accessory','facial_hair','complexion'].includes(slot)?'None':'Original'}</strong><small>Base model</small></button>{options.map(a=><button type="button" key={a.id} aria-pressed={selected===a.id} onClick={()=>choose(a)}>{a.thumbnail_url?<img src={a.thumbnail_url} alt="" loading="lazy"/>:<span className="creator-layer-placeholder"><Layers3 size={24}/></span>}<strong>{a.name}</strong><small>{a.description||'Fitted to this body'}</small></button>)}</div>{selected&&!options.some(a=>a.id===selected)&&<p className="creator-notice">This saved layer is no longer available. Choose Original or None to remove it.</p>}{!options.length&&<p className="creator-hint">The original model is available. Fitted {title.toLowerCase()} will appear here when they are published.</p>}{selected&&<div className="creator-layer-tuning">{options.find(a=>a.id===selected)?.tint_materials?.length>0&&<Colors label={title+' color'} value={config.layer_colors?.[slot]} choices={HAIR} onChange={color=>update({layer_colors:{...config.layer_colors,[slot]:color}})}/>} {['tattoo','complexion'].includes(slot)&&<Range label={title+' intensity'} value={config.layer_opacity?.[slot]??1} onChange={value=>update({layer_opacity:{...config.layer_opacity,[slot]:value}})}/>}</div>}</section>;
 };
 const shapes=group=><section className="creator-group"><h3>{group==='body'?'Sculpt your silhouette':group==='face'?'Facial proportions':'Age appearance'}</h3>{SHAPE_CONTROLS.filter(c=>c.section===group).map(c=><Range key={c.id} label={c.label} value={config.shape_controls?.[c.id]||0} onChange={v=>update({shape_controls:{...config.shape_controls,[c.id]:v}})} disabled={!supported.has(c.id)} format={c.id==='age'?v=>v===0?'Original':'More mature':undefined}/>)}
  {SHAPE_CONTROLS.some(c=>c.section===group&&!supported.has(c.id))&&<p className="creator-hint">Dimmed controls unlock when the selected model or fitted layer includes that shape.</p>}</section>;
 return <div className="character-appearance-editor">
  {showNavigation&&<CreatorNavigation section={section} onChange={change}/>}
  <div className="creator-editor-content" key={section}>
   <div className="creator-section-heading"><p>MAKE IT YOURS</p><h2>{title.label}</h2><span>{title.description}</span></div>
   {catalog.isError&&<div className="creator-notice" role="alert">Extra presets could not load. Your original model is still available. <button type="button" onClick={()=>catalog.refetch()}>Retry</button></div>}
   {section==='body'&&<>
    <section className="creator-group"><h3>Starting model</h3><div className="creator-base-grid">{Object.entries(COMPANION_MODELS).map(([gender])=><button type="button" key={gender} aria-pressed={config.gender===gender} onClick={()=>setConfig(c=>chooseCreatorBody(c,gender))}><UserRound size={24}/><strong>{gender==='male'?'Getsuga':'Artemis'}</strong><small>{gender==='male'?'Male body':'Female body'}</small><ChevronRight size={16}/></button>)}</div></section>
    {layer('body','Body presets')}<section className="creator-group"><h3>Proportions</h3><Range label="Height" min={.84} max={1.18} value={config.height_scale||1} onChange={v=>update({height_scale:v})}/><Range label="Frame width" min={.88} max={1.12} value={config.body_proportions?.width||1} onChange={v=>update({body_proportions:{...config.body_proportions,width:v}})}/><Range label="Body depth" min={.9} max={1.1} value={config.body_proportions?.depth||1} onChange={v=>update({body_proportions:{...config.body_proportions,depth:v}})}/></section>{shapes('body')}
   </>}
   {section==='face'&&<><section className="creator-group"><h3>Eyes</h3><Colors label="Eye color" choices={EYES} disabled={!caps.iris} value={config.eye_tint_enabled?config.eye_color:''} onChange={c=>update({eye_tint_enabled:true,eye_color:c})}/></section>{shapes('face')}{layer('eyebrows','Eyebrows')}<details className="creator-photo"><summary>Match from a photo</summary><GenesisFaceScan config={config} setConfig={setConfig} capabilities={capabilities}/></details></>}
   {section==='hair'&&<>{layer('hair','Hairstyles')}<section className="creator-group"><Colors label="Hair color" choices={HAIR} disabled={!caps.hair&&!assets.find(a=>a.id===config.selected_assets?.hair)?.tint_materials?.length} value={config.hair_tint_enabled?config.hair_color:''} onChange={c=>update({hair_tint_enabled:true,hair_color:c})}/>{!caps.hair&&!config.selected_assets?.hair&&<p className="creator-hint">This model has hair painted into its body texture. A fitted hair layer enables these color presets.</p>}</section>{layer('facial_hair','Facial hair')}</>}
   {section==='skin'&&<><section className="creator-group"><Colors label="Skin tone" choices={SKIN} value={config.skin_tint_enabled?config.skin_tone:''} disabled={!caps.skin} onChange={c=>update({skin_tint_enabled:true,skin_tone:c})}/><Range label="Skin shine" disabled={!caps.skin} value={config.skin_finish??.35} onChange={v=>update({skin_finish_enabled:true,skin_finish:v})} format={v=>v<.3?'Matte':v<.7?'Natural':'Dewy'}/><Colors label="Highlight tint" choices={['#ffffff','#fff3e5','#ffe0bd','#f2d6cd','#dcecff']} value={config.skin_highlight_color} disabled={!caps.skin} onChange={c=>update({skin_highlight_enabled:true,skin_highlight_color:c})}/>{!caps.skin&&<p className="creator-hint">Separate skin materials are needed to recolor skin without changing the clothes.</p>}</section>{layer('complexion','Complexions')}{shapes('skin')}</>}
   {section==='wardrobe'&&<>{layer('outfit','Full outfits')}{layer('top','Tops')}{layer('bottom','Bottoms')}{layer('footwear','Footwear')}</>}
   {section==='details'&&<>{layer('tattoo','Tattoos')}{layer('accessory','Accessories')}{(capabilities.weapon||capabilities.hood)&&<section className="creator-group"><h3>Equipment visibility</h3>{capabilities.weapon&&<label className="creator-switch"><span>Show weapon</span><input type="checkbox" checked={config.weapon_visible!==false} onChange={e=>update({weapon_visible:e.target.checked})}/></label>}{capabilities.hood&&<label className="creator-switch"><span>Show hood</span><input type="checkbox" checked={config.hood_enabled!==false} onChange={e=>update({hood_enabled:e.target.checked})}/></label>}</section>}</>}
   {section==='style'&&<section className="creator-group"><div className="creator-style-grid">{AVATAR_STYLE_PRESETS.map(s=><button type="button" key={s.id} aria-pressed={(config.style_preset||'heroic_fantasy')===s.id} onClick={()=>update({style_preset:s.id})}><span className={'creator-style-orb style-'+s.id}/><span><strong>{s.name}</strong><small>{s.description}</small></span>{config.style_preset===s.id&&<Check size={16}/>}</button>)}</div><p className="creator-hint">Changes shading and surface style. Your authored movement stays the same.</p></section>}
   <button type="button" className="creator-reset" onClick={()=>setConfig(c=>({...c,...DEFAULT_AVATAR_APPEARANCE,selected_assets:{},customization_assets:[]}))}>Restore original appearance</button>
  </div>
 </div>;
}

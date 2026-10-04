// Shared contract for the creator, appearance saves, and uploaded asset catalog.
export const CUSTOMIZATION_SLOTS = ['hair','eyebrows','facial_hair','outfit','top','bottom','footwear','accessory','tattoo','complexion'];
export const SHAPE_CONTROLS = [
 {id:'brow_size',label:'Eyebrow size',morph:'CC_BrowSize',section:'face'},
 {id:'face_width',label:'Face width',morph:'CC_FaceWidth',section:'face'},
 {id:'jaw_width',label:'Jaw width',morph:'CC_JawWidth',section:'face'},
 {id:'nose_width',label:'Nose width',morph:'CC_NoseWidth',section:'face'},
 {id:'eye_size',label:'Eye size',morph:'CC_EyeSize',section:'face'},
 {id:'chest_size',label:'Chest size',morph:'CC_ChestSize',section:'body'},
 {id:'glute_size',label:'Glute size',morph:'CC_GluteSize',section:'body'},
 {id:'shoulder_width',label:'Shoulder width',morph:'CC_ShoulderWidth',section:'body'},
 {id:'muscle_definition',label:'Muscle definition',morph:'CC_MuscleDefinition',section:'body'},
 {id:'age',label:'Age appearance',morph:'CC_Age',section:'skin'},
];
export const RIG_IDS = {male:'getsuga-v1',female:'artemis-v1'};
const bound=(v,min,max,f)=>Number.isFinite(Number(v))?Math.max(min,Math.min(max,Number(v))):f;
const color=(v,f)=>/^#[a-f0-9]{6}$/i.test(String(v||''))?v:f;
export function normalizeCustomization(value={}) {
 const a=value&&typeof value==='object'?value:{};
 const chosen=a.selected_assets&&typeof a.selected_assets==='object'?a.selected_assets:{};
 return {
  customization_version:1,
  selected_assets:Object.fromEntries(CUSTOMIZATION_SLOTS.filter(s=>/^[a-zA-Z0-9_-]{1,100}$/.test(String(chosen[s]||''))).map(s=>[s,String(chosen[s])])),
  shape_controls:Object.fromEntries(SHAPE_CONTROLS.map(c=>[c.id,bound(a.shape_controls?.[c.id],0,1,0)])),
  skin_finish:bound(a.skin_finish,0,1,.35),
  skin_finish_enabled:a.skin_finish_enabled===true,
  skin_highlight_color:color(a.skin_highlight_color,'#fff3e5'),
  skin_highlight_enabled:a.skin_highlight_enabled===true,
  layer_colors:Object.fromEntries(CUSTOMIZATION_SLOTS.filter(s=>/^#[a-f0-9]{6}$/i.test(String(a.layer_colors?.[s]||''))).map(s=>[s,a.layer_colors[s]])),
  layer_opacity:Object.fromEntries(['tattoo','complexion'].map(s=>[s,bound(a.layer_opacity?.[s],0,1,s==='tattoo'?.75:1)])),
 };
}
export function isAvatarAssetUrl(value) {
 const s=String(value||'');
 return /^https:\/\/base44\.app\/api\/apps\/6876751a602125f45f1861b9\/files\//.test(s)
  || /^\/models\/[a-zA-Z0-9_./-]+$/.test(s)&&!s.includes('..');
}
const names=value=>Array.isArray(value)?[...new Set(value.filter(v=>typeof v==='string'&&v.length>0&&v.length<=100))].slice(0,32):[];
export function normalizeCustomizationAsset(input={}) {
 const a=input&&typeof input==='object'?input:{};
 const fail=message=>{throw new Error(message);};
 if(!String(a.name||'').trim()||String(a.name).length>70)fail('Enter an asset name up to 70 characters.');
 if(!CUSTOMIZATION_SLOTS.includes(a.slot))fail('Choose a supported customization slot.');
 if(!['male','female'].includes(a.gender))fail('Choose the body this asset was authored for.');
 const binding=['skinned','socket','surface'].includes(a.binding)?a.binding:'skinned';
 if(!isAvatarAssetUrl(a.file_url))fail('Upload this asset to the app first.');
 if(binding==='surface'&&!['tattoo','complexion'].includes(a.slot))fail('Surface layers must use the tattoo or complexion slot.');
 if(binding==='surface'&&!/\.(png|webp)(?:[?#].*)?$/i.test(a.file_url))fail('Use a transparent PNG or WebP exported for the body UVs.');
 if(binding!=='surface'&&!/\.glb(?:[?#].*)?$/i.test(a.file_url))fail('Use a self-contained GLB.');
 if(binding==='socket'&&!String(a.attach_bone||'').trim())fail('A rigid attachment needs its exact bone name.');
 const target_meshes=names(a.target_meshes);
 if(binding==='surface'&&!target_meshes.length)fail('Specify the exact body mesh names for the surface layer.');
 return {
  name:String(a.name).trim(),slot:a.slot,gender:a.gender,rig_id:RIG_IDS[a.gender],binding,file_url:String(a.file_url).slice(0,1200),
  thumbnail_url:isAvatarAssetUrl(a.thumbnail_url)?a.thumbnail_url:'',
  description:String(a.description||'').trim().slice(0,300),published:a.published===true,
  attach_bone:binding==='socket'?String(a.attach_bone).trim().slice(0,100):'',
  hide_meshes:binding==='surface'?[]:names(a.hide_meshes),target_meshes,
  tint_materials:names(a.tint_materials),
  // Skin/hair masks can be supplied in a model's glTF extras; no guessed body regions.
 };
}
export async function resolveCustomizationAssets(service,appearance) {
 const selected=appearance.selected_assets||{};
 const entries=Object.entries(selected);
 if(entries.length===0)return {...appearance,customization_assets:[]};
 const ids=[...new Set(entries.map(([,id])=>id))];
 const rows=(await Promise.all(ids.map(id=>service.AvatarCustomizationAsset.filter({id,published:true},'created_date',1)))).flat();
 const resolved=entries.map(([slot,id])=>{
  const row=rows.find(r=>r.id===id);
  if(!row||row.slot!==slot||row.gender!==appearance.gender||row.rig_id!==RIG_IDS[appearance.gender])throw new Error('A selected layer is unavailable for this body. Refresh the creator and choose another.');
  return {id:row.id,...normalizeCustomizationAsset(row)};
 });
 return {...appearance,customization_assets:resolved};
}

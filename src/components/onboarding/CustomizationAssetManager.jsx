import {useRef,useState} from 'react';
import {useQueryClient} from '@tanstack/react-query';
import {Upload, X} from 'lucide-react';
import {base44} from '@/api/base44Client';
import {CUSTOMIZATION_SLOTS,normalizeCustomizationAsset} from '../../../base44/shared/avatarCustomization.ts';
export default function CustomizationAssetManager({gender,capabilities,onClose}) {
 const query=useQueryClient(),file=useRef(null);
 const [form,setForm]=useState({name:'',slot:'hair',gender,binding:'skinned',attach_bone:'head',hide_meshes:[],target_meshes:[],tint_materials:[],description:''});
 const [upload,setUpload]=useState(null),[error,setError]=useState(''),[busy,setBusy]=useState(false);
 const caps=capabilities.customization||{},update=patch=>setForm(c=>({...c,...patch}));
 const inspect=async e=>{
  const asset=e.target.files?.[0];if(!asset)return;setError('');setUpload(null);
  try {
   if(asset.size>30*1024*1024)throw Error('Use an asset smaller than 30 MB.');
   if(form.binding==='surface') {
    if(!/\.(png|webp)$/i.test(asset.name))throw Error('Use a transparent PNG or WebP.');
   }else {
    const bytes=await asset.arrayBuffer(),view=new DataView(bytes);
    if(bytes.byteLength<20||view.getUint32(0,true)!==0x46546c67||view.getUint32(4,true)!==2)throw Error('Use a valid GLB 2.0 model.');
    const length=view.getUint32(12,true);if(length>bytes.byteLength-20)throw Error('The GLB is incomplete.');
    const doc=JSON.parse(new TextDecoder().decode(new Uint8Array(bytes,20,length)));
    if((doc.buffers||[]).some(b=>b.uri)||(doc.images||[]).some(i=>i.uri&&!i.uri.startsWith('data:')))throw Error('Embed the textures and buffers in the GLB before uploading.');
    if(form.binding==='skinned') {
     if(!doc.skins?.length)throw Error('This model is not rigged. Choose a rigid bone attachment or export it with skin weights.');
     const names=doc.skins.flatMap(s=>s.joints.map(i=>doc.nodes[i]?.name));
     if(names.some(n=>!caps.boneNames?.includes(n)))throw Error('Some bones do not match '+gender+'. Export this layer on the selected body rig.');
    }
    update({tint_materials:[]});
   }
   setUpload(asset);
  }catch(err){setError(err.message);}
 };
 const publish=async()=>{
  if(!upload||busy)return;setBusy(true);setError('');
  try {
   const {file_url}=await base44.integrations.Core.UploadFile({file:upload});
   const values=normalizeCustomizationAsset({...form,file_url,published:true});
   const response=await base44.functions.invoke('avatarCustomizationCatalog',{action:'save',asset:values});
   if(!response.data?.success)throw Error(response.data?.error||'The layer could not be published.');
   await query.invalidateQueries({queryKey:['avatar-customization-catalog']});onClose();
  }catch(err){setError(err.message);}finally{setBusy(false);}
 };
 const selection=(key,label)=><label>{label}<select multiple size={4} value={form[key]} onChange={e=>update({[key]:Array.from(e.target.selectedOptions,o=>o.value)})}>{(caps.meshNames||[]).filter(n=>!/^(FX|Lunar|Rain|Husky)/i.test(n)).map(n=><option key={n} value={n}>{n}</option>)}</select><small>Choose only meshes exported for this layer. Ctrl / ⌘ selects several.</small></label>;
 return <section className="creator-import" aria-label="Upload customization layer"><header><div><p>ASSET WORKSHOP</p><h2>Add a fitted layer</h2></div><button type="button" aria-label="Close asset workshop" onClick={onClose} disabled={busy}><X size={18}/></button></header>
  <p className="creator-hint">Publish a GLB on the {gender==='female'?'Artemis':'Getsuga'} rig, or a transparent image made for its UV layout. New options appear in the matching category.</p>
  <fieldset disabled={busy}><label>Layer name<input value={form.name} maxLength={70} onChange={e=>update({name:e.target.value})} placeholder="e.g. Braided hair"/></label>
  <div className="creator-form-pair"><label>Category<select value={form.slot} onChange={e=>{const slot=e.target.value;update({slot,binding:['tattoo','complexion'].includes(slot)?'surface':'skinned'});setUpload(null);}}>{CUSTOMIZATION_SLOTS.map(s=><option key={s} value={s}>{s.replaceAll('_',' ')}</option>)}</select></label><label>Attachment<select value={form.binding} onChange={e=>{update({binding:e.target.value});setUpload(null);}}><option value="skinned">Skinned layer</option><option value="socket">Rigid bone attachment</option>{['tattoo','complexion'].includes(form.slot)&&<option value="surface">UV surface layer</option>}</select></label></div>
  {form.binding==='socket'&&<label>Attach to bone<select value={form.attach_bone} onChange={e=>update({attach_bone:e.target.value})}>{(caps.boneNames||[]).map(n=><option key={n}>{n}</option>)}</select></label>}
  {form.binding==='surface'?selection('target_meshes','Apply to body meshes'):selection('hide_meshes','Replace these base mesh parts (optional)')}
  {form.binding!=='surface'&&<label>Materials that may be recolored<input value={form.tint_materials.join(', ')} onChange={e=>update({tint_materials:e.target.value.split(',').map(s=>s.trim()).filter(Boolean)})} placeholder="Exact material names, separated by commas"/></label>}
  <button type="button" className="creator-upload" onClick={()=>file.current?.click()}><Upload size={19}/>{upload?upload.name:'Choose '+(form.binding==='surface'?'PNG / WebP':'GLB')+' file'}</button>
  <input ref={file} hidden type="file" accept={form.binding==='surface'?'.png,.webp':'.glb'} onChange={inspect}/>
  </fieldset>{error&&<p role="alert" className="creator-error">{error}</p>}
  <footer><button type="button" className="creator-save" disabled={busy||!upload||!form.name.trim()} onClick={publish}>{busy?'Publishing…':'Publish layer'}</button></footer>
 </section>;
}

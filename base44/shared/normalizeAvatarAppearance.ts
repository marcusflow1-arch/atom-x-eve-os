const male='/models/luna-hi3d/warrior.glb',greco='/models/atomxe-greco-girl.glb',prefix='https://base44.app/api/apps/6876751a602125f45f1861b9/files/',erika=prefix+'public/6876751a602125f45f1861b9/3f915913a_ErikaArcher.fbx';
const styles=['heroic_fantasy','graphic_ink','grounded_rpg','anime','watercolor','noir','neon'];
const faceKeys=['face_width','jaw_width','face_height','eye_spacing','nose_width','nose_length','mouth_width'];
const bound=(v,min,max,f=1)=>Number.isFinite(Number(v))?Math.max(min,Math.min(max,Number(v))):f;
const hex=(v,f)=>/^#[a-f0-9]{6}$/i.test(String(v||''))?v:f;
const choice=(v,list,f)=>list.includes(v)?v:f;
export function normalizeAvatarAppearance(input={}){
 const a=input&&typeof input==='object'?input:{},gender=a.gender==='female'?'female':'male',requested=String(a.model_url||'');
 const female_model_variant=gender==='female'&&a.female_model_variant==='erika_archer'?'erika_archer':gender==='female'?'greco_girl':'';
 const selectedBase=gender==='female'?(female_model_variant==='erika_archer'?erika:greco):male,isKnownBase=requested===male||requested===greco||requested===erika;
 const model_url=isKnownBase||!requested?selectedBase:(requested.startsWith(prefix)?requested.slice(0,1000):selectedBase);
 const colors=Object.fromEntries(Object.entries(a.material_colors||{}).slice(0,100).filter(([k,v])=>k.length<200&&/^#[a-f0-9]{6}$/i.test(String(v))));
 const morphs=Object.fromEntries(Object.entries(a.morph_targets||{}).slice(0,100).filter(([k,v])=>k.length<200&&Number.isFinite(v)).map(([k,v])=>[k,bound(v,0,1,0)]));
 return {appearance_version:3,gender,female_model_variant,model_url,base_body_gender:gender,base_body_model_url:selectedBase,style_preset:choice(a.style_preset,styles,styles[0]),
 skin_tone:hex(a.skin_tone,'#bb927c'),skin_tint_enabled:a.skin_tint_enabled===true,hair_color:hex(a.hair_color,'#323030'),hair_tint_enabled:a.hair_tint_enabled===true,eye_tint_enabled:a.eye_tint_enabled===true,eye_color:hex(a.eye_color,'#5ca9c9'),
 eyelash_style:choice(a.eyelash_style,['soft','natural','bold'],'natural'),hood_enabled:a.hood_enabled!==false,weapon_visible:a.weapon_visible!==false,
 height_scale:bound(a.height_scale,.84,1.18),body_proportions:{width:bound(a.body_proportions?.width,.88,1.12),depth:bound(a.body_proportions?.depth,.9,1.1)},
 face_shape:Object.fromEntries(faceKeys.map(k=>[k,bound(a.face_shape?.[k],-1,1,0)])),
 face_fit_source:a.face_fit_source==='selfie'?'selfie':'manual',face_scan_generated:a.face_fit_source==='selfie',face_model_url:'',tripo_model_id:'',
 complexion:choice(a.complexion,['natural','freckles','rosy'],'natural'),facial_hair:choice(a.facial_hair,['none','fine','trimmed'],'none'),facial_hair_color:hex(a.facial_hair_color,'#30241e'),
 tattoo_style:choice(a.tattoo_style,['none','bands','botanical'],'none'),tattoo_placement:a.tattoo_placement==='right'?'right':'left',tattoo_color:hex(a.tattoo_color,'#263b42'),tattoo_opacity:bound(a.tattoo_opacity,0,1,.65),
 hair_style:'original',hair_length:bound(a.hair_length,.35,1.35),hair_volume:bound(a.hair_volume,.8,1.2),material_colors:colors,morph_targets:morphs};
}
export const FACE_CONTROLS = [
 ['face_width','Face width'],['jaw_width','Jaw width'],['face_height','Face height'],
 ['eye_spacing','Eye spacing'],['nose_width','Nose width'],['nose_length','Nose length'],['mouth_width','Mouth width'],
];
export const FIT_DEFAULTS = {
 appearance_version:3,skin_tint_enabled:false,hair_tint_enabled:false,face_shape:{},face_fit_source:'manual',
 complexion:'natural',facial_hair:'none',facial_hair_color:'#30241e',tattoo_style:'none',tattoo_placement:'left',
 tattoo_color:'#263b42',tattoo_opacity:.65,hair_style:'original',hair_length:1,hair_volume:1,
};
export const clamp=(v,min,max)=>Math.max(min,Math.min(max,Number(v)||0));
export function normalizeFaceShape(value={}) { return Object.fromEntries(FACE_CONTROLS.map(([key])=>[key,clamp(value[key],-1,1)])); }
const gaussian=(v,center,width)=>Math.exp(-Math.pow((v-center)/width,2));
export function deformFace(x,y,z,raw={}) {
 const s=normalizeFaceShape(raw);
 if(y<1.548 || y>1.795)return [x,y,z];
 if(Object.values(s).every(v=>v===0))return [x,y,z];
 const dx=x-.044,dz=z-.074;
 let u=dx*.932-dz*.362,v=y,w=dx*.362+dz*.932;
 const head=gaussian(v,1.66,.095)*gaussian(u,0,.13);
 const front=gaussian(w,.025,.065);
 const jaw=gaussian(v,1.584,.037),eyes=gaussian(v,1.663,.019),nose=gaussian(u,0,.019)*gaussian(v,1.639,.03),mouth=gaussian(v,1.610,.012);
 const gate=clamp((y-1.548)/.036,0,1);
 u+=gate*head*(u*.14*s.face_width + u*.20*jaw*s.jaw_width + u*.20*eyes*front*s.eye_spacing + u*.30*nose*front*s.nose_width + u*.23*mouth*front*s.mouth_width);
 v+=gate*head*((v-1.645)*.13*s.face_height - .006*nose*front*s.nose_length);
 return [.044+u*.932+w*.362,v,.074-u*.362+w*.932];
}
export function faceShapeFromLandmarks(points,width,height) {
 if(!Array.isArray(points)||points.length<468)throw Error('A full, clear face is required.');
 const p=i=>({x:points[i].x*width,y:points[i].y*height});
 if(points.some(p=>!Number.isFinite(p.x)||!Number.isFinite(p.y)))throw Error('The face measurement was incomplete.');
 const dist=(a,b)=>Math.hypot(p(a).x-p(b).x,p(a).y-p(b).y);
 const eyeSpan=dist(33,263),faceWidth=dist(234,454),faceHeight=dist(10,152);
 if(eyeSpan/width<.12)throw Error('Move closer so your face fills more of the photo.');
 const eyeMid=(p(33).x+p(263).x)/2;
 if(Math.abs(p(1).x-eyeMid)/eyeSpan>.18)throw Error('Look straight at the camera, then try again.');
 const fit=(ratio,base,range)=>clamp((ratio-base)/range,-.85,.85);
 return {
 face_width:fit(faceWidth/faceHeight,.73,.22),face_height:fit(faceHeight/faceWidth,1.37,.4),
 jaw_width:fit(dist(172,397)/faceWidth,.78,.22),eye_spacing:fit(dist(133,362)/faceWidth,.25,.10),
 nose_width:fit(dist(98,327)/faceWidth,.22,.10),nose_length:fit(dist(168,2)/faceHeight,.23,.10),
 mouth_width:fit(dist(61,291)/faceWidth,.36,.15),
 };
}

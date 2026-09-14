import {faceShapeFromLandmarks} from './avatarAppearanceData';
let models;
async function loadModels() {
 if(!models)models=(async()=>{
  const {FilesetResolver,FaceLandmarker,ImageSegmenter}=await import('@mediapipe/tasks-vision');
  const files=await FilesetResolver.forVisionTasks('/vendor/face-landmarker/0.10.32');
  const face=await FaceLandmarker.createFromOptions(files,{
   baseOptions:{modelAssetPath:'/models/face-landmarker/face_landmarker.task',delegate:'CPU'},
   runningMode:'IMAGE',numFaces:2,minFaceDetectionConfidence:.65,minFacePresenceConfidence:.65,
  });
  try { const segment=await ImageSegmenter.createFromOptions(files,{
   baseOptions:{modelAssetPath:'/models/face-landmarker/selfie_multiclass.tflite',delegate:'CPU'},
   runningMode:'IMAGE',outputCategoryMask:true,outputConfidenceMasks:false,
  });return {face,segment}; } catch(e){face.close();throw e;}
 })().catch(e=>{models=null;throw e;});
 return models;
}
const hex=values=>'#'+values.map(v=>Math.round(Math.max(0,Math.min(255,v))).toString(16).padStart(2,'0')).join('');
const median=values=>values.sort((a,b)=>a-b)[Math.floor(values.length/2)];
export function appearanceFromSegmentation(canvas,mask,points) {
 const {width,height}=mask,labels=mask.getAsUint8Array();
 const scratch=document.createElement('canvas');scratch.width=width;scratch.height=height;
 const ctx=scratch.getContext('2d',{willReadFrequently:true});ctx.drawImage(canvas,0,0,width,height);
 const pixels=ctx.getImageData(0,0,width,height).data,skin=[[],[],[]],hair=[[],[],[]];
 let hairBottom=0,hairLeft=width,hairRight=0,hairCount=0;
 const left=Math.min(points[234].x,points[454].x)*width,right=Math.max(points[234].x,points[454].x)*width;
 const top=points[10].y*height,chin=points[152].y*height,faceHeight=Math.max(1,chin-top);
 for(let i=0;i<labels.length;i++){
  const x=i%width,y=Math.floor(i/width),label=labels[i];
  if(x<left-faceHeight*.5||x>right+faceHeight*.5||y>chin+faceHeight*.9)continue;
  if(label===1){hairCount++;hairBottom=Math.max(hairBottom,y);hairLeft=Math.min(hairLeft,x);hairRight=Math.max(hairRight,x);}
  if(label!==1&&label!==3)continue;
  if(label===3&&(y<top+faceHeight*.28||y>chin-faceHeight*.18))continue;
  const out=label===1?hair:skin;for(let c=0;c<3;c++)out[c].push(pixels[i*4+c]);
 }
 const patch={};
 if(skin[0].length>30){patch.skin_tone=hex(skin.map(median));patch.skin_tint_enabled=true;}
 if(hairCount>40&&hair[0].length){patch.hair_color=hex(hair.map(median));patch.hair_tint_enabled=true;
  patch.hair_length=Math.max(.35,Math.min(1.35,(hairBottom-top)/faceHeight));
  patch.hair_volume=Math.max(.8,Math.min(1.2,(hairRight-hairLeft)/Math.max(1,right-left)*.8));
  patch.hair_style=patch.hair_length<.65?'compact':patch.hair_length>1.1?'flowing':'original';
 }
 return patch;
}
export async function fitSelfie(canvas,onStatus=()=>{}) {
 onStatus('Loading the face scanner…');const {face,segment}=await loadModels();
 await new Promise(resolve=>requestAnimationFrame(resolve));
 onStatus('Measuring your face…');const faces=face.detect(canvas).faceLandmarks;
 if(!faces?.length)throw Error('No face found. Use a well-lit photo with your face visible.');
 if(faces.length!==1)throw Error('Use a photo with just one person.');
 const shape=faceShapeFromLandmarks(faces[0],canvas.width,canvas.height);
 onStatus('Matching complexion and hair…');const result=segment.segment(canvas);
 try{return {face_shape:shape,face_fit_source:'selfie',face_scan_generated:true,...appearanceFromSegmentation(canvas,result.categoryMask,faces[0])};}finally{result.close();}
}
export function drawSelfie(source) {
 const w=source.videoWidth||source.naturalWidth||source.width,h=source.videoHeight||source.naturalHeight||source.height;
 if(!w||!h||Math.min(w,h)<160)throw Error('Wait for the camera, or choose a larger photo.');
 const canvas=document.createElement('canvas'),scale=Math.min(1,1024/Math.max(w,h));
 canvas.width=Math.round(w*scale);canvas.height=Math.round(h*scale);
 canvas.getContext('2d').drawImage(source,0,0,canvas.width,canvas.height);return canvas;
}

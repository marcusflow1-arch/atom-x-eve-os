import { useSyncExternalStore } from 'react';
import { base44 } from '@/api/base44Client';

let state = { active:false, starting:false, saving:false, elapsed:0, record:null, draft:null, error:'', tip:'', revision:0 };
const listeners = new Set();
let stream, preview, recorder, ticker, sampler, sampleBusy=false, startTime=0, chunks=[], totalBytes=0;
const emit = patch => { state={...state,...patch}; listeners.forEach(fn=>fn()); };
export const useRecordsCapture = () => useSyncExternalStore(fn=>{listeners.add(fn);return()=>listeners.delete(fn);},()=>state);
export const getRecordsCapture = () => state;
const changed = () => emit({revision:state.revision+1});
export const formatTime = value => { const n=Math.max(0,Math.floor(Number(value)||0)); return Math.floor(n/60)+':'+String(n%60).padStart(2,'0'); };
export function supportsCapture(){return Boolean(navigator.mediaDevices?.getDisplayMedia && window.MediaRecorder);}
async function draftStore(mode, value, key) {
  const db = await new Promise((resolve,reject)=>{
    const open=indexedDB.open('luna-records-drafts',1);
    open.onupgradeneeded=()=>open.result.createObjectStore('drafts');
    open.onsuccess=()=>resolve(open.result);open.onerror=()=>reject(open.error);
  });
  return new Promise((resolve,reject)=>{
    const tx=db.transaction('drafts',mode==='get'?'readonly':'readwrite'), s=tx.objectStore('drafts');
    const request=mode==='get'?s.get(key):mode==='put'?s.put(value,key):s.delete(key);
    let result;request.onsuccess=()=>{result=request.result;};
    tx.oncomplete=()=>{db.close();resolve(result);};tx.onerror=()=>{db.close();reject(tx.error);};
  });
}
export async function restoreRecordDraft(userId){
  if(!userId || state.active || state.starting || state.draft || state.saving)return;
  const draft=await draftStore('get',null,userId).catch(()=>null);
  if(draft)emit({draft,record:draft.record,error:'An unsaved recording was recovered. Save it or download a copy.'});
}
export async function privateUrl(uri){
  if(!uri)return '';
  const result=await base44.integrations.Core.CreateFileSignedUrl({file_uri:uri,expires_in:3600});
  if(!result?.signed_url)throw new Error('Media access could not be opened.');
  return result.signed_url;
}
export async function frameBlob(video){
  if(!video || video.readyState<2 || !video.videoWidth)throw new Error('Wait for the video frame to load.');
  const canvas=document.createElement('canvas'), scale=Math.min(1,1280/video.videoWidth);
  canvas.width=Math.round(video.videoWidth*scale);canvas.height=Math.round(video.videoHeight*scale);
  canvas.getContext('2d').drawImage(video,0,0,canvas.width,canvas.height);
  return new Promise((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(new Error('Screenshot could not be captured.')),'image/jpeg',.86));
}
export async function reviewMoment(momentId){
  const response=await base44.functions.invoke('reviewGameplayMoment',{moment_id:momentId});
  const body=response?.data||response;
  if(body?.error)throw new Error(body.error);
  changed();return body.moment;
}
export async function saveMoment({video,record,timestamp,kind='screenshot',analyze=false,source='manual'}){
  const blob=await frameBlob(video);
  const {file_uri}=await base44.integrations.Core.UploadPrivateFile({file:new File([blob],'moment-'+Date.now()+'.jpg',{type:'image/jpeg'})});
  if(!file_uri)throw new Error('Screenshot upload failed.');
  const moment=await base44.entities.GameplayMoment.create({
    user_id:record.user_id,record_id:record.id,timestamp:Math.max(0,Number(timestamp)||0),
    image_uri:file_uri,kind,source,title:kind==='highlight'?'Bookmarked highlight':'Screenshot'
  });
  changed();
  if(analyze){
    const reviewed=await reviewMoment(moment.id);
    emit({tip:reviewed?.ai_review?.suggestion||reviewed?.ai_review?.summary||''});
    return reviewed;
  }
  return moment;
}
export async function captureLiveMoment(kind='highlight'){
  if(!state.active || sampleBusy)return;
  sampleBusy=true;
  try{return await saveMoment({video:preview,record:state.record,timestamp:(Date.now()-startTime)/1000,kind});}
  finally{sampleBusy=false;}
}
export async function saveRecordDraft(){
  const draft=state.draft;
  if(!draft || state.saving)return;
  emit({saving:true,error:''});
  try{
    const extension=draft.blob.type.includes('mp4')?'mp4':'webm';
    const {file_uri}=await base44.integrations.Core.UploadPrivateFile({file:new File([draft.blob],'record-'+draft.record.id+'.'+extension,{type:draft.blob.type})});
    if(!file_uri)throw new Error('Recording upload did not return a file.');
    const updated=await base44.entities.GameplayRecord.update(draft.record.id,{media_uri:file_uri,media_type:'video',duration:draft.duration,status:'ready',size_bytes:draft.blob.size});
    await draftStore('delete',null,draft.record.user_id).catch(()=>{});
    emit({draft:null,record:updated,saving:false,revision:state.revision+1});
    return updated;
  }catch(error){emit({saving:false,error:'Upload failed. Your recording is still available here to retry or download. '+(error.message||'')});throw error;}
}
export function downloadRecordDraft(){
  if(!state.draft)return;
  const url=URL.createObjectURL(state.draft.blob),a=document.createElement('a');
  a.href=url;a.download='Luna-recording.'+(state.draft.blob.type.includes('mp4')?'mp4':'webm');a.click();
  setTimeout(()=>URL.revokeObjectURL(url),60000);
}
export function stopRecording(){
  if(recorder?.state==='recording')recorder.stop();
}
export async function startRecording({userId,gameName,aiEnabled=false}){
  if(state.active||state.starting||state.saving||state.draft)throw new Error('Save the current recording before starting another.');
  if(!userId)throw new Error('Sign in to record.');
  if(!gameName?.trim())throw new Error('Select or enter a game first.');
  if(!supportsCapture())throw new Error('This browser cannot capture a screen. You can still upload footage.');
  emit({starting:true,error:'',tip:''});
  let created;
  try{
    // Keep this call in the explicit Record button gesture.
    stream=await navigator.mediaDevices.getDisplayMedia({video:{frameRate:{ideal:30,max:60}},audio:true});
    created=await base44.entities.GameplayRecord.create({user_id:userId,title:gameName.trim()+' · '+new Date().toLocaleDateString(),game_name:gameName.trim(),media_type:'video',status:'recording',captured_at:new Date().toISOString()});
    preview=document.createElement('video');preview.muted=true;preview.playsInline=true;preview.srcObject=stream;await preview.play();
    const mime=['video/webm;codecs=vp9,opus','video/webm;codecs=vp8,opus','video/webm','video/mp4'].find(type=>MediaRecorder.isTypeSupported(type));
    recorder=new MediaRecorder(stream,{...(mime?{mimeType:mime}:{}),videoBitsPerSecond:4_000_000});
    chunks=[];totalBytes=0;startTime=Date.now();
    recorder.ondataavailable=event=>{
      if(event.data.size){chunks.push(event.data);totalBytes+=event.data.size;}
      if(totalBytes>=200*1024*1024)stopRecording();
    };
    recorder.onerror=()=>{emit({error:'Capture was interrupted. Saving the footage received so far.'});stopRecording();};
    recorder.onstop=async()=>{
      clearInterval(ticker);clearInterval(sampler);
      stream?.getTracks().forEach(track=>track.stop());
      preview?.pause();if(preview)preview.srcObject=null;
      const draft={blob:new Blob(chunks,{type:recorder.mimeType||'video/webm'}),duration:(Date.now()-startTime)/1000,record:created};
      chunks=[];stream=null;preview=null;recorder=null;
      emit({active:false,draft,elapsed:draft.duration,revision:state.revision+1});
      await draftStore('put',draft,userId).catch(()=>emit({error:'Local recovery storage is unavailable. Keep this page open until the upload finishes.'}));
      await base44.entities.GameplayRecord.update(created.id,{status:'pending',duration:draft.duration}).catch(()=>{});
      await saveRecordDraft().catch(()=>{});
    };
    recorder.start(1000);
    stream.getVideoTracks()[0]?.addEventListener('ended',stopRecording,{once:true});
    emit({active:true,starting:false,record:created,elapsed:0,revision:state.revision+1});
    ticker=setInterval(()=>{
      const elapsed=(Date.now()-startTime)/1000;emit({elapsed});
      if(elapsed>=1800)stopRecording();
    },1000);
    if(aiEnabled)sampler=setInterval(async()=>{
      if(sampleBusy||!state.active)return;
      sampleBusy=true;
      try{await saveMoment({video:preview,record:created,timestamp:(Date.now()-startTime)/1000,kind:'observation',source:'ai',analyze:true});}
      catch(error){emit({error:'AI review paused for this sample: '+error.message});}
      finally{sampleBusy=false;}
    },15000);
    return created;
  }catch(error){
    stream?.getTracks().forEach(track=>track.stop());stream=null;
    if(created)await base44.entities.GameplayRecord.update(created.id,{status:'interrupted'}).catch(()=>{});
    emit({starting:false,active:false,error:error.name==='NotAllowedError'?'Screen sharing was cancelled.':error.message});
    throw error;
  }
}
window.addEventListener('beforeunload',event=>{
  if(state.active||state.draft||state.saving){event.preventDefault();event.returnValue='';}
});

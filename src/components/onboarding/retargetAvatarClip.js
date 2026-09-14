import {AnimationClip,AnimationMixer,LoopOnce,Quaternion,QuaternionKeyframeTrack,VectorKeyframeTrack} from 'three';
import {clone} from 'three/examples/jsm/utils/SkeletonUtils.js';
const canonical=n=>n.replace(/^mixamorig:?/i,'');
const alias=n=>n.replace(/^Chest$/,'Spine2').replace(/UpperArm$/,'Arm').replace(/Thigh$/,'UpLeg').replace(/Shin$/,'Leg').replace(/Toe$/,'ToeBase');
export function retargetAvatarClip(source,target,clip){
 const s=clone(source),t=clone(target);for(const root of [s,t]){root.position.set(0,0,0);root.quaternion.identity();root.scale.setScalar(1);root.traverse(n=>{if(n.isSkinnedMesh)n.skeleton.pose();});root.updateMatrixWorld(true);}
 const src=new Map(),targetBones=[];s.traverse(n=>{if(n.isBone)src.set(canonical(n.name),n);});t.traverse(n=>{if(n.isBone)targetBones.push(n);});
 const entries=targetBones.map(bone=>{const sourceBone=src.get(alias(canonical(bone.name)));return sourceBone?{bone,sourceBone,sRest:sourceBone.getWorldQuaternion(new Quaternion()).invert(),tRest:bone.getWorldQuaternion(new Quaternion()),values:[]}:null;}).filter(Boolean);
 if(!entries.length)return clip.clone();
 const sh=src.get('Hips'),th=targetBones.find(n=>canonical(n.name)==='Hips'),sy=sh?.position.y||1,ty=th?.position.y||1,hipValues=[];
 const mixer=new AnimationMixer(s),action=mixer.clipAction(clip);action.setLoop(LoopOnce,1);action.clampWhenFinished=true;action.play();
 const count=Math.ceil(clip.duration*30)+1,times=[];
 for(let i=0;i<count;i++){const time=i*clip.duration/(count-1);times.push(time);mixer.setTime(time);s.updateMatrixWorld(true);
  for(const e of entries){const world=e.sourceBone.getWorldQuaternion(new Quaternion()).multiply(e.sRest).multiply(e.tRest),parent=e.bone.parent?.getWorldQuaternion(new Quaternion())||new Quaternion();e.bone.quaternion.copy(parent.invert().multiply(world).normalize());e.bone.updateMatrixWorld(true);e.values.push(...e.bone.quaternion.toArray());}
  if(sh&&th)hipValues.push(th.position.x,ty+(sh.position.y-sy)*ty/sy,th.position.z);
 }
 const tracks=entries.map(e=>new QuaternionKeyframeTrack(e.bone.name+'.quaternion',times,e.values));if(hipValues.length)tracks.push(new VectorKeyframeTrack(th.name+'.position',times,hipValues));
 mixer.stopAllAction();mixer.uncacheRoot(s);return new AnimationClip(clip.name,clip.duration,tracks);
}
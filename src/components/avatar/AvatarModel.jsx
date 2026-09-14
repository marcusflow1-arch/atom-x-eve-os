import {useEffect,useRef,useState,useSyncExternalStore} from 'react';
import {useFrame} from '@react-three/fiber';
import {AnimationMixer} from 'three';
import {loadAvatarModel,disposeAvatarModel,applyPlayerAppearance} from '@/components/onboarding/avatarAssetRuntime';
import {useCompanionIdentity} from '@/components/onboarding/CompanionIdentityContext';
import {playerAppearance} from '@/components/onboarding/playerAppearance';
import {companionModel,COMPANION_MOTIONS} from '@/components/onboarding/genesisAssets';
import {createEmbeddedAvatarController} from '@/components/onboarding/embeddedAvatarController';
import {isHi3DAvatar} from '@/components/onboarding/modelAppearance';
import {avatarAnimationStore} from '@/components/onboarding/avatarAnimationStore';
import {FBXLoader} from 'three/examples/jsm/loaders/FBXLoader.js';
export default function AvatarModel({modelUrl}){
 const config=playerAppearance(useCompanionIdentity()),url=modelUrl||companionModel(config),[model,setModel]=useState(null),runtime=useRef(null);
 const shared=useSyncExternalStore(avatarAnimationStore.subscribe,avatarAnimationStore.getSnapshot),latest=useRef(config);latest.current=config;
 useEffect(()=>{let disposed=false,owned;loadAvatarModel({...latest.current,model_url:url}).then(async next=>{owned=next;if(disposed){disposeAvatarModel(next);return;}const mixer=new AnimationMixer(next),controller=isHi3DAvatar(next)?createEmbeddedAvatarController(next,next.animations,mixer):null;runtime.current={mixer,controller};setModel(next);
 if(!controller){const clip=next.animations[0]||(await new FBXLoader().loadAsync(COMPANION_MOTIONS[0].url)).animations?.[0];if(!disposed&&clip)mixer.clipAction(clip).play();}
 }).catch(error=>console.error('Avatar load failed',error));return()=>{disposed=true;runtime.current?.controller?.dispose();runtime.current?.mixer.stopAllAction();runtime.current=null;if(owned)disposeAvatarModel(owned);};},[url]);
 useEffect(()=>{if(model)applyPlayerAppearance(model,config);},[model,JSON.stringify(config)]);
 useEffect(()=>{runtime.current?.controller?.command(shared.command);},[model,shared.revision]);
 useEffect(()=>{const c=runtime.current?.controller;if(c&&(shared.armLift||c.snapshot().armLift))c.setArmLift(shared.armLift);},[model,shared.armLift]);
 useFrame((_,dt)=>{if(!shared.paused&&!shared.hidden)runtime.current?.mixer.update(Math.min(dt,.05));});
 return model?<group position={[0,-1,0]}><primitive object={model}/></group>:null;
}
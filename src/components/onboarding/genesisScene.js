import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { applyCompanionAppearance } from '@/components/onboarding/genesisAssets';
export function createGenesisScene(container, url, onReady, onStatus) {
  const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(34,1,.01,100);
  const renderer = new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:'low-power'});
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.5)); renderer.outputColorSpace=THREE.SRGBColorSpace; renderer.toneMapping=THREE.ACESFilmicToneMapping;
  container.appendChild(renderer.domElement);
  const controls = new OrbitControls(camera,renderer.domElement); controls.enablePan=false; controls.minDistance=2; controls.maxDistance=6; controls.maxPolarAngle=Math.PI*.65; controls.enableDamping=true;
  scene.add(new THREE.HemisphereLight(0xffffff,0x5b7085,2));
  const light=new THREE.DirectionalLight(0xffffff,3); light.position.set(2,4,3); scene.add(light);
  const rim=new THREE.DirectionalLight(0x9ac9d2,2); rim.position.set(-2,2,-3); scene.add(rim);
  let disposed=false,model,mixer,action,frame,appearance={},animationVersion=0,basePosition=null,paused=false;
  const fbx=new FBXLoader(),gltf=new GLTFLoader(),clock=new THREE.Clock();
  const disposeModel = object => object?.traverse(n => {if(n.isMesh){n.geometry?.dispose();(Array.isArray(n.material)?n.material:[n.material]).filter(Boolean).forEach(m=>{Object.values(m).forEach(v=>{if(v?.isTexture)v.dispose();});m.dispose();});}});
  const resize=()=>{const w=Math.max(1,container.clientWidth),h=Math.max(1,container.clientHeight);renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();};
  const observer=new ResizeObserver(resize);observer.observe(container);resize();
  const animate=()=>{if(disposed)return;frame=requestAnimationFrame(animate);mixer?.update(Math.min(clock.getDelta(),.05));controls.update();renderer.render(scene,camera);};animate();
  async function play(motion) {
    const version=++animationVersion;onStatus('animation-loading');
    try {
      const asset=await fbx.loadAsync(motion.url);
      if(disposed||version!==animationVersion){disposeModel(asset);return;}
      if(!asset.animations?.length) throw new Error('No animation available');
      const clip=asset.animations[0].clone();
      // Keep previews in place rather than walking off the pedestal.
      clip.tracks.forEach(t=>{if(/Hips\.position$/.test(t.name)){for(let i=0;i<t.values.length;i+=3){t.values[i]=t.values[0];t.values[i+2]=t.values[2];}}});
      const next=mixer.clipAction(clip);
      if (motion.loop === false) { next.setLoop(THREE.LoopOnce, 1); next.clampWhenFinished = true; }
      else next.setLoop(THREE.LoopRepeat, Infinity);
      action?.fadeOut(.25);next.reset().fadeIn(.25).play();action=next;model.visible=true;onStatus('ready',motion.name);disposeModel(asset);
    } catch(error) {if(!disposed){if(model)model.visible=true;onStatus('animation-error');}}
  }
  (async()=>{
    try {
      const asset=/\.fbx(?:\?|$)/i.test(url)?await fbx.loadAsync(url):await gltf.loadAsync(url);
      model=asset.scene||asset;if(disposed){disposeModel(model);return;}
      let box=new THREE.Box3().setFromObject(model);const size=box.getSize(new THREE.Vector3());model.scale.setScalar(1.8/(size.y||1));
      box=new THREE.Box3().setFromObject(model);const center=box.getCenter(new THREE.Vector3());model.position.set(-center.x,-box.min.y,-center.z);basePosition=model.position.clone();
      camera.position.set(0,1.05,3.8);controls.target.set(0,.94,0);controls.update();
      const materials=[],morphs=[];
      model.traverse(n=>{if(!n.isMesh)return;(Array.isArray(n.material)?n.material:[n.material]).filter(Boolean).forEach((m,i)=>{m.side=THREE.DoubleSide;if(m.color)materials.push({key:`${n.name}:${i}`,label:(m.name||n.name||`Material ${i+1}`).replace(/_/g,' '),color:'#'+m.color.getHexString()});});if(n.morphTargetDictionary)Object.keys(n.morphTargetDictionary).forEach(name=>morphs.push({key:`${n.name}:${name}`,label:name}));});
      model.visible=false;scene.add(model);mixer=new THREE.AnimationMixer(model);applyCompanionAppearance(model,appearance);onReady({materials,morphs});
    }catch(error){if(!disposed)onStatus('error');}
  })();
  const move=(x=0,z=0,distance=.05)=>{
    if(!model||!basePosition)return;
    model.position.x=THREE.MathUtils.clamp(model.position.x+(x*distance),basePosition.x-1.65,basePosition.x+1.65);
    model.position.z=THREE.MathUtils.clamp(model.position.z+(z*distance),basePosition.z-1.05,basePosition.z+1.05);
    if(x||z){const heading=Math.atan2(x,z);model.rotation.y=heading;}
  };
  const resetPosition=()=>{if(model&&basePosition){model.position.copy(basePosition);model.rotation.y=0;}};
  const setPaused=value=>{paused=Boolean(value);if(mixer)mixer.timeScale=paused?0:1;return paused;};
  const togglePaused=()=>setPaused(!paused);
  return {appearance:value=>{appearance=value;if(model)applyCompanionAppearance(model,value);},play,move,resetPosition,setPaused,togglePaused,isPaused:()=>paused,rotate:amount=>{if(model)model.rotation.y+=amount;},dispose:()=>{disposed=true;cancelAnimationFrame(frame);observer.disconnect();controls.dispose();mixer?.stopAllAction();disposeModel(model);renderer.dispose();renderer.domElement.remove();}};
}
/** Game 5 local browser-only visualization. No quest-service imports. */
import * as THREE from 'three';
import { DEV_WORLD } from '../gameplay/world.mjs';
import { initialUiState, presentation, reduceQuestUi } from './questUi.mjs';
const $ = (id) => document.getElementById(id);
const host = $('game');
const scene = new THREE.Scene(); scene.background = new THREE.Color(0x0a1920); scene.fog = new THREE.FogExp2(0x0a1920, 0.014);
const camera = new THREE.PerspectiveCamera(58, innerWidth / innerHeight, 0.1, 125);
const renderer = new THREE.WebGLRenderer({ antialias: true }); renderer.setPixelRatio(Math.min(devicePixelRatio, 2)); renderer.setSize(innerWidth, innerHeight); renderer.shadowMap.enabled = true; host.appendChild(renderer.domElement);
scene.add(new THREE.HemisphereLight(0xb8dfea, 0x4a4330, 2));
const sunlight = new THREE.DirectionalLight(0xffd2a3, 2.8); sunlight.position.set(-10, 22, 10); sunlight.castShadow = true; sunlight.shadow.mapSize.set(1024,1024); sunlight.shadow.camera.left=-38;sunlight.shadow.camera.right=38;sunlight.shadow.camera.top=38;sunlight.shadow.camera.bottom=-38; scene.add(sunlight);
const material = (color, opts = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.76, ...opts });
function box(w,h,d,x,y,z,mat,rot=0) { const m = new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat); m.position.set(x,y,z);m.rotation.y=rot;m.castShadow=true;m.receiveShadow=true;scene.add(m);return m; }
const earth = new THREE.Mesh(new THREE.PlaneGeometry(100,100),material(0x233e31)); earth.rotation.x=-Math.PI/2;earth.receiveShadow=true;scene.add(earth);
const path = new THREE.Mesh(new THREE.PlaneGeometry(7,37),material(0x625d48));path.rotation.x=-Math.PI/2;path.position.set(0,.012,-2);scene.add(path);
const templeWood = material(0x51362f), roof = material(0x234b4f), gold = material(0xccaa60,{metalness:.55,roughness:.33});
for(const [x,z] of [[-10,-17],[9,-19]]){
 box(7,.9,6,x,2.3,z,templeWood);for(const s of [-1,1])for(const t of [-1,1])box(.5,4,.5,x+s*2.8,2,z+t*2.2,templeWood);
 const r=box(9,.7,8,x,5,z,roof);r.rotation.z=-.03;
 box(7,.4,6,x,5.55,z,roof);box(5,.35,4,x,6,z,roof);
}
for (const [x,z] of [[-6,1],[7,3],[-16,-8],[17,8]]) {
 const trunk = material(0x524233); box(.5,4,.5,x,2,z,trunk);
 const foliage = new THREE.Mesh(new THREE.ConeGeometry(2.6,5,7),material(0x315746));foliage.position.set(x,5.3,z);foliage.castShadow=true;scene.add(foliage);
}
function makePerson(primary,hat=false) {
 const group=new THREE.Group();
 const torso=new THREE.Mesh(new THREE.CylinderGeometry(.46,.75,1.55,9),material(primary));torso.position.y=1.25;torso.castShadow=true;group.add(torso);
 const head=new THREE.Mesh(new THREE.SphereGeometry(.32,12,10),material(0xd9ac87));head.position.y=2.3;group.add(head);
 for(const sign of [-1,1]){
  const arm=new THREE.Mesh(new THREE.CylinderGeometry(.16,.19,1.3,8),material(primary));arm.position.set(sign*.73,1.38,0);arm.rotation.z=sign*.23;group.add(arm);
  const leg=new THREE.Mesh(new THREE.CylinderGeometry(.2,.23,.9,8),material(0x25272f));leg.position.set(sign*.26,.39,0);group.add(leg);
 }
 if(hat){const brim=new THREE.Mesh(new THREE.CylinderGeometry(.95,.95,.09,14),material(0x342c22));brim.position.y=2.63;group.add(brim);const crown=new THREE.Mesh(new THREE.ConeGeometry(.51,.6,14),material(0x342c22));crown.position.y=2.98;group.add(crown);}
 group.castShadow=true;scene.add(group);return group;
}
const player=makePerson(0xb8c5c2);player.position.set(DEV_WORLD.spawn.x,0,DEV_WORLD.spawn.z);
const npc=makePerson(0x8e623d,true);npc.position.set(DEV_WORLD.npc.x,0,DEV_WORLD.npc.z);npc.rotation.y=Math.PI;
const collection=new THREE.Group();collection.position.set(DEV_WORLD.card.x,1.65,DEV_WORLD.card.z);scene.add(collection);
const cardMesh=new THREE.Mesh(new THREE.BoxGeometry(1.25,1.65,.15),gold);cardMesh.castShadow=true;collection.add(cardMesh);
const inset=new THREE.Mesh(new THREE.PlaneGeometry(.85,1.25),new THREE.MeshBasicMaterial({color:0x284b50,side:THREE.DoubleSide}));inset.position.z=.081;collection.add(inset);
const cardLight=new THREE.PointLight(0xe8c469,2,9);cardLight.position.copy(collection.position);scene.add(cardLight);
const rings=new THREE.Mesh(new THREE.TorusGeometry(1.15,.035,6,32),new THREE.MeshBasicMaterial({color:0xe6d391}));rings.position.copy(collection.position);rings.rotation.x=Math.PI/2;scene.add(rings);
const keys=new Set();let ui=initialUiState();let dialogueOpen=false;let notifyTimer=0;
function setUi(action){ui=reduceQuestUi(ui,action);const v=presentation(ui.snapshot);$('questTitle').textContent=v.title;$('objective').textContent=v.objective;$('wallet').textContent=`DEV test tokens: ${v.testWallet ?? 0}`;$('marker').textContent=v.marker;collection.visible=!v.cardCollected;rings.visible=!v.cardCollected;
 if(ui.notice || ui.error) {const bar=$('notification');bar.textContent=ui.error||ui.notice;bar.classList.toggle('error',Boolean(ui.error));bar.style.display='block';clearTimeout(notifyTimer);notifyTimer=setTimeout(()=>bar.style.display='none',5000);}
 $('actionBtn').disabled=ui.busy;
}
async function send(path,data){setUi({type:'loading'});try{const response=await fetch('/api/game5/'+path,{method:data?'POST':'GET',headers:data?{'Content-Type':'application/json'}:{},body:data?JSON.stringify(data):undefined,cache:'no-store'});const payload=await response.json();if(!response.ok)throw Error(payload.error||'Development quest request failed');setUi({type:'response',payload});return true;}catch(error){setUi({type:'error',message:error.message});return false;}}
function dist(target){return Math.hypot(player.position.x-target.x,player.position.z-target.z);}
function dialogue(open){dialogueOpen=open;$('dialogue').style.display=open?'flex':'none';if(!open)return;
 const p=presentation(ui.snapshot);const status=p.status;
 const messages={not_started:'Traveler, an ancestral card was lost beyond the temple road. Recover it, and return to me.',active:'Follow the eastward trail. The card lies near the ancient grove. Bring it back safely.',ready_to_complete:'You have recovered the ancestral card. Excellent work. Are you ready to complete your task?',completed:'The ancestral card is safe. Your service is remembered.'};
 $('dialogText').textContent=messages[status]||'Checking quest state…';const button=$('actionBtn');button.textContent=p.button;button.style.display=status==='not_started'||status==='ready_to_complete'?'inline-block':'none';
 button.onclick=async()=>{const action=status==='not_started'?'accept':'complete';const succeeded=await send(action,{npcId:DEV_WORLD.npc.id,position:{x:player.position.x,z:player.position.z}});if(succeeded)dialogue(false);};
}
function interact(){if(ui.busy||dialogueOpen)return;if(dist(DEV_WORLD.npc)<=DEV_WORLD.interactionRadius) { dialogue(true);return; } if(dist(DEV_WORLD.card)<=DEV_WORLD.interactionRadius) {send('pickup',{pickupId:DEV_WORLD.card.id,position:{x:player.position.x,z:player.position.z}});return;}setUi({type:'error',message:'Move closer to Elder Shen or the Lost Card.'});}
$('closeBtn').addEventListener('click',()=>dialogue(false));window.addEventListener('keydown',e=>{if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' ','e','E'].includes(e.key))e.preventDefault();if(e.key==='Escape')dialogue(false);if(!e.repeat && e.key.toLowerCase()==='e')interact();keys.add(e.key.toLowerCase());});window.addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));window.addEventListener('blur',()=>keys.clear());
window.addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);});
const clock=new THREE.Clock();const v=new THREE.Vector3();
function animate(){requestAnimationFrame(animate);const dt=Math.min(clock.getDelta(),.05);const speed=keys.has('shift')?8:4.8;
 if(!dialogueOpen){let dx=Number(keys.has('d')||keys.has('arrowright'))-Number(keys.has('a')||keys.has('arrowleft'));let dz=Number(keys.has('s')||keys.has('arrowdown'))-Number(keys.has('w')||keys.has('arrowup'));const len=Math.hypot(dx,dz)||1;dx/=len;dz/=len;player.position.x=THREE.MathUtils.clamp(player.position.x+dx*speed*dt,-DEV_WORLD.bounds,DEV_WORLD.bounds);player.position.z=THREE.MathUtils.clamp(player.position.z+dz*speed*dt,-DEV_WORLD.bounds,DEV_WORLD.bounds);if(dx||dz)player.rotation.y=Math.atan2(dx,dz);}
 const target=new THREE.Vector3(player.position.x+0.2,12,player.position.z+15);camera.position.lerp(target,Math.min(1,dt*4));camera.lookAt(player.position.x,1.1,player.position.z-2);
 const t=clock.elapsedTime;collection.rotation.y+=dt*.75;collection.position.y=1.65+Math.sin(t*2)*.12;rings.position.y=collection.position.y;cardLight.position.y=collection.position.y;
 const markerPoint=v.set(npc.position.x,3.8,npc.position.z).project(camera);const visible=markerPoint.z<1&&markerPoint.z>-1;
 $('marker').style.display=visible?'block':'none';$('marker').style.left=`${(markerPoint.x*.5+.5)*innerWidth}px`;$('marker').style.top=`${(-markerPoint.y*.5+.5)*innerHeight}px`;
 const nearbyNpc=dist(DEV_WORLD.npc)<=DEV_WORLD.interactionRadius, nearbyCard=dist(DEV_WORLD.card)<=DEV_WORLD.interactionRadius;
 $('help').textContent=nearbyNpc?'Press E to speak with Elder Shen':nearbyCard?'Press E to collect the Lost Card':'WASD / Arrow keys: move · Shift: run · E: interact';
 renderer.render(scene,camera);
}
setUi({type:'loading'});send('state');animate();

import * as THREE from 'three';

const mat=(color,opts={})=>new THREE.MeshStandardMaterial({color,roughness:opts.roughness??.78,metalness:opts.metalness??.18,emissive:opts.emissive??0x000000,emissiveIntensity:opts.emissiveIntensity??0,side:THREE.DoubleSide});
const M={
  floor:mat(0x313840,{metalness:.32,roughness:.68}),
  wall:mat(0x242a31,{metalness:.25,roughness:.74}),
  trim:mat(0x606874,{metalness:.55,roughness:.45}),
  dark:mat(0x13171c,{metalness:.32,roughness:.72}),
  panel:mat(0x454c55,{metalness:.42,roughness:.58}),
  rock:mat(0x3b332f,{metalness:0,roughness:.96}),
  blue:mat(0x7fb9ff,{emissive:0x3a8dff,emissiveIntensity:3.2,metalness:.15,roughness:.3}),
  red:mat(0xff7459,{emissive:0xff2f18,emissiveIntensity:3.0,metalness:.1,roughness:.28}),
  white:mat(0xffffff,{emissive:0xffffff,emissiveIntensity:2.6,roughness:.22}),
  screen:mat(0x50e28a,{emissive:0x20c96a,emissiveIntensity:2.4,roughness:.3}),
};
function box(g,name,p,s,material=M.wall){
  const mesh=new THREE.Mesh(new THREE.BoxGeometry(...s),material);mesh.name=name;mesh.position.set(...p);mesh.castShadow=false;mesh.receiveShadow=true;g.add(mesh);return mesh;
}
function cylinder(g,name,p,r,h,material=M.wall,segments=20){
  const mesh=new THREE.Mesh(new THREE.CylinderGeometry(r,r,h,segments),material);mesh.name=name;mesh.position.set(...p);mesh.castShadow=false;mesh.receiveShadow=true;g.add(mesh);return mesh;
}
function lightStrip(g,p,s,material=M.white){
  return box(g,'LightStrip',p,s,material);
}
function point(g,p,color,intensity=2.5,distance=18){
  const l=new THREE.PointLight(color,intensity,distance,2);l.position.set(...p);g.add(l);return l;
}
function corridor(g,z0,z1,width=10,height=5){
  const z=(z0+z1)/2,len=Math.abs(z1-z0);
  box(g,'CorridorFloor',[0,0,z],[width,.35,len],M.floor);
  box(g,'CorridorLeft',[-width/2,2.5,z],[.45,height,len],M.wall);
  box(g,'CorridorRight',[width/2,2.5,z],[.45,height,len],M.wall);
  box(g,'CorridorCeiling',[0,height,z],[width,.35,len],M.dark);
  for(let zz=Math.min(z0,z1)+6;zz<Math.max(z0,z1);zz+=10){
    lightStrip(g,[0,height-.15,zz],[2.1,.12,.45],M.white);
    point(g,[0,height-.45,zz],0xdce9ff,1.8,11);
  }
}
function door(g,z,width=4,height=4.1){
  box(g,'DoorFrameL',[-width/2-.35,height/2,z],[.55,height,.6],M.trim);
  box(g,'DoorFrameR',[ width/2+.35,height/2,z],[.55,height,.6],M.trim);
  box(g,'DoorHeader',[0,height+.2,z],[width+1.1,.5,.6],M.trim);
  box(g,'DoorSlab',[0,height/2,z-.03],[width,height,.22],M.panel);
  for(const x of [-1.5,-.5,.5,1.5])lightStrip(g,[x,height-.1,z-.18],[.18,2.6,.08],M.white);
}
function consoleBank(g,p,rot=0){
  const root=new THREE.Group();root.position.set(...p);root.rotation.y=rot;g.add(root);
  box(root,'ConsoleBase',[0,1,0],[4,2,.8],M.panel);
  for(let i=-1;i<=1;i++){
    const scr=box(root,'ConsoleScreen',[i*1.15,1.25,-.43],[.8,.55,.05],i===0?M.screen:M.red);
    scr.rotation.x=-.1;
  }
}
function rockyCliffs(g){
  const geos=[];
  const add=(x,y,z,sx,sy,sz,ry)=>{
    const mesh=new THREE.Mesh(new THREE.DodecahedronGeometry(1,0),M.rock);
    mesh.position.set(x,y,z);mesh.scale.set(sx,sy,sz);mesh.rotation.y=ry;mesh.rotation.z=.08*Math.sin(x+z);
    mesh.name='RockCliff';g.add(mesh);geos.push(mesh);
  };
  for(let i=0;i<20;i++){
    const z=8-i*2.7;add(-14-(i%3)*1.8,3.5+(i%4)*1.2,z,4.2,4.2+(i%5)*.8,5.5,.2*i);
    add(15+(i%2)*2,4+(i%5)*.9,z-4,4.8,4.8+(i%4),5.8,.13*i);
  }
}
function exteriorOpening(g){
  const zone=new THREE.Group();zone.name='ZONE_01_Exterior_Opening';zone.userData={frames:'000211–000331',timestamps:'00:03:30–00:05:30',confidence:'multi-frame visual'};
  g.add(zone);
  box(zone,'ExteriorFloor',[0,0,-10],[26,.45,44],M.floor);
  rockyCliffs(zone);
  box(zone,'LeftOutpostMass',[-9,3,-13],[8,6,24],M.wall);
  box(zone,'LeftOverhang',[-2.5,5,-8],[17,.7,13],M.dark);
  box(zone,'RightOutpostMass',[10,3,-22],[8,6,28],M.wall);
  box(zone,'FrontRaisedPlatform',[0,.65,7],[12,1.3,5],M.panel);
  for(const x of [-5.5,0,5.5]){
    const fin=box(zone,'ExteriorFin',[x,7,-2],[.65,13,2.5],M.trim);fin.rotation.z=x===0?0:(x<0?-.12:.12);
  }
  for(const x of [-4,-2,3,5])box(zone,'Crate',[x,.65,-20+(x%2)*3],[1.4,1.3,1.6],M.panel);
  for(const x of [-10.5,10.5]){lightStrip(zone,[x,2.1,-2],[.2,1.5,.35],M.blue);point(zone,[x,2.6,-2],0x6eaaff,2.8,13);}
  door(zone,-31,4.2,4.1);
  point(zone,[0,7,-10],0x98b8de,2.2,30);
}
function patternedRoom(g,z=-72){
  const zone=new THREE.Group();zone.name='ZONE_02_Patterned_Interior';zone.userData={frames:'~000600',timestamps:'~00:09:59',confidence:'single-frame visual + route inference'};g.add(zone);
  box(zone,'PatternRoomFloor',[0,0,z],[18,.35,24],M.floor);
  box(zone,'PatternRoomLeft',[-9,3,z],[.45,6,24],M.wall);box(zone,'PatternRoomRight',[9,3,z],[.45,6,24],M.wall);
  box(zone,'PatternRoomCeiling',[0,6,z],[18,.35,24],M.dark);
  const tiles=[[0,0],[-4,0],[4,0],[0,-5],[0,5],[-4,-5],[4,-5],[-4,5],[4,5]];
  for(const [x,dz] of tiles)box(zone,'FloorPlate',[x,.2,z+dz],[3.2,.08,3.8],M.panel);
  box(zone,'CenterLift',[0,1.2,z],[3.4,2.4,3.4],M.trim);
  for(let zz=z-9;zz<=z+9;zz+=6){lightStrip(zone,[-8.6,1.2,zz],[.12,.28,2.1],M.blue);lightStrip(zone,[8.6,1.2,zz],[.12,.28,2.1],M.blue);}
}
function circularChamber(g,z=-138){
  const zone=new THREE.Group();zone.name='ZONE_03_Circular_Chamber';zone.userData={frames:'~000900',timestamps:'~00:14:59',confidence:'single-frame visual'};g.add(zone);
  const r=10;
  cylinder(zone,'CircularFloor',[0,-.15,z],r,.35,M.floor,32);
  for(let i=0;i<16;i++){
    const a=i/16*Math.PI*2,x=Math.sin(a)*r,zz=z+Math.cos(a)*r;
    const wall=box(zone,'CircularWall',[x,3,zz],[3.8,6,.5],i%4===0?M.trim:M.wall);wall.rotation.y=a;
  }
  door(zone,z-10.1,3.6,4.1);
  box(zone,'CenterConsole',[0,1.1,z+3.4],[1.2,2.2,.7],M.panel);
  lightStrip(zone,[0,1.55,z+3.0],[.22,.18,.4],M.red);
  point(zone,[0,4.8,z],0xdce9ff,2.2,18);
}
function industrialCatwalk(g,z=-208){
  const zone=new THREE.Group();zone.name='ZONE_04_Industrial_Catwalk';zone.userData={frames:'~001200',timestamps:'~00:19:59',confidence:'single-frame visual'};g.add(zone);
  box(zone,'LowerVoid',[0,-3,z],[24,.3,30],M.dark);
  box(zone,'UpperCatwalk',[0,2.6,z],[8,.35,30],M.floor);
  for(const x of [-4.3,4.3])for(let zz=z-13;zz<=z+13;zz+=2.4){box(zone,'CatwalkRail',[x,3.1,zz],[.12,1,.12],M.trim);}
  for(let zz=z-13;zz<=z+13;zz+=4)lightStrip(zone,[0,2.82,zz],[5.8,.08,.15],M.red);
  box(zone,'ImperialWall',[8,4,z-4],[.7,8,16],M.wall);
  box(zone,'UpperBridge',[5.5,5.6,z+4],[10,.4,4],M.floor);
  point(zone,[0,6,z],0x94a9c2,2,26);
}
function brightCorridor(g,z0=-260,z1=-304){
  const zone=new THREE.Group();zone.name='ZONE_05_Bright_Corridor';zone.userData={frames:'~001500',timestamps:'~00:24:59',confidence:'single-frame visual'};g.add(zone);
  corridor(zone,z0,z1,8,5.5);
  for(let z=z1+3;z<z0-2;z+=7){for(const x of [-3.6,3.6])lightStrip(zone,[x,2.7,z],[.12,3.4,.15],M.white);}
  door(zone,z1,3.5,4.4);
}
function finalControlRoom(g,z=-338){
  const zone=new THREE.Group();zone.name='ZONE_06_Final_Control_Room';zone.userData={frames:'001653',timestamps:'00:27:32',confidence:'single-frame end-state visual'};g.add(zone);
  box(zone,'FinalFloor',[0,0,z],[18,.35,20],M.floor);
  box(zone,'FinalLeft',[-9,3,z],[.45,6,20],M.wall);box(zone,'FinalRight',[9,3,z],[.45,6,20],M.wall);box(zone,'FinalBack',[0,3,z-10],[18,6,.45],M.wall);box(zone,'FinalCeiling',[0,6,z],[18,.35,20],M.dark);
  consoleBank(zone,[5.8,1,z-5],Math.PI/2);consoleBank(zone,[5.8,1,z],Math.PI/2);consoleBank(zone,[5.8,1,z+5],Math.PI/2);
  consoleBank(zone,[-4.2,1,z-7],0);
  for(let zz=z-7;zz<=z+7;zz+=4)lightStrip(zone,[0,5.75,zz],[3.8,.12,.5],M.white);
  point(zone,[0,4.5,z],0xdfeaff,2.5,22);
}

export function buildKejimPostVisualReferenceBlockout(){
  const root=new THREE.Group();root.name='KejimPost_VisualReference_Blockout';
  root.userData={
    source:'Google Drive frame-by-frame screenshots',
    sourceFolderId:'17jTbFKOpaDZZynh56-CVXglXiECqN8RY',
    verifiedFrames:'000001–001653',
    verifiedTimestamps:'00:00:00–00:27:32',
    fidelity:'visual blockout only; not exact BSP geometry',
    zones:[],
  };
  exteriorOpening(root);
  corridor(root,-31,-60,8,5);
  patternedRoom(root,-72);
  corridor(root,-84,-128,8,5.5);
  circularChamber(root,-138);
  corridor(root,-149,-193,7.5,5);
  industrialCatwalk(root,-208);
  corridor(root,-223,-260,8,5.5);
  brightCorridor(root,-260,-304);
  corridor(root,-304,-328,8,5.5);
  finalControlRoom(root,-338);
  root.children.filter(c=>c.userData?.frames).forEach(c=>root.userData.zones.push({name:c.name,...c.userData}));
  return root;
}

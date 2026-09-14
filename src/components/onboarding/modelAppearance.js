import { BufferAttribute, Color, Matrix4, Vector3, Vector4 } from 'three';
import { surface, surfaceMap } from '@/components/onboarding/avatarSurfaceShaders';
import { deformFace, normalizeFaceShape } from './avatarAppearanceData';
export function isHi3DAvatar(model) { let found=false;model?.traverse(n=>{found ||= n.userData?.avatarRig==='luna-hi3d-v1';});return found; }
const smooth=(a,b,x)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t);};
function prepare(mesh,hi3d,model){
 const g=mesh.geometry,p=g.getAttribute('position'); if(!p)return;
 if(!g.getAttribute('normal'))g.computeVertexNormals();
 if(!g.getAttribute('lunaRestPosition')){
  g.setAttribute('lunaRestPosition',p.clone());g.setAttribute('lunaRestNormal',g.getAttribute('normal').clone());
  const mask=new Float32Array(p.count),uv=g.getAttribute('uv'),mat=Array.isArray(mesh.material)?mesh.material[0]:mesh.material;
  if(hi3d&&uv&&mat?.map?.image&&typeof document!=='undefined'){
   try{const image=mat.map.image,c=document.createElement('canvas');c.width=image.width;c.height=image.height;const ctx=c.getContext('2d',{willReadFrequently:true});ctx.drawImage(image,0,0);const pixels=ctx.getImageData(0,0,c.width,c.height).data;
    for(let i=0;i<p.count;i++){const x=Math.min(c.width-1,Math.max(0,Math.floor(uv.getX(i)*c.width))),y=Math.min(c.height-1,Math.max(0,Math.floor((mat.map.flipY?1-uv.getY(i):uv.getY(i))*c.height))),k=(y*c.width+x)*4;
     const max=Math.max(pixels[k],pixels[k+1],pixels[k+2]),min=Math.min(pixels[k],pixels[k+1],pixels[k+2]);mask[i]=(1-smooth(75,125,max))*(1-smooth(20,45,max-min))*smooth(1.677,1.706,p.getY(i));}
   }catch{ /* A missing texture mask leaves the original hair intact. */ }
  }g.setAttribute('lunaHairMask',new BufferAttribute(mask,1));
  if(!hi3d){model.updateMatrixWorld(true);let head,top;model.traverse(n=>{if(n.isBone){if(/(?:^|:)Head$/.test(n.name)||/mixamorigHead$/.test(n.name))head=n;if(/HeadTop_End$/.test(n.name))top=n;}});
   if(head&&top){const inv=new Matrix4().copy(model.matrixWorld).invert(),h=head.getWorldPosition(new Vector3()).applyMatrix4(inv),t=top.getWorldPosition(new Vector3()).applyMatrix4(inv);
    const m=new Matrix4().multiplyMatrices(inv,mesh.matrixWorld);g.userData.lunaHead={h,unit:.178/Math.max(.001,t.y-h.y),m,inv:m.clone().invert()};}}
 }
}
export function applyFaceGeometry(model,raw,hi3d=isHi3DAvatar(model)){
 const shape=normalizeFaceShape(raw.face_shape),length=Math.max(.35,Math.min(1.35,Number(raw.hair_length)||1)),volume=Math.max(.8,Math.min(1.2,Number(raw.hair_volume)||1));
 const key=JSON.stringify([shape,length,volume]);let available=hi3d;
 model.traverse(mesh=>{if(!mesh.isMesh)return;prepare(mesh,hi3d,model);const g=mesh.geometry,rest=g.getAttribute('lunaRestPosition'),p=g.getAttribute('position'),frame=g.userData.lunaHead;
  available ||= !!frame;if(!rest||(!hi3d&&!frame)||g.userData.lunaFitKey===key)return;
  const point=new Vector3(),base=new Vector3();for(let i=0;i<p.count;i++){point.fromBufferAttribute(rest,i);base.copy(point);
   if(hi3d){const next=deformFace(point.x,point.y,point.z,shape);point.set(...next);const mask=g.getAttribute('lunaHairMask').getX(i);point.x+=(base.x-.044)*(volume-1)*mask;point.z+=(base.z-.074)*(volume-1)*mask;point.y+=(base.y-1.69)*(length-1)*mask;}
   else{point.applyMatrix4(frame.m);const x=(point.x-frame.h.x)*frame.unit,z=(point.z-frame.h.z)*frame.unit,y=1.6+(point.y-frame.h.y)*frame.unit;const cx=.044+.932*x+.362*z,cz=.074-.362*x+.932*z;const next=deformFace(cx,y,cz,shape),dx=next[0]-cx,dz=next[2]-cz;point.x+=(.932*dx-.362*dz)/frame.unit;point.z+=(.362*dx+.932*dz)/frame.unit;point.y+=(next[1]-y)/frame.unit;point.applyMatrix4(frame.inv);}
   p.setXYZ(i,point.x,point.y,point.z);
  }p.needsUpdate=true;g.computeVertexNormals();g.computeBoundingSphere();g.userData.lunaFitKey=key;
 });return available;
}
const styleParams={heroic_fantasy:[4,1.08,1.03,.35],graphic_ink:[3,1.1,1.22,.6],grounded_rpg:[0,1,1,0],anime:[5,.9,.94,.4],watercolor:[0,.7,.8,0],noir:[3,0,1.3,.55],neon:[0,1.2,1.08,0]};
export function applyAvatarSurface(mesh,mat,a,hi3d){
 mat.userData ||= {};let u=mat.userData.lunaSurface;
 if(!u){
  u={lunaSkin:{value:new Color()},lunaHair:{value:new Color()},lunaInk:{value:new Color()},lunaTattooInk:{value:new Color()},lunaSkinOn:{value:0},lunaHairOn:{value:0},lunaMoustache:{value:0},lunaComplexion:{value:0},lunaTattoo:{value:0},lunaSide:{value:1},lunaOpacity:{value:.65},lunaStyle:{value:new Vector4()},lunaStyleTint:{value:new Color()}};
  mat.userData.lunaSurface=u;const prev=mat.onBeforeCompile;
  mat.onBeforeCompile=(s,r)=>{prev?.(s,r);Object.assign(s.uniforms,u);
   if(hi3d){s.vertexShader=s.vertexShader.replace('#include <common>','#include <common>\nattribute vec3 lunaRestPosition;\nattribute float lunaHairMask;\nvarying vec3 vLunaRest;\nvarying float vLunaHair;').replace('#include <begin_vertex>','#include <begin_vertex>\nvLunaRest=lunaRestPosition;vLunaHair=lunaHairMask;');
    s.fragmentShader=s.fragmentShader.replace('#include <common>','#include <common>\n'+surface).replace('#include <map_fragment>',surfaceMap);}
   s.fragmentShader=s.fragmentShader.replace('#include <common>','#include <common>\nuniform vec4 lunaStyle;\nuniform vec3 lunaStyleTint;').replace('#include <opaque_fragment>','float lunaLum=dot(outgoingLight,vec3(.2126,.7152,.0722));\noutgoingLight=mix(vec3(lunaLum),outgoingLight,lunaStyle.y);\noutgoingLight=max(vec3(0.0),(outgoingLight-.18)*lunaStyle.z+.18);\nif(lunaStyle.x>0.0)outgoingLight=mix(outgoingLight,floor(outgoingLight*lunaStyle.x+.5)/lunaStyle.x,lunaStyle.w);\noutgoingLight*=lunaStyleTint;\n#include <opaque_fragment>');
  };mat.customProgramCacheKey=()=> 'luna-fit-v3-'+hi3d;mat.needsUpdate=true;
 }
 u.lunaSkin.value.set(a.skin_tone);u.lunaHair.value.set(a.hair_color);u.lunaSkinOn.value=a.skin_tint_enabled?1:0;u.lunaHairOn.value=a.hair_tint_enabled?1:0;
 u.lunaInk.value.set(a.facial_hair_color);u.lunaTattooInk.value.set(a.tattoo_color);
 u.lunaMoustache.value=hi3d?({fine:1,trimmed:2}[a.facial_hair]||0):0;
 u.lunaComplexion.value={freckles:1,rosy:2}[a.complexion]||0;
 u.lunaTattoo.value={bands:1,botanical:2}[a.tattoo_style]||0;u.lunaSide.value=a.tattoo_placement==='right'?-1:1;u.lunaOpacity.value=a.tattoo_opacity;
 u.lunaStyle.value.fromArray(styleParams[a.style_preset]||styleParams.heroic_fantasy);u.lunaStyleTint.value.set(a.style_preset==='watercolor'?'#fff0d8':a.style_preset==='neon'?'#c4ddff':'#ffffff');
}
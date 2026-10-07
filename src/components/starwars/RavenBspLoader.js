import * as THREE from 'three';

// Jedi Outcast SP/MP BSP reader.
// Released source reference: code/qcommon/qfiles.h in grayj/Jedi-Outcast.
// Supports Raven RBSP v1, planar surfaces, triangle soup, and quadratic patches.

const LUMP = Object.freeze({
  ENTITIES:0, SHADERS:1, PLANES:2, NODES:3, LEAFS:4, LEAFSURFACES:5,
  LEAFBRUSHES:6, MODELS:7, BRUSHES:8, BRUSHSIDES:9, DRAWVERTS:10,
  DRAWINDEXES:11, FOGS:12, SURFACES:13, LIGHTMAPS:14, LIGHTGRID:15,
  VISIBILITY:16, LIGHTARRAY:17,
});

const HEADER_LUMPS=18;
const HEADER_SIZE=8+HEADER_LUMPS*8;
const SHADER_SIZE=72;
const DRAWVERT_SIZE=80;
const SURFACE_SIZE=148;
const MST_PLANAR=1, MST_PATCH=2, MST_TRIANGLE_SOUP=3;
const SURF_NODRAW=0x00200000;

const td=new TextDecoder('latin1');
const readCString=(u8,start,len)=>{
  const end=start+len; let stop=start;
  while(stop<end&&u8[stop]!==0)stop++;
  return td.decode(u8.subarray(start,stop));
};

function vecFromJK(x,y,z,scale){
  // JK2 is Z-up. Three.js is Y-up.
  return [x*scale,z*scale,-y*scale];
}
function nrmFromJK(x,y,z){ return [x,z,-y]; }
const clamp01=v=>Math.max(0,Math.min(1,v));

function parseEntities(text){
  const entities=[];
  const blockRe=/\{([\s\S]*?)\}/g; let block;
  while((block=blockRe.exec(text))){
    const obj={};
    const kv=/"([^"]*)"\s+"([^"]*)"/g; let m;
    while((m=kv.exec(block[1])))obj[m[1]]=m[2];
    if(Object.keys(obj).length)entities.push(obj);
  }
  return entities;
}

function bez2(a,b,c,t){
  const s=1-t;return s*s*a+2*s*t*b+t*t*c;
}
function evalPatch(control,u,v,key,size){
  const rows=[];
  for(let y=0;y<3;y++){
    const a=control[y*3+0][key], b=control[y*3+1][key], c=control[y*3+2][key];
    const row=new Array(size);
    for(let k=0;k<size;k++)row[k]=bez2(a[k],b[k],c[k],u);
    rows.push(row);
  }
  const out=new Array(size);
  for(let k=0;k<size;k++)out[k]=bez2(rows[0][k],rows[1][k],rows[2][k],v);
  return out;
}

function makeBucket(){
  return {positions:[],normals:[],uvs:[],colors:[],indices:[],surfaceCount:0};
}
function pushVertex(bucket,v){
  const idx=bucket.positions.length/3;
  bucket.positions.push(...v.position);
  bucket.normals.push(...v.normal);
  bucket.uvs.push(...v.uv);
  bucket.colors.push(...v.color);
  return idx;
}
function safeColor(bytes){
  // Raven vertex lighting can exceed what a neutral preview wants. Normalize to 0..1.
  return [clamp01(bytes[0]/255),clamp01(bytes[1]/255),clamp01(bytes[2]/255)];
}

export function parseRavenBsp(arrayBuffer,{scale=0.0254,patchSubdivisions=5}={}){
  const view=new DataView(arrayBuffer), u8=new Uint8Array(arrayBuffer);
  if(arrayBuffer.byteLength<HEADER_SIZE)throw new Error('BSP file is too small.');
  const ident=readCString(u8,0,4),version=view.getInt32(4,true);
  if(ident!=='RBSP'||version!==1)throw new Error(`Unsupported BSP: expected RBSP v1, got ${ident||'????'} v${version}`);

  const lumps=[];
  for(let i=0;i<HEADER_LUMPS;i++){
    const off=8+i*8;
    const fileofs=view.getInt32(off,true),filelen=view.getInt32(off+4,true);
    if(fileofs<0||filelen<0||fileofs+filelen>arrayBuffer.byteLength)throw new Error(`Invalid BSP lump ${i}`);
    lumps.push({fileofs,filelen});
  }

  const entityLump=lumps[LUMP.ENTITIES];
  const entityText=td.decode(u8.subarray(entityLump.fileofs,entityLump.fileofs+entityLump.filelen)).replace(/\0+$/,'');
  const entities=parseEntities(entityText);

  const shaderLump=lumps[LUMP.SHADERS], shaderCount=Math.floor(shaderLump.filelen/SHADER_SIZE), shaders=[];
  for(let i=0;i<shaderCount;i++){
    const o=shaderLump.fileofs+i*SHADER_SIZE;
    shaders.push({
      name:readCString(u8,o,64),
      surfaceFlags:view.getInt32(o+64,true)>>>0,
      contentFlags:view.getInt32(o+68,true)>>>0,
    });
  }

  const vertLump=lumps[LUMP.DRAWVERTS], vertCount=Math.floor(vertLump.filelen/DRAWVERT_SIZE), verts=new Array(vertCount);
  for(let i=0;i<vertCount;i++){
    const o=vertLump.fileofs+i*DRAWVERT_SIZE;
    const p=vecFromJK(view.getFloat32(o,true),view.getFloat32(o+4,true),view.getFloat32(o+8,true),scale);
    const n=nrmFromJK(view.getFloat32(o+52,true),view.getFloat32(o+56,true),view.getFloat32(o+60,true));
    const nn=new THREE.Vector3(...n); if(nn.lengthSq()>1e-8)nn.normalize();
    verts[i]={
      position:p,
      uv:[view.getFloat32(o+12,true),1-view.getFloat32(o+16,true)],
      normal:[nn.x,nn.y,nn.z],
      color:safeColor([u8[o+64],u8[o+65],u8[o+66]]),
    };
  }

  const indexLump=lumps[LUMP.DRAWINDEXES], indexCount=Math.floor(indexLump.filelen/4), drawIndexes=new Int32Array(indexCount);
  for(let i=0;i<indexCount;i++)drawIndexes[i]=view.getInt32(indexLump.fileofs+i*4,true);

  const surfLump=lumps[LUMP.SURFACES], surfaceCount=Math.floor(surfLump.filelen/SURFACE_SIZE);
  const buckets=new Map();
  const bucketFor=(shaderNum)=>{
    const key=Number.isInteger(shaderNum)&&shaderNum>=0&&shaderNum<shaders.length?shaderNum:-1;
    if(!buckets.has(key))buckets.set(key,makeBucket());
    return buckets.get(key);
  };
  let skippedNoDraw=0, skippedUnsupported=0, renderedSurfaces=0;

  for(let i=0;i<surfaceCount;i++){
    const o=surfLump.fileofs+i*SURFACE_SIZE;
    const shaderNum=view.getInt32(o,true),surfaceType=view.getInt32(o+8,true);
    const firstVert=view.getInt32(o+12,true),numVerts=view.getInt32(o+16,true);
    const firstIndex=view.getInt32(o+20,true),numIndexes=view.getInt32(o+24,true);
    const patchWidth=view.getInt32(o+140,true),patchHeight=view.getInt32(o+144,true);
    const shader=shaders[shaderNum];
    if(shader&&(shader.surfaceFlags&SURF_NODRAW)){skippedNoDraw++;continue;}
    const bucket=bucketFor(shaderNum);

    if(surfaceType===MST_PLANAR||surfaceType===MST_TRIANGLE_SOUP){
      if(firstVert<0||numVerts<=0||firstVert+numVerts>verts.length){skippedUnsupported++;continue;}
      const remap=new Array(numVerts);
      for(let v=0;v<numVerts;v++)remap[v]=pushVertex(bucket,verts[firstVert+v]);
      let emitted=0;
      for(let k=0;k+2<numIndexes;k+=3){
        const ia=drawIndexes[firstIndex+k],ib=drawIndexes[firstIndex+k+1],ic=drawIndexes[firstIndex+k+2];
        if(ia<0||ib<0||ic<0||ia>=numVerts||ib>=numVerts||ic>=numVerts)continue;
        // Axis conversion changes handedness; swap winding.
        bucket.indices.push(remap[ia],remap[ic],remap[ib]); emitted+=3;
      }
      if(emitted){bucket.surfaceCount++;renderedSurfaces++;}
      continue;
    }

    if(surfaceType===MST_PATCH){
      if(patchWidth<3||patchHeight<3||firstVert<0||firstVert+numVerts>verts.length){skippedUnsupported++;continue;}
      let patchRendered=false;
      for(let py=0;py<=patchHeight-3;py+=2){
        for(let px=0;px<=patchWidth-3;px+=2){
          const cp=[];
          for(let y=0;y<3;y++)for(let x=0;x<3;x++)cp.push(verts[firstVert+(py+y)*patchWidth+(px+x)]);
          const base=[];
          for(let y=0;y<=patchSubdivisions;y++){
            const row=[];
            const v=y/patchSubdivisions;
            for(let x=0;x<=patchSubdivisions;x++){
              const u=x/patchSubdivisions;
              const position=evalPatch(cp,u,v,'position',3);
              const normal=evalPatch(cp,u,v,'normal',3);const n=new THREE.Vector3(...normal);if(n.lengthSq()>1e-8)n.normalize();
              const uv=evalPatch(cp,u,v,'uv',2);
              const color=evalPatch(cp,u,v,'color',3).map(clamp01);
              row.push(pushVertex(bucket,{position,normal:[n.x,n.y,n.z],uv,color}));
            }
            base.push(row);
          }
          for(let y=0;y<patchSubdivisions;y++)for(let x=0;x<patchSubdivisions;x++){
            const a=base[y][x],b=base[y][x+1],c=base[y+1][x],d=base[y+1][x+1];
            bucket.indices.push(a,c,b,b,c,d);
          }
          patchRendered=true;
        }
      }
      if(patchRendered){bucket.surfaceCount++;renderedSurfaces++;}
      continue;
    }
    skippedUnsupported++;
  }

  return {
    ident,version,lumps,shaders,entities,buckets,
    stats:{shaderCount,vertCount,indexCount,surfaceCount,renderedSurfaces,skippedNoDraw,skippedUnsupported},
  };
}

export function buildRavenBspGroup(parsed,{wireframe=false,materialFactory=null}={}){
  const group=new THREE.Group();group.name='RavenRBSP';
  const materials=new Map();
  for(const [shaderNum,bucket] of parsed.buckets){
    if(!bucket.indices.length)continue;
    const shader=shaderNum>=0?parsed.shaders[shaderNum]:{name:'__unknown__',surfaceFlags:0,contentFlags:0};
    const geometry=new THREE.BufferGeometry();
    geometry.setAttribute('position',new THREE.Float32BufferAttribute(bucket.positions,3));
    geometry.setAttribute('normal',new THREE.Float32BufferAttribute(bucket.normals,3));
    geometry.setAttribute('uv',new THREE.Float32BufferAttribute(bucket.uvs,2));
    geometry.setAttribute('color',new THREE.Float32BufferAttribute(bucket.colors,3));
    geometry.setIndex(bucket.indices);
    geometry.computeBoundingSphere();
    let material=materials.get(shaderNum);
    if(!material){
      material=materialFactory?.(shader)||new THREE.MeshStandardMaterial({
        color:0xffffff,vertexColors:true,roughness:.8,metalness:.05,side:THREE.DoubleSide,wireframe,
      });
      materials.set(shaderNum,material);
    }
    const mesh=new THREE.Mesh(geometry,material);
    mesh.name=shader.name||`shader_${shaderNum}`;
    mesh.userData={shaderNum,shaderName:shader.name,surfaceFlags:shader.surfaceFlags,contentFlags:shader.contentFlags,surfaceCount:bucket.surfaceCount};
    mesh.castShadow=false;mesh.receiveShadow=true;group.add(mesh);
  }
  const box=new THREE.Box3().setFromObject(group),center=new THREE.Vector3(),size=new THREE.Vector3();
  if(!box.isEmpty()){box.getCenter(center);box.getSize(size);}
  group.userData={...parsed.stats,entityCount:parsed.entities.length,bounds:{center:center.toArray(),size:size.toArray()}};
  return group;
}

export async function loadRavenBspFromUrl(url,options){
  const res=await fetch(url,{cache:'no-store'});
  if(!res.ok)throw new Error(`BSP request failed: HTTP ${res.status}`);
  const parsed=parseRavenBsp(await res.arrayBuffer(),options);
  return {parsed,group:buildRavenBspGroup(parsed,options)};
}

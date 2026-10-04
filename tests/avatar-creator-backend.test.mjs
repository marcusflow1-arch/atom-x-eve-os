import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {buildSync} from 'esbuild';

function fixture() {
 const avatars=[{id:'owned-avatar',user_id:'player',gender:'female',name:'Artemis',level:12}];
 const assets=[{id:'hair-m',name:'Short hair',gender:'male',slot:'hair',rig_id:'getsuga-v1',binding:'skinned',file_url:'/models/hair.glb',published:true}];
 const entity=rows=>({filter:async query=>rows.filter(r=>Object.entries(query).every(([k,v])=>r[k]===v)),update:async(id,patch)=>{const row=rows.find(r=>r.id===id);Object.assign(row,patch);return row;},create:async row=>{const value={...row,id:'created-'+rows.length};rows.push(value);return value;}});
 const entities={Avatar:entity(avatars),AvatarCustomizationAsset:entity(assets)};
 const sdk={createClientFromRequest:req=>({auth:{me:async()=>req.headers.get('actor')==='none'?null:{id:'player',role:req.headers.get('role')||'user'}},entities,asServiceRole:{entities}})};
 const compile=file=>{
  const module={exports:{}};
  vm.runInNewContext(buildSync({entryPoints:[file],bundle:true,write:false,format:'cjs',platform:'node',external:['npm:*']}).outputFiles[0].text,{module,exports:module.exports,Response,Request,console:{error(){},warn(){}},require:id=>{assert(id.startsWith('npm:@base44/sdk'));return sdk;}});
  return module.exports.default;
 };
 return {avatars,assets,avatar:compile('base44/functions/avatarSystem/entry.ts'),catalog:compile('base44/functions/avatarCustomizationCatalog/entry.ts')};
}
const request=(body,headers={})=>new Request('https://test.local',{method:'POST',headers,body:JSON.stringify(body)});
test('saveAppearance can switch female to male, persists approved layers and cannot write progression',async()=>{
 const f=fixture();const response=await f.avatar(request({action:'saveAppearance',appearance:{gender:'male',name:'Nova',level:999,user_id:'victim',selected_assets:{hair:'hair-m'},shape_controls:{chest_size:.2},skin_finish:.7}}));
 assert.equal(response.status,200);const {avatar}=await response.json();assert.equal(avatar.gender,'male');assert.equal(avatar.name,'Nova');assert.equal(avatar.user_id,'player');assert.equal(avatar.level,12);
 assert.equal(avatar.shape_controls.chest_size,.2);assert.equal(avatar.skin_finish,.7);assert.equal(avatar.customization_assets[0].file_url,'/models/hair.glb');
 const reload=await (await f.avatar(request({action:'loadAvatar'}))).json();assert.equal(reload.success,true);assert.equal(reload.avatar.gender,'male');
});
test('catalog writes require admin; ordinary users see published options only',async()=>{
 const f=fixture();f.assets.push({id:'private',published:false});
 assert.equal((await f.catalog(request({action:'list'},{actor:'none'}))).status,401);
 const list=await (await f.catalog(request({action:'list'}))).json();assert.equal(list.assets.length,1);assert.equal(list.canManage,false);
 const denied=await f.catalog(request({action:'save',asset:f.assets[0]}));assert.equal(denied.status,403);assert.equal(f.assets.length,2);
 const saved=await f.catalog(request({action:'save',asset:{...f.assets[0],name:'Another preset'}},{role:'admin'}));assert.equal(saved.status,200);assert.equal(f.assets.length,3);
});

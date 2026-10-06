import {createClientFromRequest} from 'npm:@base44/sdk@0.8.23';
import {buildStudioDirectory,validateStudioPost} from '../../shared/studioHub.ts';
type Row = Record<string,any>;
async function readCatalog(entity:any,sort:string){
 const all:Row[]=[],seen=new Set<string>();let offset=0;
 while(offset<10000){const response=await entity.list(sort,200,offset),rows=response?.data||response;if(!Array.isArray(rows))throw new Error('Studio catalog is unavailable');const before=seen.size;for(const row of rows)if(row.id&&!seen.has(row.id)){seen.add(row.id);all.push(row);}if(rows.length<200||before===seen.size)break;offset+=rows.length;}
 return all;
}
Deno.serve(async req=>{
 try{
  const api=createClientFromRequest(req),user=await api.auth.me().catch(()=>null),svc=api.asServiceRole.entities;
  const body=await req.json(),action=body.action||'directory',data=body.data||{};
  if(action==='feed'){
   const offset=Number(data.offset||0);if(!Number.isSafeInteger(offset)||offset<0||offset>10000)return Response.json({error:'Invalid page'},{status:400});
   const query:Row={status:'published'};
   if(data.studio_key)query.studio_key=String(data.studio_key);
   if(data.category&&data.category!=='all'){if(!['development','announcement','release','behind_scenes'].includes(data.category))throw new Error('Invalid category');query.category=data.category;}
   const posts=await svc.StudioUpdate.filter(query,'-published_at',13,offset);
   return Response.json({success:true,posts:posts.slice(0,12).map((p:Row)=>({id:p.id,studio_key:p.studio_key,studio_name:p.studio_name,title:p.title,body:p.body,category:p.category,game_id:p.game_id,project_title:p.project_title,image_url:p.image_url,published_at:p.published_at})),has_more:posts.length>12,next_offset:offset+Math.min(12,posts.length)});
  }
  const [profiles,games]=await Promise.all([readCatalog(svc.StudioProfile,'-updated_date'),readCatalog(svc.Game,'title')]);
  const studios=buildStudioDirectory(profiles,games);
  const memberships=user?await svc.StudioMember.filter({user_id:user.id,active:true},'studio_key',500):[];
  const canEdit=(key:string)=>Boolean(user&&(user.role==='admin'||memberships.some((m:Row)=>m.studio_key===key&&['owner','editor'].includes(m.role))));
  if(action==='directory')return Response.json({success:true,studios,editable_studios:studios.filter(s=>canEdit(s.key)).map(s=>s.key)});
  if(!user)return Response.json({error:'Sign in to publish studio updates.'},{status:401});
  const studio=studios.find(s=>s.key===data.studio_key);
  if(!studio||!canEdit(studio.key))return Response.json({error:'Only this studio’s authorized editors can publish updates.'},{status:403});
  if(action==='savePost'){
   const fields=validateStudioPost(data,studio);
   let previous=null;
   if(data.id){previous=await svc.StudioUpdate.get(String(data.id)).catch(()=>null);if(!previous||previous.studio_key!==studio.key)return Response.json({error:'Update not found for this studio.'},{status:404});}
   const patch={...fields,author_user_id:previous?.author_user_id||user.id,published_at:fields.status==='published'?(previous?.published_at||new Date().toISOString()):''};
   const post=previous?await svc.StudioUpdate.update(previous.id,patch):await svc.StudioUpdate.create(patch);
   return Response.json({success:true,post});
  }
  return Response.json({error:'Unknown action'},{status:400});
 }catch(error){return Response.json({error:error?.message||'Studio request failed'},{status:400});}
});

import {createClientFromRequest} from 'npm:@base44/sdk@0.8.51';
import {normalizeCustomizationAsset} from '../../shared/avatarCustomization.ts';
export default async function(req) {
 try {
  const client=createClientFromRequest(req),user=await client.auth.me();
  if(!user)return Response.json({error:'Sign in to open character creation.'},{status:401});
  const body=await req.json(),service=client.asServiceRole.entities;
  if(body.action==='list') {
   const rows=await service.AvatarCustomizationAsset.filter(user.role==='admin'?{}:{published:true},'name',500);
   return Response.json({success:true,assets:rows,canManage:user.role==='admin'});
  }
  if(user.role!=='admin')return Response.json({error:'Admin access required.'},{status:403});
  if(body.action==='save') {
   const values=normalizeCustomizationAsset(body.asset);
   if(body.id) {
    const rows=await service.AvatarCustomizationAsset.filter({id:String(body.id)},'created_date',1);
    if(!rows[0])return Response.json({error:'Asset not found.'},{status:404});
   }
   const asset=body.id?await service.AvatarCustomizationAsset.update(body.id,values):await service.AvatarCustomizationAsset.create(values);
   return Response.json({success:true,asset});
  }
  return Response.json({error:'Unknown catalog action.'},{status:400});
 }catch(error){return Response.json({success:false,error:error.message||'The catalog could not be updated.'},{status:400});}
}

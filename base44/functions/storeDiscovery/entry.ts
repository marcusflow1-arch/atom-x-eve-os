import {createClientFromRequest} from 'npm:@base44/sdk@0.8.23';
Deno.serve(async req=>{
 try{
  const client=createClientFromRequest(req),svc=client.asServiceRole.entities;
  const {action='context',data={}}=await req.json();
  const user=await client.auth.me().catch(()=>null);
  if(action==='sales'){
   // Aggregate completed orders only; no buyer, address, or transaction details leave this function.
   const counts=new Map<string,number>(),since=Date.now()-30*86400000;
   let offset=0,complete=false;
   while(offset<10000){
    const rows=await svc.Order.filter({status:'completed'},'-created_date',500,offset);
    for(const order of rows){
     if(Date.parse(order.created_date)<since){complete=true;break;}
     for(const item of order.items||[]){
      const id=item.type==='game'?(item.id||item.game_id):!item.type&&item.game_id?item.game_id:null;
      if(id)counts.set(id,(counts.get(id)||0)+Math.max(1,Number(item.quantity)||1));
     }
    }
    offset+=rows.length;
    if(complete||rows.length<500){complete=true;break;}
   }
   return Response.json({sales:Object.fromEntries(counts),window_days:30,complete});
  }
  if(!user)return Response.json({error:'Sign in to save your store preferences.'},{status:401});
  const rows=await svc.StorePreference.filter({user_id:user.id},'-updated_date',1);
  if(action==='save'){
   const genres=[...new Set((Array.isArray(data.genres)?data.genres:[]).filter(g=>typeof g==='string').map(g=>g.slice(0,60)))].slice(0,40);
   const ids=[...new Set((Array.isArray(data.played_game_ids)?data.played_game_ids:[]).filter(g=>typeof g==='string'))].slice(0,100);
   const preference={user_id:user.id,genres,played_game_ids:ids,use_play_history:data.use_play_history!==false};
   if(rows[0])await svc.StorePreference.update(rows[0].id,preference);else await svc.StorePreference.create(preference);
   return Response.json({preference});
  }
  if(action==='record_play'){
   const game=await svc.Game.get(String(data.game_id||''));
   if(!game)return Response.json({error:'Game not found'},{status:404});
   const history=await svc.StorePlayHistory.filter({user_id:user.id,game_id:game.id},'-last_played',1);
   const entry={user_id:user.id,game_id:game.id,last_played:new Date().toISOString()};
   if(history[0])await svc.StorePlayHistory.update(history[0].id,entry);else await svc.StorePlayHistory.create(entry);
   return Response.json({success:true});
  }
  if(action!=='context')return Response.json({error:'Unknown store action'},{status:400});
  const history=await svc.StorePlayHistory.filter({user_id:user.id},'-last_played',100);
  return Response.json({preference:rows[0]||{genres:[],played_game_ids:[],use_play_history:true},played_game_ids:history.map(h=>h.game_id),owned_game_ids:user.purchased_items||[]});
 }catch(error){return Response.json({error:error.message||'Store preferences unavailable.'},{status:500});}
});


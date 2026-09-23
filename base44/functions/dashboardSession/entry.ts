import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const TTL = 60000;
const MAX_PLAYERS = 5;
const MODEL = '/getsuga/Getsuga_Character.glb';
const FEMALE_MODEL = 'https://base44.app/api/apps/6876751a602125f45f1861b9/files/mp/public/6876751a602125f45f1861b9/9c8e45258_Hi3D_Cel-ShadedGreekMythicArcherArtemis3DModel_allparts_20260915_100610.glb';
const APPEARANCE = ['name','gender','female_model_variant','model_url','base_body_gender','base_body_model_url','appearance_version','style_preset','skin_tone','eye_color','hair_color','skin_tint_enabled','eye_tint_enabled','hair_tint_enabled','complexion','facial_hair','facial_hair_color','tattoo_style','tattoo_placement','tattoo_color','tattoo_opacity','hair_style','hair_length','hair_volume','face_shape','height_scale','body_proportions','material_colors','morph_targets','eyelash_style','hood_enabled','weapon_visible'];
const live = (p: any) => p.status !== 'offline' && Number(p.last_update) > Date.now() - TTL;
const publicPlayer = (p: any) => Object.fromEntries(['player_id','display_name','avatar_url','model_url','appearance','channel_id','last_update','dashboard_joined_at','x','y','z','yaw','anim','status'].map(k => [k,p[k]]));
const latest = (rows: any[]) => [...rows].sort((a,b) => Number(b.last_update)-Number(a.last_update));

Deno.serve(async req => {
  try {
    const client = createClientFromRequest(req);
    const user = await client.auth.me();
    if (!user) return Response.json({error:'Sign in to join a dashboard.'},{status:401});
    const {action='heartbeat',data={}} = await req.json();
    const svc = client.asServiceRole.entities;
    const ownRows = latest(await svc.PlayerState.filter({player_id:user.id}));
    const own = ownRows[0];
    if (action === 'leave') {
      // A late cleanup from the old room must not remove a newer membership.
      if (own?.channel_id === data.channel_id) await svc.PlayerState.update(own.id,{status:'offline',last_update:0});
      return Response.json({success:true});
    }
    const hostId = String(data.host_id || user.id);
    const channel = 'dashboard_' + hostId;
    const hostRows = hostId === user.id ? [] : await svc.PlayerState.filter({player_id:hostId,channel_id:channel});
    const host = latest(hostRows).find(live);
    // Join is intentionally non-blocking. The client switches channels first and
    // heartbeat becomes the authority for whether the host is currently live.
    // This keeps a stale presence row from making the Join Dashboard button dead.
    if (action === 'join') return Response.json({
      success:true,
      host_id:hostId,
      host_name:host?.display_name || String(data.host_name || '') || 'Friend',
      channel_id:channel,
      env_url:host?.env_url || '',
      online:!!host,
    });
    if (action !== 'heartbeat') return Response.json({error:'Unknown dashboard action.'},{status:400});
    if (hostId !== user.id && !host) return Response.json({error:'Waiting for this player to open their dashboard.'},{status:409});
    const room = latest(await svc.PlayerState.filter({channel_id:channel}));
    const byId = new Map();
    for (const p of room) if (live(p) && !byId.has(p.player_id)) byId.set(p.player_id,p);
    if (!byId.has(user.id) && byId.size >= MAX_PLAYERS) return Response.json({error:'This dashboard is full (five players).'}, {status:409});
    const avatarRows = await svc.Avatar.filter({user_id:user.id},'-updated_date',1);
    const avatar = avatarRows[0] || {};
    const appearance = Object.fromEntries(APPEARANCE.filter(k => avatar[k] !== undefined).map(k => [k,avatar[k]]));
    if (Number(avatar.appearance_version) < 3) {
      const legacyGender = avatar.gender === 'female' ? 'female' : 'male';
      Object.assign(appearance, legacyGender === 'female'
        ? {gender:'female',female_model_variant:'artemis_archer',model_url:FEMALE_MODEL,base_body_gender:'female',base_body_model_url:FEMALE_MODEL}
        : {gender:'male',female_model_variant:'',model_url:MODEL,base_body_gender:'male',base_body_model_url:MODEL});
    }
    const row = {
      player_id:user.id,display_name:user.full_name || user.username || 'Player',
      avatar_url:user.avatar_url || user.profile_image || '',
      model_url:appearance.model_url || MODEL, appearance, channel_id:channel,
      dashboard_joined_at:own?.channel_id === channel && live(own) ? (own.dashboard_joined_at || Date.now()) : Date.now(),
      last_update:Date.now(),status:'online',anim:'idle',x:0,y:-0.5,z:0,yaw:0,
      env_url:hostId === user.id ? String(data.env_url || '') : host?.env_url || '',
    };
    const saved = own ? await svc.PlayerState.update(own.id,row) : await svc.PlayerState.create(row);
    // Remove old duplicate presence rows belonging to this user only.
    for (const duplicate of ownRows.slice(1)) await svc.PlayerState.update(duplicate.id,{status:'offline',last_update:0});
    const after = latest(await svc.PlayerState.filter({channel_id:channel}));
    const unique = new Map();
    for (const p of after) if (live(p) && !unique.has(p.player_id)) unique.set(p.player_id,p);
    const players = [...unique.values()].sort((a,b) => {
      if (a.player_id === hostId) return -1;
      if (b.player_id === hostId) return 1;
      return Number(a.dashboard_joined_at)-Number(b.dashboard_joined_at) || String(a.player_id).localeCompare(String(b.player_id));
    }).slice(0,MAX_PLAYERS);
    if (!players.some(p => p.player_id === user.id)) {
      await svc.PlayerState.update(saved.id,{status:'offline',last_update:0});
      return Response.json({error:'This dashboard just filled up.'},{status:409});
    }
    return Response.json({success:true,channel_id:channel,host_id:hostId,
      host_name:host?.display_name || row.display_name,env_url:host?.env_url || row.env_url,
      players:players.map((p,index) => publicPlayer({...p,x:-0.9*index,anim:'idle'}))});
  } catch (error) {
    console.error('[dashboardSession]',error);
    return Response.json({error:error.message || 'Dashboard connection failed.'},{status:500});
  }
});

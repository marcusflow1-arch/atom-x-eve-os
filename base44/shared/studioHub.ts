type Row = Record<string, any>;
export const studioKey = (value: unknown) => String(value || '').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\b(incorporated|inc|ltd|limited|llc)\b/g,'').replace(/[^\p{L}\p{N}]+/gu,'-').replace(/^-|-$/g,'');
const titleKey = (value: unknown) => String(value || '').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^\p{L}\p{N}]+/gu,'');
export const safeStudioUrl = (value: unknown) => { const url=String(value||'').trim(); return /^https?:\/\//i.test(url) ? url : ''; };
const future = (game: Row) => ['planned','in_development','coming_soon'].includes(String(game.status||'')) || Date.parse(game.release_date)>Date.now();
export function buildStudioDirectory(profiles: Row[], games: Row[]) {
 const studios=new Map<string,Row>(),titleOwners=new Map<string,Set<string>>();
 const add=(name:string)=>{const key=studioKey(name);if(!key||['unknown','unknown-studio','tba','n-a'].includes(key))return null;if(!studios.has(key))studios.set(key,{key,name,tagline:'',description:'',logo:'',cover:'',website:'',location:'',games:[],projects:[],notable:[],genres:[],profile_ids:[]});return studios.get(key);};
 for(const profile of profiles){
  const studio=add(profile.developer_name);if(!studio)continue;
  studio.profile_ids.push(profile.id);
  for(const [key,value] of Object.entries({tagline:profile.tagline,description:profile.description,logo:safeStudioUrl(profile.logo_url),website:safeStudioUrl(profile.website),location:profile.headquarters,founded:profile.founded_year}))if(!studio[key]&&value)studio[key]=value;
  const titles=[profile.game_key,...(profile.notable_games||[]).map((g:Row)=>g.title)];
  for(const title of titles){const key=titleKey(title);if(key){if(!titleOwners.has(key))titleOwners.set(key,new Set());titleOwners.get(key)!.add(studio.key);}}
  for(const game of profile.notable_games||[])if(game.title&&!studio.notable.some((item:Row)=>titleKey(item.title)===titleKey(game.title)))studio.notable.push({title:game.title,year:game.year,genre:game.genre||''});
  for(const project of profile.upcoming_projects||[]){
   if(!project.title||studio.projects.some((item:Row)=>titleKey(item.title)===titleKey(project.title)))continue;
   studio.projects.push({key:studio.key+':'+titleKey(project.title),title:project.title,description:project.description||'',status:project.status||'In development',genre:project.genre||'',image:safeStudioUrl(project.image_url||project.cover_image),release_window:project.release_window||'',game_id:''});
  }
 }
 for(const game of games){
  const direct=typeof (game.developer||game.studio)==='string'?(game.developer||game.studio):'';
  const owner=direct?add(direct):null;
  const keys=owner?[owner.key]:[...(titleOwners.get(titleKey(game.title))||[])];
  for(const key of keys){
   const studio=studios.get(key);if(!studio)continue;
   if(!studio.games.some((g:Row)=>titleKey(g.title)===titleKey(game.title)))studio.games.push({id:game.id,title:game.title,genre:game.genre,cover_image:game.cover_image,banner_image:game.banner_image,description:game.description,release_date:game.release_date,original_year:game.original_year,status:game.status,price:game.price,sale_price:game.sale_price});
   if(!studio.cover)studio.cover=game.banner_image||game.cover_image||'';
   const project=studio.projects.find((item:Row)=>titleKey(item.title)===titleKey(game.title));
   if(project){project.game_id=game.id;if(!project.image)project.image=game.banner_image||game.cover_image||'';if(!project.genre)project.genre=game.genre||'';}
   else if(future(game))studio.projects.push({key:key+':'+titleKey(game.title),title:game.title,description:game.description||'',status:game.status,genre:game.genre||'',image:game.banner_image||game.cover_image||'',release_window:game.release_date||'',game_id:game.id});
  }
 }
 return [...studios.values()].map(studio=>({...studio,genres:[...new Set([...studio.games,...studio.projects].map((g:Row)=>g.genre).filter(Boolean))],games:studio.games.sort((a:Row,b:Row)=>a.title.localeCompare(b.title)),projects:studio.projects.sort((a:Row,b:Row)=>a.title.localeCompare(b.title))})).sort((a,b)=>a.name.localeCompare(b.name));
}
export function validateStudioPost(input: Row, studio: Row) {
 const text=(value:unknown,max:number)=>String(value||'').trim().slice(0,max);
 const title=text(input.title,140),body=text(input.body,6000);
 if(title.length<3||body.length<10)throw new Error('Add a title of at least 3 characters and an update of at least 10 characters.');
 const categories=['development','announcement','release','behind_scenes'];
 if(!categories.includes(input.category))throw new Error('Choose an update category.');
 const gameId=text(input.game_id,100);
 if(gameId&&!studio.games.some((g:Row)=>g.id===gameId))throw new Error('Choose a game belonging to this studio.');
 const image=safeStudioUrl(input.image_url);
 if(input.image_url&&!image)throw new Error('Use an HTTP or HTTPS image URL.');
 return {studio_key:studio.key,studio_name:studio.name,title,body,category:input.category,game_id:gameId,project_title:text(input.project_title,160),image_url:image,status:input.status==='draft'?'draft':'published'};
}

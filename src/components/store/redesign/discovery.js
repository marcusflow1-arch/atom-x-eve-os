export const normalize=value=>String(value??'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[_-]+/g,' ').trim();
const list=v=>Array.isArray(v)?v:typeof v==='string'?[v]:[];
export const label=v=>String(v||'').replace(/[_-]/g,' ').replace(/\b\w/g,c=>c.toUpperCase()).replace(/\bRpg\b/g,'RPG').replace(/\bMmo\b/g,'MMO');
export const genresOf=g=>[...new Set([g.genre,...list(g.genres)].filter(Boolean).map(normalize))];
export const tagsOf=g=>[...genresOf(g),...list(g.tags),...list(g.game_modes||g.modes)].map(normalize);
export function priceOf(g){
 if(g.free_to_play===true||g.isFree===true)return 0;
 const number=v=>v!==null&&v!==undefined&&v!==''&&Number.isFinite(Number(v))&&Number(v)>=0?Number(v):null;
 const regular=number(g.price),sale=number(g.sale_price);
 return sale!==null&&regular!==null&&sale<regular?sale:regular;
}
export const priceLabel=g=>priceOf(g)===null?'Price to be announced':priceOf(g)===0?'Free to play':new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(priceOf(g));
export const releaseTime=g=>g.release_date?Date.parse(g.release_date):g.release_year?Date.UTC(Number(g.release_year),0,1):0;
export const comingSoon=(g,now=Date.now())=>['planned','in development','coming soon'].includes(normalize(g.status))||releaseTime(g)>now;
export function queryScore(g,query){
 const q=normalize(query);if(!q)return 1;
 const title=normalize(g.title),text=[title,...tagsOf(g),normalize(g.developer||g.studio),normalize(g.description)].join(' ');
 if(!q.split(/\s+/).every(token=>text.includes(token)))return 0;
 return title===q?100:title.startsWith(q)?60:title.includes(q)?40:10;
}
export function filterGames(games,{query='',genres=[],price='any',mode='',availability='all',hideOwned=false}={},owned=[]){
 return games.filter(g=>{
  if(!queryScore(g,query))return false;
  if(genres.length&&!genres.some(x=>genresOf(g).includes(normalize(x))))return false;
  const amount=priceOf(g);
  if(price==='free'&&amount!==0)return false;
  if(price!=='free'&&price!=='any'&&(amount===null||amount>Number(price)))return false;
  const tags=tagsOf(g),target=normalize(mode);
  if(target&&!tags.includes(target)&&!(target==='single player'&&g.single_player)&&!(target==='co op'&&(g.co_op||g.coop))&&!(target==='multiplayer'&&g.multiplayer))return false;
  if(availability==='available'&&comingSoon(g))return false;
  if(availability==='soon'&&!comingSoon(g))return false;
  return !(hideOwned&&owned.includes(g.id));
 });
}
const hash=value=>{let h=2166136261;for(const c of value)h=Math.imul(h^c.charCodeAt(0),16777619);return h>>>0;};
export function discoveryOrder(games,seed){
 const buckets=new Map();
 for(const g of [...games].sort((a,b)=>hash(seed+String(a.id))-hash(seed+String(b.id)))){
  const key=genresOf(g)[0]||'other';if(!buckets.has(key))buckets.set(key,[]);buckets.get(key).push(g);
 }
 const result=[];while([...buckets.values()].some(b=>b.length))for(const b of buckets.values())if(b.length)result.push(b.shift());
 return result;
}
export function rotateGames(games,offset,count=games.length){
 if(!games.length)return [];
 const start=((offset%games.length)+games.length)%games.length;
 return [...games.slice(start),...games.slice(0,start)].slice(0,count);
}
export function recommendations(games,preference={},playedIds=[]){
 const selected=(preference.genres||[]).map(normalize);
 const history=preference.use_play_history!==false?[...new Set([...(preference.played_game_ids||[]),...playedIds])]:[];
 const enjoyed=games.filter(g=>history.includes(g.id));
 return games.filter(g=>!history.includes(g.id)).map(game=>{
  const explicit=genresOf(game).find(g=>selected.includes(g));
  const similar=enjoyed.find(g=>genresOf(g).some(genre=>genresOf(game).includes(genre)));
  return {game,score:(explicit?3:0)+(similar?2:0),reason:explicit?'Matches your '+label(explicit)+' preference':similar?'Because you played '+similar.title:'Explore something different'};
 }).filter(r=>r.score>0).sort((a,b)=>b.score-a.score);
}
export function suggestions(games,query){
 const q=normalize(query);if(!q)return [];
 const genres=[...new Set(games.flatMap(genresOf))].filter(g=>g.includes(q)).slice(0,3).map(g=>({kind:'genre',id:g,title:label(g)}));
 const titles=games.map(game=>({game,score:queryScore(game,q)})).filter(r=>r.score>0).sort((a,b)=>b.score-a.score).slice(0,5).map(({game})=>({kind:'game',id:game.id,title:game.title,game}));
 return [...genres,...titles];
}

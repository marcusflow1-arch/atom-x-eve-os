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
export const releaseTime=g=>{
 const exact=Date.parse(g.release_date);if(Number.isFinite(exact))return exact;
 const year=Number(g.release_year||g.original_year);return Number.isInteger(year)&&year>=1950&&year<=2200?Date.UTC(year,0,1):0;
};
export const comingSoon=(g,now=Date.now())=>['planned','in development','coming soon'].includes(normalize(g.status))||releaseTime(g)>now;
export function queryScore(g,query){
 const q=normalize(query);if(!q)return 1;
 const title=normalize(g.title),text=[title,...tagsOf(g),normalize(g.developer||g.studio),normalize(g.description)].join(' ');
 if(!q.split(/\s+/).every(token=>text.includes(token)))return 0;
 return title===q?100:title.startsWith(q)?60:title.includes(q)?40:10;
}
export function filterGames(games,{query='',genres=[],price='any',mode='',availability='all',hideOwned=false,onSale=false}={},owned=[]){
 return games.filter(g=>{
  if(!queryScore(g,query))return false;
  if(onSale&&!isOnSale(g))return false;
  if(genres.length&&!genres.some(x=>genresOf(g).includes(normalize(x))))return false;
  const amount=priceOf(g);
  if(price==='free'&&amount!==0)return false;
  if(price!=='free'&&price!=='any'&&(amount===null||amount>Number(price)))return false;
  const tags=tagsOf(g),target=normalize(mode);
  if(target&&!tags.includes(target)&&!(target==='single player'&&g.single_player)&&!(target==='co op'&&(g.co_op||g.coop))&&!(target==='multiplayer'&&g.multiplayer))return false;
  if(availability==='available'&&comingSoon(g))return false;
  if(availability==='soon'&&!comingSoon(g))return false;
  return !(hideOwned&&(g.catalog_ids||[g.id]).some(id=>owned.includes(id)));
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

export const discountPercent = game => {
 const regular = Number(game.price), current = priceOf(game);
 return current !== null && Number.isFinite(regular) && regular > current && regular > 0
  ? Math.floor((regular - current) / regular * 100) : 0;
};
export const isOnSale = game => discountPercent(game) > 0 && !comingSoon(game);

export function uniqueCatalog(games, ownedIds = []) {
 const groups = new Map();
 for (const game of games) {
  if (!game?.id || !game.title) continue;
  const key = normalize(game.title) + '|' + (game.original_year || game.release_year || '');
  const previous = groups.get(key);
  const score = g => (ownedIds.includes(g.id) ? 10000 : 0) + (g.banner_image ? 20 : 0) + (g.screenshots?.length || 0) + (g.release_date ? 5 : 0);
  if (!previous) groups.set(key, { ...game, catalog_ids: [game.id] });
  else {
   const ids = [...new Set([...previous.catalog_ids, game.id])];
   groups.set(key, { ...(score(game) > score(previous) ? game : previous), catalog_ids: ids });
  }
 }
 return [...groups.values()];
}

export function buildStoreShelves(games,{day,offset=0,sales={}}={}){
 const available=games.filter(game=>!comingSoon(game));
 const rotation=rotateGames(discoveryOrder(available,day||'store'),offset);
 // Prefer different titles across shelves; small catalogs may repeat in relevant categories.
 const used=new Set();
 const take=(pool,count,fill=true)=>{
  const fresh=pool.filter(game=>!used.has(game.id));
  const result=(fill?[...fresh,...pool.filter(game=>used.has(game.id))]:fresh).slice(0,count);
  result.forEach(game=>used.add(game.id));return result;
 };
 const featured=take(rotation,Math.min(4,Math.max(1,Math.floor(rotation.length/3))));
 const picks=take(rotation,3);
 const dated=available.filter(game=>releaseTime(game)>0).sort((a,b)=>releaseTime(b)-releaseTime(a));
 const arrivals=available.filter(game=>Number.isFinite(Date.parse(game.created_date))).sort((a,b)=>Date.parse(b.created_date)-Date.parse(a.created_date));
 // Dates determine this shelf even if a title is also featured.
 const newest=(dated.length?dated:arrivals).slice(0,4);newest.forEach(game=>used.add(game.id));
 const saleGames=rotation.filter(isOnSale).sort((a,b)=>discountPercent(b)-discountPercent(a));
 const offers=[...saleGames.slice(0,4)];
 offers.push(...rotation.filter(game=>!offers.some(item=>item.id===game.id)&&priceOf(game)!==null&&priceOf(game)<=25).slice(0,4-offers.length));
 offers.forEach(game=>used.add(game.id));
 const purchases=game=>(game.catalog_ids||[game.id]).reduce((total,id)=>total+(Number(sales[id])||0),0);
 const sellers=available.filter(game=>purchases(game)>0).sort((a,b)=>purchases(b)-purchases(a));
 const surprises=take(rotation,4);
 const free=take(rotation.filter(game=>priceOf(game)===0),4);
 const upcoming=take(games.filter(game=>comingSoon(game)).sort((a,b)=>(releaseTime(a)||Infinity)-(releaseTime(b)||Infinity)),4);
 return {featured,picks,offers,newest,newestType:dated.length?'releases':'arrivals',sellers,surprises,free,upcoming};
}

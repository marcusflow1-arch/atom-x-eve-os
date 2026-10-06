import {normalize} from '../redesign/discovery';
export const firstLetter=studio=>/^[a-z]/i.test(studio.name)?studio.name[0].toUpperCase():'#';
export function filterStudios(studios,{query='',letter='all',genre='all',status='all',sort='az'}={}){
 const tokens=normalize(query).split(/\s+/).filter(Boolean);
 return studios.filter(studio=>{
  const text=normalize([studio.name,studio.tagline,...studio.games.map(g=>g.title),...studio.projects.map(p=>p.title)].join(' '));
  return tokens.every(token=>text.includes(token))&&(letter==='all'||firstLetter(studio)===letter)&&(genre==='all'||studio.genres.some(value=>normalize(value)===genre))&&(status==='all'||(status==='projects'?studio.projects.length>0:studio.games.length>0));
 }).sort((a,b)=>sort==='za'?b.name.localeCompare(a.name):sort==='projects'?b.projects.length-a.projects.length||a.name.localeCompare(b.name):a.name.localeCompare(b.name));
}

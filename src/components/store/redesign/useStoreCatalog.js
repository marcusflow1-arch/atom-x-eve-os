import {useQuery} from '@tanstack/react-query';
import {base44} from '@/api/base44Client';

export async function loadCatalog(){
 const all=[],seen=new Set();let offset=0;
 while(true){
  const response=await base44.entities.Game.list('title',200,offset);
  const page=response?.data||response;
  if(!Array.isArray(page))throw new Error('The game catalog returned an invalid response.');
  for(const game of page)if(game.id&&!seen.has(game.id)){seen.add(game.id);all.push(game);}
  if(page.length<200)break;
  offset+=page.length;
 }
 return all;
}
export function useStoreCatalog(){return useQuery({queryKey:['store-catalog'],queryFn:loadCatalog,staleTime:60000});}

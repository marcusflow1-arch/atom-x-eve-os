import {useInfiniteQuery,useQuery,useQueryClient} from '@tanstack/react-query';
import {useEffect} from 'react';
import {base44} from '@/api/base44Client';
export async function studioRequest(action,data={}){
 const response=await base44.functions.invoke('studio-hub',{action,data});
 const result=response?.data||response;
 if(result?.error||!result?.success)throw new Error(result?.error||'Studio information could not be loaded.');
 return result;
}
export function useStudioHub(){
 const query=useQuery({queryKey:['studio-directory'],queryFn:()=>studioRequest('directory'),staleTime:60000});
 return {...query,studios:query.data?.studios||[],editableStudios:query.data?.editable_studios||[]};
}
export function useStudioFeed(studioKey='',category='all'){
 const client=useQueryClient();
 const query=useInfiniteQuery({queryKey:['studio-feed',studioKey,category],initialPageParam:0,queryFn:({pageParam})=>studioRequest('feed',{studio_key:studioKey,category,offset:pageParam}),getNextPageParam:last=>last.has_more?last.next_offset:undefined,staleTime:30000});
 useEffect(()=>{let stop;try{stop=base44.entities.StudioUpdate.subscribe(()=>client.invalidateQueries({queryKey:['studio-feed']}));}catch{}return()=>{if(typeof stop==='function')stop();};},[client]);
 return {...query,posts:[...new Map((query.data?.pages||[]).flatMap(p=>p.posts||[]).map(post=>[post.id,post])).values()]};
}

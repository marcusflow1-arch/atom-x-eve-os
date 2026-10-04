import {useQuery} from '@tanstack/react-query';
import {base44} from '@/api/base44Client';
export function useCustomizationCatalog() {
 return useQuery({queryKey:['avatar-customization-catalog'],staleTime:30000,queryFn:async()=>{
  const response=await base44.functions.invoke('avatarCustomizationCatalog',{action:'list'});
  if(!response.data?.success)throw Error(response.data?.error||'Customization options could not load.');
  return response.data;
 }});
}

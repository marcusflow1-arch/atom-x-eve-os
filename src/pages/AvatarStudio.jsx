import {useQuery} from '@tanstack/react-query';
import {useNavigate} from 'react-router-dom';
import {base44} from '@/api/base44Client';
import AvatarAppearanceDialog from '@/components/onboarding/AvatarAppearanceDialog';
export default function AvatarStudio() {
 const navigate=useNavigate();
 const avatar=useQuery({queryKey:['creator-current-avatar'],queryFn:async()=>{
  const response=await base44.functions.invoke('avatarSystem',{action:'loadAvatar'});
  if(!response.data?.success)throw Error(response.data?.error||'Your avatar could not load.');
  return response.data.avatar;
 }});
 if(avatar.isPending)return <div className="min-h-screen grid place-items-center bg-slate-950 text-slate-300" role="status">Opening character studio…</div>;
 if(avatar.isError)return <div className="min-h-screen grid place-items-center bg-slate-950 text-slate-300"><div role="alert"><p>{avatar.error.message}</p><button type="button" onClick={()=>avatar.refetch()}>Try again</button></div></div>;
 return <AvatarAppearanceDialog initialAvatar={avatar.data} onClose={()=>navigate('/LunaTemplate')}/>;
}

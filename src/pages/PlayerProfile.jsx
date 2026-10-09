import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthContext';
import LunaGamerProfile from '@/components/dashboard/LunaGamerProfile';
export default function PlayerProfile(){
 const {user}=useAuth(),location=useLocation(),navigate=useNavigate();
 const id=new URLSearchParams(location.search).get('userId')||user?.id;
 return <div className="fixed inset-x-0 top-[64px] bottom-[48px] bg-slate-950"><button type="button" className="absolute right-5 top-4 z-20 flex items-center gap-2 rounded-lg border border-white/15 bg-slate-900/90 px-3 py-2 text-xs text-white" onClick={()=>navigate('/LunaTemplate')}><ArrowLeft size={14}/>Luna</button><LunaGamerProfile key={id} player={{id,name:id===user?.id?(user?.full_name||user?.username):'Player'}} /></div>;
}

import DashboardWindow from '@/components/dashboard/windows/DashboardWindow';
import LunaGamerProfile from '@/components/dashboard/LunaGamerProfile';
export default function FriendProfileOverlay({friend,onClose}){
 const id=String(friend?.friend_id||friend?.player_id||friend?.id||'');
 return <DashboardWindow id={'friend-profile-'+id} title="Gamer Profile · AI Avatar & Achievements" width={1150} height={770} onClose={onClose}><LunaGamerProfile key={id} player={{...friend,is_friend:true}} onClose={onClose}/></DashboardWindow>;
}

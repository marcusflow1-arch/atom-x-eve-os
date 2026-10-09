import DashboardWindow from '@/components/dashboard/windows/DashboardWindow';
import LunaGamerProfile from '@/components/dashboard/LunaGamerProfile';
export default function FriendProfileOverlay({friend,onClose}){
 const id=String(friend?.friend_id||friend?.player_id||friend?.id||'');
 return <DashboardWindow id={'friend-profile-'+id} title="Gamer Profile" width={1040} height={720} onClose={onClose}><LunaGamerProfile key={id} player={{...friend,is_friend:true}} onClose={onClose}/></DashboardWindow>;
}

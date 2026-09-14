import PlayerAvatarPreview from '@/components/onboarding/PlayerAvatarPreview';
import {useGameAvatar} from '../useGameAvatar';
export default function EquipmentPreview3D(){const config=useGameAvatar();return <PlayerAvatarPreview config={config} controls="compact"/>;}
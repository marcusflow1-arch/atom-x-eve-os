import PlayerAvatarPreview from '@/components/onboarding/PlayerAvatarPreview';
import {useGameAvatar} from '../useGameAvatar';
export default function HUDPortrait3D(){const config=useGameAvatar();return <PlayerAvatarPreview config={config} portrait controls="none"/>;}
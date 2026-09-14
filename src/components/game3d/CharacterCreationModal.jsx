import AvatarAppearanceDialog from '@/components/onboarding/AvatarAppearanceDialog';
import {createCharacter} from './characterStore';
export default function CharacterCreationModal({onClose,onCreated}){return <AvatarAppearanceDialog create onClose={onClose} onSaved={(avatar,name)=>onCreated?.(createCharacter({name,avatarConfig:avatar}))}/>;}
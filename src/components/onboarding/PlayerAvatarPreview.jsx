import {useCompanionIdentity} from './CompanionIdentityContext';
import {playerAppearance} from './playerAppearance';
import GenesisModelPreview from './GenesisModelPreview';
export default function PlayerAvatarPreview({config,...props}){const saved=useCompanionIdentity();return <GenesisModelPreview config={playerAppearance(config||saved)} compact {...props}/>;}
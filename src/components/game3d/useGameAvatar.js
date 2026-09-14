import {useSyncExternalStore} from 'react';
import {getActiveCharacter,subscribeCharacters} from './characterStore';
import {useCompanionIdentity} from '@/components/onboarding/CompanionIdentityContext';
import {playerAppearance} from '@/components/onboarding/playerAppearance';
export function useGameAvatar(){const character=useSyncExternalStore(subscribeCharacters,getActiveCharacter),saved=useCompanionIdentity();return playerAppearance(character&&!character.isDevTest?character:saved);}
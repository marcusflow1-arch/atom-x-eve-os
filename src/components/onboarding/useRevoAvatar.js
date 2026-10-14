import { useCompanionIdentity } from '@/components/onboarding/CompanionIdentityContext';
import { playerAppearance } from '@/components/onboarding/playerAppearance';
import { sharedRevoIdentity } from '@/lib/revoAvatarPolicy.mjs';

/** Cosmetic Game 1/3/5/PvP identity. Does not authorize gameplay or rewards. */
export function useRevoAvatar(gameKey) {
  const avatar = useCompanionIdentity();
  const identity = sharedRevoIdentity(avatar, gameKey);
  return identity ? { ...identity, appearance: playerAppearance(avatar) } : null;
}

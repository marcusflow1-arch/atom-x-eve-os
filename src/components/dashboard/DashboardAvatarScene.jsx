import React from 'react';
import { useCompanionIdentity } from '@/components/onboarding/CompanionIdentityContext';
import GenesisModelPreview from '@/components/onboarding/GenesisModelPreview';
export default function DashboardAvatarScene() {
  const avatar = useCompanionIdentity();
  return <GenesisModelPreview config={avatar || {gender:'male'}} compact />;
}
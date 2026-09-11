import React from 'react';
import GenesisModelPreview from '@/components/onboarding/GenesisModelPreview';
import { useCompanionIdentity } from '@/components/onboarding/CompanionIdentityContext';

export default function StoreIdleViewer() {
  const companion = useCompanionIdentity();
  return (
    <div className="relative h-full w-full overflow-hidden rounded-xl" data-store-companion-preview>
      <GenesisModelPreview config={companion || { gender: 'male' }} compact />
    </div>
  );
}
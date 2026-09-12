import React from 'react';
import DashboardAvatarFeaturePortal from './DashboardAvatarFeaturePortal';
import { UICustomizationRail } from '@/components/customization/UICustomizationSystem';

export default function LunaLeftRail() {
  return (
    <>
      <aside
        data-ui-editor-ignore="true"
        className="relative z-40 h-full w-[5%] min-w-[80px] flex-shrink-0 border-r border-white/[0.10] bg-[#11161d]/46 px-2 py-3 shadow-[5px_0_24px_rgba(0,0,0,0.28),inset_-1px_0_0_rgba(255,255,255,0.025)] backdrop-blur-2xl"
      >
        <UICustomizationRail />
      </aside>
      <DashboardAvatarFeaturePortal />
    </>
  );
}
import React from 'react';
import DashboardAvatarFeaturePortal from './DashboardAvatarFeaturePortal';
import { UICustomizationControls } from '@/components/customization/UICustomizationSystem';

export default function LunaLeftRail() {
  return (
    <>
      <aside
        data-ui-editor-ignore="true"
        className="relative z-40 h-full w-[5%] min-w-[80px] flex-shrink-0 border-r border-white/20 bg-black/20 py-6 shadow-[5px_0_15px_rgba(0,0,0,0.5)] backdrop-blur-sm"
      >
        {/* Keep Recent Games exactly in its original upper rail area. */}
        <div className="mt-12 flex w-full flex-col items-center px-2">
          <span className="mb-1 text-center text-[10px] font-bold uppercase tracking-wider text-white/50">Recently<br />Played</span>
          <div className="mb-3 h-px w-8 bg-white/20" />
          <div className="flex w-full flex-col items-center gap-2">
            {[1, 2, 3, 4, 5].map((item) => (
              <div key={item} className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5">
                <span className="text-lg font-bold text-white/30">?</span>
              </div>
            ))}
          </div>
        </div>

        {/* Replace only the old Top Widget / Bottom Widget midpoint region. */}
        <div className="absolute left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-1/2">
          <UICustomizationControls />
        </div>
      </aside>
      <DashboardAvatarFeaturePortal />
    </>
  );
}

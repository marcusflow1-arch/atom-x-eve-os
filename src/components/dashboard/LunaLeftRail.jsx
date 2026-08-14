import React, { useEffect, useRef } from 'react';

export default function LunaLeftRail({ isEnvironmentActive, onToggleEnvironment }) {
  const launchBoxRef = useRef(null);

  // Move the existing dashboard Play button into the Launch Environments
  // selector visually, without creating a duplicate button or changing its
  // existing React click handler.
  useEffect(() => {
    const moveLaunchButton = () => {
      const host = launchBoxRef.current;
      if (!host) return;

      const playButton = Array.from(document.querySelectorAll('button')).find((button) => {
        const text = button.textContent?.trim();
        return text === 'Play' && button.className?.includes('bg-cyan-500');
      });

      if (!playButton) return;

      const rect = host.getBoundingClientRect();
      const buttonRect = playButton.getBoundingClientRect();

      playButton.style.position = 'fixed';
      playButton.style.left = `${rect.left + rect.width / 2 - buttonRect.width / 2}px`;
      playButton.style.top = `${rect.top + rect.height / 2 - buttonRect.height / 2}px`;
      playButton.style.margin = '0';
      playButton.style.zIndex = '120';
    };

    const observer = new MutationObserver(moveLaunchButton);
    observer.observe(document.body, { childList: true, subtree: true });
    window.addEventListener('resize', moveLaunchButton);

    moveLaunchButton();

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', moveLaunchButton);
    };
  }, []);

  return (
    <div className="w-[5%] min-w-[80px] h-full border-r border-white/20 bg-black/20 relative z-40 flex-shrink-0 shadow-[5px_0_15px_rgba(0,0,0,0.5)] backdrop-blur-sm flex flex-col items-center py-6">
      <div className="mt-12 px-2 flex flex-col items-center w-full">
        <span className="text-[10px] uppercase tracking-wider text-white/50 font-bold text-center mb-1">
          Recently<br />Played
        </span>
        <div className="w-8 h-px bg-white/20 mb-3" />

        <div className="flex flex-col gap-2 w-full items-center">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="w-10 h-10 rounded-xl border border-white/10 bg-white/5 flex items-center justify-center"
            >
              <span className="text-white/30 text-lg font-bold">?</span>
            </div>
          ))}
        </div>

        {/* Launch Environments box: the existing Play button is positioned
            here between the two environment slots. */}
        <div ref={launchBoxRef} className="relative w-full mt-4 px-1.5">
          <div className="relative w-full h-28 rounded-2xl border border-white/10 bg-white/[0.025] shadow-inner overflow-hidden">
            <div className="absolute inset-x-2 top-1/2 h-px bg-white/10" />
            <div className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-10 rounded-lg border border-white/10 bg-white/5 flex items-center justify-center">
              <span className="text-white/30 text-xl font-bold">?</span>
            </div>
            <div className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-10 rounded-lg border border-white/10 bg-white/5 flex items-center justify-center">
              <span className="text-white/30 text-xl font-bold">?</span>
            </div>
            <span className="absolute top-2 left-0 right-0 text-[7px] uppercase tracking-widest text-white/30 text-center">
              Launch Environments
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

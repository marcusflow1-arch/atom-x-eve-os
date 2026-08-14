import React, { useEffect } from 'react';

function findExistingEnvironmentBox() {
  const all = Array.from(document.querySelectorAll('div'));
  const candidates = [];
  for (const el of all) {
    const rect = el.getBoundingClientRect();
    if (rect.width < 55 || rect.width > 260 || rect.height < 45 || rect.height > 240) continue;
    const questionMarks = Array.from(el.querySelectorAll('span,div,button')).filter(child => child.textContent?.trim() === '?');
    if (questionMarks.length >= 2) candidates.push({ el, rect, score: questionMarks.length + (rect.width > rect.height ? 1 : 0) });
  }
  candidates.sort((a, b) => b.score - a.score);
  return candidates[0]?.el || null;
}

export default function LunaLeftRail({ isEnvironmentActive, onToggleEnvironment }) {
  useEffect(() => {
    const movePlayIntoExistingBox = () => {
      const playButton = Array.from(document.querySelectorAll('button')).find(button => {
        const text = button.textContent?.trim();
        return text === 'Play' && button.className?.includes('bg-cyan-500');
      });
      if (!playButton) return;

      const target = findExistingEnvironmentBox();
      if (!target) return;

      const targetRect = target.getBoundingClientRect();
      const buttonRect = playButton.getBoundingClientRect();
      playButton.style.position = 'fixed';
      playButton.style.left = `${targetRect.left + targetRect.width / 2 - buttonRect.width / 2}px`;
      playButton.style.top = `${targetRect.top + targetRect.height / 2 - buttonRect.height / 2}px`;
      playButton.style.margin = '0';
      playButton.style.zIndex = '120';
    };

    const observer = new MutationObserver(movePlayIntoExistingBox);
    observer.observe(document.body, { childList: true, subtree: true });
    window.addEventListener('resize', movePlayIntoExistingBox);
    window.addEventListener('scroll', movePlayIntoExistingBox, true);
    movePlayIntoExistingBox();

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', movePlayIntoExistingBox);
      window.removeEventListener('scroll', movePlayIntoExistingBox, true);
    };
  }, []);

  return (
    <div className="w-[5%] min-w-[80px] h-full border-r border-white/20 bg-black/20 relative z-40 flex-shrink-0 shadow-[5px_0_15px_rgba(0,0,0,0.5)] backdrop-blur-sm flex flex-col items-center py-6">
      <div className="mt-12 px-2 flex flex-col items-center w-full">
        <span className="text-[10px] uppercase tracking-wider text-white/50 font-bold text-center mb-1">Recently<br />Played</span>
        <div className="w-8 h-px bg-white/20 mb-3" />
        <div className="flex flex-col gap-2 w-full items-center">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="w-10 h-10 rounded-xl border border-white/10 bg-white/5 flex items-center justify-center">
              <span className="text-white/30 text-lg font-bold">?</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

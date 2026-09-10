import React, { useEffect } from 'react';
import DashboardAvatarFeaturePortal from './DashboardAvatarFeaturePortal';
import GameChatRailSection from '@/components/clan/GameChatRailSection';

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
    <>
      <div className="w-[5%] min-w-[80px] h-full border-r border-white/20 bg-black/20 relative z-40 flex-shrink-0 shadow-[5px_0_15px_rgba(0,0,0,0.5)] backdrop-blur-sm flex flex-col items-center py-6">
        <GameChatRailSection />
      </div>
      <DashboardAvatarFeaturePortal />
    </>
  );
}
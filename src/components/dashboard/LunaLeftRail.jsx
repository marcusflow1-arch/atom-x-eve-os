import React, { useEffect, useRef, useState } from 'react';
import DashboardAvatarFeaturePortal from './DashboardAvatarFeaturePortal';
import MidpointCustomizationControls from '@/components/customization/MidpointCustomizationControls';
import UIMediaCustomization from '@/components/customization/UIMediaCustomization';

function questionMarkCount(element) {
  return Array.from(element.querySelectorAll('*')).filter((node) => (
    node.children.length === 0 && node.textContent?.trim() === '?'
  )).length;
}

function findExistingMidpointBox() {
  const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 900;
  const candidates = [];

  Array.from(document.querySelectorAll('div')).forEach((element) => {
    if (element.closest('[data-atom-midpoint-controls="true"]')) return;
    const rect = element.getBoundingClientRect();
    if (!rect.width || !rect.height) return;

    // The legacy Luna midpoint box lives entirely inside the far-left rail,
    // below Recently Played and above the permanent utility buttons.
    if (rect.left < -4 || rect.left > 96 || rect.right > 108) return;
    if (rect.width < 42 || rect.width > 86 || rect.height < 78 || rect.height > 190) return;
    if (rect.top < 280 || rect.bottom > viewportHeight - 120) return;
    if (element.textContent?.includes('Recently Played')) return;

    const marks = questionMarkCount(element);
    if (marks < 2 || marks > 3) return;

    const centerY = rect.top + rect.height / 2;
    const preferredY = viewportHeight * 0.56;
    const score = (marks === 2 ? 80 : 50)
      - Math.abs(rect.width - 54) * 0.6
      - Math.abs(rect.height - 140) * 0.18
      - Math.abs(centerY - preferredY) * 0.05;

    candidates.push({ element, rect, score });
  });

  candidates.sort((a, b) => b.score - a.score);
  return candidates[0] || null;
}

export default function LunaLeftRail() {
  const [anchor, setAnchor] = useState(null);
  const replacedRef = useRef(null);

  useEffect(() => {
    let frame = 0;

    const restoreTarget = () => {
      const record = replacedRef.current;
      if (record?.element?.isConnected) {
        record.element.style.visibility = record.visibility;
        record.element.style.pointerEvents = record.pointerEvents;
        delete record.element.dataset.atomMidpointReplaced;
      }
      replacedRef.current = null;
    };

    const sync = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const target = findExistingMidpointBox();

        if (!target) {
          setAnchor(null);
          return;
        }

        if (replacedRef.current?.element !== target.element) {
          restoreTarget();
          replacedRef.current = {
            element: target.element,
            visibility: target.element.style.visibility,
            pointerEvents: target.element.style.pointerEvents,
          };
          // Keep the original slot in layout, but remove the rounded frame and
          // its two placeholder boxes from view. This preserves every control
          // above and below the slot at its original position.
          target.element.style.visibility = 'hidden';
          target.element.style.pointerEvents = 'none';
          target.element.dataset.atomMidpointReplaced = 'true';
        }

        setAnchor({
          left: target.rect.left + target.rect.width / 2,
          top: target.rect.top + target.rect.height / 2,
        });
      });
    };

    const observer = new MutationObserver(sync);
    observer.observe(document.body, { childList: true, subtree: true });
    window.addEventListener('resize', sync);
    window.addEventListener('scroll', sync, true);
    sync();

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener('resize', sync);
      window.removeEventListener('scroll', sync, true);
      restoreTarget();
    };
  }, []);

  return (
    <>
      <aside
        data-ui-editor-ignore="true"
        className="relative z-40 h-full w-[5%] min-w-[80px] flex-shrink-0 overflow-visible border-r border-white/20 bg-black/20 px-2 py-6 shadow-[5px_0_15px_rgba(0,0,0,0.5)] backdrop-blur-sm"
      >
        {/* Existing top section stays exactly that: Recently Played only. */}
        <div className="mt-12 flex w-full flex-col items-center px-2">
          <span className="mb-1 text-center text-[10px] font-bold uppercase leading-3 tracking-wider text-white/50">Recently<br />Played</span>
          <div className="mb-3 h-px w-8 bg-white/20" />
          <div className="flex w-full flex-col items-center gap-2">
            {[1, 2, 3, 4, 5].map((item) => (
              <div key={item} className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5">
                <span className="text-lg font-bold text-white/30">?</span>
              </div>
            ))}
          </div>
        </div>

        {/* Fallback only. When the legacy midpoint slot is found, the fixed
            stack below is anchored directly over that preserved slot. */}
        {!anchor && (
          <div className="pointer-events-none absolute inset-x-0 top-1/2 z-[120] flex -translate-y-1/2 justify-center">
            <div className="pointer-events-auto">
              <MidpointCustomizationControls />
            </div>
          </div>
        )}
      </aside>

      {anchor && (
        <div
          data-ui-editor-ignore="true"
          className="fixed z-[120]"
          style={{ left: anchor.left, top: anchor.top, transform: 'translate(-50%, -50%)' }}
        >
          <MidpointCustomizationControls />
        </div>
      )}

      <DashboardAvatarFeaturePortal />
      <UIMediaCustomization />
    </>
  );
}

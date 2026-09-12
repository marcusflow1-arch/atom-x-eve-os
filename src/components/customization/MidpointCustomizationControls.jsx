import React, { useEffect, useRef, useState } from 'react';
import { Palette, Play, SlidersHorizontal, Sparkles, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useUICustomization } from '@/components/customization/UICustomizationSystem';
import PagePrefabDrawer from '@/components/customization/PagePrefabDrawer';

function RailButton({ icon: Icon, label, active = false, play = false, onClick }) {
  return (
    <button
      type="button"
      data-ui-editor-ignore="true"
      data-atom-midpoint-button="true"
      onClick={onClick}
      title={label}
      aria-label={label}
      className={`group relative grid h-11 w-11 place-items-center rounded-[15px] transition-all duration-200 ${
        play
          ? 'bg-gradient-to-br from-cyan-300/95 via-cyan-400/90 to-emerald-400/90 text-[#061116] shadow-[0_0_24px_rgba(34,211,238,.22),inset_0_1px_0_rgba(255,255,255,.48)] hover:scale-[1.04]'
          : active
            ? 'bg-white/[0.14] text-white shadow-[0_0_24px_rgba(var(--atom-ui-accent-rgb),.20),inset_0_1px_0_rgba(255,255,255,.12)]'
            : 'border border-white/[0.10] bg-white/[0.035] text-white/45 shadow-[inset_0_1px_0_rgba(255,255,255,.05),0_10px_24px_rgba(0,0,0,.16)] hover:border-white/[0.18] hover:bg-white/[0.075] hover:text-white'
      }`}
    >
      <Icon className="h-[17px] w-[17px]" />
      <span className="pointer-events-none absolute left-[calc(100%+9px)] z-[340] hidden whitespace-nowrap rounded-lg bg-[#11161d]/95 px-2.5 py-1.5 text-[8px] font-black uppercase tracking-[.12em] text-white/65 shadow-xl backdrop-blur-xl group-hover:block">
        {label}
      </span>
    </button>
  );
}

function isSidebarLaunchCandidate(candidate) {
  if (!candidate || candidate.closest('[data-atom-midpoint-controls="true"]')) return false;
  const rect = candidate.getBoundingClientRect();
  if (!rect.width || !rect.height) return false;
  return rect.left < 190
    && rect.right < 235
    && rect.width <= 76
    && rect.height <= 76
    && rect.top > 180;
}

function findLegacyEnvironmentAction() {
  // SidebarBottomSection intentionally keeps this invisible, in-flow bridge so
  // the relocated midpoint button can reuse the exact original launch handler.
  const launchProxy = document.querySelector('button[data-sidebar-launch-proxy="true"]');
  if (launchProxy) return launchProxy;

  const environmentSelectors = [
    'button[title="Environment Launch"]',
    'button[aria-label="Environment Launch"]',
    'button[title="Launch Environment"]',
    'button[aria-label="Launch Environment"]',
  ];

  for (const selector of environmentSelectors) {
    const match = Array.from(document.querySelectorAll(selector))
      .find((candidate) => !candidate.closest('[data-atom-midpoint-controls="true"]'));
    if (match) return match;
  }

  const genericSelectors = [
    'button[title="Play"]',
    'button[aria-label="Play"]',
  ];
  for (const selector of genericSelectors) {
    const match = Array.from(document.querySelectorAll(selector)).find(isSidebarLaunchCandidate);
    if (match) return match;
  }

  return Array.from(document.querySelectorAll('button')).find((candidate) => (
    isSidebarLaunchCandidate(candidate)
    && candidate.textContent?.trim().toLowerCase() === 'play'
  )) || null;
}

function useLegacyEnvironmentAction() {
  const actionRef = useRef(null);
  const hiddenRef = useRef(null);

  useEffect(() => {
    let frame = 0;

    const restore = () => {
      const record = hiddenRef.current;
      if (record?.element?.isConnected) {
        record.element.style.visibility = record.visibility;
        record.element.style.pointerEvents = record.pointerEvents;
      }
      hiddenRef.current = null;
    };

    const sync = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const action = findLegacyEnvironmentAction();
        if (!action) return;

        actionRef.current = action;
        if (hiddenRef.current?.element === action) return;
        restore();
        hiddenRef.current = {
          element: action,
          visibility: action.style.visibility,
          pointerEvents: action.style.pointerEvents,
        };

        // The old Launch button is visually relocated, not removed from layout.
        // Keeping its box in-flow prevents Friends/Library/Inventory/Entertainment
        // below it from sliding upward into different positions.
        action.style.visibility = 'hidden';
        action.style.pointerEvents = 'none';
      });
    };

    const observer = new MutationObserver(sync);
    observer.observe(document.body, { childList: true, subtree: true });
    sync();

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      restore();
      actionRef.current = null;
    };
  }, []);

  return actionRef;
}

export default function MidpointCustomizationControls({ className = '' }) {
  const navigate = useNavigate();
  const rootRef = useRef(null);
  const legacyActionRef = useLegacyEnvironmentAction();
  const { scope, preset, presets, applyPreset, editMode, setEditMode } = useUICustomization();
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => { setDrawerOpen(false); }, [scope]);

  const launchEnvironment = () => {
    if (legacyActionRef.current?.isConnected) {
      legacyActionRef.current.click();
      return;
    }
    window.dispatchEvent(new CustomEvent('atomPlayRequested', { detail: { source: 'midpoint', scope } }));
    navigate(createPageUrl('GameView'));
  };

  return (
    <div
      ref={rootRef}
      data-atom-midpoint-controls="true"
      data-atom-customization-midpoint="true"
      data-ui-editor-ignore="true"
      className={`relative flex flex-col items-center gap-2 ${className}`}
    >
      <RailButton
        icon={Palette}
        label="UI Prefabs"
        active={drawerOpen}
        onClick={() => setDrawerOpen((value) => !value)}
      />
      <RailButton
        icon={Play}
        label="Environment Launch"
        play
        onClick={launchEnvironment}
      />
      <RailButton
        icon={SlidersHorizontal}
        label={editMode ? 'Exit Layout Edit' : 'Layout Edit'}
        active={editMode}
        onClick={() => setEditMode((value) => !value)}
      />

      {drawerOpen && <PagePrefabDrawer scope={scope} preset={preset} presets={presets} onSelect={applyPreset} onClose={() => setDrawerOpen(false)} />}
    </div>
  );
}
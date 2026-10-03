import { useLayoutEffect, useState } from 'react';

export default function useCardWorkspaceFrame(anchorRef, active) {
  const [frame, setFrame] = useState({});
  useLayoutEffect(() => {
    if (!active) return undefined;
    let raf = 0;
    const measure = () => {
      const hub = document.querySelector('[data-luna-environment-hub]')?.getBoundingClientRect();
      const library = anchorRef.current?.getBoundingClientRect();
      const attributes = document.querySelector('[aria-label="AI Attribute Box"]')?.getBoundingClientRect();
      const compact = window.innerWidth < 950;
      const left = compact ? 12 : library?.right || 330;
      const right = compact ? 12 : attributes?.width ? window.innerWidth - attributes.left : 338;
      const next = {
        '--card-workspace-top': Math.max(64, hub?.bottom || 190) + 'px',
        '--card-workspace-left': left + 'px',
        '--card-workspace-right': right + 'px',
        '--card-workspace-bottom': '48px',
      };
      setFrame(previous => JSON.stringify(previous) === JSON.stringify(next) ? previous : next);
    };
    const schedule = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(measure); };
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(schedule);
    [anchorRef.current, document.querySelector('[data-luna-environment-hub]'), document.querySelector('[aria-label="AI Attribute Box"]')].filter(Boolean).forEach(element => observer?.observe(element));
    window.addEventListener('resize', schedule);
    window.addEventListener('scroll', schedule, true);
    measure();
    return () => { cancelAnimationFrame(raf); observer?.disconnect(); window.removeEventListener('resize', schedule); window.removeEventListener('scroll', schedule, true); };
  }, [active, anchorRef]);
  return frame;
}

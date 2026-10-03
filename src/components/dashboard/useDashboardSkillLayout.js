import { useLayoutEffect, useState } from 'react';
import { skillBookLayout } from './skillBookLayout';

export default function useDashboardSkillLayout({ active, bookOpen }) {
  const [layout, setLayout] = useState({});
  useLayoutEffect(() => {
    if (!active) return undefined;
    let raf = 0;
    const observed = new Set();
    const measure = () => {
      const nodes = {
        library: document.querySelector('[data-luna-library-rail]'),
        attributes: document.querySelector('[aria-label="AI Attribute Box"]'),
        hub: document.querySelector('[data-luna-environment-hub]'),
        owner: document.querySelector('[data-dashboard-avatar-overview]'),
        hud: document.querySelector('[data-luna-skill-xp-hud]'),
      };
      for (const node of Object.values(nodes)) {
        if (node && !observed.has(node)) { observer?.observe(node); observed.add(node); }
      }
      const next = skillBookLayout({
        width: window.innerWidth, height: window.innerHeight,
        ...Object.fromEntries(Object.entries(nodes).map(([key, node]) => [key, node?.getBoundingClientRect()])),
      });
      setLayout(previous => JSON.stringify(previous) === JSON.stringify(next) ? previous : next);
    };
    const schedule = () => { window.cancelAnimationFrame(raf); raf = window.requestAnimationFrame(measure); };
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(schedule);
    const mutations = new MutationObserver(schedule);
    const owner = document.querySelector('[data-dashboard-avatar-overview]');
    if (owner) mutations.observe(owner, { childList: true, subtree: true });
    window.addEventListener('resize', schedule);
    window.addEventListener('scroll', schedule, true);
    measure();
    return () => {
      window.cancelAnimationFrame(raf); observer?.disconnect(); mutations.disconnect();
      window.removeEventListener('resize', schedule); window.removeEventListener('scroll', schedule, true);
    };
  }, [active, bookOpen]);
  return layout;
}

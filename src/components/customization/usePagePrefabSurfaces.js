import { useEffect } from 'react';

const excluded = '[data-ui-editor-ignore="true"],header,nav,.glass-page-top-bar,.glass-page-bottom-bar,.aura-family-header,[data-ui-rail]';

export default function usePagePrefabSurfaces(rootRef, enabled, scope, elementSettings) {
  useEffect(() => {
    const root = rootRef.current;
    if (!root || !enabled) return;
    let frame;
    const marked = new Set();
    const scan = () => {
      root.querySelectorAll('div,main,section,article,aside,form,ul,button').forEach(element => {
        if (element.closest(excluded)) return;
        const rect = element.getBoundingClientRect();
        if (rect.width < 120 || rect.height < 48) return;
        const setting = elementSettings?.[element.dataset.uiEditableRuntime];
        if (setting?.surface && setting.surface !== 'inherit') return;
        if (element.hasAttribute('data-prefab-surface')) return;
        const style = getComputedStyle(element);
        // Keep artwork, video/canvas viewers, and their contrast scrims intact.
        if (style.backgroundImage.includes('url(') || element.matches('.atom-ui-media-layer') || (!element.textContent.trim() && (style.pointerEvents === 'none' || style.position === 'absolute' || style.position === 'fixed'))) return;
        const painted = style.backgroundImage !== 'none' || !['rgba(0, 0, 0, 0)', 'transparent'].includes(style.backgroundColor);
        if (!painted) return;
        const page = rect.width >= root.clientWidth * .65 && rect.height >= root.clientHeight * .65;
        element.dataset.prefabSurface = page ? 'page' : 'panel';
        marked.add(element);
      });
    };
    const schedule = () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(scan); };
    const observer = new MutationObserver(schedule);
    observer.observe(root, { childList: true, subtree: true });
    window.addEventListener('resize', schedule);
    schedule();
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener('resize', schedule);
      marked.forEach(element => delete element.dataset.prefabSurface);
    };
  }, [rootRef, enabled, scope, elementSettings]);
}
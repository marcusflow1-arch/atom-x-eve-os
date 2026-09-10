import { useEffect, useState } from 'react';

export default function useAuraChapters(scrollRef, chapters, browsing) {
  const [active, setActive] = useState('live');
  useEffect(() => {
    const root = scrollRef.current;
    if (!root || browsing) return;
    let frame;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const line = root.getBoundingClientRect().top + Math.min(root.clientHeight * .3, 200);
        let current = chapters[0].id;
        for (const chapter of chapters) if (chapter.ref.current && chapter.ref.current.getBoundingClientRect().top <= line) current = chapter.id;
        setActive(current);
      });
    };
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(update);
    chapters.forEach(({ ref }) => { if (ref.current) observer?.observe(ref.current); });
    root.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    update();
    return () => { cancelAnimationFrame(frame); observer?.disconnect(); root.removeEventListener('scroll', update); window.removeEventListener('resize', update); };
  }, [scrollRef, chapters, browsing]);
  return browsing ? null : active;
}

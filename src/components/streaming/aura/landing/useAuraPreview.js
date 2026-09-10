import { useEffect, useState } from 'react';

// Previews are decorative: no off-screen playback, hidden-tab playback, or motion override.
export default function useAuraPreview(ref, suspended = false) {
  const [reduced, setReduced] = useState(false);
  const [visible, setVisible] = useState(false);
  const [tabVisible, setTabVisible] = useState(!document.hidden);
  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(preference.matches);
    update();
    preference.addEventListener('change', update);
    return () => preference.removeEventListener('change', update);
  }, []);
  useEffect(() => {
    const observer = typeof IntersectionObserver === 'undefined' ? null : new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: .15 });
    if (ref.current) observer?.observe(ref.current);
    if (!observer) setVisible(true);
    const change = () => setTabVisible(!document.hidden);
    document.addEventListener('visibilitychange', change);
    return () => { observer?.disconnect(); document.removeEventListener('visibilitychange', change); };
  }, [ref]);
  return visible && tabVisible && !reduced && !suspended;
}

import { useLayoutEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { libraryScrollFrame } from './libraryDiscovery';

function useScrollFrame(anchorRef, active) {
  const [frame, setFrame] = useState(null);
  useLayoutEffect(() => {
    if (!active || !anchorRef.current) return undefined;
    let raf = 0, watchedHub = null;
    const measure = () => {
      const anchor = anchorRef.current;
      const hub = document.querySelector('[data-luna-environment-hub]');
      if (hub !== watchedHub) { if (watchedHub) observer?.unobserve(watchedHub); if (hub) observer?.observe(hub); watchedHub = hub; }
      const rect = libraryScrollFrame(anchor?.getBoundingClientRect(), hub?.getBoundingClientRect(), { width: window.innerWidth, height: window.innerHeight });
      const next = rect ? { ...rect, inline: !hub || rect.inline } : null;
      setFrame((old) => JSON.stringify(old) === JSON.stringify(next) ? old : next);
    };
    const schedule = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(measure); };
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(schedule);
    observer?.observe(anchorRef.current);
    const dashboard = anchorRef.current.closest('[data-luna-dashboard-content]');
    if (dashboard) observer?.observe(dashboard);
    const mutations = new MutationObserver(schedule);
    mutations.observe(document.body, { childList: true, subtree: true });
    window.addEventListener('resize', schedule);
    window.addEventListener('scroll', schedule, true);
    measure();
    return () => { cancelAnimationFrame(raf); observer?.disconnect(); mutations.disconnect(); window.removeEventListener('resize', schedule); window.removeEventListener('scroll', schedule, true); };
  }, [active, anchorRef]);
  return frame;
}

function Paper({ children, width }) {
  return <div className="ll-scroll-paper" style={width ? { width } : undefined}><div className="ll-scroll-cards">{children}</div></div>;
}

export default function LibraryScrollReveal({ game, count, anchorRef, onClose, children, full = false, panelId }) {
  const reduceMotion = useReducedMotion();
  const frame = useScrollFrame(anchorRef, Boolean(game) && !full);
  const inline = full || frame?.inline;
  useLayoutEffect(() => {
    if (!game) return undefined;
    const escape = (event) => {
      if (event.key !== 'Escape' || event.defaultPrevented || document.querySelector('[data-library-card-dialog]')) return;
      event.preventDefault(); event.stopPropagation(); onClose();
    };
    window.addEventListener('keydown', escape, true);
    return () => window.removeEventListener('keydown', escape, true);
  }, [game?.id, onClose]);
  const transition = { duration: reduceMotion ? 0 : .42, ease: [.22, .78, .2, 1] };
  const panel = <AnimatePresence initial={false}>
    {game && (inline || frame) && <motion.aside
      key="library-card-scroll" id={panelId} aria-label={`Cards for ${game.title}`} data-testid="library-card-scroll"
      className={`ll-scroll-leaf ${inline ? 'll-inline-leaf' : ''}`}
      initial={inline ? { height: 0, opacity: 0 } : { width: 0, opacity: 0 }}
      animate={inline ? { height: 'auto', opacity: 1 } : { width: frame.width, opacity: 1 }}
      exit={inline ? { height: 0, opacity: 0 } : { width: 0, opacity: 0 }}
      transition={transition}
      style={inline ? undefined : { left: frame.left, top: frame.top, height: frame.height, maxWidth: frame.width }}
      onWheel={(event) => event.stopPropagation()} onKeyDown={(event) => event.stopPropagation()}
    ><Paper game={game} count={count} onClose={onClose} width={inline ? null : frame.width}>{children}</Paper></motion.aside>}
  </AnimatePresence>;
  return inline ? panel : createPortal(panel, document.body);
}

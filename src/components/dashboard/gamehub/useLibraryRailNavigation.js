import { useEffect } from 'react';

export default function useLibraryRailNavigation({ section, rail, games, selectedGame, onSelect }) {
  useEffect(() => {
    const region = section.current;
    const wheel = event => {
      if (event.ctrlKey) return;
      event.preventDefault();
      event.stopPropagation();
      const node = rail.current;
      const amount = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
      const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? node.clientWidth : 1;
      node.scrollLeft += amount * unit;
    };
    const keydown = event => {
      if (event.defaultPrevented || event.ctrlKey || event.metaKey || event.altKey) return;
      if (event.target instanceof Element && event.target.closest('input, textarea, select, [contenteditable="true"], [role="textbox"]')) return;
      const key = event.key.toLowerCase();
      if (key !== 'a' && key !== 'd') return;
      event.preventDefault();
      event.stopPropagation();
      const index = games.findIndex(game => game.id === selectedGame.id);
      const next = games[Math.max(0, Math.min(games.length - 1, index + (key === 'd' ? 1 : -1)))];
      if (next && next.id !== selectedGame.id) onSelect(next);
    };
    region.addEventListener('wheel', wheel, { passive: false });
    window.addEventListener('keydown', keydown);
    return () => { region.removeEventListener('wheel', wheel); window.removeEventListener('keydown', keydown); };
  }, [section, rail, games, selectedGame.id, onSelect]);
}
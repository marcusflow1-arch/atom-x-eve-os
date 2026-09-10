import React, { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import OwnedLibraryTile from '@/components/dashboard/gamehub/OwnedLibraryTile';
import { similarGames } from '@/components/dashboard/gamehub/ownedLibraryData';

export default function RelatedLibraryGames({ games, selectedGame, onSelect }) {
  const rail = useRef(null);
  const [edges, setEdges] = useState({ left: true, right: true });
  const related = games.filter(g => g.id === selectedGame.id || similarGames(selectedGame, g)).sort((a, b) => a.title.localeCompare(b.title));
  if (!related.some(g => g.id === selectedGame.id)) related.unshift(selectedGame);
  useEffect(() => {
    const node = rail.current;
    const update = () => setEdges({ left: node.scrollLeft <= 1, right: node.scrollLeft + node.clientWidth >= node.scrollWidth - 2 });
    const selected = node.querySelector('[aria-pressed="true"]');
    if (selected) node.scrollLeft = Math.max(0, selected.offsetLeft - node.offsetLeft - node.clientWidth / 2 + selected.clientWidth / 2);
    const observer = new ResizeObserver(update); observer.observe(node); update();
    node.addEventListener('scroll', update);
    return () => { observer.disconnect(); node.removeEventListener('scroll', update); };
  }, [selectedGame.id, related.map(g => g.id).join(',')]);
  const move = direction => rail.current.scrollBy({ left: direction * rail.current.clientWidth * 0.8 });
  return <section aria-label="Related owned games" className="shrink-0 border-b border-border/60 px-5 py-3">
    <div className="mb-2 flex items-center justify-between gap-3"><h2 className="text-xs font-semibold">Same genre & similar games</h2><div className="flex gap-2"><button aria-label="Previous related games" disabled={edges.left} onClick={() => move(-1)} className="rounded border border-border p-1 disabled:opacity-30"><ChevronLeft className="h-4 w-4" /></button><button aria-label="Next related games" disabled={edges.right} onClick={() => move(1)} className="rounded border border-border p-1 disabled:opacity-30"><ChevronRight className="h-4 w-4" /></button></div></div>
    <div ref={rail} data-testid="related-library-rail" className="relative flex gap-3 overflow-x-auto overscroll-x-contain pb-1" onWheel={e => { e.stopPropagation(); if (Math.abs(e.deltaY) > Math.abs(e.deltaX) && rail.current.scrollWidth > rail.current.clientWidth) rail.current.scrollLeft += e.deltaY; }}>{related.map(game => <OwnedLibraryTile key={game.id} compact selected={game.id === selectedGame.id} game={game} onSelect={onSelect} />)}</div>
    {related.length === 1 && <p className="mt-2 text-xs text-muted-foreground">No other similar games in your library yet.</p>}
  </section>;
}
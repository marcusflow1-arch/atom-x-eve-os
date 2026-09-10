import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { defaultRangeExtractor, useVirtualizer } from '@tanstack/react-virtual';
import { GameCard, StreamCard } from './DirectoryCards';

/** Only visible rows and the keyboard focus row are mounted, even with thousands of channels. */
export default function DirectoryGrid({ items, kind = 'streams', scrollRef, onSelect, layoutKey = '' }) {
  const rootRef = useRef(null);
  const pendingFocus = useRef(false);
  const [focusIndex, setFocusIndex] = useState(0);
  const [layout, setLayout] = useState({ width: 1000, margin: 0 });
  const gap = 20;
  const minWidth = kind === 'games' ? 230 : 260;
  const columns = Math.max(1, Math.floor((layout.width + gap) / (minWidth + gap)));
  const cardWidth = Math.max(0, (layout.width - gap * (columns - 1)) / columns);
  const rowHeight = kind === 'games' ? cardWidth * .75 + 90 : cardWidth * 9 / 16 + 124;
  const count = Math.ceil(items.length / columns);
  const focusRow = Math.floor(focusIndex / columns);
  const virtual = useVirtualizer({ count, getScrollElement: () => scrollRef.current, estimateSize: () => rowHeight, scrollMargin: layout.margin, overscan: 2, initialRect: { height: 800, width: layout.width }, rangeExtractor: (range) => [...new Set([...defaultRangeExtractor(range), Math.min(focusRow, count - 1)])].filter((index) => index >= 0).sort((a, b) => a - b) });
  useLayoutEffect(() => {
    const measure = () => {
      if (!rootRef.current || !scrollRef.current) return;
      const root = rootRef.current.getBoundingClientRect();
      const scroll = scrollRef.current.getBoundingClientRect();
      setLayout({ width: root.width || 1000, margin: root.top - scroll.top + scrollRef.current.scrollTop });
    };
    measure();
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(measure);
    if (rootRef.current) observer?.observe(rootRef.current);
    if (rootRef.current?.parentElement) observer?.observe(rootRef.current.parentElement);
    window.addEventListener('resize', measure);
    return () => { observer?.disconnect(); window.removeEventListener('resize', measure); };
  }, [scrollRef, kind, layoutKey]);
  useEffect(() => { virtual.measure(); }, [rowHeight, virtual]);
  useEffect(() => { setFocusIndex(0); }, [items]);
  useLayoutEffect(() => {
    if (pendingFocus.current) { rootRef.current?.querySelector(`[data-directory-index="${focusIndex}"]`)?.focus({ preventScroll: true }); pendingFocus.current = false; }
  }, [focusIndex]);
  const move = (event) => {
    const index = Number(event.target.closest('[data-directory-index]')?.dataset.directoryIndex);
    if (!Number.isFinite(index)) return;
    const next = ({ ArrowRight: index + 1, ArrowLeft: index - 1, ArrowDown: index + columns, ArrowUp: index - columns, Home: 0, End: items.length - 1 })[event.key];
    if (next === undefined) return;
    event.preventDefault();
    const bounded = Math.max(0, Math.min(items.length - 1, next));
    pendingFocus.current = true;
    virtual.scrollToIndex(Math.floor(bounded / columns), { align: 'auto' });
    setFocusIndex(bounded);
  };
  const Card = kind === 'games' ? GameCard : StreamCard;
  return <div ref={rootRef} className="console-directory-grid" role="list" aria-label={kind === 'games' ? 'Games directory' : 'Live channels'} onKeyDown={move} style={{ height: virtual.getTotalSize() }}>
    {virtual.getVirtualItems().map((row) => <div key={row.key} className="console-grid-row" style={{ transform: `translateY(${row.start - layout.margin}px)`, height: rowHeight, gridTemplateColumns: `repeat(${columns},minmax(0,1fr))` }}>{items.slice(row.index * columns, (row.index + 1) * columns).map((item, column) => {
      const index = row.index * columns + column;
      return <div key={item.id} role="listitem" aria-posinset={index + 1} aria-setsize={items.length}><Card {...(kind === 'games' ? { game: item } : { stream: item })} onSelect={onSelect} data-directory-index={index} tabIndex={index === focusIndex ? 0 : -1} onFocus={() => setFocusIndex(index)} /></div>;
    })}</div>)}
  </div>;
}

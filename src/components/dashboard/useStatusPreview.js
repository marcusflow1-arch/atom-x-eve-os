import { useEffect, useReducer, useRef } from 'react';

export const STATUS_PREVIEW_MS = 6000;
export const STATUS_RETRACT_MS = 260;
const initial = { current: null, queue: [], expanded: false, revision: 0 };
function reducer(state, action) {
  if (action.type === 'reset') return initial;
  if (action.type === 'receive') {
    const existing = new Set([state.current?.id, ...state.queue.map(item => item.id)]);
    const queue = [...state.queue, ...action.items.filter(item => !existing.has(item.id))];
    if (state.current || !queue.length) return { ...state, queue };
    return { current: queue[0], queue: queue.slice(1), expanded: true, revision: state.revision + 1 };
  }
  if (action.type === 'peek') return {
    current: action.item, queue: state.queue.filter(item => item.id !== action.item.id), expanded: true, revision: state.revision + 1,
  };
  if (action.type === 'hide') return { ...state, expanded: false };
  if (action.type === 'next') return {
    current: state.queue[0] || null, queue: state.queue.slice(1), expanded: Boolean(state.queue.length), revision: state.revision + 1,
  };
  return state;
}

export default function useStatusPreview({ sources, identity, paused }) {
  const [state, dispatch] = useReducer(reducer, initial);
  const history = useRef({ identity, sources: new Map() });
  useEffect(() => {
    if (history.current.identity !== identity) {
      history.current = { identity, sources: new Map() };
      dispatch({ type: 'reset' });
    }
    const fresh = [];
    for (const source of sources) {
      if (!source.ready) continue;
      const seen = history.current.sources.get(source.key);
      const ids = new Set(source.items.map(item => item.id));
      if (seen) {
        for (const item of source.items) if (!seen.has(item.id) && item.announce) fresh.push(item);
        for (const id of seen) ids.add(id);
      }
      history.current.sources.set(source.key, ids);
    }
    // The first successful snapshot is a baseline, not a stream of old popups.
    if (fresh.length) dispatch({ type: 'receive', items: fresh });
  }, [sources, identity]);
  useEffect(() => {
    if (!state.current || paused) return undefined;
    const timer = window.setTimeout(() => dispatch({ type: state.expanded ? 'hide' : 'next' }),
      state.expanded ? STATUS_PREVIEW_MS : STATUS_RETRACT_MS);
    return () => window.clearTimeout(timer);
  }, [state.current, state.expanded, state.revision, paused]);
  return {
    ...state,
    peek: item => dispatch({ type: 'peek', item }),
    dismiss: () => dispatch({ type: 'reset' }),
  };
}

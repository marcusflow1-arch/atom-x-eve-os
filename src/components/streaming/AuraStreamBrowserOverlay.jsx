import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import StreamersDirectory from './hub/StreamersDirectory';

const OPEN_EVENT = 'atomxe:aura-stream-browser';
export const openAuraStreamBrowser = () => window.dispatchEvent(new CustomEvent(OPEN_EVENT));

export default function AuraStreamBrowserOverlay({ standalone = false }) {
  const [open, setOpen] = useState(standalone);
  useEffect(() => {
    if (standalone) return;
    const toggle = () => setOpen((value) => !value);
    window.addEventListener(OPEN_EVENT, toggle);
    return () => window.removeEventListener(OPEN_EVENT, toggle);
  }, [standalone]);
  if (!open) return null;
  return standalone ? <StreamersDirectory /> : createPortal(<StreamersDirectory onClose={() => setOpen(false)} />, document.body);
}

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthContext';
import ClanChatOverlayBody from '@/components/clan/ClanChatOverlayBody';
import '@/components/clan/clanPresentation.css';
import '@/components/clan/clanChatOverlay.css';

export default function GlobalClanChat() {
  const { user, loading } = useAuth();
  const [open, setOpen] = useState(false);

  const trigger = useRef(null);
  const closeButton = useRef(null);
  useEffect(() => {
    const toggle = event => { trigger.current = event.detail?.trigger; setOpen(value => !value); };
    window.addEventListener('toggleGlobalClanChat', toggle);
    return () => window.removeEventListener('toggleGlobalClanChat', toggle);
  }, []);
  useEffect(() => { if (open) closeButton.current?.focus(); }, [open]);
  const close = () => { setOpen(false); requestAnimationFrame(() => trigger.current?.focus()); };
  return createPortal(<div className="clan-surface">

    {open && <section id="global-clan-chat" data-testid="clan-chat-overlay" role="dialog" aria-modal="false" aria-labelledby="global-clan-chat-title" className="clan-chat-overlay" onKeyDown={event => { event.stopPropagation(); if (event.key === 'Escape') { event.preventDefault(); close(); } }}>
      <header className="clan-chat-overlay-heading"><h2 id="global-clan-chat-title">Clan Chat</h2><button ref={closeButton} type="button" aria-label="Close Clan Chat" title="Close Clan Chat" className="clan-chat-overlay-close" onClick={close}><X size={19} /></button></header>
      <div className="clan-chat-overlay-body"><ClanChatOverlayBody key={user?.id || 'guest'} user={user} loading={loading} onClose={close} /></div>
    </section>}
  </div>, document.body);
}
import React, { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { MessageSquare, X } from 'lucide-react';
import ClanChatHub from '@/components/clan/ClanChatHub';

export default function ClanChatOverlay({ open, onClose, clan, myRole }) {
  useEffect(() => {
    if (!open) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  return <AnimatePresence>
    {open && (
      <motion.div
        className="fixed inset-0 z-[120] flex items-center justify-center p-5 md:p-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        role="dialog"
        aria-modal="true"
        aria-label="Atom X Eve Global Comms"
      >
        <button
          type="button"
          aria-label="Close clan communications"
          className="absolute inset-0 cursor-default bg-black/70 backdrop-blur-2xl"
          style={{ WebkitBackdropFilter: 'blur(28px) saturate(120%)', backdropFilter: 'blur(28px) saturate(120%)' }}
          onClick={onClose}
        />
        <motion.section
          initial={{ opacity: 0, y: 18, scale: .985 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 12, scale: .99 }}
          transition={{ duration: .2, ease: 'easeOut' }}
          className="relative z-10 flex h-[min(720px,calc(100vh-120px))] w-[min(1120px,calc(100vw-64px))] flex-col overflow-hidden rounded-[24px] border border-white/[0.08] bg-[#080c12]/95 shadow-[0_34px_110px_rgba(0,0,0,.72)] backdrop-blur-3xl"
        >
          <header className="flex h-16 shrink-0 items-center gap-3 border-b border-white/[0.07] bg-black/20 px-5">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-white/[0.05] text-cyan-200/80">
              <MessageSquare className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <div className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/35">{clan?.name || 'Clan Communications'}</div>
              <h2 className="truncate text-sm font-semibold text-white/90">Atom X Eve Global Comms</h2>
            </div>
            <div className="ml-auto hidden text-[10px] text-white/35 md:block">Clan-wide communications overlay</div>
            <button
              type="button"
              onClick={onClose}
              className="ml-2 grid h-9 w-9 place-items-center rounded-xl bg-white/[0.045] text-white/45 transition hover:bg-white/[0.09] hover:text-white"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </header>
          <div className="min-h-0 flex-1 p-3">
            {clan ? (
              <ClanChatHub clan={clan} myRole={myRole} />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-white/40">Loading clan communications…</div>
            )}
          </div>
        </motion.section>
      </motion.div>
    )}
  </AnimatePresence>;
}

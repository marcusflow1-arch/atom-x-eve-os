import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createPageUrl } from '@/utils';
import { X, Copy, Link as LinkIcon, Mic, FileText } from 'lucide-react';

export default function InviteModal({ open, onClose, game }) {
  if (!open) return null;

  const makeLink = (zone) => {
    const base = window.location.origin + createPageUrl('Clan');
    const params = new URLSearchParams({ gameId: game?.id || '', zone });
    return `${base}?${params.toString()}`;
  };

  const copy = async (text) => {
    try { await navigator.clipboard.writeText(text); } catch {}
  };

  const voiceLink = makeLink('voice');
  const formsLink = makeLink('forms');

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-2xl border border-white/10 bg-slate-900/80 backdrop-blur-xl p-6 shadow-2xl">
        <button onClick={onClose} className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center">
          <X className="w-4 h-4 text-white/80" />
        </button>
        <div className="space-y-6">
          <div>
            <h3 className="text-white font-bold text-xl mb-1">Invite teammates</h3>
            <p className="text-white/60 text-sm">Share a direct link that opens your Clan to this game and section.</p>
          </div>

          <div className="space-y-3">
            <label className="text-xs font-bold text-white/40 uppercase">Voice Channel Link</label>
            <div className="flex gap-2">
              <Input readOnly value={voiceLink} className="text-xs" />
              <Button onClick={() => copy(voiceLink)} className="gap-2"><Copy className="w-4 h-4" /> Copy</Button>
            </div>
            <p className="text-white/40 text-xs flex items-center gap-2"><Mic className="w-3 h-3" /> Opens the game with Voice section active so they can join quickly.</p>
          </div>

          <div className="space-y-3">
            <label className="text-xs font-bold text-white/40 uppercase">Clan Forms Link</label>
            <div className="flex gap-2">
              <Input readOnly value={formsLink} className="text-xs" />
              <Button onClick={() => copy(formsLink)} className="gap-2"><Copy className="w-4 h-4" /> Copy</Button>
            </div>
            <p className="text-white/40 text-xs flex items-center gap-2"><FileText className="w-3 h-3" /> Opens the game with Clan Forms for cross-clan coordination.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
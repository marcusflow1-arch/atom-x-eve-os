import React from 'react';
import { ArrowLeft, ArrowLeftRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import TradingPostContent from '@/components/store/TradingPostContent';

export default function TradingPost() {
  const navigate = useNavigate();

  return (
    <div className="relative h-screen w-full overflow-hidden bg-[#171a1f] text-white">
      <header className="absolute left-0 right-0 top-0 z-30 flex h-14 items-center justify-between bg-[#20242a]/80 px-5 shadow-[0_12px_45px_rgba(0,0,0,.22)] backdrop-blur-2xl md:px-8">
        <button
          type="button"
          onClick={() => navigate(createPageUrl('Store'))}
          className="flex h-10 items-center gap-2 rounded-xl px-2 text-[9px] font-bold uppercase tracking-[.18em] text-white/40 transition hover:bg-white/[0.04] hover:text-white"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Store
        </button>
        <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[.22em] text-sky-200/65">
          <ArrowLeftRight className="h-3.5 w-3.5" /> Platform Card Exchange
        </div>
      </header>

      <div className="h-full pt-14">
        <TradingPostContent />
      </div>
    </div>
  );
}

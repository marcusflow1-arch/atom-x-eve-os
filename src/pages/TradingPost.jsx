import React from 'react';
import { ArrowLeft, Store } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import TradingPostContent from '@/components/store/TradingPostContent';

export default function TradingPost() {
  const navigate = useNavigate();

  return (
    <div className="relative h-screen w-full overflow-hidden bg-[#05080d] text-white">
      <header className="absolute left-0 right-0 top-0 z-30 flex h-14 items-center justify-between bg-black/35 px-5 backdrop-blur-xl md:px-8">
        <button
          type="button"
          onClick={() => navigate(createPageUrl('Store'))}
          className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-[.18em] text-white/40 transition hover:text-white"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Storefront
        </button>
        <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[.22em] text-cyan-200/70">
          <Store className="h-3.5 w-3.5" /> Convention Floor
        </div>
      </header>

      <div className="h-full pt-14">
        <TradingPostContent />
      </div>
    </div>
  );
}

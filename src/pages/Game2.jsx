import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import Game2Duel from '@/components/game2/Game2Duel';

export default function Game2() {
  const navigate = useNavigate();
  return (
    <main className="flex h-screen min-h-0 flex-col bg-[#05080d] text-white">
      <header className="flex h-12 shrink-0 items-center gap-3 border-b border-white/10 bg-[#08111b] px-4">
        <button
          type="button"
          onClick={() => navigate(createPageUrl('LunaTemplate'))}
          className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-white/60 transition hover:bg-white/5 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Luna
        </button>
        <div className="h-5 w-px bg-white/10" />
        <div>
          <div className="text-sm font-semibold">Game 2</div>
          <div className="text-[10px] text-white/35">Single player missions · Multiplayer Dark Jedi duel · Jedi Outcast saber and Force rules</div>
        </div>
      </header>
      <section className="relative min-h-0 flex-1">
        <Game2Duel />
      </section>
    </main>
  );
}

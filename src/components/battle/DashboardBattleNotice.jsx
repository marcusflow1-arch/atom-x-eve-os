import useBattleArena from './useBattleArena';
import { openAIBattle, useArenaPresentation } from './arenaPresentation';
import { Swords, Users } from 'lucide-react';
export default function DashboardBattleNotice(){
  const {hub,user}=useBattleArena(),presentation=useArenaPresentation();
  const encounter=hub?.encounters?.find(r=>['lobby','active'].includes(r.status)&&!r.declined.includes(user?.id));
  if(presentation.visible||!encounter)return null;
  const joined=encounter.players.some(p=>p.id===user?.id);
  return <button type="button" onClick={()=>openAIBattle(encounter.id)}
    className="pointer-events-auto absolute top-16 left-1/2 z-40 flex max-w-[85%] -translate-x-1/2 items-center gap-3 rounded-xl border border-cyan-200/20 bg-slate-950/90 px-4 py-3 text-left text-white shadow-xl backdrop-blur-xl">
    {joined?<Swords size={18} className="text-cyan-200"/>:<Users size={18} className="text-amber-200"/>}
    <span><strong className="block text-xs">{joined?'Resume AI Battle':encounter.host_name+' invited you to battle'}</strong><span className="text-[11px] text-slate-400">{encounter.route.title} · {joined?'Open arena':'View invitation'}</span></span>
  </button>;
}

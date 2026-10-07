import React, { useCallback, useState } from 'react';
import { ArrowLeft, RotateCcw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import StarWarsMissionRuntime from '@/components/starwars/StarWarsMissionRuntime';

export default function StarWars(){
  const navigate=useNavigate();
  const [runKey,setRunKey]=useState(0);
  const [complete,setComplete]=useState(false);
  const restart=useCallback(()=>{setComplete(false);setRunKey(v=>v+1);},[]);
  return <main className="fixed inset-0 z-[200000] overflow-hidden bg-black">
    <StarWarsMissionRuntime key={runKey} onMissionComplete={()=>setComplete(true)} />
    <div className="absolute right-4 top-4 z-20 flex gap-2">
      <button type="button" onClick={restart} className="inline-flex items-center gap-2 border border-white/10 bg-slate-950/75 px-3 py-2 text-[11px] font-semibold text-white/70 backdrop-blur-xl hover:bg-white/10 hover:text-white">
        <RotateCcw className="h-3.5 w-3.5" /> Restart Mission
      </button>
      <button type="button" onClick={()=>navigate(createPageUrl('LunaTemplate'))} className="inline-flex items-center gap-2 border border-white/10 bg-slate-950/75 px-3 py-2 text-[11px] font-semibold text-white/70 backdrop-blur-xl hover:bg-white/10 hover:text-white">
        <ArrowLeft className="h-3.5 w-3.5" /> Dashboard
      </button>
    </div>
    {complete&&<div className="pointer-events-none absolute inset-x-0 top-20 z-20 mx-auto w-fit border border-cyan-200/15 bg-slate-950/80 px-5 py-3 text-center backdrop-blur-xl">
      <div className="text-[10px] uppercase tracking-[.3em] text-cyan-200/55">Kejim Post</div>
      <div className="mt-1 text-sm font-semibold text-white">Mission objective test complete</div>
    </div>}
  </main>;
}

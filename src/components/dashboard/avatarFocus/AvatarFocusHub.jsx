import React, { useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Activity, Backpack, BarChart3, Bot, ChevronRight, CircleDot, Crosshair, Crown, Dumbbell, Gem, Heart, Shield, Sparkles, Swords, Target, Trophy, UserRound, X, Zap } from 'lucide-react';
import Mini3DViewerBox from '../Mini3DViewerBox';

const GLASS = { background: 'linear-gradient(135deg, rgba(255,255,255,.115), rgba(255,255,255,.035))', backdropFilter: 'blur(26px) saturate(175%)', WebkitBackdropFilter: 'blur(26px) saturate(175%)', border: '1px solid rgba(255,255,255,.14)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,.18), 0 18px 50px rgba(0,0,0,.24)' };
const STATS = [
  ['HP', '920 / 1,000', 92, Heart], ['Strength', '84', 84, Dumbbell], ['Energy', '760 / 900', 84, Zap],
  ['Defense', '71', 71, Shield], ['Level', '42', 68, Crown], ['Progression', '68%', 68, Activity]
];
const ACTIONS = [
  ['stats', 'Stats', 'Attributes', BarChart3], ['equipment', 'Equipment', 'Loadout', Shield], ['skills', 'Skills', 'Abilities', Sparkles],
  ['inventory', 'Inventory', 'Items', Backpack], ['progression', 'Progress', 'Growth', Trophy], ['profile', 'AI Profile', 'Identity', UserRound]
];
const EQUIPMENT = [['Head', 'Neural Crown', Crown], ['Core', 'Adaptive Reactor', Gem], ['Arms', 'Aegis Bracers', Swords], ['Body', 'Luna Shell', Shield], ['Module', 'Focus Matrix', Target], ['Companion', 'Orbit Drone', Bot]];

function GlassCard({ children, className = '', style = {} }) { return <div className={`rounded-2xl text-white ${className}`} style={{ ...GLASS, ...style }}>{children}</div>; }

function StatPanel({ onSelect }) {
  return <GlassCard className="h-full p-4 overflow-hidden">
    <div className="flex items-center justify-between mb-4"><div><p className="text-[9px] uppercase tracking-[.24em] text-white/40">AI Avatar</p><h2 className="text-lg font-semibold">Luna Core Stats</h2></div><div className="flex items-center gap-1.5 rounded-full px-2 py-1 bg-cyan-300/10 border border-cyan-200/15"><CircleDot className="w-3 h-3 text-cyan-300"/><span className="text-[8px] uppercase tracking-wider text-cyan-200/80">Online</span></div></div>
    <div className="space-y-3 overflow-y-auto pr-1 max-h-[calc(100%-64px)] custom-scrollbar">
      {STATS.map(([label, value, progress, Icon]) => <button key={label} onClick={() => onSelect(label)} className="w-full text-left rounded-xl p-2.5 bg-white/[.035] border border-white/[.07] hover:bg-white/[.075] hover:border-cyan-200/20 transition-all"><div className="flex items-center justify-between mb-1.5"><span className="flex items-center gap-1.5 text-[10px] text-white/55 uppercase tracking-wider"><Icon className="w-3.5 h-3.5 text-cyan-200/65"/>{label}</span><span className="text-[10px] font-semibold text-white/85">{value}</span></div><div className="h-1.5 rounded-full bg-white/[.07] overflow-hidden"><motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: .7 }} className="h-full rounded-full bg-gradient-to-r from-cyan-300/70 to-violet-300/70"/></div></button>)}
    </div>
  </GlassCard>;
}

function EquipmentPanel() {
  return <GlassCard className="h-full p-4 overflow-hidden"><div className="flex items-center justify-between mb-4"><div><p className="text-[9px] uppercase tracking-[.24em] text-white/40">Avatar Loadout</p><h2 className="text-lg font-semibold">Equipment</h2></div><Backpack className="w-5 h-5 text-cyan-200/60"/></div><div className="grid grid-cols-2 gap-2 overflow-y-auto max-h-[calc(100%-64px)] custom-scrollbar">{EQUIPMENT.map(([slot, item, Icon]) => <div key={slot} className="rounded-xl p-3 bg-white/[.035] border border-white/[.07] hover:bg-white/[.07] transition-colors"><div className="w-9 h-9 rounded-lg bg-white/[.06] border border-white/[.08] flex items-center justify-center mb-2"><Icon className="w-4 h-4 text-cyan-200/70"/></div><p className="text-[8px] uppercase tracking-wider text-white/35">{slot}</p><p className="text-[10px] text-white/85 mt-0.5 truncate">{item}</p></div>)}</div></GlassCard>;
}

function ContextPanel({ mode }) {
  const data = { skills: ['Adaptive Intelligence','Combat Reflex','Environmental Scan','Companion Link'], inventory: ['Quantum Shard','Luna Core','Repair Nanites','Focus Token'], progression: ['Combat Mastery','World Exploration','Social Bond','AI Evolution'], profile: ['Identity Matrix','Personality','Memory Core','Relationship Bond'] };
  const titles = { skills: 'Skill Matrix', inventory: 'Inventory', progression: 'Progression', profile: 'AI Profile' };
  const icons = { skills: Sparkles, inventory: Backpack, progression: Trophy, profile: UserRound };
  const Icon = icons[mode] || Sparkles;
  return <GlassCard className="h-full p-4 overflow-hidden"><div className="flex items-center justify-between mb-4"><div><p className="text-[9px] uppercase tracking-[.24em] text-white/40">AI Avatar Workspace</p><h2 className="text-lg font-semibold">{titles[mode]}</h2></div><Icon className="w-5 h-5 text-cyan-200/60"/></div><div className="space-y-2 overflow-y-auto max-h-[calc(100%-64px)] custom-scrollbar">{data[mode].map((item, i) => <div key={item} className="flex items-center gap-3 rounded-xl p-3 bg-white/[.035] border border-white/[.07]"><div className="w-8 h-8 rounded-lg bg-cyan-300/[.08] border border-cyan-200/[.12] flex items-center justify-center"><span className="text-[10px] font-semibold text-cyan-200/70">0{i + 1}</span></div><div className="min-w-0 flex-1"><p className="text-[10px] text-white/85 truncate">{item}</p><p className="text-[8px] text-white/35 mt-0.5">Ready to configure</p></div><ChevronRight className="w-3.5 h-3.5 text-white/25"/></div>)}</div></GlassCard>;
}

export default function AvatarFocusHub({ onClose }) {
  const [activePanel, setActivePanel] = useState('stats');
  const [selectedStat, setSelectedStat] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const drag = useRef(null);
  const panel = useMemo(() => activePanel === 'equipment' ? <EquipmentPanel/> : ['skills','inventory','progression','profile'].includes(activePanel) ? <ContextPanel mode={activePanel}/> : <StatPanel onSelect={setSelectedStat}/>, [activePanel]);

  const onPointerDown = (e) => { if (e.button !== 0) return; drag.current = { x: e.clientX - pan.x, y: e.clientY - pan.y }; e.currentTarget.setPointerCapture?.(e.pointerId); };
  const onPointerMove = (e) => { if (!drag.current) return; setPan({ x: e.clientX - drag.current.x, y: e.clientY - drag.current.y }); };
  const onPointerUp = () => { drag.current = null; };
  const onWheel = (e) => { e.preventDefault(); setZoom(z => Math.min(1.55, Math.max(.72, z - e.deltaY * .001))); };

  return <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: .25 }} className="absolute z-[55] pointer-events-auto" style={{ left: '330px', right: '8px', top: '64px', bottom: '32px' }}>
    <div className="absolute inset-0 rounded-[28px] bg-black/20 backdrop-blur-[2px]"/>
    <div className="relative h-full flex flex-col gap-3 p-3 overflow-hidden rounded-[28px]" style={{ background: 'linear-gradient(135deg, rgba(9,15,25,.48), rgba(7,10,17,.25))', border: '1px solid rgba(255,255,255,.07)' }}>
      <div className="flex items-center gap-2 shrink-0">
        <div className="flex items-center gap-2 mr-1 px-2"><div className="w-8 h-8 rounded-xl flex items-center justify-center" style={GLASS}><Bot className="w-4 h-4 text-cyan-200/80"/></div><div><p className="text-[8px] uppercase tracking-[.22em] text-white/35">Environment Hub</p><p className="text-[11px] font-semibold text-white/80">AI Avatar Controls</p></div></div>
        <div className="flex-1 flex gap-2 overflow-x-auto no-scrollbar">{ACTIONS.map(([id,label,hint,Icon]) => <button key={id} onClick={() => { setActivePanel(id); setSelectedStat(null); }} className={`shrink-0 w-[92px] h-[58px] rounded-2xl px-2.5 text-left transition-all ${activePanel === id ? 'ring-1 ring-cyan-200/30' : ''}`} style={{ ...GLASS, background: activePanel === id ? 'linear-gradient(135deg, rgba(103,232,249,.15), rgba(168,85,247,.10))' : GLASS.background }}><Icon className={`w-4 h-4 mb-1 ${activePanel === id ? 'text-cyan-200' : 'text-white/55'}`}/><p className="text-[9px] font-semibold text-white/85">{label}</p><p className="text-[7px] text-white/35 uppercase tracking-wider">{hint}</p></button>)}</div>
        <button onClick={onClose} className="w-9 h-9 shrink-0 rounded-full flex items-center justify-center hover:bg-white/[.09] transition-colors" style={GLASS}><X className="w-4 h-4 text-white/65"/></button>
      </div>

      <div className="flex-1 min-h-0 grid grid-cols-[minmax(0,1fr)_280px] gap-3 relative">
        <GlassCard className="relative min-h-0 overflow-hidden">
          <div className="absolute top-3 left-3 z-10 flex items-center gap-2 rounded-full px-2.5 py-1.5 bg-black/20 border border-white/[.08] backdrop-blur-xl"><Activity className="w-3 h-3 text-cyan-200/70"/><span className="text-[8px] uppercase tracking-[.18em] text-white/45">Interactive 3D Whiteboard</span></div>
          <div className="absolute bottom-3 left-3 z-10 flex items-center gap-2 rounded-full px-2.5 py-1.5 bg-black/20 border border-white/[.08] backdrop-blur-xl"><Crosshair className="w-3 h-3 text-white/45"/><span className="text-[8px] text-white/35">Drag to move · scroll to zoom</span></div>
          <div className="absolute bottom-3 right-3 z-10 flex items-center gap-1"><button onClick={() => setZoom(z => Math.max(.72, z - .1))} className="w-7 h-7 rounded-full text-white/60" style={GLASS}>−</button><button onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }} className="px-2 h-7 rounded-full text-[8px] text-white/55" style={GLASS}>RESET</button><button onClick={() => setZoom(z => Math.min(1.55, z + .1))} className="w-7 h-7 rounded-full text-white/60" style={GLASS}>+</button></div>
          <div className="absolute inset-0 overflow-hidden cursor-grab active:cursor-grabbing" onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerUp} onWheel={onWheel}>
            <div className="absolute inset-0" style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, transformOrigin: 'center center', transition: drag.current ? 'none' : 'transform .12s ease-out' }}><Mini3DViewerBox isUiVisible hostName="Luna"/></div>
          </div>
        </GlassCard>
        <div className="min-h-0"><AnimatePresence mode="wait"><motion.div key={activePanel} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={{ duration: .2 }} className="h-full">{panel}</motion.div></AnimatePresence></div>
      </div>

      <AnimatePresence>{selectedStat && <motion.div initial={{ opacity: 0, scale: .98, y: 8 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: .98, y: 8 }} className="absolute inset-3 z-30 rounded-[24px] p-6 flex items-center justify-center bg-black/45 backdrop-blur-xl"><div className="w-full max-w-2xl rounded-3xl p-6" style={GLASS}><div className="flex items-start justify-between mb-5"><div><p className="text-[9px] uppercase tracking-[.25em] text-white/35">Detailed Attribute</p><h3 className="text-2xl font-semibold mt-1">{selectedStat}</h3></div><button onClick={() => setSelectedStat(null)} className="w-9 h-9 rounded-full bg-white/[.06] flex items-center justify-center"><X className="w-4 h-4 text-white/60"/></button></div><div className="grid grid-cols-3 gap-3">{['Current','Base','Potential'].map((label, i) => <div key={label} className="rounded-2xl p-4 bg-white/[.035] border border-white/[.07]"><p className="text-[8px] uppercase tracking-wider text-white/35">{label}</p><p className="text-xl font-semibold mt-1">{i === 0 ? '92%' : i === 1 ? '78%' : '100%'}</p></div>)}</div><p className="text-[10px] text-white/45 leading-relaxed mt-5">The selected attribute expands as a liquid-glass overlay while the 3D avatar remains visible underneath. Close it to return to the same workspace state.</p></div></motion.div>}</AnimatePresence>
    </div>
  </motion.div>;
}

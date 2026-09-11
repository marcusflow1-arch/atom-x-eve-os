import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Brain, Check, ChevronRight, Loader2, Shield, Sparkles } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const CHOICES = [
  {
    id: 'female',
    title: 'Eve',
    subtitle: 'Female starting form',
    description: 'A blank AI avatar. Her personality, combat habits, memories, and style will be shaped by how you play.',
    glow: 'from-violet-400/20 via-fuchsia-400/10 to-transparent'
  },
  {
    id: 'male',
    title: 'Atum',
    subtitle: 'Male starting form',
    description: 'A blank AI avatar. His personality, combat habits, memories, and style will be shaped by how you play.',
    glow: 'from-cyan-400/20 via-blue-400/10 to-transparent'
  }
];

export default function AvatarGenesisGate({ user, children }) {
  const [status, setStatus] = useState('checking');
  const [selected, setSelected] = useState(null);
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    async function check() {
      if (!user?.id) return;
      try {
        const avatars = await base44.entities.Avatar.filter({ user_id: user.id }, '-created_date', 1);
        if (!active) return;
        setStatus(avatars?.length ? 'ready' : 'setup');
      } catch (err) {
        if (!active) return;
        setError(err?.message || 'Could not verify avatar initialization.');
        setStatus('setup');
      }
    }
    check();
    return () => { active = false; };
  }, [user?.id]);

  const createAvatar = async () => {
    if (!selected) return;
    setStatus('creating');
    setError('');
    try {
      const response = await base44.functions.invoke('avatarSystem', {
        action: 'initializeAvatar',
        gender: selected,
        name: name.trim() || (selected === 'female' ? 'Eve' : 'Atum')
      });
      const data = response?.data || response;
      if (!data?.success) throw new Error(data?.error || 'Avatar initialization failed.');
      localStorage.setItem('atom_eve_onboarding_complete', 'true');
      setStatus('ready');
    } catch (err) {
      setError(err?.message || 'Avatar initialization failed.');
      setStatus('setup');
    }
  };

  if (status === 'ready') return children;
  if (status === 'checking') return <div className="fixed inset-0 z-[9999] grid place-items-center bg-[#05070b] text-white"><div className="flex items-center gap-3 text-xs uppercase tracking-[.22em] text-white/40"><Loader2 className="w-4 h-4 animate-spin"/>Initializing Atom × Eve</div></div>;

  return <div className="fixed inset-0 z-[9999] overflow-y-auto bg-[#04060a] text-white">
    <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_25%_15%,rgba(34,211,238,.08),transparent_30%),radial-gradient(circle_at_75%_15%,rgba(168,85,247,.08),transparent_30%)]" />
    <div className="relative min-h-full max-w-6xl mx-auto px-6 py-12 lg:py-20 flex flex-col justify-center">
      <div className="grid lg:grid-cols-[1fr_1.35fr] gap-10 lg:gap-16 items-center">
        <section>
          <span className="text-[9px] uppercase tracking-[.32em] text-cyan-300/70">First Initialization</span>
          <h1 className="text-5xl lg:text-7xl font-black tracking-tight mt-4 leading-[.92]">Start blank.<br/><span className="text-white/35">Become you.</span></h1>
          <p className="text-sm lg:text-base text-white/45 leading-relaxed mt-6 max-w-xl">Your AI avatar begins with no earned identity. As you play through Atom × Eve, the system records supported gameplay decisions, achievements, equipment, abilities, companions, environments, and progression. Those signals become the avatar’s evolving reflection of your play style.</p>
          <div className="mt-8 space-y-3 text-xs text-white/55">
            {[['Decisions become behavior', Brain], ['Achievements become usable power', Sparkles], ['Your earned identity persists across worlds', Shield]].map(([label, Icon]) => <div key={label} className="flex items-center gap-3"><span className="w-8 h-8 grid place-items-center border border-white/[0.08] bg-white/[0.025]"><Icon className="w-3.5 h-3.5 text-cyan-200"/></span><span>{label}</span></div>)}
          </div>
        </section>

        <section className="border border-white/[0.08] bg-white/[0.018] p-5 lg:p-7 backdrop-blur-xl">
          <div className="flex items-end justify-between gap-4 mb-5"><div><span className="text-[8px] uppercase tracking-[.22em] text-white/30">Choose starting form</span><h2 className="text-xl font-black mt-1">Who wakes up first?</h2></div><span className="text-[9px] text-white/25">Appearance can evolve later</span></div>
          <div className="grid sm:grid-cols-2 gap-3">{CHOICES.map(choice => <button key={choice.id} onClick={() => setSelected(choice.id)} className={`relative min-h-64 text-left overflow-hidden border p-5 transition-all ${selected === choice.id ? 'border-cyan-300/40 bg-cyan-300/[0.055]' : 'border-white/[0.08] bg-black/10 hover:border-white/[0.16]'}`}><div className={`absolute inset-0 bg-gradient-to-b ${choice.glow} opacity-80`} /><div className="relative h-full flex flex-col"><div className="flex items-start justify-between"><span className="text-[8px] uppercase tracking-[.2em] text-white/30">Blank AI Form</span>{selected === choice.id && <span className="w-6 h-6 grid place-items-center bg-cyan-300 text-slate-950"><Check className="w-3.5 h-3.5"/></span>}</div><div className="mt-auto"><h3 className="text-3xl font-black">{choice.title}</h3><p className="text-[10px] uppercase tracking-[.16em] text-cyan-200/70 mt-1">{choice.subtitle}</p><p className="text-[11px] leading-relaxed text-white/40 mt-4">{choice.description}</p></div></div></button>)}</div>
          <label className="block mt-5"><span className="text-[8px] uppercase tracking-[.2em] text-white/30">Avatar name · optional</span><input value={name} onChange={e => setName(e.target.value)} maxLength={40} placeholder={selected === 'female' ? 'Eve' : selected === 'male' ? 'Atum' : 'Choose a form first'} className="mt-2 w-full h-11 bg-black/20 border border-white/[0.10] px-3 text-sm text-white outline-none focus:border-cyan-300/35"/></label>
          <AnimatePresence>{error && <motion.p initial={{opacity:0}} animate={{opacity:1}} className="mt-3 text-xs text-rose-300">{error}</motion.p>}</AnimatePresence>
          <button disabled={!selected || status === 'creating'} onClick={createAvatar} className="mt-5 h-12 w-full bg-white text-slate-950 font-black text-xs uppercase tracking-[.16em] flex items-center justify-center gap-2 disabled:opacity-25">{status === 'creating' ? <><Loader2 className="w-4 h-4 animate-spin"/>Creating blank avatar</> : <>Enter Atom × Eve<ChevronRight className="w-4 h-4"/></>}</button>
          <p className="text-[9px] text-white/25 leading-relaxed mt-3">Only gameplay and platform events that Atom × Eve can actually receive are processed. The avatar does not claim to observe unsupported external game events.</p>
        </section>
      </div>
    </div>
  </div>;
}

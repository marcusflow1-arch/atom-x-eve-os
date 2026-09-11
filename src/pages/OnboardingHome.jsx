import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight, Brain, Check, ChevronRight, Gamepad2, LogOut, Orbit, Shield,
  Sparkles, Trophy, UserRound, Zap
} from 'lucide-react';
import { createPageUrl } from '@/utils';
import { useAuth } from '@/components/auth/AuthContext';

const cores = [
  {
    id: 'female',
    name: 'Female Avatar Base',
    matrix: 'Neural Matrix A',
    accent: 'cyan',
    description: 'Blank adaptive core. Voice, appearance, tactics and personality evolve from your play history.',
  },
  {
    id: 'male',
    name: 'Male Avatar Base',
    matrix: 'Neural Matrix B',
    accent: 'fuchsia',
    description: 'Blank adaptive core. Your cross-game behavior becomes the blueprint for the avatar that emerges.',
  },
  {
    id: 'neutral',
    name: 'Neutral AI Core',
    matrix: 'Neural Matrix N',
    accent: 'violet',
    description: 'Identity-neutral starting shell designed to evolve entirely from observed gameplay behavior.',
  },
];

function CorePedestal({ core, selected, onSelect }) {
  const tone = core.accent === 'cyan'
    ? 'from-cyan-300/30 via-cyan-400/5 to-transparent text-cyan-100'
    : core.accent === 'fuchsia'
      ? 'from-fuchsia-300/25 via-fuchsia-400/5 to-transparent text-fuchsia-100'
      : 'from-violet-300/25 via-violet-400/5 to-transparent text-violet-100';

  return (
    <motion.button
      type="button"
      onClick={onSelect}
      whileHover={{ y: -6, scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      className={`group relative min-h-[390px] overflow-hidden text-left transition-all duration-300 ${selected ? 'bg-white/[0.055]' : 'bg-white/[0.018] hover:bg-white/[0.03]'}`}
    >
      <div className={`pointer-events-none absolute inset-x-0 top-0 h-56 bg-gradient-to-b ${tone}`} />
      <div className="pointer-events-none absolute inset-x-[10%] bottom-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />

      <div className="relative flex h-full flex-col p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-[8px] font-bold uppercase tracking-[.26em] text-white/30">{core.matrix}</div>
            <div className="mt-2 text-lg font-black text-white">{core.name}</div>
          </div>
          <div className={`grid h-8 w-8 place-items-center rounded-full ${selected ? 'bg-white text-black' : 'bg-white/[0.05] text-white/25'}`}>
            {selected ? <Check className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </div>
        </div>

        <div className="relative mx-auto mt-7 flex h-52 w-40 items-end justify-center">
          <div className="absolute bottom-0 h-8 w-36 rounded-[50%] bg-white/[0.06] blur-sm" />
          <div className={`absolute bottom-1 h-24 w-28 rounded-[50%] bg-gradient-to-t ${tone} blur-2xl opacity-70`} />
          <motion.div
            animate={{ y: [0, -5, 0] }}
            transition={{ repeat: Infinity, duration: 4.2, ease: 'easeInOut' }}
            className="relative h-44 w-28"
          >
            <div className="absolute left-1/2 top-0 h-16 w-16 -translate-x-1/2 rounded-full border border-white/15 bg-white/[0.035] backdrop-blur-xl" />
            <div className="absolute left-1/2 top-14 h-28 w-24 -translate-x-1/2 rounded-[42%_42%_20%_20%] border border-white/10 bg-white/[0.025] backdrop-blur-xl" />
            <div className="absolute left-1/2 top-24 h-px w-40 -translate-x-1/2 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
          </motion.div>
        </div>

        <div className="mt-auto">
          <p className="text-xs leading-5 text-white/40">{core.description}</p>
          <div className={`mt-4 text-[9px] font-bold uppercase tracking-[.2em] ${selected ? 'text-cyan-200' : 'text-white/25'}`}>{selected ? 'Core Selected' : 'Select Core'}</div>
        </div>
      </div>
    </motion.button>
  );
}

function ObservationSignal({ icon: Icon, title, detail }) {
  return (
    <div className="flex items-start gap-3 bg-white/[0.018] p-3">
      <div className="grid h-8 w-8 shrink-0 place-items-center bg-cyan-300/[0.06] text-cyan-200/70"><Icon className="h-3.5 w-3.5" /></div>
      <div><div className="text-[10px] font-bold text-white/70">{title}</div><div className="mt-1 text-[9px] leading-4 text-white/30">{detail}</div></div>
    </div>
  );
}

export default function OnboardingHome() {
  const navigate = useNavigate();
  const { user, avatar, updateUserData, logout } = useAuth();
  const [selectedCore, setSelectedCore] = useState(localStorage.getItem('atom_eve_ai_core') || null);
  const [initializing, setInitializing] = useState(false);
  const [error, setError] = useState('');

  const selected = useMemo(() => cores.find((core) => core.id === selectedCore), [selectedCore]);

  const initialize = async () => {
    if (!selectedCore || initializing) return;
    setInitializing(true);
    setError('');

    const payload = {
      ai_core_identity: selectedCore,
      neural_observation_enabled: true,
      onboarding_complete: true,
      neural_observation_started_at: new Date().toISOString(),
    };

    localStorage.setItem('atom_eve_ai_core', selectedCore);
    localStorage.setItem('atom_eve_neural_observation', 'enabled');
    localStorage.setItem('atom_eve_onboarding_complete', 'true');

    try {
      if (user) {
        const result = await updateUserData(payload);
        if (result && result.success === false) throw new Error(result.error || 'Profile could not be updated');
      }
      navigate(createPageUrl('LunaTemplate'));
    } catch (err) {
      console.error('AI core initialization failed:', err);
      setError('The local AI core was initialized, but cloud profile sync failed. You can retry initialization.');
    } finally {
      setInitializing(false);
    }
  };

  return (
    <div className="relative h-screen w-full overflow-hidden bg-[#05070B] text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_-10%,rgba(0,240,255,.13),transparent_35%),radial-gradient(circle_at_82%_30%,rgba(255,0,85,.08),transparent_28%),linear-gradient(180deg,#090D14_0%,#05070B_62%,#020305_100%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.18]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.025) 1px, transparent 1px)', backgroundSize: '42px 42px' }} />

      <header className="relative z-10 flex h-16 items-center justify-between px-5 md:px-8">
        <div className="flex items-center gap-3">
          <div className="grid h-8 w-8 place-items-center rounded-full bg-white text-black"><Orbit className="h-4 w-4" /></div>
          <div><div className="text-[9px] font-black uppercase tracking-[.34em] text-white/75">Atom × Eve</div><div className="text-[8px] uppercase tracking-[.2em] text-white/20">Neural Initialization</div></div>
        </div>
        <div className="flex items-center gap-3 text-[9px] uppercase tracking-[.18em] text-white/35">
          <span className="hidden sm:inline">User: {user?.username || user?.full_name || 'Player'}</span>
          <button onClick={logout} className="flex items-center gap-2 px-3 py-2 transition hover:bg-white/[0.04] hover:text-white"><LogOut className="h-3.5 w-3.5" /> Logout</button>
        </div>
      </header>

      <main className="relative z-10 mx-auto flex h-[calc(100vh-64px)] max-w-[1500px] flex-col overflow-y-auto px-5 pb-8 pt-5 md:px-8 lg:overflow-hidden">
        <div className="shrink-0 text-center">
          <div className="text-[9px] font-bold uppercase tracking-[.34em] text-cyan-200/55">First Boot · Identity Baseline</div>
          <h1 className="mt-3 text-3xl font-black tracking-tight md:text-5xl">Select Your AI Core Identity</h1>
          <p className="mx-auto mt-3 max-w-2xl text-xs leading-5 text-white/40 md:text-sm">This is only the starting shell. Your AI Avatar begins intentionally blank and learns who it becomes by observing how you play.</p>
        </div>

        <div className="mt-6 grid min-h-0 flex-1 gap-5 xl:grid-cols-[1fr_310px]">
          <section className="grid gap-3 md:grid-cols-3">
            {cores.map((core) => <CorePedestal key={core.id} core={core} selected={selectedCore === core.id} onSelect={() => setSelectedCore(core.id)} />)}
          </section>

          <aside className="flex min-h-0 flex-col bg-[#0F1115]/75 p-5 backdrop-blur-xl">
            <div className="flex items-center gap-2"><Brain className="h-4 w-4 text-cyan-200/70" /><span className="text-[9px] font-bold uppercase tracking-[.22em] text-white/45">Neural Observation</span></div>
            <h2 className="mt-3 text-xl font-black">Blank Canvas Protocol</h2>
            <p className="mt-2 text-[10px] leading-5 text-white/35">Once initialized, the AI observes your cross-game behavior and updates its personality, dialogue, visual presentation, and tactical tendencies.</p>

            <div className="mt-5 space-y-2">
              <ObservationSignal icon={Gamepad2} title="Tactical Choices" detail="Learns aggression, patience, positioning, weapon and ability preferences." />
              <ObservationSignal icon={Zap} title="Pacing & Reflex Pattern" detail="Tracks how quickly you act, explore, react and adapt under pressure." />
              <ObservationSignal icon={Trophy} title="Achievement Utility" detail="Achievements feed real equipment, abilities, companions, environments and teachers into the avatar system." />
              <ObservationSignal icon={Shield} title="Persistent Identity" detail="The same AI identity carries your learned style and unlocked utility across supported games." />
            </div>

            <div className="mt-auto pt-5">
              <div className="bg-white/[0.02] p-3">
                <div className="text-[8px] uppercase tracking-[.18em] text-white/25">Selected Core</div>
                <div className="mt-1 text-sm font-bold text-white/75">{selected?.name || 'No core selected'}</div>
                <div className="mt-0.5 text-[9px] text-cyan-200/45">{selected?.matrix || 'Select a pedestal to continue'}</div>
              </div>
              {error && <div className="mt-3 bg-rose-400/[0.05] p-3 text-[9px] leading-4 text-rose-200/70">{error}</div>}
              <button
                onClick={initialize}
                disabled={!selectedCore || initializing}
                className="mt-3 flex h-12 w-full items-center justify-center gap-2 bg-white text-[10px] font-black uppercase tracking-[.16em] text-black transition hover:bg-cyan-100 disabled:cursor-not-allowed disabled:bg-white/[0.06] disabled:text-white/20"
              >
                {initializing ? <><Sparkles className="h-4 w-4 animate-pulse" /> Initializing Neural Core…</> : <>Initialize Neural Observation <ArrowRight className="h-4 w-4" /></>}
              </button>
              <div className="mt-2 text-center text-[8px] uppercase tracking-[.16em] text-white/18">Avatar record: {avatar?.name || 'new adaptive core'}</div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Brain, Eye, EyeOff, Sparkles, ShieldCheck, History, MessageCircleQuestion, Gauge, ScanEye } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/components/auth/AuthContext';
import {
  getAvatarScreenObserverState,
  startAvatarScreenObserver,
  stopAvatarScreenObserver,
  subscribeAvatarScreenObserver,
} from '@/lib/avatarScreenObserver';

const AGENT_ICON = { observer: ScanEye, mirror: Brain, historian: History, reflection: MessageCircleQuestion, coach: Gauge, storyteller: Sparkles };
const STAGE_LABEL = { blank: 'Blank Seed', awakening: 'Awakening', forming: 'Identity Forming', growing: 'Growing Mind', self_directed: 'Self-Directed' };
const dataOf = (response) => response?.data || response || {};

export default function AvatarMindPanel() {
  const { user } = useAuth();
  const [mind, setMind] = useState(null);
  const [loading, setLoading] = useState(true);
  const [observer, setObserver] = useState(() => getAvatarScreenObserverState());

  const loadMind = useCallback(async () => {
    if (!user?.id) return;
    try {
      const response = await base44.functions.invoke('avatarMindCore', { action: 'getMind', payload: {} });
      const data = dataOf(response);
      if (!data.error) setMind(data);
    } catch (error) {
      console.warn('Could not load avatar mind:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => { loadMind(); }, [loadMind]);
  useEffect(() => subscribeAvatarScreenObserver(setObserver), []);
  useEffect(() => {
    const listener = () => loadMind();
    window.addEventListener('atom:mind-updated', listener);
    return () => window.removeEventListener('atom:mind-updated', listener);
  }, [loadMind]);

  const updateSettings = useCallback(async (patch) => {
    const response = await base44.functions.invoke('avatarMindCore', { action: 'updateSettings', payload: patch });
    const data = dataOf(response);
    if (data?.settings) setMind((previous) => previous ? { ...previous, settings: data.settings } : previous);
    return data;
  }, []);

  const toggleObserver = async () => {
    if (observer.active) {
      await stopAvatarScreenObserver();
      await loadMind();
      return;
    }
    await startAvatarScreenObserver({ sampleSeconds: mind?.settings?.screen_sample_seconds || 15 });
    await loadMind();
  };

  const seed = mind?.seed || {};
  const settings = mind?.settings || {};
  const agents = mind?.agents || [];
  const stage = STAGE_LABEL[seed.development_stage] || 'Blank Seed';
  const topSignals = useMemo(() => {
    const collect = (domain = {}) => Object.entries(domain || {}).map(([key, value]) => ({ key, score: Number(value?.score ?? 50), evidence: Number(value?.evidence ?? 0) }));
    return [...collect(seed.values), ...collect(seed.playstyle)]
      .filter((item) => item.evidence > 0)
      .sort((a, b) => b.evidence - a.evidence)
      .slice(0, 5);
  }, [seed.values, seed.playstyle]);

  if (loading) return <div className="border border-white/[0.06] bg-white/[0.02] p-5 text-xs text-white/30">Waking the avatar mind…</div>;

  return (
    <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mb-8 overflow-hidden border border-cyan-100/[0.07] bg-[linear-gradient(135deg,rgba(11,18,27,.76),rgba(13,24,34,.52),rgba(6,11,18,.78))] backdrop-blur-2xl">
      <div className="grid xl:grid-cols-[1.2fr_.8fr]">
        <div className="border-b border-white/[0.05] p-5 xl:border-b-0 xl:border-r">
          <div className="flex flex-wrap items-start gap-4">
            <div className="grid h-11 w-11 place-items-center rounded-full bg-cyan-100/[0.07]"><Brain className="h-5 w-5 text-cyan-100/70" /></div>
            <div className="min-w-0 flex-1">
              <div className="text-[8px] font-black uppercase tracking-[.24em] text-cyan-100/42">AI Mind Seed · {stage}</div>
              <h2 className="mt-1 text-xl font-black text-white/90">A mind with a history, not a preset personality.</h2>
              <p className="mt-2 max-w-3xl text-xs leading-5 text-white/34">The avatar begins neutral. Specialist agents observe, remember, reflect and coach; the long-term seed changes only as evidence accumulates across games and your own answers.</p>
            </div>
            <div className="min-w-[110px] text-right"><span className="text-[8px] uppercase tracking-[.16em] text-white/22">Identity confidence</span><strong className="mt-1 block text-2xl font-light text-cyan-100/80">{Math.round(seed.confidence || 0)}%</strong></div>
          </div>

          <div className="mt-5 grid gap-px bg-white/[0.045] sm:grid-cols-4">
            {[['Observations', seed.observation_count || 0], ['Memory anchors', mind?.memory_anchors?.length || 0], ['Questions answered', seed.answered_question_count || 0], ['Key stage', stage]].map(([label, value]) => (
              <div key={label} className="bg-[#081019]/78 px-4 py-3"><span className="text-[8px] uppercase tracking-[.14em] text-white/22">{label}</span><strong className="mt-1 block text-sm text-white/72">{value}</strong></div>
            ))}
          </div>

          <div className="mt-5"><div className="text-[8px] font-black uppercase tracking-[.2em] text-white/24">Current autobiography</div><p className="mt-2 text-sm leading-6 text-white/58">{seed.identity_summary || 'There is no autobiography yet. The seed is intentionally blank and will not pretend to know you before it has evidence.'}</p></div>

          {topSignals.length > 0 && <div className="mt-4 flex flex-wrap gap-2">{topSignals.map((item) => <span key={item.key} className="border border-white/[0.06] bg-white/[0.025] px-2.5 py-1 text-[9px] text-white/42">{item.key.replace(/_/g, ' ')} · {Math.round(item.score)} <span className="text-white/20">({item.evidence})</span></span>)}</div>}

          <div className="mt-5 grid gap-2 sm:grid-cols-3">{agents.map((agent) => {
            const Icon = AGENT_ICON[agent.agent_key] || Brain;
            return <div key={agent.id || agent.agent_key} title={agent.job} className="flex items-center gap-2 border border-white/[0.045] bg-white/[0.018] px-3 py-2"><Icon className="h-3.5 w-3.5 text-cyan-100/45" /><div className="min-w-0"><strong className="block truncate text-[9px] capitalize text-white/58">{agent.agent_key}</strong><span className="block truncate text-[8px] text-white/20">{agent.run_count || 0} runs</span></div></div>;
          })}</div>
        </div>

        <div className="p-5">
          <div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-emerald-200/55" /><span className="text-[8px] font-black uppercase tracking-[.22em] text-white/34">Observation controls</span></div>
          <p className="mt-3 text-xs leading-5 text-white/34">Atom-native games can send structured choices automatically. Screen learning is separate and always requires you to choose a window or screen in the browser.</p>

          <button type="button" onClick={toggleObserver} className={`mt-5 flex h-11 w-full items-center justify-center gap-2 border text-[9px] font-black uppercase tracking-[.16em] transition ${observer.active ? 'border-rose-300/20 bg-rose-300/[0.08] text-rose-100/75' : 'border-cyan-100/[0.11] bg-cyan-100/[0.06] text-cyan-50/75 hover:bg-cyan-100/[0.1]'}`}>
            {observer.active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}{observer.active ? 'Stop screen learning' : 'Observe a game window'}
          </button>

          <div className="mt-3 flex items-center justify-between gap-3 border-t border-white/[0.045] pt-3">
            <div><div className="text-[9px] text-white/48">Reflection questions</div><div className="text-[8px] text-white/20">The avatar asks instead of guessing.</div></div>
            <select value={settings.reflection_frequency || 'normal'} onChange={(event) => updateSettings({ reflection_frequency: event.target.value })} className="border border-white/[0.06] bg-[#0a131c] px-2 py-1.5 text-[9px] text-white/55 outline-none"><option value="low">Low</option><option value="normal">Normal</option><option value="high">High</option></select>
          </div>

          <label className="mt-3 flex cursor-pointer items-center justify-between gap-3"><div><div className="text-[9px] text-white/48">Keep sampled frame references</div><div className="text-[8px] leading-4 text-white/20">Off keeps the frame URL out of the avatar's memory record.</div></div><input type="checkbox" checked={Boolean(settings.store_frames)} onChange={(event) => updateSettings({ store_frames: event.target.checked })} /></label>

          <p className="mt-4 text-[8px] leading-4 text-white/18">Screen learning samples still images rather than recording continuous video. A sampled image must be uploaded for vision analysis, so the uploaded file may remain in app file storage even when its URL is not attached to the avatar's memory. Screen sharing continues across Atom × Eve pages until you stop it or the browser ends sharing.</p>
          {observer.analyzing && <p className="mt-3 text-[9px] text-cyan-100/45">Observer is reading a sampled frame…</p>}
          {observer.coachTip && <div className="mt-4 border-l border-cyan-100/20 bg-cyan-100/[0.035] px-3 py-2"><div className="text-[8px] uppercase tracking-[.16em] text-cyan-100/35">Coach noticed</div><p className="mt-1 text-[10px] leading-5 text-white/48">{observer.coachTip}</p></div>}
          {observer.error && <p className="mt-3 text-[9px] leading-4 text-rose-200/65">{observer.error}</p>}
        </div>
      </div>
    </motion.section>
  );
}

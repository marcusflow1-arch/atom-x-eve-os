import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Factory, Sparkles, Loader2, CheckCircle2, AlertTriangle, SkipForward,
  Cpu, Network, Layers, Wand2, BookMarked, ShieldCheck, ScrollText,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import KnowledgeStatusBanner from './KnowledgeStatusBanner';
import { buildSystemFromIdea, classifyRequest } from './autoSystemBuilder';
import { showError, showSuccess } from '@/components/error/ErrorToast';

// ─── Auto System Builder Tab ─────────────────────────────────────────────
// One input. One button. Full UE5 game system module out the other side.
export default function AutoSystemBuilderTab() {
  const [prompt, setPrompt] = useState('');
  const [busy, setBusy]     = useState(false);
  const [steps, setSteps]   = useState([]);
  const [result, setResult] = useState(null);

  const preview = prompt.trim() ? classifyRequest(prompt) : null;

  const handleBuild = async () => {
    if (!prompt.trim()) { showError('Describe the system you want to build.'); return; }
    setBusy(true);
    setSteps([]);
    setResult(null);
    try {
      const r = await buildSystemFromIdea(prompt, {
        onStep: (s) => setSteps((prev) => {
          const i = prev.findIndex((p) => p.name === s.name);
          if (i === -1) return [...prev, s];
          const next = [...prev]; next[i] = s; return next;
        }),
      });
      setResult(r);
      showSuccess(
        r.kernel?.validation?.passed
          ? `System "${r.kernel.saved.system_name}" v${r.kernel.saved.version} built & registered.`
          : `Built — saved as draft (fix violations to activate).`
      );
    } catch (err) {
      showError(err, 'Auto System Builder');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <KnowledgeStatusBanner />

      {/* Header */}
      <section className="bg-gradient-to-br from-indigo-950/40 via-slate-900/60 to-slate-900/40 border border-indigo-500/20 rounded-2xl p-6 mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Factory className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Auto System Builder</h2>
            <p className="text-slate-400 text-sm">
              One prompt → full UE5 system module. Classifier → Vector memory → UE5 architecture →
              Blueprint graphs → GAS → Kernel registration. No isolated systems, no ungrounded designs.
            </p>
          </div>
        </div>
      </section>

      {/* Input */}
      <section className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 mb-6">
        <div className="text-[10px] uppercase tracking-widest text-slate-500 mb-2">
          Describe the system to build
        </div>
        <Textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder='e.g. "create a fireball skill system" · "build a weapon upgrade system" · "design my Halo + Title + Skill synergy system" · "make MMO progression loop"'
          className="bg-slate-800 border-slate-700 min-h-[110px] text-sm"
          disabled={busy}
        />

        {/* Live classifier preview */}
        {preview && !busy && (
          <div className="mt-3 flex flex-wrap gap-1.5 text-[11px]">
            <Tag tone="indigo">{preview.primary_type}</Tag>
            {preview.secondary_types.map((t) => <Tag key={t} tone="slate">{t}</Tag>)}
            {preview.hybrid && <Tag tone="fuchsia">hybrid</Tag>}
            {preview.gas_required && <Tag tone="amber">GAS</Tag>}
            <Tag tone="cyan">complexity: {preview.complexity}</Tag>
            <Tag tone="emerald">id: {preview.suggested_system_id}</Tag>
          </div>
        )}

        <div className="flex items-center gap-3 mt-4">
          <Button onClick={handleBuild} disabled={busy} className="bg-indigo-600 hover:bg-indigo-700">
            {busy ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
            {busy ? 'Building System…' : 'Build System'}
          </Button>
          {!busy && !prompt && (
            <span className="text-[11px] text-slate-500">
              Tip: be specific — "fireball skill with burn DoT, mana cost, 8s cooldown, scales with Spirit"
            </span>
          )}
        </div>
      </section>

      {/* Pipeline trace */}
      {steps.length > 0 && (
        <section className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Cpu className="w-5 h-5 text-indigo-300" />
            <h3 className="text-lg font-semibold">Pipeline</h3>
          </div>
          <div className="space-y-1.5">
            <AnimatePresence initial={false}>
              {steps.map((s) => <StepRow key={s.name} step={s} />)}
            </AnimatePresence>
          </div>
        </section>
      )}

      {/* Result */}
      {result && <ResultPanel result={result} />}
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────
function StepRow({ step }) {
  const icons = {
    Classify:  Wand2,
    Architect: Layers,
    Blueprint: ScrollText,
    GAS:       Sparkles,
    Register:  ShieldCheck,
    Index:     BookMarked,
  };
  const Icon = icons[step.name] || Cpu;
  const tone = {
    running: 'border-indigo-500/30 bg-indigo-500/5',
    done:    'border-emerald-500/30 bg-emerald-500/5',
    warn:    'border-amber-500/30 bg-amber-500/5',
    skipped: 'border-slate-700 bg-slate-800/30',
  }[step.status] || 'border-slate-700';

  const Status = () => {
    if (step.status === 'running') return <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-300" />;
    if (step.status === 'done')    return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />;
    if (step.status === 'warn')    return <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />;
    if (step.status === 'skipped') return <SkipForward className="w-3.5 h-3.5 text-slate-500" />;
    return null;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
      className={`flex items-center gap-3 px-3 py-2 rounded-lg border ${tone}`}>
      <Icon className="w-4 h-4 text-slate-300" />
      <span className="text-sm text-slate-100 font-medium w-24">{step.name}</span>
      <span className="text-xs text-slate-400 flex-1 truncate">{step.detail || '…'}</span>
      <Status />
    </motion.div>
  );
}

function ResultPanel({ result }) {
  const { classification, architecture, blueprint_plan, gas, kernel, retrieval, module_doc } = result;
  const v = kernel?.validation;

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 space-y-5">
      <div className="flex items-center gap-2">
        <Network className="w-5 h-5 text-emerald-300" />
        <h3 className="text-lg font-semibold">System Module</h3>
        <span className="ml-auto text-xs text-slate-500">
          v{kernel?.saved?.version} · {kernel?.saved?.status}
        </span>
      </div>

      {/* Summary grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
        <Stat label="Type"     value={classification.primary_type} color="text-indigo-300" />
        <Stat label="Classes"  value={(architecture.class_architecture || []).length} color="text-cyan-300" />
        <Stat label="BP Graphs" value={(blueprint_plan.event_graphs || []).length + (blueprint_plan.function_graphs || []).length} color="text-violet-300" />
        <Stat label="Abilities" value={(gas?.abilities || []).length} color="text-amber-300" />
        <Stat label="Memory"   value={retrieval?.chunk_count || 0} color="text-emerald-300" />
        <Stat label="Deps"     value={(kernel?.saved?.dependencies || []).length} color="text-rose-300" />
        <Stat label="Connects" value={(kernel?.saved?.connected_systems || []).length} color="text-cyan-300" />
        <Stat label="Module"   value={module_doc?.id ? 'indexed' : '—'} color="text-slate-300" />
      </div>

      {/* Validation */}
      <div className={`rounded-lg border px-3 py-2 text-xs flex items-start gap-2
        ${v?.passed ? 'border-emerald-500/30 bg-emerald-500/5 text-emerald-200'
                    : 'border-amber-500/30 bg-amber-500/5 text-amber-200'}`}>
        {v?.passed ? <ShieldCheck className="w-4 h-4 flex-shrink-0 mt-0.5" />
                   : <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />}
        <div>
          <div className="font-medium">
            {v?.passed ? 'Validated & registered.' : 'Saved as draft — fix violations to activate.'}
          </div>
          {!v?.passed && (v?.violations || []).length > 0 && (
            <ul className="list-disc list-inside mt-1 space-y-0.5">
              {v.violations.map((msg, i) => <li key={i}>{msg}</li>)}
            </ul>
          )}
        </div>
      </div>

      {/* Architecture preview */}
      <Section title="UE5 Architecture">
        {(architecture.class_architecture || []).slice(0, 10).map((c, i) => (
          <div key={i} className="text-xs py-1 border-b border-slate-800 last:border-0">
            <span className="text-cyan-300 font-mono">{c.name}</span>
            <span className="text-slate-500"> : {c.kind}</span>
            {c.parent && <span className="text-slate-500"> ← {c.parent}</span>}
            {c.responsibility && <div className="text-slate-400 text-[11px]">{c.responsibility}</div>}
          </div>
        ))}
      </Section>

      {/* Flow */}
      {(architecture.system_flow || []).length > 0 && (
        <Section title="Execution Flow">
          <ol className="text-xs text-slate-300 space-y-0.5 list-decimal list-inside">
            {architecture.system_flow.map((step, i) => <li key={i}>{step}</li>)}
          </ol>
        </Section>
      )}

      {/* GAS preview */}
      {gas && (gas.abilities || []).length > 0 && (
        <Section title="GAS Abilities">
          {gas.abilities.map((a, i) => (
            <div key={i} className="text-xs py-1 border-b border-slate-800 last:border-0">
              <span className="text-amber-300 font-mono">{a.class_name}</span>
              <span className="text-slate-500"> · {a.activation_type}</span>
              {a.cooldown_seconds != null && <span className="text-slate-500"> · cd {a.cooldown_seconds}s</span>}
              <span className="text-slate-500"> · {a.replication_policy}</span>
            </div>
          ))}
        </Section>
      )}

      {/* BP graphs preview */}
      {(blueprint_plan.event_graphs || []).length > 0 && (
        <Section title="Blueprint Event Graphs">
          {blueprint_plan.event_graphs.map((g, i) => (
            <div key={i} className="text-xs py-1 border-b border-slate-800 last:border-0">
              <div className="text-violet-300 font-mono">{g.graph_name}</div>
              <div className="text-slate-500 text-[11px]">entry: {g.entry} · {(g.nodes || []).length} nodes</div>
            </div>
          ))}
        </Section>
      )}

      {/* Integration */}
      <Section title="System Integration">
        <div className="text-xs space-y-1">
          <Row label="dependencies" items={kernel?.saved?.dependencies || []} tone="rose" />
          <Row label="connected"    items={kernel?.saved?.connected_systems || []} tone="cyan" />
          <Row label="stat reads"   items={kernel?.saved?.stat_contract?.reads || []} tone="emerald" />
          <Row label="stat writes"  items={kernel?.saved?.stat_contract?.writes || []} tone="amber" />
        </div>
      </Section>
    </motion.section>
  );
}

function Section({ title, children }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-widest text-slate-500 mb-1.5">{title}</div>
      <div className="bg-slate-800/40 border border-slate-700 rounded-lg p-3 max-h-72 overflow-y-auto">
        {children}
      </div>
    </div>
  );
}
function Stat({ label, value, color }) {
  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded p-2 flex items-center justify-between">
      <span className="uppercase tracking-widest text-[10px] text-slate-400">{label}</span>
      <span className={`font-mono ${color}`}>{value}</span>
    </div>
  );
}
function Row({ label, items, tone }) {
  if (!items || items.length === 0) return null;
  const toneClass = {
    rose:    'bg-rose-500/10 border-rose-500/30 text-rose-300',
    cyan:    'bg-cyan-500/10 border-cyan-500/30 text-cyan-300',
    emerald: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300',
    amber:   'bg-amber-500/10 border-amber-500/30 text-amber-300',
  }[tone] || 'bg-slate-700/40 border-slate-600 text-slate-300';
  return (
    <div className="flex items-start gap-2">
      <span className="text-[10px] uppercase tracking-widest text-slate-500 w-24 mt-1">{label}</span>
      <div className="flex flex-wrap gap-1">
        {items.map((it, i) => (
          <span key={i} className={`px-1.5 py-0.5 rounded border ${toneClass}`}>{it}</span>
        ))}
      </div>
    </div>
  );
}
function Tag({ tone, children }) {
  const cls = {
    indigo:  'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
    fuchsia: 'bg-fuchsia-500/15 text-fuchsia-300 border-fuchsia-500/30',
    amber:   'bg-amber-500/15 text-amber-300 border-amber-500/30',
    cyan:    'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
    emerald: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    slate:   'bg-slate-700/40 text-slate-300 border-slate-600',
  }[tone] || 'bg-slate-700/40 text-slate-300 border-slate-600';
  return <span className={`px-1.5 py-0.5 rounded border ${cls}`}>{children}</span>;
}
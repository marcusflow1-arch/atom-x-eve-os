import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Cpu, Loader2, Sparkles, Server, Network, ShieldCheck, AlertTriangle,
  GitBranch, Database, ListChecks, Power, History, Tag,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import KnowledgeStatusBanner from './KnowledgeStatusBanner';
import {
  listSystems,
  createSystemThroughKernel,
  buildInteractionGraph,
  activateSystem,
  CORE_STATS,
  DERIVED_STATS,
} from './gameDesignOS';
import { showError, showSuccess } from '@/components/error/ErrorToast';

// ─── System Types ────────────────────────────────────────────────────────
const SYSTEM_TYPES = [
  'combat','skills','abilities','ui','progression','inventory','equipment',
  'weapons','titles','halos','companions','ai','movement','input','audio',
  'vfx','economy','social','networking','data','other',
];

// ─── Tab ─────────────────────────────────────────────────────────────────
export default function GameDesignOSTab() {
  const [systems, setSystems]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [busy, setBusy]         = useState(false);
  const [progress, setProgress] = useState(null);
  const [lastResult, setLastResult] = useState(null);

  const [form, setForm] = useState({
    system_id: '',
    system_name: '',
    system_type: 'combat',
    summary: '',
    dependencies: '',
    connected_systems: '',
    reads: '',
    writes: '',
    prompt: '',
  });

  const refresh = async () => {
    setLoading(true);
    try { setSystems(await listSystems()); }
    catch (e) { showError(e, 'Registry'); }
    finally { setLoading(false); }
  };
  useEffect(() => { refresh(); }, []);

  const handleCreate = async () => {
    if (!form.system_name.trim()) { showError('A system_name is required.'); return; }
    setBusy(true);
    setProgress(null);
    setLastResult(null);
    try {
      const r = await createSystemThroughKernel({
        system_id:   form.system_id.trim(),
        system_name: form.system_name.trim(),
        system_type: form.system_type,
        summary:     form.summary.trim(),
        dependencies:      form.dependencies.split(',').map((s) => s.trim()).filter(Boolean),
        connected_systems: form.connected_systems.split(',').map((s) => s.trim()).filter(Boolean),
        stat_contract: {
          reads:  form.reads.split(',').map((s) => s.trim()).filter(Boolean),
          writes: form.writes.split(',').map((s) => s.trim()).filter(Boolean),
        },
        prompt: form.prompt.trim() || `${form.system_name}: ${form.summary}`,
      }, { progress: (p) => setProgress(p) });

      setLastResult(r);
      showSuccess(
        r.validation.passed
          ? `System v${r.saved.version} registered & validated.`
          : `Registered v${r.saved.version} as DRAFT — fix violations to activate.`
      );
      refresh();
    } catch (err) {
      showError(err, 'Kernel Create');
    } finally {
      setBusy(false);
    }
  };

  const graph = buildInteractionGraph(systems.filter((s) => s.status !== 'deprecated'));

  return (
    <div>
      <KnowledgeStatusBanner />

      {/* Header */}
      <section className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Cpu className="w-6 h-6 text-indigo-400" />
          <h2 className="text-2xl font-bold">Game Design OS Kernel</h2>
        </div>
        <p className="text-slate-400 text-sm">
          The central backbone every game system must route through. All creation runs the 7-step
          pipeline: Registry check → Vector retrieval → UE5 mapping → Rule validation → Versioned
          persistence. No isolated systems, no ungrounded designs, no destructive overwrites.
        </p>
      </section>

      {/* Pipeline form */}
      <section className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Server className="w-5 h-5 text-indigo-300" />
          <h3 className="text-lg font-semibold">Create / Update System (through Kernel)</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Field label="System ID (auto from name if empty)">
            <Input value={form.system_id} onChange={(e) => setForm({ ...form, system_id: e.target.value })} placeholder="combat_core" className="bg-slate-800 border-slate-700" disabled={busy} />
          </Field>
          <Field label="System Name *">
            <Input value={form.system_name} onChange={(e) => setForm({ ...form, system_name: e.target.value })} placeholder="Combat Core" className="bg-slate-800 border-slate-700" disabled={busy} />
          </Field>
          <Field label="System Type">
            <select value={form.system_type} onChange={(e) => setForm({ ...form, system_type: e.target.value })}
              className="w-full bg-slate-800 border border-slate-700 rounded h-9 px-2 text-sm" disabled={busy}>
              {SYSTEM_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </Field>
          <Field label="Summary">
            <Input value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} className="bg-slate-800 border-slate-700" disabled={busy} />
          </Field>
          <Field label="Dependencies (comma-sep system_ids)">
            <Input value={form.dependencies} onChange={(e) => setForm({ ...form, dependencies: e.target.value })} placeholder="damage_core, animation_core" className="bg-slate-800 border-slate-700" disabled={busy} />
          </Field>
          <Field label="Connected Systems (comma-sep)">
            <Input value={form.connected_systems} onChange={(e) => setForm({ ...form, connected_systems: e.target.value })} placeholder="ui_core, inventory_core" className="bg-slate-800 border-slate-700" disabled={busy} />
          </Field>
          <Field label={`Stat Reads (canon: ${[...CORE_STATS, ...DERIVED_STATS].join(', ')})`}>
            <Input value={form.reads} onChange={(e) => setForm({ ...form, reads: e.target.value })} placeholder="Strength, Dexterity" className="bg-slate-800 border-slate-700" disabled={busy} />
          </Field>
          <Field label="Stat Writes">
            <Input value={form.writes} onChange={(e) => setForm({ ...form, writes: e.target.value })} placeholder="Health, Stamina" className="bg-slate-800 border-slate-700" disabled={busy} />
          </Field>
          <div className="md:col-span-2">
            <Field label="Generation Prompt (optional — falls back to name + summary)">
              <Textarea value={form.prompt} onChange={(e) => setForm({ ...form, prompt: e.target.value })}
                placeholder='e.g. "Combat core that links Skills → Damage → UI"'
                className="bg-slate-800 border-slate-700 h-20" disabled={busy} />
            </Field>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 mt-3">
          <Button onClick={handleCreate} disabled={busy} className="bg-indigo-600 hover:bg-indigo-700">
            {busy ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
            Run Kernel Pipeline
          </Button>
          {busy && progress && (
            <span className="text-xs text-slate-400">Step {progress.step}/6 — {progress.msg}</span>
          )}
        </div>

        {lastResult && <KernelResultPanel result={lastResult} onActivate={async (id) => { try { await activateSystem(id); showSuccess('Activated.'); refresh(); } catch (e) { showError(e); } }} />}
      </section>

      {/* Registry */}
      <section className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Database className="w-5 h-5 text-cyan-300" />
          <h3 className="text-lg font-semibold">System Registry</h3>
          <span className="text-xs text-slate-500">({systems.length})</span>
        </div>
        {loading ? <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
          : systems.length === 0 ? <Empty text="No systems registered yet. Create one above." />
          : (
            <div className="space-y-1.5 max-h-96 overflow-y-auto pr-1">
              {systems.map((s) => <SystemRow key={s.id} sys={s} onActivate={async () => { try { await activateSystem(s.id); showSuccess('Activated.'); refresh(); } catch (e) { showError(e); } }} />)}
            </div>
          )}
      </section>

      {/* Interaction Graph */}
      <section className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-3">
          <Network className="w-5 h-5 text-emerald-300" />
          <h3 className="text-lg font-semibold">System Interaction Graph</h3>
        </div>
        <InteractionGraphView graph={graph} />
      </section>
    </div>
  );
}

// ─── Subviews ────────────────────────────────────────────────────────────
function KernelResultPanel({ result, onActivate }) {
  const v = result.validation;
  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
      className="mt-4 bg-slate-800/40 border border-slate-700 rounded-xl p-3 space-y-3">
      <div className="flex items-center gap-2 text-sm">
        {v.passed
          ? <><ShieldCheck className="w-4 h-4 text-emerald-400" /> <span className="text-emerald-300">Validation passed.</span></>
          : <><AlertTriangle className="w-4 h-4 text-amber-400" /> <span className="text-amber-300">Validation failed — saved as draft.</span></>}
        <span className="ml-auto text-xs text-slate-400 flex items-center gap-1">
          <Tag className="w-3 h-3" /> v{result.saved.version} · {result.saved.status}
        </span>
        {v.passed && result.saved.status !== 'active' && (
          <Button size="sm" variant="outline" className="h-7" onClick={() => onActivate(result.saved.id)}>
            <Power className="w-3 h-3 mr-1" /> Activate
          </Button>
        )}
      </div>

      {v.violations.length > 0 && (
        <ul className="text-xs text-amber-200 list-disc list-inside space-y-0.5">
          {v.violations.map((msg, i) => <li key={i}>{msg}</li>)}
        </ul>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
        <div>
          <div className="text-slate-400 uppercase tracking-widest text-[10px] mb-1">Retrieval</div>
          <div className="text-slate-300">
            Mode: <span className="text-emerald-300">{result.retrieval?.retrieval || '—'}</span> ·
            Chunks: <span className="text-cyan-300">{result.retrieval?.chunk_count || 0}</span>
          </div>
        </div>
        <div>
          <div className="text-slate-400 uppercase tracking-widest text-[10px] mb-1">UE5 Mapping</div>
          <div className="text-slate-300 space-y-0.5">
            {Object.entries(result.saved.ue5_mapping || {}).map(([k, arr]) =>
              (arr || []).length ? <div key={k}><span className="text-slate-500">{k}:</span> {arr.join(', ')}</div> : null
            )}
          </div>
        </div>
      </div>

      {result.previous && (
        <div className="text-[11px] text-slate-400 flex items-center gap-1">
          <History className="w-3 h-3" /> Previous version v{result.previous.version} → marked deprecated.
        </div>
      )}
    </motion.div>
  );
}

function SystemRow({ sys, onActivate }) {
  const statusColor = {
    draft:      'bg-amber-500/15 text-amber-300 border-amber-500/30',
    validated:  'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
    active:     'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    deprecated: 'bg-slate-700/40 text-slate-400 border-slate-600',
  }[sys.status] || 'bg-slate-700/40 text-slate-300 border-slate-600';

  return (
    <div className="bg-slate-800/40 border border-slate-700 rounded-lg p-2.5">
      <div className="flex items-center gap-2 flex-wrap">
        <span className={`text-[10px] px-1.5 py-0.5 rounded border ${statusColor}`}>{sys.status}</span>
        <span className="text-sm text-slate-100 font-medium">{sys.system_name}</span>
        <code className="text-[10px] text-slate-500">{sys.system_id}</code>
        <span className="text-[10px] uppercase tracking-widest text-violet-300">{sys.system_type}</span>
        <span className="ml-auto text-[10px] text-slate-500">v{sys.version || 1}</span>
        {sys.status === 'validated' && (
          <Button size="sm" variant="outline" className="h-6 px-2 text-xs" onClick={onActivate}>
            <Power className="w-3 h-3 mr-1" /> Activate
          </Button>
        )}
      </div>
      {sys.summary && <div className="text-xs text-slate-400 mt-1">{sys.summary}</div>}
      <div className="text-[10px] text-slate-500 mt-1 flex flex-wrap gap-x-3 gap-y-0.5">
        {(sys.dependencies || []).length      > 0 && <span>deps: {sys.dependencies.join(', ')}</span>}
        {(sys.connected_systems || []).length > 0 && <span>conn: {sys.connected_systems.join(', ')}</span>}
        {(sys.memory_refs || []).length       > 0 && <span>memory_refs: {sys.memory_refs.length}</span>}
      </div>
      {sys.rule_validation && !sys.rule_validation.passed && (sys.rule_validation.violations || []).length > 0 && (
        <div className="mt-1 text-[10px] text-amber-300 flex items-start gap-1">
          <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" />
          <span>{sys.rule_validation.violations.join(' · ')}</span>
        </div>
      )}
    </div>
  );
}

function InteractionGraphView({ graph }) {
  if (!graph || graph.nodes.length === 0) {
    return <Empty text="Graph is empty. Register systems above to populate it." />;
  }
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
        <Counter label="Nodes" value={graph.nodes.length} color="text-cyan-300" />
        <Counter label="Edges" value={graph.edges.length} color="text-violet-300" />
        <Counter label="Isolated" value={graph.isolated.length} color={graph.isolated.length ? 'text-amber-300' : 'text-emerald-300'} />
      </div>

      {/* Adjacency list view — fast, no extra deps */}
      <div className="bg-slate-800/40 border border-slate-700 rounded-lg p-3 max-h-80 overflow-y-auto">
        <div className="text-xs uppercase tracking-widest text-slate-500 mb-2 flex items-center gap-1">
          <GitBranch className="w-3 h-3" /> Adjacency
        </div>
        {graph.nodes.map((n) => {
          const outs = graph.edges.filter((e) => e.from === n.id);
          return (
            <div key={n.id} className="text-xs py-1 border-b border-slate-800 last:border-0">
              <div className="flex items-center gap-2 flex-wrap">
                <code className="text-emerald-300">{n.id}</code>
                <span className="text-slate-500">·</span>
                <span className="text-slate-300">{n.label}</span>
                <span className="text-[9px] uppercase tracking-widest text-violet-300">{n.type}</span>
                <span className="ml-auto text-[10px] text-slate-500">v{n.version}</span>
              </div>
              {outs.length > 0 ? (
                <div className="text-[11px] text-slate-400 mt-0.5 flex flex-wrap gap-1">
                  {outs.map((e, i) => (
                    <span key={i} className={`px-1.5 py-0.5 rounded border ${e.kind === 'dependency'
                      ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                      : 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300'}`}>
                      → {e.to} ({e.kind === 'dependency' ? 'dep' : 'conn'})
                    </span>
                  ))}
                </div>
              ) : <div className="text-[10px] text-slate-600 italic">no outgoing edges</div>}
            </div>
          );
        })}
      </div>

      {graph.isolated.length > 0 && (
        <div className="text-xs text-amber-300 flex items-start gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
          <span>Isolated systems detected: {graph.isolated.join(', ')}. Connect them or mark deprecated.</span>
        </div>
      )}
    </div>
  );
}

// ─── Tiny shared bits ────────────────────────────────────────────────────
function Field({ label, children }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-widest text-slate-500 mb-1">{label}</div>
      {children}
    </div>
  );
}
function Counter({ label, value, color }) {
  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded p-2 flex items-center gap-2">
      <ListChecks className="w-3.5 h-3.5 text-slate-500" />
      <span className="uppercase tracking-widest text-[10px] text-slate-400">{label}</span>
      <span className={`ml-auto font-mono ${color}`}>{value}</span>
    </div>
  );
}
function Empty({ text }) { return <div className="text-xs text-slate-500 italic">{text}</div>; }
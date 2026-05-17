import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Workflow, Loader2, Sparkles, Save, GitBranch, Variable, Link2, Zap, CheckSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import KnowledgeStatusBanner from './KnowledgeStatusBanner';
import { translateToUE5Blueprint } from './ue5Translator';
import { generateBlueprintGraphs } from './ue5BlueprintGenerator';
import { showError, showSuccess } from '@/components/error/ErrorToast';

// ─── UE5 Auto Blueprint Generator Tab ────────────────────────────────────
// Stage 2: turns a system description (or a saved architecture) into
// explicit node-level Blueprint graphs.
export default function UE5BlueprintGeneratorTab() {
  const [prompt, setPrompt] = useState('');
  const [archInput, setArchInput] = useState('');   // optional pasted JSON from Translator
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);

  const run = async ({ withTranslator = false, save = false }) => {
    if (!prompt.trim() && !archInput.trim()) return;
    setBusy(true);
    setResult(null);
    try {
      let architectureBlueprint = null;

      // 1. Caller pasted JSON → use it directly.
      if (archInput.trim()) {
        try { architectureBlueprint = JSON.parse(archInput); }
        catch { throw new Error('Architecture JSON is invalid. Paste the JSON output from the UE5 Translator.'); }
      }
      // 2. Caller asked us to call the Translator first.
      else if (withTranslator) {
        const t = await translateToUE5Blueprint(prompt.trim(), { save: false });
        architectureBlueprint = t.blueprint;
      }

      const r = await generateBlueprintGraphs({
        userPrompt: prompt.trim() || undefined,
        architectureBlueprint,
        save,
      });
      setResult(r);
      if (save) showSuccess('Blueprint graphs saved to Knowledge Library.');
    } catch (err) {
      showError(err, 'Blueprint Generator');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <KnowledgeStatusBanner />

      <section className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Workflow className="w-6 h-6 text-orange-400" />
          <h2 className="text-2xl font-bold">UE5 Auto Blueprint Generator</h2>
        </div>
        <p className="text-slate-400 text-sm mb-4">
          Stage 2 of the UE5 pipeline. Converts a system into explicit node-level Blueprint graphs
          (Event Graphs, Function Graphs, Custom Events, Dispatchers) ready to rebuild in the
          Unreal Blueprint Editor.
        </p>

        <div className="space-y-3">
          <div>
            <div className="text-[10px] uppercase tracking-widest text-slate-500 mb-1">System Description</div>
            <Textarea
              placeholder='e.g. "Fireball ability with cooldown and hit detection"'
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="bg-slate-800 border-slate-700 h-20"
              disabled={busy}
            />
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-widest text-slate-500 mb-1">
              Optional — Paste Architecture JSON (from UE5 Translator)
            </div>
            <Textarea
              placeholder="{...architecture blueprint json...}"
              value={archInput}
              onChange={(e) => setArchInput(e.target.value)}
              className="bg-slate-900 border-slate-700 h-24 font-mono text-xs"
              disabled={busy}
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mt-3">
          <Button onClick={() => run({ withTranslator: false, save: false })}
                  disabled={busy || (!prompt.trim() && !archInput.trim())}
                  className="bg-orange-600 hover:bg-orange-700">
            {busy ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
            Generate Blueprint Graphs
          </Button>
          <Button onClick={() => run({ withTranslator: true, save: false })}
                  disabled={busy || !prompt.trim()}
                  variant="outline">
            Run Translator → Generator
          </Button>
          <Button onClick={() => run({ withTranslator: !archInput.trim(), save: true })}
                  disabled={busy || (!prompt.trim() && !archInput.trim())}
                  variant="outline">
            <Save className="w-4 h-4 mr-2" /> Generate &amp; Save
          </Button>
        </div>
      </section>

      {result && <GeneratedView result={result} />}
    </div>
  );
}

// ─── Output renderer ─────────────────────────────────────────────────────
function GeneratedView({ result }) {
  const g = result.generated || {};

  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      {/* Actor binding */}
      <Section icon={Link2} title="Actor / Component Binding" color="text-cyan-300">
        <KV label="Owning Actor"        value={g.actor_binding?.owning_actor} />
        <KV label="Executing Component" value={g.actor_binding?.executing_component} />
        <KV label="UI Communicator"     value={g.actor_binding?.ui_communicator} />
        <KVList label="Replicated Systems" items={g.actor_binding?.replicated_systems} />
      </Section>

      {/* Variables */}
      <Section icon={Variable} title="Variables" color="text-violet-300">
        {(g.variables || []).length === 0 ? <Empty /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="text-slate-400">
                <tr className="border-b border-slate-700">
                  <th className="text-left py-1 px-2">Name</th>
                  <th className="text-left py-1 px-2">Type</th>
                  <th className="text-left py-1 px-2">Default</th>
                  <th className="text-left py-1 px-2">Scope</th>
                  <th className="text-left py-1 px-2">Repl.</th>
                  <th className="text-left py-1 px-2">Purpose</th>
                </tr>
              </thead>
              <tbody>
                {g.variables.map((v, i) => (
                  <tr key={i} className="border-b border-slate-800/60">
                    <td className="py-1 px-2"><code className="text-emerald-300">{v.name}</code></td>
                    <td className="py-1 px-2 text-violet-300">{v.type}</td>
                    <td className="py-1 px-2 text-slate-400">{v.default || '—'}</td>
                    <td className="py-1 px-2 text-slate-400">{v.scope || '—'}</td>
                    <td className="py-1 px-2">{v.replicated ? '✓' : ''}</td>
                    <td className="py-1 px-2 text-slate-300">{v.purpose}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      {/* Graphs */}
      <Section icon={GitBranch} title="Blueprint Graphs" color="text-orange-300">
        {(g.graphs || []).length === 0 ? <Empty /> : (
          <div className="space-y-3">
            {g.graphs.map((gr, i) => <GraphCard key={i} graph={gr} />)}
          </div>
        )}
      </Section>

      {/* Ability mapping */}
      {g.ability_mapping && Object.values(g.ability_mapping).some((v) => v && (Array.isArray(v) ? v.length : true)) && (
        <Section icon={Zap} title="Gameplay Ability Mapping" color="text-rose-300">
          <KV label="Ability Class"     value={g.ability_mapping.ability_class} />
          <KV label="Activation"        value={g.ability_mapping.activation} />
          <KV label="Cooldown Tracking" value={g.ability_mapping.cooldown_tracking} />
          <KV label="Damage Execution"  value={g.ability_mapping.damage_execution} />
          <KV label="Animation Montage" value={g.ability_mapping.animation_montage} />
          <KV label="Hit Detection"     value={g.ability_mapping.hit_detection} />
          <KVList label="Applied Effects" items={g.ability_mapping.applied_effects} />
        </Section>
      )}

      {/* Rebuild checklist */}
      <Section icon={CheckSquare} title="Rebuild Checklist" color="text-emerald-300">
        {(g.rebuild_checklist || []).length === 0 ? <Empty /> : (
          <ol className="space-y-1.5">
            {g.rebuild_checklist.map((c, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 mt-0.5">
                  {i + 1}
                </span>
                <span className="text-slate-200">{c}</span>
              </li>
            ))}
          </ol>
        )}
      </Section>
    </motion.div>
  );
}

function GraphCard({ graph }) {
  const kindColor = {
    EventGraph:      'bg-orange-500/20 text-orange-300 border-orange-500/30',
    FunctionGraph:   'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
    Macro:           'bg-violet-500/20 text-violet-300 border-violet-500/30',
    CustomEvent:     'bg-rose-500/20 text-rose-300 border-rose-500/30',
    EventDispatcher: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  }[graph.graph_kind] || 'bg-slate-700/40 text-slate-300 border-slate-600';

  const catColor = {
    Input: 'text-cyan-300', FlowControl: 'text-amber-300', Function: 'text-emerald-300',
    Variable: 'text-violet-300', Event: 'text-rose-300', VFX: 'text-fuchsia-300',
    SFX: 'text-pink-300', UI: 'text-teal-300', State: 'text-sky-300',
  };

  return (
    <div className="bg-slate-800/40 border border-slate-700 rounded-xl p-3">
      <div className="flex items-center gap-2 flex-wrap mb-1">
        <span className={`text-[10px] px-2 py-0.5 rounded border ${kindColor}`}>{graph.graph_kind}</span>
        <span className="text-sm text-orange-200 font-semibold">{graph.graph_name}</span>
        {graph.owner && <span className="text-xs text-slate-500">in <code className="text-slate-300">{graph.owner}</code></span>}
      </div>
      {graph.purpose && <div className="text-xs text-slate-400 mb-2">{graph.purpose}</div>}

      {graph.flow_summary && (
        <div className="text-xs bg-slate-900/70 border border-slate-700 rounded p-2 mb-2 font-mono text-emerald-200 overflow-x-auto whitespace-nowrap">
          {graph.flow_summary}
        </div>
      )}

      {(graph.nodes || []).length === 0 ? <Empty /> : (
        <ol className="space-y-1">
          {graph.nodes.map((n, i) => (
            <li key={i} className="flex items-start gap-2 text-xs border-l-2 border-slate-700 pl-2 py-0.5">
              <span className="text-[10px] font-mono text-slate-500 w-5 flex-shrink-0">#{n.step ?? i + 1}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-slate-100 font-medium">{n.node_type}</span>
                  {n.category && (
                    <span className={`text-[9px] uppercase tracking-widest ${catColor[n.category] || 'text-slate-400'}`}>
                      {n.category}
                    </span>
                  )}
                </div>
                {(n.inputs?.length || n.outputs?.length) ? (
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    {n.inputs?.length  ? <>in: <span className="text-slate-400">{n.inputs.join(', ')}</span></>  : null}
                    {n.inputs?.length && n.outputs?.length ? ' · ' : null}
                    {n.outputs?.length ? <>out: <span className="text-slate-400">{n.outputs.join(', ')}</span></> : null}
                  </div>
                ) : null}
                {n.notes && <div className="text-[10px] text-slate-500 mt-0.5 italic">{n.notes}</div>}
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

// ─── Tiny shared bits ────────────────────────────────────────────────────
function Section({ icon: Icon, title, color, children }) {
  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-3">
        <Icon className={`w-5 h-5 ${color}`} />
        <h3 className="text-lg font-semibold">{title}</h3>
      </div>
      <div>{children}</div>
    </div>
  );
}
function KV({ label, value }) {
  if (!value) return null;
  return (
    <div className="mb-2">
      <div className="text-[10px] uppercase tracking-widest text-slate-500">{label}</div>
      <div className="text-sm text-slate-200">{value}</div>
    </div>
  );
}
function KVList({ label, items }) {
  if (!items || items.length === 0) return null;
  return (
    <div className="mb-2">
      <div className="text-[10px] uppercase tracking-widest text-slate-500">{label}</div>
      <ul className="list-disc list-inside text-sm text-slate-300 space-y-0.5">
        {items.map((s, i) => <li key={i}>{s}</li>)}
      </ul>
    </div>
  );
}
function Empty() { return <div className="text-xs text-slate-500 italic">No entries.</div>; }
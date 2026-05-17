import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Workflow, Loader2, Save, Sparkles, GitBranch, Variable, Bell, Radio, Monitor, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import KnowledgeStatusBanner from './KnowledgeStatusBanner';
import { generateBlueprintPlan } from './blueprintGenerator';
import { showError, showSuccess } from '@/components/error/ErrorToast';

// ─── UE5 Auto Blueprint Generator Tab ───────────────────────────────────
// Converts a system description into node-level Blueprint execution logic.
export default function BlueprintGeneratorTab() {
  const [prompt, setPrompt] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);

  const run = async (save = false) => {
    if (!prompt.trim()) return;
    setBusy(true);
    setResult(null);
    try {
      const r = await generateBlueprintPlan(prompt.trim(), { save });
      setResult(r);
      if (save) showSuccess('Blueprint plan saved into the Knowledge Library.');
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
          <h2 className="text-2xl font-bold">Auto Blueprint Generator</h2>
        </div>
        <p className="text-slate-400 text-sm mb-4">
          Node-level Unreal Blueprint plans — Event Graphs, Function Graphs, Custom Events,
          Delegates, Variables, Component bindings, replication, UI bindings. Pulls context
          from Vector Memory + Unreal Docs before generating.
        </p>

        <Textarea
          placeholder='e.g. "Fireball ability: trigger on Q, costs 25 mana, 3s cooldown, projectile damage with hit VFX, replicated"'
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          className="bg-slate-800 border-slate-700 h-24 mb-3"
          disabled={busy}
        />
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => run(false)} disabled={busy || !prompt.trim()} className="bg-orange-600 hover:bg-orange-700">
            {busy ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
            Generate Blueprint Plan
          </Button>
          <Button onClick={() => run(true)} disabled={busy || !prompt.trim()} variant="outline">
            <Save className="w-4 h-4 mr-2" />
            Generate &amp; Save
          </Button>
        </div>
      </section>

      {result && <PlanView result={result} />}
    </div>
  );
}

function PlanView({ result }) {
  const p = result.plan || {};
  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      <Section icon={Zap} title="Overview" color="text-cyan-300">
        <KV label="Target Actor" value={p.target_actor} mono />
        <KV label="Summary"      value={p.summary} />
      </Section>

      <Section icon={Workflow} title="Owning Components" color="text-violet-300">
        {(p.owning_components || []).length === 0 ? <Empty /> : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {p.owning_components.map((c, i) => (
              <div key={i} className="bg-slate-800/50 border border-slate-700 rounded p-2.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <code className="text-emerald-300 text-sm font-mono">{c.component}</code>
                  <span className="text-[10px] text-slate-500">on</span>
                  <code className="text-slate-300 text-sm font-mono">{c.actor}</code>
                  {c.replicated && <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">replicated</span>}
                </div>
                <div className="text-xs text-slate-300 mt-1">{c.role}</div>
              </div>
            ))}
          </div>
        )}
      </Section>

      <Section icon={Variable} title="Variables" color="text-sky-300">
        {(p.variables || []).length === 0 ? <Empty /> : (
          <table className="w-full text-xs">
            <thead className="text-slate-500">
              <tr><th className="text-left py-1">Name</th><th className="text-left">Type</th><th className="text-left">Default</th><th className="text-left">Replication</th><th className="text-left">Category</th></tr>
            </thead>
            <tbody>
              {p.variables.map((v, i) => (
                <tr key={i} className="border-t border-slate-800">
                  <td className="py-1 font-mono text-emerald-300">{v.name}</td>
                  <td className="text-slate-300">{v.type}</td>
                  <td className="text-slate-400">{v.default}</td>
                  <td className="text-slate-400">{v.replication}</td>
                  <td className="text-slate-500">{v.category}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Section>

      <Section icon={GitBranch} title="Event Graphs" color="text-amber-300">
        {(p.event_graphs || []).length === 0 ? <Empty /> : (
          <div className="space-y-3">
            {p.event_graphs.map((g, i) => (
              <div key={i} className="bg-slate-800/40 border border-slate-700 rounded p-3">
                <div className="text-sm font-medium text-amber-200">{g.graph_name}</div>
                <div className="text-xs text-slate-400 mb-2">Entry: <code className="text-cyan-300">{g.entry}</code></div>
                <ol className="space-y-1">
                  {(g.nodes || []).map((n, j) => (
                    <li key={j} className="flex items-start gap-2 text-xs">
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 mt-0.5">{n.step ?? j + 1}</span>
                      <div className="flex-1">
                        <code className="text-emerald-300 font-mono">{n.node}</code>
                        {n.detail && <span className="text-slate-300"> — {n.detail}</span>}
                        {n.next && <span className="text-slate-500"> → {n.next}</span>}
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            ))}
          </div>
        )}
      </Section>

      <Section icon={GitBranch} title="Function Graphs" color="text-fuchsia-300">
        {(p.function_graphs || []).length === 0 ? <Empty /> : (
          <div className="space-y-2">
            {p.function_graphs.map((f, i) => (
              <div key={i} className="bg-slate-800/40 border border-slate-700 rounded p-2.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <code className="text-fuchsia-200 font-mono text-sm">{f.name}</code>
                  {f.pure && <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">pure</span>}
                </div>
                {(f.inputs?.length > 0) && <div className="text-xs text-slate-400 mt-1">in: {f.inputs.join(', ')}</div>}
                {(f.outputs?.length > 0) && <div className="text-xs text-slate-400">out: {f.outputs.join(', ')}</div>}
                <KVList items={f.body} dense />
              </div>
            ))}
          </div>
        )}
      </Section>

      <Section icon={Bell} title="Custom Events" color="text-rose-300">
        {(p.custom_events || []).length === 0 ? <Empty /> : (
          <div className="space-y-1.5">
            {p.custom_events.map((e, i) => (
              <div key={i} className="bg-slate-800/40 border border-slate-700 rounded p-2.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <code className="text-rose-200 font-mono text-sm">{e.name}({(e.params || []).join(', ')})</code>
                  {e.replicated && e.replicated !== 'None' && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">{e.replicated}{e.reliable ? ' · Reliable' : ''}</span>
                  )}
                </div>
                {e.description && <div className="text-xs text-slate-300 mt-1">{e.description}</div>}
              </div>
            ))}
          </div>
        )}
      </Section>

      <Section icon={Radio} title="Delegates / Event Dispatchers" color="text-emerald-300">
        {(p.delegates || []).length === 0 ? <Empty /> : (
          <div className="space-y-1.5">
            {p.delegates.map((d, i) => (
              <div key={i} className="bg-slate-800/40 border border-slate-700 rounded p-2.5">
                <code className="text-emerald-200 font-mono text-sm">{d.name}</code>
                <span className="text-xs text-slate-400"> — {d.signature}</span>
                <div className="text-[10px] text-slate-500 mt-0.5">owner: {d.owner}</div>
                <KVList label="Listeners" items={d.listeners} dense />
              </div>
            ))}
          </div>
        )}
      </Section>

      <Section icon={GitBranch} title="Execution Flow" color="text-teal-300">
        {(p.execution_flow || []).length === 0 ? <Empty /> : (
          <ol className="space-y-1">
            {p.execution_flow.map((step, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-teal-500/20 text-teal-300 border border-teal-500/30 mt-0.5">{i + 1}</span>
                <span className="text-slate-200">{step}</span>
              </li>
            ))}
          </ol>
        )}
      </Section>

      {p.ability_mapping && Object.values(p.ability_mapping).some(Boolean) && (
        <Section icon={Zap} title="Ability Mapping" color="text-orange-300">
          <KV label="Activation"        value={p.ability_mapping.activation} />
          <KV label="Cooldown Tracking" value={p.ability_mapping.cooldown_tracking} />
          <KV label="Damage Execution"  value={p.ability_mapping.damage_execution} />
          <KV label="Montage Trigger"   value={p.ability_mapping.montage_trigger} />
          <KV label="Hit Detection"     value={p.ability_mapping.hit_detection} />
        </Section>
      )}

      <Section icon={Monitor} title="UI Bindings" color="text-cyan-300">
        {(p.ui_bindings || []).length === 0 ? <Empty /> : (
          <div className="space-y-1.5">
            {p.ui_bindings.map((b, i) => (
              <div key={i} className="text-xs bg-slate-800/40 border border-slate-700 rounded p-2">
                <code className="text-cyan-200 font-mono">{b.widget}.{b.property}</code>
                <span className="text-slate-500"> ← </span>
                <code className="text-emerald-300 font-mono">{b.source}</code>
                <span className="text-slate-500"> via {b.method}</span>
              </div>
            ))}
          </div>
        )}
      </Section>

      <Section icon={Radio} title="Replication Notes" color="text-slate-300">
        <KVList items={p.replication_notes} />
      </Section>
    </motion.div>
  );
}

// ─── Tiny presentational helpers ─────────────────────────────────────────
function Section({ icon: Icon, title, color, children }) {
  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-3">
        <Icon className={`w-5 h-5 ${color}`} />
        <h3 className="text-lg font-semibold">{title}</h3>
      </div>
      {children}
    </div>
  );
}
function KV({ label, value, mono }) {
  if (!value) return null;
  return (
    <div className="mb-2">
      <div className="text-[10px] uppercase tracking-widest text-slate-500">{label}</div>
      <div className={`text-sm ${mono ? 'font-mono text-emerald-300' : 'text-slate-200'}`}>{value}</div>
    </div>
  );
}
function KVList({ label, items, dense }) {
  if (!items || items.length === 0) return null;
  return (
    <div className={dense ? 'mt-1.5' : 'mb-2'}>
      {label && <div className="text-[10px] uppercase tracking-widest text-slate-500">{label}</div>}
      <ul className="list-disc list-inside text-sm text-slate-300 space-y-0.5">
        {items.map((s, i) => <li key={i}>{s}</li>)}
      </ul>
    </div>
  );
}
function Empty() { return <div className="text-xs text-slate-500 italic">No entries.</div>; }
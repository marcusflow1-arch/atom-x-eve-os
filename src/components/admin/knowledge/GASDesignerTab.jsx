import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Swords, Loader2, Save, Sparkles, Zap, Sliders, Tag, GitBranch, Radio, Monitor, Flame } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import KnowledgeStatusBanner from './KnowledgeStatusBanner';
import { designGASSystem } from './gasDesigner';
import { showError, showSuccess } from '@/components/error/ErrorToast';

// ─── GAS Specialist Tab ─────────────────────────────────────────────────
export default function GASDesignerTab() {
  const [prompt, setPrompt] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);

  const run = async (save = false) => {
    if (!prompt.trim()) return;
    setBusy(true);
    setResult(null);
    try {
      const r = await designGASSystem(prompt.trim(), { save });
      setResult(r);
      if (save) showSuccess('GAS design saved into the Knowledge Library.');
    } catch (err) {
      showError(err, 'GAS Designer');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <KnowledgeStatusBanner />

      <section className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Swords className="w-6 h-6 text-rose-400" />
          <h2 className="text-2xl font-bold">GAS Specialist (Combat &amp; Skills)</h2>
        </div>
        <p className="text-slate-400 text-sm mb-4">
          Designs Unreal-compliant Gameplay Ability System architectures: abilities,
          gameplay effects, attribute set, tag hierarchy, execution pipeline, and
          replication. Grounded in your knowledge base.
        </p>

        <Textarea
          placeholder='e.g. "RPG fire mage skill tree with fireball, ignite DoT, mana shield, and ultimate meteor"'
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          className="bg-slate-800 border-slate-700 h-24 mb-3"
          disabled={busy}
        />
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => run(false)} disabled={busy || !prompt.trim()} className="bg-rose-600 hover:bg-rose-700">
            {busy ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
            Design GAS System
          </Button>
          <Button onClick={() => run(true)} disabled={busy || !prompt.trim()} variant="outline">
            <Save className="w-4 h-4 mr-2" />
            Design &amp; Save
          </Button>
        </div>
      </section>

      {result && <DesignView result={result} />}
    </div>
  );
}

function DesignView({ result }) {
  const d = result.design || {};
  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      <Section icon={Flame} title="Overview" color="text-cyan-300">
        <KV label="Title"   value={d.title} />
        <KV label="Summary" value={d.summary} />
      </Section>

      <Section icon={Zap} title="Abilities" color="text-orange-300">
        {(d.abilities || []).length === 0 ? <Empty /> : (
          <div className="space-y-2">
            {d.abilities.map((a, i) => (
              <div key={i} className="bg-slate-800/40 border border-slate-700 rounded p-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <code className="text-emerald-300 font-mono text-sm">{a.class_name}</code>
                  <span className="text-sm text-slate-200">— {a.display_name}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-300 border border-orange-500/30">{a.activation_type}</span>
                  {a.replication_policy && <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">{a.replication_policy}</span>}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 mt-2 text-xs">
                  <KV label="Input Tag"        value={a.input_tag} mono />
                  <KV label="Cooldown (s)"     value={a.cooldown_seconds != null ? String(a.cooldown_seconds) : ''} />
                  <KV label="Cost Effect"      value={a.cost_effect} mono />
                  <KV label="Cooldown Effect"  value={a.cooldown_effect} mono />
                  <KV label="Montage"          value={a.animation_montage} mono />
                </div>
                <TagList label="Ability Tags"   items={a.ability_tags}   color="emerald" />
                <TagList label="Block Tags"     items={a.block_tags}     color="rose" />
                <TagList label="Cancel Tags"    items={a.cancel_tags}    color="amber" />
                <TagList label="Required Tags"  items={a.required_tags}  color="cyan" />
                <KVList  label="Damage Effects" items={a.damage_effects} />
              </div>
            ))}
          </div>
        )}
      </Section>

      <Section icon={Sliders} title="Gameplay Effects" color="text-violet-300">
        {(d.gameplay_effects || []).length === 0 ? <Empty /> : (
          <div className="space-y-2">
            {d.gameplay_effects.map((ge, i) => (
              <div key={i} className="bg-slate-800/40 border border-slate-700 rounded p-2.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <code className="text-violet-200 font-mono text-sm">{ge.class_name}</code>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-violet-500/20 text-violet-300 border border-violet-500/30">{ge.kind}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-700 text-slate-300">{ge.duration_policy}</span>
                  {ge.duration_seconds != null && <span className="text-[10px] text-slate-400">duration {ge.duration_seconds}s</span>}
                  {ge.period_seconds != null && <span className="text-[10px] text-slate-400">period {ge.period_seconds}s</span>}
                </div>
                {(ge.modifiers || []).length > 0 && (
                  <table className="w-full text-xs mt-2">
                    <thead className="text-slate-500"><tr><th className="text-left">Attribute</th><th className="text-left">Op</th><th className="text-left">Magnitude</th></tr></thead>
                    <tbody>
                      {ge.modifiers.map((m, j) => (
                        <tr key={j} className="border-t border-slate-800">
                          <td className="font-mono text-emerald-300 py-1">{m.attribute}</td>
                          <td className="text-slate-300">{m.op}</td>
                          <td className="text-slate-400">{m.magnitude}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
                <div className="text-[10px] text-slate-500 mt-1">
                  stacking: {ge.stacking || '—'} {ge.max_stacks ? `· max ${ge.max_stacks}` : ''}
                </div>
                <TagList label="Granted Tags" items={ge.granted_tags} color="emerald" />
                <TagList label="Removed Tags" items={ge.removed_tags} color="rose" />
              </div>
            ))}
          </div>
        )}
      </Section>

      <Section icon={Sliders} title="Attribute Set" color="text-sky-300">
        {!d.attribute_set ? <Empty /> : (
          <>
            <div className="text-xs text-slate-400 mb-2">Class: <code className="text-emerald-300 font-mono">{d.attribute_set.class_name}</code></div>
            <table className="w-full text-xs">
              <thead className="text-slate-500"><tr><th className="text-left">Name</th><th className="text-left">Base</th><th className="text-left">Cap</th><th className="text-left">Regen</th><th className="text-left">Scaling</th><th className="text-left">Replicated</th></tr></thead>
              <tbody>
                {(d.attribute_set.attributes || []).map((a, i) => (
                  <tr key={i} className="border-t border-slate-800">
                    <td className="py-1 font-mono text-emerald-300">{a.name}</td>
                    <td className="text-slate-300">{a.base}</td>
                    <td className="text-slate-400">{a.cap}</td>
                    <td className="text-slate-400">{a.regen_rule}</td>
                    <td className="text-slate-400">{a.scaling}</td>
                    <td className="text-slate-400">{a.replicated ? 'yes' : 'no'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <KVList label="Clamping Rules"     items={d.attribute_set.clamping_rules} />
            <KVList label="Derived Attributes" items={d.attribute_set.derived_attributes} />
          </>
        )}
      </Section>

      <Section icon={Tag} title="Gameplay Tags" color="text-amber-300">
        {(d.gameplay_tags || []).length === 0 ? <Empty /> : (
          <div className="space-y-1.5">
            {d.gameplay_tags.map((t, i) => (
              <div key={i} className="text-xs bg-slate-800/40 border border-slate-700 rounded p-2">
                <code className="text-amber-200 font-mono">{t.tag}</code>
                <span className="text-slate-400"> — {t.purpose}</span>
                {(t.used_by?.length > 0) && <div className="text-[10px] text-slate-500 mt-0.5">used by: {t.used_by.join(', ')}</div>}
              </div>
            ))}
          </div>
        )}
      </Section>

      <Section icon={GitBranch} title="Execution Pipeline" color="text-teal-300">
        {(d.execution_pipeline || []).length === 0 ? <Empty /> : (
          <ol className="space-y-1">
            {d.execution_pipeline.map((step, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-teal-500/20 text-teal-300 border border-teal-500/30 mt-0.5">{i + 1}</span>
                <span className="text-slate-200">{step}</span>
              </li>
            ))}
          </ol>
        )}
      </Section>

      <Section icon={Radio} title="Replication" color="text-rose-300">
        {!d.replication ? <Empty /> : (
          <>
            <KV label="ASC Owner" value={d.replication.ability_system_component_owner} mono />
            <KVList label="Prediction Notes" items={d.replication.prediction_notes} />
            <KVList label="RPCs"             items={d.replication.rpcs} />
          </>
        )}
      </Section>

      <Section icon={Monitor} title="UI Integration" color="text-cyan-300">
        {(d.ui_integration || []).length === 0 ? <Empty /> : (
          <div className="space-y-1.5">
            {d.ui_integration.map((u, i) => (
              <div key={i} className="text-xs bg-slate-800/40 border border-slate-700 rounded p-2">
                <code className="text-cyan-200 font-mono">{u.widget}</code>
                <span className="text-slate-500"> binds to </span>
                <code className="text-emerald-300 font-mono">{u.binds_to}</code>
                <span className="text-slate-500"> via {u.method}</span>
              </div>
            ))}
          </div>
        )}
      </Section>
    </motion.div>
  );
}

// ─── Helpers ────────────────────────────────────────────────────────────
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
  if (value === undefined || value === null || value === '') return null;
  return (
    <div className="mb-1.5">
      <div className="text-[10px] uppercase tracking-widest text-slate-500">{label}</div>
      <div className={`text-sm ${mono ? 'font-mono text-emerald-300' : 'text-slate-200'}`}>{value}</div>
    </div>
  );
}
function KVList({ label, items }) {
  if (!items || items.length === 0) return null;
  return (
    <div className="mt-1.5">
      {label && <div className="text-[10px] uppercase tracking-widest text-slate-500">{label}</div>}
      <ul className="list-disc list-inside text-sm text-slate-300 space-y-0.5">
        {items.map((s, i) => <li key={i}>{s}</li>)}
      </ul>
    </div>
  );
}
function TagList({ label, items, color }) {
  if (!items || items.length === 0) return null;
  const map = {
    emerald: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300',
    rose:    'bg-rose-500/15 border-rose-500/30 text-rose-300',
    amber:   'bg-amber-500/15 border-amber-500/30 text-amber-300',
    cyan:    'bg-cyan-500/15 border-cyan-500/30 text-cyan-300',
  };
  return (
    <div className="mt-1.5">
      <div className="text-[10px] uppercase tracking-widest text-slate-500 mb-1">{label}</div>
      <div className="flex flex-wrap gap-1">
        {items.map((t, i) => (
          <span key={i} className={`text-[10px] px-1.5 py-0.5 rounded border font-mono ${map[color] || map.cyan}`}>{t}</span>
        ))}
      </div>
    </div>
  );
}
function Empty() { return <div className="text-xs text-slate-500 italic">No entries.</div>; }
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Cpu, Loader2, Save, Sparkles, FileCode, Layers, GitBranch, Database, Network, Zap, Monitor, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import KnowledgeStatusBanner from './KnowledgeStatusBanner';
import { translateToUE5Blueprint } from './ue5Translator';
import { showError, showSuccess } from '@/components/error/ErrorToast';

// ─── UE5 Architecture Translator Tab ─────────────────────────────────────
// Natural-language request → structured UE5 implementation blueprint.
export default function UE5TranslatorTab() {
  const [prompt, setPrompt] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);

  const run = async (save = false) => {
    if (!prompt.trim()) return;
    setBusy(true);
    setResult(null);
    try {
      const r = await translateToUE5Blueprint(prompt.trim(), { save });
      setResult(r);
      if (save) showSuccess('Blueprint saved into the Knowledge Library.');
    } catch (err) {
      showError(err, 'UE5 Translator');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <KnowledgeStatusBanner />

      <section className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Cpu className="w-6 h-6 text-emerald-400" />
          <h2 className="text-2xl font-bold">UE5 Architecture Translator</h2>
        </div>
        <p className="text-slate-400 text-sm mb-4">
          Natural-language gameplay request → structured Unreal Engine 5 implementation blueprint.
          Pulls context from Vector Memory + Unreal Docs + your Google Docs design library before
          generating an engine-aligned architecture plan.
        </p>

        <Textarea
          placeholder='e.g. "Create a fireball skill system" or "Design a ranged weapon combat system with cooldowns"'
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          className="bg-slate-800 border-slate-700 h-24 mb-3"
          disabled={busy}
        />
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => run(false)} disabled={busy || !prompt.trim()} className="bg-emerald-600 hover:bg-emerald-700">
            {busy ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
            Translate to UE5 Blueprint
          </Button>
          <Button onClick={() => run(true)} disabled={busy || !prompt.trim()} variant="outline">
            <Save className="w-4 h-4 mr-2" />
            Translate &amp; Save
          </Button>
        </div>
      </section>

      {result && <BlueprintView result={result} />}
    </div>
  );
}

function BlueprintView({ result }) {
  const bp = result.blueprint || {};
  const ctx = result.context || {};

  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      {/* Context summary */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-4">
        <div className="text-xs uppercase tracking-widest text-slate-400 mb-2">Retrieval Context</div>
        <div className="flex flex-wrap gap-1.5 text-xs">
          <Pill color="emerald">Mode: {ctx.retrieval?.retrieval || '—'}</Pill>
          <Pill color="cyan">Chunks: {ctx.retrieval?.chunk_count || 0}</Pill>
          {(ctx.ue5Systems || []).map((s) => <Pill key={s} color="violet">{s}</Pill>)}
          {(ctx.docCategories || []).map((c) => <Pill key={c} color="slate">{c}</Pill>)}
        </div>
      </div>

      <Section icon={BookOpen} title="1. System Overview" color="text-cyan-300">
        <KV label="What"      value={bp.system_overview?.what} />
        <KV label="Purpose"   value={bp.system_overview?.purpose} />
        <KV label="Core Loop" value={bp.system_overview?.core_loop} />
      </Section>

      <Section icon={Layers} title="2. UE5 Class Architecture" color="text-violet-300">
        {(bp.class_architecture || []).length === 0 ? <Empty /> : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {bp.class_architecture.map((c, i) => (
              <div key={i} className="bg-slate-800/50 border border-slate-700 rounded p-2.5">
                <div className="flex items-center gap-2">
                  <code className="text-emerald-300 text-sm font-mono">{c.name}</code>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-violet-500/20 text-violet-300 border border-violet-500/30">{c.kind}</span>
                </div>
                {c.parent && <div className="text-xs text-slate-500 mt-0.5">extends <code>{c.parent}</code></div>}
                <div className="text-xs text-slate-300 mt-1">{c.responsibility}</div>
              </div>
            ))}
          </div>
        )}
      </Section>

      <Section icon={GitBranch} title="3. System Flow (Execution Pipeline)" color="text-amber-300">
        {(bp.system_flow || []).length === 0 ? <Empty /> : (
          <ol className="space-y-1.5">
            {bp.system_flow.map((step, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 mt-0.5">{i + 1}</span>
                <span className="text-slate-200">{step}</span>
              </li>
            ))}
          </ol>
        )}
      </Section>

      <Section icon={Database} title="4. Data Architecture" color="text-sky-300">
        <KVList label="Structs"             items={bp.data_architecture?.structs} />
        <KVList label="Data Tables"         items={bp.data_architecture?.data_tables} />
        <KVList label="Curves"              items={bp.data_architecture?.curves} />
        <KVList label="Formulas"            items={bp.data_architecture?.formulas} />
        <KVList label="Stat Relationships"  items={bp.data_architecture?.stat_relationships} />
      </Section>

      <Section icon={FileCode} title="5. Blueprint Logic Layer" color="text-fuchsia-300">
        {(bp.blueprint_logic || []).length === 0 ? <Empty /> : (
          <div className="space-y-2">
            {bp.blueprint_logic.map((b, i) => (
              <div key={i} className="bg-slate-800/50 border border-slate-700 rounded p-2.5">
                <div className="text-sm text-fuchsia-200 font-medium">{b.graph}</div>
                {b.flow && <div className="text-xs text-slate-300 mt-1">{b.flow}</div>}
                <KVList label="Triggers"  items={b.triggers} dense />
                <KVList label="Delegates" items={b.delegates} dense />
                <KVList label="Bindings"  items={b.bindings} dense />
              </div>
            ))}
          </div>
        )}
      </Section>

      <Section icon={Zap} title="6. Gameplay Ability / Logic Design" color="text-rose-300">
        <KV label="Cooldowns"      value={bp.ability_logic?.cooldowns} />
        <KV label="Buffs/Debuffs"  value={bp.ability_logic?.buffs_debuffs} />
        <KV label="Stacking Rules" value={bp.ability_logic?.stacking_rules} />
        <KV label="Damage Scaling" value={bp.ability_logic?.damage_scaling} />
        <KV label="Hit Detection"  value={bp.ability_logic?.hit_detection} />
      </Section>

      <Section icon={Monitor} title="7. UI Integration (UMG)" color="text-teal-300">
        <KVList label="HUD Elements"      items={bp.ui_integration?.hud_elements} />
        <KVList label="Widget Hierarchy"  items={bp.ui_integration?.widget_hierarchy} />
        <KVList label="Event Bindings"    items={bp.ui_integration?.event_bindings} />
        <KVList label="Live Stat Updates" items={bp.ui_integration?.live_stat_updates} />
      </Section>

      <Section icon={Network} title="8. Implementation Notes" color="text-lime-300">
        <KVList label="C++ Systems"          items={bp.implementation_notes?.cpp_systems} />
        <KVList label="Blueprint Systems"    items={bp.implementation_notes?.blueprint_systems} />
        <KVList label="Performance"          items={bp.implementation_notes?.performance_notes} />
        <KVList label="Replication"          items={bp.implementation_notes?.replication_notes} />
        <KVList label="Modular Design Rules" items={bp.implementation_notes?.modular_design_rules} />
      </Section>

      {(bp.referenced_context || []).length > 0 && (
        <Section icon={BookOpen} title="Referenced Knowledge" color="text-slate-300">
          <div className="space-y-1.5">
            {bp.referenced_context.map((r, i) => (
              <div key={i} className="text-xs border-l-2 border-slate-600 pl-3 py-1">
                <div className="text-slate-300 font-medium">{r.source}</div>
                <div className="text-slate-500">{r.excerpt}</div>
              </div>
            ))}
          </div>
        </Section>
      )}
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
function KVList({ label, items, dense }) {
  if (!items || items.length === 0) return null;
  return (
    <div className={dense ? 'mt-1.5' : 'mb-2'}>
      <div className="text-[10px] uppercase tracking-widest text-slate-500">{label}</div>
      <ul className="list-disc list-inside text-sm text-slate-300 space-y-0.5">
        {items.map((s, i) => <li key={i}>{s}</li>)}
      </ul>
    </div>
  );
}
function Pill({ color, children }) {
  const map = {
    emerald: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300',
    cyan:    'bg-cyan-500/15 border-cyan-500/30 text-cyan-300',
    violet:  'bg-violet-500/15 border-violet-500/30 text-violet-300',
    slate:   'bg-slate-700/40 border-slate-600 text-slate-300',
  };
  return <span className={`text-[10px] px-2 py-0.5 rounded border ${map[color] || map.slate}`}>{children}</span>;
}
function Empty() { return <div className="text-xs text-slate-500 italic">No entries.</div>; }
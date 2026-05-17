import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Boxes, Loader2, Sparkles, Save, Network, Gauge, TrendingUp, Package, Shuffle, Cpu, ListOrdered, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import KnowledgeStatusBanner from './KnowledgeStatusBanner';
import { compileRPGSystem } from './rpgSystemCompiler';
import { showError, showSuccess } from '@/components/error/ErrorToast';

const ALL_SYSTEMS = ['Skills', 'Titles', 'Halos', 'Weapons', 'Inventory', 'Progression', 'UI', 'Companions'];

// ─── RPG System Compiler Tab ─────────────────────────────────────────────
// Synthesizes ALL game systems into one unified ecosystem.
export default function RPGSystemCompilerTab() {
  const [prompt, setPrompt] = useState('');
  const [systems, setSystems] = useState(ALL_SYSTEMS);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);

  const toggleSystem = (s) =>
    setSystems((cur) => (cur.includes(s) ? cur.filter((x) => x !== s) : [...cur, s]));

  const run = async (save = false) => {
    if (!prompt.trim()) return;
    setBusy(true);
    setResult(null);
    try {
      const r = await compileRPGSystem({ userPrompt: prompt.trim(), selectedSystems: systems, save });
      setResult(r);
      if (save) showSuccess('Unified RPG architecture saved to Knowledge Library.');
    } catch (err) {
      showError(err, 'RPG Compiler');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <KnowledgeStatusBanner />

      <section className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Boxes className="w-6 h-6 text-pink-400" />
          <h2 className="text-2xl font-bold">RPG System Compiler</h2>
        </div>
        <p className="text-slate-400 text-sm mb-4">
          Unifies skills, titles, halos, weapons, inventory, progression, UI, and companions into
          one interconnected RPG architecture — with a global dependency map, unified stat engine,
          progression curve, drop integration, and cross-system interaction rules.
        </p>

        <Textarea
          placeholder='e.g. "Action MMO with halo buffs, title specializations, and a 7-tier rarity drop system"'
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          className="bg-slate-800 border-slate-700 h-24 mb-3"
          disabled={busy}
        />

        <div className="mb-3">
          <div className="text-[10px] uppercase tracking-widest text-slate-500 mb-1.5">Systems to unify</div>
          <div className="flex flex-wrap gap-1.5">
            {ALL_SYSTEMS.map((s) => {
              const on = systems.includes(s);
              return (
                <button
                  key={s}
                  onClick={() => toggleSystem(s)}
                  disabled={busy}
                  className={`text-xs px-2.5 py-1 rounded-full border transition-all ${
                    on
                      ? 'bg-pink-500/20 border-pink-500/40 text-pink-200'
                      : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {s}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button onClick={() => run(false)} disabled={busy || !prompt.trim() || systems.length === 0}
                  className="bg-pink-600 hover:bg-pink-700">
            {busy ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
            Compile Unified RPG
          </Button>
          <Button onClick={() => run(true)} disabled={busy || !prompt.trim() || systems.length === 0} variant="outline">
            <Save className="w-4 h-4 mr-2" /> Compile &amp; Save
          </Button>
        </div>
      </section>

      {result && <CompiledView result={result} />}
    </div>
  );
}

function CompiledView({ result }) {
  const c = result.compiled || {};
  const ctx = result.context || {};

  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      {/* Header */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-4">
        <div className="text-pink-200 text-lg font-bold">{c.title || 'Unified RPG Architecture'}</div>
        {c.summary && <p className="text-sm text-slate-300 mt-1">{c.summary}</p>}
        <div className="flex flex-wrap gap-1.5 mt-2 text-xs">
          <Pill color="pink">Retrieval: {ctx.retrieval?.retrieval || '—'}</Pill>
          <Pill color="cyan">Chunks: {ctx.retrieval?.chunk_count || 0}</Pill>
          {(ctx.docCategories || []).map((d) => <Pill key={d} color="slate">{d}</Pill>)}
        </div>
      </div>

      {/* 1. Dependency map */}
      <Section icon={Network} title="1. Global System Dependency Map" color="text-cyan-300">
        {(c.dependency_map || []).length === 0 ? <Empty /> : (
          <div className="space-y-1">
            {c.dependency_map.map((d, i) => (
              <div key={i} className="flex items-start gap-2 text-sm border-l-2 border-cyan-500/40 pl-3 py-1">
                <code className="text-emerald-300">{d.from}</code>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-mono">
                  {d.relation}
                </span>
                <code className="text-violet-300">{d.to}</code>
                <span className="text-slate-400 text-xs ml-auto">{d.description}</span>
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* 2. Stat engine */}
      <Section icon={Gauge} title="2. Unified Stat Engine" color="text-amber-300">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <SubLabel>Core Attributes</SubLabel>
            {(c.stat_engine?.core_attributes || []).length === 0 ? <Empty /> : (
              <div className="space-y-1.5">
                {c.stat_engine.core_attributes.map((a, i) => (
                  <div key={i} className="bg-slate-800/50 border border-slate-700 rounded p-2 text-xs">
                    <div className="text-amber-200 font-semibold">{a.name}</div>
                    {a.derived?.length > 0 && <div className="text-slate-400">Derives: {a.derived.join(', ')}</div>}
                    <div className="text-slate-500">range: {a.base_range || '—'} · cap: {a.cap || '—'}</div>
                    {a.regen_rule && <div className="text-slate-400 italic">regen: {a.regen_rule}</div>}
                  </div>
                ))}
              </div>
            )}
          </div>
          <div>
            <SubLabel>Secondary Systems</SubLabel>
            {(c.stat_engine?.secondary_systems || []).length === 0 ? <Empty /> : (
              <div className="space-y-1.5">
                {c.stat_engine.secondary_systems.map((s, i) => (
                  <div key={i} className="bg-slate-800/50 border border-slate-700 rounded p-2 text-xs">
                    <div className="text-amber-200 font-semibold">{s.name}</div>
                    <code className="text-slate-300">{s.formula}</code>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="mt-3">
          <SubLabel>Modifier Pipeline (apply order)</SubLabel>
          {(c.stat_engine?.modifier_pipeline || []).length === 0 ? <Empty /> : (
            <div className="text-xs bg-slate-900/70 border border-slate-700 rounded p-2 font-mono text-emerald-200 overflow-x-auto whitespace-nowrap">
              {c.stat_engine.modifier_pipeline.join(' → ')}
            </div>
          )}
        </div>

        <KVList label="Stacking Rules"   items={c.stat_engine?.stacking_rules} />
        <KVList label="Override Priority" items={c.stat_engine?.override_priority} />
      </Section>

      {/* 3. Progression */}
      <Section icon={TrendingUp} title="3. Progression Architecture" color="text-emerald-300">
        <KV label="Leveling Model"        value={c.progression?.leveling_model} />
        <KV label="XP Curve Formula"      value={c.progression?.xp_curve_formula} />
        <KV label="Drop-rate Integration" value={c.progression?.drop_rate_integration} />
        <KVList label="Soft Caps"         items={c.progression?.soft_caps} />
        {(c.progression?.skill_unlock_thresholds || []).length > 0 && (
          <>
            <SubLabel>Skill Unlock Thresholds</SubLabel>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-1.5">
              {c.progression.skill_unlock_thresholds.map((t, i) => (
                <div key={i} className="bg-slate-800/50 border border-slate-700 rounded p-2 text-xs">
                  <div className="text-emerald-200 font-bold">Lv {t.level}</div>
                  <div className="text-slate-300">{(t.unlocks || []).join(', ')}</div>
                </div>
              ))}
            </div>
          </>
        )}
      </Section>

      {/* 4. Drop system */}
      <Section icon={Package} title="4. Item + Skill Drop System" color="text-fuchsia-300">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <SubLabel>Rarity Tiers</SubLabel>
            <div className="flex flex-wrap gap-1">
              {(c.drop_system?.rarity_tiers || []).map((r, i) => (
                <span key={i} className="text-[10px] px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-200">
                  {r}
                </span>
              ))}
            </div>
            <div className="mt-2"><KVList label="Upgrade Materials"  items={c.drop_system?.upgrade_materials} /></div>
            <KVList label="Evolution Tiers" items={c.drop_system?.evolution_tiers} />
            <KV label="Skill Acquisition" value={c.drop_system?.skill_acquisition} />
          </div>
          <div>
            <SubLabel>Drop Tables</SubLabel>
            {(c.drop_system?.drop_tables || []).length === 0 ? <Empty /> : (
              <div className="space-y-1.5">
                {c.drop_system.drop_tables.map((t, i) => (
                  <div key={i} className="bg-slate-800/50 border border-slate-700 rounded p-2 text-xs">
                    <div className="text-fuchsia-200 font-semibold">{t.name}</div>
                    <div className="text-slate-400">source: <span className="text-slate-200">{t.source}</span></div>
                    <ul className="list-disc list-inside text-slate-300 mt-1">
                      {(t.entries || []).map((e, j) => <li key={j}>{e}</li>)}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </Section>

      {/* 5. Interaction rules */}
      <Section icon={Shuffle} title="5. Cross-System Interaction Rules" color="text-rose-300">
        {(c.interaction_rules || []).length === 0 ? <Empty /> : (
          <div className="space-y-2">
            {c.interaction_rules.map((r, i) => (
              <div key={i} className="bg-slate-800/50 border border-slate-700 rounded p-2.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-rose-200 font-semibold text-sm">{r.rule}</span>
                  <div className="flex flex-wrap gap-1">
                    {(r.systems || []).map((s, j) => (
                      <span key={j} className="text-[10px] px-1.5 py-0.5 rounded bg-rose-500/15 text-rose-300 border border-rose-500/30">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="text-xs text-slate-300 mt-1">{r.effect}</div>
                {r.example && <div className="text-[11px] text-slate-500 italic mt-0.5">e.g. {r.example}</div>}
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* UE5 hand-off */}
      <Section icon={Cpu} title="UE5 Hand-off (Modules + Key Classes)" color="text-violet-300">
        {(c.ue5_systems || []).length === 0 ? <Empty /> : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {c.ue5_systems.map((s, i) => (
              <div key={i} className="bg-slate-800/50 border border-slate-700 rounded p-2.5 text-xs">
                <div className="text-violet-200 font-semibold">{s.system}</div>
                {s.ue5_modules?.length > 0 && (
                  <div className="text-slate-400">Modules: {s.ue5_modules.join(', ')}</div>
                )}
                {s.key_classes?.length > 0 && (
                  <div className="text-slate-300 mt-0.5">
                    {s.key_classes.map((k, j) => <code key={j} className="text-emerald-300 mr-1">{k}</code>)}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* Build order */}
      <Section icon={ListOrdered} title="Implementation Build Order" color="text-sky-300">
        {(c.build_order || []).length === 0 ? <Empty /> : (
          <ol className="space-y-1.5">
            {c.build_order.map((step, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-500/30 mt-0.5">
                  {i + 1}
                </span>
                <span className="text-slate-200">{step}</span>
              </li>
            ))}
          </ol>
        )}
      </Section>

      {(c.referenced_context || []).length > 0 && (
        <Section icon={BookOpen} title="Referenced Knowledge" color="text-slate-300">
          <div className="space-y-1.5">
            {c.referenced_context.map((r, i) => (
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
function SubLabel({ children }) {
  return <div className="text-[10px] uppercase tracking-widest text-slate-500 mb-1 mt-1">{children}</div>;
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
    <div className="mb-2 mt-1">
      <div className="text-[10px] uppercase tracking-widest text-slate-500">{label}</div>
      <ul className="list-disc list-inside text-sm text-slate-300 space-y-0.5">
        {items.map((s, i) => <li key={i}>{s}</li>)}
      </ul>
    </div>
  );
}
function Pill({ color, children }) {
  const map = {
    pink:  'bg-pink-500/15 border-pink-500/30 text-pink-300',
    cyan:  'bg-cyan-500/15 border-cyan-500/30 text-cyan-300',
    slate: 'bg-slate-700/40 border-slate-600 text-slate-300',
  };
  return <span className={`text-[10px] px-2 py-0.5 rounded border ${map[color] || map.slate}`}>{children}</span>;
}
function Empty() { return <div className="text-xs text-slate-500 italic">No entries.</div>; }
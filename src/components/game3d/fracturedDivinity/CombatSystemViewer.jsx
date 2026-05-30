import React, { useState } from 'react';
import {
  CONTROL_METER, PERCEPTION_MODE, COPY_SYSTEM, ARTEMIS_SUPPORT,
  ENEMY_TYPES, BASE_ABILITIES, ADVANCED_ABILITIES, DIALOGUE_TRIGGERS,
  BOSS_FIGHTS, PROGRESSION_SYSTEM, CHOICE_IMPACT_MATRIX,
  FINAL_ARC_GAMEPLAY, DYNAMIC_UI, EXAMPLE_GAMEPLAY_MOMENT,
} from './combatSystem';
import { ChevronDown, ChevronRight, Shield, Eye, Zap, Users, Sword, Cpu, BarChart3, Layers } from 'lucide-react';

const TABS = [
  { id: 'overview',    label: 'Core Systems',  icon: Layers },
  { id: 'enemies',     label: 'Enemies',       icon: Cpu },
  { id: 'abilities',   label: 'Abilities',     icon: Zap },
  { id: 'dialogue',    label: 'Dialogue Triggers', icon: Users },
  { id: 'bosses',      label: 'Bosses',        icon: Sword },
  { id: 'progression', label: 'Progression',   icon: BarChart3 },
];

function Collapsible({ title, subtitle, color = '#6ec3ff', children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="mb-4 rounded-xl overflow-hidden"
      style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)' }}>
      <button onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-white/[0.03] transition-all">
        <div className="w-2 h-2 rounded-full shrink-0" style={{ background: color }} />
        <div className="flex-1">
          <div className="text-sm font-semibold text-white/85">{title}</div>
          {subtitle && <div className="text-[11px] text-white/40 mt-0.5 italic">{subtitle}</div>}
        </div>
        {open ? <ChevronDown className="w-4 h-4 text-white/40" /> : <ChevronRight className="w-4 h-4 text-white/40" />}
      </button>
      {open && <div className="px-5 pb-5 border-t border-white/[0.06] pt-4">{children}</div>}
    </div>
  );
}

function Tag({ text, color = 'rgba(255,255,255,0.10)' }) {
  return (
    <span className="text-[9px] tracking-[0.15em] uppercase px-2 py-0.5 rounded-full"
      style={{ background: color, color: 'rgba(255,255,255,0.55)' }}>
      {text}
    </span>
  );
}

function DeltaBadge({ value }) {
  const pos = value > 0;
  return (
    <span className="text-[10px] font-bold px-2 py-0.5 rounded"
      style={{
        background: pos ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)',
        color: pos ? '#86efac' : '#fca5a5',
        border: `1px solid ${pos ? 'rgba(34,197,94,0.25)' : 'rgba(239,68,68,0.25)'}`,
      }}>
      {pos ? '+' : ''}{value}
    </span>
  );
}

// ── TAB: CORE SYSTEMS ─────────────────────────────────────────────────────────
function CoreSystemsTab() {
  return (
    <div>
      {/* Control Meter */}
      <Collapsible title="Control Meter" subtitle={CONTROL_METER.description} color="#6ec3ff" defaultOpen>
        <div className="grid grid-cols-3 gap-3 mb-4">
          {Object.entries(CONTROL_METER.thresholds).map(([key, t]) => (
            <div key={key} className="rounded-lg p-3 text-center"
              style={{
                background: key === 'HIGH' ? 'rgba(34,197,94,0.08)' : key === 'MID' ? 'rgba(250,204,21,0.08)' : 'rgba(239,68,68,0.08)',
                border: `1px solid ${key === 'HIGH' ? 'rgba(34,197,94,0.25)' : key === 'MID' ? 'rgba(250,204,21,0.25)' : 'rgba(239,68,68,0.25)'}`,
              }}>
              <div className="text-[10px] font-bold tracking-[0.2em] uppercase mb-2"
                style={{ color: key === 'HIGH' ? '#86efac' : key === 'MID' ? '#fde68a' : '#fca5a5' }}>
                {t.label}
              </div>
              <div className="text-[10px] text-white/40">{t.min}–{t.max}</div>
              <div className="mt-2 space-y-1">
                {CONTROL_METER.effects[key].map((e, i) => (
                  <div key={i} className="text-[10px] text-white/55 text-left">• {e}</div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div>
          <div className="text-[10px] tracking-[0.3em] uppercase text-white/30 mb-2">Modifiers</div>
          <div className="space-y-1">
            {CONTROL_METER.modifiers.map((m, i) => (
              <div key={i} className="flex items-center gap-2 py-1">
                <DeltaBadge value={m.delta} />
                <span className="text-[11px] text-white/60">{m.label}</span>
              </div>
            ))}
          </div>
        </div>
      </Collapsible>

      {/* Perception Mode */}
      <Collapsible title="Perception Mode" subtitle={PERCEPTION_MODE.description} color="#a78bfa">
        <div className="grid grid-cols-2 gap-3 mb-4">
          {Object.values(PERCEPTION_MODE.modes).map(mode => (
            <div key={mode.id} className="rounded-lg p-3"
              style={{ background: `${mode.color}12`, border: `1px solid ${mode.color}33` }}>
              <div className="text-[11px] font-bold mb-2" style={{ color: mode.color }}>{mode.label}</div>
              {mode.effects.map((e, i) => (
                <div key={i} className="text-[10px] text-white/55 mb-1">• {e}</div>
              ))}
            </div>
          ))}
        </div>
        <div className="text-[10px] tracking-[0.2em] uppercase text-white/30 mb-2">Enemy Layer Exclusivity</div>
        <div className="space-y-1">
          {PERCEPTION_MODE.enemyExclusivity.map((e, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-[10px] text-white/55 w-40">{e.enemy}</span>
              <div className="flex gap-1">
                {e.visibleIn.map(v => (
                  <Tag key={v} text={v} color={v === 'PERCEPTION' ? 'rgba(167,139,250,0.15)' : 'rgba(110,195,255,0.15)'} />
                ))}
              </div>
              {e.note && <span className="text-[9px] text-white/30 italic">{e.note}</span>}
            </div>
          ))}
        </div>
      </Collapsible>

      {/* Copy System */}
      <Collapsible title="The Copy System" subtitle={COPY_SYSTEM.description} color="#c4b5fd">
        <div className="grid grid-cols-2 gap-3">
          {Object.entries(COPY_SYSTEM.variants).map(([key, v]) => (
            <div key={key} className="rounded-lg p-3"
              style={{ background: 'rgba(167,139,250,0.06)', border: '1px solid rgba(167,139,250,0.20)' }}>
              <div className="text-[10px] font-bold tracking-[0.2em] uppercase text-purple-300 mb-2">{v.label}</div>
              {v.combatBehavior.map((b, i) => (
                <div key={i} className="text-[10px] text-white/55 mb-1">• {b}</div>
              ))}
            </div>
          ))}
        </div>
      </Collapsible>

      {/* Artemis Support */}
      <Collapsible title="Artemis Support System" subtitle={ARTEMIS_SUPPORT.description} color="#f9a8d4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
          {ARTEMIS_SUPPORT.abilities.map(a => (
            <div key={a.id} className="rounded-lg p-3"
              style={{ background: 'rgba(236,72,153,0.06)', border: '1px solid rgba(236,72,153,0.20)' }}>
              <div className="text-[11px] font-bold text-pink-300 mb-1">{a.name}</div>
              <div className="text-[10px] text-white/55 mb-2">{a.description}</div>
              <div className="flex flex-wrap gap-1">
                <Tag text={`CD: ${a.cooldown}s`} />
                {a.controlEffect > 0 && <DeltaBadge value={a.controlEffect} />}
              </div>
              <div className="text-[9px] text-white/30 mt-1 italic">{a.narrativeTrigger}</div>
            </div>
          ))}
        </div>
        <div className="text-[10px] tracking-[0.2em] uppercase text-white/30 mb-2">Strength by Arc</div>
        <div className="flex gap-2 flex-wrap">
          {ARTEMIS_SUPPORT.fadeProgression.levels.map((l, i) => (
            <div key={i} className="rounded p-2 text-center"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div className="text-[9px] text-white/35">{l.arc}</div>
              <div className="text-[13px] font-bold text-pink-300">{l.strength}%</div>
              <div className="text-[9px] text-white/40">{l.label}</div>
            </div>
          ))}
        </div>
      </Collapsible>
    </div>
  );
}

// ── TAB: ENEMIES ──────────────────────────────────────────────────────────────
function EnemiesTab() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {ENEMY_TYPES.map(e => (
        <div key={e.id} className="rounded-xl p-4"
          style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="flex items-start justify-between gap-2 mb-2">
            <div>
              <div className="text-sm font-bold text-white/85">{e.name}</div>
              <div className="text-[10px] text-white/35 mt-0.5 italic">{e.theme}</div>
            </div>
            <div className="flex flex-col items-end gap-1">
              <Tag text={`Arcs ${e.arcAppearance[0]}–${e.arcAppearance[1]}`} />
              <Tag text={e.perceptionLayer} color="rgba(167,139,250,0.15)" />
            </div>
          </div>
          <div className="space-y-1 mb-3">
            {e.combatBehavior.map((b, i) => (
              <div key={i} className="text-[10px] text-white/55">• {b}</div>
            ))}
          </div>
          {e.controlDrain > 0 && (
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[9px] text-white/30">Control drain:</span>
              <DeltaBadge value={-e.controlDrain} />
              {e.controlDrainType && <span className="text-[9px] text-white/25 italic">({e.controlDrainType})</span>}
            </div>
          )}
          <div className="rounded p-2 text-[10px]"
            style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.15)' }}>
            <span className="text-emerald-400/70 mr-1">Counter:</span>
            <span className="text-white/50">{e.counterMechanic}</span>
          </div>
          {e.specialNote && (
            <div className="text-[9px] text-white/30 italic mt-2">{e.specialNote}</div>
          )}
        </div>
      ))}
    </div>
  );
}

// ── TAB: ABILITIES ────────────────────────────────────────────────────────────
function AbilitiesTab() {
  return (
    <div>
      <div className="text-[10px] tracking-[0.3em] uppercase text-white/25 mb-3">Base Abilities</div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {BASE_ABILITIES.map(a => (
          <div key={a.id} className="rounded-lg p-3"
            style={{ background: 'rgba(110,195,255,0.06)', border: '1px solid rgba(110,195,255,0.18)' }}>
            <div className="text-[11px] font-bold text-cyan-300 mb-1">{a.name}</div>
            <div className="text-[10px] text-white/50 mb-2">{a.description}</div>
            <div className="flex flex-wrap gap-1">
              {a.cooldown > 0 && <Tag text={`CD: ${a.cooldown}s`} />}
              {a.controlEffect !== 0 && <DeltaBadge value={a.controlEffect} />}
            </div>
            {a.note && <div className="text-[9px] text-white/30 italic mt-1">{a.note}</div>}
          </div>
        ))}
      </div>
      <div className="text-[10px] tracking-[0.3em] uppercase text-white/25 mb-3">Advanced Abilities</div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {ADVANCED_ABILITIES.map(a => (
          <div key={a.id} className="rounded-lg p-4"
            style={{ background: 'rgba(167,139,250,0.06)', border: '1px solid rgba(167,139,250,0.22)' }}>
            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-sm font-bold text-violet-300">{a.name}</span>
              <Tag text="Advanced" color="rgba(167,139,250,0.15)" />
            </div>
            <div className="text-[10px] text-white/55 mb-2">{a.description}</div>
            <div className="flex flex-wrap gap-1 mb-2">
              <Tag text={`CD: ${a.cooldown}s`} />
              {a.duration && <Tag text={`Duration: ${a.duration}s`} />}
              {a.controlEffect !== 0 && <DeltaBadge value={a.controlEffect} />}
            </div>
            <div className="text-[10px] rounded p-2"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <span className="text-white/30 mr-1">Unlock:</span>
              <span className="text-white/50">{a.unlockCondition}</span>
            </div>
            {a.note && <div className="text-[9px] text-white/30 italic mt-1">{a.note}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── TAB: DIALOGUE TRIGGERS ────────────────────────────────────────────────────
function DialogueTriggersTab() {
  return (
    <div className="space-y-4">
      {/* Example moment */}
      <div className="rounded-xl p-4 mb-6"
        style={{ background: 'rgba(250,204,21,0.05)', border: '1px solid rgba(250,204,21,0.20)' }}>
        <div className="text-[10px] tracking-[0.3em] uppercase text-amber-300/60 mb-3">Example: Full Gameplay Moment — {EXAMPLE_GAMEPLAY_MOMENT.arc}</div>
        {EXAMPLE_GAMEPLAY_MOMENT.sequence.map((s, i) => (
          <div key={i} className="flex gap-3 mb-3">
            <div className="w-5 h-5 rounded-full bg-amber-400/20 flex items-center justify-center text-[9px] text-amber-300 font-bold shrink-0">{s.step}</div>
            <div>
              <div className="text-[10px] font-semibold text-amber-200/80">{s.event}</div>
              {s.content && <div className="text-[11px] text-white/55 italic my-0.5">"{s.content}"</div>}
              {s.mechanicEffect && <div className="text-[10px] text-white/40">→ {s.mechanicEffect}</div>}
              {s.choices && s.choices.map((c, ci) => (
                <div key={ci} className="flex items-center gap-2 mt-1 pl-2">
                  <span className="text-[10px] text-white/50">[{c.label}]</span>
                  <span className="text-[10px] text-white/35">{c.effect}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {DIALOGUE_TRIGGERS.map(t => (
        <div key={t.id} className="rounded-xl p-4"
          style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="flex items-baseline gap-2 mb-2">
            <Tag text={t.arcId} />
            <span className="text-[11px] font-bold text-white/70">{t.speaker}</span>
            <span className="text-[12px] text-white/55 italic">"{t.text}"</span>
          </div>
          {t.effects && t.effects.map((e, i) => (
            <div key={i} className="text-[10px] text-red-300/60 mb-1">⚡ {e.description || e.type}</div>
          ))}
          {t.choices && (
            <div className="space-y-2 mt-2">
              {t.choices.map((c, i) => (
                <div key={i} className="rounded p-2 flex gap-2"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <span className="text-[10px] font-bold text-white/60">[{c.label}]</span>
                  <span className="text-[10px] text-white/45">{c.effect}</span>
                  {c.controlDelta !== undefined && <DeltaBadge value={c.controlDelta} />}
                </div>
              ))}
            </div>
          )}
          {t.counterDialogue && (
            <div className="mt-2 rounded p-2 text-[10px]"
              style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.15)' }}>
              <span className="text-emerald-400/70">{t.counterDialogue.speaker}: "{t.counterDialogue.text}"</span>
              <span className="text-white/40 ml-2">→ {t.counterDialogue.playerResponse}</span>
            </div>
          )}
          {t.counterMechanic && (
            <div className="mt-2 text-[10px] text-white/35 italic">Counter: {t.counterMechanic}</div>
          )}
        </div>
      ))}
    </div>
  );
}

// ── TAB: BOSSES ───────────────────────────────────────────────────────────────
function BossesTab() {
  return (
    <div>
      {BOSS_FIGHTS.map(boss => (
        <div key={boss.id} className="rounded-xl p-5"
          style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="text-lg font-bold text-white/85 mb-1">{boss.name}</div>
          <div className="text-[11px] text-white/45 mb-4">{boss.description}</div>
          <div className="space-y-4">
            {boss.phases.map(p => (
              <div key={p.phase} className="rounded-lg p-4"
                style={{
                  background: p.layer === 'PHYSICAL' ? 'rgba(239,68,68,0.06)' : p.layer === 'ILLUSION' ? 'rgba(167,139,250,0.06)' : 'rgba(251,191,36,0.06)',
                  border: `1px solid ${p.layer === 'PHYSICAL' ? 'rgba(239,68,68,0.20)' : p.layer === 'ILLUSION' ? 'rgba(167,139,250,0.20)' : 'rgba(251,191,36,0.20)'}`,
                }}>
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-[9px] tracking-[0.3em] uppercase text-white/35">Phase {p.phase}</span>
                  <span className="text-sm font-bold text-white/75">{p.name}</span>
                  <Tag text={p.layer} />
                </div>
                {p.mechanics.map((m, i) => (
                  <div key={i} className="text-[11px] text-white/55 mb-1">• {m}</div>
                ))}
                <div className="mt-2 text-[10px] rounded p-2"
                  style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.15)' }}>
                  <span className="text-emerald-400/70">Defeat: </span>
                  <span className="text-white/50">{p.defeatCondition}</span>
                </div>
                {p.dialogueEvent && (
                  <div className="mt-2 text-[10px] rounded p-2"
                    style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)' }}>
                    <span className="text-red-300/70">⚡ {p.dialogueEvent.speaker}: "{p.dialogueEvent.text}"</span>
                    <span className="text-white/40 ml-2">→ {p.dialogueEvent.effect}</span>
                  </div>
                )}
                {p.dialogueSequence && p.dialogueSequence.map((d, di) => (
                  <div key={di} className="mt-3">
                    <div className="text-[11px] italic text-white/50 mb-1">"{d.text}"</div>
                    {d.choices.map((c, ci) => (
                      <div key={ci} className="flex gap-2 text-[10px] py-1">
                        <span className="text-white/50 font-bold">[{c.label}]</span>
                        <span className="text-white/35">{c.outcome}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── TAB: PROGRESSION ─────────────────────────────────────────────────────────
function ProgressionTab() {
  return (
    <div>
      <Collapsible title="Leveling = Understanding" subtitle={PROGRESSION_SYSTEM.description} color="#6ec3ff" defaultOpen>
        <div className="grid grid-cols-3 gap-3 mb-4">
          {PROGRESSION_SYSTEM.unlockMethods.map((m, i) => (
            <div key={i} className="rounded-lg p-3"
              style={{ background: 'rgba(110,195,255,0.06)', border: '1px solid rgba(110,195,255,0.15)' }}>
              <div className="text-[10px] font-bold text-cyan-300 mb-1 capitalize">{m.method}</div>
              <div className="text-[10px] text-white/50">{m.description}</div>
            </div>
          ))}
        </div>
        <div className="text-[10px] tracking-[0.2em] uppercase text-white/30 mb-2">Memory Fragments</div>
        <div className="text-[11px] text-white/45 mb-3">{PROGRESSION_SYSTEM.memoryFragments.description}</div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="text-[9px] tracking-[0.2em] uppercase text-white/25 mb-1">Uses</div>
            {PROGRESSION_SYSTEM.memoryFragments.uses.map((u, i) => (
              <div key={i} className="text-[10px] text-white/50 mb-1">• {u}</div>
            ))}
          </div>
          <div>
            <div className="text-[9px] tracking-[0.2em] uppercase text-white/25 mb-1">Sources</div>
            {PROGRESSION_SYSTEM.memoryFragments.sources.map((s, i) => (
              <div key={i} className="text-[10px] text-white/50 mb-1">• {s}</div>
            ))}
          </div>
        </div>
      </Collapsible>

      <Collapsible title="Choice Impact Matrix" subtitle="Every major choice affects four systems" color="#f59e0b">
        <div className="overflow-x-auto">
          <table className="w-full text-[11px]">
            <thead>
              <tr>
                {['System', 'Aggressive', 'Stable', 'Hybrid'].map(h => (
                  <th key={h} className="text-left pb-2 pr-4 text-[9px] tracking-[0.2em] uppercase text-white/30">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {CHOICE_IMPACT_MATRIX.map((row, i) => (
                <tr key={i} style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                  <td className="py-2 pr-4 font-bold text-white/60">{row.system}</td>
                  <td className="py-2 pr-4 text-red-300/60">{row.aggressive}</td>
                  <td className="py-2 pr-4 text-green-300/60">{row.stable}</td>
                  <td className="py-2 pr-4 text-blue-300/60">{row.hybrid}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Collapsible>

      <Collapsible title="Final Arc Gameplay (46–50)" subtitle={FINAL_ARC_GAMEPLAY.description} color="#34d399">
        <div className="mb-4">
          {FINAL_ARC_GAMEPLAY.mechanics.map((m, i) => (
            <div key={i} className="text-[11px] text-white/55 mb-1">✓ {m}</div>
          ))}
        </div>
        <div className="grid grid-cols-3 gap-3">
          {FINAL_ARC_GAMEPLAY.finalFightVariants.map((v, i) => (
            <div key={i} className="rounded-lg p-3"
              style={{ background: 'rgba(52,211,153,0.06)', border: '1px solid rgba(52,211,153,0.18)' }}>
              <div className="text-[10px] font-bold text-emerald-300 mb-1">{v.style}</div>
              <div className="text-[10px] text-white/50 mb-2">{v.description}</div>
              <div className="text-[9px] text-white/35 italic">{v.finalEntityResponse}</div>
            </div>
          ))}
        </div>
      </Collapsible>
    </div>
  );
}

// ── MAIN COMPONENT ────────────────────────────────────────────────────────────
export default function CombatSystemViewer() {
  const [activeTab, setActiveTab] = useState('overview');
  const TAB_CONTENT = { overview: CoreSystemsTab, enemies: EnemiesTab, abilities: AbilitiesTab, dialogue: DialogueTriggersTab, bosses: BossesTab, progression: ProgressionTab };
  const ActiveContent = TAB_CONTENT[activeTab];

  return (
    <div className="w-full h-full flex flex-col overflow-hidden"
      style={{ background: 'rgba(8,10,16,0.98)', color: 'rgba(255,255,255,0.85)' }}>
      {/* Header */}
      <div className="px-6 pt-6 pb-4 shrink-0">
        <div className="text-[10px] tracking-[0.5em] uppercase text-white/25 mb-1">Game Design Document</div>
        <h1 className="text-xl font-bold tracking-[0.25em] uppercase text-white">
          DIVIDED: RECLAMATION — Combat System
        </h1>
      </div>
      {/* Tabs */}
      <div className="flex gap-0 px-6 shrink-0 border-b border-white/[0.07] overflow-x-auto">
        {TABS.map(tab => {
          const Icon = tab.icon;
          const on = activeTab === tab.id;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className="flex items-center gap-1.5 px-4 py-2.5 text-[11px] transition-all shrink-0"
              style={{
                color: on ? '#fff' : 'rgba(255,255,255,0.40)',
                borderBottom: on ? '2px solid #6ec3ff' : '2px solid transparent',
                fontWeight: on ? 600 : 400,
              }}>
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>
      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <ActiveContent />
      </div>
    </div>
  );
}
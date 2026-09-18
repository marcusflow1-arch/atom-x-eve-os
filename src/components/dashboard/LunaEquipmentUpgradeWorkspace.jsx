import { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  Atom,
  BadgePlus,
  CircleDot,
  Combine,
  Crown,
  GitBranch,
  Hammer,
  Layers3,
  Minus,
  Package,
  Plus,
  Sparkles,
  WandSparkles,
} from 'lucide-react';

const ENCHANT_MAX = 180;
const COMBINE_STAGE_MAX = 20;
const AURA_MAX = 12;

const idOf = (item) => item?.id || item?.itemId || item?.name || 'item';
const levelOf = (item) => Number(item?.level || item?.levelRequirement || 1);
const typeOf = (item) => String(item?.type || item?.itemType || item?.inventoryCategory || 'equipment').toLowerCase();

const loadUpgradeState = (item) => {
  if (typeof window === 'undefined' || !item) {
    return { enchantment: 0, combineStage: 0, auraLevel: 0, grade: 1, unlockedSkillNodes: ['core'] };
  }
  try {
    const key = `luna-card-upgrade:${idOf(item)}`;
    const saved = JSON.parse(window.localStorage.getItem(key) || '{}');
    return {
      enchantment: Math.min(ENCHANT_MAX, Math.max(0, Number(saved.enchantment ?? item.enchantment ?? item.enchant_percent ?? 0))),
      combineStage: Math.min(COMBINE_STAGE_MAX, Math.max(0, Number(saved.combineStage ?? item.combine_stage ?? 0))),
      auraLevel: Math.min(AURA_MAX, Math.max(0, Number(saved.auraLevel ?? item.aura_level ?? 0))),
      grade: Math.max(1, Number(saved.grade ?? item.grade ?? 1)),
      unlockedSkillNodes: Array.isArray(saved.unlockedSkillNodes) && saved.unlockedSkillNodes.length
        ? saved.unlockedSkillNodes
        : ['core'],
    };
  } catch {
    return { enchantment: 0, combineStage: 0, auraLevel: 0, grade: 1, unlockedSkillNodes: ['core'] };
  }
};

const Progress = ({ value, max, accent = 'rgba(103,232,249,.8)' }) => {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.055]">
      <div
        className="h-full rounded-full transition-[width] duration-300"
        style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${accent}, rgba(255,255,255,.7))` }}
      />
    </div>
  );
};

const IconTab = ({ active, icon: Icon, label, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    title={label}
    aria-label={label}
    className={`group relative flex h-9 w-9 items-center justify-center rounded-xl border transition-all ${active
      ? 'border-cyan-200/25 bg-cyan-100/[0.08] text-cyan-100/85 shadow-[0_0_18px_rgba(103,232,249,.08)]'
      : 'border-white/[0.065] bg-white/[0.02] text-white/28 hover:bg-white/[0.055] hover:text-white/60'}`}
  >
    <Icon className="h-4 w-4" />
    <span className={`pointer-events-none absolute -bottom-1 h-px w-4 rounded-full transition-opacity ${active ? 'bg-cyan-100/70 opacity-100' : 'opacity-0'}`} />
  </button>
);

const gradeVisual = (grade) => {
  if (grade >= 8) {
    return {
      border: 'rgba(224,231,255,.8)',
      glow: '0 0 22px rgba(165,180,252,.22), inset 0 0 16px rgba(255,255,255,.08)',
      label: `Grade ${grade} · Prismatic`,
    };
  }
  if (grade >= 5) {
    return {
      border: 'rgba(250,204,21,.65)',
      glow: '0 0 18px rgba(250,204,21,.15), inset 0 0 12px rgba(250,204,21,.04)',
      label: `Grade ${grade} · Gilded`,
    };
  }
  if (grade >= 3) {
    return {
      border: 'rgba(196,181,253,.55)',
      glow: '0 0 16px rgba(167,139,250,.13), inset 0 0 10px rgba(167,139,250,.03)',
      label: `Grade ${grade} · Refined`,
    };
  }
  return {
    border: 'rgba(255,255,255,.14)',
    glow: 'inset 0 0 10px rgba(255,255,255,.025)',
    label: `Grade ${grade}`,
  };
};

function UpgradeStepper({ label, eyebrow, value, max, icon: Icon, onDecrease, onIncrease, suffix = '', accent, description, disableDecrease = false, disableIncrease = false }) {
  return (
    <section className="border-b border-white/[0.055] py-4 last:border-b-0">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.025] text-white/45">
          <Icon className="h-3.5 w-3.5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[7px] font-black uppercase tracking-[0.18em] text-white/24">{eyebrow}</p>
              <h3 className="mt-1 text-[11px] font-semibold text-white/78">{label}</h3>
              <p className="mt-1 max-w-[330px] text-[8px] leading-3.5 text-white/28">{description}</p>
            </div>
            <div className="text-right">
              <p className="text-[22px] font-light leading-none text-white/78">{value}{suffix}</p>
              {max != null && <p className="mt-1 text-[7px] uppercase tracking-[0.14em] text-white/22">Max {max}{suffix}</p>}
            </div>
          </div>
          <div className="mt-3">
            {max != null && <Progress value={value} max={max} accent={accent} />}
          </div>
          <div className="mt-3 flex items-center gap-2">
            <button
              type="button"
              disabled={disableDecrease}
              onClick={onDecrease}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.055] bg-white/[0.02] text-white/35 transition-all hover:bg-white/[0.055] hover:text-white/65 disabled:cursor-not-allowed disabled:opacity-25"
            >
              <Minus className="h-3 w-3" />
            </button>
            <button
              type="button"
              disabled={disableIncrease}
              onClick={onIncrease}
              className="flex h-8 items-center gap-1.5 rounded-lg border border-white/[0.07] bg-white/[0.035] px-3 text-[8px] font-black uppercase tracking-[0.12em] text-white/55 transition-all hover:bg-white/[0.07] hover:text-white/80 disabled:cursor-not-allowed disabled:opacity-25"
            >
              <Plus className="h-3 w-3" /> Increase
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

const SKILL_NODES = [
  { id: 'core', label: 'Core Sync', x: 50, y: 50, requires: null },
  { id: 'focus', label: 'Focused Output', x: 22, y: 27, requires: 'core' },
  { id: 'efficiency', label: 'Essence Efficiency', x: 22, y: 73, requires: 'core' },
  { id: 'resonance', label: 'Aura Resonance', x: 78, y: 27, requires: 'core' },
  { id: 'mastery', label: 'Grade Mastery', x: 78, y: 73, requires: 'core' },
  { id: 'apex', label: 'Apex Link', x: 50, y: 11, requires: 'focus' },
  { id: 'stability', label: 'Stable Fusion', x: 50, y: 89, requires: 'efficiency' },
];

export default function LunaEquipmentUpgradeWorkspace({ item, inventory = [], onBack }) {
  const [tab, setTab] = useState('forge');
  const [state, setState] = useState(() => loadUpgradeState(item));
  const [selectedCombineIds, setSelectedCombineIds] = useState([]);

  useEffect(() => {
    setState(loadUpgradeState(item));
    setSelectedCombineIds([]);
    setTab('forge');
  }, [item]);

  useEffect(() => {
    if (typeof window === 'undefined' || !item) return;
    try {
      window.localStorage.setItem(`luna-card-upgrade:${idOf(item)}`, JSON.stringify(state));
    } catch {
      // Local persistence is best-effort for this dashboard workspace.
    }
  }, [item, state]);

  const cardLevel = levelOf(item);
  const sameTypeLowerCards = useMemo(() => {
    const targetType = typeOf(item);
    return (inventory || []).filter((candidate) => {
      if (!candidate || idOf(candidate) === idOf(item)) return false;
      return typeOf(candidate) === targetType && levelOf(candidate) < cardLevel;
    });
  }, [inventory, item, cardLevel]);

  if (!item) return null;

  const gradeStyle = gradeVisual(state.grade);
  const auraOpacity = 0.04 + (state.auraLevel / AURA_MAX) * 0.22;
  const selectedCombineCount = selectedCombineIds.length;
  const remainingStages = COMBINE_STAGE_MAX - state.combineStage;
  const combineGain = Math.min(remainingStages, selectedCombineCount);

  const patch = (changes) => setState((current) => ({ ...current, ...changes }));

  const doCombine = () => {
    if (!combineGain) return;
    patch({ combineStage: state.combineStage + combineGain });
    setSelectedCombineIds([]);
  };

  const toggleCombineCard = (candidate) => {
    const id = idOf(candidate);
    setSelectedCombineIds((current) => (
      current.includes(id) ? current.filter((value) => value !== id) : [...current, id]
    ));
  };

  const toggleSkillNode = (node) => {
    if (node.id === 'core') return;
    const unlocked = state.unlockedSkillNodes.includes(node.id);
    if (unlocked) {
      patch({ unlockedSkillNodes: state.unlockedSkillNodes.filter((id) => id !== node.id) });
      return;
    }
    const prerequisiteMet = !node.requires || state.unlockedSkillNodes.includes(node.requires);
    if (!prerequisiteMet) return;
    patch({ unlockedSkillNodes: [...state.unlockedSkillNodes, node.id] });
  };

  return (
    <div className="relative h-full w-full overflow-y-auto px-6 pb-8 pt-5">
      <div className="pointer-events-none absolute left-6 right-6 top-0 h-px bg-gradient-to-r from-transparent via-white/12 to-transparent" />

      <div className="relative min-h-full">
        <button
          type="button"
          onClick={onBack}
          className="absolute left-0 top-0 z-10 flex h-8 items-center gap-1.5 rounded-lg border border-white/[0.05] bg-white/[0.02] px-2.5 text-[8px] font-bold uppercase tracking-[0.12em] text-white/38 transition-all hover:bg-white/[0.05] hover:text-white/65"
        >
          <ArrowLeft className="h-3 w-3" /> Loadout
        </button>

        <div className="flex justify-center">
          <div className="flex items-center gap-2">
            <IconTab active={tab === 'forge'} icon={Hammer} label="Enhancement Menu" onClick={() => setTab('forge')} />
            <IconTab active={tab === 'skills'} icon={GitBranch} label="Card Skill Tree" onClick={() => setTab('skills')} />
          </div>
        </div>

        <div className="mt-5 flex items-center gap-4 border-b border-white/[0.055] pb-5">
          <div
            className="relative flex h-24 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border bg-black/15 transition-all duration-300"
            style={{
              borderColor: gradeStyle.border,
              boxShadow: `${gradeStyle.glow}, 0 0 ${10 + state.auraLevel * 2}px rgba(103,232,249,${auraOpacity})`,
            }}
          >
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                background: `radial-gradient(circle at 50% 40%, rgba(103,232,249,${auraOpacity}), transparent 68%)`,
              }}
            />
            {item.icon_url || item.icon ? (
              <img src={item.icon_url || item.icon} alt={item.name} className="relative z-10 h-16 w-16 object-contain" />
            ) : (
              <Package className="relative z-10 h-7 w-7 text-white/20" />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 text-[7px] font-black uppercase tracking-[0.2em] text-cyan-100/38">
              <Atom className="h-3 w-3" /> Card Enhancement
            </div>
            <h2 className="mt-1 truncate text-lg font-semibold text-white/88">{item.name}</h2>
            <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[8px] text-white/28">
              <span>{item.game || 'Game item'}</span>
              <span>·</span>
              <span>{item.rarity || 'Common'}</span>
              <span>·</span>
              <span>{gradeStyle.label}</span>
            </div>
          </div>

          <div className="grid shrink-0 grid-cols-2 gap-x-4 gap-y-1 text-right">
            <div>
              <p className="text-[6px] uppercase tracking-[0.15em] text-white/20">Enchant</p>
              <p className="mt-0.5 text-[9px] font-semibold text-white/55">{state.enchantment}%</p>
            </div>
            <div>
              <p className="text-[6px] uppercase tracking-[0.15em] text-white/20">Stage</p>
              <p className="mt-0.5 text-[9px] font-semibold text-white/55">{state.combineStage}/{COMBINE_STAGE_MAX}</p>
            </div>
            <div>
              <p className="text-[6px] uppercase tracking-[0.15em] text-white/20">Aura</p>
              <p className="mt-0.5 text-[9px] font-semibold text-white/55">{state.auraLevel}/{AURA_MAX}</p>
            </div>
            <div>
              <p className="text-[6px] uppercase tracking-[0.15em] text-white/20">Grade</p>
              <p className="mt-0.5 text-[9px] font-semibold text-white/55">{state.grade}</p>
            </div>
          </div>
        </div>

        {tab === 'forge' ? (
          <div className="mt-1">
            <UpgradeStepper
              label="Enchantment"
              eyebrow="Power Infusion"
              value={state.enchantment}
              max={ENCHANT_MAX}
              suffix="%"
              icon={WandSparkles}
              accent="rgba(168,85,247,.8)"
              description="Raises the card's enchantment strength. Enchantment is hard-capped at 180%."
              disableDecrease={state.enchantment <= 0}
              disableIncrease={state.enchantment >= ENCHANT_MAX}
              onDecrease={() => patch({ enchantment: Math.max(0, state.enchantment - 10) })}
              onIncrease={() => patch({ enchantment: Math.min(ENCHANT_MAX, state.enchantment + 10) })}
            />

            <section className="border-b border-white/[0.055] py-4">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.025] text-white/45">
                  <Combine className="h-3.5 w-3.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[7px] font-black uppercase tracking-[0.18em] text-white/24">Card Fusion</p>
                      <h3 className="mt-1 text-[11px] font-semibold text-white/78">Combine Stage</h3>
                      <p className="mt-1 max-w-[340px] text-[8px] leading-3.5 text-white/28">
                        Combine lower-level cards of the same type into this card. Each selected card raises the combine stage by one, up to stage 20.
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[22px] font-light leading-none text-white/78">{state.combineStage}</p>
                      <p className="mt-1 text-[7px] uppercase tracking-[0.14em] text-white/22">Max {COMBINE_STAGE_MAX}</p>
                    </div>
                  </div>

                  <div className="mt-3">
                    <Progress value={state.combineStage} max={COMBINE_STAGE_MAX} accent="rgba(34,211,238,.8)" />
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2">
                    {sameTypeLowerCards.length ? sameTypeLowerCards.slice(0, 6).map((candidate) => {
                      const candidateId = idOf(candidate);
                      const selected = selectedCombineIds.includes(candidateId);
                      return (
                        <button
                          key={candidateId}
                          type="button"
                          disabled={state.combineStage >= COMBINE_STAGE_MAX}
                          onClick={() => toggleCombineCard(candidate)}
                          className={`flex min-w-0 items-center gap-2 rounded-xl border p-2 text-left transition-all ${selected
                            ? 'border-cyan-200/22 bg-cyan-200/[0.07]'
                            : 'border-white/[0.05] bg-white/[0.018] hover:bg-white/[0.045]'} disabled:opacity-30`}
                        >
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/[0.05] bg-black/15">
                            {candidate.icon_url || candidate.icon ? (
                              <img src={candidate.icon_url || candidate.icon} alt={candidate.name} className="h-7 w-7 object-contain" />
                            ) : (
                              <Package className="h-4 w-4 text-white/18" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-[8px] font-semibold text-white/55">{candidate.name}</p>
                            <p className="mt-0.5 text-[7px] text-white/22">Lv {levelOf(candidate)} · {typeOf(candidate)}</p>
                          </div>
                        </button>
                      );
                    }) : (
                      <div className="col-span-2 rounded-xl border border-dashed border-white/[0.055] px-3 py-4 text-center">
                        <p className="text-[8px] text-white/28">No lower-level cards of this type are currently available to combine.</p>
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    disabled={!combineGain || state.combineStage >= COMBINE_STAGE_MAX}
                    onClick={doCombine}
                    className="mt-3 flex h-8 items-center gap-1.5 rounded-lg border border-cyan-200/12 bg-cyan-200/[0.05] px-3 text-[8px] font-black uppercase tracking-[0.12em] text-cyan-100/58 transition-all hover:bg-cyan-200/[0.09] disabled:cursor-not-allowed disabled:opacity-25"
                  >
                    <Layers3 className="h-3 w-3" />
                    Combine {combineGain ? `+${combineGain} Stage` : 'Selected Cards'}
                  </button>
                </div>
              </div>
            </section>

            <UpgradeStepper
              label="Aura"
              eyebrow="Visual Resonance"
              value={state.auraLevel}
              max={AURA_MAX}
              icon={Sparkles}
              accent="rgba(103,232,249,.8)"
              description="Controls how strongly the card glows. Aura intensity progresses independently and reaches its maximum at level 12."
              disableDecrease={state.auraLevel <= 0}
              disableIncrease={state.auraLevel >= AURA_MAX}
              onDecrease={() => patch({ auraLevel: Math.max(0, state.auraLevel - 1) })}
              onIncrease={() => patch({ auraLevel: Math.min(AURA_MAX, state.auraLevel + 1) })}
            />

            <section className="py-4">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.025] text-white/45">
                  <BadgePlus className="h-3.5 w-3.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[7px] font-black uppercase tracking-[0.18em] text-white/24">Card Value</p>
                      <h3 className="mt-1 text-[11px] font-semibold text-white/78">Grading</h3>
                      <p className="mt-1 max-w-[340px] text-[8px] leading-3.5 text-white/28">
                        Grading increases the card's value and evolves its outer border. No grading maximum has been imposed in this interface.
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[22px] font-light leading-none text-white/78">{state.grade}</p>
                      <p className="mt-1 text-[7px] uppercase tracking-[0.14em] text-white/22">Current grade</p>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center gap-3">
                    <div
                      className="flex h-14 w-11 items-center justify-center rounded-lg border bg-black/15"
                      style={{ borderColor: gradeStyle.border, boxShadow: gradeStyle.glow }}
                    >
                      <Crown className="h-4 w-4 text-white/45" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[8px] font-semibold text-white/55">{gradeStyle.label}</p>
                      <p className="mt-1 text-[7px] leading-3 text-white/23">Each grade step changes the card's outer treatment and increases collection value.</p>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center gap-2">
                    <button
                      type="button"
                      disabled={state.grade <= 1}
                      onClick={() => patch({ grade: Math.max(1, state.grade - 1) })}
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.055] bg-white/[0.02] text-white/35 hover:bg-white/[0.055] disabled:opacity-25"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => patch({ grade: state.grade + 1 })}
                      className="flex h-8 items-center gap-1.5 rounded-lg border border-amber-200/10 bg-amber-200/[0.035] px-3 text-[8px] font-black uppercase tracking-[0.12em] text-amber-100/55 hover:bg-amber-200/[0.07]"
                    >
                      <Plus className="h-3 w-3" /> Increase Grade
                    </button>
                  </div>
                </div>
              </div>
            </section>
          </div>
        ) : (
          <div className="mt-5">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-[7px] font-black uppercase tracking-[0.2em] text-cyan-100/35">Card Skill Tree</p>
                <h3 className="mt-1 text-[14px] font-semibold text-white/82">Per-card specialization</h3>
                <p className="mt-1 max-w-[360px] text-[8px] leading-3.5 text-white/26">
                  Unlock a compact set of perks tied to this specific card. Select an available node to activate it.
                </p>
              </div>
              <div className="text-right">
                <p className="text-[18px] font-light text-white/68">{state.unlockedSkillNodes.length}</p>
                <p className="text-[6px] uppercase tracking-[.14em] text-white/20">Unlocked</p>
              </div>
            </div>

            <div className="relative mx-auto mt-5 aspect-[1.25/1] w-full max-w-[430px]">
              <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                {SKILL_NODES.filter((node) => node.requires).map((node) => {
                  const parent = SKILL_NODES.find((candidate) => candidate.id === node.requires);
                  const active = state.unlockedSkillNodes.includes(node.id);
                  return (
                    <line
                      key={node.id}
                      x1={parent.x}
                      y1={parent.y}
                      x2={node.x}
                      y2={node.y}
                      stroke={active ? 'rgba(103,232,249,.48)' : 'rgba(255,255,255,.08)'}
                      strokeWidth="0.55"
                    />
                  );
                })}
              </svg>

              {SKILL_NODES.map((node) => {
                const unlocked = state.unlockedSkillNodes.includes(node.id);
                const available = !node.requires || state.unlockedSkillNodes.includes(node.requires);
                return (
                  <button
                    key={node.id}
                    type="button"
                    onClick={() => toggleSkillNode(node)}
                    disabled={!available}
                    className={`absolute flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border transition-all ${unlocked
                      ? 'border-cyan-200/32 bg-cyan-200/[0.09] text-cyan-100/78 shadow-[0_0_22px_rgba(103,232,249,.09)]'
                      : available
                        ? 'border-white/[0.09] bg-white/[0.025] text-white/34 hover:bg-white/[0.065] hover:text-white/65'
                        : 'cursor-not-allowed border-white/[0.035] bg-black/10 text-white/12'}`}
                    style={{ left: `${node.x}%`, top: `${node.y}%` }}
                    title={node.label}
                  >
                    {node.id === 'core' ? <CircleDot className="h-4 w-4" /> : <GitBranch className="h-3.5 w-3.5" />}
                    <span className="pointer-events-none absolute top-[calc(100%+5px)] w-24 text-center text-[6px] font-bold uppercase tracking-[.08em] text-white/30">{node.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="mt-5 grid grid-cols-2 gap-2 border-t border-white/[0.055] pt-4">
              {SKILL_NODES.filter((node) => node.id !== 'core').map((node) => {
                const unlocked = state.unlockedSkillNodes.includes(node.id);
                return (
                  <div key={node.id} className="flex items-center justify-between gap-2 rounded-xl border border-white/[0.045] bg-white/[0.015] px-3 py-2">
                    <span className="truncate text-[8px] text-white/42">{node.label}</span>
                    <span className={`text-[6px] font-black uppercase tracking-[.1em] ${unlocked ? 'text-cyan-100/55' : 'text-white/18'}`}>
                      {unlocked ? 'Active' : 'Locked'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

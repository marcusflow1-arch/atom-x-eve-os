import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Unlock, TrendingUp, Sparkles, ChevronRight } from 'lucide-react';
import {
  SKILLS_DATABASE, RARITIES, EVOLUTION_RANKS, UPGRADE_MATERIALS,
  PLAYER_MATERIALS, DROP_SOURCES,
} from './skillData';

const PATH_FILTERS = [
  { id: 'all',     label: 'All' },
  { id: 'damage',  label: '⚔️ Damage' },
  { id: 'defense', label: '🛡️ Defense' },
  { id: 'ranged',  label: '🏹 Ranged' },
];

const getRarity = (id) => RARITIES.find((r) => r.id === id) || RARITIES[0];
const getEvolution = (id) => EVOLUTION_RANKS.find((r) => r.id === id) || EVOLUTION_RANKS[0];

// ─── Rarity Badge ───────────────────────────────────────────────────────────
function RarityBadge({ rarity }) {
  const r = getRarity(rarity);
  return (
    <span
      className="text-[9px] px-1.5 py-0.5 rounded font-bold tracking-widest border"
      style={{ color: r.color, borderColor: `${r.color}55`, background: `${r.color}18` }}
    >
      {r.label.toUpperCase()}
    </span>
  );
}

// ─── Evolution Rank Badge ────────────────────────────────────────────────────
function RankBadge({ rank }) {
  const r = getEvolution(rank);
  if (r.id === 'base') return null;
  return (
    <span
      className="text-[9px] px-1.5 py-0.5 rounded font-bold tracking-widest"
      style={{ color: r.color, background: `${r.color}22` }}
    >
      {r.label}
    </span>
  );
}

// ─── Upgrade Cost Row ────────────────────────────────────────────────────────
function UpgradeCost({ cost }) {
  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {Object.entries(cost).map(([matId, qty]) => {
        const mat = UPGRADE_MATERIALS.find((m) => m.id === matId);
        const have = PLAYER_MATERIALS[matId] || 0;
        const canAfford = have >= qty;
        if (!mat) return null;
        return (
          <div
            key={matId}
            className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] border"
            style={{
              borderColor: canAfford ? `${mat.color}55` : 'rgba(239,68,68,0.4)',
              background: canAfford ? `${mat.color}12` : 'rgba(239,68,68,0.08)',
              color: canAfford ? mat.color : '#fca5a5',
            }}
          >
            <span>{mat.icon}</span>
            <span>{qty}</span>
            <span className="text-white/40">/{have}</span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Skill Card ──────────────────────────────────────────────────────────────
function SkillCard({ skill, selected, onClick }) {
  const rarity = getRarity(skill.rarity);
  const rank = getEvolution(skill.evolution_rank);
  const source = DROP_SOURCES[skill.drop_source];

  return (
    <button
      onClick={onClick}
      className="w-full text-left p-3 rounded-lg border transition-all"
      style={selected ? {
        background: `${rarity.color}14`,
        borderColor: `${rarity.color}55`,
        boxShadow: `0 0 20px ${rarity.glow}`,
      } : {
        background: 'rgba(255,255,255,0.03)',
        borderColor: skill.owned ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.04)',
        opacity: skill.owned ? 1 : 0.5,
      }}
    >
      <div className="flex items-start gap-2.5">
        {/* Icon */}
        <div
          className="w-10 h-10 shrink-0 rounded-lg flex items-center justify-center text-xl border"
          style={{
            background: `${rarity.color}18`,
            borderColor: `${rarity.color}40`,
            boxShadow: skill.owned ? `0 0 10px ${rarity.glow}` : 'none',
          }}
        >
          {skill.owned ? skill.icon : <Lock className="w-4 h-4 text-white/30" />}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className={`text-sm font-semibold ${skill.owned ? 'text-white' : 'text-white/40'}`}>
              {skill.name}
            </span>
            {skill.equipped && (
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                EQUIPPED
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
            <RarityBadge rarity={skill.rarity} />
            <RankBadge rank={skill.evolution_rank} />
            {skill.type && (
              <span className="text-[9px] text-white/35 border border-white/10 px-1 py-0.5 rounded">
                {skill.type}
              </span>
            )}
          </div>

          {/* Drop source (for unowned) */}
          {!skill.owned && source && (
            <div className="flex items-center gap-1 mt-1 text-[10px]" style={{ color: source.color }}>
              <span>{source.icon}</span>
              <span>Drops from {source.label}</span>
            </div>
          )}
        </div>
      </div>
    </button>
  );
}

// ─── Skill Detail Panel ──────────────────────────────────────────────────────
function SkillDetail({ skill, onClose }) {
  const rarity = getRarity(skill.rarity);
  const rank = getEvolution(skill.evolution_rank);
  const source = DROP_SOURCES[skill.drop_source];
  const nextRankIdx = EVOLUTION_RANKS.findIndex((r) => r.id === skill.evolution_rank) + 1;
  const nextRank = EVOLUTION_RANKS[nextRankIdx];

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="h-full flex flex-col gap-4 overflow-y-auto pr-1"
    >
      {/* Header */}
      <div
        className="p-4 rounded-xl border"
        style={{
          background: `linear-gradient(135deg, ${rarity.color}18, ${rarity.color}06)`,
          borderColor: `${rarity.color}50`,
          boxShadow: `0 0 24px ${rarity.glow}`,
        }}
      >
        <div className="flex items-center gap-3 mb-2">
          <div
            className="w-14 h-14 rounded-xl flex items-center justify-center text-3xl border"
            style={{ background: `${rarity.color}22`, borderColor: `${rarity.color}55` }}
          >
            {skill.icon}
          </div>
          <div>
            <div className="text-white font-bold text-base">{skill.name}</div>
            <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
              <RarityBadge rarity={skill.rarity} />
              <RankBadge rank={skill.evolution_rank} />
            </div>
          </div>
        </div>
        <p className="text-white/60 text-xs leading-relaxed">{skill.description}</p>
        {skill.damage_pct && (
          <div className="mt-2 text-xs" style={{ color: rarity.color }}>
            ⚡ {Math.round(skill.damage_pct * 100)}% weapon damage
          </div>
        )}
      </div>

      {/* Drop Source */}
      {source && (
        <div
          className="flex items-center gap-2 p-3 rounded-lg border text-xs"
          style={{ background: `${source.color}0f`, borderColor: `${source.color}40` }}
        >
          <span className="text-xl">{source.icon}</span>
          <div>
            <div className="text-white/50 text-[9px] uppercase tracking-wider mb-0.5">Drop Source</div>
            <div style={{ color: source.color }}>{source.label}</div>
          </div>
        </div>
      )}

      {/* Evolution Path */}
      <div>
        <div className="text-white/40 text-[10px] tracking-[0.2em] uppercase mb-2">Evolution Path</div>
        <div className="flex items-center gap-1">
          {EVOLUTION_RANKS.map((r, i) => {
            const isCurrent = r.id === skill.evolution_rank;
            const isUnlocked = r.tier <= rank.tier;
            return (
              <React.Fragment key={r.id}>
                <div
                  className="flex-1 py-1.5 rounded text-center text-[9px] font-bold tracking-wider border transition-all"
                  style={isCurrent ? {
                    background: `${r.color}25`,
                    borderColor: `${r.color}60`,
                    color: r.color,
                    boxShadow: `0 0 8px ${r.color}40`,
                  } : {
                    background: isUnlocked ? `${r.color}10` : 'rgba(255,255,255,0.03)',
                    borderColor: isUnlocked ? `${r.color}30` : 'rgba(255,255,255,0.08)',
                    color: isUnlocked ? r.color : 'rgba(255,255,255,0.25)',
                  }}
                >
                  {r.label}
                </div>
                {i < EVOLUTION_RANKS.length - 1 && (
                  <div className="w-2 h-px bg-white/15 shrink-0" />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Upgrade Section */}
      {skill.owned && skill.upgrade_cost && (
        <div>
          <div className="text-white/40 text-[10px] tracking-[0.2em] uppercase mb-2">
            Upgrade to {nextRank ? nextRank.label : 'Max Rank'}
          </div>
          <UpgradeCost cost={skill.upgrade_cost} />
          {nextRank && (
            <button
              className="mt-3 w-full py-2 rounded-lg text-xs font-bold tracking-wider border transition-all hover:scale-[1.02]"
              style={{
                background: `${nextRank.color}22`,
                borderColor: `${nextRank.color}55`,
                color: nextRank.color,
                boxShadow: `0 0 12px ${nextRank.color}22`,
              }}
            >
              <TrendingUp className="inline w-3.5 h-3.5 mr-1.5" />
              Evolve → {nextRank.label}
            </button>
          )}
        </div>
      )}

      {/* Equip / Unequip */}
      {skill.owned && (
        <button
          className="w-full py-2.5 rounded-lg text-xs font-bold tracking-wider border transition-all hover:scale-[1.02]"
          style={skill.equipped ? {
            background: 'rgba(239,68,68,0.15)',
            borderColor: 'rgba(239,68,68,0.4)',
            color: '#fca5a5',
          } : {
            background: 'rgba(16,185,129,0.15)',
            borderColor: 'rgba(16,185,129,0.4)',
            color: '#6ee7b7',
          }}
        >
          {skill.equipped ? (
            <><Lock className="inline w-3.5 h-3.5 mr-1.5" />Unequip</>
          ) : (
            <><Unlock className="inline w-3.5 h-3.5 mr-1.5" />Equip Skill</>
          )}
        </button>
      )}
    </motion.div>
  );
}

// ─── Main Skills Tab ─────────────────────────────────────────────────────────
export default function SkillsTab() {
  const [pathFilter, setPathFilter] = useState('all');
  const [rarityFilter, setRarityFilter] = useState('all');
  const [showOwned, setShowOwned] = useState(false);
  const [selectedSkillId, setSelectedSkillId] = useState(null);

  const filtered = SKILLS_DATABASE.filter((s) => {
    if (pathFilter !== 'all' && s.path !== pathFilter) return false;
    if (rarityFilter !== 'all' && s.rarity !== rarityFilter) return false;
    if (showOwned && !s.owned) return false;
    return true;
  });

  const selectedSkill = SKILLS_DATABASE.find((s) => s.id === selectedSkillId);

  return (
    <div className="absolute left-6 top-24 right-6 bottom-20 flex gap-4 pointer-events-auto overflow-hidden">

      {/* ── LEFT: Filters + Skill List ── */}
      <div className="w-[280px] shrink-0 flex flex-col gap-3 overflow-hidden">

        {/* Path filter */}
        <div className="flex gap-1 flex-wrap">
          {PATH_FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setPathFilter(f.id)}
              className="px-2.5 py-1 rounded-full text-[10px] font-semibold border transition-all"
              style={pathFilter === f.id ? {
                background: 'rgba(255,255,255,0.15)',
                borderColor: 'rgba(255,255,255,0.35)',
                color: '#fff',
              } : {
                background: 'rgba(255,255,255,0.04)',
                borderColor: 'rgba(255,255,255,0.10)',
                color: 'rgba(255,255,255,0.5)',
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Rarity + owned filters */}
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={rarityFilter}
            onChange={(e) => setRarityFilter(e.target.value)}
            className="flex-1 min-w-0 text-[10px] rounded px-2 py-1 border border-white/10 bg-white/[0.06] text-white/70 outline-none"
          >
            <option value="all">All Rarities</option>
            {RARITIES.map((r) => (
              <option key={r.id} value={r.id}>{r.label}</option>
            ))}
          </select>
          <button
            onClick={() => setShowOwned((v) => !v)}
            className="text-[10px] px-2 py-1 rounded border transition-all"
            style={showOwned ? {
              background: 'rgba(16,185,129,0.2)',
              borderColor: 'rgba(16,185,129,0.4)',
              color: '#6ee7b7',
            } : {
              background: 'rgba(255,255,255,0.04)',
              borderColor: 'rgba(255,255,255,0.10)',
              color: 'rgba(255,255,255,0.5)',
            }}
          >
            Owned
          </button>
        </div>

        {/* Skill list */}
        <div className="flex-1 overflow-y-auto flex flex-col gap-1.5 pr-1">
          {filtered.length === 0 && (
            <div className="text-white/30 text-xs text-center mt-8">No skills match filters</div>
          )}
          {filtered.map((skill) => (
            <SkillCard
              key={skill.id}
              skill={skill}
              selected={selectedSkillId === skill.id}
              onClick={() => setSelectedSkillId((id) => id === skill.id ? null : skill.id)}
            />
          ))}
        </div>
      </div>

      {/* ── RIGHT: Skill Detail ── */}
      <div className="flex-1 min-w-0 overflow-hidden">
        <AnimatePresence mode="wait">
          {selectedSkill ? (
            <SkillDetail key={selectedSkill.id} skill={selectedSkill} onClose={() => setSelectedSkillId(null)} />
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="h-full flex flex-col items-center justify-center gap-3 text-center"
            >
              <Sparkles className="w-10 h-10 text-white/15" />
              <div className="text-white/30 text-sm">Select a skill to inspect</div>
              <div className="text-white/20 text-xs max-w-[200px]">
                Rare skills drop from world bosses, raids, and dimensional events
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

    </div>
  );
}
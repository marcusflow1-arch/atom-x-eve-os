import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Zap, Target, ChevronRight } from 'lucide-react';
import { WEAPON_PATHS, UNIVERSAL_BUFFS } from './weaponSkillData';

// ─── Hit Pattern Chip ───────────────────────────────────────────────────────
function PatternChip({ label, color }) {
  const isDelay = label.startsWith('⏱');
  return (
    <span
      className={`px-2 py-0.5 rounded text-[10px] font-mono ${
        isDelay
          ? 'text-white/40 bg-white/[0.04] border border-white/10'
          : 'text-white font-semibold border'
      }`}
      style={!isDelay ? { background: `${color}22`, borderColor: `${color}55`, color } : {}}
    >
      {label}
    </span>
  );
}

// ─── Skill Card ─────────────────────────────────────────────────────────────
function SkillCard({ skill, color, selected, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-3 rounded-lg border transition-all ${
        selected ? 'border-opacity-80 bg-opacity-20' : 'border-white/10 bg-white/[0.03] hover:bg-white/[0.06]'
      }`}
      style={selected ? {
        background: `${color}18`,
        borderColor: `${color}60`,
        boxShadow: `0 0 16px ${color}22`,
      } : {}}
    >
      <div className="flex items-start gap-2.5">
        <span className="text-xl mt-0.5">{skill.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="text-white text-sm font-semibold">{skill.name}</span>
            <span className="text-[9px] px-1.5 py-0.5 rounded tracking-wider border" style={{ color, borderColor: `${color}44`, background: `${color}11` }}>
              {skill.type}
            </span>
          </div>
          <p className="text-white/55 text-xs mt-1 leading-relaxed">{skill.description}</p>
          {selected && skill.pattern && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-2 flex flex-wrap gap-1 items-center"
            >
              {skill.pattern.map((p, i) => (
                <PatternChip key={i} label={p} color={color} />
              ))}
            </motion.div>
          )}
        </div>
      </div>
    </button>
  );
}

// ─── Universal Buff Card ────────────────────────────────────────────────────
function BuffCard({ buff, selected, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 min-w-[130px] text-left p-2.5 rounded-lg border transition-all ${
        selected ? '' : 'border-white/10 bg-white/[0.03] hover:bg-white/[0.06]'
      }`}
      style={selected ? {
        background: `${buff.color}18`,
        borderColor: `${buff.color}55`,
        boxShadow: `0 0 12px ${buff.color}22`,
      } : {}}
    >
      <div className="text-xl mb-1">{buff.icon}</div>
      <div className="text-white text-xs font-semibold leading-snug">{buff.name}</div>
      <div className="text-[9px] mt-0.5" style={{ color: buff.color }}>{buff.type}</div>
      {selected && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-1.5">
          <p className="text-white/60 text-[10px] leading-relaxed">{buff.description}</p>
          <p className="text-white/35 text-[9px] mt-1">{buff.details}</p>
        </motion.div>
      )}
    </button>
  );
}

// ─── Weapon Path Card ───────────────────────────────────────────────────────
function PathCard({ path, selected, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`relative text-left p-3 rounded-xl border transition-all overflow-hidden`}
      style={selected ? {
        background: `linear-gradient(135deg, ${path.color}25, ${path.color}08)`,
        borderColor: `${path.color}70`,
        boxShadow: `0 0 24px ${path.glowColor}`,
      } : {
        background: 'rgba(255,255,255,0.03)',
        borderColor: 'rgba(255,255,255,0.10)',
      }}
    >
      <div className="flex items-center gap-2 mb-1">
        <span className="text-2xl">{path.icon}</span>
        <div>
          <div className="text-white font-bold text-sm">{path.name}</div>
          <div className="text-white/45 text-[10px]">{path.subtitle}</div>
        </div>
      </div>
      {selected && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-white/50 text-[10px] mt-1 leading-relaxed"
        >
          {path.focus}
        </motion.p>
      )}
    </button>
  );
}

// ─── Main Tab ───────────────────────────────────────────────────────────────
export default function WeaponPathTab() {
  const [selectedPath, setSelectedPath] = useState(WEAPON_PATHS[0].id);
  const [selectedSkill, setSelectedSkill] = useState(null);
  const [selectedBuff, setSelectedBuff] = useState(null);

  const path = WEAPON_PATHS.find((p) => p.id === selectedPath);

  const handlePathSelect = (id) => {
    setSelectedPath(id);
    setSelectedSkill(null);
  };

  const toggleSkill = (id) => setSelectedSkill((s) => (s === id ? null : id));
  const toggleBuff = (id) => setSelectedBuff((s) => (s === id ? null : id));

  return (
    <div className="absolute left-6 top-24 right-6 bottom-20 flex gap-5 pointer-events-auto overflow-hidden">

      {/* ── LEFT: Weapon Paths ── */}
      <div className="w-[220px] shrink-0 flex flex-col gap-3 overflow-y-auto pr-1">
        <div className="text-white/40 text-[10px] tracking-[0.2em] uppercase mb-1">Weapon Path</div>
        {WEAPON_PATHS.map((p) => (
          <PathCard
            key={p.id}
            path={p}
            selected={selectedPath === p.id}
            onClick={() => handlePathSelect(p.id)}
          />
        ))}
      </div>

      {/* ── CENTER: Path Detail ── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={selectedPath}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.18 }}
          className="flex-1 min-w-0 flex flex-col gap-4 overflow-y-auto pr-1"
        >
          {/* Passive */}
          <div>
            <div className="text-white/40 text-[10px] tracking-[0.2em] uppercase mb-2">Passive Bonus</div>
            <div
              className="flex items-center gap-3 p-3 rounded-lg border"
              style={{
                background: `${path.color}12`,
                borderColor: `${path.color}40`,
              }}
            >
              <span className="text-2xl">{path.passive.icon}</span>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-white font-semibold text-sm">{path.passive.name}</span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded tracking-wider border" style={{ color: path.color, borderColor: `${path.color}44`, background: `${path.color}11` }}>
                    {path.passive.type}
                  </span>
                </div>
                <p className="text-white/55 text-xs mt-0.5">{path.passive.description}</p>
              </div>
            </div>
          </div>

          {/* Active Skills */}
          <div>
            <div className="text-white/40 text-[10px] tracking-[0.2em] uppercase mb-2">Active Skills</div>
            <div className="flex flex-col gap-2">
              {path.skills.map((skill) => (
                <SkillCard
                  key={skill.id}
                  skill={skill}
                  color={path.color}
                  selected={selectedSkill === skill.id}
                  onClick={() => toggleSkill(skill.id)}
                />
              ))}
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* ── RIGHT: Universal Buffs ── */}
      <div className="w-[260px] shrink-0 flex flex-col gap-3 overflow-y-auto pl-1 border-l border-white/10">
        <div className="text-white/40 text-[10px] tracking-[0.2em] uppercase mb-1 px-2">Universal Buffs</div>
        <div className="flex flex-col gap-2 px-2">
          {UNIVERSAL_BUFFS.map((buff) => (
            <BuffCard
              key={buff.id}
              buff={buff}
              selected={selectedBuff === buff.id}
              onClick={() => toggleBuff(buff.id)}
            />
          ))}
        </div>
      </div>

    </div>
  );
}
import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Lock, Star } from 'lucide-react';
import { getPassiveSummary } from './advancedClassPassives';
import { SKILL_MOD_DESCRIPTIONS } from './advancedClassSkills';

export default function AdvancedClassCard({ classDef, isSelected, isUnlocked, onClick, compact = false }) {
  if (!classDef) return null;
  const passives = getPassiveSummary(null)
    .length === 0
    ? Object.entries(classDef.passive_bonuses || {})
        .slice(0, 4)
        .map(([key, value]) => ({
          label: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
          display: `${value > 0 ? '+' : ''}${Math.round(value * 100)}%`,
          isPositive: value > 0,
        }))
    : [];

  // Direct from class def
  const previewPassives = Object.entries(classDef.passive_bonuses || {})
    .slice(0, compact ? 3 : 5)
    .map(([key, value]) => ({
      label: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      display: `${value > 0 ? '+' : ''}${Math.round(value * 100)}%`,
      isPositive: value > 0,
    }));

  const previewSkills = Object.entries(classDef.skill_modifiers || {})
    .filter(([, v]) => v !== false && v !== null)
    .slice(0, compact ? 2 : 3)
    .map(([key]) => {
      const meta = SKILL_MOD_DESCRIPTIONS[key];
      return meta?.label || key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    });

  return (
    <motion.button
      onClick={onClick}
      disabled={!isUnlocked}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={isUnlocked ? { scale: 1.02 } : {}}
      whileTap={isUnlocked ? { scale: 0.98 } : {}}
      className="relative text-left w-full rounded-lg overflow-hidden transition-all"
      style={{
        background: isSelected
          ? `linear-gradient(135deg, ${classDef.color}22 0%, rgba(0,0,0,0.5) 100%)`
          : 'rgba(255,255,255,0.025)',
        border: isSelected
          ? `1.5px solid ${classDef.color}88`
          : isUnlocked
            ? '1px solid rgba(255,255,255,0.08)'
            : '1px solid rgba(255,255,255,0.04)',
        boxShadow: isSelected ? `0 0 20px ${classDef.color}33, inset 0 0 30px ${classDef.color}11` : 'none',
        opacity: isUnlocked ? 1 : 0.45,
        cursor: isUnlocked ? 'pointer' : 'not-allowed',
        padding: compact ? '12px' : '16px',
      }}
    >
      {/* Selected indicator */}
      {isSelected && (
        <div className="absolute top-2 right-2">
          <CheckCircle2 className="w-4 h-4" style={{ color: classDef.color }} />
        </div>
      )}

      {/* Locked indicator */}
      {!isUnlocked && (
        <div className="absolute top-2 right-2 opacity-50">
          <Lock className="w-3.5 h-3.5 text-white/40" />
        </div>
      )}

      {/* Active glow strip */}
      {isSelected && (
        <div
          className="absolute top-0 left-0 right-0 h-px"
          style={{ background: `linear-gradient(90deg, transparent, ${classDef.color}cc, transparent)` }}
        />
      )}

      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        <div
          className="text-2xl w-10 h-10 flex items-center justify-center rounded-lg flex-shrink-0"
          style={{ background: `${classDef.color}22`, border: `1px solid ${classDef.color}44` }}
        >
          {classDef.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-bold text-white">{classDef.display_name}</span>
            {isSelected && (
              <span
                className="text-[9px] tracking-[0.3em] uppercase font-semibold px-1.5 py-0.5 rounded-sm"
                style={{ background: `${classDef.color}33`, color: classDef.color }}
              >
                Active
              </span>
            )}
          </div>
          {!compact && (
            <div
              className="text-[9px] tracking-[0.2em] uppercase mt-0.5 font-medium"
              style={{ color: `${classDef.color}cc` }}
            >
              {classDef.tagline}
            </div>
          )}
        </div>
      </div>

      {/* Description */}
      {!compact && (
        <p className="text-[10px] text-white/55 leading-relaxed mb-3">
          {classDef.description}
        </p>
      )}

      {/* Playstyle Tags */}
      {classDef.playstyle_tags && !compact && (
        <div className="flex flex-wrap gap-1 mb-3">
          {classDef.playstyle_tags.map((tag) => (
            <span
              key={tag}
              className="text-[8px] tracking-[0.15em] uppercase px-1.5 py-0.5 rounded"
              style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.45)' }}
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Passive Preview */}
      {previewPassives.length > 0 && (
        <div className="mb-2">
          {!compact && (
            <div className="text-[8px] tracking-[0.3em] uppercase text-white/30 mb-1.5">Passives</div>
          )}
          <div className="flex flex-col gap-0.5">
            {previewPassives.map((p, i) => (
              <div key={i} className="flex items-center justify-between">
                <span className="text-[9px] text-white/45 truncate">{p.label}</span>
                <span
                  className="text-[9px] font-semibold ml-2 flex-shrink-0"
                  style={{ color: p.isPositive ? '#86efac' : '#fca5a5' }}
                >
                  {p.display}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Skill Abilities Preview */}
      {previewSkills.length > 0 && !compact && (
        <div>
          <div className="text-[8px] tracking-[0.3em] uppercase text-white/30 mb-1.5">Abilities</div>
          <div className="flex flex-wrap gap-1">
            {previewSkills.map((s, i) => (
              <span
                key={i}
                className="text-[8px] px-1.5 py-0.5 rounded"
                style={{ background: `${classDef.color}18`, color: `${classDef.color}cc`, border: `1px solid ${classDef.color}33` }}
              >
                {s}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Flavor text */}
      {classDef.flavor_text && !compact && (
        <div className="mt-3 text-[9px] text-white/25 italic border-t border-white/[0.05] pt-2">
          {classDef.flavor_text}
        </div>
      )}
    </motion.button>
  );
}
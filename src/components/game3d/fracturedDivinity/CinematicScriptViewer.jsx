import React, { useState } from 'react';
import { CINEMATICS, VOICE_DIRECTION, getEndingVariant, CINEMATIC_ORDER } from './cinematicScript';
import { ChevronDown, ChevronRight, Film, Mic, Eye, SkipForward, User } from 'lucide-react';

// Color coding per speaker
const SPEAKER_COLORS = {
  PLAYER:          { bg: 'rgba(59,130,246,0.12)',  border: 'rgba(59,130,246,0.35)',  text: '#93c5fd', label: '#60a5fa' },
  ARTEMIS:         { bg: 'rgba(236,72,153,0.12)',  border: 'rgba(236,72,153,0.35)',  text: '#f9a8d4', label: '#ec4899' },
  COPY:            { bg: 'rgba(99,102,241,0.12)',  border: 'rgba(99,102,241,0.35)',  text: '#c4b5fd', label: '#a78bfa' },
  SYSTEM_VOICE:    { bg: 'rgba(239,68,68,0.08)',   border: 'rgba(239,68,68,0.30)',   text: '#fca5a5', label: '#ef4444' },
  PRESENCE:        { bg: 'rgba(250,204,21,0.08)',  border: 'rgba(250,204,21,0.25)',  text: '#fde68a', label: '#f59e0b' },
  WELCOMING_FIGURE:{ bg: 'rgba(34,197,94,0.08)',   border: 'rgba(34,197,94,0.25)',   text: '#86efac', label: '#22c55e' },
  UNKNOWN_VOICE:   { bg: 'rgba(148,163,184,0.08)', border: 'rgba(148,163,184,0.25)', text: '#cbd5e1', label: '#94a3b8' },
  FAINT_VOICE:     { bg: 'rgba(148,163,184,0.05)', border: 'rgba(148,163,184,0.15)', text: '#94a3b8', label: '#64748b' },
};

function DialogueLine({ line, index }) {
  if (line.type === 'sfx') {
    return (
      <div className="flex items-center gap-2 py-1.5 px-3 rounded text-[11px] text-white/35 italic"
        style={{ background: 'rgba(255,255,255,0.02)' }}>
        <span className="text-[9px] tracking-[0.25em] uppercase text-white/20">SFX</span>
        <span>{line.text}</span>
      </div>
    );
  }
  if (line.type === 'visual' || line.type === 'title_card') {
    return (
      <div className="flex items-start gap-2 py-2 px-3 rounded my-1"
        style={{ background: 'rgba(255,255,255,0.03)', border: '1px dashed rgba(255,255,255,0.10)' }}>
        <Eye className="w-3 h-3 mt-0.5 text-white/30 shrink-0" />
        <span className="text-[11px] text-white/45 italic">{line.text}</span>
      </div>
    );
  }

  const colors = SPEAKER_COLORS[line.speaker] || SPEAKER_COLORS.UNKNOWN_VOICE;
  const voiceDir = VOICE_DIRECTION[line.speaker];

  return (
    <div className="rounded px-3 py-2.5 my-1.5"
      style={{ background: colors.bg, border: `1px solid ${colors.border}` }}>
      <div className="flex items-center gap-2 mb-1">
        <span className="text-[10px] font-bold tracking-[0.2em] uppercase" style={{ color: colors.label }}>
          {voiceDir?.label || line.speaker}
        </span>
        {line.tone && (
          <span className="text-[9px] tracking-[0.15em] uppercase px-1.5 py-0.5 rounded-full"
            style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.35)' }}>
            {line.tone}
          </span>
        )}
        {line.direction && (
          <span className="text-[9px] text-white/30 italic ml-auto">{line.direction}</span>
        )}
      </div>
      <p className="text-[13px] leading-relaxed" style={{ color: colors.text }}>
        "{line.text}"
      </p>
    </div>
  );
}

function VariantBlock({ variant }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mb-3 rounded-lg overflow-hidden"
      style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left transition-all hover:bg-white/[0.03]"
        style={{ background: open ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.01)' }}
      >
        {open ? <ChevronDown className="w-4 h-4 text-white/40 shrink-0" /> : <ChevronRight className="w-4 h-4 text-white/40 shrink-0" />}
        <div>
          <div className="text-sm font-semibold text-white/85">Ending: {variant.label}</div>
          <div className="text-[10px] text-white/40 mt-0.5">{variant.sceneStyle}</div>
        </div>
        <span className="ml-auto text-[9px] tracking-[0.2em] uppercase px-2 py-1 rounded"
          style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.40)' }}>
          {variant.arcResult}
        </span>
      </button>
      {open && (
        <div className="px-4 pb-4 pt-1">
          <div className="text-[10px] text-white/30 mb-1 italic">
            Camera: {variant.cameraDirection}
          </div>
          {variant.lines.map((line, i) => <DialogueLine key={line.id} line={line} index={i} />)}
        </div>
      )}
    </div>
  );
}

function CinematicBlock({ cinematic }) {
  const [open, setOpen] = useState(false);
  const levelText = cinematic.levelRange
    ? `Levels ${cinematic.levelRange[0]}–${cinematic.levelRange[1]}`
    : '';

  return (
    <div className="mb-4 rounded-xl overflow-hidden"
      style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)' }}>
      {/* Header */}
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-3 px-5 py-4 text-left transition-all hover:bg-white/[0.03]"
      >
        <Film className="w-4 h-4 text-white/40 shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="text-[10px] tracking-[0.3em] uppercase text-white/35">{cinematic.label}</span>
            <span className="text-sm font-semibold text-white/85">{cinematic.title}</span>
          </div>
          {cinematic.sceneStyle && (
            <div className="text-[10px] text-white/35 mt-0.5 italic">{cinematic.sceneStyle}</div>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {levelText && (
            <span className="text-[9px] text-white/30 tracking-[0.15em]">{levelText}</span>
          )}
          {cinematic.isMultiVariant && (
            <span className="text-[9px] px-2 py-0.5 rounded tracking-[0.1em]"
              style={{ background: 'rgba(251,191,36,0.12)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.25)' }}>
              4 ENDINGS
            </span>
          )}
          {open
            ? <ChevronDown className="w-4 h-4 text-white/40" />
            : <ChevronRight className="w-4 h-4 text-white/40" />
          }
        </div>
      </button>

      {/* Expanded Content */}
      {open && (
        <div className="px-5 pb-5 border-t border-white/[0.06]">
          {/* Scene metadata */}
          <div className="flex flex-wrap gap-4 py-3 mb-2">
            {cinematic.audio && (
              <div className="text-[10px] text-white/30">
                <span className="text-white/20 mr-1">♪</span>
                {cinematic.audio.ambient}
                {cinematic.audio.sfx?.length > 0 && (
                  <span className="ml-1 text-white/20">+ {cinematic.audio.sfx.join(', ')}</span>
                )}
              </div>
            )}
            {cinematic.cameraDirection && !cinematic.isMultiVariant && (
              <div className="text-[10px] text-white/30 italic">
                <span className="text-white/20 mr-1">🎥</span>
                {cinematic.cameraDirection}
              </div>
            )}
          </div>

          {/* Multi-variant endings */}
          {cinematic.isMultiVariant
            ? cinematic.variants.map(v => <VariantBlock key={v.id} variant={v} />)
            : cinematic.lines.map((line, i) => <DialogueLine key={line.id} line={line} index={i} />)
          }
        </div>
      )}
    </div>
  );
}

function VoiceDirectionPanel() {
  const [open, setOpen] = useState(false);
  return (
    <div className="mb-6 rounded-xl overflow-hidden"
      style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)' }}>
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-white/[0.03] transition-all"
      >
        <Mic className="w-4 h-4 text-white/40" />
        <span className="text-sm font-semibold text-white/85">Voice Acting Direction</span>
        <span className="ml-auto text-[9px] text-white/30 tracking-[0.2em] uppercase">
          {Object.keys(VOICE_DIRECTION).length} characters
        </span>
        {open ? <ChevronDown className="w-4 h-4 text-white/40" /> : <ChevronRight className="w-4 h-4 text-white/40" />}
      </button>
      {open && (
        <div className="px-5 pb-5 border-t border-white/[0.06] grid grid-cols-1 md:grid-cols-2 gap-3 pt-4">
          {Object.entries(VOICE_DIRECTION).map(([key, vd]) => {
            const colors = SPEAKER_COLORS[key] || SPEAKER_COLORS.UNKNOWN_VOICE;
            return (
              <div key={key} className="rounded-lg p-3"
                style={{ background: colors.bg, border: `1px solid ${colors.border}` }}>
                <div className="flex items-center gap-2 mb-1.5">
                  <User className="w-3 h-3 shrink-0" style={{ color: colors.label }} />
                  <span className="text-[11px] font-bold tracking-[0.15em] uppercase" style={{ color: colors.label }}>
                    {vd.label}
                  </span>
                </div>
                <p className="text-[11px] leading-relaxed" style={{ color: colors.text }}>
                  {vd.arc}
                </p>
                <div className="flex flex-wrap gap-1 mt-2">
                  {vd.toneProgression.map(t => (
                    <span key={t} className="text-[9px] px-1.5 py-0.5 rounded tracking-[0.1em]"
                      style={{ background: 'rgba(0,0,0,0.25)', color: 'rgba(255,255,255,0.35)' }}>
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function CinematicScriptViewer() {
  const [selectedArcResult, setSelectedArcResult] = useState('INTEGRATED');
  const orderedCinematics = CINEMATIC_ORDER.map(id => CINEMATICS.find(c => c.id === id)).filter(Boolean);

  return (
    <div className="w-full h-full overflow-y-auto p-6"
      style={{ background: 'rgba(8,10,16,0.98)', color: 'rgba(255,255,255,0.85)' }}>

      {/* Header */}
      <div className="mb-8">
        <div className="text-[10px] tracking-[0.5em] uppercase text-white/30 mb-1">Cinematic Script</div>
        <h1 className="text-2xl font-bold tracking-[0.3em] uppercase text-white mb-1">
          DIVIDED: RECLAMATION
        </h1>
        <p className="text-sm text-white/40">
          Full cinematic structure — Acts I–X, Prologue, Post-Credits + 4 variant endings
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <span className="text-[10px] text-white/30">Active Arc 9 result:</span>
          {['INTEGRATED', 'CONTROLLED', 'SURRENDERED', 'DUAL'].map(r => (
            <button key={r}
              onClick={() => setSelectedArcResult(r)}
              className="text-[10px] tracking-[0.15em] uppercase px-3 py-1 rounded transition-all"
              style={{
                background: selectedArcResult === r ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.04)',
                border: selectedArcResult === r ? '1px solid rgba(255,255,255,0.25)' : '1px solid rgba(255,255,255,0.08)',
                color: selectedArcResult === r ? '#fff' : 'rgba(255,255,255,0.40)',
              }}>
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Voice Direction */}
      <VoiceDirectionPanel />

      {/* All Cinematics */}
      <div>
        <div className="text-[10px] tracking-[0.4em] uppercase text-white/25 mb-4">
          Cinematic Sequence — {orderedCinematics.length} scenes
        </div>
        {orderedCinematics.map(c => (
          <CinematicBlock key={c.id} cinematic={c} />
        ))}
      </div>
    </div>
  );
}
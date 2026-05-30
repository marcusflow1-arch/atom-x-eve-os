import React, { useState, useEffect, useCallback } from 'react';
import {
  GameState, subscribeGameState, modifyControl, togglePerception,
  loadGame, saveGame, resetGame, setFlag, advanceArc, unlockAbility,
} from './gameplayState';
import { Enemy, ENEMY_TYPES, ABILITIES, applyAbility, DIALOGUE_TRIGGERS } from './gameplayCombat';
import {
  onArcAdvance, virusEvent, getActiveMechanics, startLoopMechanic,
} from './gameplayArcEngine';

// ── Sub-components ────────────────────────────────────────────────────────────

function ControlMeter({ control }) {
  const color = control >= 70 ? '#34d399' : control >= 30 ? '#fbbf24' : '#ef4444';
  const label = control >= 70 ? 'Stable' : control >= 30 ? 'Strained' : 'Critical';
  return (
    <div className="mb-3">
      <div className="flex justify-between text-[10px] mb-1" style={{ color: 'rgba(255,255,255,0.5)' }}>
        <span className="tracking-[0.2em] uppercase">Control</span>
        <span style={{ color }}>{control}% — {label}</span>
      </div>
      <div className="h-2 rounded-full w-full" style={{ background: 'rgba(255,255,255,0.08)' }}>
        <div className="h-full rounded-full transition-all duration-500"
          style={{ width: `${control}%`, background: color, boxShadow: `0 0 8px ${color}55` }} />
      </div>
    </div>
  );
}

function HPBar({ hp, maxHP }) {
  const pct = (hp / maxHP) * 100;
  return (
    <div className="mb-3">
      <div className="flex justify-between text-[10px] mb-1" style={{ color: 'rgba(255,255,255,0.5)' }}>
        <span className="tracking-[0.2em] uppercase">Player HP</span>
        <span className="text-white/70">{hp} / {maxHP}</span>
      </div>
      <div className="h-2 rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }}>
        <div className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, background: '#6366f1', boxShadow: '0 0 8px rgba(99,102,241,0.5)' }} />
      </div>
    </div>
  );
}

function StateChip({ label, value, color }) {
  return (
    <div className="px-2.5 py-1 rounded text-center"
      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
      <div className="text-[9px] text-white/30 tracking-[0.2em] uppercase">{label}</div>
      <div className="text-[11px] font-semibold mt-0.5" style={{ color: color || '#fff' }}>{value}</div>
    </div>
  );
}

function DialogueBox({ dialogue, onChoice }) {
  if (!dialogue) return null;
  return (
    <div className="rounded-xl p-4 mb-4"
      style={{ background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.12)', backdropFilter: 'blur(12px)' }}>
      {dialogue.speaker && (
        <div className="text-[10px] tracking-[0.3em] uppercase text-white/40 mb-1">{dialogue.speaker}</div>
      )}
      <p className="text-[13px] text-white/85 leading-relaxed mb-3">{dialogue.text}</p>
      {dialogue.mechanicEffect && (
        <div className="text-[10px] text-amber-300/60 mb-2 italic">⚡ {dialogue.mechanicEffect.replace(/_/g, ' ')}</div>
      )}
      {dialogue.choices?.length > 0 ? (
        <div className="flex flex-col gap-2">
          {dialogue.choices.map((c, i) => (
            <button key={i} onClick={() => onChoice(c)}
              className="w-full text-left px-3 py-2.5 rounded text-[12px] transition-all hover:bg-white/[0.08]"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.10)', color: 'rgba(255,255,255,0.75)' }}>
              <span className="text-white/30 mr-2">{i + 1}.</span>
              {c.text}
              {c.label && <span className="block text-[10px] text-white/30 mt-0.5 ml-4">{c.label}</span>}
            </button>
          ))}
        </div>
      ) : (
        <button onClick={() => onChoice(null)}
          className="px-4 py-1.5 rounded text-[11px] text-white/50 hover:text-white/70 transition-all"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
          Continue →
        </button>
      )}
    </div>
  );
}

function CombatPanel({ enemy, onAttack, onAbility, abilities }) {
  if (!enemy || !enemy.alive) return null;
  const pct = (enemy.currentHP / enemy.maxHP) * 100;
  return (
    <div className="rounded-xl p-4 mb-4"
      style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.25)' }}>
      <div className="flex justify-between items-center mb-2">
        <div>
          <div className="text-sm font-semibold text-white/85">{enemy.name}</div>
          <div className="text-[10px] text-white/35 italic">{enemy.description}</div>
        </div>
        <div className="text-[10px] text-white/40">Phase {enemy.phase}</div>
      </div>
      <div className="h-1.5 rounded-full mb-3" style={{ background: 'rgba(255,255,255,0.08)' }}>
        <div className="h-full rounded-full transition-all duration-300"
          style={{ width: `${pct}%`, background: '#ef4444' }} />
      </div>
      <div className="text-[10px] text-white/40 mb-3 text-center tabular-nums">{enemy.currentHP} / {enemy.maxHP} HP</div>
      <div className="flex flex-wrap gap-2">
        {abilities.map(abId => {
          const ab = ABILITIES[abId];
          if (!ab) return null;
          return (
            <button key={abId} onClick={() => onAbility(abId)}
              className="px-3 py-1.5 rounded text-[11px] transition-all hover:bg-white/[0.10]"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.10)', color: 'rgba(255,255,255,0.70)' }}>
              {ab.name}
              {ab.damage > 0 && <span className="text-red-300/60 ml-1 text-[9px]">+{ab.damage}dmg</span>}
              {ab.controlCost < 0 && <span className="text-green-300/60 ml-1 text-[9px]">+{-ab.controlCost}ctl</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function MechanicsIndicators({ mechanics }) {
  const active = Object.entries(mechanics).filter(([, v]) => v);
  if (active.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1.5 mb-3">
      {active.map(([key]) => (
        <span key={key} className="text-[9px] px-2 py-0.5 rounded tracking-[0.1em] uppercase"
          style={{
            background: key === 'fullControl' || key === 'preciseMovement' ? 'rgba(52,211,153,0.12)' : 'rgba(239,68,68,0.12)',
            border: key === 'fullControl' || key === 'preciseMovement' ? '1px solid rgba(52,211,153,0.30)' : '1px solid rgba(239,68,68,0.30)',
            color: key === 'fullControl' || key === 'preciseMovement' ? '#34d399' : '#fca5a5',
          }}>
          {key.replace(/([A-Z])/g, ' $1').trim()}
        </span>
      ))}
    </div>
  );
}

// ── Main HUD ──────────────────────────────────────────────────────────────────

export default function GameplayHUD() {
  const [state, setState] = useState({ ...GameState });
  const [dialogue, setDialogue] = useState(null);
  const [enemy, setEnemy] = useState(null);
  const [log, setLog] = useState([]);
  const [tab, setTab] = useState('combat'); // 'combat' | 'abilities' | 'state' | 'history'

  useEffect(() => {
    loadGame();
    return subscribeGameState(s => setState({ ...s }));
  }, []);

  const addLog = useCallback((msg, color = 'rgba(255,255,255,0.5)') => {
    setLog(l => [{ msg, color, id: Date.now() + Math.random() }, ...l].slice(0, 20));
  }, []);

  const openDialogue = useCallback((d) => setDialogue(d), []);

  const handleChoice = (choice) => {
    if (!choice) { setDialogue(null); return; }
    choice.action?.();
    addLog(`Choice: "${choice.text}"`, '#93c5fd');
    setDialogue(null);
  };

  const spawnEnemy = (typeId) => {
    const e = new Enemy(typeId);
    setEnemy(e);
    addLog(`⚔ ${e.name} appeared!`, '#fca5a5');
  };

  const handleAbility = (abId) => {
    if (!enemy || !enemy.alive) return;
    const result = applyAbility(abId, enemy);
    if (result.ok) {
      addLog(`Used ${ABILITIES[abId]?.name}: ${result.damage > 0 ? `-${result.damage} HP` : 'effect applied'}`, '#c4b5fd');
      if (result.killed) {
        addLog(`✓ ${enemy.name} defeated. +${enemy.memoryFragments || 1} memory fragments.`, '#34d399');
        setEnemy(null);
      } else {
        // Enemy counter-attacks
        const dmg = enemy.performAttack();
        addLog(`${enemy.name} attacks for ${dmg} damage.`, '#fca5a5');
      }
      setEnemy(prev => prev && !result.killed ? { ...prev } : null);
    }
  };

  const handleArcAdvance = () => {
    const newArc = advanceArc();
    addLog(`Arc ${newArc} begins. Level ${GameState.level}.`, '#fbbf24');
    onArcAdvance(newArc, openDialogue);
  };

  const mechanics = getActiveMechanics();

  const copyColor = {
    INTEGRATED: '#34d399', CONTROLLED: '#fbbf24', DOMINATED: '#ef4444', SEPARATED: '#a78bfa',
  }[state.copyState] || '#fff';

  const artemisColor = {
    STABLE: '#34d399', FADING: '#fbbf24', STRONG: '#60a5fa',
  }[state.artemisState] || '#fff';

  return (
    <div className="w-full h-full overflow-y-auto p-4"
      style={{ background: 'rgba(6,8,14,0.98)', color: 'rgba(255,255,255,0.85)', fontFamily: 'monospace' }}>

      {/* Title */}
      <div className="mb-4 pb-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="text-[9px] tracking-[0.6em] uppercase text-white/25 mb-0.5">Gameplay System</div>
        <div className="text-base font-bold tracking-[0.2em] uppercase text-white/90">DIVIDED: RECLAMATION</div>
      </div>

      {/* Vitals */}
      <ControlMeter control={state.control} />
      <HPBar hp={state.playerHP} maxHP={state.maxPlayerHP} />

      {/* State chips */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        <StateChip label="Arc"      value={state.arc}          color="#fbbf24" />
        <StateChip label="Percep."  value={state.perception === 'REALITY' ? 'Real' : 'Perc.'} color={state.perception === 'REALITY' ? '#60a5fa' : '#a78bfa'} />
        <StateChip label="Copy"     value={state.copyState.slice(0,4)}    color={copyColor} />
        <StateChip label="Artemis"  value={state.artemisState.slice(0,4)} color={artemisColor} />
      </div>

      {/* Active mechanic indicators */}
      <MechanicsIndicators mechanics={mechanics} />

      {/* Memory fragments */}
      <div className="text-[10px] text-white/35 mb-4">
        ◆ Memory Fragments: <span className="text-amber-300/70">{state.memoryFragments || 0}</span>
      </div>

      {/* Dialogue */}
      <DialogueBox dialogue={dialogue} onChoice={handleChoice} />

      {/* Combat */}
      <CombatPanel enemy={enemy} onAbility={handleAbility} abilities={state.unlockedAbilities} />

      {/* Tabs */}
      <div className="flex gap-0 mb-4 rounded-lg overflow-hidden"
        style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
        {['combat', 'abilities', 'triggers', 'history'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className="flex-1 py-2 text-[10px] tracking-[0.15em] uppercase transition-all"
            style={{
              background: tab === t ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.02)',
              color: tab === t ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.35)',
              borderRight: '1px solid rgba(255,255,255,0.06)',
            }}>
            {t}
          </button>
        ))}
      </div>

      {/* Tab: Combat */}
      {tab === 'combat' && (
        <div className="space-y-2">
          <div className="text-[10px] text-white/25 tracking-[0.3em] uppercase mb-2">Spawn Enemy</div>
          {Object.keys(ENEMY_TYPES).map(typeId => {
            const def = ENEMY_TYPES[typeId];
            return (
              <button key={typeId} onClick={() => spawnEnemy(typeId)}
                className="w-full text-left px-3 py-2 rounded text-[11px] transition-all hover:bg-white/[0.06]"
                style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <span className="text-white/70">{def.name}</span>
                <span className="text-white/30 text-[10px] ml-2">{def.baseHP} HP · Arc {def.arc[0]}–{def.arc[1]}</span>
                <div className="text-[9px] text-white/25 mt-0.5 italic">{def.description}</div>
              </button>
            );
          })}
          <div className="mt-3 flex flex-wrap gap-2">
            <button onClick={() => modifyControl(-10)}
              className="px-3 py-1.5 rounded text-[11px] transition-all hover:bg-white/[0.08]"
              style={{ background: 'rgba(239,68,68,0.10)', border: '1px solid rgba(239,68,68,0.25)', color: '#fca5a5' }}>
              -10 Control
            </button>
            <button onClick={() => modifyControl(+10)}
              className="px-3 py-1.5 rounded text-[11px] transition-all hover:bg-white/[0.08]"
              style={{ background: 'rgba(52,211,153,0.10)', border: '1px solid rgba(52,211,153,0.25)', color: '#34d399' }}>
              +10 Control
            </button>
            <button onClick={togglePerception}
              className="px-3 py-1.5 rounded text-[11px] transition-all hover:bg-white/[0.08]"
              style={{ background: 'rgba(167,139,250,0.10)', border: '1px solid rgba(167,139,250,0.25)', color: '#c4b5fd' }}>
              Toggle Perception
            </button>
            <button onClick={handleArcAdvance}
              className="px-3 py-1.5 rounded text-[11px] transition-all hover:bg-white/[0.08]"
              style={{ background: 'rgba(251,191,36,0.10)', border: '1px solid rgba(251,191,36,0.25)', color: '#fbbf24' }}>
              Advance Arc →
            </button>
          </div>
        </div>
      )}

      {/* Tab: Abilities */}
      {tab === 'abilities' && (
        <div className="space-y-2">
          {Object.values(ABILITIES).map(ab => {
            const unlocked = state.unlockedAbilities.includes(ab.id);
            return (
              <div key={ab.id} className="px-3 py-2.5 rounded"
                style={{
                  background: unlocked ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.01)',
                  border: `1px solid ${unlocked ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.05)'}`,
                  opacity: unlocked ? 1 : 0.4,
                }}>
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-[12px] font-semibold text-white/85">{ab.name}</span>
                  <div className="flex gap-2 text-[9px]">
                    {ab.damage > 0 && <span className="text-red-300/60">+{ab.damage} dmg</span>}
                    {ab.controlCost > 0 && <span className="text-yellow-300/60">-{ab.controlCost} ctl</span>}
                    {ab.controlCost < 0 && <span className="text-green-300/60">+{-ab.controlCost} ctl</span>}
                    <span className="text-white/25">Arc {ab.unlockArc}</span>
                  </div>
                </div>
                <div className="text-[10px] text-white/35">{ab.description}</div>
                {!unlocked && (
                  <button onClick={() => unlockAbility(ab.id)}
                    className="mt-1.5 text-[9px] px-2 py-0.5 rounded text-white/40 hover:text-white/60 transition-all"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    Unlock
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Tab: Triggers */}
      {tab === 'triggers' && (
        <div className="space-y-2">
          {Object.values(DIALOGUE_TRIGGERS).map(t => (
            <div key={t.id} className="px-3 py-2.5 rounded"
              style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div className="text-[11px] font-semibold text-white/75 mb-0.5">{t.prompt}</div>
              <div className="text-[10px] text-white/35 italic mb-2">{t.effect}</div>
              <button onClick={() => openDialogue({ text: t.prompt, speaker: 'System', mechanicEffect: t.effect, choices: t.choices.map(c => ({ ...c, action: () => { modifyControl(c.controlDelta || 0); if (c.flag) setFlag(c.flag); addLog(`Trigger: ${c.text} (${c.controlDelta > 0 ? '+' : ''}${c.controlDelta} control)`, '#93c5fd'); } })) })}
                className="text-[9px] px-2.5 py-1 rounded transition-all hover:bg-white/[0.08]"
                style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.20)', color: '#93c5fd' }}>
                Trigger
              </button>
            </div>
          ))}
          <div className="mt-2">
            <button onClick={() => virusEvent(openDialogue)}
              className="w-full py-2 rounded text-[11px] transition-all hover:bg-white/[0.06]"
              style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.20)', color: '#fca5a5' }}>
              ⚡ Fire Virus Event
            </button>
          </div>
        </div>
      )}

      {/* Tab: History */}
      {tab === 'history' && (
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-[10px] text-white/25 tracking-[0.3em] uppercase">Decision Log</span>
            <button onClick={resetGame}
              className="text-[9px] px-2 py-0.5 rounded text-red-300/50 hover:text-red-300/80 transition-all"
              style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)' }}>
              Reset Save
            </button>
          </div>
          {/* Flags */}
          <div className="mb-3">
            <div className="text-[9px] text-white/20 mb-1">Active Flags</div>
            <div className="flex flex-wrap gap-1">
              {Object.entries(state.flags).filter(([,v]) => v).map(([k]) => (
                <span key={k} className="text-[9px] px-1.5 py-0.5 rounded text-white/40"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  {k}
                </span>
              ))}
              {Object.keys(state.flags).length === 0 && <span className="text-[9px] text-white/20">None yet</span>}
            </div>
          </div>
          {/* Runtime log */}
          <div className="text-[9px] text-white/20 mb-1">Runtime Log</div>
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {log.length === 0 && <div className="text-[10px] text-white/20">No actions yet.</div>}
            {log.map(entry => (
              <div key={entry.id} className="text-[10px]" style={{ color: entry.color }}>{entry.msg}</div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
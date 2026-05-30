// DIVIDED: RECLAMATION — Chain Break PvP System Page

import React, { useState } from 'react';
import ChainBreakHUD from '../components/game3d/chainBreak/ChainBreakHUD';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function ChainBreak() {
  const [clan, setClan] = useState('WOLF');

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        background: 'radial-gradient(ellipse at 20% 10%, rgba(99,102,241,0.12) 0%, transparent 50%), radial-gradient(ellipse at 80% 80%, rgba(239,68,68,0.08) 0%, transparent 50%), linear-gradient(135deg, #0a0c14 0%, #10131e 50%, #0d0f18 100%)',
        fontFamily: 'monospace',
        color: 'rgba(255,255,255,0.85)',
      }}
    >
      {/* Header */}
      <div
        className="flex items-center gap-4 px-6 py-4 flex-shrink-0"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
      >
        <Link
          to="/"
          className="flex items-center gap-1.5 text-white/40 hover:text-white/70 transition-colors text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>
        <div className="w-px h-5 bg-white/10" />
        <div>
          <div className="text-[9px] tracking-[0.5em] uppercase text-white/25">PvP Combat</div>
          <div className="text-lg font-bold tracking-[0.25em] uppercase">⚡ Chain Break</div>
        </div>
        <div className="ml-auto text-[10px] text-white/20 tracking-[0.2em] uppercase hidden md:block">
          Divided: Reclamation
        </div>
      </div>

      {/* Layout */}
      <div className="flex-1 flex overflow-hidden">

        {/* Left — HUD Panel */}
        <div
          className="w-full md:w-80 flex-shrink-0 overflow-hidden flex flex-col"
          style={{
            borderRight: '1px solid rgba(255,255,255,0.06)',
            background: 'rgba(6,8,14,0.95)',
          }}
        >
          <ChainBreakHUD playerClan={clan} />
        </div>

        {/* Right — Info / Lore Panel */}
        <div className="hidden md:flex flex-1 flex-col overflow-y-auto p-8 gap-8">

          {/* System Overview */}
          <Section title="System Overview" accent="#6366f1">
            <p className="text-[13px] leading-relaxed text-white/50">
              Chain Break is a high-risk PvP mechanic built around momentum, execution, and identity.
              Build your gauge through combat. Activate to enter an accelerated state.
              Execute up to 5 chained kills. If two players collide at peak chains — a Clash is triggered.
            </p>
          </Section>

          {/* Gauge Rules */}
          <Section title="Gauge Rules" accent="#fbbf24">
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Kill', value: '+20%', color: '#34d399' },
                { label: 'Damage', value: '+1–3%', color: '#60a5fa' },
                { label: 'Cap', value: '100%', color: '#fbbf24' },
                { label: 'Activation', value: 'Manual', color: '#c4b5fd' },
              ].map(({ label, value, color }) => (
                <div key={label} className="flex items-center justify-between px-3 py-2 rounded"
                  style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <span className="text-[11px] text-white/40 uppercase tracking-[0.2em]">{label}</span>
                  <span className="text-[12px] font-bold" style={{ color }}>{value}</span>
                </div>
              ))}
            </div>
          </Section>

          {/* Scaling Table */}
          <Section title="Chain Scaling" accent="#ef4444">
            <div className="overflow-hidden rounded-lg" style={{ border: '1px solid rgba(255,255,255,0.07)' }}>
              <table className="w-full text-[11px]">
                <thead>
                  <tr style={{ background: 'rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                    {['Chain', 'Dmg Bonus', 'Crit Bonus', 'Reward (Lv30)'].map(h => (
                      <th key={h} className="text-left px-3 py-2 text-white/35 tracking-[0.15em] uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[1, 2, 3, 4, 5].map(n => (
                    <tr key={n} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <td className="px-3 py-2 text-white/70">×{n}</td>
                      <td className="px-3 py-2 text-red-300/70">+{n * 10}%</td>
                      <td className="px-3 py-2 text-amber-300/70">+{n * 5}%</td>
                      <td className="px-3 py-2 text-green-300/70">{Math.floor(30 * (1 + n * 0.15))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>

          {/* Clan Finishers */}
          <Section title="Clan Finishers" accent="#a78bfa">
            <div className="grid grid-cols-3 gap-3">
              {[
                { clan: 'WOLF', icon: '🐺', desc: 'Fast multi-strike. Spirit wolf surges forward.', color: '#60a5fa' },
                { clan: 'BEAR', icon: '🐻', desc: 'Heavy slam. Spirit bear crushes from above.', color: '#f97316' },
                { clan: 'SHADOW', icon: '🌑', desc: 'Assassin execution. Duplicate phases through target.', color: '#a78bfa' },
              ].map(({ clan: c, icon, desc, color }) => (
                <div key={c} className="p-3 rounded-lg text-center"
                  style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <div className="text-3xl mb-2">{icon}</div>
                  <div className="text-[11px] font-bold mb-1" style={{ color }}>{c}</div>
                  <div className="text-[10px] text-white/35 leading-relaxed">{desc}</div>
                </div>
              ))}
            </div>
          </Section>

          {/* Clash System */}
          <Section title="Clash System" accent="#f59e0b">
            <div className="flex gap-4 items-start">
              <div className="flex-1 text-[13px] text-white/50 leading-relaxed">
                When two players both reach 4+ chain hits and target each other simultaneously —
                time slows, and a rapid-input contest begins. The winner executes a cinematic kill.
                The loser takes full damage and is knocked out of Chain Break.
              </div>
              <div className="flex-shrink-0 text-center">
                <div className="w-16 h-16 rounded-full flex items-center justify-center text-3xl"
                  style={{ background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.3)' }}>
                  ⚔
                </div>
                <div className="text-[9px] mt-1 text-white/25 tracking-[0.2em] uppercase">Clash</div>
              </div>
            </div>
          </Section>

        </div>
      </div>
    </div>
  );
}

function Section({ title, accent, children }) {
  return (
    <div>
      <div className="flex items-center gap-3 mb-3">
        <div className="w-1 h-4 rounded-full" style={{ background: accent }} />
        <span className="text-[11px] tracking-[0.4em] uppercase font-semibold" style={{ color: accent }}>
          {title}
        </span>
      </div>
      {children}
    </div>
  );
}
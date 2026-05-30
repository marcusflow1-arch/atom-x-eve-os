import React, { useEffect, useState, useCallback } from 'react';
import { ChevronDown, ChevronUp, Zap, Lock, CheckCircle2, RotateCcw } from 'lucide-react';
import {
  PERK_TREE_CONFIG,
  getBranchesForWeapon,
  getMaxPoints,
} from './perkTreeData';
import {
  getWeaponPerkState,
  isUnlocked,
  canUnlockTier,
  canUnlockKeystone,
  isKeystoneActive,
  getRemainingPoints,
  unlockTier,
  refundTier,
  activateKeystone,
  deactivateKeystone,
  resetWeapon,
  subscribePerkTree,
} from './perkTreeStore';

// ─── Tier node ───────────────────────────────────────────────────────────
function TierNode({ weaponId, branchId, perk, refreshState }) {
  const unlocked = isUnlocked(weaponId, branchId, perk.tier);
  const canUnlock = canUnlockTier(weaponId, branchId, perk.tier);

  const handleClick = () => {
    if (unlocked) {
      refundTier(weaponId, branchId, perk.tier);
    } else if (canUnlock) {
      unlockTier(weaponId, branchId, perk.tier);
    }
    refreshState();
  };

  return (
    <button
      onClick={handleClick}
      title={unlocked ? 'Click to refund' : canUnlock ? 'Click to unlock' : 'Unlock previous tier first'}
      className="w-full text-left flex items-start gap-2.5 px-3 py-2 rounded transition-all"
      style={{
        background: unlocked ? 'rgba(99,102,241,0.12)' : 'rgba(255,255,255,0.02)',
        border: unlocked
          ? '1px solid rgba(99,102,241,0.45)'
          : canUnlock
          ? '1px dashed rgba(255,255,255,0.25)'
          : '1px solid rgba(255,255,255,0.07)',
        opacity: !unlocked && !canUnlock ? 0.45 : 1,
        cursor: !unlocked && !canUnlock ? 'not-allowed' : 'pointer',
      }}
    >
      <div className="mt-0.5 flex-shrink-0">
        {unlocked
          ? <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />
          : <Lock className="w-3.5 h-3.5 text-white/30" />
        }
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <span className="text-[11px] font-semibold text-white/90">{perk.name}</span>
          <span className="text-[9px] text-white/35 tracking-widest uppercase">T{perk.tier}</span>
        </div>
        <p className="text-[9px] text-white/50 mt-0.5 leading-relaxed">{perk.desc}</p>
      </div>
    </button>
  );
}

// ─── Keystone node ────────────────────────────────────────────────────────
function KeystoneNode({ weaponId, branchId, keystone, refreshState }) {
  const canUnlock = canUnlockKeystone(weaponId, branchId);
  const isActive = isKeystoneActive(weaponId, keystone.id);

  const handleClick = () => {
    if (!canUnlock) return;
    if (isActive) {
      deactivateKeystone(weaponId);
    } else {
      activateKeystone(weaponId, branchId);
    }
    refreshState();
  };

  return (
    <button
      onClick={handleClick}
      disabled={!canUnlock && !isActive}
      className="w-full text-left flex items-start gap-2.5 px-3 py-2.5 rounded transition-all mt-1"
      style={{
        background: isActive
          ? 'rgba(251,191,36,0.12)'
          : canUnlock
          ? 'rgba(255,255,255,0.04)'
          : 'rgba(255,255,255,0.01)',
        border: isActive
          ? '1px solid rgba(251,191,36,0.55)'
          : canUnlock
          ? '1px dashed rgba(251,191,36,0.35)'
          : '1px solid rgba(255,255,255,0.06)',
        opacity: !canUnlock && !isActive ? 0.35 : 1,
        cursor: !canUnlock ? 'not-allowed' : 'pointer',
      }}
    >
      <div className="text-lg flex-shrink-0 leading-none mt-0.5">{keystone.icon}</div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] font-bold tracking-wider uppercase"
            style={{ color: isActive ? '#fbbf24' : canUnlock ? 'rgba(251,191,36,0.8)' : 'rgba(255,255,255,0.30)' }}>
            {keystone.name}
          </span>
          <span className="text-[8px] tracking-widest px-1 rounded"
            style={{ background: 'rgba(251,191,36,0.15)', color: '#fbbf24' }}>KEYSTONE</span>
          {isActive && (
            <span className="text-[8px] tracking-widest px-1 rounded bg-green-500/20 text-green-400">ACTIVE</span>
          )}
        </div>
        <p className="text-[9px] text-white/50 mt-0.5 leading-relaxed">{keystone.desc}</p>
        {!canUnlock && (
          <p className="text-[9px] text-amber-400/50 mt-0.5">
            Unlock all 3 tiers to access
          </p>
        )}
      </div>
    </button>
  );
}

// ─── Branch panel ─────────────────────────────────────────────────────────
function BranchPanel({ weaponId, branch, refreshState }) {
  const [expanded, setExpanded] = useState(true);
  const branchState = getWeaponPerkState(weaponId)?.branches?.[branch.id];
  const unlockedCount = branchState?.unlockedTiers?.length ?? 0;

  return (
    <div className="rounded-lg overflow-hidden" style={{ border: `1px solid ${branch.color}22` }}>
      {/* Branch header */}
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center gap-2.5 px-3 py-2.5 transition-colors hover:bg-white/[0.03]"
        style={{ background: `${branch.color}0f` }}
      >
        <span className="text-base">{branch.icon}</span>
        <div className="flex-1 text-left">
          <div className="text-xs font-bold tracking-wider uppercase" style={{ color: branch.color }}>
            {branch.name}
          </div>
          <div className="text-[9px] text-white/40 mt-0.5">{branch.description}</div>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[9px] px-1.5 py-0.5 rounded text-white/60"
            style={{ background: 'rgba(255,255,255,0.06)' }}>
            {unlockedCount}/3
          </span>
          {expanded ? <ChevronUp className="w-3.5 h-3.5 text-white/40" /> : <ChevronDown className="w-3.5 h-3.5 text-white/40" />}
        </div>
      </button>

      {/* Tiers + Keystone */}
      {expanded && (
        <div className="px-2 pb-2 pt-1 flex flex-col gap-1">
          {branch.tiers.map(perk => (
            <TierNode key={perk.id} weaponId={weaponId} branchId={branch.id} perk={perk} refreshState={refreshState} />
          ))}
          {/* Connector line */}
          <div className="flex items-center gap-2 my-0.5 px-2">
            <div className="h-px flex-1" style={{ background: `${branch.color}30` }} />
            <Zap className="w-3 h-3" style={{ color: branch.color }} />
            <div className="h-px flex-1" style={{ background: `${branch.color}30` }} />
          </div>
          <KeystoneNode
            weaponId={weaponId}
            branchId={branch.id}
            keystone={branch.keystone}
            refreshState={refreshState}
          />
        </div>
      )}
    </div>
  );
}

// ─── Main Panel ───────────────────────────────────────────────────────────
export default function PerkTreePanel({ weaponId, weaponName, weaponIcon }) {
  const [, forceUpdate] = useState(0);
  const refreshState = useCallback(() => forceUpdate(n => n + 1), []);

  useEffect(() => {
    const unsub = subscribePerkTree(() => forceUpdate(n => n + 1));
    return unsub;
  }, []);

  const branches = getBranchesForWeapon(weaponId);
  const remaining = getRemainingPoints(weaponId);
  const maxPoints = getMaxPoints(weaponId);
  const spent = maxPoints - remaining;

  if (!branches.length) return (
    <div className="p-4 text-center text-white/30 text-xs">No perk tree for this weapon yet.</div>
  );

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 flex-shrink-0"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="flex items-center gap-2">
          <span className="text-xl">{weaponIcon}</span>
          <div>
            <div className="text-xs font-bold tracking-wider uppercase text-white/80">{weaponName} Perk Tree</div>
            <div className="text-[9px] text-white/40 mt-0.5">Only 1 Keystone can be active</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Points display */}
          <div className="flex items-center gap-1">
            {Array.from({ length: maxPoints }).map((_, i) => (
              <div key={i} className="w-2 h-2 rounded-full transition-all"
                style={{ background: i < spent ? '#6366f1' : 'rgba(255,255,255,0.12)' }} />
            ))}
          </div>
          <span className="text-[10px] text-white/50 ml-1">{remaining} left</span>
          {/* Reset button */}
          <button
            onClick={() => { resetWeapon(weaponId); refreshState(); }}
            className="flex items-center gap-1 px-2 py-1 rounded text-[9px] text-white/40 hover:text-white/70 transition-colors"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
            title="Reset all perks for this weapon"
          >
            <RotateCcw className="w-3 h-3" /> Reset
          </button>
        </div>
      </div>

      {/* Branch list */}
      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-3" style={{ scrollbarWidth: 'none' }}>
        {branches.map(branch => (
          <BranchPanel
            key={branch.id}
            weaponId={weaponId}
            branch={branch}
            refreshState={refreshState}
          />
        ))}
      </div>
    </div>
  );
}
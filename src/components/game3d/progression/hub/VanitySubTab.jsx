import React, { useEffect, useMemo, useState } from 'react';
import {
  activateAXEVanityPiece,
  equipAXEVanityPiece,
  getAXEVanityState,
  setAXEVanityHidden,
  subscribeAXEVanity,
  unequipAXEVanitySlot,
} from '../../axe/progression/AXEVanityStore';
import {
  AXE_VANITY_CARD_TYPES,
  AXE_VANITY_PIECES,
  AXE_VANITY_SLOTS,
} from '../../axe/progression/AXEVanitySystem';

const fmtBonuses = (bonus = {}) =>
  Object.entries(bonus)
    .filter(([, value]) => Number(value))
    .map(([key, value]) => `${key} +${value}`)
    .join(' · ');

export default function VanitySubTab() {
  const [state, setState] = useState(getAXEVanityState());
  const [cardChoice, setCardChoice] = useState('silver');
  const [lastResult, setLastResult] = useState(null);

  useEffect(() => subscribeAXEVanity(setState), []);

  const ownedBySlot = useMemo(() => {
    const map = Object.fromEntries(Object.keys(AXE_VANITY_SLOTS).map((slot) => [slot, []]));
    for (const pieceId of state.ownedPieceIds) {
      const piece = AXE_VANITY_PIECES[pieceId];
      if (piece && map[piece.slot]) map[piece.slot].push(piece);
    }
    return map;
  }, [state.ownedPieceIds]);

  const doActivate = (pieceId) => {
    const result = activateAXEVanityPiece(pieceId, cardChoice);
    setLastResult(result);
  };

  return (
    <div className="h-full overflow-y-auto px-8 py-6 text-white">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-4 border-b border-white/10 pb-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="text-[10px] uppercase tracking-[0.35em] text-fuchsia-200/70">Custom Overlay Gear</div>
            <h2 className="mt-1 text-2xl font-semibold">Vanity</h2>
            <p className="mt-1 max-w-3xl text-sm text-white/45">
              Vanity pieces are worn over your normal equipment. Their base bonus stays separate from combat gear, and a Silver or Gold Card permanently activates the piece’s additional +10% mapped-stat bonus.
            </p>
          </div>
          <button
            onClick={() => setAXEVanityHidden(!state.hidden)}
            className="rounded-lg border border-white/10 bg-white/[0.06] px-3 py-2 text-xs text-white/70"
          >
            {state.hidden ? 'Show Vanity' : 'Hide Vanity'}
          </button>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          {Object.values(AXE_VANITY_CARD_TYPES).map((card) => (
            <button
              key={card.id}
              onClick={() => setCardChoice(card.id)}
              className={`rounded-xl border px-3 py-2 text-xs transition ${
                cardChoice === card.id
                  ? 'border-fuchsia-300/40 bg-fuchsia-300/10 text-fuchsia-100'
                  : 'border-white/10 bg-white/[0.03] text-white/55'
              }`}
            >
              {card.label}: <b>{state.cards[card.id] || 0}</b>
            </button>
          ))}
          <div className="text-[10px] uppercase tracking-widest text-white/30">
            Activation catalyst selected: {AXE_VANITY_CARD_TYPES[cardChoice]?.label}
          </div>
        </div>

        {lastResult && (
          <div className="mt-4 rounded-lg border border-white/10 bg-white/[0.04] px-4 py-2 text-xs text-white/65">
            {lastResult.ok
              ? `Vanity activated: +${lastResult.percent}% ${AXE_VANITY_SLOTS[lastResult.slotId]?.mappedStatLabel || 'stat'}.`
              : lastResult.reason}
          </div>
        )}

        <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
          {Object.values(AXE_VANITY_SLOTS).map((slot) => {
            const equippedId = state.equippedBySlot[slot.id];
            const equipped = equippedId ? AXE_VANITY_PIECES[equippedId] : null;
            const activation = equipped ? state.activationByPieceId[equipped.id] : null;

            return (
              <div key={slot.id} className="rounded-2xl border border-white/10 bg-slate-950/55 p-4 backdrop-blur-md">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-[10px] uppercase tracking-[0.25em] text-white/35">{slot.label}</div>
                    <div className="mt-1 text-lg font-semibold">{equipped?.name || 'Empty Vanity Slot'}</div>
                    <div className="mt-1 text-xs text-emerald-200/70">
                      {equipped ? fmtBonuses(equipped.baseBonus) : 'No base vanity bonus'}
                    </div>
                  </div>
                  <div className={`rounded-lg px-2 py-1 text-[10px] font-semibold uppercase tracking-widest ${
                    activation?.active
                      ? 'bg-emerald-300/15 text-emerald-100'
                      : 'bg-white/[0.05] text-white/35'
                  }`}>
                    {activation?.active ? `+${activation.percent}% ${slot.mappedStatLabel}` : 'Not Activated'}
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {(ownedBySlot[slot.id] || []).map((piece) => (
                    <button
                      key={piece.id}
                      onClick={() => {
                        setLastResult(equipAXEVanityPiece(piece.id));
                      }}
                      className={`rounded-lg border px-3 py-2 text-[10px] ${
                        equippedId === piece.id
                          ? 'border-fuchsia-300/35 bg-fuchsia-300/10 text-fuchsia-100'
                          : 'border-white/10 bg-white/[0.04] text-white/55'
                      }`}
                    >
                      {piece.name}
                    </button>
                  ))}
                </div>

                {equipped && (
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <button
                      onClick={() => doActivate(equipped.id)}
                      disabled={activation?.active || Number(state.cards[cardChoice] || 0) < 1}
                      className="rounded-lg border border-emerald-300/20 bg-emerald-300/[0.08] px-3 py-2 text-xs font-semibold text-emerald-100 disabled:opacity-30"
                    >
                      {activation?.active
                        ? `Activated +${activation.percent}%`
                        : `Activate with ${AXE_VANITY_CARD_TYPES[cardChoice]?.label}`}
                    </button>
                    <button
                      onClick={() => setLastResult(unequipAXEVanitySlot(slot.id))}
                      className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-white/55"
                    >
                      Remove Overlay
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-5 rounded-xl border border-fuchsia-300/15 bg-fuchsia-300/[0.035] p-4">
          <div className="text-[10px] uppercase tracking-[0.25em] text-fuchsia-200/70">Active Vanity Boosts</div>
          <div className="mt-2 text-sm text-white/70">
            Spirit +{state.activationProfile.spiritPct}% · HP +{state.activationProfile.hpPct}% · Defense +{state.activationProfile.defensePct}% · Damage +{state.activationProfile.damagePct}%
          </div>
        </div>
      </div>
    </div>
  );
}

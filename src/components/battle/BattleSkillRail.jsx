import { useMemo } from 'react';
import useSkillBookLoadout from '@/components/luna/hooks/useSkillBookLoadout';

const RARITY_TONE = {
  mythic: 'border-red-200/28 text-red-100',
  mystical: 'border-fuchsia-200/28 text-fuchsia-100',
  ascendant: 'border-amber-100/30 text-amber-100',
  unique: 'border-fuchsia-200/28 text-fuchsia-100',
  legendary: 'border-amber-200/30 text-amber-100',
  epic: 'border-violet-200/28 text-violet-100',
  rare: 'border-cyan-200/28 text-cyan-100',
  uncommon: 'border-emerald-200/24 text-emerald-100',
  common: 'border-white/16 text-white/62',
};

const cardId = (card) => String(card?.user_card_id || card?.id || card?.card_id || card?.achievement_id || '');
const cardImage = (card) => card?.image || card?.card_image || card?.image_url || card?.icon_url || card?.icon || '';
const cardTitle = (card) => card?.title || card?.card_name || card?.name || 'Skill Card';
const cardRarity = (card) => String(card?.rarity || card?.card_rarity || 'Common');
const cardLevel = (card) => Number(card?.level || card?.card_level || 1);

function BattleCard({ card, index, selectable = false, presentation = 'overhead', onSelect }) {
  const rarity = cardRarity(card);
  const tone = RARITY_TONE[rarity.toLowerCase()] || RARITY_TONE.common;
  const image = cardImage(card);
  const hand = presentation === 'hand';
  const size = hand ? 'h-[126px] w-[84px]' : 'h-[96px] w-[64px]';
  const shell = `relative ${size} shrink-0 overflow-hidden border bg-slate-950/24 shadow-[0_12px_28px_rgba(0,0,0,.28)] ${tone}`;

  const content = (
    <>
      {image ? (
        <img src={image} alt="" draggable={false} className="absolute inset-0 h-full w-full object-cover opacity-90" />
      ) : (
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(103,232,249,.12),rgba(2,6,23,.24)_50%,rgba(2,6,23,.64)_100%)]" />
      )}

      <div className="absolute inset-0 bg-gradient-to-b from-black/12 via-transparent to-slate-950/92" />
      <div className="absolute inset-[3px] border border-white/[0.055]" />

      <span className="absolute left-[5px] top-[5px] border border-white/[0.11] bg-slate-950/72 px-1.5 py-0.5 text-[5px] font-black uppercase tracking-[0.08em] text-white/72 backdrop-blur-sm">
        Lv. {cardLevel(card)}
      </span>

      <div className="absolute inset-x-[5px] bottom-[5px]">
        <p className={`${hand ? 'text-[8px]' : 'text-[6.5px]'} truncate font-black leading-tight text-white/92`}>{cardTitle(card)}</p>
        <div className="mt-1 flex items-center justify-between gap-1">
          <span className={`border px-1.5 py-[1px] text-[4.5px] font-black uppercase tracking-[0.10em] ${tone}`}>{rarity}</span>
          <span className="text-[5px] font-black text-white/42">{index + 1}</span>
        </div>
      </div>
    </>
  );

  if (selectable) {
    return (
      <button
        type="button"
        className={`${shell} pointer-events-auto origin-bottom transition duration-150 hover:-translate-y-2 hover:scale-[1.04] hover:border-cyan-100/60 focus-visible:-translate-y-2 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-100/70`}
        data-ai-battle-skill-card={index + 1}
        onClick={() => onSelect?.(index, card)}
        aria-label={`Use ${cardTitle(card)} in skill slot ${index + 1}`}
      >
        {content}
      </button>
    );
  }

  return (
    <div className={shell} data-ai-battle-skill-card={index + 1}>
      {content}
    </div>
  );
}

function EmptyCard({ index, presentation = 'overhead' }) {
  const hand = presentation === 'hand';
  return (
    <div
      className={`relative ${hand ? 'h-[126px] w-[84px]' : 'h-[96px] w-[64px]'} shrink-0 border border-white/[0.07] bg-slate-950/[0.08]`}
      data-ai-battle-skill-card={index + 1}
      aria-label={`Skill Slot ${index + 1} empty`}
    >
      <div className="absolute inset-[3px] border border-white/[0.025]" />
      <span className="absolute left-[5px] top-[5px] border border-white/[0.08] bg-slate-950/55 px-1.5 py-0.5 text-[5px] font-black text-white/32">
        {index + 1}
      </span>
      <span className="absolute inset-x-0 bottom-3 text-center text-[5px] font-black uppercase tracking-[0.12em] text-white/20">
        Empty
      </span>
    </div>
  );
}

export default function BattleSkillRail({
  presentation = 'overhead',
  hp = 1000,
  maxHp = 1000,
  playerName = 'You',
  selectable = false,
  onSelect,
}) {
  const { slots } = useSkillBookLoadout();

  // Preserve the logical slot index. AI Battle never fills empty slots with
  // unrelated owned cards because the number key must represent the card the
  // player explicitly equipped to that same slot.
  const cards = useMemo(() => Array.from({ length: 5 }, (_, index) => (
    (slots || []).find((slot) => Number(slot?.index) === index)?.card || null
  )), [slots]);

  const hand = presentation === 'hand';
  const safeMaxHp = Math.max(1, Number(maxHp) || 1);
  const safeHp = Math.max(0, Math.min(safeMaxHp, Number(hp) || 0));
  const hpPct = (safeHp / safeMaxHp) * 100;
  const wrapperClass = hand
    ? 'pointer-events-auto absolute left-1/2 top-[52%] z-[80] -translate-x-1/2'
    : 'pointer-events-none absolute left-[1.5%] top-[2.5%] z-50 w-[53%]';

  const selectCard = (index, card) => {
    if (!selectable || !card) return;
    if (onSelect) onSelect(index, card);
    window.dispatchEvent(new CustomEvent('lunaRequestSkillSlotActivation', {
      detail: { slotIndex: index, source: 'ai_battle_card_hand' },
    }));
  };

  return (
    <div
      className={wrapperClass}
      data-ai-battle-skills-rail
      data-ai-battle-skills-presentation={presentation}
      aria-label={hand ? 'Choose a battle skill card' : 'Battle skills'}
    >
      <div className={hand ? 'mx-auto w-max max-w-[92vw]' : 'mx-auto w-full'}>
        <div className="mb-[2px] flex justify-center">
          <span className={`${hand ? 'text-[8px]' : 'text-[7px]'} font-black uppercase tracking-[0.30em] text-cyan-50/72`}>Skills</span>
        </div>
        <div className={`${hand ? 'w-[52%]' : 'w-1/2'} mx-auto h-px bg-gradient-to-r from-transparent via-cyan-100/56 to-transparent`} />
        <div className={`${hand ? 'w-full' : 'w-full'} mt-[2px] h-px bg-gradient-to-r from-transparent via-cyan-100/38 to-transparent`} />

        <div className={`${hand ? 'mt-[10px]' : 'mt-[7px]'} flex items-start justify-center gap-[2px]`}>
          {cards.map((card, index) => card ? (
            <BattleCard
              key={`${cardId(card) || cardTitle(card)}-${index}`}
              card={card}
              index={index}
              selectable={selectable && hand}
              presentation={presentation}
              onSelect={selectCard}
            />
          ) : (
            <EmptyCard key={`empty-${index}`} index={index} presentation={presentation} />
          ))}
        </div>

        {!hand && (
          <div
            className="mx-auto mt-[7px] w-[72%] text-center"
            data-ai-battle-player-hp="true"
            aria-label={`${playerName} health ${Math.round(safeHp)} of ${Math.round(safeMaxHp)}, ${Math.round(hpPct)} percent`}
          >
            <div className="mb-1 truncate text-[7px] font-black uppercase tracking-[0.12em] text-white/68">
              {playerName}
            </div>
            <div className="h-[11px] overflow-hidden rounded-full border border-white/15 bg-slate-950/78 p-[2px] shadow-[0_5px_18px_rgba(0,0,0,.38)] backdrop-blur-md">
              <div
                className="h-full rounded-full bg-gradient-to-r from-cyan-500 via-cyan-300 to-sky-100 transition-[width] duration-300"
                style={{ width: `${hpPct}%` }}
              />
            </div>
            <div className="mt-1 text-[7px] font-semibold tabular-nums text-white/76">
              {Math.round(safeHp)} / {Math.round(safeMaxHp)} HP · {Math.round(hpPct)}%
            </div>
          </div>
        )}

        {hand && (
          <div className="mt-2 text-center text-[7px] font-black uppercase tracking-[0.18em] text-cyan-50/55">
            Choose your card
          </div>
        )}
      </div>
    </div>
  );
}

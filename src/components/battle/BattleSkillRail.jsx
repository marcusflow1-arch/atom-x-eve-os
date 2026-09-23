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

function BattleCard({ card, index }) {
  const rarity = cardRarity(card);
  const tone = RARITY_TONE[rarity.toLowerCase()] || RARITY_TONE.common;
  const image = cardImage(card);

  return (
    <div
      className={`relative h-[112px] w-[74px] shrink-0 overflow-hidden border bg-slate-950/28 shadow-[0_12px_28px_rgba(0,0,0,.26)] ${tone}`}
      data-ai-battle-skill-card={index + 1}
    >
      {image ? (
        <img src={image} alt="" draggable={false} className="absolute inset-0 h-full w-full object-cover opacity-88" />
      ) : (
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(103,232,249,.12),rgba(2,6,23,.24)_50%,rgba(2,6,23,.64)_100%)]" />
      )}

      <div className="absolute inset-0 bg-gradient-to-b from-black/16 via-transparent to-slate-950/92" />
      <div className="absolute inset-[3px] border border-white/[0.055]" />

      <span className="absolute left-[5px] top-[5px] border border-white/[0.11] bg-slate-950/72 px-1.5 py-0.5 text-[5px] font-black uppercase tracking-[0.08em] text-white/72 backdrop-blur-sm">
        Lv. {cardLevel(card)}
      </span>

      <div className="absolute inset-x-[5px] bottom-[5px]">
        <p className="truncate text-[7px] font-black leading-tight text-white/92">{cardTitle(card)}</p>
        <div className="mt-1 flex items-center justify-between gap-1">
          <span className={`border px-1.5 py-[1px] text-[4.5px] font-black uppercase tracking-[0.10em] ${tone}`}>{rarity}</span>
          <span className="text-[5px] font-black text-white/38">{index + 1}</span>
        </div>
      </div>
    </div>
  );
}

export default function BattleSkillRail() {
  const { slots, skills } = useSkillBookLoadout();

  const cards = useMemo(() => {
    const equipped = [...(slots || [])]
      .sort((a, b) => Number(a?.index || 0) - Number(b?.index || 0))
      .map((slot) => slot?.card)
      .filter(Boolean);

    const used = new Set(equipped.map(cardId).filter(Boolean));
    const ownedFallback = (skills || [])
      .filter((skill) => skill?.owned !== false)
      .filter((skill) => {
        const id = cardId(skill);
        return !id || !used.has(id);
      });

    return [...equipped, ...ownedFallback].slice(0, 5);
  }, [slots, skills]);

  if (!cards.length) return null;

  return (
    <div
      className="pointer-events-none absolute left-[11%] right-[7%] top-[5%] z-40"
      data-ai-battle-skills-rail
      aria-label="Battle skills"
    >
      <div className="mx-auto w-full">
        <div className="mb-[2px] flex justify-center">
          <span className="text-[7px] font-black uppercase tracking-[0.30em] text-cyan-50/66">Skills</span>
        </div>
        <div className="mx-auto h-px w-1/2 bg-gradient-to-r from-transparent via-cyan-100/48 to-transparent" />
        <div className="mt-[2px] h-px w-full bg-gradient-to-r from-transparent via-cyan-100/34 to-transparent" />

        <div className="mt-[8px] flex w-full items-start justify-between gap-3 px-[2%]">
          {cards.map((card, index) => <BattleCard key={`${cardId(card) || cardTitle(card)}-${index}`} card={card} index={index} />)}
          {Array.from({ length: Math.max(0, 5 - cards.length) }, (_, offset) => (
            <div
              key={`empty-${offset}`}
              className="relative h-[112px] w-[74px] shrink-0 border border-white/[0.07] bg-slate-950/[0.08]"
              aria-hidden="true"
            >
              <div className="absolute inset-[3px] border border-white/[0.025]" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

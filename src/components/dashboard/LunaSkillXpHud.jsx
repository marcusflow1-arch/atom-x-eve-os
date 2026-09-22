import { useEffect, useMemo, useState } from 'react';
import { RefreshCw, Sparkles, Zap } from 'lucide-react';
import useLunaStore from '@/components/luna/useLunaStore';
import useSkillBookLoadout from '@/components/luna/hooks/useSkillBookLoadout';
import { showError } from '@/components/error/ErrorToast';

const slotPosition = [
  { left: 38, top: 3, key: '1' },
  { left: 73, top: 38, key: '2' },
  { left: 38, top: 73, key: '3' },
  { left: 3, top: 38, key: '4' },
];

function DiamondSkill({ index, selected, pendingCard, onAssign, onSelect }) {
  const assigned = useLunaStore((state) => state.hotbar[index]);
  const image = assigned?.image || assigned?.card_image || assigned?.icon_url || assigned?.icon || '';
  const title = assigned?.title || assigned?.name || assigned?.card_name || `Showcase slot ${index + 1}`;
  const pos = slotPosition[index];

  const handleDrop = (event) => {
    event.preventDefault();
    try {
      const raw = event.dataTransfer?.getData('application/json');
      const payload = raw ? JSON.parse(raw) : null;
      if ((payload?.source === 'luna-card' || payload?.source === 'luna-skill-book') && payload.card) {
        onAssign(index, payload.card, payload.user_card_id || payload.card.user_card_id || payload.card.id);
      }
    } catch (error) {
      console.error('Showcase card drop failed:', error);
    }
  };

  const handleClick = () => {
    if (pendingCard) {
      onAssign(index, pendingCard);
      return;
    }
    if (assigned) onSelect(index, assigned);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      onDragOver={(event) => {
        event.preventDefault();
        if (event.dataTransfer) event.dataTransfer.dropEffect = 'copy';
      }}
      onDrop={handleDrop}
      aria-label={assigned ? `Showcase ${title}` : `Showcase slot ${index + 1}`}
      title={pendingCard ? `Place ${pendingCard.title || pendingCard.card_name || 'skill'} in slot ${index + 1}` : assigned ? title : `Drop an owned skill into slot ${index + 1}`}
      className={`absolute h-[38px] w-[38px] rotate-45 overflow-hidden border transition-all duration-200 ${selected
        ? 'border-cyan-100/70 bg-cyan-200/[0.18] shadow-[0_0_18px_rgba(103,232,249,.28)]'
        : pendingCard
          ? 'border-cyan-100/30 bg-cyan-100/[0.07] shadow-[0_0_14px_rgba(103,232,249,.10)]'
          : assigned
            ? 'border-white/[0.18] bg-slate-900/70 hover:border-cyan-100/35 hover:bg-cyan-100/[0.08]'
            : 'border-white/[0.10] bg-slate-950/55 hover:border-white/[0.18]'}`}
      style={{ left: pos.left, top: pos.top }}
    >
      <span className="absolute inset-[-8px] -rotate-45">
        {image ? (
          <img src={image} alt="" className="h-full w-full object-cover opacity-90" draggable={false} />
        ) : (
          <span className="grid h-full w-full place-items-center text-white/25">
            <Sparkles className="h-3.5 w-3.5" />
          </span>
        )}
      </span>
      <span className="absolute bottom-[-6px] right-[-6px] grid h-[18px] w-[18px] -rotate-45 place-items-center bg-black/70 text-[6px] font-black text-white/65">
        {pos.key}
      </span>
    </button>
  );
}

export default function LunaSkillXpHud({
  currentXp = 0,
  nextXp = 1000,
  level = 1,
  showcaseEditing = false,
}) {
  const { equip, isSaving, skillSets, activeSkillSetId, selectSkillSet } = useSkillBookLoadout();
  const [pendingCard, setPendingCard] = useState(() => typeof window !== 'undefined' ? window.__lunaSelectedShowcaseCard || null : null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [previewCard, setPreviewCard] = useState(null);

  useEffect(() => {
    const handleSelected = (event) => {
      const card = event?.detail?.card || null;
      setPendingCard(card);
    };
    window.addEventListener('lunaShowcaseCardSelected', handleSelected);
    return () => window.removeEventListener('lunaShowcaseCardSelected', handleSelected);
  }, []);

  const assignShowcaseCard = async (index, card, explicitUserCardId) => {
    if (!card || isSaving) return;
    const userCardId = explicitUserCardId || card.user_card_id || card.id;
    if (!userCardId) return;
    try {
      await equip(index, userCardId);
      setSelectedSlot(index);
      setPreviewCard(card);
      setPendingCard(null);
      window.__lunaSelectedShowcaseCard = null;
      window.dispatchEvent(new CustomEvent('lunaShowcaseCardPlaced', { detail: { index, card } }));
    } catch (error) {
      showError(error, 'Equip Skill');
    }
  };

  const selectShowcaseCard = (index, card) => {
    setSelectedSlot(index);
    setPreviewCard(card);
  };

  const orderedSkillSets = useMemo(
    () => [...(skillSets || [])].sort((a, b) => Number(a.skill_set_order || 0) - Number(b.skill_set_order || 0)).slice(0, 3),
    [skillSets]
  );

  const activeSkillSet = useMemo(
    () => orderedSkillSets.find((set) => String(set.skill_set_id) === String(activeSkillSetId)) || orderedSkillSets.find((set) => set.is_active) || orderedSkillSets[0] || null,
    [orderedSkillSets, activeSkillSetId]
  );

  const activeSkillSetIndex = Math.max(0, orderedSkillSets.findIndex((set) => String(set.skill_set_id) === String(activeSkillSet?.skill_set_id)));

  const rotateSkillSet = async () => {
    if (isSaving || orderedSkillSets.length < 2) return;
    const next = orderedSkillSets[(activeSkillSetIndex + 1) % orderedSkillSets.length];
    if (!next?.skill_set_id) return;
    try {
      await selectSkillSet(next.skill_set_id);
      setSelectedSlot(null);
      setPreviewCard(null);
    } catch (error) {
      showError(error, 'Switch Genre');
    }
  };

  const progress = useMemo(
    () => Math.max(0, Math.min(100, (Number(currentXp || 0) / Math.max(1, Number(nextXp || 1))) * 100)),
    [currentXp, nextXp]
  );

  return (
    <div
      data-luna-skill-xp-hud
      className="absolute bottom-[10px] left-[34px] right-[338px] z-[44] h-[122px] pointer-events-none"
    >
      <div className="absolute left-0 bottom-0 h-[118px] w-[118px] pointer-events-auto">
        <div className="pointer-events-none absolute left-[29px] top-[-16px] z-40 max-w-[100px] truncate text-[7px] font-medium italic tracking-[0.03em] text-cyan-50/62">
          {activeJawan?.jawan_name || 'Jawan I'}
        </div>
        <button
          type="button"
          onClick={rotateJawan}
          disabled={isSaving || jawans.length < 2}
          aria-label="Rotate Jawan skill loadout"
          title="Switch Jawan"
          className="absolute left-[-31px] top-[43px] z-50 grid h-7 w-7 place-items-center rounded-full border border-cyan-100/[0.12] bg-slate-950/64 text-cyan-50/48 shadow-[0_0_16px_rgba(103,232,249,.05)] backdrop-blur-md transition hover:border-cyan-100/25 hover:bg-cyan-100/[0.08] hover:text-white disabled:opacity-25"
        >
          <RefreshCw className={`h-3 w-3 ${isSaving ? 'animate-spin' : ''}`} />
        </button>
        <div
          className="absolute left-[10px] top-[10px] h-[98px] w-[98px] rotate-45 border border-white/[0.12] bg-slate-950/28 backdrop-blur-md"
          style={{ boxShadow: 'inset 0 0 28px rgba(103,232,249,.035), 0 12px 30px rgba(0,0,0,.18)' }}
        />
        <div className="absolute left-[49px] top-[49px] z-20 h-[20px] w-[20px]">
          <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 rotate-45 bg-cyan-100/32" />
          <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 -rotate-45 bg-cyan-100/32" />
        </div>
        {slotPosition.map((_, index) => (
          <DiamondSkill
            key={index}
            index={index}
            selected={selectedSlot === index}
            pendingCard={pendingCard}
            onAssign={assignShowcaseCard}
            onSelect={selectShowcaseCard}
          />
        ))}
      </div>

      {showcaseEditing && (
        <div className="pointer-events-none absolute left-[132px] top-[22px] min-w-[210px] border border-cyan-100/[0.10] bg-slate-950/55 px-3 py-2 backdrop-blur-xl">
          <p className="text-[6px] font-black uppercase tracking-[0.14em] text-cyan-100/45">Card Showcase</p>
          <p className="mt-0.5 text-[8px] text-white/65">
            {pendingCard ? `Choose a diamond for ${pendingCard.title || pendingCard.card_name || 'this skill'}` : 'Drag an owned skill here from the Skill Book'}
          </p>
        </div>
      )}

      {!showcaseEditing && (
        <>
      {/* Continuous seam: top point -> upper-right diamond edge -> right tip -> AI HQ. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-[59px] top-[-2px] z-30 h-px w-[96px] origin-left rotate-45"
        style={{
          background: 'linear-gradient(90deg, rgba(226,232,240,.18), rgba(226,232,240,.28) 72%, rgba(226,232,240,.34))',
          boxShadow: '0 0 8px rgba(103,232,249,.035)',
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-[63px] top-[3px] z-30 h-px w-[89px] origin-left rotate-45"
        style={{
          background: 'linear-gradient(90deg, rgba(103,232,249,.045), rgba(103,232,249,.11))',
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-[127px] right-0 top-[66px] z-30 h-px"
        style={{
          background: 'linear-gradient(90deg, rgba(226,232,240,.32), rgba(226,232,240,.18) 58%, rgba(226,232,240,.10))',
          boxShadow: '0 0 8px rgba(103,232,249,.03)',
        }}
      />

      <div className="absolute left-[140px] right-0 top-[74px]">
        <div className="mb-1.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Zap className="h-3 w-3 text-cyan-100/60" />
            <span className="text-[7px] font-black uppercase tracking-[0.14em] text-white/40">Experience</span>
            <span className="text-[7px] font-semibold text-white/72">Lv {level}</span>
          </div>
          <span className="text-[7px] font-mono text-white/38">
            {Number(currentXp || 0).toLocaleString()} / {Number(nextXp || 0).toLocaleString()} XP
          </span>
        </div>

        <div className="relative h-[5px] overflow-hidden bg-white/[0.065]">
          <div
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-cyan-300/55 via-sky-200/68 to-white/72 transition-[width] duration-500"
            style={{ width: `${progress}%` }}
          />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-white/[0.12]" />
        </div>
      </div>
        </>
      )}

      {!showcaseEditing && previewCard && (
        <div className="pointer-events-none absolute left-[144px] top-[6px] z-40 flex h-[48px] max-w-[250px] items-center gap-2.5 border border-white/[0.07] bg-slate-950/55 px-2.5 backdrop-blur-xl">
          <div className="h-9 w-9 shrink-0 overflow-hidden border border-white/[0.08] bg-white/[0.03]">
            {(previewCard.image || previewCard.card_image)
              ? <img src={previewCard.image || previewCard.card_image} alt="" className="h-full w-full object-cover" />
              : <div className="grid h-full place-items-center"><Sparkles className="h-3.5 w-3.5 text-white/30" /></div>}
          </div>
          <div className="min-w-0">
            <p className="text-[5.5px] font-black uppercase tracking-[0.12em] text-cyan-100/40">Showcase Preview</p>
            <p className="mt-0.5 truncate text-[8px] font-semibold text-white/78">{previewCard.title || previewCard.card_name || 'Card'}</p>
            <p className="truncate text-[6px] text-white/32">{previewCard.game_name || previewCard.card_rarity || 'Owned Card'}</p>
          </div>
        </div>
      )}
    </div>
  );
}

import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, Network, RefreshCw, Sparkles, X } from 'lucide-react';
import useLunaStore from '@/components/luna/useLunaStore';
import useSkillBookLoadout from '@/components/luna/hooks/useSkillBookLoadout';
import { SKILL_KEYS, SKILL_SET_COUNT } from '@/components/luna/skillSlots';
import { showError } from '@/components/error/ErrorToast';
import './luna-hotbar.css';
import './luna-ornate-hotbar.css';
import './luna-silver-hotbar.css';
import LunaOrnateChrome from './LunaOrnateChrome';

export function HotkeyFrame() {
  const id = useId();
  return (
    <svg className="luna-hotbar-frame" viewBox="0 0 400 30" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id={id + '-upper'} x1="100" y1="0" x2="300" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#b9f3ff" stopOpacity="0" />
          <stop offset=".36" stopColor="#b9f3ff" stopOpacity=".65" />
          <stop offset=".5" stopColor="#ecfbff" stopOpacity=".95" />
          <stop offset=".64" stopColor="#b9f3ff" stopOpacity=".65" />
          <stop offset="1" stopColor="#b9f3ff" stopOpacity="0" />
        </linearGradient>
        <linearGradient id={id + '-base'}>
          <stop offset="0" stopColor="#b9dce7" stopOpacity=".22" />
          <stop offset=".5" stopColor="#d4f6ff" stopOpacity=".75" />
          <stop offset="1" stopColor="#b9dce7" stopOpacity=".22" />
        </linearGradient>
      </defs>
      {/* Both paths share their center shoulders. The diamond is part of the
          parallel lines, with no detached ornament or line beyond the slots. */}
      <path d="M0 16 H184 L187 13 L200 27 L213 13 L216 16 H400"
        fill="none" stroke={`url(#${id}-base)`} strokeWidth="1" vectorEffect="non-scaling-stroke" />
      <path d="M100 12 H186 L187 13 L200 1 L213 13 L214 12 H300"
        fill="none" stroke={`url(#${id}-upper)`} strokeWidth="1" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

function HotkeySlot({ index, selected, pendingCard, onAssign, onSelect, combatMode, saving, embedded }) {
  const [dragOver, setDragOver] = useState(false);
  const assigned = useLunaStore((state) => state.hotbar[index]);
  const image = assigned?.image || assigned?.card_image || assigned?.icon_url || assigned?.icon || '';
  const title = assigned?.title || assigned?.name || assigned?.card_name || 'Empty skill';
  const key = SKILL_KEYS[index];
  const drop = (event) => {
    event.preventDefault();
    setDragOver(false);
    if (combatMode || saving) return;
    try {
      const payload = JSON.parse(event.dataTransfer?.getData('application/json') || 'null');
      if (['luna-card', 'luna-skill-book'].includes(payload?.source) && payload.card) {
        onAssign(index, payload.card, payload.user_card_id || payload.card.user_card_id || payload.card.id);
      }
    } catch (error) {
      console.warn('Skill drop could not be read', error);
    }
  };
  const click = () => {
    if (combatMode) {
      if (assigned) window.dispatchEvent(new CustomEvent('lunaRequestSkillSlotActivation', {
        detail: { slotIndex: index, source: 'combat_click' },
      }));
    } else if (pendingCard) onAssign(index, pendingCard);
    else if (assigned) onSelect(index, assigned);
  };
  return (
    <button type="button" className="luna-hotbar-slot" data-hotkey={key}
      data-selected={selected || undefined} data-pending={Boolean(pendingCard) || undefined}
      data-drag-over={dragOver || undefined}
      disabled={saving} aria-label={`Skill ${key}: ${title}`} aria-keyshortcuts={embedded ? undefined : key}
      title={pendingCard ? `Place ${pendingCard.title || pendingCard.card_name || 'skill'} in slot ${key}` : `${title} · ${key}`}
      onClick={click} onDrop={drop}
      onDragEnter={() => { if (!combatMode && !saving) setDragOver(true); }}
      onDragLeave={event => { if (!event.currentTarget.contains(event.relatedTarget)) setDragOver(false); }}
      onDragEnd={() => setDragOver(false)} onDragOver={(event) => {
        if (combatMode || saving) return;
        event.preventDefault();
        if (event.dataTransfer) event.dataTransfer.dropEffect = 'copy';
      }}>
      {image ? <img src={image} alt="" draggable={false} /> : <Sparkles size={16} />}
      {embedded && <span className="luna-hotbar-slot-name">{assigned ? title : "Empty"}</span>}
      <span className="luna-hotbar-key">{key}</span>
    </button>
  );
}

export default function LunaSkillXpHud({ currentXp = 0, nextXp = 1000, level = 1, showcaseEditing = false, combatMode = false, dockStyle, stacked = false, embedded = false, dockTarget = null }) {
  const { equip, isSaving, isLoading, error: loadoutError, skillSets, activeSkillSetId, selectSkillSet } = useSkillBookLoadout();
  const [pendingCard, setPendingCard] = useState(() => typeof window !== 'undefined' ? window.__lunaSelectedShowcaseCard || null : null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [previewCard, setPreviewCard] = useState(null);
  const assigning = useRef(false);
  const cancelPlacement = () => {
    setPendingCard(null);
    window.__lunaSelectedShowcaseCard = null;
    window.dispatchEvent(new CustomEvent("lunaShowcaseCardSelected", { detail: { card: null } }));
  };
  useEffect(() => {
    const selected = (event) => setPendingCard(event?.detail?.card || null);
    const rejected = (event) => showError(new Error(event?.detail?.reason || 'This skill animation could not play.'), 'Cast Skill');
    window.addEventListener('lunaShowcaseCardSelected', selected);
    window.addEventListener('lunaSkillCastRejected', rejected);
    return () => {
      window.removeEventListener('lunaShowcaseCardSelected', selected);
      window.removeEventListener('lunaSkillCastRejected', rejected);
    };
  }, []);
  const assign = async (index, card, explicitId) => {
    const userCardId = explicitId || card?.user_card_id || card?.id;
    if (combatMode || !userCardId || isSaving || assigning.current) return;
    if (card?.can_equip === false) { showError(new Error(card.equip_error || 'This skill is unavailable for your current avatar.'), 'Equip Skill'); return; }
    assigning.current = true;
    try {
      await equip(index, userCardId);
      setSelectedSlot(index); setPreviewCard(card); setPendingCard(null);
      window.__lunaSelectedShowcaseCard = null;
      window.dispatchEvent(new CustomEvent('lunaShowcaseCardPlaced', { detail: { index, card } }));
    } catch (error) { showError(error, 'Equip Skill'); }
    finally { assigning.current = false; }
  };
  const sets = useMemo(() => [...(skillSets || [])]
    .sort((a, b) => Number(a.skill_set_order || 0) - Number(b.skill_set_order || 0))
    .slice(0, SKILL_SET_COUNT), [skillSets]);
  const activeSet = sets.find((set) => String(set.skill_set_id) === String(activeSkillSetId))
    || sets.find((set) => set.is_active) || sets[0];
  const chooseSet = async (set) => {
    if (!set?.skill_set_id || combatMode || isSaving) return;
    try {
      await selectSkillSet(set.skill_set_id);
      setSelectedSlot(null); setPreviewCard(null);
    } catch (error) { showError(error, 'Switch Prefab'); }
  };
  const xp = Number.isFinite(Number(currentXp)) ? Math.max(0, Number(currentXp)) : 0;
  const goal = Number.isFinite(Number(nextXp)) ? Math.max(1, Number(nextXp)) : 1;
  const progress = Math.max(0, Math.min(100, xp / goal * 100));
  const content = (
    <section data-luna-skill-xp-hud data-embedded={embedded || undefined} data-placing={Boolean(pendingCard) || undefined} data-stacked={!embedded && stacked || undefined} style={embedded ? undefined : dockStyle} className={`luna-hotbar ${combatMode ? 'luna-hotbar-combat' : ''}`}
      aria-label={embedded ? 'Skill Book skill slots' : 'Luna skill hotkeys'} onKeyDown={(event) => {
        if (embedded && event.key === 'Escape' && pendingCard) {
          event.preventDefault(); event.stopPropagation(); cancelPlacement(); return;
        }
        // Escape still reaches the dashboard's close handler when no placement is pending.
        if (embedded ? event.key !== 'Escape' : !/^[0-9]$/.test(event.key)) event.stopPropagation();
      }}>
      {embedded && <header className="luna-hotbar-book-heading">
        <div><h3>Your skill slots</h3><p>{pendingCard
          ? 'Place ' + (pendingCard.title || pendingCard.card_name || 'this skill') + ' in a slot below.'
          : previewCard ? 'Skill ' + SKILL_KEYS[selectedSlot] + ' · ' + (previewCard.title || previewCard.card_name || 'Skill')
          : 'Select a card above, then choose its slot.'}</p></div>
        {pendingCard && <button type="button" className="luna-hotbar-cancel" disabled={isSaving} aria-label="Cancel skill placement" onClick={cancelPlacement}><X size={12}/>Cancel</button>}
        <span className="luna-hotbar-save-state" role="status">{isSaving ? <><RefreshCw size={11} className="animate-spin"/>Saving…</>
          : isLoading ? 'Loading…' : loadoutError ? 'Loadout unavailable' : <><Check size={12}/>Auto-save on</>}</span>
      </header>}
      <div className="luna-hotbar-layout">
        <div className="luna-hotbar-main">
          {!embedded && (
            <button
              type="button"
              data-luna-skill-tree-hotbar-button
              className="luna-hotbar-skill-tree-button"
              aria-label="Open Skill Tree"
              title="Open Skill Tree"
              onClick={() => window.dispatchEvent(new CustomEvent('toggleSkillTree'))}
            >
              <Network aria-hidden="true" size={22} strokeWidth={1.7} />
            </button>
          )}
          {embedded && <HotkeyFrame />}
          <div className="luna-hotbar-skill-shell">
            {!embedded && <LunaOrnateChrome variant="skills" />}
            <div className="luna-hotbar-grid" aria-label="Equipped skill keys 1 through 0">
              {SKILL_KEYS.map((key, index) => <HotkeySlot key={key} index={index} selected={selectedSlot === index}
                pendingCard={pendingCard} onAssign={assign} saving={isSaving || isLoading || Boolean(loadoutError)} combatMode={combatMode} embedded={embedded}
                onSelect={(slot, card) => { setSelectedSlot(slot); setPreviewCard(card); }} />)}
            </div>
          </div>
          <div className="luna-hotbar-exp" aria-label="Avatar experience">
            <div className="luna-hotbar-exp-label"><span><b>EXP</b> Experience</span><span>Lv {level} · {Math.round(progress)}%</span></div>
            <div className="luna-hotbar-exp-track" role="progressbar" aria-label="Experience"
              aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress)}
              aria-valuetext={`${xp.toLocaleString()} of ${goal.toLocaleString()} experience`}>
              <div style={{ width: `${progress}%` }} />
            </div>
          </div>
          {!showcaseEditing && (pendingCard || previewCard) && <p className="luna-hotbar-hint" role="status">
            {pendingCard ? `Choose a slot for ${pendingCard.title || pendingCard.card_name || 'this skill'}`
              : previewCard ? `${previewCard.title || previewCard.card_name || 'Skill'} · Press ${SKILL_KEYS[selectedSlot]} to cast`
              : 'Drag an owned skill here from the Skill Book'}
          </p>}
        </div>
        <nav className="luna-hotbar-prefabs" aria-label="Skill prefabs">
          {Array.from({ length: SKILL_SET_COUNT }, (_, index) => {
            const set = sets[index];
            return <button key={index} type="button" disabled={combatMode || isSaving || isLoading || Boolean(loadoutError) || !set}
              aria-pressed={Boolean(set && set.skill_set_id === activeSet?.skill_set_id)}
              title={combatMode ? 'Loadout locked during combat' : set?.skill_set_name || 'Loading prefab'}
              onClick={() => chooseSet(set)}>
              {isSaving && set?.skill_set_id === activeSet?.skill_set_id && <RefreshCw size={10} className="animate-spin" />}
              Prefab {index + 1}
            </button>;
          })}
        </nav>
      </div>
    </section>
  );
  // Keep one live HUD instance while its DOM moves into and out of the book.
  // Ongoing saves, selected slots and the active prefab survive the move.
  return embedded ? (dockTarget ? createPortal(content, dockTarget) : null) : content;
}

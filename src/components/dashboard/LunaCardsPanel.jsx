import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft, BookOpen, Check, ChevronDown, Gamepad2, Lock, Search,
  Sparkles, Star, Volume2, Zap
} from 'lucide-react';
import useSkillBookLoadout from '@/components/luna/hooks/useSkillBookLoadout';
import { showError, showSuccess } from '@/components/error/ErrorToast';

const normalize = (value) => String(value || '').trim().toLowerCase();

const rarityTone = {
  Mythic: 'text-red-100 border-red-200/20',
  Unique: 'text-fuchsia-100 border-fuchsia-200/20',
  Legendary: 'text-amber-100 border-amber-200/20',
  Epic: 'text-violet-100 border-violet-200/20',
  Rare: 'text-cyan-100 border-cyan-200/20',
  Uncommon: 'text-emerald-100 border-emerald-200/18',
  Common: 'text-white/65 border-white/[0.08]',
};

export default function LunaCardsPanel() {
  const {
    games,
    skills,
    slots,
    isLoading,
    isSaving,
    equip,
  } = useSkillBookLoadout();

  const [selectedGameKey, setSelectedGameKey] = useState(null);
  const [selectedSkillId, setSelectedSkillId] = useState(null);
  const [query, setQuery] = useState('');
  const [genre, setGenre] = useState('all');
  const [genreOpen, setGenreOpen] = useState(false);
  const [skillFilter, setSkillFilter] = useState('all');
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef(null);

  const demoAbility = useMemo(
    () => (skills || []).find((skill) => normalize(skill.title) === normalize('Ichigo Kurosaki - Getsuga Tenshō')) || null,
    [skills]
  );

  const genres = useMemo(
    () => [...new Set((games || []).map((game) => game.genre).filter(Boolean))].sort((a, b) => a.localeCompare(b)),
    [games]
  );

  const equippedIds = useMemo(
    () => new Map((slots || []).filter((slot) => slot?.card?.user_card_id).map((slot) => [String(slot.card.user_card_id), Number(slot.index)])),
    [slots]
  );

  const filteredGames = useMemo(() => {
    const needle = normalize(query);
    return (games || []).filter((game) => {
      if (genre !== 'all' && normalize(game.genre) !== normalize(genre)) return false;
      if (!needle) return true;
      return normalize(game.title).includes(needle) || normalize(game.genre).includes(needle);
    });
  }, [games, query, genre]);

  const selectedGame = useMemo(
    () => (games || []).find((game) => game.key === selectedGameKey) || null,
    [games, selectedGameKey]
  );

  const gameSkills = useMemo(() => {
    if (!selectedGame) return [];
    const needle = normalize(query);
    return (skills || [])
      .filter((skill) => normalize(skill.game_name) === normalize(selectedGame.title))
      .filter((skill) => {
        const equipped = skill.user_card_id && equippedIds.has(String(skill.user_card_id));
        if (skillFilter === 'owned' && !skill.owned) return false;
        if (skillFilter === 'equipped' && !equipped) return false;
        if (skillFilter === 'locked' && skill.owned) return false;
        if (!needle) return true;
        return [
          skill.title,
          skill.description,
          skill.rarity,
          skill.unlock_condition,
        ].some((value) => normalize(value).includes(needle));
      })
      .sort((a, b) => {
        const aEquipped = a.user_card_id && equippedIds.has(String(a.user_card_id));
        const bEquipped = b.user_card_id && equippedIds.has(String(b.user_card_id));
        if (aEquipped !== bEquipped) return aEquipped ? -1 : 1;
        if (a.owned !== b.owned) return a.owned ? -1 : 1;
        return String(a.title).localeCompare(String(b.title));
      });
  }, [skills, selectedGame, query, skillFilter, equippedIds]);

  const selectedSkill = useMemo(() => {
    if (!selectedGame) return null;
    return gameSkills.find((skill) => String(skill.id) === String(selectedSkillId))
      || gameSkills[0]
      || null;
  }, [gameSkills, selectedSkillId, selectedGame]);

  useEffect(() => {
    if (selectedSkill && String(selectedSkill.id) !== String(selectedSkillId || '')) {
      setSelectedSkillId(selectedSkill.id);
    }
  }, [selectedSkill, selectedSkillId]);

  useEffect(() => {
    if (!selectedGame) setSelectedSkillId(null);
  }, [selectedGame]);

  const beginVoiceSearch = () => {
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) return;
    recognitionRef.current?.stop?.();
    const recognition = new Recognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);
    recognition.onresult = (event) => {
      const transcript = event.results?.[0]?.[0]?.transcript || '';
      if (transcript) setQuery(transcript);
    };
    recognitionRef.current = recognition;
    recognition.start();
  };

  useEffect(() => () => recognitionRef.current?.stop?.(), []);

  const equipSkill = async (slot, skill) => {
    if (!skill?.owned || !skill?.user_card_id) return;
    try {
      await equip(slot, skill.user_card_id);
      showSuccess(`${skill.title} equipped to Skill Slot ${slot + 1}.`);
    } catch (error) {
      showError(error, 'Equip Skill');
    }
  };

  const dragSkill = (event, skill) => {
    if (!skill?.owned || !skill?.user_card_id || !event.dataTransfer) return;
    const payload = {
      ...(skill.card || {}),
      id: skill.user_card_id,
      user_card_id: skill.user_card_id,
      title: skill.title,
      card_name: skill.title,
      image: skill.image || skill.card?.image || '',
      card_image: skill.image || skill.card?.card_image || '',
      game_name: skill.game_name,
      rarity: skill.rarity,
      card_rarity: skill.rarity,
      type: 'ability',
      card_type: 'Ability',
      showcaseOnly: false,
    };
    event.dataTransfer.effectAllowed = 'copy';
    event.dataTransfer.setData('application/json', JSON.stringify({
      source: 'luna-skill-book',
      card: payload,
      user_card_id: skill.user_card_id,
    }));
    event.dataTransfer.setData('text/plain', skill.title);
  };

  const openGame = (game) => {
    setSelectedGameKey(game.key);
    setSelectedSkillId(null);
    setQuery('');
    setSkillFilter('all');
    setGenreOpen(false);
  };

  return (
    <div
      className="relative h-full w-full overflow-hidden text-white"
      style={{
        background: 'radial-gradient(ellipse at 48% 42%, rgba(48,66,90,.34) 0%, rgba(25,42,63,.24) 56%, rgba(14,27,43,.08) 86%, transparent 100%)',
        backdropFilter: 'blur(12px) saturate(120%)',
        WebkitBackdropFilter: 'blur(12px) saturate(120%)',
      }}
    >
      <div className="relative z-10 flex h-full min-h-0 flex-col px-5 pb-5 pt-4">
        <header className="shrink-0 border-b border-white/[0.07] pb-3">
          <div className="flex items-end justify-between gap-4">
            <div>
              {selectedGame ? (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedGameKey(null);
                    setSelectedSkillId(null);
                    setQuery('');
                  }}
                  className="mb-2 flex items-center gap-1 text-[7px] font-black uppercase tracking-[0.14em] text-white/55 transition-colors hover:text-white"
                >
                  <ArrowLeft className="h-3 w-3" />
                  Game Index
                </button>
              ) : (
                <p className="text-[7px] font-black uppercase tracking-[0.2em] text-cyan-100/45">Luna Codex</p>
              )}
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-cyan-100/70" />
                <h2 className="text-[16px] font-semibold text-white">
                  {selectedGame ? selectedGame.title : 'Skill Book'}
                </h2>
              </div>
              <p className="mt-1 text-[7px] text-white/36">
                {selectedGame
                  ? `${selectedGame.owned_skills} of ${selectedGame.total_skills} skills owned · equip directly to the four Luna slots`
                  : 'Choose a game chapter to browse its complete ability library.'}
              </p>
            </div>

            <div className="text-right">
              <p className="text-[6px] font-black uppercase tracking-[0.12em] text-white/30">Loadout</p>
              <p className="mt-1 text-[9px] font-semibold text-white/70">
                {(slots || []).filter((slot) => slot.card).length} / 4 equipped
              </p>
            </div>
          </div>
        </header>

        <div className="relative shrink-0 pt-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={beginVoiceSearch}
              aria-label="Voice search"
              className={`flex h-9 w-9 shrink-0 items-center justify-center border transition-colors ${listening
                ? 'border-cyan-100/30 bg-cyan-100/[0.10] text-white'
                : 'border-white/[0.10] bg-white/[0.03] text-white/65 hover:bg-white/[0.07] hover:text-white'}`}
            >
              <Volume2 className="h-4 w-4" />
            </button>

            <label className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/35" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={selectedGame ? 'Search skills in this game' : 'Search games'}
                className="h-9 w-full border border-white/[0.10] bg-white/[0.03] pl-9 pr-3 text-[9px] text-white outline-none placeholder:text-white/30 focus:border-cyan-100/18"
              />
            </label>
          </div>

          {!selectedGame ? (
            <div className="mt-2 flex items-center gap-2">
              <button
                type="button"
                onClick={() => setGenre('all')}
                className={`h-8 border px-4 text-[7px] font-black uppercase tracking-[0.12em] transition-colors ${genre === 'all'
                  ? 'border-cyan-100/18 bg-cyan-100/[0.07] text-white'
                  : 'border-white/[0.06] bg-white/[0.015] text-white/45 hover:text-white'}`}
              >
                All Games
              </button>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setGenreOpen((open) => !open)}
                  className="flex h-8 min-w-[132px] items-center justify-between gap-3 border border-white/[0.06] bg-white/[0.015] px-3 text-[7px] font-black uppercase tracking-[0.1em] text-white/50 hover:text-white"
                >
                  <span className="truncate">{genre === 'all' ? 'Genre' : genre}</span>
                  <ChevronDown className="h-3 w-3" />
                </button>
                {genreOpen && (
                  <div className="absolute left-0 top-[34px] z-50 max-h-52 min-w-[170px] overflow-y-auto border border-white/[0.08] bg-slate-900/94 shadow-2xl backdrop-blur-xl">
                    {genres.map((entry) => (
                      <button
                        key={entry}
                        type="button"
                        onClick={() => {
                          setGenre(entry);
                          setGenreOpen(false);
                        }}
                        className="block w-full border-b border-white/[0.05] px-3 py-2 text-left text-[7px] font-semibold text-white/65 last:border-b-0 hover:bg-white/[0.05] hover:text-white"
                      >
                        {entry}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="mt-2 flex items-center gap-1.5">
              {[
                ['all', 'All Skills'],
                ['owned', 'Owned'],
                ['equipped', 'Equipped'],
                ['locked', 'Locked'],
              ].map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setSkillFilter(id)}
                  className={`h-7 border px-2.5 text-[6px] font-black uppercase tracking-[0.09em] transition-colors ${skillFilter === id
                    ? 'border-cyan-100/18 bg-cyan-100/[0.07] text-white'
                    : 'border-white/[0.055] bg-white/[0.012] text-white/38 hover:text-white'}`}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>

        {!selectedGame && (
          <section className="mt-3 shrink-0">
            <div className="mb-2 flex items-center justify-between">
              <div>
                <p className="text-[7px] font-black uppercase tracking-[0.16em] text-cyan-100/55">Collectible Cards</p>
                <p className="mt-0.5 text-[7px] text-white/38">Your card row · empty spaces fill as abilities are added.</p>
              </div>
              <span className="text-[7px] font-mono text-white/28">1 / 6</span>
            </div>
            <div className="grid grid-cols-6 gap-2">
              {[0, 1, 2, 3, 4, 5].map((index) => {
                const card = index === 0 ? demoAbility : null;
                return card ? (
                  <button
                    key={index}
                    type="button"
                    draggable={Boolean(card.owned)}
                    onDragStart={(event) => dragSkill(event, card)}
                    onClick={() => {
                      const game = (games || []).find((entry) => normalize(entry.title) === normalize(card.game_name));
                      if (game) setSelectedGameKey(game.key);
                      setSelectedSkillId(card.id);
                    }}
                    className="group relative h-[104px] overflow-hidden border border-cyan-100/24 bg-cyan-100/[0.025] shadow-[0_0_18px_rgba(103,232,249,.06)] transition hover:border-cyan-100/45 hover:bg-cyan-100/[0.05]"
                    title="Ichigo Kurosaki - Getsuga Tenshō"
                  >
                    {card.image ? <img src={card.image} alt="Ichigo Kurosaki - Getsuga Tenshō" className="absolute inset-0 h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]" /> : null}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-transparent" />
                    <div className="absolute inset-x-1.5 bottom-1.5 text-left">
                      <p className="truncate text-[7px] font-semibold text-white">Getsuga Tenshō</p>
                      <p className="mt-0.5 text-[5px] font-black uppercase tracking-[0.08em] text-cyan-100/58">Ability · Unique</p>
                    </div>
                  </button>
                ) : (
                  <div key={index} className="grid h-[104px] place-items-center border border-white/[0.065] bg-white/[0.012] text-center">
                    <div>
                      <span className="mx-auto grid h-7 w-7 place-items-center border border-white/[0.08] text-[16px] font-light text-white/22">+</span>
                      <p className="mt-2 text-[5px] font-black uppercase tracking-[0.12em] text-white/20">Empty Card</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        <div className="min-h-0 flex-1 pt-4">
          {isLoading ? (
            <div className="grid h-full place-items-center text-[9px] text-white/38">Opening Skill Book…</div>
          ) : !selectedGame ? (
            filteredGames.length ? (
              <div className="grid h-full auto-rows-min grid-cols-2 gap-2 overflow-y-auto pr-1 [scrollbar-width:thin]">
                {filteredGames.map((game) => (
                  <button
                    key={game.key}
                    type="button"
                    onClick={() => openGame(game)}
                    className="group relative min-h-[108px] overflow-hidden border border-white/[0.065] bg-white/[0.018] p-3 text-left transition-all hover:border-cyan-100/16 hover:bg-white/[0.04]"
                  >
                    <div className="flex gap-3">
                      <div className="flex h-[68px] w-[58px] shrink-0 items-center justify-center overflow-hidden border border-white/[0.07] bg-slate-950/25">
                        {game.image
                          ? <img src={game.image} alt="" className="h-full w-full object-cover opacity-85 transition-transform duration-200 group-hover:scale-[1.03]" />
                          : <Gamepad2 className="h-5 w-5 text-white/35" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-2 text-[10px] font-semibold leading-4 text-white">{game.title}</p>
                        <p className="mt-1 text-[6px] uppercase tracking-[0.1em] text-cyan-100/38">{game.genre}</p>
                        <div className="mt-3">
                          <div className="flex items-center justify-between text-[6px] text-white/35">
                            <span>Mastered</span>
                            <span>{game.owned_skills} / {game.total_skills}</span>
                          </div>
                          <div className="mt-1 h-1 overflow-hidden bg-white/[0.05]">
                            <div
                              className="h-full bg-cyan-200/45"
                              style={{ width: `${game.total_skills ? (game.owned_skills / game.total_skills) * 100 : 0}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="grid h-full place-items-center text-center text-[9px] text-white/36">
                No games match this Skill Book filter.
              </div>
            )
          ) : (
            <div className="grid h-full min-h-0 grid-cols-[58%_42%] overflow-hidden border border-white/[0.055] bg-black/[0.06]">
              <section className="min-h-0 border-r border-white/[0.065]">
                <div className="flex items-center justify-between border-b border-white/[0.055] px-3 py-2">
                  <span className="text-[6.5px] font-black uppercase tracking-[0.14em] text-white/35">Skill Index</span>
                  <span className="text-[6.5px] text-white/28">{gameSkills.length} shown</span>
                </div>

                <div className="h-[calc(100%-33px)] overflow-y-auto p-2 [scrollbar-width:thin]">
                  {gameSkills.length ? gameSkills.map((skill) => {
                    const active = String(skill.id) === String(selectedSkill?.id);
                    const equippedSlot = skill.user_card_id ? equippedIds.get(String(skill.user_card_id)) : undefined;
                    return (
                      <button
                        key={skill.id}
                        type="button"
                        draggable={Boolean(skill.owned)}
                        onDragStart={(event) => dragSkill(event, skill)}
                        onClick={() => setSelectedSkillId(skill.id)}
                        className={`mb-1 flex w-full items-center gap-2.5 border px-2.5 py-2 text-left transition-all ${active
                          ? 'border-cyan-100/18 bg-cyan-100/[0.055]'
                          : 'border-transparent bg-transparent hover:border-white/[0.055] hover:bg-white/[0.025]'}`}
                      >
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden border border-white/[0.07] bg-white/[0.025]">
                          {skill.image
                            ? <img src={skill.image} alt="" className="h-full w-full object-cover" />
                            : <Zap className="h-4 w-4 text-cyan-100/38" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <p className="truncate text-[9px] font-semibold text-white/82">{skill.title}</p>
                            {equippedSlot !== undefined && (
                              <span className="shrink-0 border border-cyan-100/16 bg-cyan-100/[0.055] px-1.5 py-0.5 text-[5px] font-black text-cyan-50">
                                SLOT {equippedSlot + 1}
                              </span>
                            )}
                          </div>
                          <div className="mt-1 flex items-center gap-2">
                            <span className={`border px-1.5 py-0.5 text-[5px] font-black uppercase tracking-[0.08em] ${rarityTone[skill.rarity] || rarityTone.Common}`}>
                              {skill.rarity || 'Common'}
                            </span>
                            <span className={`text-[6px] ${skill.owned ? 'text-emerald-200/55' : 'text-white/28'}`}>
                              {skill.owned ? 'Owned' : 'Locked'}
                            </span>
                            {skill.progression?.level ? (
                              <span className="text-[6px] text-white/30">Lv {skill.progression.level}</span>
                            ) : null}
                          </div>
                        </div>
                        {skill.owned
                          ? <Check className="h-3 w-3 shrink-0 text-emerald-300/45" />
                          : <Lock className="h-3 w-3 shrink-0 text-white/18" />}
                      </button>
                    );
                  }) : (
                    <div className="grid min-h-40 place-items-center px-4 text-center text-[8px] text-white/35">
                      No skills match this filter.
                    </div>
                  )}
                </div>
              </section>

              <section className="min-h-0 overflow-y-auto p-3 [scrollbar-width:thin]">
                {selectedSkill ? (
                  <>
                    <div className="relative h-[118px] overflow-hidden border border-white/[0.07] bg-slate-950/22">
                      {selectedSkill.image ? (
                        <img src={selectedSkill.image} alt="" className="h-full w-full object-cover opacity-50" />
                      ) : (
                        <div className="grid h-full place-items-center">
                          <Sparkles className="h-8 w-8 text-white/20" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/25 to-transparent" />
                      <div className="absolute inset-x-3 bottom-2">
                        <p className="text-[11px] font-semibold text-white">{selectedSkill.title}</p>
                        <p className="mt-0.5 text-[6px] uppercase tracking-[0.12em] text-white/38">
                          {selectedSkill.rarity || 'Common'} · {selectedGame.title}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3">
                      <p className="text-[6px] font-black uppercase tracking-[0.14em] text-cyan-100/40">Skill Record</p>
                      <p className="mt-1 text-[8px] leading-4 text-white/48">
                        {selectedSkill.description || selectedSkill.unlock_condition || 'This skill is part of the game’s achievement ability set.'}
                      </p>
                    </div>

                    {selectedSkill.progression && (
                      <div className="mt-3 grid grid-cols-2 gap-1.5">
                        {[
                          ['Level', selectedSkill.progression.level],
                          ['Power', selectedSkill.progression.power_score],
                          ['Stage', selectedSkill.progression.stage],
                          ['Stars', selectedSkill.progression.stars],
                        ].map(([label, value]) => (
                          <div key={label} className="border border-white/[0.055] bg-white/[0.018] px-2 py-1.5">
                            <p className="text-[5px] font-black uppercase tracking-[0.1em] text-white/28">{label}</p>
                            <p className="mt-0.5 text-[8px] font-semibold text-white/70">{value ?? 0}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="mt-4 border-t border-white/[0.06] pt-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-[6px] font-black uppercase tracking-[0.14em] text-white/35">Equip Skill</p>
                          <p className="mt-0.5 text-[6px] text-white/25">Writes directly to the persistent Luna loadout.</p>
                        </div>
                      </div>

                      {selectedSkill.owned ? (
                        <div className="mt-2 grid grid-cols-4 gap-1.5">
                          {[0, 1, 2, 3].map((slotIndex) => {
                            const slot = slots.find((entry) => Number(entry.index) === slotIndex);
                            const occupiedBySelected = String(slot?.card?.user_card_id || '') === String(selectedSkill.user_card_id || '');
                            return (
                              <button
                                key={slotIndex}
                                type="button"
                                disabled={isSaving}
                                onClick={() => equipSkill(slotIndex, selectedSkill)}
                                className={`min-h-[52px] border px-1.5 py-2 text-center transition-colors disabled:opacity-40 ${occupiedBySelected
                                  ? 'border-cyan-100/28 bg-cyan-100/[0.09] text-white'
                                  : 'border-white/[0.065] bg-white/[0.018] text-white/48 hover:border-cyan-100/16 hover:bg-cyan-100/[0.045] hover:text-white'}`}
                              >
                                <span className="block text-[5px] font-black uppercase tracking-[0.1em]">Slot</span>
                                <span className="mt-0.5 block text-[10px] font-semibold">{slotIndex + 1}</span>
                                <span className="mt-1 block truncate text-[4.5px] text-white/28">
                                  {occupiedBySelected ? 'Equipped' : slot?.card?.card_name || 'Empty'}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="mt-2 border border-white/[0.055] bg-white/[0.015] px-3 py-3">
                          <div className="flex items-center gap-2 text-white/45">
                            <Lock className="h-3.5 w-3.5" />
                            <span className="text-[7px] font-semibold">Skill not owned</span>
                          </div>
                          <p className="mt-1 text-[6px] leading-3 text-white/27">
                            {selectedSkill.unlock_condition || 'Unlock its achievement card before it can be equipped.'}
                          </p>
                        </div>
                      )}
                    </div>

                    {selectedSkill.owned && (
                      <div className="mt-3 border border-cyan-100/[0.07] bg-cyan-100/[0.02] px-3 py-2">
                        <p className="text-[6px] leading-3 text-cyan-50/45">
                          You can also drag this owned skill directly onto one of the four diamond slots.
                        </p>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="grid h-full place-items-center text-center text-[8px] text-white/32">
                    Select a skill from the index.
                  </div>
                )}
              </section>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

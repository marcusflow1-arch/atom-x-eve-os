import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ChevronDown, CreditCard, Gamepad2, Layers3, Search, Volume2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/components/auth/AuthContext';
import { libraryGames } from '@/components/dashboard/gamehub/mockLibraryData';

const normalizeText = (value) => String(value || '').trim().toLowerCase();
const titleOf = (game) => game?.title || game?.name || game?.game_name || '';
const coverOf = (game) => game?.cover_image || game?.cover || game?.banner_image || game?.image || game?.thumb || '';
const genreOf = (game) => game?.genre || game?.genres?.[0] || '';

const rarityTone = {
  Mythic: 'border-red-300/25 text-red-100',
  Unique: 'border-fuchsia-300/25 text-fuchsia-100',
  Legendary: 'border-amber-300/25 text-amber-100',
  Epic: 'border-violet-300/25 text-violet-100',
  Rare: 'border-cyan-300/25 text-cyan-100',
  Uncommon: 'border-emerald-300/20 text-emerald-100',
  Common: 'border-white/10 text-white/75',
};

export default function LunaCardsPanel() {
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [genre, setGenre] = useState('all');
  const [genreOpen, setGenreOpen] = useState(false);
  const [selectedGame, setSelectedGame] = useState(null);
  const [bezels, setBezels] = useState(false);
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef(null);

  const { data: ownedCards = [], isLoading: cardsLoading } = useQuery({
    queryKey: ['luna-mini-owned-cards', user?.id],
    queryFn: () => base44.entities.UserCard.filter({ user_id: user.id }, '-created_date', 500),
    enabled: Boolean(user?.id),
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const { data: games = [] } = useQuery({
    queryKey: ['luna-mini-card-games'],
    queryFn: () => base44.entities.Game.list('-created_date', 250),
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const gameMeta = useMemo(() => {
    const map = new Map();
    [...libraryGames, ...(games || [])].forEach((game) => {
      const title = titleOf(game);
      if (!title) return;
      const key = normalizeText(title);
      const current = map.get(key) || {};
      map.set(key, {
        title,
        image: coverOf(game) || current.image || '',
        genre: genreOf(game) || current.genre || '',
      });
    });
    return map;
  }, [games]);

  const groups = useMemo(() => {
    const map = new Map();
    (ownedCards || []).forEach((card) => {
      const title = card.game_name || 'Unknown Game';
      const key = normalizeText(title);
      if (!map.has(key)) {
        const meta = gameMeta.get(key) || {};
        map.set(key, {
          key,
          title,
          image: meta.image || card.card_image || '',
          genre: card.genre || meta.genre || 'Uncategorized',
          cards: [],
        });
      }
      map.get(key).cards.push(card);
    });
    return [...map.values()].sort((a, b) => a.title.localeCompare(b.title));
  }, [ownedCards, gameMeta]);

  const genres = useMemo(
    () => [...new Set(groups.map((game) => game.genre).filter(Boolean))].sort((a, b) => a.localeCompare(b)),
    [groups]
  );

  const filteredGames = useMemo(() => {
    const needle = normalizeText(query);
    return groups.filter((game) => {
      if (genre !== 'all' && normalizeText(game.genre) !== normalizeText(genre)) return false;
      if (!needle) return true;
      if (normalizeText(game.title).includes(needle)) return true;
      if (normalizeText(game.genre).includes(needle)) return true;
      return game.cards.some((card) =>
        [card.card_name, card.card_type, card.card_rarity, card.genre]
          .some((value) => normalizeText(value).includes(needle))
      );
    });
  }, [groups, genre, query]);

  const suggestions = useMemo(() => {
    const needle = normalizeText(query);
    if (!needle) return [];
    const out = [];
    const seen = new Set();
    const push = (type, label, sublabel = '') => {
      const key = `${type}:${normalizeText(label)}`;
      if (!label || seen.has(key)) return;
      seen.add(key);
      out.push({ type, label, sublabel });
    };
    groups.forEach((game) => {
      if (normalizeText(game.title).includes(needle)) push('Game', game.title, game.genre);
      if (normalizeText(game.genre).includes(needle)) push('Genre', game.genre, 'Filter');
      game.cards.forEach((card) => {
        if (normalizeText(card.card_name).includes(needle)) push('Card', card.card_name, game.title);
      });
    });
    return out.slice(0, 7);
  }, [groups, query]);

  const selectedGroup = selectedGame ? groups.find((game) => game.key === selectedGame) : null;
  const selectedCards = useMemo(() => {
    if (!selectedGroup) return [];
    const needle = normalizeText(query);
    return selectedGroup.cards.filter((card) => {
      if (!needle) return true;
      return [card.card_name, card.card_type, card.card_rarity, card.genre]
        .some((value) => normalizeText(value).includes(needle));
    });
  }, [selectedGroup, query]);

  const chooseSuggestion = (entry) => {
    if (entry.type === 'Genre') {
      setGenre(entry.label);
      setQuery('');
      setSelectedGame(null);
      return;
    }
    if (entry.type === 'Game') {
      const group = groups.find((game) => normalizeText(game.title) === normalizeText(entry.label));
      if (group) {
        setSelectedGame(group.key);
        setQuery('');
      }
      return;
    }
    setQuery(entry.label);
  };

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

  return (
    <div
      className="relative h-full w-full overflow-hidden px-5 pb-5 pt-4"
      style={{
        background: 'radial-gradient(ellipse at 54% 46%, rgba(42,60,84,.36) 0%, rgba(29,47,70,.26) 58%, rgba(19,34,52,.10) 84%, transparent 100%)',
        backdropFilter: 'blur(10px) saturate(118%)',
        WebkitBackdropFilter: 'blur(10px) saturate(118%)',
      }}
    >
      <div className="relative z-10 flex h-full min-h-0 flex-col">
        <header className="shrink-0 border-b border-white/[0.07] pb-3">
          {selectedGroup ? (
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <button
                  type="button"
                  onClick={() => { setSelectedGame(null); setQuery(''); }}
                  className="mb-2 flex items-center gap-1 text-[7px] font-black uppercase tracking-[0.14em] text-white/65 transition-colors hover:text-white"
                >
                  <ArrowLeft className="h-3 w-3" />
                  Games
                </button>
                <p className="text-[8px] font-black uppercase tracking-[0.2em] text-white/55">Owned Cards</p>
                <h2 className="mt-1 truncate text-[15px] font-semibold text-white">{selectedGroup.title}</h2>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-[6px] font-black uppercase tracking-[0.14em] text-white/40">Owned</p>
                <p className="mt-1 text-[10px] font-semibold text-white">{selectedGroup.cards.length}</p>
              </div>
            </div>
          ) : (
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="text-[8px] font-black uppercase tracking-[0.2em] text-white/55">Cards</p>
                <h2 className="mt-1 text-[15px] font-semibold text-white">Game Collection</h2>
              </div>
              <p className="text-[8px] font-semibold text-white/55">{ownedCards.length} owned</p>
            </div>
          )}
        </header>

        <div className="relative shrink-0 pt-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={beginVoiceSearch}
              title="Voice search"
              aria-label="Voice search"
              className={`flex h-9 w-9 shrink-0 items-center justify-center border transition-colors ${listening ? 'border-cyan-100/30 bg-cyan-100/[0.12] text-white' : 'border-white/[0.12] bg-white/[0.045] text-white/80 hover:bg-white/[0.09] hover:text-white'}`}
            >
              <Volume2 className="h-4 w-4" />
            </button>

            <div className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/45" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={selectedGroup ? 'Search owned cards' : 'Search games, cards, or genre'}
                className="h-9 w-full border border-white/[0.12] bg-white/[0.045] pl-9 pr-3 text-[9px] text-white outline-none placeholder:text-white/45 focus:border-white/[0.22]"
              />

              {!selectedGroup && suggestions.length > 0 && (
                <div className="absolute left-0 right-0 top-[40px] z-50 overflow-hidden border border-white/[0.08] bg-slate-900/88 shadow-2xl backdrop-blur-xl">
                  {suggestions.map((entry, index) => (
                    <button
                      key={`${entry.type}-${entry.label}-${index}`}
                      type="button"
                      onClick={() => chooseSuggestion(entry)}
                      className="flex w-full items-center justify-between gap-3 border-b border-white/[0.05] px-3 py-2 text-left last:border-b-0 hover:bg-white/[0.05]"
                    >
                      <span className="min-w-0 truncate text-[8px] font-semibold text-white">{entry.label}</span>
                      <span className="shrink-0 text-[6px] font-black uppercase tracking-[0.12em] text-white/45">{entry.type}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {!selectedGroup && (
            <div className="mt-2 flex items-center gap-2">
              <button
                type="button"
                onClick={() => setGenre('all')}
                className={`h-8 border px-4 text-[7px] font-black uppercase tracking-[0.12em] transition-colors ${genre === 'all' ? 'border-white/[0.16] bg-white/[0.08] text-white' : 'border-white/[0.09] bg-white/[0.025] text-white/65 hover:bg-white/[0.06] hover:text-white'}`}
              >
                All
              </button>

              <div className="relative">
                <button
                  type="button"
                  onClick={() => setGenreOpen((open) => !open)}
                  className={`flex h-8 min-w-[132px] items-center justify-between gap-3 border px-3 text-[7px] font-black uppercase tracking-[0.1em] transition-colors ${genre !== 'all' ? 'border-white/[0.16] bg-white/[0.08] text-white' : 'border-white/[0.09] bg-white/[0.025] text-white/65 hover:bg-white/[0.06] hover:text-white'}`}
                >
                  <span className="truncate">{genre === 'all' ? 'Genre' : genre}</span>
                  <ChevronDown className="h-3 w-3" />
                </button>
                {genreOpen && (
                  <div className="absolute left-0 top-[34px] z-50 max-h-52 min-w-[170px] overflow-y-auto border border-white/[0.08] bg-slate-900/88 shadow-2xl backdrop-blur-xl">
                    {genres.map((entry) => (
                      <button
                        key={entry}
                        type="button"
                        onClick={() => { setGenre(entry); setGenreOpen(false); }}
                        className="block w-full border-b border-white/[0.05] px-3 py-2 text-left text-[7px] font-semibold text-white/75 last:border-b-0 hover:bg-white/[0.05] hover:text-white"
                      >
                        {entry}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => setBezels((value) => !value)}
                aria-pressed={bezels}
                className={`h-8 border px-3 text-[7px] font-black uppercase tracking-[0.1em] transition-colors ${bezels
                  ? 'border-white/[0.16] bg-white/[0.08] text-white'
                  : 'border-white/[0.07] bg-white/[0.025] text-white/60 hover:text-white'}`}
              >
                Bezels {bezels ? 'On' : 'Off'}
              </button>

              <div className="flex items-center gap-1.5 text-[7px] text-white/50">
                <Layers3 className="h-3 w-3" />
                {filteredGames.length} games
              </div>
            </div>
          )}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto pt-4 pr-1">
          {cardsLoading ? (
            <div className="grid h-full min-h-44 place-items-center text-[8px] text-white/55">Loading cards…</div>
          ) : selectedGroup ? (
            selectedCards.length ? (
              <div className="grid justify-start gap-2" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(76px, 86px))' }}>
                {selectedCards.map((card) => (
                  <div key={card.id} className="relative h-[112px] overflow-hidden border border-white/[0.10] bg-white/[0.035] p-1.5">
                    <div className="relative flex h-[58px] items-center justify-center overflow-hidden border border-white/[0.07] bg-slate-950/25">
                      {card.card_image ? (
                        <img src={card.card_image} alt={card.card_name} className="h-full w-full object-cover" />
                      ) : (
                        <CreditCard className="h-5 w-5 text-white/55" />
                      )}
                    </div>
                    <p className="mt-1 line-clamp-2 min-h-[20px] text-[7px] font-semibold leading-[10px] text-white">{card.card_name || 'Unnamed Card'}</p>
                    <div className="mt-0.5 flex items-center justify-between gap-1">
                      <span className={`truncate border px-1 py-0.5 text-[4.5px] font-black uppercase tracking-[.07em] ${rarityTone[card.card_rarity] || rarityTone.Common}`}>
                        {card.card_rarity || 'Common'}
                      </span>
                      <span className="truncate text-[5px] uppercase text-white/55">{card.card_type || 'Card'}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid h-full min-h-44 place-items-center text-center text-[8px] text-white/55">No owned cards match this search.</div>
            )
          ) : filteredGames.length ? (
            <div className="grid justify-start gap-2" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(76px, 86px))' }}>
              {filteredGames.map((game) => (
                <button
                  key={game.key}
                  type="button"
                  onClick={() => { setSelectedGame(game.key); setQuery(''); setGenreOpen(false); }}
                  className={`group relative h-[108px] overflow-hidden p-1.5 text-left transition-all ${bezels
                    ? 'border border-white/[0.11] bg-white/[0.035] hover:border-white/[0.20] hover:bg-white/[0.07]'
                    : 'border border-transparent bg-transparent hover:bg-white/[0.035]'}`}
                  title={game.title}
                >
                  <div className={`relative flex h-[56px] items-center justify-center overflow-hidden ${bezels
                    ? 'border border-white/[0.07] bg-slate-950/25'
                    : 'border border-transparent bg-transparent'}`}>
                    {game.image ? (
                      <img src={game.image} alt={game.title} className="h-full w-full object-cover opacity-85 transition-transform duration-200 group-hover:scale-[1.03]" />
                    ) : (
                      <Gamepad2 className="h-5 w-5 text-white/55" />
                    )}
                    <span className={`absolute right-1 top-1 px-1 text-[5px] font-black text-white ${bezels ? 'bg-black/70' : 'bg-slate-950/45 backdrop-blur-sm'}`}>{game.cards.length}</span>
                  </div>
                  <div className="mt-1 flex min-h-[28px] flex-col justify-between">
                    <p className="line-clamp-2 text-[7px] font-semibold leading-[10px] text-white">{game.title}</p>
                    <p className="mt-0.5 truncate text-[5px] uppercase tracking-[0.06em] text-white/55">{game.genre}</p>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="grid h-full min-h-44 place-items-center text-center">
              <div>
                <Gamepad2 className="mx-auto h-6 w-6 text-white/35" />
                <p className="mt-2 text-[8px] text-white/60">No games with owned cards match this filter.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
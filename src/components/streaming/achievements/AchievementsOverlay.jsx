import { useMemo, useState } from 'react';
import { Trophy, X } from 'lucide-react';
import AchievementGameList from './AchievementGameList';
import AchievementDemoCard from './AchievementDemoCard';
import AchievementDemonstration from './AchievementDemonstration';
import { achievementGames, achievementsFor } from './achievementDemoData';

export default function AchievementsOverlay({ onClose }) {
  const [genre, setGenre] = useState('All Genres');
  const [search, setSearch] = useState('');
  const [game, setGame] = useState(achievementGames[0]);
  const [achievement, setAchievement] = useState(null);
  const games = useMemo(() => achievementGames.filter((item) => (genre === 'All Genres' || item.genre === genre) && item.name.toLowerCase().includes(search.toLowerCase().trim())), [genre, search]);
  const achievements = useMemo(() => achievementsFor(game), [game]);
  const selectGame = (item) => { setGame(item); setAchievement(null); };
  return <div className="flex h-full min-h-0 flex-col overflow-hidden">
    <header className="flex shrink-0 items-center justify-between border-b border-white/10 px-6 py-4"><div className="flex items-center gap-3"><Trophy className="h-5 w-5 text-cyan-300" /><div><div className="text-[9px] uppercase tracking-[0.28em] text-cyan-300/55">Player history</div><h2 className="text-xl font-bold text-white">Achievements</h2></div></div><button type="button" onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-white/55 hover:text-white" aria-label="Close achievements"><X className="h-4 w-4" /></button></header>
    <div className="flex min-h-0 flex-1 p-5">
      <AchievementGameList games={games} selectedId={game.id} genre={genre} search={search} onGenre={setGenre} onSearch={setSearch} onSelect={selectGame} />
      <div className="h-full w-px shrink-0 bg-gradient-to-b from-transparent via-cyan-200/55 to-transparent" />
      <section className="relative grid min-w-0 flex-1 grid-rows-2 pl-6">
        <div className="min-h-0 overflow-hidden pb-5"><div className="mb-3 text-xs font-semibold text-white/75">{game.name} achievement cards</div><div className="flex h-[calc(100%-2rem)] items-center gap-4 overflow-x-auto pb-3">{achievements.map((item) => <AchievementDemoCard key={item.id} achievement={item} selected={achievement?.id === item.id} onSelect={setAchievement} />)}</div></div>
        <div className="pointer-events-none absolute left-6 right-0 top-1/2 h-px -translate-y-1/2 bg-gradient-to-r from-transparent via-cyan-200/55 to-transparent" />
        <div className="min-h-0 pt-1"><AchievementDemonstration achievement={achievement} /></div>
      </section>
    </div>
  </div>;
}
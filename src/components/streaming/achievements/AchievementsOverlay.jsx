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
  return <div className="flex h-full min-h-0 flex-col overflow-hidden border border-white/10 bg-white/[0.025] backdrop-blur-2xl">
    <header className="flex shrink-0 items-center justify-between border-b border-white/10 px-5 py-3"><div className="flex items-center gap-3"><Trophy className="h-5 w-5 text-cyan-300" /><div><div className="text-[9px] uppercase tracking-[0.28em] text-cyan-300/55">Player history</div><h2 className="text-xl font-bold text-white">Achievements</h2></div></div><button type="button" onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-white/55 hover:text-white" aria-label="Close achievements"><X className="h-4 w-4" /></button></header>
    <div className="flex min-h-0 flex-1 p-5">
      <AchievementGameList games={games} selectedId={game.id} genre={genre} search={search} onGenre={setGenre} onSearch={setSearch} onSelect={selectGame} />
      <div className="h-full w-px shrink-0 bg-gradient-to-b from-transparent via-cyan-200/55 to-transparent" />
      <section className="flex min-w-0 flex-1 flex-col pl-6"><div className="shrink-0"><div className="mb-3 text-xs font-semibold text-white/75">{game.name} achievement cards</div><div className="flex gap-4 overflow-x-auto pb-4">{achievements.map((item) => <AchievementDemoCard key={item.id} achievement={item} selected={achievement?.id === item.id} onSelect={setAchievement} />)}</div></div>
        <div className="h-px w-full bg-gradient-to-r from-transparent via-cyan-200/55 to-transparent" />
        <div className="min-h-0 flex-1"><AchievementDemonstration achievement={achievement} /></div>
      </section>
    </div>
  </div>;
}
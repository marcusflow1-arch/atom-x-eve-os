import { Search } from 'lucide-react';

export default function AchievementGameList({ games, selectedId, genre, search, onGenre, onSearch, onSelect }) {
  return <aside className="flex h-full min-h-0 w-[28%] shrink-0 flex-col pr-5">
    <label className="mb-2 text-[9px] uppercase tracking-[0.24em] text-white/40">Filter played games</label>
    <select value={genre} onChange={(event) => onGenre(event.target.value)} className="h-9 border border-white/10 bg-white/5 px-3 text-xs text-white outline-none" aria-label="Filter achievements by genre">
      {['All Genres', 'MMORPG', 'MOBA', 'RPG', 'Action RPG', 'Shooter'].map((item) => <option key={item} className="bg-slate-950">{item}</option>)}
    </select>
    <div className="relative my-3"><Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/35" /><input value={search} onChange={(event) => onSearch(event.target.value)} placeholder="Search games" className="h-9 w-full border border-white/10 bg-white/[0.03] pl-9 pr-3 text-xs text-white outline-none placeholder:text-white/25" /></div>
    <div className="min-h-0 flex-1 space-y-1 overflow-y-auto">{games.map((game) => <button key={game.id} type="button" onClick={() => onSelect(game)} className={`flex w-full items-center gap-3 border p-2 text-left ${selectedId === game.id ? 'border-cyan-300/45 bg-cyan-300/[0.08]' : 'border-transparent hover:bg-white/5'}`}><img src={game.image} alt="" className="h-9 w-14 object-cover" /><span className="min-w-0"><span className="block truncate text-xs font-semibold text-white/85">{game.name}</span><span className="block text-[9px] uppercase tracking-wider text-white/35">{game.genre}</span></span></button>)}</div>
  </aside>;
}
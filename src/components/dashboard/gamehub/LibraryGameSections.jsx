import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { GAME_DATA } from '@/components/dashboard/gamehub/gameProgressData';
import LibraryRecordCard from '@/components/dashboard/gamehub/LibraryRecordCard';

export default function LibraryGameSections({ game, initialTab = 'Overview' }) {
  const [tab, setTab] = useState(initialTab);
  const progress = game.demo ? GAME_DATA[game.id] : null;
  const { data: dlc = [], isLoading: dlcLoading, isError: dlcError } = useQuery({ queryKey: ['library-dlc', game.id], queryFn: () => base44.entities.DLC.filter({ game_id: String(game.id), status: 'active' }), enabled: tab === 'DLC', staleTime: 300000 });
  const { data: posts = [], isLoading: postsLoading, isError: postsError } = useQuery({ queryKey: ['library-posts', game.title], queryFn: () => base44.entities.Post.filter({ game_title: game.title }, '-created_date', 100), enabled: ['Community', 'Guides'].includes(tab), staleTime: 60000 });
  const tabs = ['Overview', 'Community', 'Updates', 'Quests', 'DLC', 'Guides', 'Friends', 'Media'];
  const descriptions = { Overview: 'Game description and library progress.', Community: 'Player discussions and feedback for this title.', Updates: 'Published patch notes and developer changes.', Quests: 'Objectives, quest descriptions, and rewards.', DLC: 'Expansions and add-ons for this game, including pricing, release details, and included content.', Guides: 'Walkthroughs, tips, and community builds for this title.', Friends: 'Game-specific friend progress and activity.', Media: 'Screenshots and videos attached to this game.' };
  let rows = [];
  if (tab === 'Overview') rows = [{ title: game.title, body: game.description, meta: [game.genre, game.playtime && `${game.playtime} played`, typeof game.achievements === 'string' && `${game.achievements} achievements`, game.progress != null && `${game.progress}% progress`].filter(Boolean).join(' · ') }];
  if (tab === 'DLC') rows = dlc.map(d => ({ title: d.name, body: d.description, image: d.cover_image, meta: [`${(d.currency || 'USD').toUpperCase()} ${Number(d.price).toFixed(2)}`, d.version && `Version ${d.version}`, d.install_size_mb != null && `${d.install_size_mb} MB`, d.release_date && `Released ${new Date(d.release_date).toLocaleDateString()}`, `Requires ${game.title}`].filter(Boolean).join(' · '), details: d.content }));
  if (tab === 'Community' || tab === 'Guides') rows = posts.filter(p => tab === 'Community' || ['guide', 'tips'].includes(p.community)).map(p => ({ title: p.title, body: p.content, image: p.image_url, meta: `${p.community} · ${new Date(p.created_date).toLocaleDateString()}` }));
  if (tab === 'Updates') rows = (game.patch_notes || []).map(p => ({ title: p.title || p.version, body: p.content || p.description, meta: p.date }));
  if (tab === 'Quests') rows = [...(progress?.quests?.active || []), ...(progress?.quests?.available || [])].map(q => ({ title: q.title, body: `${q.description}\n\nObjective: ${q.objective}`, meta: `${q.giver} · ${q.status === 'tracking' ? 'Tracked' : 'Available'}`, details: q.rewards?.map(r => r.label) }));
  if (tab === 'Friends') rows = (progress?.friends || []).map(f => ({ title: f.name, body: f.detail, meta: `${game.title} · ${f.status}` }));
  const loading = tab === 'DLC' ? dlcLoading : ['Community', 'Guides'].includes(tab) ? postsLoading : false;
  const error = tab === 'DLC' ? dlcError : ['Community', 'Guides'].includes(tab) ? postsError : false;
  const media = [...(game.screenshots || []), ...(game.video_urls || []), ...(game.trailer_url ? [game.trailer_url] : [])];
  return <section className="library-surface flex h-full min-h-0 flex-col" data-testid="library-game-sections">
    <nav className="flex shrink-0 gap-1 overflow-x-auto border-b border-current/15 p-2" aria-label="Game subpages">{tabs.map(name => <button key={name} onClick={() => setTab(name)} aria-pressed={tab === name} className={`shrink-0 rounded-lg px-3 py-2 text-xs ${tab === name ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}>{name}</button>)}</nav>
    <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-5" data-testid="library-subpage" onWheel={e => e.stopPropagation()}>
      <h2 className="text-lg font-semibold">{game.title} — {tab}</h2><p className="mt-1 mb-4 text-xs text-muted-foreground">{descriptions[tab]}</p>
      {game.demo && ['Overview', 'Quests', 'Friends'].includes(tab) && <p className="mb-3 text-xs text-muted-foreground">Demo library data · not live player activity</p>}
      {loading ? <p role="status">Loading {tab.toLowerCase()}…</p> : error ? <p role="alert">Unable to load {tab.toLowerCase()} for {game.title}.</p> : tab === 'Media' ? <div className="grid grid-cols-1 gap-4 md:grid-cols-2">{media.map((url, i) => game.screenshots?.includes(url) ? <a key={url} href={url} target="_blank" rel="noopener noreferrer"><img src={url} alt={`${game.title} screenshot ${i + 1}`} className="w-full rounded-xl" /></a> : <a key={url} href={/^https?:\/\//i.test(url) ? url : undefined} target="_blank" rel="noopener noreferrer" className="underline">Watch {game.title} video {i + 1}</a>)}{!media.length && <p>No screenshots or videos have been added for {game.title}.</p>}</div> : rows.length ? <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">{rows.map((item, i) => <LibraryRecordCard key={i} item={item} />)}</div> : <p className="text-sm text-muted-foreground">No {tab === 'DLC' ? 'DLC or add-ons are listed' : `${tab.toLowerCase()} are available`} for {game.title} yet.</p>}
    </div>
  </section>;
}
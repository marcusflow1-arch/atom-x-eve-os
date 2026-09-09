// Shared data model for the redesigned Gallery — streamer clip timeline (Twitch-style clip farming)
export const CATEGORY_META = {
  BOSS: { label: 'Boss', chip: 'bg-emerald-400/15 border-emerald-300/40 text-emerald-200' },
  LOOT: { label: 'Loot', chip: 'bg-violet-400/15 border-violet-300/40 text-violet-200' },
  COOL: { label: 'Cool', chip: 'bg-cyan-400/15 border-cyan-300/40 text-cyan-200' },
  FUNNY: { label: 'Funny', chip: 'bg-pink-400/15 border-pink-300/40 text-pink-200' },
  ODD: { label: 'Odd', chip: 'bg-amber-400/15 border-amber-300/40 text-amber-200' },
  CLUTCH: { label: 'Clutch', chip: 'bg-lime-400/15 border-lime-300/40 text-lime-200' },
  SAVED: { label: 'Saved', chip: 'bg-slate-400/15 border-slate-300/40 text-slate-200' },
};

export const CATEGORY_ORDER = ['BOSS', 'LOOT', 'COOL', 'FUNNY', 'ODD', 'CLUTCH', 'SAVED'];

export const CLIP_DAYS = [
  { key: '2026-08-26', label: '26', weekday: 'WED', month: 'AUG' },
  { key: '2026-08-27', label: '27', weekday: 'THU', month: 'AUG' },
  { key: '2026-08-28', label: '28', weekday: 'FRI', month: 'AUG' },
  { key: '2026-08-29', label: '29', weekday: 'SAT', month: 'AUG' },
  { key: '2026-08-30', label: '30', weekday: 'SUN', month: 'AUG' },
  { key: '2026-08-31', label: '31', weekday: 'MON', month: 'AUG' },
  { key: '2026-09-01', label: '01', weekday: 'TUE', month: 'SEP' },
  { key: '2026-09-02', label: '02', weekday: 'WED', month: 'SEP' },
];

export const CLIPS = [
  { id: 'c-26-1', date: '2026-08-26', time: '7:12 PM', title: 'Boss down', category: 'BOSS', game: 'The Elder Scrolls', type: 'video', description: 'The boss fight finally paid off after a long run.', tone: 'from-emerald-300/30 via-slate-950 to-teal-950' },
  { id: 'c-26-2', date: '2026-08-26', time: '8:42 PM', title: 'Chat lost it', category: 'FUNNY', game: 'SMITE 2', type: 'image', description: 'A chaotic community moment saved from the broadcast.', tone: 'from-purple-400/30 via-slate-950 to-fuchsia-950' },
  { id: 'c-26-3', date: '2026-08-26', time: '10:03 PM', title: 'Perfect finish', category: 'COOL', game: 'SMITE 2', type: 'video', description: 'Clean execution with the squad celebrating.', tone: 'from-amber-300/30 via-slate-950 to-orange-950' },
  { id: 'c-26-4', date: '2026-08-26', time: '11:26 PM', title: 'NPC stared at a wall for 10 minutes', category: 'ODD', game: 'The Elder Scrolls', type: 'image', description: 'One of those "what is happening" stream moments.', tone: 'from-yellow-300/25 via-slate-950 to-amber-950' },
  { id: 'c-27-1', date: '2026-08-27', time: '9:31 PM', title: 'Rare drop', category: 'LOOT', game: 'The Elder Scrolls', type: 'video', description: 'A rare reward appears at exactly the right time.', tone: 'from-violet-300/30 via-slate-950 to-indigo-950' },
  { id: 'c-27-2', date: '2026-08-27', time: '8:06 PM', title: 'Unexpected reaction', category: 'FUNNY', game: 'The Elder Scrolls', type: 'image', description: 'One of those moments that only makes sense live.', tone: 'from-pink-300/30 via-slate-950 to-rose-950' },
  { id: 'c-27-3', date: '2026-08-27', time: '6:48 PM', title: 'One HP moment', category: 'CLUTCH', game: 'Fallout', type: 'video', description: 'Survived with almost nothing left and kept the run alive.', tone: 'from-lime-300/30 via-slate-950 to-green-950' },
  { id: 'c-28-1', date: '2026-08-28', time: '7:44 PM', title: 'World boss soloed', category: 'BOSS', game: 'Destiny 2', type: 'video', description: 'Full health bar melted solo while chat timed it.', tone: 'from-emerald-300/30 via-slate-950 to-teal-950' },
  { id: 'c-28-2', date: '2026-08-28', time: '9:12 PM', title: 'Physics said no', category: 'ODD', game: 'Cyberpunk 2077', type: 'image', description: 'The car had other plans for the mission.', tone: 'from-yellow-300/25 via-slate-950 to-amber-950' },
  { id: 'c-28-3', date: '2026-08-28', time: '10:26 PM', title: 'Double exotic drop', category: 'LOOT', game: 'Destiny 2', type: 'video', description: 'Back-to-back exotics nobody expected.', tone: 'from-violet-300/30 via-slate-950 to-indigo-950' },
  { id: 'c-29-1', date: '2026-08-29', time: '5:14 PM', title: 'The big play', category: 'COOL', game: 'Cyberpunk 2077', type: 'video', description: 'The standout moment from the session.', tone: 'from-fuchsia-300/30 via-slate-950 to-purple-950' },
  { id: 'c-29-2', date: '2026-08-29', time: '8:31 PM', title: 'Raid wipe at 1%', category: 'BOSS', game: 'Destiny 2', type: 'video', description: 'So close it hurt. Chat still mems about it.', tone: 'from-emerald-300/30 via-slate-950 to-teal-950' },
  { id: 'c-29-3', date: '2026-08-29', time: '11:02 PM', title: 'Backwards driving record', category: 'ODD', game: 'SMITE 2', type: 'image', description: 'A new personal best in the wrong direction.', tone: 'from-yellow-300/25 via-slate-950 to-amber-950' },
  { id: 'c-30-1', date: '2026-08-30', time: '6:22 PM', title: 'Jackpot vault run', category: 'LOOT', game: 'Fallout', type: 'video', description: 'Every container in the vault paid out.', tone: 'from-violet-300/30 via-slate-950 to-indigo-950' },
  { id: 'c-30-2', date: '2026-08-30', time: '9:48 PM', title: 'Rage quit (mine)', category: 'FUNNY', game: 'SMITE 2', type: 'image', description: 'Captured mid-throw for posterity.', tone: 'from-pink-300/30 via-slate-950 to-rose-950' },
  { id: 'c-30-3', date: '2026-08-30', time: '10:55 PM', title: 'No-scope final kill', category: 'COOL', game: 'SMITE 2', type: 'video', description: 'Match-winning shot with zero time left.', tone: 'from-cyan-300/30 via-slate-950 to-blue-950' },
  { id: 'c-31-1', date: '2026-08-31', time: '7:18 PM', title: 'Dungeon first try', category: 'BOSS', game: 'The Elder Scrolls', type: 'video', description: 'Blind run, zero deaths, chat speechless.', tone: 'from-emerald-300/30 via-slate-950 to-teal-950' },
  { id: 'c-31-2', date: '2026-08-31', time: '8:44 PM', title: 'Companion clipped through the floor', category: 'ODD', game: 'The Elder Scrolls', type: 'image', description: 'Gone but not forgotten. Literally.', tone: 'from-yellow-300/25 via-slate-950 to-amber-950' },
  { id: 'c-31-3', date: '2026-08-31', time: '11:19 PM', title: 'Rocket jump save', category: 'COOL', game: 'Destiny 2', type: 'video', description: 'The clutch movement play of the week.', tone: 'from-cyan-300/30 via-slate-950 to-blue-950' },
  { id: 'c-01-1', date: '2026-09-01', time: '6:36 PM', title: 'Legendary from a trash mob', category: 'LOOT', game: 'Cyberpunk 2077', type: 'video', description: 'The most random drop of the season.', tone: 'from-violet-300/30 via-slate-950 to-indigo-950' },
  { id: 'c-01-2', date: '2026-09-01', time: '8:58 PM', title: 'Chat picked my build', category: 'FUNNY', game: 'Cyberpunk 2077', type: 'image', description: 'They said trust them. They lied.', tone: 'from-pink-300/30 via-slate-950 to-rose-950' },
  { id: 'c-01-3', date: '2026-09-01', time: '10:41 PM', title: 'Boss enrage at 2% HP', category: 'CLUTCH', game: 'The Elder Scrolls', type: 'video', description: 'Downed it with one hit left in the tank.', tone: 'from-lime-300/30 via-slate-950 to-green-950' },
  { id: 'c-02-1', date: '2026-09-02', time: '7:02 PM', title: 'Frame-perfect parry', category: 'COOL', game: 'The Elder Scrolls', type: 'video', description: 'The clip farm is officially open.', tone: 'from-cyan-300/30 via-slate-950 to-blue-950' },
  { id: 'c-02-2', date: '2026-09-02', time: '9:24 PM', title: 'Moon walked into lava', category: 'ODD', game: 'Cyberpunk 2077', type: 'image', description: 'Truly a one-of-one gameplay decision.', tone: 'from-yellow-300/25 via-slate-950 to-amber-950' },
  { id: 'c-02-3', date: '2026-09-02', time: '10:47 PM', title: 'Secret boss found', category: 'BOSS', game: 'Cyberpunk 2077', type: 'video', description: 'First discovery on stream, saved forever.', tone: 'from-emerald-300/30 via-slate-950 to-teal-950' },
];

// Clips the community made for the streamer — requested contributions saved as a favor
export const COMMUNITY_CLIPS = [
  { id: 'cc-1', contributor: 'NeoClipz', title: 'Full boss takedown', game: 'The Elder Scrolls', time: '9:47 PM', category: 'BOSS', note: 'Clipped for the highlight reel', tone: 'from-emerald-300/30 via-slate-950 to-teal-950' },
  { id: 'cc-2', contributor: 'PixelWitch', title: 'The reaction they missed', game: 'Cyberpunk 2077', time: '10:12 PM', category: 'FUNNY', note: 'Requested clip — saved as a favor', tone: 'from-pink-300/30 via-slate-950 to-rose-950' },
  { id: 'cc-3', contributor: 'ClipGoblin', title: 'Loot goblin moment', game: 'Destiny 2', time: '8:31 PM', category: 'LOOT', note: 'Community contribution', tone: 'from-violet-300/30 via-slate-950 to-indigo-950' },
  { id: 'cc-4', contributor: 'ToastFan22', title: '1 HP clutch save', game: 'Fallout', time: '11:02 PM', category: 'CLUTCH', note: 'They asked us to clip this one', tone: 'from-lime-300/30 via-slate-950 to-green-950' },
  { id: 'cc-5', contributor: 'MythicMuse', title: 'Cool angle on the dive', game: 'SMITE 2', time: '7:58 PM', category: 'COOL', note: 'Saved for the streamer', tone: 'from-cyan-300/30 via-slate-950 to-blue-950' },
  { id: 'cc-6', contributor: 'OddEyeCam', title: 'The weirdest NPC walk', game: 'The Elder Scrolls', time: '6:44 PM', category: 'ODD', note: 'Community pick of the week', tone: 'from-yellow-300/25 via-slate-950 to-amber-950' },
];
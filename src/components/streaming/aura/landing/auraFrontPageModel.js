import { normalizeText } from '../../hub/discoveryModel';
import { buildAuraDailyEdition } from './auraDailyModel';

const DAY = 86400000;
const topicKey = (value) => normalizeText(value).replace(/[^a-z0-9]/g, '');
export const AURA_TOPICS = [
  { id: 'irl', title: 'Out in the World', tag: '#IRL', description: 'Everyday adventures. A different point of view.', aliases: ['irl', 'in real life', 'travel', 'outdoors'], accent: '#8bc6bb' },
  { id: 'world', title: 'World Events', tag: '#WorldEvents', description: 'Live perspectives on what’s happening around us.', aliases: ['world events', 'world news', 'news', 'current events'], accent: '#92b9d9' },
  { id: 'philosophy', title: 'Big Questions', tag: '#Philosophy', description: 'Ideas worth sitting with. Conversations worth having.', aliases: ['philosophy', 'philosophical discussion'], accent: '#b7a3d6' },
  { id: 'faith', title: 'Faith & Reflection', tag: '#Faith', description: 'Scripture, spirituality, and thoughtful reflection.', aliases: ['faith', 'religion', 'spirituality', 'biblical', 'bible', 'theology'], accent: '#ccbd96' },
  { id: 'chat', title: 'The Open Conversation', tag: '#JustChatting', description: 'Pull up a chair. See where the conversation goes.', aliases: ['just chatting', 'discussion', 'discussions', 'current discussions', 'talking'], accent: '#a7c2d2' },
  { id: 'tech', title: 'What Comes Next', tag: '#TechAndFuture', description: 'Technology, new ideas, and the world we’re building.', aliases: ['tech', 'technology', 'tech and future', 'tech & future', 'science', 'future'], accent: '#83bfc9' },
];

// Match the broadcast's declared subjects, never a creator's bio or beliefs.
export function matchesAuraTopic(stream, id) {
  if (!id) return true;
  const topics = id === 'all' ? AURA_TOPICS : AURA_TOPICS.filter((topic) => topic.id === id);
  const values = [stream.category, ...(stream.broadcastTags || [])];
  if (stream.gameId?.startsWith('category:')) values.push(stream.game);
  if (stream.mode === 'talking') values.push('talking');
  const declared = new Set(values.filter(Boolean).map(topicKey));
  return topics.some((topic) => topic.aliases.some((alias) => declared.has(topicKey(alias))));
}

export function buildAuraMoments(raw = [], categories = [], now = Date.now()) {
  const seen = new Set();
  const shorts = raw.filter((video) => Number(video.duration) >= 1 && Number(video.duration) <= 180 && !seen.has(video.id) && seen.add(video.id));
  // Reuse publication and media checks from the public recording reader.
  return buildAuraDailyEdition({ videos: shorts }, categories, now, 12).videos;
}

export const AURA_GAME_LANES = [
  { id: 'releases', label: 'New Game Releases', description: 'Recent releases. Find your first look, live.', empty: 'No confirmed releases from the last 90 days are listed yet.' },
  { id: 'anticipated', label: 'Community Anticipated', description: 'What the community wants to watch next, from this week’s recent game votes.', empty: 'Community picks will appear as people vote for games this week.' },
  { id: 'missed', label: 'In Case You Missed It', description: 'Older worlds with more to discover. Pick up a story you passed by.', empty: 'More games will appear here as their release details are added.' },
  { id: 'all', label: 'All Games', description: 'The full directory. Choose a world and see who’s playing.', empty: 'Games will appear here as they join the directory.' },
];

function releaseTimestamp(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return 0;
  const timestamp = Date.parse(`${value}T00:00:00Z`);
  return Number.isFinite(timestamp) && new Date(timestamp).toISOString().startsWith(value) ? timestamp : 0;
}

export function buildAuraGameLanes(categories = [], ballots = [], now = Date.now()) {
  const votes = new Map(), seen = new Set();
  for (const ballot of ballots) {
    const created = Date.parse(ballot.created_date);
    if (!ballot.id || seen.has(ballot.id) || !Number.isFinite(created) || created > now || now - created > 7 * DAY) continue;
    seen.add(ballot.id);
    const key = normalizeText(ballot.game_name || ballot.game_key);
    if (key) votes.set(key, (votes.get(key) || 0) + 1);
  }
  const games = categories.filter((game) => !game.id.startsWith('category:')).map((game) => ({ ...game, releasedAt: releaseTimestamp(game.releaseDate), votes: votes.get(normalizeText(game.title)) || 0 }));
  const popularity = (a, b) => b.viewers - a.viewers || b.liveCount - a.liveCount || a.title.localeCompare(b.title);
  return {
    releases: games.filter((game) => game.releasedAt > 0 && game.releasedAt <= now && now - game.releasedAt <= 90 * DAY).sort((a, b) => b.releasedAt - a.releasedAt || popularity(a, b)),
    anticipated: games.filter((game) => game.votes > 0).sort((a, b) => b.votes - a.votes || popularity(a, b)),
    missed: games.filter((game) => game.releasedAt > 0 ? now - game.releasedAt > 90 * DAY : game.originalYear > 0 && game.originalYear < new Date(now).getUTCFullYear()).sort(popularity),
    all: games.sort(popularity),
  };
}

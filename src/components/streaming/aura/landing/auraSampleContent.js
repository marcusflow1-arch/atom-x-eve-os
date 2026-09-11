const photo = (id) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1200&q=85`;
const images = [photo('photo-1518709268805-4e9042af9f23'), photo('photo-1470770841072-f978cf4d019e'), photo('photo-1511512578047-dfb367046420'), photo('photo-1511512578047-dfb367046420')];
const sampleNote = 'This is temporary sample content for the Aura front-page preview. Names, stories, schedules, and audience figures are illustrative—not real broadcasts or announcements.';
export const fillAuraSamples = (real, samples, count) => [...real, ...samples.slice(0, Math.max(0, count - real.length))];
export function auraSampleStory(item) {
  return { ...item, kind: 'article', image: item.image || item.thumbnail, title: item.title || item.name, label: 'Sample template', source: 'Aura layout preview', description: item.description || item.tagline || sampleNote, content: item.content || `## A place for your next discovery\n\n${item.bio || item.description || item.title}\n\n${sampleNote}` };
}
export default function auraSampleContent(now) {
  const story = (id, title, description, index = 0, content = '') => ({ id: `aura-sample-${id}`, isSample: true, kind: 'article', title, description, image: images[index % images.length], label: 'Sample template', source: 'Aura layout preview', publishedAt: now, content: `${content || description}\n\n${sampleNote}` });
  const creators = [
    ['MoonlitAtlas', 'One more trail. One more discovery.', 'Open-world adventures', 'Slow journeys, hidden paths, and a chat that feels like a campfire.'],
    ['CozyCircuit', 'A quiet corner for a creative evening.', 'Cozy & creative', 'Building tiny worlds and big ideas—with room for everyone to join in.'],
    ['EchoSummit', 'The climb is better together.', 'Co-op adventures', 'Fresh challenges, close calls, and a crew that celebrates every little win.'],
  ].map(([name, title, game, tagline], index) => ({ id: `aura-sample-creator-${index}`, streamerId: `aura-sample-creator-${index}`, isSample: true, name, title, game, tagline, bio: tagline, thumbnail: images[index], avatar: images[index], viewers: [42, 68, 27][index], creatorAddedAt: now - 86400000, tags: [], previewUrl: '' }));
  const updates = [
    story('story-1', 'The communities that turn a stream into a place to belong', 'Behind every great channel is a familiar hello. Meet the moments that make a community feel like home.', 0, '## It starts with a hello\n\nA first-time viewer drops into chat. Someone remembers their name. A shared discovery becomes a weekly ritual.\n\n## More than what is on screen\n\nImagine a creator spotlight here: their story, the community they are building, and the small traditions that bring people back.'),
    story('story-2', 'A fresh perspective on your daily watch', 'A sample editorial about finding a different pace, a new voice, or a game outside your usual rotation.', 1),
    story('story-3', 'From first stream to familiar faces', 'An example creator diary: the small milestones worth celebrating along the way.', 2),
    story('story-4', 'This weekend, take the scenic route', 'An example weekend watch guide for curious players and unhurried explorers.', 3),
  ];
  const posts = [story('post-1', 'One final attempt. One unforgettable win.', 'A community achievement story would live here.', 2), story('post-2', 'The beginner’s guide we wish we had', 'A welcoming collection of tips from fellow players.', 1), story('post-3', 'What makes your favorite world feel alive?', 'An example conversation starter from the community.', 0)];
  const moments = ['The perfect last-second save', 'A hidden path worth finding', 'When the whole team clicks', 'A little chaos. A lot of laughter.'].map((title, index) => ({ ...story(`moment-${index}`, title, 'Sample moment card with placeholder artwork. A creator’s actual clip will appear here when available.', index), duration: 'Preview', views: [1200, 840, 2300, 670][index] }));
  const videos = ['An evening beyond the familiar', 'Building something from nothing', 'The adventure, from the beginning'].map((title, index) => ({ ...story(`replay-${index}`, title, 'Sample replay card with placeholder artwork—not a playable recording.', index), duration: 'Preview', views: [3400, 1800, 920][index] }));
  const schedules = creators.map((creator, index) => ({ ...story(`schedule-${index}`, ['Community adventure night', 'A cozy creative session', 'Team up for the next challenge'][index], 'An illustrative scheduled stream, not an actual booking.', index), creator: creator.name, avatar: creator.avatar, game: creator.game, startsAt: now + (index + 1) * 86400000 }));
  const games = ['Moonfall Valley', 'The Quiet Frontier', 'Beyond the Summit', 'Neon Playground'].map((title, index) => ({ ...story(`game-${index}`, title, 'Fictional game-world template for the discovery layout.', index), genre: 'Sample world', liveCount: 0, viewers: 0, releasedAt: now, votes: 0 }));
  return { creators, updates, posts, moments, videos, schedules, games };
}
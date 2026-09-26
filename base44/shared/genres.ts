export const GENRES = [
  { id:'shooter', name:'Shooter' }, { id:'action', name:'Action' }, { id:'fighting', name:'Fighting' },
  { id:'rpg', name:'RPG' }, { id:'mmorpg', name:'MMORPG' }, { id:'adventure', name:'Adventure' },
  { id:'scifi', name:'Sci-Fi' }, { id:'strategy', name:'Strategy' }, { id:'simulation', name:'Simulation' },
  { id:'sports', name:'Sports' }, { id:'racing', name:'Racing' }, { id:'puzzle', name:'Puzzle' },
  { id:'platformer', name:'Platformer' }, { id:'horror', name:'Horror' }, { id:'survival', name:'Survival' },
  { id:'sandbox', name:'Sandbox' },
] as const;

const aliases:Record<string,string> = {
  shooter:'shooter', shooting:'shooter', fps:'shooter',
  action:'action', fighting:'fighting', fighter:'fighting',
  rpg:'rpg', fantasy:'rpg', roleplaying:'rpg', 'role playing':'rpg',
  mmorpg:'mmorpg', mmo:'mmorpg',
  adventure:'adventure',
  scifi:'scifi', 'sci fi':'scifi', 'sci-fi':'scifi', sciencefiction:'scifi',
  strategy:'strategy', simulation:'simulation', sim:'simulation', sports:'sports', sport:'sports',
  racing:'racing', race:'racing', puzzle:'puzzle', platformer:'platformer', platform:'platformer',
  horror:'horror', survival:'survival', sandbox:'sandbox', 'open world':'sandbox', open_world:'sandbox', openworld:'sandbox',
};

export function genreIdFor(value:any) {
  const raw = String(value || '').trim().toLowerCase();
  if (!raw || raw === 'other') return null;
  const normalized = raw.replace(/_/g,' ').replace(/\s+/g,' ');
  return aliases[raw] || aliases[normalized] || (GENRES.some(g => g.id === raw) ? raw : null);
}

export function genreNameFor(value:any) {
  const id = genreIdFor(value);
  return GENRES.find(g => g.id === id)?.name || null;
}

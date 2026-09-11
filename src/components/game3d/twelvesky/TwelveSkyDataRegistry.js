const cache = new Map();
let catalogPromise = null;

async function fetchJson(url) {
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Failed to load ${url}: ${res.status}`);
  return res.json();
}

export async function loadTwelveSkyCatalog() {
  if (!catalogPromise) {
    catalogPromise = fetchJson('/twelvesky-data/catalog.json').catch((error) => {
      catalogPromise = null;
      throw error;
    });
  }
  return catalogPromise;
}

export async function loadTwelveSkyTable(name) {
  if (cache.has(name)) return cache.get(name);
  const catalog = await loadTwelveSkyCatalog();
  const entry = catalog?.tables?.[name];
  if (!entry?.file) throw new Error(`Unknown TwelveSky table: ${name}`);
  const promise = fetchJson(`/twelvesky-data/${entry.file}`).catch((error) => {
    cache.delete(name);
    throw error;
  });
  cache.set(name, promise);
  return promise;
}

export async function loadTwelveSkyCore() {
  const [levels, skills, skillGrades, monsters, quests, questRewards, zones] = await Promise.all([
    loadTwelveSkyTable('levels'),
    loadTwelveSkyTable('skills'),
    loadTwelveSkyTable('skillGrades'),
    loadTwelveSkyTable('monsters'),
    loadTwelveSkyTable('quests'),
    loadTwelveSkyTable('questRewards'),
    loadTwelveSkyTable('zones'),
  ]);
  return { levels, skills, skillGrades, monsters, quests, questRewards, zones };
}

export function clearTwelveSkyDataCache() {
  cache.clear();
  catalogPromise = null;
}

// Fenrir seed conventions used by the original data:
// Skill Type 1 = utility/support, 2 = active attack, 3 = buff/passive family.
// AttackType 2/3/4 map naturally to single / multi / area attack families in
// the current seed set (TotalHitNumber and ValidRadius confirm the pattern).
export function classifyFenrirSkill(skill) {
  const attackType = Number(skill?.AttackType || 0);
  if (Number(skill?.Type) !== 2) return 'utility';
  if (attackType === 2) return 'single';
  if (attackType === 3) return 'multi';
  if (attackType === 4) return 'area';
  return 'attack';
}

export function getFenrirSkillRange(skill) {
  return Math.max(0, Number(skill?.ValidRadius || 0));
}

export function getFenrirSkillHitCount(skill) {
  return Math.max(1, Number(skill?.TotalHitNumber || 1));
}

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

type AnyObj = Record<string, any>;
const json = (body: unknown, status = 200) => Response.json(body, { status });
const normalize = (value: any) => String(value || '').trim().toLowerCase();

const DEFAULT_SKILL_SETS = [
  { id: 'skill-set-1', name: 'Genre I', genre: '', order: 0 },
  { id: 'skill-set-2', name: 'Genre II', genre: '', order: 1 },
  { id: 'skill-set-3', name: 'Genre III', genre: '', order: 2 },
];

const snapshotCard = (card: AnyObj | null) => card ? ({
  id: card.id,
  user_card_id: card.id,
  card_name: card.card_name || 'Unnamed Skill',
  title: card.card_name || 'Unnamed Skill',
  card_type: card.card_type || 'Ability',
  type: String(card.card_type || 'Ability').toLowerCase(),
  card_rarity: card.card_rarity || 'Common',
  rarity: card.card_rarity || 'Common',
  card_image: card.card_image || '',
  image: card.card_image || '',
  game_name: card.game_name || '',
  game_id: card.game_id || '',
  genre: card.genre || '',
  showcaseOnly: true,
}) : null;

async function ensureSkillSets(base44: any, userId: string) {
  const svc = base44.asServiceRole.entities;
  let rows = await svc.Loadout.filter({ user_id: userId, loadout_type: 'skills' }, 'created_date', 20);

  if (!rows.length) {
    const first = DEFAULT_SKILL_SETS[0];
    rows = [await svc.Loadout.create({
      user_id: userId,
      name: first.name,
      description: 'Persistent four-slot Luna Skill Book genre row.',
      loadout_type: 'skills',
      game_id: '',
      genre: '',
      equipped_items: {},
      skill_slots: {},
      skill_set_id: first.id,
      skill_set_name: first.name,
      skill_set_genre: first.genre,
      skill_set_order: first.order,
      jawan_id: 'jawan-1',
      jawan_name: 'Jawan I',
      jawan_role: 'Balanced',
      is_active: true,
      tags: ['Luna', 'Skill Book', 'Genre Set'],
    })];
  }

  const ordered = [...rows].sort((a: AnyObj, b: AnyObj) => String(a.created_date || '').localeCompare(String(b.created_date || '')));
  for (let i = 0; i < Math.min(ordered.length, DEFAULT_SKILL_SETS.length); i += 1) {
    const row = ordered[i];
    const fallback = DEFAULT_SKILL_SETS[i];
    const patch: AnyObj = {};
    if (!row.skill_set_id) patch.skill_set_id = fallback.id;
    if (!row.skill_set_name) patch.skill_set_name = fallback.name;
    if (row.skill_set_genre === undefined || row.skill_set_genre === null) patch.skill_set_genre = row.genre || fallback.genre;
    if (!Number.isFinite(Number(row.skill_set_order))) patch.skill_set_order = fallback.order;
    if (!row.jawan_id) patch.jawan_id = 'jawan-' + (i + 1);
    if (!row.jawan_name) patch.jawan_name = 'Jawan ' + ['I', 'II', 'III'][i];
    if (!row.jawan_role) patch.jawan_role = ['Balanced', 'Assault', 'Guard'][i];
    if (Object.keys(patch).length) await svc.Loadout.update(row.id, patch);
  }

  rows = await svc.Loadout.filter({ user_id: userId, loadout_type: 'skills' }, 'created_date', 20);
  const existingIds = new Set(rows.map((r: AnyObj) => String(r.skill_set_id || '')));
  for (const preset of DEFAULT_SKILL_SETS) {
    if (existingIds.has(preset.id)) continue;
    const index = preset.order;
    rows.push(await svc.Loadout.create({
      user_id: userId,
      name: preset.name,
      description: 'Persistent four-slot Luna Skill Book genre row.',
      loadout_type: 'skills',
      game_id: '',
      genre: '',
      equipped_items: {},
      skill_slots: {},
      skill_set_id: preset.id,
      skill_set_name: preset.name,
      skill_set_genre: preset.genre,
      skill_set_order: preset.order,
      jawan_id: 'jawan-' + (index + 1),
      jawan_name: 'Jawan ' + ['I', 'II', 'III'][index],
      jawan_role: ['Balanced', 'Assault', 'Guard'][index],
      is_active: false,
      tags: ['Luna', 'Skill Book', 'Genre Set'],
    }));
  }

  rows = await svc.Loadout.filter({ user_id: userId, loadout_type: 'skills' }, 'created_date', 20);
  rows = rows
    .filter((row: AnyObj) => DEFAULT_SKILL_SETS.some((set) => set.id === row.skill_set_id))
    .sort((a: AnyObj, b: AnyObj) => Number(a.skill_set_order || 0) - Number(b.skill_set_order || 0));
  let active = rows.find((r: AnyObj) => r.is_active);
  if (!active) {
    active = rows[0];
    if (active) await svc.Loadout.update(active.id, { is_active: true });
  }
  return { rows, active: active || rows[0] || null };
}

async function buildState(base44: any, user: AnyObj) {
  const svc = base44.asServiceRole.entities;
  const { rows: loadouts, active } = await ensureSkillSets(base44, user.id);
  const [ownedCards, achievements, games, progressions] = await Promise.all([
    svc.UserCard.filter({ user_id: user.id }, '-created_date', 1000),
    svc.Achievement.list('-created_date', 1500),
    svc.Game.list('-created_date', 750),
    svc.CardProgression.filter({ user_id: user.id }, '-updated_date', 1500).catch(() => []),
  ]);

  const ownedSkills = (ownedCards || []).filter((card: AnyObj) => card.card_type === 'Ability');
  const abilityAchievements = (achievements || []).filter((achievement: AnyObj) => achievement.category === 'ability');
  const progressByUserCard = new Map<string, AnyObj>();
  for (const p of progressions || []) if (p.user_card_id) progressByUserCard.set(String(p.user_card_id), p);

  const ownedByGameAndName = new Map<string, AnyObj>();
  for (const card of ownedSkills) {
    const key = normalize(card.game_name) + '::' + normalize(card.card_name);
    if (!ownedByGameAndName.has(key)) ownedByGameAndName.set(key, card);
  }

  const catalog: AnyObj[] = [];
  const seenOwned = new Set<string>();
  for (const achievement of abilityAchievements) {
    const skillName = achievement?.reward?.name || achievement.title || 'Ability';
    const key = normalize(achievement.game) + '::' + normalize(skillName);
    const owned = ownedByGameAndName.get(key) || null;
    if (owned) seenOwned.add(String(owned.id));
    const progression = owned ? progressByUserCard.get(String(owned.id)) || null : null;
    catalog.push({
      id: achievement.id,
      achievement_id: achievement.id,
      title: skillName,
      description: achievement.description || achievement.unlock_condition || '',
      game_name: achievement.game || owned?.game_name || '',
      game_id: owned?.game_id || '',
      genre: owned?.genre || '',
      rarity: achievement.rarity === 'Mythical' ? 'Mythic' : (achievement.rarity || owned?.card_rarity || 'Common'),
      image: owned?.card_image || achievement?.reward?.image_url || achievement?.reward?.image || '',
      icon: achievement.icon || '',
      unlock_condition: achievement.unlock_condition || '',
      owned: Boolean(owned),
      user_card_id: owned?.id || null,
      card: owned ? snapshotCard(owned) : null,
      progression: progression ? {
        level: Number(progression.level || 1), xp: Number(progression.xp || 0),
        xp_to_next: Number(progression.xp_to_next || 0), stage: Number(progression.stage || 1),
        stars: Number(progression.stars || 1), ascension: Number(progression.ascension || 0),
        power_score: Number(progression.power_score || 0), active_perks: progression.active_perks || [],
      } : null,
    });
  }

  for (const owned of ownedSkills) {
    if (seenOwned.has(String(owned.id))) continue;
    const progression = progressByUserCard.get(String(owned.id)) || null;
    catalog.push({
      id: 'owned:' + owned.id,
      achievement_id: progression?.achievement_id || '',
      title: owned.card_name || 'Ability',
      description: '',
      game_name: owned.game_name || '',
      game_id: owned.game_id || '',
      genre: owned.genre || '',
      rarity: owned.card_rarity || 'Common',
      image: owned.card_image || '',
      icon: '',
      unlock_condition: '',
      owned: true,
      user_card_id: owned.id,
      card: snapshotCard(owned),
      progression: progression ? {
        level: Number(progression.level || 1), xp: Number(progression.xp || 0),
        xp_to_next: Number(progression.xp_to_next || 0), stage: Number(progression.stage || 1),
        stars: Number(progression.stars || 1), ascension: Number(progression.ascension || 0),
        power_score: Number(progression.power_score || 0), active_perks: progression.active_perks || [],
      } : null,
    });
  }

  const gameById = new Map((games || []).map((game: AnyObj) => [String(game.id), game]));
  const gameByName = new Map((games || []).map((game: AnyObj) => [normalize(game.title || game.name), game]));
  const grouped = new Map<string, AnyObj>();
  for (const skill of catalog) {
    const title = skill.game_name || 'Unknown Game';
    const key = normalize(title);
    const game = (skill.game_id && gameById.get(String(skill.game_id))) || gameByName.get(key) || null;
    if (!grouped.has(key)) grouped.set(key, {
      key, id: game?.id || skill.game_id || '', title,
      genre: game?.genre || skill.genre || 'Uncategorized',
      image: game?.cover_image || game?.cover || game?.banner_image || game?.image || '',
      total_skills: 0, owned_skills: 0,
    });
    const row = grouped.get(key);
    row.total_skills += 1;
    if (skill.owned) row.owned_skills += 1;
  }

  const ownedById = new Map(ownedSkills.map((card: AnyObj) => [String(card.id), card]));
  const serializeLoadout = (loadout: AnyObj) => {
    const slotIds = loadout?.skill_slots || {};
    const slots = Array.from({ length: 4 }, (_, index) => {
      const cardId = slotIds[String(index)] || slotIds[index];
      return { index, user_card_id: cardId || null, card: cardId ? snapshotCard(ownedById.get(String(cardId)) || null) : null };
    });
    return {
      id: loadout.id,
      name: loadout.name,
      skill_set_id: loadout.skill_set_id || '',
      skill_set_name: loadout.skill_set_name || loadout.name || 'Genre Set',
      skill_set_genre: loadout.skill_set_genre || loadout.genre || '',
      skill_set_order: Number(loadout.skill_set_order || 0),
      jawan_id: loadout.jawan_id || '',
      jawan_name: loadout.jawan_name || 'Jawan',
      jawan_role: loadout.jawan_role || 'Balanced',
      is_active: Boolean(loadout.is_active),
      skill_slots: loadout.skill_slots || {},
      slots,
    };
  };

  const skillSets = loadouts.map(serializeLoadout);
  const activeLoadout = active ? serializeLoadout(active) : skillSets[0];

  return {
    success: true,
    loadout: activeLoadout,
    skill_sets: skillSets,
    active_skill_set_id: activeLoadout?.skill_set_id || '',
    jawans: skillSets,
    active_jawan_id: activeLoadout?.jawan_id || '',
    games: [...grouped.values()].sort((a, b) => a.title.localeCompare(b.title)),
    skills: catalog.sort((a, b) => {
      const gameCompare = String(a.game_name).localeCompare(String(b.game_name));
      if (gameCompare) return gameCompare;
      if (a.owned !== b.owned) return a.owned ? -1 : 1;
      return String(a.title).localeCompare(String(b.title));
    }),
  };
}

async function activeLoadout(base44: any, userId: string) {
  const { rows, active } = await ensureSkillSets(base44, userId);
  return active || rows[0];
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return json({ error: 'Unauthorized' }, 401);
    const body = await req.json().catch(() => ({}));
    const action = String(body?.action || 'getState');
    const data = body?.data || {};
    const svc = base44.asServiceRole.entities;

    if (action === 'getState') return json(await buildState(base44, user));

    if (action === 'selectSkillSet' || action === 'selectJawan') {
      const skillSetId = String(data.skill_set_id || '');
      const legacyJawanId = String(data.jawan_id || '');
      const { rows } = await ensureSkillSets(base44, user.id);
      const selected = rows.find((r: AnyObj) => skillSetId
        ? String(r.skill_set_id) === skillSetId
        : String(r.jawan_id) === legacyJawanId);
      if (!selected) return json({ error: 'Skill set not found' }, 404);
      for (const row of rows) {
        const next = String(row.id) === String(selected.id);
        if (Boolean(row.is_active) !== next) await svc.Loadout.update(row.id, { is_active: next });
      }
      return json(await buildState(base44, user));
    }

    const loadout = await activeLoadout(base44, user.id);
    if (!loadout) return json({ error: 'No active skill set' }, 404);

    if (action === 'equip') {
      const slot = Number(data.slot);
      const userCardId = String(data.user_card_id || '').trim();
      if (!Number.isInteger(slot) || slot < 0 || slot > 3) return json({ error: 'Skill slot must be between 0 and 3' }, 400);
      if (!userCardId) return json({ error: 'Owned skill card is required' }, 400);
      const card = await svc.UserCard.get(userCardId).catch(() => null);
      if (!card || String(card.user_id) !== String(user.id)) return json({ error: 'Skill card is not owned by this user' }, 404);
      if (card.card_type !== 'Ability') return json({ error: 'Only Ability cards can be equipped in Skill Book slots' }, 400);
      if (card.trade_status === 'locked_in_trade') return json({ error: 'That skill card is locked in a trade' }, 409);

      const previous = { ...(loadout.skill_slots || {}) };
      const oldCardId = previous[String(slot)] || null;
      for (const [key, value] of Object.entries(previous)) if (String(value) === userCardId) delete previous[key];
      previous[String(slot)] = userCardId;
      await svc.Loadout.update(loadout.id, { skill_slots: previous, is_active: true });
      await svc.UserCard.update(card.id, { is_equipped: true });
      if (oldCardId && String(oldCardId) !== userCardId) {
        const usedElsewhere = (await svc.Loadout.filter({ user_id: user.id, loadout_type: 'skills' }, '-created_date', 20))
          .some((r: AnyObj) => Object.values(r.skill_slots || {}).some((v: any) => String(v) === String(oldCardId)));
        if (!usedElsewhere) {
          const oldCard = await svc.UserCard.get(String(oldCardId)).catch(() => null);
          if (oldCard) await svc.UserCard.update(oldCard.id, { is_equipped: false });
        }
      }
      return json(await buildState(base44, user));
    }

    if (action === 'unequip') {
      const slot = Number(data.slot);
      if (!Number.isInteger(slot) || slot < 0 || slot > 3) return json({ error: 'Skill slot must be between 0 and 3' }, 400);
      const next = { ...(loadout.skill_slots || {}) };
      const oldCardId = next[String(slot)] || null;
      delete next[String(slot)];
      await svc.Loadout.update(loadout.id, { skill_slots: next, is_active: true });
      if (oldCardId) {
        const usedElsewhere = (await svc.Loadout.filter({ user_id: user.id, loadout_type: 'skills' }, '-created_date', 20))
          .some((r: AnyObj) => Object.values(r.skill_slots || {}).some((v: any) => String(v) === String(oldCardId)));
        if (!usedElsewhere) {
          const oldCard = await svc.UserCard.get(String(oldCardId)).catch(() => null);
          if (oldCard) await svc.UserCard.update(oldCard.id, { is_equipped: false });
        }
      }
      return json(await buildState(base44, user));
    }

    if (action === 'clear') {
      const oldIds = Object.values(loadout.skill_slots || {}).map(String).filter(Boolean);
      await svc.Loadout.update(loadout.id, { skill_slots: {}, is_active: true });
      const otherLoadouts = (await svc.Loadout.filter({ user_id: user.id, loadout_type: 'skills' }, '-created_date', 20))
        .filter((row: AnyObj) => String(row.id) !== String(loadout.id));
      for (const oldCardId of oldIds) {
        const usedElsewhere = otherLoadouts.some((row: AnyObj) => Object.values(row.skill_slots || {}).some((value: any) => String(value) === oldCardId));
        if (!usedElsewhere) {
          const oldCard = await svc.UserCard.get(oldCardId).catch(() => null);
          if (oldCard && String(oldCard.user_id) === String(user.id)) await svc.UserCard.update(oldCard.id, { is_equipped: false });
        }
      }
      return json(await buildState(base44, user));
    }

    return json({ error: 'Unknown Skill Book action' }, 400);
  } catch (error) {
    console.error('skillBookLoadout failed', error);
    return json({ error: error instanceof Error ? error.message : 'Skill Book request failed' }, 500);
  }
});
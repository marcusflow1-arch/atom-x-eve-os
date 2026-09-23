import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

type AnyObj = Record<string, any>;
const json = (body: unknown, status = 200) => Response.json(body, { status });
const normalize = (value: any) => String(value || '').trim().toLowerCase();
const ICHIGO_CARD_IMAGE = 'data:image/jpeg;base64,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';

async function ensureDemoAbility(svc: any, userId: string) {
  const rows = await svc.UserCard.filter({ user_id: userId, card_name: 'Ichigo Kurosaki - Getsuga Tenshō' }, '-created_date', 5);
  if (rows.length) {
    const current = rows[0];
    if (current.card_image !== ICHIGO_CARD_IMAGE) await svc.UserCard.update(current.id, { card_image: ICHIGO_CARD_IMAGE });
    return current;
  }
  return svc.UserCard.create({
    user_id: userId,
    card_type: 'Ability',
    card_name: 'Ichigo Kurosaki - Getsuga Tenshō',
    card_rarity: 'Unique',
    card_image: ICHIGO_CARD_IMAGE,
    game_name: 'Bleach',
    genre: 'Action RPG',
    acquisition_method: 'unlocked',
    unlocked_date: new Date().toISOString(),
    is_equipped: false,
    trade_status: 'available',
  });
}

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
  await ensureDemoAbility(svc, user.id);
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
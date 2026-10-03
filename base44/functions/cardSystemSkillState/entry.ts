import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { cardMasteryState, normalizeProgression, playableTierName } from '../../shared/cardSystem.ts';

type Row = Record<string, any>;
const json = (body: unknown, status = 200) => Response.json(body, { status });
const lower = (value: any) => String(value || '').trim().toLowerCase();

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);
    if (!user) return json({ error: 'Unauthorized' }, 401);
    const body = await req.json().catch(() => ({}));
    if (String(body?.action || 'getState') !== 'getState') return json({ error: 'Unknown Card System Skill Book action' }, 400);

    const svc = base44.asServiceRole.entities;
    const [cards, progressions] = await Promise.all([
      svc.UserCard.filter({ user_id: user.id }, '-created_date', 1500),
      svc.CardProgression.filter({ user_id: user.id }, '-updated_date', 1500),
    ]);
    const progressionByCard = new Map<string, Row>();
    for (const row of progressions || []) {
      if (!row?.user_card_id || progressionByCard.has(String(row.user_card_id))) continue;
      progressionByCard.set(String(row.user_card_id), row);
    }

    const byUserCardId: Record<string, Row> = {};
    for (const card of cards || []) {
      if (lower(card.card_type) !== 'ability' || Number(card.quantity ?? 1) < 1) continue;
      const raw = progressionByCard.get(String(card.id)) || null;
      const p = normalizeProgression(raw);
      const mastery = cardMasteryState(p);
      byUserCardId[String(card.id)] = {
        system_version: 2,
        user_card_id: String(card.id),
        passport_id: String(raw?.passport_id || card.passport_id || ''),
        playable_tier: playableTierName(card),
        enhancement_percent: Number(p.enhancement_percent || 0),
        ascension: Number(p.ascension || 0),
        stack_level: Number(p.stack_level || 1),
        permanent_stats: p.permanent_stats || {},
        current_cycle_stats: p.current_cycle_stats || {},
        mastery_visual: p.mastery_visual || mastery.visual_tier,
        mastery,
        power_score: Number(raw?.power_score || 0),
        migrated_from_legacy: Boolean(p.migrated_from_legacy),
      };
    }

    return json({ success: true, system_version: 2, by_user_card_id: byUserCardId });
  } catch (error) {
    console.error('cardSystemSkillState failed', error);
    return json({ error: error instanceof Error ? error.message : 'Card System Skill Book state unavailable' }, 500);
  }
});

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';
import { ownsItem } from '../../shared/entitlements.ts';

type AnyObj = Record<string, any>;
const json = (body: unknown, status = 200) => Response.json(body, { status });

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return json({ error: 'Unauthorized' }, 401);
    const body = await req.json().catch(() => ({}));
    const action = String(body.action || 'list');
    const data = body.data || body;
    const svc = base44.asServiceRole.entities;

    if (action === 'list') {
      const gameId = String(data.game_id || '');
      if (!gameId) return json({ error: 'game_id is required' }, 400);
      const reviews = await svc.GameReview.filter({ game_id: gameId }, '-created_date', 500);
      const canReview = await ownsItem(svc, user.id, 'game', gameId);
      return json({ success: true, reviews, can_review: canReview });
    }

    if (action === 'create') {
      const gameId = String(data.game_id || '');
      if (!gameId || !(await ownsItem(svc, user.id, 'game', gameId))) return json({ error: 'You must own this game to review it' }, 403);
      const rating = Number(data.rating);
      const bodyText = String(data.body || '').trim();
      if (!Number.isInteger(rating) || rating < 1 || rating > 5 || !bodyText || bodyText.length > 5000) return json({ error: 'A 1–5 rating and review text are required' }, 400);
      const existing = await svc.GameReview.filter({ game_id: gameId, user_id: user.id }, '-created_date', 1);
      if (existing[0]) return json({ error: 'You already reviewed this game' }, 409);
      const review = await svc.GameReview.create({ game_id: gameId, user_id: user.id, author_name: user.full_name || user.username || user.email?.split('@')[0] || 'Player', rating, body: bodyText, created_date: new Date().toISOString() });
      return json({ success: true, review });
    }

    if (action === 'update') {
      const review = await svc.GameReview.get(String(data.review_id || '')).catch(() => null);
      if (!review || (String(review.user_id) !== String(user.id) && user.role !== 'admin')) return json({ error: 'Review not found' }, 404);
      const patch: AnyObj = {};
      if (data.rating !== undefined) {
        const rating = Number(data.rating);
        if (!Number.isInteger(rating) || rating < 1 || rating > 5) return json({ error: 'Rating must be 1–5' }, 400);
        patch.rating = rating;
      }
      if (data.body !== undefined) {
        const text = String(data.body || '').trim();
        if (!text || text.length > 5000) return json({ error: 'Review text is required' }, 400);
        patch.body = text;
      }
      return json({ success: true, review: await svc.GameReview.update(review.id, patch) });
    }

    if (action === 'delete') {
      const review = await svc.GameReview.get(String(data.review_id || '')).catch(() => null);
      if (!review || (String(review.user_id) !== String(user.id) && user.role !== 'admin')) return json({ error: 'Review not found' }, 404);
      await svc.GameReview.delete(review.id);
      return json({ success: true });
    }

    return json({ error: 'Unknown review action' }, 400);
  } catch (error) {
    console.error('gameReviews failed', error);
    return json({ error: error instanceof Error ? error.message : 'Review request failed' }, 500);
  }
});

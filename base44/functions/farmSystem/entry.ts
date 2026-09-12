import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json',
};

const FARM_POST_TYPES = new Set(['help', 'question', 'tip', 'farming_guide', 'achievement_guide', 'discussion', 'guide']);
const FARM_COMMUNITIES = new Set(['farming', 'achievements', 'tips', 'question', 'discussions', 'guide']);
const ROUTE_TYPES = new Set(['resource', 'boss', 'xp', 'achievement', 'speedrun', 'other']);
const DIFFICULTIES = new Set(['easy', 'medium', 'hard', 'extreme']);

const clean = (value: unknown, max = 10000) => String(value ?? '').trim().slice(0, max);
const displayName = (user: any) => clean(user?.full_name || user?.username || user?.email?.split('@')?.[0] || 'Player', 80);
const json = (body: any, status = 200) => new Response(JSON.stringify(body), { status, headers: corsHeaders });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return json({ success: false, error: 'Unauthorized' }, 401);

    const payload = await req.json().catch(() => ({}));
    const action = payload?.action;
    const data = payload?.data || {};

    const activeRestriction = async () => {
      const rows = await base44.asServiceRole.entities.ForumRestriction.filter({ user_id: user.id, active: true }, '-created_date', 20);
      const now = Date.now();
      for (const row of rows) {
        if (row.expires_at && new Date(row.expires_at).getTime() <= now) {
          await base44.asServiceRole.entities.ForumRestriction.update(row.id, { active: false });
          continue;
        }
        return row;
      }
      return null;
    };

    const assertCanParticipate = async () => {
      const restriction = await activeRestriction();
      if (!restriction) return;
      const until = restriction.expires_at ? ` until ${new Date(restriction.expires_at).toISOString()}` : '';
      throw new Error(`Community ${restriction.type} active${until}${restriction.reason ? `: ${restriction.reason}` : ''}`);
    };

    if (action === 'session') {
      return json({ success: true, restriction: await activeRestriction() });
    }

    if (action === 'create_post') {
      await assertCanParticipate();
      const title = clean(data.title, 180);
      const content = clean(data.content, 40000);
      if (title.length < 3) return json({ success: false, error: 'Title must be at least 3 characters.' }, 400);
      if (content.length < 2) return json({ success: false, error: 'Post content is required.' }, 400);

      const type = FARM_POST_TYPES.has(data.type) ? data.type : 'discussion';
      const community = FARM_COMMUNITIES.has(data.community) ? data.community : (type === 'help' || type === 'question' ? 'question' : type === 'achievement_guide' ? 'achievements' : type === 'tip' ? 'tips' : 'farming');
      const tags = Array.isArray(data.tags) ? data.tags.map((tag: any) => clean(tag, 28)).filter(Boolean).slice(0, 8) : [];
      const post = await base44.asServiceRole.entities.Post.create({
        title,
        content,
        type,
        community,
        game_title: clean(data.game_title, 120),
        genre: clean(data.genre, 80),
        image_url: clean(data.image_url, 1000),
        achievement_id: clean(data.achievement_id, 160),
        tags,
        guide_kind: type === 'achievement_guide' ? 'achievement' : type === 'farming_guide' ? 'farming' : type === 'tip' ? 'quick_tip' : clean(data.guide_kind, 40) || 'none',
        difficulty: clean(data.difficulty, 30) || 'any',
        user_id: user.id,
        author_name: displayName(user),
        status: 'published',
        is_locked: false,
        is_pinned: false,
        view_count: 0,
        score: 1,
        is_farm_hub: true,
      });
      return json({ success: true, post });
    }

    if (action === 'create_route') {
      await assertCanParticipate();
      const title = clean(data.title, 180);
      if (title.length < 3) return json({ success: false, error: 'Route title must be at least 3 characters.' }, 400);
      const routeType = ROUTE_TYPES.has(data.route_type) ? data.route_type : 'resource';
      const difficulty = DIFFICULTIES.has(data.difficulty) ? data.difficulty : 'medium';
      const route = await base44.asServiceRole.entities.FarmRoute.create({
        game_id: clean(data.game_id, 160),
        gameId: clean(data.game_id, 160),
        title,
        description: clean(data.description, 10000),
        video_url: clean(data.video_url, 1000),
        tactics: clean(data.tactics, 20000),
        route_type: routeType,
        difficulty,
        visibility: data.visibility === 'clan' ? 'clan' : 'public',
        clan_id: clean(data.clan_id, 160),
        clanId: clean(data.clan_id, 160),
        author_id: user.id,
        authorId: user.id,
        author_name: displayName(user),
        authorName: displayName(user),
        imageUrl: clean(data.image_url, 1000),
        yields: clean(data.yields, 240),
      });
      return json({ success: true, route });
    }

    return json({ success: false, error: 'Unknown Farm Hub action.' }, 400);
  } catch (error) {
    console.error('farmSystem error', error);
    return json({ success: false, error: error?.message || 'Farm Hub request failed.' }, 400);
  }
});

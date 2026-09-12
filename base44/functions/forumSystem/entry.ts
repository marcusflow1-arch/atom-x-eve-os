import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json',
};

const EMOJIS = new Set(['👍', '❤️', '🔥', '😂', '💡', '🎯']);
const POST_TYPES = new Set(['game_review', 'game_discussion', 'general_discussion', 'achievement_discussion', 'achievement_share', 'achievement_guide', 'farming_guide', 'full_guide', 'challenge', 'bug', 'tip', 'help', 'discussion', 'guide']);
const COMMUNITIES = new Set(['general', 'feedback', 'gameplay', 'bugs', 'reviews', 'discussions', 'guide', 'tips', 'question', 'achievements', 'farming', 'recruitment', 'events', 'content']);

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

    const moderatorRows = await base44.asServiceRole.entities.ForumModerator.filter({ user_id: user.id, active: true });
    const isAdmin = user.role === 'admin';
    const isModerator = isAdmin || moderatorRows.length > 0;

    const activeRestriction = async (userId: string) => {
      const rows = await base44.asServiceRole.entities.ForumRestriction.filter({ user_id: userId, active: true }, '-created_date', 20);
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
      const restriction = await activeRestriction(user.id);
      if (restriction) {
        const until = restriction.expires_at ? ` until ${new Date(restriction.expires_at).toISOString()}` : '';
        throw new Error(`Forum ${restriction.type} active${until}${restriction.reason ? `: ${restriction.reason}` : ''}`);
      }
    };

    const owns = (record: any) => String(record?.user_id || '') === String(user.id) || (!record?.user_id && user.email && record?.created_by === user.email);
    const requireModerator = () => {
      if (!isModerator) throw new Error('Moderator permission required');
    };

    if (action === 'session') {
      return json({ success: true, isModerator, isAdmin, restriction: await activeRestriction(user.id) });
    }

    if (action === 'create_post') {
      await assertCanParticipate();
      const title = clean(data.title, 180);
      const content = clean(data.content, 40000);
      if (title.length < 3) return json({ success: false, error: 'Title must be at least 3 characters.' }, 400);
      if (content.length < 2) return json({ success: false, error: 'Post content is required.' }, 400);
      const type = POST_TYPES.has(data.type) ? data.type : 'discussion';
      const community = COMMUNITIES.has(data.community) ? data.community : 'general';
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
        guide_kind: clean(data.guide_kind, 40) || 'none',
        difficulty: clean(data.difficulty, 30) || 'any',
        user_id: user.id,
        author_name: displayName(user),
        status: 'published',
        is_locked: false,
        is_pinned: false,
        view_count: 0,
        score: 1,
        is_farm_hub: false,
      });
      return json({ success: true, post });
    }

    if (action === 'edit_post') {
      await assertCanParticipate();
      const post = await base44.asServiceRole.entities.Post.get(data.post_id);
      if (!post) return json({ success: false, error: 'Post not found.' }, 404);
      if (!owns(post) && !isModerator) return json({ success: false, error: 'Not allowed to edit this post.' }, 403);
      const updates: any = { edited_at: new Date().toISOString() };
      if (data.title !== undefined) updates.title = clean(data.title, 180);
      if (data.content !== undefined) updates.content = clean(data.content, 40000);
      if (Array.isArray(data.tags)) updates.tags = data.tags.map((tag: any) => clean(tag, 28)).filter(Boolean).slice(0, 8);
      if (data.guide_kind !== undefined) updates.guide_kind = clean(data.guide_kind, 40) || 'none';
      if (data.difficulty !== undefined) updates.difficulty = clean(data.difficulty, 30) || 'any';
      await base44.asServiceRole.entities.Post.update(post.id, updates);
      return json({ success: true });
    }

    if (action === 'delete_post') {
      const post = await base44.asServiceRole.entities.Post.get(data.post_id);
      if (!post) return json({ success: false, error: 'Post not found.' }, 404);
      if (!owns(post) && !isModerator) return json({ success: false, error: 'You can only delete your own posts.' }, 403);
      const comments = await base44.asServiceRole.entities.Comment.filter({ target_id: post.id, target_type: 'post' });
      for (const comment of comments) {
        const reactions = await base44.asServiceRole.entities.ForumReaction.filter({ target_type: 'comment', target_id: comment.id });
        for (const reaction of reactions) await base44.asServiceRole.entities.ForumReaction.delete(reaction.id);
        await base44.asServiceRole.entities.Comment.delete(comment.id);
      }
      const reactions = await base44.asServiceRole.entities.ForumReaction.filter({ target_type: 'post', target_id: post.id });
      for (const reaction of reactions) await base44.asServiceRole.entities.ForumReaction.delete(reaction.id);
      const reports = await base44.asServiceRole.entities.ForumReport.filter({ target_type: 'post', target_id: post.id });
      for (const report of reports) await base44.asServiceRole.entities.ForumReport.delete(report.id);
      await base44.asServiceRole.entities.Post.delete(post.id);
      return json({ success: true });
    }

    if (action === 'view_post') {
      const post = await base44.asServiceRole.entities.Post.get(data.post_id);
      if (!post) return json({ success: false }, 404);
      await base44.asServiceRole.entities.Post.update(post.id, { view_count: Number(post.view_count || 0) + 1 });
      return json({ success: true });
    }

    if (action === 'add_comment') {
      await assertCanParticipate();
      const content = clean(data.content, 5000);
      if (!content) return json({ success: false, error: 'Comment cannot be empty.' }, 400);
      const post = await base44.asServiceRole.entities.Post.get(data.post_id);
      if (!post || post.status === 'removed') return json({ success: false, error: 'Post unavailable.' }, 404);
      if (post.is_locked && !isModerator) return json({ success: false, error: 'This discussion is locked.' }, 403);
      let parentId = clean(data.parent_comment_id, 160);
      if (parentId) {
        const parent = await base44.asServiceRole.entities.Comment.get(parentId);
        if (!parent || parent.target_id !== post.id) parentId = '';
      }
      const comment = await base44.asServiceRole.entities.Comment.create({
        target_id: post.id,
        target_type: 'post',
        post_id: post.id,
        parent_comment_id: parentId,
        content,
        user_id: user.id,
        author_name: displayName(user),
        status: 'published',
        score: 1,
      });
      return json({ success: true, comment });
    }

    if (action === 'delete_comment') {
      const comment = await base44.asServiceRole.entities.Comment.get(data.comment_id);
      if (!comment) return json({ success: false, error: 'Comment not found.' }, 404);
      if (!owns(comment) && !isModerator) return json({ success: false, error: 'You can only delete your own comments.' }, 403);
      const children = await base44.asServiceRole.entities.Comment.filter({ parent_comment_id: comment.id });
      if (children.length) {
        await base44.asServiceRole.entities.Comment.update(comment.id, { content: '[deleted]', status: 'removed' });
      } else {
        const reactions = await base44.asServiceRole.entities.ForumReaction.filter({ target_type: 'comment', target_id: comment.id });
        for (const reaction of reactions) await base44.asServiceRole.entities.ForumReaction.delete(reaction.id);
        await base44.asServiceRole.entities.Comment.delete(comment.id);
      }
      return json({ success: true });
    }

    if (action === 'toggle_reaction') {
      await assertCanParticipate();
      const targetType = data.target_type === 'comment' ? 'comment' : 'post';
      const targetId = clean(data.target_id, 160);
      const emoji = clean(data.emoji, 8);
      if (!targetId || !EMOJIS.has(emoji)) return json({ success: false, error: 'Unsupported reaction.' }, 400);
      const existing = await base44.asServiceRole.entities.ForumReaction.filter({ target_type: targetType, target_id: targetId, user_id: user.id });
      const current = existing[0];
      if (current?.emoji === emoji) {
        await base44.asServiceRole.entities.ForumReaction.delete(current.id);
        return json({ success: true, active: false });
      }
      if (current) await base44.asServiceRole.entities.ForumReaction.update(current.id, { emoji });
      else await base44.asServiceRole.entities.ForumReaction.create({ target_type: targetType, target_id: targetId, user_id: user.id, emoji });
      for (const duplicate of existing.slice(1)) await base44.asServiceRole.entities.ForumReaction.delete(duplicate.id);
      return json({ success: true, active: true, emoji });
    }

    if (action === 'report') {
      const targetType = ['post', 'comment', 'user'].includes(data.target_type) ? data.target_type : 'post';
      const targetId = clean(data.target_id, 160);
      const reason = ['spam', 'harassment', 'hate', 'spoilers', 'misinformation', 'off_topic', 'other'].includes(data.reason) ? data.reason : 'other';
      if (!targetId) return json({ success: false, error: 'Report target required.' }, 400);
      const existing = await base44.asServiceRole.entities.ForumReport.filter({ target_type: targetType, target_id: targetId, reporter_user_id: user.id, status: 'open' });
      if (existing.length) return json({ success: true, duplicate: true });
      await base44.asServiceRole.entities.ForumReport.create({ target_type: targetType, target_id: targetId, reporter_user_id: user.id, reason, details: clean(data.details, 1000), status: 'open' });
      return json({ success: true });
    }

    if (action === 'moderate_post') {
      requireModerator();
      const post = await base44.asServiceRole.entities.Post.get(data.post_id);
      if (!post) return json({ success: false, error: 'Post not found.' }, 404);
      const operation = data.operation;
      const updates: any = {};
      if (operation === 'lock') updates.is_locked = true;
      else if (operation === 'unlock') updates.is_locked = false;
      else if (operation === 'pin') updates.is_pinned = true;
      else if (operation === 'unpin') updates.is_pinned = false;
      else if (operation === 'remove') { updates.status = 'removed'; updates.moderation_note = clean(data.reason, 500); }
      else if (operation === 'restore') { updates.status = 'published'; updates.moderation_note = ''; }
      else return json({ success: false, error: 'Unknown moderation operation.' }, 400);
      await base44.asServiceRole.entities.Post.update(post.id, updates);
      return json({ success: true });
    }

    if (action === 'restrict_user') {
      requireModerator();
      const targetUserId = clean(data.user_id, 160);
      if (!targetUserId || targetUserId === user.id) return json({ success: false, error: 'Invalid restriction target.' }, 400);
      const type = ['mute', 'suspend', 'ban'].includes(data.type) ? data.type : 'mute';
      const hours = Math.max(0, Math.min(Number(data.duration_hours || 24), 24 * 365));
      const expiresAt = type === 'ban' && !data.duration_hours ? '' : new Date(Date.now() + hours * 3600000).toISOString();
      const active = await base44.asServiceRole.entities.ForumRestriction.filter({ user_id: targetUserId, active: true });
      for (const row of active) await base44.asServiceRole.entities.ForumRestriction.update(row.id, { active: false });
      const restriction = await base44.asServiceRole.entities.ForumRestriction.create({ user_id: targetUserId, type, reason: clean(data.reason, 500), active: true, expires_at: expiresAt, created_by_moderator_id: user.id });
      return json({ success: true, restriction });
    }

    if (action === 'lift_restriction') {
      requireModerator();
      const rows = await base44.asServiceRole.entities.ForumRestriction.filter({ user_id: clean(data.user_id, 160), active: true });
      for (const row of rows) await base44.asServiceRole.entities.ForumRestriction.update(row.id, { active: false });
      return json({ success: true });
    }

    if (action === 'assign_moderator') {
      if (!isAdmin) return json({ success: false, error: 'Admin permission required.' }, 403);
      const targetUserId = clean(data.user_id, 160);
      if (!targetUserId) return json({ success: false, error: 'User id required.' }, 400);
      const rows = await base44.asServiceRole.entities.ForumModerator.filter({ user_id: targetUserId });
      const record = { user_id: targetUserId, display_name: clean(data.display_name, 80), role: data.role === 'senior_moderator' ? 'senior_moderator' : 'moderator', permissions: ['moderate_posts', 'moderate_comments', 'mute_users', 'review_reports'], active: true, appointed_by: user.id };
      if (rows[0]) await base44.asServiceRole.entities.ForumModerator.update(rows[0].id, record);
      else await base44.asServiceRole.entities.ForumModerator.create(record);
      return json({ success: true });
    }

    if (action === 'resolve_report') {
      requireModerator();
      const report = await base44.asServiceRole.entities.ForumReport.get(data.report_id);
      if (!report) return json({ success: false, error: 'Report not found.' }, 404);
      await base44.asServiceRole.entities.ForumReport.update(report.id, { status: data.status === 'dismissed' ? 'dismissed' : 'resolved', assigned_moderator_id: user.id, resolution: clean(data.resolution, 1000) });
      return json({ success: true });
    }

    return json({ success: false, error: 'Unknown forum action.' }, 400);
  } catch (error) {
    console.error('forumSystem error', error);
    return json({ success: false, error: error?.message || 'Forum request failed.' }, 400);
  }
});

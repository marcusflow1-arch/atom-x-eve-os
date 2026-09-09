import { useEffect, useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { clipTarget } from './galleryModel';

export function useGalleryRequests(channelId) {
  const client = useQueryClient();
  const query = useQuery({
    queryKey: ['gallery-requests', channelId],
    enabled: Boolean(channelId),
    queryFn: () => base44.entities.Comment.filter({ channel_id: channelId, target_type: 'clip_request' }, '-created_date', 100),
    refetchInterval: 20000,
    retry: 1,
  });
  useEffect(() => {
    if (!channelId) return;
    let unsubscribe;
    try {
      unsubscribe = base44.entities.Comment.subscribe((event) => {
        if (event.type === 'delete' || (event.data?.channel_id === channelId && event.data?.target_type === 'clip_request')) {
          client.invalidateQueries({ queryKey: ['gallery-requests', channelId] });
        }
      });
    } catch { /* Polling keeps the feed current when realtime is unavailable. */ }
    return () => unsubscribe?.();
  }, [channelId, client]);
  return query;
}

export default function useGallerySocial({ clip, channelId, user }) {
  const client = useQueryClient();
  const targetId = clipTarget(channelId, clip?.id);
  const mutationLock = useRef(false);
  const comments = useQuery({
    queryKey: ['gallery-comments', targetId],
    enabled: Boolean(targetId),
    queryFn: () => base44.entities.Comment.filter({ target_id: targetId }, '-created_date', 100),
    refetchInterval: 20000,
    retry: 1,
  });
  const reactions = useQuery({
    queryKey: ['gallery-reactions', targetId],
    enabled: Boolean(targetId),
    queryFn: async () => {
      const rows = [];
      let batch;
      do {
        batch = await base44.entities.Reaction.filter({ target_id: targetId, target_type: 'clip' }, 'created_date', 500, rows.length);
        rows.push(...batch);
      } while (batch.length === 500);
      return rows;
    },
    refetchInterval: 20000,
    retry: 1,
  });

  useEffect(() => {
    if (!targetId) return;
    const cleanups = [];
    for (const [entity, key] of [['Comment', 'gallery-comments'], ['Reaction', 'gallery-reactions']]) {
      try {
        cleanups.push(base44.entities[entity].subscribe((event) => {
          if (event.type === 'delete' || event.data?.target_id === targetId) client.invalidateQueries({ queryKey: [key, targetId] });
        }));
      } catch { /* The query also refreshes periodically. */ }
    }
    return () => cleanups.forEach((unsubscribe) => unsubscribe?.());
  }, [targetId, client]);

  const addComment = useMutation({
    mutationFn: ({ content, request }) => {
      if (!user?.id || !targetId) throw new Error('Sign in to join the discussion.');
      if (!content.trim()) throw new Error('Write a message first.');
      return base44.entities.Comment.create({
        target_id: targetId,
        target_type: request ? 'clip_request' : 'clip',
        channel_id: channelId,
        clip_id: clip.id,
        clip_title: clip.title,
        user_id: user.id,
        author_name: user.username || user.full_name || 'Viewer',
        content: content.trim().slice(0, 1000),
      });
    },
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ['gallery-comments', targetId] });
      client.invalidateQueries({ queryKey: ['gallery-requests', channelId] });
    },
  });

  const react = useMutation({
    mutationFn: async (type) => {
      if (!user?.id || !targetId) throw new Error('Sign in to react.');
      if (mutationLock.current) return;
      mutationLock.current = true;
      try {
        // Recheck this user's reactions to avoid stale toggles across open tabs.
        const existing = await base44.entities.Reaction.filter({ target_id: targetId, target_type: 'clip', user_id: user.id, type });
        if (existing.length) {
          for (const reaction of existing) await base44.entities.Reaction.delete(reaction.id);
        } else {
          await base44.entities.Reaction.create({ target_id: targetId, target_type: 'clip', user_id: user.id, type });
        }
      } finally { mutationLock.current = false; }
    },
    onSuccess: () => client.invalidateQueries({ queryKey: ['gallery-reactions', targetId] }),
  });

  return { comments, reactions, addComment, react, canInteract: Boolean(user?.id && targetId) };
}

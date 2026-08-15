import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const VIDEO = /(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/;
const DAY = 24 * 60 * 60 * 1000;

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  try {
    const sources = await base44.asServiceRole.entities.VideoLearningSource.filter({ auto_learn: true }, '-created_date', 100);
    const now = Date.now();
    let refreshed = 0;
    let queued = 0;

    for (const source of sources || []) {
      if (source.source_type !== 'youtube_channel') continue;
      const last = source.last_discovered_at ? Date.parse(source.last_discovered_at) : 0;
      if (last && now - last < DAY) continue;

      await base44.asServiceRole.entities.VideoLearningSource.update(source.id, { status: 'discovering', last_discovered_at: new Date().toISOString() });
      try {
        const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
          prompt: `Inspect this public YouTube channel and return only verified public video URLs that are new or relevant since the previous crawl. Maximum 50. Channel: ${source.url}`,
          add_context_from_internet: true,
          response_json_schema: { type: 'object', properties: { videos: { type: 'array', items: { type: 'string' } } }, required: ['videos'] }
        });
        const urls = [...new Set((result?.videos || []).filter((u: string) => VIDEO.test(u)))];
        for (const url of urls) {
          const existing = await base44.asServiceRole.entities.VideoLearningJob.filter({ source_url: url }, '-created_date', 1);
          if (existing?.length) continue;
          const job = await base44.asServiceRole.entities.VideoLearningJob.create({ source_url: url, source_type: 'video', status: 'queued', current_stage: 'Queued by daily channel refresh', progress_percent: 0 });
          await base44.asServiceRole.entities.VideoLearningProfile.create({ job_id: job.id, knowledge_type: 'general_video', learning_goal: 'Automatically learn newly discovered channel material for Atom × Eve.', priority: 70 });
          try { await base44.asServiceRole.functions.invoke('videoLearningAutopilot', { jobId: job.id }); } catch (e) { console.log('Refresh dispatch warning', e?.message || e); }
          queued++;
        }
        await base44.asServiceRole.entities.VideoLearningSource.update(source.id, { status: 'completed', video_count: urls.length });
        refreshed++;
      } catch (e) {
        await base44.asServiceRole.entities.VideoLearningSource.update(source.id, { status: 'error', error_message: e?.message || String(e) });
      }
    }

    return Response.json({ success: true, refreshed, queued });
  } catch (error) {
    return Response.json({ error: error?.message || String(error) }, { status: 500 });
  }
});

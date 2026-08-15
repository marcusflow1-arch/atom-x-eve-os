import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const jobs = await base44.asServiceRole.entities.VideoLearningJob.filter({ status: 'queued' }, 'created_date', 3);
  const results = [];
  for (const job of jobs || []) {
    try {
      const result = await base44.asServiceRole.functions.invoke('videoLearningAutopilot', { jobId: job.id });
      results.push({ id: job.id, ok: true, result });
    } catch (error) {
      results.push({ id: job.id, ok: false, error: error?.message || String(error) });
    }
  }
  return Response.json({ success: true, processed: results.length, results });
});

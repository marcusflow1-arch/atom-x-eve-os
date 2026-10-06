import { createClientFromRequest } from 'npm:@base44/sdk@0.8.51';

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { 'Content-Type': 'application/json' },
});

const safeNumber = (value: unknown, min = 0, max = Number.MAX_SAFE_INTEGER) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return min;
  return Math.max(min, Math.min(max, n));
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return json({ error: 'Unauthorized' }, 401);

    const payload = await req.json().catch(() => ({}));
    const action = String(payload?.action || '');
    const data = payload?.data || {};
    const svc = base44.asServiceRole.entities.ScreenshotExtractionJob;

    if (action === 'start') {
      const interval = safeNumber(data.interval_seconds, 0.05, 3600);
      const expected = Math.floor(safeNumber(data.expected_frames, 1, 50000));
      const duration = safeNumber(data.video_duration, 0, 86400 * 7);
      const start = safeNumber(data.start_seconds, 0, duration || 86400 * 7);
      const end = safeNumber(data.end_seconds, start, duration || 86400 * 7);
      const format = ['jpeg', 'png', 'webp'].includes(data.format) ? data.format : 'jpeg';
      const outputMode = data.output_mode === 'folder' ? 'folder' : 'downloads';

      const row = await svc.create({
        user_id: String(user.id),
        file_name: String(data.file_name || 'video').slice(0, 240),
        file_size: safeNumber(data.file_size, 0, 1024 ** 4),
        video_duration: duration,
        interval_seconds: interval,
        start_seconds: start,
        end_seconds: end,
        format,
        quality: safeNumber(data.quality, 0.1, 1),
        expected_frames: expected,
        completed_frames: 0,
        output_mode: outputMode,
        output_folder_name: String(data.output_folder_name || '').slice(0, 240),
        status: 'running',
        error_message: '',
        started_at: new Date().toISOString(),
      });
      return json({ success: true, job: row });
    }

    if (action === 'progress' || action === 'complete' || action === 'cancel' || action === 'fail') {
      const jobId = String(data.job_id || '').trim();
      if (!jobId) return json({ error: 'Job ID is required' }, 400);
      const row = await svc.get(jobId).catch(() => null);
      if (!row || String(row.user_id) !== String(user.id)) return json({ error: 'Job not found' }, 404);

      const patch: Record<string, unknown> = {};
      if (data.completed_frames !== undefined) {
        patch.completed_frames = Math.floor(safeNumber(data.completed_frames, 0, Number(row.expected_frames || 50000)));
      }
      if (data.output_folder_name !== undefined) patch.output_folder_name = String(data.output_folder_name || '').slice(0, 240);

      if (action === 'complete') {
        patch.status = 'completed';
        patch.completed_at = new Date().toISOString();
      } else if (action === 'cancel') {
        patch.status = 'cancelled';
        patch.completed_at = new Date().toISOString();
      } else if (action === 'fail') {
        patch.status = 'failed';
        patch.error_message = String(data.error_message || 'Extraction failed').slice(0, 500);
        patch.completed_at = new Date().toISOString();
      }

      const updated = await svc.update(jobId, patch);
      return json({ success: true, job: updated });
    }

    if (action === 'list') {
      const rows = await svc.filter({ user_id: String(user.id) }, '-created_date', 12).catch(() => []);
      return json({ success: true, jobs: rows || [] });
    }

    return json({ error: 'Unsupported action' }, 400);
  } catch (error) {
    console.error('[screenshotExtractionJob]', error);
    return json({ error: error?.message || 'Screenshot job request failed' }, Number(error?.status || 500));
  }
});

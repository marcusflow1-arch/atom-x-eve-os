import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const TRIPO_BASE = 'https://openapi.tripo3d.ai/v3';
const DEFAULT_MODEL = 'v3.1-20260211';
const TERMINAL = new Set(['success', 'failed', 'cancelled', 'banned']);

function json(data: unknown, status = 200) {
  return Response.json(data, { status, headers: { 'Cache-Control': 'no-store' } });
}

async function tripoFetch(path: string, init: RequestInit = {}) {
  const key = Deno.env.get('TRIPO_API_KEY');
  if (!key) throw new Error('TRIPO_API_KEY is not configured in Base44 Secrets.');
  const headers = new Headers(init.headers || {});
  headers.set('Authorization', `Bearer ${key}`);
  if (init.body) headers.set('Content-Type', 'application/json');
  const response = await fetch(`${TRIPO_BASE}${path}`, { ...init, headers });
  const text = await response.text();
  let payload: any;
  try { payload = JSON.parse(text); } catch { payload = { raw: text }; }
  if (!response.ok || (payload?.code !== undefined && payload.code !== 0)) {
    const message = payload?.message || payload?.error_message || payload?.raw || `Tripo HTTP ${response.status}`;
    throw new Error(String(message));
  }
  return payload;
}

async function createTask(input: any) {
  const type = input.generationType || (input.sourceImageUrl ? 'image_to_model' : input.sourceViews ? 'multiview_to_model' : 'text_to_model');
  const model = input.model || DEFAULT_MODEL;
  let endpoint = '/generation/text-to-model';
  let body: any = {
    prompt: input.prompt || 'A production-ready game asset', model,
    texture: input.texture !== false, pbr: input.pbr !== false,
    texture_quality: input.textureQuality || 'detailed',
    geometry_quality: input.geometryQuality || 'detailed', export_uv: input.exportUv !== false,
  };

  if (type === 'image_to_model') {
    if (!input.sourceImageUrl) throw new Error('sourceImageUrl is required for image-to-model.');
    endpoint = '/generation/image-to-model';
    body = {
      input: input.sourceImageUrl, model,
      texture: input.texture !== false, pbr: input.pbr !== false,
      texture_quality: input.textureQuality || 'detailed', export_uv: input.exportUv !== false,
      enable_image_autofix: input.autoFix !== false, orientation: input.orientation || 'align_image',
    };
  } else if (type === 'multiview_to_model') {
    const views = input.sourceViews || {};
    if (!views.front) throw new Error('sourceViews.front is required for multiview-to-model.');
    endpoint = '/generation/multiview-to-model';
    body = {
      inputs: Object.entries(views).filter(([, value]) => Boolean(value)).map(([view, value]) => ({ [view]: value })),
      model, texture: input.texture !== false, pbr: input.pbr !== false,
      texture_quality: input.textureQuality || 'detailed', export_uv: input.exportUv !== false,
    };
  }

  const result = await tripoFetch(endpoint, { method: 'POST', body: JSON.stringify(body) });
  const taskId = result?.data?.task_id;
  if (!taskId) throw new Error('Tripo did not return a task_id.');
  return { taskId, type, model };
}

async function getTask(taskId: string) {
  return tripoFetch(`/tasks/${encodeURIComponent(taskId)}`, { method: 'GET' });
}

async function waitForTask(taskId: string, onProgress?: (task: any) => Promise<void>) {
  const deadline = Date.now() + 115_000;
  let latest: any = null;
  while (Date.now() < deadline) {
    latest = (await getTask(taskId))?.data;
    if (onProgress) await onProgress(latest);
    if (latest && TERMINAL.has(latest.status)) return latest;
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  return latest || { task_id: taskId, status: 'running', progress: 0, timeout: true };
}

Deno.serve(async (req) => {
  let base44: any;
  let recordId: string | null = null;
  try {
    base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);
    if (!user) return json({ error: 'Authentication required.' }, 401);
    const body = await req.json().catch(() => ({}));

    if (body.action === 'status') {
      if (!body.taskId) return json({ error: 'taskId is required.' }, 400);
      return json({ success: true, task: (await getTask(body.taskId))?.data });
    }

    const name = String(body.name || body.prompt || 'Tripo Generated Asset').slice(0, 160);
    const generation = await createTask(body);
    const record = await base44.asServiceRole.entities.TripoModel.create({
      name, prompt: body.prompt || '', source_image_url: body.sourceImageUrl || '', source_views: body.sourceViews || {},
      task_id: generation.taskId, status: 'queued', progress: 0, model_version: generation.model,
      generation_type: generation.type, metadata: { created_by: user.email || user.id || 'user' },
    });
    recordId = record.id;

    const task = await waitForTask(generation.taskId, async current => {
      if (!recordId) return;
      await base44.asServiceRole.entities.TripoModel.update(recordId, {
        status: current?.status || 'running', progress: Number(current?.progress || 0), error_message: current?.error_message || '',
      });
    });

    if (task.status === 'success') {
      await base44.asServiceRole.entities.TripoModel.update(recordId, {
        status: 'success', progress: 100, model_url: task.output?.model_url || '', preview_url: task.output?.rendered_image_url || '',
        metadata: { ...(record.metadata || {}), credits_consumed: task.credits_consumed ?? null, created_at: task.created_at || null, completed_at: task.completed_at || null, note: 'Tripo model URLs expire; download/import immediately when available.' },
      });
      return json({ success: true, id: recordId, task });
    }

    if (task.timeout) {
      await base44.asServiceRole.entities.TripoModel.update(recordId, { status: 'running', progress: Number(task.progress || 0), error_message: 'Generation is still running. Check the task status with the taskId.' });
      return json({ success: true, id: recordId, task, timed_out: true }, 202);
    }

    await base44.asServiceRole.entities.TripoModel.update(recordId, { status: task.status || 'failed', progress: Number(task.progress || 0), error_message: task.error_message || `Tripo task ended with status ${task.status}` });
    return json({ success: false, id: recordId, task }, 502);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (recordId && base44) await base44.asServiceRole.entities.TripoModel.update(recordId, { status: 'failed', error_message: message }).catch(() => {});
    return json({ error: message }, 500);
  }
});

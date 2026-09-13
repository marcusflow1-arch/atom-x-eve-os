import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const TRIPO_BASE = 'https://openapi.tripo3d.ai/v3';
const TRIPO_V2_BASE = 'https://api.tripo3d.ai/v2/openapi';
const DEFAULT_MODEL = 'v3.1-20260211';
const AVATAR_MODEL = 'P1-20260311';
const TERMINAL = new Set(['success', 'failed', 'cancelled', 'banned']);

function json(data: unknown, status = 200) {
  return Response.json(data, { status, headers: { 'Cache-Control': 'no-store' } });
}

function apiKey() {
  const key = Deno.env.get('TRIPO_API_KEY');
  if (!key) throw new Error('TRIPO_API_KEY is not configured in Base44 Secrets.');
  return key;
}

async function tripoFetch(path: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers || {});
  headers.set('Authorization', `Bearer ${apiKey()}`);
  if (init.body) headers.set('Content-Type', 'application/json');
  const response = await fetch(`${TRIPO_BASE}${path}`, { ...init, headers });
  const text = await response.text();
  let payload: any;
  try { payload = JSON.parse(text); } catch { payload = { raw: text }; }
  if (!response.ok || (payload?.code !== undefined && payload.code !== 0)) {
    throw new Error(String(payload?.message || payload?.error_message || payload?.raw || `Tripo HTTP ${response.status}`));
  }
  return payload;
}

async function v2Fetch(path: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers || {});
  headers.set('Authorization', `Bearer ${apiKey()}`);
  if (init.body) headers.set('Content-Type', 'application/json');
  const response = await fetch(`${TRIPO_V2_BASE}${path}`, { ...init, headers });
  const text = await response.text();
  let payload: any;
  try { payload = JSON.parse(text); } catch { payload = { raw: text }; }
  if (!response.ok || payload?.code !== 0) {
    throw new Error(String(payload?.message || payload?.suggestion || payload?.raw || `Tripo HTTP ${response.status}`));
  }
  return payload;
}

async function createV2Task(body: any) {
  const response = await v2Fetch('/task', { method: 'POST', body: JSON.stringify(body) });
  const taskId = response?.data?.task_id;
  if (!taskId) throw new Error('Tripo did not return a task_id.');
  return taskId;
}

async function getV2Task(taskId: string) {
  return (await v2Fetch(`/task/${encodeURIComponent(taskId)}`, { method: 'GET' }))?.data;
}

function imageType(url: string) {
  const clean = String(url || '').split('?')[0].toLowerCase();
  if (clean.endsWith('.png')) return 'png';
  if (clean.endsWith('.webp')) return 'webp';
  return 'jpg';
}

function findAssetUrl(value: any, extensions = ['.glb', '.gltf', '.fbx']): string {
  if (!value) return '';
  if (typeof value === 'string') {
    const lower = value.toLowerCase().split('?')[0];
    return extensions.some((ext) => lower.endsWith(ext)) ? value : '';
  }
  if (Array.isArray(value)) {
    for (const item of value) { const found = findAssetUrl(item, extensions); if (found) return found; }
    return '';
  }
  if (typeof value === 'object') {
    const preferred = ['model_url', 'pbr_model', 'base_model', 'glb', 'fbx', 'url'];
    for (const key of preferred) { const found = findAssetUrl(value[key], extensions); if (found) return found; }
    for (const item of Object.values(value)) { const found = findAssetUrl(item, extensions); if (found) return found; }
  }
  return '';
}

async function persistModel(base44: any, remoteUrl: string, name: string) {
  if (!remoteUrl) throw new Error('The generated avatar did not include a downloadable model.');
  const response = await fetch(remoteUrl);
  if (!response.ok) throw new Error(`Could not download generated avatar (${response.status}).`);
  const buffer = await response.arrayBuffer();
  if (buffer.byteLength > 150 * 1024 * 1024) throw new Error('Generated avatar is larger than the 150 MB dashboard limit.');
  const ext = remoteUrl.toLowerCase().split('?')[0].endsWith('.fbx') ? 'fbx' : 'glb';
  const safe = String(name || 'avatar').replace(/[^a-z0-9_-]+/gi, '_').slice(0, 70) || 'avatar';
  const file = new File([buffer], `${safe}_rigged.${ext}`, { type: ext === 'glb' ? 'model/gltf-binary' : 'application/octet-stream' });
  const uploaded = await base44.asServiceRole.integrations.Core.UploadFile({ file });
  if (!uploaded?.file_url) throw new Error('Generated avatar could not be copied into permanent Atom × Eve storage.');
  return uploaded.file_url;
}

async function startAvatarPipeline(base44: any, user: any, body: any) {
  const sourceImageUrl = String(body.sourceImageUrl || '');
  if (!/^https:\/\//.test(sourceImageUrl)) throw new Error('A valid uploaded selfie URL is required.');
  const generationTaskId = await createV2Task({
    type: 'image_to_model',
    model_version: AVATAR_MODEL,
    file: { type: imageType(sourceImageUrl), url: sourceImageUrl },
    texture: true,
    pbr: true,
    texture_quality: 'detailed',
    geometry_quality: 'detailed',
    export_uv: true,
    orientation: 'align_image',
  });
  const record = await base44.asServiceRole.entities.TripoModel.create({
    name: String(body.name || 'Personal Avatar').slice(0, 160),
    prompt: `Personal likeness avatar · ${String(body.stylePreset || 'heroic_fantasy')}`,
    source_image_url: '',
    source_views: {},
    task_id: generationTaskId,
    status: 'queued',
    progress: 0,
    model_version: AVATAR_MODEL,
    generation_type: 'image_to_model',
    metadata: {
      user_id: user.id,
      pipeline_stage: 'generation',
      generation_task_id: generationTaskId,
      style_preset: String(body.stylePreset || 'heroic_fantasy'),
      source_photo_used: true,
      source_photo_public_profile: false,
      rig_spec: 'mixamo',
    },
  });
  return json({ success: true, pipelineId: record.id, stage: 'generation', progress: 0 }, 202);
}

async function getOwnedPipeline(base44: any, user: any, pipelineId: string) {
  const rows = await base44.asServiceRole.entities.TripoModel.filter({ id: pipelineId }, '-created_date', 1);
  const record = rows?.[0];
  if (!record || record.metadata?.user_id !== user.id) throw new Error('Avatar pipeline not found.');
  return record;
}

async function advanceAvatarPipeline(base44: any, user: any, body: any) {
  const record = await getOwnedPipeline(base44, user, String(body.pipelineId || ''));
  const metadata = record.metadata || {};
  const stage = metadata.pipeline_stage || 'generation';
  if (record.status === 'success' && record.model_url) return json({ success: true, id: record.id, model_url: record.model_url, stage: 'complete', progress: 100, record });
  if (record.status === 'failed') return json({ success: false, id: record.id, status: 'failed', error: record.error_message || 'Avatar generation failed.', stage }, 502);

  if (stage === 'generation') {
    const task = await getV2Task(metadata.generation_task_id || record.task_id);
    const status = task?.status || 'running';
    const progress = Number(task?.progress || 0);
    if (['failed', 'cancelled', 'banned'].includes(status)) {
      await base44.asServiceRole.entities.TripoModel.update(record.id, { status: 'failed', progress, error_message: task?.error_message || `Generation ${status}` });
      return json({ success: false, id: record.id, status: 'failed', error: task?.error_message || `Generation ${status}`, stage }, 502);
    }
    if (status !== 'success') {
      await base44.asServiceRole.entities.TripoModel.update(record.id, { status, progress });
      return json({ success: true, pipelineId: record.id, stage, status, progress }, 202);
    }

    const rigTaskId = await createV2Task({
      type: 'animate_rig',
      original_model_task_id: metadata.generation_task_id || record.task_id,
      out_format: 'glb',
      topology: 'bip',
      spec: 'mixamo',
      rig_type: 'biped',
      model_version: 'v2.5-20260210',
    });
    const nextMetadata = { ...metadata, pipeline_stage: 'rig', rig_task_id: rigTaskId };
    await base44.asServiceRole.entities.TripoModel.update(record.id, { status: 'running', progress: 55, metadata: nextMetadata });
    return json({ success: true, pipelineId: record.id, stage: 'rig', status: 'running', progress: 55 }, 202);
  }

  if (stage === 'rig') {
    const task = await getV2Task(metadata.rig_task_id);
    const status = task?.status || 'running';
    const rawProgress = Number(task?.progress || 0);
    const progress = 55 + Math.round(rawProgress * .4);
    if (['failed', 'cancelled', 'banned'].includes(status)) {
      await base44.asServiceRole.entities.TripoModel.update(record.id, { status: 'failed', progress, error_message: task?.error_message || `Rigging ${status}` });
      return json({ success: false, id: record.id, status: 'failed', error: task?.error_message || `Rigging ${status}`, stage }, 502);
    }
    if (status !== 'success') {
      await base44.asServiceRole.entities.TripoModel.update(record.id, { status, progress });
      return json({ success: true, pipelineId: record.id, stage, status, progress }, 202);
    }

    const remoteModel = findAssetUrl(task?.output);
    const permanentUrl = await persistModel(base44, remoteModel, record.name || 'personal_avatar');
    const completedMetadata = { ...metadata, pipeline_stage: 'complete', permanent_copy: true };
    const saved = await base44.asServiceRole.entities.TripoModel.update(record.id, { status: 'success', progress: 100, model_url: permanentUrl, error_message: '', metadata: completedMetadata });
    return json({ success: true, id: record.id, model_url: permanentUrl, stage: 'complete', progress: 100, record: saved });
  }

  return json({ success: false, id: record.id, status: 'failed', error: 'Unknown avatar pipeline stage.', stage }, 500);
}

async function createTask(input: any) {
  const type = input.generationType || (input.sourceImageUrl ? 'image_to_model' : input.sourceViews ? 'multiview_to_model' : 'text_to_model');
  const model = input.model || DEFAULT_MODEL;
  let endpoint = '/generation/text-to-model';
  let body: any = { prompt: input.prompt || 'A production-ready game asset', model, texture: input.texture !== false, pbr: input.pbr !== false, texture_quality: input.textureQuality || 'detailed', geometry_quality: input.geometryQuality || 'detailed', export_uv: input.exportUv !== false };
  if (type === 'image_to_model') {
    if (!input.sourceImageUrl) throw new Error('sourceImageUrl is required for image-to-model.');
    endpoint = '/generation/image-to-model';
    body = { input: input.sourceImageUrl, model, texture: input.texture !== false, pbr: input.pbr !== false, texture_quality: input.textureQuality || 'detailed', export_uv: input.exportUv !== false, enable_image_autofix: input.autoFix !== false, orientation: input.orientation || 'align_image' };
  } else if (type === 'multiview_to_model') {
    const views = input.sourceViews || {};
    if (!views.front) throw new Error('sourceViews.front is required for multiview-to-model.');
    endpoint = '/generation/multiview-to-model';
    body = { inputs: Object.entries(views).filter(([, value]) => Boolean(value)).map(([view, value]) => ({ [view]: value })), model, texture: input.texture !== false, pbr: input.pbr !== false, texture_quality: input.textureQuality || 'detailed', export_uv: input.exportUv !== false };
  }
  const result = await tripoFetch(endpoint, { method: 'POST', body: JSON.stringify(body) });
  const taskId = result?.data?.task_id;
  if (!taskId) throw new Error('Tripo did not return a task_id.');
  return { taskId, type, model };
}

async function getTask(taskId: string) { return tripoFetch(`/tasks/${encodeURIComponent(taskId)}`, { method: 'GET' }); }

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

    if (body.action === 'avatarPipelineStart') return startAvatarPipeline(base44, user, body);
    if (body.action === 'avatarPipelineStatus') return advanceAvatarPipeline(base44, user, body);
    if (body.action === 'status') {
      if (!body.taskId) return json({ error: 'taskId is required.' }, 400);
      return json({ success: true, task: (await getTask(body.taskId))?.data });
    }

    const name = String(body.name || body.prompt || 'Tripo Generated Asset').slice(0, 160);
    const generation = await createTask(body);
    const record = await base44.asServiceRole.entities.TripoModel.create({
      name, prompt: body.prompt || '', source_image_url: body.sourceImageUrl || '', source_views: body.sourceViews || {},
      task_id: generation.taskId, status: 'queued', progress: 0, model_version: generation.model,
      generation_type: generation.type, metadata: { created_by: user.email || user.id || 'user', user_id: user.id },
    });
    recordId = record.id;
    const task = await waitForTask(generation.taskId, async current => {
      if (recordId) await base44.asServiceRole.entities.TripoModel.update(recordId, { status: current?.status || 'running', progress: Number(current?.progress || 0), error_message: current?.error_message || '' });
    });
    if (task.status === 'success') {
      const remote = findAssetUrl(task.output);
      let modelUrl = remote;
      try { if (remote) modelUrl = await persistModel(base44, remote, name); } catch (error) { console.warn('Could not persist Tripo model; keeping provider URL.', error); }
      await base44.asServiceRole.entities.TripoModel.update(recordId, { status: 'success', progress: 100, model_url: modelUrl || '', preview_url: task.output?.rendered_image_url || '', metadata: { ...(record.metadata || {}), credits_consumed: task.credits_consumed ?? null, created_at: task.created_at || null, completed_at: task.completed_at || null, permanent_copy: Boolean(modelUrl && modelUrl !== remote) } });
      return json({ success: true, id: recordId, task, model_url: modelUrl || '' });
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

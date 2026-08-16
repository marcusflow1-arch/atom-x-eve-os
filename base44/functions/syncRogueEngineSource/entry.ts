import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const REPO = 'marcusflow1-arch/rogue-engine-';
const BRANCH = 'main';
const API = `https://api.github.com/repos/${REPO}`;
const RAW = `https://raw.githubusercontent.com/${REPO}/${BRANCH}`;
const headers = { 'User-Agent': 'Atom-XE-Rogue-Engine-Bridge/2.0', 'Accept': 'application/vnd.github+json' };

async function getTree() {
  const response = await fetch(`${API}/git/trees/${BRANCH}?recursive=1`, { headers });
  if (!response.ok) throw new Error(`Rogue Engine tree: HTTP ${response.status}`);
  return await response.json();
}

async function fetchText(path: string) {
  const response = await fetch(`${RAW}/${path.split('/').map(encodeURIComponent).join('/')}`, { headers, redirect: 'follow' });
  if (!response.ok) throw new Error(`${path}: HTTP ${response.status}`);
  return await response.text();
}

function parseRogueAsset(raw: string) {
  try {
    const outer = JSON.parse(raw);
    const payload = typeof outer.content === 'string' ? JSON.parse(outer.content) : outer;
    const metadata = payload.metadata || payload.scene?.metadata || {};
    const geometries = payload.geometries || payload.scene?.geometries || [];
    const materials = payload.materials || payload.scene?.materials || [];
    const components = new Set<string>();
    const objects: string[] = [];
    const walk = (node: any) => {
      if (!node || typeof node !== 'object') return;
      if (node.name) objects.push(String(node.name));
      for (const c of node.userData?.components || node.components || []) {
        if (c?.name) components.add(String(c.name));
        if (c?.componentPrototypeName) components.add(String(c.componentPrototypeName));
      }
      for (const child of node.children || []) walk(child);
    };
    walk(payload.object || payload.scene?.object);
    return { metadata, geometry_count: geometries.length, material_count: materials.length, component_types: [...components], object_names: [...new Set(objects)].slice(0, 500) };
  } catch { return null; }
}

function fileKind(path: string) {
  if (path.endsWith('.rogueScene')) return 'scene';
  if (path.endsWith('.roguePrefab')) return 'prefab';
  if (path.endsWith('.rogueMaterial')) return 'material';
  if (path.endsWith('.meta')) return 'metadata';
  if (path.endsWith('.js')) return 'runtime-code';
  if (path.endsWith('.html')) return 'runtime-shell';
  if (/\.(png|jpg|jpeg|webp|svg)$/i.test(path)) return 'visual-asset';
  if (/\.(md|txt|json|jsonc|css|ts|tsx|js)$/i.test(path)) return 'documentation-or-code';
  return 'other';
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    let source = body?.source_id ? await base44.asServiceRole.entities.RogueEngineSource.get(body.source_id) : null;
    if (!source) {
      const existing = await base44.asServiceRole.entities.RogueEngineSource.list('-created_date', 1);
      source = existing?.[0] || await base44.asServiceRole.entities.RogueEngineSource.create({
        name: 'Rogue Engine Export', repository_url: `https://github.com/${REPO}`, branch: BRANCH,
        status: 'pending', source_type: 'rogue_engine_export', knowledge_scope: 'engine_building'
      });
    }
    await base44.asServiceRole.entities.RogueEngineSource.update(source.id, { status: 'syncing' });

    const tree = await getTree();
    const files = (tree.tree || []).filter((x: any) => x.type === 'blob');
    const entries: string[] = [];
    const failures: string[] = [];

    for (const file of files) {
      const path = String(file.path);
      const kind = fileKind(path);
      try {
        // Binary/large runtime artifacts are represented by architecture metadata rather than copied into the knowledge text.
        if (kind === 'visual-asset' || path === 'build.js') {
          const analysis = [
            `SOURCE: ${path}`,
            `ROLE: ${kind}`,
            `SIZE: ${file.size || 0} bytes`,
            `SHA: ${file.sha}`,
            `RAW URL: ${RAW}/${path.split('/').map(encodeURIComponent).join('/')}`,
            'POLICY: Preserve as a runtime/reference asset. Do not execute imported source inside the knowledge worker.'
          ].join('\n');
          const entry = await base44.asServiceRole.entities.KnowledgeEntry.create({
            source_filename: `rogue-engine-/${path}`, file_type: path.split('.').pop() || 'asset', file_size: file.size || 0,
            summary: `Rogue Engine ${kind}: ${path}.`, full_analysis: analysis, extracted_code: analysis,
            tags: ['rogue-engine', 'three.js', 'game-engine', 'engine-building', kind], category: 'asset',
            knowledge_domain: 'engine_building', analyzed_date: new Date().toISOString(), is_pinned: true
          });
          entries.push(entry.id);
          continue;
        }

        const raw = await fetchText(path);
        const parsed = path.endsWith('.roguePrefab') || path.endsWith('.rogueScene') || path.endsWith('.rogueMaterial') ? parseRogueAsset(raw) : null;
        const tags = ['rogue-engine', 'three.js', 'webgl', 'game-engine', 'engine-building', kind];
        if (parsed?.component_types?.some((x: string) => x.includes('Rapier'))) tags.push('rapier', 'physics', 'character-controller');
        if (parsed?.component_types?.some((x: string) => x.includes('ThirdPerson'))) tags.push('third-person', 'camera-controller');
        if (parsed?.component_types?.some((x: string) => x.includes('FirstPerson'))) tags.push('first-person', 'camera-controller');

        let summary = `Rogue Engine ${kind}: ${path}.`;
        let analysis = `SOURCE: ${path}\nROLE: ${kind}\nSHA: ${file.sha}\n`;
        let extracted = raw.slice(0, 60000);
        if (parsed) {
          summary += ` Asset version ${parsed.metadata?.version ?? 'unknown'}; ${parsed.geometry_count} geometries, ${parsed.material_count} materials; components: ${parsed.component_types.join(', ') || 'none'}.`;
          analysis += [
            `ENGINE: Rogue Engine / Three.js Object3D export`,
            `METADATA: ${JSON.stringify(parsed.metadata)}`,
            `GEOMETRIES: ${parsed.geometry_count}`,
            `MATERIALS: ${parsed.material_count}`,
            `COMPONENTS: ${parsed.component_types.join(', ') || 'none'}`,
            `OBJECTS: ${parsed.object_names.join(', ') || 'none'}`,
            'IMPLEMENTATION: Use this as declarative engine knowledge. Recreate compatible behavior in the Atom XE Game engine using existing Three.js/Rapier/gameplay systems; do not execute imported asset text.'
          ].join('\n');
        } else {
          analysis += `CONTENT:\n${extracted}`;
        }

        const entry = await base44.asServiceRole.entities.KnowledgeEntry.create({
          source_filename: `rogue-engine-/${path}`, file_type: path.split('.').pop() || 'txt', file_size: raw.length,
          summary, full_analysis: analysis, extracted_code: extracted, tags: [...new Set(tags)],
          category: kind === 'documentation-or-code' ? 'code' : 'asset', knowledge_domain: 'engine_building',
          analyzed_date: new Date().toISOString(), is_pinned: true
        });
        entries.push(entry.id);
      } catch (error) {
        failures.push(`${path}: ${error?.message || String(error)}`);
      }
    }

    await base44.asServiceRole.entities.RogueEngineSource.update(source.id, {
      status: entries.length ? 'ready' : 'failed', last_synced_at: new Date().toISOString(), last_commit: BRANCH,
      files_analyzed: entries.length,
      notes: `Full repository sync: ${entries.length}/${files.length} files represented in the Atom XE engine knowledge bank. Failures: ${failures.length}. Runtime binaries remain reference assets and are not executed by the knowledge worker.`
    });

    return Response.json({ success: true, source_id: source.id, files_seen: files.length, files_analyzed: entries.length, failures });
  } catch (error) {
    return Response.json({ success: false, error: error?.message || String(error) }, { status: 500 });
  }
});

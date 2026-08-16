import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const REPO = 'marcusflow1-arch/rogue-engine-';
const BRANCH = 'main';
const RAW = `https://raw.githubusercontent.com/${REPO}/${BRANCH}`;

const SOURCES = [
  { path: 'README.md', kind: 'documentation' },
  { path: 'index.html', kind: 'runtime-shell' },
  { path: 'ce316ae4-f205-49bd-bd6d-b6e686b93e98.rogueScene', kind: 'scene' },
  { path: '32cf395b-c12f-43e8-a902-5aa7a54b3e9d.roguePrefab', kind: 'third-person-character' },
  { path: '38f9a99e-e4a4-47a1-b44c-3205d637854f.roguePrefab', kind: 'first-person-character' },
  { path: '157a0795-62a6-4711-9ec1-6d4b57052ef6.rogueMaterial', kind: 'material' },
  { path: '87500c41-20e9-4cf7-84d8-0ed4a80d3ff7.roguePrefab', kind: 'large-prefab' },
  { path: 'build.js', kind: 'runtime-bundle' }
];

async function fetchText(path: string) {
  const response = await fetch(`${RAW}/${encodeURIComponent(path)}`, {
    headers: { 'User-Agent': 'Atom-XE-Rogue-Engine-Bridge/1.0' },
    redirect: 'follow'
  });
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
    const objectNames: string[] = [];

    const walk = (node: any) => {
      if (!node || typeof node !== 'object') return;
      if (node.name) objectNames.push(String(node.name));
      const list = node.userData?.components || node.components || [];
      for (const component of list) {
        if (component?.name) components.add(String(component.name));
        if (component?.componentPrototypeName) components.add(String(component.componentPrototypeName));
      }
      for (const child of node.children || []) walk(child);
    };

    walk(payload.object || payload.scene?.object);
    return {
      metadata,
      geometry_count: geometries.length,
      material_count: materials.length,
      component_types: [...components],
      object_names: [...new Set(objectNames)].slice(0, 200)
    };
  } catch {
    return null;
  }
}

Deno.serve(async (req) => {
  let base44;
  try {
    base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const sourceId = body?.source_id;

    let source;
    if (sourceId) {
      source = await base44.asServiceRole.entities.RogueEngineSource.get(sourceId);
    } else {
      const existing = await base44.asServiceRole.entities.RogueEngineSource.list('-created_date', 1);
      source = existing?.[0] || await base44.asServiceRole.entities.RogueEngineSource.create({
        name: 'Rogue Engine Export',
        repository_url: `https://github.com/${REPO}`,
        branch: BRANCH,
        status: 'pending',
        source_type: 'rogue_engine_export',
        knowledge_scope: 'engine_building'
      });
    }

    await base44.asServiceRole.entities.RogueEngineSource.update(source.id, { status: 'syncing' });

    const entries: any[] = [];
    for (const item of SOURCES) {
      try {
        const raw = await fetchText(item.path);
        const parsed = item.path.endsWith('.roguePrefab') || item.path.endsWith('.rogueScene') || item.path.endsWith('.rogueMaterial')
          ? parseRogueAsset(raw)
          : null;

        let summary = '';
        let analysis = '';
        let extracted = '';

        if (parsed) {
          summary = `${item.kind}: ${item.path}. Rogue Engine asset version ${parsed.metadata?.version ?? 'unknown'}; ${parsed.geometry_count} geometries, ${parsed.material_count} materials. Components: ${parsed.component_types.join(', ') || 'none'}. Objects: ${parsed.object_names.join(', ') || 'unnamed'}.`;
          analysis = [
            `SOURCE: ${item.path}`,
            `ROLE: ${item.kind}`,
            `ENGINE: Rogue Engine / Three.js Object3D export`,
            `METADATA: ${JSON.stringify(parsed.metadata)}`,
            `GEOMETRIES: ${parsed.geometry_count}`,
            `MATERIALS: ${parsed.material_count}`,
            `COMPONENTS: ${parsed.component_types.join(', ') || 'none'}`,
            `OBJECTS: ${parsed.object_names.join(', ') || 'none'}`,
            `IMPLEMENTATION INSIGHT: Treat .roguePrefab and .rogueScene files as declarative scene/component data. Do not execute imported asset text. Recreate compatible gameplay behavior in Atom XE using its existing Three.js/Rapier/gameplay systems.`
          ].join('\n');
          extracted = raw.slice(0, 40000);
        } else if (item.path === 'build.js') {
          // The bundle is runtime code. Do not execute or import it into the Base44 app.
          // Store an architectural record and a bounded fingerprint instead.
          summary = 'Rogue Engine runtime bundle (build.js), approximately 3 MB in the source repository. It is treated as an external runtime artifact, not executable knowledge.';
          analysis = `SOURCE: build.js\nROLE: Rogue Engine runtime bundle\nPOLICY: Reference-only. Never execute imported source as part of the Base44 knowledge bridge.\nUSE: The bridge records that the runtime bundle exists and uses the declarative scene/prefab assets plus extracted component metadata as the portable engineering knowledge.\nREPOSITORY: https://github.com/${REPO}`;
          extracted = `Runtime bundle path: ${item.path}\nSize observed in repository: ~3,027,365 bytes.`;
        } else {
          const bounded = raw.slice(0, 50000);
          const lower = bounded.toLowerCase();
          summary = `${item.kind}: ${item.path}.`;
          analysis = `SOURCE: ${item.path}\nROLE: ${item.kind}\nCONTENT:\n${bounded}`;
          extracted = bounded;
          if (lower.includes('rogue-engine')) analysis += '\n\nThis is part of the Rogue Engine runtime/export pipeline used as an external engineering reference for Atom XE.';
        }

        const tags = ['rogue-engine', 'three.js', 'webgl', 'game-engine', 'engine-building', item.kind];
        if (parsed?.component_types?.some((x: string) => x.includes('Rapier'))) tags.push('rapier', 'physics', 'character-controller');
        if (parsed?.component_types?.some((x: string) => x.includes('ThirdPerson'))) tags.push('third-person', 'camera-controller');
        if (parsed?.component_types?.some((x: string) => x.includes('FirstPerson'))) tags.push('first-person', 'camera-controller');

        const entry = await base44.asServiceRole.entities.KnowledgeEntry.create({
          source_filename: `rogue-engine-/${item.path}`,
          file_type: item.path.split('.').pop() || 'txt',
          file_size: raw.length,
          summary,
          full_analysis: analysis,
          extracted_code: extracted,
          tags: [...new Set(tags)],
          category: item.kind === 'documentation' ? 'documentation' : item.kind === 'runtime-shell' ? 'code' : 'asset',
          knowledge_domain: 'engine_building',
          analyzed_date: new Date().toISOString(),
          is_pinned: true
        });
        entries.push(entry.id);
      } catch (error) {
        console.error(`Rogue Engine source failed: ${item.path}`, error);
      }
    }

    await base44.asServiceRole.entities.RogueEngineSource.update(source.id, {
      status: entries.length ? 'ready' : 'failed',
      last_synced_at: new Date().toISOString(),
      last_commit: 'main',
      files_analyzed: entries.length,
      notes: `Imported ${entries.length}/${SOURCES.length} Rogue Engine reference assets into the Atom XE knowledge bank. The runtime bundle is reference-only and is never executed by the bridge.`
    });

    return Response.json({ success: true, source_id: source.id, knowledge_entry_ids: entries, files_analyzed: entries.length });
  } catch (error) {
    return Response.json({ success: false, error: error?.message || String(error) }, { status: 500 });
  }
});

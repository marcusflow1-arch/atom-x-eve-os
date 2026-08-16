import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const REPO = 'marcusflow1-arch/rogue-engine-';
const BRANCH = 'main';
const API = `https://api.github.com/repos/${REPO}`;
const RAW = `https://raw.githubusercontent.com/${REPO}/${BRANCH}`;

const headers = { 'User-Agent': 'Atom-XE-Rogue-Engine-Runtime/1.0', 'Accept': 'application/vnd.github+json' };

async function getTree() {
  const r = await fetch(`${API}/git/trees/${BRANCH}?recursive=1`, { headers });
  if (!r.ok) throw new Error(`Rogue Engine tree: HTTP ${r.status}`);
  return await r.json();
}

function kind(path: string) {
  if (path.endsWith('.rogueScene')) return 'scene';
  if (path.endsWith('.roguePrefab')) return 'prefab';
  if (path.endsWith('.rogueMaterial')) return 'material';
  if (path.endsWith('.meta')) return 'metadata';
  if (path.endsWith('.js')) return 'runtime-code';
  if (path.endsWith('.html')) return 'runtime-shell';
  if (path.endsWith('.svg') || path.endsWith('.png')) return 'visual-asset';
  return 'documentation';
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const tree = await getTree();
    const files = (tree.tree || []).filter((x: any) => x.type === 'blob').map((x: any) => ({
      path: x.path,
      size: x.size || 0,
      sha: x.sha,
      kind: kind(x.path),
      raw_url: `${RAW}/${x.path.split('/').map(encodeURIComponent).join('/')}`
    }));

    const find = (suffix: string) => files.find((x: any) => x.path.endsWith(suffix))?.raw_url || '';
    const runtime = {
      name: 'Atom XE Rogue Engine Runtime',
      repository_url: `https://github.com/${REPO}`,
      branch: BRANCH,
      entry_url: `${RAW}/index.html`,
      runtime_bundle_url: `${RAW}/build.js`,
      scene_url: find('.rogueScene'),
      third_person_prefab_url: find('32cf395b-c12f-43e8-a902-5aa7a54b3e9d.roguePrefab'),
      first_person_prefab_url: find('38f9a99e-e4a4-47a1-b44c-3205d637854f.roguePrefab'),
      material_url: find('.rogueMaterial'),
      large_prefab_url: find('87500c41-20e9-4cf7-84d8-0ed4a80d3ff7.roguePrefab'),
      asset_manifest: files,
      status: 'ready',
      last_synced_at: new Date().toISOString(),
      notes: 'Runtime manifest for the Game navigation engine. Declarative Rogue Engine assets are available as first-class project runtime references. The external build bundle is loaded only by the Game runtime when explicitly mounted; it is never executed by the knowledge-learning bridge.'
    };

    const existing = await base44.asServiceRole.entities.RogueEngineRuntime.list('-created_date', 1);
    let saved;
    if (existing?.[0]) saved = await base44.asServiceRole.entities.RogueEngineRuntime.update(existing[0].id, runtime);
    else saved = await base44.asServiceRole.entities.RogueEngineRuntime.create(runtime);

    return Response.json({ success: true, runtime_id: saved.id, file_count: files.length, manifest: runtime });
  } catch (error) {
    return Response.json({ success: false, error: error?.message || String(error) }, { status: 500 });
  }
});

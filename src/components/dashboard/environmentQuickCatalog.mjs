// Shared *live* catalog for Environment Hub and its four favorite shortcuts.
// Quick slots re-check access against this catalog before applying an asset.
export const DEFAULT_ENVIRONMENT = {
  id: 'default_room',
  name: 'Standard Quarters',
  description: 'Your default Luna 3D environment.',
  rarity: 'Common',
  origin: 'Default',
  selectable: true,
};
const SCENE_PATTERN = /environment|scene|room|landscape|world|hub|skybox|town|village|terrain|arena|garden|cave|temple|forest|castle|home|house|loft|outpost|plaza|city|map/i;

export const asLibraryEnvironment = row => ({
  ...row,
  origin: row.game_origin || 'My environments',
  thumbnail: row.thumbnail_url || row.preview_image_url || '',
  modelUrl: row.model_url || '',
  sceneLayoutId: row.scene_layout_id || null,
  selectable: Boolean(row.model_url || row.scene_layout_id),
});
export const asSceneEnvironment = scene => ({
  id: 'scene-' + scene.id,
  name: scene.name || '3D Scene',
  description: scene.description || 'Saved 3D environment',
  origin: '3D Scenes',
  thumbnail: scene.thumbnail_url || scene.thumbnail || scene.preview_url || '',
  modelUrl: scene.environment_url || scene.model_url || '',
  layoutData: scene,
  sceneLayoutId: scene.id,
  playerSpawn: scene.player_spawn,
  useMeshCollision: scene.use_mesh_collision || false,
  selectable: Boolean(scene.environment_url || scene.model_url || scene.objects?.length),
});
export const asModelEnvironment = model => ({
  id: 'model-' + model.id,
  name: model.name || '3D Environment',
  description: model.description || '3D background',
  origin: '3D Environments',
  thumbnail: model.thumbnail_url || '',
  modelUrl: model.file_url,
  playerSpawn: model.player_spawn,
  useMeshCollision: model.use_mesh_collision || false,
  selectable: true,
});

export async function loadEnvironmentChoices(client, userId) {
  const [owned, scenes, models] = await Promise.all([
    userId ? client.entities.EnvironmentInstance.filter({ owner_id: userId }) : Promise.resolve([]),
    client.entities.SceneLayout.list().catch(() => []),
    client.entities.Model3D.list().catch(() => []),
  ]);
  const collection = (owned || [])
    .filter(row => String(row.owner_id) === String(userId))
    .map(asLibraryEnvironment).filter(row => row.selectable);
  const layouts = (scenes || [])
    .filter(scene => !/\[legacy_archive\]/i.test(scene.name || ''))
    .map(asSceneEnvironment).filter(row => row.selectable);
  const sceneModels = (models || [])
    .filter(model => model.file_url && SCENE_PATTERN.test(`${model.name || ''} ${model.description || ''}`))
    .map(asModelEnvironment);
  const deduped = new Map();
  for (const item of [DEFAULT_ENVIRONMENT, ...collection, ...layouts, ...sceneModels]) {
    const key = item.modelUrl || item.layoutData?.environment_url || item.id;
    if (!deduped.has(key)) deduped.set(key, item);
  }
  return [...deduped.values()].sort((a, b) =>
    a.id === 'default_room' ? -1 : b.id === 'default_room' ? 1 : a.name.localeCompare(b.name));
}

// Resolve a source scene before applying it so shortcuts have exactly the same
// collisions, spawn and model behavior as a selection from the full Hub.
export async function resolveEnvironmentChoice(item, client, defaultModelUrl) {
  if (!item || (!item.selectable && item.id !== 'default_room')) {
    throw new Error('This environment is unavailable.');
  }
  let layoutData = item.layoutData || null;
  if (!layoutData && item.sceneLayoutId) {
    const list = await client.entities.SceneLayout.filter({ id: item.sceneLayoutId });
    layoutData = list?.[0] || null;
  }
  const modelUrl = item.id === 'default_room'
    ? defaultModelUrl : (item.modelUrl || layoutData?.environment_url);
  if (!modelUrl && !layoutData?.objects?.length) {
    throw new Error('This environment has no playable 3D scene attached.');
  }
  return {
    ...item,
    modelUrl,
    layoutData,
    playerSpawn: item.playerSpawn || layoutData?.player_spawn,
    useMeshCollision: item.useMeshCollision || layoutData?.use_mesh_collision || false,
  };
}

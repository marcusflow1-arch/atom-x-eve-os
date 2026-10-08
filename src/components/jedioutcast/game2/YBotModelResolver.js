import { base44 } from '@/api/base44Client';

export const YBOT_MODEL_RECORD_NAME = 'Y Bot (1).fbx';

function pickYBot(rows = []) {
  const exact = rows.find((row) => row?.name === YBOT_MODEL_RECORD_NAME && row?.file_url);
  if (exact) return exact;

  return rows.find((row) =>
    row?.file_url &&
    /y\s*bot/i.test(String(row.name || '')) &&
    String(row.file_type || '').toLowerCase() === 'fbx'
  ) || null;
}

export async function resolveYBotModelAsset() {
  let rows = [];
  try {
    rows = await base44.entities.Model3D.filter(
      { name: YBOT_MODEL_RECORD_NAME },
      '-updated_date',
      20,
    );
  } catch (error) {
    console.warn('Exact Y Bot Model3D lookup failed; falling back to Model3D list.', error);
  }

  let asset = pickYBot(rows);
  if (!asset) {
    const allModels = await base44.entities.Model3D.list('-updated_date', 500);
    asset = pickYBot(allModels);
  }

  if (!asset?.file_url) {
    throw new Error(
      'Y Bot model is missing from Admin → 3D Models. Expected a Model3D record named "Y Bot (1).fbx".',
    );
  }

  return asset;
}

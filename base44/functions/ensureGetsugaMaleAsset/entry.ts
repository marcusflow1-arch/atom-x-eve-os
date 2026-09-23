import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

const DRIVE_FILE_ID = '1T6lGmTqb6JUkjxeBjDOMMClGRIb1149R';
const ASSET_NAME = 'Luna Getsuga Male';
const ASSET_SHA256 = '4f127840390322c8864d20151d9ed9a597198bd4c2344301a7e54ef34e38d26c';
const EXPECTED_SIZE = 3211804;

function decodeBase64(value: string) {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function sha256Hex(bytes: Uint8Array) {
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const svc = base44.asServiceRole;

    const existing = await svc.entities.Model3D.filter({ name: ASSET_NAME }, '-created_date', 5).catch(() => []);
    const cached = (existing || []).find((row: any) =>
      row?.file_url && String(row.description || '').includes(ASSET_SHA256)
    );
    if (cached) {
      return Response.json({ success: true, file_url: cached.file_url, model_id: cached.id, cached: true });
    }

    const { accessToken } = await svc.connectors.getConnection('googledrive');
    if (!accessToken) throw new Error('Google Drive connector did not return an access token.');

    const driveResponse = await fetch(`https://www.googleapis.com/drive/v3/files/${DRIVE_FILE_ID}?alt=media`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/octet-stream',
      },
    });
    if (!driveResponse.ok) {
      const body = await driveResponse.text().catch(() => '');
      throw new Error(`Google Drive download failed (${driveResponse.status}): ${body.slice(0, 500)}`);
    }

    const bytes = new Uint8Array(await driveResponse.arrayBuffer());
    if (bytes.byteLength !== EXPECTED_SIZE) {
      throw new Error(`Getsuga GLB size mismatch: got ${bytes.byteLength}, expected ${EXPECTED_SIZE}.`);
    }
    const digest = await sha256Hex(bytes);
    if (digest !== ASSET_SHA256) {
      throw new Error(`Getsuga GLB checksum mismatch: ${digest}.`);
    }

    const upload = await svc.integrations.Core.UploadFile({
      file: new File([bytes], 'Getsuga_Character.glb', { type: 'model/gltf-binary' }),
    });
    if (!upload?.file_url) throw new Error('Base44 UploadFile did not return a file URL.');

    const record = await svc.entities.Model3D.create({
      name: ASSET_NAME,
      description: `Canonical Luna male dashboard model. Source SHA256 ${ASSET_SHA256}`,
      file_url: upload.file_url,
      file_type: 'glb',
      file_size: EXPECTED_SIZE,
      category: 'Luna Avatar',
      tags: ['luna', 'male', 'getsuga', 'dashboard', 'canonical'],
      is_public: true,
      role: 'player',
      ai_enabled: false,
    });

    return Response.json({ success: true, file_url: upload.file_url, model_id: record?.id || null, cached: false });
  } catch (error) {
    console.error('[ensureGetsugaMaleAsset]', error);
    return Response.json({ success: false, error: error?.message || String(error) }, { status: 500 });
  }
});

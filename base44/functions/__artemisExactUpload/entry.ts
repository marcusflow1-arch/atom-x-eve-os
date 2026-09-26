import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const TOKEN = 'artemis-exact-20260926-f97995af';
const EXPECTED_SIZE = 7527252;
const EXPECTED_SHA256 = 'f97995af66c467ed48021fedf9338a0ef1fecbb8e59c3f38cc7bc5f8a83e140f';

const hex = (bytes: ArrayBuffer) => Array.from(new Uint8Array(bytes)).map((b) => b.toString(16).padStart(2, '0')).join('');

Deno.serve(async (req) => {
  try {
    if (req.method !== 'POST' || req.headers.get('x-artemis-token') !== TOKEN) {
      return Response.json({ error: 'Not found' }, { status: 404 });
    }

    const bytes = await req.arrayBuffer();
    if (bytes.byteLength !== EXPECTED_SIZE) {
      return Response.json({ error: 'Wrong Artemis file size', size: bytes.byteLength }, { status: 400 });
    }

    const digest = hex(await crypto.subtle.digest('SHA-256', bytes));
    if (digest !== EXPECTED_SHA256) {
      return Response.json({ error: 'Wrong Artemis file hash', sha256: digest }, { status: 400 });
    }

    const base44 = createClientFromRequest(req);
    const file = new File([bytes], 'Artemis_Character.glb', { type: 'model/gltf-binary' });
    const uploaded = await base44.asServiceRole.integrations.Core.UploadFile({ file });
    return Response.json({ success: true, file_url: uploaded.file_url, size: bytes.byteLength, sha256: digest });
  } catch (error) {
    console.error('Exact Artemis upload failed', error);
    return Response.json({ error: error?.message || String(error) }, { status: 500 });
  }
});
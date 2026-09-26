import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const TOKEN = '-G63lasg6uxEvkFSM6Ctt_0OuCdofSgmY58O8ruQfBc';
const EXPECTED_SIZE = 7527252;
const EXPECTED_SHA256 = 'f97995af66c467ed48021fedf9338a0ef1fecbb8e59c3f38cc7bc5f8a83e140f';

const hex = (bytes: Uint8Array) => Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('');

Deno.serve(async (req) => {
  try {
    if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });
    if (req.headers.get('x-artemis-upload-token') !== TOKEN) return new Response('Forbidden', { status: 403 });

    const body = new Uint8Array(await req.arrayBuffer());
    if (body.byteLength !== EXPECTED_SIZE) {
      return Response.json({ error: 'size_mismatch', received: body.byteLength, expected: EXPECTED_SIZE }, { status: 400 });
    }
    const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', body));
    const sha256 = hex(digest);
    if (sha256 !== EXPECTED_SHA256) {
      return Response.json({ error: 'sha256_mismatch', received: sha256, expected: EXPECTED_SHA256 }, { status: 400 });
    }

    const base44 = createClientFromRequest(req);
    const file = new File([body], 'Artemis_Character.glb', { type: 'model/gltf-binary' });
    const uploaded = await base44.asServiceRole.integrations.Core.UploadFile({ file });
    return Response.json({ success: true, file_url: uploaded.file_url, sha256, size: body.byteLength });
  } catch (error) {
    console.error('Exact Artemis upload failed', error);
    return Response.json({ error: String(error?.message || error) }, { status: 500 });
  }
});

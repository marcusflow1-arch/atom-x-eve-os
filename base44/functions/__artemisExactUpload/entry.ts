import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const EXPECTED_SIZE = 7527252;
const EXPECTED_SHA256 = 'f97995af66c467ed48021fedf9338a0ef1fecbb8e59c3f38cc7bc5f8a83e140f';
const hex = (bytes: ArrayBuffer) => Array.from(new Uint8Array(bytes)).map((b) => b.toString(16).padStart(2, '0')).join('');

Deno.serve(async (req) => {
  try {
    if (req.method !== 'POST') return Response.json({ error: 'Not found' }, { status: 404 });
    const body = await req.json().catch(() => ({}));
    const base44 = createClientFromRequest(req);
    const accessToken = await base44.asServiceRole.connectors.getAccessToken('googledrive');

    if (body.action === 'create_bridge') {
      const response = await fetch('https://www.googleapis.com/drive/v3/files?fields=id,name,mimeType,size', {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: '__atomxe_artemis_exact_bridge.glb', mimeType: 'model/gltf-binary' }),
      });
      const data = await response.json();
      if (!response.ok) return Response.json({ error: data?.error?.message || 'Bridge creation failed' }, { status: response.status });
      return Response.json({ success: true, bridge: data });
    }

    if (body.action === 'ingest_bridge') {
      const fileId = String(body.fileId || '');
      if (!fileId) return Response.json({ error: 'fileId required' }, { status: 400 });
      const response = await fetch(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?alt=media`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!response.ok) return Response.json({ error: 'Bridge download failed', status: response.status }, { status: response.status });
      const bytes = await response.arrayBuffer();
      const digest = hex(await crypto.subtle.digest('SHA-256', bytes));
      if (bytes.byteLength !== EXPECTED_SIZE || digest !== EXPECTED_SHA256) {
        return Response.json({ error: 'Artemis verification failed', size: bytes.byteLength, sha256: digest }, { status: 400 });
      }
      const file = new File([bytes], 'Artemis_Character.glb', { type: 'model/gltf-binary' });
      const uploaded = await base44.asServiceRole.integrations.Core.UploadFile({ file });
      return Response.json({ success: true, file_url: uploaded.file_url, size: bytes.byteLength, sha256: digest });
    }

    if (body.action === 'delete_bridge') {
      const fileId = String(body.fileId || '');
      const response = await fetch(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}`, {
        method: 'DELETE', headers: { Authorization: `Bearer ${accessToken}` },
      });
      return Response.json({ success: response.status === 204, status: response.status });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error?.message || String(error) }, { status: 500 });
  }
});
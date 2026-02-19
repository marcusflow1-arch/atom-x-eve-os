import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { action } = body;
    const accessToken = await base44.asServiceRole.connectors.getAccessToken("googledrive");

    switch (action) {
      case 'list': {
        const query = body.query || '';
        const pageToken = body.pageToken || '';
        const folderId = body.folderId || null;

        let q = 'trashed = false';
        if (query) q += ` and name contains '${query.replace(/'/g, "\\'")}'`;
        if (folderId) q += ` and '${folderId}' in parents`;

        const params = new URLSearchParams({
          q,
          fields: 'nextPageToken,files(id,name,mimeType,size,modifiedTime,createdTime,iconLink,thumbnailLink,webViewLink,webContentLink,shared,parents)',
          pageSize: '50',
          orderBy: 'modifiedTime desc',
        });
        if (pageToken) params.set('pageToken', pageToken);

        const resp = await fetch(`https://www.googleapis.com/drive/v3/files?${params}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        const data = await resp.json();
        if (!resp.ok) return Response.json({ error: data.error?.message || 'Failed to list files' }, { status: resp.status });
        return Response.json(data);
      }

      case 'get': {
        const { fileId } = body;
        const resp = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?fields=id,name,mimeType,size,modifiedTime,createdTime,webViewLink,webContentLink,shared,permissions,description`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        const data = await resp.json();
        if (!resp.ok) return Response.json({ error: data.error?.message || 'Failed to get file' }, { status: resp.status });
        return Response.json(data);
      }

      case 'upload': {
        const { fileName, mimeType, content, folderId } = body;
        const metadata = { name: fileName, mimeType: mimeType || 'application/octet-stream' };
        if (folderId) metadata.parents = [folderId];

        const boundary = '-------314159265358979323846';
        const delimiter = `\r\n--${boundary}\r\n`;
        const closeDelimiter = `\r\n--${boundary}--`;
        const multipartBody =
          delimiter +
          'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
          JSON.stringify(metadata) +
          delimiter +
          `Content-Type: ${mimeType || 'text/plain'}\r\n\r\n` +
          (content || '') +
          closeDelimiter;

        const resp = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,webViewLink,webContentLink,modifiedTime,createdTime', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': `multipart/related; boundary="${boundary}"`,
          },
          body: multipartBody,
        });
        const data = await resp.json();
        if (!resp.ok) return Response.json({ error: data.error?.message || 'Upload failed' }, { status: resp.status });
        return Response.json(data);
      }

      case 'createFolder': {
        const { folderName, parentId } = body;
        const metadata = { name: folderName, mimeType: 'application/vnd.google-apps.folder' };
        if (parentId) metadata.parents = [parentId];

        const resp = await fetch('https://www.googleapis.com/drive/v3/files?fields=id,name,mimeType,webViewLink,modifiedTime,createdTime', {
          method: 'POST',
          headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(metadata),
        });
        const data = await resp.json();
        if (!resp.ok) return Response.json({ error: data.error?.message || 'Failed to create folder' }, { status: resp.status });
        return Response.json(data);
      }

      case 'delete': {
        const { fileId } = body;
        const resp = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (resp.status === 204) return Response.json({ success: true });
        const data = await resp.json().catch(() => ({}));
        return Response.json({ error: data.error?.message || 'Delete failed' }, { status: resp.status });
      }

      case 'share': {
        const { fileId, email, role } = body;
        const resp = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}/permissions`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'user', role: role || 'reader', emailAddress: email }),
        });
        const data = await resp.json();
        if (!resp.ok) return Response.json({ error: data.error?.message || 'Share failed' }, { status: resp.status });
        return Response.json(data);
      }

      case 'rename': {
        const { fileId, newName } = body;
        const resp = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?fields=id,name,mimeType,webViewLink,modifiedTime`, {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: newName }),
        });
        const data = await resp.json();
        if (!resp.ok) return Response.json({ error: data.error?.message || 'Rename failed' }, { status: resp.status });
        return Response.json(data);
      }

      case 'getContent': {
        const { fileId } = body;
        const resp = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (!resp.ok) {
          const err = await resp.json().catch(() => ({}));
          return Response.json({ error: err.error?.message || 'Failed to get content' }, { status: resp.status });
        }
        const text = await resp.text();
        return Response.json({ content: text });
      }

      case 'updateContent': {
        const { fileId, content, mimeType } = body;
        const resp = await fetch(`https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media&fields=id,name,modifiedTime`, {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': mimeType || 'text/plain' },
          body: content,
        });
        const data = await resp.json();
        if (!resp.ok) return Response.json({ error: data.error?.message || 'Update failed' }, { status: resp.status });
        return Response.json(data);
      }

      default:
        return Response.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }
  } catch (error) {
    console.error('Google Drive function error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
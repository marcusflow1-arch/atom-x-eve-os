import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { createExtractorFromData } from 'npm:node-unrar-js@2.0.0';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const file_url = body?.file_url;
    if (!file_url) {
      return Response.json({ error: 'file_url is required' }, { status: 400 });
    }

    console.log('Downloading RAR from:', file_url);

    // Download the RAR file
    const fileResp = await fetch(file_url);
    if (!fileResp.ok) {
      return Response.json({ error: `Failed to download file: ${fileResp.status}` }, { status: 500 });
    }

    const arrayBuffer = await fileResp.arrayBuffer();
    console.log('Downloaded RAR, size:', arrayBuffer.byteLength);

    const buffer = new Uint8Array(arrayBuffer);

    let extractor;
    try {
      extractor = await createExtractorFromData({ data: buffer });
    } catch (e) {
      console.error('Failed to create RAR extractor:', e);
      return Response.json({ error: 'Failed to open RAR archive. File may be corrupted, a multi-part RAR that requires all parts, or password-protected.' }, { status: 400 });
    }

    const fileList = extractor.getFileList();
    const fileHeaders = [...fileList.fileHeaders];
    console.log('RAR file headers count:', fileHeaders.length);

    const skipPatterns = [
      'node_modules/', '.git/', '__pycache__/', '.ds_store', 'thumbs.db',
      'dist/', 'build/', '.vs/', '.idea/', '__macosx/', '.egstore/',
      'intermediate/', 'saved/', 'deriveddatacache/', 'binaries/',
    ];
    const textExts = [
      'json','yaml','yml','env','config','toml','ini','cfg',
      'js','jsx','ts','tsx','py','cs','cpp','c','java','rb','go','rs','h','hpp','lua','swift','kt',
      'csv','xlsx','xls','tsv',
      'md','txt','doc','docx','pdf','rst','log',
      'xml','html','htm','css','scss','less','sql','sh','bat','ps1','cmake','makefile',
    ];

    function shouldSkip(path) {
      const lower = path.toLowerCase();
      if (path.startsWith('.') || path.includes('/.')) return true;
      return skipPatterns.some(p => lower.includes(p));
    }

    function isTextFile(name) {
      const ext = name.split('.').pop()?.toLowerCase();
      return textExts.includes(ext);
    }

    const extractableFiles = fileHeaders.filter(h => {
      if (h.flags?.directory) return false;
      if (shouldSkip(h.name)) return false;
      if (!isTextFile(h.name)) return false;
      if (h.unpSize > 2 * 1024 * 1024) return false;
      return true;
    });

    console.log('Extractable text files:', extractableFiles.length);

    const extracted = extractor.extract({ 
      files: extractableFiles.map(h => h.name) 
    });

    const files = [];
    for (const file of extracted.files) {
      if (file.fileHeader.flags?.directory) continue;
      const bytes = file.extraction;
      if (!bytes || bytes.length === 0) continue;

      let content = '';
      try {
        content = new TextDecoder('utf-8', { fatal: false }).decode(bytes);
      } catch {
        continue;
      }
      if (!content || content.length < 5) continue;

      files.push({
        path: file.fileHeader.name,
        content: content.substring(0, 50000),
        size: bytes.length,
      });
    }

    console.log('Extracted files:', files.length);

    return Response.json({ 
      files,
      total_in_archive: fileHeaders.length,
      extracted_count: files.length,
    });

  } catch (error) {
    console.error('RAR extraction error:', error);
    return Response.json({ error: error.message || 'Unknown extraction error' }, { status: 500 });
  }
});
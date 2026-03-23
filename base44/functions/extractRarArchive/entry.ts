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
    let fileResp;
    try {
      fileResp = await fetch(file_url);
    } catch (fetchErr) {
      console.error('Fetch error:', fetchErr);
      return Response.json({ files: [], total_in_archive: 0, extracted_count: 0, error: 'Failed to download file' });
    }
    if (!fileResp.ok) {
      return Response.json({ files: [], total_in_archive: 0, extracted_count: 0, error: `Download failed: ${fileResp.status}` });
    }

    let arrayBuffer;
    try {
      arrayBuffer = await fileResp.arrayBuffer();
    } catch (bufErr) {
      console.error('Buffer read error:', bufErr);
      return Response.json({ files: [], total_in_archive: 0, extracted_count: 0, error: 'File too large for server memory' });
    }
    console.log('Downloaded RAR, size:', arrayBuffer.byteLength);

    const buffer = new Uint8Array(arrayBuffer);

    let extractor;
    try {
      extractor = await createExtractorFromData({ data: buffer });
    } catch (e) {
      console.error('Failed to create RAR extractor:', e);
      // Multi-part RARs or corrupted files — return empty instead of error status
      return Response.json({ files: [], total_in_archive: 0, extracted_count: 0, note: 'Could not open this RAR archive. If multi-part, individual parts cannot be extracted separately.' });
    }

    let fileHeaders;
    try {
      const fileList = extractor.getFileList();
      fileHeaders = [...fileList.fileHeaders];
    } catch (listErr) {
      console.error('Failed to list RAR contents (multi-part read error):', listErr.message);
      return Response.json({ files: [], total_in_archive: 0, extracted_count: 0, note: 'Could not read file list — this is likely a multi-part RAR that requires all parts together.' });
    }
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

    let extracted;
    try {
      extracted = extractor.extract({ 
        files: extractableFiles.map(h => h.name) 
      });
    } catch (e) {
      console.error('Extraction failed (may be incomplete multi-part):', e);
      return Response.json({ files: [], total_in_archive: fileHeaders.length, extracted_count: 0, note: 'Extraction failed — this part may not contain complete files.' });
    }

    const files = [];
    for (const file of extracted.files) {
      try {
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
      } catch (fileErr) {
        // Individual file extraction failed — skip and continue
        console.warn('Skipping file:', file?.fileHeader?.name, fileErr.message);
        continue;
      }
    }

    console.log('Extracted files:', files.length);

    return Response.json({ 
      files,
      total_in_archive: fileHeaders.length,
      extracted_count: files.length,
    });

  } catch (error) {
    console.error('RAR extraction error:', error);
    // Return graceful empty result instead of 500 so the frontend can continue processing other parts
    return Response.json({ 
      files: [], 
      total_in_archive: 0, 
      extracted_count: 0, 
      error: error.message || 'Unknown extraction error',
      note: 'Extraction failed for this archive part. It may require other parts to be complete.'
    });
  }
});
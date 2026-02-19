import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// Server-side archive extraction using node-unrar-js (pure JS RAR decompressor)
// This avoids browser CORS/worker issues with libarchive.js

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { file_url } = await req.json();
    if (!file_url) {
      return Response.json({ error: 'file_url is required' }, { status: 400 });
    }

    // Download the RAR file
    const fileResp = await fetch(file_url);
    if (!fileResp.ok) {
      return Response.json({ error: `Failed to download file: ${fileResp.status}` }, { status: 500 });
    }

    const arrayBuffer = await fileResp.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    // Use unrar.js (pure JavaScript RAR extractor)
    const { createExtractorFromData } = await import('npm:node-unrar-js@2.0.0');
    
    const extractor = await createExtractorFromData({ data: buffer });
    const fileList = extractor.getFileList();
    const fileHeaders = [...fileList.fileHeaders];

    // Classify which files to extract (text-based, not junk)
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
      if (h.unpSize > 2 * 1024 * 1024) return false; // skip > 2MB
      return true;
    });

    // Extract only text files
    const extracted = extractor.extract({ 
      files: extractableFiles.map(h => h.name) 
    });

    const files = [];
    for (const file of extracted.files) {
      if (file.fileHeader.flags?.directory) continue;
      
      // file.extraction is a Uint8Array
      const bytes = file.extraction;
      if (!bytes || bytes.length === 0) continue;

      // Convert to text
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
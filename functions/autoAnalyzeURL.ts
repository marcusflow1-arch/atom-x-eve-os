import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // This is called by entity automation on PendingKnowledgeURL create
    const body = await req.json();
    const entityId = body?.event?.entity_id;
    const record = body?.data;

    if (!entityId || !record?.url) {
      return Response.json({ error: 'No entity data' }, { status: 400 });
    }

    // Mark as processing
    await base44.asServiceRole.entities.PendingKnowledgeURL.update(entityId, { status: 'processing' });

    const url = record.url;
    const label = record.label || url.split('/').pop() || 'file';
    const folderLabel = record.folder_label || '';

    // Check existing knowledge to deduplicate
    let existingNames;
    try {
      const existing = await base44.asServiceRole.entities.KnowledgeEntry.list('-created_date', 500);
      existingNames = new Set(existing.map(e => e.source_filename));
    } catch {
      existingNames = new Set();
    }

    if (existingNames.has(label)) {
      await base44.asServiceRole.entities.PendingKnowledgeURL.update(entityId, { 
        status: 'completed', 
        error_message: 'Skipped — duplicate label already exists in knowledge bank' 
      });
      return Response.json({ status: 'skipped', reason: 'duplicate' });
    }

    // Convert Google/GitHub links to fetchable URLs
    let fetchUrl = url;

    const gdocMatch = url.match(/docs\.google\.com\/document\/d\/([a-zA-Z0-9_-]+)/);
    if (gdocMatch) fetchUrl = `https://docs.google.com/document/d/${gdocMatch[1]}/export?format=txt`;

    const gsheetMatch = url.match(/docs\.google\.com\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
    if (gsheetMatch) fetchUrl = `https://docs.google.com/spreadsheets/d/${gsheetMatch[1]}/export?format=csv`;

    const gdriveMatch = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (gdriveMatch) fetchUrl = `https://drive.google.com/uc?export=download&id=${gdriveMatch[1]}`;

    if (url.includes('github.com') && !url.includes('raw.githubusercontent.com')) {
      fetchUrl = url.replace('github.com', 'raw.githubusercontent.com').replace('/blob/', '/');
    }

    // Fetch the file content
    const response = await fetch(fetchUrl, {
      headers: { 'User-Agent': 'AtomEve-Engine/1.0' },
      redirect: 'follow',
    });

    if (!response.ok) {
      await base44.asServiceRole.entities.PendingKnowledgeURL.update(entityId, { 
        status: 'failed', 
        error_message: `Fetch failed: HTTP ${response.status}` 
      });
      return Response.json({ error: `HTTP ${response.status}` }, { status: 502 });
    }

    const contentType = response.headers.get('content-type') || '';
    let content = '';

    if (contentType.includes('text') || contentType.includes('json') || contentType.includes('csv') ||
        contentType.includes('xml') || contentType.includes('javascript') || contentType.includes('yaml') ||
        contentType.includes('html') || contentType.includes('plain') || contentType.includes('octet-stream')) {
      content = await response.text();
    } else {
      content = `[Binary file: ${contentType}. URL: ${url}]`;
    }

    const truncated = content.substring(0, 50000);

    // Classify
    const ext = label.split('.').pop()?.toLowerCase() || 'txt';
    let category = 'other';
    if (['json','yaml','yml','env','config','toml','ini','cfg'].includes(ext)) category = 'config';
    else if (['js','jsx','ts','tsx','py','cs','cpp','c','java','rb','go','rs','h','hpp','lua'].includes(ext)) category = 'code';
    else if (['csv','xlsx','xls','tsv'].includes(ext)) category = 'data';
    else if (['md','txt','doc','docx','pdf','rst'].includes(ext)) category = 'documentation';
    else if (['png','jpg','jpeg','gif','webp','svg','glb','gltf','fbx','obj'].includes(ext)) category = 'asset';

    // If it's a Google Doc/Sheet with no file extension, detect from content
    if (gdocMatch || gsheetMatch) {
      category = gsheetMatch ? 'data' : 'documentation';
    }

    // Auto-detect knowledge domain
    const lowerContent = truncated.toLowerCase().substring(0, 3000);
    const lowerLabel = label.toLowerCase();
    let knowledgeDomain = 'general';
    const gameIndicators = ['unreal', 'unity', 'godot', 'ue4', 'ue5', 'uproject', 'blueprint', 'gamemode', 'pawn', 'actor', 'playercontroller'];
    const engineIndicators = ['three.js', 'threejs', 'webgl', 'shader', 'glsl', 'scene.add', 'renderer'];
    if (gameIndicators.some(i => lowerLabel.includes(i) || lowerContent.includes(i))) knowledgeDomain = 'game_reference';
    else if (engineIndicators.some(i => lowerLabel.includes(i) || lowerContent.includes(i))) knowledgeDomain = 'engine_building';
    if (folderLabel && folderLabel.startsWith('🎮')) knowledgeDomain = 'game_reference';

    // AI Analysis — pull EVERYTHING: code, structure, patterns, architecture
    const analysis = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `You are an EXHAUSTIVE knowledge extraction engine for a game development platform. 
Your job is to extract EVERY piece of useful information from this file — leave nothing behind.

FILE: "${label}" (category: ${category}, source URL: ${url})
${folderLabel ? `BATCH CONTEXT: ${folderLabel}` : ''}

--- FILE CONTENT (up to 50KB) ---
${truncated}
--- END ---

Extract and organize ALL of the following:

## Summary
3-5 detailed paragraphs about what this file is, what it does, and why it matters.

## Architecture & Structure
How is this code/data organized? What design patterns are used? Class hierarchies? Module structure?

## Key Knowledge Extracted
Every function, class, method, constant, API endpoint, data schema, config value — enumerate them ALL.

## Code Patterns & Snippets
Extract the most important code blocks verbatim in fenced code blocks. Include function signatures, class definitions, key algorithms.

## Data Structures & Schemas
Any JSON schemas, data models, type definitions, database structures, config formats.

## Dependencies & Integrations
What external libraries, APIs, services does this reference? Version numbers if visible.

## Integration Guide
How could this knowledge be applied in a React + Three.js web game engine?

## Tags
25 relevant tags for search and categorization.`,
    });

    // Parse tags
    const tagMatch = analysis.match(/##\s*Tags\s*\n([\s\S]*?)(?:\n##|$)/i);
    const tags = tagMatch ? (tagMatch[1].match(/[\w.-]+/g)?.filter(t => t.length > 1 && t.length < 30).slice(0, 25) || []) : [];

    // Parse code blocks
    const codeBlocks = [];
    const codeRegex = /```[\w]*\n([\s\S]*?)```/g;
    let codeMatch;
    while ((codeMatch = codeRegex.exec(analysis)) !== null) codeBlocks.push(codeMatch[1].trim());

    // Parse summary
    const summaryMatch = analysis.match(/##\s*Summary\s*\n([\s\S]*?)(?:\n##|$)/i);
    const summary = summaryMatch ? summaryMatch[1].trim().substring(0, 500) : label;

    // Save to KnowledgeEntry
    const entry = await base44.asServiceRole.entities.KnowledgeEntry.create({
      source_filename: label,
      file_type: ext,
      file_size: content.length,
      summary,
      full_analysis: analysis,
      extracted_code: codeBlocks.join('\n\n// ───────────────────\n\n'),
      tags,
      category,
      knowledge_domain: knowledgeDomain,
      is_pinned: false,
    });

    // Mark as completed with the knowledge entry ID
    await base44.asServiceRole.entities.PendingKnowledgeURL.update(entityId, { 
      status: 'completed', 
      knowledge_entry_id: entry.id 
    });

    return Response.json({ success: true, knowledge_entry_id: entry.id });
  } catch (error) {
    // Try to mark as failed
    try {
      const body2 = await req.clone().json().catch(() => ({}));
      const eid = body2?.event?.entity_id;
      if (eid) {
        const base44f = createClientFromRequest(req);
        await base44f.asServiceRole.entities.PendingKnowledgeURL.update(eid, { 
          status: 'failed', 
          error_message: error.message 
        });
      }
    } catch {}
    return Response.json({ error: error.message }, { status: 500 });
  }
});
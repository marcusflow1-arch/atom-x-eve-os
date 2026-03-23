import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { urls, folderLabel } = await req.json();
    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return Response.json({ error: 'urls array is required' }, { status: 400 });
    }

    const results = { processed: 0, failed: 0, skipped: 0, errors: [] };

    // Check existing knowledge to deduplicate
    let existingNames;
    try {
      const existing = await base44.entities.KnowledgeEntry.list('-created_date', 500);
      existingNames = new Set(existing.map(e => e.source_filename));
    } catch {
      existingNames = new Set();
    }

    for (const urlItem of urls.slice(0, 50)) { // Max 50 URLs per batch
      const url = typeof urlItem === 'string' ? urlItem : urlItem.url;
      const label = typeof urlItem === 'string' ? url.split('/').pop() || 'file' : (urlItem.label || url.split('/').pop() || 'file');

      // Skip duplicates
      if (existingNames.has(label)) {
        results.skipped++;
        continue;
      }

      try {
        // Convert Google Docs/Sheets/Drive share links to export URLs
        let fetchUrl = url;
        
        // Google Docs → export as plain text
        const gdocMatch = url.match(/docs\.google\.com\/document\/d\/([a-zA-Z0-9_-]+)/);
        if (gdocMatch) {
          fetchUrl = `https://docs.google.com/document/d/${gdocMatch[1]}/export?format=txt`;
        }

        // Google Sheets → export as CSV
        const gsheetMatch = url.match(/docs\.google\.com\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
        if (gsheetMatch) {
          fetchUrl = `https://docs.google.com/spreadsheets/d/${gsheetMatch[1]}/export?format=csv`;
        }

        // Google Drive file → direct download
        const gdriveMatch = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
        if (gdriveMatch) {
          fetchUrl = `https://drive.google.com/uc?export=download&id=${gdriveMatch[1]}`;
        }

        // GitHub → raw
        if (url.includes('github.com') && !url.includes('raw.githubusercontent.com')) {
          fetchUrl = url.replace('github.com', 'raw.githubusercontent.com').replace('/blob/', '/');
        }

        // Fetch the content
        const response = await fetch(fetchUrl, {
          headers: { 'User-Agent': 'AtomEve-Engine/1.0' },
          redirect: 'follow',
        });

        if (!response.ok) {
          results.errors.push({ url, error: `HTTP ${response.status}` });
          results.failed++;
          continue;
        }

        const contentType = response.headers.get('content-type') || '';
        let content = '';

        // Only process text-based content
        if (contentType.includes('text') || contentType.includes('json') || contentType.includes('csv') ||
            contentType.includes('xml') || contentType.includes('javascript') || contentType.includes('yaml') ||
            contentType.includes('html') || contentType.includes('plain')) {
          content = await response.text();
        } else {
          // Binary — skip for now
          content = `[Binary file: ${contentType}. URL: ${url}]`;
        }

        // Truncate to 50KB for the LLM
        const truncated = content.substring(0, 50000);

        // Classify file type
        const ext = label.split('.').pop()?.toLowerCase() || 'txt';
        let category = 'other';
        if (['json','yaml','yml','env','config','toml','ini','cfg'].includes(ext)) category = 'config';
        else if (['js','jsx','ts','tsx','py','cs','cpp','c','java','rb','go','rs','h','hpp','lua'].includes(ext)) category = 'code';
        else if (['csv','xlsx','xls','tsv'].includes(ext)) category = 'data';
        else if (['md','txt','doc','docx','pdf','rst'].includes(ext)) category = 'documentation';
        else if (['png','jpg','jpeg','gif','webp','svg','glb','gltf','fbx','obj'].includes(ext)) category = 'asset';

        // Auto-detect knowledge domain
        const lowerContent = truncated.toLowerCase().substring(0, 3000);
        const lowerLabel = label.toLowerCase();
        let knowledgeDomain = 'general';
        const gameIndicators = ['unreal', 'unity', 'godot', 'ue4', 'ue5', 'uproject', 'blueprint', 'gamemode', 'pawn', 'actor', 'playercontroller'];
        const engineIndicators = ['three.js', 'threejs', 'webgl', 'shader', 'glsl', 'scene.add', 'renderer'];
        if (gameIndicators.some(i => lowerLabel.includes(i) || lowerContent.includes(i))) knowledgeDomain = 'game_reference';
        else if (engineIndicators.some(i => lowerLabel.includes(i) || lowerContent.includes(i))) knowledgeDomain = 'engine_building';
        if (folderLabel && folderLabel.startsWith('🎮')) knowledgeDomain = 'game_reference';

        // AI Analysis
        const analysis = await base44.integrations.Core.InvokeLLM({
          prompt: `You are an ADVANCED LEARNING ENGINE for a game development platform.
Your primary directive is: Learn everything from the file, store the knowledge, and use that for your own basic understanding.
Do not just summarize. You must break down, examine, and absorb the core principles, patterns, and logic so you fully comprehend it as part of your core knowledge base.

FILE: "${label}" (${category}, from URL: ${url})

--- FILE CONTENT ---
${truncated}
--- END ---

Perform a complete breakdown and return the following EXHAUSTIVE analysis:

## Complete Comprehension
3-5 detailed paragraphs explaining what you have learned from this file for your own understanding. What are the underlying mechanics and logic?

## Architecture & Design Patterns
How is the system built? What structural patterns are used?

## Core Mechanics & Breakdown
Break down the complex logic into digestable principles. What exactly makes this file tick?

## Key Knowledge Extracted
List every significant function, class, variable, constant, and configuration option. Explain what each one does and why it matters.

## Code Patterns & Snippets (Verbatim)
Extract the most important/complex code blocks exactly as they are. This is crucial reference material for your memory.

## Data Structures & Schemas
Document every JSON structure, type definition, database schema, or data model found.

## Actionable Integration
How you would use this knowledge going forward to build similar systems or interface with it.

## Dependencies
External libraries, APIs, or assets required.

## Tags
15-25 single-word tags covering technology, domain, patterns, and concepts.`,
        });

        // Parse tags
        const tagMatch = analysis.match(/##\s*Tags\s*\n([\s\S]*?)(?:\n##|$)/i);
        const tags = tagMatch ? (tagMatch[1].match(/[\w.-]+/g)?.filter(t => t.length > 1 && t.length < 30).slice(0, 25) || []) : [];

        // Parse code blocks
        const codeBlocks = [];
        const codeRegex = /```[\w]*\n([\s\S]*?)```/g;
        let match;
        while ((match = codeRegex.exec(analysis)) !== null) codeBlocks.push(match[1].trim());

        // Parse summary
        const summaryMatch = analysis.match(/##\s*Summary\s*\n([\s\S]*?)(?:\n##|$)/i);
        const summary = summaryMatch ? summaryMatch[1].trim().substring(0, 500) : label;

        // Save to KnowledgeEntry
        await base44.entities.KnowledgeEntry.create({
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

        existingNames.add(label);
        results.processed++;
      } catch (err) {
        results.errors.push({ url, error: err.message || String(err) });
        results.failed++;
      }
    }

    return Response.json({ success: true, ...results });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
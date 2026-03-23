import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const reqClone = req.clone();
  let base44;

  try {
    base44 = createClientFromRequest(req);

    // This is called by entity automation on PendingKnowledgeURL create
    const body = await reqClone.json();
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

    // ─── Google Drive FOLDER detection ───
    const gdriveFolderMatch = url.match(/drive\.google\.com\/drive\/(?:u\/\d+\/)?folders\/([a-zA-Z0-9_-]+)/);
    if (gdriveFolderMatch) {
      const folderId = gdriveFolderMatch[1];
      const folderName = folderLabel || label || `Folder: ${folderId}`;

      // 1. Try Google Drive API first (more reliable for large folders)
      let items = [];
      try {
        const token = await base44.asServiceRole.connectors.getAccessToken("googledrive");
        if (token) {
          console.log('Attempting to list folder via API with token...');
          // Fetch pages of files until we have them all or hit a limit
          let pageToken = null;
          do {
            const query = `'${folderId}' in parents and trashed = false`;
            const fields = 'nextPageToken, files(id, name, mimeType)';
            const apiUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=${encodeURIComponent(fields)}&pageSize=1000${pageToken ? `&pageToken=${pageToken}` : ''}`;
            
            const apiResp = await fetch(apiUrl, { headers: { Authorization: `Bearer ${token}` } });
            if (apiResp.ok) {
              const data = await apiResp.json();
              if (data.files && data.files.length > 0) {
                const apiItems = data.files.map(f => ({
                  id: f.id,
                  name: f.name,
                  isFolder: f.mimeType === 'application/vnd.google-apps.folder'
                }));
                items.push(...apiItems);
              }
              pageToken = data.nextPageToken;
            } else {
              console.log('API list failed:', await apiResp.text());
              pageToken = null;
            }
          } while (pageToken && items.length < 500); // Safety limit
        }
      } catch (e) {
        console.log('API list error (skipping to scrape):', e.message);
      }

      // 2. Fallback to scraping if API failed or returned nothing (common with restricted scopes)
      if (items.length === 0) {
        console.log('API returned 0 items, falling back to HTML scraping...');
        items = await scrapePublicDriveFolder(folderId);
      }

      if (items.length === 0) {
        await base44.asServiceRole.entities.PendingKnowledgeURL.update(entityId, {
          status: 'failed',
          error_message: 'Could not list folder contents. Make sure the folder is set to "Anyone with the link can view".',
        });
        return Response.json({ error: 'Cannot list folder' }, { status: 400 });
      }

      // Separate folders and files
      const subFolders = items.filter(i => i.isFolder);
      const files = items.filter(i => !i.isFolder);

      // Queue each file as a PendingKnowledgeURL
      let queued = 0;
      for (const file of files.slice(0, 100)) {
        try {
          const fileUrl = `https://drive.google.com/file/d/${file.id}/view`;
          await base44.asServiceRole.entities.PendingKnowledgeURL.create({
            url: fileUrl,
            label: file.name || `file_${file.id}`,
            folder_label: folderName,
            status: 'pending',
          });
          queued++;
        } catch (err) {
          console.error(`Failed to queue file ${file.id}:`, err);
          // Skip and continue
        }
      }

      // Queue each subfolder as a PendingKnowledgeURL (recursive crawl)
      for (const sub of subFolders) {
        try {
          const subUrl = `https://drive.google.com/drive/folders/${sub.id}`;
          await base44.asServiceRole.entities.PendingKnowledgeURL.create({
            url: subUrl,
            label: sub.name || `subfolder_${sub.id}`,
            folder_label: folderName + ' > ' + (sub.name || sub.id),
            status: 'pending',
          });
          queued++;
        } catch (err) {
           console.error(`Failed to queue folder ${sub.id}:`, err);
           // Skip and continue
        }
      }

      // Mark the folder entry as completed
      await base44.asServiceRole.entities.PendingKnowledgeURL.update(entityId, {
        status: 'completed',
        error_message: `Folder scanned: found ${files.length} files + ${subFolders.length} subfolders, queued ${queued} total for analysis.`,
      });

      return Response.json({ success: true, folder: true, files: files.length, subfolders: subFolders.length, queued });
    }

    // ─── Single file processing (original logic) ───

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
        error_message: 'Skipped — duplicate label already exists in knowledge bank',
      });
      return Response.json({ status: 'skipped', reason: 'duplicate' });
    }

    // Convert Google/GitHub links to fetchable URLs
    let fetchUrl = url;

    const gdocMatch = url.match(/docs\.google\.com\/document\/d\/([a-zA-Z0-9_-]+)/);
    if (gdocMatch) fetchUrl = `https://docs.google.com/document/d/${gdocMatch[1]}/export?format=txt`;

    const gsheetMatch = url.match(/docs\.google\.com\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
    if (gsheetMatch) fetchUrl = `https://docs.google.com/spreadsheets/d/${gsheetMatch[1]}/export?format=csv`;

    const gdriveFileMatch = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
    let driveFileToken = null;
    if (gdriveFileMatch) {
      // Try OAuth first for private files, fall back to public export for public files
      try {
        driveFileToken = await base44.asServiceRole.connectors.getAccessToken("googledrive");
        fetchUrl = `https://www.googleapis.com/drive/v3/files/${gdriveFileMatch[1]}?alt=media`;
      } catch {
        fetchUrl = `https://drive.google.com/uc?export=download&id=${gdriveFileMatch[1]}`;
      }
    }

    if (url.includes('github.com') && !url.includes('raw.githubusercontent.com')) {
      fetchUrl = url.replace('github.com', 'raw.githubusercontent.com').replace('/blob/', '/');
    }

    // Fetch the file content
    const fetchHeaders = { 'User-Agent': 'AtomEve-Engine/1.0' };
    if (driveFileToken) fetchHeaders['Authorization'] = `Bearer ${driveFileToken}`;
    
    const response = await fetch(fetchUrl, {
      headers: fetchHeaders,
      redirect: 'follow',
    });

    let content = '';
    let fetchError = null;

    if (!response.ok) {
      fetchError = `HTTP ${response.status}`;
      // Fallback: Try to use LLM with internet access to read the page content if direct fetch fails
      console.log(`Direct fetch failed (${fetchError}), attempting LLM fallback for: ${url}`);
      
      try {
        const fallbackAnalysis = await base44.asServiceRole.integrations.Core.InvokeLLM({
          prompt: `Please access the following URL and extract its full text content for analysis. URL: ${url}
          
          If you can read it, return the content. If not, describe what you see.`,
          add_context_from_internet: true
        });
        content = fallbackAnalysis;
      } catch (e) {
        console.error('LLM fallback failed:', e);
        await base44.asServiceRole.entities.PendingKnowledgeURL.update(entityId, {
          status: 'failed',
          error_message: `Fetch failed: ${fetchError}. Fallback also failed.`,
        });
        return Response.json({ error: `Fetch failed: ${fetchError}` }, { status: 502 });
      }
    } else {
      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('text') || contentType.includes('json') || contentType.includes('csv') ||
          contentType.includes('xml') || contentType.includes('javascript') || contentType.includes('yaml') ||
          contentType.includes('html') || contentType.includes('plain') || contentType.includes('octet-stream')) {
        content = await response.text();
      } else {
        content = `[Binary file: ${contentType}. URL: ${url}]`;
      }
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

    // AI Analysis - Enhanced for "Learning and Adapting"
    const analysis = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `You are an ADVANCED LEARNING ENGINE for a game development platform.
Your goal is not just to summarize, but to STUDY, LEARN, and ADAPT from this file.
Analyze it deeply to understand its logic, patterns, and structure so we can replicate or interface with it.

FILE: "${label}" (category: ${category}, source URL: ${url})
${folderLabel ? `BATCH CONTEXT: ${folderLabel}` : ''}

--- FILE CONTENT (up to 50KB) ---
${truncated}
--- END ---

Perform a deep study and return the following EXHAUSTIVE analysis:

## Summary & Core Concept
3-5 detailed paragraphs. What is this? How does it think? What is its unique value or logic?

## Architecture & Design Patterns
How is it structured? What patterns (Singleton, Factory, Component, etc.) does it use? How does it manage state?

## Learning & Adaptation
If we were to recreate this or integrate it into a React + Three.js engine:
- What are the critical logic flows we need to copy?
- What are the "gotchas" or complex parts we need to be careful about?
- How can we adapt its logic for our context?

## Key Knowledge Extracted
List every significant function, class, variable, constant, and configuration option. Explain what each one does.

## Code Patterns & Snippets (Verbatim)
Extract the most important/complex code blocks exactly as they are. We need these for reference.

## Data Structures & Schemas
Document every JSON structure, type definition, database schema, or data model found.

## Integration Guide
Concrete steps to use this knowledge. "To implement this feature, you would..."

## Dependencies
External libraries, APIs, or assets required.

## Tags
25 relevant tags for search and categorization (e.g. "unreal", "ai", "pathfinding", "blueprint").`,
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

    // Mark as completed
    await base44.asServiceRole.entities.PendingKnowledgeURL.update(entityId, {
      status: 'completed',
      knowledge_entry_id: entry.id,
    });

    return Response.json({ success: true, knowledge_entry_id: entry.id });
  } catch (error) {
    // Try to mark as failed
    try {
      const body2 = await req.clone().json().catch(() => ({}));
      const eid = body2?.event?.entity_id;
      if (eid && base44) {
        await base44.asServiceRole.entities.PendingKnowledgeURL.update(eid, {
          status: 'failed',
          error_message: error.message || String(error),
        });
      }
    } catch {}
    return Response.json({ error: error.message }, { status: 500 });
  }
});

// ─── Scrape a public Google Drive folder page to get items ───
async function scrapePublicDriveFolder(folderId) {
  const items = [];

  try {
    // Fetch the public Drive folder HTML page
    const pageUrl = `https://drive.google.com/drive/folders/${folderId}`;
    const resp = await fetch(pageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      redirect: 'follow',
    });

    if (!resp.ok) {
      console.log('Drive page fetch failed:', resp.status);
      return items;
    }

    const html = await resp.text();

    // Method 1: Extract from the embedded JSON data in the page
    // Google Drive embeds file data in a JS variable/data structure
    // Look for patterns like: data-id="FILEID" and data-target="FILEID"
    
    // Extract file IDs and names from the page data
    // Pattern: ["FILE_ID","FILE_NAME",... where the mimeType follows
    const dataPattern = /\["([a-zA-Z0-9_-]{20,})","([^"]*?)","https:\/\/drive\.google\.com/g;
    let match;
    const seenIds = new Set();
    while ((match = dataPattern.exec(html)) !== null) {
      const id = match[1];
      const name = match[2];
      if (!seenIds.has(id) && id !== folderId) {
        seenIds.add(id);
        items.push({ id, name, isFolder: false });
      }
    }

    // Also look for folder pattern in the data
    // Folders have mimeType "application/vnd.google-apps.folder"
    const folderPattern = /application\/vnd\.google-apps\.folder[^"]*"[^"]*"[^"]*"([a-zA-Z0-9_-]{20,})"/g;
    while ((match = folderPattern.exec(html)) !== null) {
      const id = match[1];
      const existing = items.find(i => i.id === id);
      if (existing) existing.isFolder = true;
    }

    // Method 2: Parse the structured data blob that Google Drive embeds
    // Look for the key data structure pattern
    const keyDataPattern = /\[null,null,null,"([a-zA-Z0-9_-]{25,})","([^"]+?)"/g;
    while ((match = keyDataPattern.exec(html)) !== null) {
      const id = match[1];
      const name = match[2];
      if (!seenIds.has(id) && id !== folderId) {
        seenIds.add(id);
        items.push({ id, name, isFolder: false });
      }
    }

    // Method 3: Look for the wiz data structure entries
    // Pattern: ,"ID","NAME","MIMETYPE"
    const wizPattern = /,"([a-zA-Z0-9_-]{20,})","([^"]{1,200})","(application\/[^"]+|text\/[^"]+|image\/[^"]+|video\/[^"]+|audio\/[^"]+)"/g;
    while ((match = wizPattern.exec(html)) !== null) {
      const id = match[1];
      const name = match[2];
      const mimeType = match[3];
      if (!seenIds.has(id) && id !== folderId) {
        seenIds.add(id);
        const isFolder = mimeType === 'application/vnd.google-apps.folder';
        items.push({ id, name, isFolder });
      }
    }

    // Method 4: Simple ID extraction as fallback - look for any 33-char IDs that appear in context
    if (items.length === 0) {
      // Try to find IDs near known patterns
      const simplePattern = /\["([a-zA-Z0-9_-]{25,44})"/g;
      while ((match = simplePattern.exec(html)) !== null) {
        const id = match[1];
        if (!seenIds.has(id) && id !== folderId && id.length <= 44) {
          seenIds.add(id);
          items.push({ id, name: `item_${id.substring(0, 8)}`, isFolder: false });
        }
      }
    }

    console.log(`Scraped ${items.length} items from public Drive folder ${folderId}`);
    
    // Detect folders by checking if any item name looks like a folder (no extension)
    for (const item of items) {
      if (item.name && !item.isFolder) {
        const hasExtension = /\.[a-zA-Z0-9]{1,10}$/.test(item.name);
        if (!hasExtension && item.name !== `item_${item.id.substring(0, 8)}`) {
          // Likely a folder - names without extensions
          // But could also be a doc. Mark as potential folder
        }
      }
    }

  } catch (error) {
    console.log('Scrape error:', error.message);
  }

  return items;
}
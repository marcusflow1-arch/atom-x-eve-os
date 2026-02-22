import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import JSZip from 'npm:jszip@3.10.1';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { fileUrl, environmentName = "Room 4" } = await req.json();

    if (!fileUrl) {
        return Response.json({ error: 'No file URL provided' }, { status: 400 });
    }

    console.log(`Processing Unreal/Asset pack for: ${environmentName}`);

    // 1. Fetch the ZIP
    const response = await fetch(fileUrl);
    const arrayBuffer = await response.arrayBuffer();
    
    // 2. Load ZIP
    const zip = await JSZip.loadAsync(arrayBuffer);
    
    let bestCandidate = null;
    let maxScore = -1;

    // 3. Smart Scan for "Map" / "Demo" / "Level" file
    zip.forEach((relativePath, zipEntry) => {
        if (zipEntry.dir) return;
        
        const path = relativePath.toLowerCase();
        
        // Skip system files
        if (path.includes('__macosx') || path.includes('.ds_store')) return;

        // Must be a 3D format we can likely support (FBX is most common in Source folders)
        // GLB/GLTF is best, OBJ is fallback
        const is3D = path.endsWith('.fbx') || path.endsWith('.glb') || path.endsWith('.gltf') || path.endsWith('.obj');
        
        if (is3D) {
            let score = 0;
            const size = zipEntry._data?.uncompressedSize || 0;
            
            // Size factor (maps are usually big)
            score += Math.min(size / 1024 / 1024, 50); // Up to 50 points for size

            // Name factor (Key keywords for maps)
            if (path.includes('demo') && path.includes('map')) score += 100;
            else if (path.includes('overview')) score += 80;
            else if (path.includes('level_')) score += 60;
            else if (path.includes('scene')) score += 50;
            else if (path.includes('environment')) score += 40;
            else if (path.includes('merged')) score += 30; // Merged actors
            
            // Prefer "Source" directory if it exists (Unreal packs often put source FBX there)
            if (path.includes('source/') || path.includes('src/')) score += 20;

            if (score > maxScore) {
                maxScore = score;
                bestCandidate = { path: relativePath, entry: zipEntry, score };
            }
        }
    });

    if (!bestCandidate) {
        return Response.json({ 
            error: 'No compatible 3D map file (FBX/GLB/OBJ) found in archive. Ensure the pack includes Source files.' 
        }, { status: 400 });
    }

    console.log(`Selected candidate: ${bestCandidate.path} (Score: ${bestCandidate.score})`);

    // 4. Extract and Upload Best Candidate
    const blob = await bestCandidate.entry.async('blob');
    // Sanitize name
    const ext = bestCandidate.path.split('.').pop();
    const safeName = `Room4_Constructed.${ext}`;
    const fileObj = new File([blob], safeName, { type: 'application/octet-stream' });
    
    const uploadRes = await base44.asServiceRole.integrations.Core.UploadFile({ file: fileObj });
    
    // 5. Create the Environment Entity
    const entity = await base44.asServiceRole.entities.Model3D.create({
        name: environmentName,
        description: `Auto-constructed from ${bestCandidate.path}`,
        file_url: uploadRes.file_url,
        file_type: ext,
        category: 'environment',
        is_bundle: false,
        use_mesh_collision: true,
        tags: ['room4', 'unreal_import', 'constructed'],
        // Set specific spawn if it looks like a demo map
        player_spawn: { x: 0, y: 1, z: 0 }
    });

    return Response.json({ 
        success: true, 
        entityId: entity.id,
        mapPath: bestCandidate.path,
        message: `Constructed "Room 4" from ${bestCandidate.path}`
    });

  } catch (error) {
    console.error('Room 4 construction error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
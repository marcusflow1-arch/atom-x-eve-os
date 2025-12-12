import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import * as zip from "https://deno.land/x/zipjs@v2.7.34/index.js";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { fileUrl, fileName, fileType } = await req.json();

    if (fileType !== 'zip') {
      return Response.json({ 
        success: true, 
        modelUrl: fileUrl,
        originalFileName: fileName
      });
    }

    // Download the ZIP file
    const zipResponse = await fetch(fileUrl);
    const zipBlob = await zipResponse.blob();
    
    // Extract ZIP contents
    const zipReader = new zip.ZipReader(new zip.BlobReader(zipBlob));
    const entries = await zipReader.getEntries();
    
    // Find the first .glb or .gltf file
    const modelEntry = entries.find(entry => 
      !entry.directory && (entry.filename.endsWith('.glb') || entry.filename.endsWith('.gltf'))
    );
    
    if (!modelEntry) {
      await zipReader.close();
      return Response.json({ 
        success: false, 
        error: 'No .glb or .gltf file found in ZIP' 
      }, { status: 400 });
    }

    // Extract the model file
    const modelBlob = await modelEntry.getData(new zip.BlobWriter());
    const modelFile = new File([modelBlob], modelEntry.filename, {
      type: modelEntry.filename.endsWith('.glb') ? 'model/gltf-binary' : 'model/gltf+json'
    });
    
    await zipReader.close();

    // Upload the extracted model
    const { file_url: modelUrl } = await base44.integrations.Core.UploadFile({ 
      file: modelFile 
    });

    return Response.json({
      success: true,
      modelUrl: modelUrl,
      originalFileName: modelEntry.filename
    });

  } catch (error) {
    console.error('ZIP processing error:', error);
    return Response.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
});
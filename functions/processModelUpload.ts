import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import JSZip from 'npm:jszip@3.10.1';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { fileUrl, fileName, fileType } = await req.json();

    // If it's a ZIP file, extract and find the model
    if (fileType === 'zip') {
      // Fetch the ZIP file
      const zipResponse = await fetch(fileUrl);
      
      // Check content length if available
      const contentLength = zipResponse.headers.get('content-length');
      if (contentLength && parseInt(contentLength) > 100 * 1024 * 1024) {
          throw new Error('ZIP file too large for automatic processing (max 100MB). Please extract locally and upload individual files.');
      }
      
      const zipBuffer = await zipResponse.arrayBuffer();
      
      // Load and extract ZIP
      const zip = await JSZip.loadAsync(zipBuffer);
      
      // Find GLB or GLTF files
      let modelFile = null;
      let modelFileName = null;
      
      for (const [filename, file] of Object.entries(zip.files)) {
        if (!file.dir && (filename.endsWith('.glb') || filename.endsWith('.gltf') || filename.endsWith('.fbx'))) {
          modelFile = file;
          modelFileName = filename;
          break;
        }
      }
      
      if (!modelFile) {
        return Response.json({ 
          error: 'No GLB, GLTF, or FBX file found in ZIP' 
        }, { status: 400 });
      }
      
      // Extract the model file
      const modelBlob = await modelFile.async('blob');
      const modelArrayBuffer = await modelBlob.arrayBuffer();
      
      // Determine MIME type
      let mimeType = 'application/octet-stream';
      if (modelFileName.endsWith('.glb')) mimeType = 'model/gltf-binary';
      else if (modelFileName.endsWith('.gltf')) mimeType = 'model/gltf+json';
      else if (modelFileName.endsWith('.fbx')) mimeType = 'application/octet-stream';

      // Convert to File object for upload
      const modelFileObj = new File(
        [modelArrayBuffer], 
        modelFileName, 
        { type: mimeType }
      );
      
      // Upload the extracted model
      const { file_url: extractedUrl } = await base44.asServiceRole.integrations.Core.UploadFile({ 
        file: modelFileObj 
      });
      
      return Response.json({
        success: true,
        modelUrl: extractedUrl,
        originalFileName: modelFileName,
        wasExtracted: true
      });
    } else {
      // For GLB/GLTF files, just return the original URL
      return Response.json({
        success: true,
        modelUrl: fileUrl,
        originalFileName: fileName,
        wasExtracted: false
      });
    }
    
  } catch (error) {
    console.error('Model processing error:', error);
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});
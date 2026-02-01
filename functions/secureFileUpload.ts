import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const rateLimits = new Map();
const RATE_LIMIT_WINDOW = 3600000; // 1 hour
const MAX_UPLOADS_PER_HOUR = 50;
const MAX_FILE_SIZE = 1024 * 1024 * 1024; // 1GB

function checkRateLimit(userId) {
  const now = Date.now();
  const userLimit = rateLimits.get(userId) || { count: 0, resetAt: now + RATE_LIMIT_WINDOW };
  
  if (now > userLimit.resetAt) {
    userLimit.count = 0;
    userLimit.resetAt = now + RATE_LIMIT_WINDOW;
  }
  
  userLimit.count++;
  rateLimits.set(userId, userLimit);
  
  return userLimit.count <= MAX_UPLOADS_PER_HOUR;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Rate limiting
    if (!checkRateLimit(user.id)) {
      return Response.json({ 
        error: 'Upload rate limit exceeded. Maximum 50 uploads per hour.' 
      }, { status: 429 });
    }
    
    const formData = await req.formData();
    const file = formData.get('file');
    
    if (!file) {
      return Response.json({ error: 'No file provided' }, { status: 400 });
    }
    
    // File size validation
    const fileSize = file.size;
    if (fileSize > MAX_FILE_SIZE) {
      return Response.json({ 
        error: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB` 
      }, { status: 400 });
    }
    
    // File type validation (allow common types)
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf', 'text/plain', 'text/csv',
      'video/mp4', 'video/webm'
    ];
    
    if (!allowedTypes.includes(file.type)) {
      return Response.json({ 
        error: 'Invalid file type. Allowed: images, PDF, text, CSV, video' 
      }, { status: 400 });
    }
    
    // Log upload
    console.log(`File Upload - User: ${user.id}, Type: ${file.type}, Size: ${fileSize}`);
    
    // Upload file with service role
    const result = await base44.asServiceRole.integrations.Core.UploadFile({
      file
    });
    
    return Response.json({ success: true, file_url: result.file_url });
    
  } catch (error) {
    console.error('Upload Error:', error.message);
    return Response.json({ 
      error: 'Failed to upload file. Please try again.' 
    }, { status: 500 });
  }
});
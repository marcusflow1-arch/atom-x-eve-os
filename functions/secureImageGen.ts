import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const rateLimits = new Map();
const RATE_LIMIT_WINDOW = 3600000; // 1 hour
const MAX_GENERATIONS_PER_HOUR = 10;

function checkRateLimit(userId) {
  const now = Date.now();
  const userLimit = rateLimits.get(userId) || { count: 0, resetAt: now + RATE_LIMIT_WINDOW };
  
  if (now > userLimit.resetAt) {
    userLimit.count = 0;
    userLimit.resetAt = now + RATE_LIMIT_WINDOW;
  }
  
  userLimit.count++;
  rateLimits.set(userId, userLimit);
  
  return userLimit.count <= MAX_GENERATIONS_PER_HOUR;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Admin check for image generation
    if (user.role !== 'admin') {
      return Response.json({ 
        error: 'Forbidden: Admin access required for image generation' 
      }, { status: 403 });
    }
    
    // Rate limiting
    if (!checkRateLimit(user.id)) {
      return Response.json({ 
        error: 'Image generation rate limit exceeded. Maximum 10 per hour.' 
      }, { status: 429 });
    }
    
    const body = await req.json();
    const { prompt, existing_image_urls } = body;
    
    // Input validation
    if (!prompt || typeof prompt !== 'string') {
      return Response.json({ error: 'Invalid prompt' }, { status: 400 });
    }
    
    if (prompt.length > 2000) {
      return Response.json({ error: 'Prompt too long (max 2000 characters)' }, { status: 400 });
    }
    
    // Log request
    console.log(`Image Gen Request - User: ${user.id}, Length: ${prompt.length}`);
    
    // Generate image with service role
    const result = await base44.asServiceRole.integrations.Core.GenerateImage({
      prompt,
      existing_image_urls: existing_image_urls || null
    });
    
    return Response.json({ success: true, url: result.url });
    
  } catch (error) {
    console.error('Image Gen Error:', error.message);
    return Response.json({ 
      error: 'Failed to generate image. Please try again.' 
    }, { status: 500 });
  }
});
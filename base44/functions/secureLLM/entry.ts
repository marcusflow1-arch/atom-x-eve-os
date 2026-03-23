import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// Rate limiting store (in-memory, consider Redis for production)
const rateLimits = new Map();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 20;

function checkRateLimit(userId, ip) {
  const key = `${userId || ip}`;
  const now = Date.now();
  const userLimit = rateLimits.get(key) || { count: 0, resetAt: now + RATE_LIMIT_WINDOW };
  
  if (now > userLimit.resetAt) {
    userLimit.count = 0;
    userLimit.resetAt = now + RATE_LIMIT_WINDOW;
  }
  
  userLimit.count++;
  rateLimits.set(key, userLimit);
  
  return userLimit.count <= MAX_REQUESTS_PER_WINDOW;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Rate limiting
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    if (!checkRateLimit(user.id, ip)) {
      return Response.json({ 
        error: 'Rate limit exceeded. Please try again later.' 
      }, { status: 429 });
    }
    
    const body = await req.json();
    const { prompt, add_context_from_internet, response_json_schema, file_urls } = body;
    
    // Input validation
    if (!prompt || typeof prompt !== 'string') {
      return Response.json({ error: 'Invalid prompt' }, { status: 400 });
    }
    
    if (prompt.length > 10000) {
      return Response.json({ error: 'Prompt too long (max 10000 characters)' }, { status: 400 });
    }
    
    // Log request (without sensitive data)
    console.log(`LLM Request - User: ${user.id}, Length: ${prompt.length}, Context: ${!!add_context_from_internet}`);
    
    // Call integration with service role
    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      add_context_from_internet: add_context_from_internet || false,
      response_json_schema: response_json_schema || null,
      file_urls: file_urls || null
    });
    
    return Response.json({ success: true, result });
    
  } catch (error) {
    console.error('LLM Error:', error.message);
    return Response.json({ 
      error: 'Failed to process request. Please try again.' 
    }, { status: 500 });
  }
});
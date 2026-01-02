import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// Rate limiting store (in-memory, upgrade to Redis for production)
const rateLimits = new Map();

function checkRateLimit(userId, action, maxRequests = 10, windowMs = 60000) {
  const key = `${userId}:${action}`;
  const now = Date.now();
  const userLimits = rateLimits.get(key) || [];
  
  // Clean old entries
  const validLimits = userLimits.filter(time => now - time < windowMs);
  
  if (validLimits.length >= maxRequests) {
    return { allowed: false, resetIn: windowMs - (now - validLimits[0]) };
  }
  
  validLimits.push(now);
  rateLimits.set(key, validLimits);
  return { allowed: true };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action, payload } = await req.json();

    // Rate limit check
    const rateCheck = checkRateLimit(user.id, action, 20, 60000);
    if (!rateCheck.allowed) {
      return Response.json({ 
        error: 'Rate limit exceeded', 
        resetIn: rateCheck.resetIn 
      }, { status: 429 });
    }

    // Route to specific integration
    switch (action) {
      case 'invokeLLM':
        return await handleInvokeLLM(base44, user, payload);
      case 'generateImage':
        return await handleGenerateImage(base44, user, payload);
      case 'uploadFile':
        return await handleUploadFile(base44, user, payload);
      case 'sendEmail':
        return await handleSendEmail(base44, user, payload);
      case 'extractData':
        return await handleExtractData(base44, user, payload);
      default:
        return Response.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Integration error:', error);
    return Response.json({ 
      error: 'Integration request failed',
      details: Deno.env.get('NODE_ENV') === 'development' ? error.message : undefined
    }, { status: 500 });
  }
});

async function handleInvokeLLM(base44, user, payload) {
  // Validate payload
  if (!payload.prompt || typeof payload.prompt !== 'string') {
    return Response.json({ error: 'Invalid prompt' }, { status: 400 });
  }

  if (payload.prompt.length > 10000) {
    return Response.json({ error: 'Prompt too long' }, { status: 400 });
  }

  try {
    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: payload.prompt,
      add_context_from_internet: payload.add_context_from_internet || false,
      response_json_schema: payload.response_json_schema,
      file_urls: payload.file_urls
    });

    // Log usage
    await base44.asServiceRole.entities.AgentLog.create({
      user_id: user.id,
      action: 'llm_invocation',
      metadata: {
        prompt_length: payload.prompt.length,
        has_context: !!payload.add_context_from_internet,
        timestamp: new Date().toISOString()
      }
    });

    return Response.json({ success: true, result });
  } catch (error) {
    return Response.json({ error: 'LLM invocation failed' }, { status: 500 });
  }
}

async function handleGenerateImage(base44, user, payload) {
  if (!payload.prompt || typeof payload.prompt !== 'string') {
    return Response.json({ error: 'Invalid prompt' }, { status: 400 });
  }

  if (payload.prompt.length > 2000) {
    return Response.json({ error: 'Prompt too long' }, { status: 400 });
  }

  try {
    const result = await base44.asServiceRole.integrations.Core.GenerateImage({
      prompt: payload.prompt,
      existing_image_urls: payload.existing_image_urls
    });

    await base44.asServiceRole.entities.AgentLog.create({
      user_id: user.id,
      action: 'image_generation',
      metadata: {
        prompt: payload.prompt.substring(0, 100),
        timestamp: new Date().toISOString()
      }
    });

    return Response.json({ success: true, result });
  } catch (error) {
    return Response.json({ error: 'Image generation failed' }, { status: 500 });
  }
}

async function handleUploadFile(base44, user, payload) {
  if (!payload.file) {
    return Response.json({ error: 'No file provided' }, { status: 400 });
  }

  // File size limit: 10MB
  const maxSize = 10 * 1024 * 1024;
  if (payload.file.size > maxSize) {
    return Response.json({ error: 'File too large (max 10MB)' }, { status: 400 });
  }

  try {
    const result = await base44.asServiceRole.integrations.Core.UploadFile({
      file: payload.file
    });

    return Response.json({ success: true, result });
  } catch (error) {
    return Response.json({ error: 'File upload failed' }, { status: 500 });
  }
}

async function handleSendEmail(base44, user, payload) {
  // Email sending restricted to admin only
  if (user.role !== 'admin') {
    return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
  }

  if (!payload.to || !payload.subject || !payload.body) {
    return Response.json({ error: 'Missing required email fields' }, { status: 400 });
  }

  try {
    const result = await base44.asServiceRole.integrations.Core.SendEmail({
      from_name: payload.from_name,
      to: payload.to,
      subject: payload.subject,
      body: payload.body
    });

    return Response.json({ success: true, result });
  } catch (error) {
    return Response.json({ error: 'Email send failed' }, { status: 500 });
  }
}

async function handleExtractData(base44, user, payload) {
  if (!payload.file_url || !payload.json_schema) {
    return Response.json({ error: 'Missing file_url or json_schema' }, { status: 400 });
  }

  try {
    const result = await base44.asServiceRole.integrations.Core.ExtractDataFromUploadedFile({
      file_url: payload.file_url,
      json_schema: payload.json_schema
    });

    return Response.json({ success: true, result });
  } catch (error) {
    return Response.json({ error: 'Data extraction failed' }, { status: 500 });
  }
}
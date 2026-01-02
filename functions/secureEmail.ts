import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const rateLimits = new Map();
const RATE_LIMIT_WINDOW = 3600000; // 1 hour
const MAX_EMAILS_PER_HOUR = 10;

function checkRateLimit(userId) {
  const now = Date.now();
  const userLimit = rateLimits.get(userId) || { count: 0, resetAt: now + RATE_LIMIT_WINDOW };
  
  if (now > userLimit.resetAt) {
    userLimit.count = 0;
    userLimit.resetAt = now + RATE_LIMIT_WINDOW;
  }
  
  userLimit.count++;
  rateLimits.set(userId, userLimit);
  
  return userLimit.count <= MAX_EMAILS_PER_HOUR;
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
        error: 'Email rate limit exceeded. Maximum 10 emails per hour.' 
      }, { status: 429 });
    }
    
    const body = await req.json();
    const { to, subject, body: emailBody, from_name } = body;
    
    // Input validation
    if (!to || !subject || !emailBody) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(to)) {
      return Response.json({ error: 'Invalid email address' }, { status: 400 });
    }
    
    if (subject.length > 200 || emailBody.length > 50000) {
      return Response.json({ error: 'Subject or body too long' }, { status: 400 });
    }
    
    // Log request
    console.log(`Email Request - User: ${user.id}, To: ${to}`);
    
    // Send email with service role
    await base44.asServiceRole.integrations.Core.SendEmail({
      from_name: from_name || 'Atom x Eve',
      to,
      subject,
      body: emailBody
    });
    
    return Response.json({ success: true, message: 'Email sent successfully' });
    
  } catch (error) {
    console.error('Email Error:', error.message);
    return Response.json({ 
      error: 'Failed to send email. Please try again.' 
    }, { status: 500 });
  }
});
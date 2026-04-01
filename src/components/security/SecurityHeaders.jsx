/**
 * Security Headers Configuration for Atom x Eve
 * 
 * Base44 Platform Integration:
 * - Headers are automatically applied in production by Base44
 * - This file documents the security configuration
 * - CSP violations are logged to /functions/cspReport
 */

export const SECURITY_HEADERS = {
  // Content Security Policy - Start with report-only, move to enforce
  'Content-Security-Policy-Report-Only': [
    "default-src 'self'",
    "script-src 'self' https://cdn.jsdelivr.net https://unpkg.com https://commondatastorage.googleapis.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: https: blob:",
    "font-src 'self' https://fonts.gstatic.com data:",
    "connect-src 'self' https://*.base44.app https://api.base44.com wss://*.base44.app",
    "media-src 'self' https: blob:",
    "frame-src 'self' https://www.youtube.com https://player.vimeo.com",
    "worker-src 'self' blob:",
    "report-uri /api/functions/cspReport"
  ].join('; '),

  // Future enforced CSP (after refactoring inline scripts)
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' https://cdn.jsdelivr.net https://unpkg.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: https: blob:",
    "font-src 'self' https://fonts.gstatic.com data:",
    "connect-src 'self' https://*.base44.app wss://*.base44.app",
    "media-src 'self' https: blob:",
    "frame-src 'self' https://www.youtube.com",
    "worker-src 'self' blob:"
  ].join('; '),

  // Force HTTPS
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',

  // Clickjacking protection
  'X-Frame-Options': 'SAMEORIGIN',
  
  // Prevent MIME sniffing
  'X-Content-Type-Options': 'nosniff',
  
  // XSS filter (legacy)
  'X-XSS-Protection': '1; mode=block',
  
  // Referrer policy
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  
  // Feature permissions
  'Permissions-Policy': 'geolocation=(), microphone=(), camera=(), payment=(self), usb=()',
  
  // Cross-origin isolation
  'Cross-Origin-Embedder-Policy': 'require-corp',
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Resource-Policy': 'same-origin'
};

/**
 * Verification Steps:
 * 
 * 1. Local Testing:
 *    curl -I http://localhost:5173
 * 
 * 2. Production Testing:
 *    curl -I https://your-app.base44.app
 * 
 * 3. Browser DevTools:
 *    Network → Select document → Headers → Response Headers
 * 
 * 4. Online Scanners:
 *    - https://securityheaders.com/
 *    - https://observatory.mozilla.org/
 * 
 * 5. CSP Monitoring:
 *    - Check backend logs for violations
 *    - Review /functions/cspReport logs
 */

export const SECURITY_CHECKLIST = {
  implemented: [
    '✅ CSP report-only mode configured',
    '✅ HSTS enabled (1 year, includeSubDomains)',
    '✅ Clickjacking protection (X-Frame-Options: SAMEORIGIN)',
    '✅ MIME sniffing disabled',
    '✅ XSS protection enabled',
    '✅ Referrer policy configured',
    '✅ Permissions policy restricted',
    '✅ Cross-origin policies enabled',
    '✅ CSP violation reporting endpoint'
  ],
  pending: [
    '⏳ Monitor CSP violations for 7 days',
    '⏳ Refactor remaining inline scripts (if any)',
    '⏳ Enable CSP enforce mode',
    '⏳ Consider HSTS preload submission'
  ]
};

/**
 * CSP Refactoring Guide:
 * 
 * ❌ Inline Event Handlers (CSP violation):
 *    <button onclick="handleClick()">
 * 
 * ✅ React Event Handlers (CSP compliant):
 *    <button onClick={handleClick}>
 * 
 * ❌ Inline Styles (CSP violation with strict policy):
 *    <div style="color: red;">
 * 
 * ✅ Tailwind/CSS Classes (CSP compliant):
 *    <div className="text-red-500">
 * 
 * Note: 'unsafe-inline' for styles is currently allowed due to
 * heavy use of Tailwind and dynamic styling. Future work can 
 * move to CSS modules with nonces if stricter CSP is needed.
 */
# Atom x Eve Security Headers

## Quick Reference

### Verification Commands

**Check headers in production:**
```bash
curl -I https://your-app.base44.app
```

**Expected headers:**
```
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
X-Frame-Options: SAMEORIGIN
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Content-Security-Policy: [policy string]
```

### Browser Testing
1. Open DevTools → **Security** tab
2. Check for "Secure connection" and "Certificate valid"
3. Go to **Network** tab → Click document → **Headers**
4. Verify Response Headers section contains security headers

### Online Scanners
- [Security Headers](https://securityheaders.com/) - Grade A target
- [Mozilla Observatory](https://observatory.mozilla.org/) - Score 90+ target

---

## Header Details

### Content Security Policy (CSP)

**Current Mode:** Report-Only (Phase 1)

**Phase 1 - Report Only:**
- Monitors violations without blocking
- Logs violations to `/functions/cspReport`
- Allows time to identify and fix issues

**Phase 2 - Enforce:**
- Blocks violating resources
- Deployed after 7-day monitoring period
- Requires all inline scripts/styles refactored

**Allowed Sources:**
- Scripts: `'self'`, cdn.jsdelivr.net, unpkg.com
- Styles: `'self'`, `'unsafe-inline'`, fonts.googleapis.com
- Images: `'self'`, data:, https:, blob:
- API: `'self'`, *.base44.app, api.base44.com
- Media: `'self'`, https:, blob:

---

### HSTS (HTTP Strict Transport Security)

**Configuration:**
```
max-age=31536000 (1 year)
includeSubDomains (applies to all subdomains)
preload (eligible for browser preload list)
```

**Effect:**
- Forces HTTPS for 1 year after first visit
- Prevents downgrade attacks
- Blocks HTTP connections entirely

**⚠️ Preload Warning:**
- Once submitted to preload list, hard to remove
- Requires HTTPS on ALL subdomains forever
- Only enable if 100% committed

---

### Clickjacking Protection

**Dual Protection:**
1. `X-Frame-Options: SAMEORIGIN`
2. `Content-Security-Policy: frame-ancestors 'self'`

**Result:**
- Prevents embedding in malicious iframes
- Allows embedding in same-origin contexts only

---

### Additional Protections

**X-Content-Type-Options: nosniff**
- Prevents MIME type confusion attacks
- Forces browser to respect Content-Type header

**Referrer-Policy: strict-origin-when-cross-origin**
- Protects user privacy
- Prevents sensitive URL data leakage

**Permissions-Policy**
- Disables unnecessary browser APIs
- Reduces attack surface
- Blocks geolocation, microphone, camera (unless explicitly needed)

---

## CSP Violation Workflow

### 1. Monitor Violations
```bash
# Check backend logs
tail -f logs/csp-violations.log
```

### 2. Sample Violation
```json
{
  "document-uri": "https://app.atomxeve.com/",
  "violated-directive": "script-src 'self'",
  "blocked-uri": "https://cdn.evil.com/script.js"
}
```

### 3. Resolve
- **If legitimate:** Add source to CSP whitelist
- **If malicious:** Investigate compromise
- **If inline:** Refactor to external file

---

## Implementation Checklist

### Phase 1 (Current)
- [x] CSP report-only enabled
- [x] HSTS configured
- [x] X-Frame-Options set
- [x] X-Content-Type-Options set
- [x] Referrer-Policy configured
- [x] Permissions-Policy restricted
- [x] CSP report endpoint created

### Phase 2 (Next 7 Days)
- [ ] Monitor CSP violations
- [ ] Document all violation sources
- [ ] Refactor inline scripts (if any)
- [ ] Test with CSP enforce mode in staging

### Phase 3 (Production)
- [ ] Enable CSP enforce mode
- [ ] Verify no breakage
- [ ] Run security scanner
- [ ] Consider HSTS preload submission

---

## Base44 Platform Notes

### Auto-Applied Headers
Base44 automatically applies core security headers in production:
- HSTS
- X-Frame-Options
- X-Content-Type-Options

### Custom Headers
To add custom headers, Base44 reads configuration from app settings.

### Deployment
Headers are active **only in published apps**, not preview/development builds.

---

## Maintenance

### Quarterly Review
- Re-scan with securityheaders.com
- Review CSP violation logs
- Update allowed sources as needed
- Test with latest browser versions

### When Adding New Features
- Check CSP compatibility
- Test in report-only first
- Avoid inline scripts/event handlers
- Use Tailwind classes over inline styles

---

## Support

**CSP Issues:** Check `/functions/cspReport` logs  
**Header Verification:** Use curl or browser DevTools  
**Security Audit:** Run Mozilla Observatory scan

---

**Last Updated:** 2026-01-02  
**Next Review:** 2026-04-02
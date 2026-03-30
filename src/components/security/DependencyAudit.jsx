# Dependency Hygiene & Security Scanning

## Lockfile Management

### Generate Lockfile
```bash
# Using npm (recommended for Base44)
npm install
# Generates package-lock.json

# Using pnpm (alternative)
pnpm install
# Generates pnpm-lock.yaml
```

### Commit Lockfile
```bash
git add package-lock.json
git commit -m "Add lockfile for reproducible builds"
```

**Benefits:**
- Reproducible builds across environments
- Prevents unexpected version bumps
- Faster CI/CD installs
- Security audit baseline

---

## Security Scanning

### Manual Audit (Run Locally)
```bash
# Check for known vulnerabilities
npm audit

# Get detailed report
npm audit --json > audit-report.json

# Fix automatically (where possible)
npm audit fix

# Fix including breaking changes
npm audit fix --force
```

### Audit Severity Levels
- **Critical:** Immediate action required
- **High:** Fix within 7 days
- **Moderate:** Fix within 30 days
- **Low:** Monitor, fix when convenient

---

## CI/CD Integration

### GitHub Actions Workflow

Create `.github/workflows/security-audit.yml`:

```yaml
name: Security Audit

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]
  schedule:
    # Run weekly on Mondays at 9am UTC
    - cron: '0 9 * * 1'

jobs:
  audit:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run security audit
        run: npm audit --audit-level=high
        continue-on-error: false
      
      - name: Check for outdated packages
        run: npm outdated || true
      
      - name: Upload audit report
        if: failure()
        uses: actions/upload-artifact@v3
        with:
          name: npm-audit-report
          path: npm-audit.json
```

---

## Automated Dependency Updates

### Dependabot Configuration

Create `.github/dependabot.yml`:

```yaml
version: 2
updates:
  # npm dependencies
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
      day: "monday"
    open-pull-requests-limit: 10
    
    # Group minor/patch updates
    groups:
      development-dependencies:
        dependency-type: "development"
        update-types:
          - "minor"
          - "patch"
      
      production-dependencies:
        dependency-type: "production"
        update-types:
          - "patch"
    
    # Automatic merging for patch updates
    labels:
      - "dependencies"
      - "automated"
    
    # Ignore specific packages
    ignore:
      - dependency-name: "react"
        update-types: ["version-update:semver-major"]
```

### Renovate Configuration (Alternative)

Create `renovate.json`:

```json
{
  "$schema": "https://docs.renovatebot.com/renovate-schema.json",
  "extends": [
    "config:base"
  ],
  "schedule": ["before 9am on monday"],
  "packageRules": [
    {
      "matchUpdateTypes": ["patch"],
      "automerge": true,
      "automergeType": "pr"
    },
    {
      "matchDepTypes": ["devDependencies"],
      "matchUpdateTypes": ["minor"],
      "groupName": "dev dependencies (non-major)"
    },
    {
      "matchPackageNames": ["react", "react-dom"],
      "groupName": "react monorepo"
    }
  ],
  "vulnerabilityAlerts": {
    "labels": ["security"],
    "assignees": ["@team-security"]
  }
}
```

---

## Pre-Commit Hooks

### Using Husky + lint-staged

**Install:**
```bash
npm install --save-dev husky lint-staged
npx husky init
```

**Configure `.husky/pre-commit`:**
```bash
#!/bin/sh
npm audit --audit-level=high
npm test
```

**Optional: lint-staged for faster checks**

`package.json`:
```json
{
  "lint-staged": {
    "*.{js,jsx}": [
      "npm audit --audit-level=high"
    ]
  }
}
```

---

## Dependency Update Workflow

### Weekly Review Process

1. **Review Dependabot/Renovate PRs**
   - Check changelog for breaking changes
   - Verify tests pass
   - Review security advisories

2. **Prioritize Security Updates**
   - Critical/High: Immediate merge
   - Moderate: Merge within sprint
   - Low: Batch with other updates

3. **Test Before Merge**
   - Run full test suite
   - Manual smoke test of critical flows
   - Check bundle size impact

4. **Monitor Post-Deployment**
   - Watch error logs for 24h
   - Check CSP violations
   - Verify performance metrics

---

## Vulnerability Response Plan

### Discovery
1. Receive npm audit alert or Dependabot PR
2. Assess severity and exploitability
3. Check if vulnerability affects production code

### Triage
- **Critical/High + Exploitable:** Emergency patch within 24h
- **Critical/High + Not Exploitable:** Fix within 7 days
- **Moderate:** Include in next sprint
- **Low:** Monitor, fix opportunistically

### Mitigation
1. Update package to patched version
2. If no patch available:
   - Remove dependency if possible
   - Find alternative package
   - Implement workaround
   - Document risk acceptance

### Verification
1. Re-run `npm audit`
2. Deploy to staging
3. Run automated tests
4. Deploy to production
5. Monitor for 48h

---

## Package Management Best Practices

### Version Pinning Strategy

**Production Dependencies:**
```json
{
  "dependencies": {
    "react": "^18.2.0",           // Allow minor/patch
    "framer-motion": "~11.16.4",  // Allow patch only
    "critical-package": "1.2.3"   // Pin exact version
  }
}
```

**When to Pin Exactly:**
- Security-critical packages
- Packages with frequent breaking changes
- Payment/auth libraries

### Regular Maintenance

**Monthly:**
- Run `npm outdated`
- Review major version updates
- Update development dependencies

**Quarterly:**
- Audit all dependencies for abandonment
- Remove unused packages
- Consolidate duplicate functionality

---

## Base44 Platform Specifics

### Auto-Installed Packages
Base44 pre-installs core packages:
- React, React DOM
- Tailwind CSS
- shadcn/ui components
- Lucide icons
- Base44 SDK

**These are managed by the platform** - lockfile only tracks your additions.

### CI/CD Integration
Since Base44 handles deployment, audit checks should run:
1. Pre-deploy hook (if available)
2. Scheduled via backend function
3. Manual trigger from admin panel

---

## Monitoring & Alerts

### Set Up Alerts

**Snyk Integration:**
```bash
npm install -g snyk
snyk auth
snyk monitor
```

**GitHub Security Advisories:**
- Enable Dependabot alerts in repo settings
- Configure email notifications

**Slack Notifications:**
```yaml
# In GitHub Actions
- name: Notify on failure
  if: failure()
  uses: slackapi/slack-github-action@v1
  with:
    payload: |
      {
        "text": "🚨 Security audit failed on ${{ github.repository }}"
      }
  env:
    SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK }}
```

---

## Audit Report Analysis

### Sample Output
```
found 3 vulnerabilities (1 moderate, 2 high)

High            Prototype Pollution in lodash
Package         lodash
Dependency of   some-package
Path            node_modules/lodash
More info       https://npmjs.com/advisories/1234
```

### Action Plan
1. Identify if package is directly used
2. Check if there's a non-vulnerable version
3. Update: `npm update lodash@latest`
4. If no fix: Consider alternatives or workarounds

---

## Reproducible Builds Checklist

- [x] package-lock.json committed
- [ ] CI uses `npm ci` (not `npm install`)
- [ ] Node version specified in `.nvmrc` or CI config
- [ ] No `sudo npm install` usage
- [ ] Dependencies listed in correct section (dependencies vs devDependencies)

---

## Common Issues

### "Lockfile out of sync"
```bash
rm -rf node_modules package-lock.json
npm install
```

### "Audit fix breaks app"
```bash
# Revert changes
git checkout package.json package-lock.json
npm install

# Manual update specific package
npm update vulnerable-package@safe-version
```

### "Too many Dependabot PRs"
Reduce frequency in `dependabot.yml`:
```yaml
schedule:
  interval: "monthly"
open-pull-requests-limit: 5
```

---

## Emergency Procedures

### Zero-Day Vulnerability

1. **Immediate Response**
   ```bash
   npm audit
   npm update vulnerable-package
   npm test
   git commit -m "SECURITY: Patch CVE-XXXX-YYYY"
   # Deploy immediately
   ```

2. **Communication**
   - Notify team in security channel
   - Document incident
   - Review similar dependencies

3. **Post-Incident**
   - Root cause analysis
   - Update scanning frequency
   - Improve monitoring

---

## Resources

- [npm audit docs](https://docs.npmjs.com/cli/v9/commands/npm-audit)
- [Dependabot documentation](https://docs.github.com/en/code-security/dependabot)
- [Snyk vulnerability database](https://snyk.io/vuln/)
- [OWASP Dependency-Check](https://owasp.org/www-project-dependency-check/)

---

**Maintained by:** DevSecOps Team  
**Last Audit:** 2026-01-02  
**Next Review:** 2026-01-09
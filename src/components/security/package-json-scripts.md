# Required package.json Scripts for Security & Testing

Add these scripts to your `package.json` file:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:all": "npm run test && npm run test:e2e",
    
    "audit": "npm audit --audit-level=moderate",
    "audit:fix": "npm audit fix",
    "audit:report": "npm audit --json > audit-report.json",
    
    "security": "npm audit && npm run test",
    
    "deps:check": "npm outdated",
    "deps:update": "npm update",
    
    "lockfile:verify": "npm ci --dry-run",
    "lockfile:clean": "rm -rf node_modules package-lock.json && npm install",
    
    "prebuild": "npm audit --audit-level=high",
    "postinstall": "playwright install chromium --with-deps || true"
  }
}
```

## Script Descriptions

### Development
- `dev` - Start development server
- `build` - Production build
- `preview` - Preview production build

### Testing
- `test` - Run unit tests once
- `test:watch` - Run tests in watch mode
- `test:coverage` - Generate coverage report
- `test:e2e` - Run Playwright e2e tests
- `test:e2e:ui` - Interactive e2e test UI
- `test:all` - Run all tests (unit + e2e)

### Security
- `audit` - Check dependencies for vulnerabilities (moderate+)
- `audit:fix` - Auto-fix vulnerabilities where possible
- `audit:report` - Generate JSON audit report
- `security` - Full security check (audit + tests)

### Dependency Management
- `deps:check` - List outdated packages
- `deps:update` - Update all packages within semver range
- `lockfile:verify` - Check if lockfile is valid
- `lockfile:clean` - Regenerate lockfile from scratch

### CI/CD Hooks
- `prebuild` - Runs before build (security check)
- `postinstall` - Runs after npm install (setup Playwright)

## Usage Examples

### Daily Development
```bash
npm run dev
```

### Before Committing
```bash
npm run test
npm run audit
```

### CI/CD Pipeline
```bash
npm ci                # Install from lockfile
npm run security      # Run security checks
npm run build         # Build production
npm run test:e2e      # E2E tests
```

### Dependency Updates
```bash
npm run deps:check    # See what's outdated
npm update            # Update within semver
npm run test:all      # Verify nothing broke
```

### Emergency Security Patch
```bash
npm audit             # Identify vulnerability
npm audit fix         # Try auto-fix
npm run test:all      # Verify functionality
git add package*.json
git commit -m "security: patch CVE-XXXX-YYYY"
```

## CI/CD Integration

These scripts are referenced in GitHub Actions workflows:

**security.yml:**
```yaml
- run: npm ci
- run: npm run audit
- run: npm run test:all
```

**deploy.yml:**
```yaml
- run: npm ci
- run: npm run prebuild  # Runs audit automatically
- run: npm run build
```

## Maintenance

Update scripts quarterly:
- Add new test commands as test types evolve
- Adjust audit levels based on risk tolerance
- Update browser list for Playwright
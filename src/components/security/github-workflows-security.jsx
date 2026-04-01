# GitHub Actions Workflow for Security Scanning
# Place this file at: .github/workflows/security.yml

name: Security Checks

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]
  schedule:
    # Run every Monday at 9am UTC
    - cron: '0 9 * * 1'
  workflow_dispatch:

jobs:
  dependency-audit:
    name: Dependency Security Audit
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run npm audit
        run: npm audit --audit-level=moderate
        continue-on-error: false
      
      - name: Check for outdated packages
        run: npm outdated || true
      
      - name: Generate audit report
        if: always()
        run: npm audit --json > npm-audit-report.json
      
      - name: Upload audit report
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: npm-audit-report
          path: npm-audit-report.json
          retention-days: 30

  lockfile-validation:
    name: Validate Lockfile
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
      
      - name: Verify lockfile is up to date
        run: |
          npm ci
          git diff --exit-code package-lock.json
      
      - name: Check for lockfile conflicts
        run: |
          if grep -q "<<<<<<< HEAD" package-lock.json; then
            echo "Lockfile has merge conflicts!"
            exit 1
          fi

  bundle-analysis:
    name: Bundle Size Check
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build production bundle
        run: npm run build
      
      - name: Analyze bundle size
        run: |
          echo "Bundle size analysis:"
          du -sh dist/
          find dist/ -name "*.js" -exec du -h {} \; | sort -h

  snyk-security:
    name: Snyk Security Scan
    runs-on: ubuntu-latest
    if: github.event_name != 'schedule'
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Run Snyk to check for vulnerabilities
        uses: snyk/actions/node@master
        continue-on-error: true
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
        with:
          args: --severity-threshold=high

  license-compliance:
    name: License Compliance Check
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Check licenses
        run: npx license-checker --summary
      
      - name: Fail on problematic licenses
        run: npx license-checker --failOn "GPL;AGPL;LGPL"
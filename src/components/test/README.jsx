# Atom x Eve - Testing Guide

## Overview
This project uses **Vitest** for unit/integration tests and **Playwright** for end-to-end tests.

---

## Running Tests

### Unit Tests (Vitest)
```bash
# Run all unit tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm run test components/test/AuthProvider.test.jsx
```

### E2E Tests (Playwright)
```bash
# Install Playwright browsers (first time only)
npx playwright install

# Run all e2e tests
npm run test:e2e

# Run e2e tests in UI mode (interactive)
npm run test:e2e:ui

# Run specific test file
npx playwright test components/test/e2e/auth.spec.js
```

---

## Test Structure

### Unit Tests Location
```
components/test/
├── setup.js                    # Test configuration
├── vitest.config.js           # Vitest config
├── AuthProvider.test.jsx      # Auth context tests
├── AdminGating.test.jsx       # Admin access tests
├── ErrorHandling.test.jsx     # Error mapper tests
├── LunaStore.test.js          # Zustand store tests
└── GameFilters.test.js        # Filter hook tests
```

### E2E Tests Location
```
components/test/e2e/
├── auth.spec.js              # Login/logout flows
├── navigation.spec.js        # Page navigation
├── admin-access.spec.js      # Admin page gating
└── checkout.spec.js          # Purchase flow
```

---

## Writing New Tests

### Unit Test Example
```javascript
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

describe('MyComponent', () => {
  it('should render correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });
});
```

### E2E Test Example
```javascript
import { test, expect } from '@playwright/test';

test('should navigate to page', async ({ page }) => {
  await page.goto('/');
  await page.click('text=Store');
  await expect(page).toHaveURL(/store/);
});
```

---

## Coverage Goals

### Current Coverage
- ✅ Auth context behavior
- ✅ Admin gating logic
- ✅ Error mapping system
- ✅ Luna state store
- ✅ Game filtering logic
- ✅ E2E auth flow
- ✅ E2E navigation
- ✅ E2E admin access
- ✅ E2E checkout flow

### Next Steps
- [ ] Card system tests
- [ ] Inventory management tests
- [ ] Clan system tests
- [ ] Trading/marketplace tests
- [ ] Streaming functionality tests

---

## CI Integration

### GitHub Actions Example
```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run test
      - run: npx playwright install --with-deps
      - run: npm run test:e2e
```

---

## Mocking Strategy

### Base44 Client
All `base44` API calls are mocked in unit tests via `setup.js`.

### Authentication
Use `page.addInitScript()` in Playwright to mock auth state.

### Network Requests
Use `page.route()` in Playwright to intercept and mock API calls.

---

## Debugging Tests

### Unit Tests
```bash
# Run with debug output
npm run test -- --reporter=verbose

# Run single test in watch mode
npm run test:watch -- AuthProvider.test.jsx
```

### E2E Tests
```bash
# Run with headed browser (visible)
npx playwright test --headed

# Run with debug mode
npx playwright test --debug

# Show test report
npx playwright show-report
```

---

## Best Practices

1. **Keep tests focused** - One assertion per test when possible
2. **Use descriptive names** - Test names should explain what they verify
3. **Mock external dependencies** - Avoid real API calls in tests
4. **Test user behavior** - Not implementation details
5. **Keep tests fast** - Unit tests < 100ms, E2E < 5s

---

## Troubleshooting

### "Module not found" errors
- Check that `vitest.config.js` aliases match your project structure
- Ensure all imports use correct paths

### E2E tests timeout
- Increase timeout in test: `test('...', async ({ page }) => { test.setTimeout(30000); ... })`
- Check if dev server is running: `npm run dev`

### Flaky tests
- Add explicit waits: `await page.waitForLoadState('networkidle')`
- Use `waitFor()` in unit tests for async updates
- Avoid time-based waits (use event-based)

---

## Test Scripts (package.json)

Add these to your `package.json`:
```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:all": "npm run test && npm run test:e2e"
  }
}
``
# E2E Testing Guide

## Quick Start

### Run All E2E Tests
```bash
cd frontend-react
npm run test:e2e
```

### Run Tests with UI Mode
```bash
cd frontend-react
npm run test:e2e:ui
```

### Run Tests in Debug Mode
```bash
cd frontend-react
npm run test:e2e:debug
```

### View Test Report
```bash
cd frontend-react
npm run test:e2e:report
```

## Test Coverage

### Phase 1 - Foundation Tests
Tests cover:
- Frontend loading and rendering
- Docker service orchestration
- Database containers (PostgreSQL, Redis, MongoDB)
- Backend API accessibility
- Asset loading and performance
- Console error detection

## Adding New Tests

1. Create test file in `tests/` directory
2. Use Playwright API: `test.describe`, `test`, `expect`
3. Example:
```typescript
test('My new test', async ({ page }) => {
  await page.goto('http://localhost:3010');
  await expect(page.locator('h1')).toBeVisible();
});
```

4. Run tests to verify

## Best Practices

1. **Use descriptive test names** - Include the feature being tested
2. **Test in isolation** - Each test should be independent
3. **Use Playwright fixtures** - Reuse setup and teardown
4. **Check for console errors** - Catch frontend issues early
5. **Verify network idle** - Ensure all resources loaded
6. **Take screenshots on failure** - Helps debug test failures

## Common Issues

### Tests Failing
- Check if Docker services are running: `docker-compose ps`
- Check if frontend is accessible: `curl http://localhost:3010`
- Check if backend is accessible: `curl http://localhost:8001`

### Slow Tests
- Increase timeout in `playwright.config.ts`
- Reduce parallel workers for debugging
- Check network connectivity

### Environment Issues
- Ensure all containers are healthy
- Check port conflicts on host
- Verify Docker network configuration

## CI/CD Integration

Add to your CI pipeline:

```yaml
- name: Run E2E Tests
  run: |
    cd frontend-react
    npm install
    npx playwright install --with-deps chromium
    npm run test:e2e
```

## Report Viewing

After running tests, open the HTML report:
```bash
open playwright-report/index.html
```

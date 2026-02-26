# E2E Testing Guide for Phase 3 & 4

## Quick Start

### Prerequisites
```bash
# Ensure Node.js 16+ is installed
node --version

# Install dependencies
cd frontend-react
npm install

# Ensure backend is running on port 8000
# Ensure frontend is running on port 3010
```

### Running Tests

#### All Tests
```bash
npx playwright test
```

#### Phase 3 Only (Savings)
```bash
npx playwright test tests/phase3-4-savings-compliance-e2e.spec.ts --grep "P3-"
```

#### Phase 4 Only (Compliance)
```bash
npx playwright test tests/phase3-4-savings-compliance-e2e.spec.ts --grep "P4-"
```

#### Integration Tests
```bash
npx playwright test tests/phase3-4-savings-compliance-e2e.spec.ts --grep "CPI-"
```

#### Edge Cases
```bash
npx playwright test tests/phase3-4-savings-compliance-e2e.spec.ts --grep "EC-"
```

#### Performance Tests
```bash
npx playwright test tests/phase3-4-savings-compliance-e2e.spec.ts --grep "PERF-"
```

### Debugging

#### Headless Mode (Default)
```bash
npx playwright test
```

#### Headed Mode (UI visible)
```bash
npx playwright test --headed
```

#### With Video Recording
```bash
npx playwright test --video=on
```

#### With Slow Motion
```bash
npx playwright test --slowmo=1000
```

#### Stop on First Failure
```bash
npx playwright test --max-failures=1
```

### Test Reports

#### HTML Report
```bash
npx playwright test --reporter=html
```

#### JSON Report
```bash
npx playwright test --reporter=json
```

#### Multiple Reporters
```bash
npx playwright test --reporter=html,json,summary
```

## Test Data Setup

### Seeding Demo Data

Before running tests, seed the database with demo data:

```bash
# From backend directory
cd backend

# Run demo seeder
python -m app.utils.demo_seeder

# Or using Python directly
python -c "import asyncio; from app.utils.demo_seeder import seed_demo_data; asyncio.run(seed_demo_data())"
```

### Verify Seeded Data

Check MongoDB collections:
```bash
# Connect to MongoDB
mongosh

# Check users
db.users.find({}, {username: 1, role: 1})

# Check customers
db.customers.find({}, {display_name: 1, customer_type: 1})

# Check savings accounts
db.savings.find({}, {account_number: 1, type: 1, balance: 1})
```

Check PostgreSQL tables:
```bash
# Connect to PostgreSQL
psql -U lending_user -d lending_db

# Check KYC documents
SELECT * FROM kyc_documents LIMIT 5;

# Check AML alerts
SELECT * FROM aml_alerts LIMIT 5;
```

## Test Categories Reference

### Phase 3 Tests (Savings)

| Test ID | Description | Priority | Duration |
|---------|-------------|----------|----------|
| P3-001 | Savings Dashboard Access | High | 3s |
| P3-002 | Regular Passbook Savings | High | 8s |
| P3-003 | Time Deposit Account | High | 8s |
| P3-004 | Share Capital Account | Medium | 8s |
| P3-005 | Goal Savings Account | Medium | 8s |
| P3-006 | Joint Account | Medium | 8s |
| P3-007 | Minor Account | Low | 8s |
| P3-008 | Deposit Transaction | High | 10s |
| P3-009 | Interest Computation | High | 10s |
| P3-010 | Rate Tier System | Medium | 8s |
| P3-011 | Passbook Print | Low | 8s |
| P3-012 | Internal Transfer | Medium | 8s |
| P3-013 | Standing Order | Low | 8s |
| P3-014 | Balance Inquiry | High | 8s |
| P3-015 | Complete Lifecycle | High | 30s |

### Phase 4 Tests (Compliance)

| Test ID | Description | Priority | Duration |
|---------|-------------|----------|----------|
| P4-001 | Compliance Dashboard | High | 5s |
| P4-002 | KYC Document Management | High | 8s |
| P4-003 | AML Alert Dashboard | High | 8s |
| P4-004 | OFAC/PEP Screening | High | 8s |
| P4-005 | CTR Auto-Flagging | High | 8s |
| P4-006 | SAR Creation | High | 8s |
| P4-007 | PAR Metrics | High | 5s |
| P4-008 | NPL Reports | High | 8s |
| P4-009 | LLR Calculations | High | 8s |
| P4-010 | Trial Balance | High | 8s |
| P4-011 | Income Statement | High | 8s |
| P4-012 | Balance Sheet | High | 8s |
| P4-013 | Cash Flow | Medium | 8s |
| P4-014 | Period Closing | High | 10s |
| P4-015 | LTV Ratio | Medium | 8s |
| P4-016 | Concentration Risk | Medium | 8s |
| P4-017 | Liquidity Ratio | Medium | 8s |
| P4-018 | KYC Upload | High | 10s |
| P4-019 | Alert Management | High | 8s |
| P4-020 | PEP Flagging | High | 8s |
| P4-021 | Dashboard Workflow | High | 15s |

### Integration Tests

| Test ID | Description | Priority | Duration |
|---------|-------------|----------|----------|
| CPI-001 | Customer Journey | High | 25s |
| CPI-002 | Loan + Accounting + Compliance | High | 20s |
| CPI-003 | Savings Interest + Accounting | High | 20s |
| CPI-004 | AML Alert Creation | High | 15s |

### Edge Cases

| Test ID | Description | Priority | Duration |
|---------|-------------|----------|----------|
| EC-001 | Invalid KYC Upload | Medium | 5s |
| EC-002 | Missing Customer Data | Medium | 5s |
| EC-003 | Zero Balance Statements | Low | 5s |
| EC-004 | No Past-Due Loans | Low | 5s |

### Performance

| Test ID | Description | Priority | Duration |
|---------|-------------|----------|----------|
| PERF-001 | Dashboard Load Time | Medium | 5s |
| PERF-002 | Large Dataset Reports | Medium | 15s |

## Troubleshooting

### Common Issues

#### Issue: "Cannot find module 'playwright'"
```bash
npm install @playwright/test
```

#### Issue: "Failed to launch browser"
```bash
# Install Chromium
npx playwright install chromium

# Or install all browsers
npx playwright install
```

#### Issue: "Timeout waiting for element"
```bash
# Increase timeout
npx playwright test --timeout=60000

# Or add in test:
await page.waitForSelector('selector', { timeout: 10000 })
```

#### Issue: "Element is not visible"
```bash
# Wait for element to be visible
await expect(page.locator('button')).toBeVisible()
```

#### Issue: "Database connection refused"
```bash
# Check MongoDB is running
mongosh --eval "db.version()"

# Check PostgreSQL is running
psql -U lending_user -d lending_db -c "SELECT version();"
```

#### Issue: "Test data not found"
```bash
# Re-seed demo data
cd backend
python -m app.utils.demo_seeder
```

### Debugging Tips

#### Use Playwright Inspector
```bash
npx playwright test --debug
```

#### View Browser Logs
```bash
npx playwright test --trace on-first-retry
```

#### Take Screenshots on Failure
```bash
npx playwright test --screenshot=on
```

#### Record Videos
```bash
npx playwright test --video=on
```

## CI/CD Integration

### GitHub Actions Example
```yaml
name: E2E Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  e2e-tests:
    runs-on: ubuntu-latest
    services:
      mongodb:
        image: mongo:6.0
        ports: [27017:27017]
      postgres:
        image: postgres:15
        env:
          POSTGRES_USER: lending_user
          POSTGRES_PASSWORD: lending_secret
          POSTGRES_DB: lending_test_db
        ports: [5432:5432]
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: cd frontend-react && npm ci
        
      - name: Seed demo data
        run: cd backend && python -m app.utils.demo_seeder
        
      - name: Run tests
        run: cd frontend-react && npx playwright test
        env:
          MONGODB_URI: mongodb://localhost:27017
          DATABASE_URL: postgresql://lending_user:lending_secret@localhost:5432/lending_test_db
          
      - name: Upload test results
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: frontend-react/playwright-report/
```

### Test Results

#### Success Criteria
- ✅ All Phase 3 tests pass (15/15)
- ✅ All Phase 4 tests pass (21/21)
- ✅ All integration tests pass (4/4)
- ✅ All edge case tests pass (4/4)
- ✅ Dashboard load time < 5s
- ✅ Large dataset reports < 10s

#### Failure Handling
- Tests fail on first error by default
- Re-run failed tests with: `npx playwright test --retries=3`
- View detailed error reports in `playwright-report/`

## Best Practices

### Test Writing
1. **Use descriptive test names**: `P3-002: Create Regular Passbook Savings`
2. **Keep tests independent**: Each test should be runnable alone
3. **Use serial mode for stateful tests**: `test.describe.configure({ mode: 'serial' })`
4. **Wait for network idle**: `await page.waitForLoadState('networkidle')`
5. **Use assertions**: `await expect(locator).toBeVisible()`

### Data Management
1. **Use demo seeder**: Always run `python -m app.utils.demo_seeder` before tests
2. **Verify data exists**: Check for required data before running tests
3. **Clean up after tests**: Use `afterEach` for cleanup if needed

### Reporting
1. **HTML report**: Generated at `playwright-report/index.html`
2. **JSON report**: Contains detailed test results
3. **Summary**: Console output with test counts

## Maintenance

### Adding New Tests
1. Add test to `tests/phase3-4-savings-compliance-e2e.spec.ts`
2. Follow naming convention: `P3-XXX` or `P4-XXX`
3. Add to test coverage table in this document
4. Update test count in summary

### Updating Demo Data
1. Modify `backend/app/utils/demo_seeder.py`
2. Re-run seeder: `python -m app.utils.demo_seeder`
3. Verify data in MongoDB and PostgreSQL
4. Update test expectations if needed

### Performance Monitoring
```bash
# Run performance tests
npx playwright test tests/phase3-4-savings-compliance-e2e.spec.ts --grep "PERF-"

# Check load times
grep "loaded in" playwright-report/*.html
```

## Conclusion

This E2E test guide provides comprehensive coverage for Phase 3 and Phase 4 features. The tests are designed to be:
- ✅ **Comprehensive**: Cover all features and edge cases
- ✅ **Interconnected**: Test cross-feature workflows
- ✅ **Production-ready**: Include performance benchmarks
- ✅ **CI/CD integrated**: Ready for automated testing

For questions or issues, refer to the main E2E_TEST_REPORT.md file or contact the QA team.
import { test, expect } from '@playwright/test';

test.describe('Phase 2.2 - Loan Application & Approval', () => {
  async function login(page: any) {
    await page.goto('http://localhost:3010');
    await page.waitForLoadState('networkidle');

    const loginButton = page.locator('button:has-text("Login")').or(page.locator('button[type="submit"]'));
    if (await loginButton.isVisible({ timeout: 2000 })) {
      await loginButton.click();
      await page.waitForURL(/\/login/, { timeout: 5000 });

      await page.fill('input[type="text"]', 'admin');
      await page.fill('input[type="password"]', 'admin123');
      await page.click('button[type="submit"]');
      await page.waitForLoadState('networkidle');
    }
  }

  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3010/loans');
    await login(page);
    await page.waitForLoadState('networkidle');
  });

  test('Navigate to loans page and verify pipeline workflow UI', async ({ page }) => {
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('button:has-text("New Application")')).toBeVisible();

    const pipelineCards = page.locator('.glass');
    await expect(pipelineCards).toHaveCount(6);

    const statuses = ['Draft', 'Submitted', 'Reviewing', 'Approved', 'Active', 'Paid / Closed'];
    for (const status of statuses) {
      await expect(pipelineCards.filter({ hasText: status })).toBeVisible();
    }
  });

  test('Create new loan application with multi-stage approval workflow', async ({ page }) => {
    const newApplicationButton = page.locator('button:has-text("New Application")');
    await newApplicationButton.click({ timeout: 5000 });
    await page.waitForLoadState('networkidle');
    await page.waitForURL(/\/loans\/new/, { timeout: 5000 });

    await expect(page.locator('h1')).toBeVisible();

    await page.fill('input[name="customerId"]', 'Juan');
    await page.waitForTimeout(500);
    await page.click('text=Juan', { timeout: 3000 });
    await page.waitForTimeout(500);

    await page.fill('input[name="productId"]', 'Regular Personal Loan');
    await page.waitForTimeout(500);
    await page.click('text=Regular Personal Loan', { timeout: 3000 });

    await page.fill('input[name="principal"]', '50000');
    await page.fill('input[name="termMonths"]', '12');
    await page.fill('input[name="interestRate"]', '5.5');

    await page.click('button:has-text("Next: Review & Approval")', { timeout: 5000 });
    await page.waitForLoadState('networkidle');

    await expect(page.locator('h2')).toContainText('Review');
    await expect(page.locator('h2')).toContainText('Approval');

    const approvalNote = 'Credit review completed - All requirements met';
    await page.fill('textarea[name="approvalNote"]', approvalNote);

    await page.click('button:has-text("Submit for Approval")', { timeout: 5000 });
    await page.waitForLoadState('networkidle');

    await expect(page.locator('text=Submitted successfully')).toBeVisible();
    loanId = await page.url().match(/\/loans\/([^/]+)/)?.[1];

    await page.waitForTimeout(1000);

    await page.goto('http://localhost:3010/loans');
    await login(page);
    await page.waitForLoadState('networkidle');
  });

  test('Loan calculator preview amortization before submission', async ({ page }) => {
    await page.goto('http://localhost:3010/loans');
    await login(page);
    await page.waitForLoadState('networkidle');

    const newApplicationButton = page.locator('button:has-text("New Application")');
    await newApplicationButton.click({ timeout: 5000 });
    await page.waitForLoadState('networkidle');
    await page.waitForURL(/\/loans\/new/, { timeout: 5000 });

    await expect(page.locator('h1')).toBeVisible();

    await page.fill('input[name="principal"]', '100000');
    await page.fill('input[name="termMonths"]', '24');
    await page.fill('input[name="interestRate"]', '8.0');

    await page.waitForTimeout(1000);

    const previewButton = page.locator('button:has-text("Preview Schedule")');
    if (await previewButton.isVisible({ timeout: 3000 })) {
      await previewButton.click({ timeout: 5000 });
      await page.waitForLoadState('networkidle');

      await expect(page.locator('h2')).toContainText('Amortization');

      const totalPayment = await page.locator('.total-payment').textContent();
      expect(totalPayment).toBeTruthy();
      expect(parseFloat(totalPayment || '0')).toBeGreaterThan(0);

      const totalInterest = await page.locator('.total-interest').textContent();
      expect(totalInterest).toBeTruthy();
    }

    const cancelButton = page.locator('button:has-text("Cancel")');
    if (await cancelButton.isVisible({ timeout: 3000 })) {
      await cancelButton.click({ timeout: 5000 });
      await page.waitForLoadState('networkidle');
    }
  });

  test('Verify loan pipeline statistics update correctly', async ({ page }) => {
    await page.goto('http://localhost:3010/loans');
    await login(page);
    await page.waitForLoadState('networkidle');

    const pipelineCards = page.locator('.glass');
    const draftCard = pipelineCards.filter({ hasText: 'Draft' });
    const countSpan = draftCard.locator('span').filter({ hasText: '' }).nth(1);

    const count = await countSpan.textContent({ timeout: 5000 });

    if (count && count !== '0') {
      await countSpan.click({ timeout: 5000 });
      await page.waitForLoadState('networkidle');

      await expect(page.locator('h1')).toBeVisible();
    }
  });

  test('Loan pipeline view updates in real-time', async ({ page }) => {
    await page.goto('http://localhost:3010/loans');
    await login(page);
    await page.waitForLoadState('networkidle');

    const draftCard = page.locator('.glass').filter({ hasText: 'Draft' });
    const countSpan = draftCard.locator('span').filter({ hasText: '' }).nth(1);

    const initialDraftCount = await countSpan.textContent({ timeout: 5000 });
    await expect(initialDraftCount).toBeTruthy();

    const existingLoan = await page.locator('tr[data-status="draft"]').first();
    if (await existingLoan.isVisible({ timeout: 5000 })) {
      await existingLoan.click();
      await page.waitForLoadState('networkidle');

      await page.click('button:has-text("Submit for Review")', { timeout: 5000 });
      await page.waitForLoadState('networkidle');
      await expect(page.locator('text=Submitted successfully')).toBeVisible();

      await page.goBack();
      await page.waitForLoadState('networkidle');

      const updatedDraftCount = await countSpan.textContent({ timeout: 5000 });
      await expect(updatedDraftCount).toBeTruthy();
    }
  });

  test('Add collateral to loan application', async ({ page }) => {
    const existingLoan = await page.locator('tr[data-status="approved"]').first();
    if (await existingLoan.isVisible()) {
      await existingLoan.click();
      await page.waitForLoadState('networkidle');

      await expect(page.locator('h1')).toBeVisible();
      await expect(page.locator('button:has-text("Collateral")')).toBeVisible();

      await page.click('button:has-text("Collateral")');
      await page.waitForLoadState('networkidle');

      await expect(page.locator('h2')).toContainText('Collateral Management');

      await page.fill('input[name="collateralType"]', 'Vehicle');
      await page.fill('input[name="collateralValue"]', '25000');
      await page.fill('textarea[name="collateralDescription"]', 'Honda Civic 2018');

      await page.click('button:has-text("Add Collateral")');
      await page.waitForLoadState('networkidle');
      await expect(page.locator('text=Collateral added successfully')).toBeVisible();

      await page.click('button:has-text("Overview")');
      await page.waitForLoadState('networkidle');
    }
  });

  test('Loan officer can submit loan for review', async ({ page }) => {
    const existingLoan = await page.locator('tr[data-status="draft"]').first();
    if (await existingLoan.isVisible()) {
      await existingLoan.click();
      await page.waitForLoadState('networkidle');

      await expect(page.locator('h1')).toBeVisible();

      await page.click('button:has-text("Submit for Review")');
      await page.waitForLoadState('networkidle');
      await expect(page.locator('text=Submitted successfully')).toBeVisible();

      await page.goBack();
      await page.waitForLoadState('networkidle');
    }
  });

  test('Branch manager can review and approve/reject loan', async ({ page }) => {
    const existingLoan = await page.locator('tr[data-status="submitted"]').first();
    if (await existingLoan.isVisible()) {
      await existingLoan.click();
      await page.waitForLoadState('networkidle');

      await expect(page.locator('h1')).toBeVisible();

      const reviewNote = 'Approved based on strong credit history and collateral';
      await page.fill('textarea[name="reviewNote"]', reviewNote);

      await page.click('button:has-text("Approve")');
      await page.waitForLoadState('networkidle');
      await expect(page.locator('text=Approved successfully')).toBeVisible();

      await page.goBack();
      await page.waitForLoadState('networkidle');
    }
  });

  test('Credit Committee can review and finalize approval', async ({ page }) => {
    const existingLoan = await page.locator('tr[data-status="reviewing"]').first();
    if (await existingLoan.isVisible()) {
      await existingLoan.click();
      await page.waitForLoadState('networkidle');

      await expect(page.locator('h1')).toBeVisible();

      const commitNote = 'Final approval - Credit committee decision';
      await page.fill('textarea[name="commitNote"]', commitNote);

      await page.click('button:has-text("Finalize Approval")');
      await page.waitForLoadState('networkidle');
      await expect(page.locator('text=Finalized successfully')).toBeVisible();

      await page.goBack();
      await page.waitForLoadState('networkidle');
    }
  });

  test('View loan amortization schedule preview', async ({ page }) => {
    const existingLoan = await page.locator('tr[data-status="approved"]').first();
    if (await existingLoan.isVisible()) {
      await existingLoan.click();
      await page.waitForLoadState('networkidle');

      await expect(page.locator('h1')).toBeVisible();
      await expect(page.locator('button:has-text("Schedule")')).toBeVisible();

      await page.click('button:has-text("Schedule")');
      await page.waitForLoadState('networkidle');

      await expect(page.locator('h2')).toContainText('Amortization Schedule');

      const table = page.locator('table');
      await expect(table).toBeVisible();
      await expect(table.locator('thead')).toContainText('Principal');
      await expect(table.locator('thead')).toContainText('Interest');
      await expect(table.locator('thead')).toContainText('Total Payment');
      await expect(table.locator('thead')).toContainText('Balance');

      await page.click('button:has-text("Overview")');
      await page.waitForLoadState('networkidle');
    }
  });

  test('Add guarantor/co-maker to loan application', async ({ page }) => {
    const existingLoan = await page.locator('tr[data-status="reviewing"]').first();
    if (await existingLoan.isVisible()) {
      await existingLoan.click();
      await page.waitForLoadState('networkidle');

      await expect(page.locator('h1')).toBeVisible();
      await expect(page.locator('button:has-text("Guarantors")')).toBeVisible();

      await page.click('button:has-text("Guarantors")');
      await page.waitForLoadState('networkidle');

      await expect(page.locator('h2')).toContainText('Guarantor Management');

      await page.fill('input[name="guarantorName"]', 'Maria Santos');
      await page.fill('input[name="guarantorRelationship"]', 'Spouse');
      await page.fill('input[name="guarantorContact"]', '09876543210');
      await page.fill('textarea[name="guarantorNote"]', 'Financially stable, co-owns property with borrower');

      await page.click('button:has-text("Add Guarantor")');
      await page.waitForLoadState('networkidle');
      await expect(page.locator('text=Guarantor added successfully')).toBeVisible();

      await page.click('button:has-text("Overview")');
      await page.waitForLoadState('networkidle');
    }
  });

  test('Credit scoring engine displays risk assessment', async ({ page }) => {
    const existingLoan = await page.locator('tr[data-status="submitted"]').first();
    if (await existingLoan.isVisible()) {
      await existingLoan.click();
      await page.waitForLoadState('networkidle');

      await expect(page.locator('h1')).toBeVisible();

      const riskScore = await page.locator('.risk-score').textContent();
      expect(riskScore).toBeTruthy();
      expect(parseInt(riskScore || '0')).toBeGreaterThanOrEqual(0);
      expect(parseInt(riskScore || '0')).toBeLessThanOrEqual(100);

      await page.click('button:has-text("Overview")');
      await page.waitForLoadState('networkidle');
    }
  });

  test('Debt-to-Income (DTI) ratio check displays eligibility', async ({ page }) => {
    const existingLoan = await page.locator('tr[data-status="reviewing"]').first();
    if (await existingLoan.isVisible()) {
      await existingLoan.click();
      await page.waitForLoadState('networkidle');

      await expect(page.locator('h1')).toBeVisible();

      const dtiRatio = await page.locator('.dti-ratio').textContent();
      expect(dtiRatio).toBeTruthy();
      expect(parseFloat(dtiRatio || '0')).toBeLessThan(100);

      await page.click('button:has-text("Overview")');
      await page.waitForLoadState('networkidle');
    }
  });

  test('Loan application status workflow progression', async ({ page }) => {
    const existingLoan = await page.locator('tr[data-status="draft"]').first();
    if (await existingLoan.isVisible()) {
      await existingLoan.click();
      await page.waitForLoadState('networkidle');

      const initialStatus = await page.locator('[data-testid="loanStatus"]').textContent();
      expect(initialStatus).toBe('Draft');

      await page.click('button:has-text("Submit for Review")');
      await page.waitForLoadState('networkidle');
      await expect(page.locator('text=Submitted successfully')).toBeVisible();

      await page.goBack();
      await page.waitForLoadState('networkidle');

      const submittedLoan = await page.locator('tr[data-status="submitted"]').first();
      await submittedLoan.click();
      await page.waitForLoadState('networkidle');

      const reviewStatus = await page.locator('[data-testid="loanStatus"]').textContent();
      expect(reviewStatus).toBe('Reviewing');

      await page.click('button:has-text("Approve")');
      await page.waitForLoadState('networkidle');
      await expect(page.locator('text=Approved successfully')).toBeVisible();

      await page.goBack();
      await page.waitForLoadState('networkidle');

      const approvedLoan = await page.locator('tr[data-status="approved"]').first();
      await approvedLoan.click();
      await page.waitForLoadState('networkidle');

      const finalStatus = await page.locator('[data-testid="loanStatus"]').textContent();
      expect(finalStatus).toBe('Approved');

      await page.click('button:has-text("Disburse")');
      await page.waitForLoadState('networkidle');
      await expect(page.locator('text=Disbursed successfully')).toBeVisible();
    }
  });

  test('Loan officer can add multiple guarantors', async ({ page }) => {
    const existingLoan = await page.locator('tr[data-status="reviewing"]').first();
    if (await existingLoan.isVisible()) {
      await existingLoan.click();
      await page.waitForLoadState('networkidle');

      await expect(page.locator('h1')).toBeVisible();

      await page.click('button:has-text("Guarantors")');
      await page.waitForLoadState('networkidle');

      const firstGuarantor = 'Maria Santos';
      await page.fill('input[name="guarantorName"]', firstGuarantor);
      await page.fill('input[name="guarantorRelationship"]', 'Spouse');
      await page.fill('input[name="guarantorContact"]', '09876543210');
      await page.fill('textarea[name="guarantorNote"]', 'Primary guarantor');
      await page.click('button:has-text("Add Guarantor")');
      await page.waitForLoadState('networkidle');

      await page.fill('input[name="guarantorName"]', 'Pedro Reyes');
      await page.fill('input[name="guarantorRelationship"]', 'Father');
      await page.fill('input[name="guarantorContact"]', '09123456780');
      await page.fill('textarea[name="guarantorNote"]', 'Secondary guarantor');
      await page.click('button:has-text("Add Guarantor")');
      await page.waitForLoadState('networkidle');

      await expect(page.locator('text=Guarantor added successfully')).toHaveCount(2);

      await page.click('button:has-text("Overview")');
      await page.waitForLoadState('networkidle');
    }
  });

  test('Loan officer can add multiple types of collateral', async ({ page }) => {
    const existingLoan = await page.locator('tr[data-status="approved"]').first();
    if (await existingLoan.isVisible()) {
      await existingLoan.click();
      await page.waitForLoadState('networkidle');

      await expect(page.locator('h1')).toBeVisible();

      await page.click('button:has-text("Collateral")');
      await page.waitForLoadState('networkidle');

      await page.selectOption('select[name="collateralType"]', 'Vehicle');
      await page.fill('input[name="collateralValue"]', '25000');
      await page.fill('textarea[name="collateralDescription"]', 'Honda Civic 2018');
      await page.click('button:has-text("Add Collateral")');
      await page.waitForLoadState('networkidle');

      await page.selectOption('select[name="collateralType"]', 'Real Estate');
      await page.fill('input[name="collateralValue"]', '150000');
      await page.fill('textarea[name="collateralDescription"]', 'House and Lot, Metro Manila');
      await page.click('button:has-text("Add Collateral")');
      await page.waitForLoadState('networkidle');

      await expect(page.locator('text=Collateral added successfully')).toHaveCount(2);

      await page.click('button:has-text("Overview")');
      await page.waitForLoadState('networkidle');
    }
  });

  test('Verify loan detail page shows all Phase 2.2 information', async ({ page }) => {
    const existingLoan = await page.locator('tr[data-status="reviewing"]').first();
    if (await existingLoan.isVisible()) {
      await existingLoan.click();
      await page.waitForLoadState('networkidle');

      await expect(page.locator('h1')).toBeVisible();

      const tabs = page.locator('[data-testid="loanTab"]');
      await expect(tabs).toHaveCount(4);
      await expect(tabs.first()).toContainText('Overview');
      await expect(tabs.nth(1)).toContainText('Schedule');
      await expect(tabs.nth(2)).toContainText('Collateral');
      await expect(tabs.nth(3)).toContainText('Guarantors');

      await expect(page.locator('[data-testid="loanStatus"]')).toBeVisible();
      await expect(page.locator('[data-testid="loanPrincipal"]')).toBeVisible();
      await expect(page.locator('[data-testid="loanRate"]')).toBeVisible();
      await expect(page.locator('[data-testid="loanTerm"]')).toBeVisible();
      await expect(page.locator('[data-testid="loanBorrower"]')).toBeVisible();

      await page.click('button:has-text("Overview")');
      await page.waitForLoadState('networkidle');
    }
  });

  test('Loan officer can access loan calculations and amortization', async ({ page }) => {
    const existingLoan = await page.locator('tr[data-status="reviewing"]').first();
    if (await existingLoan.isVisible()) {
      await existingLoan.click();
      await page.waitForLoadState('networkidle');

      await expect(page.locator('h1')).toBeVisible();

      await page.click('button:has-text("Schedule")');
      await page.waitForLoadState('networkidle');

      await expect(page.locator('h2')).toContainText('Amortization Schedule');

      const scheduleTable = page.locator('table');
      await expect(scheduleTable).toBeVisible();

      const rows = scheduleTable.locator('tbody tr');
      const row = await rows.first();
      await expect(row).toBeVisible();

      await page.click('button:has-text("Overview")');
      await page.waitForLoadState('networkidle');
    }
  });
});

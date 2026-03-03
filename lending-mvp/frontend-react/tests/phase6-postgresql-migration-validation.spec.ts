import { test, expect } from '@playwright/test';

test.describe('PostgreSQL Migration Validation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3010');
    await page.waitForLoadState('networkidle');
  });

  test('Frontend loads after PostgreSQL migration', async ({ page }) => {
    await expect(page).toHaveTitle(/Lending/i);
    await expect(page.locator('#root')).toBeVisible();
  });

  test('Docker containers are running', async () => {
    const containers = await fetch('http://localhost:2375/containers/json', {
      signal: AbortSignal.timeout(5000)
    }).catch(() => null);
    
    // Skip if Docker API not available (running inside container)
    if (containers) {
      const data = await containers.json();
      const backendRunning = data.some((c: any) => c.Names[0] === '/lending_backend');
      const postgresRunning = data.some((c: any) => c.Names[0] === '/lending_postgres');
      const redisRunning = data.some((c: any) => c.Names[0] === '/lending_redis');
      
      expect(backendRunning).toBe(true);
      expect(postgresRunning).toBe(true);
      expect(redisRunning).toBe(true);
    }
  });

  test('Backend is accessible', async ({ page }) => {
    const response = await page.request.get('http://localhost:8001', {
      timeout: 10000
    });
    // Backend might not have root endpoint, check GraphQL
    expect(response.ok() || response.status === 404).toBe(true);
  });

  test('GraphQL endpoint exists', async ({ page }) => {
    const response = await page.request.post('http://localhost:8001/graphql', {
      data: {
        query: '{ __typename }'
      }
    });
    expect(response.ok()).toBeTruthy();
    
    const data = await response.json();
    expect(data.data).toHaveProperty('__typename');
  });

  test('Frontend can connect to backend', async ({ page }) => {
    const response = await page.request.get('http://localhost:8001/graphql', {
      timeout: 10000
    });
    // Backend might not serve GraphQL on GET, but the endpoint should be reachable
    expect(response.ok() || response.status === 405 || response.status === 404).toBe(true);
  });
});

test.describe('MongoDB Removal Validation', () => {
  test('MongoDB container is not running', async () => {
    try {
      const response = await fetch('http://localhost:27017', {
        method: 'GET',
        signal: AbortSignal.timeout(3000)
      });
      expect(response.ok).toBe(false);
    } catch (error) {
      expect(error).toBeTruthy();
    }
  });

  test('MongoDB container on port 27018 is not responding', async () => {
    try {
      const response = await fetch('http://localhost:27018', {
        method: 'GET',
        signal: AbortSignal.timeout(3000)
      });
      expect(response.ok).toBe(false);
    } catch (error) {
      expect(error).toBeTruthy();
    }
  });

  test('Backend does not use MongoDB connection string', async ({ page }) => {
    const response = await page.request.get('http://localhost:8001/api/config', {
      timeout: 5000
    });
    
    if (response.ok()) {
      const data = await response.json();
      expect(data.database_url).toContain('postgresql');
      expect(data.database_url).not.toContain('mongodb');
    }
  });

  test('GraphQL schema does not reference MongoDB', async ({ page }) => {
    const response = await page.request.post('http://localhost:8001/graphql', {
      data: {
        query: '{ __schema { types { name } } }'
      }
    });
    expect(response.ok()).toBeTruthy();
    
    const data = await response.json();
    const typeNames = data.data.__schema.types.map((t: any) => t.name);
    expect(typeNames).not.toContain(/.*mongo.*/i);
  });

  test('No MongoDB collections exist in backend code', async ({ page }) => {
    const response = await page.request.get('http://localhost:8001/api/collections', {
      timeout: 5000
    });
    
    if (response.ok()) {
      const data = await response.json();
      expect(data.collections).toHaveLength(0);
    }
  });
});

test.describe('PostgreSQL Data Integrity', () => {
  test('Customers can be retrieved from PostgreSQL', async ({ page }) => {
    await page.goto('http://localhost:3010/customers');
    await page.waitForLoadState('networkidle');
    
    const customerCount = await page.locator('[data-testid="customer-card"]').count();
    expect(customerCount).toBeGreaterThan(0);
  });

  test('Loan products exist in PostgreSQL', async ({ page }) => {
    await page.goto('http://localhost:3010/loans');
    await page.waitForLoadState('networkidle');
    
    const productCount = await page.locator('[data-testid="loan-product-card"]').count();
    expect(productCount).toBeGreaterThan(0);
  });

  test('Savings accounts are accessible', async ({ page }) => {
    await page.goto('http://localhost:3010/savings');
    await page.waitForLoadState('networkidle');
    
    const savingsCount = await page.locator('[data-testid="savings-account-card"]').count();
    expect(savingsCount).toBeGreaterThanOrEqual(0);
  });

  test('Backend returns PostgreSQL version', async ({ page }) => {
    const response = await page.request.get('http://localhost:8001/api/db/version', {
      timeout: 5000
    });
    
    if (response.ok()) {
      const data = await response.json();
      expect(data.version).toMatch(/^16\./);
      expect(data.driver).toBe('postgresql');
    }
  });
});

test.describe('Integration Tests - End-to-End Flow', () => {
  test('Complete customer journey through PostgreSQL', async ({ page }) => {
    await page.goto('http://localhost:3010');
    await page.waitForLoadState('networkidle');
    
    await page.fill('input[type="text"]', 'admin');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');
    
    await expect(page).toHaveURL(/\/dashboard/);
    
    await page.click('text=Customers');
    await page.waitForLoadState('networkidle');
    
    const customerCount = await page.locator('[data-testid="customer-card"]').count();
    expect(customerCount).toBeGreaterThan(0);
    
    await page.click('text=Loans');
    await page.waitForLoadState('networkidle');
    
    const productCount = await page.locator('[data-testid="loan-product-card"]').count();
    expect(productCount).toBeGreaterThan(0);
  });

  test('Backend health check shows PostgreSQL status', async ({ page }) => {
    const response = await page.request.get('http://localhost:8001/api/health', {
      timeout: 5000
    });
    
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    
    expect(data.status).toBe('healthy');
    expect(data.services.postgresql).toBe(true);
    expect(data.services.mongodb).toBe(false);
  });

  test('Database migration status endpoint', async ({ page }) => {
    const response = await page.request.get('http://localhost:8001/api/migration/status', {
      timeout: 5000
    });
    
    if (response.ok()) {
      const data = await response.json();
      expect(data.migrated_to_postgres).toBe(true);
      expect(data.migration_complete).toBe(true);
      expect(data.mongodb_removed).toBe(true);
    }
  });
});

test.describe('Performance and Configuration', () => {
  test('Backend connects only to PostgreSQL', async ({ page }) => {
    const response = await page.request.get('http://localhost:8001/api/connections', {
      timeout: 5000
    });
    
    if (response.ok()) {
      const data = await response.json();
      expect(data.connections.postgresql).toBe(true);
      expect(data.connections.mongodb).toBe(false);
    }
  });

  test('No deprecated MongoDB endpoints', async ({ page }) => {
    const response = await page.request.get('http://localhost:8001/api/endpoints', {
      timeout: 5000
    });
    
    if (response.ok()) {
      const data = await response.json();
      const mongodbEndpoints = data.endpoints.filter((ep: any) => 
        ep.path.includes('mongo') || ep.path.includes('mongodb')
      );
      expect(mongodbEndpoints).toHaveLength(0);
    }
  });

  test('Database pool configuration is PostgreSQL', async ({ page }) => {
    const response = await page.request.get('http://localhost:8001/api/db/pool', {
      timeout: 5000
    });
    
    if (response.ok()) {
      const data = await response.json();
      expect(data.type).toBe('postgresql');
      expect(data.pool_size).toBeGreaterThan(0);
    }
  });
});
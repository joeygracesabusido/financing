/**
 * E2E Demo Data — Single source of truth aligned with backend demo_seeder.py
 * ==========================================================================
 * Use this in all E2E tests so scenarios match the seeded PostgreSQL data.
 * See: DEMO_DATA_INDEX.md, backend/app/utils/demo_seeder.py
 */

/** Base URL for the frontend (matches playwright.config.ts baseURL) */
export const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3010';

/** Backend API base (health, api-login) */
export const API_URL = process.env.PLAYWRIGHT_API_URL || 'http://localhost:8001';

// ─── Demo users (same as SAMPLE_USERS in demo_seeder.py) ───────────────────
/** Admin may be created by seed_admin_user (admin123) or demo seed (Admin@123Demo). Try demo first. */
export const DEMO_USERS = {
  admin: { username: 'admin', password: 'Admin@123Demo', role: 'admin' },
  adminFallback: { username: 'admin', password: 'admin123', role: 'admin' },
  loan_officer_1: { username: 'loan_officer_1', password: 'LoanOfficer@123', role: 'loan_officer' },
  loan_officer_2: { username: 'loan_officer_2', password: 'LoanOfficer@123', role: 'loan_officer' },
  teller_1: { username: 'teller_1', password: 'Teller@123Demo', role: 'teller' },
  teller_2: { username: 'teller_2', password: 'Teller@123Demo', role: 'teller' },
  branch_manager: { username: 'branch_manager', password: 'BranchMgr@123', role: 'branch_manager' },
  branch_manager_cdo: { username: 'branch_manager_cdo', password: 'BranchMgr@123', role: 'branch_manager' },
  auditor: { username: 'auditor', password: 'Auditor@123Demo', role: 'auditor' },
  /** Customer portal user (Phase 5) — linked to Juan dela Cruz if seeded */
  customer: { username: 'juan.dela.cruz', password: 'Customer@123', role: 'customer' },
} as const;

/** Short form for login(page, 'admin') style — u/p keys. Admin uses admin123 (seed_admin_user in Docker). */
export const DEMO_USERS_LEGACY = {
  admin: { u: 'admin', p: 'admin123' },
  loan_officer: { u: 'loan_officer_1', p: 'LoanOfficer@123' },
  teller: { u: 'teller_1', p: 'Teller@123Demo' },
  branch_manager: { u: 'branch_manager', p: 'BranchMgr@123' },
  auditor: { u: 'auditor', p: 'Auditor@123Demo' },
  customer: { u: 'juan.dela.cruz', p: 'Customer@123' },
} as const;

// ─── Demo customers (display_name as in demo_seeder SAMPLE_CUSTOMERS_*) ─────
export const DEMO_CUSTOMERS = {
  /** HQ branch */
  juanDelaCruz: 'Juan dela Cruz',
  mariaCruzSantos: 'Maria Cruz Santos',
  elenaDiazCruz: 'Elena Diaz Cruz',
  /** BR-QC branch */
  pedroLopezGarcia: 'Pedro Lopez Garcia',
  rosaMagdaloVillanueva: 'Rosa Magdalo Villanueva',
  anaReyesMendoza: 'Ana Reyes Mendoza',
  /** BR-CDO branch */
  carlosMiguelBautista: 'Carlos Miguel Bautista',
  robertoTorresFlores: 'Roberto Torres Flores',
  /** Joint */
  jointAccount: 'Dela Cruz - Santos Joint Account',
  /** Corporate */
  techCorp: 'TechCorp Philippines Inc.',
  manufacturingIndustries: 'Manufacturing Industries Ltd.',
} as const;

/** Search snippets to type in customer picker (minimal to avoid duplicates) */
export const DEMO_CUSTOMER_SEARCH = {
  juan: 'Juan',
  maria: 'Maria',
  elena: 'Elena',
  pedro: 'Pedro',
  rosa: 'Rosa',
  ana: 'Ana',
  carlos: 'Carlos',
  roberto: 'Roberto',
  techcorp: 'TechCorp',
  manufacturing: 'Manufacturing',
} as const;

// ─── Demo loan products (names from seed_loan_products / PGLoanProduct) ─────
export const DEMO_LOAN_PRODUCTS = {
  personalLoan: 'Personal Loan',
  businessLoan: 'Business Loan',
  salaryLoan: 'Salary Loan',
  agriculturalLoan: 'Agricultural Loan',
} as const;

/** Search snippets for product picker */
export const DEMO_LOAN_PRODUCT_SEARCH = {
  personal: 'Personal',
  business: 'Business',
  salary: 'Salary',
  agricultural: 'Agricultural',
} as const;

// ─── Demo branches (code / name from SAMPLE_BRANCHES) ───────────────────────
export const DEMO_BRANCHES = {
  HQ: { code: 'HQ', name: 'Head Office' },
  BR_QC: { code: 'BR-QC', name: 'Quezon City Branch' },
  BR_CDO: { code: 'BR-CDO', name: 'Cagayan de Oro Branch' },
} as const;

// ─── Realistic amounts / terms (within product limits) ───────────────────────
export const DEMO_LOAN_AMOUNTS = {
  personal: { principal: 150_000, termMonths: 24, interestRate: 14 },
  business: { principal: 500_000, termMonths: 36, interestRate: 12 },
  salary: { principal: 75_000, termMonths: 12, interestRate: 15 },
  agricultural: { principal: 220_000, termMonths: 12, interestRate: 12 },
} as const;

export const DEMO_SAVINGS = {
  initialDeposit: 50_000,
  depositAmount: 10_000,
  withdrawalAmount: 5_000,
} as const;

// ─── Scenario notes (realistic text for forms) ───────────────────────────────
export const DEMO_NOTES = {
  approval: 'Credit review completed - Customer has good payment history and stable employment.',
  review: 'Approved based on strong credit history and collateral. Ready for disbursement.',
  disbursement: 'Disbursed via manager check. Customer acknowledged receipt.',
  repayment: 'Monthly amortization payment - principal and interest.',
  deposit: 'Cash deposit at branch counter.',
  restructure: 'Customer requested extension due to temporary financial hardship.',
} as const;

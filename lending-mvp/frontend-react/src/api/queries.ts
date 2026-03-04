import { gql } from '@apollo/client'

// Auth
export const LOGIN_MUTATION = gql`
  mutation Login($username: String!, $password: String!, $totpCode: String) {
    login(input: { username: $username, password: $password, totpCode: $totpCode }) {
      accessToken
      refreshToken
      tokenType
      user {
        id
        username
        email
        fullName
        isActive
        role
      }
    }
  }
`

export const LOGOUT_MUTATION = gql`
  mutation Logout {
    logout
  }
`

// Dashboard
export const GET_DASHBOARD_STATS = gql`
  query GetDashboardStats {
    dashboardStats {
      customersTotal
      loansTotal
    }
  }
`

// Users
export const GET_USERS = gql`
  query GetUsers($skip: Int, $limit: Int) {
    users(skip: $skip, limit: $limit) {
      id
      email
      username
      fullName
      isActive
      role
    }
  }
`

export const GET_CUSTOMER = gql`
  query GetCustomer($id: ID!) {
    customer(id: $id) {
      id
      displayName
      firstName
      lastName
      emailAddress
      mobileNumber
      customerType
      customerCategory
      kycStatus
      riskScore
      branch
      createdAt
    }
  }
`

export const UPDATE_CUSTOMER = gql`
  mutation UpdateCustomer($input: CustomerInput!) {
    updateCustomer(input: $input) {
      success
      message
    }
  }
`

export const CREATE_CUSTOMER = gql`
  mutation CreateCustomer($input: CustomerInput!) {
    createDummy {
      success
      message
    }
  }
`

// Customers
export const GET_CUSTOMERS = gql`
  query GetCustomers($skip: Int, $limit: Int) {
    customers(skip: $skip, limit: $limit) {
      id
      displayName
      customerType
      branchCode
      isActive
    }
  }
`

// Loans
export const GET_LOANS = gql`
  query GetLoans($skip: Int, $limit: Int) {
    loans(skip: $skip, limit: $limit) {
      id
      principal
      status
      customerId
    }
  }
`

export const GET_LOAN = gql`
  query GetLoan($id: ID!) {
    loan(id: $id) {
      id
      customerId
      productId
      principal
      termMonths
      approvedPrincipal
      approvedRate
      status
      createdAt
      updatedAt
    }
  }
`

export const GET_CUSTOMER_LOANS = gql`
  query GetCustomerLoans($customerId: String!) {
    loans(customerId: $customerId) {
      id
      customerId
      productId
      principal
      termMonths
      approvedPrincipal
      approvedRate
      status
      createdAt
      updatedAt
    }
  }
`

// Savings
export const GET_SAVINGS = gql`
  query GetSavings($skip: Int, $limit: Int) {
    savingsAccounts(skip: $skip, limit: $limit) {
      id
      accountNumber
      balance
      customerId
    }
  }
`

export const GET_SAVINGS_ACCOUNT = gql`
  query GetSavingsAccount($id: ID!) {
    savingsAccount(id: $id) {
      id
      accountNumber
      balance
      customerId
      createdAt
    }
  }
`

export const GET_SAVINGS_TRANSACTIONS = gql`
  query GetSavingsTransactions($accountId: ID!) {
    savingsTransactions(accountId: $accountId) {
      id
      accountId
      amount
      type
      reference
      createdAt
    }
  }
`

export const GET_CUSTOMER_SAVINGS = gql`
  query GetCustomerSavings($customerId: String!) {
    savingsAccounts(customerId: $customerId) {
      id
      accountNumber
      balance
      customerId
      createdAt
    }
  }
`

export const CREATE_SAVINGS = gql`
  mutation CreateSavings($input: SavingsInput!) {
    createDummy {
      success
      message
    }
  }
`

export const DEPOSIT = gql`
  mutation Deposit($accountId: ID!, $amount: Float!) {
    createDummy {
      success
      message
    }
  }
`

export const WITHDRAW = gql`
  mutation Withdraw($accountId: ID!, $amount: Float!) {
    createDummy {
      success
      message
    }
  }
`

// Other placeholders
export const GET_LOAN_PRODUCTS = gql`
  query GetLoanProducts {
    loanProducts {
      id
      name
      description
      minLoanAmount
      maxLoanAmount
      interestRate
      termMonths
      createdAt
    }
  }
`

export const UPDATE_LOAN_PRODUCT = gql`
  mutation UpdateLoanProduct($input: LoanProductInput!) {
    updateLoanProduct(input: $input) {
      success
      message
    }
  }
`

export const CREATE_USER = gql`
  mutation CreateUser($input: UserInput!) {
    createDummy {
      success
      message
    }
  }
`

export const UPDATE_USER = gql`
  mutation UpdateUser($id: ID!, $input: UserInput!) {
    updateUser(id: $id, input: $input) {
      success
      message
    }
  }
`

export const GET_LOAN_AMORTIZATION = gql`
  query GetLoanAmortization($loanId: ID!) {
    loanAmortization(loanId: $loanId) {
      id
      loanId
      principal
      interestRate
      termMonths
      amortizationSchedule {
        month
        principalPayment
        interestPayment
        totalPayment
        outstandingBalance
      }
    }
  }
`

export const GET_COLLECTIONS_DASHBOARD = gql`
  query GetCollectionsDashboard {
    collectionsDashboard {
      totalCollections
      pendingCollections
      overdueCollections
      collectedThisMonth
    }
  }
`

export const GET_AUDIT_LOGS = gql`
  query GetAuditLogs($limit: Int, $offset: Int) {
    auditLogs(limit: $limit, offset: $offset) {
      id
      userId
      action
      resource
      timestamp
    }
  }
`

export const GET_GL_ACCOUNTS = gql`
  query GetGLAccounts {
    glAccounts {
      id
      accountNumber
      name
      type
      balance
      createdAt
    }
  }
`

export const GET_GL_ACCOUNT_TRANSACTIONS = gql`
  query GetGLAccountTransactions($accountId: ID!) {
    glAccountTransactions(accountId: $accountId) {
      id
      accountId
      amount
      type
      reference
      createdAt
    }
  }
`

export const GET_JOURNAL_ENTRIES = gql`
  query GetJournalEntries($limit: Int, $offset: Int) {
    journalEntries(limit: $limit, offset: $offset) {
      id
      date
      description
      debit
      credit
      createdAt
    }
  }
`

export const GET_JOURNAL_ENTRY_BY_REFERENCE = gql`
  query GetJournalEntryByReference($reference: String!) {
    journalEntryByReference(reference: $reference) {
      id
      date
      description
      debit
      credit
      createdAt
    }
  }
`

export const ADD_BENEFICIARY = gql`
  mutation AddBeneficiary($input: BeneficiaryInput!) {
    addBeneficiary(input: $input) {
      success
      message
      beneficiary {
        id
        name
        accountNumber
        bankName
        createdAt
      }
    }
  }
`

export const GET_BENEFICIARIES = gql`
  query GetBeneficiaries {
    beneficiaries {
      id
      name
      accountNumber
      bankName
      createdAt
    }
  }
`

export const UPDATE_BENEFICIARY = gql`
  mutation UpdateBeneficiary($id: ID!, $input: BeneficiaryInput!) {
    updateBeneficiary(id: $id, input: $input) {
      success
      message
    }
  }
`

export const DELETE_BENEFICIARY = gql`
  mutation DeleteBeneficiary($id: ID!) {
    deleteBeneficiary(id: $id) {
      success
      message
    }
  }
`

// Customer Activities (placeholder)
export const GET_CUSTOMER_ACTIVITIES = gql`
  query GetCustomerActivities($customerId: String!) {
    customerActivities(customerId: $customerId) {
      id
      activityType
      description
      timestamp
      createdBy
    }
  }
`

export const GET_CUSTOMER_REPAYMENT_HISTORY = gql`
  query GetCustomerRepaymentHistory($customerId: String!) {
    customerRepaymentHistory(customerId: $customerId) {
      id
      loanId
      amount
      status
      dueDate
      paidDate
      createdAt
    }
  }
`

export const GET_COLLECTIONS = gql`
  query GetCollections {
    collections {
      id
      customerId
      amount
      status
      dueDate
      createdAt
    }
  }
`

export const GET_COLLECTION_DUE = gql`
  query GetCollectionDue {
    collectionDue {
      id
      customerId
      amount
      status
      dueDate
      createdAt
    }
  }
`

export const GET_CUSTOMER_TRANSFER = gql`
  query GetCustomerTransfer($id: ID!) {
    customerTransfer(id: $id) {
      id
      customerId
      amount
      type
      status
      createdAt
    }
  }
`

export const GET_LOAN_PRODUCT = gql`
  query GetLoanProduct($id: ID!) {
    loanProduct(id: $id) {
      id
      name
      description
      minLoanAmount
      maxLoanAmount
      interestRate
      termMonths
      createdAt
    }
  }
`

export const UPDATE_LOAN = gql`
  mutation UpdateLoan($id: ID!, $input: LoanInput!) {
    updateLoan(id: $id, input: $input) {
      success
      message
    }
  }
`

export const DELETE_LOAN = gql`
  mutation DeleteLoan($id: ID!) {
    deleteLoan(id: $id) {
      success
      message
    }
  }
`

export const ADD_LOAN = gql`
  mutation AddLoan($input: LoanInput!) {
    addLoan(input: $input) {
      success
      message
      loan {
        id
        customerId
        productId
        principal
        termMonths
        approvedPrincipal
        approvedRate
        status
        createdAt
      }
    }
  }
`

export const APPROVE_LOAN = gql`
  mutation ApproveLoan($id: ID!) {
    approveLoan(id: $id) {
      success
      message
    }
  }
`

export const REJECT_LOAN = gql`
  mutation RejectLoan($id: ID!, $reason: String) {
    rejectLoan(id: $id, reason: $reason) {
      success
      message
    }
  }
`

// ── GL Accounts (additional) ─────────────────────────────────────────────────
export const CREATE_GL_ACCOUNT = gql`
  mutation CreateGLAccount($input: GLAccountInput!) {
    createGLAccount(input: $input) {
      success
      message
      glAccount {
        id
        accountNumber
        name
        type
        balance
        createdAt
      }
    }
  }
`

// ── Journal Entries (additional) ─────────────────────────────────────────────
export const CREATE_MANUAL_JOURNAL_ENTRY = gql`
  mutation CreateManualJournalEntry($input: JournalEntryInput!) {
    createManualJournalEntry(input: $input) {
      success
      message
      journalEntry {
        id
        date
        description
        debit
        credit
        createdAt
      }
    }
  }
`

// ── Compliance (placeholder) ─────────────────────────────────────────────────
export const GET_AML_ALERTS = gql`
  query GetAMLAlerts {
    amlAlerts {
      id
      customerId
      alertType
      severity
      description
      createdAt
    }
  }
`

export const GET_PAR_METRICS = gql`
  query GetPARMetrics {
    parMetrics {
      averageCollectionDays
      collectionEfficiency
      totalOutstanding
      totalCollected
    }
  }
`

export const GET_NPL_METRICS = gql`
  query GetNPLMetrics {
    nplMetrics {
      totalNPL
      nplRatio
      provisionedAmount
    }
  }
`

export const GET_LLR_METRICS = gql`
  query GetLLRMetrics {
    llrMetrics {
      totalLLR
      llrRatio
      provisionedAmount
    }
  }
`

export const GET_INCOME_STATEMENT = gql`
  query GetIncomeStatement($year: Int!, $month: Int!) {
    incomeStatement(year: $year, month: $month) {
      revenue
      expenses
      profit
      createdAt
    }
  }
`

export const GET_BALANCE_SHEET = gql`
  query GetBalanceSheet($year: Int!, $month: Int!) {
    balanceSheet(year: $year, month: $month) {
      assets
      liabilities
      equity
      createdAt
    }
  }
`

export const GET_UNRESOLVED_ALERTS = gql`
  query GetUnresolvedAlerts {
    unresolvedAlerts {
      id
      customerId
      alertType
      severity
      description
      createdAt
    }
  }
`

export const RESOLVE_ALERT = gql`
  mutation ResolveAlert($id: ID!) {
    resolveAlert(id: $id) {
      success
      message
    }
  }
`

export const ESCALATE_ALERT = gql`
  mutation EscalateAlert($id: ID!, $escalationLevel: Int!) {
    escalateAlert(id: $id, escalationLevel: $escalationLevel) {
      success
      message
    }
  }
`

export const RUN_COMPLIANCE_REPORTS = gql`
  query RunComplianceReports {
    complianceReports {
      id
      reportType
      generatedAt
      status
    }
  }
`

// ── KYC Documents (additional) ───────────────────────────────────────────────
export const UPDATE_KYC_STATUS = gql`
  mutation UpdateKYCStatus($customerId: String!, $status: KYCStatus!) {
    updateKYCStatus(customerId: $customerId, status: $status) {
      success
      message
    }
  }
`

// ── Loan Application (placeholder) ───────────────────────────────────────────
export const CREATE_LOAN = gql`
  mutation CreateLoan($input: LoanInput!) {
    createLoan(input: $input) {
      success
      message
      loan {
        id
        customerId
        productId
        principal
        termMonths
        approvedPrincipal
        approvedRate
        status
        createdAt
      }
    }
  }
`

// ── Fund Transfer (placeholder) ──────────────────────────────────────────────
export const CREATE_FUND_TRANSFER = gql`
  mutation CreateFundTransfer($input: FundTransferInput!) {
    createFundTransfer(input: $input) {
      success
      message
      transfer {
        id
        customerId
        amount
        type
        status
        createdAt
      }
    }
  }
`

// ── KYC Documents (additional) ───────────────────────────────────────────────
export const GET_KYC_DOCUMENTS = gql`
  query GetKYCDocuments($customerId: String!) {
    kycDocuments(customerId: $customerId) {
      id
      customerId
      documentType
      fileName
      uploadDate
      status
    }
  }
`

export const UPLOAD_KYC_DOCUMENT = gql`
  mutation UploadKYCDocument($input: KYCDocumentInput!) {
    uploadKYCDocument(input: $input) {
      success
      message
    }
  }
`

// ── Loan Management (additional) ──────────────────────────────────────────────
export const PREVIEW_LOAN_SCHEDULE = gql`
  query PreviewLoanSchedule($loanId: ID!) {
    previewLoanSchedule(loanId: $loanId) {
      id
      loanId
      principal
      interestRate
      termMonths
      amortizationSchedule {
        month
        principalPayment
        interestPayment
        totalPayment
        outstandingBalance
      }
    }
  }
`

export const DISBURSE_LOAN = gql`
  mutation DisburseLoan($loanId: ID!, $amount: Float!) {
    disburseLoan(loanId: $loanId, amount: $amount) {
      success
      message
    }
  }
`

export const REPAY_LOAN = gql`
  mutation RepayLoan($loanId: ID!, $amount: Float!) {
    repayLoan(loanId: $loanId, amount: $amount) {
      success
      message
    }
  }
`

export const SUBMIT_LOAN = gql`
  mutation SubmitLoan($loanId: ID!) {
    submitLoan(loanId: $loanId) {
      success
      message
    }
  }
`

export const REVIEW_LOAN = gql`
  mutation ReviewLoan($loanId: ID!, $decision: LoanDecision!, $notes: String) {
    reviewLoan(loanId: $loanId, decision: $decision, notes: $notes) {
      success
      message
    }
  }
`

export const WRITE_OFF_LOAN = gql`
  mutation WriteOffLoan($loanId: ID!) {
    writeOffLoan(loanId: $loanId) {
      success
      message
    }
  }
`

export const GET_LOAN_COLLATERAL = gql`
  query GetLoanCollateral($loanId: ID!) {
    loanCollateral(loanId: $loanId) {
      id
      loanId
      collateralType
      value
      status
      createdAt
    }
  }
`

export const ADD_COLLATERAL = gql`
  mutation AddCollateral($loanId: ID!, $input: CollateralInput!) {
    addCollateral(loanId: $loanId, input: $input) {
      success
      message
    }
  }
`

export const REMOVE_COLLATERAL = gql`
  mutation RemoveCollateral($collateralId: ID!) {
    removeCollateral(collateralId: $collateralId) {
      success
      message
    }
  }
`

export const GET_LOAN_GUARANTORS = gql`
  query GetLoanGuarantors($loanId: ID!) {
    loanGuarantors(loanId: $loanId) {
      id
      loanId
      guarantorId
      guarantorName
      guarantorType
      status
      createdAt
    }
  }
`

export const ADD_GUARANTOR = gql`
  mutation AddGuarantor($loanId: ID!, $input: GuarantorInput!) {
    addGuarantor(loanId: $loanId, input: $input) {
      success
      message
    }
  }
`

export const REMOVE_GUARANTOR = gql`
  mutation RemoveGuarantor($guarantorId: ID!) {
    removeGuarantor(guarantorId: $guarantorId) {
      success
      message
    }
  }
`

export const UPDATE_AMORTIZATION_PAYMENT_DATE = gql`
  mutation UpdateAmortizationPaymentDate($loanId: ID!, $paymentDate: Date!) {
    updateAmortizationPaymentDate(loanId: $loanId, paymentDate: $paymentDate) {
      success
      message
    }
  }
`

export const UPDATE_AMORTIZATION_ROW = gql`
  mutation UpdateAmortizationRow($loanId: ID!, $month: Int!, $input: AmortizationRowInput!) {
    updateAmortizationRow(loanId: $loanId, month: $month, input: $input) {
      success
      message
    }
  }
`

// ── Loan Transactions (additional) ────────────────────────────────────────────
export const GET_LOAN_TRANSACTIONS = gql`
  query GetLoanTransactions($loanId: ID!) {
    loanTransactions(loanId: $loanId) {
      id
      loanId
      amount
      type
      status
      reference
      createdAt
    }
  }
`

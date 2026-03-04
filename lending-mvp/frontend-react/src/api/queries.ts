import { gql } from '@apollo/client'

// ── Auth ──────────────────────────────────────────────────────────────────────
export const LOGIN_MUTATION = gql`
  mutation Login($username: String!, $password: String!) {
    login(username: $username, password: $password) {
      accessToken
      refreshToken
      user {
        id
        username
        email
        role
      }
    }
  }
`

export const GET_ME = gql`
  query GetMe {
    me {
      id
      username
      email
      fullName
      role
      isActive
    }
  }
`

// ── Dashboard ────────────────────────────────────────────────────────────────
export const GET_DASHBOARD_STATS = gql`
  query GetDashboardStats {
    dashboardStats {
      customersTotal
      loansTotal
    }
  }
`

// ── Customers ─────────────────────────────────────────────────────────────────
export const GET_CUSTOMERS = gql`
  query GetCustomers($skip: Int, $limit: Int, $searchTerm: String) {
    customers(skip: $skip, limit: $limit, searchTerm: $searchTerm) {
      customers {
        id
        displayName
        customerType
        branchCode
        isActive
        emailAddress
        mobileNumber
        customerCategory
        kycStatus
        createdAt
      }
      total
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

export const CREATE_CUSTOMER = gql`
  mutation CreateCustomer($input: CustomerInput!) {
    createCustomer(input: $input) {
      customer {
        id
        displayName
      }
      success
      message
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

export const GET_CUSTOMER_ACTIVITIES = gql`
  query GetCustomerActivities($customerId: String!) {
    customerActivities(customerId: $customerId) {
      activities {
        id
        action
        detail
        actorUsername
        createdAt
      }
      total
    }
  }
`

export const GET_KYC_DOCUMENTS = gql`
  query GetKYCDocuments($customerId: String!) {
    kycDocuments(customerId: $customerId) {
      documents {
        id
        docType
        fileName
        fileSizeBytes
        status
        uploadedAt
        reviewedAt
        rejectionReason
        expiresAt
      }
      total
    }
  }
`

export const UPLOAD_KYC_DOCUMENT = gql`
  mutation UploadKycDocument($input: KycUploadInput!) {
    uploadKycDocument(input: $input) {
      success
      message
    }
  }
`

export const UPDATE_KYC_STATUS = gql`
  mutation UpdateKycStatus($documentId: Int!, $status: String!, $rejectionReason: String) {
    updateKycStatus(documentId: $documentId, status: $status, rejectionReason: $rejectionReason) {
      success
      message
    }
  }
`

export const GET_BENEFICIARIES = gql`
  query GetBeneficiaries($customerId: String!) {
    beneficiaries(customerId: $customerId) {
      beneficiaries {
        id
        fullName
        relationship
        contactNumber
        email
        address
        isPrimary
      }
      total
    }
  }
`

export const ADD_BENEFICIARY = gql`
  mutation AddBeneficiary($input: BeneficiaryInput!) {
    addBeneficiary(input: $input) {
      success
      message
    }
  }
`

export const DELETE_BENEFICIARY = gql`
  mutation DeleteBeneficiary($beneficiaryId: Int!) {
    deleteBeneficiary(beneficiaryId: $beneficiaryId) {
      success
      message
    }
  }
`

// ── Loans ────────────────────────────────────────────────────────────────────
export const GET_LOANS = gql`
  query GetLoans($skip: Int, $limit: Int, $customerId: String) {
    loans(skip: $skip, limit: $limit, customerId: $customerId) {
      loans {
        id
        principal
        status
        customerId
        productId
        borrowerName
        productName
        termMonths
        approvedPrincipal
        approvedRate
        createdAt
        updatedAt
        disbursedAt
        outstandingBalance
      }
      total
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
      disbursedAt
      outstandingBalance
    }
  }
`

export const CREATE_LOAN = gql`
  mutation CreateLoan($input: LoanInput!) {
    createLoan(input: $input) {
      loan {
        id
      }
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

export const APPROVE_LOAN = gql`
  mutation ApproveLoan($id: ID!, $approvedPrincipal: Float, $approvedRate: Float) {
    approveLoan(id: $id, approvedPrincipal: $approvedPrincipal, approvedRate: $approvedRate) {
      success
      message
    }
  }
`

export const DISBURSE_LOAN = gql`
  mutation DisburseLoan($loanId: ID!, $amount: Float) {
    disburseLoan(loanId: $loanId, amount: $amount) {
      success
      message
    }
  }
`

export const GET_LOAN_TRANSACTIONS = gql`
  query GetLoanTransactions($loanId: ID!) {
    loanTransactions(loanId: $loanId) {
      id
      loanId
      amount
      transactionType
      description
      status
      reference
      createdAt
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

export const GET_LOAN_PRODUCTS = gql`
  query GetLoanProducts {
    loanProducts {
      id
      name
      productCode
      description
      interestRate
      termMonths
      minLoanAmount
      maxLoanAmount
    }
  }
`

// ── Savings ──────────────────────────────────────────────────────────────────
export const GET_SAVINGS = gql`
  query GetSavings($skip: Int, $limit: Int, $customerId: String, $searchTerm: String) {
    savingsAccounts(skip: $skip, limit: $limit, customerId: $customerId, searchTerm: $searchTerm) {
      accounts {
        id
        accountNumber
        balance
        customerId
        type
        status
        openedAt
      }
      total
    }
  }
`

export const GET_SAVING = gql`
  query GetSaving($id: ID!) {
    savingsAccount(id: $id) {
      id
      accountNumber
      balance
      customerId
      type
      status
      openedAt
    }
  }
`

export const CREATE_SAVINGS = gql`
  mutation CreateSavings($input: SavingsInput!) {
    createSavings(input: $input) {
      account {
        id
        accountNumber
      }
      success
      message
    }
  }
`

export const GET_SAVINGS_TRANSACTIONS = gql`
  query GetSavingsTransactions($accountId: ID!) {
    savingsTransactions(accountId: $accountId) {
      id
      accountId
      amount
      transactionType
      notes
      timestamp
    }
  }
`

export const DEPOSIT = gql`
  mutation Deposit($input: SavingsTransactionInput!) {
    deposit(input: $input) {
      transaction {
        id
        amount
      }
      success
      message
    }
  }
`

export const WITHDRAW = gql`
  mutation Withdraw($input: SavingsTransactionInput!) {
    withdraw(input: $input) {
      transaction {
        id
        amount
      }
      success
      message
    }
  }
`

// ── Accounting ──────────────────────────────────────────────────────────────
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

export const GET_JOURNAL_ENTRIES = gql`
  query GetJournalEntries($limit: Int, $offset: Int) {
    journalEntries(limit: $limit, offset: $offset) {
      id
      date
      description
      reference
      debit
      credit
      createdAt
    }
  }
`

export const GET_JOURNAL_ENTRY_BY_REF = gql`
  query GetJournalEntryByRef($reference: String!) {
    journalEntryByReference(reference: $reference) {
      id
      date
      description
      reference
      debit
      credit
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

// ── Collections ─────────────────────────────────────────────────────────────
export const GET_COLLECTIONS_DASHBOARD = gql`
  query GetCollectionsDashboard {
    collectionsDashboard {
      totalLoans
      totalOutstanding
      totalCollections
      pendingCollections
      overdueCollections
      collectedThisMonth
      buckets {
        label
        loanCount
        totalOutstanding
      }
    }
  }
`

export const GET_COLLECTIONS = gql`
  query GetCollections($limit: Int, $offset: Int) {
    collections(limit: $limit, offset: $offset) {
      id
      customerId
      amount
      status
      dueDate
      createdAt
    }
  }
`

export const GET_COLLECTIONS_DUE = gql`
  query GetCollectionsDue($days: Int!) {
    collectionsDue(days: $days) {
      id
      customerId
      amount
      status
      dueDate
      createdAt
    }
  }
`

// ── Compliance / Audit ──────────────────────────────────────────────────────
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

export const GET_FINANCIAL_METRICS = gql`
  query GetFinancialMetrics {
    parMetrics {
      totalOutstanding
      totalNPL
      nplRatio
    }
    nplMetrics {
      totalOutstanding
      totalNPL
      nplRatio
    }
    llrMetrics {
      totalLLR
      llrRatio
    }
  }
`

export const GET_FINANCIAL_STATEMENTS = gql`
  query GetFinancialStatements($year: Int!, $month: Int!) {
    incomeStatement(year: $year, month: $month) {
      revenue
      expenses
      profit
    }
    balanceSheet(year: $year, month: $month) {
      assets
      liabilities
      equity
    }
  }
`

// ── Loan Collateral ─────────────────────────────────────────────────────────
export const GET_LOAN_COLLATERAL = gql`
  query GetLoanCollateral($loanId: ID!) {
    loanCollateral(loanId: $loanId) {
      id
      loanId
      collateralType
      description
      value
      createdAt
    }
  }
`

export const ADD_COLLATERAL = gql`
  mutation AddCollateral($loanId: ID!, $collateralType: String!, $description: String!, $value: Float!) {
    addCollateral(input: { loanId: $loanId, collateralType: $collateralType, description: $description, value: $value }) {
      id
      loanId
      collateralType
      description
      value
      createdAt
    }
  }
`

export const REMOVE_COLLATERAL = gql`
  mutation RemoveCollateral($id: ID!) {
    removeCollateral(input: { id: $id }) {
      success
    }
  }
`

// ── Loan Guarantors ─────────────────────────────────────────────────────────
export const GET_LOAN_GUARANTORS = gql`
  query GetLoanGuarantors($loanId: ID!) {
    loanGuarantors(loanId: $loanId) {
      id
      loanId
      guarantorName
      relationship
      contactInfo
      createdAt
    }
  }
`

export const ADD_GUARANTOR = gql`
  mutation AddGuarantor($loanId: ID!, $guarantorName: String!, $relationship: String!, $contactInfo: String!) {
    addGuarantor(input: { loanId: $loanId, guarantorName: $guarantorName, relationship: $relationship, contactInfo: $contactInfo }) {
      id
      loanId
      guarantorName
      relationship
      contactInfo
      createdAt
    }
  }
`

export const REMOVE_GUARANTOR = gql`
  mutation RemoveGuarantor($id: ID!) {
    removeGuarantor(input: { id: $id }) {
      success
    }
  }
`

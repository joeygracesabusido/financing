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

// ── Users ───────────────────────────────────────────────────────────────────
export const GET_USERS = gql`
  query GetUsers($skip: Int, $limit: Int, $searchTerm: String) {
    users(skip: $skip, limit: $limit, searchTerm: $searchTerm) {
      users {
        id
        username
        email
        role
        isActive
        createdAt
      }
      total
    }
  }
`

export const CREATE_USER = gql`
  mutation CreateUser($input: UserInput!) {
    createUser(input: $input) {
      id
      username
      email
      role
      success
      message
    }
  }
`

export const UPDATE_USER = gql`
  mutation UpdateUser($input: UserInput!) {
    updateUser(input: $input) {
      id
      username
      email
      role
      isActive
      success
      message
    }
  }
`

export const DELETE_USER = gql`
  mutation DeleteUser($id: ID!) {
    deleteUser(id: $id) {
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

// ── Loan Workflow ───────────────────────────────────────────────────────────
export const SUBMIT_LOAN = gql`
  mutation SubmitLoan($loanId: ID!, $documents: [String!]) {
    submitLoan(input: { loanId: $loanId, documents: $documents }) {
      id
      loanId
      status
      submittedAt
      createdAt
    }
  }
`

export const REVIEW_LOAN = gql`
  mutation ReviewLoan($loanId: ID!, $reviewNotes: String!) {
    reviewLoan(input: { loanId: $loanId, reviewNotes: $reviewNotes }) {
      id
      loanId
      status
      reviewedAt
      reviewedBy
      createdAt
    }
  }
`

export const APPROVE_LOAN = gql`
  mutation ApproveLoan($loanId: ID!) {
    approveLoan(input: { loanId: $loanId }) {
      id
      loanId
      status
      approvedAt
      approvedBy
      createdAt
    }
  }
`

export const REJECT_LOAN = gql`
  mutation RejectLoan($loanId: ID!, $reason: String!) {
    rejectLoan(input: { loanId: $loanId, reason: $reason }) {
      id
      loanId
      status
      rejectedAt
      rejectedBy
      rejectionReason
      createdAt
    }
  }
`

export const WRITE_OFF_LOAN = gql`
  mutation WriteOffLoan($loanId: ID!) {
    writeOffLoan(input: { loanId: $loanId }) {
      id
      loanId
      status
      writtenOffAt
      writtenOffBy
      createdAt
    }
  }
`

export const REPAY_LOAN = gql`
  mutation RepayLoan($loanId: ID!, $amount: Float!, $repaymentDate: Date!) {
    repayLoan(input: { loanId: $loanId, amount: $amount, repaymentDate: $repaymentDate }) {
      id
      loanId
      amount
      repaymentDate
      status
      createdAt
    }
  }
`

// ── Loan Disbursements ──────────────────────────────────────────────────────
export const DISBURSE_LOAN = gql`
  mutation DisburseLoan($loanId: ID!, $amount: Float!, $disbursementDate: Date!) {
    disburseLoan(input: { loanId: $loanId, amount: $amount, disbursementDate: $disbursementDate }) {
      id
      loanId
      amount
      disbursementDate
      status
      createdAt
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

// ── Loan Products ───────────────────────────────────────────────────────────
export const CREATE_LOAN_PRODUCT = gql`
  mutation CreateLoanProduct($input: LoanProductInput!) {
    createLoanProduct(input: $input) {
      id
      name
      productCode
      description
      interestRate
      termMonths
      minLoanAmount
      maxLoanAmount
      success
      message
    }
  }
`

export const UPDATE_LOAN_PRODUCT = gql`
  mutation UpdateLoanProduct($input: LoanProductInput!) {
    updateLoanProduct(input: $input) {
      id
      name
      productCode
      description
      interestRate
      termMonths
      minLoanAmount
      maxLoanAmount
      success
      message
    }
  }
`

export const DELETE_LOAN_PRODUCT = gql`
  mutation DeleteLoanProduct($id: ID!) {
    deleteLoanProduct(id: $id) {
      success
      message
    }
  }
`

// ── Savings ──────────────────────────────────────────────────────────────────
export const GET_SAVINGS = gql`
  query GetSavingsAccounts($skip: Int, $limit: Int, $customerId: String, $searchTerm: String) {
    savingsAccounts(skip: $skip, limit: $limit, customerId: $customerId, searchTerm: $searchTerm) {
      accounts {
        id
        accountNumber
        balance
        customerId
        accountType
        status
        openedAt
      }
      total
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
      accountType
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
  query GetSavingsAccountsTransactions($accountId: ID!) {
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
      accountType
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

export const GET_JOURNAL_ENTRY_BY_REFERENCE = gql`
  query GetJournalEntryByReference($reference: String!) {
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
      accountType
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

// ── Loan Schedule Preview ───────────────────────────────────────────────────
export const PREVIEW_LOAN_SCHEDULE = gql`
  query PreviewLoanSchedule($loanId: ID!) {
    loanSchedule(loanId: $loanId) {
      id
      loanId
      startDate
      endDate
      scheduleType
      paymentDays
      monthlyPayment
      totalInterest
      totalPayment
      createdAt
    }
  }
`

// ── Amortization Updates ────────────────────────────────────────────────────
export const UPDATE_AMORTIZATION_PAYMENT_DATE = gql`
  mutation UpdateAmortizationPaymentDate($paymentId: ID!, $newDate: Date!) {
    updateAmortizationPaymentDate(input: { paymentId: $paymentId, newDate: $newDate }) {
      id
      paymentNumber
      dueDate
      newDueDate
      amount
      status
      updatedAt
    }
  }
`

export const UPDATE_AMORTIZATION_ROW = gql`
  mutation UpdateAmortizationRow($loanId: ID!, $paymentNumber: Int!, $amount: Float!, $interest: Float!, $principal: Float!) {
    updateAmortizationRow(input: { loanId: $loanId, paymentNumber: $paymentNumber, amount: $amount, interest: $interest, principal: $principal }) {
      id
      loanId
      paymentNumber
      amount
      interest
      principal
      dueDate
      status
      updatedAt
    }
  }
`

// ── KYC and Beneficiaries ───────────────────────────────────────────────────
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

// ── GL Account Management ───────────────────────────────────────────────────
export const CREATE_GL_ACCOUNT = gql`
  mutation CreateGLAccount($input: GLAccountInput!) {
    createGLAccount(input: $input) {
      id
      accountNumber
      name
      accountType
      balance
      createdAt
      success
      message
    }
  }
`

export const UPDATE_GL_ACCOUNT = gql`
  mutation UpdateGLAccount($input: GLAccountInput!) {
    updateGLAccount(input: $input) {
      id
      accountNumber
      name
      accountType
      balance
      success
      message
    }
  }
`

export const DELETE_GL_ACCOUNT = gql`
  mutation DeleteGLAccount($id: ID!) {
    deleteGLAccount(id: $id) {
      success
      message
    }
  }
`

// ── Journal Entry Management ─────────────────────────────────────────────────
export const CREATE_MANUAL_JOURNAL_ENTRY = gql`
  mutation CreateManualJournalEntry($input: ManualJournalEntryInput!) {
    createManualJournalEntry(input: $input) {
      id
      date
      description
      reference
      debit
      credit
      createdAt
      success
      message
    }
  }
`

// ── Customer Dashboard ──────────────────────────────────────────────────────
export const GET_CUSTOMER_LOANS = gql`
  query GetCustomerLoans {
    loans {
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

export const GET_CUSTOMER_SAVINGS = gql`
  query GetCustomerSavings {
    savingsAccounts {
      accounts {
        id
        accountNumber
        balance
        customerId
        accountType
        status
        openedAt
      }
      total
    }
  }
`

// ── Fund Transfers ──────────────────────────────────────────────────────────
export const CREATE_FUND_TRANSFER = gql`
  mutation CreateFundTransfer($input: FundTransferInput!) {
    createFundTransfer(input: $input) {
      id
      fromAccount
      toAccount
      amount
      description
      status
      reference
      createdAt
      success
      message
    }
  }
`

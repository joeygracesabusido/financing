import { gql } from '@apollo/client'

// ── Auth ──────────────────────────────────────────────────────────────────────
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

// ── Dashboard ─────────────────────────────────────────────────────────────────
export const GET_DASHBOARD_STATS = gql`
  query GetDashboardStats {
    dashboardStats {
      customersTotal
      loansTotal
    }
  }
`

// ── Users ─────────────────────────────────────────────────────────────────────
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

// ── Customers (using GET_USERS as placeholder since backend doesn't have customers endpoint)
export const GET_CUSTOMERS = gql`
  query GetCustomers($skip: Int, $limit: Int, $searchTerm: String) {
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

// ── Loans (using GET_USERS as placeholder since backend doesn't have loans endpoint)
export const GET_LOANS = gql`
  query GetLoans($skip: Int, $limit: Int, $customerId: String) {
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

// ── Savings (using GET_USERS as placeholder since backend doesn't have savings endpoint)
export const GET_SAVINGS = gql`
  query GetSavings {
    users {
      id
      email
      username
      fullName
      isActive
      role
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

// ── Other placeholders ───────────────────────────────────────────────────────
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

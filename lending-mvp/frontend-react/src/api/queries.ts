import { gql } from '@apollo/client'

// ── Auth ──────────────────────────────────────────────────────────────────────
export const LOGIN_MUTATION = gql`
  mutation Login($username: String!, $password: String!) {
    login(input: { username: $username, password: $password }) {
      accessToken
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

// ── Customers ────────────────────────────────────────────────────────────────
export const GET_CUSTOMERS = gql`
  query GetCustomers {
    customers {
      id
      firstName
      lastName
      emailAddress
      contactNumber
      address
      createdAt
    }
  }
`

export const GET_CUSTOMER = gql`
  query GetCustomer($id: String!) {
    customer(id: $id) {
      id
      firstName
      lastName
      emailAddress
      contactNumber
      address
      createdAt
    }
  }
`

export const CREATE_CUSTOMER = gql`
  mutation CreateCustomer($input: CustomerInput!) {
    createCustomer(input: $input) {
      id
      firstName
      lastName
      emailAddress
    }
  }
`

export const UPDATE_CUSTOMER = gql`
  mutation UpdateCustomer($id: String!, $input: CustomerInput!) {
    updateCustomer(id: $id, input: $input) {
      id
      firstName
      lastName
      emailAddress
    }
  }
`

export const DELETE_CUSTOMER = gql`
  mutation DeleteCustomer($id: String!) {
    deleteCustomer(id: $id)
  }
`

// ── Savings ───────────────────────────────────────────────────────────────────
export const GET_SAVINGS = gql`
  query GetSavingsAccounts {
    savingsAccounts {
      id
      accountNumber
      accountType
      balance
      userId
      customerName
      createdAt
    }
  }
`

export const GET_SAVINGS_ACCOUNT = gql`
  query GetSavingsAccount($id: String!) {
    savingsAccount(id: $id) {
      id
      accountNumber
      accountType
      balance
      userId
      customerName
      createdAt
      transactions {
        id
        transactionType
        amount
        balanceAfter
        description
        createdAt
      }
    }
  }
`

export const CREATE_SAVINGS = gql`
  mutation CreateSavingsAccount($input: SavingsAccountInput!) {
    createSavingsAccount(input: $input) {
      id
      accountNumber
      accountType
      balance
    }
  }
`

// ── Transactions ──────────────────────────────────────────────────────────────
export const DEPOSIT = gql`
  mutation Deposit($input: TransactionInput!) {
    deposit(input: $input) {
      id
      transactionType
      amount
      balanceAfter
      description
      createdAt
    }
  }
`

export const WITHDRAW = gql`
  mutation Withdraw($input: TransactionInput!) {
    withdraw(input: $input) {
      id
      transactionType
      amount
      balanceAfter
      description
      createdAt
    }
  }
`

// ── Loans ─────────────────────────────────────────────────────────────────────
export const GET_LOANS = gql`
  query GetLoans {
    loans {
      id
      loanNumber
      loanType
      principalAmount
      outstandingBalance
      interestRate
      status
      customerId
      customerName
      startDate
      maturityDate
      createdAt
    }
  }
`

export const GET_LOAN = gql`
  query GetLoan($id: String!) {
    loan(id: $id) {
      id
      loanNumber
      loanType
      principalAmount
      outstandingBalance
      interestRate
      status
      customerId
      customerName
      startDate
      maturityDate
      createdAt
    }
  }
`

export const GET_LOAN_PRODUCTS = gql`
  query GetLoanProducts {
    loanProducts {
      id
      name
      interestRate
      minAmount
      maxAmount
      minTerm
      maxTerm
      description
    }
  }
`

export const GET_LOAN_TRANSACTIONS = gql`
  query GetLoanTransactions($loanId: String!) {
    loanTransactions(loanId: $loanId) {
      id
      transactionType
      amount
      balanceAfter
      description
      createdAt
    }
  }
`

// ── Dashboard Stats (derived from existing queries) ───────────────────────────
export const GET_DASHBOARD_STATS = gql`
  query GetDashboardStats {
    customers { id }
    savingsAccounts { id balance }
    loans { id status outstandingBalance }
  }
`

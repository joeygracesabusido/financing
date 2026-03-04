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

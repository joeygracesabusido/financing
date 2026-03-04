import { API_URL } from '@/lib/config'

export const getLoans = async (customerId?: string) => {
  const query = customerId
    ? `query GetLoans($customerId: String!) { loans(customerId: $customerId) { loans { id principal status customerId productId borrowerName productName termMonths approvedPrincipal approvedRate createdAt updatedAt disbursedAt outstandingBalance } } }`
    : `query GetLoans { loans { loans { id principal status customerId productId borrowerName productName termMonths approvedPrincipal approvedRate createdAt updatedAt disbursedAt outstandingBalance } } }`
  
  const response = await fetch(`${API_URL}/graphql`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables: customerId ? { customerId } : undefined }),
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.errors?.[0]?.message || 'Failed to fetch loans')
  }
  return response.json()
}

export const getLoan = async (loanId: string) => {
  const response = await fetch(`${API_URL}/graphql`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: `query GetLoan($id: ID!) { loan(id: $id) { id customerId productId principal termMonths approvedPrincipal approvedRate status createdAt updatedAt disbursedAt } }`,
      variables: { id: loanId }
    }),
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.errors?.[0]?.message || 'Failed to fetch loan')
  }
  return response.json()
}

export const submitLoan = async (loanId: string, documents: string[]) => {
  const response = await fetch(`${API_URL}/graphql`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: `mutation SubmitLoan($loanId: ID!, $documents: [String!]) { submitLoan(input: { loanId: $loanId, documents: $documents }) { success message } }`,
      variables: { loanId, documents }
    }),
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.errors?.[0]?.message || 'Failed to submit loan')
  }
  return response.json()
}

export const approveLoan = async (loanId: string, approvedPrincipal?: number, approvedRate?: number) => {
  const response = await fetch(`${API_URL}/graphql`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: `mutation ApproveLoan($loanId: ID!, $approvedPrincipal: Decimal, $approvedRate: Decimal) { approveLoan(input: { loanId: $loanId, approvedPrincipal: $approvedPrincipal, approvedRate: $approvedRate }) { success message } }`,
      variables: { loanId, approvedPrincipal, approvedRate }
    }),
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.errors?.[0]?.message || 'Failed to approve loan')
  }
  return response.json()
}

export const rejectLoan = async (loanId: string, reason: string) => {
  const response = await fetch(`${API_URL}/graphql`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: `mutation RejectLoan($loanId: ID!, $reason: String!) { rejectLoan(input: { loanId: $loanId, reason: $reason }) { success message } }`,
      variables: { loanId, reason }
    }),
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.errors?.[0]?.message || 'Failed to reject loan')
  }
  return response.json()
}
  return response.json()
}

export const submitLoan = async (loanId: string, documents: string[]) => {
  const response = await fetch(`${API_URL}/graphql`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: `mutation SubmitLoan($loanId: ID!, $documents: [String!]) { submitLoan(input: { loanId: $loanId, documents: $documents }) { id loanId status submittedAt createdAt } }`,
      variables: { loanId, documents }
    }),
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.errors?.[0]?.message || 'Failed to submit loan')
  }
  return response.json()
}

export const approveLoan = async (loanId: string) => {
  const response = await fetch(`${API_URL}/graphql`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: `mutation ApproveLoan($loanId: ID!) { approveLoan(input: { loanId: $loanId }) { id loanId status approvedAt approvedBy createdAt } }`,
      variables: { loanId }
    }),
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.errors?.[0]?.message || 'Failed to approve loan')
  }
  return response.json()
}

export const rejectLoan = async (loanId: string, reason: string) => {
  const response = await fetch(`${API_URL}/graphql`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: `mutation RejectLoan($loanId: ID!, $reason: String!) { rejectLoan(input: { loanId: $loanId, reason: $reason }) { id loanId status rejectedAt rejectedBy rejectionReason createdAt } }`,
      variables: { loanId, reason }
    }),
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.errors?.[0]?.message || 'Failed to reject loan')
  }
  return response.json()
}

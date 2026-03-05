import { API_URL } from '@/lib/config'

const getHeaders = () => {
  const token = localStorage.getItem('access_token')
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : ''
  }
}

export const getLoans = async (customerId?: string) => {
  const query = customerId
    ? `query GetLoans($customerId: String!) { loans(customerId: $customerId) { loans { id principal status customerId productId borrowerName productName termMonths approvedPrincipal approvedRate createdAt updatedAt disbursedAt outstandingBalance } } }`
    : `query GetLoans { loans { loans { id principal status customerId productId borrowerName productName termMonths approvedPrincipal approvedRate createdAt updatedAt disbursedAt outstandingBalance } } }`
  
  const response = await fetch(`${API_URL}/graphql`, {
    method: 'POST',
    headers: getHeaders(),
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
    headers: getHeaders(),
    body: JSON.stringify({
      query: `query GetLoan($id: ID!) { loan(id: $id) { id customerId productId principal termMonths approvedPrincipal approvedRate status createdAt updatedAt disbursedAt outstandingBalance borrowerName productName } }`,
      variables: { id: loanId }
    }),
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.errors?.[0]?.message || 'Failed to fetch loan')
  }
  return response.json()
}

export const submitLoan = async (loanId: string) => {
  const response = await fetch(`${API_URL}/graphql`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({
      query: `mutation SubmitLoan($id: ID!) { submitLoan(id: $id) { success message } }`,
      variables: { id: loanId }
    }),
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.errors?.[0]?.message || 'Failed to submit loan')
  }
  return response.json()
}

export const reviewLoan = async (loanId: string) => {
  const response = await fetch(`${API_URL}/graphql`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({
      query: `mutation ReviewLoan($id: ID!) { reviewLoan(id: $id) { success message } }`,
      variables: { id: loanId }
    }),
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.errors?.[0]?.message || 'Failed to review loan')
  }
  return response.json()
}

export const approveLoan = async (loanId: string, approvedPrincipal?: number, approvedRate?: number) => {
  const response = await fetch(`${API_URL}/graphql`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({
      query: `mutation ApproveLoan($id: ID!, $approvedPrincipal: Decimal, $approvedRate: Decimal) { approveLoan(id: $id, approvedPrincipal: $approvedPrincipal, approvedRate: $approvedRate) { success message } }`,
      variables: { id: loanId, approvedPrincipal, approvedRate }
    }),
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.errors?.[0]?.message || 'Failed to approve loan')
  }
  return response.json()
}

export const disburseLoan = async (loanId: string, disbursementMethod: string = "cash") => {
  const response = await fetch(`${API_URL}/graphql`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({
      query: `mutation DisburseLoan($id: ID!, $disbursementMethod: String) { disburseLoan(id: $id, disbursementMethod: $disbursementMethod) { success message } }`,
      variables: { id: loanId, disbursementMethod }
    }),
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.errors?.[0]?.message || 'Failed to disburse loan')
  }
  return response.json()
}

export const repayLoan = async (loanId: string, amount: number, paymentMethod: string = "cash", notes?: string) => {
  const response = await fetch(`${API_URL}/graphql`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({
      query: `mutation RepayLoan($id: ID!, $amount: Decimal!, $paymentMethod: String, $notes: String) { repayLoan(id: $id, amount: $amount, paymentMethod: $paymentMethod, notes: $notes) { success message } }`,
      variables: { id: loanId, amount, paymentMethod, notes }
    }),
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.errors?.[0]?.message || 'Failed to record repayment')
  }
  return response.json()
}

export const rejectLoan = async (loanId: string, reason: string) => {
  const response = await fetch(`${API_URL}/graphql`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({
      query: `mutation RejectLoan($id: ID!, $reason: String!) { rejectLoan(id: $id, reason: $reason) { success message } }`,
      variables: { id: loanId, reason }
    }),
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.errors?.[0]?.message || 'Failed to reject loan')
  }
  return response.json()
}

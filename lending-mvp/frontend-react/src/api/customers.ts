import { API_URL } from '@/lib/config'

export const getCustomers = async (customerId?: string) => {
  const url = `${API_URL}/graphql`
  const query = customerId 
    ? `query GetCustomer($id: ID!) { customer(id: $id) { id displayName firstName lastName emailAddress mobileNumber customerType branch } }`
    : `query GetCustomers { customers { customers { id displayName customerType branchCode isActive emailAddress mobileNumber customerCategory } } }`
  
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables: customerId ? { id: customerId } : undefined }),
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.errors?.[0]?.message || 'Failed to fetch customers')
  }
  return response.json()
}

export const getCustomer = async (customerId: string) => {
  const response = await fetch(`${API_URL}/graphql`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: `query GetCustomer($id: ID!) { customer(id: $id) { id displayName firstName lastName emailAddress mobileNumber customerType customerCategory kycStatus riskScore branch createdAt } }`,
      variables: { id: customerId }
    }),
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.errors?.[0]?.message || 'Failed to fetch customer')
  }
  return response.json()
}

export const createCustomer = async (input: any) => {
  const response = await fetch(`${API_URL}/graphql`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: `mutation CreateCustomer($input: CustomerInput!) { createCustomer(input: $input) { success message customer { id displayName } } }`,
      variables: { input }
    }),
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.errors?.[0]?.message || 'Failed to create customer')
  }
  return response.json()
}

export const updateCustomer = async (customerId: string, input: any) => {
  const response = await fetch(`${API_URL}/graphql`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: `mutation UpdateCustomer($input: CustomerInput!) { updateCustomer(input: $input) { success message } }`,
      variables: { input }
    }),
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.errors?.[0]?.message || 'Failed to update customer')
  }
  return response.json()
}

export const deleteCustomer = async (customerId: string) => {
  const response = await fetch(`${API_URL}/graphql`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: `mutation DeleteCustomer($id: ID!) { deleteCustomer(id: $id) { success message } }`,
      variables: { id: customerId }
    }),
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.errors?.[0]?.message || 'Failed to delete customer')
  }
  return response.json()
}

export const getCustomerLoans = async () => {
  const response = await fetch(`${API_URL}/graphql`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: `query GetCustomerLoans { loans { id productName principal outstandingBalance status } }`,
    }),
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.errors?.[0]?.message || 'Failed to fetch loans')
  }
  return response.json()
}

export const getCustomerSavings = async () => {
  const response = await fetch(`${API_URL}/graphql`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: `query GetCustomerSavings { savingsAccounts { accounts { id accountNumber balance openedAt status } } }`,
    }),
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.errors?.[0]?.message || 'Failed to fetch savings')
  }
  return response.json()
}

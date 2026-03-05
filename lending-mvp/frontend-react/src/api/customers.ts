import { API_URL } from '@/lib/config'

const getHeaders = () => {
  const token = localStorage.getItem('access_token')
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : ''
  }
}

export const getCustomers = async (customerId?: string) => {
  const url = `${API_URL}/graphql`
  const query = customerId 
    ? `query GetCustomer($id: ID!) { customer(id: $id) { id displayName firstName lastName emailAddress mobileNumber customerType branch } }`
    : `query GetCustomers { customers { customers { id displayName customerType branchCode isActive emailAddress mobileNumber customerCategory } } }`
  
  const response = await fetch(url, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ query, variables: customerId ? { id: customerId } : undefined }),
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.errors?.[0]?.message || 'Failed to fetch customers')
  }
  const result = await response.json()
  return result.data
}

export const getCustomer = async (customerId: string) => {
  const response = await fetch(`${API_URL}/graphql`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({
      query: `query GetCustomer($id: ID!) { customer(id: $id) { id displayName firstName lastName emailAddress mobileNumber customerType customerCategory kycStatus riskScore branch createdAt } }`,
      variables: { id: customerId }
    }),
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.errors?.[0]?.message || 'Failed to fetch customer')
  }
  const result = await response.json()
  return result.data
}

export const createCustomer = async (input: any) => {
  const response = await fetch(`${API_URL}/graphql`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({
      query: `mutation CreateCustomer($input: CustomerInput!) { createCustomer(input: $input) { success message customer { id displayName } } }`,
      variables: { input }
    }),
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.errors?.[0]?.message || 'Failed to create customer')
  }
  const result = await response.json()
  return result.data
}

export const updateCustomer = async (customerId: string, input: any) => {
  const response = await fetch(`${API_URL}/graphql`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({
      query: `mutation UpdateCustomer($id: ID!, $input: CustomerInput!) { updateCustomer(id: $id, input: $input) { success message } }`,
      variables: { id: customerId, input }
    }),
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.errors?.[0]?.message || 'Failed to update customer')
  }
  const result = await response.json()
  return result.data
}

export const deleteCustomer = async (customerId: string) => {
  const response = await fetch(`${API_URL}/graphql`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({
      query: `mutation DeleteCustomer($id: ID!) { deleteCustomer(id: $id) { success message } }`,
      variables: { id: customerId }
    }),
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.errors?.[0]?.message || 'Failed to delete customer')
  }
  const result = await response.json()
  return result.data
}

export const getCustomerLoans = async () => {
  const response = await fetch(`${API_URL}/graphql`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({
      query: `query GetCustomerLoans { loans { id productName principal outstandingBalance status } }`,
    }),
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.errors?.[0]?.message || 'Failed to fetch loans')
  }
  const result = await response.json()
  return result.data
}

export const getCustomerSavings = async () => {
  const response = await fetch(`${API_URL}/graphql`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({
      query: `query GetCustomerSavings { savingsAccounts { accounts { id accountNumber balance openedAt status } } }`,
    }),
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.errors?.[0]?.message || 'Failed to fetch savings')
  }
  const result = await response.json()
  return result.data
}

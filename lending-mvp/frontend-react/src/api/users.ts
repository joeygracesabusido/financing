import { API_URL } from '@/lib/config'

const getHeaders = () => {
  const token = localStorage.getItem('access_token')
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : ''
  }
}

export const getUsers = async () => {
  const response = await fetch(`${API_URL}/graphql`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({
      query: `query GetUsers { users { id username email fullName role isActive branchCode branchId } }`
    }),
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.errors?.[0]?.message || 'Failed to fetch users')
  }
  const result = await response.json()
  return result.data
}

export const createUser = async (input: any) => {
  const response = await fetch(`${API_URL}/graphql`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({
      query: `mutation CreateUser($input: UserCreateInput!) { createUser(input: $input) { success message user { id username } } }`,
      variables: { input }
    }),
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.errors?.[0]?.message || 'Failed to create user')
  }
  const result = await response.json()
  return result.data
}

export const updateUser = async (userId: string, input: any) => {
  const response = await fetch(`${API_URL}/graphql`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({
      query: `mutation UpdateUser($id: ID!, $input: UserUpdateInput!) { updateUser(id: $id, input: $input) { success message } }`,
      variables: { id: userId, input }
    }),
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.errors?.[0]?.message || 'Failed to update user')
  }
  const result = await response.json()
  return result.data
}

export const deleteUser = async (userId: string) => {
  const response = await fetch(`${API_URL}/graphql`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({
      query: `mutation DeleteUser($id: ID!) { deleteUser(id: $id) { success message } }`,
      variables: { id: userId }
    }),
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.errors?.[0]?.message || 'Failed to delete user')
  }
  const result = await response.json()
  return result.data
}

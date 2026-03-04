import { API_URL } from '@/lib/config'

export const getUsers = async () => {
  const response = await fetch(`${API_URL}/graphql`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: `query GetUsers { users { id username email fullName role isActive } }`
    }),
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.errors?.[0]?.message || 'Failed to fetch users')
  }
  return response.json()
}

export const createUser = async (input: any) => {
  const response = await fetch(`${API_URL}/graphql`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: `mutation CreateUser($input: UserInput!) { createUser(input: $input) { success message user { id username } } }`,
      variables: { input }
    }),
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.errors?.[0]?.message || 'Failed to create user')
  }
  return response.json()
}

export const updateUser = async (input: any) => {
  const response = await fetch(`${API_URL}/graphql`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: `mutation UpdateUser($input: UserInput!) { updateUser(input: $input) { success message } }`,
      variables: { input }
    }),
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.errors?.[0]?.message || 'Failed to update user')
  }
  return response.json()
}

export const deleteUser = async (userId: string) => {
  const response = await fetch(`${API_URL}/graphql`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: `mutation DeleteUser($id: ID!) { deleteUser(id: $id) { success message } }`,
      variables: { id: userId }
    }),
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.errors?.[0]?.message || 'Failed to delete user')
  }
  return response.json()
}

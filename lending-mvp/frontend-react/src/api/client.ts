// Simple REST API client using fetch
// No Apollo Client - using fetch directly for REST API

const API_URL = '/api'

// ── Auth ──────────────────────────────────────────────────────────────────────
export const login = async (username: string, password: string, totpCode?: string) => {
  const url = `${API_URL}/login/`
  const body = totpCode ? { username, password, totpCode } : { username, password }
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || 'Login failed')
  }
  return response.json()
}

export const logout = () => {
  localStorage.removeItem('access_token')
  localStorage.removeItem('user')
  localStorage.removeItem('refresh_token')
  window.location.href = '/login'
}

// ── Users ─────────────────────────────────────────────────────────────────────
export const getUsers = async (skip: number = 0, limit: number = 100) => {
  const url = `${API_URL}/users?skip=${skip}&limit=${limit}`
  const response = await fetch(url)
  return response.json()
}

export const createUser = async (input: any) => {
  const url = `${API_URL}/users`
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  return response.json()
}

export const updateUser = async (userId: string, input: any) => {
  const url = `${API_URL}/users/${userId}`
  const response = await fetch(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  return response.json()
}

export const deleteUser = async (userId: string) => {
  const url = `${API_URL}/users/${userId}`
  const response = await fetch(url, { method: 'DELETE' })
  return response.json()
}

// ── Health ────────────────────────────────────────────────────────────────────
export const getHealth = async () => {
  const url = `${API_URL}/health`
  const response = await fetch(url)
  return response.json()
}

export default {
  login,
  logout,
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  getHealth,
}

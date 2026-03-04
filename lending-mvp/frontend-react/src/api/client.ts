// Simple REST API client using fetch

const API_URL = '/graphql'

// ── Auth ──────────────────────────────────────────────────────────────────────
export const login = async (username: string, password: string, totpCode?: string) => {
  const url = `${API_URL}`
  const body = totpCode ? { username, password, totpCode } : { username, password }
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.errors?.[0]?.message || 'Login failed')
  }
  return response.json()
}

export const logout = () => {
  localStorage.removeItem('access_token')
  localStorage.removeItem('user')
  localStorage.removeItem('refresh_token')
  window.location.href = '/login'
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
export const getDashboardStats = async () => {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: `{ dashboardStats { customersTotal loansTotal } }`
    }),
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.errors?.[0]?.message || 'Failed to fetch dashboard stats')
  }
  return response.json()
}

export const getUsers = async (skip: number = 0, limit: number = 100) => {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: `{ users(skip: ${skip}, limit: ${limit}) { id email username fullName isActive role } }`
    }),
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.errors?.[0]?.message || 'Failed to fetch users')
  }
  return response.json()
}

export default {
  login,
  logout,
  getDashboardStats,
  getUsers,
}

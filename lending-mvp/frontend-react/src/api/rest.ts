import { API_URL } from '@/lib/config'

// ── Auth ──────────────────────────────────────────────────────────────────────
export const login = async (username: string, password: string, totpCode?: string) => {
  const url = `${API_URL}/api-login/`
  const body = totpCode ? { username, password, totpCode } : { username, password }
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return response.json()
}

export const logout = async () => {
  localStorage.removeItem('access_token')
  localStorage.removeItem('user')
  localStorage.removeItem('refresh_token')
  window.location.href = '/login'
}

// ── Users ─────────────────────────────────────────────────────────────────────
export const getUsers = async (skip: number = 0, limit: number = 100) => {
  const url = `${API_URL}/api/users?skip=${skip}&limit=${limit}`
  const response = await fetch(url)
  return response.json()
}

export const createUser = async (input: any) => {
  const url = `${API_URL}/api/users`
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  return response.json()
}

export const updateUser = async (userId: string, input: any) => {
  const url = `${API_URL}/api/users/${userId}`
  const response = await fetch(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  return response.json()
}

export const deleteUser = async (userId: string) => {
  const url = `${API_URL}/api/users/${userId}`
  const response = await fetch(url, { method: 'DELETE' })
  return response.json()
}

// ── Customers ─────────────────────────────────────────────────────────────────
export const getCustomers = async (skip: number = 0, limit: number = 100, searchTerm?: string) => {
  const url = `${API_URL}/api/customers?skip=${skip}&limit=${limit}${searchTerm ? `&search=${searchTerm}` : ''}`
  const response = await fetch(url)
  return response.json()
}

export const getCustomer = async (customerId: string) => {
  const url = `${API_URL}/api/customers/${customerId}`
  const response = await fetch(url)
  return response.json()
}

export const createCustomer = async (input: any) => {
  const url = `${API_URL}/api/customers`
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  return response.json()
}

export const updateCustomer = async (customerId: string, input: any) => {
  const url = `${API_URL}/api/customers/${customerId}`
  const response = await fetch(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  return response.json()
}

export const deleteCustomer = async (customerId: string) => {
  const url = `${API_URL}/api/customers/${customerId}`
  const response = await fetch(url, { method: 'DELETE' })
  return response.json()
}

// ── KYC Documents ────────────────────────────────────────────────────────────
export const getKycDocuments = async (customerId: string) => {
  const url = `${API_URL}/api/customers/${customerId}/kyc-documents`
  const response = await fetch(url)
  return response.json()
}

export const uploadKycDocument = async (customerId: string, formData: FormData) => {
  const url = `${API_URL}/api/customers/${customerId}/kyc-documents/upload`
  const response = await fetch(url, {
    method: 'POST',
    body: formData,
  })
  return response.json()
}

export const updateKycStatus = async (documentId: number, status: string, rejectionReason?: string) => {
  const url = `${API_URL}/api/kyc-documents/${documentId}/status`
  const body = rejectionReason ? { status, rejectionReason } : { status }
  const response = await fetch(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return response.json()
}

// ── Beneficiaries ────────────────────────────────────────────────────────────
export const getBeneficiaries = async (customerId: string) => {
  const url = `${API_URL}/api/customers/${customerId}/beneficiaries`
  const response = await fetch(url)
  return response.json()
}

export const addBeneficiary = async (customerId: string, input: any) => {
  const url = `${API_URL}/api/customers/${customerId}/beneficiaries`
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  return response.json()
}

export const deleteBeneficiary = async (beneficiaryId: number) => {
  const url = `${API_URL}/api/beneficiaries/${beneficiaryId}`
  const response = await fetch(url, { method: 'DELETE' })
  return response.json()
}

// ── Customer Activities ──────────────────────────────────────────────────────
export const getCustomerActivities = async (customerId: string) => {
  const url = `${API_URL}/api/customers/${customerId}/activities`
  const response = await fetch(url)
  return response.json()
}

// ── Audit Logs ───────────────────────────────────────────────────────────────
export const getAuditLogs = async (skip: number = 0, limit: number = 100, searchTerm?: string) => {
  const url = `${API_URL}/api/audit-logs?skip=${skip}&limit=${limit}${searchTerm ? `&search=${searchTerm}` : ''}`
  const response = await fetch(url)
  return response.json()
}

export const getBranchAuditLogs = async (branchCode: string) => {
  const url = `${API_URL}/api/branches/${branchCode}/audit-logs`
  const response = await fetch(url)
  return response.json()
}

// ── Savings Accounts ─────────────────────────────────────────────────────────
export const getSavingsAccounts = async (searchTerm?: string, customerId?: string) => {
  const url = `${API_URL}/api/savings?${searchTerm ? `search=${searchTerm}&` : ''}${customerId ? `customer=${customerId}` : ''}`
  const response = await fetch(url)
  return response.json()
}

export const getSavingsAccount = async (id: string) => {
  const url = `${API_URL}/api/savings/${id}`
  const response = await fetch(url)
  return response.json()
}

export const createSavingsAccount = async (customerId: string, input: any) => {
  const url = `${API_URL}/api/customers/${customerId}/savings`
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  return response.json()
}

export const updateSavingsAccount = async (id: string, input: any) => {
  const url = `${API_URL}/api/savings/${id}`
  const response = await fetch(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  return response.json()
}

export const deleteSavingsAccount = async (id: string) => {
  const url = `${API_URL}/api/savings/${id}`
  const response = await fetch(url, { method: 'DELETE' })
  return response.json()
}

// ── Transactions ─────────────────────────────────────────────────────────────
export const getTransactions = async (accountId: string) => {
  const url = `${API_URL}/api/savings/${accountId}/transactions`
  const response = await fetch(url)
  return response.json()
}

export const createDeposit = async (accountId: string, amount: number, note?: string) => {
  const url = `${API_URL}/api/savings/${accountId}/transactions/deposit`
  const body = note ? { amount, note } : { amount }
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return response.json()
}

export const createWithdrawal = async (accountId: string, amount: number, note?: string) => {
  const url = `${API_URL}/api/savings/${accountId}/transactions/withdrawal`
  const body = note ? { amount, note } : { amount }
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return response.json()
}

export const createFundTransfer = async (fromAccountId: string, toAccountId: string, amount: number) => {
  const url = `${API_URL}/api/transactions/fund-transfer`
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ from_account_id: fromAccountId, to_account_id: toAccountId, amount }),
  })
  return response.json()
}

// ── Loans ────────────────────────────────────────────────────────────────────
export const getLoans = async (skip: number = 0, limit: number = 100, searchTerm?: string, status?: string) => {
  const params = [`skip=${skip}`, `limit=${limit}`]
  if (searchTerm) params.push(`search=${searchTerm}`)
  if (status) params.push(`status=${status}`)
  const url = `${API_URL}/api/loans?${params.join('&')}`
  const response = await fetch(url)
  return response.json()
}

export const getLoan = async (id: string) => {
  const url = `${API_URL}/api/loans/${id}`
  const response = await fetch(url)
  return response.json()
}

export const createLoan = async (customerId: string, input: any) => {
  const url = `${API_URL}/api/customers/${customerId}/loans`
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  return response.json()
}

export const approveLoan = async (loanId: string) => {
  const url = `${API_URL}/api/loans/${loanId}/approve`
  const response = await fetch(url, { method: 'POST' })
  return response.json()
}

export const disburseLoan = async (loanId: string) => {
  const url = `${API_URL}/api/loans/${loanId}/disburse`
  const response = await fetch(url, { method: 'POST' })
  return response.json()
}

export const rejectLoan = async (loanId: string, reason: string) => {
  const url = `${API_URL}/api/loans/${loanId}/reject`
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reason }),
  })
  return response.json()
}

// ── Branches ─────────────────────────────────────────────────────────────────
export const getBranches = async () => {
  const url = `${API_URL}/api/branches`
  const response = await fetch(url)
  return response.json()
}

export const getBranch = async (code: string) => {
  const url = `${API_URL}/api/branches/${code}`
  const response = await fetch(url)
  return response.json()
}

// ── Compliance ───────────────────────────────────────────────────────────────
export const getAmlAlerts = async (severity?: string) => {
  const url = `${API_URL}/api/compliance/aml-alerts${severity ? `?severity=${severity}` : ''}`
  const response = await fetch(url)
  return response.json()
}

export const getPePRecords = async () => {
  const url = `${API_URL}/api/compliance/pep-records`
  const response = await fetch(url)
  return response.json()
}

// ── Financial Reports ────────────────────────────────────────────────────────
export const getJournalEntries = async (dateFrom?: string, dateTo?: string) => {
  const params = []
  if (dateFrom) params.push(`date_from=${dateFrom}`)
  if (dateTo) params.push(`date_to=${dateTo}`)
  const url = `${API_URL}/api/accounting/journal-entries?${params.join('&')}`
  const response = await fetch(url)
  return response.json()
}

export const getTrialBalance = async () => {
  const url = `${API_URL}/api/accounting/trial-balance`
  const response = await fetch(url)
  return response.json()
}

export const getBalanceSheet = async () => {
  const url = `${API_URL}/api/accounting/balance-sheet`
  const response = await fetch(url)
  return response.json()
}

export const getPnL = async () => {
  const url = `${API_URL}/api/accounting/pnl`
  const response = await fetch(url)
  return response.json()
}

import { useQuery, useMutation } from '@apollo/client'
import { GET_SAVINGS, CREATE_SAVINGS, GET_CUSTOMERS, GET_SAVINGS_TRANSACTIONS, DEPOSIT, WITHDRAW, GET_GL_ACCOUNTS } from '@/api/queries'
import { formatCurrency, formatDate } from '@/lib/utils'
import { PiggyBank, Search, Plus, Loader2, X, RefreshCw, Edit3, ArrowUpRight, ArrowDownRight, Wallet, Settings } from 'lucide-react'
import { useState } from 'react'

interface SavingsAccount {
    id: string
    accountNumber: string
    type: string
    balance: number
    currency: string
    openedAt: string
    status: string
    createdAt: string
    updatedAt: string
    customer?: {
        id: string
        displayName: string
    }
}

interface Transaction {
    id: string
    accountId: string
    transactionType: string
    amount: number
    timestamp: string
    notes?: string
}

const accountTypeBadge: Record<string, string> = {
    regular: 'bg-blue-400/10 text-blue-400 border-blue-400/20',
    high_yield: 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20',
    time_deposit: 'bg-purple-400/10 text-purple-400 border-purple-400/20',
}

export default function SavingsPage() {
    const [search, setSearch] = useState('')
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isSettingsOpen, setIsSettingsOpen] = useState(false)
    const [selectedAccount, setSelectedAccount] = useState<SavingsAccount | null>(null)
    const [transactionTab, setTransactionTab] = useState<'history' | 'deposit' | 'withdraw'>('history')
    const [autoGenerate, setAutoGenerate] = useState(true)
    const [settingsForm, setSettingsForm] = useState({
        interestRate: 4.0,
        depositDebitGlAccountId: '',
        depositCreditGlAccountId: '',
        withdrawalDebitGlAccountId: '',
        withdrawalCreditGlAccountId: '',
    })
    const [formData, setFormData] = useState({
        customerId: '',
        accountNumber: '',
        type: 'regular',
        balance: 0,
        termDays: 30,
        interestRate: 4.0,
    })
    const [transactionForm, setTransactionForm] = useState({
        amount: 0,
        notes: '',
    })

    const { data, loading, error, refetch } = useQuery(GET_SAVINGS, {
        variables: { searchTerm: search }
    })
    const { data: customersData } = useQuery(GET_CUSTOMERS, { variables: { skip: 0, limit: 500 } })
    const { data: glAccountsData } = useQuery(GET_GL_ACCOUNTS)
    const { data: transactionsData, loading: loadingTransactions, refetch: refetchTransactions, error: transactionsError } = useQuery(GET_SAVINGS_TRANSACTIONS, {
        variables: { accountId: selectedAccount?.id || '' },
        skip: !selectedAccount,
    })
    const [createSavings, { loading: creating }] = useMutation(CREATE_SAVINGS)
    const [deposit, { loading: depositing }] = useMutation(DEPOSIT)
    const [withdraw, { loading: withdrawing }] = useMutation(WITHDRAW)

    const accounts: SavingsAccount[] = data?.savingsAccounts?.accounts ?? []
    const customers = customersData?.customers?.customers ?? []
    const transactions: Transaction[] = transactionsData?.getTransactions?.transactions ?? []
    const glAccounts: { id: string; code: string; name: string; type: string }[] = glAccountsData?.glAccounts ?? []

    const filtered = accounts.filter((a) => {
        const q = search.toLowerCase()
        return (
            !q ||
            a.accountNumber?.toLowerCase().includes(q) ||
            a.customer?.displayName?.toLowerCase().includes(q)
        )
    })

    const totalBalance = accounts.reduce((s, a) => s + (a.balance || 0), 0)

    const generateAccountNumber = () => {
        const prefix = formData.type === 'regular' ? 'SAV' : formData.type === 'high_yield' ? 'HYS' : 'TDP'
        const year = new Date().getFullYear()
        const random = Math.floor(Math.random() * 90000) + 10000
        return `${prefix}-${year}-${random}`
    }

    const handleAutoGenerateToggle = () => {
        if (autoGenerate) {
            setFormData(prev => ({ ...prev, accountNumber: generateAccountNumber() }))
        } else {
            setFormData(prev => ({ ...prev, accountNumber: '' }))
        }
        setAutoGenerate(!autoGenerate)
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: type === 'number' ? parseFloat(value) : value
        }))
    }

    const handleTransactionChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target
        setTransactionForm(prev => ({
            ...prev,
            [name]: type === 'number' ? parseFloat(value) : value
        }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        
        if (!formData.customerId) {
            alert('Please select a customer first. If the customer is not in the list, you must create them in the Customers page.')
            return
        }

        const finalAccountNumber = autoGenerate ? generateAccountNumber() : formData.accountNumber
        try {
            const input: any = {
                customerId: formData.customerId,
                accountNumber: finalAccountNumber,
                type: formData.type,
                balance: formData.balance,
                openedAt: new Date().toISOString(),
                currency: 'PHP',
                status: 'active',
            }
            if (formData.type === 'time_deposit') {
                input.termDays = formData.termDays
                input.interestRate = formData.interestRate
                input.principal = formData.balance
            }
            await createSavings({
                variables: {
                    input,
                }
            })
            setIsModalOpen(false)
            setFormData({ customerId: '', accountNumber: '', type: 'regular', balance: 0, termDays: 30, interestRate: 4.0 })
            refetch()
        } catch (err: any) {
            console.error('Error creating savings:', err)
            alert(err?.message || 'Failed to create savings account')
        }
    }

    const handleDeposit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!selectedAccount) return
        try {
            await deposit({
                variables: {
                    input: {
                        accountId: selectedAccount.id,
                        amount: transactionForm.amount,
                        notes: transactionForm.notes,
                    }
                }
            })
            setTransactionForm({ amount: 0, notes: '' })
            refetchTransactions()
            refetch()
            alert('Deposit successful!')
        } catch (err: any) {
            console.error('Deposit error:', err)
            alert(err?.message || 'Failed to deposit')
        }
    }

    const handleWithdraw = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!selectedAccount) return
        try {
            await withdraw({
                variables: {
                    input: {
                        accountId: selectedAccount.id,
                        amount: transactionForm.amount,
                        notes: transactionForm.notes,
                    }
                }
            })
            setTransactionForm({ amount: 0, notes: '' })
            refetchTransactions()
            refetch()
            alert('Withdrawal successful!')
        } catch (err: any) {
            console.error('Withdrawal error:', err)
            alert(err?.message || 'Failed to withdraw')
        }
    }

    const openAccountModal = (account: SavingsAccount) => {
        setSelectedAccount(account)
        setTransactionTab('history')
        setTransactionForm({ amount: 0, notes: '' })
    }

    return (
        <div className="space-y-5 animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                        <PiggyBank className="w-6 h-6 text-emerald-400" /> Savings Accounts
                    </h1>
                    <p className="text-muted-foreground text-sm mt-1">
                        {loading ? 'Loading...' : `${accounts.length} accounts · Total: ${formatCurrency(totalBalance)}`}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2.5 gradient-success text-white text-sm font-semibold
                        rounded-lg shadow-lg hover:opacity-90 transition-all duration-200"
                    >
                        <Plus className="w-4 h-4" /> Open Account
                    </button>
                    <button
                        onClick={() => setIsSettingsOpen(true)}
                        className="flex items-center gap-2 px-4 py-2.5 bg-secondary border border-border text-foreground text-sm font-medium
                        rounded-lg hover:bg-secondary/80 transition-all duration-200"
                    >
                        <Settings className="w-4 h-4" /> Settings
                    </button>
                </div>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by account number or customer..."
                    className="w-full pl-10 pr-4 py-2.5 bg-secondary/50 border border-border rounded-lg text-sm
                     text-foreground placeholder:text-muted-foreground
                     focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary
                     transition-all duration-200 max-w-sm"
                />
            </div>

            {/* Table */}
            <div className="glass rounded-xl overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="w-6 h-6 animate-spin text-emerald-400" />
                    </div>
                ) : error ? (
                    <div className="py-20 text-center text-destructive text-sm">{error.message}</div>
                ) : (
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-border/50 bg-secondary/30">
                                {['Account No.', 'Customer', 'Type', 'Balance', 'Opened'].map((h) => (
                                    <th key={h} className="text-left px-5 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="py-16 text-center text-muted-foreground text-sm">No savings accounts found</td>
                                </tr>
                            ) : (
                                 filtered.map((a) => (
                                    <tr key={a.id} className="data-table-row">
                                        <td className="px-5 py-3.5 font-mono text-sm text-primary">{a.accountNumber}</td>
                                        <td 
                                            className="px-5 py-3.5 text-sm font-medium text-foreground cursor-pointer hover:text-primary"
                                            onClick={() => openAccountModal(a)}
                                        >
                                            {a.customer?.displayName || 'N/A'}
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <span className={`px-2 py-1 rounded-md border text-xs font-medium ${accountTypeBadge[a.type] ?? 'text-muted-foreground bg-muted/10 border-border'}`}>
                                                {a.type?.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3.5 text-sm font-semibold text-foreground">{formatCurrency(a.balance)}</td>
                                        <td className="px-5 py-3.5 text-sm text-muted-foreground">{formatDate(a.openedAt)}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Create Account Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="glass rounded-xl p-6 w-full max-w-md mx-4">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-foreground">Open Savings Account</h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-muted-foreground hover:text-foreground">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <div className="flex items-center justify-between mb-1.5">
                                    <label className="block text-sm font-medium text-foreground">Customer</label>
                                    <button 
                                        type="button" 
                                        onClick={() => navigate('/customers/new')}
                                        className="text-[10px] text-primary hover:underline font-semibold"
                                    >
                                        + New Customer
                                    </button>
                                </div>
                                <select
                                    name="customerId"
                                    value={formData.customerId}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-4 py-2.5 bg-secondary/50 border border-border rounded-lg text-sm text-foreground"
                                >
                                    <option value="">Select customer</option>
                                    {customers.map((c: any) => (
                                        <option key={c.id} value={c.id}>{c.displayName}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-1.5">Account Number</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        name="accountNumber"
                                        value={formData.accountNumber}
                                        onChange={handleChange}
                                        disabled={autoGenerate}
                                        required={!autoGenerate}
                                        className="w-full px-4 py-2.5 pr-11 bg-secondary/50 border border-border rounded-lg text-sm text-foreground disabled:opacity-60"
                                        placeholder={autoGenerate ? "Auto-generated on save" : "e.g., SAV-2026-00001"}
                                    />
                                    <button
                                        type="button"
                                        onClick={handleAutoGenerateToggle}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                        title={autoGenerate ? "Switch to manual input" : "Switch to auto-generate"}
                                    >
                                        {autoGenerate ? <RefreshCw className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-1.5">Account Type</label>
                                <select
                                    name="type"
                                    value={formData.type}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2.5 bg-secondary/50 border border-border rounded-lg text-sm text-foreground"
                                >
                                    <option value="regular">Regular Savings</option>
                                    <option value="high_yield">High Yield Savings</option>
                                    <option value="time_deposit">Time Deposit</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-1.5">Initial Deposit</label>
                                <input
                                    type="number"
                                    name="balance"
                                    value={formData.balance}
                                    onChange={handleChange}
                                    min="0"
                                    step="0.01"
                                    className="w-full px-4 py-2.5 bg-secondary/50 border border-border rounded-lg text-sm text-foreground"
                                />
                            </div>
                            {formData.type === 'time_deposit' && (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-foreground mb-1.5">Term (Days)</label>
                                        <select
                                            name="termDays"
                                            value={formData.termDays}
                                            onChange={handleChange}
                                            className="w-full px-4 py-2.5 bg-secondary/50 border border-border rounded-lg text-sm text-foreground"
                                        >
                                            <option value={30}>30 Days</option>
                                            <option value={60}>60 Days</option>
                                            <option value={90}>90 Days</option>
                                            <option value={180}>180 Days</option>
                                            <option value={365}>1 Year</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-foreground mb-1.5">Interest Rate (% p.a.)</label>
                                        <input
                                            type="number"
                                            name="interestRate"
                                            value={formData.interestRate}
                                            onChange={handleChange}
                                            min="0"
                                            max="20"
                                            step="0.1"
                                            className="w-full px-4 py-2.5 bg-secondary/50 border border-border rounded-lg text-sm text-foreground"
                                        />
                                    </div>
                                </>
                            )}
                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 px-4 py-2.5 border border-border rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={creating}
                                    className="flex-1 px-4 py-2.5 gradient-success text-white text-sm font-semibold rounded-lg disabled:opacity-60"
                                >
                                    {creating ? 'Creating...' : 'Create Account'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Settings Modal */}
            {isSettingsOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="glass rounded-xl p-6 w-full max-w-md mx-4">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-foreground">Savings Settings</h2>
                            <button onClick={() => setIsSettingsOpen(false)} className="text-muted-foreground hover:text-foreground">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="space-y-6">
                            {/* Interest Per Annum */}
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-1.5">Interest Per Annum (%)</label>
                                <input
                                    type="number"
                                    value={settingsForm.interestRate}
                                    onChange={(e) => setSettingsForm(prev => ({ ...prev, interestRate: parseFloat(e.target.value) }))}
                                    min="0"
                                    max="20"
                                    step="0.1"
                                    className="w-full px-4 py-2.5 bg-secondary/50 border border-border rounded-lg text-sm text-foreground"
                                />
                                <p className="text-xs text-muted-foreground mt-1">Annual interest rate for savings accounts</p>
                            </div>

                            {/* Deposit GL Accounts */}
                            <div className="border-t border-border pt-4">
                                <div className="flex items-center gap-2 mb-3">
                                    <ArrowUpRight className="w-4 h-4 text-emerald-400" />
                                    <label className="text-sm font-medium text-foreground">Deposit Transaction</label>
                                </div>
                                <div className="space-y-3">
                                    <div>
                                        <label className="block text-xs text-muted-foreground mb-1">Select GL Account (Debit)</label>
                                        <select
                                            value={settingsForm.depositDebitGlAccountId}
                                            onChange={(e) => setSettingsForm(prev => ({ ...prev, depositDebitGlAccountId: e.target.value }))}
                                            className="w-full px-4 py-2.5 bg-secondary/50 border border-border rounded-lg text-sm text-foreground"
                                        >
                                            <option value="">Select GL Account</option>
                                            {glAccounts.map((gl) => (
                                                <option key={gl.id} value={gl.id}>
                                                    {gl.code} - {gl.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs text-muted-foreground mb-1">Select GL Account (Credit)</label>
                                        <select
                                            value={settingsForm.depositCreditGlAccountId}
                                            onChange={(e) => setSettingsForm(prev => ({ ...prev, depositCreditGlAccountId: e.target.value }))}
                                            className="w-full px-4 py-2.5 bg-secondary/50 border border-border rounded-lg text-sm text-foreground"
                                        >
                                            <option value="">Select GL Account</option>
                                            {glAccounts.map((gl) => (
                                                <option key={gl.id} value={gl.id}>
                                                    {gl.code} - {gl.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Withdrawal GL Accounts */}
                            <div className="border-t border-border pt-4">
                                <div className="flex items-center gap-2 mb-3">
                                    <ArrowDownRight className="w-4 h-4 text-red-400" />
                                    <label className="text-sm font-medium text-foreground">Withdrawal Transaction</label>
                                </div>
                                <div className="space-y-3">
                                    <div>
                                        <label className="block text-xs text-muted-foreground mb-1">Select GL Account (Debit)</label>
                                        <select
                                            value={settingsForm.withdrawalDebitGlAccountId}
                                            onChange={(e) => setSettingsForm(prev => ({ ...prev, withdrawalDebitGlAccountId: e.target.value }))}
                                            className="w-full px-4 py-2.5 bg-secondary/50 border border-border rounded-lg text-sm text-foreground"
                                        >
                                            <option value="">Select GL Account</option>
                                            {glAccounts.map((gl) => (
                                                <option key={gl.id} value={gl.id}>
                                                    {gl.code} - {gl.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs text-muted-foreground mb-1">Select GL Account (Credit)</label>
                                        <select
                                            value={settingsForm.withdrawalCreditGlAccountId}
                                            onChange={(e) => setSettingsForm(prev => ({ ...prev, withdrawalCreditGlAccountId: e.target.value }))}
                                            className="w-full px-4 py-2.5 bg-secondary/50 border border-border rounded-lg text-sm text-foreground"
                                        >
                                            <option value="">Select GL Account</option>
                                            {glAccounts.map((gl) => (
                                                <option key={gl.id} value={gl.id}>
                                                    {gl.code} - {gl.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setIsSettingsOpen(false)}
                                    className="flex-1 px-4 py-2.5 border border-border rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        console.log('Settings saved:', {
                                            interestRate: settingsForm.interestRate,
                                            depositGlAccountId: settingsForm.depositGlAccountId,
                                            withdrawalGlAccountId: settingsForm.withdrawalGlAccountId,
                                        })
                                        alert(`Settings saved!\nInterest Rate: ${settingsForm.interestRate}%\nDeposit GL: ${settingsForm.depositGlAccountId || 'Not set'}\nWithdrawal GL: ${settingsForm.withdrawalGlAccountId || 'Not set'}`)
                                        setIsSettingsOpen(false)
                                    }}
                                    className="flex-1 px-4 py-2.5 bg-primary text-white text-sm font-semibold rounded-lg hover:opacity-90"
                                >
                                    Save Settings
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Account Detail Modal */}
            {selectedAccount && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="glass rounded-xl p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h2 className="text-xl font-bold text-foreground">Savings Account</h2>
                                <p className="text-sm text-muted-foreground">{selectedAccount.accountNumber}</p>
                            </div>
                            <button onClick={() => setSelectedAccount(null)} className="text-muted-foreground hover:text-foreground">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Account Info */}
                        <div className="grid grid-cols-3 gap-4 mb-6">
                            <div className="bg-secondary/30 rounded-lg p-4 text-center">
                                <p className="text-xs text-muted-foreground uppercase">Customer</p>
                                <p className="font-semibold text-foreground">{selectedAccount.customer?.displayName || 'N/A'}</p>
                            </div>
                            <div className="bg-secondary/30 rounded-lg p-4 text-center">
                                <p className="text-xs text-muted-foreground uppercase">Type</p>
                                <p className="font-semibold text-foreground">{selectedAccount.type?.replace('_', ' ')}</p>
                            </div>
                            <div className="bg-secondary/30 rounded-lg p-4 text-center">
                                <p className="text-xs text-muted-foreground uppercase">Balance</p>
                                <p className="font-bold text-lg text-emerald-400">{formatCurrency(selectedAccount.balance)}</p>
                            </div>
                        </div>

                        {/* Tabs */}
                        <div className="flex gap-2 mb-4">
                            <button
                                onClick={() => setTransactionTab('history')}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${transactionTab === 'history' ? 'bg-primary text-white' : 'bg-secondary/50 text-muted-foreground hover:text-foreground'}`}
                            >
                                <Wallet className="w-4 h-4" /> History
                            </button>
                            <button
                                onClick={() => setTransactionTab('deposit')}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${transactionTab === 'deposit' ? 'bg-emerald-500 text-white' : 'bg-secondary/50 text-muted-foreground hover:text-foreground'}`}
                            >
                                <ArrowUpRight className="w-4 h-4" /> Deposit
                            </button>
                            <button
                                onClick={() => setTransactionTab('withdraw')}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${transactionTab === 'withdraw' ? 'bg-red-500 text-white' : 'bg-secondary/50 text-muted-foreground hover:text-foreground'}`}
                            >
                                <ArrowDownRight className="w-4 h-4" /> Withdraw
                            </button>
                        </div>

                        {/* History Tab */}
                        {transactionTab === 'history' && (
                            <div className="space-y-2">
                                {transactionsError && (
                                    <div className="text-center text-destructive py-4 text-sm">
                                        Error loading transactions: {transactionsError.message}
                                    </div>
                                )}
                                {loadingTransactions ? (
                                    <div className="flex justify-center py-8">
                                        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                                    </div>
                                ) : transactions.length === 0 ? (
                                    <p className="text-center text-muted-foreground py-8">No transactions yet</p>
                                ) : (
                                    transactions.map((t) => (
                                        <div key={t.id} className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2 rounded-lg ${t.transactionType === 'deposit' ? 'bg-emerald-500/20' : 'bg-red-500/20'}`}>
                                                    {t.transactionType === 'deposit' ? (
                                                        <ArrowUpRight className="w-4 h-4 text-emerald-400" />
                                                    ) : (
                                                        <ArrowDownRight className="w-4 h-4 text-red-400" />
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-foreground capitalize">{t.transactionType}</p>
                                                    <p className="text-xs text-muted-foreground">{t.notes || '-'}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className={`text-sm font-semibold ${t.transactionType === 'deposit' ? 'text-emerald-400' : 'text-red-400'}`}>
                                                    {t.transactionType === 'deposit' ? '+' : '-'}{formatCurrency(t.amount)}
                                                </p>
                                                <p className="text-xs text-muted-foreground">{formatDate(t.timestamp)}</p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}

                        {/* Deposit Tab */}
                        {transactionTab === 'deposit' && (
                            <form onSubmit={handleDeposit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-1.5">Amount</label>
                                    <input
                                        type="number"
                                        name="amount"
                                        value={transactionForm.amount}
                                        onChange={handleTransactionChange}
                                        min="1"
                                        step="0.01"
                                        required
                                        className="w-full px-4 py-2.5 bg-secondary/50 border border-border rounded-lg text-sm text-foreground"
                                        placeholder="Enter deposit amount"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-1.5">Notes (Optional)</label>
                                    <textarea
                                        name="notes"
                                        value={transactionForm.notes}
                                        onChange={handleTransactionChange}
                                        rows={2}
                                        className="w-full px-4 py-2.5 bg-secondary/50 border border-border rounded-lg text-sm text-foreground"
                                        placeholder="Add notes..."
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={depositing}
                                    className="w-full px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold rounded-lg disabled:opacity-60"
                                >
                                    {depositing ? 'Processing...' : 'Confirm Deposit'}
                                </button>
                            </form>
                        )}

                        {/* Withdraw Tab */}
                        {transactionTab === 'withdraw' && (
                            <form onSubmit={handleWithdraw} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-1.5">Amount</label>
                                    <input
                                        type="number"
                                        name="amount"
                                        value={transactionForm.amount}
                                        onChange={handleTransactionChange}
                                        min="1"
                                        max={selectedAccount.balance}
                                        step="0.01"
                                        required
                                        className="w-full px-4 py-2.5 bg-secondary/50 border border-border rounded-lg text-sm text-foreground"
                                        placeholder="Enter withdrawal amount"
                                    />
                                    <p className="text-xs text-muted-foreground mt-1">Available: {formatCurrency(selectedAccount.balance)}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-1.5">Notes (Optional)</label>
                                    <textarea
                                        name="notes"
                                        value={transactionForm.notes}
                                        onChange={handleTransactionChange}
                                        rows={2}
                                        className="w-full px-4 py-2.5 bg-secondary/50 border border-border rounded-lg text-sm text-foreground"
                                        placeholder="Add notes..."
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={withdrawing}
                                    className="w-full px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white text-sm font-semibold rounded-lg disabled:opacity-60"
                                >
                                    {withdrawing ? 'Processing...' : 'Confirm Withdrawal'}
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}

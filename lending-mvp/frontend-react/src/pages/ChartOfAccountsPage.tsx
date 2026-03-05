import { useState, useEffect } from 'react'
import { Download, Plus, FileText } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useNavigate } from 'react-router-dom'

const getHeaders = () => {
    const token = localStorage.getItem('access_token')
    return {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
    }
}

interface GLAccount {
    id: string
    code: string
    name: string
    type: string
    balance: number
    createdAt: string
}

interface GroupedAccounts {
    [key: string]: GLAccount[]
}

export default function ChartOfAccountsPage() {
    const { user } = useAuth()
    const navigate = useNavigate()

    const [loading, setLoading] = useState(true)
    const [accountsData, setAccountsData] = useState<GLAccount[]>([])
    const [showAddModal, setShowAddModal] = useState(false)
    const [formData, setFormData] = useState({
        code: '',
        name: '',
        type: 'asset',
        description: ''
    })
    const [submitting, setSubmitting] = useState(false)
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

    const init = async () => {
        try {
            const res = await fetch('/graphql', {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify({
                    query: `query GetGLAccounts { glAccounts { id code name type balance createdAt } }`
                })
            })
            const data = await res.json()
            setAccountsData(data.data?.glAccounts || [])
            console.log('GL Accounts loaded:', data.data?.glAccounts?.length, 'accounts')
        } catch (e) {
            console.error('Failed to fetch GL accounts:', e)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { init() }, [])

    const getAccountTypeLabel = (type: string) => {
        const labels: { [key: string]: string } = {
            'asset': 'Asset',
            'liability': 'Liability',
            'equity': 'Equity',
            'income': 'Income',
            'expense': 'Expense'
        }
        return labels[type] || type
    }

    const getAccountTypeColor = (type: string) => {
        const colors: { [key: string]: string } = {
            'asset': 'bg-blue-500/20 text-blue-400',
            'liability': 'bg-red-500/20 text-red-400',
            'equity': 'bg-emerald-500/20 text-emerald-400',
            'income': 'bg-green-500/20 text-green-400',
            'expense': 'bg-amber-500/20 text-amber-400'
        }
        return colors[type] || 'bg-gray-500/20 text-gray-400'
    }

    // Group accounts by type
    const groupedAccounts = accountsData.reduce((acc, account) => {
        console.log('Account:', account.name, 'type:', account.type)
        if (!acc[account.type]) {
            acc[account.type] = []
        }
        acc[account.type].push(account)
        return acc
    }, {} as GroupedAccounts)

    // Define account type order
    const accountTypeOrder = ['asset', 'liability', 'equity', 'income', 'expense']

    const handleAddAccount = async (e: React.FormEvent) => {
        e.preventDefault()
        setSubmitting(true)
        setMessage(null)

        try {
            const res = await fetch('/graphql', {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify({
                    query: `mutation CreateGLAccount($input: GLAccountCreateInput!) {
                        createGLAccount(input: $input) {
                            success
                            message
                            account {
                                id
                                code
                                name
                                type
                            }
                        }
                    }`,
                    variables: {
                        input: {
                            code: formData.code,
                            name: formData.name,
                            type: formData.type,
                            description: formData.description || null
                        }
                    }
                })
            })
            const data = await res.json()
            const result = data.data?.createGLAccount

            if (result?.success) {
                setMessage({ type: 'success', text: 'Account created successfully!' })
                setShowAddModal(false)
                setFormData({ code: '', name: '', type: 'asset', description: '' })
                init()
            } else {
                setMessage({ type: 'error', text: result?.message || 'Failed to create account' })
            }
        } catch (e) {
            setMessage({ type: 'error', text: `Error: ${e}` })
        } finally {
            setSubmitting(false)
        }
    }

    const canManageGL = ['admin', 'branch_manager', 'teller', 'book_keeper'].includes(user?.role || '')

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Chart of Accounts</h1>
                    <p className="text-muted-foreground text-sm mt-1">General Ledger accounts</p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => navigate('/journal-entries')}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:bg-white/5 transition-colors"
                    >
                        <FileText className="w-4 h-4" /> Journal Entries
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:bg-white/5 transition-colors">
                        <Download className="w-4 h-4" /> Export
                    </button>
                    {canManageGL && (
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white text-sm font-medium transition-colors"
                        >
                            <Plus className="w-4 h-4" /> Add Account
                        </button>
                    )}
                </div>
            </div>

            {loading ? (
                <div className="text-center py-16 text-muted-foreground">Loading accounts…</div>
            ) : (
                <div className="space-y-8">
                    {accountTypeOrder.map((type) => {
                        const accounts = groupedAccounts[type] || []
                        if (accounts.length === 0) return null

                        return (
                            <div key={type}>
                                {/* Section Header */}
                                <div className="flex items-center gap-3 mb-4 pb-2 border-b border-border">
                                    <h2 className="text-lg font-semibold text-foreground">{getAccountTypeLabel(type)}</h2>
                                    <span className={`text-xs px-2 py-1 rounded-full ${getAccountTypeColor(type)}`}>
                                        {accounts.length} {accounts.length === 1 ? 'account' : 'accounts'}
                                    </span>
                                </div>

                                {/* Accounts Table */}
                                <div className="glass rounded-xl overflow-hidden">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b border-border/50">
                                                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Account Number</th>
                                                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Name</th>
                                                <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Balance</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {accounts.map((account) => (
                                                <tr key={account.id} className="border-b border-border/30 hover:bg-white/5 transition-colors">
                                                    <td className="px-4 py-3 font-mono text-foreground font-medium">{account.code}</td>
                                                    <td className="px-4 py-3 text-foreground">{account.name}</td>
                                                    <td className="px-4 py-3 text-right text-foreground font-medium">
                                                        {account.balance ? `₱${account.balance.toLocaleString()}` : '—'}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}

            {/* Add Account Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-[#1a1d23] rounded-xl max-w-md w-full">
                        <div className="border-b border-border p-4 flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-foreground">Add GL Account</h3>
                            <button
                                onClick={() => setShowAddModal(false)}
                                className="p-2 hover:bg-white/5 rounded-lg transition-colors"
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleAddAccount} className="p-4 space-y-4">
                            {message && (
                                <div className={`p-3 rounded-lg text-sm ${
                                    message.type === 'success'
                                        ? 'bg-green-500/20 text-green-400'
                                        : 'bg-red-500/20 text-red-400'
                                }`}>
                                    {message.text}
                                </div>
                            )}

                            <div>
                                <label className="block text-sm text-muted-foreground mb-1">Account Code</label>
                                <input
                                    type="text"
                                    value={formData.code}
                                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                    placeholder="e.g., 1000"
                                    required
                                    className="w-full px-3 py-2 bg-white/5 border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                />
                            </div>

                            <div>
                                <label className="block text-sm text-muted-foreground mb-1">Account Name</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="e.g., Cash on Hand"
                                    required
                                    className="w-full px-3 py-2 bg-white/5 border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                />
                            </div>

                            <div>
                                <label className="block text-sm text-muted-foreground mb-1">Account Type</label>
                                <select
                                    value={formData.type}
                                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                    className="w-full px-3 py-2 bg-white/5 border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                >
                                    <option value="asset">Asset</option>
                                    <option value="liability">Liability</option>
                                    <option value="equity">Equity</option>
                                    <option value="income">Income</option>
                                    <option value="expense">Expense</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm text-muted-foreground mb-1">Description (Optional)</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Optional description..."
                                    rows={3}
                                    className="w-full px-3 py-2 bg-white/5 border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                />
                            </div>

                            <div className="flex gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowAddModal(false)}
                                    className="flex-1 px-4 py-2 border border-border rounded-lg text-muted-foreground hover:bg-white/5 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-medium transition-colors disabled:opacity-50"
                                >
                                    {submitting ? 'Creating...' : 'Create Account'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}

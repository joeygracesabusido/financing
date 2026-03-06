import { useState, useEffect, useRef } from 'react'
import { Plus, Search, ChevronDown, CheckCircle, XCircle } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { getCustomers } from '@/api/customers'

interface Customer {
    id: string
    displayName: string
    branchCode: string
}

interface SavingsAccount {
    id: string
    accountNumber: string
    balance: number
    customerId: string
    accountType: string
    status: string
    openedAt: string
    customer?: {
        displayName: string
    }
}

const getHeaders = () => {
    const token = localStorage.getItem('access_token')
    return {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
    }
}

export default function SavingsPage() {
    const { user } = useAuth()
    const isAdmin = user?.role === 'admin' || user?.role === 'branch_manager'

    const [loading, setLoading] = useState(true)
    const [accountsData, setAccountsData] = useState<SavingsAccount[]>([])
    const [search, setSearch] = useState('')
    
    // New Account Modal State
    const [showModal, setShowModal] = useState(false)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')
    const [customers, setCustomers] = useState<Customer[]>([])
    const [form, setForm] = useState({
        customerId: '',
        accountNumber: '',
        type: 'regular',
        initialBalance: '0',
        openedAt: new Date().toISOString().split('T')[0]
    })

    // Customer Search State
    const [customerSearch, setCustomerSearch] = useState('')
    const [isCustomerDropdownOpen, setIsCustomerDropdownOpen] = useState(false)
    const customerRef = useRef<HTMLDivElement>(null)

    const init = async () => {
        try {
            const res = await fetch('/graphql', {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify({
                    query: `query GetSavingsAccounts { 
                        savingsAccounts { 
                            accounts { 
                                id 
                                accountNumber 
                                balance 
                                customerId 
                                accountType 
                                status 
                                openedAt
                                customer {
                                    displayName
                                }
                            } 
                        } 
                    }`
                })
            })
            const data = await res.json()
            setAccountsData(data.data?.savingsAccounts.accounts || [])
            
            // Fetch customers for the dropdown
            const customersRes = await getCustomers()
            setCustomers(customersRes.customers?.customers || [])
        } catch (e) {
            console.error('Failed to fetch data:', e)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { init() }, [])

    // Close dropdown on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (customerRef.current && !customerRef.current.contains(event.target as Node)) {
                setIsCustomerDropdownOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const filteredCustomers = customers.filter(c => 
        c.displayName.toLowerCase().includes(customerSearch.toLowerCase())
    )

    const selectCustomer = (c: Customer) => {
        setForm({ ...form, customerId: c.id })
        setCustomerSearch(c.displayName)
        setIsCustomerDropdownOpen(false)
        
        // Auto-generate a dummy account number based on branch and timestamp
        const randomNum = Math.floor(100000 + Math.random() * 900000)
        setForm(prev => ({ ...prev, customerId: c.id, accountNumber: `${c.branchCode}-SAV-${randomNum}` }))
    }

    const handleCreateAccount = async () => {
        if (!form.customerId || !form.accountNumber) {
            setError('Customer and Account Number are required')
            return
        }
        setSaving(true)
        setError('')
        try {
            const res = await fetch('/graphql', {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify({
                    query: `mutation CreateSavingsAccount($input: SavingsAccountCreateInput!) {
                        createSavingsAccount(input: $input) {
                            success
                            message
                            account {
                                id
                                accountNumber
                            }
                        }
                    }`,
                    variables: {
                        input: {
                            customerId: form.customerId,
                            accountNumber: form.accountNumber,
                            accountType: form.type,
                            balance: parseFloat(form.initialBalance) || 0,
                            openedAt: new Date(form.openedAt).toISOString(),
                            status: 'active'
                        }
                    }
                })
            })
            const data = await res.json()
            if (data.data?.createSavingsAccount?.success) {
                alert('Savings account created successfully!')
                setShowModal(false)
                init()
            } else {
                setError(data.data?.createSavingsAccount?.message || 'Failed to create account')
            }
        } catch (e) {
            setError('Error creating account')
        } finally {
            setSaving(false)
        }
    }

    const getAccountTypeLabel = (type: string) => {
        const labels: { [key: string]: string } = {
            'regular': 'Regular',
            'savings': 'Savings',
            'fixed': 'Fixed Deposit',
            'recurrent': 'Recurrent'
        }
        return labels[type] || type
    }

    const getAccountColor = (type: string) => {
        const colors: { [key: string]: string } = {
            'regular': 'bg-blue-500/20 text-blue-400',
            'savings': 'bg-emerald-500/20 text-emerald-400',
            'fixed': 'bg-amber-500/20 text-amber-400',
            'recurrent': 'bg-purple-500/20 text-purple-400'
        }
        return colors[type] || 'bg-gray-500/20 text-gray-400'
    }

    const filteredAccounts = accountsData.filter(acc => 
        acc.accountNumber.toLowerCase().includes(search.toLowerCase()) ||
        acc.customer?.displayName?.toLowerCase().includes(search.toLowerCase())
    )

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Savings Accounts</h1>
                    <p className="text-muted-foreground text-sm mt-1">Manage customer savings accounts</p>
                </div>
                {isAdmin && (
                    <button 
                        onClick={() => {
                            setForm({
                                customerId: '',
                                accountNumber: '',
                                type: 'regular',
                                initialBalance: '0',
                                openedAt: new Date().toISOString().split('T')[0]
                            })
                            setCustomerSearch('')
                            setError('')
                            setShowModal(true)
                        }}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg gradient-primary text-white text-sm font-medium shadow-lg hover:opacity-90 transition-opacity"
                    >
                        <Plus className="w-4 h-4" /> New Account
                    </button>
                )}
            </div>

            {loading ? (
                <div className="text-center py-16 text-muted-foreground">Loading savings accounts…</div>
            ) : (
                <div className="glass rounded-xl overflow-hidden">
                    <div className="p-4 border-b border-border/50">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search accounts or customers..." className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-background/50 focus:outline-none focus:border-primary/50" />
                        </div>
                    </div>
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-border/50">
                                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Account Number</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Customer</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Type</th>
                                <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Balance</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredAccounts.length === 0 ? (
                                <tr><td colSpan={5} className="text-center py-12 text-muted-foreground">No savings accounts found.</td></tr>
                            ) : filteredAccounts.map((account) => (
                                <tr key={account.id} className="border-b border-border/30 hover:bg-white/5 transition-colors">
                                    <td className="px-4 py-3 font-mono text-foreground font-medium">{account.accountNumber}</td>
                                    <td className="px-4 py-3 text-foreground">{account.customer?.displayName || <span className="text-muted-foreground italic text-xs">Unknown Customer</span>}</td>
                                    <td className="px-4 py-3">
                                        <span className={`text-xs px-2 py-1 rounded-full ${getAccountColor(account.accountType)}`}>
                                            {getAccountTypeLabel(account.accountType)}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-right text-foreground font-medium">₱{account.balance.toLocaleString()}</td>
                                    <td className="px-4 py-3">
                                        <span className={`text-xs px-2 py-1 rounded-full ${account.status === 'active' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                                            {account.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* New Account Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="glass rounded-2xl p-6 w-full max-w-md shadow-2xl border border-border/50">
                        <h2 className="font-bold text-lg text-foreground mb-4">New Savings Account</h2>
                        
                        <div className="space-y-4">
                            <div className="relative" ref={customerRef}>
                                <label className="block text-xs text-muted-foreground mb-1">Customer *</label>
                                <div className="relative">
                                    <input 
                                        value={customerSearch} 
                                        onChange={e => {
                                            setCustomerSearch(e.target.value)
                                            setIsCustomerDropdownOpen(true)
                                        }} 
                                        onFocus={() => setIsCustomerDropdownOpen(true)}
                                        placeholder="Search customer..." 
                                        className="w-full bg-background/50 border border-border rounded-lg pl-3 pr-10 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50" 
                                    />
                                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                                </div>
                                
                                {isCustomerDropdownOpen && filteredCustomers.length > 0 && (
                                    <div className="absolute z-10 w-full mt-1 bg-[#1a1c2e] border border-border/50 rounded-lg shadow-xl overflow-hidden max-h-48 overflow-y-auto">
                                        {filteredCustomers.map((c) => (
                                            <button
                                                key={c.id}
                                                onClick={() => selectCustomer(c)}
                                                className="w-full text-left px-4 py-2 text-sm text-muted-foreground hover:bg-white/5 hover:text-foreground transition-colors"
                                            >
                                                {c.displayName}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="block text-xs text-muted-foreground mb-1">Account Number *</label>
                                <input 
                                    value={form.accountNumber} 
                                    onChange={e => setForm({ ...form, accountNumber: e.target.value })} 
                                    placeholder="e.g. MNL-SAV-12345" 
                                    className="w-full bg-background/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/50" 
                                />
                            </div>

                            <div>
                                <label className="block text-xs text-muted-foreground mb-1">Account Type</label>
                                <select 
                                    value={form.type} 
                                    onChange={e => setForm({ ...form, type: e.target.value })} 
                                    className="w-full bg-background/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/50"
                                >
                                    <option value="regular">Regular Savings</option>
                                    <option value="savings">Special Savings</option>
                                    <option value="fixed">Fixed Deposit</option>
                                    <option value="recurrent">Recurrent</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs text-muted-foreground mb-1">Initial Balance</label>
                                <input 
                                    type="number"
                                    value={form.initialBalance} 
                                    onChange={e => setForm({ ...form, initialBalance: e.target.value })} 
                                    className="w-full bg-background/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/50 text-right" 
                                />
                            </div>

                            <div>
                                <label className="block text-xs text-muted-foreground mb-1">Opened Date</label>
                                <input 
                                    type="date"
                                    value={form.openedAt} 
                                    onChange={e => setForm({ ...form, openedAt: e.target.value })} 
                                    className="w-full bg-background/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/50" 
                                />
                            </div>

                            {error && <p className="text-destructive text-xs italic">{error}</p>}
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:bg-white/5 transition-colors">Cancel</button>
                            <button 
                                onClick={handleCreateAccount} 
                                disabled={saving || !form.customerId} 
                                className="flex-1 px-4 py-2 rounded-lg gradient-primary text-white text-sm font-medium disabled:opacity-60"
                            >
                                {saving ? 'Creating…' : 'Create Account'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

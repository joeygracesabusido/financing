import { useState, useEffect } from 'react'
import { Plus, Search } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'

interface SavingsAccount {
    id: string
    accountNumber: string
    balance: number
    customerId: string
    accountType: string
    status: string
    openedAt: string
}

export default function SavingsPage() {
    const { user } = useAuth()
    const isAdmin = user?.role === 'admin' || user?.role === 'branch_manager'

    const [loading, setLoading] = useState(true)
    const [accountsData, setAccountsData] = useState<SavingsAccount[]>([])
    const [search, setSearch] = useState('')

    const init = async () => {
        try {
            const res = await fetch('/graphql', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    query: `query GetSavingsAccounts { savingsAccounts { accounts { id accountNumber balance customerId accountType status openedAt } } }`
                })
            })
            const data = await res.json()
            setAccountsData(data.data?.savingsAccounts.accounts || [])
        } catch (e) {
            console.error('Failed to fetch savings accounts:', e)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { init() }, [])

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

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Savings Accounts</h1>
                    <p className="text-muted-foreground text-sm mt-1">Manage customer savings accounts</p>
                </div>
                {isAdmin && (
                    <button className="flex items-center gap-2 px-4 py-2 rounded-lg gradient-primary text-white text-sm font-medium shadow-lg hover:opacity-90 transition-opacity">
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
                            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search accounts..." className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-background/50 focus:outline-none focus:border-primary/50" />
                        </div>
                    </div>
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-border/50">
                                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Account Number</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Type</th>
                                <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Balance</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {accountsData.length === 0 ? (
                                <tr><td colSpan={4} className="text-center py-12 text-muted-foreground">No savings accounts found.</td></tr>
                            ) : accountsData.map((account) => (
                                <tr key={account.id} className="border-b border-border/30 hover:bg-white/5 transition-colors">
                                    <td className="px-4 py-3 font-mono text-foreground font-medium">{account.accountNumber}</td>
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
        </div>
    )
}

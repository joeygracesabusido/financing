import { useState, useEffect } from 'react'
import { Download } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'

interface GLAccount {
    id: string
    accountNumber: string
    name: string
    accountType: string
    balance: number
    createdAt: string
}

export default function ChartOfAccountsPage() {
    const { user } = useAuth()

    const [loading, setLoading] = useState(true)
    const [accountsData, setAccountsData] = useState<GLAccount[]>([])

    const init = async () => {
        try {
            const res = await fetch('/graphql', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    query: `query GetGLAccounts { glAccounts { id accountNumber name accountType balance createdAt } }`
                })
            })
            const data = await res.json()
            setAccountsData(data.data?.glAccounts || [])
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

    const getAccountColor = (type: string) => {
        const colors: { [key: string]: string } = {
            'asset': 'bg-blue-500/20 text-blue-400',
            'liability': 'bg-red-500/20 text-red-400',
            'equity': 'bg-emerald-500/20 text-emerald-400',
            'income': 'bg-green-500/20 text-green-400',
            'expense': 'bg-amber-500/20 text-amber-400'
        }
        return colors[type] || 'bg-gray-500/20 text-gray-400'
    }

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Chart of Accounts</h1>
                    <p className="text-muted-foreground text-sm mt-1">General Ledger accounts</p>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:bg-white/5 transition-colors">
                    <Download className="w-4 h-4" /> Export
                </button>
            </div>

            {loading ? (
                <div className="text-center py-16 text-muted-foreground">Loading accounts…</div>
            ) : (
                <div className="glass rounded-xl overflow-hidden">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-border/50">
                                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Account Number</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Name</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Type</th>
                                <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Balance</th>
                            </tr>
                        </thead>
                        <tbody>
                            {accountsData.length === 0 ? (
                                <tr><td colSpan={4} className="text-center py-12 text-muted-foreground">No accounts found.</td></tr>
                            ) : accountsData.map((account) => (
                                <tr key={account.id} className="border-b border-border/30 hover:bg-white/5 transition-colors">
                                    <td className="px-4 py-3 font-mono text-foreground font-medium">{account.accountNumber}</td>
                                    <td className="px-4 py-3 text-foreground">{account.name}</td>
                                    <td className="px-4 py-3">
                                        <span className={`text-xs px-2 py-1 rounded-full ${getAccountColor(account.accountType)}`}>
                                            {getAccountTypeLabel(account.accountType)}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-right text-foreground font-medium">
                                        {account.balance ? `₱${account.balance.toLocaleString()}` : '—'}
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

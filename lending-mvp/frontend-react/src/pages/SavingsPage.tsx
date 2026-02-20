import { useQuery } from '@apollo/client'
import { GET_SAVINGS } from '@/api/queries'
import { formatCurrency, formatDate } from '@/lib/utils'
import { PiggyBank, Search, Plus, Loader2 } from 'lucide-react'
import { useState } from 'react'

interface SavingsAccount {
    id: string
    accountNumber: string
    accountType: string
    balance: number
    customerName: string
    createdAt: string
}

const accountTypeBadge: Record<string, string> = {
    regular: 'bg-blue-400/10 text-blue-400 border-blue-400/20',
    high_yield: 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20',
    time_deposit: 'bg-purple-400/10 text-purple-400 border-purple-400/20',
}

export default function SavingsPage() {
    const [search, setSearch] = useState('')
    const { data, loading, error } = useQuery(GET_SAVINGS)

    const accounts: SavingsAccount[] = data?.savingsAccounts ?? []
    const filtered = accounts.filter((a) => {
        const q = search.toLowerCase()
        return (
            !q ||
            a.accountNumber?.toLowerCase().includes(q) ||
            a.customerName?.toLowerCase().includes(q)
        )
    })

    const totalBalance = accounts.reduce((s, a) => s + (a.balance || 0), 0)

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
                <button
                    className="flex items-center gap-2 px-4 py-2.5 gradient-success text-white text-sm font-semibold
                     rounded-lg shadow-lg hover:opacity-90 transition-all duration-200"
                >
                    <Plus className="w-4 h-4" /> Open Account
                </button>
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
                                        <td className="px-5 py-3.5 text-sm font-medium text-foreground">{a.customerName}</td>
                                        <td className="px-5 py-3.5">
                                            <span className={`px-2 py-1 rounded-md border text-xs font-medium ${accountTypeBadge[a.accountType] ?? 'text-muted-foreground bg-muted/10 border-border'}`}>
                                                {a.accountType?.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3.5 text-sm font-semibold text-foreground">{formatCurrency(a.balance)}</td>
                                        <td className="px-5 py-3.5 text-sm text-muted-foreground">{formatDate(a.createdAt)}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    )
}

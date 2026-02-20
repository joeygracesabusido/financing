import { useQuery } from '@apollo/client'
import { GET_LOANS } from '@/api/queries'
import { formatCurrency, formatDate, getLoanStatusColor } from '@/lib/utils'
import { CreditCard, Search, Plus, Loader2 } from 'lucide-react'
import { useState } from 'react'

interface Loan {
    id: string
    loanNumber: string
    loanType: string
    principalAmount: number
    outstandingBalance: number
    interestRate: number
    status: string
    customerName: string
    startDate: string
    maturityDate: string
}

export default function LoansPage() {
    const [search, setSearch] = useState('')
    const { data, loading, error } = useQuery(GET_LOANS)

    const loans: Loan[] = data?.loans ?? []
    const filtered = loans.filter((l) => {
        const q = search.toLowerCase()
        return (
            !q ||
            l.loanNumber?.toLowerCase().includes(q) ||
            l.customerName?.toLowerCase().includes(q) ||
            l.loanType?.toLowerCase().includes(q)
        )
    })

    const totalOutstanding = loans.reduce((s, l) => s + (l.outstandingBalance || 0), 0)

    return (
        <div className="space-y-5 animate-fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                        <CreditCard className="w-6 h-6 text-yellow-400" /> Loans
                    </h1>
                    <p className="text-muted-foreground text-sm mt-1">
                        {loading ? 'Loading...' : `${loans.length} loans · Outstanding: ${formatCurrency(totalOutstanding)}`}
                    </p>
                </div>
                <button className="flex items-center gap-2 px-4 py-2.5 gradient-warning text-white text-sm font-semibold rounded-lg shadow-lg hover:opacity-90 transition-all duration-200">
                    <Plus className="w-4 h-4" /> New Loan
                </button>
            </div>

            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by loan number, customer, or type..."
                    className="w-full pl-10 pr-4 py-2.5 bg-secondary/50 border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-200 max-w-sm"
                />
            </div>

            <div className="glass rounded-xl overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="w-6 h-6 animate-spin text-yellow-400" />
                    </div>
                ) : error ? (
                    <div className="py-20 text-center text-destructive text-sm">{error.message}</div>
                ) : (
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-border/50 bg-secondary/30">
                                {['Loan No.', 'Customer', 'Type', 'Principal', 'Outstanding', 'Rate', 'Status', 'Maturity'].map((h) => (
                                    <th key={h} className="text-left px-4 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.length === 0 ? (
                                <tr><td colSpan={8} className="py-16 text-center text-muted-foreground text-sm">No loans found</td></tr>
                            ) : (
                                filtered.map((l) => (
                                    <tr key={l.id} className="data-table-row">
                                        <td className="px-4 py-3.5 font-mono text-sm text-primary">{l.loanNumber}</td>
                                        <td className="px-4 py-3.5 text-sm font-medium text-foreground">{l.customerName}</td>
                                        <td className="px-4 py-3.5 text-sm text-muted-foreground capitalize">{l.loanType?.replace('_', ' ')}</td>
                                        <td className="px-4 py-3.5 text-sm text-foreground">{formatCurrency(l.principalAmount)}</td>
                                        <td className="px-4 py-3.5 text-sm font-semibold text-foreground">{formatCurrency(l.outstandingBalance)}</td>
                                        <td className="px-4 py-3.5 text-sm text-muted-foreground">{l.interestRate}%</td>
                                        <td className="px-4 py-3.5">
                                            <span className={`px-2 py-1 rounded-md border text-xs font-medium ${getLoanStatusColor(l.status)}`}>
                                                {l.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3.5 text-sm text-muted-foreground">{formatDate(l.maturityDate)}</td>
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

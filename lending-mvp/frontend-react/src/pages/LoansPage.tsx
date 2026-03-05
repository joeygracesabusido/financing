import { useState, useEffect } from 'react'
import { Search, Plus, Eye, FileText } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { getLoans } from '@/api/loans'
import { useNavigate } from 'react-router-dom'

interface Loan {
    id: string
    principal: number
    status: string
    customerId: string
    productId: string
    borrowerName: string
    productName: string
    termMonths: number
    approvedPrincipal?: number
    approvedRate?: number
    createdAt: string
    disbursedAt?: string
    outstandingBalance?: number
}

export default function LoansPage() {
    const { user } = useAuth()
    const navigate = useNavigate()
    const canCreateLoan = user?.role === 'admin' || user?.role === 'branch_manager'

    const [loading, setLoading] = useState(true)
    const [loansData, setLoansData] = useState<Loan[]>([])
    const [search, setSearch] = useState('')

    const init = async () => {
        try {
            const data = await getLoans()
            setLoansData(data.loans || [])
        } catch (e) {
            console.error('Failed to fetch loans:', e)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { init() }, [])

    const getStatusColor = (status: string) => {
        const colors: { [key: string]: string } = {
            'pending': 'text-amber-400',
            'approved': 'text-emerald-400',
            'disbursed': 'text-blue-400',
            'repaid': 'text-emerald-400',
            'default': 'text-red-400',
            'written_off': 'text-red-500'
        }
        return colors[status] || 'text-muted-foreground'
    }

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Loans</h1>
                    <p className="text-muted-foreground text-sm mt-1">Manage loan applications</p>
                </div>
                {canCreateLoan && (
                    <button 
                        onClick={() => navigate('/customer/loans/new')}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg gradient-primary text-white text-sm font-medium shadow-lg hover:opacity-90 transition-opacity"
                    >
                        <Plus className="w-4 h-4" /> New Loan
                    </button>
                )}
            </div>

            {loading ? (
                <div className="text-center py-16 text-muted-foreground">Loading loans…</div>
            ) : (
                <div className="glass rounded-xl overflow-hidden">
                    <div className="p-4 border-b border-border/50">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search loans..." className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-background/50 focus:outline-none focus:border-primary/50" />
                        </div>
                    </div>
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-border/50">
                                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Borrower</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Product</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Amount</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Term</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loansData.length === 0 ? (
                                <tr><td colSpan={5} className="text-center py-12 text-muted-foreground">No loans found.</td></tr>
                            ) : loansData.map((loan) => (
                                <tr key={loan.id} className="border-b border-border/30 hover:bg-white/5 transition-colors">
                                    <td className="px-4 py-3">
                                        <div className="font-medium text-foreground">{loan.borrowerName}</div>
                                        <div className="text-xs text-muted-foreground">{loan.customerId}</div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="font-medium text-foreground">{loan.productName}</div>
                                        <div className="text-xs text-muted-foreground">{loan.productId}</div>
                                    </td>
                                    <td className="px-4 py-3 text-foreground font-medium">
                                        {loan.principal ? `₱${loan.principal.toLocaleString()}` : '—'}
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(loan.status)}`}>
                                            {loan.status.charAt(0).toUpperCase() + loan.status.slice(1)}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-muted-foreground">{loan.termMonths} months</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    )
}

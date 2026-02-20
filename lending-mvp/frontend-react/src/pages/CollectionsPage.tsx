import { useQuery } from '@apollo/client'
import { GET_COLLECTIONS_DASHBOARD } from '@/api/queries'
import { formatCurrency } from '@/lib/utils'
import { AlertTriangle, TrendingDown, Clock, ShieldAlert, Skull } from 'lucide-react'

const bucketIcons: Record<string, any> = {
    'Current': Clock,
    '1-30 DPD': TrendingDown,
    '31-60 DPD': AlertTriangle,
    '61-90 DPD': ShieldAlert,
    '90+ DPD': Skull,
}

const bucketColors: Record<string, string> = {
    'Current': 'from-emerald-500/20 to-emerald-600/10 border-emerald-500/30 text-emerald-400',
    '1-30 DPD': 'from-yellow-500/20 to-yellow-600/10 border-yellow-500/30 text-yellow-400',
    '31-60 DPD': 'from-orange-500/20 to-orange-600/10 border-orange-500/30 text-orange-400',
    '61-90 DPD': 'from-red-500/20 to-red-600/10 border-red-500/30 text-red-400',
    '90+ DPD': 'from-red-700/20 to-red-800/10 border-red-700/30 text-red-300',
}

export default function CollectionsPage() {
    const { data, loading, error } = useQuery(GET_COLLECTIONS_DASHBOARD)
    const dashboard = data?.collectionsDashboard

    if (loading) return <div className="p-10 text-center animate-pulse">Loading collections…</div>
    if (error) return <div className="p-10 text-center text-destructive">Error: {error.message}</div>

    return (
        <div className="space-y-6 animate-fade-in">
            <div>
                <h1 className="text-2xl font-bold text-foreground">Collections Dashboard</h1>
                <p className="text-muted-foreground text-sm mt-1">
                    Portfolio at Risk (PAR) — aging analysis of active loans by days past due
                </p>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="glass p-5 rounded-xl">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Loans</p>
                    <p className="text-2xl font-bold mt-1">{dashboard?.totalLoans ?? 0}</p>
                </div>
                <div className="glass p-5 rounded-xl">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Outstanding</p>
                    <p className="text-2xl font-bold text-primary mt-1">{formatCurrency(dashboard?.totalOutstanding ?? 0)}</p>
                </div>
                <div className="glass p-5 rounded-xl">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">At Risk (&gt;30 DPD)</p>
                    <p className="text-2xl font-bold text-red-400 mt-1">
                        {(dashboard?.buckets || []).filter((b: any) => !['Current', '1-30 DPD'].includes(b.label)).reduce((s: number, b: any) => s + b.loanCount, 0)}
                    </p>
                </div>
                <div className="glass p-5 rounded-xl">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">PAR &gt;30</p>
                    <p className="text-2xl font-bold text-orange-400 mt-1">
                        {dashboard?.totalOutstanding > 0
                            ? ((dashboard.buckets || [])
                                .filter((b: any) => !['Current', '1-30 DPD'].includes(b.label))
                                .reduce((s: number, b: any) => s + parseFloat(b.totalOutstanding || 0), 0) / parseFloat(dashboard.totalOutstanding) * 100
                            ).toFixed(1) + '%'
                            : '0%'}
                    </p>
                </div>
            </div>

            {/* Aging Buckets */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                {(dashboard?.buckets || []).map((bucket: any) => {
                    const Icon = bucketIcons[bucket.label] || Clock
                    const colorClass = bucketColors[bucket.label] || ''
                    return (
                        <div key={bucket.label} className={`glass p-5 rounded-xl border bg-gradient-to-br ${colorClass}`}>
                            <div className="flex items-center gap-2 mb-3">
                                <Icon className="w-5 h-5" />
                                <span className="font-semibold text-sm">{bucket.label}</span>
                            </div>
                            <p className="text-2xl font-bold">{bucket.loanCount}</p>
                            <p className="text-xs mt-1 opacity-80">loans</p>
                            <p className="text-lg font-semibold mt-2">{formatCurrency(bucket.totalOutstanding)}</p>
                            <p className="text-xs opacity-80">outstanding</p>
                        </div>
                    )
                })}
            </div>

            {/* Detailed Table */}
            <div className="glass rounded-xl overflow-hidden">
                <div className="px-5 py-3 border-b border-border/50 bg-secondary/20">
                    <h3 className="font-semibold">Overdue Loans</h3>
                </div>
                <table className="w-full text-sm">
                    <thead className="bg-secondary/40">
                        <tr>
                            <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Loan ID</th>
                            <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Borrower</th>
                            <th className="px-4 py-3 text-right font-semibold text-muted-foreground">Principal</th>
                            <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Status</th>
                            <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Bucket</th>
                        </tr>
                    </thead>
                    <tbody>
                        {(dashboard?.buckets || []).filter((b: any) => b.label !== 'Current').flatMap((bucket: any) =>
                            (bucket.loans || []).map((loan: any) => (
                                <tr key={loan.id} className="border-t border-border/50 hover:bg-secondary/20">
                                    <td className="px-4 py-3 font-mono">{loan.id}</td>
                                    <td className="px-4 py-3">{loan.borrowerName || loan.customerId}</td>
                                    <td className="px-4 py-3 text-right font-semibold">{formatCurrency(loan.principal)}</td>
                                    <td className="px-4 py-3 capitalize">{loan.status}</td>
                                    <td className="px-4 py-3">
                                        <span className={`px-2 py-0.5 text-xs font-bold rounded ${bucketColors[bucket.label]?.split(' ')[0]} ${bucketColors[bucket.label]?.split(' ')[2]}`}>
                                            {bucket.label}
                                        </span>
                                    </td>
                                </tr>
                            ))
                        )}
                        {(dashboard?.buckets || []).filter((b: any) => b.label !== 'Current').every((b: any) => b.loanCount === 0) && (
                            <tr>
                                <td colSpan={5} className="py-16 text-center text-muted-foreground">No overdue loans — excellent portfolio health! 🎉</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

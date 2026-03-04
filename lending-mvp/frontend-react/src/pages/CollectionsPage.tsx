import { formatCurrency } from '@/lib/utils'
import { AlertTriangle, TrendingDown, Clock, ShieldAlert, Skull } from 'lucide-react'

const bucketIcons = {
    Current: Clock,
    '1-30 DPD': TrendingDown,
    '31-60 DPD': AlertTriangle,
    '61-90 DPD': ShieldAlert,
    '90+ DPD': Skull,
}

const bucketColors = {
    Current: 'from-emerald-500/20 to-emerald-600/10 border-emerald-500/30 text-emerald-400',
    '1-30 DPD': 'from-yellow-500/20 to-yellow-600/10 border-yellow-500/30 text-yellow-400',
    '31-60 DPD': 'from-orange-500/20 to-orange-600/10 border-orange-500/30 text-orange-400',
    '61-90 DPD': 'from-red-500/20 to-red-600/10 border-red-500/30 text-red-400',
    '90+ DPD': 'from-red-700/20 to-red-800/10 border-red-700/30 text-red-300',
}

const MOCK_COLLECTIONS = {
    totalLoans: 150,
    totalOutstanding: 1250000,
    buckets: [
        { label: 'Current', loanCount: 100, totalOutstanding: 800000 },
        { label: '1-30 DPD', loanCount: 20, totalOutstanding: 200000 },
        { label: '31-60 DPD', loanCount: 15, totalOutstanding: 150000 },
        { label: '61-90 DPD', loanCount: 10, totalOutstanding: 75000 },
        { label: '90+ DPD', loanCount: 5, totalOutstanding: 25000 },
    ],
}

const overdueBuckets = ['31-60 DPD', '61-90 DPD', '90+ DPD']

export default function CollectionsPage() {
    const dashboard = MOCK_COLLECTIONS
    const atRiskCount = dashboard.buckets.filter((b: any) => overdueBuckets.includes(b.label)).reduce((s: number, b: any) => s + b.loanCount, 0)
    const atRiskAmount = dashboard.buckets.filter((b: any) => overdueBuckets.includes(b.label)).reduce((s: number, b: any) => s + parseFloat(b.totalOutstanding || 0), 0)
    const parOver30 = dashboard.totalOutstanding > 0 ? (atRiskAmount / dashboard.totalOutstanding) * 100 : 0

    return (
        <div className="space-y-6 animate-fade-in">
            <div>
                <h1 className="text-2xl font-bold text-foreground">Collections Dashboard</h1>
                <p className="text-muted-foreground text-sm mt-1">
                    Portfolio at Risk (PAR) - aging analysis of active loans by days past due
                </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="glass p-5 rounded-xl">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Loans</p>
                    <p className="text-2xl font-bold mt-1">{dashboard.totalLoans}</p>
                </div>
                <div className="glass p-5 rounded-xl">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Outstanding</p>
                    <p className="text-2xl font-bold text-primary mt-1">{formatCurrency(dashboard.totalOutstanding)}</p>
                </div>
                <div className="glass p-5 rounded-xl">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">At Risk</p>
                    <p className="text-2xl font-bold text-red-400 mt-1">{atRiskCount}</p>
                </div>
                <div className="glass p-5 rounded-xl">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">PAR</p>
                    <p className="text-2xl font-bold text-orange-400 mt-1">{parOver30.toFixed(1) + '%'}</p>
                </div>
            </div>

            <div className="space-y-4">
                <h2 className="text-lg font-semibold text-foreground">Collections Aging</h2>
                {dashboard.buckets.map((bucket: any) => (
                    <div key={bucket.label} className="glass rounded-xl p-5">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${bucketColors[bucket.label]} flex items-center justify-center`}>
                                    <bucketIcons[bucket.label] className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="font-medium text-foreground">{bucket.label}</p>
                                    <p className="text-xs text-muted-foreground">{bucket.loanCount} loans</p>
                                </div>
                            </div>
                            <p className="text-lg font-bold text-foreground">{formatCurrency(bucket.totalOutstanding)}</p>
                        </div>
                        <div className="w-full bg-secondary rounded-full h-2">
                            <div
                                className={`h-2 rounded-full ${bucketColors[bucket.label].split(' ')[0].replace('from-', 'bg-')}`}
                                style={{ width: `${(bucket.totalOutstanding / dashboard.totalOutstanding) * 100}%` }}
                            />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

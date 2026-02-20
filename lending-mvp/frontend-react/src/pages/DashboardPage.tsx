import { useQuery } from '@apollo/client'
import { GET_DASHBOARD_STATS } from '@/api/queries'
import { formatCurrency } from '@/lib/utils'
import {
    Users,
    PiggyBank,
    CreditCard,
    AlertCircle,
    TrendingUp,
    DollarSign,
    Activity,
} from 'lucide-react'
import {
    ResponsiveContainer,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
} from 'recharts'

// Mock chart data — replace with real data from API when available
const portfolioData = [
    { month: 'Aug', loans: 420000, savings: 180000 },
    { month: 'Sep', loans: 510000, savings: 220000 },
    { month: 'Oct', loans: 480000, savings: 260000 },
    { month: 'Nov', loans: 620000, savings: 310000 },
    { month: 'Dec', loans: 590000, savings: 350000 },
    { month: 'Jan', loans: 720000, savings: 410000 },
    { month: 'Feb', loans: 800000, savings: 460000 },
]

interface StatCardProps {
    title: string
    value: string
    subtitle?: string
    icon: React.ElementType
    gradient: string
    trend?: string
}

function StatCard({ title, value, subtitle, icon: Icon, gradient, trend }: StatCardProps) {
    return (
        <div className="stat-card group">
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{title}</p>
                    <p className="text-2xl font-bold text-foreground mt-1">{value}</p>
                    {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
                </div>
                <div className={`w-10 h-10 rounded-xl ${gradient} flex items-center justify-center shadow-lg flex-shrink-0`}>
                    <Icon className="w-5 h-5 text-white" />
                </div>
            </div>
            {trend && (
                <div className="flex items-center gap-1 text-xs text-emerald-400">
                    <TrendingUp className="w-3 h-3" />
                    {trend}
                </div>
            )}
        </div>
    )
}

export default function DashboardPage() {
    const { data, loading } = useQuery(GET_DASHBOARD_STATS)

    const totalCustomers = data?.customers?.length ?? 0
    const totalSavings = data?.savingsAccounts?.accounts?.reduce(
        (sum: number, a: { balance: number }) => sum + (a.balance || 0), 0
    ) ?? 0
    const totalLoans = data?.loans?.total ?? 0
    const activeLoans = data?.loans?.loans?.filter((l: { status: string }) => l.status === 'active').length ?? 0
    const overdueLoans = data?.loans?.loans?.filter(
        (l: { status: string }) => l.status === 'overdue' || l.status === 'defaulted'
    ).length ?? 0

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
                <p className="text-muted-foreground text-sm mt-1">
                    Overview of your lending portfolio
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                <StatCard
                    title="Total Customers"
                    value={loading ? '—' : totalCustomers.toLocaleString()}
                    subtitle="Registered members"
                    icon={Users}
                    gradient="gradient-primary"
                    trend="+12% this month"
                />
                <StatCard
                    title="Savings Portfolio"
                    value={loading ? '—' : formatCurrency(totalSavings)}
                    subtitle="Total deposits"
                    icon={PiggyBank}
                    gradient="gradient-success"
                    trend="+8.3% this month"
                />
                <StatCard
                    title="Loan Portfolio"
                    value={loading ? '—' : formatCurrency(totalLoans)}
                    subtitle={`${activeLoans} active loans`}
                    icon={CreditCard}
                    gradient="gradient-warning"
                />
                <StatCard
                    title="Overdue Loans"
                    value={loading ? '—' : overdueLoans.toString()}
                    subtitle="Require attention"
                    icon={AlertCircle}
                    gradient="gradient-danger"
                />
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                {/* Portfolio Chart */}
                <div className="xl:col-span-2 glass rounded-xl p-5">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h2 className="font-semibold text-foreground">Portfolio Overview</h2>
                            <p className="text-xs text-muted-foreground">Loans vs Savings (last 7 months)</p>
                        </div>
                        <Activity className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <ResponsiveContainer width="100%" height={220}>
                        <AreaChart data={portfolioData} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorLoans" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="colorSavings" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="hsl(155, 60%, 45%)" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="hsl(155, 60%, 45%)" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(217, 32%, 17%)" />
                            <XAxis dataKey="month" tick={{ fill: 'hsl(215, 20%, 65%)', fontSize: 11 }} axisLine={false} tickLine={false} />
                            <YAxis tickFormatter={(v) => `₱${(v / 1000).toFixed(0)}k`} tick={{ fill: 'hsl(215, 20%, 65%)', fontSize: 11 }} axisLine={false} tickLine={false} />
                            <Tooltip
                                contentStyle={{ background: 'hsl(222, 84%, 6%)', border: '1px solid hsl(217, 32%, 17%)', borderRadius: '8px', fontSize: '12px' }}
                                formatter={(value: number) => [formatCurrency(value), '']}
                            />
                            <Area type="monotone" dataKey="loans" stroke="hsl(217, 91%, 60%)" fill="url(#colorLoans)" strokeWidth={2} name="Loans" />
                            <Area type="monotone" dataKey="savings" stroke="hsl(155, 60%, 45%)" fill="url(#colorSavings)" strokeWidth={2} name="Savings" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                {/* Quick Actions */}
                <div className="glass rounded-xl p-5">
                    <div className="flex items-center gap-2 mb-4">
                        <DollarSign className="w-4 h-4 text-muted-foreground" />
                        <h2 className="font-semibold text-foreground">Quick Actions</h2>
                    </div>
                    <div className="space-y-2">
                        {[
                            { label: 'New Customer', to: '/customers', color: 'bg-primary/15 hover:bg-primary/25 border-primary/20 text-primary' },
                            { label: 'Open Savings Account', to: '/savings', color: 'bg-emerald-500/15 hover:bg-emerald-500/25 border-emerald-500/20 text-emerald-400' },
                            { label: 'Create Loan', to: '/loans', color: 'bg-yellow-500/15 hover:bg-yellow-500/25 border-yellow-500/20 text-yellow-400' },
                            { label: 'Record Transaction', to: '/transactions', color: 'bg-purple-500/15 hover:bg-purple-500/25 border-purple-500/20 text-purple-400' },
                        ].map((action) => (
                            <a
                                key={action.label}
                                href={action.to}
                                className={`block w-full px-4 py-3 rounded-lg border text-sm font-medium transition-all duration-200 ${action.color}`}
                            >
                                {action.label}
                            </a>
                        ))}
                    </div>

                    {/* Legend */}
                    <div className="mt-6 pt-4 border-t border-border/50 space-y-2">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Legend</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <div className="w-3 h-0.5 bg-primary rounded" /> Loan Portfolio
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <div className="w-3 h-0.5 rounded" style={{ background: 'hsl(155, 60%, 45%)' }} /> Savings Portfolio
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

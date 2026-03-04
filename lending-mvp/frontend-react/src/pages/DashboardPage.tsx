import { useState, useEffect } from 'react'
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
import { getDashboardStats } from '@/api/client'
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'

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
    const [stats, setStats] = useState({ dashboardStats: { customersTotal: 0, loansTotal: 0 } })
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchDashboardStats = async () => {
            try {
                const data = await getDashboardStats()
                setStats(data.data?.dashboardStats || { dashboardStats: { customersTotal: 0, loansTotal: 0 } })
            } catch (error) {
                console.error('Failed to fetch dashboard stats:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchDashboardStats()
    }, [])

    const totalCustomers = stats.dashboardStats?.customersTotal ?? 0
    const totalLoans = stats.dashboardStats?.loansTotal ?? 0
    const totalSavings = 0 // Not available in current schema
    const activeLoans = totalLoans // Using loansTotal as active loans for display
    const overdueLoans = Math.floor(totalLoans * 0.1) // Mock value: 10% of loans are overdue
    const totalPortfolio = totalLoans * 1000 // Mock value: loans * 1000

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
                    value={loading ? '—' : formatCurrency(totalPortfolio)}
                    subtitle={`${activeLoans} active loans`}
                    icon={CreditCard}
                    gradient="gradient-warning"
                    trend="+5.2% this month"
                />
                <StatCard
                    title="Overdue Loans"
                    value={loading ? '—' : overdueLoans.toString()}
                    subtitle="Requires attention"
                    icon={AlertCircle}
                    gradient="gradient-destructive"
                    trend="-3 this week"
                />
            </div>

            {/* Portfolio Chart */}
            <div className="glass rounded-2xl p-6 shadow-xl">
                <h2 className="text-lg font-semibold text-foreground mb-4">Portfolio Performance</h2>
                <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={portfolioData}>
                            <defs>
                                <linearGradient id="colorLoans" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                                    <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                                </linearGradient>
                                <linearGradient id="colorSavings" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8}/>
                                    <stop offset="95%" stopColor="#82ca9d" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <XAxis dataKey="month" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `₱${value/1000}k`} />
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <Tooltip 
                                contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px' }}
                                itemStyle={{ color: '#fff' }}
                            />
                            <Area type="monotone" dataKey="loans" stroke="#8884d8" fillOpacity={1} fill="url(#colorLoans)" />
                            <Area type="monotone" dataKey="savings" stroke="#82ca9d" fillOpacity={1} fill="url(#colorSavings)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    )
}

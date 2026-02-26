import { useQuery } from '@apollo/client'
import { GET_CUSTOMER_PORTAL_STATS, GET_CUSTOMER_LOANS, GET_CUSTOMER_SAVINGS } from '@/api/queries'
import { formatCurrency } from '@/lib/utils'
import {
    CreditCard,
    PiggyBank,
    TrendingUp,
    DollarSign,
    Clock,
    AlertCircle,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Link } from 'react-router-dom'

function StatCard({ title, value, subtitle, icon: Icon, gradient, trend }: any) {
    return (
        <div className="bg-card border rounded-xl p-6 shadow-sm">
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{title}</p>
                    <p className="text-2xl font-bold text-foreground mt-1">{value}</p>
                    {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
                </div>
                <div className={`w-12 h-12 rounded-xl ${gradient} flex items-center justify-center shadow-lg`}>
                    <Icon className="w-6 h-6 text-white" />
                </div>
            </div>
            {trend && (
                <div className="flex items-center gap-1 text-xs text-emerald-500 mt-2">
                    <TrendingUp className="w-3 h-3" />
                    {trend}
                </div>
            )}
        </div>
    )
}

export default function CustomerDashboardPage() {
    const { data: loansData, loading: loansLoading } = useQuery(GET_CUSTOMER_LOANS)
    const { data: savingsData, loading: savingsLoading } = useQuery(GET_CUSTOMER_SAVINGS)
    
    const totalLoans = loansData?.loans?.loans?.length ?? 0
    const activeLoans = loansData?.loans?.loans?.filter((l: any) => l.status === 'active').length ?? 0
    const overdueLoans = loansData?.loans?.loans?.filter(
        (l: any) => l.status === 'overdue' || l.status === 'defaulted'
    ).length ?? 0
    
    const totalSavings = savingsData?.savingsAccounts?.accounts?.reduce(
        (sum: number, a: any) => sum + (a.balance || 0), 0
    ) ?? 0
    
    const nextDueLoan = loansData?.loans?.loans?.find((l: any) => l.status === 'active')

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
                    <p className="text-muted-foreground text-sm mt-1">
                        Overview of your financial accounts
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" asChild>
                        <Link to="/loans/new">New Loan Application</Link>
                    </Button>
                    <Button variant="outline" asChild>
                        <Link to="/transfer">Transfer Funds</Link>
                    </Button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                <StatCard
                    title="Total Loans"
                    value={loansLoading ? '—' : totalLoans.toLocaleString()}
                    subtitle="All active and past loans"
                    icon={CreditCard}
                    gradient="gradient-primary"
                    trend={activeLoans > 0 ? `${activeLoans} active` : undefined}
                />
                <StatCard
                    title="Savings Balance"
                    value={savingsLoading ? '—' : formatCurrency(totalSavings)}
                    subtitle="Total across all accounts"
                    icon={PiggyBank}
                    gradient="gradient-success"
                    trend={totalSavings > 0 ? 'Active accounts' : undefined}
                />
                <StatCard
                    title="Overdue Loans"
                    value={loansLoading ? '—' : overdueLoans.toString()}
                    subtitle="Past due payments"
                    icon={AlertCircle}
                    gradient="gradient-warning"
                />
                <StatCard
                    title="Next Due Date"
                    value={nextDueLoan?.next_due_date ? new Date(nextDueLoan.next_due_date).toLocaleDateString() : 'N/A'}
                    subtitle={nextDueLoan?.product_name || 'No active loans'}
                    icon={Clock}
                    gradient="gradient-info"
                />
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-primary" />
                            Make a Payment
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground mb-4">
                            Pay your loan installments quickly and securely
                        </p>
                        <Button variant="secondary" className="w-full" asChild>
                            <Link to="/payments">Go to Payments</Link>
                        </Button>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <PiggyBank className="w-5 h-5 text-success" />
                            Transfer Funds
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground mb-4">
                            Send money to other accounts or request transfers
                        </p>
                        <Button variant="secondary" className="w-full" asChild>
                            <Link to="/transfer">Start Transfer</Link>
                        </Button>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Clock className="w-5 h-5 text-info" />
                            View Statements
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground mb-4">
                            Download your account statements and transaction history
                        </p>
                        <Button variant="secondary" className="w-full" asChild>
                            <Link to="/statements">View Statements</Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>

            {/* Recent Activity */}
            <Card>
                <CardHeader>
                    <CardTitle>Recent Loans</CardTitle>
                </CardHeader>
                <CardContent>
                    {loansLoading ? (
                        <div className="text-center py-8 text-muted-foreground">Loading...</div>
                    ) : (
                        <div className="space-y-4">
                            {loansData?.loans?.loans?.slice(0, 3).map((loan: any) => (
                                <div key={loan.id} className="flex items-center justify-between p-4 border rounded-lg">
                                    <div>
                                        <p className="font-semibold">{loan.product_name}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {loan.status === 'active' ? 'Active' : loan.status.charAt(0).toUpperCase() + loan.status.slice(1)}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold">{formatCurrency(loan.principal)}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {loan.next_due_date ? `Next: ${new Date(loan.next_due_date).toLocaleDateString()}` : 'No upcoming payments'}
                                        </p>
                                    </div>
                                </div>
                            ))}
                            {loansData?.loans?.loans?.length === 0 && (
                                <div className="text-center py-8 text-muted-foreground">
                                    No loans found
                                </div>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Recent Savings Activity */}
            <Card>
                <CardHeader>
                    <CardTitle>Recent Savings Activity</CardTitle>
                </CardHeader>
                <CardContent>
                    {savingsLoading ? (
                        <div className="text-center py-8 text-muted-foreground">Loading...</div>
                    ) : (
                        <div className="space-y-4">
                            {savingsData?.savingsAccounts?.accounts?.slice(0, 3).map((account: any) => (
                                <div key={account.id} className="flex items-center justify-between p-4 border rounded-lg">
                                    <div>
                                        <p className="font-semibold">{account.account_name}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {account.account_type}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-success">{formatCurrency(account.balance)}</p>
                                        <p className="text-xs text-muted-foreground">
                                            Rate: {account.interest_rate}%
                                        </p>
                                    </div>
                                </div>
                            ))}
                            {savingsData?.savingsAccounts?.accounts?.length === 0 && (
                                <div className="text-center py-8 text-muted-foreground">
                                    No savings accounts found
                                </div>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
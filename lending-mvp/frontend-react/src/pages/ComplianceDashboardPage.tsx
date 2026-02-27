import { useQuery, useMutation } from '@apollo/client';
import {
    GET_AML_ALERTS,
    GET_PAR_METRICS,
    GET_NPL_METRICS,
    GET_LLR_METRICS,
    GET_INCOME_STATEMENT,
    GET_BALANCE_SHEET,
    GET_UNRESOLVED_ALERTS,
    RESOLVE_ALERT,
    ESCALATE_ALERT,
    RUN_COMPLIANCE_REPORTS
} from '@/api/queries';
import { formatCurrency, formatDate } from '@/lib/utils';
import { ShieldAlert, AlertTriangle, CheckCircle, Clock, TrendingUp, FileText, RefreshCw, ArrowRight, AlertCircle, Activity, BarChart3 } from 'lucide-react';
import { useState } from 'react';

interface Alert {
    id: number;
    customer_id: string;
    alert_type: string;
    severity: 'low' | 'medium' | 'high';
    description: string;
    reported_at: string;
    status: string;
}





export default function ComplianceDashboard() {
    const [activeTab, setActiveTab] = useState<'alerts' | 'reports' | 'metrics'>('alerts');
    const [severityFilter, setSeverityFilter] = useState<string>('all');
    const [reportType, setReportType] = useState<string>('daily');

    // Queries
    const { data: alertsData, refetch: refetchAlerts } = useQuery(GET_AML_ALERTS, {
        variables: { skip: 0, limit: 50 }
    });

    const { data: parData } = useQuery(GET_PAR_METRICS);
    const { data: nplData } = useQuery(GET_NPL_METRICS);
    const { data: llrData } = useQuery(GET_LLR_METRICS);

    const { data: incomeData, refetch: refetchIncome } = useQuery(GET_INCOME_STATEMENT, {
        variables: {
            period_start: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString(),
            period_end: new Date().toISOString()
        }
    });

    const { data: balanceData, refetch: refetchBalance } = useQuery(GET_BALANCE_SHEET, {
        variables: { as_of_date: new Date().toISOString() }
    });

    const { data: unresolvedData } = useQuery(GET_UNRESOLVED_ALERTS);
    const [runReports] = useMutation(RUN_COMPLIANCE_REPORTS);

    const alerts = alertsData?.getAmlAlerts?.alerts || [];
    const unresolvedAlerts = unresolvedData?.getUnresolvedAlerts?.alerts || [];

    // Filter alerts
    const filteredAlerts = severityFilter === 'all'
        ? alerts
        : alerts.filter((a: Alert) => a.severity === severityFilter);

    // Calculate summary stats
    const unresolvedCount = unresolvedAlerts.length;
    const highSeverityCount = alerts.filter((a: Alert) => a.severity === 'high').length;
    const pendingReviewCount = alerts.filter((a: Alert) => a.status === 'pending_review').length;

    const handleGenerateReport = async () => {
        try {
            await runReports({ variables: { report_type: reportType } });
            if (reportType === 'daily') await refetchAlerts();
            if (reportType === 'monthly') {
                await refetchIncome();
                await refetchBalance();
            }
            alert('Report generated successfully');
        } catch (error: any) {
            alert('Failed to generate report: ' + error.message);
        }
    };



    // PAR Metric Cards
    const ParCard = ({ title, data, color }: { title: string, data: any, color: string }) => (
        <div className={`glass p-5 rounded-xl border-l-4 ${color}`}>
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">{title}</h3>
                {title === 'PAR90+' && <ShieldAlert className="w-5 h-5 text-red-500" />}
                {title === 'PAR30-90' && <AlertTriangle className="w-5 h-5 text-orange-500" />}
                {title === 'PAR7-30' && <Clock className="w-5 h-5 text-yellow-500" />}
                {title === 'PAR1-7' && <Activity className="w-5 h-5 text-blue-500" />}
                {title === 'Current' && <CheckCircle className="w-5 h-5 text-emerald-500" />}
            </div>
            <p className="text-3xl font-bold">{data.loan_count}</p>
            <p className="text-sm text-muted-foreground">loans</p>
            <p className="text-lg font-semibold mt-2">{formatCurrency(data.amount)}</p>
            <p className="text-xs text-muted-foreground mt-1">{data.percentage}% of portfolio</p>
        </div>
    );

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">AML Compliance Dashboard</h1>
                    <p className="text-muted-foreground text-sm mt-1">
                        BSP Circular 1048 & RA 9160 Compliance Monitoring
                    </p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => handleGenerateReport()}
                        className="flex items-center gap-2 px-4 py-2 gradient-primary text-white text-sm font-semibold rounded-lg shadow-lg hover:opacity-90 transition-all"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Generate Report
                    </button>
                </div>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="glass p-5 rounded-xl">
                    <div className="flex items-center gap-3 mb-3">
                        <Activity className="w-6 h-6 text-blue-500" />
                        <p className="text-sm text-muted-foreground uppercase tracking-wider">Total Alerts</p>
                    </div>
                    <p className="text-3xl font-bold">{alerts.length}</p>
                    <p className="text-xs text-muted-foreground mt-1">All time alerts</p>
                </div>
                <div className="glass p-5 rounded-xl">
                    <div className="flex items-center gap-3 mb-3">
                        <AlertCircle className="w-6 h-6 text-red-500" />
                        <p className="text-sm text-muted-foreground uppercase tracking-wider">Unresolved</p>
                    </div>
                    <p className="text-3xl font-bold text-red-500">{unresolvedCount}</p>
                    <p className="text-xs text-muted-foreground mt-1">Pending action</p>
                </div>
                <div className="glass p-5 rounded-xl">
                    <div className="flex items-center gap-3 mb-3">
                        <ShieldAlert className="w-6 h-6 text-orange-500" />
                        <p className="text-sm text-muted-foreground uppercase tracking-wider">High Severity</p>
                    </div>
                    <p className="text-3xl font-bold text-orange-500">{highSeverityCount}</p>
                    <p className="text-xs text-muted-foreground mt-1">Requires immediate review</p>
                </div>
                <div className="glass p-5 rounded-xl">
                    <div className="flex items-center gap-3 mb-3">
                        <Clock className="w-6 h-6 text-yellow-500" />
                        <p className="text-sm text-muted-foreground uppercase tracking-wider">Pending Review</p>
                    </div>
                    <p className="text-3xl font-bold text-yellow-500">{pendingReviewCount}</p>
                    <p className="text-xs text-muted-foreground mt-1">In investigation</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-border">
                <button
                    onClick={() => setActiveTab('alerts')}
                    className={`px-6 py-3 font-medium text-sm transition-colors ${activeTab === 'alerts'
                        ? 'border-b-2 border-primary text-primary'
                        : 'text-muted-foreground hover:text-foreground'
                        }`}
                >
                    AML Alerts
                </button>
                <button
                    onClick={() => setActiveTab('reports')}
                    className={`px-6 py-3 font-medium text-sm transition-colors ${activeTab === 'reports'
                        ? 'border-b-2 border-primary text-primary'
                        : 'text-muted-foreground hover:text-foreground'
                        }`}
                >
                    Reports & Statements
                </button>
                <button
                    onClick={() => setActiveTab('metrics')}
                    className={`px-6 py-3 font-medium text-sm transition-colors ${activeTab === 'metrics'
                        ? 'border-b-2 border-primary text-primary'
                        : 'text-muted-foreground hover:text-foreground'
                        }`}
                >
                    Portfolio Metrics
                </button>
            </div>

            {/* Alerts Tab */}
            {activeTab === 'alerts' && (
                <div className="space-y-6 animate-fade-in">
                    {/* Filter */}
                    <div className="flex items-center gap-4">
                        <label className="text-sm font-medium text-muted-foreground">Filter Severity:</label>
                        <select
                            value={severityFilter}
                            onChange={(e) => setSeverityFilter(e.target.value)}
                            className="px-4 py-2 bg-secondary/50 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                        >
                            <option value="all">All Severities</option>
                            <option value="high">High</option>
                            <option value="medium">Medium</option>
                            <option value="low">Low</option>
                        </select>
                    </div>

                    {/* Alerts Table */}
                    <div className="glass rounded-xl overflow-hidden">
                        <div className="px-5 py-3 border-b border-border/50 bg-secondary/20">
                            <h3 className="font-semibold">AML Alert Cases</h3>
                        </div>
                        <table className="w-full text-sm">
                            <thead className="bg-secondary/40">
                                <tr>
                                    <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Alert ID</th>
                                    <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Customer</th>
                                    <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Type</th>
                                    <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Severity</th>
                                    <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Status</th>
                                    <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Reported At</th>
                                    <th className="px-4 py-3 text-right font-semibold text-muted-foreground">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredAlerts.map((alert: Alert) => (
                                    <tr key={alert.id} className="border-t border-border/50 hover:bg-secondary/20">
                                        <td className="px-4 py-3 font-mono text-sm text-primary">{alert.id}</td>
                                        <td className="px-4 py-3 text-sm font-medium text-foreground">{alert.customer_id}</td>
                                        <td className="px-4 py-3 capitalize">{alert.alert_type}</td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-0.5 text-xs font-bold rounded ${alert.severity === 'high' ? 'bg-red-500/10 text-red-500' :
                                                alert.severity === 'medium' ? 'bg-yellow-500/10 text-yellow-500' :
                                                    'bg-blue-500/10 text-blue-500'
                                                }`}>
                                                {alert.severity.toUpperCase()}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 capitalize">{alert.status.replace('_', ' ')}</td>
                                        <td className="px-4 py-3 text-muted-foreground">{formatDate(alert.reported_at)}</td>
                                        <td className="px-4 py-3">
                                            <div className="flex justify-end gap-2">
                                                <button className="p-2 hover:bg-secondary/50 rounded transition-colors">
                                                    <FileText className="w-4 h-4 text-muted-foreground" />
                                                </button>
                                                <button className="p-2 hover:bg-secondary/50 rounded transition-colors">
                                                    <ArrowRight className="w-4 h-4 text-muted-foreground" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {filteredAlerts.length === 0 && (
                                    <tr>
                                        <td colSpan={7} className="py-16 text-center text-muted-foreground">
                                            No alerts found matching the filter criteria
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Reports Tab */}
            {activeTab === 'reports' && (
                <div className="space-y-6 animate-fade-in">
                    {/* Report Selector */}
                    <div className="glass p-6 rounded-xl">
                        <div className="flex items-center gap-4 mb-6">
                            <FileText className="w-6 h-6 text-primary" />
                            <div>
                                <h3 className="text-lg font-semibold">Generate Reports</h3>
                                <p className="text-sm text-muted-foreground">Select report type to generate</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                            <button
                                onClick={() => setReportType('daily')}
                                className={`p-4 rounded-xl border-2 transition-all ${reportType === 'daily'
                                    ? 'border-primary bg-primary/5'
                                    : 'border-border hover:border-primary/50'
                                    }`}
                            >
                                <div className="flex items-center gap-3 mb-2">
                                    <RefreshCw className="w-5 h-5 text-primary" />
                                    <span className="font-semibold">Daily Report</span>
                                </div>
                                <p className="text-sm text-muted-foreground">Daily AML metrics and alerts summary</p>
                            </button>

                            <button
                                onClick={() => setReportType('weekly')}
                                className={`p-4 rounded-xl border-2 transition-all ${reportType === 'weekly'
                                    ? 'border-primary bg-primary/5'
                                    : 'border-border hover:border-primary/50'
                                    }`}
                            >
                                <div className="flex items-center gap-3 mb-2">
                                    <Activity className="w-5 h-5 text-primary" />
                                    <span className="font-semibold">Weekly Report</span>
                                </div>
                                <p className="text-sm text-muted-foreground">Weekly portfolio analysis and income statement</p>
                            </button>

                            <button
                                onClick={() => setReportType('monthly')}
                                className={`p-4 rounded-xl border-2 transition-all ${reportType === 'monthly'
                                    ? 'border-primary bg-primary/5'
                                    : 'border-border hover:border-primary/50'
                                    }`}
                            >
                                <div className="flex items-center gap-3 mb-2">
                                    <BarChart3 className="w-5 h-5 text-primary" />
                                    <span className="font-semibold">Monthly Report</span>
                                </div>
                                <p className="text-sm text-muted-foreground">Monthly financial statements and period closing</p>
                            </button>
                        </div>

                        <button
                            onClick={handleGenerateReport}
                            className="w-full py-3 gradient-primary text-white font-semibold rounded-lg shadow-lg hover:opacity-90 transition-all flex items-center justify-center gap-2"
                        >
                            <RefreshCw className="w-5 h-5" />
                            Generate {reportType === 'daily' ? 'Daily' : reportType === 'weekly' ? 'Weekly' : 'Monthly'} Report
                        </button>
                    </div>

                    {/* Financial Statements */}
                    {reportType === 'monthly' && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Income Statement */}
                            <div className="glass p-6 rounded-xl">
                                <div className="flex items-center gap-3 mb-6">
                                    <TrendingUp className="w-6 h-6 text-emerald-500" />
                                    <h3 className="text-lg font-semibold">Income Statement (P&L)</h3>
                                </div>

                                {incomeData?.getIncomeStatement && (
                                    <div className="space-y-4">
                                        <div className="border-b border-border/50 pb-4">
                                            <p className="text-sm text-muted-foreground uppercase tracking-wider">Revenues</p>
                                            <div className="flex justify-between mt-2">
                                                <span className="text-muted-foreground">Interest Income</span>
                                                <span className="font-medium">{formatCurrency(incomeData.getIncomeStatement.revenues.interest_income)}</span>
                                            </div>
                                            <div className="flex justify-between mt-1">
                                                <span className="text-muted-foreground">Fee Income</span>
                                                <span className="font-medium">{formatCurrency(incomeData.getIncomeStatement.revenues.fee_income)}</span>
                                            </div>
                                            <div className="flex justify-between mt-1">
                                                <span className="text-muted-foreground">Penalty Income</span>
                                                <span className="font-medium">{formatCurrency(incomeData.getIncomeStatement.revenues.penalty_income)}</span>
                                            </div>
                                            <div className="flex justify-between mt-2 border-t border-border/50 pt-2">
                                                <span className="font-semibold">Total Revenue</span>
                                                <span className="font-bold">{formatCurrency(incomeData.getIncomeStatement.revenues.total_revenues)}</span>
                                            </div>
                                        </div>

                                        <div className="border-b border-border/50 pb-4">
                                            <p className="text-sm text-muted-foreground uppercase tracking-wider">Expenses</p>
                                            <div className="flex justify-between mt-2">
                                                <span className="text-muted-foreground">Interest Expense</span>
                                                <span className="font-medium">{formatCurrency(incomeData.getIncomeStatement.expenses.interest_expense)}</span>
                                            </div>
                                            <div className="flex justify-between mt-1">
                                                <span className="text-muted-foreground">Salaries Expense</span>
                                                <span className="font-medium">{formatCurrency(incomeData.getIncomeStatement.expenses.salaries_expense)}</span>
                                            </div>
                                            <div className="flex justify-between mt-1">
                                                <span className="text-muted-foreground">Loan Loss Expense</span>
                                                <span className="font-medium">{formatCurrency(incomeData.getIncomeStatement.expenses.loan_loss_expense)}</span>
                                            </div>
                                            <div className="flex justify-between mt-2 border-t border-border/50 pt-2">
                                                <span className="font-semibold">Total Expenses</span>
                                                <span className="font-medium">{formatCurrency(incomeData.getIncomeStatement.expenses.total_expenses)}</span>
                                            </div>
                                        </div>

                                        <div className="flex justify-between mt-4 border-t-2 border-border/50 pt-4">
                                            <span className="text-lg font-semibold">Net Income</span>
                                            <span className="text-lg font-bold text-emerald-500">{formatCurrency(incomeData.getIncomeStatement.net_income)}</span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Balance Sheet */}
                            <div className="glass p-6 rounded-xl">
                                <div className="flex items-center gap-3 mb-6">
                                    <Activity className="w-6 h-6 text-primary" />
                                    <h3 className="text-lg font-semibold">Balance Sheet</h3>
                                </div>

                                {balanceData?.getBalanceSheet && (
                                    <div className="space-y-4">
                                        <div className="border-b border-border/50 pb-4">
                                            <p className="text-sm text-muted-foreground uppercase tracking-wider">Assets</p>
                                            <div className="flex justify-between mt-2">
                                                <span className="text-muted-foreground">Loans Receivable</span>
                                                <span className="font-medium">{formatCurrency(balanceData.getBalanceSheet.assets.non_current_assets.loans_receivable)}</span>
                                            </div>
                                            <div className="flex justify-between mt-1">
                                                <span className="text-muted-foreground">Cash</span>
                                                <span className="font-medium">{formatCurrency(balanceData.getBalanceSheet.assets.current_assets.cash)}</span>
                                            </div>
                                            <div className="flex justify-between mt-2 border-t border-border/50 pt-2">
                                                <span className="font-semibold">Total Assets</span>
                                                <span className="font-bold">{formatCurrency(balanceData.getBalanceSheet.assets.non_current_assets.total_assets)}</span>
                                            </div>
                                        </div>

                                        <div className="border-b border-border/50 pb-4">
                                            <p className="text-sm text-muted-foreground uppercase tracking-wider">Liabilities</p>
                                            <div className="flex justify-between mt-2">
                                                <span className="text-muted-foreground">Accounts Payable</span>
                                                <span className="font-medium">{formatCurrency(balanceData.getBalanceSheet.liabilities.current_liabilities.accounts_payable)}</span>
                                            </div>
                                            <div className="flex justify-between mt-2 border-t border-border/50 pt-2">
                                                <span className="font-semibold">Total Liabilities</span>
                                                <span className="font-medium">{formatCurrency(balanceData.getBalanceSheet.liabilities.total_liabilities)}</span>
                                            </div>
                                        </div>

                                        <div>
                                            <p className="text-sm text-muted-foreground uppercase tracking-wider">Equity</p>
                                            <div className="flex justify-between mt-2">
                                                <span className="text-muted-foreground">Share Capital</span>
                                                <span className="font-medium">{formatCurrency(balanceData.getBalanceSheet.equity.share_capital)}</span>
                                            </div>
                                            <div className="flex justify-between mt-1">
                                                <span className="text-muted-foreground">Retained Earnings</span>
                                                <span className="font-medium">{formatCurrency(balanceData.getBalanceSheet.equity.retained_earnings)}</span>
                                            </div>
                                            <div className="flex justify-between mt-2 border-t-2 border-border/50 pt-4">
                                                <span className="text-lg font-semibold">Total Equity</span>
                                                <span className="text-lg font-bold">{formatCurrency(balanceData.getBalanceSheet.equity.total_equity)}</span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Metrics Tab */}
            {activeTab === 'metrics' && (
                <div className="space-y-6 animate-fade-in">
                    {/* PAR Metrics */}
                    <div>
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <Activity className="w-5 h-5 text-primary" />
                            Portfolio At Risk (PAR)
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                            <ParCard title="Current" data={parData?.getParMetrics?.current || {}} color="border-emerald-500" />
                            <ParCard title="PAR1-7" data={parData?.getParMetrics?.par1 || {}} color="border-blue-500" />
                            <ParCard title="PAR7-30" data={parData?.getParMetrics?.par7 || {}} color="border-yellow-500" />
                            <ParCard title="PAR30-90" data={parData?.getParMetrics?.par30 || {}} color="border-orange-500" />
                            <ParCard title="PAR90+" data={parData?.getParMetrics?.par90 || {}} color="border-red-500" />
                        </div>
                    </div>

                    {/* NPL Metrics */}
                    <div className="glass p-6 rounded-xl">
                        <div className="flex items-center gap-3 mb-6">
                            <ShieldAlert className="w-6 h-6 text-red-500" />
                            <h3 className="text-lg font-semibold">Non-Performing Loans (NPL)</h3>
                        </div>

                        {nplData?.getNplMetrics && (
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                <div className="text-center">
                                    <p className="text-sm text-muted-foreground uppercase tracking-wider">Total Loans</p>
                                    <p className="text-3xl font-bold mt-1">{nplData.getNplMetrics.total_loans}</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-sm text-muted-foreground uppercase tracking-wider">NPL Count</p>
                                    <p className="text-3xl font-bold text-red-500 mt-1">{nplData.getNplMetrics.npl_count}</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-sm text-muted-foreground uppercase tracking-wider">NPL Amount</p>
                                    <p className="text-3xl font-bold text-red-500 mt-1">{formatCurrency(nplData.getNplMetrics.npl_amount)}</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-sm text-muted-foreground uppercase tracking-wider">NPL Ratio</p>
                                    <p className="text-3xl font-bold text-red-500 mt-1">{nplData.getNplMetrics.npl_ratio}%</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* LLR Metrics */}
                    <div className="glass p-6 rounded-xl">
                        <div className="flex items-center gap-3 mb-6">
                            <Activity className="w-6 h-6 text-blue-500" />
                            <h3 className="text-lg font-semibold">Loan Loss Reserve (LLR)</h3>
                        </div>

                        {llrData?.getLlrMetrics && (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div>
                                    <p className="text-sm text-muted-foreground uppercase tracking-wider">Total Loans Outstanding</p>
                                    <p className="text-2xl font-bold mt-1">{formatCurrency(llrData.getLlrMetrics.total_loans_outstanding)}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground uppercase tracking-wider">Required LLR</p>
                                    <p className="text-2xl font-bold text-blue-500 mt-1">{formatCurrency(llrData.getLlrMetrics.llr_required)}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground uppercase tracking-wider">Provision Required</p>
                                    <p className="text-2xl font-bold text-blue-500 mt-1">{formatCurrency(llrData.getLlrMetrics.llr_needed)}</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
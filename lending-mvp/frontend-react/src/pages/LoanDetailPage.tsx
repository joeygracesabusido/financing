import { useState, useEffect } from 'react'
import { ArrowLeft, FileText, CheckCircle, XCircle, AlertCircle, PlayCircle, Eye, Wallet, Banknote } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { getLoan, submitLoan, reviewLoan, approveLoan, rejectLoan, disburseLoan, repayLoan } from '@/api/loans'
import { GET_LOAN_TRANSACTIONS } from '@/api/queries'

export default function LoanDetailPage() {
    const { user } = useAuth()
    const navigate = useNavigate()
    const { id } = useParams()
    const isOfficer = user?.role === 'admin' || user?.role === 'loan_officer' || user?.role === 'branch_manager'

    const [loading, setLoading] = useState(true)
    const [loan, setLoan] = useState<any>(null)
    const [transactions, setTransactions] = useState<any[]>([])
    const [loadingTransactions, setLoadingTransactions] = useState(false)
    const [error, setError] = useState('')
    const [actionLoading, setActionLoading] = useState(false)
    
    // Approval inputs
    const [inputApprovedPrincipal, setInputApprovedPrincipal] = useState<string>('')
    const [inputApprovedRate, setInputApprovedRate] = useState<string>('')
    
    // Disbursement inputs
    const [disbursementMethod, setDisbursementMethod] = useState<string>('cash')

    // Repayment inputs
    const [repayAmount, setRepayAmount] = useState<string>('')
    const [repayDate, setRepayDate] = useState<string>(new Date().toISOString().split('T')[0])

    const loadTransactions = async () => {
        setLoadingTransactions(true)
        try {
            const token = localStorage.getItem('access_token')
            const res = await fetch('/graphql', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': token ? `Bearer ${token}` : ''
                },
                body: JSON.stringify({
                    query: GET_LOAN_TRANSACTIONS,
                    variables: { loanId: id }
                })
            })
            const data = await res.json()
            setTransactions(data.data?.loanTransactions || [])
        } catch (e) {
            console.error('Failed to load transactions:', e)
        } finally {
            setLoadingTransactions(false)
        }
    }

    const loadLoan = async () => {
        try {
            const data = await getLoan(id || '')
            const loanData = data.data?.loan
            setLoan(loanData)
            
            // Initialize approval inputs with original values if not yet approved
            if (loanData) {
                setInputApprovedPrincipal(loanData.approvedPrincipal?.toString() || loanData.principal?.toString() || '')
                setInputApprovedRate(loanData.approvedRate?.toString() || '12.0')
                // Default repay amount to something reasonable
                setRepayAmount('')
                
                // If loan is active or disbursed, load transactions
                if (['active', 'disbursed', 'repaid', 'paid'].includes(loanData.status)) {
                    loadTransactions()
                }
            }
        } catch (e) {
            console.error('Failed to load loan:', e)
            setError('Failed to load loan details')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadLoan()
    }, [id])

    const handleAction = async (actionFn: () => Promise<any>, successMsg: string) => {
        setActionLoading(true)
        try {
            const res = await actionFn()
            if (res.errors && res.errors.length > 0) {
                alert('GraphQL Error: ' + res.errors[0].message)
                return
            }
            const data = res.data ? Object.values(res.data)[0] as any : null
            if (data?.success) {
                alert(successMsg)
                loadLoan()
                loadTransactions()
            } else {
                alert('Action failed: ' + (data?.message || 'Unknown error'))
            }
        } catch (e: any) {
            alert('Request Error: ' + e.message)
        } finally {
            setActionLoading(false)
        }
    }

    if (loading) return <div className="text-center py-16 text-muted-foreground">Loading loan details...</div>
    if (error) return <div className="text-center py-16 text-destructive">{error}</div>
    if (!loan) return <div className="text-center py-16 text-muted-foreground">Loan not found</div>

    const getStatusColor = (status: string) => {
        const colors: { [key: string]: string } = {
            'draft': 'text-slate-400 bg-slate-400/10',
            'submitted': 'text-amber-400 bg-amber-400/10',
            'reviewing': 'text-blue-400 bg-blue-400/10',
            'approved': 'text-emerald-400 bg-emerald-400/10',
            'disbursed': 'text-indigo-400 bg-indigo-400/10',
            'repaid': 'text-emerald-400 bg-emerald-400/10',
            'paid': 'text-emerald-400 bg-emerald-400/10',
            'rejected': 'text-red-400 bg-red-400/10'
        }
        return colors[status] || 'text-muted-foreground'
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/loans')} className="p-2 rounded-lg hover:bg-white/5 text-muted-foreground transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">Loan Details</h1>
                        <p className="text-muted-foreground text-sm mt-1">Ref: {loan.id}</p>
                    </div>
                </div>
                <span className={`text-xs px-3 py-1 rounded-full font-medium ${getStatusColor(loan.status)}`}>
                    {loan.status.toUpperCase()}
                </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-6">
                    <div className="glass rounded-xl p-6 space-y-6">
                        <div className="flex items-center justify-between pb-4 border-b border-border/50">
                            <div>
                                <h2 className="text-lg font-bold text-foreground">{loan.borrowerName}</h2>
                                <p className="text-sm text-muted-foreground">{loan.productName}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-y-6 gap-x-4">
                            <div>
                                <label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Principal</label>
                                <p className="text-xl font-bold text-foreground">₱{loan.principal?.toLocaleString()}</p>
                            </div>
                            <div>
                                <label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Term</label>
                                <p className="text-xl font-bold text-foreground">{loan.termMonths} months</p>
                            </div>
                            <div>
                                <label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Approved Principal</label>
                                <p className="text-lg font-semibold text-foreground">{loan.approvedPrincipal ? `₱${loan.approvedPrincipal.toLocaleString()}` : '—'}</p>
                            </div>
                            <div>
                                <label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Approved Rate</label>
                                <p className="text-lg font-semibold text-foreground">{loan.approvedRate ? `${loan.approvedRate}%` : '—'}</p>
                            </div>
                            <div>
                                <label className="text-xs text-primary uppercase tracking-wider font-bold">Outstanding Balance</label>
                                <p className="text-xl font-bold text-primary">₱{loan.outstandingBalance?.toLocaleString() || '0.00'}</p>
                            </div>
                        </div>
                    </div>

                    {isOfficer && (
                        <div className="glass rounded-xl p-6 border-t-4 border-primary/50">
                            <h3 className="text-sm font-bold text-foreground mb-4 uppercase tracking-wider flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 text-primary" /> Workflow Actions
                            </h3>
                            <div className="flex flex-wrap gap-3">
                                {loan.status === 'draft' && (
                                    <button 
                                        disabled={actionLoading}
                                        onClick={() => handleAction(() => submitLoan(loan.id), 'Loan submitted successfully')}
                                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                                    >
                                        <PlayCircle className="w-4 h-4" /> Submit for Review
                                    </button>
                                )}
                                
                                {loan.status === 'submitted' && (
                                    <button 
                                        disabled={actionLoading}
                                        onClick={() => handleAction(() => reviewLoan(loan.id), 'Loan is now under review')}
                                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                                    >
                                        <Eye className="w-4 h-4" /> Start Review
                                    </button>
                                )}

                                {loan.status === 'reviewing' && (
                                    <div className="w-full space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] text-muted-foreground uppercase font-bold">Approved Principal (₱)</label>
                                                <input 
                                                    type="number" 
                                                    value={inputApprovedPrincipal}
                                                    onChange={(e) => setInputApprovedPrincipal(e.target.value)}
                                                    className="w-full bg-background/50 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary/50"
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] text-muted-foreground uppercase font-bold">Approved Rate (%)</label>
                                                <input 
                                                    type="number" 
                                                    step="0.01"
                                                    value={inputApprovedRate}
                                                    onChange={(e) => setInputApprovedRate(e.target.value)}
                                                    className="w-full bg-background/50 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary/50"
                                                />
                                            </div>
                                        </div>
                                        <div className="flex gap-3">
                                            <button 
                                                disabled={actionLoading}
                                                onClick={() => handleAction(() => approveLoan(loan.id, parseFloat(inputApprovedPrincipal), parseFloat(inputApprovedRate)), 'Loan approved')}
                                                className="flex items-center justify-center gap-2 px-6 py-2 rounded-lg bg-emerald-600 text-white text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-50 flex-1"
                                            >
                                                <CheckCircle className="w-4 h-4" /> Finalize & Approve
                                            </button>
                                            <button 
                                                disabled={actionLoading}
                                                onClick={() => {
                                                    const reason = prompt('Reason for rejection:')
                                                    if (reason) handleAction(() => rejectLoan(loan.id, reason), 'Loan rejected')
                                                }}
                                                className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-red-600/20 text-red-400 text-sm font-medium hover:bg-red-600/30 transition-colors disabled:opacity-50"
                                            >
                                                <XCircle className="w-4 h-4" /> Reject
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {loan.status === 'active' && (
                                    <div className="w-full space-y-4">
                                        <div className="flex gap-3">
                                            <button 
                                                onClick={() => navigate(`/loans/${loan.id}/amortization`)}
                                                className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-emerald-600/20 text-emerald-400 text-sm font-medium hover:bg-emerald-600/30 transition-colors flex-1"
                                            >
                                                <FileText className="w-4 h-4" /> Schedule
                                            </button>
                                            <button 
                                                onClick={() => navigate(`/loans/${loan.id}/payment-history`)}
                                                className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors flex-1"
                                            >
                                                <Banknote className="w-4 h-4" /> Payment History
                                            </button>
                                        </div>
                                        
                                        <div className="pt-4 border-t border-border/50 space-y-3">
                                            <label className="text-[10px] text-muted-foreground uppercase font-bold">Record Repayment</label>
                                            <div className="flex flex-col gap-3">
                                                <div className="flex gap-2">
                                                    <div className="flex-1 space-y-1">
                                                        <label className="text-[10px] text-muted-foreground">Amount (₱)</label>
                                                        <input 
                                                            type="number" 
                                                            placeholder="Amount"
                                                            value={repayAmount}
                                                            onChange={(e) => setRepayAmount(e.target.value)}
                                                            className="w-full bg-background/50 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary/50"
                                                        />
                                                    </div>
                                                    <div className="flex-1 space-y-1">
                                                        <label className="text-[10px] text-muted-foreground">Payment Date</label>
                                                        <input 
                                                            type="date" 
                                                            value={repayDate}
                                                            onChange={(e) => setRepayDate(e.target.value)}
                                                            className="w-full bg-background/50 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary/50"
                                                        />
                                                    </div>
                                                </div>
                                                <button 
                                                    disabled={actionLoading || !repayAmount}
                                                    onClick={() => handleAction(() => repayLoan(loan.id, parseFloat(repayAmount), 'cash', '', repayDate), 'Repayment recorded')}
                                                    className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-primary text-white text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-50"
                                                >
                                                    <Banknote className="w-4 h-4" /> Record Payment
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {loan.status === 'approved' && (
                                    <div className="w-full space-y-4">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] text-muted-foreground uppercase font-bold">Disbursement Method</label>
                                            <select 
                                                value={disbursementMethod}
                                                onChange={(e) => setDisbursementMethod(e.target.value)}
                                                className="w-full bg-background/50 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary/50"
                                            >
                                                <option value="cash">Cash</option>
                                                <option value="bank_transfer">Bank Transfer</option>
                                                <option value="cheque">Cheque</option>
                                                <option value="savings_transfer">Transfer to Savings Account</option>
                                            </select>
                                        </div>
                                        <button 
                                            disabled={actionLoading}
                                            onClick={() => handleAction(() => disburseLoan(loan.id, disbursementMethod), 'Loan disbursed successfully')}
                                            className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-50"
                                        >
                                            <Wallet className="w-4 h-4" /> Finalize Disbursement
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {transactions.length > 0 && (
                        <div className="glass rounded-xl p-6 space-y-4">
                            <h3 className="text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
                                <Banknote className="w-4 h-4 text-emerald-400" /> Transaction History
                            </h3>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-border/50 text-left">
                                            <th className="px-2 py-2 text-xs font-semibold text-muted-foreground uppercase">Date</th>
                                            <th className="px-2 py-2 text-xs font-semibold text-muted-foreground uppercase">Type</th>
                                            <th className="px-2 py-2 text-xs font-semibold text-muted-foreground uppercase">Ref</th>
                                            <th className="px-2 py-2 text-xs font-semibold text-muted-foreground uppercase text-right">Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border/30">
                                        {transactions.map((tx) => (
                                            <tr key={tx.id} className="hover:bg-white/5 transition-colors">
                                                <td className="px-2 py-3 text-muted-foreground whitespace-nowrap">
                                                    {new Date(tx.createdAt).toLocaleDateString()}
                                                </td>
                                                <td className="px-2 py-3">
                                                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                                                        tx.transactionType === 'repayment' ? 'bg-emerald-400/10 text-emerald-400' : 
                                                        tx.transactionType === 'disbursement' ? 'bg-indigo-400/10 text-indigo-400' : 
                                                        'bg-amber-400/10 text-amber-400'
                                                    }`}>
                                                        {tx.transactionType}
                                                    </span>
                                                </td>
                                                <td className="px-2 py-3 font-mono text-xs text-muted-foreground">
                                                    {tx.reference || '—'}
                                                </td>
                                                <td className={`px-2 py-3 text-right font-bold ${
                                                    tx.transactionType === 'repayment' ? 'text-emerald-400' : 'text-foreground'
                                                }`}>
                                                    ₱{tx.amount?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>

                <div className="space-y-6">
                    <div className="glass rounded-xl p-4 space-y-4">
                        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Timestamps</h3>
                        <div className="space-y-3">
                            <div>
                                <label className="text-[10px] text-muted-foreground block">Application Date</label>
                                <p className="text-sm font-medium text-foreground">{new Date(loan.createdAt).toLocaleString()}</p>
                            </div>
                            <div>
                                <label className="text-[10px] text-muted-foreground block">Last Updated</label>
                                <p className="text-sm font-medium text-foreground">{new Date(loan.updatedAt).toLocaleString()}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

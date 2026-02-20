import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from '@apollo/client'
import {
    GET_LOAN, GET_LOAN_TRANSACTIONS, PREVIEW_LOAN_SCHEDULE, DISBURSE_LOAN, REPAY_LOAN,
    SUBMIT_LOAN, REVIEW_LOAN, APPROVE_LOAN, REJECT_LOAN, WRITE_OFF_LOAN,
    GET_LOAN_COLLATERAL, ADD_COLLATERAL, REMOVE_COLLATERAL,
    GET_LOAN_GUARANTORS, ADD_GUARANTOR, REMOVE_GUARANTOR,
    GET_LOAN_AMORTIZATION,
} from '@/api/queries'
import { formatCurrency, formatDate, getLoanStatusColor } from '@/lib/utils'
import { ArrowLeft, CreditCard, Activity, Calendar, FileText, CheckCircle, Clock, Shield, XCircle, PackagePlus, Users, Trash2 } from 'lucide-react'

type Tab = 'overview' | 'schedule' | 'transactions' | 'collateral' | 'guarantors'

export default function LoanDetailPage() {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const [tab, setTab] = useState<Tab>('overview')
    const [repayAmount, setRepayAmount] = useState('')

    const { data: loanData, loading: loanLoading, refetch: refetchLoan } = useQuery(GET_LOAN, { variables: { id } })
    const { data: txData, refetch: refetchTx } = useQuery(GET_LOAN_TRANSACTIONS, { variables: { loanId: id } })
    const loan = loanData?.loan?.loan

    // Approval workflow mutations
    const [submitLoan] = useMutation(SUBMIT_LOAN)
    const [reviewLoan] = useMutation(REVIEW_LOAN)
    const [approveLoan] = useMutation(APPROVE_LOAN)
    const [rejectLoan] = useMutation(REJECT_LOAN)
    const [writeOffLoan] = useMutation(WRITE_OFF_LOAN)

    const [disburseLoan, { loading: disbursing }] = useMutation(DISBURSE_LOAN)
    const [repayLoan, { loading: repaying }] = useMutation(REPAY_LOAN)

    // Collateral & Guarantor
    const { data: collateralData, refetch: refetchCollateral } = useQuery(GET_LOAN_COLLATERAL, { variables: { loanId: parseInt(id || '0') }, skip: !id })
    const { data: guarantorData, refetch: refetchGuarantors } = useQuery(GET_LOAN_GUARANTORS, { variables: { loanId: parseInt(id || '0') }, skip: !id })
    const [addCollateral] = useMutation(ADD_COLLATERAL)
    const [removeCollateral] = useMutation(REMOVE_COLLATERAL)
    const [addGuarantor] = useMutation(ADD_GUARANTOR)
    const [removeGuarantor] = useMutation(REMOVE_GUARANTOR)

    // Amortization
    const { data: amortData } = useQuery(GET_LOAN_AMORTIZATION, {
        variables: { loanId: parseInt(id || '0') },
        skip: !loan || !['active', 'paid', 'defaulted', 'written_off'].includes(loan?.status)
    })

    // Schedule preview for pre-disbursement
    const { data: previewData } = useQuery(PREVIEW_LOAN_SCHEDULE, {
        variables: {
            principal: loan?.approvedPrincipal || loan?.principal || 0,
            rateAnnual: loan?.approvedRate || 5.0,
            termMonths: loan?.termMonths || 1,
            amortizationType: 'declining_balance'
        },
        skip: !loan || loan.status !== 'approved'
    })

    // Collateral form
    const [collForm, setCollForm] = useState({ type: 'vehicle', value: '', description: '' })
    const [guaForm, setGuaForm] = useState({ customerId: '' })
    const [approvalForm, setApprovalForm] = useState({ principal: '', rate: '', note: '', reason: '' })

    const handleDisburse = async () => {
        if (!confirm('Are you sure you want to disburse this loan?')) return
        try {
            const res = await disburseLoan({ variables: { id } })
            alert(res.data?.disburseLoan?.message || 'Disbursed!')
            refetchLoan(); refetchTx()
        } catch (e: any) { alert(e.message) }
    }

    const handleRepay = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!repayAmount || isNaN(Number(repayAmount))) return
        try {
            const res = await repayLoan({ variables: { id, amount: parseFloat(repayAmount) } })
            setRepayAmount('')
            alert(res.data?.repayLoan?.message || 'Repayment processed')
            refetchLoan(); refetchTx()
        } catch (e: any) { alert(e.message) }
    }

    const handleSubmit = async () => { try { await submitLoan({ variables: { id } }); refetchLoan() } catch (e: any) { alert(e.message) } }
    const handleReview = async () => { try { await reviewLoan({ variables: { id, note: approvalForm.note || null } }); refetchLoan() } catch (e: any) { alert(e.message) } }
    const handleApprove = async () => {
        try {
            await approveLoan({
                variables: {
                    id,
                    approvedPrincipal: approvalForm.principal ? parseFloat(approvalForm.principal) : null,
                    approvedRate: approvalForm.rate ? parseFloat(approvalForm.rate) : null,
                }
            })
            refetchLoan()
        } catch (e: any) { alert(e.message) }
    }
    const handleReject = async () => {
        if (!approvalForm.reason) return alert('Please provide a reason')
        try { await rejectLoan({ variables: { id, reason: approvalForm.reason } }); refetchLoan() } catch (e: any) { alert(e.message) }
    }
    const handleWriteOff = async () => {
        const reason = prompt('Write-off reason:')
        if (!reason) return
        try { await writeOffLoan({ variables: { id, reason } }); refetchLoan() } catch (e: any) { alert(e.message) }
    }

    const handleAddCollateral = async (e: React.FormEvent) => {
        e.preventDefault()
        try { await addCollateral({ variables: { input: { loanId: parseInt(id!), type: collForm.type, value: parseFloat(collForm.value), description: collForm.description || null } } }); refetchCollateral(); setCollForm({ type: 'vehicle', value: '', description: '' }) } catch (e: any) { alert(e.message) }
    }
    const handleAddGuarantor = async (e: React.FormEvent) => {
        e.preventDefault()
        try { await addGuarantor({ variables: { input: { loanId: parseInt(id!), customerId: guaForm.customerId } } }); refetchGuarantors(); setGuaForm({ customerId: '' }) } catch (e: any) { alert(e.message) }
    }

    if (loanLoading) return <div className="p-10 text-center animate-pulse">Loading loan...</div>
    if (!loan) return <div className="p-10 text-center text-destructive">Loan not found</div>

    const actualSchedule = amortData?.loanAmortization?.rows || []
    const previewSchedule = previewData?.generateLoanSchedulePreview || []
    const scheduleToShow = actualSchedule.length > 0 ? actualSchedule : previewSchedule

    return (
        <div className="space-y-5 animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/loans')} className="p-2 hover:bg-secondary/50 rounded-lg transition-colors text-muted-foreground hover:text-foreground">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-bold text-foreground">Loan {id?.slice(-6).toUpperCase()}</h1>
                            <span className={`px-2.5 py-1 text-xs font-bold uppercase tracking-wider rounded-md border ${getLoanStatusColor(loan.status)}`}>
                                {loan.status}
                            </span>
                        </div>
                        <p className="text-muted-foreground text-sm mt-1">
                            Borrower: <span className="text-foreground font-medium">{loan.borrowerName}</span> • Product: <span className="text-foreground font-medium">{loan.productName}</span>
                        </p>
                    </div>
                </div>

                {/* Action Buttons based on status */}
                <div className="flex gap-2">
                    {loan.status === 'draft' && (
                        <button onClick={handleSubmit} className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg shadow-lg shadow-blue-500/20 flex items-center gap-2">
                            <FileText className="w-4 h-4" /> Submit for Review
                        </button>
                    )}
                    {loan.status === 'submitted' && (
                        <button onClick={handleReview} className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white font-medium rounded-lg shadow-lg shadow-yellow-500/20 flex items-center gap-2">
                            <Shield className="w-4 h-4" /> Begin Review
                        </button>
                    )}
                    {loan.status === 'reviewing' && (
                        <>
                            <button onClick={handleApprove} className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-lg flex items-center gap-2">
                                <CheckCircle className="w-4 h-4" /> Approve
                            </button>
                            <button onClick={handleReject} className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg flex items-center gap-2">
                                <XCircle className="w-4 h-4" /> Reject
                            </button>
                        </>
                    )}
                    {loan.status === 'approved' && (
                        <button onClick={handleDisburse} disabled={disbursing} className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-lg shadow-lg shadow-emerald-500/20 disabled:opacity-50 flex items-center gap-2">
                            {disbursing ? <Clock className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                            Disburse Funds
                        </button>
                    )}
                    {loan.status === 'active' && (
                        <button onClick={handleWriteOff} className="px-3 py-2 text-xs bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg hover:bg-red-500/20">
                            Write Off
                        </button>
                    )}
                </div>
            </div>

            {/* Approval form (visible during reviewing) */}
            {loan.status === 'reviewing' && (
                <div className="glass p-5 rounded-xl border-yellow-500/20 bg-yellow-500/5 grid grid-cols-1 md:grid-cols-3 gap-3">
                    <input type="number" step="0.01" placeholder="Approved Principal (optional)" value={approvalForm.principal} onChange={e => setApprovalForm(f => ({ ...f, principal: e.target.value }))} className="bg-background border border-border rounded-lg px-3 py-2 text-sm" />
                    <input type="number" step="0.01" placeholder="Approved Rate % (optional)" value={approvalForm.rate} onChange={e => setApprovalForm(f => ({ ...f, rate: e.target.value }))} className="bg-background border border-border rounded-lg px-3 py-2 text-sm" />
                    <input placeholder="Rejection reason (if rejecting)" value={approvalForm.reason} onChange={e => setApprovalForm(f => ({ ...f, reason: e.target.value }))} className="bg-background border border-border rounded-lg px-3 py-2 text-sm" />
                </div>
            )}

            {/* Tabs */}
            <div className="flex items-center gap-1 border-b border-border/50">
                {([
                    { id: 'overview', icon: CreditCard, label: 'Overview' },
                    { id: 'schedule', icon: Calendar, label: 'Amortization Schedule' },
                    { id: 'transactions', icon: Activity, label: 'Transactions' },
                    { id: 'collateral', icon: PackagePlus, label: 'Collateral' },
                    { id: 'guarantors', icon: Users, label: 'Guarantors' },
                ] as const).map(({ id: tabId, icon: Icon, label }) => (
                    <button
                        key={tabId}
                        onClick={() => setTab(tabId)}
                        className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all duration-200 ${tab === tabId
                            ? 'border-primary text-primary bg-primary/5'
                            : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                            }`}
                    >
                        <Icon className="w-4 h-4" /> {label}
                    </button>
                ))}
            </div>

            {/* Content */}
            <div className="mt-6">
                {tab === 'overview' && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        <div className="md:col-span-2 space-y-5">
                            <div className="glass p-6 rounded-xl">
                                <h3 className="text-lg font-semibold mb-4 text-primary">Loan Details</h3>
                                <div className="grid grid-cols-2 gap-y-4 gap-x-8 text-sm">
                                    <div>
                                        <p className="text-muted-foreground mb-1">Requested Principal</p>
                                        <p className="font-semibold text-lg">{formatCurrency(loan.principal)}</p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground mb-1">Approved Principal</p>
                                        <p className="font-semibold text-lg text-emerald-400">{formatCurrency(loan.approvedPrincipal || loan.principal)}</p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground mb-1">Term</p>
                                        <p className="font-medium">{loan.termMonths} Months</p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground mb-1">Interest Rate</p>
                                        <p className="font-medium">{loan.approvedRate ?? 'Product Default'}% p.a.</p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground mb-1">Application Date</p>
                                        <p className="font-medium">{formatDate(loan.createdAt)}</p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground mb-1">Disbursement Date</p>
                                        <p className="font-medium">{loan.disbursedAt ? formatDate(loan.disbursedAt) : 'Pending'}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Collateral Summary */}
                            <div className="glass p-5 rounded-xl">
                                <h3 className="font-semibold mb-2 flex items-center gap-2"><PackagePlus className="w-4 h-4 text-primary" /> Collateral Summary</h3>
                                <p className="text-sm text-muted-foreground">
                                    Total Value: <span className="text-foreground font-semibold">{formatCurrency(collateralData?.loanCollateral?.totalValue ?? 0)}</span>
                                    {' '} ({(collateralData?.loanCollateral?.collaterals || []).length} items)
                                </p>
                            </div>
                        </div>

                        <div className="space-y-5">
                            {loan.status === 'active' && (
                                <div className="glass p-6 rounded-xl border-emerald-500/20 bg-emerald-500/5">
                                    <h3 className="text-lg font-semibold mb-2 text-emerald-400">Make Repayment</h3>
                                    <form onSubmit={handleRepay} className="space-y-4 mt-4">
                                        <input required type="number" step="0.01" value={repayAmount} onChange={e => setRepayAmount(e.target.value)} className="w-full bg-background border border-border rounded-lg px-3 py-2 focus:border-emerald-500 focus:outline-none" placeholder="Amount" />
                                        <button type="submit" disabled={repaying} className="w-full py-2 bg-emerald-500 text-white rounded-lg font-medium hover:bg-emerald-600 disabled:opacity-50">
                                            {repaying ? 'Processing...' : 'Submit Payment'}
                                        </button>
                                    </form>
                                    <p className="text-xs text-muted-foreground mt-3 text-center">Waterfall: Penalty &rarr; Interest &rarr; Principal</p>
                                </div>
                            )}

                            <div className="glass p-5 rounded-xl">
                                <h3 className="font-semibold mb-3 flex items-center gap-2"><FileText className="w-4 h-4" /> Summary</h3>
                                <p className="text-sm text-muted-foreground">ID: <span className="font-mono text-foreground">{loan.id}</span></p>
                            </div>
                        </div>
                    </div>
                )}

                {tab === 'schedule' && (
                    <div className="glass rounded-xl overflow-hidden">
                        {loan.status === 'approved' && previewData ? (
                            <div className="p-4 bg-yellow-500/10 border-b border-yellow-500/20 text-sm text-yellow-500 flex items-center gap-2">
                                <Clock className="w-4 h-4" /> Schedule Preview (Pending Disbursement)
                            </div>
                        ) : null}
                        {actualSchedule.length > 0 && (
                            <div className="p-4 bg-emerald-500/10 border-b border-emerald-500/20 text-sm text-emerald-400 flex items-center gap-2">
                                <CheckCircle className="w-4 h-4" /> Official Amortization Schedule
                            </div>
                        )}
                        <table className="w-full text-sm">
                            <thead className="bg-secondary/40">
                                <tr>
                                    <th className="px-4 py-3 text-left font-semibold text-muted-foreground">No.</th>
                                    <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Due Date</th>
                                    <th className="px-4 py-3 text-right font-semibold text-muted-foreground">Principal</th>
                                    <th className="px-4 py-3 text-right font-semibold text-muted-foreground">Interest</th>
                                    <th className="px-4 py-3 text-right font-semibold text-muted-foreground">Total</th>
                                    {actualSchedule.length > 0 && <th className="px-4 py-3 text-right font-semibold text-muted-foreground">Paid</th>}
                                    {actualSchedule.length > 0 && <th className="px-4 py-3 text-center font-semibold text-muted-foreground">Status</th>}
                                </tr>
                            </thead>
                            <tbody>
                                {scheduleToShow.map((row: any) => (
                                    <tr key={row.installmentNumber} className="border-t border-border/50 hover:bg-secondary/20 font-mono">
                                        <td className="px-4 py-3">{row.installmentNumber}</td>
                                        <td className="px-4 py-3">{formatDate(row.dueDate)}</td>
                                        <td className="px-4 py-3 text-right">{formatCurrency(row.principalDue)}</td>
                                        <td className="px-4 py-3 text-right">{formatCurrency(row.interestDue)}</td>
                                        <td className="px-4 py-3 text-right font-semibold text-primary">{formatCurrency(row.totalDue || (parseFloat(row.principalDue) + parseFloat(row.interestDue)))}</td>
                                        {actualSchedule.length > 0 && <td className="px-4 py-3 text-right text-emerald-400">{formatCurrency(row.totalPaid)}</td>}
                                        {actualSchedule.length > 0 && (
                                            <td className="px-4 py-3 text-center">
                                                <span className={`px-2 py-0.5 text-xs font-bold rounded ${row.status === 'paid' ? 'bg-emerald-500/15 text-emerald-400' : row.status === 'partial' ? 'bg-yellow-500/15 text-yellow-400' : row.status === 'overdue' ? 'bg-red-500/15 text-red-400' : 'bg-secondary/50 text-muted-foreground'}`}>
                                                    {row.status}
                                                </span>
                                            </td>
                                        )}
                                    </tr>
                                ))}
                                {scheduleToShow.length === 0 && (
                                    <tr><td colSpan={7} className="py-20 text-center text-muted-foreground">Schedule will be generated upon disbursement</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                {tab === 'transactions' && (
                    <div className="glass rounded-xl overflow-hidden">
                        <table className="w-full text-sm">
                            <thead className="bg-secondary/40">
                                <tr>
                                    <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Date</th>
                                    <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Type</th>
                                    <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Description</th>
                                    <th className="px-4 py-3 text-right font-semibold text-muted-foreground">Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(txData?.loanTransactions || []).map((t: any) => (
                                    <tr key={t.id} className="border-t border-border/50 hover:bg-secondary/20">
                                        <td className="px-4 py-3 font-mono">{formatDate(t.createdAt)}</td>
                                        <td className="px-4 py-3 capitalize">{t.transactionType}</td>
                                        <td className="px-4 py-3 text-muted-foreground">{t.description}</td>
                                        <td className={`px-4 py-3 text-right font-semibold ${t.transactionType === 'repayment' ? 'text-emerald-400' : 'text-primary'}`}>
                                            {formatCurrency(t.amount)}
                                        </td>
                                    </tr>
                                ))}
                                {(!txData?.loanTransactions || txData.loanTransactions.length === 0) && (
                                    <tr><td colSpan={4} className="py-20 text-center text-muted-foreground">No transactions yet</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                {tab === 'collateral' && (
                    <div className="space-y-4">
                        {/* Add Collateral Form */}
                        <form onSubmit={handleAddCollateral} className="glass p-5 rounded-xl grid grid-cols-1 md:grid-cols-4 gap-3">
                            <select value={collForm.type} onChange={e => setCollForm(f => ({ ...f, type: e.target.value }))} className="bg-background border border-border rounded-lg px-3 py-2 text-sm">
                                <option value="vehicle">Vehicle</option>
                                <option value="real_estate">Real Estate</option>
                                <option value="deposit">Deposit</option>
                                <option value="jewelry">Jewelry</option>
                                <option value="equipment">Equipment</option>
                                <option value="other">Other</option>
                            </select>
                            <input required type="number" step="0.01" placeholder="Appraised Value" value={collForm.value} onChange={e => setCollForm(f => ({ ...f, value: e.target.value }))} className="bg-background border border-border rounded-lg px-3 py-2 text-sm" />
                            <input placeholder="Description" value={collForm.description} onChange={e => setCollForm(f => ({ ...f, description: e.target.value }))} className="bg-background border border-border rounded-lg px-3 py-2 text-sm" />
                            <button type="submit" className="bg-primary text-primary-foreground rounded-lg px-4 py-2 text-sm font-medium">Add Collateral</button>
                        </form>

                        {/* Collateral List */}
                        <div className="glass rounded-xl overflow-hidden">
                            <div className="px-5 py-3 bg-secondary/20 border-b border-border/50 flex justify-between items-center">
                                <span className="font-semibold text-sm">Total Value: {formatCurrency(collateralData?.loanCollateral?.totalValue ?? 0)}</span>
                            </div>
                            <table className="w-full text-sm">
                                <thead className="bg-secondary/40">
                                    <tr>
                                        <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Type</th>
                                        <th className="px-4 py-3 text-right font-semibold text-muted-foreground">Value</th>
                                        <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Description</th>
                                        <th className="px-4 py-3 text-center font-semibold text-muted-foreground">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(collateralData?.loanCollateral?.collaterals || []).map((c: any) => (
                                        <tr key={c.id} className="border-t border-border/50 hover:bg-secondary/20">
                                            <td className="px-4 py-3 capitalize">{c.type.replace('_', ' ')}</td>
                                            <td className="px-4 py-3 text-right font-semibold">{formatCurrency(c.value)}</td>
                                            <td className="px-4 py-3 text-muted-foreground">{c.description || '—'}</td>
                                            <td className="px-4 py-3 text-center">
                                                <button onClick={async () => { await removeCollateral({ variables: { id: c.id } }); refetchCollateral() }} className="p-1 text-red-400 hover:bg-red-500/10 rounded">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {!(collateralData?.loanCollateral?.collaterals || []).length && (
                                        <tr><td colSpan={4} className="py-16 text-center text-muted-foreground">No collateral registered</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {tab === 'guarantors' && (
                    <div className="space-y-4">
                        <form onSubmit={handleAddGuarantor} className="glass p-5 rounded-xl grid grid-cols-1 md:grid-cols-2 gap-3">
                            <input required placeholder="Guarantor Customer ID" value={guaForm.customerId} onChange={e => setGuaForm(f => ({ ...f, customerId: e.target.value }))} className="bg-background border border-border rounded-lg px-3 py-2 text-sm" />
                            <button type="submit" className="bg-primary text-primary-foreground rounded-lg px-4 py-2 text-sm font-medium">Add Guarantor</button>
                        </form>

                        <div className="glass rounded-xl overflow-hidden">
                            <table className="w-full text-sm">
                                <thead className="bg-secondary/40">
                                    <tr>
                                        <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Name</th>
                                        <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Customer ID</th>
                                        <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Date Added</th>
                                        <th className="px-4 py-3 text-center font-semibold text-muted-foreground">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(guarantorData?.loanGuarantors?.guarantors || []).map((g: any) => (
                                        <tr key={g.id} className="border-t border-border/50 hover:bg-secondary/20">
                                            <td className="px-4 py-3 font-medium">{g.guarantorName}</td>
                                            <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{g.customerId}</td>
                                            <td className="px-4 py-3">{formatDate(g.createdAt)}</td>
                                            <td className="px-4 py-3 text-center">
                                                <button onClick={async () => { await removeGuarantor({ variables: { id: g.id } }); refetchGuarantors() }} className="p-1 text-red-400 hover:bg-red-500/10 rounded">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {!(guarantorData?.loanGuarantors?.guarantors || []).length && (
                                        <tr><td colSpan={4} className="py-16 text-center text-muted-foreground">No guarantors registered</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

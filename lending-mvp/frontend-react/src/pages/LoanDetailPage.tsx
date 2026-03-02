import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from '@apollo/client'
import {
    GET_LOAN, GET_LOAN_TRANSACTIONS, PREVIEW_LOAN_SCHEDULE, DISBURSE_LOAN, REPAY_LOAN,
    SUBMIT_LOAN, REVIEW_LOAN, APPROVE_LOAN, REJECT_LOAN, WRITE_OFF_LOAN,
    GET_LOAN_COLLATERAL, ADD_COLLATERAL, REMOVE_COLLATERAL,
    GET_LOAN_GUARANTORS, ADD_GUARANTOR, REMOVE_GUARANTOR,
    GET_LOAN_AMORTIZATION, UPDATE_AMORTIZATION_PAYMENT_DATE, UPDATE_AMORTIZATION_ROW,
    GET_GL_ACCOUNTS,
} from '@/api/queries'
import { formatCurrency, formatDate, getLoanStatusColor } from '@/lib/utils'
import { ArrowLeft, CreditCard, Activity, Calendar, FileText, CheckCircle, Clock, Shield, XCircle, PackagePlus, Users, Trash2, Pencil, Save } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'

type Tab = 'overview' | 'schedule' | 'transactions' | 'collateral' | 'guarantors'

interface EditingAmortRow {
    installmentNumber: number
    dueDate: string
    principalDue: string
    interestDue: string
    penaltyDue: string
    principalPaid: string
    interestPaid: string
    penaltyPaid: string
    status: string
    paymentDate: string
}

export default function LoanDetailPage() {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const { isAdmin } = useAuth()
    const [tab, setTab] = useState<Tab>('overview')
    const [repayAmount, setRepayAmount] = useState('')
    const [repayDate, setRepayDate] = useState(new Date().toISOString().split('T')[0])
    const [editingAmortRow, setEditingAmortRow] = useState<EditingAmortRow | null>(null)

    const { data: loanData, loading: loanLoading, refetch: refetchLoan } = useQuery(GET_LOAN, { variables: { id } })
    const loan = loanData?.loan?.loan
    const { data: txData, refetch: refetchTx } = useQuery(GET_LOAN_TRANSACTIONS, { variables: { loanId: id } })
    const { data: amortData, refetch: refetchAmortization } = useQuery(GET_LOAN_AMORTIZATION, {
        variables: { loanId: parseInt(id || '0') },
        skip: !loan || !['active', 'paid', 'defaulted', 'written_off'].includes(loan?.status)
    })

    // Update amortization row mutation
    const [updateAmortRow, { loading: updatingAmortRow }] = useMutation(UPDATE_AMORTIZATION_ROW, {
        refetchQueries: [{ query: GET_GL_ACCOUNTS }],
        onCompleted: () => {
            refetchAmortization()
            setEditingAmortRow(null)
        },
        onError: (err) => {
            alert('Failed to update amortization row: ' + err.message)
        }
    })

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
        if (!repayAmount || isNaN(Number(repayAmount))) {
            alert('Please enter a valid amount')
            return
        }
        try {
            console.log('Processing repayment:', { id, amount: repayAmount, date: repayDate })
            const res = await repayLoan({ variables: { id, amount: parseFloat(repayAmount), paymentDate: repayDate } })
            console.log('Repayment response:', res)
            setRepayAmount('')
            if (res.errors && res.errors.length > 0) {
                alert('Error: ' + res.errors[0].message)
            } else if (res.data?.repayLoan) {
                alert(res.data.repayLoan.message || 'Repayment processed')
                refetchLoan(); refetchTx()
            } else {
                alert('No response from server')
            }
        } catch (e: any) { 
            console.error('Repayment error:', e)
            alert(e.message || 'Failed to process repayment')
        }
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
                                        <div>
                                            <label className="text-sm text-muted-foreground mb-1 block">Payment Date</label>
                                            <input 
                                                type="date" 
                                                value={repayDate} 
                                                onChange={e => setRepayDate(e.target.value)} 
                                                className="w-full bg-background border border-border rounded-lg px-3 py-2 focus:border-emerald-500 focus:outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-sm text-muted-foreground mb-1 block">Amount</label>
                                            <input 
                                                required 
                                                type="number" 
                                                step="0.01" 
                                                value={repayAmount} 
                                                onChange={e => setRepayAmount(e.target.value)} 
                                                className="w-full bg-background border border-border rounded-lg px-3 py-2 focus:border-emerald-500 focus:outline-none" 
                                                placeholder="Amount" 
                                            />
                                        </div>
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
                                    <th className="px-4 py-3 text-right font-semibold text-muted-foreground">Penalty</th>
                                    <th className="px-4 py-3 text-right font-semibold text-muted-foreground">Total</th>
                                    {actualSchedule.length > 0 && <th className="px-4 py-3 text-right font-semibold text-muted-foreground">Paid</th>}
                                    {actualSchedule.length > 0 && <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Payment Date</th>}
                                    {actualSchedule.length > 0 && <th className="px-4 py-3 text-center font-semibold text-muted-foreground">Status</th>}
                                    {isAdmin && actualSchedule.length > 0 && <th className="px-4 py-3 text-center font-semibold text-muted-foreground">Actions</th>}
                                </tr>
                                </thead>
                                <tbody>
                                {scheduleToShow.map((row: any) => (
                                    <tr key={row.installmentNumber} className="border-t border-border/50 hover:bg-secondary/20 font-mono">
                                        <td className="px-4 py-3">{row.installmentNumber}</td>
                                        <td className="px-4 py-3">
                                            {editingAmortRow?.installmentNumber === row.installmentNumber ? (
                                                <input
                                                    type="date"
                                                    value={editingAmortRow.dueDate}
                                                    onChange={e => setEditingAmortRow({ ...editingAmortRow, dueDate: e.target.value })}
                                                    className="bg-background border border-primary rounded px-2 py-1 text-xs w-32"
                                                />
                                            ) : (
                                                formatDate(row.dueDate)
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            {editingAmortRow?.installmentNumber === row.installmentNumber ? (
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    value={editingAmortRow.principalDue}
                                                    onChange={e => setEditingAmortRow({ ...editingAmortRow, principalDue: e.target.value })}
                                                    className="bg-background border border-primary rounded px-2 py-1 text-xs w-24 text-right"
                                                />
                                            ) : (
                                                formatCurrency(row.principalDue)
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            {editingAmortRow?.installmentNumber === row.installmentNumber ? (
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    value={editingAmortRow.interestDue}
                                                    onChange={e => setEditingAmortRow({ ...editingAmortRow, interestDue: e.target.value })}
                                                    className="bg-background border border-primary rounded px-2 py-1 text-xs w-24 text-right"
                                                />
                                            ) : (
                                                formatCurrency(row.interestDue)
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            {editingAmortRow?.installmentNumber === row.installmentNumber ? (
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    value={editingAmortRow.penaltyDue}
                                                    onChange={e => setEditingAmortRow({ ...editingAmortRow, penaltyDue: e.target.value })}
                                                    className="bg-background border border-primary rounded px-2 py-1 text-xs w-24 text-right"
                                                />
                                            ) : (
                                                formatCurrency(row.penaltyDue || 0)
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-right font-semibold text-primary">
                                            {editingAmortRow?.installmentNumber === row.installmentNumber ? (
                                                formatCurrency(
                                                    parseFloat(editingAmortRow.principalDue || '0') + 
                                                    parseFloat(editingAmortRow.interestDue || '0') +
                                                    parseFloat(editingAmortRow.penaltyDue || '0')
                                                )
                                            ) : (
                                                formatCurrency(
                                                    row.totalDue || (
                                                        parseFloat(row.principalDue) + 
                                                        parseFloat(row.interestDue) + 
                                                        parseFloat(row.penaltyDue || 0)
                                                    )
                                                )
                                            )}
                                        </td>

                                            {actualSchedule.length > 0 && (
                                                <td className="px-4 py-3 text-right text-emerald-400">
                                                    {editingAmortRow?.installmentNumber === row.installmentNumber ? (
                                                        <div className="flex flex-col gap-1 items-end">
                                                            <div className="flex items-center gap-1">
                                                                <span className="text-[10px] text-muted-foreground">Pr:</span>
                                                                <input
                                                                    type="number"
                                                                    step="0.01"
                                                                    value={editingAmortRow.principalPaid}
                                                                    onChange={e => setEditingAmortRow({ ...editingAmortRow, principalPaid: e.target.value })}
                                                                    className="bg-background border border-primary rounded px-1 py-0.5 text-[10px] w-16 text-right"
                                                                />
                                                            </div>
                                                            <div className="flex items-center gap-1">
                                                                <span className="text-[10px] text-muted-foreground">In:</span>
                                                                <input
                                                                    type="number"
                                                                    step="0.01"
                                                                    value={editingAmortRow.interestPaid}
                                                                    onChange={e => setEditingAmortRow({ ...editingAmortRow, interestPaid: e.target.value })}
                                                                    className="bg-background border border-primary rounded px-1 py-0.5 text-[10px] w-16 text-right"
                                                                />
                                                            </div>
                                                            <div className="flex items-center gap-1">
                                                                <span className="text-[10px] text-muted-foreground">Pe:</span>
                                                                <input
                                                                    type="number"
                                                                    step="0.01"
                                                                    value={editingAmortRow.penaltyPaid}
                                                                    onChange={e => setEditingAmortRow({ ...editingAmortRow, penaltyPaid: e.target.value })}
                                                                    className="bg-background border border-primary rounded px-1 py-0.5 text-[10px] w-16 text-right"
                                                                />
                                                            </div>
                                                            <div className="text-xs font-bold pt-1 border-t border-border mt-1">
                                                                Σ {formatCurrency(
                                                                    parseFloat(editingAmortRow.principalPaid || '0') +
                                                                    parseFloat(editingAmortRow.interestPaid || '0') +
                                                                    parseFloat(editingAmortRow.penaltyPaid || '0')
                                                                )}
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        formatCurrency(row.totalPaid)
                                                    )}
                                                </td>
                                            )}
                                            {actualSchedule.length > 0 && (
                                                <td className="px-4 py-3 text-left text-muted-foreground">
                                                    {editingAmortRow?.installmentNumber === row.installmentNumber ? (
                                                        <input
                                                            type="date"
                                                            value={editingAmortRow.paymentDate}
                                                            onChange={e => setEditingAmortRow({ ...editingAmortRow, paymentDate: e.target.value })}
                                                            className="bg-background border border-primary rounded px-2 py-1 text-xs w-32"
                                                        />
                                                    ) : (
                                                        row.paymentDate ? formatDate(row.paymentDate) : '-'
                                                    )}
                                                </td>
                                            )}
                                            {actualSchedule.length > 0 && (
                                                <td className="px-4 py-3 text-center">
                                                    {editingAmortRow?.installmentNumber === row.installmentNumber ? (
                                                        <select
                                                            value={editingAmortRow.status}
                                                            onChange={e => setEditingAmortRow({ ...editingAmortRow, status: e.target.value })}
                                                            className="bg-background border border-primary rounded px-2 py-1 text-xs"
                                                        >
                                                            <option value="pending">pending</option>
                                                            <option value="partial">partial</option>
                                                            <option value="paid">paid</option>
                                                            <option value="overdue">overdue</option>
                                                        </select>
                                                    ) : (
                                                        <span className={`px-2 py-0.5 text-xs font-bold rounded ${row.status === 'paid' ? 'bg-emerald-500/15 text-emerald-400' : row.status === 'partial' ? 'bg-yellow-500/15 text-yellow-400' : row.status === 'overdue' ? 'bg-red-500/15 text-red-400' : 'bg-secondary/50 text-muted-foreground'}`}>
                                                            {row.status}
                                                        </span>
                                                    )}
                                                </td>
                                            )}
                                            {isAdmin && actualSchedule.length > 0 && (
                                                <td className="px-4 py-3 text-center">
                                                    {editingAmortRow?.installmentNumber === row.installmentNumber ? (
                                                        <div className="flex items-center justify-center gap-1">
                                                            <button
                                                                onClick={() => {
                                                                    updateAmortRow({
                                                                        variables: {
                                                                            input: {
                                                                                loanId: parseInt(id || '0'),
                                                                                installmentNumber: row.installmentNumber,
                                                                                dueDate: editingAmortRow.dueDate,
                                                                                principalDue: parseFloat(editingAmortRow.principalDue),
                                                                                interestDue: parseFloat(editingAmortRow.interestDue),
                                                                                penaltyDue: parseFloat(editingAmortRow.penaltyDue),
                                                                                principalPaid: parseFloat(editingAmortRow.principalPaid),
                                                                                interestPaid: parseFloat(editingAmortRow.interestPaid),
                                                                                penaltyPaid: parseFloat(editingAmortRow.penaltyPaid),
                                                                                status: editingAmortRow.status,
                                                                                paymentDate: editingAmortRow.paymentDate || null
                                                                            }
                                                                        }
                                                                    })
                                                                }}
                                                                disabled={updatingAmortRow}
                                                                className="p-1 text-emerald-400 hover:bg-emerald-500/10 rounded disabled:opacity-50"
                                                                title="Save"
                                                            >
                                                                <Save className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => setEditingAmortRow(null)}
                                                                className="p-1 text-red-400 hover:bg-red-500/10 rounded"
                                                                title="Cancel"
                                                            >
                                                                <XCircle className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <button
                                                            onClick={() => setEditingAmortRow({
                                                                installmentNumber: row.installmentNumber,
                                                                dueDate: row.dueDate ? row.dueDate.split('T')[0] : '',
                                                                principalDue: row.principalDue.toString(),
                                                                interestDue: row.interestDue.toString(),
                                                                penaltyDue: (row.penaltyDue || 0).toString(),
                                                                principalPaid: row.principalPaid.toString(),
                                                                interestPaid: row.interestPaid.toString(),
                                                                penaltyPaid: row.penaltyPaid.toString(),
                                                                status: row.status,
                                                                paymentDate: row.paymentDate ? row.paymentDate.split('T')[0] : ''
                                                            })}
                                                            className="p-1 text-muted-foreground hover:text-primary hover:bg-secondary/50 rounded"
                                                            title="Edit Row"
                                                        >
                                                            <Pencil className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </td>
                                        )}
                                    </tr>
                                ))}
                                {scheduleToShow.length === 0 && (
                                    <tr><td colSpan={isAdmin && actualSchedule.length > 0 ? 10 : (actualSchedule.length > 0 ? 9 : 6)} className="py-20 text-center text-muted-foreground">Schedule will be generated upon disbursement</td></tr>
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

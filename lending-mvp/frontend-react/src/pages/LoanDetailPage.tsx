import { useState, useEffect } from 'react'
import { ArrowLeft, FileText, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { getLoan } from '@/api/loans'

export default function LoanDetailPage() {
    const { user } = useAuth()
    const navigate = useNavigate()
    const { id } = useParams()
    const isAdmin = user?.role === 'admin'

    const [loading, setLoading] = useState(true)
    const [loan, setLoan] = useState<any>(null)
    const [error, setError] = useState('')

    useEffect(() => {
        const loadLoan = async () => {
            try {
                const data = await getLoan(id || '')
                setLoan(data.loan)
            } catch (e) {
                console.error('Failed to load loan:', e)
                setError('Failed to load loan details')
            } finally {
                setLoading(false)
            }
        }
        loadLoan()
    }, [id])

    if (loading) return <div className="text-center py-16 text-muted-foreground">Loading loan details...</div>
    if (error) return <div className="text-center py-16 text-destructive">{error}</div>
    if (!loan) return <div className="text-center py-16 text-muted-foreground">Loan not found</div>

    const getStatusColor = (status: string) => {
        const colors: { [key: string]: string } = {
            'pending': 'text-amber-400',
            'approved': 'text-emerald-400',
            'disbursed': 'text-blue-400',
            'repaid': 'text-emerald-400',
            'default': 'text-red-400'
        }
        return colors[loan.status] || 'text-muted-foreground'
    }

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center gap-4">
                <button onClick={() => navigate('/loans')} className="p-2 rounded-lg hover:bg-background/50 text-muted-foreground transition-colors">
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Loan Details</h1>
                    <p className="text-muted-foreground text-sm mt-1">ID: {loan.id}</p>
                </div>
            </div>

            <div className="glass rounded-xl p-6 space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-border">
                    <div>
                        <h2 className="text-lg font-bold text-foreground">{loan.borrowerName}</h2>
                        <p className="text-sm text-muted-foreground">{loan.productName}</p>
                    </div>
                    <span className={`text-sm px-3 py-1 rounded-full ${getStatusColor(loan.status)}`}>
                        {loan.status.charAt(0).toUpperCase() + loan.status.slice(1)}
                    </span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-xs text-muted-foreground">Principal</label>
                        <p className="text-lg font-semibold text-foreground">₱{loan.principal?.toLocaleString()}</p>
                    </div>
                    <div>
                        <label className="text-xs text-muted-foreground">Approved Amount</label>
                        <p className="text-lg font-semibold text-foreground">₱{loan.approvedPrincipal?.toLocaleString()}</p>
                    </div>
                    <div>
                        <label className="text-xs text-muted-foreground">Interest Rate</label>
                        <p className="text-lg font-semibold text-foreground">{loan.approvedRate?.toFixed(2)}%</p>
                    </div>
                    <div>
                        <label className="text-xs text-muted-foreground">Term</label>
                        <p className="text-lg font-semibold text-foreground">{loan.termMonths} months</p>
                    </div>
                    <div>
                        <label className="text-xs text-muted-foreground">Outstanding Balance</label>
                        <p className="text-lg font-semibold text-foreground">₱{loan.outstandingBalance?.toLocaleString()}</p>
                    </div>
                    <div>
                        <label className="text-xs text-muted-foreground">Created</label>
                        <p className="text-sm text-muted-foreground">{new Date(loan.createdAt).toLocaleDateString()}</p>
                    </div>
                    {loan.disbursedAt && (
                        <div>
                            <label className="text-xs text-muted-foreground">Disbursed</label>
                            <p className="text-sm text-muted-foreground">{new Date(loan.disbursedAt).toLocaleDateString()}</p>
                        </div>
                    )}
                </div>

                {isAdmin && (
                    <div className="pt-4 border-t border-border">
                        <h3 className="text-sm font-semibold text-foreground mb-3">Actions</h3>
                        <div className="flex gap-3">
                            {loan.status === 'pending' && (
                                <>
                                    <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500/20 text-emerald-400 text-sm font-medium hover:bg-emerald-500/30 transition-colors">
                                        <CheckCircle className="w-4 h-4" /> Approve
                                    </button>
                                    <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/20 text-red-400 text-sm font-medium hover:bg-red-500/30 transition-colors">
                                        <XCircle className="w-4 h-4" /> Reject
                                    </button>
                                </>
                            )}
                            {loan.status === 'approved' && (
                                <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500/20 text-blue-400 text-sm font-medium hover:bg-blue-500/30 transition-colors">
                                    <FileText className="w-4 h-4" /> Disburse
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

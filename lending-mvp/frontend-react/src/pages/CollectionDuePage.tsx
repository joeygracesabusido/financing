import { useState, useMemo } from 'react'
import { useQuery } from '@apollo/client'
import { GET_LOANS } from '@/api/queries'
import { formatCurrency } from '@/lib/utils'
import { AlertTriangle, Calendar, Loader2, ChevronDown, ChevronUp } from 'lucide-react'

interface Loan {
    id: string
    customerId: string
    productId: string
    principal: number
    termMonths: number
    approvedPrincipal?: number
    approvedRate?: number
    status: string
    createdAt: string
    disbursedAt?: string
    borrowerName: string
    productName: string
}

interface PaymentSchedule {
    paymentNumber: number
    paymentDate: Date
    principalPayment: number
    interestPayment: number
    totalPayment: number
    remainingBalance: number
}

type FilterType = 'daily' | 'weekly' | 'monthly' | 'all'

export default function CollectionDuePage() {
    const [currentFilter, setCurrentFilter] = useState<FilterType>('weekly')
    const [expandedLoans, setExpandedLoans] = useState<Set<string>>(new Set())
    const { data, loading, error } = useQuery(GET_LOANS, {
        variables: { skip: 0, limit: 1000 }
    })

    const loans: Loan[] = data?.loans?.loans ?? []

    const getDateRange = (filter: FilterType) => {
        const now = new Date()
        let startDate: Date
        let endDate: Date
        let label: string

        if (filter === 'all') {
            startDate = new Date(0)
            endDate = new Date(now.getFullYear() + 100, 0, 1)
            label = 'All Time'
        } else if (filter === 'daily') {
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0)
            endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)
            label = 'Today'
        } else if (filter === 'weekly') {
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0)
            endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7, 23, 59, 59)
            label = 'Next 7 Days'
        } else {
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0)
            endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 30, 23, 59, 59)
            label = 'Next 30 Days'
        }

        return { startDate, endDate, label }
    }

    const calculateAmortizationSchedule = (loan: Loan): PaymentSchedule[] => {
        const principal = parseFloat(String(loan.approvedPrincipal || loan.principal)) || 0
        const annualRatePercent = parseFloat(String(loan.approvedRate || 0))
        const annualRate = annualRatePercent / 100
        const termMonths = parseInt(String(loan.termMonths)) || 0

        const startDate = new Date(loan.createdAt)
        const periodsPerYear = 12
        const totalPaymentsCount = termMonths
        const periodicRate = annualRate / periodsPerYear

        let periodicPayment = 0
        if (periodicRate > 0) {
            periodicPayment = (principal * periodicRate * Math.pow(1 + periodicRate, totalPaymentsCount)) /
                (Math.pow(1 + periodicRate, totalPaymentsCount) - 1)
        } else {
            periodicPayment = principal / totalPaymentsCount
        }

        const schedule: PaymentSchedule[] = []
        let currentDate = new Date(startDate)
        let remainingBalance = principal

        currentDate.setMonth(currentDate.getMonth() + 1)

        for (let i = 0; i < totalPaymentsCount; i++) {
            const interestPayment = remainingBalance * periodicRate
            const principalPayment = periodicPayment - interestPayment
            remainingBalance = Math.max(0, remainingBalance - principalPayment)

            schedule.push({
                paymentNumber: i + 1,
                paymentDate: new Date(currentDate),
                principalPayment: parseFloat(principalPayment.toFixed(2)),
                interestPayment: parseFloat(interestPayment.toFixed(2)),
                totalPayment: parseFloat(periodicPayment.toFixed(2)),
                remainingBalance: parseFloat(remainingBalance.toFixed(2))
            })

            currentDate.setMonth(currentDate.getMonth() + 1)
        }

        return schedule
    }

    const { startDate, endDate, label } = getDateRange(currentFilter)
    const now = new Date()

    const filteredLoans = useMemo(() => {
        return loans.filter(loan => {
            if (currentFilter === 'all') {
                return loan.status === 'active' || loan.status === 'approved' || loan.status === 'paid'
            }
            if (loan.status !== 'active' && loan.status !== 'approved' && loan.status !== 'paid') return false

            const schedule = calculateAmortizationSchedule(loan)
            return schedule.some(payment => {
                const paymentDate = new Date(payment.paymentDate)
                const normalizedPaymentDate = new Date(paymentDate.getFullYear(), paymentDate.getMonth(), paymentDate.getDate())
                const normalizedStart = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate())
                const normalizedEnd = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate())
                return normalizedPaymentDate >= normalizedStart && normalizedPaymentDate <= normalizedEnd
            })
        })
    }, [loans, currentFilter, startDate, endDate])

    const getLoanDataInRange = (loan: Loan) => {
        const schedule = calculateAmortizationSchedule(loan)
        const paymentsInRange = schedule.filter(payment => {
            const paymentDate = new Date(payment.paymentDate)
            const normalizedPaymentDate = new Date(paymentDate.getFullYear(), paymentDate.getMonth(), paymentDate.getDate())
            const normalizedStart = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate())
            const normalizedEnd = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate())
            return normalizedPaymentDate >= normalizedStart && normalizedPaymentDate <= normalizedEnd
        })

        const totalCollectionAmount = paymentsInRange.reduce((sum, p) => sum + p.totalPayment, 0)
        const totalPrincipal = paymentsInRange.reduce((sum, p) => sum + p.principalPayment, 0)
        const totalInterest = paymentsInRange.reduce((sum, p) => sum + p.interestPayment, 0)

        const nextPayment = schedule.find(p => new Date(p.paymentDate) >= now)
        const nextDueDate = nextPayment ? new Date(nextPayment.paymentDate) : null
        const isOverdue = nextDueDate && nextDueDate < now && loan.status !== 'paid'

        return {
            paymentsInRange,
            totalCollectionAmount,
            totalPrincipal,
            totalInterest,
            nextDueDate,
            isOverdue,
            schedule
        }
    }

    const toggleLoanExpansion = (loanId: string) => {
        setExpandedLoans(prev => {
            const newSet = new Set(prev)
            if (newSet.has(loanId)) {
                newSet.delete(loanId)
            } else {
                newSet.add(loanId)
            }
            return newSet
        })
    }

    const totalCollection = filteredLoans.reduce((sum, loan) => {
        return sum + getLoanDataInRange(loan).totalCollectionAmount
    }, 0)

    const totalPrincipal = filteredLoans.reduce((sum, loan) => {
        return sum + getLoanDataInRange(loan).totalPrincipal
    }, 0)

    const totalInterest = filteredLoans.reduce((sum, loan) => {
        return sum + getLoanDataInRange(loan).totalInterest
    }, 0)

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-6 h-6 animate-spin text-yellow-400" />
            </div>
        )
    }

    if (error) {
        return (
            <div className="p-10 text-center text-destructive">
                Error: {error.message}
            </div>
        )
    }

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                        <AlertTriangle className="w-6 h-6 text-orange-400" /> Collection Due
                    </h1>
                    <p className="text-muted-foreground text-sm mt-1">
                        Showing loans due {label.toLowerCase()} based on amortization schedule
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <select
                        value={currentFilter}
                        onChange={(e) => setCurrentFilter(e.target.value as FilterType)}
                        className="px-4 py-2 bg-secondary border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                        <option value="all">All</option>
                    </select>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="glass p-5 rounded-xl">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Loans</p>
                    <p className="text-2xl font-bold mt-1">{filteredLoans.length}</p>
                </div>
                <div className="glass p-5 rounded-xl">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Collection</p>
                    <p className="text-2xl font-bold text-primary mt-1">{formatCurrency(totalCollection)}</p>
                </div>
                <div className="glass p-5 rounded-xl">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Principal</p>
                    <p className="text-2xl font-bold mt-1">{formatCurrency(totalPrincipal)}</p>
                </div>
                <div className="glass p-5 rounded-xl">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Interest</p>
                    <p className="text-2xl font-bold mt-1">{formatCurrency(totalInterest)}</p>
                </div>
            </div>

            {/* Loans Table */}
            <div className="glass rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-secondary/40">
                        <tr>
                            <th className="px-4 py-3 text-left font-semibold text-muted-foreground w-8"></th>
                            <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Loan ID</th>
                            <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Borrower</th>
                            <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Product</th>
                            <th className="px-4 py-3 text-right font-semibold text-muted-foreground">Principal</th>
                            <th className="px-4 py-3 text-right font-semibold text-muted-foreground">Collection Due</th>
                            <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredLoans.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="py-16 text-center text-muted-foreground">
                                    No loans found with collections due in this period
                                </td>
                            </tr>
                        ) : (
                            filteredLoans.map((loan) => {
                                const {
                                    paymentsInRange,
                                    totalCollectionAmount,
                                    totalPrincipal,
                                    totalInterest,
                                    nextDueDate,
                                    isOverdue
                                } = getLoanDataInRange(loan)

                                const isExpanded = expandedLoans.has(loan.id)
                                const nextDueDateDisplay = nextDueDate
                                    ? nextDueDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
                                    : 'N/A'

                                return (
                                    <>
                                        <tr key={loan.id} className="border-t border-border/50 hover:bg-secondary/20">
                                            <td className="px-4 py-3">
                                                <button
                                                    onClick={() => toggleLoanExpansion(loan.id)}
                                                    className="p-1 hover:bg-secondary rounded"
                                                >
                                                    {isExpanded ? (
                                                        <ChevronUp className="w-4 h-4" />
                                                    ) : (
                                                        <ChevronDown className="w-4 h-4" />
                                                    )}
                                                </button>
                                            </td>
                                            <td className="px-4 py-3 font-mono text-xs">...{loan.id.slice(-6)}</td>
                                            <td className="px-4 py-3 font-medium">{loan.borrowerName || 'N/A'}</td>
                                            <td className="px-4 py-3 text-muted-foreground">{loan.productName || 'N/A'}</td>
                                            <td className="px-4 py-3 text-right font-semibold">{formatCurrency(loan.approvedPrincipal || loan.principal)}</td>
                                            <td className="px-4 py-3 text-right">
                                                <div className={`font-bold ${isOverdue ? 'text-red-500' : ''}`}>
                                                    {formatCurrency(totalCollectionAmount)}
                                                </div>
                                                <div className="text-xs text-muted-foreground mt-1">
                                                    P: {formatCurrency(totalPrincipal)} | I: {formatCurrency(totalInterest)}
                                                </div>
                                                <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                                    <Calendar className="w-3 h-3" />
                                                    Next: {nextDueDateDisplay}
                                                </div>
                                                {isOverdue && (
                                                    <span className="mt-2 px-2 py-0.5 bg-red-100 text-red-800 text-xs rounded inline-block">
                                                        Overdue
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`px-2 py-1 rounded-md border text-xs font-medium uppercase tracking-wider ${
                                                    loan.status === 'approved' || loan.status === 'active'
                                                        ? 'bg-green-500/10 border-green-500/30 text-green-400'
                                                        : loan.status === 'paid'
                                                        ? 'bg-blue-500/10 border-blue-500/30 text-blue-400'
                                                        : 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400'
                                                }`}>
                                                    {loan.status}
                                                </span>
                                            </td>
                                        </tr>
                                        {isExpanded && paymentsInRange.length > 0 && (
                                            <tr key={`${loan.id}-expanded`} className="border-t border-border/50 bg-secondary/10">
                                                <td colSpan={7} className="px-4 py-3">
                                                    <div className="text-xs text-muted-foreground mb-2 font-semibold">
                                                        Payment Schedule ({label})
                                                    </div>
                                                    <div className="space-y-2 max-h-48 overflow-y-auto">
                                                        {paymentsInRange.map((payment) => {
                                                            const paymentDate = new Date(payment.paymentDate)
                                                            const isPast = paymentDate < now
                                                            return (
                                                                <div key={payment.paymentNumber} className={`p-2 border rounded flex justify-between items-center ${isPast ? 'bg-gray-100' : 'bg-blue-50'}`}>
                                                                    <div>
                                                                        <span className={isPast ? 'text-gray-400 line-through' : 'font-medium'}>
                                                                            {paymentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                                                        </span>
                                                                    </div>
                                                                    <div className="text-right">
                                                                        <div className="font-medium">{formatCurrency(payment.totalPayment)}</div>
                                                                        <div className="text-xs text-muted-foreground">
                                                                            P: {formatCurrency(payment.principalPayment)} | I: {formatCurrency(payment.interestPayment)}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            )
                                                        })}
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </>
                                )
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

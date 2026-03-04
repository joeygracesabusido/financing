import { useState, useMemo } from 'react'
import { formatCurrency } from '@/lib/utils'
import { Calculator, CreditCard, TrendingUp, Clock, Download } from 'lucide-react'

interface AmortizationRow {
    period: number
    date: string
    principal: number
    interest: number
    totalPayment: number
    remainingBalance: number
}

interface LoanCalculatorData {
    monthlyPayment: number
    totalPayment: number
    totalInterest: number
    amortizationSchedule: AmortizationRow[]
}

// Calculate monthly payment for different amortization types
function calculateLoanSchedule(
    principal: number,
    annualRate: number,
    termMonths: number,
    amortizationType: 'flat_rate' | 'declining_balance' | 'balloon_payment' | 'interest_only' = 'declining_balance'
): LoanCalculatorData {
    const monthlyRate = annualRate / 100 / 12
    
    switch (amortizationType) {
        case 'flat_rate': {
            const monthlyPrincipal = principal / termMonths
            const monthlyInterest = (principal * annualRate / 100) / 12
            const monthlyPayment = monthlyPrincipal + monthlyInterest
            
            const schedule: AmortizationRow[] = []
            let remainingBalance = principal
            let currentDate = new Date()
            
            for (let i = 1; i <= termMonths; i++) {
                currentDate.setMonth(currentDate.getMonth() + 1)
                schedule.push({
                    period: i,
                    date: currentDate.toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' }),
                    principal: monthlyPrincipal,
                    interest: monthlyInterest,
                    totalPayment: monthlyPayment,
                    remainingBalance: remainingBalance - monthlyPrincipal
                })
                remainingBalance -= monthlyPrincipal
            }
            
            const totalPayment = monthlyPayment * termMonths
            const totalInterest = totalPayment - principal
            
            return {
                monthlyPayment,
                totalPayment,
                totalInterest,
                amortizationSchedule: schedule
            }
        }
        
        case 'declining_balance': {
            const monthlyPayment = (principal * monthlyRate * Math.pow(1 + monthlyRate, termMonths)) / (Math.pow(1 + monthlyRate, termMonths) - 1)
            
            const schedule: AmortizationRow[] = []
            let remainingBalance = principal
            let currentDate = new Date()
            
            for (let i = 1; i <= termMonths; i++) {
                currentDate.setMonth(currentDate.getMonth() + 1)
                const interestPayment = remainingBalance * monthlyRate
                const principalPayment = monthlyPayment - interestPayment
                
                schedule.push({
                    period: i,
                    date: currentDate.toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' }),
                    principal: principalPayment,
                    interest: interestPayment,
                    totalPayment: monthlyPayment,
                    remainingBalance: remainingBalance - principalPayment
                })
                remainingBalance -= principalPayment
            }
            
            const totalPayment = monthlyPayment * termMonths
            const totalInterest = totalPayment - principal
            
            return {
                monthlyPayment,
                totalPayment,
                totalInterest,
                amortizationSchedule: schedule
            }
        }
        
        case 'balloon_payment': {
            const monthlyRate = annualRate / 100 / 12
            const monthlyPayment = principal * monthlyRate // Interest-only payments
            
            const schedule: AmortizationRow[] = []
            let remainingBalance = principal
            let currentDate = new Date()
            
            for (let i = 1; i <= termMonths; i++) {
                currentDate.setMonth(currentDate.getMonth() + 1)
                const interestPayment = remainingBalance * monthlyRate
                const principalPayment = i === termMonths ? remainingBalance : 0 // Pay principal at end
                
                schedule.push({
                    period: i,
                    date: currentDate.toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' }),
                    principal: principalPayment,
                    interest: interestPayment,
                    totalPayment: principalPayment + interestPayment,
                    remainingBalance: remainingBalance - principalPayment
                })
            }
            
            const totalPayment = monthlyPayment * (termMonths - 1) + (principal + monthlyPayment)
            const totalInterest = totalPayment - principal
            
            return {
                monthlyPayment,
                totalPayment,
                totalInterest,
                amortizationSchedule: schedule
            }
        }
        
        case 'interest_only': {
            const monthlyPayment = principal * monthlyRate
            
            const schedule: AmortizationRow[] = []
            let remainingBalance = principal
            let currentDate = new Date()
            
            for (let i = 1; i <= termMonths; i++) {
                currentDate.setMonth(currentDate.getMonth() + 1)
                const interestPayment = remainingBalance * monthlyRate
                
                const principalPayment = i === termMonths ? remainingBalance : 0 // Principal due at end
                
                schedule.push({
                    period: i,
                    date: currentDate.toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' }),
                    principal: principalPayment,
                    interest: interestPayment,
                    totalPayment: principalPayment + interestPayment,
                    remainingBalance: remainingBalance - principalPayment
                })
            }
            
            const totalPayment = monthlyPayment * (termMonths - 1) + (principal + monthlyPayment)
            const totalInterest = totalPayment - principal
            
            return {
                monthlyPayment,
                totalPayment,
                totalInterest,
                amortizationSchedule: schedule
            }
        }
        
        default:
            return calculateLoanSchedule(principal, annualRate, termMonths, 'declining_balance')
    }
}

export default function LoanCalculatorPage() {
    const [principal, setPrincipal] = useState<number>(100000)
    const [annualRate, setAnnualRate] = useState<number>(8)
    const [termMonths, setTermMonths] = useState<number>(24)
    const [amortizationType, setAmortizationType] = useState<'flat_rate' | 'declining_balance' | 'balloon_payment' | 'interest_only'>('declining_balance')

    const result = useMemo(() => {
        return calculateLoanSchedule(principal, annualRate, termMonths, amortizationType)
    }, [principal, annualRate, termMonths, amortizationType])

    return (
        <div className="container mx-auto px-4 py-8 animate-fade-in">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
                    <Calculator className="w-8 h-8 text-blue-500" />
                    Loan Calculator
                </h1>
                <p className="text-muted-foreground mt-2">
                    Calculate loan payments and view amortization schedules for different scenarios
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Input Section */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-card rounded-xl p-6 shadow-lg border border-border">
                        <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                            <Clock className="w-5 h-5 text-primary" />
                            Loan Parameters
                        </h2>

                        <div className="space-y-5">
                            {/* Loan Amount */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-muted-foreground">
                                    Loan Amount
                                </label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">PHP</span>
                                    <input
                                        type="number"
                                        value={principal}
                                        onChange={(e) => setPrincipal(Number(e.target.value))}
                                        className="w-full bg-background border border-border rounded-lg px-10 py-3 text-foreground font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                                        placeholder="Enter loan amount"
                                        min="0"
                                    />
                                </div>
                                <input
                                    type="range"
                                    min="10000"
                                    max="10000000"
                                    step="10000"
                                    value={principal}
                                    onChange={(e) => setPrincipal(Number(e.target.value))}
                                    className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer"
                                />
                            </div>

                            {/* Interest Rate */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-muted-foreground">
                                    Annual Interest Rate
                                </label>
                                <div className="relative">
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">%</span>
                                    <input
                                        type="number"
                                        value={annualRate}
                                        onChange={(e) => setAnnualRate(Number(e.target.value))}
                                        className="w-full bg-background border border-border rounded-lg px-3 py-3 text-foreground font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                                        placeholder="Enter interest rate"
                                        min="0"
                                        max="100"
                                        step="0.1"
                                    />
                                </div>
                                <input
                                    type="range"
                                    min="1"
                                    max="36"
                                    step="0.5"
                                    value={annualRate}
                                    onChange={(e) => setAnnualRate(Number(e.target.value))}
                                    className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer"
                                />
                            </div>

                            {/* Term */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-muted-foreground">
                                    Term (Months)
                                </label>
                                <div className="relative">
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">mo</span>
                                    <input
                                        type="number"
                                        value={termMonths}
                                        onChange={(e) => setTermMonths(Number(e.target.value))}
                                        className="w-full bg-background border border-border rounded-lg px-3 py-3 text-foreground font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                                        placeholder="Enter term in months"
                                        min="1"
                                        max="360"
                                    />
                                </div>
                                <input
                                    type="range"
                                    min="6"
                                    max="360"
                                    step="6"
                                    value={termMonths}
                                    onChange={(e) => setTermMonths(Number(e.target.value))}
                                    className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer"
                                />
                            </div>

                            {/* Amortization Type */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-muted-foreground">
                                    Amortization Type
                                </label>
                                <select
                                    value={amortizationType}
                                    onChange={(e) => setAmortizationType(e.target.value as any)}
                                    className="w-full bg-background border border-border rounded-lg px-3 py-3 text-foreground focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                                >
                                    <option value="declining_balance">Declining Balance (Standard)</option>
                                    <option value="flat_rate">Flat Rate</option>
                                    <option value="balloon_payment">Balloon Payment</option>
                                    <option value="interest_only">Interest-Only</option>
                                </select>
                                <p className="text-xs text-muted-foreground">
                                    {amortizationType === 'declining_balance' && 'Standard amortization with equal monthly payments'}
                                    {amortizationType === 'flat_rate' && 'Equal principal payments with fixed interest'}
                                    {amortizationType === 'balloon_payment' && 'Low monthly payments with large final payment'}
                                    {amortizationType === 'interest_only' && 'Interest-only payments with lump sum principal due at end'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Results Section */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-card rounded-xl p-6 shadow-lg border border-border">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-3 bg-blue-500/10 rounded-lg">
                                    <CreditCard className="w-6 h-6 text-blue-500" />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Monthly Payment</p>
                                    <h3 className="text-2xl font-bold text-foreground">{formatCurrency(result.monthlyPayment)}</h3>
                                </div>
                            </div>
                        </div>

                        <div className="bg-card rounded-xl p-6 shadow-lg border border-border">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-3 bg-purple-500/10 rounded-lg">
                                    <TrendingUp className="w-6 h-6 text-purple-500" />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Total Interest</p>
                                    <h3 className="text-2xl font-bold text-foreground">{formatCurrency(result.totalInterest)}</h3>
                                </div>
                            </div>
                        </div>

                        <div className="bg-card rounded-xl p-6 shadow-lg border border-border">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-3 bg-green-500/10 rounded-lg">
                                    <Download className="w-6 h-6 text-green-500" />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Total Payment</p>
                                    <h3 className="text-2xl font-bold text-foreground">{formatCurrency(result.totalPayment)}</h3>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Amortization Schedule */}
                    <div className="bg-card rounded-xl p-6 shadow-lg border border-border">
                        <h2 className="text-xl font-semibold mb-6">Amortization Schedule</h2>
                        
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-border">
                                        <th className="py-3 px-4 font-medium text-muted-foreground">Period</th>
                                        <th className="py-3 px-4 font-medium text-muted-foreground">Date</th>
                                        <th className="py-3 px-4 font-medium text-muted-foreground text-right">Principal</th>
                                        <th className="py-3 px-4 font-medium text-muted-foreground text-right">Interest</th>
                                        <th className="py-3 px-4 font-medium text-muted-foreground text-right">Total Payment</th>
                                        <th className="py-3 px-4 font-medium text-muted-foreground text-right">Remaining Balance</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/50">
                                    {result.amortizationSchedule.slice(0, 24).map((row) => (
                                        <tr key={row.period} className="hover:bg-secondary/30 transition-colors">
                                            <td className="py-3 px-4 text-foreground">{row.period}</td>
                                            <td className="py-3 px-4 text-muted-foreground">{row.date}</td>
                                            <td className="py-3 px-4 text-right text-green-500 font-medium">{formatCurrency(row.principal)}</td>
                                            <td className="py-3 px-4 text-right text-red-500 font-medium">{formatCurrency(row.interest)}</td>
                                            <td className="py-3 px-4 text-right text-foreground font-semibold">{formatCurrency(row.totalPayment)}</td>
                                            <td className="py-3 px-4 text-right text-muted-foreground">{formatCurrency(row.remainingBalance)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            
                            {result.amortizationSchedule.length > 24 && (
                                <div className="mt-4 text-center">
                                    <p className="text-sm text-muted-foreground">
                                        Showing first 24 months of {termMonths} months. Total: {formatCurrency(result.totalPayment)}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
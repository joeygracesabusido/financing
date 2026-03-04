import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { getCustomerLoans, getCustomerSavings } from '@/api/customers'

export default function CustomerDashboardPage() {
    const { user } = useAuth()
    const customerId = user?.id

    const [loading, setLoading] = useState(true)
    const [loansData, setLoansData] = useState<any[]>([])
    const [savingsData, setSavingsData] = useState<any[]>([])
    const [totalLoans, setTotalLoans] = useState(0)
    const [totalSavings, setTotalSavings] = useState(0)

    const init = async () => {
        if (!customerId) return
        try {
            const loansRes = await getCustomerLoans()
            const savingsRes = await getCustomerSavings()
            setLoansData(loansRes.loans || [])
            setSavingsData(savingsRes.savingsAccounts.accounts || [])
            
            const loanTotal = (loansRes.loans || []).reduce((sum: number, loan: any) => sum + (loan.principal || 0), 0)
            const savingsTotal = (savingsRes.savingsAccounts.accounts || []).reduce((sum: number, account: any) => sum + (account.balance || 0), 0)
            setTotalLoans(loanTotal)
            setTotalSavings(savingsTotal)
        } catch (e) {
            console.error('Failed to fetch dashboard data:', e)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { init() }, [customerId])

    if (!customerId) return <div className="text-center py-16 text-muted-foreground">Loading...</div>

    return (
        <div className="space-y-6 animate-fade-in">
            <div>
                <h1 className="text-2xl font-bold text-foreground">My Dashboard</h1>
                <p className="text-muted-foreground text-sm mt-1">Welcome back!</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="glass rounded-xl p-6">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                            <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        </div>
                        <h3 className="font-semibold text-foreground">Total Loans</h3>
                    </div>
                    <p className="text-3xl font-bold text-foreground">₱{totalLoans.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground mt-1">{loansData.length} active loans</p>
                </div>
                <div className="glass rounded-xl p-6">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                            <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        </div>
                        <h3 className="font-semibold text-foreground">Total Savings</h3>
                    </div>
                    <p className="text-3xl font-bold text-foreground">₱{totalSavings.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground mt-1">{savingsData.length} active accounts</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="glass rounded-xl overflow-hidden">
                    <div className="p-4 border-b border-border/50">
                        <h3 className="font-semibold text-foreground">My Loans</h3>
                    </div>
                    <div className="p-4 space-y-3">
                        {loansData.length === 0 ? (
                            <p className="text-center text-muted-foreground text-sm">No active loans</p>
                        ) : loansData.map((loan) => (
                            <div key={loan.id} className="p-3 rounded-lg border border-border/50 hover:bg-white/5 transition-colors">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="font-medium text-foreground">{loan.productName}</span>
                                    <span className={`text-xs px-2 py-1 rounded-full ${loan.status === 'active' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-gray-500/20 text-gray-400'}`}>
                                        {loan.status}
                                    </span>
                                </div>
                                <div className="text-sm text-muted-foreground">
                                    <p>Principal: ₱{loan.principal?.toLocaleString()}</p>
                                    <p>Outstanding: ₱{loan.outstandingBalance?.toLocaleString()}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="glass rounded-xl overflow-hidden">
                    <div className="p-4 border-b border-border/50">
                        <h3 className="font-semibold text-foreground">My Savings</h3>
                    </div>
                    <div className="p-4 space-y-3">
                        {savingsData.length === 0 ? (
                            <p className="text-center text-muted-foreground text-sm">No savings accounts</p>
                        ) : savingsData.map((account) => (
                            <div key={account.id} className="p-3 rounded-lg border border-border/50 hover:bg-white/5 transition-colors">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="font-medium text-foreground">{account.accountNumber}</span>
                                    <span className={`text-xs px-2 py-1 rounded-full ${account.status === 'active' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                                        {account.status}
                                    </span>
                                </div>
                                <div className="text-sm text-muted-foreground">
                                    <p className="font-medium">Balance: ₱{account.balance?.toLocaleString()}</p>
                                    <p>Opened: {new Date(account.openedAt).toLocaleDateString()}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}

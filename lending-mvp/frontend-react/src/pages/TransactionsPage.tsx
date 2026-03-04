import { ArrowLeftRight, Info } from 'lucide-react'

export default function TransactionsPage() {
    return (
        <div className="space-y-5 animate-fade-in">
            <div>
                <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                    <ArrowLeftRight className="w-6 h-6 text-blue-400" /> Transactions
                </h1>
                <p className="text-muted-foreground text-sm mt-1">Deposit & withdrawal history</p>
            </div>

            <div className="glass rounded-xl p-8 text-center">
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mx-auto mb-4">
                    <Info className="w-6 h-6 text-blue-400" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">Select a Savings Account</h3>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                    To view or record transactions, go to{' '}
                    <a href="/savings" className="text-primary hover:underline">Savings Accounts</a>{' '}
                    and select an account to view its transaction history or make a deposit/withdrawal.
                </p>
            </div>
        </div>
    )
}

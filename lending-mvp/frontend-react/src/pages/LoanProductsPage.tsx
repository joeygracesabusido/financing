import { useQuery } from '@apollo/client'
import { GET_LOAN_PRODUCTS } from '@/api/queries'
import { formatCurrency } from '@/lib/utils'
import { Package, Plus, Loader2 } from 'lucide-react'

interface LoanProduct {
    id: string
    name: string
    interestRate: number
    minAmount: number
    maxAmount: number
    minTerm: number
    maxTerm: number
    description: string
}

export default function LoanProductsPage() {
    const { data, loading, error } = useQuery(GET_LOAN_PRODUCTS)
    const products: LoanProduct[] = data?.loanProducts ?? []

    return (
        <div className="space-y-5 animate-fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                        <Package className="w-6 h-6 text-purple-400" /> Loan Products
                    </h1>
                    <p className="text-muted-foreground text-sm mt-1">
                        {loading ? 'Loading...' : `${products.length} configured products`}
                    </p>
                </div>
                <button className="flex items-center gap-2 px-4 py-2.5 bg-purple-500/15 border border-purple-500/30 text-purple-400 text-sm font-semibold rounded-lg hover:bg-purple-500/25 transition-all duration-200">
                    <Plus className="w-4 h-4" /> New Product
                </button>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-purple-400" /></div>
            ) : error ? (
                <div className="py-20 text-center text-destructive text-sm">{error.message}</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {products.length === 0 ? (
                        <div className="col-span-full py-16 text-center text-muted-foreground">No loan products configured</div>
                    ) : (
                        products.map((p) => (
                            <div key={p.id} className="glass rounded-xl p-5 hover:border-purple-500/30 transition-all duration-300 cursor-pointer group">
                                <div className="flex items-start justify-between mb-3">
                                    <h3 className="font-semibold text-foreground group-hover:text-purple-400 transition-colors">{p.name}</h3>
                                    <span className="px-2 py-1 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-md text-xs font-bold">
                                        {p.interestRate}% p.a.
                                    </span>
                                </div>
                                {p.description && (
                                    <p className="text-xs text-muted-foreground mb-4 line-clamp-2">{p.description}</p>
                                )}
                                <div className="space-y-2 text-xs">
                                    <div className="flex justify-between text-muted-foreground">
                                        <span>Loan Amount</span>
                                        <span className="text-foreground font-medium">
                                            {formatCurrency(p.minAmount)} – {formatCurrency(p.maxAmount)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-muted-foreground">
                                        <span>Term</span>
                                        <span className="text-foreground font-medium">{p.minTerm} – {p.maxTerm} months</span>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    )
}

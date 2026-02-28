import { useState } from 'react'
import { useQuery } from '@apollo/client'
import { GET_LOANS } from '@/api/queries'
import { formatCurrency, formatDate, getLoanStatusColor } from '@/lib/utils'
import { CreditCard, Search, Plus, Loader2, ArrowRight } from 'lucide-react'

interface Loan {
    id: string
    customerId: string
    borrowerName: string
    productId: string
    productName: string
    principal: number
    termMonths: number
    approvedPrincipal?: number
    approvedRate?: number
    status: string
    createdAt: string
    updatedAt: string
    disbursedAt?: string
    outstandingBalance?: number
    nextDueDate?: string
    monthsPaid?: number
}

const PIPELINE_STAGES = [
    { id: 'draft', label: 'Draft' },
    { id: 'submitted', label: 'Submitted' },
    { id: 'reviewing', label: 'Reviewing' },
    { id: 'approved', label: 'Approved' },
    { id: 'active', label: 'Active' },
    { id: 'paid', label: 'Paid / Closed' },
]

export default function LoansPage() {
    const [search, setSearch] = useState('')
    const [viewMode, setViewMode] = useState<'list' | 'kanban'>('kanban')
    const { data, loading, error } = useQuery(GET_LOANS, {
        variables: { skip: 0, limit: 100 }
    })

    const loans: Loan[] = data?.loans?.loans ?? []
    const filtered = loans.filter((l) => {
        const q = search.toLowerCase()
        return (
            !q ||
            l.borrowerName?.toLowerCase().includes(q) ||
            l.productName?.toLowerCase().includes(q) ||
            l.id.includes(q)
        )
    })

    const totalOutstanding = loans.reduce((s, l) => s + (l.status === 'active' ? (l.outstandingBalance || l.approvedPrincipal || l.principal) : 0), 0)

    const renderKanbanCard = (l: Loan) => (
        <div key={l.id} className="glass rounded-xl p-4 space-y-3 hover:border-purple-500/30 transition-colors cursor-pointer group">
            <div className="flex justify-between items-start">
                <div>
                    <h4 className="font-semibold text-sm group-hover:text-purple-400 transition-colors">{l.borrowerName}</h4>
                    <p className="text-xs text-muted-foreground">{l.productName}</p>
                </div>
                <span className={`px-2 py-0.5 rounded-md border text-[10px] uppercase font-bold tracking-wider ${getLoanStatusColor(l.status)}`}>
                    {l.status}
                </span>
            </div>
            <div className="pt-2 border-t border-border/50 flex justify-between items-end">
                <div>
                    <p className="text-[10px] text-muted-foreground">Amount</p>
                    <p className="font-semibold text-sm">{formatCurrency(l.approvedPrincipal || l.principal)}</p>
                </div>
                <div className="text-right">
                    <p className="text-[10px] text-muted-foreground">Term</p>
                    <p className="font-semibold text-sm">{l.termMonths} mo</p>
                </div>
            </div>
            <div className="pt-1 flex items-center justify-between text-[10px] text-muted-foreground">
                <span>{formatDate(l.createdAt)}</span>
                <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
            </div>
        </div>
    )

    return (
        <div className="space-y-5 animate-fade-in flex flex-col h-[calc(100vh-8rem)]">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                        <CreditCard className="w-6 h-6 text-yellow-400" /> Loans Pipeline
                    </h1>
                    <p className="text-muted-foreground text-sm mt-1">
                        {loading ? 'Loading...' : `${loans.length} loans · Active Portfolio: ${formatCurrency(totalOutstanding)}`}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="bg-secondary/50 p-1 rounded-lg flex gap-1">
                        <button
                            onClick={() => setViewMode('kanban')}
                            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${viewMode === 'kanban' ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                        >
                            Kanban
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${viewMode === 'list' ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                        >
                            List
                        </button>
                    </div>
                    <button className="flex items-center gap-2 px-4 py-2.5 bg-yellow-400/10 border border-yellow-400/20 text-yellow-500 text-sm font-semibold rounded-lg hover:bg-yellow-400/20 transition-all duration-200">
                        <Plus className="w-4 h-4" /> New Application
                    </button>
                </div>
            </div>

            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by borrower, product, or ID..."
                    className="w-full pl-10 pr-4 py-2.5 bg-secondary/50 border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-200 max-w-sm"
                />
            </div>

            {loading ? (
                <div className="flex-1 flex items-center justify-center">
                    <Loader2 className="w-6 h-6 animate-spin text-yellow-400" />
                </div>
            ) : error ? (
                <div className="flex-1 flex items-center justify-center text-destructive text-sm">{error.message}</div>
            ) : viewMode === 'kanban' ? (
                <div className="flex-1 flex gap-4 overflow-x-auto pb-4 scrollbar-thin">
                    {PIPELINE_STAGES.map(stage => {
                        const stageLoans = filtered.filter(l => l.status === stage.id)
                        return (
                            <div key={stage.id} className="min-w-[320px] w-[320px] flex flex-col bg-secondary/20 rounded-xl p-3 border border-border/50">
                                <div className="flex items-center justify-between mb-3 px-1">
                                    <h3 className="font-semibold text-sm text-foreground flex items-center gap-2">
                                        <div className={`w-2 h-2 rounded-full ${stage.id === 'active' ? 'bg-emerald-400' : stage.id === 'paid' ? 'bg-blue-400' : stage.id === 'approved' ? 'bg-indigo-400' : 'bg-yellow-400'}`} />
                                        {stage.label}
                                    </h3>
                                    <span className="text-xs font-medium text-muted-foreground bg-secondary/50 px-2 py-0.5 rounded-full">
                                        {stageLoans.length}
                                    </span>
                                </div>
                                <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                                    {stageLoans.map(renderKanbanCard)}
                                    {stageLoans.length === 0 && (
                                        <div className="h-24 border-2 border-dashed border-border/50 rounded-xl flex items-center justify-center text-xs text-muted-foreground/50">
                                            No applications
                                        </div>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>
            ) : (
                <div className="flex-1 glass rounded-xl overflow-hidden overflow-y-auto">
                    <table className="w-full">
                        <thead className="sticky top-0 z-10">
                            <tr className="border-b border-border/50 bg-secondary">
                                {['ID', 'Borrower', 'Product', 'Principal', 'Term', 'Status', 'Date'].map((h) => (
                                    <th key={h} className="text-left px-4 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.length === 0 ? (
                                <tr><td colSpan={7} className="py-16 text-center text-muted-foreground text-sm">No applications found</td></tr>
                            ) : (
                                filtered.map((l) => (
                                    <tr key={l.id} className="data-table-row cursor-pointer hover:bg-secondary/30">
                                        <td className="px-4 py-3.5 font-mono text-xs text-muted-foreground">...{l.id.slice(-6)}</td>
                                        <td className="px-4 py-3.5 text-sm font-medium text-foreground">{l.borrowerName}</td>
                                        <td className="px-4 py-3.5 text-sm text-muted-foreground">{l.productName}</td>
                                        <td className="px-4 py-3.5 text-sm text-foreground font-semibold">{formatCurrency(l.approvedPrincipal || l.principal)}</td>
                                        <td className="px-4 py-3.5 text-sm text-muted-foreground">{l.termMonths} mo</td>
                                        <td className="px-4 py-3.5">
                                            <span className={`px-2 py-1 rounded-md border text-xs font-medium uppercase tracking-wider ${getLoanStatusColor(l.status)}`}>
                                                {l.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3.5 text-sm text-muted-foreground">{formatDate(l.createdAt)}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    )
}

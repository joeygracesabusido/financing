import { useState } from 'react'
import { useQuery } from '@apollo/client'
import { GET_CUSTOMERS } from '@/api/queries'
import { formatDate } from '@/lib/utils'
import { Users, Search, Plus, Loader2, ShieldCheck, AlertCircle } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'

const KYC_STATUS_BADGE: Record<string, string> = {
    pending: 'bg-amber-400/10 text-amber-400 border-amber-400/20',
    submitted: 'bg-sky-400/10 text-sky-400 border-sky-400/20',
    verified: 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20',
    rejected: 'bg-destructive/10 text-destructive border-destructive/20',
}

const CATEGORY_BADGE: Record<string, string> = {
    individual: 'bg-primary/10 text-primary border-primary/20',
    joint: 'bg-indigo-400/10 text-indigo-400 border-indigo-400/20',
    corporate: 'bg-purple-400/10 text-purple-400 border-purple-400/20',
}

export default function CustomersPage() {
    const [search, setSearch] = useState('')
    const navigate = useNavigate()

    const { data, loading, error } = useQuery(GET_CUSTOMERS, {
        variables: { skip: 0, limit: 200, searchTerm: search || null },
        fetchPolicy: 'cache-and-network',
    })

    const customers: any[] = data?.customers?.customers ?? []
    const total: number = data?.customers?.total ?? 0

    const filtered = customers.filter((c) => {
        const q = search.toLowerCase()
        return (
            !q ||
            c.displayName?.toLowerCase().includes(q) ||
            c.emailAddress?.toLowerCase().includes(q) ||
            c.mobileNumber?.includes(q)
        )
    })

    return (
        <div className="space-y-5 animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                        <Users className="w-6 h-6 text-primary" /> Customers
                    </h1>
                    <p className="text-muted-foreground text-sm mt-1">
                        {loading ? 'Loading...' : `${total} registered customers`}
                    </p>
                </div>
                <Link
                    to="/customers/new"
                    className="flex items-center gap-2 px-4 py-2.5 gradient-primary text-white text-sm font-semibold rounded-lg shadow-lg shadow-primary/25 hover:opacity-90 transition-all duration-200"
                >
                    <Plus className="w-4 h-4" /> Add Customer
                </Link>
            </div>

            {/* Search */}
            <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by name, email, or phone..."
                    className="w-full pl-10 pr-4 py-2.5 bg-secondary/50 border border-border rounded-lg text-sm
                     text-foreground placeholder:text-muted-foreground
                     focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary
                     transition-all duration-200"
                />
            </div>

            {/* Table */}
            <div className="glass rounded-xl overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    </div>
                ) : error ? (
                    <div className="py-20 text-center text-destructive text-sm flex flex-col items-center gap-2">
                        <AlertCircle className="w-8 h-8" />
                        <p>{error.message}</p>
                    </div>
                ) : (
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-border/50 bg-secondary/30">
                                {['Name', 'Email', 'Mobile', 'Category', 'KYC', 'Branch', 'Joined'].map((h) => (
                                    <th key={h} className="text-left px-5 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="py-16 text-center text-muted-foreground text-sm">
                                        No customers found
                                    </td>
                                </tr>
                            ) : (
                                filtered.map((c: any) => (
                                    <tr
                                        key={c.id}
                                        onClick={() => navigate(`/customers/${c.id}`)}
                                        className="border-b border-border/30 hover:bg-white/5 transition-colors cursor-pointer"
                                    >
                                        <td className="px-5 py-3.5">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                                                    {c.displayName?.[0]?.toUpperCase() ?? '?'}
                                                </div>
                                                <span className="font-medium text-sm text-foreground">
                                                    {c.displayName}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-5 py-3.5 text-sm text-muted-foreground">{c.emailAddress ?? '—'}</td>
                                        <td className="px-5 py-3.5 text-sm text-muted-foreground">{c.mobileNumber ?? '—'}</td>
                                        <td className="px-5 py-3.5">
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium border capitalize ${CATEGORY_BADGE[c.customerCategory ?? 'individual'] ?? 'bg-zinc-500/15 text-zinc-400'}`}>
                                                {c.customerCategory ?? 'individual'}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border capitalize w-fit ${KYC_STATUS_BADGE[c.kycStatus ?? 'pending'] ?? KYC_STATUS_BADGE.pending}`}>
                                                <ShieldCheck className="w-3 h-3" />
                                                {c.kycStatus ?? 'pending'}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3.5 text-sm text-muted-foreground">{c.branch ?? '—'}</td>
                                        <td className="px-5 py-3.5 text-sm text-muted-foreground">{formatDate(c.createdAt)}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    )
}

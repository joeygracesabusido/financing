import { useQuery } from '@apollo/client'
import { GET_CUSTOMERS } from '@/api/queries'
import { formatDate } from '@/lib/utils'
import { Users, Search, Plus, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'

interface Customer {
    id: string
    firstName: string
    lastName: string
    emailAddress: string
    contactNumber: string
    address: string
    createdAt: string
}

export default function CustomersPage() {
    const [search, setSearch] = useState('')
    const { data, loading, error } = useQuery(GET_CUSTOMERS)

    const customers: Customer[] = data?.customers ?? []
    const filtered = customers.filter((c) => {
        const q = search.toLowerCase()
        return (
            !q ||
            `${c.firstName} ${c.lastName}`.toLowerCase().includes(q) ||
            c.emailAddress?.toLowerCase().includes(q) ||
            c.contactNumber?.includes(q)
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
                        {loading ? 'Loading...' : `${customers.length} registered customers`}
                    </p>
                </div>
                <Link
                    to="/customers/new"
                    className="flex items-center gap-2 px-4 py-2.5 gradient-primary text-white text-sm font-semibold
                     rounded-lg shadow-lg shadow-primary/25 hover:opacity-90 transition-all duration-200"
                >
                    <Plus className="w-4 h-4" /> Add Customer
                </Link>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by name, email, or phone..."
                    className="w-full pl-10 pr-4 py-2.5 bg-secondary/50 border border-border rounded-lg text-sm
                     text-foreground placeholder:text-muted-foreground
                     focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary
                     transition-all duration-200 max-w-sm"
                />
            </div>

            {/* Table */}
            <div className="glass rounded-xl overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    </div>
                ) : error ? (
                    <div className="py-20 text-center text-destructive text-sm">{error.message}</div>
                ) : (
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-border/50 bg-secondary/30">
                                {['Name', 'Email', 'Contact', 'Address', 'Joined'].map((h) => (
                                    <th key={h} className="text-left px-5 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="py-16 text-center text-muted-foreground text-sm">
                                        No customers found
                                    </td>
                                </tr>
                            ) : (
                                filtered.map((c) => (
                                    <tr key={c.id} className="data-table-row">
                                        <td className="px-5 py-3.5">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                                                    {c.firstName?.[0]}{c.lastName?.[0]}
                                                </div>
                                                <span className="font-medium text-sm text-foreground">
                                                    {c.firstName} {c.lastName}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-5 py-3.5 text-sm text-muted-foreground">{c.emailAddress}</td>
                                        <td className="px-5 py-3.5 text-sm text-muted-foreground">{c.contactNumber}</td>
                                        <td className="px-5 py-3.5 text-sm text-muted-foreground max-w-xs truncate">{c.address}</td>
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

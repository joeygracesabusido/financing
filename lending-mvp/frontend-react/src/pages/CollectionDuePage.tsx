import { useState, useEffect } from 'react'
import { Search, AlertCircle, FileText } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'

interface Collection {
    id: string
    customerId: string
    amount: number
    status: string
    dueDate: string
    createdAt: string
}

export default function CollectionDuePage() {
    const { user } = useAuth()
    const isAdmin = user?.role === 'admin' || user?.role === 'branch_manager'

    const [loading, setLoading] = useState(true)
    const [collectionsData, setCollectionsData] = useState<Collection[]>([])
    const [days, setDays] = useState(30)
    const [search, setSearch] = useState('')

    const init = async () => {
        try {
            const res = await fetch('/graphql', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    query: `query GetCollectionsDue { collectionDue { id customerId amount status dueDate createdAt } }`
                })
            })
            const data = await res.json()
            setCollectionsData(data.data?.collectionDue || [])
        } catch (e) {
            console.error('Failed to fetch collections due:', e)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { init() }, [])

    const getStatusColor = (status: string) => {
        const colors: { [key: string]: string } = {
            'pending': 'bg-amber-500/20 text-amber-400',
            'overdue': 'bg-red-500/20 text-red-400',
            'collected': 'bg-emerald-500/20 text-emerald-400'
        }
        return colors[status] || 'bg-gray-500/20 text-gray-400'
    }

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Collections Due</h1>
                    <p className="text-muted-foreground text-sm mt-1">Overdue collections within {days} days</p>
                </div>
                {isAdmin && (
                    <div className="flex gap-2">
                        <select value={days} onChange={e => setDays(Number(e.target.value))} className="px-3 py-2 rounded-lg border border-border bg-background/50 focus:outline-none focus:border-primary/50 text-sm">
                            <option value={7}>7 days</option>
                            <option value={30}>30 days</option>
                            <option value={60}>60 days</option>
                            <option value={90}>90 days</option>
                        </select>
                        <button className="flex items-center gap-2 px-4 py-2 rounded-lg gradient-primary text-white text-sm font-medium shadow-lg hover:opacity-90 transition-opacity">
                            <FileText className="w-4 h-4" /> Generate Report
                        </button>
                    </div>
                )}
            </div>

            {loading ? (
                <div className="text-center py-16 text-muted-foreground">Loading collections…</div>
            ) : (
                <div className="glass rounded-xl overflow-hidden">
                    <div className="p-4 border-b border-border/50">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search collections..." className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-background/50 focus:outline-none focus:border-primary/50" />
                        </div>
                    </div>
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-border/50">
                                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Amount</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Due Date</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Days Overdue</th>
                            </tr>
                        </thead>
                        <tbody>
                            {collectionsData.length === 0 ? (
                                <tr><td colSpan={4} className="text-center py-12 text-muted-foreground">No collections due within {days} days</td></tr>
                            ) : collectionsData.map((collection) => {
                                const dueDate = new Date(collection.dueDate)
                                const today = new Date()
                                const daysOverdue = Math.max(0, Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)))
                                return (
                                    <tr key={collection.id} className="border-b border-border/30 hover:bg-white/5 transition-colors">
                                        <td className="px-4 py-3 text-foreground font-medium">₱{collection.amount.toLocaleString()}</td>
                                        <td className="px-4 py-3 text-muted-foreground">{new Date(collection.dueDate).toLocaleDateString()}</td>
                                        <td className="px-4 py-3">
                                            <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(collection.status)}`}>
                                                {collection.status.charAt(0).toUpperCase() + collection.status.slice(1)}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`text-xs font-medium ${daysOverdue > 30 ? 'text-red-400' : 'text-amber-400'}`}>
                                                {daysOverdue} days
                                            </span>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    )
}

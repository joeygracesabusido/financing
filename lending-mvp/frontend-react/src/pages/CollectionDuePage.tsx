import { useState, useEffect, useMemo } from 'react'
import { Search, AlertCircle, FileText, Calendar, TrendingUp, CreditCard, RefreshCw } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { formatCurrency } from '@/lib/utils'

interface Collection {
    id: string
    customerId: string
    borrowerName?: string
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
    const [days, setDays] = useState(7)
    const [search, setSearch] = useState('')

    const fetchData = async () => {
        setLoading(true)
        try {
            const token = localStorage.getItem('access_token')
            const res = await fetch('/graphql', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': token ? `Bearer ${token}` : ''
                },
                body: JSON.stringify({
                    query: `query GetCollectionsDue { collectionDue { id customerId borrowerName amount status dueDate createdAt } }`
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

    useEffect(() => { 
        fetchData() 
    }, [])

    // Filter collections based on days range
    const filteredCollections = useMemo(() => {
        const today = new Date()
        const startDate = new Date(today)
        startDate.setDate(today.getDate() - days)
        
        return collectionsData.filter(c => {
            const dueDate = new Date(c.dueDate)
            // Include collections due within the range (from startDate to today + days into future)
            const endDate = new Date(today)
            endDate.setDate(today.getDate() + days)
            
            return dueDate >= startDate && dueDate <= endDate
        })
    }, [collectionsData, days])

    // Filter by search
    const searchFiltered = useMemo(() => {
        if (!search.trim()) return filteredCollections
        const searchLower = search.toLowerCase()
        return filteredCollections.filter(c => 
            c.borrowerName?.toLowerCase().includes(searchLower) ||
            c.customerId.toLowerCase().includes(searchLower) ||
            c.id.toLowerCase().includes(searchLower)
        )
    }, [filteredCollections, search])

    // Calculate totals
    const totalDue = searchFiltered.reduce((sum, c) => sum + c.amount, 0)
    const overdueCount = searchFiltered.filter(c => {
        const dueDate = new Date(c.dueDate)
        return dueDate < new Date() && c.status !== 'collected'
    }).length
    const pendingCount = searchFiltered.filter(c => c.status === 'pending').length
    const collectedCount = searchFiltered.filter(c => c.status === 'collected').length

    const getStatusColor = (status: string) => {
        const colors: { [key: string]: string } = {
            'pending': 'bg-amber-500/20 text-amber-400',
            'overdue': 'bg-red-500/20 text-red-400',
            'collected': 'bg-emerald-500/20 text-emerald-400'
        }
        return colors[status] || 'bg-gray-500/20 text-gray-400'
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 space-y-6 animate-fade-in p-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">Due Collections</h1>
                    <p className="text-slate-400 text-sm mt-1">Loan repayment schedule and receivables overview</p>
                </div>
                <div className="flex gap-2">
                    <select 
                        value={days} 
                        onChange={e => {
                            setDays(Number(e.target.value))
                            setSearch('')
                        }} 
                        className="px-3 py-2 rounded-lg border border-slate-600 bg-slate-800/50 focus:outline-none focus:border-blue-400 text-sm text-slate-200"
                    >
                        <option value={7}>Next 7 days</option>
                        <option value={14}>Next 14 days</option>
                        <option value={30}>Next 30 days</option>
                        <option value={60}>Next 60 days</option>
                        <option value={90}>Next 90 days</option>
                    </select>
                    <button 
                        onClick={fetchData}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-600 bg-slate-800/50 hover:bg-slate-700/50 text-slate-200 text-sm transition-colors"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                    {isAdmin && (
                        <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-blue-500 text-white text-sm font-medium shadow-lg hover:opacity-90 transition-opacity">
                            <FileText className="w-4 h-4" /> Generate Report
                        </button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="glass rounded-xl p-4 border border-slate-700/50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-amber-500/20">
                            <Calendar className="w-5 h-5 text-amber-400" />
                        </div>
                        <div>
                            <p className="text-xs text-slate-400 uppercase tracking-wider">Total Due ({days} days)</p>
                            <p className="text-lg font-bold text-white">{formatCurrency(totalDue)}</p>
                        </div>
                    </div>
                </div>
                <div className="glass rounded-xl p-4 border border-slate-700/50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-red-500/20">
                            <AlertCircle className="w-5 h-5 text-red-400" />
                        </div>
                        <div>
                            <p className="text-xs text-slate-400 uppercase tracking-wider">Overdue</p>
                            <p className="text-lg font-bold text-white">{overdueCount}</p>
                        </div>
                    </div>
                </div>
                <div className="glass rounded-xl p-4 border border-slate-700/50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-blue-500/20">
                            <CreditCard className="w-5 h-5 text-blue-400" />
                        </div>
                        <div>
                            <p className="text-xs text-slate-400 uppercase tracking-wider">Pending</p>
                            <p className="text-lg font-bold text-white">{pendingCount}</p>
                        </div>
                    </div>
                </div>
                <div className="glass rounded-xl p-4 border border-slate-700/50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-emerald-500/20">
                            <TrendingUp className="w-5 h-5 text-emerald-400" />
                        </div>
                        <div>
                            <p className="text-xs text-slate-400 uppercase tracking-wider">Collected</p>
                            <p className="text-lg font-bold text-white">{collectedCount}</p>
                        </div>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-16 text-slate-400">Loading collections…</div>
            ) : (
                <div className="glass rounded-xl overflow-hidden border border-slate-700/50">
                    <div className="p-4 border-b border-slate-700/50">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input 
                                value={search} 
                                onChange={e => setSearch(e.target.value)} 
                                placeholder="Search by customer, ID, or reference..." 
                                className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-600 bg-slate-800/50 focus:outline-none focus:border-blue-400 text-slate-200" 
                            />
                        </div>
                    </div>
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-slate-700/50">
                                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Customer</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Reference No.</th>
                                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Amount Due</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Due Date</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Days</th>
                            </tr>
                        </thead>
                        <tbody>
                            {searchFiltered.length === 0 ? (
                                <tr><td colSpan={6} className="text-center py-12 text-slate-400">No due collections found</td></tr>
                            ) : searchFiltered.map((collection) => {
                                const dueDate = new Date(collection.dueDate)
                                const today = new Date()
                                const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))
                                return (
                                    <tr key={collection.id} className="border-b border-slate-700/30 hover:bg-slate-800/50 transition-colors">
                                        <td className="px-4 py-3 text-white font-medium">{collection.borrowerName || collection.customerId}</td>
                                        <td className="px-4 py-3 text-slate-400 font-mono text-xs">{collection.id.slice(-8).toUpperCase()}</td>
                                        <td className="px-4 py-3 text-white font-medium text-right">{formatCurrency(collection.amount)}</td>
                                        <td className="px-4 py-3 text-slate-400">{new Date(collection.dueDate).toLocaleDateString()}</td>
                                        <td className="px-4 py-3">
                                            <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(collection.status)}`}>
                                                {collection.status.charAt(0).toUpperCase() + collection.status.slice(1)}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`text-xs font-medium ${daysOverdue > 30 ? 'text-red-400' : daysOverdue > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                                                {daysOverdue > 0 ? `${daysOverdue} days overdue` : daysOverdue < 0 ? `${Math.abs(daysOverdue)} days` : 'Due today'}
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

import { useState, useEffect } from 'react'
import { FileText, Search, ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useNavigate } from 'react-router-dom'

const getHeaders = () => {
    const token = localStorage.getItem('access_token')
    return {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
    }
}

interface JournalLine {
    id: string
    accountCode: string
    accountName: string
    debit: number
    credit: number
    description: string
}

interface JournalEntry {
    id: string
    referenceNo: string
    description: string
    timestamp: string
    createdBy: string
    lines: JournalLine[]
}

export default function JournalEntriesPage() {
    const { user } = useAuth()
    const navigate = useNavigate()
    const [loading, setLoading] = useState(true)
    const [entries, setEntries] = useState<JournalEntry[]>([])
    const [searchTerm, setSearchTerm] = useState('')
    const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null)
    const [showModal, setShowModal] = useState(false)
    const [currentPage, setCurrentPage] = useState(1)
    const [total, setTotal] = useState(0)
    const itemsPerPage = 50

    const fetchEntries = async (page = 1, referenceNo = '') => {
        try {
            const skip = (page - 1) * itemsPerPage
            const res = await fetch('/graphql', {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify({
                    query: `query GetJournalEntries($skip: Int!, $limit: Int!, $referenceNo: String) {
                        journalEntries(skip: $skip, limit: $limit, referenceNo: $referenceNo) {
                            success
                            message
                            entries {
                                id
                                referenceNo
                                description
                                timestamp
                                createdBy
                                lines {
                                    id
                                    accountCode
                                    accountName
                                    debit
                                    credit
                                    description
                                }
                            }
                            total
                        }
                    }`,
                    variables: { skip, limit: itemsPerPage, referenceNo: referenceNo || null }
                })
            })
            const data = await res.json()
            const journalData = data.data?.journalEntries
            if (journalData) {
                setEntries(journalData.entries || [])
                setTotal(journalData.total || 0)
            }
        } catch (e) {
            console.error('Failed to fetch journal entries:', e)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchEntries(currentPage, searchTerm)
    }, [currentPage, searchTerm])

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault()
        setCurrentPage(1)
        fetchEntries(1, searchTerm)
    }

    const totalPages = Math.ceil(total / itemsPerPage)
    const canCreateEntry = ['admin', 'branch_manager', 'teller', 'book_keeper'].includes(user?.role || '')

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Journal Entries</h1>
                    <p className="text-muted-foreground text-sm mt-1">General Ledger transactions</p>
                </div>
                {canCreateEntry && (
                    <button
                        onClick={() => navigate('/journal-entries/create')}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white text-sm font-medium transition-colors shadow-lg shadow-blue-500/20"
                    >
                        <Plus className="w-4 h-4" /> Create Journal Entry
                    </button>
                )}
            </div>

            {/* Search Bar */}
            <form onSubmit={(e) => e.preventDefault()} className="flex gap-2">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => {
                            setSearchTerm(e.target.value)
                            setCurrentPage(1)
                        }}
                        placeholder="Search by reference number or description..."
                        className="w-full pl-10 pr-4 py-2 bg-white/5 border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    />
                </div>
                <button
                    type="button"
                    onClick={() => { setSearchTerm(''); setCurrentPage(1); }}
                    className="px-4 py-2 border border-border rounded-lg text-muted-foreground hover:bg-white/5 transition-colors"
                >
                    Clear
                </button>
            </form>

            {loading ? (
                <div className="text-center py-16 text-muted-foreground">Loading entries…</div>
            ) : (
                <div className="glass rounded-xl overflow-hidden">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-border/50">
                                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Reference No</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Description</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Date</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Lines</th>
                                <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {entries.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="text-center py-12 text-muted-foreground">No journal entries found.</td>
                                </tr>
                            ) : (
                                entries.map((entry) => (
                                    <tr key={entry.id} className="border-b border-border/30 hover:bg-white/5 transition-colors">
                                        <td className="px-4 py-3 font-mono text-foreground font-medium">{entry.referenceNo}</td>
                                        <td className="px-4 py-3 text-foreground">{entry.description}</td>
                                        <td className="px-4 py-3 text-muted-foreground">
                                            {new Date(entry.timestamp).toLocaleDateString()}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="text-xs px-2 py-1 rounded-full bg-white/10 text-foreground">
                                                {entry.lines.length} lines
                                            </span>
                                        </td>
                                        <td className="text-right px-4 py-3">
                                            <button
                                                onClick={() => { setSelectedEntry(entry); setShowModal(true) }}
                                                className="text-blue-400 hover:text-blue-300 transition-colors"
                                            >
                                                View Details
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2">
                    <button
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="p-2 rounded-lg border border-border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/5 transition-colors"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-sm text-muted-foreground">
                        Page {currentPage} of {totalPages}
                    </span>
                    <button
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="p-2 rounded-lg border border-border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/5 transition-colors"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* Detail Modal */}
            {showModal && selectedEntry && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-[#1a1d23] rounded-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
                        <div className="sticky top-0 bg-[#1a1d23] border-b border-border p-4 flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-semibold text-foreground">Journal Entry Details</h3>
                                <p className="text-sm text-muted-foreground">{selectedEntry.referenceNo}</p>
                            </div>
                            <button
                                onClick={() => setShowModal(false)}
                                className="p-2 hover:bg-white/5 rounded-lg transition-colors"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="p-4 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs text-muted-foreground">Description</label>
                                    <p className="text-foreground">{selectedEntry.description}</p>
                                </div>
                                <div>
                                    <label className="text-xs text-muted-foreground">Date</label>
                                    <p className="text-foreground">
                                        {new Date(selectedEntry.timestamp).toLocaleString()}
                                    </p>
                                </div>
                                <div>
                                    <label className="text-xs text-muted-foreground">Created By</label>
                                    <p className="text-foreground">{selectedEntry.createdBy}</p>
                                </div>
                            </div>

                            <div className="border-t border-border pt-4">
                                <h4 className="text-sm font-semibold text-foreground mb-3">Journal Lines</h4>
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-border/50">
                                            <th className="text-left px-3 py-2 text-xs font-semibold text-muted-foreground uppercase">Account</th>
                                            <th className="text-left px-3 py-2 text-xs font-semibold text-muted-foreground uppercase">Description</th>
                                            <th className="text-right px-3 py-2 text-xs font-semibold text-muted-foreground uppercase">Debit</th>
                                            <th className="text-right px-3 py-2 text-xs font-semibold text-muted-foreground uppercase">Credit</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {selectedEntry.lines.map((line) => (
                                            <tr key={line.id} className="border-b border-border/30">
                                                <td className="px-3 py-2 text-foreground">
                                                    <div className="font-mono text-xs text-muted-foreground">{line.accountCode}</div>
                                                    <div>{line.accountName}</div>
                                                </td>
                                                <td className="px-3 py-2 text-muted-foreground">{line.description}</td>
                                                <td className="px-3 py-2 text-right text-foreground font-medium">
                                                    {line.debit && parseFloat(line.debit) > 0 ? `₱${parseFloat(line.debit).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—'}
                                                </td>
                                                <td className="px-3 py-2 text-right text-foreground font-medium">
                                                    {line.credit && parseFloat(line.credit) > 0 ? `₱${parseFloat(line.credit).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot>
                                        <tr className="border-t border-border/50">
                                            <td colSpan={2} className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase">Totals</td>
                                            <td className="px-3 py-2 text-right font-semibold text-blue-400">
                                                ₱{selectedEntry.lines.reduce((sum, l) => sum + parseFloat(l.debit || '0'), 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </td>
                                            <td className="px-3 py-2 text-right font-semibold text-green-400">
                                                ₱{selectedEntry.lines.reduce((sum, l) => sum + parseFloat(l.credit || '0'), 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

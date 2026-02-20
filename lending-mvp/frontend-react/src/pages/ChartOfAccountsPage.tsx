import { useState } from 'react'
import { useQuery, useMutation } from '@apollo/client'
import { GET_GL_ACCOUNTS, CREATE_GL_ACCOUNT, GET_JOURNAL_ENTRIES } from '@/api/queries'
import { formatCurrency, formatDate } from '@/lib/utils'
import { BookOpen, Plus, ChevronDown, ChevronRight } from 'lucide-react'

const typeColors: Record<string, string> = {
    asset: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    liability: 'bg-red-500/15 text-red-400 border-red-500/30',
    equity: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
    income: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    expense: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
}

type Tab = 'accounts' | 'journal'

export default function ChartOfAccountsPage() {
    const [tab, setTab] = useState<Tab>('accounts')
    const [showForm, setShowForm] = useState(false)
    const [expandedEntry, setExpandedEntry] = useState<string | null>(null)

    const { data: glData, loading: glLoading, refetch: refetchGL } = useQuery(GET_GL_ACCOUNTS)
    const { data: jeData, loading: jeLoading } = useQuery(GET_JOURNAL_ENTRIES, { variables: { skip: 0, limit: 50 } })
    const [createAccount] = useMutation(CREATE_GL_ACCOUNT, { onCompleted: () => { refetchGL(); setShowForm(false) } })

    const [form, setForm] = useState({ code: '', name: '', type: 'asset', description: '' })

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            await createAccount({ variables: { input: form } })
            setForm({ code: '', name: '', type: 'asset', description: '' })
        } catch (err: any) {
            alert(err.message)
        }
    }

    // Group accounts by type
    const grouped = (glData?.glAccounts || []).reduce((acc: any, a: any) => {
        ; (acc[a.type] = acc[a.type] || []).push(a)
        return acc
    }, {})

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
                        <BookOpen className="w-6 h-6 text-primary" /> Chart of Accounts
                    </h1>
                    <p className="text-muted-foreground text-sm mt-1">General Ledger & Journal Entries</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => setTab('accounts')} className={`px-4 py-2 text-sm font-medium rounded-lg ${tab === 'accounts' ? 'bg-primary text-primary-foreground' : 'glass'}`}>
                        GL Accounts
                    </button>
                    <button onClick={() => setTab('journal')} className={`px-4 py-2 text-sm font-medium rounded-lg ${tab === 'journal' ? 'bg-primary text-primary-foreground' : 'glass'}`}>
                        Journal Entries
                    </button>
                </div>
            </div>

            {tab === 'accounts' && (
                <>
                    <button onClick={() => setShowForm(!showForm)} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium flex items-center gap-2 shadow-lg shadow-primary/20">
                        <Plus className="w-4 h-4" /> New GL Account
                    </button>

                    {showForm && (
                        <form onSubmit={handleCreate} className="glass p-5 rounded-xl grid grid-cols-1 md:grid-cols-4 gap-4">
                            <input required value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))} placeholder="Account Code (e.g. 1010)" className="bg-background border border-border rounded-lg px-3 py-2 text-sm" />
                            <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Account Name" className="bg-background border border-border rounded-lg px-3 py-2 text-sm" />
                            <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} className="bg-background border border-border rounded-lg px-3 py-2 text-sm">
                                <option value="asset">Asset</option>
                                <option value="liability">Liability</option>
                                <option value="equity">Equity</option>
                                <option value="income">Income</option>
                                <option value="expense">Expense</option>
                            </select>
                            <button type="submit" className="bg-emerald-500 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-emerald-600">Create</button>
                        </form>
                    )}

                    {glLoading ? <div className="animate-pulse p-10 text-center">Loading…</div> : (
                        <div className="space-y-4">
                            {['asset', 'liability', 'equity', 'income', 'expense'].map(type => (
                                <div key={type} className="glass rounded-xl overflow-hidden">
                                    <div className="px-5 py-3 bg-secondary/30 flex items-center gap-2">
                                        <span className={`px-2.5 py-0.5 text-xs font-bold uppercase rounded border ${typeColors[type]}`}>{type}</span>
                                        <span className="text-sm text-muted-foreground">({(grouped[type] || []).length} accounts)</span>
                                    </div>
                                    <table className="w-full text-sm">
                                        <tbody>
                                            {(grouped[type] || []).map((a: any) => (
                                                <tr key={a.id} className="border-t border-border/30 hover:bg-secondary/20">
                                                    <td className="px-5 py-3 font-mono text-primary w-24">{a.code}</td>
                                                    <td className="px-5 py-3 font-medium">{a.name}</td>
                                                    <td className="px-5 py-3 text-muted-foreground text-xs">{a.description || '—'}</td>
                                                </tr>
                                            ))}
                                            {!(grouped[type] || []).length && <tr><td colSpan={3} className="px-5 py-4 text-center text-muted-foreground text-xs">No accounts</td></tr>}
                                        </tbody>
                                    </table>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}

            {tab === 'journal' && (
                <div className="space-y-3">
                    {jeLoading ? <div className="animate-pulse p-10 text-center">Loading…</div> : (
                        (jeData?.journalEntries?.entries || []).map((entry: any) => (
                            <div key={entry.id} className="glass rounded-xl overflow-hidden">
                                <button onClick={() => setExpandedEntry(expandedEntry === entry.id ? null : entry.id)} className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-secondary/20 transition-colors">
                                    <div className="flex items-center gap-4">
                                        {expandedEntry === entry.id ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                                        <span className="font-mono text-xs text-primary">{entry.referenceNo}</span>
                                        <span className="text-sm">{entry.description}</span>
                                    </div>
                                    <span className="text-xs text-muted-foreground">{formatDate(entry.timestamp)}</span>
                                </button>
                                {expandedEntry === entry.id && (
                                    <div className="px-5 pb-4 border-t border-border/30">
                                        <table className="w-full text-sm mt-3">
                                            <thead>
                                                <tr className="text-muted-foreground text-xs">
                                                    <th className="text-left pb-2 font-semibold">Account</th>
                                                    <th className="text-left pb-2 font-semibold">Description</th>
                                                    <th className="text-right pb-2 font-semibold">Debit</th>
                                                    <th className="text-right pb-2 font-semibold">Credit</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {(entry.lines || []).map((line: any) => (
                                                    <tr key={line.id} className="border-t border-border/20">
                                                        <td className="py-2 font-mono text-primary">{line.accountCode}</td>
                                                        <td className="py-2 text-muted-foreground">{line.description}</td>
                                                        <td className="py-2 text-right">{parseFloat(line.debit) > 0 ? formatCurrency(line.debit) : ''}</td>
                                                        <td className="py-2 text-right">{parseFloat(line.credit) > 0 ? formatCurrency(line.credit) : ''}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                    {!jeLoading && (!jeData?.journalEntries?.entries || jeData.journalEntries.entries.length === 0) && (
                        <div className="glass rounded-xl p-16 text-center text-muted-foreground">No journal entries yet — they'll appear after loan disbursements and repayments</div>
                    )}
                </div>
            )}
        </div>
    )
}

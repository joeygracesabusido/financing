import { useState } from 'react'
import { useQuery, useMutation } from '@apollo/client'
import { GET_GL_ACCOUNTS, CREATE_GL_ACCOUNT, GET_JOURNAL_ENTRIES, CREATE_MANUAL_JOURNAL_ENTRY } from '@/api/queries'
import { formatCurrency, formatDate } from '@/lib/utils'
import { BookOpen, Plus, ChevronDown, ChevronRight, X, Trash2, AlertCircle, Save, CheckCircle, Loader2 } from 'lucide-react'

const typeColors: Record<string, string> = {
    asset: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    liability: 'bg-red-500/15 text-red-400 border-red-500/30',
    equity: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
    income: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    expense: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
}

type Tab = 'accounts' | 'journal'

interface JournalLineInput {
    accountCode: string
    debit: number
    credit: number
    description: string
}

export default function ChartOfAccountsPage() {
    const [tab, setTab] = useState<Tab>('accounts')
    const [showForm, setShowForm] = useState(false)
    const [isJournalModalOpen, setIsJournalModalOpen] = useState(false)
    const [expandedEntry, setExpandedEntry] = useState<string | null>(null)

    const { data: glData, loading: glLoading, refetch: refetchGL, error: glError } = useQuery(GET_GL_ACCOUNTS)
    const { data: jeData, loading: jeLoading, refetch: refetchJE, error: jeError } = useQuery(GET_JOURNAL_ENTRIES, { variables: { skip: 0, limit: 50 } })
    const [createAccount] = useMutation(CREATE_GL_ACCOUNT, { onCompleted: () => { refetchGL(); setShowForm(false) } })
    
    const [createManualJE, { loading: postingJE }] = useMutation(CREATE_MANUAL_JOURNAL_ENTRY, { 
        onCompleted: (data) => {
            if (data?.createManualJournalEntry?.success) {
                refetchJE();
                refetchGL();
                setIsJournalModalOpen(false);
                resetJournalForm();
                alert('Journal entry posted successfully!');
            } else {
                alert(data?.createManualJournalEntry?.message || 'Failed to post entry');
            }
        }
    })

    const [form, setForm] = useState({ code: '', name: '', type: 'asset', description: '' })
    
    const [journalForm, setJournalForm] = useState({
        referenceNo: `MANUAL-${Date.now().toString().slice(-6)}`,
        description: '',
        lines: [
            { accountCode: '', debit: 0, credit: 0, description: '' },
            { accountCode: '', debit: 0, credit: 0, description: '' }
        ] as JournalLineInput[]
    })

    const resetJournalForm = () => {
        setJournalForm({
            referenceNo: `MANUAL-${Date.now().toString().slice(-6)}`,
            description: '',
            lines: [
                { accountCode: '', debit: 0, credit: 0, description: '' },
                { accountCode: '', debit: 0, credit: 0, description: '' }
            ]
        })
    }

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            await createAccount({ variables: { input: form } })
            setForm({ code: '', name: '', type: 'asset', description: '' })
        } catch (err: any) {
            alert(err.message)
        }
    }

    const addJournalLine = () => {
        setJournalForm(prev => ({
            ...prev,
            lines: [...prev.lines, { accountCode: '', debit: 0, credit: 0, description: '' }]
        }))
    }

    const removeJournalLine = (index: number) => {
        if (journalForm.lines.length <= 2) return
        setJournalForm(prev => ({
            ...prev,
            lines: prev.lines.filter((_, i) => i !== index)
        }))
    }

    const updateJournalLine = (index: number, field: keyof JournalLineInput, value: any) => {
        const newLines = [...journalForm.lines]
        newLines[index] = { ...newLines[index], [field]: value }
        
        if (field === 'debit' && value > 0) newLines[index].credit = 0
        if (field === 'credit' && value > 0) newLines[index].debit = 0
        
        setJournalForm(prev => ({ ...prev, lines: newLines }))
    }

    const totalDebit = journalForm.lines.reduce((sum, line) => sum + (Number(line.debit) || 0), 0)
    const totalCredit = journalForm.lines.reduce((sum, line) => sum + (Number(line.credit) || 0), 0)
    const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01 && totalDebit > 0

    const handlePostJournal = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!isBalanced) {
            alert('Journal entry is not balanced!')
            return
        }

        try {
            await createManualJE({
                variables: {
                    input: {
                        referenceNo: journalForm.referenceNo,
                        description: journalForm.description,
                        lines: journalForm.lines.map(l => ({
                            accountCode: l.accountCode,
                            debit: Number(l.debit),
                            credit: Number(l.credit),
                            description: l.description || null
                        }))
                    }
                }
            })
        } catch (err: any) {
            console.error(err)
        }
    }

    const grouped = (glData?.glAccounts || []).reduce((acc: any, a: any) => {
        ; (acc[a.type] = acc[a.type] || []).push(a)
        return acc
    }, {})

    const allGLAccounts = glData?.glAccounts || []

    if (glError || jeError) {
        return (
            <div className="py-20 text-center">
                <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Error loading Chart of Accounts</h3>
                <p className="text-muted-foreground">{glError?.message || jeError?.message}</p>
            </div>
        )
    }

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

            <div className="flex gap-3">
                {tab === 'accounts' && (
                    <button onClick={() => setShowForm(!showForm)} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium flex items-center gap-2 shadow-lg shadow-primary/20 transition-all active:scale-95">
                        <Plus className="w-4 h-4" /> New GL Account
                    </button>
                )}
                <button 
                    onClick={() => setIsJournalModalOpen(true)} 
                    className="px-4 py-2 bg-secondary border border-border text-foreground rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-secondary/80 transition-all"
                >
                    <Plus className="w-4 h-4" /> Add Manual Journal Entry
                </button>
            </div>

            {showForm && tab === 'accounts' && (
                <form onSubmit={handleCreate} className="glass p-5 rounded-xl grid grid-cols-1 md:grid-cols-4 gap-4 animate-in slide-in-from-top-2">
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

            {isJournalModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="glass rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border border-white/10 animate-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-secondary/30">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                    <BookOpen className="w-5 h-5 text-primary" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-foreground leading-tight">Manual Journal Entry</h2>
                                    <p className="text-xs text-muted-foreground mt-0.5 uppercase tracking-wider font-semibold">Double-Entry Accounting System</p>
                                </div>
                            </div>
                            <button onClick={() => setIsJournalModalOpen(false)} className="p-2 hover:bg-secondary rounded-full transition-colors text-muted-foreground">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handlePostJournal} className="flex-1 overflow-y-auto p-6 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-muted-foreground uppercase ml-1">Reference Number</label>
                                    <input 
                                        required 
                                        value={journalForm.referenceNo} 
                                        onChange={e => setJournalForm(prev => ({ ...prev, referenceNo: e.target.value }))}
                                        placeholder="e.g. ADJ-2026-001" 
                                        className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/50 outline-none" 
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-muted-foreground uppercase ml-1">Description / Particulars</label>
                                    <input 
                                        required 
                                        value={journalForm.description} 
                                        onChange={e => setJournalForm(prev => ({ ...prev, description: e.target.value }))}
                                        placeholder="Reason for this entry..." 
                                        className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/50 outline-none" 
                                    />
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                                        Accounting Lines
                                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary uppercase font-bold tracking-tighter">Min 2 Lines</span>
                                    </h3>
                                </div>
                                
                                <div className="border border-border rounded-xl overflow-hidden">
                                    <table className="w-full text-sm">
                                        <thead className="bg-secondary/50 border-b border-border">
                                            <tr className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">
                                                <th className="px-4 py-3 text-left w-1/3">Account</th>
                                                <th className="px-4 py-3 text-left">Description</th>
                                                <th className="px-4 py-3 text-right w-32">Debit</th>
                                                <th className="px-4 py-3 text-right w-32">Credit</th>
                                                <th className="px-4 py-3 text-center w-12"></th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border/50">
                                            {journalForm.lines.map((line, index) => (
                                                <tr key={index} className="hover:bg-secondary/20 transition-colors">
                                                    <td className="p-2">
                                                        <select 
                                                            required
                                                            value={line.accountCode}
                                                            onChange={e => updateJournalLine(index, 'accountCode', e.target.value)}
                                                            className="w-full bg-background border border-border rounded-lg px-2 py-1.5 text-sm outline-none focus:border-primary"
                                                        >
                                                            <option value="">Select Account</option>
                                                            {allGLAccounts.map((gl: any) => (
                                                                <option key={gl.id} value={gl.code}>{gl.code} - {gl.name}</option>
                                                            ))}
                                                        </select>
                                                    </td>
                                                    <td className="p-2">
                                                        <input 
                                                            value={line.description}
                                                            onChange={e => updateJournalLine(index, 'description', e.target.value)}
                                                            placeholder="Line details..."
                                                            className="w-full bg-background border border-border rounded-lg px-2 py-1.5 text-sm outline-none focus:border-primary"
                                                        />
                                                    </td>
                                                    <td className="p-2">
                                                        <input 
                                                            type="number"
                                                            step="0.01"
                                                            min="0"
                                                            value={line.debit || ''}
                                                            onChange={e => updateJournalLine(index, 'debit', parseFloat(e.target.value) || 0)}
                                                            placeholder="0.00"
                                                            className="w-full bg-background border border-border rounded-lg px-2 py-1.5 text-sm text-right font-mono outline-none focus:border-primary"
                                                        />
                                                    </td>
                                                    <td className="p-2">
                                                        <input 
                                                            type="number"
                                                            step="0.01"
                                                            min="0"
                                                            value={line.credit || ''}
                                                            onChange={e => updateJournalLine(index, 'credit', parseFloat(e.target.value) || 0)}
                                                            placeholder="0.00"
                                                            className="w-full bg-background border border-border rounded-lg px-2 py-1.5 text-sm text-right font-mono outline-none focus:border-primary"
                                                        />
                                                    </td>
                                                    <td className="p-2 text-center">
                                                        <button 
                                                            type="button"
                                                            onClick={() => removeJournalLine(index)}
                                                            className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-all"
                                                            disabled={journalForm.lines.length <= 2}
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                        <tfoot className="bg-secondary/30">
                                            <tr className="font-bold border-t border-border">
                                                <td colSpan={2} className="px-4 py-3 text-right text-xs uppercase tracking-tight text-muted-foreground">Entry Totals</td>
                                                <td className="px-4 py-3 text-right font-mono text-foreground">{formatCurrency(Number(totalDebit))}</td>
                                                <td className="px-4 py-3 text-right font-mono text-foreground font-bold">{formatCurrency(Number(totalCredit))}</td>
                                                <td></td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                                <button 
                                    type="button" 
                                    onClick={addJournalLine}
                                    className="text-xs font-bold text-primary flex items-center gap-1 hover:underline ml-1"
                                >
                                    <Plus className="w-3.5 h-3.5" /> Add Another Line
                                </button>
                            </div>

                            {!isBalanced && totalDebit > 0 && totalCredit > 0 && (
                                <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 flex items-center gap-3 text-destructive animate-pulse">
                                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                                    <div className="text-sm">
                                        <p className="font-bold">Entry is Unbalanced!</p>
                                        <p className="text-xs opacity-80">Difference: {formatCurrency(Math.abs(totalDebit - totalCredit))}</p>
                                    </div>
                                </div>
                            )}
                        </form>

                        <div className="px-6 py-4 border-t border-border bg-secondary/30 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                {isBalanced ? (
                                    <span className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-500 uppercase bg-emerald-500/10 px-2 py-1 rounded-full border border-emerald-500/20">
                                        <CheckCircle className="w-3 h-3" /> Balanced
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-1.5 text-[10px] font-bold text-amber-500 uppercase bg-amber-500/10 px-2 py-1 rounded-full border border-amber-500/20">
                                        <AlertCircle className="w-3 h-3" /> Unbalanced
                                    </span>
                                )}
                            </div>
                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsJournalModalOpen(false)}
                                    className="px-6 py-2 border border-border rounded-xl text-sm font-medium text-muted-foreground hover:bg-secondary transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handlePostJournal}
                                    disabled={!isBalanced || postingJE}
                                    className="px-8 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-bold flex items-center gap-2 disabled:opacity-50 disabled:grayscale transition-all active:scale-95 shadow-xl shadow-primary/20"
                                >
                                    {postingJE ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                    Post Journal Entry
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {tab === 'accounts' && (
                <>
                    {glLoading ? <div className="animate-pulse p-10 text-center">Loading…</div> : (
                        <div className="space-y-4">
                            {['asset', 'liability', 'equity', 'income', 'expense'].map(type => (
                                <div key={type} className="glass rounded-xl overflow-hidden">
                                    <div className="px-5 py-3 bg-secondary/30 flex items-center gap-2">
                                        <span className={`px-2.5 py-0.5 text-xs font-bold uppercase rounded border ${typeColors[type]}`}>{type}</span>
                                        <span className="text-sm text-muted-foreground">({(grouped[type] || []).length} accounts)</span>
                                    </div>
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="text-xs text-muted-foreground border-b border-border/20">
                                                <th className="px-5 py-2 text-left font-semibold">Code</th>
                                                <th className="px-5 py-2 text-left font-semibold">Name</th>
                                                <th className="px-5 py-2 text-left font-semibold">Description</th>
                                                <th className="px-5 py-2 text-right font-semibold">Balance</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {(grouped[type] || []).map((a: any) => (
                                                <tr key={a.id} className="border-t border-border/30 hover:bg-secondary/20">
                                                    <td className="px-5 py-3 font-mono text-primary w-24">{a.code}</td>
                                                    <td className="px-5 py-3 font-medium">{a.name}</td>
                                                    <td className="px-5 py-3 text-muted-foreground text-xs">{a.description || '—'}</td>
                                                    <td className={`px-5 py-3 text-right font-bold ${Number(a.balance || 0) < 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                                                        {formatCurrency(Number(a.balance || 0))}
                                                    </td>
                                                </tr>
                                            ))}
                                            {!(grouped[type] || []).length && <tr><td colSpan={4} className="px-5 py-4 text-center text-muted-foreground text-xs">No accounts</td></tr>}
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
                                                        <td className="py-2">
                                                            <div className="flex flex-col">
                                                                <span className="font-mono text-xs text-primary">{line.accountCode}</span>
                                                                <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-tighter">{line.accountName}</span>
                                                            </div>
                                                        </td>
                                                        <td className="py-2 text-muted-foreground">{line.description}</td>
                                                        <td className="py-2 text-right">{Number(line.debit || 0) > 0 ? formatCurrency(Number(line.debit || 0)) : ''}</td>
                                                        <td className="py-2 text-right">{Number(line.credit || 0) > 0 ? formatCurrency(Number(line.credit || 0)) : ''}</td>
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

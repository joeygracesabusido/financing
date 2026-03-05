import { useState, useEffect, useRef } from 'react'
import { Plus, Trash2, Save, ArrowLeft, Search } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const getHeaders = () => {
    const token = localStorage.getItem('access_token')
    return {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
    }
}

interface GLAccount {
    id: string
    code: string
    name: string
    type: string
}

interface JournalLine {
    id: string
    accountCode: string
    accountName: string
    debit: string
    credit: string
    description: string
}

// Inline Autocomplete Component for Account Selection
const AccountAutocomplete = ({ 
    accounts, 
    value, 
    onChange 
}: { 
    accounts: GLAccount[], 
    value: string, 
    onChange: (code: string) => void 
}) => {
    const [isOpen, setIsOpen] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')
    const wrapperRef = useRef<HTMLDivElement>(null)

    // Sync search term with value when value changes externally (e.g. initial load)
    useEffect(() => {
        const account = accounts.find(a => a.code === value)
        if (account) {
            setSearchTerm(`${account.code} - ${account.name}`)
        } else {
            setSearchTerm('')
        }
    }, [value, accounts])

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false)
                // Reset search term to current selected account if closed without selection
                const account = accounts.find(a => a.code === value)
                setSearchTerm(account ? `${account.code} - ${account.name}` : '')
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [wrapperRef, value, accounts])

    const filteredAccounts = accounts.filter(acc => 
        acc.code.toLowerCase().includes(searchTerm.toLowerCase()) || 
        acc.name.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <div ref={wrapperRef} className="relative">
            <div className="relative">
                <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => {
                        setSearchTerm(e.target.value)
                        setIsOpen(true)
                    }}
                    onFocus={() => setIsOpen(true)}
                    placeholder="Search account..."
                    className="w-full px-3 py-2 bg-white/5 border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            </div>

            {isOpen && (
                <div className="absolute z-50 w-full mt-1 max-h-60 overflow-y-auto glass border border-border rounded-lg shadow-xl">
                    {filteredAccounts.length > 0 ? (
                        filteredAccounts.map(acc => (
                            <button
                                key={acc.id}
                                type="button"
                                onClick={() => {
                                    onChange(acc.code)
                                    setSearchTerm(`${acc.code} - ${acc.name}`)
                                    setIsOpen(false)
                                }}
                                className="w-full text-left px-4 py-2 hover:bg-white/10 text-sm text-foreground transition-colors"
                            >
                                <span className="font-mono font-medium text-blue-400 mr-2">{acc.code}</span>
                                <span>{acc.name}</span>
                            </button>
                        ))
                    ) : (
                        <div className="px-4 py-2 text-sm text-muted-foreground italic">No accounts found</div>
                    )}
                </div>
            )}
        </div>
    )
}

export default function CreateJournalEntryPage() {
    const navigate = useNavigate()
    const [loading, setLoading] = useState(false)
    const [saving, setSaving] = useState(false)
    const [accounts, setAccounts] = useState<GLAccount[]>([])
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')
    
    const [referenceNo, setReferenceNo] = useState('')
    const [description, setDescription] = useState('')
    const [lines, setLines] = useState<JournalLine[]>([
        { id: '1', accountCode: '', accountName: '', debit: '', credit: '', description: '' },
        { id: '2', accountCode: '', accountName: '', debit: '', credit: '', description: '' }
    ])

    useEffect(() => {
        fetchAccounts()
        generateReferenceNo()
    }, [])

    const fetchAccounts = async () => {
        try {
            const res = await fetch('/graphql', {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify({
                    query: `query { glAccounts { id code name type } }`
                })
            })
            const data = await res.json()
            if (data.data?.glAccounts) {
                setAccounts(data.data.glAccounts)
            }
        } catch (e) {
            console.error('Failed to fetch accounts:', e)
        } finally {
            setLoading(false)
        }
    }

    const generateReferenceNo = () => {
        const now = new Date()
        const ref = `MAN-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${Date.now()}`
        setReferenceNo(ref)
    }

    const handleAccountChange = (lineId: string, accountCode: string) => {
        const account = accounts.find(a => a.code === accountCode)
        setLines(lines.map(l => 
            l.id === lineId ? { ...l, accountCode, accountName: account?.name || '' } : l
        ))
    }

    const addLine = () => {
        setLines([...lines, { 
            id: Date.now().toString(), 
            accountCode: '', 
            accountName: '', 
            debit: '', 
            credit: '', 
            description: '' 
        }])
    }

    const removeLine = (lineId: string) => {
        if (lines.length <= 2) return
        setLines(lines.filter(l => l.id !== lineId))
    }

    const handleDebitChange = (lineId: string, value: string) => {
        if (value && isNaN(parseFloat(value))) return
        setLines(lines.map(l => 
            l.id === lineId ? { ...l, debit: value, credit: value ? '0' : l.credit } : l
        ))
    }

    const handleCreditChange = (lineId: string, value: string) => {
        if (value && isNaN(parseFloat(value))) return
        setLines(lines.map(l => 
            l.id === lineId ? { ...l, credit: value, debit: value ? '0' : l.debit } : l
        ))
    }

    const totalDebit = lines.reduce((sum, l) => sum + (parseFloat(l.debit) || 0), 0)
    const totalCredit = lines.reduce((sum, l) => sum + (parseFloat(l.credit) || 0), 0)
    const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setSuccess('')

        if (!referenceNo || !description) {
            setError('Reference No and Description are required')
            return
        }

        if (!isBalanced) {
            setError('Debits and Credits must be balanced')
            return
        }

        if (lines.some(l => !l.accountCode)) {
            setError('All lines must have an account selected')
            return
        }

        setSaving(true)
        try {
            const res = await fetch('/graphql', {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify({
                    query: `mutation CreateManualJournalEntry($input: JournalEntryCreateInput!) {
                        createManualJournalEntry(input: $input) {
                            success
                            message
                            entry {
                                id
                                referenceNo
                            }
                        }
                    }`,
                    variables: {
                        input: {
                            referenceNo,
                            description,
                            lines: lines.map(l => ({
                                accountCode: l.accountCode,
                                debit: parseFloat(l.debit) || 0,
                                credit: parseFloat(l.credit) || 0,
                                description: l.description
                            }))
                        }
                    }
                })
            })
            const data = await res.json()
            if (data.data?.createManualJournalEntry?.success) {
                setSuccess('Journal entry created successfully!')
                setTimeout(() => navigate('/journal-entries'), 1500)
            } else {
                setError(data.errors?.[0]?.message || data.data?.createManualJournalEntry?.message || 'Failed to create journal entry')
            }
        } catch (e) {
            setError('Failed to create journal entry')
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/journal-entries')} className="p-2 hover:bg-white/5 rounded-lg transition-colors">
                        <ArrowLeft className="w-5 h-5 text-muted-foreground" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">Create Manual Journal Entry</h1>
                        <p className="text-muted-foreground text-sm mt-1">Post adjusting entries, accruals, and other manual transactions</p>
                    </div>
                </div>
            </div>

            {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400 text-sm">
                    {error}
                </div>
            )}

            {success && (
                <div className="p-4 bg-green-500/10 border border-green-500/50 rounded-lg text-green-400 text-sm">
                    {success}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-muted-foreground mb-1">Reference No</label>
                        <input
                            type="text"
                            value={referenceNo}
                            onChange={(e) => setReferenceNo(e.target.value)}
                            className="w-full px-4 py-2 bg-white/5 border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-muted-foreground mb-1">Description</label>
                        <input
                            type="text"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="e.g., Accrued Expenses - December 2025"
                            className="w-full px-4 py-2 bg-white/5 border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                        />
                    </div>
                </div>

                <div className="glass rounded-xl overflow-hidden">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-border/50">
                                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Account</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Description</th>
                                <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Debit</th>
                                <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Credit</th>
                                <th className="w-10"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {lines.map((line, idx) => (
                                <tr key={line.id} className="border-b border-border/30">
                                    <td className="px-4 py-2">
                                        <AccountAutocomplete 
                                            accounts={accounts}
                                            value={line.accountCode}
                                            onChange={(code) => handleAccountChange(line.id, code)}
                                        />
                                    </td>
                                    <td className="px-4 py-2">
                                        <input
                                            type="text"
                                            value={line.description}
                                            onChange={(e) => setLines(lines.map(l => l.id === line.id ? { ...l, description: e.target.value } : l))}
                                            placeholder="Line description"
                                            className="w-full px-3 py-2 bg-white/5 border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                        />
                                    </td>
                                    <td className="px-4 py-2">
                                        <input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={line.debit}
                                            onChange={(e) => handleDebitChange(line.id, e.target.value)}
                                            className="w-full px-3 py-2 bg-white/5 border border-border rounded-lg text-foreground text-right focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                        />
                                    </td>
                                    <td className="px-4 py-2">
                                        <input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={line.credit}
                                            onChange={(e) => handleCreditChange(line.id, e.target.value)}
                                            className="w-full px-3 py-2 bg-white/5 border border-border rounded-lg text-foreground text-right focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                        />
                                    </td>
                                    <td className="px-4 py-2">
                                        <button
                                            type="button"
                                            onClick={() => removeLine(line.id)}
                                            disabled={lines.length <= 2}
                                            className="p-2 text-red-400 hover:text-red-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr className="border-t border-border/50">
                                <td colSpan={2} className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">
                                    <button
                                        type="button"
                                        onClick={addLine}
                                        className="flex items-center gap-1 text-blue-400 hover:text-blue-300 transition-colors"
                                    >
                                        <Plus className="w-4 h-4" /> Add Line
                                    </button>
                                </td>
                                <td className="px-4 py-3 text-right font-semibold text-blue-400">
                                    ₱{totalDebit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </td>
                                <td className="px-4 py-3 text-right font-semibold text-green-400">
                                    ₱{totalCredit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </td>
                                <td></td>
                            </tr>
                        </tfoot>
                    </table>
                </div>

                {!isBalanced && (
                    <div className="p-3 bg-yellow-500/10 border border-yellow-500/50 rounded-lg text-yellow-400 text-sm text-center">
                        Unbalanced! Difference: ₱{Math.abs(totalDebit - totalCredit).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                )}

                <div className="flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={() => navigate('/journal-entries')}
                        className="px-4 py-2 border border-border rounded-lg text-muted-foreground hover:bg-white/5 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={saving || !isBalanced}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-white font-medium transition-colors"
                    >
                        <Save className="w-4 h-4" />
                        {saving ? 'Saving...' : 'Save Journal Entry'}
                    </button>
                </div>
            </form>
        </div>
    )
}

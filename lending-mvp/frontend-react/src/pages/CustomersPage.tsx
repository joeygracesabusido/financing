import { useState, useEffect, useRef } from 'react'
import { Search, Plus, Pencil, Trash2, CheckCircle, XCircle, ChevronDown } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { getCustomers, getCustomer, createCustomer, updateCustomer, deleteCustomer } from '@/api/customers'
import { getBranches } from '@/api/client'

interface Branch {
    id: number
    code: string
    name: string
}

interface Customer {
    id: string
    displayName: string
    customerType: string
    branchCode: string
    isActive: boolean
    emailAddress?: string
    mobileNumber?: string
    customerCategory?: string
    kycStatus?: string
    riskScore?: number
    createdAt: string
}

export default function CustomersPage() {
    const { user } = useAuth()
    const isAdmin = user?.role === 'admin' || user?.role === 'branch_manager'

    const [loading, setLoading] = useState(true)
    const [customersData, setCustomersData] = useState<Customer[]>([])
    const [branches, setBranches] = useState<Branch[]>([])
    const [search, setSearch] = useState('')
    const [showModal, setShowModal] = useState(false)
    const [editId, setEditId] = useState<string | null>(null)
    const [form, setForm] = useState({ displayName: '', customerType: 'individual', branchCode: '', emailAddress: '', mobileNumber: '' })
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')

    // Autocomplete state
    const [branchSearch, setBranchSearch] = useState('')
    const [isBranchDropdownOpen, setIsBranchDropdownOpen] = useState(false)
    const [focusedBranchIndex, setFocusedBranchIndex] = useState(-1)
    const branchRef = useRef<HTMLDivElement>(null)

    const init = async () => {
        try {
            const [customersRes, branchesRes] = await Promise.all([
                getCustomers(),
                getBranches()
            ])
            setCustomersData(customersRes.customers?.customers || [])
            setBranches(branchesRes.data?.branches || [])
        } catch (e) {
            console.error('Failed to fetch data:', e)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { init() }, [])

    // Close dropdown on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (branchRef.current && !branchRef.current.contains(event.target as Node)) {
                setIsBranchDropdownOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const filteredBranches = branches.filter(b => 
        b.name.toLowerCase().includes(branchSearch.toLowerCase()) ||
        b.code.toLowerCase().includes(branchSearch.toLowerCase())
    )

    const openCreate = () => { 
        setEditId(null); 
        setForm({ displayName: '', customerType: 'individual', branchCode: '', emailAddress: '', mobileNumber: '' }); 
        setBranchSearch('');
        setError(''); 
        setShowModal(true) 
    }
    
    const openEdit = (c: Customer) => {
        setEditId(c.id)
        setForm({ displayName: c.displayName, customerType: c.customerType, branchCode: c.branchCode, emailAddress: c.emailAddress ?? '', mobileNumber: c.mobileNumber ?? '' })
        const b = branches.find(br => br.code === c.branchCode)
        setBranchSearch(b ? `${b.name} (${b.code})` : c.branchCode)
        setError('')
        setShowModal(true)
    }

    const selectBranch = (b: Branch) => {
        setForm({ ...form, branchCode: b.code })
        setBranchSearch(`${b.name} (${b.code})`)
        setIsBranchDropdownOpen(false)
        setFocusedBranchIndex(-1)
    }

    const handleBranchKeyDown = (e: React.KeyboardEvent) => {
        if (!isBranchDropdownOpen) {
            if (e.key === 'ArrowDown' || e.key === 'Enter') setIsBranchDropdownOpen(true)
            return
        }

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault()
                setFocusedBranchIndex(prev => (prev < filteredBranches.length - 1 ? prev + 1 : prev))
                break
            case 'ArrowUp':
                e.preventDefault()
                setFocusedBranchIndex(prev => (prev > 0 ? prev - 1 : prev))
                break
            case 'Enter':
                e.preventDefault()
                if (focusedBranchIndex >= 0 && focusedBranchIndex < filteredBranches.length) {
                    selectBranch(filteredBranches[focusedBranchIndex])
                }
                break
            case 'Escape':
                setIsBranchDropdownOpen(false)
                break
        }
    }

    const handleSave = async () => {
        if (!form.displayName) { setError('Name is required'); return }
        setSaving(true)
        try {
            const input = { displayName: form.displayName, customerType: form.customerType, branchCode: form.branchCode, emailAddress: form.emailAddress, mobileNumber: form.mobileNumber }
            if (editId) {
                const res = await updateCustomer(editId, input)
                if (res.updateCustomer?.success) {
                    alert('Customer updated successfully!')
                } else {
                    throw new Error(res.updateCustomer?.message || 'Failed to update customer')
                }
            } else {
                const res = await createCustomer(input)
                if (res.createCustomer?.success) {
                    alert('Customer created successfully!')
                } else {
                    throw new Error(res.createCustomer?.message || 'Failed to create customer')
                }
            }
            await init()
            setShowModal(false)
        } catch (e: any) {
            setError(e.message || 'Failed to save customer')
            alert('Error: ' + (e.message || 'Failed to save customer'))
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this customer?')) return
        try {
            const res = await deleteCustomer(id)
            if (res.deleteCustomer?.success) {
                alert('Customer deleted successfully!')
                await init()
            } else {
                alert('Error: ' + (res.deleteCustomer?.message || 'Failed to delete customer'))
            }
        } catch (e: any) {
            alert('Error: ' + (e.message || 'Failed to delete customer'))
        }
    }

    const filteredCustomers = customersData.filter(c => 
        c.displayName.toLowerCase().includes(search.toLowerCase()) ||
        c.branchCode.toLowerCase().includes(search.toLowerCase()) ||
        (c.emailAddress && c.emailAddress.toLowerCase().includes(search.toLowerCase()))
    )

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Customers</h1>
                    <p className="text-muted-foreground text-sm mt-1">Manage customer accounts</p>
                </div>
                {isAdmin && (
                    <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 rounded-lg gradient-primary text-white text-sm font-medium shadow-lg hover:opacity-90 transition-opacity">
                        <Plus className="w-4 h-4" /> New Customer
                    </button>
                )}
            </div>

            {loading ? (
                <div className="text-center py-16 text-muted-foreground">Loading customers…</div>
            ) : (
                <div className="glass rounded-xl overflow-hidden">
                    <div className="p-4 border-b border-border/50">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search customers..." className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-background/50 focus:outline-none focus:border-primary/50" />
                        </div>
                    </div>
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-border/50">
                                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Name</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Type</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Branch</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Email</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Phone</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">KYC</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                                {isAdmin && <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {filteredCustomers.length === 0 ? (
                                <tr><td colSpan={8} className="text-center py-12 text-muted-foreground">No customers found.</td></tr>
                            ) : filteredCustomers.map((c) => (
                                <tr key={c.id} className="border-b border-border/30 hover:bg-white/5 transition-colors group">
                                    <td className="px-4 py-3 text-foreground font-medium">{c.displayName}</td>
                                    <td className="px-4 py-3 text-muted-foreground capitalize">{c.customerType}</td>
                                    <td className="px-4 py-3 text-muted-foreground uppercase">{c.branchCode}</td>
                                    <td className="px-4 py-3 text-muted-foreground">{c.emailAddress || '—'}</td>
                                    <td className="px-4 py-3 text-muted-foreground">{c.mobileNumber || '—'}</td>
                                    <td className="px-4 py-3">
                                        {c.kycStatus ? (
                                            <span className={`text-xs px-2 py-1 rounded-full ${c.kycStatus === 'verified' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>{c.kycStatus}</span>
                                        ) : <span className="text-xs text-muted-foreground">Not verified</span>}
                                    </td>
                                    <td className="px-4 py-3">
                                        {c.isActive
                                            ? <span className="flex items-center gap-1.5 text-emerald-400 text-xs"><CheckCircle className="w-3.5 h-3.5" /> Active</span>
                                            : <span className="flex items-center gap-1.5 text-destructive text-xs"><XCircle className="w-3.5 h-3.5" /> Inactive</span>}
                                    </td>
                                    {isAdmin && (
                                        <td className="px-4 py-3 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button onClick={() => openEdit(c)} className="p-1.5 rounded-lg hover:bg-primary/15 text-primary transition-colors" title="Edit Customer">
                                                    <Pencil className="w-3.5 h-3.5" />
                                                </button>
                                                <button onClick={() => handleDelete(c.id)} className="p-1.5 rounded-lg hover:bg-destructive/15 text-destructive transition-colors" title="Delete Customer">
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                    <div className="glass rounded-2xl p-6 w-full max-w-md shadow-2xl border border-border/50">
                        <h2 className="font-bold text-lg text-foreground mb-4">{editId ? 'Edit Customer' : 'New Customer'}</h2>
                        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
                            <div>
                                <label className="block text-xs text-muted-foreground mb-1">Full Name *</label>
                                <input value={form.displayName} onChange={e => setForm({ ...form, displayName: e.target.value })} placeholder="John Doe" className="w-full bg-background/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50" />
                            </div>
                            <div>
                                <label className="block text-xs text-muted-foreground mb-1">Customer Type</label>
                                <select value={form.customerType} onChange={e => setForm({ ...form, customerType: e.target.value })} className="w-full bg-background/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/50">
                                    <option value="individual">Individual</option>
                                    <option value="corporate">Corporate</option>
                                </select>
                            </div>
                            
                            <div className="relative" ref={branchRef}>
                                <label className="block text-xs text-muted-foreground mb-1">Branch *</label>
                                <div className="relative">
                                    <input 
                                        value={branchSearch} 
                                        onChange={e => {
                                            setBranchSearch(e.target.value)
                                            setIsBranchDropdownOpen(true)
                                            setFocusedBranchIndex(-1)
                                        }} 
                                        onFocus={() => setIsBranchDropdownOpen(true)}
                                        onKeyDown={handleBranchKeyDown}
                                        placeholder="Type to search branch..." 
                                        className="w-full bg-background/50 border border-border rounded-lg pl-3 pr-10 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50" 
                                    />
                                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                                </div>
                                
                                {isBranchDropdownOpen && filteredBranches.length > 0 && (
                                    <div className="absolute z-10 w-full mt-1 bg-[#1a1c2e] border border-border/50 rounded-lg shadow-xl overflow-hidden animate-in fade-in zoom-in duration-200">
                                        <div className="max-h-48 overflow-y-auto">
                                            {filteredBranches.map((b, index) => (
                                                <button
                                                    key={b.id}
                                                    type="button"
                                                    onClick={() => selectBranch(b)}
                                                    onMouseEnter={() => setFocusedBranchIndex(index)}
                                                    className={`w-full text-left px-4 py-2 text-sm transition-colors ${focusedBranchIndex === index ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:bg-white/5'}`}
                                                >
                                                    <div className="font-medium text-foreground">{b.name}</div>
                                                    <div className="text-xs opacity-60">{b.code}</div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="block text-xs text-muted-foreground mb-1">Email Address</label>
                                <input value={form.emailAddress} onChange={e => setForm({ ...form, emailAddress: e.target.value })} placeholder="john@example.com" className="w-full bg-background/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50" />
                            </div>
                            <div>
                                <label className="block text-xs text-muted-foreground mb-1">Mobile Number</label>
                                <input value={form.mobileNumber} onChange={e => setForm({ ...form, mobileNumber: e.target.value })} placeholder="+63 912 345 6789" className="w-full bg-background/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50" />
                            </div>
                            {error && <p className="text-destructive text-xs">{error}</p>}
                        </div>
                        <div className="flex gap-3 mt-6">
                            <button onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:bg-white/5 transition-colors">Cancel</button>
                            <button onClick={handleSave} disabled={saving} className="flex-1 px-4 py-2 rounded-lg gradient-primary text-white text-sm font-medium disabled:opacity-60">
                                {saving ? 'Saving…' : editId ? 'Update' : 'Create'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

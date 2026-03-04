import { useState, useEffect } from 'react'
import { Search, Plus, Pencil, Trash2, CheckCircle, XCircle } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { getCustomers, getCustomer, createCustomer, updateCustomer, deleteCustomer } from '@/api/customers'

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
    const [search, setSearch] = useState('')
    const [showModal, setShowModal] = useState(false)
    const [editId, setEditId] = useState<string | null>(null)
    const [form, setForm] = useState({ displayName: '', customerType: 'individual', branchCode: '', emailAddress: '', mobileNumber: '' })
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')

    const init = async () => {
        try {
            const data = await getCustomers()
            setCustomersData(data.customers || [])
        } catch (e) {
            console.error('Failed to fetch customers:', e)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { init() }, [])

    const openCreate = () => { setEditId(null); setForm({ displayName: '', customerType: 'individual', branchCode: '', emailAddress: '', mobileNumber: '' }); setError(''); setShowModal(true) }
    const openEdit = (c: Customer) => {
        setEditId(c.id)
        setForm({ displayName: c.displayName, customerType: c.customerType, branchCode: c.branchCode, emailAddress: c.emailAddress ?? '', mobileNumber: c.mobileNumber ?? '' })
        setError('')
        setShowModal(true)
    }

    const handleSave = async () => {
        if (!form.displayName) { setError('Name is required'); return }
        setSaving(true)
        try {
            const input = { displayName: form.displayName, customerType: form.customerType, branchCode: form.branchCode, emailAddress: form.emailAddress, mobileNumber: form.mobileNumber }
            if (editId) {
                await updateCustomer(editId, input)
            } else {
                await createCustomer(input)
            }
            await init()
            setShowModal(false)
        } catch (e: any) {
            setError(e.message || 'Failed to save customer')
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this customer?')) return
        await deleteCustomer(id)
        await init()
    }

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
                                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Email</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Phone</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">KYC</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {customersData.length === 0 ? (
                                <tr><td colSpan={6} className="text-center py-12 text-muted-foreground">No customers found. Create your first customer.</td></tr>
                            ) : customersData.map((c) => (
                                <tr key={c.id} className="border-b border-border/30 hover:bg-white/5 transition-colors">
                                    <td className="px-4 py-3 text-foreground font-medium">{c.displayName}</td>
                                    <td className="px-4 py-3 text-muted-foreground capitalize">{c.customerType}</td>
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
                        <div className="space-y-3">
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
                            <div>
                                <label className="block text-xs text-muted-foreground mb-1">Branch Code</label>
                                <input value={form.branchCode} onChange={e => setForm({ ...form, branchCode: e.target.value })} placeholder="HQ" className="w-full bg-background/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50" />
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
                        <div className="flex gap-3 mt-5">
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

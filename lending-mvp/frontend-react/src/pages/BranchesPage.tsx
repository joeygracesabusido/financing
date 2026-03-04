import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, CheckCircle, XCircle } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { getBranches } from '@/api/client'

interface Branch {
    id: string | number
    code: string
    name: string
    address?: string
    city?: string
    contactNumber?: string
    isActive: boolean
    createdAt: string
    updatedAt: string
}

const emptyForm: { code: string; name: string; address: string; city: string; contact_number: string } = { code: '', name: '', address: '', city: '', contact_number: '' }

export default function BranchesPage() {
    const { user } = useAuth()
    const isAdmin = user?.role === 'admin' || user?.role === 'branch_manager'

    const [loading, setLoading] = useState(true)
    const [branchesData, setBranchesData] = useState<Branch[]>([])
    const [showModal, setShowModal] = useState(false)
    const [editId, setEditId] = useState<number | null>(null)
    const [form, setForm] = useState<{ code: string; name: string; address: string; city: string; contact_number: string }>(emptyForm)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')

    const init = async () => {
        try {
            const data = await getBranches()
            setBranchesData(data.branches || [])
        } catch (e) {
            console.error('Failed to fetch branches:', e)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { init() }, [])

    const openCreate = () => { setEditId(null); setForm(emptyForm); setError(''); setShowModal(true) }
    const openEdit = (b: Branch) => {
        setEditId(Number(b.id))
        setForm({ code: b.code, name: b.name, address: b.address ?? '', city: b.city ?? '', contact_number: b.contactNumber ?? '' })
        setError('')
        setShowModal(true)
    }

    const handleSave = async () => {
        if (!form.code || !form.name) { setError('Code and Name are required'); return }
        setSaving(true)
        try {
            const input = { name: form.name, address: form.address, city: form.city, contactNumber: form.contact_number }
            if (editId) {
                await UpdateBranch({ branchId: editId, input, onSuccess: init })
            } else {
                await CreateBranch({ input, onSuccess: init })
            }
            setShowModal(false)
        } catch (e: any) {
            setError(e.message || 'Failed to save branch')
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async (id: any) => {
        if (!confirm('Delete this branch?')) return
        await DeleteBranch({ branchId: id, onSuccess: init })
    }

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Branches</h1>
                    <p className="text-muted-foreground text-sm mt-1">Manage office branches and locations</p>
                </div>
                {isAdmin && (
                    <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 rounded-lg gradient-primary text-white text-sm font-medium shadow-lg hover:opacity-90 transition-opacity">
                        <Plus className="w-4 h-4" /> New Branch
                    </button>
                )}
            </div>

            {loading ? (
                <div className="text-center py-16 text-muted-foreground">Loading branches…</div>
            ) : (
                <div className="glass rounded-xl overflow-hidden">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-border/50">
                                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Code</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Name</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">City</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Contact</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                                {isAdmin && <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {branchesData.length === 0 ? (
                                <tr><td colSpan={6} className="text-center py-12 text-muted-foreground">No branches found. Create your first branch.</td></tr>
                            ) : branchesData.map((b) => (
                                <tr key={String(b.id)} className="border-b border-border/30 hover:bg-white/5 transition-colors">
                                    <td className="px-4 py-3 font-mono font-semibold text-primary">{b.code}</td>
                                    <td className="px-4 py-3 text-foreground font-medium">{b.name}</td>
                                    <td className="px-4 py-3 text-muted-foreground">{b.city || '—'}</td>
                                    <td className="px-4 py-3 text-muted-foreground">{b.contactNumber || '—'}</td>
                                    <td className="px-4 py-3">
                                        {b.isActive
                                            ? <span className="flex items-center gap-1.5 text-emerald-400 text-xs"><CheckCircle className="w-3.5 h-3.5" /> Active</span>
                                            : <span className="flex items-center gap-1.5 text-destructive text-xs"><XCircle className="w-3.5 h-3.5" /> Inactive</span>}
                                    </td>
                                    {isAdmin && (
                                        <td className="px-4 py-3 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button onClick={() => openEdit(b)} className="p-1.5 rounded-lg hover:bg-primary/15 text-primary transition-colors"><Pencil className="w-3.5 h-3.5" /></button>
                                                <button onClick={() => handleDelete(b.id)} className="p-1.5 rounded-lg hover:bg-destructive/15 text-destructive transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                                            </div>
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                    <div className="glass rounded-2xl p-6 w-full max-w-md shadow-2xl border border-border/50">
                        <h2 className="font-bold text-lg text-foreground mb-4">{editId ? 'Edit Branch' : 'New Branch'}</h2>
                        <div className="space-y-3">
                            {!editId && (
                                <div>
                                    <label className="block text-xs text-muted-foreground mb-1">Branch Code *</label>
                                    <input value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} placeholder="e.g. MAIN, BR-001" className="w-full bg-background/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50" />
                                </div>
                            )}
                            <div>
                                <label className="block text-xs text-muted-foreground mb-1">Branch Name *</label>
                                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Main Branch" className="w-full bg-background/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50" />
                            </div>
                            <div>
                                <label className="block text-xs text-muted-foreground mb-1">City</label>
                                <input value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} placeholder="Manila" className="w-full bg-background/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50" />
                            </div>
                            <div>
                                <label className="block text-xs text-muted-foreground mb-1">Address</label>
                                <input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} placeholder="123 Main St." className="w-full bg-background/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50" />
                            </div>
                            <div>
                                <label className="block text-xs text-muted-foreground mb-1">Contact Number</label>
                                <input value={form.contact_number} onChange={e => setForm({ ...form, contact_number: e.target.value })} placeholder="+63 2 8123 4567" className="w-full bg-background/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50" />
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

const CreateBranch = async ({ input, onSuccess }: { input: any, onSuccess: () => void }) => {
    const res = await fetch('/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            query: `mutation CreateBranch($input: BranchInput!) { createBranch(input: $input) { success message branch { id code name } } }`,
            variables: { input }
        })
    })
    const data = await res.json()
    if (data.data?.createBranch?.success) {
        onSuccess()
    } else {
        throw new Error(data.errors?.[0]?.message || 'Failed to create branch')
    }
}

const UpdateBranch = async ({ branchId, input, onSuccess }: { branchId: any, input: any, onSuccess: () => void }) => {
    const res = await fetch('/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            query: `mutation UpdateBranch($branchId: ID!, $input: BranchInput!) { updateBranch(branchId: $branchId, input: $input) { success message branch { id code name } } }`,
            variables: { branchId, input }
        })
    })
    const data = await res.json()
    if (data.data?.updateBranch?.success) {
        onSuccess()
    } else {
        throw new Error(data.errors?.[0]?.message || 'Failed to update branch')
    }
}

const DeleteBranch = async ({ branchId, onSuccess }: { branchId: any, onSuccess: () => void }) => {
    const res = await fetch('/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            query: `mutation DeleteBranch($branchId: ID!) { deleteBranch(branchId: $branchId) { success message } }`,
            variables: { branchId }
        })
    })
    const data = await res.json()
    if (data.data?.deleteBranch?.success) {
        onSuccess()
    } else {
        throw new Error(data.errors?.[0]?.message || 'Failed to delete branch')
    }
}

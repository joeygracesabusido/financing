import { useState } from 'react'
import { useQuery, useMutation, gql } from '@apollo/client'
import { Plus, Pencil, Trash2, CheckCircle, XCircle } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'

const GET_BRANCHES = gql`
  query GetBranches {
    branches {
      success
      message
      branches {
        id
        code
        name
        address
        city
        contactNumber
        isActive
        createdAt
      }
      total
    }
  }
`

const CREATE_BRANCH = gql`
  mutation CreateBranch($input: BranchCreateInput!) {
    createBranch(input: $input) {
      success
      message
      branch { id code name city isActive }
    }
  }
`

const UPDATE_BRANCH = gql`
  mutation UpdateBranch($branchId: Int!, $input: BranchUpdateInput!) {
    updateBranch(branchId: $branchId, input: $input) {
      success
      message
      branch { id code name city isActive }
    }
  }
`

const DELETE_BRANCH = gql`
  mutation DeleteBranch($branchId: Int!) {
    deleteBranch(branchId: $branchId) {
      success
      message
    }
  }
`

interface BranchForm {
    code: string
    name: string
    address: string
    city: string
    contact_number: string
}

const emptyForm: BranchForm = { code: '', name: '', address: '', city: '', contact_number: '' }

export default function BranchesPage() {
    const { user } = useAuth()
    const isAdmin = user?.role === 'admin' || user?.role === 'branch_manager'

    const { data, loading, refetch } = useQuery(GET_BRANCHES)
    const [createBranch] = useMutation(CREATE_BRANCH)
    const [updateBranch] = useMutation(UPDATE_BRANCH)
    const [deleteBranch] = useMutation(DELETE_BRANCH)

    const [showModal, setShowModal] = useState(false)
    const [editId, setEditId] = useState<number | null>(null)
    const [form, setForm] = useState<BranchForm>(emptyForm)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')

    const branches = data?.branches?.branches ?? []

    const openCreate = () => { setEditId(null); setForm(emptyForm); setError(''); setShowModal(true) }
    const openEdit = (b: any) => {
        setEditId(b.id)
        setForm({ code: b.code, name: b.name, address: b.address ?? '', city: b.city ?? '', contact_number: b.contactNumber ?? '' })
        setError('')
        setShowModal(true)
    }

    const handleSave = async () => {
        if (!form.code || !form.name) { setError('Code and Name are required'); return }
        setSaving(true)
        try {
            if (editId) {
                await updateBranch({ variables: { branchId: editId, input: { name: form.name, address: form.address, city: form.city, contact_number: form.contact_number } } })
            } else {
                await createBranch({ variables: { input: form } })
            }
            await refetch()
            setShowModal(false)
        } catch (e: any) {
            setError(e.message)
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async (id: number) => {
        if (!confirm('Delete this branch?')) return
        await deleteBranch({ variables: { branchId: id } })
        refetch()
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
                            {branches.length === 0 ? (
                                <tr><td colSpan={6} className="text-center py-12 text-muted-foreground">No branches found. Create your first branch.</td></tr>
                            ) : branches.map((b: any) => (
                                <tr key={b.id} className="border-b border-border/30 hover:bg-white/5 transition-colors">
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

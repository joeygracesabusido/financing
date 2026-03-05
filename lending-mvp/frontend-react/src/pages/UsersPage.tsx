import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, CheckCircle, XCircle } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { getUsers, createUser, updateUser, deleteUser } from '@/api/users'
import { getBranches } from '@/api/client'

interface Branch {
    id: number
    code: string
    name: string
}

interface User {
    id: string
    username: string
    email: string
    role: string
    isActive: boolean
    fullName?: string
    branchId?: number
    branchCode?: string
    createdAt: string
}

export default function UsersPage() {
    const { user } = useAuth()
    const isAdmin = user?.role === 'admin'

    const [loading, setLoading] = useState(true)
    const [usersData, setUsersData] = useState<User[]>([])
    const [branches, setBranches] = useState<Branch[]>([])
    const [showModal, setShowModal] = useState(false)
    const [editId, setEditId] = useState<string | null>(null)
    const [form, setForm] = useState({ 
        username: '', 
        email: '', 
        role: 'user', 
        fullName: '', 
        password: '',
        branchId: '' as string | number,
        branchCode: ''
    })
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')

    const init = async () => {
        try {
            const [usersRes, branchesRes] = await Promise.all([
                getUsers(),
                getBranches()
            ])
            setUsersData(usersRes.users || [])
            setBranches(branchesRes.data?.branches || [])
        } catch (e) {
            console.error('Failed to fetch data:', e)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { init() }, [])

    const openCreate = () => { 
        setEditId(null); 
        setForm({ 
            username: '', 
            email: '', 
            role: 'user', 
            fullName: '', 
            password: '',
            branchId: '',
            branchCode: ''
        }); 
        setError(''); 
        setShowModal(true) 
    }

    const openEdit = (u: User) => {
        setEditId(u.id)
        setForm({ 
            username: u.username, 
            email: u.email, 
            role: u.role, 
            fullName: u.fullName ?? '',
            password: '', // Don't show password on edit
            branchId: u.branchId ?? '',
            branchCode: u.branchCode ?? ''
        })
        setError('')
        setShowModal(true)
    }

    const handleSave = async () => {
        if (!form.username || !form.email || (!editId && !form.password)) { 
            setError('Username, Email and Password are required'); 
            return 
        }
        setSaving(true)
        try {
            const input: any = { 
                username: form.username, 
                email: form.email, 
                role: form.role, 
                fullName: form.fullName,
            }

            if (form.password) input.password = form.password
            if (form.branchId) {
                input.branchId = parseInt(form.branchId.toString())
                input.branchCode = form.branchCode
            }

            if (editId) {
                await updateUser(editId, input)
            } else {
                await createUser(input)
            }
            await init()
            setShowModal(false)
        } catch (e: any) {
            setError(e.message || 'Failed to save user')
        } finally {
            setSaving(false)
        }
    }

    const onBranchChange = (branchId: string) => {
        const selectedBranch = branches.find(b => b.id.toString() === branchId)
        setForm({ 
            ...form, 
            branchId: branchId,
            branchCode: selectedBranch ? selectedBranch.code : ''
        })
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this user?')) return
        await deleteUser(id)
        await init()
    }

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Users</h1>
                    <p className="text-muted-foreground text-sm mt-1">Manage system users</p>
                </div>
                {isAdmin && (
                    <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 rounded-lg gradient-primary text-white text-sm font-medium shadow-lg hover:opacity-90 transition-opacity">
                        <Plus className="w-4 h-4" /> New User
                    </button>
                )}
            </div>

            {loading ? (
                <div className="text-center py-16 text-muted-foreground">Loading users…</div>
            ) : (
                <div className="glass rounded-xl overflow-hidden">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-border/50">
                                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Username</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Email</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Role</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Branch</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                                {isAdmin && <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {usersData.length === 0 ? (
                                <tr><td colSpan={6} className="text-center py-12 text-muted-foreground">No users found.</td></tr>
                            ) : usersData.map((u) => (
                                <tr key={u.id} className="border-b border-border/30 hover:bg-white/5 transition-colors">
                                    <td className="px-4 py-3 text-foreground font-medium">{u.username}</td>
                                    <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                                    <td className="px-4 py-3 text-muted-foreground capitalize">{u.role}</td>
                                    <td className="px-4 py-3 text-muted-foreground">{u.branchCode || '-'}</td>
                                    <td className="px-4 py-3">
                                        {u.isActive
                                            ? <span className="flex items-center gap-1.5 text-emerald-400 text-xs"><CheckCircle className="w-3.5 h-3.5" /> Active</span>
                                            : <span className="flex items-center gap-1.5 text-destructive text-xs"><XCircle className="w-3.5 h-3.5" /> Inactive</span>}
                                    </td>
                                    {isAdmin && (
                                        <td className="px-4 py-3 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button onClick={() => openEdit(u)} className="p-1.5 rounded-lg hover:bg-primary/15 text-primary transition-colors"><Pencil className="w-3.5 h-3.5" /></button>
                                                <button onClick={() => handleDelete(u.id)} className="p-1.5 rounded-lg hover:bg-destructive/15 text-destructive transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
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
                        <h2 className="font-bold text-lg text-foreground mb-4">{editId ? 'Edit User' : 'New User'}</h2>
                        <div className="space-y-3 overflow-y-auto max-h-[70vh]">
                            <div>
                                <label className="block text-xs text-muted-foreground mb-1">Username *</label>
                                <input value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} placeholder="john_doe" className="w-full bg-background/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50" />
                            </div>
                            <div>
                                <label className="block text-xs text-muted-foreground mb-1">Email *</label>
                                <input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="john@example.com" className="w-full bg-background/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50" />
                            </div>
                            {!editId && (
                                <div>
                                    <label className="block text-xs text-muted-foreground mb-1">Password *</label>
                                    <input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="••••••••" className="w-full bg-background/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50" />
                                </div>
                            )}
                            <div>
                                <label className="block text-xs text-muted-foreground mb-1">Full Name</label>
                                <input value={form.fullName} onChange={e => setForm({ ...form, fullName: e.target.value })} placeholder="John Doe" className="w-full bg-background/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50" />
                            </div>
                            <div>
                                <label className="block text-xs text-muted-foreground mb-1">Role</label>
                                <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} className="w-full bg-background/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/50">
                                    <option value="user">User</option>
                                    <option value="admin">Admin</option>
                                    <option value="loan_officer">Loan Officer</option>
                                    <option value="teller">Teller</option>
                                    <option value="branch_manager">Branch Manager</option>
                                    <option value="auditor">Auditor</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs text-muted-foreground mb-1">Branch</label>
                                <select 
                                    value={form.branchId} 
                                    onChange={e => onBranchChange(e.target.value)} 
                                    className="w-full bg-background/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/50"
                                >
                                    <option value="">No Branch Assigned</option>
                                    {branches.map(b => (
                                        <option key={b.id} value={b.id}>{b.name} ({b.code})</option>
                                    ))}
                                </select>
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

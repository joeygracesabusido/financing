import { useState } from 'react'
import { useQuery, useMutation } from '@apollo/client'
import { Users, Plus, Pencil, UserCheck, UserX, ShieldAlert, Loader2 } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { GET_USERS, CREATE_USER, UPDATE_USER, DELETE_USER } from '@/api/queries'

const ROLES = ['admin', 'loan_officer', 'teller', 'branch_manager', 'auditor', 'customer'] as const
type Role = typeof ROLES[number]

const ROLE_COLORS: Record<Role, string> = {
    admin: 'bg-purple-500/15 text-purple-400 border-purple-500/20',
    loan_officer: 'bg-sky-500/15 text-sky-400 border-sky-500/20',
    teller: 'bg-teal-500/15 text-teal-400 border-teal-500/20',
    branch_manager: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/20',
    auditor: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
    customer: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/20',
}

const ROLE_LABELS: Record<Role, string> = {
    admin: 'Administrator',
    loan_officer: 'Loan Officer',
    teller: 'Teller',
    branch_manager: 'Branch Manager',
    auditor: 'Auditor',
    customer: 'Customer',
}

interface UserForm {
    email: string
    username: string
    fullName: string
    password: string
    role: Role
}

const emptyForm: UserForm = {
    email: '', username: '', fullName: '', password: '', role: 'teller',
}

function formatDate(d: string) {
    try { return new Date(d).toLocaleDateString('en-PH', { dateStyle: 'medium' }) } catch { return d }
}

export default function UsersPage() {
    const { user: currentUser } = useAuth()

    // Only admin can access this page
    if (currentUser?.role !== 'admin') {
        return (
            <div className="flex flex-col items-center justify-center h-64 gap-3">
                <ShieldAlert className="w-12 h-12 text-destructive/60" />
                <p className="text-muted-foreground">Admin access required</p>
            </div>
        )
    }

    const { data, loading, refetch } = useQuery(GET_USERS, {
        variables: { skip: 0, limit: 200 },
        fetchPolicy: 'cache-and-network',
    })

    const [createUser, { loading: creating }] = useMutation(CREATE_USER)
    const [updateUser, { loading: updating }] = useMutation(UPDATE_USER)
    const [deleteUser] = useMutation(DELETE_USER)

    const [showModal, setShowModal] = useState(false)
    const [editId, setEditId] = useState<string | null>(null)
    const [form, setForm] = useState<UserForm>(emptyForm)
    const [error, setError] = useState('')
    const [successMsg, setSuccessMsg] = useState('')
    const [filterRole, setFilterRole] = useState<Role | 'all'>('all')

    const users: any[] = data?.users?.users ?? []
    const filtered = filterRole === 'all' ? users : users.filter(u => u.role === filterRole)

    const openCreate = () => {
        setEditId(null)
        setForm(emptyForm)
        setError('')
        setShowModal(true)
    }

    const openEdit = (u: any) => {
        setEditId(u.id)
        setForm({ email: u.email, username: u.username, fullName: u.fullName, password: '', role: u.role })
        setError('')
        setShowModal(true)
    }

    const handleSave = async () => {
        if (!form.email || !form.username || !form.fullName || (!editId && !form.password)) {
            setError('Email, username, full name, and password are required')
            return
        }
        setError('')
        try {
            if (editId) {
                const input: any = { email: form.email, username: form.username, fullName: form.fullName, role: form.role }
                if (form.password) input.password = form.password
                const res = await updateUser({ variables: { userId: editId, input } })
                if (!res.data?.updateUser?.success) throw new Error(res.data?.updateUser?.message)
            } else {
                const res = await createUser({ variables: { input: form } })
                if (!res.data?.createUser?.success) throw new Error(res.data?.createUser?.message)
            }
            setShowModal(false)
            setSuccessMsg(editId ? 'User updated successfully' : 'User created successfully')
            setTimeout(() => setSuccessMsg(''), 4000)
            refetch()
        } catch (e: any) {
            setError(e.message)
        }
    }

    const handleToggleActive = async (u: any) => {
        try {
            await updateUser({ variables: { userId: u.id, input: { isActive: !u.isActive } } })
            refetch()
        } catch (e: any) {
            setError(e.message)
        }
    }

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                        <Users className="w-6 h-6 text-primary" /> User Management
                    </h1>
                    <p className="text-muted-foreground text-sm mt-1">
                        {loading ? 'Loading…' : `${users.length} system users`}
                    </p>
                </div>
                <button onClick={openCreate}
                    className="flex items-center gap-2 px-4 py-2.5 gradient-primary text-white text-sm font-semibold rounded-lg shadow-lg shadow-primary/25 hover:opacity-90 transition-all duration-200">
                    <Plus className="w-4 h-4" /> New User
                </button>
            </div>

            {successMsg && (
                <div className="px-4 py-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm">{successMsg}</div>
            )}

            {/* Role Filters */}
            <div className="flex flex-wrap gap-2">
                {(['all', ...ROLES] as const).map(r => (
                    <button
                        key={r}
                        onClick={() => setFilterRole(r)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${filterRole === r ? 'bg-primary/20 text-primary border border-primary/30' : 'bg-background/50 border border-border text-muted-foreground hover:bg-white/5'}`}
                    >
                        {r === 'all' ? 'All Roles' : ROLE_LABELS[r]}
                        {r !== 'all' && (
                            <span className="ml-1.5 opacity-60">{users.filter(u => u.role === r).length}</span>
                        )}
                    </button>
                ))}
            </div>

            {/* Table */}
            <div className="glass rounded-xl overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    </div>
                ) : (
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-border/50 bg-secondary/30">
                                {['User', 'Username', 'Role', 'Status', 'Joined', 'Actions'].map(h => (
                                    <th key={h} className="text-left px-5 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="py-16 text-center text-muted-foreground text-sm">
                                        No users found
                                    </td>
                                </tr>
                            ) : filtered.map((u: any) => (
                                <tr key={u.id} className="border-b border-border/30 hover:bg-white/5 transition-colors">
                                    <td className="px-5 py-3.5">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                                                {u.fullName?.[0]?.toUpperCase() ?? u.username?.[0]?.toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="font-medium text-sm text-foreground">{u.fullName}</p>
                                                <p className="text-xs text-muted-foreground">{u.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-5 py-3.5 font-mono text-xs text-muted-foreground">{u.username}</td>
                                    <td className="px-5 py-3.5">
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${ROLE_COLORS[u.role as Role] ?? 'bg-zinc-500/15 text-zinc-400'}`}>
                                            {ROLE_LABELS[u.role as Role] ?? u.role}
                                        </span>
                                    </td>
                                    <td className="px-5 py-3.5">
                                        {u.isActive
                                            ? <span className="flex items-center gap-1 text-xs text-emerald-400"><UserCheck className="w-3.5 h-3.5" /> Active</span>
                                            : <span className="flex items-center gap-1 text-xs text-destructive"><UserX className="w-3.5 h-3.5" /> Inactive</span>
                                        }
                                    </td>
                                    <td className="px-5 py-3.5 text-xs text-muted-foreground">{formatDate(u.createdAt)}</td>
                                    <td className="px-5 py-3.5">
                                        <div className="flex items-center gap-2">
                                            <button onClick={() => openEdit(u)}
                                                className="p-1.5 rounded-lg hover:bg-primary/15 text-primary transition-colors" title="Edit">
                                                <Pencil className="w-3.5 h-3.5" />
                                            </button>
                                            {u.id !== currentUser?.id && (
                                                <button
                                                    onClick={() => handleToggleActive(u)}
                                                    className={`p-1.5 rounded-lg transition-colors ${u.isActive ? 'hover:bg-destructive/15 text-destructive' : 'hover:bg-emerald-500/15 text-emerald-400'}`}
                                                    title={u.isActive ? 'Deactivate' : 'Activate'}
                                                >
                                                    {u.isActive ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Create / Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                    <div className="glass rounded-2xl p-6 w-full max-w-md shadow-2xl border border-border/50">
                        <h2 className="font-bold text-lg text-foreground mb-5">
                            {editId ? 'Edit User' : 'New User'}
                        </h2>
                        <div className="space-y-3">
                            {[
                                { label: 'Full Name *', key: 'fullName', type: 'text', ph: 'Juan dela Cruz' },
                                { label: 'Username *', key: 'username', type: 'text', ph: 'jdelacruz' },
                                { label: 'Email *', key: 'email', type: 'email', ph: 'juan@bank.ph' },
                                { label: editId ? 'New Password (leave blank to keep)' : 'Password *', key: 'password', type: 'password', ph: '••••••••' },
                            ].map(f => (
                                <div key={f.key}>
                                    <label className="block text-xs text-muted-foreground mb-1">{f.label}</label>
                                    <input
                                        type={f.type}
                                        placeholder={f.ph}
                                        value={(form as any)[f.key]}
                                        onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                                        className="w-full bg-background/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
                                    />
                                </div>
                            ))}
                            <div>
                                <label className="block text-xs text-muted-foreground mb-1">Role *</label>
                                <select
                                    value={form.role}
                                    onChange={e => setForm({ ...form, role: e.target.value as Role })}
                                    className="w-full bg-background/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/50"
                                >
                                    {ROLES.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
                                </select>
                            </div>
                            {error && <p className="text-destructive text-xs">{error}</p>}
                        </div>
                        <div className="flex gap-3 mt-5">
                            <button onClick={() => setShowModal(false)}
                                className="flex-1 px-4 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:bg-white/5 transition-colors">
                                Cancel
                            </button>
                            <button onClick={handleSave} disabled={creating || updating}
                                className="flex-1 px-4 py-2 rounded-lg gradient-primary text-white text-sm font-medium disabled:opacity-60">
                                {creating || updating ? 'Saving…' : editId ? 'Update' : 'Create'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

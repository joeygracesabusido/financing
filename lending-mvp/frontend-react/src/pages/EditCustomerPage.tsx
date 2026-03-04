import { useState, useEffect } from 'react'
import { ArrowLeft, Pencil, CheckCircle } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { getCustomer, updateCustomer } from '@/api/customers'

export default function EditCustomerPage() {
    const { user } = useAuth()
    const navigate = useNavigate()
    const { id } = useParams()
    const isAdmin = user?.role === 'admin' || user?.role === 'branch_manager'

    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [customer, setCustomer] = useState<any>(null)
    const [form, setForm] = useState({ displayName: '', customerType: 'individual', branchCode: '', emailAddress: '', mobileNumber: '' })
    const [error, setError] = useState('')
    const [success, setSuccess] = useState(false)

    useEffect(() => {
        const loadCustomer = async () => {
            try {
                const data = await getCustomer(id || '')
                setCustomer(data.customer)
                setForm({
                    displayName: data.customer.displayName,
                    customerType: data.customer.customerType,
                    branchCode: data.customer.branchCode,
                    emailAddress: data.customer.emailAddress || '',
                    mobileNumber: data.customer.mobileNumber || ''
                })
            } catch (e) {
                console.error('Failed to load customer:', e)
            } finally {
                setLoading(false)
            }
        }
        loadCustomer()
    }, [id])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!form.displayName) { setError('Name is required'); return }
        setSaving(true)
        setError('')
        try {
            const input = { displayName: form.displayName, customerType: form.customerType, branchCode: form.branchCode, emailAddress: form.emailAddress, mobileNumber: form.mobileNumber }
            await updateCustomer(id || "", input as any)
            setSuccess(true)
            setTimeout(() => navigate('/customers'), 2000)
        } catch (e: any) {
            setError(e.message || 'Failed to update customer')
        } finally {
            setSaving(false)
        }
    }

    if (loading) return <div className="text-center py-16 text-muted-foreground">Loading...</div>
    if (success) return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
                <CheckCircle className="w-16 h-16 text-emerald-400 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-foreground mb-2">Customer Updated!</h2>
                <p className="text-muted-foreground">Redirecting...</p>
            </div>
        </div>
    )

    return (
        <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
            <div className="flex items-center gap-4">
                <button onClick={() => navigate('/customers')} className="p-2 rounded-lg hover:bg-background/50 text-muted-foreground transition-colors">
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Edit Customer</h1>
                    <p className="text-muted-foreground text-sm mt-1">Update customer information</p>
                </div>
            </div>

            <div className="glass rounded-xl p-6 space-y-4">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-1">Full Name *</label>
                        <input value={form.displayName} onChange={e => setForm({ ...form, displayName: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-border bg-background/50 focus:outline-none focus:border-primary/50" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-1">Customer Type</label>
                        <select value={form.customerType} onChange={e => setForm({ ...form, customerType: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-border bg-background/50 focus:outline-none focus:border-primary/50">
                            <option value="individual">Individual</option>
                            <option value="corporate">Corporate</option>
                        </select>
                    </div>
                    {isAdmin && (
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-1">Branch Code</label>
                            <input value={form.branchCode} onChange={e => setForm({ ...form, branchCode: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-border bg-background/50 focus:outline-none focus:border-primary/50" />
                        </div>
                    )}
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-1">Email Address</label>
                        <input value={form.emailAddress} onChange={e => setForm({ ...form, emailAddress: e.target.value })} type="email" className="w-full px-3 py-2 rounded-lg border border-border bg-background/50 focus:outline-none focus:border-primary/50" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-1">Mobile Number</label>
                        <input value={form.mobileNumber} onChange={e => setForm({ ...form, mobileNumber: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-border bg-background/50 focus:outline-none focus:border-primary/50" />
                    </div>
                    {error && <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{error}</div>}
                    <div className="flex gap-3 pt-4">
                        <button type="button" onClick={() => navigate('/customers')} className="flex-1 px-4 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:bg-white/5 transition-colors">Cancel</button>
                        <button type="submit" disabled={saving} className="flex-1 px-4 py-2 rounded-lg gradient-primary text-white text-sm font-medium disabled:opacity-60">
                            {saving ? 'Updating...' : 'Update Customer'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

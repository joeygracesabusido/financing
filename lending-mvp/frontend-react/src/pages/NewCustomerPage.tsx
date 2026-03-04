import { useState } from 'react'
import { ArrowLeft, CheckCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { createCustomer } from '@/api/customers'

export default function NewCustomerPage() {
    const { user } = useAuth()
    const navigate = useNavigate()
    const isAdmin = user?.role === 'admin' || user?.role === 'branch_manager'

    const [loading, setLoading] = useState(false)
    const [form, setForm] = useState({ displayName: '', customerType: 'individual', branchCode: '', emailAddress: '', mobileNumber: '' })
    const [error, setError] = useState('')
    const [success, setSuccess] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!form.displayName) { setError('Name is required'); return }
        setLoading(true)
        setError('')
        try {
            const input = { displayName: form.displayName, customerType: form.customerType, branchCode: form.branchCode, emailAddress: form.emailAddress, mobileNumber: form.mobileNumber }
            await createCustomer(input)
            setSuccess(true)
            setTimeout(() => navigate('/customers'), 2000)
        } catch (e: any) {
            setError(e.message || 'Failed to create customer')
        } finally {
            setLoading(false)
        }
    }

    if (success) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                    <CheckCircle className="w-16 h-16 text-emerald-400 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-foreground mb-2">Customer Created!</h2>
                    <p className="text-muted-foreground">Redirecting...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
            <div className="flex items-center gap-4">
                <button onClick={() => navigate('/customers')} className="p-2 rounded-lg hover:bg-background/50 text-muted-foreground transition-colors">
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-foreground">New Customer</h1>
                    <p className="text-muted-foreground text-sm mt-1">Create a new customer account</p>
                </div>
            </div>

            <div className="glass rounded-xl p-6 space-y-4">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-1">Full Name *</label>
                        <input value={form.displayName} onChange={e => setForm({ ...form, displayName: e.target.value })} placeholder="John Doe" className="w-full px-3 py-2 rounded-lg border border-border bg-background/50 focus:outline-none focus:border-primary/50" required />
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
                            <input value={form.branchCode} onChange={e => setForm({ ...form, branchCode: e.target.value })} placeholder="HQ" className="w-full px-3 py-2 rounded-lg border border-border bg-background/50 focus:outline-none focus:border-primary/50" />
                        </div>
                    )}
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-1">Email Address</label>
                        <input value={form.emailAddress} onChange={e => setForm({ ...form, emailAddress: e.target.value })} placeholder="john@example.com" type="email" className="w-full px-3 py-2 rounded-lg border border-border bg-background/50 focus:outline-none focus:border-primary/50" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-1">Mobile Number</label>
                        <input value={form.mobileNumber} onChange={e => setForm({ ...form, mobileNumber: e.target.value })} placeholder="+63 912 345 6789" className="w-full px-3 py-2 rounded-lg border border-border bg-background/50 focus:outline-none focus:border-primary/50" />
                    </div>
                    {error && <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{error}</div>}
                    <div className="flex gap-3 pt-4">
                        <button type="button" onClick={() => navigate('/customers')} className="flex-1 px-4 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:bg-white/5 transition-colors">Cancel</button>
                        <button type="submit" disabled={loading} className="flex-1 px-4 py-2 rounded-lg gradient-primary text-white text-sm font-medium disabled:opacity-60">
                            {loading ? 'Creating...' : 'Create Customer'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

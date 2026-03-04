import { useState, useEffect } from 'react'
import { ArrowLeft } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { getCustomer } from '@/api/customers'

export default function CustomerDetailPage() {
    const navigate = useNavigate()
    const { id } = useParams()
    const [loading, setLoading] = useState(true)
    const [customer, setCustomer] = useState<any>(null)

    useEffect(() => {
        const loadCustomer = async () => {
            try {
                const data = await getCustomer(id || '')
                setCustomer(data.customer)
            } catch (e) {
                console.error('Failed to load customer:', e)
            } finally {
                setLoading(false)
            }
        }
        loadCustomer()
    }, [id])

    if (loading) return <div className="text-center py-16 text-muted-foreground">Loading...</div>
    if (!customer) return <div className="text-center py-16 text-muted-foreground">Customer not found</div>

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center gap-4">
                <button onClick={() => navigate('/customers')} className="p-2 rounded-lg hover:bg-background/50 text-muted-foreground transition-colors">
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-foreground">{customer.displayName}</h1>
                    <p className="text-muted-foreground text-sm mt-1">{customer.customerType} • {customer.branchCode}</p>
                </div>
            </div>

            <div className="glass rounded-xl p-6 grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                    <label className="text-xs text-muted-foreground">Email</label>
                    <p className="text-foreground">{customer.emailAddress || '—'}</p>
                </div>
                <div>
                    <label className="text-xs text-muted-foreground">Phone</label>
                    <p className="text-foreground">{customer.mobileNumber || '—'}</p>
                </div>
                <div>
                    <label className="text-xs text-muted-foreground">Type</label>
                    <p className="text-foreground capitalize">{customer.customerType}</p>
                </div>
                <div>
                    <label className="text-xs text-muted-foreground">KYC Status</label>
                    <p className={`text-xs px-2 py-1 rounded-full ${customer.kycStatus === 'verified' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                        {customer.kycStatus || 'Not verified'}
                    </p>
                </div>
                <div>
                    <label className="text-xs text-muted-foreground">Risk Score</label>
                    <p className="text-foreground">{customer.riskScore ?? '—'}</p>
                </div>
                <div>
                    <label className="text-xs text-muted-foreground">Created</label>
                    <p className="text-foreground">{new Date(customer.createdAt).toLocaleDateString()}</p>
                </div>
            </div>
        </div>
    )
}

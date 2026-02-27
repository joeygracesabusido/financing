import React, { useState } from 'react'
import { useQuery, useMutation } from '@apollo/client'
import { GET_LOAN_PRODUCTS, CREATE_LOAN_PRODUCT } from '@/api/queries'
import { Package, Plus, Loader2, X, Check, Activity, Calendar } from 'lucide-react'

interface LoanProduct {
    id: string
    productCode: string
    name: string
    description: string
    amortizationType: string
    repaymentFrequency: string
    interestRate: number
    penaltyRate: number
    gracePeriodMonths: number
    isActive: boolean
    principalOnlyGrace: boolean
    fullGrace: boolean
    originationFeeRate: number | null
    originationFeeType: string | null
    prepaymentAllowed: boolean
    prepaymentPenaltyRate: number | null
    customerLoanLimit: number | null
}

export default function LoanProductsPage() {
    const { data, loading, error, refetch } = useQuery(GET_LOAN_PRODUCTS)
    const [createLoanProduct, { loading: creating }] = useMutation(CREATE_LOAN_PRODUCT)

    const [isModalOpen, setIsModalOpen] = useState(false)
    const [formData, setFormData] = useState({
        productCode: '',
        name: '',
        description: '',
        amortizationType: 'flat_rate',
        repaymentFrequency: 'monthly',
        interestRate: 0.0,
        penaltyRate: 0.0,
        gracePeriodMonths: 0,
        isActive: true,
        originationFeeRate: 0.0,
        originationFeeType: 'upfront',
        prepaymentAllowed: true,
        prepaymentPenaltyRate: 0.0,
        customerLoanLimit: 0.0,
    })

    const products: LoanProduct[] = data?.loanProducts ?? []

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target as any
        setFormData(prev => ({
            ...prev,
            [name]: type === 'number' ? parseFloat(value) : value
        }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            await createLoanProduct({ variables: { input: formData } })
            setIsModalOpen(false)
            refetch()
        } catch (err) {
            console.error(err)
            alert("Failed to create product")
        }
    }

    return (
        <div className="space-y-5 animate-fade-in relative">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                        <Package className="w-6 h-6 text-purple-400" /> Loan Products
                    </h1>
                    <p className="text-muted-foreground text-sm mt-1">
                        {loading ? 'Loading...' : `${products.length} configured products`}
                    </p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-purple-500/15 border border-purple-500/30 text-purple-400 text-sm font-semibold rounded-lg hover:bg-purple-500/25 transition-all duration-200"
                >
                    <Plus className="w-4 h-4" /> New Product
                </button>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-purple-400" /></div>
            ) : error ? (
                <div className="py-20 text-center text-destructive text-sm">{error.message}</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {products.length === 0 ? (
                        <div className="col-span-full py-16 text-center text-muted-foreground">No loan products configured</div>
                    ) : (
                        products.map((p) => (
                            <div key={p.id} className="glass rounded-xl p-5 hover:border-purple-500/30 transition-all duration-300 cursor-pointer group flex flex-col justify-between">
                                <div>
                                    <div className="flex items-start justify-between mb-3">
                                        <div>
                                            <h3 className="font-semibold text-foreground group-hover:text-purple-400 transition-colors">{p.name}</h3>
                                            <p className="text-xs text-muted-foreground uppercase">{p.productCode}</p>
                                        </div>
                                        <div className="flex flex-col items-end gap-1">
                                            <span className="px-2 py-1 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-md text-xs font-bold whitespace-nowrap">
                                                {p.interestRate}% p.a.
                                            </span>
                                            {p.isActive ?
                                                <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1"><Check className="w-3 h-3" /> Active</span>
                                                :
                                                <span className="text-[10px] text-muted-foreground font-semibold flex items-center gap-1"><X className="w-3 h-3" /> Inactive</span>
                                            }
                                        </div>
                                    </div>
                                    {p.description && (
                                        <p className="text-xs text-muted-foreground mb-4 line-clamp-2">{p.description}</p>
                                    )}
                                </div>

                                <div className="space-y-2 text-xs pt-4 border-t border-border/50">
                                    <div className="flex items-center justify-between text-muted-foreground">
                                        <span className="flex items-center gap-1.5"><Activity className="w-3.5 h-3.5" /> Amortization</span>
                                        <span className="text-foreground font-medium capitalize">{p.amortizationType.replace('_', ' ')}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-muted-foreground">
                                        <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> Repayment</span>
                                        <span className="text-foreground font-medium capitalize">{p.repaymentFrequency}</span>
                                    </div>
                                    <div className="flex justify-between text-muted-foreground">
                                        <span>Grace Period</span>
                                        <span className="text-foreground font-medium">{p.gracePeriodMonths} months</span>
                                    </div>
                                    <div className="flex justify-between text-muted-foreground">
                                        <span>Penalty Rate</span>
                                        <span className="text-destructive font-medium">{p.penaltyRate}%</span>
                                    </div>
                                    {p.originationFeeRate != null && p.originationFeeRate > 0 && (
                                        <div className="flex justify-between text-muted-foreground">
                                            <span>Origination Fee</span>
                                            <span className="text-foreground font-medium">{p.originationFeeRate}% ({p.originationFeeType})</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between text-muted-foreground">
                                        <span>Prepayment</span>
                                        <span className={`font-medium ${p.prepaymentAllowed ? 'text-emerald-400' : 'text-red-400'}`}>
                                            {p.prepaymentAllowed ? 'Allowed' : 'Not Allowed'}
                                            {p.prepaymentAllowed && p.prepaymentPenaltyRate ? ` (${p.prepaymentPenaltyRate}% fee)` : ''}
                                        </span>
                                    </div>
                                    {p.customerLoanLimit != null && p.customerLoanLimit > 0 && (
                                        <div className="flex justify-between text-muted-foreground">
                                            <span>Customer Limit</span>
                                            <span className="text-foreground font-medium">₱{Number(p.customerLoanLimit).toLocaleString()}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm px-4">
                    <div className="glass w-full max-w-lg rounded-xl flex flex-col max-h-[90vh]">
                        <div className="flex items-center justify-between p-5 border-b border-border/50">
                            <h2 className="text-xl font-semibold">Create Loan Product</h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-muted-foreground hover:text-foreground">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-5 overflow-y-auto">
                            <form id="create-product-form" onSubmit={handleSubmit} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-xs text-muted-foreground font-medium">Product Code *</label>
                                        <input required name="productCode" value={formData.productCode} onChange={handleChange} className="w-full bg-background/50 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-500/50" placeholder="e.g. PER-LN-01" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs text-muted-foreground font-medium">Name *</label>
                                        <input required name="name" value={formData.name} onChange={handleChange} className="w-full bg-background/50 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-500/50" placeholder="Personal Loan" />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs text-muted-foreground font-medium">Description</label>
                                    <textarea name="description" value={formData.description} onChange={handleChange} className="w-full bg-background/50 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-500/50" rows={2} />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-xs text-muted-foreground font-medium">Amortization Type</label>
                                        <select name="amortizationType" value={formData.amortizationType} onChange={handleChange} className="w-full bg-background/50 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-500/50">
                                            <option value="flat_rate">Flat Rate</option>
                                            <option value="declining_balance">Declining Balance</option>
                                            <option value="balloon_payment">Balloon Payment</option>
                                            <option value="interest_only">Interest Only</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs text-muted-foreground font-medium">Repayment Frequency</label>
                                        <select name="repaymentFrequency" value={formData.repaymentFrequency} onChange={handleChange} className="w-full bg-background/50 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-500/50">
                                            <option value="daily">Daily</option>
                                            <option value="weekly">Weekly</option>
                                            <option value="monthly">Monthly</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-xs text-muted-foreground font-medium">Interest Rate (%) *</label>
                                        <input required type="number" step="0.01" name="interestRate" value={formData.interestRate} onChange={handleChange} className="w-full bg-background/50 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-500/50" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs text-muted-foreground font-medium">Penalty Rate (%)</label>
                                        <input type="number" step="0.01" name="penaltyRate" value={formData.penaltyRate} onChange={handleChange} className="w-full bg-background/50 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-500/50" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs text-muted-foreground font-medium">Grace Period (Mo)</label>
                                        <input type="number" name="gracePeriodMonths" value={formData.gracePeriodMonths} onChange={handleChange} className="w-full bg-background/50 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-500/50" />
                                    </div>
                                </div>

                                <div className="border-t border-border/30 pt-4 mt-4">
                                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Phase 2 — Enhanced Features</p>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-xs text-muted-foreground font-medium">Origination Fee (%)</label>
                                            <input type="number" step="0.01" name="originationFeeRate" value={formData.originationFeeRate} onChange={handleChange} className="w-full bg-background/50 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-500/50" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs text-muted-foreground font-medium">Fee Type</label>
                                            <select name="originationFeeType" value={formData.originationFeeType} onChange={handleChange} className="w-full bg-background/50 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-500/50">
                                                <option value="upfront">Upfront (deducted)</option>
                                                <option value="spread">Spread (added to loan)</option>
                                            </select>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs text-muted-foreground font-medium">Prepayment Penalty (%)</label>
                                            <input type="number" step="0.01" name="prepaymentPenaltyRate" value={formData.prepaymentPenaltyRate} onChange={handleChange} className="w-full bg-background/50 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-500/50" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs text-muted-foreground font-medium">Customer Loan Limit</label>
                                            <input type="number" step="0.01" name="customerLoanLimit" value={formData.customerLoanLimit} onChange={handleChange} className="w-full bg-background/50 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-500/50" placeholder="0 = unlimited" />
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 mt-3">
                                        <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
                                            <input type="checkbox" checked={formData.prepaymentAllowed} onChange={e => setFormData(f => ({ ...f, prepaymentAllowed: e.target.checked }))} className="rounded" />
                                            Prepayment Allowed
                                        </label>
                                    </div>
                                </div>
                            </form>
                        </div>
                        <div className="p-5 border-t border-border/50 flex justify-end gap-3">
                            <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground">Cancel</button>
                            <button form="create-product-form" type="submit" disabled={creating} className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white text-sm font-medium rounded-lg disabled:opacity-50 flex items-center gap-2">
                                {creating && <Loader2 className="w-4 h-4 animate-spin" />} Save Product
                            </button>
                        </div>
                    </div>
                </div >
            )
            }
        </div >
    )
}

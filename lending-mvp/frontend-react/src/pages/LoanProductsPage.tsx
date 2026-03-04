import React, { useState } from 'react'
import { useMutation } from '@apollo/client'
import { CREATE_LOAN_PRODUCT, UPDATE_LOAN_PRODUCT } from '@/api/queries'
import { Package, Plus, Loader2, X, Check, Activity, Calendar, Edit2 } from 'lucide-react'

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

// Mock loan products data
const MOCK_LOAN_PRODUCTS: LoanProduct[] = [
    {
        id: '1',
        productCode: 'P21001',
        name: 'Personal Loan',
        description: 'Unsecured personal loan for various purposes',
        amortizationType: 'flat_rate',
        repaymentFrequency: 'monthly',
        interestRate: 12.5,
        penaltyRate: 3.0,
        gracePeriodMonths: 0,
        isActive: true,
        principalOnlyGrace: false,
        fullGrace: false,
        originationFeeRate: 2.0,
        originationFeeType: 'upfront',
        prepaymentAllowed: true,
        prepaymentPenaltyRate: 2.0,
        customerLoanLimit: 500000,
    },
    {
        id: '2',
        productCode: 'P21002',
        name: 'Business Loan',
        description: 'Secured business loan for expansion',
        amortizationType: 'reducing_balance',
        repaymentFrequency: 'monthly',
        interestRate: 10.0,
        penaltyRate: 2.0,
        gracePeriodMonths: 1,
        isActive: true,
        principalOnlyGrace: true,
        fullGrace: false,
        originationFeeRate: 1.5,
        originationFeeType: 'upfront',
        prepaymentAllowed: true,
        prepaymentPenaltyRate: 1.0,
        customerLoanLimit: 1000000,
    },
    {
        id: '3',
        productCode: 'P21003',
        name: 'Home Improvement Loan',
        description: 'Loan for home renovation and improvements',
        amortizationType: 'reducing_balance',
        repaymentFrequency: 'monthly',
        interestRate: 9.5,
        penaltyRate: 2.5,
        gracePeriodMonths: 2,
        isActive: true,
        principalOnlyGrace: false,
        fullGrace: false,
        originationFeeRate: 1.0,
        originationFeeType: 'upfront',
        prepaymentAllowed: true,
        prepaymentPenaltyRate: 1.5,
        customerLoanLimit: 2000000,
    },
]

export default function LoanProductsPage() {
    const [createLoanProduct, { loading: creating }] = useMutation(CREATE_LOAN_PRODUCT)
    const [updateLoanProduct, { loading: updating }] = useMutation(UPDATE_LOAN_PRODUCT)

    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingProduct, setEditingProduct] = useState<LoanProduct | null>(null)
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

    const products: LoanProduct[] = MOCK_LOAN_PRODUCTS

    const handleOpenModal = (product?: LoanProduct) => {
        if (product) {
            setEditingProduct(product)
            setFormData({ ...product })
        } else {
            setEditingProduct(null)
            setFormData({
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
        }
        setIsModalOpen(true)
    }

    const handleCloseModal = () => {
        setIsModalOpen(false)
        setEditingProduct(null)
    }

    const handleSave = async () => {
        if (editingProduct) {
            await updateLoanProduct({
                variables: {
                    id: editingProduct.id,
                    input: formData,
                },
            })
        } else {
            await createLoanProduct({
                variables: {
                    input: formData,
                },
            })
        }
        handleCloseModal()
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Loan Products</h1>
                    <p className="text-muted-foreground text-sm mt-1">Manage your loan products</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    Add Product
                </button>
            </div>

            <div className="glass rounded-2xl shadow-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="border-b border-border">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Product Code</th>
                                <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Name</th>
                                <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Interest Rate</th>
                                <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {products.map((product) => (
                                <tr key={product.id} className="hover:bg-accent/50 transition-colors">
                                    <td className="px-6 py-4 text-sm font-medium text-foreground">{product.productCode}</td>
                                    <td className="px-6 py-4 text-sm text-foreground">{product.name}</td>
                                    <td className="px-6 py-4 text-sm text-foreground">{product.interestRate}%</td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${product.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                            {product.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right text-sm">
                                        <button
                                            onClick={() => handleOpenModal(product)}
                                            className="text-primary hover:text-primary/80 transition-colors"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-background rounded-2xl shadow-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-foreground">
                                {editingProduct ? 'Edit Loan Product' : 'Add Loan Product'}
                            </h2>
                            <button onClick={handleCloseModal} className="text-muted-foreground hover:text-foreground transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-muted-foreground mb-1">Product Code</label>
                                    <input
                                        type="text"
                                        value={formData.productCode}
                                        onChange={(e) => setFormData({ ...formData, productCode: e.target.value })}
                                        className="w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-muted-foreground mb-1">Name</label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                        required
                                    />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-muted-foreground mb-1">Description</label>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        className="w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                        rows={3}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-muted-foreground mb-1">Interest Rate (%)</label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        value={formData.interestRate}
                                        onChange={(e) => setFormData({ ...formData, interestRate: parseFloat(e.target.value) })}
                                        className="w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-muted-foreground mb-1">Penalty Rate (%)</label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        value={formData.penaltyRate}
                                        onChange={(e) => setFormData({ ...formData, penaltyRate: parseFloat(e.target.value) })}
                                        className="w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-muted-foreground mb-1">Amortization Type</label>
                                    <select
                                        value={formData.amortizationType}
                                        onChange={(e) => setFormData({ ...formData, amortizationType: e.target.value })}
                                        className="w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                    >
                                        <option value="flat_rate">Flat Rate</option>
                                        <option value="reducing_balance">Reducing Balance</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-muted-foreground mb-1">Repayment Frequency</label>
                                    <select
                                        value={formData.repaymentFrequency}
                                        onChange={(e) => setFormData({ ...formData, repaymentFrequency: e.target.value })}
                                        className="w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                    >
                                        <option value="monthly">Monthly</option>
                                        <option value="quarterly">Quarterly</option>
                                        <option value="half-yearly">Half-Yearly</option>
                                        <option value="yearly">Yearly</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-muted-foreground mb-1">Grace Period (Months)</label>
                                    <input
                                        type="number"
                                        value={formData.gracePeriodMonths}
                                        onChange={(e) => setFormData({ ...formData, gracePeriodMonths: parseInt(e.target.value) })}
                                        className="w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-muted-foreground mb-1">Customer Loan Limit</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={formData.customerLoanLimit}
                                        onChange={(e) => setFormData({ ...formData, customerLoanLimit: parseFloat(e.target.value) })}
                                        className="w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="flex items-center space-x-2">
                                        <input
                                            type="checkbox"
                                            checked={formData.isActive}
                                            onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                            className="rounded border-gray-300"
                                        />
                                        <span className="text-sm font-medium text-foreground">Active</span>
                                    </label>
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 pt-4 border-t border-border">
                                <button
                                    type="button"
                                    onClick={handleCloseModal}
                                    className="px-4 py-2 border border-input rounded-lg hover:bg-accent transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={creating || updating}
                                    className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors"
                                >
                                    {creating || updating ? 'Saving...' : 'Save'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}

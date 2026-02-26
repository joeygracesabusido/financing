import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@apollo/client'
import { CREATE_CUSTOMER_LOAN } from '@/api/queries'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'

export default function CustomerLoanApplicationPage() {
    const [productId, setProductId] = useState('')
    const [principal, setPrincipal] = useState('')
    const [termMonths, setTermMonths] = useState('')
    const [disbursementMethod, setDisbursementMethod] = useState('savings_transfer')
    const navigate = useNavigate()

    const [createLoan, { loading, error, data }] = useMutation(CREATE_CUSTOMER_LOAN)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            await createLoan({
                variables: {
                    input: {
                        productId: parseInt(productId),
                        principal: parseFloat(principal),
                        termMonths: parseInt(termMonths),
                        disbursementMethod
                    }
                }
            })
            
            if (data?.createCustomerLoan?.success) {
                navigate('/customer/dashboard')
            }
        } catch (err) {
            console.error('Loan application error:', err)
        }
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
            <div>
                <h1 className="text-2xl font-bold text-foreground">New Loan Application</h1>
                <p className="text-muted-foreground text-sm mt-1">
                    Fill out the form below to apply for a new loan
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Loan Details</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <Label htmlFor="product">Loan Product</Label>
                            <Select
                                id="product"
                                value={productId}
                                onChange={(e) => setProductId(e.target.value)}
                                required
                            >
                                <option value="">Select a loan product</option>
                                <option value="1">Personal Loan - 6% interest</option>
                                <option value="2">Business Loan - 8% interest</option>
                                <option value="3">Education Loan - 5% interest</option>
                            </Select>
                        </div>

                        <div>
                            <Label htmlFor="principal">Loan Amount</Label>
                            <Input
                                id="principal"
                                type="number"
                                value={principal}
                                onChange={(e) => setPrincipal(e.target.value)}
                                placeholder="Enter loan amount"
                                required
                                min="1000"
                                step="1000"
                            />
                        </div>

                        <div>
                            <Label htmlFor="term">Term (months)</Label>
                            <Input
                                id="term"
                                type="number"
                                value={termMonths}
                                onChange={(e) => setTermMonths(e.target.value)}
                                placeholder="Enter term in months"
                                required
                                min="6"
                                max="60"
                                step="6"
                            />
                        </div>

                        <div>
                            <Label htmlFor="disbursement">Disbursement Method</Label>
                            <Select
                                id="disbursement"
                                value={disbursementMethod}
                                onChange={(e) => setDisbursementMethod(e.target.value)}
                            >
                                <option value="savings_transfer">Transfer to Savings Account</option>
                                <option value="cash">Cash</option>
                                <option value="bank_transfer">Bank Transfer</option>
                                <option value="cheque">Check</option>
                            </Select>
                        </div>

                        {error && (
                            <div className="p-3 bg-destructive/10 text-destructive rounded-lg text-sm">
                                {error.message}
                            </div>
                        )}

                        <div className="flex gap-3 pt-4">
                            <Button type="button" variant="outline" onClick={() => navigate(-1)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={loading}>
                                {loading ? 'Submitting...' : 'Submit Application'}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
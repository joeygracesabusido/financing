import { useState } from 'react'
import { useMutation } from '@apollo/client'
import { CREATE_FUND_TRANSFER } from '@/api/queries'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { useNavigate } from 'react-router-dom'

export default function CustomerTransferPage() {
    const [fromAccount, setFromAccount] = useState('')
    const [toAccount, setToAccount] = useState('')
    const [amount, setAmount] = useState('')
    const [reference, setReference] = useState('')
    const navigate = useNavigate()

    const [createFundTransfer, { loading, error, data }] = useMutation(CREATE_FUND_TRANSFER)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            await createFundTransfer({
                variables: {
                    input: {
                        fromAccount,
                        toAccount,
                        amount: parseFloat(amount),
                        reference
                    }
                }
            })
            
            if (data?.createFundTransfer?.success) {
                navigate('/customer/dashboard')
            }
        } catch (err) {
            console.error('Transfer error:', err)
        }
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
            <div>
                <h1 className="text-2xl font-bold text-foreground">Fund Transfer Request</h1>
                <p className="text-muted-foreground text-sm mt-1">
                    Transfer funds between your accounts or request transfers
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Transfer Details</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <Label htmlFor="fromAccount">From Account</Label>
                            <Select
                                id="fromAccount"
                                value={fromAccount}
                                onChange={(e) => setFromAccount(e.target.value)}
                                required
                            >
                                <option value="">Select source account</option>
                                <option value="savings-001">Regular Savings Account - PHP</option>
                                <option value="savings-002">High Yield Savings - PHP</option>
                            </Select>
                        </div>

                        <div>
                            <Label htmlFor="toAccount">To Account / recipient</Label>
                            <Input
                                id="toAccount"
                                type="text"
                                value={toAccount}
                                onChange={(e) => setToAccount(e.target.value)}
                                placeholder="Enter account number or recipient name"
                                required
                            />
                        </div>

                        <div>
                            <Label htmlFor="amount">Amount</Label>
                            <Input
                                id="amount"
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                placeholder="Enter transfer amount"
                                required
                                min="0.01"
                                step="0.01"
                            />
                        </div>

                        <div>
                            <Label htmlFor="reference">Reference / Purpose</Label>
                            <Input
                                id="reference"
                                type="text"
                                value={reference}
                                onChange={(e) => setReference(e.target.value)}
                                placeholder="e.g., Savings deposit, Loan payment"
                            />
                        </div>

                        <div className="flex gap-3 pt-4">
                            <Button type="button" variant="outline" onClick={() => navigate(-1)}>
                                Cancel
                            </Button>
                            <Button type="submit">
                                Request Transfer
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Transfer Limits</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex justify-between">
                        <span>Maximum per transfer:</span>
                        <span>₱100,000.00</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Daily limit:</span>
                        <span>₱500,000.00</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Monthly limit:</span>
                        <span>₱2,000,000.00</span>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
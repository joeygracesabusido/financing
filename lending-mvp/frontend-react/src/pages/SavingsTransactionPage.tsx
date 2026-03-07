import { useState, useEffect } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ArrowLeft, ArrowDownLeft, ArrowUpRight, Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { useAuth } from '@/context/AuthContext'

const getHeaders = () => {
    const token = localStorage.getItem('access_token')
    console.log('Token from localStorage:', token)
    return {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
    }
}

interface SavingsAccount {
    id: string
    accountNumber: string
    balance: number
    customerId: string
    accountType: string
    status: string
    customer?: {
        displayName: string
    }
}

export default function SavingsTransactionPage() {
    const { id } = useParams<{ id: string }>()
    const [searchParams] = useSearchParams()
    const navigate = useNavigate()
    const { isAuthenticated } = useAuth()
    const [loadingAuth, setLoadingAuth] = useState(true)
    
    const transactionType = (searchParams.get('type') as 'deposit' | 'withdrawal') || 'deposit'
    
    // Redirect if not authenticated
    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/login')
        } else {
            setLoadingAuth(false)
        }
    }, [isAuthenticated, navigate])
    
    const [account, setAccount] = useState<SavingsAccount | null>(null)
    const [loading, setLoading] = useState(true)
    const [amount, setAmount] = useState('')
    const [reference, setReference] = useState('')
    const [description, setDescription] = useState('')
    const [processing, setProcessing] = useState(false)
    const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null)

    useEffect(() => {
        console.log('SavingsTransactionPage loaded, id:', id, 'type:', transactionType)
        const fetchAccount = async () => {
            if (!isAuthenticated) {
                navigate('/login')
                return
            }
            try {
                // Use savingsAccounts query and find the one with matching id
                const res = await fetch('/graphql', {
                    method: 'POST',
                    headers: getHeaders(),
                    body: JSON.stringify({
                        query: `
                            query GetSavingsAccounts {
                                savingsAccounts {
                                    accounts {
                                        id
                                        accountNumber
                                        balance
                                        customerId
                                        accountType
                                        status
                                        customer {
                                            displayName
                                        }
                                    }
                                }
                            }
                        `
                    })
                })
                const data = await res.json()
                console.log('All accounts:', JSON.stringify(data))
                const accounts = data.data?.savingsAccounts?.accounts || []
                const found = accounts.find((acc: any) => acc.id === String(id) || acc.id === parseInt(id))
                if (found) {
                    setAccount(found)
                } else {
                    console.log('Account not found, looking for:', id)
                }
            } catch (e) {
                console.error('Failed to fetch account:', e)
            } finally {
                setLoading(false)
            }
        }
        if (id) fetchAccount()
    }, [id])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!amount || parseFloat(amount) <= 0) {
            setNotification({ type: 'error', message: 'Please enter a valid amount' })
            return
        }
        
        if (!isAuthenticated) {
            setNotification({ type: 'error', message: 'Please login first' })
            navigate('/login')
            return
        }
        
        setProcessing(true)
        setNotification(null)
        
        try {
            const res = await fetch('/graphql', {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify({
                    query: `
                        mutation CreateSavingsTransaction($input: SavingsTransactionCreateInput!) {
                            createSavingsTransaction(input: $input) {
                                success
                                message
                            }
                        }
                    `,
                    variables: {
                        input: {
                            accountId: String(id),
                            amount: parseFloat(amount),
                            transactionType: transactionType,
                            description: description || null,
                            reference: reference || null
                        }
                    }
                })
            })
            
            const data = await res.json()
            
            if (data.data?.createSavingsTransaction?.success) {
                setNotification({ type: 'success', message: data.data.createSavingsTransaction.message })
                setAmount('')
                setReference('')
                setDescription('')
                setTimeout(() => {
                    navigate('/savings')
                }, 2000)
            } else {
                setNotification({ type: 'error', message: data.data?.createSavingsTransaction?.message || 'Transaction failed' })
            }
        } catch (err) {
            setNotification({ type: 'error', message: 'Network error. Please try again.' })
        } finally {
            setProcessing(false)
        }
    }

    if (loading || loadingAuth) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        )
    }

    if (!account) {
        return (
            <div className="text-center py-16">
                <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <p className="text-muted-foreground">Account not found</p>
                <button onClick={() => navigate('/savings')} className="mt-4 text-primary hover:underline">
                    Back to Savings
                </button>
            </div>
        )
    }

    return (
        <div className="max-w-2xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                <button 
                    onClick={() => navigate('/savings')}
                    className="p-2 hover:bg-secondary rounded-lg transition-colors"
                >
                    <ArrowLeft className="w-5 h-5 text-muted-foreground" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-foreground">
                        {transactionType === 'deposit' ? 'Deposit' : 'Withdraw'} Funds
                    </h1>
                    <p className="text-muted-foreground text-sm">Savings Account Transaction</p>
                </div>
            </div>

            {/* Account Info Card */}
            <div className="glass rounded-xl p-6 mb-6">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm text-muted-foreground">Account Number</p>
                        <p className="font-mono font-semibold text-foreground">{account.accountNumber}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-sm text-muted-foreground">Current Balance</p>
                        <p className="text-2xl font-bold text-emerald-500">{formatCurrency(account.balance)}</p>
                    </div>
                </div>
                {account.customer && (
                    <div className="mt-4 pt-4 border-t border-border/50">
                        <p className="text-sm text-muted-foreground">Customer</p>
                        <p className="font-medium text-foreground">{account.customer.displayName}</p>
                    </div>
                )}
            </div>

            {/* Transaction Form */}
            <div className="glass rounded-xl p-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Amount Input */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">Amount</label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl text-muted-foreground">₱</span>
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                placeholder="0.00"
                                required
                                className="w-full pl-12 pr-4 py-4 text-2xl font-bold bg-secondary/30 border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
                            />
                        </div>
                    </div>

                    {/* Reference */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">Reference Number (Optional)</label>
                        <input
                            type="text"
                            value={reference}
                            onChange={(e) => setReference(e.target.value)}
                            placeholder="e.g. OR-12345"
                            className="w-full px-4 py-3 bg-secondary/30 border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
                        />
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">Notes (Optional)</label>
                        <input
                            type="text"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="e.g. Cash deposit"
                            className="w-full px-4 py-3 bg-secondary/30 border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
                        />
                    </div>

                    {/* Notification */}
                    {notification && (
                        <div className={`flex items-center gap-2 p-4 rounded-lg ${
                            notification.type === 'success' 
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                                : 'bg-red-500/20 text-red-400 border border-red-500/30'
                        }`}>
                            {notification.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                            <span>{notification.message}</span>
                        </div>
                    )}

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={processing}
                        className={`w-full flex items-center justify-center gap-2 py-4 rounded-xl font-bold text-lg transition-all ${
                            transactionType === 'deposit'
                                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                : 'bg-orange-600 hover:bg-orange-700 text-white'
                        } ${processing ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        {processing ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Processing...
                            </>
                        ) : transactionType === 'deposit' ? (
                            <>
                                <ArrowDownLeft className="w-5 h-5" />
                                Deposit ₱{amount || '0.00'}
                            </>
                        ) : (
                            <>
                                <ArrowUpRight className="w-5 h-5" />
                                Withdraw ₱{amount || '0.00'}
                            </>
                        )}
                    </button>

                    {/* Back Button */}
                    <button
                        type="button"
                        onClick={() => navigate('/savings')}
                        className="w-full py-3 text-muted-foreground hover:text-foreground transition-colors text-sm"
                    >
                        Cancel and go back
                    </button>
                </form>
            </div>
        </div>
    )
}

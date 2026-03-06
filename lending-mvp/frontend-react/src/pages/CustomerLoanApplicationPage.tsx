import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Search, Loader2, ArrowLeft, X } from 'lucide-react'

interface Customer {
    id: string
    displayName: string
}

interface LoanProduct {
    id: string
    name: string
    interestRate: number
}

const getHeaders = () => {
    const token = localStorage.getItem('access_token')
    return {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
    }
}

// Dedicated Customer Autocomplete Component
const CustomerAutocomplete = ({ 
    onSelect, 
    defaultValue = '' 
}: { 
    onSelect: (customer: Customer | null) => void,
    defaultValue?: string
}) => {
    const [searchTerm, setSearchTerm] = useState(defaultValue)
    const [customers, setCustomers] = useState<Customer[]>([])
    const [loading, setLoading] = useState(false)
    const [isOpen, setIsOpen] = useState(false)
    const [selectedId, setSelectedId] = useState<string | null>(null)
    const wrapperRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (!searchTerm || selectedId) {
            setCustomers([])
            return
        }

        const timer = setTimeout(async () => {
            setLoading(true)
            try {
                const res = await fetch('/graphql', {
                    method: 'POST',
                    headers: getHeaders(),
                    body: JSON.stringify({
                        query: `query GetCustomers($searchTerm: String) { 
                            customers(searchTerm: $searchTerm, limit: 10) { 
                                customers { id displayName } 
                            } 
                        }`,
                        variables: { searchTerm: searchTerm }
                    })
                })
                const data = await res.json()
                setCustomers(data.data?.customers?.customers || [])
                setIsOpen(true)
            } catch (e) {
                console.error('Failed to fetch customers:', e)
            } finally {
                setLoading(false)
            }
        }, 300)

        return () => clearTimeout(timer)
    }, [searchTerm, selectedId])

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const handleSelect = (customer: Customer) => {
        setSelectedId(customer.id)
        setSearchTerm(customer.displayName)
        setIsOpen(false)
        onSelect(customer)
    }

    const clearSelection = () => {
        setSelectedId(null)
        setSearchTerm('')
        setCustomers([])
        onSelect(null)
    }

    return (
        <div className="relative" ref={wrapperRef}>
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground z-10" />
                <Input
                    value={searchTerm}
                    onChange={(e) => {
                        setSearchTerm(e.target.value)
                        if (selectedId) setSelectedId(null)
                        setIsOpen(true)
                    }}
                    onFocus={() => {
                        if (searchTerm && !selectedId) setIsOpen(true)
                    }}
                    placeholder="Search customer by name..."
                    className="pl-10 pr-10 bg-background/50 border-border focus:border-primary/50"
                    autoComplete="off"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                    {loading && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
                    {(searchTerm || selectedId) && (
                        <button 
                            type="button" 
                            onClick={clearSelection}
                            className="p-1 hover:bg-white/10 rounded-full transition-colors"
                        >
                            <X className="w-3 h-3 text-muted-foreground" />
                        </button>
                    )}
                </div>
            </div>
            
            {isOpen && searchTerm && !selectedId && (
                <div className="absolute z-[100] w-full mt-1 bg-[#1a1c2e] border border-border rounded-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                    <div className="max-h-60 overflow-y-auto py-1">
                        {customers.length > 0 ? (
                            customers.map((customer) => (
                                <button
                                    key={customer.id}
                                    type="button"
                                    onClick={() => handleSelect(customer)}
                                    className="w-full px-4 py-2.5 text-left hover:bg-blue-600/20 text-sm text-foreground transition-colors flex items-center justify-between group"
                                >
                                    <span>{customer.displayName}</span>
                                    <span className="text-[10px] text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">Select</span>
                                </button>
                            ))
                        ) : !loading ? (
                            <div className="px-4 py-3 text-sm text-muted-foreground italic flex items-center gap-2">
                                <X className="w-3 h-3" />
                                No customers found
                            </div>
                        ) : (
                            <div className="px-4 py-3 text-sm text-muted-foreground italic flex items-center gap-2">
                                <Loader2 className="w-3 h-3 animate-spin" />
                                Searching...
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}

export default function CustomerLoanApplicationPage() {
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
    const [productId, setProductId] = useState('')
    const [principal, setPrincipal] = useState('')
    const [termMonths, setTermMonths] = useState('')
    const [disbursementMethod, setDisbursementMethod] = useState('savings_transfer')
    
    const [loanProducts, setLoanProducts] = useState<LoanProduct[]>([])
    const [loadingProducts, setLoadingProducts] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    
    const navigate = useNavigate()

    // Fetch Loan Products
    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const res = await fetch('/graphql', {
                    method: 'POST',
                    headers: getHeaders(),
                    body: JSON.stringify({
                        query: `query GetLoanProducts { loanProducts { id name interestRate } }`
                    })
                })
                const data = await res.json()
                setLoanProducts(data.data?.loanProducts || [])
            } catch (e) {
                console.error('Failed to fetch loan products:', e)
            } finally {
                setLoadingProducts(false)
            }
        }
        fetchProducts()
    }, [])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        
        if (!selectedCustomer) {
            alert('Please select a customer')
            return
        }
        
        if (!productId || !principal || !termMonths) {
            alert('Please fill in all required fields')
            return
        }
        
        setSubmitting(true)
        try {
            const res = await fetch('/graphql', {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify({
                    query: `mutation CreateLoan($input: LoanInput!) {
                        createLoan(input: $input) {
                            success
                            message
                        }
                    }`,
                    variables: {
                        input: {
                            customerId: selectedCustomer.id,
                            productId: parseInt(productId),
                            principal: parseFloat(principal),
                            termMonths: parseInt(termMonths),
                            disbursementMethod
                        }
                    }
                })
            })
            const data = await res.json()
            
            if (data.errors) {
                alert('Error: ' + data.errors[0].message)
            } else if (data.data?.createLoan?.success) {
                alert('Loan application submitted successfully!')
                navigate('/loans')
            } else {
                alert('Failed: ' + (data.data?.createLoan?.message || 'Unknown error'))
            }
        } catch (err: any) {
            console.error('Loan application error:', err)
            alert('Error connecting to server')
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
            <div className="flex items-center gap-4">
                <button 
                    onClick={() => navigate('/loans')}
                    className="p-2 rounded-lg hover:bg-white/5 text-muted-foreground transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-foreground">New Loan Application</h1>
                    <p className="text-muted-foreground text-sm mt-1">
                        Fill out the form below to apply for a new loan
                    </p>
                </div>
            </div>

            <Card className="glass border-border/50">
                <CardHeader>
                    <CardTitle className="text-foreground">Loan Details</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="customer" className="text-foreground">Customer</Label>
                            <CustomerAutocomplete onSelect={setSelectedCustomer} />
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="product" className="text-foreground">Loan Product</Label>
                            <Select
                                value={productId}
                                onValueChange={setProductId}
                                required
                            >
                                <SelectTrigger id="product" className="w-full bg-background/50 border-border">
                                    <SelectValue placeholder={loadingProducts ? "Loading..." : "Select loan product"} />
                                </SelectTrigger>
                                <SelectContent className="glass border-border shadow-xl">
                                    {loanProducts.map((product) => (
                                        <SelectItem key={product.id} value={product.id} className="focus:bg-white/10">
                                            {product.name} - {product.interestRate}%
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="principal" className="text-foreground">Loan Amount (₱)</Label>
                            <Input
                                id="principal"
                                type="number"
                                value={principal}
                                onChange={(e) => setPrincipal(e.target.value)}
                                placeholder="Enter loan amount"
                                className="bg-background/50 border-border"
                                required
                                min="1000"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="term" className="text-foreground">Term (months)</Label>
                            <Input
                                id="term"
                                type="number"
                                value={termMonths}
                                onChange={(e) => setTermMonths(e.target.value)}
                                placeholder="Enter term in months"
                                className="bg-background/50 border-border"
                                required
                                min="1"
                                max="120"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="disbursement" className="text-foreground">Disbursement Method</Label>
                            <Select
                                value={disbursementMethod}
                                onValueChange={setDisbursementMethod}
                            >
                                <SelectTrigger id="disbursement" className="w-full bg-background/50 border-border">
                                    <SelectValue placeholder="Select disbursement method" />
                                </SelectTrigger>
                                <SelectContent className="glass border-border shadow-xl">
                                    <SelectItem value="savings_transfer" className="focus:bg-white/10">Transfer to Savings Account</SelectItem>
                                    <SelectItem value="cash" className="focus:bg-white/10">Cash</SelectItem>
                                    <SelectItem value="bank_transfer" className="focus:bg-white/10">Bank Transfer</SelectItem>
                                    <SelectItem value="cheque" className="focus:bg-white/10">Check</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex gap-3 pt-6">
                            <Button 
                                type="button" 
                                variant="outline" 
                                onClick={() => navigate('/loans')}
                                className="flex-1 border-border hover:bg-white/5"
                            >
                                Cancel
                            </Button>
                            <Button 
                                type="submit" 
                                disabled={submitting || loadingProducts}
                                className="flex-1 gradient-primary text-white"
                            >
                                {submitting ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Submitting...
                                    </>
                                ) : 'Submit Application'}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}

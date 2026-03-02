import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from '@apollo/client'
import { CREATE_LOAN, GET_CUSTOMERS, GET_LOAN_PRODUCTS, GET_LOANS } from '@/api/queries'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Search, Loader2 } from 'lucide-react'

interface Customer {
    id: string
    displayName: string
    firstName?: string
    lastName?: string
}

interface LoanProduct {
    id: string
    name: string
    interestRate: number
}

export default function CustomerLoanApplicationPage() {
    const [customerSearch, setCustomerSearch] = useState('')
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
    const [productId, setProductId] = useState('')
    const [principal, setPrincipal] = useState('')
    const [termMonths, setTermMonths] = useState('')
    const [disbursementMethod, setDisbursementMethod] = useState('savings_transfer')
    const [showCustomerDropdown, setShowCustomerDropdown] = useState(false)
    const customerDropdownRef = useRef<HTMLDivElement>(null)
    const navigate = useNavigate()

    const { data: customersData, loading: customersLoading } = useQuery(GET_CUSTOMERS, {
        variables: { searchTerm: customerSearch, limit: 10 }
    })

    const { data: productsData, loading: productsLoading } = useQuery(GET_LOAN_PRODUCTS)

    const [createLoan, { loading: submitting, error }] = useMutation(CREATE_LOAN, {
        refetchQueries: [{ query: GET_LOANS }]
    })

    const customers: Customer[] = customersData?.customers?.customers ?? []
    const loanProducts: LoanProduct[] = productsData?.loanProducts ?? []

    const filteredCustomers = customers.filter((c: Customer) => 
        c.displayName?.toLowerCase().includes(customerSearch.toLowerCase()) ||
        c.firstName?.toLowerCase().includes(customerSearch.toLowerCase()) ||
        c.lastName?.toLowerCase().includes(customerSearch.toLowerCase())
    )

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (customerDropdownRef.current && !customerDropdownRef.current.contains(event.target as Node)) {
                setShowCustomerDropdown(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
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
        
        const principalNum = parseFloat(principal)
        const termMonthsNum = parseInt(termMonths)
        const productIdNum = parseInt(productId)
        
        if (isNaN(principalNum) || isNaN(termMonthsNum) || isNaN(productIdNum)) {
            alert('Invalid input values')
            return
        }
        
        try {
            console.log('Creating loan with:', {
                customerId: selectedCustomer.id,
                productId: productIdNum,
                principal: principalNum,
                termMonths: termMonthsNum,
                disbursementMethod
            })
            const result = await createLoan({
                variables: {
                    input: {
                        customerId: selectedCustomer.id,
                        productId: productIdNum,
                        principal: principalNum,
                        termMonths: termMonthsNum,
                        disbursementMethod
                    }
                }
            })
            console.log('Loan result:', result)
            
            // Check for GraphQL errors first
            if (result.errors && result.errors.length > 0) {
                alert('Error: ' + result.errors[0].message)
                return
            }
            
            // Check the response
            if (result.data?.createLoan) {
                console.log('Loan success:', result.data.createLoan.success)
                console.log('Loan message:', result.data.createLoan.message)
                
                if (result.data.createLoan.success) {
                    alert('Loan application submitted successfully!')
                    navigate('/loans')
                } else {
                    alert('Failed: ' + (result.data.createLoan.message || 'Unknown error'))
                }
            } else {
                alert('No response from server')
            }
        } catch (err: any) {
            console.error('Loan application error:', err)
            alert(err.message || JSON.stringify(err))
        }
    }

    const handleCustomerSelect = (customer: Customer) => {
        setSelectedCustomer(customer)
        setCustomerSearch(customer.displayName)
        setShowCustomerDropdown(false)
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
            <div>
                <h1 className="text-2xl font-bold text-foreground">New Loan Application</h1>
                <p className="text-muted-foreground text-sm mt-1">
                    Fill out the form below to apply for a new loan
                </p>
            </div>

            <Card className="bg-white dark:bg-gray-900">
                <CardHeader>
                    <CardTitle>Loan Details</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="relative" ref={customerDropdownRef}>
                            <Label htmlFor="customer">Customer</Label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground z-10" />
                                <Input
                                    id="customer"
                                    value={customerSearch}
                                    onChange={(e) => {
                                        setCustomerSearch(e.target.value)
                                        setSelectedCustomer(null)
                                        setShowCustomerDropdown(true)
                                    }}
                                    onFocus={() => setShowCustomerDropdown(true)}
                                    placeholder="Search customer by name or number..."
                                    className="pl-10 pr-10"
                                    required
                                />
                                {customersLoading && (
                                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
                                )}
                            </div>
                            {showCustomerDropdown && customerSearch && filteredCustomers.length > 0 && (
                                <div className="absolute z-[100] w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-y-auto">
                                    {filteredCustomers.map((customer: Customer) => (
                                        <button
                                            key={customer.id}
                                            type="button"
                                            onClick={() => handleCustomerSelect(customer)}
                                            className="w-full px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 text-sm text-foreground cursor-pointer"
                                        >
                                            {customer.displayName}
                                        </button>
                                    ))}
                                </div>
                            )}
                            {showCustomerDropdown && customerSearch && filteredCustomers.length === 0 && !customersLoading && (
                                <div className="absolute z-[100] w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg p-3 text-sm text-muted-foreground">
                                    No customers found
                                </div>
                            )}
                        </div>

                        <div>
                            <Label htmlFor="product">Loan Product</Label>
                            <Select
                                value={productId}
                                onValueChange={setProductId}
                                required
                            >
                                <SelectTrigger id="product" className="w-full">
                                    <SelectValue placeholder={productsLoading ? "Loading..." : "Select loan product"} />
                                </SelectTrigger>
                                <SelectContent className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 shadow-lg">
                                    {loanProducts.map((product: LoanProduct) => (
                                        <SelectItem key={product.id} value={product.id} className="py-2 px-3 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer">
                                            {product.name} - {product.interestRate}%
                                        </SelectItem>
                                    ))}
                                    {loanProducts.length === 0 && !productsLoading && (
                                        <SelectItem value="no-products" disabled>No products available</SelectItem>
                                    )}
                                </SelectContent>
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
                                value={disbursementMethod}
                                onValueChange={setDisbursementMethod}
                            >
                                <SelectTrigger id="disbursement" className="w-full">
                                    <SelectValue placeholder="Select disbursement method" />
                                </SelectTrigger>
                                <SelectContent className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 shadow-lg">
                                    <SelectItem value="savings_transfer" className="py-2 px-3 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer">Transfer to Savings Account</SelectItem>
                                    <SelectItem value="cash" className="py-2 px-3 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer">Cash</SelectItem>
                                    <SelectItem value="bank_transfer" className="py-2 px-3 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer">Bank Transfer</SelectItem>
                                    <SelectItem value="cheque" className="py-2 px-3 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer">Check</SelectItem>
                                </SelectContent>
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
                            <Button type="submit" disabled={submitting || customersLoading || productsLoading}>
                                {submitting ? 'Submitting...' : 'Submit Application'}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}

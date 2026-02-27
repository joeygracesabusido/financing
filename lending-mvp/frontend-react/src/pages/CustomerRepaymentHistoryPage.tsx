import { useQuery } from '@apollo/client'
import { GET_CUSTOMER_LOANS } from '@/api/queries'
import { formatCurrency } from '@/lib/utils'
import {
    XCircle,
    Download,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

const statusColors: Record<string, string> = {
    active: 'bg-blue-500/10 text-blue-500',
    paid: 'bg-green-500/10 text-green-500',
    overdue: 'bg-red-500/10 text-red-500',
    defaulted: 'bg-red-500/10 text-red-500',
    approved: 'bg-green-500/10 text-green-500',
    rejected: 'bg-red-500/10 text-red-500',
    draft: 'bg-gray-500/10 text-gray-500',
}

export default function CustomerRepaymentHistoryPage() {
    const { data, loading, error } = useQuery(GET_CUSTOMER_LOANS)

    if (loading) return <div className="text-center py-8 text-muted-foreground">Loading...</div>
    if (error) return <div className="p-4 bg-red-500/10 text-red-500 rounded-lg">Error: {error.message}</div>

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Repayment History</h1>
                    <p className="text-muted-foreground text-sm mt-1">
                        View your loan repayments and payment history
                    </p>
                </div>
                <Button variant="outline" onClick={() => window.print()}>
                    <Download className="w-4 h-4 mr-2" />
                    Print Report
                </Button>
            </div>

            <div className="grid gap-4">
                {data?.loans?.loans?.map((loan: any) => (
                    <Card key={loan.id}>
                        <CardHeader className="pb-2">
                            <div className="flex items-start justify-between">
                                <div>
                                    <CardTitle className="text-lg">{loan.product_name}</CardTitle>
                                    <p className="text-sm text-muted-foreground">
                                        Principal: {formatCurrency(loan.principal)} |
                                        Term: {loan.term_months} months
                                    </p>
                                </div>
                                <Badge className={statusColors[loan.status] || 'bg-gray-500/10 text-gray-500'}>
                                    {loan.status}
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Next Payment</span>
                                    <span>
                                        {loan.next_due_date
                                            ? new Date(loan.next_due_date).toLocaleDateString()
                                            : 'N/A'}
                                    </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Total Paid</span>
                                    <span className="font-medium">₱0.00</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Remaining Balance</span>
                                    <span className="font-medium text-red-500">
                                        {formatCurrency(loan.principal)}
                                    </span>
                                </div>
                            </div>
                            <div className="mt-4 pt-3 border-t">
                                <Button variant="ghost" className="w-full text-sm" asChild>
                                    <a href="#">View Payment Schedule</a>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
                {data?.loans?.loans?.length === 0 && (
                    <div className="text-center py-12 bg-muted/20 rounded-lg">
                        <XCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-foreground">No Loans Found</h3>
                        <p className="text-muted-foreground mt-2">
                            You don't have any loans yet. Apply for a new loan to get started.
                        </p>
                    </div>
                )}
            </div>
        </div>
    )
}
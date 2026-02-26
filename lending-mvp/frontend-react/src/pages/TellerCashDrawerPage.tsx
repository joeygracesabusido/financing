import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardBody, CardFooter, Button, Input, Typography, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Badge, Alert } from '@material-tailwind/react';

interface CashDrawerSession {
  session_id: string;
  teller_id: string;
  branch_id: string;
  opening_time: string;
  initial_amount: number;
  current_amount: number;
  status: string;
  notes?: string;
  transactions?: Transaction[];
}

interface Transaction {
  transaction_id: string;
  transaction_type: string;
  amount: number;
  customer_name?: string;
  timestamp: string;
}

export default function TellerCashDrawerPage() {
  const [session, setSession] = useState<CashDrawerSession | null>(null);
  const [amount, setAmount] = useState('');
  const [transactionType, setTransactionType] = useState<'deposit' | 'withdrawal' | 'transfer'>('deposit');
  const [customerName, setCustomerName] = useState('');
  const [referenceId, setReferenceId] = useState('');
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    fetchSession();
  }, []);

  const fetchSession = async () => {
    try {
      const response = await fetch('/api/v1/teller/cash-drawer/active');
      if (response.ok) {
        const data = await response.json();
        setSession(data);
      }
    } catch (error) {
      console.error('Failed to fetch session:', error);
    }
  };

  const handleProcessTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/v1/teller/cash-drawer/transaction', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session_id: session?.session_id,
          transaction_type: transactionType,
          amount: parseFloat(amount),
          customer_name: customerName,
          reference_id: referenceId,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setNotification({ message: 'Transaction processed successfully!', type: 'success' });
        setAmount('');
        setCustomerName('');
        setReferenceId('');
        fetchSession();
      } else {
        const errorData = await response.json();
        setNotification({ message: errorData.detail || 'Failed to process transaction', type: 'error' });
      }
    } catch (error) {
      setNotification({ message: 'An error occurred', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleCloseDrawer = async () => {
    if (!session) return;

    const expectedAmount = session.current_amount;
    const actualAmount = parseFloat(amount) || 0;

    try {
      const response = await fetch('/api/v1/teller/cash-drawer/close', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session_id: session.session_id,
          expected_amount: expectedAmount,
          actual_amount: actualAmount,
          variance_reason: 'Daily reconciliation',
        }),
      });

      if (response.ok) {
        setNotification({ message: 'Cash drawer closed successfully!', type: 'success' });
        setTimeout(() => navigate('/dashboard'), 2000);
      } else {
        const errorData = await response.json();
        setNotification({ message: errorData.detail || 'Failed to close drawer', type: 'error' });
      }
    } catch (error) {
      setNotification({ message: 'An error occurred', type: 'error' });
    }
  };

  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Typography variant="h4">No active cash drawer session</Typography>
          <Button variant="filled" className="mt-4" onClick={() => navigate('/dashboard')}>
            Return to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="max-w-4xl mx-auto">
        <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-800">
          <div className="flex justify-between items-center">
            <div>
              <Typography variant="h4" className="text-white">
                Teller Cash Drawer
              </Typography>
              <Typography variant="h6" className="text-blue-100">
                Session ID: {session.session_id} • Branch: {session.branch_id}
              </Typography>
            </div>
            <div className="text-right">
              <Typography variant="h2" className="text-white font-bold">
                ₱{session.current_amount.toLocaleString()}
              </Typography>
              <Typography variant="body2" className="text-blue-100">
                Current Balance
              </Typography>
            </div>
          </div>
        </CardHeader>

        <CardBody>
          {/* Session Status */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <Card>
              <Typography variant="h6" className="text-gray-600">Opening Balance</Typography>
              <Typography variant="h4" className="font-bold text-green-600">
                ₱{session.initial_amount.toLocaleString()}
              </Typography>
            </Card>
            <Card>
              <Typography variant="h6" className="text-gray-600">Transactions</Typography>
              <Typography variant="h4" className="font-bold text-blue-600">
                {session.transactions?.length || 0}
              </Typography>
            </Card>
            <Card>
              <Typography variant="h6" className="text-gray-600">Status</Typography>
              <Badge color={session.status === 'open' ? 'green' : 'red'} variant="filled">
                {session.status.toUpperCase()}
              </Badge>
            </Card>
          </div>

          {/* Transaction Form */}
          <Card className="mb-6">
            <CardHeader>
              <Typography variant="h5">Process Transaction</Typography>
            </CardHeader>
            <CardBody>
              <form onSubmit={handleProcessTransaction} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Typography variant="small" className="font-medium">Transaction Type</Typography>
                    <select
                      value={transactionType}
                      onChange={(e) => setTransactionType(e.target.value as any)}
                      className="w-full mt-1 p-2 border rounded"
                    >
                      <option value="deposit">Cash In / Deposit</option>
                      <option value="withdrawal">Cash Out / Withdrawal</option>
                      <option value="transfer">Transfer</option>
                    </select>
                  </div>
                  <div>
                    <Input
                      label="Amount"
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      required
                      variant="outlined"
                    />
                  </div>
                </div>
                <div>
                  <Input
                    label="Customer Name"
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    variant="outlined"
                  />
                </div>
                <div>
                  <Input
                    label="Reference ID"
                    type="text"
                    value={referenceId}
                    onChange={(e) => setReferenceId(e.target.value)}
                    variant="outlined"
                  />
                </div>
                <Button type="submit" variant="filled" disabled={loading} className="w-full">
                  {loading ? 'Processing...' : 'Process Transaction'}
                </Button>
              </form>
            </CardBody>
          </Card>

          {/* Transaction History */}
          {session.transactions && session.transactions.length > 0 && (
            <Card>
              <CardHeader>
                <Typography variant="h5">Transaction History</Typography>
              </CardHeader>
              <CardBody className="overflow-x-auto">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableHead>Time</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Reference</TableHead>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {session.transactions.map((tx) => (
                      <TableRow key={tx.transaction_id}>
                        <TableCell>{new Date(tx.timestamp).toLocaleTimeString()}</TableCell>
                        <TableCell>
                          <Badge
                            color={tx.transaction_type === 'deposit' ? 'green' : 'red'}
                            variant="filled"
                          >
                            {tx.transaction_type.toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell>₱{tx.amount.toLocaleString()}</TableCell>
                        <TableCell>{tx.customer_name || '-'}</TableCell>
                        <TableCell>{tx.reference_id || '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardBody>
            </Card>
          )}

          {/* Close Drawer Button */}
          <Card className="mt-6">
            <CardFooter className="flex justify-between items-center">
              <Typography variant="h6">Closing Balance: ₱{session.current_amount.toLocaleString()}</Typography>
              <div>
                <Input
                  label="Actual Cash Count"
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-48"
                />
                <Button
                  variant="filled"
                  color="red"
                  onClick={handleCloseDrawer}
                  className="ml-4"
                >
                  Close & Reconcile Drawer
                </Button>
              </div>
            </CardFooter>
          </Card>

          {notification && (
            <Alert
              color={notification.type === 'success' ? 'green' : 'red'}
              className="mt-4"
            >
              {notification.message}
            </Alert>
          )}
        </CardBody>

        <CardFooter>
          <div className="flex justify-between w-full">
            <Button variant="text" onClick={() => navigate('/dashboard')}>
              Back to Dashboard
            </Button>
            <Button variant="text" onClick={fetchSession}>
              Refresh Session
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
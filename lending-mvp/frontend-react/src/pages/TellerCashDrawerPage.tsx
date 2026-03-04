import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatCurrency, formatDateTime, cn } from '@/lib/utils';
import {
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  RefreshCcw,
  History,
  Lock,
  LayoutDashboard,
  AlertCircle,
  ArrowLeftRight,
  TrendingUp,
  CreditCard
} from 'lucide-react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

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
      <div className="flex items-center justify-center min-h-[60vh] animate-fade-in">
        <div className="glass p-8 rounded-2xl text-center max-w-md">
          <div className="w-16 h-16 bg-muted/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Lock className="w-8 h-8 text-muted-foreground" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">No Active Session</h2>
          <p className="text-muted-foreground mb-8">
            Please open a new cash drawer session from the main dashboard to start processing transactions.
          </p>
          <Button onClick={() => navigate('/dashboard')} className="w-full h-12 rounded-xl">
            Return to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Teller Cash Drawer</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Session ID: {session.session_id} • Branch: {session.branch_id}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchSession}
            className="rounded-lg bg-secondary/50"
          >
            <RefreshCcw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/dashboard')}
            className="rounded-lg bg-secondary/50"
          >
            <LayoutDashboard className="w-4 h-4 mr-2" />
            Dashboard
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="stat-card">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Current Balance</p>
              <p className="text-2xl font-bold text-foreground mt-1">{formatCurrency(session.current_amount)}</p>
            </div>
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-lg">
              <Wallet className="w-5 h-5 text-white" />
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Opening Balance</p>
              <p className="text-2xl font-bold text-foreground mt-1">{formatCurrency(session.initial_amount)}</p>
            </div>
            <div className="w-10 h-10 rounded-xl gradient-success flex items-center justify-center shadow-lg">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Transactions</p>
              <p className="text-2xl font-bold text-foreground mt-1">{session.transactions?.length || 0}</p>
            </div>
            <div className="w-10 h-10 rounded-xl gradient-warning flex items-center justify-center shadow-lg">
              <Activity className="w-5 h-5 text-white" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Transaction Form */}
        <div className="lg:col-span-1 border border-border/50 glass rounded-2xl p-6 h-fit">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <CreditCard className="w-4 h-4 text-primary" />
            </div>
            <h2 className="font-semibold text-foreground">Process Transaction</h2>
          </div>

          <form onSubmit={handleProcessTransaction} className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground uppercase">Transaction Type</label>
              <select
                value={transactionType}
                onChange={(e) => setTransactionType(e.target.value as any)}
                className="w-full px-3 py-2.5 bg-secondary/50 border border-border/50 rounded-xl text-sm focus:ring-1 focus:ring-primary outline-none"
              >
                <option value="deposit">Cash In / Deposit</option>
                <option value="withdrawal">Cash Out / Withdrawal</option>
                <option value="transfer">Transfer</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground uppercase">Amount</label>
              <div className="relative">
                <Input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  required
                  className="pl-9 bg-secondary/30 border-border/50 rounded-xl h-11"
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-medium">₱</span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground uppercase">Customer Name</label>
              <Input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Optional"
                className="bg-secondary/30 border-border/50 rounded-xl h-11"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground uppercase">Reference ID</label>
              <Input
                type="text"
                value={referenceId}
                onChange={(e) => setReferenceId(e.target.value)}
                placeholder="Optional"
                className="bg-secondary/30 border-border/50 rounded-xl h-11"
              />
            </div>

            <Button type="submit" disabled={loading} className="w-full h-11 rounded-xl mt-2 font-semibold">
              {loading ? <RefreshCcw className="w-4 h-4 animate-spin mr-2" /> : null}
              {loading ? 'Processing...' : 'Process Transaction'}
            </Button>
          </form>

          {notification && (
            <Alert
              variant={notification.type === 'success' ? 'default' : 'destructive'}
              className={cn(
                "mt-6 border backdrop-blur-xl",
                notification.type === 'success' ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-red-500/10 border-red-500/20 text-red-400"
              )}
            >
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                <AlertDescription>{notification.message}</AlertDescription>
              </div>
            </Alert>
          )}
        </div>

        {/* Transaction History & Close Drawer */}
        <div className="lg:col-span-2 space-y-6">
          <div className="border border-border/50 glass rounded-2xl overflow-hidden">
            <div className="p-6 border-b border-border/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <History className="w-4 h-4 text-blue-400" />
                </div>
                <h2 className="font-semibold text-foreground">Recent Transactions</h2>
              </div>
              <Badge variant="outline" className="border-border/50 text-muted-foreground font-normal">
                {session.transactions?.length || 0} Total
              </Badge>
            </div>

            <div className="overflow-x-auto">
              {session.transactions && session.transactions.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow className="border-border/50 hover:bg-transparent">
                      <TableHead className="text-muted-foreground text-[11px] uppercase tracking-wider h-11">Time</TableHead>
                      <TableHead className="text-muted-foreground text-[11px] uppercase tracking-wider h-11">Type</TableHead>
                      <TableHead className="text-muted-foreground text-[11px] uppercase tracking-wider h-11">Customer</TableHead>
                      <TableHead className="text-muted-foreground text-[11px] uppercase tracking-wider h-11 text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {session.transactions.map((tx) => (
                      <TableRow key={tx.transaction_id} className="data-table-row">
                        <TableCell className="text-sm text-foreground py-4">{new Date(tx.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</TableCell>
                        <TableCell className="py-4">
                          <div className="flex items-center gap-2">
                            {tx.transaction_type === 'deposit' ? (
                              <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-400" />
                            ) : tx.transaction_type === 'withdrawal' ? (
                              <ArrowUpRight className="w-3.5 h-3.5 text-red-400" />
                            ) : (
                              <ArrowLeftRight className="w-3.5 h-3.5 text-blue-400" />
                            )}
                            <span className={cn(
                              "text-sm font-medium",
                              tx.transaction_type === 'deposit' ? "text-emerald-400" :
                                tx.transaction_type === 'withdrawal' ? "text-red-400" : "text-blue-400"
                            )}>
                              {tx.transaction_type.charAt(0).toUpperCase() + tx.transaction_type.slice(1)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground py-4">{tx.customer_name || '—'}</TableCell>
                        <TableCell className="text-sm font-bold text-foreground text-right py-4">
                          {formatCurrency(tx.amount)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="py-20 text-center">
                  <p className="text-muted-foreground text-sm">No transactions recorded yet</p>
                </div>
              )}
            </div>
          </div>

          {/* Close Drawer Section */}
          <div className="border border-border/50 glass rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-6 text-red-400">
              <Lock className="w-5 h-5" />
              <h2 className="font-semibold ">Close & Reconcile</h2>
            </div>
            <div className="flex flex-col md:flex-row items-end gap-6">
              <div className="w-full md:flex-1">
                <p className="text-sm font-medium text-foreground mb-4">
                  Expected closing balance is <span className="text-primary font-bold">{formatCurrency(session.current_amount)}</span>.
                  Please enter the actual physical cash count to reconcile and close the drawer.
                </p>
                <div className="space-y-2 max-w-sm">
                  <label className="text-xs font-medium text-muted-foreground uppercase">Actual Cash Count</label>
                  <div className="relative">
                    <Input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="Enter counted amount"
                      className="pl-9 bg-secondary/30 border-border/50 rounded-xl h-11"
                    />
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-medium">₱</span>
                  </div>
                </div>
              </div>
              <Button
                variant="destructive"
                onClick={handleCloseDrawer}
                className="w-full md:w-auto h-11 px-8 rounded-xl font-semibold shadow-lg shadow-red-900/10"
              >
                End Session
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const Activity = ({ className }: { className?: string }) => (
  <svg
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
  </svg>
);
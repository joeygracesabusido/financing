import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn, formatCurrency } from '@/lib/utils';
import {
  Smartphone,
  CreditCard,
  Building2,
  ArrowRightLeft,
  Zap,
  Clock,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  LayoutDashboard,
  Wallet,
  RefreshCcw
} from 'lucide-react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function TellerPaymentGatewayPage() {
  const [selectedGateway, setSelectedGateway] = useState<string | null>(null);
  const [amount, setAmount] = useState('');
  const [reference, setReference] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [email, setEmail] = useState('');
  const [destinationAccount, setDestinationAccount] = useState('');
  const [destinationBankCode, setDestinationBankCode] = useState('');
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [loading, setLoading] = useState(false);
  const [paymentResult, setPaymentResult] = useState<any>(null);

  const navigate = useNavigate();

  const handleProcessPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let response;
      let endpoint;

      if (selectedGateway === 'gcash') {
        endpoint = '/api/v1/payment-gateway/gcash';
        response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: parseFloat(amount),
            mobile_number: mobileNumber,
            reference_id: reference,
            payment_type: 'loan_repayment',
          }),
        });
      } else if (selectedGateway === 'maya') {
        endpoint = '/api/v1/payment-gateway/maya';
        response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: parseFloat(amount),
            email: email,
            reference_id: reference,
            payment_type: 'loan_repayment',
          }),
        });
      } else if (selectedGateway === 'instapay') {
        endpoint = '/api/v1/payment-gateway/instapay';
        response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: parseFloat(amount),
            source_account: '0028437123456789',
            destination_account: destinationAccount,
            destination_bank_code: destinationBankCode,
            reference_id: reference,
            payment_type: 'transfer',
          }),
        });
      } else if (selectedGateway === 'pesonet') {
        endpoint = '/api/v1/payment-gateway/pesonet';
        response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: parseFloat(amount),
            source_account: '0028437123456789',
            destination_account: destinationAccount,
            destination_bank_code: destinationBankCode,
            reference_id: reference,
            payment_type: 'single',
          }),
        });
      }

      if (!response) {
        setNotification({ message: 'Please select a valid payment method', type: 'error' });
        return;
      }

      if (response.ok) {
        const data = await response.json();
        setPaymentResult(data);
        setNotification({ message: 'Payment processed successfully!', type: 'success' });
      } else {
        const errorData = await response.json();
        setNotification({ message: errorData.detail || 'Payment failed', type: 'error' });
      }
    } catch (error) {
      setNotification({ message: 'An error occurred', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const paymentMethods = [
    { id: 'gcash', name: 'GCash', icon: Smartphone, color: 'text-blue-400', bg: 'bg-blue-400/10' },
    { id: 'maya', name: 'Maya', icon: Wallet, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
    { id: 'instapay', name: 'InstaPay', icon: Zap, color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
    { id: 'pesonet', name: 'PESONet', icon: Building2, color: 'text-purple-400', bg: 'bg-purple-400/10' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Payment Gateway</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Process external payments and bank transfers
          </p>
        </div>
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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column - Selection & Form */}
        <div className="lg:col-span-8 space-y-6">
          <div className="glass rounded-2xl p-6 border border-border/50">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Select Payment Method</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {paymentMethods.map((method) => {
                const Icon = method.icon;
                const isActive = selectedGateway === method.id;
                return (
                  <button
                    key={method.id}
                    onClick={() => setSelectedGateway(method.id)}
                    className={cn(
                      "flex flex-col items-center justify-center p-4 rounded-xl border transition-all duration-200 gap-2",
                      isActive
                        ? "bg-primary/15 border-primary shadow-lg shadow-primary/10 scale-[1.02]"
                        : "bg-secondary/30 border-border/50 hover:border-primary/50"
                    )}
                  >
                    <div className={cn("p-2 rounded-lg", method.bg)}>
                      <Icon className={cn("w-6 h-6", method.color)} />
                    </div>
                    <span className={cn("text-sm font-bold", isActive ? "text-primary" : "text-foreground")}>
                      {method.name}
                    </span>
                    {isActive && (
                      <div className="w-1 h-1 bg-primary rounded-full mt-1" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {selectedGateway ? (
            <div className="glass rounded-2xl p-6 border border-border/50">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <CreditCard className="w-4 h-4 text-primary" />
                </div>
                <h2 className="font-semibold text-foreground">
                  {paymentMethods.find(m => m.id === selectedGateway)?.name} Payment Details
                </h2>
              </div>

              <form onSubmit={handleProcessPayment} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground uppercase">Amount (PHP)</label>
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
                  <label className="text-xs font-medium text-muted-foreground uppercase">Reference ID</label>
                  <Input
                    type="text"
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                    placeholder="Enter reference"
                    required
                    className="bg-secondary/30 border-border/50 rounded-xl h-11"
                  />
                </div>

                {selectedGateway === 'gcash' && (
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-xs font-medium text-muted-foreground uppercase">Mobile Number</label>
                    <Input
                      type="text"
                      value={mobileNumber}
                      onChange={(e) => setMobileNumber(e.target.value)}
                      placeholder="0917 123 4567"
                      required
                      className="bg-secondary/30 border-border/50 rounded-xl h-11"
                    />
                  </div>
                )}

                {selectedGateway === 'maya' && (
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-xs font-medium text-muted-foreground uppercase">Email Address</label>
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="customer@example.com"
                      required
                      className="bg-secondary/30 border-border/50 rounded-xl h-11"
                    />
                  </div>
                )}

                {(selectedGateway === 'instapay' || selectedGateway === 'pesonet') && (
                  <>
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-muted-foreground uppercase">Destination Account</label>
                      <Input
                        type="text"
                        value={destinationAccount}
                        onChange={(e) => setDestinationAccount(e.target.value)}
                        placeholder="Account Number"
                        required
                        className="bg-secondary/30 border-border/50 rounded-xl h-11"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-muted-foreground uppercase">Bank Code</label>
                      <Input
                        type="text"
                        value={destinationBankCode}
                        onChange={(e) => setDestinationBankCode(e.target.value)}
                        placeholder="e.g. 002"
                        required
                        className="bg-secondary/30 border-border/50 rounded-xl h-11"
                      />
                    </div>
                  </>
                )}

                <div className="md:col-span-2 pt-2">
                  <Button type="submit" disabled={loading || !amount} className="w-full h-11 rounded-xl font-semibold">
                    {loading ? <RefreshCcw className="w-4 h-4 animate-spin mr-2" /> : <Zap className="w-4 h-4 mr-2" />}
                    {loading ? 'Processing Payment...' : 'Process Payment'}
                  </Button>
                </div>
              </form>
            </div>
          ) : (
            <div className="glass rounded-2xl p-12 border border-border/50 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 bg-muted/20 rounded-2xl flex items-center justify-center mb-4">
                <ArrowRightLeft className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">Ready to Start</h3>
              <p className="text-muted-foreground max-w-xs">
                Select a payment method above to begin processing your transaction.
              </p>
            </div>
          )}
        </div>

        {/* Right Column - Status & Info */}
        <div className="lg:col-span-4 space-y-6">
          {paymentResult && (
            <div className="glass rounded-2xl p-6 border-emerald-500/30 bg-emerald-500/5 transition-all duration-300">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                </div>
                <h2 className="font-semibold text-foreground text-emerald-400">Payment Success</h2>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center pb-3 border-b border-border/50">
                  <span className="text-xs text-muted-foreground uppercase tracking-wider">Payment ID</span>
                  <span className="text-sm font-mono text-foreground">{paymentResult.payment_id.slice(0, 12)}...</span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b border-border/50">
                  <span className="text-xs text-muted-foreground uppercase tracking-wider">Amount</span>
                  <span className="text-sm font-bold text-foreground">{formatCurrency(paymentResult.amount)}</span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b border-border/50">
                  <span className="text-xs text-muted-foreground uppercase tracking-wider">Gateway</span>
                  <Badge variant="outline" className="text-primary border-primary/30 uppercase">{paymentResult.gateway}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground uppercase tracking-wider">Time</span>
                  <span className="text-sm text-foreground">{new Date(paymentResult.timestamp).toLocaleTimeString()}</span>
                </div>

                <Button variant="outline" className="w-full h-10 rounded-xl mt-4" onClick={() => setPaymentResult(null)}>
                  Clear Result
                </Button>
              </div>
            </div>
          )}

          <div className="glass rounded-2xl p-6 border border-border/50">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Clock className="w-4 h-4 text-blue-400" />
              </div>
              <h2 className="font-semibold text-foreground">Service Information</h2>
            </div>

            <div className="space-y-4">
              <div className="p-3 rounded-xl bg-secondary/30 border border-border/50 space-y-1">
                <p className="text-sm font-bold text-foreground">InstaPay</p>
                <p className="text-xs text-muted-foreground">Real-time funds transfer up to ₱50,000.</p>
              </div>
              <div className="p-3 rounded-xl bg-secondary/30 border border-border/50 space-y-1">
                <p className="text-sm font-bold text-foreground">PESONet</p>
                <p className="text-xs text-muted-foreground">High-value batch transfers. Same-day settlement.</p>
              </div>
              <div className="p-3 rounded-xl bg-secondary/30 border border-border/50 space-y-1">
                <p className="text-sm font-bold text-foreground">E-Wallets</p>
                <p className="text-xs text-muted-foreground">Direct collection from mobile wallets with instant confirmation.</p>
              </div>
            </div>
          </div>

          {notification && !paymentResult && (
            <Alert
              variant={notification.type === 'success' ? 'default' : 'destructive'}
              className={cn(
                "border backdrop-blur-xl",
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
      </div>

      <div className="flex justify-end">
        <Button variant="ghost" onClick={() => navigate('/dashboard')} className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Cancel and Return
        </Button>
      </div>
    </div>
  );
}
import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { cn } from '@/lib/utils';
import {
  QrCode,
  Download,
  Printer,
  RefreshCw,
  LayoutDashboard,
  AlertCircle,
  Link2,
  Copy,
  CheckCircle2,
  Smartphone,
  CreditCard,
  Zap,
  Building2
} from 'lucide-react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function TellerQRCodePage() {
  const [amount, setAmount] = useState('');
  const [referenceId, setReferenceId] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('GCash');
  const [generatedQR, setGeneratedQR] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const navigate = useNavigate();
  const qrRef = useRef<HTMLDivElement>(null);

  const generateQRCode = async () => {
    if (!amount || !referenceId) {
      setNotification({ message: 'Amount and Reference ID are required', type: 'error' });
      return;
    }

    setLoading(true);

    try {
      const amountValue = parseFloat(amount);
      if (isNaN(amountValue) || amountValue <= 0) {
        setNotification({ message: 'Please enter a valid amount', type: 'error' });
        setLoading(false);
        return;
      }

      let paymentUrl = '';

      switch (paymentMethod) {
        case 'GCash':
          paymentUrl = `gcash://gocash/payment?amount=${amountValue}&reference_id=${referenceId}&merchant_name=${encodeURIComponent(customerName || 'Customer')}`;
          break;
        case 'Maya':
          paymentUrl = `maya://pay?amount=${amountValue}&reference_id=${referenceId}&merchant_name=${encodeURIComponent(customerName || 'Customer')}`;
          break;
        case 'InstaPay':
          paymentUrl = `https://instapay.ph/pay?amount=${amountValue}&reference_id=${referenceId}&customer_name=${encodeURIComponent(customerName || 'Customer')}`;
          break;
        case 'PESONet':
          paymentUrl = `https://pesonet.gov.ph/pay?amount=${amountValue}&reference_id=${referenceId}&customer_name=${encodeURIComponent(customerName || 'Customer')}`;
          break;
        default:
          paymentUrl = `payment://amount=${amountValue}&reference_id=${referenceId}&customer_name=${encodeURIComponent(customerName || 'Customer')}&method=${paymentMethod}`;
      }

      setGeneratedQR(paymentUrl);
      setNotification({ message: 'QR Code generated successfully!', type: 'success' });
    } catch (error) {
      setNotification({ message: 'Failed to generate QR code', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const downloadQRCode = () => {
    if (!generatedQR || !qrRef.current) return;

    const svg = qrRef.current.querySelector('svg');
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `QR_${referenceId || 'payment'}_${new Date().toISOString().split('T')[0]}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setNotification({ message: 'QR Code downloaded successfully!', type: 'success' });
  };

  const copyToClipboard = () => {
    if (!generatedQR) return;
    navigator.clipboard.writeText(generatedQR);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const paymentMethods = [
    { id: 'GCash', name: 'GCash', icon: Smartphone, color: 'text-blue-400' },
    { id: 'Maya', name: 'Maya', icon: CreditCard, color: 'text-emerald-400' },
    { id: 'InstaPay', name: 'InstaPay', icon: Zap, color: 'text-yellow-400' },
    { id: 'PESONet', name: 'PESONet', icon: Building2, color: 'text-purple-400' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Payment QR Generator</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Generate secure collection QR codes for various payment gateways
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
        {/* Form Column */}
        <div className="lg:col-span-1 border border-border/50 glass rounded-2xl p-6 h-fit lg:col-span-5">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <QrCode className="w-4 h-4 text-primary" />
            </div>
            <h2 className="font-semibold text-foreground">Payment Details</h2>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground uppercase">Payment Gateway</label>
              <div className="grid grid-cols-2 gap-2">
                {paymentMethods.map((method) => {
                  const Icon = method.icon;
                  const isActive = paymentMethod === method.id;
                  return (
                    <button
                      key={method.id}
                      onClick={() => setPaymentMethod(method.id)}
                      className={cn(
                        "flex items-center gap-2 p-3 rounded-xl border transition-all duration-200",
                        isActive
                          ? "bg-primary/15 border-primary shadow-lg shadow-primary/5"
                          : "bg-secondary/30 border-border/50 hover:border-primary/30"
                      )}
                    >
                      <Icon className={cn("w-4 h-4", method.color)} />
                      <span className={cn("text-xs font-bold", isActive ? "text-primary" : "text-foreground")}>
                        {method.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

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
                value={referenceId}
                onChange={(e) => setReferenceId(e.target.value)}
                placeholder="Enter reference"
                className="bg-secondary/30 border-border/50 rounded-xl h-11"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground uppercase">Customer Name (Optional)</label>
              <Input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Full Name"
                className="bg-secondary/30 border-border/50 rounded-xl h-11"
              />
            </div>

            <div className="pt-2">
              <Button
                onClick={generateQRCode}
                disabled={loading}
                className="w-full h-11 rounded-xl font-semibold shadow-lg shadow-primary/20"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <QrCode className="w-4 h-4 mr-2" />}
                {loading ? 'Generating...' : 'Generate New QR'}
              </Button>
            </div>
          </div>

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

        {/* Preview Column */}
        <div className="lg:col-span-7 space-y-6">
          <div className="glass rounded-2xl p-8 border border-border/50 flex flex-col items-center justify-center min-h-[450px]">
            {generatedQR ? (
              <div className="flex flex-col items-center animate-in zoom-in duration-300 w-full">
                <div className="p-6 bg-white rounded-3xl shadow-2xl mb-8 relative" ref={qrRef}>
                  <QRCodeSVG value={generatedQR} size={240} level="H" includeMargin={true} />
                  <div className="absolute inset-0 border-2 border-primary/10 rounded-3xl pointer-events-none" />
                </div>

                <h3 className="text-xl font-bold text-foreground mb-4">Collection QR Ready</h3>

                <div className="flex flex-wrap justify-center gap-3 mb-8">
                  <Button variant="outline" className="rounded-xl bg-secondary/30 border-border/50 h-11 px-6 transition-all hover:bg-secondary/50" onClick={copyToClipboard}>
                    {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-400 mr-2" /> : <Copy className="w-4 h-4 mr-2 text-primary" />}
                    {copied ? 'Copied Link' : 'Copy Pay Link'}
                  </Button>
                  <Button variant="outline" className="rounded-xl bg-secondary/30 border-border/50 h-11 px-6 transition-all hover:bg-secondary/50" onClick={downloadQRCode}>
                    <Download className="w-4 h-4 mr-2 text-emerald-400" />
                    Download SVG
                  </Button>
                  <Button variant="outline" className="rounded-xl bg-secondary/30 border-border/50 h-11 px-6 transition-all hover:bg-secondary/50">
                    <Printer className="w-4 h-4 mr-2 text-blue-400" />
                    Print Code
                  </Button>
                </div>

                <div className="w-full p-4 rounded-xl bg-secondary/20 border border-border/50">
                  <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-2">Encoded Data</p>
                  <p className="text-xs font-mono text-muted-foreground break-all line-clamp-2">{generatedQR}</p>
                </div>
              </div>
            ) : (
              <div className="text-center">
                <div className="w-24 h-24 bg-muted/20 rounded-3xl flex items-center justify-center mx-auto mb-6">
                  <QrCode className="w-12 h-12 text-muted-foreground opacity-30" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">QR Preview</h3>
                <p className="text-muted-foreground max-w-xs mx-auto text-sm">
                  The generated QR code will appear here. Fill in the transaction details and select a gateway to begin.
                </p>
              </div>
            )}
          </div>

          <div className="glass rounded-2xl p-6 border border-border/50">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Link2 className="w-4 h-4 text-blue-400" />
              </div>
              <h2 className="font-semibold text-foreground">Usage Guidelines</h2>
            </div>
            <ul className="space-y-3">
              {[
                { label: 'Security', val: 'QR codes are valid for single use and expire after settlement.' },
                { label: 'Compatibility', val: 'Supports GCash, Maya, and all InstaPay/PESONet compliant apps.' },
                { label: 'Tracking', val: 'Reference ID is automatically embedded for instant reconciliation.' }
              ].map((item, i) => (
                <li key={i} className="flex gap-3 text-sm">
                  <div className="mt-1.5 w-1 h-1 rounded-full bg-primary shrink-0" />
                  <p className="text-muted-foreground"><span className="text-foreground font-bold">{item.label}:</span> {item.val}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
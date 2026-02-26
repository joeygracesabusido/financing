import { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardBody, CardFooter, Button, Input, Typography, Alert } from '@material-tailwind/react';
import { QRCodeSVG } from 'qrcode.react';

export default function TellerQRCodePage() {
  const [amount, setAmount] = useState('');
  const [referenceId, setReferenceId] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('GCash');
  const [generatedQR, setGeneratedQR] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [loading, setLoading] = useState(false);
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

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="max-w-4xl mx-auto">
        <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-800">
          <div className="flex justify-between items-center">
            <div>
              <Typography variant="h4" className="text-white">
                Payment QR Code Generator
              </Typography>
              <Typography variant="h6" className="text-blue-100">
                Generate QR codes for payment collection
              </Typography>
            </div>
            <Button variant="text" onClick={() => navigate('/dashboard')} className="text-white hover:text-blue-100">
              Back to Dashboard
            </Button>
          </div>
        </CardHeader>

        <CardBody>
          {notification && (
            <Alert
              color={notification.type === 'success' ? 'green' : 'red'}
              className="mb-6"
            >
              {notification.message}
            </Alert>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <Typography variant="h5" className="text-gray-700 mb-4">
                Payment Details
              </Typography>

              <div className="space-y-4">
                <div>
                  <Typography variant="small" className="font-medium text-gray-600">
                    Payment Method
                  </Typography>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full mt-1 p-2 border rounded bg-white"
                  >
                    <option value="GCash">GCash</option>
                    <option value="Maya">Maya</option>
                    <option value="InstaPay">InstaPay</option>
                    <option value="PESONet">PESONet</option>
                  </select>
                </div>

                <div>
                  <Input
                    label="Amount (PHP)"
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    variant="outlined"
                    placeholder="Enter amount"
                  />
                </div>

                <div>
                  <Input
                    label="Reference ID"
                    type="text"
                    value={referenceId}
                    onChange={(e) => setReferenceId(e.target.value)}
                    variant="outlined"
                    placeholder="Enter reference ID"
                  />
                </div>

                <div>
                  <Input
                    label="Customer Name (Optional)"
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    variant="outlined"
                    placeholder="Enter customer name"
                  />
                </div>

                <Button
                  variant="filled"
                  color="blue"
                  onClick={generateQRCode}
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? 'Generating...' : 'Generate QR Code'}
                </Button>

                <Button
                  variant="outlined"
                  color="green"
                  onClick={downloadQRCode}
                  disabled={!generatedQR}
                  className="w-full"
                >
                  Download QR Code
                </Button>
              </div>
            </div>

            <div>
              <Typography variant="h5" className="text-gray-700 mb-4">
                QR Code Preview
              </Typography>

              {generatedQR ? (
                <div className="bg-white p-6 rounded-xl shadow-inner flex items-center justify-center" ref={qrRef}>
                  <QRCodeSVG
                    value={generatedQR}
                    size={256}
                    level="H"
                    includeMargin={true}
                  />
                </div>
              ) : (
                <div className="bg-gray-50 p-8 rounded-xl flex flex-col items-center justify-center min-h-[250px]">
                  <Typography variant="h6" className="text-gray-400">
                    QR Code will appear here
                  </Typography>
                  <Typography variant="small" className="text-gray-400 mt-2">
                    Fill in the payment details and click Generate
                  </Typography>
                </div>
              )}

              <div className="mt-4">
                <Typography variant="small" className="text-gray-600">
                  Payment URL:
                </Typography>
                <Typography variant="small" className="text-blue-600 break-all mt-1">
                  {generatedQR || '—'}
                </Typography>
              </div>
            </div>
          </div>
        </CardBody>

        <CardFooter className="mt-6">
          <div className="flex justify-between w-full">
            <Button variant="text" onClick={() => navigate('/dashboard')}>
              Cancel
            </Button>
            <div className="flex gap-2">
              <Button variant="text" onClick={() => { setAmount(''); setReferenceId(''); setCustomerName(''); setGeneratedQR(null); }}>
                Clear
              </Button>
            </div>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
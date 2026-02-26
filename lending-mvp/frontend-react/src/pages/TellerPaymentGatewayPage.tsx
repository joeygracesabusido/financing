import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardBody, CardFooter, Button, Input, Typography, Alert, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@material-tailwind/react';

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

  const handleGetMethods = async () => {
    try {
      const response = await fetch('/api/v1/payment-gateway/methods');
      if (response.ok) {
        const methods = await response.json();
        console.log('Available payment methods:', methods);
      }
    } catch (error) {
      console.error('Failed to fetch payment methods:', error);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="max-w-4xl mx-auto">
        <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-800">
          <Typography variant="h4" className="text-white">
            Payment Gateway
          </Typography>
          <Typography variant="h6" className="text-blue-100">
            Select payment method to process transactions
          </Typography>
        </CardHeader>

        <CardBody>
          {/* Payment Method Selection */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            {[
              { id: 'gcash', name: 'GCash', icon: '📱' },
              { id: 'maya', name: 'Maya', icon: '💳' },
              { id: 'instapay', name: 'InstaPay', icon: '🏦' },
              { id: 'pesonet', name: 'PESONet', icon: '🔄' },
            ].map((method) => (
              <Button
                key={method.id}
                variant={selectedGateway === method.id ? 'filled' : 'outlined'}
                color={selectedGateway === method.id ? 'blue' : 'gray'}
                onClick={() => setSelectedGateway(method.id)}
              >
                <span className="mr-2">{method.icon}</span>
                {method.name}
              </Button>
            ))}
          </div>

          {/* Payment Form */}
          {selectedGateway && (
            <Card className="mb-6">
              <CardHeader>
                <Typography variant="h5">Process {selectedGateway.toUpperCase()} Payment</Typography>
              </CardHeader>
              <CardBody>
                <form onSubmit={handleProcessPayment} className="space-y-4">
                  <div>
                    <Input
                      label="Amount (PHP)"
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      required
                      variant="outlined"
                    />
                  </div>
                  <div>
                    <Input
                      label="Reference ID"
                      type="text"
                      value={reference}
                      onChange={(e) => setReference(e.target.value)}
                      required
                      variant="outlined"
                    />
                  </div>

                  {selectedGateway === 'gcash' && (
                    <div>
                      <Input
                        label="Mobile Number (09XX-XXX-XXXX)"
                        type="text"
                        value={mobileNumber}
                        onChange={(e) => setMobileNumber(e.target.value)}
                        placeholder="09171234567"
                        required
                        variant="outlined"
                      />
                      <Typography variant="body2" className="text-gray-600">
                        Example: 09171234567
                      </Typography>
                    </div>
                  )}

                  {selectedGateway === 'maya' && (
                    <div>
                      <Input
                        label="Email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        variant="outlined"
                      />
                    </div>
                  )}

                  {(selectedGateway === 'instapay' || selectedGateway === 'pesonet') && (
                    <>
                      <div>
                        <Input
                          label="Destination Account Number"
                          type="text"
                          value={destinationAccount}
                          onChange={(e) => setDestinationAccount(e.target.value)}
                          required
                          variant="outlined"
                        />
                      </div>
                      <div>
                        <Input
                          label="Destination Bank Code"
                          type="text"
                          value={destinationBankCode}
                          onChange={(e) => setDestinationBankCode(e.target.value)}
                          required
                          variant="outlined"
                        />
                      </div>
                      <Typography variant="body2" className="text-gray-600 mt-2">
                        Philippine Bank Codes: 002 (BDO), 003 (BPI), 001 (PNB), etc.
                      </Typography>
                    </>
                  )}

                  <Button type="submit" variant="filled" disabled={loading || !amount} className="w-full">
                    {loading ? 'Processing Payment...' : 'Process Payment'}
                  </Button>
                </form>
              </CardBody>
            </Card>
          )}

          {/* Payment Result */}
          {paymentResult && (
            <Card className="mb-6">
              <CardHeader>
                <Typography variant="h5">Payment Result</Typography>
              </CardHeader>
              <CardBody>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Typography variant="body2" className="font-medium">Payment ID:</Typography>
                    <Typography variant="body2">{paymentResult.payment_id}</Typography>
                  </div>
                  <div className="flex justify-between">
                    <Typography variant="body2" className="font-medium">Gateway:</Typography>
                    <Typography variant="body2">{paymentResult.gateway}</Typography>
                  </div>
                  <div className="flex justify-between">
                    <Typography variant="body2" className="font-medium">Amount:</Typography>
                    <Typography variant="body2">₱{paymentResult.amount.toLocaleString()}</Typography>
                  </div>
                  <div className="flex justify-between">
                    <Typography variant="body2" className="font-medium">Status:</Typography>
                    <Typography variant="body2" className="text-green-600 font-bold">
                      {paymentResult.status}
                    </Typography>
                  </div>
                  <div className="flex justify-between">
                    <Typography variant="body2" className="font-medium">Reference ID:</Typography>
                    <Typography variant="body2">{paymentResult.reference_id}</Typography>
                  </div>
                  <div className="flex justify-between">
                    <Typography variant="body2" className="font-medium">Timestamp:</Typography>
                    <Typography variant="body2">
                      {new Date(paymentResult.timestamp).toLocaleString()}
                    </Typography>
                  </div>
                </div>
              </CardBody>
              <CardFooter>
                <Button variant="text" onClick={() => setPaymentResult(null)}>
                  Clear Result
                </Button>
              </CardFooter>
            </Card>
          )}

          {/* Available Methods Info */}
          <Card>
            <CardHeader>
              <Typography variant="h5">Available Payment Methods</Typography>
            </CardHeader>
            <CardBody className="space-y-4">
              {[
                {
                  gateway: 'GCash',
                  type: 'E-Wallet',
                  operations: ['Loan Repayment', 'Savings Deposit', 'Transfer'],
                  features: ['Mobile Number Required'],
                },
                {
                  gateway: 'Maya',
                  type: 'E-Wallet',
                  operations: ['Loan Repayment', 'Savings Deposit', 'Transfer'],
                  features: ['Email Required'],
                },
                {
                  gateway: 'InstaPay',
                  type: 'Real-Time Bank Transfer',
                  operations: ['All', 'Instant Settlement'],
                  features: ['BSP-Regulated', '11-Digit Account Number'],
                },
                {
                  gateway: 'PESONet',
                  type: 'Batch & Single Transfer',
                  operations: ['Batch', 'Single', 'Same-Day Settlement'],
                  features: ['Supports Batch Payments'],
                },
              ].map((method) => (
                <div key={method.gateway} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <Typography variant="h6" className="font-bold">{method.gateway}</Typography>
                    <Badge color="blue" variant="filled">{method.type}</Badge>
                  </div>
                  <Typography variant="body2" className="text-gray-600">
                    Operations: {method.operations.join(', ')}
                  </Typography>
                  <div className="mt-2">
                    {method.features.map((feature) => (
                      <Badge key={feature} color="gray" variant="outlined">{feature}</Badge>
                    ))}
                  </div>
                </div>
              ))}
            </CardBody>
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
          <Button variant="text" onClick={() => navigate('/dashboard')}>
            Back to Dashboard
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
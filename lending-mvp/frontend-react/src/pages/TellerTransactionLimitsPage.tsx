import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardBody, CardFooter, Button, Input, Typography, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Badge, Alert } from '@material-tailwind/react';

interface TransactionLimits {
  dailyLimit: number;
  weeklyLimit: number;
  monthlyLimit: number;
  singleTransactionLimit: number;
}

interface RoleLimit {
  role: string;
  limits: TransactionLimits;
}

export default function TellerTransactionLimitsPage() {
  const [limits, setLimits] = useState<RoleLimit[]>([
    { role: 'Teller', limits: { dailyLimit: 100000, weeklyLimit: 500000, monthlyLimit: 2000000, singleTransactionLimit: 50000 } },
    { role: 'Senior Teller', limits: { dailyLimit: 250000, weeklyLimit: 1000000, monthlyLimit: 5000000, singleTransactionLimit: 100000 } },
    { role: 'Teller Supervisor', limits: { dailyLimit: 500000, weeklyLimit: 2500000, monthlyLimit: 10000000, singleTransactionLimit: 250000 } },
  ]);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLimitChange = (role: string, field: keyof TransactionLimits, value: string) => {
    setLimits((prev) =>
      prev.map((item) => {
        if (item.role === role) {
          return {
            ...item,
            limits: {
              ...item.limits,
              [field]: parseFloat(value) || 0,
            },
          };
        }
        return item;
      })
    );
  };

  const handleSaveLimits = async () => {
    setLoading(true);

    try {
      const response = await fetch('/api/v1/teller/transaction-limits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ limits }),
      });

      if (response.ok) {
        setNotification({ message: 'Transaction limits updated successfully!', type: 'success' });
      } else {
        const errorData = await response.json();
        setNotification({ message: errorData.detail || 'Failed to update limits', type: 'error' });
      }
    } catch (error) {
      setNotification({ message: 'An error occurred', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="max-w-6xl mx-auto">
        <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-800">
          <div className="flex justify-between items-center">
            <div>
              <Typography variant="h4" className="text-white">
                Transaction Limits Management
              </Typography>
              <Typography variant="h6" className="text-blue-100">
                Configure transaction limits per role
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

          <div className="mb-8">
            <Typography variant="h5" className="text-gray-700 mb-4">
              Current Transaction Limits
            </Typography>

            <div className="overflow-x-auto">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableHead>Role</TableHead>
                    <TableHead>Daily Limit</TableHead>
                    <TableHead>Weekly Limit</TableHead>
                    <TableHead>Monthly Limit</TableHead>
                    <TableHead>Single Transaction Limit</TableHead>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {limits.map((roleLimit) => (
                    <TableRow key={roleLimit.role}>
                      <TableCell>
                        <Badge color="blue" variant="filled">
                          {roleLimit.role}
                        </Badge>
                      </TableCell>
                      <TableCell>₱{roleLimit.limits.dailyLimit.toLocaleString()}</TableCell>
                      <TableCell>₱{roleLimit.limits.weeklyLimit.toLocaleString()}</TableCell>
                      <TableCell>₱{roleLimit.limits.monthlyLimit.toLocaleString()}</TableCell>
                      <TableCell>₱{roleLimit.limits.singleTransactionLimit.toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          <div className="border-t pt-6">
            <Typography variant="h5" className="text-gray-700 mb-4">
              Modify Limits
            </Typography>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {limits.map((roleLimit) => (
                <Card key={roleLimit.role} className="border-blue-200">
                  <CardHeader>
                    <Typography variant="h6" className="text-blue-600">
                      {roleLimit.role} Limits
                    </Typography>
                  </CardHeader>
                  <CardBody>
                    <div className="space-y-4">
                      <div>
                        <Typography variant="small" className="font-medium text-gray-600">
                          Daily Limit
                        </Typography>
                        <Input
                          type="number"
                          value={roleLimit.limits.dailyLimit}
                          onChange={(e) =>
                            handleLimitChange(roleLimit.role, 'dailyLimit', e.target.value)
                          }
                          variant="outlined"
                          className="mt-1"
                          placeholder="Enter daily limit"
                        />
                      </div>
                      <div>
                        <Typography variant="small" className="font-medium text-gray-600">
                          Weekly Limit
                        </Typography>
                        <Input
                          type="number"
                          value={roleLimit.limits.weeklyLimit}
                          onChange={(e) =>
                            handleLimitChange(roleLimit.role, 'weeklyLimit', e.target.value)
                          }
                          variant="outlined"
                          className="mt-1"
                          placeholder="Enter weekly limit"
                        />
                      </div>
                      <div>
                        <Typography variant="small" className="font-medium text-gray-600">
                          Monthly Limit
                        </Typography>
                        <Input
                          type="number"
                          value={roleLimit.limits.monthlyLimit}
                          onChange={(e) =>
                            handleLimitChange(roleLimit.role, 'monthlyLimit', e.target.value)
                          }
                          variant="outlined"
                          className="mt-1"
                          placeholder="Enter monthly limit"
                        />
                      </div>
                      <div>
                        <Typography variant="small" className="font-medium text-gray-600">
                          Single Transaction Limit
                        </Typography>
                        <Input
                          type="number"
                          value={roleLimit.limits.singleTransactionLimit}
                          onChange={(e) =>
                            handleLimitChange(roleLimit.role, 'singleTransactionLimit', e.target.value)
                          }
                          variant="outlined"
                          className="mt-1"
                          placeholder="Enter single transaction limit"
                        />
                      </div>
                    </div>
                  </CardBody>
                </Card>
              ))}
            </div>
          </div>
        </CardBody>

        <CardFooter className="flex justify-between items-center mt-6">
          <Button variant="text" onClick={() => navigate('/dashboard')}>
            Cancel
          </Button>
          <Button variant="filled" color="green" onClick={handleSaveLimits} disabled={loading}>
            {loading ? 'Saving...' : 'Save Limits'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn, formatCurrency } from '@/lib/utils';
import {
  ShieldCheck,
  Settings2,
  Scale,
  Save,
  LayoutDashboard,
  AlertCircle,
  RefreshCcw,
  Plus
} from 'lucide-react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

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
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Transaction Limits</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Configure risk management parameters per teller role
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/dashboard')}
            className="rounded-lg bg-secondary/50"
          >
            <LayoutDashboard className="w-4 h-4 mr-2" />
            Dashboard
          </Button>
          <Button
            size="sm"
            onClick={handleSaveLimits}
            disabled={loading}
            className="rounded-lg shadow-lg shadow-primary/20"
          >
            {loading ? <RefreshCcw className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
            Save Changes
          </Button>
        </div>
      </div>

      {notification && (
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

      {/* Summary Table */}
      <div className="glass rounded-2xl border border-border/50 overflow-hidden">
        <div className="p-6 border-b border-border/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 text-primary" />
            </div>
            <h2 className="font-semibold text-foreground">Current Limits Matrix</h2>
          </div>
          <Badge variant="secondary" className="bg-secondary/50">Active Policy</Badge>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-border/50 hover:bg-transparent">
                <TableHead className="text-muted-foreground text-[11px] uppercase tracking-wider h-11">Role</TableHead>
                <TableHead className="text-muted-foreground text-[11px] uppercase tracking-wider h-11 text-right">Single Tx</TableHead>
                <TableHead className="text-muted-foreground text-[11px] uppercase tracking-wider h-11 text-right">Daily</TableHead>
                <TableHead className="text-muted-foreground text-[11px] uppercase tracking-wider h-11 text-right">Weekly</TableHead>
                <TableHead className="text-muted-foreground text-[11px] uppercase tracking-wider h-11 text-right">Monthly</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {limits.map((roleLimit) => (
                <TableRow key={roleLimit.role} className="data-table-row">
                  <TableCell className="py-4">
                    <span className="font-bold text-foreground">{roleLimit.role}</span>
                  </TableCell>
                  <TableCell className="text-right py-4 font-medium text-primary">
                    {formatCurrency(roleLimit.limits.singleTransactionLimit)}
                  </TableCell>
                  <TableCell className="text-right py-4 font-medium text-foreground">
                    {formatCurrency(roleLimit.limits.dailyLimit)}
                  </TableCell>
                  <TableCell className="text-right py-4 font-medium text-muted-foreground">
                    {formatCurrency(roleLimit.limits.weeklyLimit)}
                  </TableCell>
                  <TableCell className="text-right py-4 font-medium text-muted-foreground">
                    {formatCurrency(roleLimit.limits.monthlyLimit)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Edit Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {limits.map((roleLimit) => (
          <div key={roleLimit.role} className="lg:col-span-1 border border-border/50 glass rounded-2xl p-6 h-fit">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center">
                  <Settings2 className="w-4 h-4 text-orange-400" />
                </div>
                <h2 className="font-semibold text-foreground">{roleLimit.role}</h2>
              </div>
              <Plus className="w-4 h-4 text-muted-foreground cursor-pointer hover:text-foreground transition-colors" />
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground uppercase">Single Transaction Limit</label>
                <div className="relative">
                  <Input
                    type="number"
                    value={roleLimit.limits.singleTransactionLimit}
                    onChange={(e) => handleLimitChange(roleLimit.role, 'singleTransactionLimit', e.target.value)}
                    className="pl-9 bg-secondary/30 border-border/50 rounded-xl h-11"
                  />
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-medium">₱</span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground uppercase">Daily Limit</label>
                <div className="relative">
                  <Input
                    type="number"
                    value={roleLimit.limits.dailyLimit}
                    onChange={(e) => handleLimitChange(roleLimit.role, 'dailyLimit', e.target.value)}
                    className="pl-9 bg-secondary/30 border-border/50 rounded-xl h-11"
                  />
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-medium">₱</span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground uppercase">Weekly Limit</label>
                <div className="relative">
                  <Input
                    type="number"
                    value={roleLimit.limits.weeklyLimit}
                    onChange={(e) => handleLimitChange(roleLimit.role, 'weeklyLimit', e.target.value)}
                    className="pl-9 bg-secondary/30 border-border/50 rounded-xl h-11"
                  />
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-medium">₱</span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground uppercase">Monthly Limit</label>
                <div className="relative">
                  <Input
                    type="number"
                    value={roleLimit.limits.monthlyLimit}
                    onChange={(e) => handleLimitChange(roleLimit.role, 'monthlyLimit', e.target.value)}
                    className="pl-9 bg-secondary/30 border-border/50 rounded-xl h-11"
                  />
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-medium">₱</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="glass rounded-2xl p-6 border border-border/50 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
            <Scale className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground">Compliance Guard</h3>
            <p className="text-xs text-muted-foreground">Changes are audited and logged for regulatory compliance.</p>
          </div>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <Button variant="ghost" onClick={() => navigate('/dashboard')} className="flex-1 md:flex-none h-11 rounded-xl">
            Discard
          </Button>
          <Button onClick={handleSaveLimits} disabled={loading} className="flex-1 md:flex-none h-11 px-8 rounded-xl font-semibold shadow-lg shadow-primary/20">
            {loading ? <RefreshCcw className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
            {loading ? 'Saving...' : 'Save Limits'}
          </Button>
        </div>
      </div>
    </div>
  );
}
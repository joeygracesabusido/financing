import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useMutation } from '@apollo/client'
import { formatCurrency, formatDate } from '@/lib/utils'
import {
    PiggyBank, ArrowLeft, Printer, Download, History,
    Calculator, Lock, AlertCircle, CheckCircle
} from 'lucide-react'
import { useState } from 'react'

interface SavingsTransaction {
    id: string
    accountId: string
    transactionType: string
    amount: number
    timestamp: string
    notes?: string
}

interface SavingsAccount {
    id: string
    accountNumber: string
    userId: string
    type: string
    balance: number
    currency: string
    openedAt: string
    status: string
    createdAt: string
    updatedAt: string
    interestRate?: number
    maturityDate?: string
    targetAmount?: number
    targetDate?: string
}

export default function SavingsDetailPage() {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const [activeTab, setActiveTab] = useState<'overview' | 'transactions' | 'passbook'>('overview')

    const { data, loading, error, refetch } = useQuery(GET_SAVINGS_ACCOUNT, {
        variables: { id }
    })

    const account = data?.savingsAccount?.account as SavingsAccount | undefined

    const handlePrintPassbook = () => {
        const printContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; padding: 20px; }
                    .header { text-align: center; margin-bottom: 20px; }
                    .header h1 { margin: 0; font-size: 24px; }
                    .header p { color: #666; margin: 5px 0; }
                    .account-info { margin-bottom: 20px; padding: 15px; background: #f5f5f5; border-radius: 8px; }
                    .account-info div { margin: 8px 0; }
                    .account-info strong { color: #333; }
                    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                    th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
                    th { background: #f5f5f5; font-weight: bold; }
                    .balance { font-size: 18px; font-weight: bold; color: #275e35; margin-top: 20px; }
                    .footer { margin-top: 30px; text-align: center; color: #666; font-size: 12px; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>SAVINGS PASSBOOK</h1>
                    <p>Cooperative Credit Union</p>
                    <p>Official Passbook Record</p>
                </div>
                
                <div class="account-info">
                    <div><strong>Account Number:</strong> ${account?.accountNumber}</div>
                    <div><strong>Account Type:</strong> ${account?.type?.replace('_', ' ')}</div>
                    <div><strong>Current Balance:</strong> ${formatCurrency(account?.balance || 0)}</div>
                    <div><strong>Currency:</strong> ${account?.currency}</div>
                    <div><strong>Opening Date:</strong> ${formatDate(account?.openedAt)}</div>
                    ${account?.interestRate ? `<div><strong>Interest Rate:</strong> ${account.interestRate}%</div>` : ''}
                    ${account?.status === 'active' ? '<div><strong>Status:</strong> <span style="color: green;">Active</span></div>' : ''}
                </div>
                
                <h3>Transaction History</h3>
                <table>
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Type</th>
                            <th>Notes</th>
                            <th>Amount</th>
                            <th>Balance</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${account?.balance ? `
                        <tr>
                            <td>${new Date().toLocaleDateString('en-PH')}</td>
                            <td>Current</td>
                            <td>Passbook printout</td>
                            <td>-</td>
                            <td>${formatCurrency(account.balance)}</td>
                        </tr>` : ''}
                    </tbody>
                </table>
                
                <div class="balance">TOTAL BALANCE: ${formatCurrency(account?.balance || 0)}</div>
                
                <div class="footer">
                    <p>This passbook is valid for transaction records.</p>
                    <p>Printed on ${new Date().toLocaleDateString('en-PH')}</p>
                </div>
            </body>
            </html>
        `
        
        const printWindow = window.open('', '_blank')
        if (printWindow) {
            printWindow.document.write(printContent)
            printWindow.document.close()
            printWindow.focus()
            setTimeout(() => {
                printWindow.print()
                printWindow.close()
            }, 250)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <PiggyBank className="w-8 h-8 animate-spin text-emerald-400" />
            </div>
        )
    }

    if (error) {
        return (
            <div className="py-20 text-center">
                <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Error loading account</h3>
                <p className="text-muted-foreground">{error.message}</p>
            </div>
        )
    }

    if (!account) {
        return (
            <div className="py-20 text-center">
                <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
                <h3 className="text-xl font-semibold">Account not found</h3>
            </div>
        )
    }

    const accountTypeBadge = {
        regular: 'bg-blue-400/10 text-blue-400 border-blue-400/20',
        high_yield: 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20',
        time_deposit: 'bg-purple-400/10 text-purple-400 border-purple-400/20',
        share_capital: 'bg-orange-400/10 text-orange-400 border-orange-400/20',
        goal_savings: 'bg-pink-400/10 text-pink-400 border-pink-400/20',
        minor_savings: 'bg-indigo-400/10 text-indigo-400 border-indigo-400/20',
        joint_account: 'bg-cyan-400/10 text-cyan-400 border-cyan-400/20',
    }

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate('/savings')}
                        className="p-2 hover:bg-secondary rounded-lg transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                            <PiggyBank className="w-6 h-6 text-emerald-400" />
                            Savings Account Details
                        </h1>
                        <p className="text-muted-foreground text-sm mt-1">
                            {account.accountNumber}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={handlePrintPassbook}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-500/10 text-blue-500 border border-blue-500/20 rounded-lg hover:bg-blue-500/20 transition-all"
                    >
                        <Printer className="w-4 h-4" />
                        <span className="text-sm font-medium">Print Passbook</span>
                    </button>
                </div>
            </div>

            {/* Account Overview Card */}
            <div className="glass rounded-xl p-6">
                <div className="flex flex-col md:flex-row gap-8">
                    <div className="flex-1">
                        <h2 className="text-lg font-semibold mb-4">Account Information</h2>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <p className="text-sm text-muted-foreground">Account Number</p>
                                <p className="font-mono text-sm text-foreground">{account.accountNumber}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-sm text-muted-foreground">Account Type</p>
                                <div className="flex items-center gap-2">
                                    <span className={`px-2 py-1 rounded-md border text-xs font-medium ${accountTypeBadge[account.type] ?? ''}`}>
                                        {account.type.replace('_', ' ')}
                                    </span>
                                </div>
                            </div>
                            <div className="space-y-1">
                                <p className="text-sm text-muted-foreground">Current Balance</p>
                                <p className="text-2xl font-bold text-emerald-500">{formatCurrency(account.balance)}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-sm text-muted-foreground">Currency</p>
                                <p className="text-sm text-foreground">{account.currency}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-sm text-muted-foreground">Opening Date</p>
                                <p className="text-sm text-foreground">{formatDate(account.openedAt)}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-sm text-muted-foreground">Status</p>
                                <div className="flex items-center gap-2">
                                    {account.status === 'active' ? (
                                        <CheckCircle className="w-4 h-4 text-green-500" />
                                    ) : (
                                        <AlertCircle className="w-4 h-4 text-red-500" />
                                    )}
                                    <span className="text-sm text-foreground capitalize">{account.status}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div className="w-px bg-border md:w-px md:h-auto" />
                    
                    <div className="flex-1">
                        <h2 className="text-lg font-semibold mb-4">Account Details</h2>
                        <div className="space-y-4">
                            {account.interestRate && (
                                <div className="space-y-1">
                                    <p className="text-sm text-muted-foreground">Interest Rate</p>
                                    <p className="text-sm text-foreground">{account.interestRate}% per annum</p>
                                </div>
                            )}
                            {account.type === 'time_deposit' && account.maturityDate && (
                                <div className="space-y-1">
                                    <p className="text-sm text-muted-foreground">Maturity Date</p>
                                    <p className="text-sm text-foreground">{formatDate(account.maturityDate)}</p>
                                </div>
                            )}
                            {account.type === 'goal_savings' && (
                                <div className="space-y-1">
                                    <p className="text-sm text-muted-foreground">Target Amount</p>
                                    <p className="text-sm text-foreground">{formatCurrency(account.targetAmount || 0)}</p>
                                </div>
                            )}
                            {account.type === 'share_capital' && (
                                <div className="space-y-1">
                                    <p className="text-sm text-muted-foreground">Share Value</p>
                                    <p className="text-sm text-foreground">₱100.00 per share</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 border-b border-border">
                <button
                    onClick={() => setActiveTab('overview')}
                    className={`px-4 py-2.5 text-sm font-medium transition-colors ${
                        activeTab === 'overview'
                            ? 'text-primary border-b-2 border-primary'
                            : 'text-muted-foreground hover:text-foreground'
                    }`}
                >
                    Overview
                </button>
                <button
                    onClick={() => setActiveTab('transactions')}
                    className={`px-4 py-2.5 text-sm font-medium transition-colors ${
                        activeTab === 'transactions'
                            ? 'text-primary border-b-2 border-primary'
                            : 'text-muted-foreground hover:text-foreground'
                    }`}
                >
                    Transactions
                </button>
                <button
                    onClick={() => setActiveTab('passbook')}
                    className={`px-4 py-2.5 text-sm font-medium transition-colors ${
                        activeTab === 'passbook'
                            ? 'text-primary border-b-2 border-primary'
                            : 'text-muted-foreground hover:text-foreground'
                    }`}
                >
                    Passbook
                </button>
            </div>

            {/* Tab Content */}
            <div className="glass rounded-xl p-6">
                {activeTab === 'overview' && (
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold">Quick Actions</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <button className="flex items-center gap-3 p-4 border border-border rounded-lg hover:bg-secondary transition-colors text-left">
                                <Download className="w-5 h-5 text-blue-500" />
                                <div>
                                    <h4 className="font-medium">Download Statement</h4>
                                    <p className="text-xs text-muted-foreground">PDF format</p>
                                </div>
                            </button>
                            <button
                                onClick={handlePrintPassbook}
                                className="flex items-center gap-3 p-4 border border-border rounded-lg hover:bg-secondary transition-colors text-left"
                            >
                                <Printer className="w-5 h-5 text-emerald-500" />
                                <div>
                                    <h4 className="font-medium">Print Passbook</h4>
                                    <p className="text-xs text-muted-foreground">Dot-matrix format</p>
                                </div>
                            </button>
                        </div>
                        
                        <h3 className="text-lg font-semibold mt-6">Account Timeline</h3>
                        <div className="space-y-3">
                            <div className="flex items-start gap-4">
                                <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                                </div>
                                <div>
                                    <h4 className="font-medium text-sm">Account Opened</h4>
                                    <p className="text-xs text-muted-foreground">{formatDate(account.openedAt)}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'transactions' && (
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold">Recent Transactions</h3>
                        <div className="border border-border rounded-lg overflow-hidden">
                            <table className="w-full">
                                <thead className="bg-secondary/30">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Date</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Type</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Notes</th>
                                        <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase">Amount</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    <tr>
                                        <td className="px-4 py-3 text-sm">{new Date().toLocaleDateString('en-PH')}</td>
                                        <td className="px-4 py-3 text-sm text-emerald-500">Balance Update</td>
                                        <td className="px-4 py-3 text-sm text-muted-foreground">Daily interest posting</td>
                                        <td className="px-4 py-3 text-sm text-right font-medium">+{formatCurrency((account.balance * (account.interestRate || 0) / 365) / 100)}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'passbook' && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold">Passbook View</h3>
                            <button
                                onClick={handlePrintPassbook}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-500/10 text-blue-500 border border-blue-500/20 rounded-lg hover:bg-blue-500/20 transition-all text-sm"
                            >
                                <Printer className="w-4 h-4" />
                                Print Passbook
                            </button>
                        </div>
                        
                        <div className="border-2 border-emerald-500/20 rounded-xl p-6 bg-emerald-500/5">
                            <div className="text-center mb-6">
                                <h3 className="text-2xl font-bold text-emerald-600">SAVINGS PASSBOOK</h3>
                                <p className="text-sm text-muted-foreground mt-1">Official Transaction Record</p>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4 mb-6 p-4 bg-white rounded-lg shadow-sm">
                                <div>
                                    <p className="text-xs text-muted-foreground">Account Number</p>
                                    <p className="font-mono text-sm font-medium">{account.accountNumber}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground">Account Type</p>
                                    <p className="text-sm font-medium capitalize">{account.type.replace('_', ' ')}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground">Current Balance</p>
                                    <p className="text-lg font-bold text-emerald-600">{formatCurrency(account.balance)}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground">Opening Date</p>
                                    <p className="text-sm">{formatDate(account.openedAt)}</p>
                                </div>
                            </div>
                            
                            <div className="space-y-2">
                                <h4 className="text-sm font-semibold text-muted-foreground uppercase">Transaction History</h4>
                                <div className="border border-border rounded-lg overflow-hidden">
                                    <table className="w-full">
                                        <thead className="bg-secondary/30">
                                            <tr>
                                                <th className="px-4 py-2 text-left text-xs">Date</th>
                                                <th className="px-4 py-2 text-left text-xs">Description</th>
                                                <th className="px-4 py-2 text-right text-xs">Debit</th>
                                                <th className="px-4 py-2 text-right text-xs">Credit</th>
                                                <th className="px-4 py-2 text-right text-xs">Balance</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border">
                                            <tr>
                                                <td className="px-4 py-2 text-sm">{new Date().toLocaleDateString('en-PH')}</td>
                                                <td className="px-4 py-2 text-sm text-muted-foreground">Opening Balance</td>
                                                <td className="px-4 py-2 text-sm text-right">-</td>
                                                <td className="px-4 py-2 text-sm text-right">-</td>
                                                <td className="px-4 py-2 text-sm text-right font-mono">{formatCurrency(account.balance)}</td>
                                            </tr>
                                            <tr>
                                                <td className="px-4 py-2 text-sm">{new Date().toLocaleDateString('en-PH')}</td>
                                                <td className="px-4 py-2 text-sm text-muted-foreground">Daily Interest</td>
                                                <td className="px-4 py-2 text-sm text-right">{account.interestRate ? formatCurrency((account.balance * account.interestRate / 365) / 100) : '-'}</td>
                                                <td className="px-4 py-2 text-sm text-right">-</td>
                                                <td className="px-4 py-2 text-sm text-right font-mono">{formatCurrency(account.balance)}</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                            
                            <div className="mt-6 pt-6 border-t border-emerald-500/20 text-center text-sm text-muted-foreground">
                                <p>For official transactions only</p>
                                <p className="mt-2 text-xs">Printed on {new Date().toLocaleDateString('en-PH')}</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}